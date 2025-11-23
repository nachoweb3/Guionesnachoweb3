import { generarTexto } from '../config/iaProviders.js';

/**
 * GENERADOR DE TIMESTAMPS PARA YOUTUBE
 * Analiza el guión y genera timestamps automáticos listos para copiar
 */

/**
 * Genera timestamps automáticos para un guión
 * @param {string} guion - El guión completo del video
 * @param {object} opciones - Opciones de generación
 * @returns {object} - Timestamps formateados y análisis
 */
export async function generarTimestamps(guion, opciones = {}) {
  const {
    provider = 'groq',
    palabrasPorMinuto = 250,
    incluirDescripciones = true,
    formatoDetallado = true
  } = opciones;

  try {
    console.log('⏱️ Generando timestamps...');

    // Primero detectar secciones automáticamente
    const secciones = await detectarSecciones(guion, provider);

    // Calcular timestamps basados en posición en el guión
    const timestamps = calcularTimestamps(secciones, guion, palabrasPorMinuto);

    // Formatear para YouTube
    const timestampsFormateados = formatearParaYouTube(timestamps, incluirDescripciones);

    // Generar versión detallada si se solicita
    let timestampsDetallados = null;
    if (formatoDetallado) {
      timestampsDetallados = await generarTimestampsDetallados(guion, secciones, provider);
    }

    const resultado = {
      success: true,
      timestamps: timestamps,
      formatoYouTube: timestampsFormateados,
      timestampsDetallados: timestampsDetallados,
      totalSecciones: secciones.length,
      duracionEstimada: calcularDuracionTotal(guion, palabrasPorMinuto)
    };

    console.log(`✅ ${secciones.length} timestamps generados`);
    return resultado;

  } catch (error) {
    console.error('❌ Error generando timestamps:', error);
    throw new Error(`Error al generar timestamps: ${error.message}`);
  }
}

/**
 * Detecta las secciones principales del guión usando IA
 */
async function detectarSecciones(guion, provider) {
  const prompt = `Analiza el siguiente guión de YouTube y identifica las SECCIONES PRINCIPALES.

Para cada sección, proporciona:
1. Un título corto y descriptivo (máximo 6 palabras)
2. Las primeras palabras exactas donde comienza esa sección (para ubicarla)

GUIÓN:
${guion.substring(0, 8000)} ${guion.length > 8000 ? '...(texto truncado)' : ''}

INSTRUCCIONES:
- Identifica entre 6-12 secciones principales
- Los títulos deben ser concisos y atractivos
- Marca transiciones naturales del contenido
- Incluye intro y outro si existen
- No inventes, usa el contenido real del guión

Responde en formato JSON array:
[
  {"titulo": "Introducción", "inicioTexto": "Hola a todos..."},
  {"titulo": "Concepto Principal", "inicioTexto": "Ahora vamos a ver..."},
  ...
]

Responde SOLO con el JSON array, sin explicaciones adicionales:`;

  try {
    const respuesta = await generarTexto(prompt, { provider, maxTokens: 2000 });

    // Intentar parsear JSON
    const jsonMatch = respuesta.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      // Fallback: detectar secciones manualmente
      return detectarSeccionesManual(guion);
    }

    const secciones = JSON.parse(jsonMatch[0]);
    return secciones;

  } catch (error) {
    console.warn('⚠️ Error parseando secciones con IA, usando detección manual');
    return detectarSeccionesManual(guion);
  }
}

/**
 * Detecta secciones manualmente basado en patrones
 */
