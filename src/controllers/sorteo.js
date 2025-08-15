import Sorteo from "../models/sorteo.js";

export const addGanador = async (req, res) => {
  try {
    const { nombre, cedula } = req.body;

    const nuevoGanador = await Sorteo.create({ nombre, cedula });

    if (!nuevoGanador) return res.status(400).json({ message: "Hubo un error al agregar el ganador en la base de datos" })

    res.status(201).json({ message: "Ganador agregado a la base de datos con éxito" });
  } catch (error) {
    console.error('Error en consulta: ', error.message)
    if (error.response) {
      // Propagamos el código de error de MongoDB
      res.status(error.response.status).json({
        error: error.response.data || 'Error from MongoDB'
      });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}