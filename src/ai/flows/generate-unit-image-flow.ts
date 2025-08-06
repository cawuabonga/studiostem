
'use server';
/**
 * @fileOverview A flow for generating a conceptual image for a didactic unit.
 *
 * - generateUnitImage - A function that takes a unit name and returns an image data URI.
 * - GenerateUnitImageInput - The input type for the generateUnitImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GenerateUnitImageInputSchema = z.object({
  unitName: z.string().describe('The name of the didactic unit.'),
});
export type GenerateUnitImageInput = z.infer<
  typeof GenerateUnitImageInputSchema
>;

export async function generateUnitImage(
  input: GenerateUnitImageInput
): Promise<string> {
  const {media} = await generateUnitImageFlow(input);
  return media.url;
}

const generateUnitImageFlow = ai.defineFlow(
  {
    name: 'generateUnitImageFlow',
    inputSchema: GenerateUnitImageInputSchema,
    outputSchema: z.any(),
  },
  async ({unitName}) => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a minimalist, conceptual, and educational-themed image for a course titled "${unitName}". The style should be modern, clean, and abstract. Use a professional and inspiring color palette.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {media};
  }
);