function detectarSeccionesManual(guion) {
  const secciones = [];
  const lineas = guion.split('\n');

  // Patrones comunes de títulos/secciones
  const patronesTitulos = [
    /^#{1,3}\s+(.+)$/,           // Markdown headers
    /^\*\*(.+)\*\*$/,             // Texto en negrita
    /^[A-ZÁÉÍÓÚÑ\s]{5,50}:?\s*$/, // TEXTO EN MAYÚSCULAS
    /^\d+\.\s+(.+)$/,             // 1. Numeración
    /^\[(.+)\]$/                  // [Secciones entre corchetes]
  ];

  let textoAcumulado = '';

  lineas.forEach((linea, index) => {
    const lineaTrim = linea.trim();

    // Verificar si es un título
    let esTitulo = false;
    let titulo = null;

    for (const patron of patronesTitulos) {
      const match = lineaTrim.match(patron);
      if (match) {
        titulo = match[1] || match[0];
        esTitulo = true;
        break;
      }
    }

    if (esTitulo && titulo && titulo.length > 3 && titulo.length < 100) {
      // Buscar inicio del contenido (siguiente línea no vacía)
      let inicioTexto = '';
      for (let i = index + 1; i < lineas.length && i < index + 5; i++) {
        if (lineas[i].trim().length > 20) {
          inicioTexto = lineas[i].trim().substring(0, 50);
          break;
        }
      }

      if (inicioTexto) {
        secciones.push({
          titulo: titulo.trim(),
          inicioTexto: inicioTexto
        });
      }
    }

    textoAcumulado += linea + '\n';
  });

  // Si no se encontraron secciones, dividir en partes iguales
  if (secciones.length < 3) {
    return dividirEnPartes(guion);
  }

  return secciones;
}

/**
 * Divide el guión en partes iguales como fallback
 */
function dividirEnPartes(guion, numPartes = 8) {
  const palabras = guion.split(/\s+/);
  const palabrasPorParte = Math.floor(palabras.length / numPartes);
  const secciones = [];

  for (let i = 0; i < numPartes; i++) {
    const inicio = i * palabrasPorParte;
    const fragmento = palabras.slice(inicio, inicio + 50).join(' ');

    secciones.push({
      titulo: i === 0 ? 'Introducción' :
              i === numPartes - 1 ? 'Conclusión' :
              `Parte ${i}`,
      inicioTexto: fragmento.substring(0, 50)
    });
  }

  return secciones;
}

/**
 * Calcula timestamps basados en la posición en el texto
 */
function calcularTimestamps(secciones, guion, palabrasPorMinuto) {
  const timestamps = [];
  const palabrasTotales = contarPalabras(guion);

  secciones.forEach((seccion, index) => {
    // Encontrar posición aproximada de esta sección en el guión
    const posicion = guion.indexOf(seccion.inicioTexto);

    if (posicion !== -1) {
      // Calcular palabras hasta esta posición
      const textoHastaAqui = guion.substring(0, posicion);
      const palabrasHastaAqui = contarPalabras(textoHastaAqui);

      // Convertir a minutos y segundos
      const segundosTotales = Math.floor((palabrasHastaAqui / palabrasPorMinuto) * 60);
      const minutos = Math.floor(segundosTotales / 60);
      const segundos = segundosTotales % 60;

      timestamps.push({
        tiempo: `${minutos}:${segundos.toString().padStart(2, '0')}`,
        segundos: segundosTotales,
        titulo: seccion.titulo,
        orden: index + 1
      });
    }
  });

  // Asegurar que hay un timestamp en 0:00
  if (timestamps.length === 0 || timestamps[0].segundos > 0) {
    timestamps.unshift({
      tiempo: '0:00',
      segundos: 0,
      titulo: 'Introducción',
      orden: 0
    });
  }

  return timestamps.sort((a, b) => a.segundos - b.segundos);
}

/**
 * Formatea timestamps para descripción de YouTube
 */
function formatearParaYouTube(timestamps, incluirDescripciones = true) {
  let resultado = '';

  if (incluirDescripciones) {
    resultado += '⏱️ TIMESTAMPS:\n';
    resultado += '━━━━━━━━━━━━━━━━━━━━\n\n';
  }

  timestamps.forEach(timestamp => {
    resultado += `${timestamp.tiempo} - ${timestamp.titulo}\n`;
  });

  if (incluirDescripciones) {
    resultado += '\n━━━━━━━━━━━━━━━━━━━━\n';
    resultado += '👍 No olvides darle like y suscribirte\n';
  }

  return resultado;
}

