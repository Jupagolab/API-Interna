import axios from "axios";

const { API_KEY_STATUSGATOR } = process.env;
const headers = {
    "Authorization": `Bearer ${API_KEY_STATUSGATOR}`
}

export const getBoards = async () => {
    try {
        const response = await axios.get(`https://api.statusgator.com/v1/boards`, {
            headers: headers
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};