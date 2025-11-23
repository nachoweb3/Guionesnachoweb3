import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto-js';
import { generarGuionLargo, generarGuionLargoStream } from './utils/generadorGuion.js';
import { transcribirConWhisper } from './utils/whisperTranscriber.js';
import { obtenerContenidoRelacionado } from './utils/contenidoRelacionado.js';
import { obtenerTemplates, obtenerTemplatePorId, generarPromptConTemplate, aplicarConfiguracionTemplate } from './utils/templates.js';
import { generarTimestamps, exportarTimestamps } from './utils/timestampGenerator.js';
import { generarSEO, formatearResultadoSEO } from './utils/seoGenerator.js';
import { analizarLegibilidad, formatearAnalisisLegibilidad } from './utils/readabilityAnalyzer.js';
import { exportarGuion, getFormatosSoportados } from './utils/exportFormats.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ===== SISTEMA DE CACHÉ EN MEMORIA =====
// Almacena guiones generados con hash MD5 de parámetros como key
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hora en milisegundos

/**
 * Genera hash MD5 de los parámetros para usar como cache key
 */
function generarCacheKey(params) {
  const normalized = JSON.stringify(params, Object.keys(params).sort());
  return crypto.MD5(normalized).toString();
}

/**
 * Obtiene un valor del caché si existe y no ha expirado
 */
function obtenerDeCache(key) {
  const item = cache.get(key);
  if (!item) return null;

  const now = Date.now();
  if (now - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

/**
 * Guarda un valor en el caché con timestamp
 */
function guardarEnCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

/**
 * Limpia entradas expiradas del caché (ejecuta cada 10 minutos)
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ===== SISTEMA DE RATE LIMITING =====
// Límite: 10 requests por IP por minuto
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 10;

/**
 * Middleware de rate limiting
 */
function rateLimitMiddleware(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  // Obtener o crear entrada para esta IP
  let ipData = rateLimitMap.get(ip);

  if (!ipData) {
    ipData = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    rateLimitMap.set(ip, ipData);
  }

  // Resetear contador si pasó la ventana de tiempo
  if (now > ipData.resetTime) {
    ipData.count = 0;
    ipData.resetTime = now + RATE_LIMIT_WINDOW;
  }

  // Verificar límite
  if (ipData.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((ipData.resetTime - now) / 1000);
    res.set('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Too Many Requests',
      mensaje: `Has excedido el límite de ${MAX_REQUESTS_PER_WINDOW} solicitudes por minuto. Intenta de nuevo en ${retryAfter} segundos.`,
      retryAfter
    });
  }

  // Incrementar contador
  ipData.count++;

  // Agregar headers informativos
  res.set('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
  res.set('X-RateLimit-Remaining', MAX_REQUESTS_PER_WINDOW - ipData.count);
  res.set('X-RateLimit-Reset', new Date(ipData.resetTime).toISOString());

  next();
}

// Limpiar entradas antiguas del rate limiter cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime + RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// ===== VALIDACIÓN Y SANITIZACIÓN =====
/**
 * Sanitiza texto para evitar injection
 */
function sanitizarTexto(texto) {
  if (typeof texto !== 'string') return '';

  return texto
    .trim()
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/[^\w\s\-.,;:¿?¡!áéíóúñÁÉÍÓÚÑüÜ]/g, '') // Solo caracteres seguros
    .substring(0, 200); // Máximo 200 caracteres
}

/**
 * Valida los parámetros del guión
 */
function validarParametrosGuion(params) {
  const errores = [];

  // Validar tema (requerido)
  if (!params.tema || typeof params.tema !== 'string') {
    errores.push('El tema es requerido y debe ser texto');
  } else if (params.tema.trim().length === 0) {
    errores.push('El tema no puede estar vacío');
  } else if (params.tema.length > 200) {
    errores.push('El tema no puede exceder 200 caracteres');
  }

  // Validar duración
  if (params.duracion !== undefined) {
    const duracion = parseInt(params.duracion);
    if (isNaN(duracion) || duracion < 10 || duracion > 120) {
      errores.push('La duración debe ser un número entre 10 y 120 minutos');
    }
  }

  // Validar nicho (opcional pero con límite)
  if (params.nicho && params.nicho.length > 100) {
    errores.push('El nicho no puede exceder 100 caracteres');
  }

  // Validar tono (lista permitida)
  const tonosPermitidos = ['profesional', 'casual', 'divertido', 'educativo', 'motivacional'];
  if (params.tono && !tonosPermitidos.includes(params.tono)) {
    errores.push(`El tono debe ser uno de: ${tonosPermitidos.join(', ')}`);
  }

  // Validar provider
  const providersPermitidos = ['groq', 'ollama'];
  if (params.provider && !providersPermitidos.includes(params.provider)) {
    errores.push(`El provider debe ser uno de: ${providersPermitidos.join(', ')}`);
  }

  return errores;
}

// ===== LOGGING MEJORADO =====
/**
 * Logger con timestamps
 */
function log(nivel, mensaje, datos = {}) {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    nivel,
    mensaje,
    ...datos
  };

  const emoji = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  };

  console.log(`[${timestamp}] ${emoji[nivel] || '📝'} ${mensaje}`,
    Object.keys(datos).length > 0 ? datos : '');
}

