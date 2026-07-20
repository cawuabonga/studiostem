/**
 * @fileOverview Configuración centralizada de Genkit para IA Híbrida.
 * Permite alternar dinámicamente entre Google AI y Ollama Local según la elección del SuperAdmin.
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
 * Recupera la configuración activa del SuperAdmin y devuelve el modelo correspondiente.
 * Respeta estrictamente la elección del administrador sin realizar fallbacks automáticos.
 */
export async function getActiveAIConfig() {
    console.log("[CEREBRO IA] Consultando configuración de proveedor activa...");
    
    try {
        const config = await getAIConfig();
        const googleModel = googleAI.model('gemini-2.0-flash');
        
        // Si el proveedor seleccionado es Ollama y está configurado
        if (config?.activeProvider === 'ollama' && config?.ollamaUrl) {
            console.log("[CEREBRO IA] Configuración detectada: OLLAMA LOCAL.");
            return {
                model: ollama.model({
                    name: config.ollamaModel || 'llama3',
                    address: config.ollamaUrl,
                }),
                providerName: 'Ollama (' + (config.ollamaModel || 'llama3') + ')',
                id: 'ollama'
            };
        }

        // Por defecto o si es Google
        console.log("[CEREBRO IA] Configuración detectada: GOOGLE GEMINI.");
        return {
            model: googleModel,
            providerName: 'Google Gemini 2.0 Flash',
            id: 'google'
        };
    } catch (error) {
        console.error("[CEREBRO IA] Error al leer configuración, usando Google por defecto por seguridad de sistema.");
        return {
            model: googleAI.model('gemini-2.0-flash'),
            providerName: 'Google Gemini (Default)',
            id: 'google'
        };
    }
}

/**
 * Mantiene compatibilidad devolviendo solo el modelo.
 */
export async function getActiveAIModel() {
    const { model } = await getActiveAIConfig();
    return model;
}
