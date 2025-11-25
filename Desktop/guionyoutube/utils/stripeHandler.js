/**
 * ============================================
 * STRIPE PAYMENT HANDLER
 * Checkout, webhooks y gestión de suscripciones
 * ============================================
 */

import Stripe from 'stripe';
import TIERS from '../config/tiers.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Crear sesión de Stripe Checkout
 */
export async function createCheckoutSession(tier, billingPeriod, sessionId) {
  try {
    const tierConfig = TIERS[tier.toUpperCase()];

    if (!tierConfig || tier === 'FREE') {
      throw new Error('Tier inválido o no requiere pago');
    }

    // Determinar el price ID según el periodo
    const priceId = billingPeriod === 'yearly'
      ? tierConfig.stripePriceId.yearly
      : tierConfig.stripePriceId.monthly;

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
      success_url: `${process.env.APP_URL || 'https://guion-youtube-ia.netlify.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'https://guion-youtube-ia.netlify.app'}/pricing.html`,
      client_reference_id: sessionId, // Para asociar con el usuario
      metadata: {
        tier,
        billingPeriod,
        sessionId
      },
      allow_promotion_codes: true, // Permitir códigos de descuento
      billing_address_collection: 'auto',
    });

    return {
      sessionId: session.id,
      url: session.url
    };
  } catch (error) {
    console.error('❌ Error creando sesión de Stripe:', error);
    throw error;
  }
}

/**
 * Manejar webhooks de Stripe
 */
export async function handleStripeWebhook(req) {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verificar que el webhook viene de Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('⚠️ Webhook signature verification failed:', err.message);
    throw new Error('Webhook signature verification failed');
  }

  // Manejar diferentes tipos de eventos
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;

    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object);
      break;

    default:
      console.log(`⚡ Unhandled event type: ${event.type}`);
  }

  return { received: true };
}

/**
 * Checkout completado - activar suscripción
 */
async function handleCheckoutCompleted(session) {
  console.log('✅ Checkout completed:', session.id);

  const { client_reference_id: sessionId, metadata } = session;

  // Aquí actualizarías la base de datos
  // Por ahora, usamos el store en memoria (ya implementado en usageTracking.js)

  console.log(`🎉 Usuario ${sessionId} actualizado a tier ${metadata.tier}`);

  // TODO: Guardar en base de datos:
  // - Crear o actualizar usuario
  // - Crear registro de suscripción
  // - Asociar Stripe customer ID
  // - Guardar payment intent

  return {
    success: true,
    tier: metadata.tier,
    sessionId
  };
}

/**
 * Suscripción actualizada
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('🔄 Subscription updated:', subscription.id);

  // TODO: Actualizar base de datos con cambios en la suscripción
  // - Cambios de plan
  // - Renovaciones
  // - Cancelaciones programadas

  return { success: true };
}

/**
 * Suscripción cancelada
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('❌ Subscription deleted:', subscription.id);

  // TODO: Actualizar base de datos
  // - Cambiar tier a FREE
  // - Registrar fecha de cancelación

  return { success: true };
}

/**
 * Factura pagada
 */
async function handleInvoicePaid(invoice) {
  console.log('💰 Invoice paid:', invoice.id);

  // TODO: Registrar pago en base de datos
  // - Crear registro de payment
  // - Actualizar estado de suscripción si aplica

  return { success: true };
}

/**
 * Pago fallido
 */
async function handlePaymentFailed(invoice) {
  console.log('⚠️ Payment failed:', invoice.id);

  // TODO: Notificar al usuario
  // - Enviar email de pago fallido
  // - Actualizar estado de suscripción a "past_due"

  return { success: true };
}

/**
 * Crear portal del cliente (para gestionar suscripción)
 */
export async function createCustomerPortalSession(customerId) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL || 'https://guion-youtube-ia.netlify.app'}`,
    });

    return {
      url: session.url
    };
  } catch (error) {
    console.error('❌ Error creando portal del cliente:', error);
    throw error;
  }
}

/**
 * Obtener información de suscripción
 */
export async function getSubscriptionInfo(subscriptionId) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return {
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      plan: subscription.items.data[0].price.id
    };
  } catch (error) {
    console.error('❌ Error obteniendo info de suscripción:', error);
    throw error;
  }
}

export default {
  createCheckoutSession,
  handleStripeWebhook,
  createCustomerPortalSession,
  getSubscriptionInfo
};
