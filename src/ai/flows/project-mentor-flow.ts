'use server';
/**
 * @fileOverview Flow para el Mentor Inteligente de Proyectos STEM.
 * Respeta estrictamente el proveedor de IA configurado por el SuperAdmin.
 */

import {ai, getActiveAIConfig} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectMentorInputSchema = z.object({
  projectTitle: z.string().catch('Sin título'),
  objective: z.string().catch('No definido'),
  competencies: z.string().catch('No definidas'),
  rubrics: z.string().catch('No hay rúbricas'),
  userInput: z.string(),
});
export type ProjectMentorInput = z.infer<typeof ProjectMentorInputSchema>;

/**
 * Esquema de salida que incluye el texto generado y el nombre del proveedor utilizado.
 */
const ProjectMentorOutputSchema = z.object({
  text: z.string(),
  provider: z.string(),
});
export type ProjectMentorOutput = z.infer<typeof ProjectMentorOutputSchema>;

const projectMentorPrompt = ai.definePrompt({
  name: 'projectMentorPrompt',
  input: { schema: ProjectMentorInputSchema },
  prompt: `Eres el "Mentor STEM", un asistente especializado en metodología ABP (Aprendizaje Basado en Proyectos).
      Tu misión es guiar a los estudiantes en su reto académico sin darles la solución directamente.
      
      CONTEXTO DEL PROYECTO ACTUAL:
      - Título: {{{projectTitle}}}
      - Objetivo: {{{objective}}}
      - Competencias: {{{competencies}}}
      - Criterios de Evaluación (Rúbricas): {{{rubrics}}}

      INSTRUCCIONES DE COMPORTAMIENTO:
      1. Responde de forma motivadora y profesional.
      2. Usa analogías técnicas si el proyecto es de ingeniería o fabricación.
      3. Asegúrate de que tus sugerencias ayuden al alumno a cumplir con las rúbricas mencionadas arriba.
      4. Si el alumno está atascado, sugiere pasos de investigación o experimentación física en el Fab Lab si aplica.
      
      CONSULTA DEL ALUMNO:
      {{{userInput}}}`,
});

/**
 * Server Action que ejecuta la petición al modelo configurado.
 */
export async function mentorProject(input: ProjectMentorInput): Promise<ProjectMentorOutput> {
  const { model, providerName } = await getActiveAIConfig();
  
  try {
    const { text } = await projectMentorPrompt(input, { model });
    return {
        text: text || "No se pudo generar una respuesta.",
        provider: providerName
    };
  } catch (error: any) {
    console.error("[MENTOR FLOW ERROR]", error);
    // Lanza el error original para que el frontend sepa que ese motor falló (ej. cuota agotada)
    throw new Error(`IA_SYSTEM_FAILURE: ${error.message}`);
  }
}
