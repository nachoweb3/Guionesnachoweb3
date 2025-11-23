import { generarTexto } from '../config/iaProviders.js';

/**
 * Genera un guion largo y detallado para YouTube
 * Un video de 30 minutos necesita aproximadamente 7,500-9,000 palabras
 */
export async function generarGuionLargo(opciones) {
  const {
    tema,
    nicho = 'general',
    duracion = 30, // minutos
    tono = 'profesional',
    incluirIntro = true,
    incluirOutro = true,
    provider = 'groq',
    guionBase = null,
    seccionesAExpandir = []
  } = opciones;

  // Calcular palabras objetivo (250 palabras por minuto aproximadamente)
  const palabrasObjetivo = duracion * 250;

  console.log(`📝 Objetivo: ${palabrasObjetivo} palabras para ${duracion} minutos`);

  try {
    // Si hay un guión base, expandirlo
    if (guionBase) {
      return await expandirGuion(guionBase, seccionesAExpandir, provider);
    }

    // Generar guion completo en múltiples partes para maximizar contenido
    let guionCompleto = '';

    // 1. INTRO (si está habilitada)
    if (incluirIntro) {
      console.log('🎬 Generando introducción...');
      const intro = await generarIntroduccion(tema, nicho, tono, provider);
      guionCompleto += intro + '\n\n';
    }

    // 2. CONTENIDO PRINCIPAL (dividido en secciones para ser más extenso)
    console.log('📚 Generando contenido principal...');
    const numeroSecciones = Math.max(5, Math.floor(duracion / 6)); // Al menos 5 secciones

    for (let i = 0; i < numeroSecciones; i++) {
      console.log(`   📖 Generando sección ${i + 1}/${numeroSecciones}...`);
      const seccion = await generarSeccionContenido(tema, nicho, i + 1, numeroSecciones, tono, provider);
      guionCompleto += seccion + '\n\n';

      // Agregar transiciones entre secciones
      if (i < numeroSecciones - 1) {
        const transicion = await generarTransicion(tema, i + 1, provider);
        guionCompleto += transicion + '\n\n';
      }
    }

    // 3. EJEMPLOS Y CASOS DE ESTUDIO
    console.log('💡 Generando ejemplos y casos prácticos...');
    const ejemplos = await generarEjemplos(tema, nicho, provider);
    guionCompleto += ejemplos + '\n\n';

    // 4. PREGUNTAS FRECUENTES
    console.log('❓ Generando sección de preguntas frecuentes...');
    const faqs = await generarFAQs(tema, provider);
    guionCompleto += faqs + '\n\n';

    // 5. CONCLUSIÓN Y LLAMADA A LA ACCIÓN
    if (incluirOutro) {
      console.log('🎯 Generando conclusión y llamada a la acción...');
      const outro = await generarOutro(tema, nicho, tono, provider);
      guionCompleto += outro + '\n\n';
    }

    // 6. HOOKS Y RETENCIÓN (nueva sección)
    console.log('🎣 Generando técnicas de hooks y retención...');
    const hooksRetencion = await generarHooksYRetencion(tema, nicho, provider);
    guionCompleto += hooksRetencion + '\n\n';

    // 7. SUGERENCIAS DE B-ROLL (nueva sección)
    console.log('🎥 Generando sugerencias de B-Roll...');
    const brollSugerencias = await generarSugerenciasBRoll(tema, nicho, provider);
    guionCompleto += brollSugerencias + '\n\n';

    // 8. MÚSICA Y SONIDO (nueva sección)
    console.log('🎵 Generando guía de música y sonido...');
    const musicaSonido = await generarGuiaMusicaSonido(tema, tono, provider);
    guionCompleto += musicaSonido + '\n\n';

    // 9. Si aún no alcanzamos el objetivo de palabras, agregar más contenido
    let palabrasActuales = contarPalabras(guionCompleto);
    console.log(`📊 Palabras generadas: ${palabrasActuales}/${palabrasObjetivo}`);

    if (palabrasActuales < palabrasObjetivo) {
      console.log('📈 Expandiendo contenido para alcanzar objetivo...');
      const contenidoExtra = await generarContenidoExtra(tema, nicho, palabrasObjetivo - palabrasActuales, provider);
      guionCompleto += '\n\n' + contenidoExtra;
    }

    const palabrasFinales = contarPalabras(guionCompleto);
    console.log(`✅ Guion completado: ${palabrasFinales} palabras`);

    return guionCompleto;
  } catch (error) {
    console.error('❌ Error generando guion:', error);
    throw error;
  }
}

