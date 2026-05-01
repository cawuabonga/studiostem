'use server';
/**
 * @fileOverview Flow para la generación de sumillas académicas.
 * 
 * - generateSyllabusSummary: Función que genera una sumilla profesional para una unidad didáctica.
 * - GenerateSyllabusSummaryInput: Interfaz para la entrada del flujo.
 */

import {ai, getActiveAIModel} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSyllabusSummaryInputSchema = z.object({
  unitName: z.string().describe('The name of the didactic unit.'),
});
export type GenerateSyllabusSummaryInput = z.infer<typeof GenerateSyllabusSummaryInputSchema>;

const generateSyllabusSummaryFlow = ai.defineFlow(
  {
    name: 'generateSyllabusSummaryFlow',
    inputSchema: GenerateSyllabusSummaryInputSchema,
    outputSchema: z.string(),
  },
  async ({unitName}) => {
    const model = await getActiveAIModel();
    
    console.log(`[IA FLOW] Iniciando generación para "${unitName}"...`);

    const {text} = await ai.generate({
      model,
      prompt: `Eres un experto diseñador de currículos académicos. Genera una sumilla concisa y profesional para una unidad didáctica titulada "${unitName}". La sumilla debe describir la naturaleza, propósito y contenido principal de la unidad. El resultado debe ser únicamente el texto de la sumilla, sin títulos ni introducciones.`,
    });
    
    console.log(`[IA FLOW] Generación completada con éxito.`);
    return text;
  }
);

/**
 * Función pública envuelta para ser usada como Server Action.
 */
export async function generateSyllabusSummary(input: GenerateSyllabusSummaryInput): Promise<string> {
  try {
    return await generateSyllabusSummaryFlow(input);
  } catch (error: any) {
    console.error("[IA FLOW ERROR]", error);
    
    // Capturamos específicamente el error de cuota de Google
    if (error.message?.includes('RESOURCE_EXHAUSTED') || error.message?.includes('429')) {
      throw new Error("CUOTA_AGOTADA: El servicio de Google AI ha agotado sus créditos gratuitos. Por favor, asegúrate de haber guardado Ollama como proveedor activo en el panel de SuperAdmin.");
    }
    
    throw new Error(error.message || "Error desconocido al procesar la solicitud de IA.");
  }
}