// ===== MIDDLEWARE DE ERROR CENTRALIZADO =====
/**
 * Middleware de manejo de errores global
 */
function errorHandler(err, req, res, next) {
  log('error', 'Error en el servidor', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Determinar código de estado
  const statusCode = err.statusCode || 500;

  // Mensajes user-friendly
  const mensajesAmigables = {
    400: 'Los datos enviados no son válidos',
    401: 'No estás autorizado para realizar esta acción',
    403: 'No tienes permisos para acceder a este recurso',
    404: 'El recurso solicitado no fue encontrado',
    429: 'Has realizado demasiadas solicitudes. Por favor, espera un momento',
    500: 'Ocurrió un error en el servidor. Estamos trabajando para solucionarlo',
    503: 'El servicio no está disponible temporalmente'
  };

  res.status(statusCode).json({
    error: true,
    mensaje: mensajesAmigables[statusCode] || 'Error al procesar la solicitud',
    detalles: err.message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
}

// ===== CONFIGURACIÓN DE MIDDLEWARES =====
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Aplicar rate limiting a todas las rutas API
app.use('/api', rateLimitMiddleware);

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Generar guion largo con IA (con caché y validación)
app.post('/api/generar-guion', async (req, res, next) => {
  try {
    const { tema, nicho, duracion, tono, incluirIntro, incluirOutro, provider } = req.body;

    // Validar parámetros
    const errores = validarParametrosGuion(req.body);
    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        errores,
        timestamp: new Date().toISOString()
      });
    }

    // Sanitizar entrada
    const temaLimpio = sanitizarTexto(tema);
    const nichoLimpio = nicho ? sanitizarTexto(nicho) : undefined;

    // Crear parámetros normalizados para caché
    const parametrosCache = {
      tema: temaLimpio,
      nicho: nichoLimpio,
      duracion: duracion || 30,
      tono: tono || 'profesional',
      incluirIntro: incluirIntro !== false,
      incluirOutro: incluirOutro !== false,
      provider: provider || 'groq'
    };

    // Verificar caché
    const cacheKey = generarCacheKey(parametrosCache);
    const guionCacheado = obtenerDeCache(cacheKey);

    if (guionCacheado) {
      log('info', 'Guión servido desde caché', { tema: temaLimpio });
      res.set('X-Cache-Status', 'HIT');
      return res.json({
        success: true,
        guion: guionCacheado.guion,
        palabras: guionCacheado.palabras,
        caracteres: guionCacheado.caracteres,
        fromCache: true
      });
    }

    // No está en caché, generar nuevo
    log('info', 'Generando nuevo guión', { tema: temaLimpio, duracion: parametrosCache.duracion });
    res.set('X-Cache-Status', 'MISS');

    const guion = await generarGuionLargo(parametrosCache);

    const resultado = {
      guion,
      palabras: guion.split(/\s+/).length,
      caracteres: guion.length
    };

    // Guardar en caché
    guardarEnCache(cacheKey, resultado);

    res.json({
      success: true,
      ...resultado,
      fromCache: false
    });

    log('success', 'Guión generado exitosamente', {
      tema: temaLimpio,
      palabras: resultado.palabras,
      caracteres: resultado.caracteres
    });
  } catch (error) {
    next(error); // Pasar al middleware de error centralizado
  }
});

