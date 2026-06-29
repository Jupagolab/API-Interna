import axios from "axios";

const { API_KEY_STATUSGATOR, API_KEY_STATUSGATOR2 } = process.env;
const headers = {
    "Authorization": `Bearer ${API_KEY_STATUSGATOR2}`
}

export const getBoards = async () => {
    try {
        const response = await axios.get(`https://statusgator.com/api/v3/boards`, {
            headers: headers
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getBoardMonitors = async (boardId) => {
    const response = await axios.get(`https://statusgator.com/api/v3/boards/${boardId}/monitors`, {
        headers: headers
    });
    return response.data;
};

export const getMonitorHistory = async (boardId, servicioId, date_start, date_end) => {
    const response = await axios.get(`https://statusgator.com/api/v3/boards/${boardId}/history`, {
        params: {
            start_date: date_start,
            end_date: date_end,
            monitor_id: servicioId
        }, headers: headers
    });
    return response.data;
};

export const getMonitorComponents = async (boardId, monitorId) => {
    const response = await axios.get(`https://statusgator.com/api/v3/boards/${boardId}/monitors/${monitorId}/components`, {
        headers: headers
    });
    return response.data;
};

