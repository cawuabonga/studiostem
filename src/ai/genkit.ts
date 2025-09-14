import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {next} from '@genkit-ai/next';

export const ai = genkit({
  plugins: [
    googleAI(),
    next({
      // Opciones de configuración de Next.js si fueran necesarias
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
