'use server';
/**
 * @fileOverview Flow para la generación de sumillas académicas con Reintento Automático.
 */

import {ai, getAIModelsWithFailover} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSyllabusSummaryInputSchema = z.object({
  unitName: z.string().describe('The name of the didactic unit.'),
});
export type GenerateSyllabusSummaryInput = z.infer<typeof GenerateSyllabusSummaryInputSchema>;

/**
 * Función pública con lógica de reintento secuencial para generación de sumillas.
 */
export async function generateSyllabusSummary(input: GenerateSyllabusSummaryInput): Promise<string> {
  const { primary, fallback } = await getAIModelsWithFailover();
  
  const promptText = `Eres un experto diseñador de currículos académicos. Genera una sumilla concisa y profesional para una unidad didáctica titulada "${input.unitName}". La sumilla debe describir la naturaleza, propósito y contenido principal de la unidad. El resultado debe ser únicamente el texto de la sumilla, sin títulos ni introducciones.`;

  let lastError = null;

  // Intento 1
  try {
    const { text } = await ai.generate({ model: primary, prompt: promptText });
    if (text) return text;
  } catch (error: any) {
    lastError = error;
    console.warn(`[SYLLABUS IA] Falló Intento 1: ${error.message}`);
  }

  // Intento 2 (Fallback)
  if (fallback) {
    try {
      console.log(`[SYLLABUS IA] Reintentando con proveedor de respaldo...`);
      const { text } = await ai.generate({ model: fallback, prompt: promptText });
      if (text) return text;
    } catch (error: any) {
        lastError = error;
    }
  }

  throw new Error(lastError?.message || "Error al procesar la solicitud de IA.");
}
