/**
 * ANALIZADOR DE LEGIBILIDAD
 * Analiza la complejidad y facilidad de lectura del guión
 * Incluye Flesch Reading Ease, detección de oraciones largas, palabras complejas, etc.
 */

/**
 * Analiza la legibilidad completa de un guión
 * @param {string} texto - El texto del guión a analizar
 * @returns {object} - Análisis completo de legibilidad
 */
export function analizarLegibilidad(texto) {
  try {
    console.log('📊 Analizando legibilidad del guión...');

    const analisis = {
      // Estadísticas básicas
      estadisticas: calcularEstadisticas(texto),

      // Flesch Reading Ease
      fleschScore: calcularFlesch(texto),

      // Oraciones problemáticas
      oracionesLargas: detectarOracionesLargas(texto),

      // Palabras complejas
      palabrasComplejas: detectarPalabrasComplejas(texto),

      // Nivel educativo
      nivelEducativo: determinarNivelEducativo(texto),

      // Sugerencias de mejora
      sugerencias: generarSugerencias(texto),

      // Score visual (0-100)
      scoreGlobal: 0
    };

    // Calcular score global
    analisis.scoreGlobal = calcularScoreGlobal(analisis);

    console.log(`✅ Análisis completado - Score: ${analisis.scoreGlobal}/100`);
    return analisis;

  } catch (error) {
    console.error('❌ Error analizando legibilidad:', error);
    throw new Error(`Error al analizar legibilidad: ${error.message}`);
  }
}

/**
 * Calcula estadísticas básicas del texto
 */
function calcularEstadisticas(texto) {
  const oraciones = dividirEnOraciones(texto);
  const palabras = texto.split(/\s+/).filter(p => p.length > 0);
  const caracteres = texto.replace(/\s/g, '').length;

  const silabas = palabras.reduce((total, palabra) => {
    return total + contarSilabas(palabra);
  }, 0);

  return {
    caracteres: caracteres,
    palabras: palabras.length,
    oraciones: oraciones.length,
    silabas: silabas,
    palabrasPorOracion: palabras.length / oraciones.length || 0,
    silabasPorPalabra: silabas / palabras.length || 0,
    caracteresPromedioPalabra: caracteres / palabras.length || 0
  };
}

/**
 * Calcula el índice de Flesch Reading Ease
 * Score: 0-100
 * 90-100: Muy fácil (5to grado)
 * 80-89: Fácil (6to grado)
 * 70-79: Relativamente fácil (7mo grado)
 * 60-69: Estándar (8vo-9no grado)
 * 50-59: Relativamente difícil (10mo-12vo grado)
 * 30-49: Difícil (Universidad)
 * 0-29: Muy difícil (Graduado universitario)
 */
function calcularFlesch(texto) {
  const stats = calcularEstadisticas(texto);

  if (stats.oraciones === 0 || stats.palabras === 0) {
    return {
      score: 0,
      nivel: 'No evaluable',
      descripcion: 'Texto insuficiente'
    };
  }

  // Fórmula de Flesch adaptada al español
  // 206.835 - 1.015 * (palabras/oraciones) - 84.6 * (sílabas/palabras)
  const score = 206.835 -
    (1.015 * stats.palabrasPorOracion) -
    (84.6 * stats.silabasPorPalabra);

  const scoreRedondeado = Math.round(Math.max(0, Math.min(100, score)));

  return {
    score: scoreRedondeado,
    nivel: getNivelFlesch(scoreRedondeado),
    descripcion: getDescripcionFlesch(scoreRedondeado),
    grado: getGradoEducativo(scoreRedondeado)
  };
}

/**
 * Obtiene el nivel de lectura según score de Flesch
 */
function getNivelFlesch(score) {
  if (score >= 90) return 'Muy fácil';
  if (score >= 80) return 'Fácil';
  if (score >= 70) return 'Relativamente fácil';
  if (score >= 60) return 'Estándar';
  if (score >= 50) return 'Relativamente difícil';
  if (score >= 30) return 'Difícil';
  return 'Muy difícil';
}

/**
 * Obtiene descripción del nivel de Flesch
 */
function getDescripcionFlesch(score) {
  if (score >= 90) return 'Entendible por un niño de 11 años';
  if (score >= 80) return 'Muy fácil de leer para cualquier persona';
  if (score >= 70) return 'Fácil de leer para estudiantes de secundaria';
  if (score >= 60) return 'Comprensible para adolescentes';
  if (score >= 50) return 'Requiere nivel de preparatoria';
  if (score >= 30) return 'Requiere nivel universitario';
  return 'Extremadamente difícil, nivel graduado';
}

/**
 * Obtiene grado educativo según score
 */
