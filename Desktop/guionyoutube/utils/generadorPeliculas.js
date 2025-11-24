import { generarTexto } from '../config/iaProviders.js';

/**
 * Genera un guion completo para película o cortometraje
 */
export async function generarGuionPelicula(opciones) {
  const {
    titulo,
    genero = 'drama',
    duracion = 90, // minutos
    formato = 'largometraje', // largometraje, cortometraje
    tono = 'serio',
    tema,
    provider = 'groq',
    incluirTratamiento = true,
    incluirPersonajes = true,
    incluirEscenas = true
  } = opciones;

  // 1 página de guion ≈ 1 minuto de película
  const paginasObjetivo = duracion;

  console.log(`🎬 Generando guion de película: ${duracion} minutos (${paginasObjetivo} páginas aprox.)`);

  try {
    let guionCompleto = '';

    // 1. PORTADA
    console.log('📄 Generando portada...');
    const portada = await generarPortadaPelicula(titulo, genero, formato, provider);
    guionCompleto += portada + '\n\n';

    // 2. LOGLINE Y SINOPSIS
    console.log('📝 Generando logline y sinopsis...');
    const logline = await generarLoglineSinopsis(titulo, genero, tema, duracion, provider);
    guionCompleto += logline + '\n\n';

    // 3. TRATAMIENTO (si está habilitado)
    if (incluirTratamiento) {
      console.log('📖 Generando tratamiento...');
      const tratamiento = await generarTratamiento(titulo, genero, tema, duracion, provider);
      guionCompleto += tratamiento + '\n\n';
    }

    // 4. PERSONAJES
    if (incluirPersonajes) {
      console.log('👥 Desarrollando personajes...');
      const personajes = await generarPersonajesPelicula(titulo, genero, tema, provider);
      guionCompleto += personajes + '\n\n';
    }

    // 5. ESTRUCTURA EN TRES ACTOS
    console.log('🎭 Creando estructura en tres actos...');
    const estructura = await generarEstructuraTresActos(titulo, genero, tema, duracion, provider);
    guionCompleto += estructura + '\n\n';

    // 6. ESCALETA (Beat Sheet)
    console.log('📋 Generando escaleta...');
    const escaleta = await generarEscaleta(titulo, genero, tema, duracion, provider);
    guionCompleto += escaleta + '\n\n';

    // 7. ESCENAS PRINCIPALES
    if (incluirEscenas) {
      console.log('🎬 Desarrollando escenas principales...');
      const numeroEscenas = Math.floor(duracion / 3); // Aprox 1 escena cada 3 min

      for (let i = 0; i < Math.min(numeroEscenas, 20); i++) { // Máximo 20 escenas detalladas
        console.log(`   🎞️ Escena ${i + 1}/${Math.min(numeroEscenas, 20)}...`);
        const escena = await generarEscenaPelicula(
          titulo,
          genero,
          tema,
          i + 1,
          numeroEscenas,
          duracion,
          tono,
          provider
        );
        guionCompleto += escena + '\n\n';
      }
    }

    // 8. DIÁLOGOS CLAVE
    console.log('💬 Creando diálogos clave...');
    const dialogos = await generarDialogosClave(titulo, genero, tema, provider);
    guionCompleto += dialogos + '\n\n';

    // 9. INDICACIONES DE PRODUCCIÓN
    console.log('🎥 Generando indicaciones de producción...');
    const produccion = await generarIndicacionesProduccion(titulo, genero, duracion, provider);
    guionCompleto += produccion + '\n\n';

    // 10. LOCACIONES
    console.log('📍 Describiendo locaciones...');
    const locaciones = await generarLocaciones(titulo, genero, tema, provider);
    guionCompleto += locaciones + '\n\n';

    // 11. ATMÓSFERA Y ESTÉTICA
    console.log('🎨 Definiendo atmósfera y estética...');
    const atmosfera = await generarAtmosferaEstetica(titulo, genero, tema, tono, provider);
    guionCompleto += atmosfera + '\n\n';

    // 12. MÚSICA Y SONIDO
    console.log('🎵 Creando guía de música y sonido...');
    const musica = await generarMusicaSonido(titulo, genero, tono, provider);
    guionCompleto += musica + '\n\n';

    const palabrasFinales = contarPalabras(guionCompleto);
    console.log(`✅ Guion de película completado: ${palabrasFinales} palabras`);

    return guionCompleto;
  } catch (error) {
    console.error('❌ Error generando guion de película:', error);
    throw error;
  }
}

/**
 * Genera la portada del guion
 */
