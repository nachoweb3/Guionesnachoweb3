import { generarTexto } from '../config/iaProviders.js';

/**
 * Genera un documento de diseño completo para videojuego (GDD - Game Design Document)
 */
export async function generarGuionVideojuego(opciones) {
  const {
    titulo,
    genero = 'accion',
    plataforma = 'multiplataforma',
    tipoJuego = 'single-player',
    duracion = 20, // horas de juego estimadas
    tema,
    provider = 'groq',
    incluirNarrativa = true,
    incluirMecanicas = true,
    incluirNiveles = true,
    incluirPersonajes = true
  } = opciones;

  console.log(`🎮 Generando GDD para videojuego: ${titulo} - ${duracion} horas de juego`);

  try {
    let guionCompleto = '';

    // 1. CONCEPTO Y VISIÓN
    console.log('🎯 Generando concepto y visión...');
    const concepto = await generarConceptoVideojuego(titulo, genero, plataforma, tema, tipoJuego, provider);
    guionCompleto += concepto + '\n\n';

    // 2. RESUMEN EJECUTIVO
    console.log('📋 Generando resumen ejecutivo...');
    const resumen = await generarResumenEjecutivo(titulo, genero, plataforma, duracion, tema, provider);
    guionCompleto += resumen + '\n\n';

    // 3. MECÁNICAS DE JUEGO
    if (incluirMecanicas) {
      console.log('🎮 Desarrollando mecánicas de juego...');
      const mecanicas = await generarMecanicasJuego(titulo, genero, tipoJuego, provider);
      guionCompleto += mecanicas + '\n\n';
    }

    // 4. NARRATIVA Y HISTORIA
    if (incluirNarrativa) {
      console.log('📖 Creando narrativa...');
      const narrativa = await generarNarrativaVideojuego(titulo, genero, tema, duracion, provider);
      guionCompleto += narrativa + '\n\n';
    }

    // 5. PERSONAJES
    if (incluirPersonajes) {
      console.log('👥 Desarrollando personajes...');
      const personajes = await generarPersonajesVideojuego(titulo, genero, tema, provider);
      guionCompleto += personajes + '\n\n';
    }

    // 6. PROGRESIÓN DEL JUGADOR
    console.log('📊 Diseñando progresión del jugador...');
    const progresion = await generarProgresionJugador(titulo, genero, duracion, provider);
    guionCompleto += progresion + '\n\n';

    // 7. NIVELES Y MUNDOS
    if (incluirNiveles) {
      console.log('🗺️ Diseñando niveles y mundos...');
      const numeroNiveles = Math.floor(duracion / 2); // Aprox 1 nivel cada 2 horas

      for (let i = 0; i < Math.min(numeroNiveles, 15); i++) {
        console.log(`   🎯 Nivel ${i + 1}/${Math.min(numeroNiveles, 15)}...`);
        const nivel = await generarNivelVideojuego(
          titulo,
          genero,
          i + 1,
          numeroNiveles,
          tema,
          provider
        );
        guionCompleto += nivel + '\n\n';
      }
    }

    // 8. COMBATE Y DESAFÍOS
    console.log('⚔️ Diseñando sistema de combate...');
    const combate = await generarSistemaCombate(titulo, genero, provider);
    guionCompleto += combate + '\n\n';

    // 9. INTERFACES Y UI/UX
    console.log('🖥️ Diseñando interfaces...');
    const interfaces = await generarInterfacesUI(titulo, genero, plataforma, provider);
    guionCompleto += interfaces + '\n\n';

    // 10. ARTE Y ESTÉTICA
    console.log('🎨 Definiendo dirección de arte...');
    const arte = await generarArteEstetica(titulo, genero, tema, provider);
    guionCompleto += arte + '\n\n';

    // 11. AUDIO Y MÚSICA
    console.log('🎵 Creando diseño de audio...');
    const audio = await generarAudioMusica(titulo, genero, provider);
    guionCompleto += audio + '\n\n';

    // 12. ECONOMÍA DEL JUEGO
    console.log('💰 Diseñando economía del juego...');
    const economia = await generarEconomiaJuego(titulo, genero, tipoJuego, provider);
    guionCompleto += economia + '\n\n';

    // 13. MULTIJUGADOR (si aplica)
    if (tipoJuego === 'multiplayer' || tipoJuego === 'co-op') {
      console.log('🌐 Diseñando funcionalidades multijugador...');
      const multijugador = await generarMultijugador(titulo, genero, tipoJuego, provider);
      guionCompleto += multijugador + '\n\n';
    }

    // 14. MONETIZACIÓN Y MODELO DE NEGOCIO
    console.log('💵 Definiendo monetización...');
    const monetizacion = await generarMonetizacion(titulo, genero, plataforma, provider);
    guionCompleto += monetizacion + '\n\n';

    // 15. TECNOLOGÍA Y HERRAMIENTAS
    console.log('⚙️ Especificando tecnología...');
    const tecnologia = await generarTecnologia(titulo, genero, plataforma, provider);
    guionCompleto += tecnologia + '\n\n';

    const palabrasFinales = contarPalabras(guionCompleto);
    console.log(`✅ GDD completado: ${palabrasFinales} palabras`);

    return guionCompleto;
  } catch (error) {
    console.error('❌ Error generando GDD:', error);
    throw error;
  }
}

