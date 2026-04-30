
'use server';

/**
 * @fileOverview Acción de servidor para validar la conexión con una instancia local de Ollama.
 * Al ejecutarse en el servidor, evita problemas de CORS y permite usar cabeceras específicas de ngrok.
 */

export async function testOllamaConnection(url: string): Promise<boolean> {
    if (!url) return false;

    try {
        // Intentamos una petición al endpoint de etiquetas de Ollama
        const response = await fetch(`${url}/api/tags`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                // Cabecera crítica para saltar la página de confirmación de ngrok en planes gratuitos
                'ngrok-skip-browser-warning': 'true',
            },
            // Evitamos cache para tener una prueba real en cada clic
            cache: 'no-store'
        });

        return response.ok;
    } catch (error) {
        console.error("[DEBUG] Error al probar conexión con Ollama:", error);
        return false;
    }
}
