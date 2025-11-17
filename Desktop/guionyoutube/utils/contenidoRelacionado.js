import { generarTexto } from '../config/iaProviders.js';

/**
 * Obtiene contenido relacionado sobre un tema para investigación
 * Esto ayuda a crear guiones más informados y completos
 */
export async function obtenerContenidoRelacionado(tema, cantidad = 5, provider = 'groq') {
  console.log(`🔍 Investigando contenido sobre: ${tema}`);

  try {
    // Generar ideas y puntos clave sobre el tema
    const investigacion = await investigarTema(tema, provider);

    // Generar subtemas y puntos específicos
    const subtemas = await generarSubtemas(tema, cantidad, provider);

    // Generar preguntas clave que la audiencia se hace
    const preguntas = await generarPreguntasAudiencia(tema, provider);

    return {
      investigacion,
      subtemas,
      preguntas,
      resumen: `Investigación completa sobre "${tema}" con ${subtemas.length} subtemas y ${preguntas.length} preguntas clave.`
    };
  } catch (error) {
    console.error('Error obteniendo contenido relacionado:', error);
    throw error;
  }
}

/**
 * Investiga un tema en profundidad
 */
async function investigarTema(tema, provider) {
  const prompt = `Realiza una INVESTIGACIÓN PROFUNDA sobre "${tema}".

Proporciona:
1. Contexto e historia del tema (500 palabras)
2. Estado actual y tendencias (400 palabras)
3. Conceptos clave que se deben entender (400 palabras)
4. Datos, estadísticas o estudios relevantes (300 palabras)
5. Aplicaciones prácticas (400 palabras)

Total: Aproximadamente 2000 palabras de investigación sólida.

Escribe la investigación completa:`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera subtemas específicos para cubrir
 */
async function generarSubtemas(tema, cantidad, provider) {
  const prompt = `Para un video extenso sobre "${tema}", genera ${cantidad} SUBTEMAS específicos que deberían cubrirse.

Para cada subtema proporciona:
- Título del subtema
- Por qué es importante cubrirlo (100 palabras)
- Puntos clave a tratar (200 palabras)
- Ejemplos o casos de uso (200 palabras)

Formato JSON:
{
  "subtemas": [
    {
      "titulo": "...",
      "importancia": "...",
      "puntosClave": "...",
      "ejemplos": "..."
    }
  ]
}

Genera los ${cantidad} subtemas:`;

  const respuesta = await generarTexto(prompt, { provider, maxTokens: 5000 });

  // Intentar parsear JSON, si falla retornar como texto
  try {
    const json = JSON.parse(respuesta);
    return json.subtemas || [];
  } catch (error) {
    // Si no es JSON válido, dividir por líneas y estructurar
    return [{
      titulo: tema,
      contenido: respuesta
    }];
  }
}

/**
 * Genera preguntas que la audiencia se haría sobre el tema
 */
async function generarPreguntasAudiencia(tema, provider) {
  const prompt = `Imagina que vas a crear un video de YouTube sobre "${tema}".

Genera 10 PREGUNTAS que tu audiencia DEFINITIVAMENTE se estaría haciendo sobre este tema.

Estas preguntas deben:
- Ser específicas y relevantes
- Cubrir diferentes niveles (principiante a avanzado)
- Incluir tanto dudas comunes como preguntas profundas
- Ser el tipo de preguntas que aparecerían en los comentarios

Formato:
1. Pregunta
2. Pregunta
...

Lista las 10 preguntas:`;

  const respuesta = await generarTexto(prompt, { provider, maxTokens: 2000 });

  // Dividir por líneas numeradas
  const lineas = respuesta.split('\n').filter(l => l.trim().length > 0);
  return lineas.map(linea => {
    // Remover numeración si existe
    return linea.replace(/^\d+\.\s*/, '').trim();
  });
}

/**
 * Genera un outline completo del video
 */
export async function generarOutline(tema, duracion = 30, provider = 'groq') {
  const prompt = `Crea un OUTLINE COMPLETO Y DETALLADO para un video de YouTube de ${duracion} minutos sobre "${tema}".

El outline debe incluir:

1. INTRODUCCIÓN (0-2 min)
   - Gancho inicial
   - Presentación del tema
   - Por qué es importante

2. SECCIONES PRINCIPALES (con timestamps estimados)
   - Cada sección con subtemas específicos
   - Puntos clave a cubrir
   - Ejemplos o casos a mencionar

3. SECCIÓN DE EJEMPLOS/PRÁCTICOS (5-7 min)

4. PREGUNTAS FRECUENTES (3-4 min)

5. CONCLUSIÓN Y LLAMADA A LA ACCIÓN (1-2 min)

IMPORTANTE:
- Incluir timestamps estimados para cada sección
- Desglosar TODO en detalle
- El outline debe ser tan completo que sirva como guía exacta

Escribe el outline completo (mínimo 1000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}