async function generarPortadaPelicula(titulo, genero, formato, provider) {
  const prompt = `Crea la PORTADA profesional para un guion de ${formato} titulado "${titulo}" del género ${genero}.

Debe incluir (en formato de guion cinematográfico):
- Título en mayúsculas y centrado
- "Un ${formato} de [género]"
- "Guion escrito por [dejar espacio para autor]"
- Información de contacto (placeholder)
- Número de registro WGA (placeholder)
- Fecha

FORMATO:
═══════════════════════════════════════
           PORTADA
═══════════════════════════════════════

Escribe la portada completa (200-300 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 1500 });
}

/**
 * Genera logline y sinopsis
 */
async function generarLoglineSinopsis(titulo, genero, tema, duracion, provider) {
  const prompt = `Crea el LOGLINE y SINOPSIS para "${titulo}" - un ${genero} de ${duracion} minutos sobre "${tema}".

Debe incluir:
1. LOGLINE (1-2 oraciones que capturan la esencia de la película)
2. SINOPSIS CORTA (1 párrafo de 100-150 palabras)
3. SINOPSIS EXTENDIDA (3-4 párrafos de 500-800 palabras total)

La sinopsis debe capturar:
- Protagonista y su objetivo
- Conflicto central
- Antagonista o fuerza opositora
- Stakes (qué está en juego)
- Puntos de giro principales
- Clímax y resolución

FORMATO:
═══════════════════════════════════════
     LOGLINE Y SINOPSIS
═══════════════════════════════════════

Escribe el logline y sinopsis COMPLETOS (1000-1200 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 4000 });
}

/**
 * Genera tratamiento cinematográfico
 */
