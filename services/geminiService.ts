
import { GoogleGenAI } from "@google/genai";
import { Sale, DailyArchive } from "../types";

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

export const askBusinessChat = async (question: string, context: { sales: Sale[], history: DailyArchive[] }): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  
  const salesSummary = context.sales.map(s => 
    `- ${s.date}: ${s.productName} ($${s.price}, Cantidad: ${s.quantity})`
  ).join('\n');

  const historySummary = context.history.slice(0, 5).map(h => 
    `- ${h.date}: Ingresos $${h.totalRevenue}, Utilidad $${h.totalProfit}`
  ).join('\n');

  const prompt = `
    Eres el "Asesor de Arepitas pa' Mamá", un experto en gestión de negocios gastronómicos y asistente técnico del programa.
    
    CONTEXTO DEL NEGOCIO:
    Ventas abiertas hoy:
    ${salesSummary || 'No hay ventas abiertas hoy.'}
    
    Resumen últimos cierres:
    ${historySummary || 'No hay historial registrado aún.'}

    PREGUNTA DEL USUARIO:
    "${question}"

    INSTRUCCIONES:
    1. Si pregunta sobre sus ventas o dinero, usa los datos proporcionados arriba.
    2. Si pregunta sobre cómo usar el programa (ventas, costos, historial, excel, etc.), explícale de forma sencilla.
    3. Responde siempre en español, con un tono muy motivador, amigable y profesional.
    4. Usa emojis para que la lectura sea amena.
    5. Sé breve pero útil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Lo siento, tuve un problema al procesar tu duda.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Ups, parece que perdí la conexión. ¿Podrías repetirme la pregunta?";
  }
};
