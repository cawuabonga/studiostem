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
 * Ayudante para obtener el modelo activo basado en la configuración guardada en Firestore.
 * Incluye logging mejorado para depuración y evita fallbacks automáticos a Google si se eligió Ollama.
 */
export async function getActiveAIModel() {
    console.log("[CEREBRO IA] Consultando configuración activa en Firestore...");
    
    try {
        const config = await getAIConfig();
        
        if (!config) {
            console.warn("[CEREBRO IA] Sin configuración en DB. Usando Google Gemini como último recurso.");
            return googleAI.model('gemini-2.0-flash');
        }

        console.log(`[CEREBRO IA] Proveedor activo detectado: ${config.activeProvider.toUpperCase()}`);

        if (config.activeProvider === 'ollama') {
            if (config.ollamaUrl && config.ollamaUrl.trim() !== '') {
                console.log(`[CEREBRO IA] MODO LOCAL. Conectando a Ollama en: ${config.ollamaUrl}`);
                return ollama.model({
                    name: config.ollamaModel || 'llama3',
                    address: config.ollamaUrl,
                });
            } else {
                // Si el usuario eligió Ollama pero no puso URL, lanzamos un error explícito en lugar de saltar a Google
                throw new Error("ERROR_CONFIG_OLLAMA: Has seleccionado Ollama como proveedor, pero la URL de ngrok está vacía en el panel de SuperAdmin.");
            }
        }
        
        console.log("[CEREBRO IA] MODO NUBE. Usando Google Gemini.");
        return googleAI.model('gemini-2.0-flash');
        
    } catch (error: any) {
        console.error("[CEREBRO IA] Error crítico en selección de modelo:", error.message);
        // Si es un error de configuración de Ollama, lo propagamos para que el usuario sepa qué arreglar
        if (error.message.includes("ERROR_CONFIG_OLLAMA")) throw error;
        
        // Solo en caso de error de lectura de base de datos usamos Google como fallback de emergencia
        return googleAI.model('gemini-2.0-flash');
    }
}
