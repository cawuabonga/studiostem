
'use server';

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {ollama} from 'genkitx-ollama';
import {getAIConfig} from '@/config/firebase';

export const ai = genkit({
  plugins: [
    googleAI(),
    ollama(),
  ],
  model: 'googleai/gemini-2.0-flash',
});

/**
 * Helper to get the correct model based on dynamic configuration.
 */
export async function getActiveAIModel() {
    const config = await getAIConfig();
    
    if (config?.activeProvider === 'ollama' && config.ollamaUrl) {
        return ollama.model({
            name: config.ollamaModel || 'llama3',
            address: config.ollamaUrl,
        });
    }
    
    return googleAI.model('gemini-2.0-flash');
}
