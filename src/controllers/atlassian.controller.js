import { getSummary, getIncidents } from "../services/atlassian.service.js";

// Helper para normalizar los estados de Atlassian Statuspage
const normalizarEstadoAtlassian = (status) => {
    if (!status) return "operativo";
    const s = status.toLowerCase();
    if (s === "none" || s === "operational" || s === "operativo" || s === "resolved") {
        return "operativo";
    }
    if (s === "minor" || s === "degraded_performance" || s === "partial_outage" || s === "under_maintenance" || s === "warning" || s === "maintenance") {
        return "advertencia";
    }
    if (s === "major" || s === "critical" || s === "major_outage" || s === "danger" || s === "critico") {
        return "critico";
    }
    return "operativo";
};

// Helper para calcular la media de estado e incidentes de Atlassian en las últimas 24h
const calcularMediaYReportesAtlassian = (incidents, pageName, now, windowStart) => {
    const reportes = [];
    let totalWarnMs = 0;
    let totalDangerMs = 0;
    const totalWindowMs = 24 * 60 * 60 * 1000; // 86,400,000 ms

    for (const incident of incidents) {
        const startedAt = new Date(incident.started_at || incident.created_at);
        // Si resolved_at es nulo, validamos si el estado es resolved. Si no, sigue abierto (usamos now)
        const endedAt = incident.resolved_at
            ? new Date(incident.resolved_at)
            : (incident.status === "resolved" ? new Date(incident.updated_at) : now);

        if (startedAt < now && endedAt > windowStart) {
            const normalizedStatus = normalizarEstadoAtlassian(incident.impact);

            if (normalizedStatus === "advertencia" || normalizedStatus === "critico") {
                let afectado = pageName;
                if (incident.components && Array.isArray(incident.components) && incident.components.length > 0) {
                    afectado = incident.components.map(c => c.name).join(', ');
                }

                reportes.push({
                    status: normalizedStatus,
                    fechaUTC_inicio: incident.started_at || incident.created_at,
                    fechaUTC_fin: incident.resolved_at || (incident.status === "resolved" ? incident.updated_at : now.toISOString()),
                    mensaje: incident.name || "Incidente de servicio",
                    afectado: afectado
                });
            }

            // Calcular duración efectiva dentro de la ventana de 24h
            const clipStart = Math.max(startedAt.getTime(), windowStart.getTime());
            const clipEnd = Math.min(endedAt.getTime(), now.getTime());
            const durationMs = clipEnd - clipStart;

            if (durationMs > 0) {
                if (normalizedStatus === "advertencia") {
                    totalWarnMs += durationMs;
                } else if (normalizedStatus === "critico") {
                    totalDangerMs += durationMs;
                }
            }
        }
    }

    // Evitar que la suma supere las 24 horas por solapamientos
    let totalOutageMs = totalWarnMs + totalDangerMs;
    if (totalOutageMs > totalWindowMs) {
        const factor = totalWindowMs / totalOutageMs;
        totalWarnMs *= factor;
        totalDangerMs *= factor;
        totalOutageMs = totalWindowMs;
    }
    const totalSuccessMs = totalWindowMs - totalOutageMs;

    const success = parseFloat(((totalSuccessMs / totalWindowMs) * 100).toFixed(2));
    const warn = parseFloat(((totalWarnMs / totalWindowMs) * 100).toFixed(2));
    const danger = parseFloat(((totalDangerMs / totalWindowMs) * 100).toFixed(2));

    return {
        reportes,
        media_estado: { success, warn, danger }
    };
};

export const getStatusAtlassian = async (req, res, next) => {
    try {
        const pageId = req.query.page_id || "yh6f0r4529hb"; // Por defecto Cloudflare

        // Obtener datos de Atlassian Statuspage
        const [summaryData, incidentsData] = await Promise.all([
            getSummary(pageId),
            getIncidents(pageId)
        ]);

        if (!summaryData || !summaryData.page) {
            return res.status(404).json({ success: false, error: `No se encontró la página de Atlassian con ID ${pageId}` });
        }

        const now = new Date();
        const windowStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const sub_servicios = (summaryData.components || []).map(comp => ({
            name: comp.name,
            status: normalizarEstadoAtlassian(comp.status)
        }));

        const incidentsList = incidentsData.incidents || [];
        const { reportes, media_estado } = calcularMediaYReportesAtlassian(
            incidentsList,
            summaryData.page.name,
            now,
            windowStart
        );

        const formattedResponse = {
            fuente: "atlassian_api",
            nombre_servicio: summaryData.page.name,
            estado_actual: normalizarEstadoAtlassian(summaryData.status?.indicator),
            sub_servicios,
            reportes,
            media_estado
        };

        return res.status(200).json({
            success: true,
            data: formattedResponse
        });

    } catch (error) {
        console.error("[Atlassian] getStatusAtlassian error:", error.message);
        res.status(500).json({ success: false, error: "Error al obtener datos de Atlassian Statuspage" });
    }
};
