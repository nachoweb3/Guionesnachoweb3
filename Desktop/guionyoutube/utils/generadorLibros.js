import { generarTexto } from '../config/iaProviders.js';

/**
 * Genera un guion completo para un libro
 * Incluye: estructura, capítulos, personajes, sinopsis, etc.
 */
export async function generarGuionLibro(opciones) {
  const {
    titulo,
    genero = 'ficcion',
    numeroCapitulos = 20,
    palabrasPorCapitulo = 3000,
    tono = 'narrativo',
    tema,
    provider = 'groq',
    incluirPersonajes = true,
    incluirSinopsis = true,
    incluirArcoNarrativo = true
  } = opciones;

  const palabrasObjetivo = numeroCapitulos * palabrasPorCapitulo;

  console.log(`📚 Generando guion de libro: ${palabrasObjetivo} palabras en ${numeroCapitulos} capítulos`);

  try {
    let guionCompleto = '';

    // 1. TÍTULO Y CONCEPTO
    console.log('📖 Generando título y concepto...');
    const concepto = await generarConceptoLibro(titulo, genero, tema, tono, provider);
    guionCompleto += concepto + '\n\n';

    // 2. SINOPSIS COMPLETA
    if (incluirSinopsis) {
      console.log('📝 Generando sinopsis...');
      const sinopsis = await generarSinopsisLibro(titulo, genero, tema, numeroCapitulos, provider);
      guionCompleto += sinopsis + '\n\n';
    }

    // 3. DESARROLLO DE PERSONAJES
    if (incluirPersonajes) {
      console.log('👥 Desarrollando personajes...');
      const personajes = await generarPersonajesLibro(titulo, genero, tema, provider);
      guionCompleto += personajes + '\n\n';
    }

    // 4. ARCO NARRATIVO Y ESTRUCTURA
    if (incluirArcoNarrativo) {
      console.log('📊 Creando arco narrativo...');
      const arcoNarrativo = await generarArcoNarrativo(titulo, genero, numeroCapitulos, provider);
      guionCompleto += arcoNarrativo + '\n\n';
    }

    // 5. DESARROLLO DE CAPÍTULOS
    console.log('📚 Generando estructura de capítulos...');
    for (let i = 0; i < numeroCapitulos; i++) {
      console.log(`   📄 Capítulo ${i + 1}/${numeroCapitulos}...`);
      const capitulo = await generarCapituloLibro(
        titulo,
        genero,
        tema,
        i + 1,
        numeroCapitulos,
        palabrasPorCapitulo,
        tono,
        provider
      );
      guionCompleto += capitulo + '\n\n';
    }

    // 6. ESCENAS CLAVE
    console.log('🎬 Generando escenas clave...');
    const escenasClave = await generarEscenasClave(titulo, genero, tema, provider);
    guionCompleto += escenasClave + '\n\n';

    // 7. DIÁLOGOS DESTACADOS
    console.log('💬 Creando diálogos destacados...');
    const dialogos = await generarDialogosDestacados(titulo, genero, tema, provider);
    guionCompleto += dialogos + '\n\n';

    // 8. TEMAS Y SUBTEXTOS
    console.log('🎨 Desarrollando temas y subtextos...');
    const temas = await generarTemasSubtextos(titulo, genero, tema, provider);
    guionCompleto += temas + '\n\n';

    // 9. WORLDBUILDING (para ficción/fantasía)
    if (genero === 'fantasia' || genero === 'ciencia-ficcion' || genero === 'ficcion') {
      console.log('🌍 Creando worldbuilding...');
      const worldbuilding = await generarWorldbuilding(titulo, genero, tema, provider);
      guionCompleto += worldbuilding + '\n\n';
    }

    // 10. NOTAS DEL AUTOR
    console.log('📌 Generando notas del autor...');
    const notas = await generarNotasAutor(titulo, genero, tema, provider);
    guionCompleto += notas + '\n\n';

    const palabrasFinales = contarPalabras(guionCompleto);
    console.log(`✅ Guion de libro completado: ${palabrasFinales} palabras`);

    return guionCompleto;
  } catch (error) {
    console.error('❌ Error generando guion de libro:', error);
    throw error;
  }
}

