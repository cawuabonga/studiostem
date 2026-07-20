'use server';
/**
 * @fileOverview Flow para el Mentor Inteligente de Proyectos STEM.
 * 
 * - mentorProject: Función que guía al alumno basándose en el contexto dinámico del proyecto.
 * - ProjectMentorInput: Interfaz para el contexto inyectado (objetivos, rúbricas, entrada).
 */

import {ai, getAIModelsWithFailover} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectMentorInputSchema = z.object({
  projectTitle: z.string().catch('Sin título').describe('The title of the project.'),
  objective: z.string().catch('No definido').describe('Main goal of the project.'),
  competencies: z.string().catch('No definidas').describe('Academic competencies involved.'),
  rubrics: z.string().catch('No hay rúbricas').describe('The evaluation criteria/rubrics as text.'),
  userInput: z.string().describe('The student question or status update.'),
});
export type ProjectMentorInput = z.infer<typeof ProjectMentorInputSchema>;

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
 * Server Action wrapper con lógica de Failover Inteligente.
 * Si el proveedor principal falla por cuota, intenta con el respaldo (Ollama).
 */
export async function mentorProject(input: ProjectMentorInput): Promise<string> {
  const { primary, fallback } = await getAIModelsWithFailover();
  
  try {
    console.log(`[MENTOR IA] Intento inicial con proveedor principal...`);
    const { text } = await projectMentorPrompt(input, { model: primary });
    return text;
  } catch (error: any) {
    const errorMessage = error.message || "";
    const isQuotaError = errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429');

    // SI FALLA GOOGLE POR CUOTA Y TENEMOS OLLAMA, SALTAMOS AUTOMÁTICAMENTE
    if (isQuotaError && fallback) {
        console.warn("[MENTOR IA] Cuota de Google agotada. Saltando a OLLAMA local...");
        try {
            const { text } = await projectMentorPrompt(input, { model: fallback });
            return "*(Nota: Usando respaldo local por alta demanda)* \n\n" + text;
        } catch (fallbackError: any) {
            console.error("[MENTOR IA] Falló también el respaldo:", fallbackError.message);
            throw new Error("SERVICIO_IA_INDISPONIBLE: Ni Google ni Ollama están respondiendo. Verifica tu conexión ngrok.");
        }
    }

    console.error("[MENTOR FLOW ERROR]", error);
    throw new Error(`IA_SERVICE_ERROR: ${errorMessage}`);
  }
}
