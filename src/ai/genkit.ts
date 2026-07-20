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
  // Establecemos un modelo por defecto conservador
  model: googleAI.model('gemini-2.0-flash'),
});

/**
 * Ayudante para obtener el modelo activo basado en la configuración guardada en Firestore.
 * Incluye logging mejorado para depuración.
 */
export async function getActiveAIModel() {
    console.log("[CEREBRO IA] Consultando configuración activa...");
    
    try {
        const config = await getAIConfig();
        
        if (!config) {
            console.warn("[CEREBRO IA] No hay configuración en Firestore. Usando Google por defecto.");
            return googleAI.model('gemini-2.0-flash');
        }

        console.log(`[CEREBRO IA] Proveedor configurado: ${config.activeProvider.toUpperCase()}`);

        if (config.activeProvider === 'ollama') {
            if (config.ollamaUrl) {
                console.log(`[CEREBRO IA] MODO LOCAL. Conectando a Ollama: ${config.ollamaUrl}`);
                return ollama.model({
                    name: config.ollamaModel || 'llama3',
                    address: config.ollamaUrl,
                });
            } else {
                throw new Error("ERROR_CONFIG_OLLAMA: Has seleccionado Ollama pero la URL de ngrok está vacía.");
            }
        }
        
        console.log("[CEREBRO IA] MODO NUBE. Usando Google Gemini.");
    } catch (error: any) {
        console.error("[CEREBRO IA] Error crítico al seleccionar cerebro:", error.message);
        // Si el error es de configuración manual del usuario, lo propagamos
        if (error.message.includes("ERROR_CONFIG_OLLAMA")) throw error;
    }
    
    // Fallback final en caso de error inesperado
    return googleAI.model('gemini-2.0-flash');
}
