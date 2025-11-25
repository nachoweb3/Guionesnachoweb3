/**
 * Netlify Function: Crear sesión de Stripe Checkout
 */

import Stripe from 'stripe';

export const handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tier, billingPeriod } = JSON.parse(event.body);

    if (!tier || !['pro', 'enterprise'].includes(tier.toLowerCase())) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Tier inválido' })
      };
    }

    // Inicializar Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Obtener Price ID según tier y periodo
    const priceIds = {
      pro: {
        monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
        yearly: process.env.STRIPE_PRICE_PRO_YEARLY
      },
      enterprise: {
        monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
        yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY
      }
    };

    const priceId = priceIds[tier.toLowerCase()][billingPeriod || 'monthly'];

    if (!priceId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Price ID no configurado' })
      };
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.APP_URL || 'https://guion-youtube-ia.netlify.app'}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'https://guion-youtube-ia.netlify.app'}/pricing.html`,
      metadata: {
        tier,
        billingPeriod: billingPeriod || 'monthly'
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sessionId: session.id,
        url: session.url
      })
    };
  } catch (error) {
    console.error('Error creando checkout:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Error al crear sesión de pago',
        message: error.message
      })
    };
  }
};