/**
 * Genera concepto del videojuego
 */
async function generarConceptoVideojuego(titulo, genero, plataforma, tema, tipoJuego, provider) {
  const prompt = `Crea el CONCEPTO Y VISIÓN para un videojuego titulado "${titulo}" - género ${genero} para ${plataforma}.

Debe incluir:
- High concept (1-2 oraciones que capturan la esencia del juego)
- Visión creativa
- Unique Selling Points (USPs) - qué hace único este juego
- Público objetivo (edad, preferencias)
- Comparaciones con juegos existentes (pero destacando diferencias)
- Tipo: ${tipoJuego}
- Tema central: ${tema}
- Objetivos de diseño

FORMATO:
═══════════════════════════════════════
      CONCEPTO Y VISIÓN DEL JUEGO
═══════════════════════════════════════

Escribe el concepto COMPLETO (1000-1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}

/**
 * Genera resumen ejecutivo
 */
async function generarResumenEjecutivo(titulo, genero, plataforma, duracion, tema, provider) {
  const prompt = `Crea un RESUMEN EJECUTIVO para "${titulo}" - ${genero} de ${duracion} horas en ${plataforma} sobre "${tema}".

Debe incluir:
- Descripción general del juego (300-400 palabras)
- Género y estilo de juego
- Plataformas objetivo
- Duración de juego estimada
- Características principales (top 5-7)
- Modo de juego
- Estilo visual
- Historia en una línea
- Mercado objetivo
- Viabilidad y alcance del proyecto

FORMATO:
═══════════════════════════════════════
        RESUMEN EJECUTIVO
═══════════════════════════════════════

Escribe el resumen COMPLETO (1200-1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}

/**
 * Genera mecánicas de juego
 */
async function generarMecanicasJuego(titulo, genero, tipoJuego, provider) {
  const prompt = `Desarrolla las MECÁNICAS DE JUEGO PRINCIPALES para "${titulo}" - ${genero} ${tipoJuego}.

Debe incluir:
- Core gameplay loop (ciclo principal del juego)
- Mecánicas primarias (5-7 mecánicas principales)
- Mecánicas secundarias
- Controles (esquema básico para diferentes plataformas)
- Sistema de física del juego
- Interacciones del jugador con el mundo
- Feedback al jugador
- Difficulty scaling (escalado de dificultad)
- Accesibilidad

Cada mecánica debe explicarse en detalle con ejemplos.

FORMATO:
═══════════════════════════════════════
       MECÁNICAS DE JUEGO
═══════════════════════════════════════

Escribe las mecánicas COMPLETAS (2000-2500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 8000 });
}

/**
 * Genera narrativa del videojuego
 */
async function generarNarrativaVideojuego(titulo, genero, tema, duracion, provider) {
  const prompt = `Crea la NARRATIVA COMPLETA para "${titulo}" - ${genero} de ${duracion} horas sobre "${tema}".

Debe incluir:
- Premisa y setting (mundo del juego)
- Historia principal completa (con inicio, desarrollo y final)
- Estructura narrativa en 3 actos aplicada al gameplay
- Historias secundarias (side quests)
- Lore y worldbuilding
- Temas narrativos
- Plot twists principales
- Diferentes finales (si los hay)
- Cómo se entrega la narrativa (cutscenes, diálogos, environmental storytelling)

FORMATO:
═══════════════════════════════════════
          NARRATIVA
═══════════════════════════════════════

Escribe la narrativa COMPLETA (2500-3000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 8000 });
}

/**
 * Genera personajes
 */