/**
 * Genera el concepto del libro
 */
async function generarConceptoLibro(titulo, genero, tema, tono, provider) {
  const prompt = `Crea el CONCEPTO CENTRAL para un libro titulado "${titulo}" del género ${genero} sobre "${tema}".

El concepto debe incluir:
- Título definitivo (si el actual es provisional, mejóralo)
- Premisa principal en 2-3 párrafos
- Hook o gancho principal (¿qué hace único este libro?)
- Público objetivo
- Tono general: ${tono}
- Objetivo narrativo o mensaje central

FORMATO:
═══════════════════════════════════════
        CONCEPTO DEL LIBRO
═══════════════════════════════════════

Escribe el concepto COMPLETO (800-1000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 4000 });
}

/**
 * Genera la sinopsis del libro
 */
async function generarSinopsisLibro(titulo, genero, tema, numeroCapitulos, provider) {
  const prompt = `Crea una SINOPSIS COMPLETA para "${titulo}" - un libro de ${genero} sobre "${tema}" con ${numeroCapitulos} capítulos.

La sinopsis debe:
- Tener 1500-2000 palabras
- Describir la trama completa del principio al fin
- Incluir los puntos de giro principales
- Presentar el conflicto central
- Describir el climax y resolución
- NO ocultar el final (esto es para el autor, no para marketing)

FORMATO:
═══════════════════════════════════════
        SINOPSIS COMPLETA
═══════════════════════════════════════

Escribe la sinopsis COMPLETA (1500-2000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Desarrolla los personajes principales
 */
async function generarPersonajesLibro(titulo, genero, tema, provider) {
  const prompt = `Crea un DESARROLLO PROFUNDO de PERSONAJES para "${titulo}" - género ${genero} sobre "${tema}".

Desarrolla 5-8 personajes principales con:
- Nombre y edad
- Descripción física y personalidad
- Motivaciones y miedos
- Arco de transformación
- Relaciones con otros personajes
- Backstory (historia previa)
- Rol en la trama

Cada personaje debe tener 300-400 palabras de desarrollo.

FORMATO:
═══════════════════════════════════════
     DESARROLLO DE PERSONAJES
═══════════════════════════════════════

Escribe el desarrollo COMPLETO de personajes (2000-2500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 8000 });
}

/**
 * Genera el arco narrativo
 */
async function generarArcoNarrativo(titulo, genero, numeroCapitulos, provider) {
  const prompt = `Crea el ARCO NARRATIVO COMPLETO para "${titulo}" - ${genero} con ${numeroCapitulos} capítulos.

Estructura usando el modelo clásico:
1. Exposición (acto 1: primeros 20-25% de capítulos)
2. Conflicto creciente (acto 2a: siguiente 25%)
3. Punto medio crucial (capítulo central)
4. Intensificación (acto 2b: siguiente 25%)
5. Clímax (acto 3: últimos 25%)
6. Resolución

Para cada fase:
- Describe qué sucede narrativamente
- Indica qué capítulos corresponden
- Marca los puntos de giro clave
- Desarrollo emocional

FORMATO:
═══════════════════════════════════════
        ARCO NARRATIVO
═══════════════════════════════════════

Escribe el arco COMPLETO (1500-2000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera la estructura de un capítulo
 */
async function generarCapituloLibro(titulo, genero, tema, numeroCapitulo, totalCapitulos, palabrasObjetivo, tono, provider) {
  const prompt = `Crea la ESTRUCTURA DETALLADA del CAPÍTULO ${numeroCapitulo} de ${totalCapitulos} para "${titulo}" - ${genero} sobre "${tema}".

El capítulo debe tener aproximadamente ${palabrasObjetivo} palabras y debe incluir:
- Título del capítulo
- Resumen de lo que sucede (500-800 palabras)
- Escenas principales (3-5 escenas con descripción)
- Desarrollo de personajes en este capítulo
- Puntos de trama importantes
- Conflictos que se introducen o resuelven
- Hook o gancho para el siguiente capítulo
- Tono: ${tono}

FORMATO:
═══════════════════════════════════════
   CAPÍTULO ${numeroCapitulo}: [TÍTULO]
═══════════════════════════════════════

Escribe la estructura COMPLETA del capítulo (1000-1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera escenas clave
 */
async function generarEscenasClave(titulo, genero, tema, provider) {
  const prompt = `Crea 5-7 ESCENAS CLAVE detalladas para "${titulo}" - ${genero} sobre "${tema}".

Cada escena debe incluir:
- Nombre/título de la escena
- En qué capítulo sucede (aproximado)
- Descripción detallada de la escena (300-500 palabras)
- Qué personajes están presentes
- Diálogo importante (si lo hay)
- Por qué esta escena es crucial para la trama
- Impacto emocional

FORMATO:
═══════════════════════════════════════
        ESCENAS CLAVE
═══════════════════════════════════════

Escribe las escenas COMPLETAS (2000-3000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 8000 });
}

/**
 * Genera diálogos destacados
 */
async function generarDialogosDestacados(titulo, genero, tema, provider) {
  const prompt = `Crea 8-10 DIÁLOGOS DESTACADOS para "${titulo}" - ${genero} sobre "${tema}".

Para cada diálogo:
- Contexto de la escena (dónde y cuándo ocurre)
- Personajes involucrados
- El diálogo completo (150-300 palabras)
- Subtexto o significado profundo
- Impacto en la trama

Incluye variedad: diálogos emocionales, tensos, reveladores, humorísticos, etc.

FORMATO:
═══════════════════════════════════════
      DIÁLOGOS DESTACADOS
═══════════════════════════════════════

Escribe los diálogos COMPLETOS (1500-2000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera temas y subtextos
 */
async function generarTemasSubtextos(titulo, genero, tema, provider) {
  const prompt = `Desarrolla los TEMAS y SUBTEXTOS para "${titulo}" - ${genero} sobre "${tema}".

Debe incluir:
- Tema principal (explicado en profundidad)
- 3-4 subtemas importantes
- Cómo se manifiestan estos temas en la narrativa
- Simbolismo relevante
- Mensaje o reflexión que el libro ofrece
- Interpretaciones posibles

FORMATO:
═══════════════════════════════════════
      TEMAS Y SUBTEXTOS
═══════════════════════════════════════

Escribe el desarrollo de temas COMPLETO (1200-1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}

/**
 * Genera worldbuilding
 */
async function generarWorldbuilding(titulo, genero, tema, provider) {
  const prompt = `Crea el WORLDBUILDING detallado para "${titulo}" - ${genero} sobre "${tema}".

Desarrolla:
- Descripción del mundo/universo
- Geografía y lugares importantes
- Sistema social, político o mágico (si aplica)
- Historia del mundo
- Cultura y costumbres
- Reglas del mundo (físicas, mágicas, tecnológicas)
- Detalles que hacen el mundo creíble y único

FORMATO:
═══════════════════════════════════════
        WORLDBUILDING
═══════════════════════════════════════

Escribe el worldbuilding COMPLETO (1500-2000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera notas del autor
 */
async function generarNotasAutor(titulo, genero, tema, provider) {
  const prompt = `Crea NOTAS DEL AUTOR para "${titulo}" - ${genero} sobre "${tema}".

Incluye:
- Inspiración para el libro
- Desafíos en la escritura
- Decisiones creativas importantes
- Investigación realizada (si aplica)
- Agradecimientos sugeridos
- Reflexiones sobre el proceso
- Consejos para escribir este tipo de historia

FORMATO:
═══════════════════════════════════════
        NOTAS DEL AUTOR
═══════════════════════════════════════

Escribe las notas COMPLETAS (800-1000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 4000 });
}

/**
 * Cuenta palabras
 */
function contarPalabras(texto) {
  return texto.split(/\s+/).filter(palabra => palabra.length > 0).length;
}
