import axios from "axios";

const testStatusphere = async () => {
    try {
        console.log("Conectando a Statusphere...");

        // Hacemos la petición a la instancia pública
        const response = await axios.get(`https://statusphere.tech/api/v1/statusPage`, {
            params: {
                statusPageName: "cloudflare" // Aquí puedes cambiar a 'github', 'discord', etc.
            },
            // Mantenemos el User-Agent por buena práctica de red
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            }
        });

        console.log("¡Éxito! Aquí tienes el JSON de respuesta:");

        // Imprimimos el resultado estructurado
        console.dir(response.data, { depth: null, colors: true });

    } catch (error) {
        // Manejo de errores de Axios
        if (error.response) {
            console.error(`Statusphere respondió con error: ${error.response.status}`);
        } else {
            console.error("Error de red o conexión:", error.message);
        }
    }
};

// Ejecutamos la función de prueba
testStatusphere();