/**
 * Netlify Function: Obtener información de pricing
 */

const TIERS = {
  FREE: {
    name: 'Free',
    id: 'free',
    price: {
      monthly: 0,
      yearly: 0
    },
    features: [
      '✅ 3 generaciones por día',
      '✅ Guiones hasta 30 minutos',
      '✅ Formato YouTube',
      '❌ Marca de agua incluida',
      '❌ Sin soporte'
    ],
    popular: false
  },
  PRO: {
    name: 'Pro',
    id: 'pro',
    price: {
      monthly: 19,
      yearly: 190
    },
    features: [
      '✅ 50 generaciones por día',
      '✅ Guiones hasta 120 minutos',
      '✅ Todos los formatos',
      '✅ Sin marca de agua',
      '✅ Exportación avanzada',
      '✅ Soporte por email',
      '🎁 Ahorra $38 con plan anual'
    ],
    popular: true
  },
  ENTERPRISE: {
    name: 'Enterprise',
    id: 'enterprise',
    price: {
      monthly: 99,
      yearly: 990
    },
    features: [
      '✅ Generaciones ilimitadas',
      '✅ Sin límite de duración',
      '✅ Todos los formatos',
      '✅ API access',
      '✅ Whitelabel',
      '✅ Soporte prioritario',
      '🎁 Ahorra $198 con plan anual'
    ],
    popular: false
  }
};

export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tiers: Object.values(TIERS),
        currency: 'USD'
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error al obtener pricing',
        message: error.message
      })
    };
  }
};
