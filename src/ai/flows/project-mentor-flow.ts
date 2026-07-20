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
 * Server Action wrapper con Lógica de Orquestación Dual.
 * Intenta secuencialmente los modelos disponibles (Google / Ollama) para garantizar alta disponibilidad.
 */
export async function mentorProject(input: ProjectMentorInput): Promise<string> {
  const { primary, fallback } = await getAIModelsWithFailover();
  
  console.log(`[MENTOR IA] Iniciando consulta con orquestación dual...`);
  let lastError = null;

  // INTENTO 1: Proveedor Preferido (Configurado por el SuperAdmin)
  try {
    const { text } = await projectMentorPrompt(input, { model: primary });
    if (text) return text;
  } catch (error: any) {
    lastError = error;
    console.warn(`[MENTOR IA] Intento 1 falló (${error.message}). Probando respaldo...`);
  }

  // INTENTO 2: Proveedor de Respaldo (Si existe configuración de Ollama)
  if (fallback) {
    try {
      console.log(`[MENTOR IA] Ejecutando respaldo local...`);
      const { text } = await projectMentorPrompt(input, { model: fallback });
      if (text) {
          return "*(Nota: Respuesta generada por el servidor local de respaldo)* \n\n" + text;
      }
    } catch (error: any) {
      console.error(`[MENTOR IA] El respaldo también falló: ${error.message}`);
      lastError = error;
    }
  }

  // Si ambos fallan, devolvemos un error descriptivo
  const finalError = lastError?.message || "Servicios de IA no disponibles.";
  throw new Error(`IA_SERVICE_ERROR: ${finalError}`);
}