// API: Generar guion largo con IA (STREAMING - Server-Sent Events)
app.post('/api/generar-guion-stream', async (req, res, next) => {
  try {
    const { tema, nicho, duracion, tono, incluirIntro, incluirOutro, provider } = req.body;

    // Validar parámetros
    const errores = validarParametrosGuion(req.body);
    if (errores.length > 0) {
      return res.status(400).json({
        error: 'Datos de entrada inválidos',
        errores,
        timestamp: new Date().toISOString()
      });
    }

    // Sanitizar entrada
    const temaLimpio = sanitizarTexto(tema);
    const nichoLimpio = nicho ? sanitizarTexto(nicho) : undefined;

    const parametros = {
      tema: temaLimpio,
      nicho: nichoLimpio,
      duracion: duracion || 30,
      tono: tono || 'profesional',
      incluirIntro: incluirIntro !== false,
      incluirOutro: incluirOutro !== false,
      provider: provider || 'groq'
    };

    log('info', 'Iniciando streaming de guión', { tema: temaLimpio });

    // Configurar headers para Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Desabilitar buffering en nginx

    // Mantener conexión viva
    const keepAliveInterval = setInterval(() => {
      res.write(': keepalive\n\n');
    }, 15000);

    // Enviar evento de inicio
    res.write(`data: ${JSON.stringify({ type: 'start', mensaje: 'Iniciando generación de guión...' })}\n\n`);

    try {
      // Callback para enviar chunks al cliente
      const onChunk = (chunk) => {
        res.write(`data: ${JSON.stringify({ type: 'chunk', contenido: chunk })}\n\n`);
      };

      // Generar guión con streaming
      const guion = await generarGuionLargoStream(parametros, onChunk);

      // Enviar evento de finalización
      res.write(`data: ${JSON.stringify({
        type: 'complete',
        guion,
        palabras: guion.split(/\s+/).length,
        caracteres: guion.length
      })}\n\n`);

      log('success', 'Streaming de guión completado', { tema: temaLimpio });
    } catch (streamError) {
      // Enviar error al cliente
      res.write(`data: ${JSON.stringify({
        type: 'error',
        mensaje: streamError.message
      })}\n\n`);

      log('error', 'Error en streaming de guión', { error: streamError.message });
    } finally {
      clearInterval(keepAliveInterval);
      res.end();
    }
  } catch (error) {
    next(error);
  }
});

// API: Transcribir audio con Whisper
app.post('/api/transcribir-audio', async (req, res) => {
  try {
    const { audioUrl, audioBase64 } = req.body;

    if (!audioUrl && !audioBase64) {
      return res.status(400).json({ error: 'Se requiere audioUrl o audioBase64' });
    }

    console.log('🎙️ Transcribiendo audio con Whisper...');

    const transcripcion = await transcribirConWhisper({ audioUrl, audioBase64 });

    res.json({
      success: true,
      transcripcion,
      palabras: transcripcion.split(/\s+/).length
    });
  } catch (error) {
    console.error('Error transcribiendo audio:', error);
    res.status(500).json({
      error: 'Error al transcribir el audio',
      mensaje: error.message
    });
  }
});

// API: Obtener contenido relacionado para investigación
app.post('/api/contenido-relacionado', async (req, res) => {
  try {
    const { tema, cantidad } = req.body;

    if (!tema) {
      return res.status(400).json({ error: 'El tema es requerido' });
    }

    console.log(`🔍 Buscando contenido relacionado sobre: ${tema}`);

    const contenido = await obtenerContenidoRelacionado(tema, cantidad || 5);

    res.json({
      success: true,
      contenido
    });
  } catch (error) {
    console.error('Error obteniendo contenido:', error);
    res.status(500).json({
      error: 'Error al obtener contenido relacionado',
      mensaje: error.message
    });
  }
});

