import { generarTexto } from '../config/iaProviders.js';

/**
 * Genera artículos profesionales optimizados para web/blog
 */
export async function generarArticulo(opciones) {
  const {
    titulo,
    tipo = 'blog', // blog, tutorial, opinion, investigacion, noticia, guia
    palabrasObjetivo = 2000,
    tono = 'profesional',
    tema,
    nichoArticulo = 'general',
    provider = 'groq',
    incluirSEO = true,
    incluirImagenes = true,
    incluirCTA = true,
    audiencia = 'general'
  } = opciones;

  console.log(`📝 Generando artículo: ${palabrasObjetivo} palabras - tipo: ${tipo}`);

  try {
    let articuloCompleto = '';

    // 1. TÍTULO Y HEADLINE
    console.log('📰 Generando título optimizado...');
    const headline = await generarTituloHeadline(titulo, tipo, tema, nichoArticulo, provider);
    articuloCompleto += headline + '\n\n';

    // 2. META DESCRIPCIÓN Y SEO
    if (incluirSEO) {
      console.log('🔍 Generando meta descripción y SEO...');
      const seo = await generarSEO(titulo, tema, nichoArticulo, provider);
      articuloCompleto += seo + '\n\n';
    }

    // 3. INTRODUCCIÓN ATRACTIVA
    console.log('✨ Creando introducción...');
    const introduccion = await generarIntroduccionArticulo(titulo, tipo, tema, tono, audiencia, provider);
    articuloCompleto += introduccion + '\n\n';

    // 4. TABLA DE CONTENIDOS
    console.log('📑 Generando tabla de contenidos...');
    const toc = await generarTablaContenidos(titulo, tipo, tema, palabrasObjetivo, provider);
    articuloCompleto += toc + '\n\n';

    // 5. CUERPO PRINCIPAL DEL ARTÍCULO
    console.log('📝 Desarrollando contenido principal...');
    const numeroSecciones = Math.ceil(palabrasObjetivo / 400); // Aprox 400 palabras por sección

    for (let i = 0; i < numeroSecciones; i++) {
      console.log(`   📄 Sección ${i + 1}/${numeroSecciones}...`);
      const seccion = await generarSeccionArticulo(
        titulo,
        tipo,
        tema,
        i + 1,
        numeroSecciones,
        tono,
        nichoArticulo,
        provider
      );
      articuloCompleto += seccion + '\n\n';
    }

    // 6. EJEMPLOS Y CASOS PRÁCTICOS
    console.log('💡 Agregando ejemplos prácticos...');
    const ejemplos = await generarEjemplosArticulo(titulo, tipo, tema, nichoArticulo, provider);
    articuloCompleto += ejemplos + '\n\n';

    // 7. ESTADÍSTICAS Y DATOS
    console.log('📊 Incluyendo estadísticas relevantes...');
    const estadisticas = await generarEstadisticas(titulo, tema, nichoArticulo, provider);
    articuloCompleto += estadisticas + '\n\n';

    // 8. TIPS Y CONSEJOS ACCIONABLES
    console.log('🎯 Creando tips accionables...');
    const tips = await generarTipsAccionables(titulo, tipo, tema, provider);
    articuloCompleto += tips + '\n\n';

    // 9. PREGUNTAS FRECUENTES
    console.log('❓ Generando FAQs...');
    const faqs = await generarFAQsArticulo(titulo, tema, provider);
    articuloCompleto += faqs + '\n\n';

    // 10. SUGERENCIAS DE IMÁGENES
    if (incluirImagenes) {
      console.log('🖼️ Sugiriendo imágenes...');
      const imagenes = await generarSugerenciasImagenes(titulo, tipo, tema, provider);
      articuloCompleto += imagenes + '\n\n';
    }

    // 11. RECURSOS Y ENLACES
    console.log('🔗 Compilando recursos adicionales...');
    const recursos = await generarRecursos(titulo, tema, nichoArticulo, provider);
    articuloCompleto += recursos + '\n\n';

    // 12. CONCLUSIÓN
    console.log('🏁 Escribiendo conclusión...');
    const conclusion = await generarConclusionArticulo(titulo, tipo, tema, tono, provider);
    articuloCompleto += conclusion + '\n\n';

    // 13. LLAMADA A LA ACCIÓN
    if (incluirCTA) {
      console.log('📢 Creando llamada a la acción...');
      const cta = await generarCTA(titulo, tipo, tema, audiencia, provider);
      articuloCompleto += cta + '\n\n';
    }

    // 14. KEYWORDS Y TAGS
    console.log('🏷️ Generando keywords y tags...');
    const keywords = await generarKeywordsTags(titulo, tema, nichoArticulo, provider);
    articuloCompleto += keywords + '\n\n';

    const palabrasFinales = contarPalabras(articuloCompleto);
    console.log(`✅ Artículo completado: ${palabrasFinales} palabras`);

    return articuloCompleto;
  } catch (error) {
    console.error('❌ Error generando artículo:', error);
    throw error;
  }
}

