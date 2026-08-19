/**
 * Servicio de Inteligencia Artificial para Obra Control vía OpenRouter (Modelos Free).
 * Soporta:
 * 1. Redacción y Perfeccionamiento Técnico de Partes Diarios (Texto).
 * 2. Visión Artificial y OCR para Albaranes y Tickets de Compra (Multimodal).
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export const DEFAULT_FREE_TEXT_MODEL = 'google/gemini-2.0-flash-lite-preview-02-05:free';
export const DEFAULT_FREE_VISION_MODEL = 'google/gemini-2.0-flash-lite-preview-02-05:free';

export const AVAILABLE_FREE_MODELS = [
  { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Gemini 2.0 Flash Lite (Free - Rápido & Visión)', vision: true },
  { id: 'qwen/qwen-2.5-vl-72b-instruct:free', name: 'Qwen 2.5 VL 72B (Free - Especialista en Visión & OCR)', vision: true },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Free - Redacción Avanzada)', vision: false },
  { id: 'mistralai/mistral-small-24b-instruct-2501:free', name: 'Mistral Small 24B (Free - Muy rápido en Español)', vision: false }
];

/**
 * Obtiene la API Key configurada
 */
export const getOpenRouterApiKey = (empresa = {}) => {
  return (
    empresa?.openRouterApiKey ||
    localStorage.getItem('__obracontrol_openrouter_key__') ||
    import.meta.env.VITE_OPENROUTER_API_KEY ||
    ''
  ).trim();
};

/**
 * Prueba la conexión con OpenRouter
 */
export const testAiConnection = async (apiKey, model = DEFAULT_FREE_TEXT_MODEL) => {
  if (!apiKey) {
    throw new Error('No has introducido ninguna API Key de OpenRouter.');
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://platform-construc.netlify.app',
      'X-Title': 'Obra Control'
    },
    body: JSON.stringify({
      model: model || DEFAULT_FREE_TEXT_MODEL,
      messages: [
        { role: 'user', content: 'Responde únicamente con la palabra "CONECTADO".' }
      ],
      max_tokens: 10
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || `Error de conexión OpenRouter (${response.status})`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content?.trim() || '';
  return text.length > 0;
};

/**
 * 1. Redactor Técnico Profesional con IA
 * Transforma dictados coloquiales de obra en redacciones formales de dirección facultativa.
 */
export const refinarTextoTecnicoIA = async ({ textoBorrador, tipo = 'trabajos', empresa = {} }) => {
  if (!textoBorrador || textoBorrador.trim().length === 0) {
    throw new Error('Por favor escribe o dicta algo de texto antes de pedirle a la IA que lo mejore.');
  }

  const apiKey = getOpenRouterApiKey(empresa);
  if (!apiKey) {
    throw new Error('Debes configurar tu API Key gratuita de OpenRouter en la pestaña Configuración para usar la IA.');
  }

  const model = empresa?.openRouterModel || DEFAULT_FREE_TEXT_MODEL;

  const systemPrompt = `Eres un Jefe de Obra y Aparejador / Arquitecto Técnico experto en edificación y reformas en España.
Tu función es transformar notas rápidas o dictados por voz coloquiales tomados a pie de obra en una REDACCIÓN TÉCNICA PROFESIONAL, clara, formal y concisa, apta para partes oficiales de trabajo y entrega a la Dirección Facultativa y al Cliente.

REGLAS ESTRICTAS:
1. Emplea terminología técnica adecuada de construcción (ej: paramentos, apertura de rozas, canalizaciones, soleras, revestimientos, enlucido, alicatado, replanteo, etc.).
2. NUNCA inventes trabajos ni cantidades que el usuario no haya mencionado. Mantén fielmente la información original.
3. Corrige faltas ortográficas y gramaticales derivadas del dictado por voz.
4. Devuelve ÚNICAMENTE el texto redactado en español, sin saludos, sin explicaciones, sin títulos ni comillas.`;

  const userPrompt = `Tipo de sección: ${tipo === 'incidencias' ? 'Incidencias / Avisos de Obra' : 'Trabajos Realizados en la jornada'}.
Texto original a transformar:
"${textoBorrador}"`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://platform-construc.netlify.app',
        'X-Title': 'Obra Control'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Error en la llamada a OpenRouter (${response.status})`);
    }

    const data = await response.json();
    const resultText = data?.choices?.[0]?.message?.content?.trim() || '';
    if (!resultText) {
      throw new Error('La IA no devolvió respuesta.');
    }

    return resultText;
  } catch (err) {
    console.error('Error refinarTextoTecnicoIA:', err);
    throw err;
  }
};

/**
 * 2. Visión IA y OCR para Albaranes y Tickets
 * Analiza la imagen en Base64 y extrae los datos clave en JSON estructurado.
 */
export const extraerDatosAlbaranIA = async ({ imageBase64, empresa = {} }) => {
  if (!imageBase64) {
    throw new Error('No se ha proporcionado ninguna imagen para analizar.');
  }

  const apiKey = getOpenRouterApiKey(empresa);
  if (!apiKey) {
    throw new Error('Debes configurar tu API Key gratuita de OpenRouter en la pestaña Configuración para usar la lectura de albaranes con IA.');
  }

  const visionModel = DEFAULT_FREE_VISION_MODEL;

  // Formatear base64 si no incluye prefijo
  let formattedImageUrl = imageBase64;
  if (!formattedImageUrl.startsWith('data:')) {
    formattedImageUrl = `data:image/jpeg;base64,${imageBase64}`;
  }

  const prompt = `Analiza la imagen de este albarán o ticket de compra de materiales de construcción y extrae los datos en formato JSON estrictamente válido.

Debes responder ÚNICAMENTE con un bloque JSON con esta estructura exacta:
{
  "proveedor": "Nombre de la empresa o almacén emisor (ej: Suministros Ibiza)",
  "numero": "Número de albarán o factura (ej: ALB-2026/41)",
  "fecha": "Fecha si es visible en formato YYYY-MM-DD o vacía",
  "importe": 0.00,
  "conceptos": "Breve resumen de materiales detectados en una línea"
}

REGLAS:
- Si no estás seguro del importe exacto, extrae el TOTAL final a pagar con IVA/impuestos en euros (número flotante, ej: 145.50).
- Si algún campo no es legible, pon una cadena vacía o 0.
- NO agregues texto antes ni después del JSON. Solo el objeto JSON.`;

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://platform-construc.netlify.app',
        'X-Title': 'Obra Control'
      },
      body: JSON.stringify({
        model: visionModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: formattedImageUrl
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Error al procesar albarán con OpenRouter (${response.status})`);
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content?.trim() || '';

    // Extraer JSON limpio eliminando backticks markdown si vienen incluidos
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('La IA no pudo estructurar los datos del albarán.');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      proveedor: parsed.proveedor || '',
      numero: parsed.numero || '',
      fecha: parsed.fecha || '',
      importe: parseFloat(parsed.importe) || 0,
      conceptos: parsed.conceptos || ''
    };

  } catch (err) {
    console.error('Error extraerDatosAlbaranIA:', err);
    throw err;
  }
};
