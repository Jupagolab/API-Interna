import Preventa from "../models/preventa.js";
import Sorteo from "../models/sorteo.js";

export const findPreventa = async (req, res) => {
  try {
    const { fecha1, fecha2 } = req.body;

    console.log([fecha1, fecha2])
    const fechaInicio = new Date(fecha1);
    const fechaFin = new Date(fecha2);

    const foundedPreventa = await Preventa.aggregate([
      {
        // 💡 Estrategia Robusta: Convertir el campo a Date antes de filtrar.
        // Esto es necesario si el campo está almacenado como string en la DB,
        // pero queremos compararlo como un objeto Date.
        $addFields: {
          createdDate: {
            $toDate: "$created_At"
          }
        }
      },
      {
        $match: {
          // Usamos el campo temporal convertido para el filtro
          "createdDate": {
            $gte: fechaInicio,
            $lt: fechaFin
          }
        }
      },
      // Opcional: Proyectar solo los campos originales si no quieres ver el campo 'createdDate'
      {
        $project: {
          createdDate: 0 // Excluir el campo temporal
        }
      }
    ]);

    if (!foundedPreventa) return res.status(404).json({ message: "No se han encontrado preventas en esta fechas" })

    res.status(200).json({
      preventa: foundedPreventa,
      message: "OK"
    })
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