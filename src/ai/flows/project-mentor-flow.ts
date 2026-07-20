'use server';
/**
 * @fileOverview Flow para el Mentor Inteligente de Proyectos STEM con Orquestación Dual.
 * 
 * Este módulo intenta obtener una respuesta de los proveedores disponibles de forma secuencial.
 * Si el proveedor primario falla (ej. cuota agotada de Google), salta automáticamente al secundario (Ollama).
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
 * Server Action con Lógica de Resiliencia Total.
 * Intenta los modelos disponibles sin importar la configuración activa si ocurre un error.
 */
export async function mentorProject(input: ProjectMentorInput): Promise<string> {
  const { primary, fallback } = await getAIModelsWithFailover();
  
  let lastError = null;

  // INTENTO 1: Modelo Preferido
  try {
    console.log(`[CEREBRO IA] Intentando con proveedor primario...`);
    const { text } = await projectMentorPrompt(input, { model: primary });
    if (text) return text;
  } catch (error: any) {
    lastError = error;
    console.warn(`[CEREBRO IA] Falló proveedor primario: ${error.message}`);
  }

  // INTENTO 2: Modelo de Respaldo (Si existe)
  if (fallback) {
    try {
      console.log(`[CEREBRO IA] Saltando a proveedor de respaldo automático...`);
      const { text } = await projectMentorPrompt(input, { model: fallback });
      if (text) {
        return "*(Nota: Respuesta generada por el motor de respaldo institucional)* \n\n" + text;
      }
    } catch (error: any) {
      console.error(`[CEREBRO IA] El respaldo también falló: ${error.message}`);
      lastError = error;
    }
  }

  // Si llegamos aquí es que nada funcionó
  const errorDetails = lastError?.message || "Servicios de IA no disponibles en este momento.";
  throw new Error(`IA_SYSTEM_FAILURE: ${errorDetails}`);
}
