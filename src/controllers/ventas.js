import Ventas from '../models/ventas.js';

export const addVenta = async (req, res) => {
  try {
    const { nombre_completo, cedula, direccion, telefonos, correo, plan, vendedor } = req.body;
    const compra_router = req.body["compra-router"];

    const nuevaVenta = await Ventas.create({ nombre_completo, cedula, direccion, telefonos, correo, plan, vendedor, 'compra-router': compra_router });

    if (!nuevaVenta) return res.status(400).json({ message: "Hubo un error al agregar la venta en la base de datos" })

    res.status(201).json({ message: "Venta agregada a la base de datos con éxito" });
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