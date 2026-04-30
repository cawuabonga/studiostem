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
            console.log(`[CEREBRO IA] Redirigiendo petición a Ollama Local: ${config.ollamaUrl}`);
            return ollama.model({
                name: config.ollamaModel || 'llama3',
                address: config.ollamaUrl,
            });
        }
    } catch (error) {
        console.warn("[CEREBRO IA] No se pudo leer la configuración de Firestore, se intentará usar Google AI como respaldo.");
    }
    
    // Fallback a Google AI (Gemini)
    return googleAI.model('gemini-2.0-flash');
}
