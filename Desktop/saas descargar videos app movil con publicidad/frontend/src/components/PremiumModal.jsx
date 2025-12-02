import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { getStripeConfig, getProducts, createPaymentIntent } from '../services/api';
import { toast } from 'react-toastify';
import { FaTimes, FaCrown, FaCheck } from 'react-icons/fa';
import './PremiumModal.css';

const CheckoutForm = ({ product, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);

    try {
      const { clientSecret } = await createPaymentIntent(
        product.price,
        product.currency,
        product.id
      );

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (error) {
        toast.error(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        toast.success('Payment successful!');
        onSuccess();
      }
    } catch (error) {
      toast.error('Payment failed: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <div className="card-element-container">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#ffffff',
                '::placeholder': {
                  color: '#a0a0a0',
                },
              },
            },
          }}
        />
      </div>

      <button type="submit" disabled={!stripe || loading} className="btn-pay">
        {loading ? 'Processing...' : `Pay $${(product.price / 100).toFixed(2)}`}
      </button>

      <button type="button" onClick={onCancel} className="btn-cancel">
        Cancel
      </button>
    </form>
  );
};

const PremiumModal = ({ isOpen, onClose }) => {
  const [stripePromise, setStripePromise] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const loadStripeConfig = async () => {
      try {
        const config = await getStripeConfig();
        setStripePromise(loadStripe(config.publishableKey));
      } catch (error) {
        console.error('Error loading Stripe config:', error);
      }
    };

    const loadProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data.products);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    if (isOpen) {
      loadStripeConfig();
      loadProducts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FaTimes />
        </button>

        <div className="modal-header">
          <FaCrown className="crown-icon" />
          <h2>Upgrade to Premium</h2>
        </div>

        {!selectedProduct ? (
          <div className="products-grid">
            {products.map((product) => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <div className="price">
                  ${(product.price / 100).toFixed(2)}
                  <span className="currency">{product.currency.toUpperCase()}</span>
                </div>
                <ul className="features-list">
                  {product.features.map((feature, idx) => (
                    <li key={idx}>
                      <FaCheck className="check-icon" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setSelectedProduct(product)}
                  className="btn-select"
                >
                  Select Plan
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="checkout-section">
            <h3>Complete Your Purchase</h3>
            <p className="selected-product">{selectedProduct.name}</p>

            {stripePromise && (
              <Elements stripe={stripePromise}>
                <CheckoutForm
                  product={selectedProduct}
                  onSuccess={() => {
                    setSelectedProduct(null);
                    onClose();
                  }}
                  onCancel={() => setSelectedProduct(null)}
                />
              </Elements>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumModal;
