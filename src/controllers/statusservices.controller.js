import { getBoards, getBoardMonitors, getMonitorHistory, getMonitorComponents } from "../services/statusgator.service.js";


// Estandarizar el status de los servicios
const definirStatus = (status) => {
    if (!status) return [1, "operativo"];
    const s = String(status).toLowerCase();
    if (s === "up" || s === "operational" || s === "operativo" || s === "ok" || s === "resolved") {
        return [1, "operativo"];
    }
    if (s === "warn" || s === "degraded" || s === "warning" || s === "advertencia" || s === "minor" || s === "maintenance") {
        return [2, "advertencia"];
    }
    if (s === "down" || s === "danger" || s === "critico" || s === "critical" || s === "major") {
        return [3, "critico"];
    }
    return [1, "operativo"];
};

// Organizar los reportes de los servicios
const organizarReportes = (historyReportes, inicio24h, horaActual) => {
    const reportes = [];

    if (!historyReportes || historyReportes.length === 0) {
        return reportes;
    }

    historyReportes.forEach(item => {
        const startedAt = new Date(item.started_at);
        const endedAt = item.ended_at ? new Date(item.ended_at) : horaActual;

        // Verificar si el incidente intersecta con la ventana de las últimas 24 horas
        if (startedAt < horaActual && endedAt > inicio24h) {
            const [, statusText] = definirStatus(item.status);

            reportes.push({
                status_text: statusText,
                hora_inicio: item.started_at,
                hora_fin: item.ended_at || horaActual.toISOString(),
                motivo: item.message || "Sin mensaje",
                servicio_afectado: item.name || "Desconocido"
            });
        }
    });

    return reportes;
};

// Calcular el historial de status (linea de tiempo)
const historialStatus = (reportesOrganizados, inicio24h, horaActual) => {
    if (!inicio24h || !horaActual) {
        throw new Error('historialStatus requiere inicio24h y horaActual');
    }

    if (!reportesOrganizados || reportesOrganizados.length === 0) {
        return [{ inicio: inicio24h.toISOString(), status_num: 1 }];
    }

    const sortedReportes = [...reportesOrganizados].sort((a, b) => new Date(a.hora_inicio) - new Date(b.hora_inicio));
    const timeline = [];
    let cursor = new Date(inicio24h);

    const addEstadoOperativo = (from, to) => {
        if (to.getTime() > from.getTime()) {
            const last = timeline[timeline.length - 1];
            if (!last || last.status_num !== 1 || last.inicio !== from.toISOString()) {
                timeline.push({ inicio: from.toISOString(), status_num: 1 });
            }
        }
    };

    sortedReportes.forEach(reporte => {
        const inicioReporte = new Date(reporte.hora_inicio);
        const finReporte = new Date(reporte.hora_fin || horaActual.toISOString());
        const inicioClipped = new Date(Math.max(inicioReporte.getTime(), inicio24h.getTime()));
        const finClipped = new Date(Math.min(finReporte.getTime(), horaActual.getTime()));

        if (finClipped.getTime() <= inicioClipped.getTime()) {
            return;
        }

        if (inicioClipped.getTime() > cursor.getTime()) {
            addEstadoOperativo(cursor, inicioClipped);
            cursor = inicioClipped;
        }

        const [statusNum] = definirStatus(reporte.status_text);
        const last = timeline[timeline.length - 1];
        if (!last || last.status_num !== statusNum || last.inicio !== inicioClipped.toISOString()) {
            timeline.push({ inicio: inicioClipped.toISOString(), status_num: statusNum });
        }

        cursor = new Date(Math.max(cursor.getTime(), finClipped.getTime()));
    });

    if (cursor.getTime() < horaActual.getTime()) {
        timeline.push({ inicio: cursor.toISOString(), status_num: 1 });
    }

    return timeline.length ? timeline : [{ inicio: inicio24h.toISOString(), status_num: 1 }];
};