/**
 * Genera timestamps con descripciones detalladas
 */
async function generarTimestampsDetallados(guion, secciones, provider) {
  const prompt = `Basándote en este guión de YouTube, crea descripciones breves (10-15 palabras) para cada sección:

SECCIONES:
${secciones.map((s, i) => `${i + 1}. ${s.titulo}`).join('\n')}

GUIÓN (extracto):
${guion.substring(0, 6000)}...

Para cada sección, escribe una descripción corta que explique qué se cubre.

Formato:
1. [Título]: [Descripción breve]
2. [Título]: [Descripción breve]
...

Responde:`;

  try {
    const respuesta = await generarTexto(prompt, { provider, maxTokens: 1500 });
    return respuesta.trim();
  } catch (error) {
    console.warn('⚠️ No se pudieron generar descripciones detalladas');
    return null;
  }
}

/**
 * Calcula duración total estimada
 */
function calcularDuracionTotal(guion, palabrasPorMinuto) {
  const palabras = contarPalabras(guion);
  const minutos = palabras / palabrasPorMinuto;
  const minutosEnteros = Math.floor(minutos);
  const segundos = Math.floor((minutos - minutosEnteros) * 60);

  return {
    minutos: minutosEnteros,
    segundos: segundos,
    texto: `${minutosEnteros}:${segundos.toString().padStart(2, '0')}`
  };
}

/**
 * Cuenta palabras en un texto
 */
function contarPalabras(texto) {
  return texto.split(/\s+/).filter(p => p.length > 0).length;
}

/**
 * Convierte timestamps a formato SRT (subtítulos)
 */
export function timestampsASubtitulos(timestamps, guion) {
  // Esta función podría expandirse para generar subtítulos reales
  // Por ahora retorna los timestamps en formato compatible con editores
  const srt = [];

  timestamps.forEach((timestamp, index) => {
    const siguienteTimestamp = timestamps[index + 1];
    const tiempoInicio = formatearTiempoSRT(timestamp.segundos);
    const tiempoFin = siguienteTimestamp ?
      formatearTiempoSRT(siguienteTimestamp.segundos) :
      formatearTiempoSRT(timestamp.segundos + 60);

    srt.push({
      index: index + 1,
      inicio: tiempoInicio,
      fin: tiempoFin,
      texto: timestamp.titulo
    });
  });

  return srt;
}

/**
 * Formatea tiempo en formato SRT (00:00:00,000)
 */
function formatearTiempoSRT(segundosTotales) {
  const horas = Math.floor(segundosTotales / 3600);
  const minutos = Math.floor((segundosTotales % 3600) / 60);
  const segundos = segundosTotales % 60;

  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')},000`;
}

/**
 * Exporta timestamps a diferentes formatos
 */
export function exportarTimestamps(timestamps, formato = 'youtube') {
  switch (formato) {
    case 'youtube':
      return formatearParaYouTube(timestamps, true);

    case 'simple':
      return timestamps.map(t => `${t.tiempo} ${t.titulo}`).join('\n');

    case 'json':
      return JSON.stringify(timestamps, null, 2);

    case 'csv':
      let csv = 'Tiempo,Segundos,Título\n';
      timestamps.forEach(t => {
        csv += `${t.tiempo},${t.segundos},"${t.titulo}"\n`;
      });
      return csv;

    case 'markdown':
      let md = '## Timestamps\n\n';
      timestamps.forEach(t => {
        md += `- **${t.tiempo}** - ${t.titulo}\n`;
      });
      return md;

    default:
      return formatearParaYouTube(timestamps, true);
  }
}