// API: Expandir guion (para hacerlo más largo)
app.post('/api/expandir-guion', async (req, res) => {
  try {
    const { guionActual, seccionesAExpandir, provider } = req.body;

    if (!guionActual) {
      return res.status(400).json({ error: 'El guion actual es requerido' });
    }

    console.log('📝 Expandiendo guion...');

    const guionExpandido = await generarGuionLargo({
      tema: 'Expansión de guion existente',
      guionBase: guionActual,
      seccionesAExpandir,
      duracion: 60,
      provider: provider || 'groq'
    });

    res.json({
      success: true,
      guion: guionExpandido,
      palabras: guionExpandido.split(/\s+/).length
    });
  } catch (error) {
    console.error('Error expandiendo guion:', error);
    res.status(500).json({
      error: 'Error al expandir el guion',
      mensaje: error.message
    });
  }
});

// ===== NUEVOS ENDPOINTS PARA FEATURES AVANZADAS =====

// API: Obtener templates disponibles
app.get('/api/templates', (req, res) => {
  try {
    const templates = obtenerTemplates();
    res.json({
      success: true,
      templates: templates,
      total: templates.length
    });
  } catch (error) {
    console.error('Error obteniendo templates:', error);
    res.status(500).json({
      error: 'Error al obtener templates',
      mensaje: error.message
    });
  }
});

// API: Obtener un template específico
app.get('/api/templates/:id', (req, res) => {
  try {
    const template = obtenerTemplatePorId(req.params.id);

    if (!template) {
      return res.status(404).json({
        error: 'Template no encontrado',
        id: req.params.id
      });
    }

    res.json({
      success: true,
      template: template
    });
  } catch (error) {
    console.error('Error obteniendo template:', error);
    res.status(500).json({
      error: 'Error al obtener template',
      mensaje: error.message
    });
  }
});

// API: Generar timestamps
app.post('/api/generar-timestamps', async (req, res) => {
  try {
    const { guion, palabrasPorMinuto, incluirDescripciones, formatoDetallado } = req.body;

    if (!guion) {
      return res.status(400).json({ error: 'El guion es requerido' });
    }

    console.log('⏱️ Generando timestamps...');

    const resultado = await generarTimestamps(guion, {
      provider: 'groq',
      palabrasPorMinuto: palabrasPorMinuto || 250,
      incluirDescripciones: incluirDescripciones !== false,
      formatoDetallado: formatoDetallado !== false
    });

    res.json(resultado);
  } catch (error) {
    console.error('Error generando timestamps:', error);
    res.status(500).json({
      error: 'Error al generar timestamps',
      mensaje: error.message
    });
  }
});

// API: Generar SEO
app.post('/api/generar-seo', async (req, res) => {
  try {
    const { guion, tema, nicho, audienciaObjetivo } = req.body;

    if (!guion || !tema) {
      return res.status(400).json({ error: 'El guion y el tema son requeridos' });
    }

    console.log('🎯 Generando elementos SEO...');

    const resultado = await generarSEO(guion, tema, {
      provider: 'groq',
      nicho: nicho || 'general',
      audienciaObjetivo: audienciaObjetivo || 'general'
    });

    // Agregar versión formateada
    const textoFormateado = formatearResultadoSEO(resultado);

    res.json({
      ...resultado,
      textoFormateado: textoFormateado
    });
  } catch (error) {
    console.error('Error generando SEO:', error);
    res.status(500).json({
      error: 'Error al generar SEO',
      mensaje: error.message
    });
  }
});

// API: Analizar legibilidad
app.post('/api/analizar-legibilidad', async (req, res) => {
  try {
    const { guion } = req.body;

    if (!guion) {
      return res.status(400).json({ error: 'El guion es requerido' });
    }

    console.log('📊 Analizando legibilidad...');

    const analisis = analizarLegibilidad(guion);

    // Agregar versión formateada
    const textoFormateado = formatearAnalisisLegibilidad(analisis);

    res.json({
      success: true,
      analisis: analisis,
      textoFormateado: textoFormateado
    });
  } catch (error) {
    console.error('Error analizando legibilidad:', error);
    res.status(500).json({
      error: 'Error al analizar legibilidad',
      mensaje: error.message
    });
  }
});