async function generarTratamiento(titulo, genero, tema, duracion, provider) {
  const prompt = `Crea un TRATAMIENTO CINEMATOGRÁFICO completo para "${titulo}" - ${genero} de ${duracion} minutos sobre "${tema}".

El tratamiento debe:
- Tener 2000-3000 palabras
- Narrar la historia completa en presente
- Describir cada escena importante
- Incluir desarrollo de personajes
- Describir el viaje emocional
- Mostrar la progresión dramática
- Escribirse en prosa, no en formato de guion

FORMATO:
═══════════════════════════════════════
          TRATAMIENTO
═══════════════════════════════════════

Escribe el tratamiento COMPLETO (2000-3000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 8000 });
}

/**
 * Desarrolla personajes
 */
async function generarPersonajesPelicula(titulo, genero, tema, provider) {
  const prompt = `Desarrolla los PERSONAJES PRINCIPALES para "${titulo}" - ${genero} sobre "${tema}".

Para cada personaje (4-6 personajes principales):
- Nombre y edad
- Descripción física (para casting)
- Personalidad y traits
- Objetivo y motivación
- Flaw (defecto fatal)
- Arco de transformación
- Backstory esencial
- Relaciones con otros personajes

Cada personaje: 250-400 palabras

FORMATO:
═══════════════════════════════════════
     DESARROLLO DE PERSONAJES
═══════════════════════════════════════

Escribe el desarrollo COMPLETO (1500-2000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera estructura en tres actos
 */
async function generarEstructuraTresActos(titulo, genero, tema, duracion, provider) {
  const prompt = `Crea la ESTRUCTURA EN TRES ACTOS para "${titulo}" - ${genero} de ${duracion} minutos sobre "${tema}".

ACTO 1 (primeros 25% - ${Math.floor(duracion * 0.25)} minutos):
- Mundo ordinario
- Inciting incident (incidente detonante)
- Primer punto de giro

ACTO 2A (siguiente 25% - ${Math.floor(duracion * 0.25)} minutos):
- Complicaciones crecientes
- Subtramas
- Midpoint (punto medio crucial)

ACTO 2B (siguiente 25% - ${Math.floor(duracion * 0.25)} minutos):
- Todo parece perdido
- Dark night of the soul
- Segundo punto de giro

ACTO 3 (último 25% - ${Math.floor(duracion * 0.25)} minutos):
- Clímax
- Resolución
- Nuevo equilibrio

Para cada acto:
- Qué sucede narrativamente
- Timing específico en minutos
- Estados emocionales
- Desarrollo de personajes

FORMATO:
═══════════════════════════════════════
     ESTRUCTURA EN TRES ACTOS
═══════════════════════════════════════

Escribe la estructura COMPLETA (1500-2000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera escaleta
 */
async function generarEscaleta(titulo, genero, tema, duracion, provider) {
  const prompt = `Crea una ESCALETA detallada (Beat Sheet) para "${titulo}" - ${genero} de ${duracion} minutos sobre "${tema}".

La escaleta debe listar 30-50 beats (momentos clave) con:
- Número de beat
- Tiempo aproximado (en minutos)
- Descripción breve (1-2 oraciones)
- Qué avanza en la trama

Cubre toda la película del minuto 0 al ${duracion}.

FORMATO:
═══════════════════════════════════════
           ESCALETA
═══════════════════════════════════════

BEAT 1 - Min 0:00
[Descripción]

BEAT 2 - Min X:XX
[Descripción]

...

Escribe la escaleta COMPLETA (2000-2500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 8000 });
}

/**
 * Genera una escena específica
 */
async function generarEscenaPelicula(titulo, genero, tema, numeroEscena, totalEscenas, duracion, tono, provider) {
  const prompt = `Escribe la ESCENA ${numeroEscena} de ${totalEscenas} para "${titulo}" - ${genero} sobre "${tema}".

La escena debe incluir:
- Encabezado de escena: INT./EXT. - LOCACIÓN - DÍA/NOCHE
- Descripción de la acción (visual, activa, presente)
- Diálogos (si los hay) con nombres de personajes
- Indicaciones de actuación (parentéticas) cuando sea crucial
- Transiciones (CUT TO, FADE TO, etc.)
- Tono: ${tono}

Formato estándar de guion cinematográfico:
- Descripciones en minúsculas, verbos en presente
- Nombres de personajes en MAYÚSCULAS al presentarlos
- Diálogos centrados con nombre arriba

Duración aproximada de la escena: ${Math.floor(duracion / totalEscenas)} minutos

FORMATO:
═══════════════════════════════════════
   ESCENA ${numeroEscena}
═══════════════════════════════════════

Escribe la escena COMPLETA en formato de guion (800-1200 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}

/**
 * Genera diálogos clave
 */
async function generarDialogosClave(titulo, genero, tema, provider) {
  const prompt = `Crea 8-10 DIÁLOGOS CLAVE memorables para "${titulo}" - ${genero} sobre "${tema}".

Para cada diálogo:
- Contexto de la escena
- Personajes involucrados
- Diálogo completo (formato de guion)
- Subtexto
- Por qué es memorable o importante

Incluye variedad: diálogos dramáticos, reveladores, emotivos, tensos, etc.

FORMATO:
═══════════════════════════════════════
        DIÁLOGOS CLAVE
═══════════════════════════════════════

Escribe los diálogos COMPLETOS (1500-2000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera indicaciones de producción
 */
async function generarIndicacionesProduccion(titulo, genero, duracion, provider) {
  const prompt = `Crea INDICACIONES DE PRODUCCIÓN para "${titulo}" - ${genero} de ${duracion} minutos.

Debe incluir:
- Presupuesto estimado (bajo/medio/alto) y justificación
- Locaciones necesarias (cantidad y tipo)
- Tamaño de cast recomendado
- Equipo técnico esencial
- Efectos especiales o VFX necesarios
- Requisitos de sonido y música
- Días de rodaje estimados
- Desafíos de producción previstos
- Consejos para directores y productores

FORMATO:
═══════════════════════════════════════
    INDICACIONES DE PRODUCCIÓN
═══════════════════════════════════════

Escribe las indicaciones COMPLETAS (1200-1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}

/**
 * Genera locaciones
 */
async function generarLocaciones(titulo, genero, tema, provider) {
  const prompt = `Describe las LOCACIONES principales para "${titulo}" - ${genero} sobre "${tema}".

Para cada locación (5-10 locaciones):
- Nombre de la locación
- Descripción visual detallada
- Atmósfera y mood
- Importancia narrativa
- Escenas que suceden allí
- Referencias visuales sugeridas
- Consideraciones de producción

FORMATO:
═══════════════════════════════════════
          LOCACIONES
═══════════════════════════════════════

Escribe las locaciones COMPLETAS (1200-1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}

/**
 * Genera atmósfera y estética
 */
async function generarAtmosferaEstetica(titulo, genero, tema, tono, provider) {
  const prompt = `Define la ATMÓSFERA Y ESTÉTICA VISUAL para "${titulo}" - ${genero} sobre "${tema}" con tono ${tono}.

Debe incluir:
- Paleta de colores (con significado)
- Estilo de cinematografía (movimientos de cámara, encuadres)
- Iluminación (mood lighting para diferentes escenas)
- Diseño de producción (art direction)
- Vestuario y caracterización
- Referencias visuales (películas, pinturas, fotografía)
- Estilo de edición
- Transiciones y ritmo visual

FORMATO:
═══════════════════════════════════════
     ATMÓSFERA Y ESTÉTICA
═══════════════════════════════════════

Escribe la guía estética COMPLETA (1200-1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}

/**
 * Genera música y sonido
 */
async function generarMusicaSonido(titulo, genero, tono, provider) {
  const prompt = `Crea una GUÍA DE MÚSICA Y DISEÑO SONORO para "${titulo}" - ${genero} con tono ${tono}.

Debe incluir:
- Estilo musical general
- Temas musicales (leitmotifs) para personajes o situaciones
- Momentos clave para música original
- Uso de música diegética (en escena)
- Diseño de sonido: ambientes, efectos
- Uso del silencio como herramienta dramática
- Referencias musicales
- Indicaciones para el compositor
- Mood por secuencias

FORMATO:
═══════════════════════════════════════
      MÚSICA Y DISEÑO SONORO
═══════════════════════════════════════

Escribe la guía COMPLETA (1000-1200 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 4000 });
}

/**
 * Cuenta palabras
 */
function contarPalabras(texto) {
  return texto.split(/\s+/).filter(palabra => palabra.length > 0).length;
}