/**
 * Genera título optimizado
 */
async function generarTituloHeadline(titulo, tipo, tema, nicho, provider) {
  const prompt = `Crea un TÍTULO OPTIMIZADO para un artículo de ${tipo} sobre "${tema}" en el nicho de ${nicho}.

Genera:
1. Título principal (H1) - atractivo, SEO-friendly, 60-70 caracteres
2. Subtítulo o bajada (complementa el título, 100-150 caracteres)
3. 3-5 títulos alternativos para A/B testing

Los títulos deben:
- Ser claros y específicos
- Incluir keywords naturalmente
- Crear curiosidad o promesa de valor
- Ser clickeable pero no clickbait
- Seguir mejores prácticas SEO

FORMATO:
═══════════════════════════════════════
     TÍTULO Y HEADLINE
═══════════════════════════════════════

Escribe los títulos COMPLETOS (400-500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 2000 });
}

/**
 * Genera SEO metadata
 */
async function generarSEO(titulo, tema, nicho, provider) {
  const prompt = `Crea el SEO COMPLETO para un artículo titulado "${titulo}" sobre "${tema}" en ${nicho}.

Debe incluir:
- Meta Title (55-60 caracteres, optimizado para CTR)
- Meta Description (150-160 caracteres, persuasiva)
- Focus Keyword principal
- Keywords secundarias (5-7 keywords)
- URL slug recomendada
- Schema markup sugerido (tipo de contenido)
- Open Graph tags recomendados
- Estrategia de internal linking
- Anchor texts sugeridos

FORMATO:
═══════════════════════════════════════
        SEO Y METADATA
═══════════════════════════════════════

Escribe el SEO COMPLETO (600-800 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 3000 });
}

/**
 * Genera introducción
 */
async function generarIntroduccionArticulo(titulo, tipo, tema, tono, audiencia, provider) {
  const prompt = `Escribe una INTRODUCCIÓN ATRACTIVA para un artículo de ${tipo} titulado "${titulo}" sobre "${tema}" para audiencia ${audiencia}.

La introducción debe (400-600 palabras):
- Hook o gancho inicial (primera frase impactante)
- Presentar el problema o contexto
- Explicar por qué es importante AHORA
- Establecer credibilidad
- Prometer qué aprenderá el lector
- Incluir una estadística o dato relevante
- Tono: ${tono}
- Usar técnicas de copywriting (AIDA, PAS, etc.)

FORMATO:
═══════════════════════════════════════
        INTRODUCCIÓN
═══════════════════════════════════════

Escribe la introducción COMPLETA (400-600 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 2500 });
}

/**
 * Genera tabla de contenidos
 */
async function generarTablaContenidos(titulo, tipo, tema, palabras, provider) {
  const prompt = `Crea una TABLA DE CONTENIDOS (ToC) para un artículo de ${tipo} de ${palabras} palabras sobre "${tema}".

La tabla debe:
- Listar 5-10 secciones principales (H2)
- Incluir subsecciones relevantes (H3) bajo cada H2
- Ser lógica y fácil de seguir
- Usar keywords naturalmente en los títulos
- Seguir un flujo narrativo claro
- Ser clickeable (formato para web)

FORMATO:
═══════════════════════════════════════
      TABLA DE CONTENIDOS
═══════════════════════════════════════

Escribe la ToC COMPLETA (500-700 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 2500 });
}

