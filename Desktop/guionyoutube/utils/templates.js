/**
 * SISTEMA DE TEMPLATES PROFESIONALES
 * Templates pre-configurados para diferentes tipos de videos de YouTube
 */

export const TEMPLATES = {
  'tutorial-tecnico': {
    id: 'tutorial-tecnico',
    nombre: 'Tutorial Técnico',
    descripcion: 'Para tutoriales paso a paso sobre tecnología, programación, software',
    icono: '💻',
    duracionRecomendada: 20,
    tono: 'educativo',
    estructura: {
      intro: true,
      outro: true,
      secciones: ['Requisitos previos', 'Configuración inicial', 'Paso a paso', 'Resolución de problemas', 'Mejores prácticas']
    },
    promptOptimizado: `Este es un tutorial técnico detallado. Debe ser:
- Extremadamente claro y paso a paso
- Incluir comandos o código cuando sea relevante
- Anticipar errores comunes
- Explicar el "por qué" detrás de cada paso
- Incluir tips de troubleshooting
- Usar analogías técnicas apropiadas`,
    estiloNarracion: 'Primera persona, directo, instructivo',
    elementosVisuales: ['Capturas de pantalla', 'Código en pantalla', 'Diagramas técnicos']
  },

  'review-producto': {
    id: 'review-producto',
    nombre: 'Review de Producto',
    descripcion: 'Reseña detallada de productos, gadgets, servicios',
    icono: '⭐',
    duracionRecomendada: 15,
    tono: 'profesional',
    estructura: {
      intro: true,
      outro: true,
      secciones: ['Primera impresión', 'Características principales', 'Pruebas en uso real', 'Pros y contras', 'Comparación con alternativas', 'Veredicto final']
    },
    promptOptimizado: `Este es un review completo y objetivo. Debe:
- Ser imparcial pero opinionado
- Incluir especificaciones técnicas
- Mencionar precio y relación calidad-precio
- Comparar con productos similares
- Incluir pruebas reales de uso
- Dar recomendación clara de para quién es este producto`,
    estiloNarracion: 'Conversacional pero informativo, primera persona',
    elementosVisuales: ['Producto en uso', 'Close-ups', 'Comparaciones visuales', 'Gráficos de especificaciones']
  },

  'storytelling': {
    id: 'storytelling',
    nombre: 'Storytelling',
    descripcion: 'Narrativa de historias, casos reales, experiencias personales',
    icono: '📖',
    duracionRecomendada: 25,
    tono: 'entretenido',
    estructura: {
      intro: true,
      outro: true,
      secciones: ['El contexto', 'El conflicto/problema', 'El desarrollo', 'El clímax', 'La resolución', 'La lección aprendida']
    },
    promptOptimizado: `Esta es una historia narrativa envolvente. Debe:
- Seguir estructura dramática clásica
- Incluir detalles sensoriales vívidos
- Crear tensión y mantener interés
- Incluir diálogos cuando sea apropiado
- Conectar emocionalmente con la audiencia
- Concluir con lección o moraleja clara`,
    estiloNarracion: 'Narrativo, descriptivo, emocional',
    elementosVisuales: ['B-roll cinematográfico', 'Recreaciones', 'Fotos de archivo', 'Transiciones suaves']
  },

  'educativo-academico': {
    id: 'educativo-academico',
    nombre: 'Educativo Académico',
    descripcion: 'Contenido educativo profundo, explicaciones de conceptos complejos',
    icono: '🎓',
    duracionRecomendada: 30,
    tono: 'educativo',
    estructura: {
      intro: true,
      outro: true,
      secciones: ['Contexto histórico', 'Conceptos fundamentales', 'Teoría en profundidad', 'Aplicaciones prácticas', 'Casos de estudio', 'Conclusiones y reflexiones']
    },
    promptOptimizado: `Este es contenido educativo de nivel académico. Debe:
- Ser riguroso pero accesible
- Incluir definiciones claras
- Usar ejemplos del mundo real
- Citar fuentes cuando sea relevante
- Construir conocimiento progresivamente
- Incluir ejercicios o preguntas de reflexión
- Conectar con conocimiento previo`,
    estiloNarracion: 'Profesional, claro, pedagógico',
    elementosVisuales: ['Diagramas explicativos', 'Animaciones conceptuales', 'Gráficos de datos', 'Líneas de tiempo']
  },

  'vlog-personal': {
    id: 'vlog-personal',
    nombre: 'Vlog Personal',
    descripcion: 'Experiencias personales, día en la vida, opiniones',
    icono: '🎥',
    duracionRecomendada: 15,
    tono: 'casual',
    estructura: {
      intro: true,
      outro: true,
      secciones: ['Introducción del día/situación', 'Actividad principal', 'Momentos destacados', 'Reflexiones personales', 'Planes futuros']
    },
    promptOptimizado: `Este es un vlog personal auténtico. Debe:
- Ser genuino y conversacional
- Incluir pensamientos y reacciones personales
- Mostrar personalidad del creador
- Incluir momentos espontáneos
- Conectar con la audiencia a nivel personal
- Ser entretenido sin perder autenticidad`,
    estiloNarracion: 'Muy casual, primera persona, íntimo',
    elementosVisuales: ['Tomas en movimiento', 'Selfie cam', 'Lifestyle shots', 'Time-lapses']
  },

  'unboxing': {
    id: 'unboxing',
    nombre: 'Unboxing',
    descripcion: 'Desempaquetado y primera impresión de productos',
    icono: '📦',
    duracionRecomendada: 12,
    tono: 'entretenido',
    estructura: {
      intro: true,
      outro: true,
      secciones: ['Contexto del producto', 'Presentación del empaque', 'Contenido de la caja', 'Primera impresión', 'Primeras pruebas', 'Pensamientos iniciales']
    },
    promptOptimizado: `Este es un unboxing emocionante. Debe:
- Crear anticipación
- Describir detalles del empaque
- Mencionar primeras impresiones honestas
- Comparar con expectativas
- Incluir reacciones genuinas
- Hablar de valor percibido`,
    estiloNarracion: 'Entusiasta, descriptivo, espontáneo',
    elementosVisuales: ['Close-ups del producto', 'Ángulos múltiples', 'Detalles de calidad', 'Comparación de tamaño']
  },

  'top-10-listas': {
    id: 'top-10-listas',
    nombre: 'Top 10 / Listas',
    descripcion: 'Rankings, listas numeradas, mejores/peores',
    icono: '🔟',
    duracionRecomendada: 18,
    tono: 'entretenido',
    estructura: {
      intro: true,
      outro: true,
      secciones: ['Criterios de selección', 'Menciones honoríficas', 'Posiciones 10-6', 'Posiciones 5-2', 'Posición #1', 'Conclusión']
    },
    promptOptimizado: `Esta es una lista tipo ranking. Debe:
- Tener criterios claros de clasificación
- Crear suspense hacia el #1
- Dar razones específicas para cada posición
- Incluir datos o hechos que justifiquen el ranking
- Ser opinionado pero fundamentado
- Invitar a debate en comentarios`,
    estiloNarracion: 'Dinámico, opinionado, estructurado',
    elementosVisuales: ['Gráficos de ranking', 'Comparaciones lado a lado', 'Clips de cada elemento', 'Números grandes en pantalla']
  },

  'entrevista': {
    id: 'entrevista',
    nombre: 'Entrevista',
    descripcion: 'Conversación con expertos, influencers, personalidades',
    icono: '🎤',
    duracionRecomendada: 40,
    tono: 'profesional',
    estructura: {
      intro: true,
      outro: true,
      secciones: ['Introducción del invitado', 'Contexto/background', 'Tema principal', 'Anécdotas personales', 'Consejos/insights', 'Preguntas de la audiencia', 'Reflexiones finales']
    },
    promptOptimizado: `Este es un guión de entrevista estructurada. Debe:
- Presentar al invitado apropiadamente
- Hacer preguntas que generen respuestas profundas
- Seguir un flujo conversacional natural
- Incluir follow-ups relevantes
- Balancear lo profesional y lo personal
- Extraer insights valiosos`,
    estiloNarracion: 'Conversacional, curioso, respetuoso',
    elementosVisuales: ['Tomas de ambos hablantes', 'B-roll del tema discutido', 'Gráficos de puntos clave', 'Fotos del invitado']
  },

  'documental': {
    id: 'documental',
    nombre: 'Documental',
    descripcion: 'Investigación profunda, formato documental',
    icono: '🎬',
    duracionRecomendada: 45,
    tono: 'profesional',
    estructura: {
      intro: true,
      outro: true,
      secciones: ['Planteamiento del tema', 'Contexto histórico', 'Investigación principal', 'Testimonios/evidencia', 'Análisis en profundidad', 'Implicaciones', 'Conclusiones']
    },
    promptOptimizado: `Este es un documental investigativo. Debe:
- Ser exhaustivo y bien investigado
- Presentar múltiples perspectivas
- Incluir datos verificables
- Mantener objetividad
- Contar una historia convincente
- Incluir elementos dramáticos naturales
- Terminar con reflexión profunda`,
    estiloNarracion: 'Narrativo, objetivo, authoritative',
    elementosVisuales: ['Archivo histórico', 'Entrevistas a expertos', 'Gráficos de datos', 'Recreaciones', 'Mapas/líneas de tiempo']
  },

  'gaming-commentary': {
    id: 'gaming-commentary',
    nombre: 'Gaming Commentary',
    descripcion: 'Gameplay con comentario, guías de juegos',
    icono: '🎮',
    duracionRecomendada: 25,
    tono: 'entretenido',
    estructura: {
      intro: true,
      outro: true,
      secciones: ['Intro del juego/sesión', 'Objetivos del episodio', 'Gameplay principal', 'Momentos destacados', 'Tips y estrategias', 'Progreso general']
    },
    promptOptimizado: `Este es contenido de gaming con comentario. Debe:
- Ser entretenido y energético
- Explicar estrategias mientras juega
- Reaccionar a momentos del juego
- Incluir tips útiles naturalmente
- Mantener conversación con la audiencia
- Balancear gameplay y educación`,
    estiloNarracion: 'Energético, casual, reactivo',
    elementosVisuales: ['Gameplay en pantalla', 'Facecam', 'Overlays de stats', 'Highlights marcados', 'Comparaciones de builds/estrategias']
  }
};

