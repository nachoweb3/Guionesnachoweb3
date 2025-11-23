import { generarTexto } from '../config/iaProviders.js';

/**
 * GENERADOR DE SEO PARA YOUTUBE
 * Optimiza títulos, descripciones, tags y hashtags para máximo alcance
 */

/**
 * Genera todos los elementos SEO para un video de YouTube
 * @param {string} guion - El guión completo del video
 * @param {string} tema - Tema principal del video
 * @param {object} opciones - Opciones adicionales
 * @returns {object} - Elementos SEO optimizados
 */
export async function generarSEO(guion, tema, opciones = {}) {
  const {
    provider = 'groq',
    nicho = 'general',
    audienciaObjetivo = 'general',
    idioma = 'español'
  } = opciones;

  try {
    console.log('🎯 Generando elementos SEO...');

    // Generar todos los elementos en paralelo para mayor velocidad
    const [
      titulos,
      descripciones,
      keywords,
      hashtags,
      tags,
      clickbaitScore
    ] = await Promise.all([
      generarTitulos(guion, tema, nicho, provider),
      generarDescripciones(guion, tema, nicho, provider),
      extraerKeywords(guion, tema, provider),
      generarHashtags(guion, tema, nicho, provider),
      generarTags(guion, tema, nicho, provider),
      calcularClickbaitScore(tema)
    ]);

    const resultado = {
      success: true,
      titulos: titulos,
      descripciones: descripciones,
      keywords: keywords,
      hashtags: hashtags,
      tags: tags,
      clickbaitScore: clickbaitScore,
      sugerencias: generarSugerenciasAdicionales(tema, nicho)
    };

    console.log('✅ Elementos SEO generados exitosamente');
    return resultado;

  } catch (error) {
    console.error('❌ Error generando SEO:', error);
    throw new Error(`Error al generar SEO: ${error.message}`);
  }
}

/**
 * Genera múltiples opciones de títulos optimizados
 */
async function generarTitulos(guion, tema, nicho, provider) {
  const extracto = guion.substring(0, 2000);

  const prompt = `Genera 8 títulos OPTIMIZADOS para YouTube sobre: "${tema}" en el nicho de ${nicho}.

EXTRACTO DEL GUIÓN:
${extracto}...

REQUISITOS PARA CADA TÍTULO:
- Máximo 60 caracteres (importante para SEO)
- Incluir palabras clave relevantes
- Ser clicable pero no engañoso
- Variar el estilo: algunos informativos, otros curiosos, otros urgentes
- Usar números cuando sea apropiado
- Incluir power words (mejor, secreto, guía completa, etc.)

FORMATOS A INCLUIR:
1. Título informativo directo
2. Título con pregunta
3. Título con número (Top X, X formas de...)
4. Título con urgencia/novedad (2025, NUEVO, etc.)
5. Título con beneficio claro
6. Título tipo "Cómo hacer..."
7. Título controversial/curioso
8. Título con gancho emocional

Responde en formato JSON:
[
  {"titulo": "...", "caracteres": X, "tipo": "informativo"},
  {"titulo": "...", "caracteres": X, "tipo": "pregunta"},
  ...
]

Responde SOLO con el JSON array:`;

  try {
    const respuesta = await generarTexto(prompt, { provider, maxTokens: 1500 });

    const jsonMatch = respuesta.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return generarTitulosFallback(tema);
    }

    const titulos = JSON.parse(jsonMatch[0]);

    // Validar longitud y ajustar si es necesario
    return titulos.map(t => ({
      ...t,
      caracteres: t.titulo.length,
      valido: t.titulo.length <= 60,
      advertencia: t.titulo.length > 60 ? 'Título muy largo, puede cortarse' : null
    }));

  } catch (error) {
    console.warn('⚠️ Error generando títulos con IA, usando fallback');
    return generarTitulosFallback(tema);
  }
}

/**
 * Genera títulos básicos como fallback
 */
function generarTitulosFallback(tema) {
  return [
    { titulo: `${tema} - Guía Completa 2025`, caracteres: (`${tema} - Guía Completa 2025`).length, tipo: 'informativo', valido: true },
    { titulo: `¿Qué es ${tema}? Todo lo que Debes Saber`, caracteres: (`¿Qué es ${tema}? Todo lo que Debes Saber`).length, tipo: 'pregunta', valido: true },
    { titulo: `Cómo Dominar ${tema} Paso a Paso`, caracteres: (`Cómo Dominar ${tema} Paso a Paso`).length, tipo: 'tutorial', valido: true },
    { titulo: `${tema}: La Guía Definitiva`, caracteres: (`${tema}: La Guía Definitiva`).length, tipo: 'informativo', valido: true }
  ];
}

/**
 * Genera descripciones SEO optimizadas
 */
