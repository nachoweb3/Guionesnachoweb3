/* ========================================
   SHOPPING CART SYSTEM
   Manages product cart and checkout
   ======================================== */

/**
 * Shopping Cart Manager
 * Handles cart operations, storage, and checkout
 */
class ShoppingCartManager {
    constructor() {
        this.items = [];
        this.cartKey = 'nacho_portfolio_cart';
        this.loadCart();
    }

    /**
     * Add product to cart
     * @param {Object} product - Product object
     * @param {number} quantity - Quantity to add
     * @returns {Object} Cart status
     */
    addItem(product, quantity = 1) {
        const existingItem = this.items.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                ...product,
                quantity,
                addedAt: new Date().toISOString()
            });
        }

        this.saveCart();
        this.updateCartUI();

        return {
            success: true,
            message: `${product.name} añadido al carrito`,
            itemCount: this.getItemCount()
        };
    }

    /**
     * Remove product from cart
     * @param {number} productId - Product ID to remove
     * @returns {Object} Cart status
     */
    removeItem(productId) {
        const itemIndex = this.items.findIndex(item => item.id === productId);

        if (itemIndex > -1) {
            const removedItem = this.items.splice(itemIndex, 1)[0];
            this.saveCart();
            this.updateCartUI();

            return {
                success: true,
                message: `${removedItem.name} eliminado del carrito`,
                itemCount: this.getItemCount()
            };
        }

        return {
            success: false,
            message: 'Producto no encontrado en el carrito'
        };
    }

    /**
     * Update item quantity
     * @param {number} productId - Product ID
     * @param {number} quantity - New quantity
     */
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);

        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
                this.updateCartUI();
            }
        }
    }

    /**
     * Clear all items from cart
     */
    clearCart() {
        this.items = [];
        this.saveCart();
        this.updateCartUI();
        return { success: true, message: 'Carrito vaciado' };
    }

    /**
     * Get cart items
     * @returns {Array} Cart items
     */
    getItems() {
        return this.items;
    }

    /**
     * Get total item count
     * @returns {number} Total items
     */
    getItemCount() {
        return this.items.reduce((total, item) => total + item.quantity, 0);
    }

    /**
     * Calculate cart total
     * @returns {Object} Total calculations
     */
    calculateTotal() {
        const subtotal = this.items.reduce((total, item) => {
            const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price.replace('$', ''));
            return total + (itemPrice * item.quantity);
        }, 0);

        const tax = subtotal * 0.1; // 10% tax (adjust as needed)
        const total = subtotal + tax;

        return {
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2),
            currency: 'USD'
        };
    }

    /**
     * Save cart to localStorage
     */
    saveCart() {
        try {
            localStorage.setItem(this.cartKey, JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    /**
     * Load cart from localStorage
     */
    loadCart() {
        try {
            const savedCart = localStorage.getItem(this.cartKey);
            if (savedCart) {
                this.items = JSON.parse(savedCart);
                this.updateCartUI();
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            this.items = [];
        }
    }

    /**
     * Update cart UI elements
     */
    updateCartUI() {
        // Update cart badge
        const cartBadge = document.getElementById('cartBadge');
        const itemCount = this.getItemCount();

        if (cartBadge) {
            cartBadge.textContent = itemCount;
            cartBadge.style.display = itemCount > 0 ? 'flex' : 'none';
        }

        // Update cart modal if open
        const cartModal = document.getElementById('cartModal');
        if (cartModal && cartModal.classList.contains('active')) {
            this.renderCartModal();
        }

        // Dispatch cart update event
        window.dispatchEvent(new CustomEvent('cart:updated', {
            detail: {
                itemCount,
                total: this.calculateTotal()
            }
        }));
    }

    /**
     * Render cart modal content
     */
    renderCartModal() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartTotalElement = document.getElementById('cartTotal');

        if (!cartItemsContainer) return;

        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Tu carrito está vacío</p>
                    <a href="#tienda" class="btn-primary" onclick="closeCartModal()">
                        Ir a la Tienda
                    </a>
                </div>
            `;
            if (cartTotalElement) cartTotalElement.innerHTML = '';
            return;
        }

        // Render cart items
        cartItemsContainer.innerHTML = this.items.map(item => {
            const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price.replace('$', ''));
            const itemTotal = (itemPrice * item.quantity).toFixed(2);

            return `
                <div class="cart-item" data-product-id="${item.id}">
                    <div class="cart-item-info">
                        <div class="cart-item-icon">
                            <i class="${item.icon}"></i>
                        </div>
                        <div class="cart-item-details">
                            <h4>${item.title || item.name}</h4>
                            <p class="cart-item-price">$${itemPrice} × ${item.quantity}</p>
                        </div>
                    </div>
                    <div class="cart-item-actions">
                        <div class="quantity-controls">
                            <button onclick="cart.updateQuantity(${item.id}, ${item.quantity - 1})" class="qty-btn">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="quantity">${item.quantity}</span>
                            <button onclick="cart.updateQuantity(${item.id}, ${item.quantity + 1})" class="qty-btn">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                        <div class="cart-item-total">$${itemTotal}</div>
                        <button onclick="cart.removeItem(${item.id})" class="remove-btn" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Render totals
        const totals = this.calculateTotal();
        if (cartTotalElement) {
            cartTotalElement.innerHTML = `
                <div class="cart-summary">
                    <div class="cart-summary-row">
                        <span>Subtotal:</span>
                        <span>$${totals.subtotal}</span>
                    </div>
                    <div class="cart-summary-row">
                        <span>Impuestos (10%):</span>
                        <span>$${totals.tax}</span>
                    </div>
                    <div class="cart-summary-row cart-summary-total">
                        <span>Total:</span>
                        <span>$${totals.total}</span>
                    </div>
                </div>
                <div class="cart-actions">
                    <button onclick="cart.initiateCheckout()" class="btn-primary btn-large">
                        <i class="fas fa-lock"></i>
                        Proceder al Pago
                    </button>
                    <button onclick="cart.clearCart()" class="btn-secondary">
                        <i class="fas fa-trash"></i>
                        Vaciar Carrito
                    </button>
                </div>
            `;
        }
    }

    /**
     * Initiate checkout process
     */
    async initiateCheckout() {
        if (this.items.length === 0) {
            showNotification('El carrito está vacío', 'error');
            return;
        }

        // Close cart modal
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.remove('active');
        }

        // Open checkout modal
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            checkoutModal.classList.add('active');
            this.renderCheckoutModal();
        } else {
            // Create checkout modal if it doesn't exist
            this.createCheckoutModal();
        }
    }

    /**
     * Render checkout modal
     */
    renderCheckoutModal() {
        const checkoutContainer = document.getElementById('checkoutContainer');
        if (!checkoutContainer) return;

        const totals = this.calculateTotal();

        checkoutContainer.innerHTML = `
            <div class="checkout-content">
                <h2>Checkout</h2>

                <div class="checkout-summary">
                    <h3>Resumen del Pedido</h3>
                    ${this.items.map(item => {
                        const itemPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price.replace('$', ''));
                        return `
                            <div class="checkout-item">
                                <span>${item.title || item.name} × ${item.quantity}</span>
                                <span>$${(itemPrice * item.quantity).toFixed(2)}</span>
                            </div>
                        `;
                    }).join('')}
                    <div class="checkout-total">
                        <strong>Total:</strong>
                        <strong>$${totals.total}</strong>
                    </div>
                </div>

                <div class="payment-method-selector">
                    <h3>Método de Pago</h3>
                    <div class="payment-methods">
                        <button class="payment-method-btn" onclick="cart.selectPaymentMethod('crypto')">
                            <i class="fab fa-bitcoin"></i>
                            <span>Criptomonedas</span>
                        </button>
                        <button class="payment-method-btn" onclick="cart.selectPaymentMethod('traditional')">
                            <i class="fas fa-credit-card"></i>
                            <span>Tarjeta / PayPal</span>
                        </button>
                    </div>
                </div>

                <div id="paymentDetails"></div>
            </div>
        `;
    }

    /**
     * Select payment method
     * @param {string} method - Payment method (crypto, traditional)
     */
    selectPaymentMethod(method) {
        const paymentDetails = document.getElementById('paymentDetails');
        if (!paymentDetails) return;

        if (method === 'crypto') {
            this.renderCryptoPayment(paymentDetails);
        } else {
            this.renderTraditionalPayment(paymentDetails);
        }
    }

    /**
     * Render crypto payment options
     * @param {HTMLElement} container - Container element
     */
    renderCryptoPayment(container) {
        const totals = this.calculateTotal();

        container.innerHTML = `
            <div class="crypto-payment-section">
                <h3>Pagar con Criptomonedas</h3>

                <div class="crypto-currency-selector">
                    <label>Selecciona la criptomoneda:</label>
                    <select id="cryptoCurrency" class="form-control">
                        <option value="BTC">Bitcoin (BTC)</option>
                        <option value="ETH">Ethereum (ETH)</option>
                        <option value="USDT_ERC20">USDT (ERC-20)</option>
                        <option value="USDT_TRC20">USDT (TRC-20)</option>
                        <option value="BNB">Binance Coin (BNB)</option>
                        <option value="MATIC">Polygon (MATIC)</option>
                    </select>
                </div>

                <div class="customer-email-input">
                    <label>Tu email para confirmación:</label>
                    <input type="email" id="customerEmail" class="form-control"
                           placeholder="tu@email.com" required>
                </div>

                <div class="crypto-payment-options">
                    <button class="btn-primary btn-large" onclick="cart.processCryptoPayment('wallet')">
                        <i class="fas fa-wallet"></i>
                        Conectar Wallet
                    </button>
                    <button class="btn-secondary btn-large" onclick="cart.processCryptoPayment('manual')">
                        <i class="fas fa-qrcode"></i>
                        Pago Manual (QR)
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render traditional payment options
     * @param {HTMLElement} container - Container element
     */
    renderTraditionalPayment(container) {
        container.innerHTML = `
            <div class="traditional-payment-section">
                <h3>Información de Pago</h3>
                <p class="payment-info">
                    Para pagos con tarjeta o PayPal, por favor contáctanos directamente.
                </p>
                <div class="contact-options">
                    <a href="mailto:money4youbabe@gmail.com" class="btn-primary">
                        <i class="fas fa-envelope"></i>
                        Enviar Email
                    </a>
                    <a href="https://wa.me/34640943669" target="_blank" class="btn-secondary">
                        <i class="fab fa-whatsapp"></i>
                        WhatsApp
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Process crypto payment
     * @param {string} method - Payment method (wallet, manual)
     */
    async processCryptoPayment(method) {
        const currency = document.getElementById('cryptoCurrency')?.value;
        const email = document.getElementById('customerEmail')?.value;

        if (!email || !email.includes('@')) {
            showNotification('Por favor ingresa un email válido', 'error');
            return;
        }

        const totals = this.calculateTotal();

        if (method === 'wallet') {
            // Use wallet connection
            this.connectWalletForPayment(currency, totals.total, email);
        } else {
            // Show manual payment with QR
            this.showManualPayment(currency, totals.total, email);
        }
    }

    /**
     * Connect wallet for payment
     * @param {string} currency - Crypto currency
     * @param {number} amount - Amount in USD
     * @param {string} email - Customer email
     */
    async connectWalletForPayment(currency, amount, email) {
        try {
            showNotification('Conectando wallet...', 'info');

            // Initialize payment
            const payment = await paymentManager.initializePayment({
                productId: this.items.map(i => i.id).join(','),
                productName: this.items.map(i => i.title || i.name).join(', '),
                amount: parseFloat(amount),
                currency,
                customerEmail: email
            });

            // Check if wallet is already connected
            if (!walletManager.connectedAddress) {
                // Determine wallet type based on currency
                const walletType = currency === 'SOL' ? 'phantom' : 'metamask';
                await walletManager.connect(walletType);
            }

            // Process payment
            const result = await paymentManager.processWalletPayment(payment, walletManager);

            if (result.success) {
                showNotification('Transacción enviada! Esperando confirmación...', 'success');

                // Listen for payment completion
                window.addEventListener('payment:paymentCompleted', (e) => {
                    this.handlePaymentSuccess(e.detail);
                }, { once: true });
            }
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    }

    /**
     * Show manual payment with QR code
     * @param {string} currency - Crypto currency
     * @param {number} amount - Amount in USD
     * @param {string} email - Customer email
     */
    async showManualPayment(currency, amount, email) {
        try {
            const payment = await paymentManager.initializePayment({
                productId: this.items.map(i => i.id).join(','),
                productName: this.items.map(i => i.title || i.name).join(', '),
                amount: parseFloat(amount),
                currency,
                customerEmail: email
            });

            // Generate QR code
            const qrCode = await paymentManager.generatePaymentQR(currency, parseFloat(amount));

            // Show payment details modal
            this.showPaymentDetailsModal(payment, qrCode);
        } catch (error) {
            showNotification('Error: ' + error.message, 'error');
        }
    }

    /**
     * Show payment details modal
     * @param {Object} payment - Payment object
     * @param {string} qrCode - QR code data URL
     */
    showPaymentDetailsModal(payment, qrCode) {
        const modal = document.createElement('div');
        modal.className = 'modal payment-details-modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>

                <h2>Detalles del Pago</h2>

                <div class="payment-info-box">
                    <p><strong>Cantidad:</strong> ${payment.cryptoAmount} ${payment.currency}</p>
                    <p><strong>Valor USD:</strong> $${payment.amountUSD}</p>
                </div>

                ${qrCode ? `
                    <div class="qr-code-container">
                        <img src="${qrCode}" alt="QR Code" class="qr-code">
                        <p>Escanea este código con tu wallet</p>
                    </div>
                ` : ''}

                <div class="wallet-address-box">
                    <label>Dirección de pago:</label>
                    <div class="address-copy-field">
                        <input type="text" value="${payment.walletAddress}" readonly>
                        <button onclick="copyToClipboard('${payment.walletAddress}')" class="copy-btn">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>

                <div class="payment-instructions">
                    <h4>Instrucciones:</h4>
                    <ol>
                        <li>Envía exactamente <strong>${payment.cryptoAmount} ${payment.currency}</strong></li>
                        <li>A la dirección mostrada arriba</li>
                        <li>Recibirás confirmación por email cuando se confirme el pago</li>
                    </ol>
                </div>

                <p class="payment-id">ID de Pago: ${payment.id}</p>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Handle successful payment
     * @param {Object} payment - Payment details
     */
    handlePaymentSuccess(payment) {
        // Clear cart
        this.clearCart();

        // Close checkout modal
        const checkoutModal = document.getElementById('checkoutModal');
        if (checkoutModal) {
            checkoutModal.classList.remove('active');
        }

        // Show success message
        showNotification('¡Pago confirmado! Gracias por tu compra.', 'success');

        // Show success modal
        this.showSuccessModal(payment);
    }

    /**
     * Show success modal after payment
     * @param {Object} payment - Payment details
     */
    showSuccessModal(payment) {
        const modal = document.createElement('div');
        modal.className = 'modal success-modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="success-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <h2>¡Pago Exitoso!</h2>
                <p>Tu pago ha sido confirmado y procesado correctamente.</p>
                <div class="transaction-details">
                    <p><strong>ID de Transacción:</strong><br>${payment.txHash}</p>
                    <p><strong>Monto:</strong> ${payment.cryptoAmount} ${payment.currency}</p>
                </div>
                <p>Recibirás un email de confirmación en breve con los detalles de tu pedido.</p>
                <button onclick="this.closest('.modal').remove()" class="btn-primary btn-large">
                    Cerrar
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Create checkout modal in DOM
     */
    createCheckoutModal() {
        const modal = document.createElement('div');
        modal.id = 'checkoutModal';
        modal.className = 'modal checkout-modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close" onclick="closeCheckoutModal()">
                    <i class="fas fa-times"></i>
                </button>
                <div id="checkoutContainer"></div>
            </div>
        `;

        document.body.appendChild(modal);
        this.renderCheckoutModal();
    }
}

// Helper function to copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Dirección copiada al portapapeles', 'success');
    }).catch(err => {
        console.error('Error copying:', err);
    });
}

// Create global instance
const cart = new ShoppingCartManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ShoppingCartManager, cart };
}