async function generarPersonajesVideojuego(titulo, genero, tema, provider) {
  const prompt = `Desarrolla los PERSONAJES para "${titulo}" - ${genero} sobre "${tema}".

Para cada personaje (5-8 personajes principales):
- Nombre y alias
- Rol en el juego (protagonista, aliado, antagonista, NPC)
- Descripción visual y diseño
- Personalidad y motivaciones
- Habilidades y stats
- Backstory
- Arco narrativo
- Relaciones con otros personajes
- Líneas de diálogo características
- Mecánicas únicas (si es jugable)

FORMATO:
═══════════════════════════════════════
     DESARROLLO DE PERSONAJES
═══════════════════════════════════════

Escribe el desarrollo COMPLETO (2000-2500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 8000 });
}

/**
 * Genera progresión del jugador
 */
async function generarProgresionJugador(titulo, genero, duracion, provider) {
  const prompt = `Diseña la PROGRESIÓN DEL JUGADOR para "${titulo}" - ${genero} de ${duracion} horas.

Debe incluir:
- Sistema de experiencia y niveles
- Skill tree o árbol de habilidades
- Unlockables (desbloqueables) por progreso
- Curva de aprendizaje
- Pacing del juego (ritmo)
- Milestones importantes (hitos)
- Recompensas y logros
- Motivadores para seguir jugando
- Balance entre desafío y habilidad
- Early game, mid game, late game

FORMATO:
═══════════════════════════════════════
      PROGRESIÓN DEL JUGADOR
═══════════════════════════════════════

Escribe la progresión COMPLETA (1500-2000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera diseño de un nivel
 */
async function generarNivelVideojuego(titulo, genero, numeroNivel, totalNiveles, tema, provider) {
  const prompt = `Diseña el NIVEL ${numeroNivel} de ${totalNiveles} para "${titulo}" - ${genero} sobre "${tema}".

El diseño del nivel debe incluir:
- Nombre y tema del nivel
- Objetivos del nivel
- Layout y diseño espacial (descripción)
- Enemigos y desafíos
- Puzzles o mecánicas únicas
- Items y coleccionables
- Puntos de checkpoint
- Boss fight (si aplica)
- Duración estimada
- Narrativa del nivel
- Difficulty rating
- Secretos y áreas ocultas

FORMATO:
═══════════════════════════════════════
   NIVEL ${numeroNivel}: [NOMBRE]
═══════════════════════════════════════

Escribe el diseño COMPLETO del nivel (1000-1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}

/**
 * Genera sistema de combate
 */
async function generarSistemaCombate(titulo, genero, provider) {
  const prompt = `Diseña el SISTEMA DE COMBATE Y DESAFÍOS para "${titulo}" - ${genero}.

Debe incluir:
- Mecánicas de combate básicas
- Tipos de ataques (ligeros, pesados, especiales)
- Sistema de defensa (block, dodge, parry)
- Combos y movimientos avanzados
- Armas y equipamiento
- Sistema de daño
- Enemy AI (comportamiento de enemigos)
- Tipos de enemigos (8-12 tipos diferentes)
- Boss battles (características)
- Puzzles y desafíos no-combate
- Dificultad y balanceo

FORMATO:
═══════════════════════════════════════
    SISTEMA DE COMBATE Y DESAFÍOS
═══════════════════════════════════════

Escribe el sistema COMPLETO (2000-2500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 8000 });
}

/**
 * Genera interfaces UI/UX
 */
async function generarInterfacesUI(titulo, genero, plataforma, provider) {
  const prompt = `Diseña las INTERFACES UI/UX para "${titulo}" - ${genero} en ${plataforma}.

Debe incluir:
- Filosofía de diseño UI
- HUD (Heads-Up Display) - qué información mostrar
- Menú principal
- Menú de pausa
- Inventario
- Sistema de mapas
- Pantallas de progresión
- Tutoriales integrados
- Navegación y flujo
- Accesibilidad
- Adaptación para diferentes plataformas
- Mockups o descripciones detalladas

FORMATO:
═══════════════════════════════════════
         INTERFACES UI/UX
═══════════════════════════════════════

Escribe el diseño de interfaces COMPLETO (1500-2000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera arte y estética
 */
async function generarArteEstetica(titulo, genero, tema, provider) {
  const prompt = `Define la DIRECCIÓN DE ARTE Y ESTÉTICA para "${titulo}" - ${genero} sobre "${tema}".

Debe incluir:
- Estilo visual (realista, cartoon, pixel art, low poly, etc.)
- Paleta de colores con significado
- Referencias artísticas (juegos, películas, arte)
- Diseño de personajes (art direction)
- Diseño de ambientes
- Efectos visuales (VFX)
- Iluminación y atmósfera
- Animaciones clave
- Concept art descriptions
- Estilo de cinematics/cutscenes
- Coherencia visual

FORMATO:
═══════════════════════════════════════
       ARTE Y ESTÉTICA
═══════════════════════════════════════

Escribe la dirección de arte COMPLETA (1500-2000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera audio y música
 */
async function generarAudioMusica(titulo, genero, provider) {
  const prompt = `Crea el DISEÑO DE AUDIO Y MÚSICA para "${titulo}" - ${genero}.

Debe incluir:
- Estilo musical general
- Temas musicales principales
- Música adaptativa (que cambia con gameplay)
- Efectos de sonido necesarios
- Diseño de sonido ambiental
- Voice acting (actuación de voz) - guía
- Audio feedback para acciones del jugador
- Diseño de audio para diferentes escenarios
- Audio espacial (3D sound)
- Referencias musicales
- Composición dinámica

FORMATO:
═══════════════════════════════════════
       DISEÑO DE AUDIO Y MÚSICA
═══════════════════════════════════════

Escribe el diseño de audio COMPLETO (1200-1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}

/**
 * Genera economía del juego
 */
async function generarEconomiaJuego(titulo, genero, tipoJuego, provider) {
  const prompt = `Diseña la ECONOMÍA DEL JUEGO para "${titulo}" - ${genero} ${tipoJuego}.

Debe incluir:
- Sistema de moneda (tipos de currency)
- Cómo se gana dinero/recursos
- Cómo se gasta (shops, upgrades)
- Items y su valor
- Crafting system (si aplica)
- Trading (si aplica)
- Balanceo económico
- Grind vs reward
- Sinks y faucets (sistemas de balance)
- Progresión económica

FORMATO:
═══════════════════════════════════════
        ECONOMÍA DEL JUEGO
═══════════════════════════════════════

Escribe la economía COMPLETA (1200-1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}

/**
 * Genera funcionalidades multijugador
 */
async function generarMultijugador(titulo, genero, tipoJuego, provider) {
  const prompt = `Diseña las FUNCIONALIDADES MULTIJUGADOR para "${titulo}" - ${genero} ${tipoJuego}.

Debe incluir:
- Modos multijugador
- Cantidad de jugadores
- Matchmaking
- Mecánicas cooperativas específicas
- Comunicación entre jugadores
- Sistemas sociales
- Progresión en multijugador
- Balance para PvP/PvE
- Anti-cheat considerations
- Server architecture (básico)
- Contenido exclusivo multijugador

FORMATO:
═══════════════════════════════════════
         MULTIJUGADOR
═══════════════════════════════════════

Escribe las funcionalidades COMPLETAS (1500-2000 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 6000 });
}

/**
 * Genera monetización
 */
async function generarMonetizacion(titulo, genero, plataforma, provider) {
  const prompt = `Define la MONETIZACIÓN Y MODELO DE NEGOCIO para "${titulo}" - ${genero} en ${plataforma}.

Debe incluir:
- Modelo de precio (premium, free-to-play, freemium)
- Microtransacciones (si aplica) - qué y cómo
- Season passes o contenido adicional
- DLC planeado
- Cosmetics y customización
- Battle pass (si aplica)
- Ads (si aplica)
- Justificación ética de monetización
- Proyección de ingresos
- Post-launch content plan

FORMATO:
═══════════════════════════════════════
    MONETIZACIÓN Y MODELO DE NEGOCIO
═══════════════════════════════════════

Escribe el modelo COMPLETO (1000-1200 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 4000 });
}

/**
 * Genera especificaciones técnicas
 */
async function generarTecnologia(titulo, genero, plataforma, provider) {
  const prompt = `Especifica la TECNOLOGÍA Y HERRAMIENTAS para "${titulo}" - ${genero} en ${plataforma}.

Debe incluir:
- Motor de juego recomendado (Unity, Unreal, Godot, custom)
- Lenguajes de programación
- Herramientas de arte y animación
- Middleware necesario
- Requisitos técnicos del sistema
- Performance targets (FPS, resolución)
- Tamaño estimado del juego
- Herramientas de desarrollo
- Pipeline de producción
- Testing y QA approach

FORMATO:
═══════════════════════════════════════
      TECNOLOGÍA Y HERRAMIENTAS
═══════════════════════════════════════

Escribe las especificaciones COMPLETAS (1200-1500 palabras):`;

  return await generarTexto(prompt, { provider, maxTokens: 5000 });
}

/**
 * Cuenta palabras
 */
function contarPalabras(texto) {
  return texto.split(/\s+/).filter(palabra => palabra.length > 0).length;
}