function getGradoEducativo(score) {
  if (score >= 90) return '5to grado';
  if (score >= 80) return '6to grado';
  if (score >= 70) return '7mo grado';
  if (score >= 60) return '8vo-9no grado';
  if (score >= 50) return '10mo-12vo grado';
  if (score >= 30) return 'Universidad';
  return 'Posgrado';
}

/**
 * Detecta oraciones muy largas (>25 palabras)
 */
function detectarOracionesLargas(texto, limite = 25) {
  const oraciones = dividirEnOraciones(texto);
  const oracionesLargas = [];

  oraciones.forEach((oracion, index) => {
    const palabras = oracion.split(/\s+/).filter(p => p.length > 0);

    if (palabras.length > limite) {
      oracionesLargas.push({
        numero: index + 1,
        oracion: oracion.substring(0, 150) + (oracion.length > 150 ? '...' : ''),
        palabras: palabras.length,
        severidad: palabras.length > 35 ? 'alta' : 'media'
      });
    }
  });

  return {
    total: oracionesLargas.length,
    porcentaje: (oracionesLargas.length / oraciones.length * 100).toFixed(1),
    oraciones: oracionesLargas.slice(0, 10), // Mostrar solo primeras 10
    recomendacion: oracionesLargas.length > 0 ?
      `Considera dividir ${oracionesLargas.length} oraciones largas en oraciones más cortas` :
      'Longitud de oraciones adecuada'
  };
}

/**
 * Detecta palabras complejas (>3 sílabas)
 */
function detectarPalabrasComplejas(texto) {
  const palabras = texto
    .toLowerCase()
    .split(/\s+/)
    .filter(p => p.length > 0)
    .map(p => p.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ''));

  const palabrasUnicas = [...new Set(palabras)];
  const palabrasComplejas = [];

  palabrasUnicas.forEach(palabra => {
    const silabas = contarSilabas(palabra);

    if (silabas > 3 && palabra.length > 8) {
      const frecuencia = palabras.filter(p => p === palabra).length;
      palabrasComplejas.push({
        palabra: palabra,
        silabas: silabas,
        frecuencia: frecuencia
      });
    }
  });

  // Ordenar por frecuencia
  palabrasComplejas.sort((a, b) => b.frecuencia - a.frecuencia);

  return {
    total: palabrasComplejas.length,
    porcentaje: (palabrasComplejas.length / palabrasUnicas.length * 100).toFixed(1),
    palabras: palabrasComplejas.slice(0, 20), // Top 20
    recomendacion: palabrasComplejas.length > palabrasUnicas.length * 0.15 ?
      'El texto contiene muchas palabras complejas. Considera usar sinónimos más simples.' :
      'Nivel de complejidad de vocabulario apropiado'
  };
}

/**
 * Determina el nivel educativo requerido
 */
function determinarNivelEducativo(texto) {
  const flesch = calcularFlesch(texto);
  const stats = calcularEstadisticas(texto);

  let nivel = 'Secundaria';
  let descripcion = '';

  if (flesch.score >= 80) {
    nivel = 'Primaria';
    descripcion = 'Muy accesible para público general';
  } else if (flesch.score >= 60) {
    nivel = 'Secundaria';
    descripcion = 'Accesible para la mayoría del público';
  } else if (flesch.score >= 50) {
    nivel = 'Preparatoria';
    descripcion = 'Requiere atención moderada para seguir';
  } else if (flesch.score >= 30) {
    nivel = 'Universidad';
    descripcion = 'Requiere concentración y conocimientos previos';
  } else {
    nivel = 'Posgrado';
    descripcion = 'Muy técnico, audiencia especializada';
  }

  return {
    nivel: nivel,
    descripcion: descripcion,
    apropiado: flesch.score >= 50,
    recomendacion: flesch.score < 50 ?
      'Para YouTube, se recomienda simplificar el lenguaje para alcanzar audiencia más amplia' :
      'Nivel educativo apropiado para YouTube'
  };
}

/**
 * Genera sugerencias de mejora
 */
