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
    googleAI(),
    ollama(),
  ],
});

/**
 * Ayudante para obtener el modelo activo basado en la configuración guardada en Firestore.
 */
export async function getActiveAIModel() {
    try {
        const config = await getAIConfig();
        
        console.log("[CEREBRO IA] Configuración leída de Firestore:", config);

        if (config?.activeProvider === 'ollama') {
            if (config.ollamaUrl) {
                console.log(`[CEREBRO IA] MODO LOCAL ACTIVO. Conectando a Ollama en: ${config.ollamaUrl} con modelo: ${config.ollamaModel || 'llama3'}`);
                return ollama.model({
                    name: config.ollamaModel || 'llama3',
                    address: config.ollamaUrl,
                });
            } else {
                console.warn("[CEREBRO IA] Proveedor es Ollama pero la URL está vacía.");
                throw new Error("ERROR_CONFIG_OLLAMA: Has seleccionado Ollama pero no has configurado la URL de ngrok.");
            }
        }
        
        console.log("[CEREBRO IA] MODO NUBE ACTIVO. Usando Google Gemini.");
    } catch (error: any) {
        console.error("[CEREBRO IA] Error al obtener configuración:", error.message);
        if (error.message.includes("ERROR_CONFIG_OLLAMA")) throw error;
    }
    
    return googleAI.model('gemini-2.0-flash');
}
