import axios from "axios";

const { API_KEY_SMARTOLT } = process.env;
const credentials = {
  "X-Token": API_KEY_SMARTOLT
}

export const autorizarONU = async (req, res) => {
  try {
    const {
      olt_id,
      pon_type,
      sn,
      onu_type,
      onu_mode,
      vlan,
      zone,
      name,
      onu_external_id,
      upload_speed_profile_name,
      download_speed_profile_name,
      board,
      port,
      latitude,
      longitude,
    } = req.body;

    const formData = new FormData();

    formData.append("olt_id", olt_id)
    formData.append("pon_type", pon_type)
    formData.append("board", board)
    formData.append("port", port)
    formData.append("sn", sn)
    formData.append("vlan", vlan)
    formData.append("onu_type", onu_type)
    formData.append("zone", zone)
    formData.append("name", name)
    formData.append("onu_mode", onu_mode)
    formData.append("onu_external_id", onu_external_id)
    formData.append("upload_speed_profile_name", upload_speed_profile_name)
    formData.append("download_speed_profile_name", download_speed_profile_name)
    formData.append("latitude", latitude)
    formData.append("longitude", longitude)

    const data = await axios.post(`https://holanet.smartolt.com/api/onu/authorize_onu`, formData, {
      headers: credentials,
    })

    const response = data.data;
    res.status(data.status === 200 ? 200 : data.status).json(response);

  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
}
