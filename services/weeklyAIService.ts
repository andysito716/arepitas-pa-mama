import { GoogleGenAI } from "@google/genai";
import { AIParseResult, WeekInfo } from "../types/weekly";
import { formatDateToYMD } from "./weeklyDateUtils";

export async function parseSalesFromMessageWithAI(
  message: string,
  weekInfo: WeekInfo
): Promise<AIParseResult> {
  const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' ? (window as any).GEMINI_API_KEY : '');

  // Days list for the AI to pick the right target date
  const daysListStr = weekInfo.days
    .map(d => `${d.dayName} (${d.date})`)
    .join(', ');

  const prompt = `
Eres un asistente contable e inteligente de ventas para un negocio de comida y comercio.
El usuario te enviará un mensaje libre (puede ser un texto de WhatsApp, nota rápida o transcripción de audio).

Tu tarea es:
1. DISTINGUIR QUÉ ES UNA VENTA REAL DE UN PRODUCTO Y QUÉ NO ES UNA VENTA.
   - VENTA: "3 arepas de queso a 2500", "le vendí 4 empanadas a Carlos a 3000 c/u", "2 jugos mora 3000 pagó María", "pedido de 10 arepas a 2000 cada una".
   - NO ES VENTA (debe ignorarse): Saludos ("Hola buenas tardes"), compras de insumos o gastos ("compré 5 kilos de queso", "pagar luz"), recordatorios ("acordarse de limpiar", "mañana no abrimos"), comentarios del clima ("hizo mucho frío hoy"), dudas o preguntas.

2. PARA CADA VENTA DETECTADA:
   - productName: Nombre limpio del producto (ej: "Arepa de Queso", "Jugo de Mora", "Empanada de Carne").
   - quantity: Cantidad vendida (número entero positivo, por defecto 1 si no se especifica).
   - price: Precio UNITARIO de venta (si dicen "2 por 5000", el precio unitario es 2500). Si no dice precio, estima un precio razonable o 0.
   - cost: Costo unitario de producción si se menciona (o 0 si no se menciona).
   - buyerName: Nombre del comprador si aparece en el texto (o "Cliente").
   - buyerType: "comprador" o "distribuidor" (si menciona precio mayorista o distribuidor).
   - date: Fecha en formato "YYYY-MM-DD" que corresponda. Los días de la semana actual son: [${daysListStr}]. Si no menciona día específico, usa la fecha de hoy: "${formatDateToYMD(new Date())}".
   - dayName: Nombre del día ("Lunes", "Martes", etc.).
   - confidence: Número entre 0.0 y 1.0 indicando qué tan seguro estás de que es una venta.
   - reasoning: Breve explicación (ej: "Se detectó producto 'Arepa de Queso' con cantidad 3 y precio unitario $2500").

3. PARA LO QUE NO ES VENTA:
   - Agregarlo a "ignoredItems" con el texto ignorado y la razón (ej: "texto": "comprar queso mañana", "reason": "Es un recordatorio de compra de insumos, no una venta realizada").

4. summary:
   - Un breve resumen en una frase (ej: "Se identificaron 2 ventas válidas y se descartaron 2 comentarios.").

MENSAJE DEL USUARIO:
"""
${message}
"""

Responde ESTRICTAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "detectedSales": [
    {
      "productName": string,
      "quantity": number,
      "price": number,
      "cost": number,
      "buyerName": string,
      "buyerType": "comprador" | "distribuidor",
      "date": string,
      "dayName": string,
      "confidence": number,
      "reasoning": string
    }
  ],
  "ignoredItems": [
    {
      "text": string,
      "reason": string
    }
  ],
  "summary": string
}
`;

  try {
    if (!apiKey) {
      console.warn("No GEMINI_API_KEY available, using smart heuristic parser fallback.");
      return fallbackHeuristicParser(message, weekInfo);
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    const detectedSales = Array.isArray(parsed.detectedSales)
      ? parsed.detectedSales.map((item: any, idx: number) => ({
          id: `ai_${Date.now()}_${idx}`,
          productName: String(item.productName || 'Producto'),
          quantity: Math.max(1, Number(item.quantity) || 1),
          price: Number(item.price) || 0,
          cost: Number(item.cost) || 0,
          buyerName: String(item.buyerName || 'Cliente').trim(),
          buyerType: item.buyerType === 'distribuidor' ? 'distribuidor' : 'comprador',
          date: item.date || formatDateToYMD(new Date()),
          dayName: item.dayName || 'Hoy',
          confidence: Number(item.confidence) || 0.95,
          reasoning: item.reasoning || 'Detectado por IA'
        }))
      : [];

    const ignoredItems = Array.isArray(parsed.ignoredItems)
      ? parsed.ignoredItems.map((item: any) => ({
          text: String(item.text || ''),
          reason: String(item.reason || 'No es una venta')
        }))
      : [];

    return {
      detectedSales,
      ignoredItems,
      summary: parsed.summary || `Se detectaron ${detectedSales.length} ventas.`
    };
  } catch (error) {
    console.error("Gemini AI Parsing error, using local fallback parser:", error);
    return fallbackHeuristicParser(message, weekInfo);
  }
}

/**
 * Intelligent Local Heuristic Fallback Parser
 * Works completely offline or when API key is not present.
 */
function fallbackHeuristicParser(message: string, weekInfo: WeekInfo): AIParseResult {
  const todayYMD = formatDateToYMD(new Date());
  const todayDay = weekInfo.days.find(d => d.date === todayYMD) || weekInfo.days[0];

  const lines = message
    .split(/[\n;,\.]/)
    .map(l => l.trim())
    .filter(l => l.length > 2);

  const detectedSales: any[] = [];
  const ignoredItems: { text: string; reason: string }[] = [];

  const nonSalesKeywords = [
    'hola', 'buenas', 'buenos', 'gracias', 'adios', 'chao',
    'comprar', 'compré', 'compre', 'gasto', 'pagar', 'pago el recibo',
    'luz', 'agua', 'arriendo', 'gas', 'recordar', 'acuérdate', 'acuerdate',
    'mañana no', 'cerrado', 'abierto', 'lluvia', 'pedir masa', 'insumos'
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Check if it's an ignored item
    const isNonSale = nonSalesKeywords.some(kw => lower.includes(kw) && !lower.includes('vendí') && !lower.includes('vendi'));
    if (isNonSale) {
      ignoredItems.push({
        text: line,
        reason: 'Frase identificada como saludo, gasto, insumo o recordatorio (no es venta).'
      });
      continue;
    }

    // Try to extract quantity, product, price, buyer
    // Patterns like: "3 arepas de queso a 2500 a Carlos"
    // "5 empanadas 3000 Juan"
    const numberMatch = line.match(/^(\d+)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)(?:\s+(?:a|\$|por)\s*(\d+(?:\.\d+)?))?(?:\s+(?:a|para|cliente)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+))?$/i);
    const saleVerbMatch = line.match(/(?:vendí|vendi|se vendieron|venta de)\s+(\d+)?\s*([a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+?)(?:\s+(?:a|\$|por)\s*(\d+))?(?:\s+(?:a|para)\s+([a-zA-ZáéíóúÁÉÍÓÚñÑ]+))?$/i);

    if (numberMatch || saleVerbMatch) {
      const match = numberMatch || saleVerbMatch;
      const qty = parseInt(match![1] || '1', 10);
      let prod = (match![2] || 'Producto').trim();
      let rawPrice = match![3] ? parseInt(match![3].replace(/\D/g, ''), 10) : 2500;
      let buyer = (match![4] || 'Cliente').trim();

      // Clean up product string
      prod = prod.replace(/^(de|del|unos|unas|los|las)\s+/i, '');
      if (prod.length < 2) prod = 'Arepa Especial';

      detectedSales.push({
        id: `local_${Date.now()}_${i}`,
        productName: prod.charAt(0).toUpperCase() + prod.slice(1),
        quantity: isNaN(qty) || qty <= 0 ? 1 : qty,
        price: isNaN(rawPrice) ? 2500 : rawPrice,
        cost: 0,
        buyerName: buyer.charAt(0).toUpperCase() + buyer.slice(1),
        buyerType: 'comprador',
        date: todayDay.date,
        dayName: todayDay.dayName,
        confidence: 0.88,
        reasoning: 'Patrón de venta reconocido localmente'
      });
    } else {
      // If it doesn't match a clear sale pattern, check if it has a price or product word
      const hasNumber = /\d+/.test(line);
      const foodWords = ['arepa', 'empanada', 'jugo', 'queso', 'carne', 'pollo', 'bebida', 'gaseosa', 'porcion'];
      const hasFood = foodWords.some(fw => lower.includes(fw));

      if (hasFood && hasNumber) {
        const qtyMatch = line.match(/\b(\d+)\b/);
        const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
        const prices = line.match(/\b(\d{3,6})\b/g);
        const price = prices && prices.length > 0 ? parseInt(prices[prices.length - 1], 10) : 2500;

        detectedSales.push({
          id: `local_${Date.now()}_${i}`,
          productName: line.replace(/\d+/g, '').replace(/\b(a|por|de|para|cliente)\b/gi, '').trim() || 'Arepa',
          quantity: qty > 50 ? 1 : qty,
          price: price,
          cost: 0,
          buyerName: 'Cliente',
          buyerType: 'comprador',
          date: todayDay.date,
          dayName: todayDay.dayName,
          confidence: 0.75,
          reasoning: 'Alimento y valores identificados en la oración'
        });
      } else {
        ignoredItems.push({
          text: line,
          reason: 'Texto sin patrón claro de venta o cantidades'
        });
      }
    }
  }

  return {
    detectedSales,
    ignoredItems,
    summary: detectedSales.length > 0 
      ? `Se detectaron ${detectedSales.length} ventas automáticamente (${ignoredItems.length} descartadas).`
      : `No se identificaron ventas válidas en el mensaje.`
  };
}
