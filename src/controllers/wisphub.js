const { API_WISPHUB, API_KEY_WISPHUB } = process.env;
const credentials = {
  "Authorization": API_KEY_WISPHUB
}
import axios from "axios";

//Formato de fecha para wisphub
const now = new Date();
const pad = n => String(n).padStart(2, '0');
const fmt = d => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
const end = new Date(now);
end.setHours(end.getHours() + 8);

export const crearTicket = async (req, res) => {
  try {
    const { servicio, asunto, tecnico, descripcion, estado, prioridad, departamento } = req.body;

    const formData = new FormData();

    const fecha_inicio = fmt(now);
    const fecha_fin = fmt(end);

    formData.append("servicio", servicio)
    formData.append("asunto", asunto)
    formData.append("asuntos_default", asunto)
    formData.append("tecnico", tecnico)
    formData.append("descripcion", descripcion)
    formData.append("estado", estado)
    formData.append("prioridad", prioridad)
    formData.append("departamento", departamento)
    formData.append("departamentos_default", departamento)
    formData.append("fecha_inicio", fecha_inicio)
    formData.append("fecha_fin", fecha_fin)

    const data = await axios.post(`https://api.wisphub.net/api/tickets/`, formData, {
      headers: credentials,
    })

    const response = await data.data;
    res.status(data.status === 200 ? 200 : data.status).json(response);

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }

}

export const editarTicket = async (req, res) => {
  try {
    const { id_ticket, servicio, asunto, tecnico, descripcion, estado, prioridad, departamento } = req.body;

    const formData = new FormData();

    const fecha_inicio = fmt(now);
    const fecha_fin = fmt(end);

    formData.append("servicio", servicio)
    formData.append("asunto", asunto)
    formData.append("asuntos_default", asunto)
    formData.append("tecnico", tecnico)
    formData.append("descripcion", descripcion)
    formData.append("estado", estado)
    formData.append("prioridad", prioridad)
    formData.append("departamento", departamento)
    formData.append("departamentos_default", departamento)
    formData.append("fecha_inicio", fecha_inicio)
    formData.append("fecha_fin", fecha_fin)

    const data = await axios.put(`https://api.wisphub.net/api/tickets/${id_ticket}/`, formData, {
      headers: credentials,
    })

    const response = await data.data;
    res.status(data.status === 200 ? 200 : data.status).json(response);

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }

}