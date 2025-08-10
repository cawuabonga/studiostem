
'use server';
/**
 * @fileOverview A flow for generating a conceptual image for a didactic unit.
 * This flow is currently disabled to prevent costs.
 * - generateUnitImage - A function that takes a unit name and returns an image data URI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateUnitImageInputSchema = z.object({
  unitName: z.string().describe('The name of the didactic unit.'),
});
type GenerateUnitImageInput = z.infer<
  typeof GenerateUnitImageInputSchema
>;

export const generateUnitImage = ai.defineFlow(
  {
    name: 'generateUnitImageFlow',
    inputSchema: GenerateUnitImageInputSchema,
    outputSchema: z.string(),
  },
  async ({unitName}) => {
    // AI image generation is currently disabled to control costs.
    // Return a placeholder image URL instead.
    console.log(`Image generation for "${unitName}" skipped due to cost control.`);
    const placeholderUrl = `https://placehold.co/600x400.png?text=${encodeURIComponent(unitName)}`;
    return placeholderUrl;

    /*
    // Original AI generation code - UNCOMMENT TO RE-ENABLE
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: `Generate a minimalist, conceptual, and educational-themed image for a course titled "${unitName}". The style should be modern, clean, and abstract. Use a professional and inspiring color palette.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        safetySettings: [
            {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE',
            },
            {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_ONLY_HIGH',
            },
             {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_ONLY_HIGH',
            }
        ]
      },
    });

    if (!media?.url) {
        throw new Error('Image generation failed to return a valid media object.');
    }

    return media.url;
    */
  }
);