async function generarDescripciones(guion, tema, nicho, provider) {
  const extracto = guion.substring(0, 2500);

  const prompt = `Crea 3 descripciones optimizadas para YouTube sobre: "${tema}".

EXTRACTO DEL GUIÓN:
${extracto}...

REQUISITOS:
- Primera descripción: 150-160 caracteres (ideal para SEO)
- Segunda descripción: 250-300 caracteres (más detalle)
- Tercera descripción: 400-500 caracteres (descripción completa)

Cada descripción debe:
- Incluir palabras clave naturalmente
- Crear curiosidad
- Incluir beneficio claro para el espectador
- Ser gramaticalmente perfecta
- Terminar con call-to-action si es larga

Responde en formato JSON:
[
  {"descripcion": "...", "caracteres": X, "tipo": "corta"},
  {"descripcion": "...", "caracteres": X, "tipo": "media"},
  {"descripcion": "...", "caracteres": X, "tipo": "larga"}
]

Responde SOLO con el JSON array:`;

  try {
    const respuesta = await generarTexto(prompt, { provider, maxTokens: 2000 });

    const jsonMatch = respuesta.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return generarDescripcionesFallback(tema);
    }

    const descripciones = JSON.parse(jsonMatch[0]);

    return descripciones.map(d => ({
      ...d,
      caracteres: d.descripcion.length,
      seoScore: calcularSEOScore(d.descripcion)
    }));

  } catch (error) {
    console.warn('⚠️ Error generando descripciones con IA, usando fallback');
    return generarDescripcionesFallback(tema);
  }
}

/**
 * Genera descripciones básicas como fallback
 */
function generarDescripcionesFallback(tema) {
  return [
    {
      descripcion: `Aprende todo sobre ${tema} en esta guía completa. Explicación clara y práctica para comenzar hoy mismo.`,
      caracteres: (`Aprende todo sobre ${tema} en esta guía completa. Explicación clara y práctica para comenzar hoy mismo.`).length,
      tipo: 'corta',
      seoScore: 7
    },
    {
      descripcion: `En este video te explico ${tema} de forma completa y detallada. Descubre los conceptos clave, aplicaciones prácticas y consejos profesionales. Perfecto tanto para principiantes como avanzados.`,
      caracteres: (`En este video te explico ${tema} de forma completa y detallada. Descubre los conceptos clave, aplicaciones prácticas y consejos profesionales. Perfecto tanto para principiantes como avanzados.`).length,
      tipo: 'media',
      seoScore: 8
    }
  ];
}

/**
 * Extrae keywords principales del guión
 */
async function extraerKeywords(guion, tema, provider) {
  const extracto = guion.substring(0, 3000);

  const prompt = `Analiza este guión y extrae las 15 KEYWORDS más importantes para SEO en YouTube.

TEMA: ${tema}

GUIÓN (extracto):
${extracto}...

INSTRUCCIONES:
- Identificar términos que la gente buscaría
- Incluir variaciones y sinónimos
- Mezclar keywords de 1, 2 y 3 palabras
- Priorizar términos con volumen de búsqueda
- Incluir keywords long-tail específicas

Responde en formato JSON:
[
  {"keyword": "...", "relevancia": "alta/media", "palabras": 1},
  {"keyword": "...", "relevancia": "alta/media", "palabras": 2},
  ...
]

Responde SOLO con el JSON array de 15 keywords:`;

  try {
    const respuesta = await generarTexto(prompt, { provider, maxTokens: 1000 });

    const jsonMatch = respuesta.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return extraerKeywordsFallback(tema, guion);
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.warn('⚠️ Error extrayendo keywords con IA, usando fallback');
    return extraerKeywordsFallback(tema, guion);
  }
}

/**
 * Extrae keywords básicas como fallback
 */
function extraerKeywordsFallback(tema, guion) {
  const palabras = guion.toLowerCase().split(/\s+/);
  const frecuencia = {};

  // Contar frecuencia de palabras
  palabras.forEach(palabra => {
    if (palabra.length > 4 && !esStopWord(palabra)) {
      frecuencia[palabra] = (frecuencia[palabra] || 0) + 1;
    }
  });

  // Ordenar por frecuencia
  const keywords = Object.entries(frecuencia)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword, freq]) => ({
      keyword: keyword,
      relevancia: freq > 5 ? 'alta' : 'media',
      palabras: 1
    }));

  // Agregar el tema principal si no está
  if (!keywords.some(k => k.keyword.includes(tema.toLowerCase()))) {
    keywords.unshift({
      keyword: tema,
      relevancia: 'alta',
      palabras: tema.split(/\s+/).length
    });
  }

  return keywords;
}

/**
 * Genera hashtags relevantes
 */
