import { GoogleGenAI } from "@google/genai";
import { StudySession } from '../types';

// Initialize Gemini client safely
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateStudyInsights = async (sessions: StudySession[]): Promise<string> => {
  if (!apiKey) {
    return "API Key no configurada. Por favor verifica tu entorno.";
  }

  if (sessions.length === 0) {
    return "Aún no tienes sesiones registradas. ¡Empieza a estudiar para recibir consejos!";
  }

  // Prepare a summary of the last 10 sessions for context
  const recentSessions = sessions.slice(0, 20).map(s => ({
    subject: s.subject,
    durationMinutes: Math.round(s.durationSeconds / 60),
    date: new Date(s.endTime).toLocaleDateString()
  }));

  const prompt = `
    Actúa como un coach de productividad experto. 
    Analiza los siguientes datos de sesiones de estudio recientes de un estudiante y proporciona:
    1. Un breve análisis de sus hábitos (patrones, categorías más utilizadas).
    2. 3 consejos prácticos y motivadores para mejorar su rendimiento basados en estos datos.
    3. Usa un tono amigable y motivador. Responde en español y usa formato Markdown.
    
    Datos: ${JSON.stringify(recentSessions)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No se pudo generar el consejo.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocurrió un error al conectar con tu coach de IA. Inténtalo más tarde.";
  }
};