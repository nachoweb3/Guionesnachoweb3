/* ========================================
   SHOP RENDERER SYSTEM
   Dynamic product rendering and shop interface
   ======================================== */

/**
 * Shop Renderer
 * Handles product display, filtering, and shop interface
 */
class ShopRenderer {
    constructor() {
        this.products = [];
        this.categories = [];
        this.filteredProducts = [];
        this.currentCategory = 'all';
        this.currentSort = 'featured';
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupShopInterface();
        this.renderProducts();
        this.setupEventListeners();
    }

    /**
     * Load products from JSON file
     */
    async loadProducts() {
        try {
            const response = await fetch('./shop-products.json');
            const data = await response.json();
            this.products = [
                ...data.digitalProducts,
                ...data.packages
            ];
            this.categories = data.categories;
            this.cryptoAccepted = data.cryptoAccepted;
            this.filteredProducts = this.products;
        } catch (error) {
            console.error('Error loading products:', error);
            this.showErrorMessage('No se pudieron cargar los productos. Por favor, recarga la página.');
        }
    }

    /**
     * Setup shop interface
     */
    setupShopInterface() {
        const shopGrid = document.getElementById('shopGrid');
        if (!shopGrid) return;

        // Add category filters
        const categoriesHTML = `
            <div class="shop-categories">
                <h3 class="categories-title">Categorías</h3>
                <div class="category-filters">
                    ${this.categories.map(cat => `
                        <button class="category-btn ${cat.id === 'all' ? 'active' : ''}"
                                data-category="${cat.id}">
                            <i class="${cat.icon}"></i>
                            <span>${cat.name}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
            <div class="shop-products-container" id="shopProductsContainer"></div>
        `;

        // Insert after existing content
        const existingContent = shopGrid.innerHTML;
        shopGrid.innerHTML = existingContent + categoriesHTML;
    }

    /**
     * Render products based on current filters
     */
    renderProducts() {
        const container = document.getElementById('shopProductsContainer');
        if (!container) return;

        const sortedProducts = this.sortProducts(this.filteredProducts);

        container.innerHTML = `
            <div class="products-grid" id="productsGrid">
                ${sortedProducts.map(product => this.renderProductCard(product)).join('')}
            </div>
            ${this.filteredProducts.length === 0 ? `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <h3>No se encontraron productos</h3>
                    <p>Intenta con otra categoría o término de búsqueda</p>
                </div>
            ` : ''}
        `;

        // Add event listeners to product cards
        this.attachProductEventListeners();
    }

    /**
     * Render individual product card
     */
    renderProductCard(product) {
        const isInStock = product.stock === -1 || product.stock > 0;
        const hasDiscount = product.discount && product.originalPrice;
        const badge = product.badge ? `<span class="product-badge">${product.badge}</span>` : '';

        return `
            <div class="product-card ${!isInStock ? 'out-of-stock' : ''}" data-product-id="${product.id}">
                ${badge}
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    ${hasDiscount ? `
                        <div class="discount-badge">-${product.discount}%</div>
                    ` : ''}
                    ${!isInStock ? '<div class="out-of-stock-overlay">Agotado</div>' : ''}
                </div>

                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>

                    <div class="product-meta">
                        <div class="product-category">
                            <i class="${this.getCategoryIcon(product.category)}"></i>
                            <span>${this.getCategoryName(product.category)}</span>
                        </div>
                        <div class="product-delivery">
                            <i class="fas fa-clock"></i>
                            <span>${product.deliveryTime}</span>
                        </div>
                    </div>

                    <div class="product-price-container">
                        <div class="product-prices">
                            ${hasDiscount ? `
                                <span class="original-price">$${product.originalPrice}</span>
                            ` : ''}
                            <div class="current-price">
                                <span class="price">$${product.price}</span>
                                <span class="crypto-price">${product.cryptoPrice} ETH</span>
                            </div>
                        </div>

                        <div class="product-rating">
                            ${this.renderStars(product.rating)}
                            <span class="rating-count">(${product.reviews})</span>
                        </div>
                    </div>

                    <div class="product-actions">
                        <button class="btn-primary add-to-cart-btn"
                                data-product-id="${product.id}"
                                ${!isInStock ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart"></i>
                            ${isInStock ? 'Añadir al Carrito' : 'Agotado'}
                        </button>
                        <button class="btn-secondary product-details-btn"
                                data-product-id="${product.id}">
                            <i class="fas fa-info-circle"></i>
                            Ver Detalles
                        </button>
                    </div>

                    <div class="product-features">
                        ${product.features.slice(0, 3).map(feature => `
                            <div class="feature-item">
                                <i class="fas fa-check"></i>
                                <span>${feature}</span>
                            </div>
                        `).join('')}
                        ${product.features.length > 3 ? `
                            <div class="more-features">
                                <span>+${product.features.length - 3} características más</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render star rating
     */
    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

        let stars = '';
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        if (halfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }

        return stars;
    }

    /**
     * Get category icon
     */
    getCategoryIcon(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.icon : 'fas fa-box';
    }

    /**
     * Get category name
     */
    getCategoryName(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Otro';
    }

    /**
     * Sort products based on current sort criteria
     */
    sortProducts(products) {
        const sorted = [...products];

        switch (this.currentSort) {
            case 'price-low':
                return sorted.sort((a, b) => a.price - b.price);
            case 'price-high':
                return sorted.sort((a, b) => b.price - a.price);
            case 'rating':
                return sorted.sort((a, b) => b.rating - a.rating);
            case 'newest':
                return sorted.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
            case 'featured':
            default:
                return sorted.sort((a, b) => {
                    const aFeatured = a.badge === 'MEJOR VALOR' || a.badge === 'EXCLUSIVO' ? 1 : 0;
                    const bFeatured = b.badge === 'MEJOR VALOR' || b.badge === 'EXCLUSIVO' ? 1 : 0;
                    return bFeatured - aFeatured;
                });
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Category filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterByCategory(e.target.closest('.category-btn').dataset.category);
                this.updateActiveCategory(e.target.closest('.category-btn'));
            });
        });

        // Sort options (if added)
        const sortSelect = document.getElementById('sortProducts');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.renderProducts();
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchProducts');
        if (searchInput) {
            searchInput.addEventListener('input', debounce((e) => {
                this.searchProducts(e.target.value);
            }, 300));
        }
    }

    /**
     * Filter products by category
     */
    filterByCategory(category) {
        this.currentCategory = category;

        if (category === 'all') {
            this.filteredProducts = this.products;
        } else {
            this.filteredProducts = this.products.filter(product => product.category === category);
        }

        this.renderProducts();
    }

    /**
     * Search products
     */
    searchProducts(query) {
        const searchTerm = query.toLowerCase();

        this.filteredProducts = this.products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm) ||
                                 product.description.toLowerCase().includes(searchTerm) ||
                                 product.features.some(feature => feature.toLowerCase().includes(searchTerm));

            const matchesCategory = this.currentCategory === 'all' || product.category === this.currentCategory;

            return matchesSearch && matchesCategory;
        });

        this.renderProducts();
    }

    /**
     * Update active category button
     */
    updateActiveCategory(activeBtn) {
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    /**
     * Attach event listeners to product cards
     */
    attachProductEventListeners() {
        // Add to cart buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.add-to-cart-btn').dataset.productId;
                this.addToCart(productId);
            });
        });

        // Product details buttons
        document.querySelectorAll('.product-details-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.target.closest('.product-details-btn').dataset.productId;
                this.showProductDetails(productId);
            });
        });

        // Product card clicks for quick view
        document.querySelectorAll('.product-image').forEach(img => {
            img.addEventListener('click', (e) => {
                const productId = e.target.closest('.product-card').dataset.productId;
                this.showProductDetails(productId);
            });
        });
    }

    /**
     * Add product to cart
     */
    async addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        try {
            // Add loading state
            const btn = document.querySelector(`.add-to-cart-btn[data-product-id="${productId}"]`);
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Añadiendo...';
            btn.disabled = true;

            // Add to cart using the cart manager
            const result = cart.addItem(product);

            if (result.success) {
                // Show success feedback
                btn.innerHTML = '<i class="fas fa-check"></i> ¡Añadido!';
                btn.classList.add('success');

                // Show notification
                showNotification(result.message, 'success');

                // Update cart badge
                this.updateCartBadge();

                // Reset button after delay
                setTimeout(() => {
                    btn.innerHTML = originalHTML;
                    btn.disabled = false;
                    btn.classList.remove('success');
                }, 2000);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            showNotification('Error al añadir al carrito', 'error');

            // Reset button
            const btn = document.querySelector(`.add-to-cart-btn[data-product-id="${productId}"]`);
            btn.innerHTML = originalHTML;
            btn.disabled = false;
        }
    }

    /**
     * Show product details modal
     */
    showProductDetails(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = this.createProductModal(product);
        document.body.appendChild(modal);

        // Add animation
        setTimeout(() => modal.classList.add('active'), 10);
    }

    /**
     * Create product modal
     */
    createProductModal(product) {
        const modal = document.createElement('div');
        modal.className = 'modal product-modal';
        modal.innerHTML = `
            <div class="modal-content product-modal-content">
                <button class="modal-close" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>

                <div class="product-modal-grid">
                    <div class="product-modal-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>

                    <div class="product-modal-details">
                        <h2 class="product-modal-title">${product.name}</h2>
                        <p class="product-modal-description">${product.description}</p>

                        <div class="product-modal-price">
                            ${product.originalPrice ? `
                                <span class="original-price">$${product.originalPrice}</span>
                            ` : ''}
                            <div class="current-price">
                                <span class="price">$${product.price}</span>
                                <span class="crypto-price">≈ ${product.cryptoPrice} ETH</span>
                            </div>
                        </div>

                        <div class="product-modal-info">
                            <div class="info-item">
                                <i class="fas fa-clock"></i>
                                <span><strong>Entrega:</strong> ${product.deliveryTime}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-redo"></i>
                                <span><strong>Revisiones:</strong> ${product.revisions === -1 ? 'Ilimitadas' : product.revisions}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-star"></i>
                                <span><strong>Calificación:</strong> ${this.renderStars(product.rating)} (${product.reviews} reseñas)</span>
                            </div>
                        </div>

                        <div class="product-modal-features">
                            <h4>Características incluidas:</h4>
                            <ul>
                                ${product.features.map(feature => `
                                    <li><i class="fas fa-check"></i> ${feature}</li>
                                `).join('')}
                            </ul>
                        </div>

                        <div class="product-modal-actions">
                            <button class="btn-primary btn-large add-to-cart-modal-btn"
                                    data-product-id="${product.id}">
                                <i class="fas fa-shopping-cart"></i>
                                Añadir al Carrito
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listener for the add to cart button
        modal.querySelector('.add-to-cart-modal-btn').addEventListener('click', () => {
            this.addToCart(product.id);
            modal.remove();
        });

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modal;
    }

    /**
     * Update cart badge
     */
    updateCartBadge() {
        const badge = document.getElementById('cartBadge');
        if (badge) {
            badge.textContent = cart.getItemCount();
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 300);
        }
    }

    /**
     * Show error message
     */
    showErrorMessage(message) {
        const container = document.getElementById('shopProductsContainer');
        if (container) {
            container.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }
}

// Initialize shop renderer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if shop elements exist
    if (document.getElementById('shopGrid') || document.querySelector('.shop-section')) {
        window.shopRenderer = new ShopRenderer();
    }
});