async function generarHashtags(guion, tema, nicho, provider) {
  const prompt = `Genera 10 hashtags OPTIMIZADOS para un video de YouTube sobre "${tema}" en el nicho de ${nicho}.

REQUISITOS:
- Mezclar hashtags populares y específicos
- Incluir hashtags en español
- Hashtags de diferente longitud
- Relevantes al contenido real
- Algunos generales, otros muy específicos

Responde en formato JSON:
[
  {"hashtag": "...", "popularidad": "alta/media/baja", "tipo": "general/nicho/especifico"},
  ...
]

Responde SOLO con el JSON array de 10 hashtags:`;

  try {
    const respuesta = await generarTexto(prompt, { provider, maxTokens: 800 });

    const jsonMatch = respuesta.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return generarHashtagsFallback(tema, nicho);
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.warn('⚠️ Error generando hashtags con IA, usando fallback');
    return generarHashtagsFallback(tema, nicho);
  }
}

/**
 * Genera hashtags básicos como fallback
 */
function generarHashtagsFallback(tema, nicho) {
  const temaHashtag = tema.replace(/\s+/g, '').toLowerCase();

  return [
    { hashtag: `#${temaHashtag}`, popularidad: 'alta', tipo: 'especifico' },
    { hashtag: `#${nicho}`, popularidad: 'alta', tipo: 'nicho' },
    { hashtag: '#youtube', popularidad: 'alta', tipo: 'general' },
    { hashtag: '#tutorial', popularidad: 'alta', tipo: 'general' },
    { hashtag: '#2025', popularidad: 'media', tipo: 'temporal' }
  ];
}

/**
 * Genera tags para YouTube
 */
async function generarTags(guion, tema, nicho, provider) {
  const prompt = `Genera 25 TAGS optimizados para YouTube sobre "${tema}" en el nicho de ${nicho}.

Los tags deben:
- Incluir variaciones del tema principal
- Mezclar tags cortos y long-tail
- Incluir términos relacionados que la gente busca
- Cubrir diferentes aspectos del video
- Ser específicos y relevantes

Responde con una lista separada por comas:
tag1, tag2, tag3, ...

Responde SOLO con los tags separados por comas:`;

  try {
    const respuesta = await generarTexto(prompt, { provider, maxTokens: 1000 });

    // Limpiar y separar tags
    const tags = respuesta
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0 && tag.length < 50)
      .slice(0, 30);

    return tags;

  } catch (error) {
    console.warn('⚠️ Error generando tags con IA, usando fallback');
    return generarTagsFallback(tema, nicho);
  }
}

/**
 * Genera tags básicos como fallback
 */
function generarTagsFallback(tema, nicho) {
  return [
    tema,
    `${tema} tutorial`,
    `${tema} 2025`,
    `qué es ${tema}`,
    `cómo usar ${tema}`,
    nicho,
    `${nicho} tutorial`,
    'tutorial español',
    'guía completa',
    'paso a paso'
  ];
}

/**
 * Calcula score de clickbait (qué tan atractivo es el título)
 */
function calcularClickbaitScore(tema) {
  let score = 5; // Base score

  const powerWords = ['secreto', 'mejor', 'peor', 'increíble', 'impresionante', 'definitivo', 'completo', 'perfecto', 'nunca', 'siempre', 'todos', 'nadie'];
  const urgencyWords = ['ahora', 'hoy', '2025', 'nuevo', 'última', 'urgente'];
  const curiosityWords = ['qué', 'cómo', 'por qué', 'cuál', 'descubre', 'revela'];
  const numberPattern = /\d+/;

  const temaLower = tema.toLowerCase();

  // Evaluar presencia de elementos clickbait
  powerWords.forEach(word => {
    if (temaLower.includes(word)) score += 0.5;
  });

  urgencyWords.forEach(word => {
    if (temaLower.includes(word)) score += 0.3;
  });

  curiosityWords.forEach(word => {
    if (temaLower.includes(word)) score += 0.4;
  });

  if (numberPattern.test(tema)) score += 0.5;

  // Limitar a escala 1-10
  score = Math.min(10, Math.max(1, score));

  return {
    score: parseFloat(score.toFixed(1)),
    nivel: score >= 8 ? 'Alto' : score >= 6 ? 'Medio' : 'Bajo',
    recomendacion: score < 6 ?
      'Considera agregar elementos más atractivos al título' :
      score > 8 ?
        'Buen nivel de atractivo, pero asegúrate de no ser engañoso' :
        'Balance adecuado entre atractivo y honestidad'
  };
}

/**
 * Calcula score SEO de un texto
 */
