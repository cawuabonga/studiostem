/**
 * @fileOverview Configuración centralizada de Genkit para IA Híbrida.
 * Permite alternar dinámicamente entre Google AI y Ollama Local.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {ollama} from 'genkitx-ollama';
import {getAIConfig} from '@/config/firebase';

export const ai = genkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY }),
    ollama(),
  ],
});

/**
 * Estructura para manejo de fallos (Failover).
 * Devuelve el modelo primario según configuración y un modelo de respaldo si existe.
 */
export async function getAIModelsWithFailover() {
    console.log("[CEREBRO IA] Recuperando orquestación de modelos...");
    
    try {
        const config = await getAIConfig();
        const googleModel = googleAI.model('gemini-2.0-flash');
        let ollamaModel = null;

        if (config?.ollamaUrl && config.ollamaUrl.trim() !== '') {
            ollamaModel = ollama.model({
                name: config.ollamaModel || 'llama3',
                address: config.ollamaUrl,
            });
        }

        // Definimos el orden basado en la configuración del SuperAdmin
        const primaryIsOllama = config?.activeProvider === 'ollama' && ollamaModel;
        
        return {
            primary: primaryIsOllama ? ollamaModel : googleModel,
            fallback: primaryIsOllama ? googleModel : ollamaModel,
            config
        };
    } catch (error) {
        console.error("[CEREBRO IA] Error al leer configuración, usando Google por defecto.");
        return {
            primary: googleAI.model('gemini-2.0-flash'),
            fallback: null,
            config: null
        };
    }
}

/**
 * Mantiene compatibilidad con flujos existentes devolviendo el modelo preferido.
 */
export async function getActiveAIModel() {
    const { primary } = await getAIModelsWithFailover();
    return primary;
}