/**
 * Genera una sección del artículo
 */
async function generarSeccionArticulo(titulo, tipo, tema, numeroSeccion, totalSecciones, tono, nicho, provider) {
  const prompt = `Escribe la SECCIÓN ${numeroSeccion} de ${totalSecciones} para un artículo de ${tipo} sobre "${tema}" en ${nicho}.

La sección debe:
- Tener 350-500 palabras
- Comenzar con un H2 descriptivo y SEO-friendly
- Desarrollar un aspecto específico del tema
- Incluir párrafos cortos (2-3 oraciones)
- Usar bullet points cuando sea apropiado
- Incluir ejemplos concretos
- Mantener el tono ${tono}
- Enlazar naturalmente con la siguiente sección
- Ser escaneable (fácil de leer rápido)

FORMATO:
═══════════════════════════════════════
  SECCIÓN ${numeroSeccion}
═══════════════════════════════════════

Escribe la sección COMPLETA (350-500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 2500 });
}

/**
 * Genera ejemplos prácticos
 */
async function generarEjemplosArticulo(titulo, tipo, tema, nicho, provider) {
  const prompt = `Crea 3-5 EJEMPLOS PRÁCTICOS para un artículo de ${tipo} sobre "${tema}" en ${nicho}.

Cada ejemplo debe:
- Ser real y específico (o realista si es ficticio)
- Incluir detalles concretos
- Mostrar aplicación práctica
- Tener 150-250 palabras
- Incluir resultados o aprendizajes
- Ser relevante para diferentes audiencias

FORMATO:
═══════════════════════════════════════
       EJEMPLOS PRÁCTICOS
═══════════════════════════════════════

Escribe los ejemplos COMPLETOS (600-900 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 3500 });
}

/**
 * Genera estadísticas
 */
async function generarEstadisticas(titulo, tema, nicho, provider) {
  const prompt = `Genera ESTADÍSTICAS Y DATOS relevantes para un artículo sobre "${tema}" en ${nicho}.

Debe incluir:
- 8-12 estadísticas impactantes
- Datos actuales (2024-2025)
- Fuentes creíbles (mencionar tipo de fuente)
- Contexto para cada estadística
- Visualización sugerida (gráfico, infografía)
- Interpretación de los datos
- Proyecciones futuras si aplica

FORMATO:
═══════════════════════════════════════
      ESTADÍSTICAS Y DATOS
═══════════════════════════════════════

Escribe las estadísticas COMPLETAS (700-1000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 3500 });
}

/**
 * Genera tips accionables
 */
async function generarTipsAccionables(titulo, tipo, tema, provider) {
  const prompt = `Crea 7-10 TIPS ACCIONABLES para un artículo de ${tipo} sobre "${tema}".

Cada tip debe:
- Ser específico y accionable
- Incluir el "cómo" (pasos concretos)
- Tener 80-150 palabras
- Ser práctico e implementable inmediatamente
- Incluir resultados esperados
- Estar numerado y tener un título descriptivo

FORMATO:
═══════════════════════════════════════
      TIPS ACCIONABLES
═══════════════════════════════════════

Escribe los tips COMPLETOS (800-1200 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 4000 });
}

/**
 * Genera FAQs
 */