function calcularSEOScore(texto) {
  let score = 5;

  // Longitud adecuada
  if (texto.length >= 150 && texto.length <= 160) score += 2;
  else if (texto.length >= 140 && texto.length <= 170) score += 1;

  // Incluye call-to-action
  const ctas = ['suscríbete', 'like', 'comparte', 'comenta', 'descarga', 'aprende'];
  if (ctas.some(cta => texto.toLowerCase().includes(cta))) score += 1;

  // Incluye números
  if (/\d+/.test(texto)) score += 0.5;

  // Buena gramática (básico)
  if (texto.includes('.') && !texto.endsWith('...')) score += 0.5;

  return Math.min(10, Math.round(score));
}

/**
 * Verifica si una palabra es stopword
 */
function esStopWord(palabra) {
  const stopWords = ['para', 'como', 'este', 'esta', 'estos', 'estas', 'entre', 'sobre', 'hasta', 'desde', 'pero', 'sino', 'porque', 'cual', 'donde', 'cuando', 'quien', 'cuyo'];
  return stopWords.includes(palabra);
}

/**
 * Genera sugerencias adicionales para mejorar SEO
 */
function generarSugerenciasAdicionales(tema, nicho) {
  return {
    thumbnail: [
      'Usa texto grande y legible (máx 3-4 palabras)',
      'Colores de alto contraste',
      'Rostros o emociones si es apropiado',
      'Incluye elementos visuales del tema principal'
    ],
    descripcionCompleta: [
      'Incluye timestamps (YouTube los detecta)',
      'Links a videos relacionados',
      'Links a redes sociales',
      'Menciona herramientas o recursos citados',
      'Incluye hashtags al final (3-5 hashtags)'
    ],
    engagement: [
      'Hace una pregunta en los primeros comentarios',
      'Pide opinión sobre un punto específico del video',
      'Crea una poll relacionada',
      'Responde a los primeros comentarios rápidamente'
    ],
    mejoresPracticas: [
      `El tema "${tema}" se busca más los fines de semana - considera publicar viernes`,
      `Para el nicho ${nicho}, los videos de 12-18 minutos suelen tener mejor retention`,
      'Sube el video como "no listado" primero para verificar calidad',
      'Programa la publicación para cuando tu audiencia está más activa'
    ]
  };
}

/**
 * Formatea resultado SEO para mostrar
 */
export function formatearResultadoSEO(resultadoSEO) {
  let resultado = '';

  resultado += '═══════════════════════════════════════\n';
  resultado += '🎯 OPTIMIZACIÓN SEO PARA YOUTUBE\n';
  resultado += '═══════════════════════════════════════\n\n';

  // Títulos
  resultado += '📌 OPCIONES DE TÍTULOS:\n';
  resultado += '───────────────────────────────────────\n';
  resultadoSEO.titulos.forEach((t, i) => {
    resultado += `${i + 1}. ${t.titulo}\n`;
    resultado += `   • Caracteres: ${t.caracteres}/60 ${t.valido ? '✓' : '⚠️ LARGO'}\n`;
    resultado += `   • Tipo: ${t.tipo}\n\n`;
  });

  // Descripciones
  resultado += '\n📝 DESCRIPCIONES OPTIMIZADAS:\n';
  resultado += '───────────────────────────────────────\n';
  resultadoSEO.descripciones.forEach((d, i) => {
    resultado += `${i + 1}. [${d.tipo.toUpperCase()}] - Score SEO: ${d.seoScore}/10\n`;
    resultado += `${d.descripcion}\n\n`;
  });

  // Keywords
  resultado += '\n🔑 KEYWORDS PRINCIPALES:\n';
  resultado += '───────────────────────────────────────\n';
  const keywordsAlta = resultadoSEO.keywords.filter(k => k.relevancia === 'alta');
  const keywordsMedia = resultadoSEO.keywords.filter(k => k.relevancia === 'media');

  resultado += 'Alta relevancia: ' + keywordsAlta.map(k => k.keyword).join(', ') + '\n';
  resultado += 'Media relevancia: ' + keywordsMedia.map(k => k.keyword).join(', ') + '\n\n';

  // Hashtags
  resultado += '\n#️⃣ HASHTAGS RECOMENDADOS:\n';
  resultado += '───────────────────────────────────────\n';
  resultado += resultadoSEO.hashtags.map(h => h.hashtag).join(' ') + '\n\n';

  // Tags
  resultado += '\n🏷️ TAGS DE YOUTUBE (copiar y pegar):\n';
  resultado += '───────────────────────────────────────\n';
  resultado += resultadoSEO.tags.join(', ') + '\n\n';

  // Clickbait score
  resultado += '\n📊 ANÁLISIS DE ATRACTIVO:\n';
  resultado += '───────────────────────────────────────\n';
  resultado += `Score: ${resultadoSEO.clickbaitScore.score}/10 (${resultadoSEO.clickbaitScore.nivel})\n`;
  resultado += `Recomendación: ${resultadoSEO.clickbaitScore.recomendacion}\n\n`;

  resultado += '═══════════════════════════════════════\n';

  return resultado;
}