//Calcular porcentages de los estados
const hallarMetricas = (historyReportes, inicio24h, horaActual) => {
    let criticosMS = 0;
    let advertenciaMS = 0;
    const horaActualMS = 24 * 60 * 60 * 1000; // 86,400,000 ms

    if (!historyReportes || historyReportes.length === 0) {
        return {
            porcentajeOperativo: 100,
            porcentajeAdvertencia: 0,
            porcentajeCritico: 0
        };
    }

    historyReportes.forEach(item => {
        const startedAt = new Date(item.hora_inicio || item.started_at);
        const endedAt = item.hora_fin ? new Date(item.hora_fin) : horaActual;

        const clipStart = Math.max(startedAt.getTime(), inicio24h.getTime());
        const clipEnd = Math.min(endedAt.getTime(), horaActual.getTime());
        const durationMs = clipEnd - clipStart;

        if (item.status_text === "critico") {
            criticosMS += durationMs;
        } else if (item.status_text === "advertencia") {
            advertenciaMS += durationMs;
        }
    });

    const porcentageCritico = (criticosMS / horaActualMS) * 100;
    const porcentageAdvertencia = (advertenciaMS / horaActualMS) * 100;
    const porcentageOperativo = 100 - (porcentageCritico + porcentageAdvertencia);

    return {
        porcentajeOperativo: porcentageOperativo,
        porcentajeAdvertencia: porcentageAdvertencia,
        porcentajeCritico: porcentageCritico
    };
};

// Organizar los sub-servicios
const organizarSubServicios = (componentes) => {
    const componentesListos = [];

    if (!componentes || componentes.length === 0) {
        return componentesListos;
    }

    componentes.forEach(comp => {
        const [statusValue, statusText] = definirStatus(comp.status);
        componentesListos.push({
            sub_servicio: comp.name,
            status: statusValue,
            status_text: statusText
        });
    });

    return componentesListos;
};


// Controlador principal para StatusGator
export const getStatusServicios = async (req, res, next) => {
    try {
        // 1. Obtener el Board ID
        const boards = await getBoards();
        const boardHolanet = boards.data.find(board =>
            board.name === "Holanet CA" || board.name === "Holanet, C.A."
        );

        if (!boardHolanet) {
            return res.status(404).json({ success: false, error: "No se encontró el board Holanet en StatusGator" });
        }
        console.log(`Board Holanet encontrado: ${boardHolanet.name} (ID: ${boardHolanet.id})`);


        const servicios = await getBoardMonitors(boardHolanet.id);
        const serviciosActivos = Array.isArray(servicios?.data) ? servicios.data : [];
        console.log(`Servicios obtenidos del board ${boardHolanet.name}:`, serviciosActivos);

        if (!serviciosActivos.length) {
            return res.status(404).json({ success: false, error: `No se encontraron servicios en el board ${boardHolanet.name}` });
        }

        // // Fecha actual para obtener ultimas 24horas
        const horaActual = new Date();
        const inicio24h = new Date(horaActual.getTime() - 24 * 60 * 60 * 1000);

        // Pedimos historial de los últimos 2 días para prever reportes de larga duración
        const start = new Date();
        start.setDate(start.getDate() - 2);
        const startDate = start.toISOString().split('T')[0];
        const endDate = horaActual.toISOString().split('T')[0];

        // Mapear cada servicio activo

        const informacionServicios = await Promise.all(serviciosActivos.map(async (servicio) => {
            try {
                console.log(`Servicio a analizar: ${servicio.display_name || servicio.id}`);
                const [historialRes, componentsRes] = await Promise.allSettled([
                    getMonitorHistory(boardHolanet.id, servicio.id, startDate, endDate),
                    getMonitorComponents(boardHolanet.id, servicio.id).catch(err => {
                        console.error(`[StatusGator] Error obteniendo componentes para ${servicio.id}:`, err.message);
                        return { data: [] };
                    })
                ]);

                const historialData = historialRes.status === "fulfilled" ? historialRes.value?.data ?? [] : [];
                console.log(`Historial para ${servicio.display_name || servicio.id}:`, historialData);

                const componentsData = componentsRes.status === "fulfilled" ? componentsRes.value?.data ?? [] : [];
                console.log(`Componentes para ${servicio.display_name || servicio.id}:`, componentsData);

                const reportesOrganizados = organizarReportes(historialData, inicio24h, horaActual);
                const subServiciosOrganizados = organizarSubServicios(componentsData);

                const { porcentajeOperativo, porcentajeAdvertencia, porcentajeCritico } = hallarMetricas(reportesOrganizados, inicio24h, horaActual);
                const [statusValue, statusText] = definirStatus(servicio.filtered_status);

                const historialOrganizado = historialStatus(reportesOrganizados, inicio24h, horaActual);

                return {
                    fuente: "StatusGator",
                    id_servicio: servicio.id,
                    servicio: servicio.display_name || servicio.service?.name || "Desconocido",
                    status_actual: statusValue,
                    status_actual_text: statusText,
                    porcentaje_operativo: porcentajeOperativo,
                    porcentaje_advertencia: porcentajeAdvertencia,
                    porcentaje_critico: porcentajeCritico,
                    reportes: reportesOrganizados,
                    sub_servicios: subServiciosOrganizados,
                    // hora_inicial : inicio24h.toISOString(),
                    historial_status: historialOrganizado,
                    // hora_final : horaActual.toISOString(),
                };

            } catch (error) {
                console.error(`Error obteniendo datos para el servicio ${servicio.display_name || servicio.service?.name || servicio.id}:`, error);
                return { service: servicio.display_name || servicio.service?.name || servicio.id, error: "Error al obtener datos" };
            }
        }));

        console.log("Información de servicios obtenida exitosamente:", informacionServicios);
        res.json(informacionServicios);

    } catch (error) {
        console.error("Error obteniendo datos de StatusGator:", error);
        next(error); // Pasa el error a tu errorHandler global (Imagen 3)
    }
};

