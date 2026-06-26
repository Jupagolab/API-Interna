import { getBoards } from "../services/statusgator.service.js";

export const getStatusServicios = async (req, res, next) => {
    try {
        const boards = await getBoards();
        console.log(boards);
        const boardHolanet = boards.find(board => board.name === "Holanet");
        console.log(boardHolanet);

        if (!boardHolanet) throw new Error("No se encontraron boards");

        return res.status(200).json(boardHolanet);

    } catch (error) {
        console.error("Error obteniendo datos de StatusGator:", error);
        next(error);
    }
}   