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
 * Esto permite que la plataforma use el túnel de ngrok si el SuperAdmin lo activa.
 */
export async function getActiveAIModel() {
    try {
        const config = await getAIConfig();
        
        // Priorizar Ollama si está activo y tiene una URL configurada
        if (config?.activeProvider === 'ollama' && config.ollamaUrl) {
            console.log(`[CEREBRO IA] Usando Ollama Local en: ${config.ollamaUrl}`);
            return ollama.model({
                name: config.ollamaModel || 'llama3',
                address: config.ollamaUrl,
            });
        }
    } catch (error) {
        console.error("[CEREBRO IA] Error al leer configuración, usando Google AI por defecto:", error);
    }
    
    // Fallback a Google AI (Gemini) si Ollama no está configurado o falla
    console.log(`[CEREBRO IA] Usando Google AI Cloud (Gemini)`);
    return googleAI.model('gemini-2.0-flash');
}