// // Helper para normalizar los estados de StatusGator
// const normalizarEstadoSG = (status) => {
//     if (!status) return "operativo";
//     const s = status.toLowerCase();
//     if (s === "up" || s === "operational" || s === "operativo" || s === "ok" || s === "resolved") {
//         return "operativo";
//     }
//     if (s === "warn" || s === "degraded" || s === "warning" || s === "advertencia" || s === "minor" || s === "maintenance") {
//         return "advertencia";
//     }
//     if (s === "down" || s === "danger" || s === "critico" || s === "critical" || s === "major") {
//         return "critico";
//     }
//     return "operativo";
// };

// // Helper para calcular la media de estado y los reportes de las últimas 24 horas
// const calcularMediaYReportes = (historyItems, monitorName, now, windowStart) => {
//     const reportes = [];
//     let totalWarnMs = 0;
//     let totalDangerMs = 0;
//     const totalWindowMs = 24 * 60 * 60 * 1000; // 86,400,000 ms

//     for (const item of historyItems) {
//         const startedAt = new Date(item.started_at);
//         const endedAt = item.ended_at ? new Date(item.ended_at) : now;

//         // Verificar si el incidente intersecta con la ventana de las últimas 24 horas
//         if (startedAt < now && endedAt > windowStart) {
//             const normalizedStatus = normalizarEstadoSG(item.status);

//             // Solo incluimos en reportes si es una falla (advertencia o crítico)
//             if (normalizedStatus === "advertencia" || normalizedStatus === "critico") {
//                 let afectado = monitorName;
//                 if (item.components && Array.isArray(item.components) && item.components.length > 0) {
//                     afectado = item.components[0].name || item.components[0];
//                 } else if (item.component_name) {
//                     afectado = item.component_name;
//                 }

//                 reportes.push({
//                     status: normalizedStatus,
//                     fechaUTC_inicio: item.started_at,
//                     fechaUTC_fin: item.ended_at || now.toISOString(),
//                     mensaje: item.message || item.details || "Incidente del servicio",
//                     afectado: afectado
//                 });
//             }

//             // Calcular duración efectiva dentro de la ventana de 24h
//             const clipStart = Math.max(startedAt.getTime(), windowStart.getTime());
//             const clipEnd = Math.min(endedAt.getTime(), now.getTime());
//             const durationMs = clipEnd - clipStart;

//             if (durationMs > 0) {
//                 if (normalizedStatus === "advertencia") {
//                     totalWarnMs += durationMs;
//                 } else if (normalizedStatus === "critico") {
//                     totalDangerMs += durationMs;
//                 }
//             }
//         }
//     }

