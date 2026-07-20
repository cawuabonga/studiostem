'use server';
/**
 * @fileOverview Flow para la generación de sumillas académicas con Failover.
 */

import {ai, getAIModelsWithFailover} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSyllabusSummaryInputSchema = z.object({
  unitName: z.string().describe('The name of the didactic unit.'),
});
export type GenerateSyllabusSummaryInput = z.infer<typeof GenerateSyllabusSummaryInputSchema>;

/**
 * Función pública con lógica de failover integrada para generación de sumillas.
 */
export async function generateSyllabusSummary(input: GenerateSyllabusSummaryInput): Promise<string> {
  const { primary, fallback } = await getAIModelsWithFailover();
  
  const runGeneration = async (model: any) => {
    const {text} = await ai.generate({
      model,
      prompt: `Eres un experto diseñador de currículos académicos. Genera una sumilla concisa y profesional para una unidad didáctica titulada "${input.unitName}". La sumilla debe describir la naturaleza, propósito y contenido principal de la unidad. El resultado debe ser únicamente el texto de la sumilla, sin títulos ni introducciones.`,
    });
    return text;
  };

  try {
    return await runGeneration(primary);
  } catch (error: any) {
    const msg = error.message || "";
    const isQuota = msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429');

    if (isQuota && fallback) {
        console.warn("[SYLLABUS IA] Cuota agotada, reintentando con OLLAMA...");
        return await runGeneration(fallback);
    }
    
    throw new Error(msg || "Error al procesar la solicitud de IA.");
  }
}
