'use server';
/**
 * @fileOverview Flow para la generación de sumillas académicas.
 * Respeta el proveedor seleccionado por el SuperAdmin sin fallbacks.
 */

import {ai, getActiveAIConfig} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSyllabusSummaryInputSchema = z.object({
  unitName: z.string().describe('The name of the didactic unit.'),
});
export type GenerateSyllabusSummaryInput = z.infer<typeof GenerateSyllabusSummaryInputSchema>;

/**
 * Función pública que utiliza el motor de IA activo.
 */
export async function generateSyllabusSummary(input: GenerateSyllabusSummaryInput): Promise<string> {
  const { model } = await getActiveAIConfig();
  
  const promptText = `Eres un experto diseñador de currículos académicos. Genera una sumilla concisa y profesional para una unidad didáctica titulada "${input.unitName}". La sumilla debe describir la naturaleza, propósito y contenido principal de la unidad. El resultado debe ser únicamente el texto de la sumilla, sin títulos ni introducciones.`;

  try {
    const { text } = await ai.generate({ model, prompt: promptText });
    return text || "No se pudo generar la sumilla.";
  } catch (error: any) {
    console.error("[SYLLABUS IA ERROR]", error);
    throw new Error(`Error en el motor de IA configurado: ${error.message}`);
  }
}
