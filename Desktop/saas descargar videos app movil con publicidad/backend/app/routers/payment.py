from fastapi import APIRouter, HTTPException, Request
import stripe
from ..models import PaymentRequest
from ..config import get_settings
import logging

router = APIRouter(prefix="/api/payment", tags=["payment"])
logger = logging.getLogger(__name__)

settings = get_settings()
stripe.api_key = settings.stripe_secret_key


@router.post("/create-payment-intent")
async def create_payment_intent(payment: PaymentRequest):
    """Create Stripe payment intent for premium features"""
    try:
        intent = stripe.PaymentIntent.create(
            amount=payment.amount,
            currency=payment.currency,
            metadata={'product_type': payment.product_type}
        )

        return {
            "clientSecret": intent.client_secret,
            "paymentIntentId": intent.id
        }
    except Exception as e:
        logger.error(f"Error creating payment intent: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/products")
async def get_products():
    """Get available premium products"""
    return {
        "products": [
            {
                "id": "premium_monthly",
                "name": "Premium Monthly",
                "price": 999,  # $9.99 in cents
                "currency": "usd",
                "features": [
                    "No ads",
                    "HD export",
                    "Unlimited videos",
                    "Advanced templates",
                    "Priority support"
                ]
            },
            {
                "id": "hd_export",
                "name": "HD Export (One-time)",
                "price": 299,  # $2.99 in cents
                "currency": "usd",
                "features": [
                    "Export current video in HD",
                    "No watermark"
                ]
            },
            {
                "id": "remove_ads",
                "name": "Remove Ads (One-time)",
                "price": 199,  # $1.99 in cents
                "currency": "usd",
                "features": [
                    "Remove ads for 24 hours"
                ]
            }
        ]
    }


@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )

        # Handle different event types
        if event['type'] == 'payment_intent.succeeded':
            payment_intent = event['data']['object']
            logger.info(f"Payment succeeded: {payment_intent['id']}")
            # TODO: Activate premium features for user

        elif event['type'] == 'payment_intent.payment_failed':
            payment_intent = event['data']['object']
            logger.warning(f"Payment failed: {payment_intent['id']}")

        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/config")
async def get_stripe_config():
    """Get Stripe publishable key for frontend"""
    return {
        "publishableKey": settings.stripe_publishable_key
    }