// API: Exportar guion a diferentes formatos
app.post('/api/export', async (req, res) => {
  try {
    const { guion, formato, metadata } = req.body;

    if (!guion || !formato) {
      return res.status(400).json({ error: 'El guion y el formato son requeridos' });
    }

    console.log(`📦 Exportando a formato ${formato}...`);

    const resultado = exportarGuion(guion, formato, metadata);

    res.json(resultado);
  } catch (error) {
    console.error('Error exportando guion:', error);
    res.status(500).json({
      error: 'Error al exportar guion',
      mensaje: error.message
    });
  }
});

// API: Obtener formatos de exportación soportados
app.get('/api/export/formatos', (req, res) => {
  try {
    const formatos = getFormatosSoportados();
    res.json({
      success: true,
      formatos: formatos
    });
  } catch (error) {
    console.error('Error obteniendo formatos:', error);
    res.status(500).json({
      error: 'Error al obtener formatos',
      mensaje: error.message
    });
  }
});

// Health check mejorado
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: {
      groq: !!process.env.GROQ_API_KEY,
      ollama: true
    },
    cache: {
      size: cache.size,
      ttl: `${CACHE_TTL / 1000 / 60} minutos`
    },
    rateLimit: {
      window: `${RATE_LIMIT_WINDOW / 1000} segundos`,
      maxRequests: MAX_REQUESTS_PER_WINDOW
    }
  });
});

// Endpoint para ver estadísticas de caché (útil para debugging)
app.get('/api/cache-stats', (req, res) => {
  const stats = {
    entradas: cache.size,
    ttl: CACHE_TTL,
    rateLimitIPs: rateLimitMap.size
  };

  res.json(stats);
});

// Endpoint para limpiar caché manualmente (útil para testing)
app.post('/api/cache-clear', (req, res) => {
  cache.clear();
  log('info', 'Caché limpiado manualmente');
  res.json({
    success: true,
    mensaje: 'Caché limpiado exitosamente'
  });
});

// ===== MIDDLEWARE DE ERROR (debe ir al final, después de todas las rutas) =====
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: true,
    mensaje: 'Ruta no encontrada',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🎬 GENERADOR DE GUIONES LARGOS CON IA - MEJORADO         ║
║  📝 Guiones profesionales de 30+ minutos                  ║
║  🆓 100% GRATIS usando IA                                 ║
╚═══════════════════════════════════════════════════════════╝

🚀 Servidor iniciado en http://localhost:${PORT}

📚 Proveedores de IA disponibles:
   ${process.env.GROQ_API_KEY ? '✅' : '⚠️'} Groq (API Key ${process.env.GROQ_API_KEY ? 'configurada' : 'no configurada'})
   ✅ Ollama (Local - 100% gratis)

✨ NUEVAS CARACTERÍSTICAS:
   ⚡ Streaming en tiempo real (SSE)
   💾 Sistema de caché (1 hora de TTL)
   🛡️ Rate limiting (${MAX_REQUESTS_PER_WINDOW} req/min por IP)
   ✅ Validación y sanitización de inputs
   📊 Logging mejorado con timestamps
   🔧 Manejo centralizado de errores

📡 ENDPOINTS DISPONIBLES:
   POST /api/generar-guion         - Generar guión (con caché)
   POST /api/generar-guion-stream  - Generar guión (streaming SSE)
   POST /api/transcribir-audio     - Transcribir audio con Whisper
   POST /api/contenido-relacionado - Buscar contenido relacionado
   POST /api/expandir-guion        - Expandir guión existente
   GET  /api/health                - Health check + estadísticas
   GET  /api/cache-stats           - Estadísticas de caché
   POST /api/cache-clear           - Limpiar caché

💡 Configura tu GROQ_API_KEY en .env para mejores resultados
   Obtén tu clave gratis en: https://console.groq.com
  `);
});
