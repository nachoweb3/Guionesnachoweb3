/**
 * ============================================
 * CONFIGURACIÓN DE TIERS DE MONETIZACIÓN
 * ============================================
 */

export const TIERS = {
  FREE: {
    name: 'Free',
    id: 'free',
    price: {
      monthly: 0,
      yearly: 0
    },
    limits: {
      dailyGenerations: 3,
      maxDurationMinutes: 30,
      maxWordsPerGeneration: 7500, // 30 min * 250 words
      canRemoveWatermark: false,
      canAccessAPI: false,
      canExportAdvanced: false,
      supportLevel: 'none',
      availableFormats: ['youtube'] // Solo YouTube gratis
    },
    features: [
      '✅ 3 generaciones por día',
      '✅ Guiones hasta 30 minutos',
      '✅ Formato YouTube',
      '❌ Marca de agua incluida',
      '❌ Sin soporte'
    ],
    stripePriceId: null
  },

  PRO: {
    name: 'Pro',
    id: 'pro',
    price: {
      monthly: 19,
      yearly: 190 // Ahorra $38/año
    },
    limits: {
      dailyGenerations: 50,
      maxDurationMinutes: 120,
      maxWordsPerGeneration: 30000,
      canRemoveWatermark: true,
      canAccessAPI: false,
      canExportAdvanced: true,
      supportLevel: 'email',
      availableFormats: ['youtube', 'books', 'movies', 'games', 'articles']
    },
    features: [
      '✅ 50 generaciones por día',
      '✅ Guiones hasta 120 minutos',
      '✅ Todos los formatos (Libros, Películas, Juegos, Artículos)',
      '✅ Sin marca de agua',
      '✅ Exportación avanzada (PDF, DOCX)',
      '✅ Soporte por email',
      '🎁 Ahorra $38 con plan anual'
    ],
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_1QXXXXXXXXXXXXXXXXXXpro_monthly',
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_1QXXXXXXXXXXXXXXXXXXpro_yearly'
    },
    popular: true // Badge de "Más Popular"
  },

  ENTERPRISE: {
    name: 'Enterprise',
    id: 'enterprise',
    price: {
      monthly: 99,
      yearly: 990 // Ahorra $198/año
    },
    limits: {
      dailyGenerations: -1, // Ilimitado
      maxDurationMinutes: -1, // Ilimitado
      maxWordsPerGeneration: -1, // Ilimitado
      canRemoveWatermark: true,
      canAccessAPI: true,
      canExportAdvanced: true,
      supportLevel: 'priority',
      availableFormats: ['youtube', 'books', 'movies', 'games', 'articles'],
      whitelabel: true
    },
    features: [
      '✅ Generaciones ilimitadas',
      '✅ Sin límite de duración',
      '✅ Todos los formatos',
      '✅ API access con tu propia key',
      '✅ Whitelabel (tu marca)',
      '✅ Exportación avanzada completa',
      '✅ Soporte prioritario',
      '🎁 Ahorra $198 con plan anual'
    ],
    stripePriceId: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_1QXXXXXXXXXXXXXXXXXXent_monthly',
      yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_1QXXXXXXXXXXXXXXXXXXent_yearly'
    }
  }
};

/**
 * Obtener configuración de un tier específico
 */
export function getTierConfig(tierName) {
  const tier = tierName.toUpperCase();
  return TIERS[tier] || TIERS.FREE;
}

/**
 * Verificar si un tier puede acceder a un formato
 */
export function canAccessFormat(tierName, format) {
  const config = getTierConfig(tierName);
  return config.limits.availableFormats.includes(format.toLowerCase());
}

/**
 * Verificar si un usuario ha excedido límites diarios
 */
export function hasExceededDailyLimit(tierName, currentUsage) {
  const config = getTierConfig(tierName);

  // -1 significa ilimitado
  if (config.limits.dailyGenerations === -1) {
    return false;
  }

  return currentUsage >= config.limits.dailyGenerations;
}

/**
 * Verificar si una duración está permitida para el tier
 */
export function isDurationAllowed(tierName, durationMinutes) {
  const config = getTierConfig(tierName);

  // -1 significa ilimitado
  if (config.limits.maxDurationMinutes === -1) {
    return true;
  }

  return durationMinutes <= config.limits.maxDurationMinutes;
}

/**
 * Obtener mensaje de upgrade para mostrar al usuario
 */
export function getUpgradeMessage(tierName, limitType) {
  const currentTier = getTierConfig(tierName);

  const messages = {
    daily_limit: `Has alcanzado tu límite de ${currentTier.limits.dailyGenerations} generaciones diarias. Upgrade a Pro para 50/día o Enterprise para ilimitado.`,
    duration_limit: `Tu plan ${currentTier.name} permite guiones de hasta ${currentTier.limits.maxDurationMinutes} minutos. Upgrade para mayor duración.`,
    format_locked: `Este formato no está disponible en el plan ${currentTier.name}. Upgrade a Pro para acceder a todos los formatos.`,
    watermark: `Quita la marca de agua con un plan Pro o Enterprise.`,
    api_access: `El acceso a API solo está disponible en el plan Enterprise.`
  };

  return messages[limitType] || 'Upgrade tu plan para acceder a más funcionalidades.';
}

/**
 * Calcular ahorro anual
 */
export function getAnnualSavings(tierName) {
  const config = getTierConfig(tierName);
  const monthlyCost = config.price.monthly * 12;
  const yearlyCost = config.price.yearly;
  return monthlyCost - yearlyCost;
}

export default TIERS;