/**
 * Genera una introducción atractiva
 */
async function generarIntroduccion(tema, nicho, tono, provider) {
  const prompt = `Crea una introducción EXTENSA y ATRACTIVA para un video de YouTube de más de 30 minutos sobre "${tema}" en el nicho de ${nicho}.

La introducción debe:
- Tener al menos 800-1000 palabras
- Captar la atención inmediatamente con un gancho poderoso
- Explicar por qué este tema es relevante e importante AHORA
- Presentar estadísticas o datos impactantes
- Crear curiosidad sobre lo que se va a revelar
- Establecer credibilidad
- Tono: ${tono}

IMPORTANTE: Escribe TODO en primera persona, como si estuvieras hablando directamente a la cámara. Usa un lenguaje conversacional pero profesional.

Escribe la introducción COMPLETA (mínimo 800 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 4000 });
}

/**
 * Genera una sección de contenido principal
 */
async function generarSeccionContenido(tema, nicho, numeroSeccion, totalSecciones, tono, provider) {
  const prompt = `Crea la SECCIÓN ${numeroSeccion} de ${totalSecciones} para un video largo de YouTube sobre "${tema}" en el nicho de ${nicho}.

Esta sección debe:
- Tener al menos 1200-1500 palabras
- Profundizar en un aspecto específico del tema
- Incluir explicaciones detalladas paso a paso
- Proporcionar ejemplos concretos y específicos
- Usar analogías para facilitar la comprensión
- Incluir datos, estadísticas o investigaciones
- Mantener el interés con anécdotas relevantes
- Tono: ${tono}

FORMATO:
- Comienza con un subtítulo para esta sección
- Desarrolla el contenido de forma extensa y detallada
- Usa bullets o listas cuando sea apropiado
- Escribe en primera persona, estilo conversacional

Escribe la sección COMPLETA (mínimo 1200 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera transiciones entre secciones
 */
async function generarTransicion(tema, numeroSeccion, provider) {
  const prompt = `Crea una transición FLUIDA y NATURAL de 150-200 palabras para conectar la sección ${numeroSeccion} con la siguiente en un video sobre "${tema}".

La transición debe:
- Resumir brevemente el punto clave de la sección anterior
- Crear anticipación por la siguiente sección
- Mantener el ritmo del video
- Ser conversacional y natural

Escribe la transición COMPLETA:`;

  return await generarTexto(prompt, { provider, maxTokens: 1000 });
}

/**
 * Genera ejemplos y casos de estudio
 */
async function generarEjemplos(tema, nicho, provider) {
  const prompt = `Crea una sección EXTENSA de EJEMPLOS PRÁCTICOS y CASOS DE ESTUDIO para un video sobre "${tema}" en el nicho de ${nicho}.

Esta sección debe:
- Tener al menos 1500-2000 palabras
- Incluir 3-5 ejemplos detallados y específicos
- Cada ejemplo debe explicarse en profundidad
- Mostrar aplicaciones prácticas del concepto
- Incluir resultados, números o métricas cuando sea relevante
- Analizar por qué cada ejemplo es exitoso o instructivo

FORMATO:
[TÍTULO]: "EJEMPLOS PRÁCTICOS Y CASOS REALES"

Desarrolla cada ejemplo con TODO el detalle posible. Escribe la sección COMPLETA (mínimo 1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera sección de preguntas frecuentes
 */
async function generarFAQs(tema, provider) {
  const prompt = `Crea una sección EXTENSA de PREGUNTAS FRECUENTES sobre "${tema}".

Esta sección debe:
- Tener al menos 1000-1500 palabras
- Incluir 5-7 preguntas que la audiencia realmente se hace
- Responder cada pregunta en PROFUNDIDAD (no respuestas cortas)
- Anticipar objeciones o dudas comunes
- Proporcionar claridad total

FORMATO:
[TÍTULO]: "PREGUNTAS QUE PROBABLEMENTE TE ESTÁS HACIENDO"

Para cada pregunta:
- Presenta la pregunta de forma natural
- Responde extensamente (200-250 palabras por respuesta)
- Incluye ejemplos si es relevante

Escribe la sección COMPLETA (mínimo 1000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}

/**
 * Genera outro y llamada a la acción
 */
async function generarOutro(tema, nicho, tono, provider) {
  const prompt = `Crea una CONCLUSIÓN PODEROSA y LLAMADA A LA ACCIÓN para un video de YouTube sobre "${tema}" en el nicho de ${nicho}.

El outro debe:
- Tener al menos 600-800 palabras
- Resumir los puntos clave cubiertos (sin repetir todo)
- Inspirar a la acción
- Incluir una llamada a la acción clara (suscribirse, comentar, etc.)
- Dejar una impresión final memorable
- Tono: ${tono}

IMPORTANTE: Hacer que valga la pena todo el tiempo invertido por el espectador.

Escribe el outro COMPLETO (mínimo 600 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 3000 });
}

/**
 * Genera contenido extra si es necesario alcanzar el objetivo de palabras
 */
async function generarContenidoExtra(tema, nicho, palabrasNecesarias, provider) {
  const prompt = `Genera aproximadamente ${palabrasNecesarias} palabras de CONTENIDO ADICIONAL valioso sobre "${tema}" en el nicho de ${nicho}.

Este contenido puede incluir:
- Tips y consejos adicionales muy específicos
- Errores comunes a evitar (explicados en detalle)
- Recursos y herramientas recomendadas
- Pasos siguientes y plan de acción
- Perspectivas avanzadas sobre el tema
- Tendencias futuras o evolución del tema

IMPORTANTE: NO repitas información ya cubierta. Todo debe ser contenido NUEVO y valioso.

Escribe el contenido adicional (aproximadamente ${palabrasNecesarias} palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: Math.min(8000, palabrasNecesarias * 5) });
}

/**
 * Expande un guion existente
 */
async function expandirGuion(guionBase, seccionesAExpandir, provider) {
  const prompt = `Tengo el siguiente guion que necesito EXPANDIR significativamente:

${guionBase}

TAREA: Expande este guion para hacerlo MUCHO MÁS LARGO y detallado.

Debes:
- Agregar al menos 3000-5000 palabras adicionales
- Profundizar en cada punto mencionado
- Agregar ejemplos específicos y detallados
- Incluir más explicaciones paso a paso
- Agregar nuevas secciones relevantes
- Mantener la coherencia con el contenido original

${seccionesAExpandir.length > 0 ? `ENFÓCATE especialmente en expandir: ${seccionesAExpandir.join(', ')}` : ''}

Escribe el guion expandido COMPLETO:`;

  return await generarTexto(prompt, { provider, maxTokens: 8000 });
}

/**
 * Cuenta palabras en un texto
 */
function contarPalabras(texto) {
  return texto.split(/\s+/).filter(palabra => palabra.length > 0).length;
}

/**
 * Genera sección de HOOKS Y RETENCIÓN
 */
async function generarHooksYRetencion(tema, nicho, provider) {
  const prompt = `Crea una sección de GUÍA para mantener la retención de audiencia en un video sobre "${tema}" en el nicho de ${nicho}.

Esta sección debe incluir:
- 5-7 momentos clave donde insertar HOOKS (ganchos de retención)
- Técnicas específicas para mantener al espectador pegado
- Ejemplos de frases o momentos que crean curiosidad
- Estrategias de pacing (ritmo del video)
- Pattern interrupts para renovar atención

FORMATO:
[TÍTULO]: "ESTRATEGIAS DE HOOKS Y RETENCIÓN"

Desarrolla esta sección con al menos 600-800 palabras, enfocada en ayudar al creador a mantener alta retención.

Escribe:`;

  return await generarTexto(prompt, { provider, maxTokens: 3000 });
}

/**
 * Genera sugerencias de B-ROLL
 */
async function generarSugerenciasBRoll(tema, nicho, provider) {
  const prompt = `Crea una GUÍA DETALLADA de B-ROLL (metraje complementario) para un video sobre "${tema}" en el nicho de ${nicho}.

Esta sección debe incluir:
- Sugerencias específicas de qué mostrar visualmente en cada parte
- Tipos de tomas recomendadas (close-ups, wide shots, inserts, etc.)
- Momentos clave donde el B-roll es crucial
- Recursos donde encontrar B-roll (stock footage si aplica)
- Indicaciones de transiciones visuales

FORMATO:
[TÍTULO]: "GUÍA DE B-ROLL Y ELEMENTOS VISUALES"

Organiza por secciones del video e incluye descripciones específicas.
Al menos 600-800 palabras.

Escribe:`;

  return await generarTexto(prompt, { provider, maxTokens: 3000 });
}

/**
 * Genera guía de MÚSICA Y SONIDO
 */
async function generarGuiaMusicaSonido(tema, tono, provider) {
  const prompt = `Crea una GUÍA DE MÚSICA Y SONIDO para un video sobre "${tema}" con tono ${tono}.

Esta sección debe incluir:
- Momentos clave donde agregar música de fondo
- Tipo de música recomendada para cada sección (énergica, emotiva, épica, etc.)
- Indicaciones de efectos de sonido apropiados
- Momentos donde BAJAR o SILENCIAR la música (para énfasis)
- Niveles de volumen recomendados
- Sugerencias de bibliotecas de música libre de derechos

FORMATO:
[TÍTULO]: "GUÍA DE MÚSICA Y DISEÑO SONORO"

Organiza cronológicamente según el flujo del video.
Al menos 500-700 palabras.

Escribe:`;

  return await generarTexto(prompt, { provider, maxTokens: 2500 });
}

/**
 * Genera un guion largo con streaming en tiempo real
 * Esta función envía chunks del guion a medida que se generan
 * @param {Object} opciones - Opciones de configuración del guion
 * @param {Function} onChunk - Callback que recibe cada chunk generado
 * @returns {Promise<string>} - El guion completo generado
 */
export async function generarGuionLargoStream(opciones, onChunk) {
  const {
    tema,
    nicho = 'general',
    duracion = 30,
    tono = 'profesional',
    incluirIntro = true,
    incluirOutro = true,
    provider = 'groq'
  } = opciones;

  // Calcular palabras objetivo
  const palabrasObjetivo = duracion * 250;

  try {
    let guionCompleto = '';

    // Función helper para acumular y enviar chunks
    const acumularChunk = (chunk) => {
      guionCompleto += chunk;
      onChunk(chunk);
    };

    // 1. INTRO con streaming
    if (incluirIntro) {
      onChunk('\n\n═══ GENERANDO INTRODUCCIÓN ═══\n\n');
      const intro = await generarIntroduccionStream(tema, nicho, tono, provider, acumularChunk);
      guionCompleto += '\n\n';
      onChunk('\n\n');
    }

    // 2. CONTENIDO PRINCIPAL con streaming
    onChunk('\n\n═══ GENERANDO CONTENIDO PRINCIPAL ═══\n\n');
    const numeroSecciones = Math.max(5, Math.floor(duracion / 6));

    for (let i = 0; i < numeroSecciones; i++) {
      onChunk(`\n\n--- Sección ${i + 1}/${numeroSecciones} ---\n\n`);
      const seccion = await generarSeccionContenidoStream(
        tema, nicho, i + 1, numeroSecciones, tono, provider, acumularChunk
      );
      guionCompleto += '\n\n';
      onChunk('\n\n');

      // Transiciones entre secciones
      if (i < numeroSecciones - 1) {
        const transicion = await generarTransicionStream(tema, i + 1, provider, acumularChunk);
        guionCompleto += '\n\n';
        onChunk('\n\n');
      }
    }

    // 3. EJEMPLOS con streaming
    onChunk('\n\n═══ GENERANDO EJEMPLOS PRÁCTICOS ═══\n\n');
    const ejemplos = await generarEjemplosStream(tema, nicho, provider, acumularChunk);
    guionCompleto += '\n\n';
    onChunk('\n\n');

    // 4. FAQs con streaming
    onChunk('\n\n═══ GENERANDO PREGUNTAS FRECUENTES ═══\n\n');
    const faqs = await generarFAQsStream(tema, provider, acumularChunk);
    guionCompleto += '\n\n';
    onChunk('\n\n');

    // 5. CONCLUSIÓN con streaming
    if (incluirOutro) {
      onChunk('\n\n═══ GENERANDO CONCLUSIÓN ═══\n\n');
      const outro = await generarOutroStream(tema, nicho, tono, provider, acumularChunk);
      guionCompleto += '\n\n';
      onChunk('\n\n');
    }

    // 6. Contenido extra si es necesario
    const palabrasActuales = contarPalabras(guionCompleto);
    if (palabrasActuales < palabrasObjetivo) {
      onChunk('\n\n═══ EXPANDIENDO CONTENIDO ═══\n\n');
      const contenidoExtra = await generarContenidoExtraStream(
        tema, nicho, palabrasObjetivo - palabrasActuales, provider, acumularChunk
      );
      guionCompleto += '\n\n' + contenidoExtra;
    }

    return guionCompleto;
  } catch (error) {
    console.error('❌ Error generando guion con streaming:', error);
    throw error;
  }
}

// ===== FUNCIONES DE STREAMING PARA CADA SECCIÓN =====

async function generarIntroduccionStream(tema, nicho, tono, provider, onChunk) {
  const prompt = `Crea una introducción EXTENSA y ATRACTIVA para un video de YouTube de más de 30 minutos sobre "${tema}" en el nicho de ${nicho}.

La introducción debe:
- Tener al menos 800-1000 palabras
- Captar la atención inmediatamente con un gancho poderoso
- Explicar por qué este tema es relevante e importante AHORA
- Presentar estadísticas o datos impactantes
- Crear curiosidad sobre lo que se va a revelar
- Establecer credibilidad
- Tono: ${tono}

IMPORTANTE: Escribe TODO en primera persona, como si estuvieras hablando directamente a la cámara. Usa un lenguaje conversacional pero profesional.

Escribe la introducción COMPLETA (mínimo 800 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 4000, stream: true, onChunk });
}

async function generarSeccionContenidoStream(tema, nicho, numeroSeccion, totalSecciones, tono, provider, onChunk) {
  const prompt = `Crea la SECCIÓN ${numeroSeccion} de ${totalSecciones} para un video largo de YouTube sobre "${tema}" en el nicho de ${nicho}.

Esta sección debe:
- Tener al menos 1200-1500 palabras
- Profundizar en un aspecto específico del tema
- Incluir explicaciones detalladas paso a paso
- Proporcionar ejemplos concretos y específicos
- Usar analogías para facilitar la comprensión
- Incluir datos, estadísticas o investigaciones
- Mantener el interés con anécdotas relevantes
- Tono: ${tono}

FORMATO:
- Comienza con un subtítulo para esta sección
- Desarrolla el contenido de forma extensa y detallada
- Usa bullets o listas cuando sea apropiado
- Escribe en primera persona, estilo conversacional

Escribe la sección COMPLETA (mínimo 1200 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000, stream: true, onChunk });
}

async function generarTransicionStream(tema, numeroSeccion, provider, onChunk) {
  const prompt = `Crea una transición FLUIDA y NATURAL de 150-200 palabras para conectar la sección ${numeroSeccion} con la siguiente en un video sobre "${tema}".

La transición debe:
- Resumir brevemente el punto clave de la sección anterior
- Crear anticipación por la siguiente sección
- Mantener el ritmo del video
- Ser conversacional y natural

Escribe la transición COMPLETA:`;

  return await generarTexto(prompt, { provider, maxTokens: 1000, stream: true, onChunk });
}

async function generarEjemplosStream(tema, nicho, provider, onChunk) {
  const prompt = `Crea una sección EXTENSA de EJEMPLOS PRÁCTICOS y CASOS DE ESTUDIO para un video sobre "${tema}" en el nicho de ${nicho}.

Esta sección debe:
- Tener al menos 1500-2000 palabras
- Incluir 3-5 ejemplos detallados y específicos
- Cada ejemplo debe explicarse en profundidad
- Mostrar aplicaciones prácticas del concepto
- Incluir resultados, números o métricas cuando sea relevante
- Analizar por qué cada ejemplo es exitoso o instructivo

FORMATO:
[TÍTULO]: "EJEMPLOS PRÁCTICOS Y CASOS REALES"

Desarrolla cada ejemplo con TODO el detalle posible. Escribe la sección COMPLETA (mínimo 1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000, stream: true, onChunk });
}

async function generarFAQsStream(tema, provider, onChunk) {
  const prompt = `Crea una sección EXTENSA de PREGUNTAS FRECUENTES sobre "${tema}".

Esta sección debe:
- Tener al menos 1000-1500 palabras
- Incluir 5-7 preguntas que la audiencia realmente se hace
- Responder cada pregunta en PROFUNDIDAD (no respuestas cortas)
- Anticipar objeciones o dudas comunes
- Proporcionar claridad total

FORMATO:
[TÍTULO]: "PREGUNTAS QUE PROBABLEMENTE TE ESTÁS HACIENDO"

Para cada pregunta:
- Presenta la pregunta de forma natural
- Responde extensamente (200-250 palabras por respuesta)
- Incluye ejemplos si es relevante

Escribe la sección COMPLETA (mínimo 1000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000, stream: true, onChunk });
}

