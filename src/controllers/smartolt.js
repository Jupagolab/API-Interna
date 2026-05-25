import axios from "axios";

const { API_KEY_SMARTOLT } = process.env;
const credentials = {
  "X-Token": API_KEY_SMARTOLT
}

export const autorizarONU = async (req, res, next) => {
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
    next(error);
  }
}

export const setOnuWANMode = async (req, res, next) => {
  try {
    const { sn_onu } = req.params;
    const {
      configuration_method,
      ip_protocol,
      ipv6_address_mode,
      allow_access_from
    } = req.body;

    const formData = new FormData();

    formData.append("configuration_method", configuration_method)
    formData.append("ip_protocol", ip_protocol)
    formData.append("ipv6_address_mode", ipv6_address_mode)

    const formData2 = new FormData();
    formData2.append("allow_access_from", allow_access_from)


    // 1. Primero configuramos el modo DHCP
    const data = await axios.post(`https://holanet.smartolt.com/api/onu/set_onu_wan_mode_dhcp/${sn_onu}`, formData, {
      headers: credentials,
    });

    if (data.status !== 200) {
      return res.status(400).json({ error: "Error al configurar DHCP en la ONU" });
    }

    // 2. Esperamos a que la ONU procese la config anterior y habilitamos acceso remoto
    const data2 = await axios.post(`https://holanet.smartolt.com/api/onu/enable_allow_remote_access_to_wan_ip/${sn_onu}`, formData2, {
      headers: credentials,
    });

    if (data2.status !== 200) {
      return res.status(400).json({ error: "Error al habilitar acceso remoto a WAN" });
    }

    const response = {
      ...data.data,
      ...data2.data
    }
    // const response = data.data;
    // res.status(data.status === 200 ? 200 : data.status).json(response);
    res.status(200).json(response);

  } catch (error) {
    next(error);
  }
}
