'use server';
/**
 * @fileOverview A flow for generating a syllabus summary (sumilla).
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const GenerateSyllabusSummaryInputSchema = z.object({
  unitName: z.string().describe('The name of the didactic unit.'),
});
type GenerateSyllabusSummaryInput = z.infer<typeof GenerateSyllabusSummaryInputSchema>;

export const generateSyllabusSummary = ai.defineFlow(
  {
    name: 'generateSyllabusSummaryFlow',
    inputSchema: GenerateSyllabusSummaryInputSchema,
    outputSchema: z.string(),
  },
  async ({unitName}) => {
    const {text} = await ai.generate({
      prompt: `Eres un experto diseñador de currículos académicos. Genera una sumilla concisa y profesional para una unidad didáctica titulada "${unitName}". La sumilla debe describir la naturaleza, propósito y contenido principal de la unidad. El resultado debe ser únicamente el texto de la sumilla, sin títulos ni introducciones.`,
    });
    return text;
  }
);
