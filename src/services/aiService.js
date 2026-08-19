/**
 * Servicio de Inteligencia Artificial para Obra Control vía OpenRouter (Modelos Free Oficiales).
 * Soporta sincronización en tiempo real con la API de OpenRouter (/api/v1/models)
 * para garantizar que la lista de modelos gratuitos siempre esté 100% actualizada.
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

export const DEFAULT_FREE_TEXT_MODEL = 'google/gemma-4-31b-it:free';
export const DEFAULT_FREE_VISION_MODEL = 'nvidia/nemotron-nano-12b-v2-vl:free';

// Lista base verificada de modelos Free oficiales de OpenRouter
export const VERIFIED_FREE_MODELS = [
  { 
    id: 'openrouter/free', 
    name: 'OpenRouter Free Router (Auto - Enrutador Oficial Gratuito)', 
    vision: true,
    description: 'Enruta automáticamente al mejor modelo gratuito disponible'
  },
  { 
    id: 'google/gemma-4-31b-it:free', 
    name: 'Google: Gemma 4 31B (Free - Excelente Redacción en Español)', 
    vision: false,
    description: 'Modelo potente y fluido para redactar trabajos e informes'
  },
  { 
    id: 'google/gemma-4-26b-a4b-it:free', 
    name: 'Google: Gemma 4 26B A4B (Free - Muy Rápido)', 
    vision: false,
    description: 'Baja latencia y alta precisión en español'
  },
  { 
    id: 'nvidia/nemotron-3.5-lightning:free', 
    name: 'NVIDIA: Nemotron 3.5 Lightning (Free - Ultra Rápido)', 
    vision: false,
    description: 'Procesamiento de alta velocidad para textos'
  },
  { 
    id: 'nvidia/nemotron-nano-12b-v2-vl:free', 
    name: 'NVIDIA: Nemotron Nano 12B VL (Free - Especialista Visión & OCR)', 
    vision: true,
    description: 'Recomendado para lectura de albaranes y facturas por foto'
  },
  { 
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', 
    name: 'NVIDIA: Nemotron 3 Nano Omni (Free - Multimodal & Razonamiento)', 
    vision: true,
    description: 'Comprensión multimodal de imágenes y texto'
  },
  { 
    id: 'z-ai/glm-5.2:free', 
    name: 'Z.ai: GLM 5.2 (Free - Contexto Amplio)', 
    vision: false,
    description: 'Modelo general para tareas de texto e informes'
  },
  { 
    id: 'dots-studio/dots-3-note-preview:free', 
    name: 'Dots Studio: Dots-3 Note Preview (Free)', 
    vision: false,
    description: 'Especializado en notas y resúmenes de jornadas'
  },
  { 
    id: 'cohere/north-mini-code:free', 
    name: 'Cohere: North Mini Code (Free)', 
    vision: false,
    description: 'Modelo rápido y estructurado'
  }
];

/**
 * Consulta en directo la API de OpenRouter para obtener todos los modelos Free reales y activos
 */
export const fetchLiveFreeModels = async () => {
  try {
    const response = await fetch(OPENROUTER_MODELS_URL, {
      method: 'GET',
      headers: {
        'HTTP-Referer': 'https://platform-construc.netlify.app',
        'X-Title': 'Obra Control'
      }
    });

    if (!response.ok) {
      throw new Error(`No se pudo consultar el catálogo de OpenRouter (${response.status})`);
    }

    const data = await response.json();
    const allModels = data?.data || [];

    // Filtrar únicamente los modelos que terminan en :free o son openrouter/free o tienen coste 0
    const freeModels = allModels.filter(m => {
      const isFreeId = m.id.endsWith(':free') || m.id === 'openrouter/free';
      const isZeroPrice = m.pricing && m.pricing.prompt === '0' && m.pricing.completion === '0';
      return isFreeId || isZeroPrice;
    });

    if (freeModels.length === 0) {
      return VERIFIED_FREE_MODELS;
    }

    return freeModels.map(m => {
      const isVision = 
        m.id.includes('vl') || 
        m.id.includes('omni') || 
        m.id.includes('vision') || 
        m.architecture?.modality?.includes('image') ||
        m.id === 'openrouter/free';

      return {
        id: m.id,
        name: `${m.name || m.id} ${m.id.endsWith(':free') ? '' : '(Free)'}`,
        vision: isVision,
        description: m.description || (isVision ? 'Soporta Visión (OCR)' : 'Texto')
      };
    });
  } catch (err) {
    console.warn('Usando catálogo estático verificado de OpenRouter:', err);
    return VERIFIED_FREE_MODELS;
  }
};

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

  const selectedModel = model || DEFAULT_FREE_TEXT_MODEL;

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://platform-construc.netlify.app',
      'X-Title': 'Obra Control'
    },
    body: JSON.stringify({
      model: selectedModel,
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
 */
export const extraerDatosAlbaranIA = async ({ imageBase64, empresa = {} }) => {
  if (!imageBase64) {
    throw new Error('No se ha proporcionado ninguna imagen para analizar.');
  }

  const apiKey = getOpenRouterApiKey(empresa);
  if (!apiKey) {
    throw new Error('Debes configurar tu API Key gratuita de OpenRouter en la pestaña Configuración para usar la lectura de albaranes con IA.');
  }

  // Si el usuario configuró un modelo específico y soporta visión, usarlo; sino usar el modelo de visión free por defecto
  const visionModel = empresa?.openRouterVisionModel || DEFAULT_FREE_VISION_MODEL;

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