function generarSugerencias(texto) {
  const sugerencias = [];
  const flesch = calcularFlesch(texto);
  const stats = calcularEstadisticas(texto);
  const oracionesLargas = detectarOracionesLargas(texto);
  const palabrasComplejas = detectarPalabrasComplejas(texto);

  // Sugerencias basadas en Flesch
  if (flesch.score < 60) {
    sugerencias.push({
      tipo: 'critico',
      categoria: 'Legibilidad general',
      sugerencia: 'El texto es difícil de leer. Usa oraciones más cortas y palabras más simples.',
      impacto: 'alto'
    });
  }

  // Sugerencias sobre longitud de oraciones
  if (stats.palabrasPorOracion > 20) {
    sugerencias.push({
      tipo: 'advertencia',
      categoria: 'Longitud de oraciones',
      sugerencia: `Promedio de ${stats.palabrasPorOracion.toFixed(1)} palabras por oración. Ideal: 15-20 palabras.`,
      impacto: 'medio'
    });
  }

  if (oracionesLargas.total > 10) {
    sugerencias.push({
      tipo: 'advertencia',
      categoria: 'Oraciones largas',
      sugerencia: `${oracionesLargas.total} oraciones muy largas detectadas. Divídelas en oraciones más cortas.`,
      impacto: 'medio'
    });
  }

  // Sugerencias sobre vocabulario
  if (parseFloat(palabrasComplejas.porcentaje) > 15) {
    sugerencias.push({
      tipo: 'advertencia',
      categoria: 'Vocabulario complejo',
      sugerencia: 'Muchas palabras complejas. Busca sinónimos más simples cuando sea posible.',
      impacto: 'medio'
    });
  }

  // Sugerencias positivas
  if (flesch.score >= 70) {
    sugerencias.push({
      tipo: 'exito',
      categoria: 'Legibilidad',
      sugerencia: '¡Excelente! El texto es fácil de leer y entender.',
      impacto: 'positivo'
    });
  }

  if (stats.palabrasPorOracion >= 12 && stats.palabrasPorOracion <= 18) {
    sugerencias.push({
      tipo: 'exito',
      categoria: 'Estructura',
      sugerencia: 'Longitud de oraciones ideal para contenido en video.',
      impacto: 'positivo'
    });
  }

  // Sugerencias específicas para YouTube
  sugerencias.push({
    tipo: 'info',
    categoria: 'YouTube',
    sugerencia: 'Para videos, considera agregar pausas naturales cada 3-4 oraciones.',
    impacto: 'bajo'
  });

  if (stats.palabras > 7500) {
    const minutos = Math.round(stats.palabras / 250);
    sugerencias.push({
      tipo: 'info',
      categoria: 'Duración',
      sugerencia: `Guión de ~${minutos} minutos. Asegúrate de mantener el interés durante todo el video.`,
      impacto: 'bajo'
    });
  }

  return sugerencias;
}

/**
 * Calcula score global de legibilidad (0-100)
 */