//     // Evitar que la suma supere las 24 horas por solapamiento
//     let totalOutageMs = totalWarnMs + totalDangerMs;
//     if (totalOutageMs > totalWindowMs) {
//         const factor = totalWindowMs / totalOutageMs;
//         totalWarnMs *= factor;
//         totalDangerMs *= factor;
//         totalOutageMs = totalWindowMs;
//     }
//     const totalSuccessMs = totalWindowMs - totalOutageMs;

//     const success = parseFloat(((totalSuccessMs / totalWindowMs) * 100).toFixed(2));
//     const warn = parseFloat(((totalWarnMs / totalWindowMs) * 100).toFixed(2));
//     const danger = parseFloat(((totalDangerMs / totalWindowMs) * 100).toFixed(2));

//     return {
//         reportes,
//         media_estado: { success, warn, danger }
//     };
// };

// export const getStatusServicios = async (req, res, next) => {
//     try {
//         // Obtener tablero principal (Holanet) registrado en StatusGator
//         const boards = await getBoards();
//         const boardHolanet = boards.data.find(board =>
//             board.name === "Holanet CA" || board.name === "Holanet C.A."
//         );

//         if (!boardHolanet) {
//             return res.status(404).json({ success: false, error: "No se encontró el board Holanet en StatusGator" });
//         }

//         // Obtener servicios registrados en el tablero de Holanet
//         const servicios = await getBoardServicios(boardHolanet.id);
//         const serviciosActivos = servicios.data;

//         if (!serviciosActivos) {
//             return res.status(404).json({ success: false, error: `No se encontraron servicios en el board ${boardHolanet.name}` });
//         }

//         const now = new Date();
//         const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

//         // Pedimos historial de los últimos 2 días para prever reportes de larga duración
//         const start = new Date();
//         start.setDate(start.getDate() - 2);
//         const startDate = start.toISOString().split('T')[0];
//         const endDate = now.toISOString().split('T')[0];

//         // Mapear cada servicio activo a la estructura unificada
//         const formattedServices = await Promise.all(serviciosActivos.map(async (servicio) => {
//             try {
//                 const [historialRes, componentsRes] = await Promise.all([
//                     getHistoryServicios(boardHolanet.id, servicio.id, startDate, endDate),
//                     getMonitorComponents(boardHolanet.id, servicio.id).catch(err => {
//                         console.error(`[StatusGator] Error obteniendo componentes para ${servicio.id}:`, err.message);
//                         return { data: [] };
//                     })
//                 ]);

//                 const historyItems = historialRes.data || [];
//                 const componentsItems = componentsRes.data || [];

//                 const sub_servicios = componentsItems.map(comp => ({
//                     name: comp.name || comp.display_name || "Componente",
//                     status: normalizarEstadoSG(comp.status)
//                 }));

//                 const { reportes, media_estado } = calcularMediaYReportes(
//                     historyItems,
//                     servicio.display_name || servicio.name,
//                     now,
//                     windowStart
//                 );

//                 return {
//                     fuente: "statusgator_api",
//                     nombre_servicio: servicio.display_name || servicio.name,
//                     estado_actual: normalizarEstadoSG(servicio.status),
//                     sub_servicios,
//                     reportes,
//                     media_estado
//                 };
//             } catch (error) {
//                 console.error(`[StatusGator] Error procesando servicio ${servicio.id}:`, error.message);
//                 return {
//                     fuente: "statusgator_api",
//                     nombre_servicio: servicio.display_name || servicio.name || "Servicio Desconocido",
//                     estado_actual: normalizarEstadoSG(servicio.status),
//                     sub_servicios: [],
//                     reportes: [],
//                     media_estado: { success: 100, warn: 0, danger: 0 }
//                 };
//             }
//         }));

//         // Filtrado por parámetro de consulta si se solicita
//         let result = formattedServices;
//         if (req.query.service_name) {
//             const filterName = req.query.service_name.toLowerCase();
//             result = formattedServices.filter(s =>
//                 s.nombre_servicio.toLowerCase().includes(filterName)
//             );
//         }

//         return res.status(200).json({
//             success: true,
//             data: result
//         });

//     } catch (error) {
//         console.error("Error obteniendo datos de StatusGator:", error);
//         next(error);
//     }
// };
