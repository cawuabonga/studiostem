'use server';
/**
 * @fileOverview Flow para el Mentor Inteligente de Proyectos STEM.
 * 
 * - mentorProject: Función que guía al alumno basándose en el contexto dinámico del proyecto.
 * - ProjectMentorInput: Interfaz para el contexto inyectado (objetivos, rúbricas, entrada).
 */

import {ai, getActiveAIModel} from '@/ai/genkit';
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

const projectMentorFlow = ai.defineFlow(
  {
    name: 'projectMentorFlow',
    inputSchema: ProjectMentorInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    const model = await getActiveAIModel();
    console.log(`[MENTOR IA] Procesando consulta para: ${input.projectTitle}`);

    const { text } = await projectMentorPrompt(input, { model });
    
    return text;
  }
);

/**
 * Server Action wrapper con reporte de errores mejorado y detección de cuota agotada.
 */
export async function mentorProject(input: ProjectMentorInput): Promise<string> {
  try {
    return await projectMentorFlow(input);
  } catch (error: any) {
    console.error("[MENTOR FLOW ERROR]", error);

    const message = error.message || "";
    
    // Capturamos específicamente el error de cuota de Google
    if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
      throw new Error("CUOTA_AGOTADA: El servicio de Google AI ha agotado sus créditos. Por favor, asegúrate de haber guardado Ollama como proveedor activo en el panel de SuperAdmin y que tu PC local esté encendida con ngrok.");
    }

    // Capturamos error de configuración de Ollama
    if (message.includes('ERROR_CONFIG_OLLAMA')) {
        throw new Error(message);
    }
    
    throw new Error(`IA_SERVICE_ERROR: ${message || "Error desconocido en el servidor de IA."}`);
  }
}
