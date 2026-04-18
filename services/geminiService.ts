
import { GoogleGenAI } from "@google/genai";
import { Sale } from "../types";

export const getBusinessInsights = async (sales: Sale[], advanced: boolean = false): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const salesSummary = sales.map(s => 
    `- ${s.date}: ${s.productName} (Costo: $${s.cost}, Precio: $${s.price}, Cantidad: ${s.quantity}) -> Total: $${s.price * s.quantity}`
  ).join('\n');

  let prompt = `
    Analiza los siguientes datos de ventas de mi negocio "Arepitas pa' Mamá":
    ${salesSummary}
  `;

  if (advanced) {
    prompt += `
      Como mi ASESOR ESTRATÉGICO AVANZADO, realiza lo siguiente:
      1. ASESOR DE PRECIOS: Analiza si los precios son adecuados comparados con el costo unitario. Sugiere aumentos específicos si el margen es muy bajo.
      2. PREDICCIÓN DE VENTAS: Basado en las fechas y cantidades, predice cuánta masa o ingredientes debería preparar para los próximos días.
      3. CONSEJOS VIP: Dame una estrategia de oro para duplicar las ventas esta semana.

      Responde con títulos llamativos y emojis. Sé muy específico con números.
    `;
  } else {
    prompt += `
      Proporcióname 3 consejos estratégicos breves y motivadores para aumentar mis ganancias.
    `;
  }

  prompt += `\nResponde en español, con un tono profesional, motivador y amigable.`;

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
    return "Error al conectar con la IA. Asegúrate de que la clave API esté configurada.";
  }
};

export const extractSalesFromText = async (rawText: string): Promise<Omit<Sale, 'id' | 'cost'>[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const prompt = `
    Analiza el siguiente texto extraído de un archivo (posiblemente Excel o PDF) que contiene registros de ventas de "Arepitas pa' Mamá".
    Tu objetivo es extraer una lista de ventas estructurada en formato JSON.
    
    Cada venta debe tener:
    - productName (ej: "Arepa de Queso")
    - price (número)
    - quantity (número)
    - buyerName (ej: "Juan Perez" o "Anónimo")
    - buyerType ("comprador" o "distribuidor")
    - date (en formato DD/MM/AAAA)
    - color (opcional, ej: "#ff0000" o nombre de color CSS)

    TEXTO A ANALIZAR:
    """
    ${rawText}
    """

    Responde ÚNICAMENTE con el arreglo JSON, sin texto adicional ni bloques de código. Si no encuentras ventas, responde con [].
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });
    
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return [];
  }
};
