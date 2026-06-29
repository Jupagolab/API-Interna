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
        return [{ inicio: inicio24h.toISOString(), status_num: 1, motivo: "Servicio operando con normalidad" }];
    }

    const sortedReportes = [...reportesOrganizados].sort((a, b) => new Date(a.hora_inicio) - new Date(b.hora_inicio));
    const timeline = [];
    let cursor = new Date(inicio24h);

    const addEstadoOperativo = (from, to) => {
        if (to.getTime() > from.getTime()) {
            const last = timeline[timeline.length - 1];
            if (!last || last.status_num !== 1 || last.inicio !== from.toISOString()) {
                timeline.push({ inicio: from.toISOString(), status_num: 1, motivo: "Servicio operando con normalidad" });
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
            timeline.push({ inicio: inicioClipped.toISOString(), status_num: statusNum, motivo: reporte.motivo });
        }

        cursor = new Date(Math.max(cursor.getTime(), finClipped.getTime()));
    });

    if (cursor.getTime() < horaActual.getTime()) {
        timeline.push({ inicio: cursor.toISOString(), status_num: 1, motivo: "Servicio operando con normalidad" });
    }

    return timeline.length ? timeline : [{ inicio: inicio24h.toISOString(), status_num: 1, motivo: "Servicio operando con normalidad" }];
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

// Calcular porcentajes de estado de los sub-servicios por conteo
const hallarMetricasSubServicios = (subServicios) => {
    if (!subServicios || subServicios.length === 0) {
        return {
            porcentajeOperativo_subservicio: 100,
            porcentajeAdvertencia_subservicio: 0,
            porcentajeCritico_subservicio: 0
        };
    }

    const total = subServicios.length;
    let operativos = 0;
    let advertencias = 0;
    let criticos = 0;

    subServicios.forEach(sub => {
        if (sub.status === 3) {
            criticos++;
        } else if (sub.status === 2) {
            advertencias++;
        } else {
            operativos++;
        }
    });

    return {
        porcentajeOperativo_subservicio: (operativos / total) * 100,
        porcentajeAdvertencia_subservicio: (advertencias / total) * 100,
        porcentajeCritico_subservicio: (criticos / total) * 100
    };
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
                const { porcentajeOperativo_subservicio, porcentajeAdvertencia_subservicio, porcentajeCritico_subservicio } = hallarMetricasSubServicios(subServiciosOrganizados);
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
                    porcentaje_operativo_subservicio: porcentajeOperativo_subservicio,
                    porcentaje_advertencia_subservicio: porcentajeAdvertencia_subservicio,
                    porcentaje_critico_subservicio: porcentajeCritico_subservicio,
                    reportes: reportesOrganizados,
                    sub_servicios: subServiciosOrganizados,
                    hora_inicial: inicio24h.toISOString(),
                    historial_status: historialOrganizado,
                    hora_final: horaActual.toISOString(),
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