/**
 * Obtiene todos los templates disponibles
 */
export function obtenerTemplates() {
  return Object.values(TEMPLATES);
}

/**
 * Obtiene un template específico por ID
 */
export function obtenerTemplatePorId(id) {
  return TEMPLATES[id] || null;
}

/**
 * Genera un prompt optimizado basado en el template
 */
export function generarPromptConTemplate(templateId, tema, opciones = {}) {
  const template = obtenerTemplatePorId(templateId);

  if (!template) {
    throw new Error(`Template no encontrado: ${templateId}`);
  }

  const {
    duracion = template.duracionRecomendada,
    nicho = 'general',
    incluirSeccionesEspecificas = true
  } = opciones;

  let prompt = `Crea un guión completo para un video de YouTube tipo "${template.nombre}" sobre el tema: "${tema}"\n\n`;

  prompt += `CARACTERÍSTICAS DEL VIDEO:\n`;
  prompt += `- Tipo: ${template.nombre}\n`;
  prompt += `- Duración objetivo: ${duracion} minutos\n`;
  prompt += `- Tono: ${template.tono}\n`;
  prompt += `- Nicho: ${nicho}\n\n`;

  prompt += `ESTILO DE NARRACIÓN:\n${template.estiloNarracion}\n\n`;

  prompt += `DIRECTRICES ESPECÍFICAS DEL FORMATO:\n${template.promptOptimizado}\n\n`;

  if (incluirSeccionesEspecificas && template.estructura.secciones) {
    prompt += `ESTRUCTURA RECOMENDADA (adaptar al tema):\n`;
    template.estructura.secciones.forEach((seccion, index) => {
      prompt += `${index + 1}. ${seccion}\n`;
    });
    prompt += `\n`;
  }

  prompt += `ELEMENTOS VISUALES SUGERIDOS:\n`;
  if (template.elementosVisuales) {
    template.elementosVisuales.forEach(elemento => {
      prompt += `- ${elemento}\n`;
    });
  }
  prompt += `\n`;

  prompt += `IMPORTANTE:\n`;
  prompt += `- Escribe en primera persona\n`;
  prompt += `- Mantén el tono ${template.tono} durante todo el video\n`;
  prompt += `- Incluye indicaciones de B-ROLL entre [corchetes]\n`;
  prompt += `- Marca PAUSAS importantes con (PAUSA)\n`;
  prompt += `- Resalta palabras clave en MAYÚSCULAS para énfasis\n`;
  prompt += `- Duración objetivo: aproximadamente ${duracion * 250} palabras\n\n`;

  prompt += `Escribe el guión completo ahora:`;

  return prompt;
}

