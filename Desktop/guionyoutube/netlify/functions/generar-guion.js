import { generarGuionLargo } from '../../utils/generadorGuion.js';
import { getTierConfig, hasExceededDailyLimit, isDurationAllowed, getUpgradeMessage } from '../../config/tiers.js';
import crypto from 'crypto';

// Almacenamiento en memoria para límites (compartido entre invocaciones)
const usageStore = new Map();

function generateSessionId(event) {
  const ip = event.headers['client-ip'] || event.headers['x-forwarded-for'] || 'unknown';
  const userAgent = event.headers['user-agent'] || '';
  return crypto.createHash('md5').update(`${ip}-${userAgent}`).digest('hex');
}

function getDailyUsage(sessionId) {
  const today = new Date().toISOString().split('T')[0];
  const usage = usageStore.get(sessionId);
  if (!usage || usage.date !== today) return 0;
  return usage.count;
}

function incrementUsage(sessionId) {
  const today = new Date().toISOString().split('T')[0];
  usageStore.set(sessionId, {
    date: today,
    count: getDailyUsage(sessionId) + 1
  });
}

export async function handler(event, context) {
  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tema, nicho, duracion, tono, incluirIntro, incluirOutro, provider } = JSON.parse(event.body);

    if (!tema) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El tema es requerido' })
      };
    }

    // VERIFICAR LÍMITES
    const sessionId = generateSessionId(event);
    const userTier = event.headers['x-user-tier'] || 'free';
    const tierConfig = getTierConfig(userTier);
    const currentUsage = getDailyUsage(sessionId);

    // Límite diario
    if (hasExceededDailyLimit(userTier, currentUsage)) {
      return {
        statusCode: 429,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Límite alcanzado',
          message: getUpgradeMessage(userTier, 'daily_limit'),
          upgradeRequired: true,
          tier: userTier,
          usage: { today: currentUsage, limit: tierConfig.limits.dailyGenerations }
        })
      };
    }

    // Límite de duración
    const requestedDuration = duracion || 30;
    if (!isDurationAllowed(userTier, requestedDuration)) {
      return {
        statusCode: 403,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          error: 'Duración no permitida',
          message: getUpgradeMessage(userTier, 'duration_limit'),
          upgradeRequired: true,
          tier: userTier
        })
      };
    }

    console.log(`🎬 Generando guion sobre: ${tema} (${requestedDuration} minutos)`);

    let guion = await generarGuionLargo({
      tema,
      nicho,
      duracion: requestedDuration,
      tono: tono || 'profesional',
      incluirIntro: incluirIntro !== false,
      incluirOutro: incluirOutro !== false,
      provider: provider || 'groq'
    });

    // Agregar marca de agua si es necesario
    if (!tierConfig.limits.canRemoveWatermark) {
      guion += '\n\n---\n📝 Generado con GuionIA - https://guion-youtube-ia.netlify.app\n🚀 Upgrade para quitar esta marca de agua';
    }

    // Incrementar uso
    incrementUsage(sessionId);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-User-Tier': userTier,
        'X-Usage-Today': currentUsage + 1,
        'X-Usage-Limit': tierConfig.limits.dailyGenerations
      },
      body: JSON.stringify({
        success: true,
        guion,
        palabras: guion.split(/\s+/).length,
        caracteres: guion.length,
        tier: userTier,
        usage: {
          today: currentUsage + 1,
          limit: tierConfig.limits.dailyGenerations
        }
      })
    };
  } catch (error) {
    console.error('Error generando guion:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error al generar el guion',
        mensaje: error.message
      })
    };
  }
}
