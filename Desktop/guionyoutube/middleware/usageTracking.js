/**
 * ============================================
 * MIDDLEWARE DE TRACKING DE USO Y LÍMITES
 * ============================================
 */

import { getTierConfig, hasExceededDailyLimit, isDurationAllowed, canAccessFormat, getUpgradeMessage } from '../config/tiers.js';
import crypto from 'crypto';

// Almacenamiento en memoria (para MVP sin DB)
// En producción, esto debería estar en una base de datos
const usageStore = new Map(); // sessionId -> { date, count, tier }
const tierStore = new Map(); // sessionId -> tier

/**
 * Genera un session ID basado en IP y User Agent
 */
function generateSessionId(req) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'] || '';
  const identifier = `${ip}-${userAgent}`;
  return crypto.createHash('md5').update(identifier).digest('hex');
}

/**
 * Obtiene el tier del usuario (desde header o sessionId)
 */
function getUserTier(req) {
  // Opción 1: Tier desde header (cuando hay auth)
  const headerTier = req.headers['x-user-tier'];
  if (headerTier) {
    return headerTier.toLowerCase();
  }

  // Opción 2: Tier desde sessionId (usuarios anónimos)
  const sessionId = req.sessionId || generateSessionId(req);
  return tierStore.get(sessionId) || 'free';
}

/**
 * Obtiene el uso actual del día
 */
function getDailyUsage(sessionId) {
  const today = new Date().toISOString().split('T')[0];
  const usage = usageStore.get(sessionId);

  if (!usage || usage.date !== today) {
    // Nuevo día o primera vez
    return 0;
  }

  return usage.count;
}

/**
 * Incrementa el contador de uso
 */
function incrementUsage(sessionId, tier) {
  const today = new Date().toISOString().split('T')[0];

  usageStore.set(sessionId, {
    date: today,
    count: getDailyUsage(sessionId) + 1,
    tier
  });

  console.log(`📊 Uso actualizado: ${sessionId.substr(0, 8)}... -> ${getDailyUsage(sessionId)} generaciones hoy`);
}

/**
 * Middleware principal de verificación de límites
 */
export function checkUsageLimits(options = {}) {
  return async (req, res, next) => {
    try {
      // Generar session ID
      const sessionId = generateSessionId(req);
      req.sessionId = sessionId;

      // Obtener tier del usuario
      const userTier = getUserTier(req);
      const tierConfig = getTierConfig(userTier);

      // Obtener uso actual
      const currentUsage = getDailyUsage(sessionId);

      // VERIFICACIÓN 1: Límite diario de generaciones
      if (hasExceededDailyLimit(userTier, currentUsage)) {
        return res.status(429).json({
          error: 'Límite de generaciones alcanzado',
          message: getUpgradeMessage(userTier, 'daily_limit'),
          limit: tierConfig.limits.dailyGenerations,
          used: currentUsage,
          tier: userTier,
          upgradeRequired: true,
          suggestedTier: userTier === 'free' ? 'pro' : 'enterprise'
        });
      }

      // VERIFICACIÓN 2: Duración del contenido (si aplica)
      if (options.checkDuration && req.body.duracion) {
        const duration = parseInt(req.body.duracion);
        if (!isDurationAllowed(userTier, duration)) {
          return res.status(403).json({
            error: 'Duración no permitida',
            message: getUpgradeMessage(userTier, 'duration_limit'),
            maxDuration: tierConfig.limits.maxDurationMinutes,
            requested: duration,
            tier: userTier,
            upgradeRequired: true,
            suggestedTier: duration > 120 ? 'enterprise' : 'pro'
          });
        }
      }

      // VERIFICACIÓN 3: Acceso al formato (si aplica)
      if (options.format && !canAccessFormat(userTier, options.format)) {
        return res.status(403).json({
          error: 'Formato no disponible',
          message: getUpgradeMessage(userTier, 'format_locked'),
          format: options.format,
          tier: userTier,
          upgradeRequired: true,
          suggestedTier: 'pro'
        });
      }

      // Todo OK - incrementar uso y continuar
      incrementUsage(sessionId, userTier);

      // Agregar info al request para uso posterior
      req.userTier = userTier;
      req.tierConfig = tierConfig;
      req.currentUsage = currentUsage + 1; // Ya incrementado

      // Agregar headers de rate limit a la respuesta
      res.set({
        'X-RateLimit-Tier': userTier,
        'X-RateLimit-Limit': tierConfig.limits.dailyGenerations === -1 ? 'unlimited' : tierConfig.limits.dailyGenerations,
        'X-RateLimit-Used': currentUsage + 1,
        'X-RateLimit-Remaining': tierConfig.limits.dailyGenerations === -1 ? 'unlimited' : Math.max(0, tierConfig.limits.dailyGenerations - (currentUsage + 1))
      });

      next();
    } catch (error) {
      console.error('❌ Error en middleware de usage tracking:', error);
      // En caso de error, permitir continuar (fail open)
      next();
    }
  };
}

/**
 * Middleware para agregar marca de agua si el tier lo requiere
 */
export function addWatermarkIfNeeded(req, res, next) {
  const tierConfig = req.tierConfig || getTierConfig('free');

  if (!tierConfig.limits.canRemoveWatermark) {
    req.addWatermark = true;
    req.watermarkText = '\n\n---\n📝 Generado con GuionIA - https://guion-youtube-ia.netlify.app\n🚀 Upgrade para quitar esta marca de agua';
  }

  next();
}

/**
 * Obtener estadísticas de uso del usuario
 */
export function getUsageStats(req, res) {
  const sessionId = req.sessionId || generateSessionId(req);
  const userTier = getUserTier(req);
  const tierConfig = getTierConfig(userTier);
  const currentUsage = getDailyUsage(sessionId);

  return res.json({
    tier: userTier,
    usage: {
      today: currentUsage,
      limit: tierConfig.limits.dailyGenerations,
      remaining: tierConfig.limits.dailyGenerations === -1 ? -1 : Math.max(0, tierConfig.limits.dailyGenerations - currentUsage),
      unlimited: tierConfig.limits.dailyGenerations === -1
    },
    limits: {
      maxDurationMinutes: tierConfig.limits.maxDurationMinutes,
      canRemoveWatermark: tierConfig.limits.canRemoveWatermark,
      canAccessAPI: tierConfig.limits.canAccessAPI,
      availableFormats: tierConfig.limits.availableFormats
    },
    upgradeAvailable: userTier !== 'enterprise'
  });
}

/**
 * Resetear límites diarios (para testing)
 */
export function resetDailyLimits(req, res) {
  const sessionId = req.sessionId || generateSessionId(req);
  usageStore.delete(sessionId);

  return res.json({
    message: 'Límites diarios reseteados',
    sessionId: sessionId.substr(0, 8) + '...'
  });
}

/**
 * Simular upgrade de tier (para testing sin Stripe)
 */
export function simulateUpgrade(req, res) {
  const { tier } = req.body;
  const sessionId = req.sessionId || generateSessionId(req);

  if (!['free', 'pro', 'enterprise'].includes(tier)) {
    return res.status(400).json({ error: 'Tier inválido' });
  }

  tierStore.set(sessionId, tier);

  return res.json({
    message: `Tier actualizado a ${tier}`,
    tier,
    sessionId: sessionId.substr(0, 8) + '...'
  });
}

export default {
  checkUsageLimits,
  addWatermarkIfNeeded,
  getUsageStats,
  resetDailyLimits,
  simulateUpgrade
};