function calcularScoreGlobal(analisis) {
  let score = 0;

  // Peso del Flesch (40%)
  score += (analisis.fleschScore.score * 0.4);

  // Penalización por oraciones largas (20%)
  const penalizacionOraciones = Math.min(20, parseFloat(analisis.oracionesLargas.porcentaje));
  score += (20 - penalizacionOraciones);

  // Penalización por palabras complejas (20%)
  const penalizacionPalabras = Math.min(20, parseFloat(analisis.palabrasComplejas.porcentaje));
  score += (20 - penalizacionPalabras);

  // Bonus por estructura (20%)
  const stats = analisis.estadisticas;
  let bonusEstructura = 0;

  if (stats.palabrasPorOracion >= 12 && stats.palabrasPorOracion <= 20) {
    bonusEstructura += 10;
  }

  if (stats.silabasPorPalabra >= 1.5 && stats.silabasPorPalabra <= 2.5) {
    bonusEstructura += 10;
  }

  score += bonusEstructura;

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Divide texto en oraciones
 */
function dividirEnOraciones(texto) {
  // Dividir por puntos, signos de interrogación y exclamación
  return texto
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Cuenta sílabas en una palabra (algoritmo simplificado para español)
 */
function contarSilabas(palabra) {
  if (!palabra || palabra.length === 0) return 0;

  palabra = palabra.toLowerCase().replace(/[^a-záéíóúüñ]/g, '');

  const vocales = /[aeiouáéíóúü]/g;
  const matches = palabra.match(vocales);

  if (!matches) return 1;

  let silabas = matches.length;

  // Ajustes para diptongos y hiatos comunes en español
  const diptongos = /[aeo][iu]|[iu][aeo]|iu|ui/gi;
  const diptongoMatches = palabra.match(diptongos);
  if (diptongoMatches) {
    silabas -= diptongoMatches.length;
  }

  return Math.max(1, silabas);
}

/**
 * Formatea el resultado del análisis para mostrar
 */
export function formatearAnalisisLegibilidad(analisis) {
  let resultado = '';

  resultado += '═══════════════════════════════════════\n';
  resultado += '📊 ANÁLISIS DE LEGIBILIDAD\n';
  resultado += '═══════════════════════════════════════\n\n';

  // Score global
  resultado += `SCORE GLOBAL: ${analisis.scoreGlobal}/100\n`;
  resultado += getBarraProgreso(analisis.scoreGlobal) + '\n';
  resultado += `Calificación: ${getCalificacion(analisis.scoreGlobal)}\n\n`;

  // Estadísticas básicas
  resultado += '📈 ESTADÍSTICAS:\n';
  resultado += '───────────────────────────────────────\n';
  resultado += `• Palabras: ${analisis.estadisticas.palabras.toLocaleString()}\n`;
  resultado += `• Oraciones: ${analisis.estadisticas.oraciones.toLocaleString()}\n`;
  resultado += `• Palabras por oración: ${analisis.estadisticas.palabrasPorOracion.toFixed(1)}\n`;
  resultado += `• Sílabas por palabra: ${analisis.estadisticas.silabasPorPalabra.toFixed(1)}\n\n`;

  // Flesch Reading Ease
  resultado += '📖 ÍNDICE DE FLESCH:\n';
  resultado += '───────────────────────────────────────\n';
  resultado += `Score: ${analisis.fleschScore.score}/100 (${analisis.fleschScore.nivel})\n`;
  resultado += `${analisis.fleschScore.descripcion}\n`;
  resultado += `Nivel educativo: ${analisis.fleschScore.grado}\n\n`;

  // Oraciones largas
  resultado += '📏 ORACIONES LARGAS:\n';
  resultado += '───────────────────────────────────────\n';
  resultado += `Total: ${analisis.oracionesLargas.total} (${analisis.oracionesLargas.porcentaje}%)\n`;
  resultado += `${analisis.oracionesLargas.recomendacion}\n`;

  if (analisis.oracionesLargas.oraciones.length > 0) {
    resultado += '\nPrimeras oraciones largas:\n';
    analisis.oracionesLargas.oraciones.slice(0, 3).forEach((o, i) => {
      resultado += `${i + 1}. [${o.palabras} palabras] ${o.oracion}\n`;
    });
  }
  resultado += '\n';

  // Palabras complejas
  resultado += '💡 PALABRAS COMPLEJAS:\n';
  resultado += '───────────────────────────────────────\n';
  resultado += `Total: ${analisis.palabrasComplejas.total} (${analisis.palabrasComplejas.porcentaje}%)\n`;
  resultado += `${analisis.palabrasComplejas.recomendacion}\n`;

  if (analisis.palabrasComplejas.palabras.length > 0) {
    resultado += '\nPalabras más frecuentes:\n';
    analisis.palabrasComplejas.palabras.slice(0, 10).forEach((p, i) => {
      resultado += `${i + 1}. ${p.palabra} (${p.silabas} sílabas, usada ${p.frecuencia}x)\n`;
    });
  }
  resultado += '\n';

  // Nivel educativo
  resultado += '🎓 NIVEL EDUCATIVO:\n';
  resultado += '───────────────────────────────────────\n';
  resultado += `Nivel: ${analisis.nivelEducativo.nivel}\n`;
  resultado += `${analisis.nivelEducativo.descripcion}\n`;
  resultado += `${analisis.nivelEducativo.recomendacion}\n\n`;

  // Sugerencias
  resultado += '💡 SUGERENCIAS DE MEJORA:\n';
  resultado += '───────────────────────────────────────\n';

  const criticas = analisis.sugerencias.filter(s => s.tipo === 'critico');
  const advertencias = analisis.sugerencias.filter(s => s.tipo === 'advertencia');
  const exitos = analisis.sugerencias.filter(s => s.tipo === 'exito');
  const info = analisis.sugerencias.filter(s => s.tipo === 'info');

  if (criticas.length > 0) {
    resultado += '\n🔴 CRÍTICO:\n';
    criticas.forEach(s => resultado += `• ${s.sugerencia}\n`);
  }

  if (advertencias.length > 0) {
    resultado += '\n🟡 ADVERTENCIAS:\n';
    advertencias.forEach(s => resultado += `• ${s.sugerencia}\n`);
  }

  if (exitos.length > 0) {
    resultado += '\n🟢 ASPECTOS POSITIVOS:\n';
    exitos.forEach(s => resultado += `• ${s.sugerencia}\n`);
  }

  if (info.length > 0) {
    resultado += '\n💡 INFORMACIÓN:\n';
    info.forEach(s => resultado += `• ${s.sugerencia}\n`);
  }

  resultado += '\n═══════════════════════════════════════\n';

  return resultado;
}

/**
 * Genera barra de progreso visual
 */
function getBarraProgreso(score) {
  const barras = Math.round(score / 5);
  const llenas = '█'.repeat(barras);
  const vacias = '░'.repeat(20 - barras);
  return llenas + vacias;
}

/**
 * Obtiene calificación textual del score
 */
function getCalificacion(score) {
  if (score >= 90) return '⭐⭐⭐⭐⭐ Excelente';
  if (score >= 80) return '⭐⭐⭐⭐ Muy bueno';
  if (score >= 70) return '⭐⭐⭐ Bueno';
  if (score >= 60) return '⭐⭐ Regular';
  if (score >= 50) return '⭐ Necesita mejoras';
  return '⚠️ Requiere revisión urgente';
}
