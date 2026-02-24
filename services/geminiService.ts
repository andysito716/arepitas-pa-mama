
import { GoogleGenAI } from "@google/genai";
import { Sale } from "../types";

export const getBusinessInsights = async (sales: Sale[]): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const salesSummary = sales.map(s => 
    `- ${s.date}: ${s.productName} vendido a ${s.buyerName} por $${s.price * s.quantity}`
  ).join('\n');

  const prompt = `
    Analiza los siguientes datos de ventas de mi negocio y proporcióname 3 consejos estratégicos breves y motivadores para aumentar mis ganancias.
    Los datos son:
    ${salesSummary}
    
    Responde en español, con un tono profesional y amigable.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        temperature: 0.7,
      },
    });
    return response.text || "No se pudieron generar sugerencias en este momento.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error al conectar con la IA para obtener insights.";
  }
};
