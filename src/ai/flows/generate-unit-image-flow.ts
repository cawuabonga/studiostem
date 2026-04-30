'use server';
/**
 * @fileOverview Flow para la generación de imágenes conceptuales de unidades didácticas.
 * 
 * - generateUnitImage: Función que devuelve una imagen (actualmente un placeholder por control de costos).
 * - GenerateUnitImageInput: Interfaz para la entrada del flujo.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateUnitImageInputSchema = z.object({
  unitName: z.string().describe('The name of the didactic unit.'),
});
export type GenerateUnitImageInput = z.infer<typeof GenerateUnitImageInputSchema>;

/**
 * Genera una imagen conceptual para una unidad didáctica.
 */
export async function generateUnitImage(input: GenerateUnitImageInput): Promise<string> {
    return generateUnitImageFlow(input);
}

const generateUnitImageFlow = ai.defineFlow(
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
  }
);
