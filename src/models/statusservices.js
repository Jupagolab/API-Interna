const ejemploJSON_Grafana = {
    "fuente": "atlassian_api",
    "nombre_servicio": "Cloudflare",
    "estado_actual": "operativo", // Normalizar a: "operativo", "advertencia" (warn), "critico" (danger)
    "sub_servicios": [
        { "name": "API", "status": "operativo" },
        { "name": "Dashboard", "status": "advertencia" }
    ],
    "reportes": [
        {
            "status": "advertencia",
            "fechaUTC_inicio": "2026-06-25T10:00:00Z",
            "fechaUTC_fin": "2026-06-25T11:30:00Z", // Vital para calcular la media
            "mensaje": "Latencia elevada en el enrutamiento",
            "afectado": "API" // Nombre del sub-servicio o del servicio padre
        }
    ],
    "media_estado": {
        "success": 93.75, // % del tiempo en las últimas 24h
        "warn": 6.25,     // % del tiempo en las últimas 24h
        "danger": 0       // % del tiempo en las últimas 24h
    }
}