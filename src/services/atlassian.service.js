import axios from 'axios';

// API pública v2 de Atlassian Statuspage (no requiere autenticación)
// Ejemplo de URL: https://[page_id].statuspage.io/api/v2/summary.json

const TIMEOUT = 8000; // Timeout de 8 segundos

export const getSummary = async (pageId) => {
    try {
        const response = await axios.get(`https://${pageId}.statuspage.io/api/v2/summary.json`, {
            timeout: TIMEOUT
        });
        return response.data;
    } catch (error) {
        console.error(`[Atlassian Service] Error fetching summary for page ${pageId}:`, error.message);
        throw error;
    }
};

export const getIncidents = async (pageId) => {
    try {
        const response = await axios.get(`https://${pageId}.statuspage.io/api/v2/incidents.json`, {
            timeout: TIMEOUT
        });
        return response.data;
    } catch (error) {
        console.error(`[Atlassian Service] Error fetching incidents for page ${pageId}:`, error.message);
        throw error;
    }
};
