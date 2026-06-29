//caso ideal

[
    {
        "id_servicio": "meta_01",
        "nombre_servicio": "Meta",
        "fuente": "status_api",
        "estado_actual_txt": "advertencia",
        "estado_actual_num": 2,

        "metricas_24h_success": 75,
        "metricas_24h_warn": 25,
        "metricas_24h_danger": 0,

        "sub_servicios": [
            { "nombre_sub": "WhatsApp", "status_num": 1, "status_txt": "operativo" },
            { "nombre_sub": "Facebook", "status_num": 1, "status_txt": "operativo" },
            { "nombre_sub": "Instagram", "status_num": 2, "status_txt": "advertencia" }
        ],

        "historial_estados": [
            { "time": "2026-06-27T22:00:00Z", "status_num": 1 },
            { "time": "2026-06-28T08:00:00Z", "status_num": 2 }
        ],

        "reportes": [
            {
                "nivel": "advertencia",
                "inicio": "2026-06-28T08:00:00Z",
                "fin": null,
                "mensaje": "Problemas al cargar feeds de imágenes",
                "afectado": "Instagram"
            }
        ]
    }
]

//caso no hay reportes ni subservicios
[
    {
        "id_servicio": "github_01",
        "nombre_servicio": "GitHub",
        "estado_actual_txt": "operativo",
        "estado_actual_num": 1,

        "metricas_24h_success": 100,
        "metricas_24h_warn": 0,
        "metricas_24h_danger": 0,

        "sub_servicios": [
            { "nombre_sub": "Actions", "status_num": 1, "status_txt": "operativo" },
            { "nombre_sub": "Packages", "status_num": 1, "status_txt": "operativo" }
        ],

        "historial_estados": [
            {
                "time": "2026-06-27T23:25:53Z",
                "status_num": 1
            }
        ],

        "reportes": []
    }
]