async function generarOutroStream(tema, nicho, tono, provider, onChunk) {
  const prompt = `Crea una CONCLUSIÓN PODEROSA y LLAMADA A LA ACCIÓN para un video de YouTube sobre "${tema}" en el nicho de ${nicho}.

El outro debe:
- Tener al menos 600-800 palabras
- Resumir los puntos clave cubiertos (sin repetir todo)
- Inspirar a la acción
- Incluir una llamada a la acción clara (suscribirse, comentar, etc.)
- Dejar una impresión final memorable
- Tono: ${tono}

IMPORTANTE: Hacer que valga la pena todo el tiempo invertido por el espectador.

Escribe el outro COMPLETO (mínimo 600 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 3000, stream: true, onChunk });
}

async function generarContenidoExtraStream(tema, nicho, palabrasNecesarias, provider, onChunk) {
  const prompt = `Genera aproximadamente ${palabrasNecesarias} palabras de CONTENIDO ADICIONAL valioso sobre "${tema}" en el nicho de ${nicho}.

Este contenido puede incluir:
- Tips y consejos adicionales muy específicos
- Errores comunes a evitar (explicados en detalle)
- Recursos y herramientas recomendadas
- Pasos siguientes y plan de acción
- Perspectivas avanzadas sobre el tema
- Tendencias futuras o evolución del tema

IMPORTANTE: NO repitas información ya cubierta. Todo debe ser contenido NUEVO y valioso.

Escribe el contenido adicional (aproximadamente ${palabrasNecesarias} palabras):`;

  return await generarTexto(prompt, {
    provider,
    maxTokens: Math.min(8000, palabrasNecesarias * 5),
    stream: true,
    onChunk
  });
}