async function generarFAQsArticulo(titulo, tema, provider) {
  const prompt = `Crea una sección de PREGUNTAS FRECUENTES para un artículo sobre "${tema}".

Debe incluir:
- 6-10 preguntas que los lectores realmente se hacen
- Preguntas optimizadas para featured snippets
- Respuestas concisas pero completas (100-200 palabras cada una)
- Usar formato de schema FAQ
- Incluir long-tail keywords naturalmente

FORMATO:
═══════════════════════════════════════
      PREGUNTAS FRECUENTES
═══════════════════════════════════════

Escribe las FAQs COMPLETAS (800-1200 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 4000 });
}

/**
 * Genera sugerencias de imágenes
 */
async function generarSugerenciasImagenes(titulo, tipo, tema, provider) {
  const prompt = `Sugiere IMÁGENES Y ELEMENTOS VISUALES para un artículo de ${tipo} sobre "${tema}".

Debe incluir:
- Imagen destacada (descripción + keywords para búsqueda)
- 5-8 imágenes en el cuerpo (con ubicación sugerida)
- Alt text optimizado para cada imagen
- Infografías recomendadas (contenido sugerido)
- Screenshots o capturas (si aplica)
- Videos embebidos recomendados
- Gráficos o charts sugeridos

FORMATO:
═══════════════════════════════════════
    SUGERENCIAS DE IMÁGENES
═══════════════════════════════════════

Escribe las sugerencias COMPLETAS (600-800 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 3000 });
}

/**
 * Genera recursos y enlaces
 */
async function generarRecursos(titulo, tema, nicho, provider) {
  const prompt = `Compila RECURSOS Y ENLACES ADICIONALES para un artículo sobre "${tema}" en ${nicho}.

Debe incluir:
- Herramientas recomendadas (8-12 herramientas con descripción)
- Lecturas adicionales (artículos/libros relacionados)
- Cursos o capacitaciones
- Comunidades o foros relevantes
- Documentación oficial
- Plantillas o templates útiles
- Para cada recurso: nombre, descripción breve, por qué es útil

FORMATO:
═══════════════════════════════════════
    RECURSOS ADICIONALES
═══════════════════════════════════════

Escribe los recursos COMPLETOS (800-1000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 3500 });
}

/**
 * Genera conclusión
 */
async function generarConclusionArticulo(titulo, tipo, tema, tono, provider) {
  const prompt = `Escribe una CONCLUSIÓN PODEROSA para un artículo de ${tipo} sobre "${tema}" con tono ${tono}.

La conclusión debe (400-600 palabras):
- Resumir puntos clave (sin repetir todo)
- Reforzar el mensaje principal
- Inspirar a la acción
- Dejar una impresión duradera
- Conectar con la introducción (cierre de círculo)
- Incluir una reflexión final
- Preparar para el CTA

FORMATO:
═══════════════════════════════════════
         CONCLUSIÓN
═══════════════════════════════════════

Escribe la conclusión COMPLETA (400-600 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 2500 });
}

/**
 * Genera Call-to-Action
 */
async function generarCTA(titulo, tipo, tema, audiencia, provider) {
  const prompt = `Crea una LLAMADA A LA ACCIÓN efectiva para un artículo de ${tipo} sobre "${tema}" dirigido a ${audiencia}.

El CTA debe:
- Ser claro y específico
- Ofrecer valor
- Crear urgencia (sin ser agresivo)
- Incluir 3 versiones diferentes:
  1. CTA principal (botón o banner)
  2. CTA secundario (en texto)
  3. CTA para redes sociales
- Cada versión: 50-150 palabras

FORMATO:
═══════════════════════════════════════
      LLAMADA A LA ACCIÓN
═══════════════════════════════════════

Escribe los CTAs COMPLETOS (400-600 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 2500 });
}

/**
 * Genera keywords y tags
 */
async function generarKeywordsTags(titulo, tema, nicho, provider) {
  const prompt = `Genera KEYWORDS Y TAGS para un artículo sobre "${tema}" en ${nicho}.

Debe incluir:
- Primary keyword (1)
- Secondary keywords (5-7)
- Long-tail keywords (10-15)
- LSI keywords (Latent Semantic Indexing)
- Tags para categorización
- Keywords de la competencia
- Keywords de oportunidad (bajo competencia, buena búsqueda)
- Análisis de keyword difficulty

FORMATO:
═══════════════════════════════════════
       KEYWORDS Y TAGS
═══════════════════════════════════════

Escribe las keywords COMPLETAS (500-700 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 2500 });
}

/**
 * Cuenta palabras
 */
function contarPalabras(texto) {
  return texto.split(/\s+/).filter(palabra => palabra.length > 0).length;
}