/**
 * Obtiene sugerencias de templates basadas en el tema
 */
export function sugerirTemplates(tema) {
  const temaLower = tema.toLowerCase();
  const sugerencias = [];

  // Mapeo de palabras clave a templates
  const palabrasClave = {
    'tutorial-tecnico': ['tutorial', 'como', 'guia', 'aprender', 'paso a paso', 'configurar', 'instalar', 'programar'],
    'review-producto': ['review', 'análisis', 'reseña', 'opinión producto', 'vale la pena'],
    'storytelling': ['historia', 'experiencia', 'cuento', 'relato', 'vivencia'],
    'educativo-academico': ['qué es', 'explicación', 'teoría', 'ciencia', 'estudio', 'investigación'],
    'vlog-personal': ['día', 'vlog', 'mi vida', 'rutina', 'diario'],
    'unboxing': ['unboxing', 'desempaquetado', 'primera vez', 'llegó'],
    'top-10-listas': ['top', 'mejores', 'peores', 'lista', 'ranking'],
    'entrevista': ['entrevista', 'conversación con', 'pregunta a'],
    'documental': ['documental', 'investigación', 'origen de', 'historia de'],
    'gaming-commentary': ['gameplay', 'jugando', 'gaming', 'juego', 'partida']
  };

  // Buscar coincidencias
  for (const [templateId, keywords] of Object.entries(palabrasClave)) {
    const coincide = keywords.some(keyword => temaLower.includes(keyword));
    if (coincide) {
      sugerencias.push(obtenerTemplatePorId(templateId));
    }
  }

  // Si no hay coincidencias, sugerir templates versátiles
  if (sugerencias.length === 0) {
    sugerencias.push(
      obtenerTemplatePorId('educativo-academico'),
      obtenerTemplatePorId('storytelling'),
      obtenerTemplatePorId('tutorial-tecnico')
    );
  }

  return sugerencias;
}

/**
 * Aplica configuración de template a opciones de generación
 */
export function aplicarConfiguracionTemplate(templateId, opcionesBase = {}) {
  const template = obtenerTemplatePorId(templateId);

  if (!template) {
    return opcionesBase;
  }

  return {
    ...opcionesBase,
    duracion: opcionesBase.duracion || template.duracionRecomendada,
    tono: opcionesBase.tono || template.tono,
    incluirIntro: template.estructura.intro,
    incluirOutro: template.estructura.outro,
    template: template
  };
}
