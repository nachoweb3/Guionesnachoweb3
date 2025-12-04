// ========================================
//   DYNAMIC PORTFOLIO SYSTEM
//   Real Projects Showcase
// ========================================

class PortfolioManager {
    constructor() {
        this.projects = [];
        this.filters = ['All', 'Blockchain', 'AI/DeFi', 'NFT', 'Analytics'];
        this.init();
    }

    async init() {
        await this.loadProjects();
        this.createPortfolioInterface();
        this.setupFiltering();
        this.setupSearch();
        this.setupAnimations();
        this.setupProjectModal();
    }

    async loadProjects() {
        try {
            const response = await fetch('./portfolio-projects.json');
            const data = await response.json();
            this.projects = data.featuredProjects;
            this.otherProjects = data.otherProjects;
            this.achievements = data.achievements;
            this.testimonials = data.testimonials;
        } catch (error) {
            console.error('Error loading projects:', error);
            // Fallback projects
            this.projects = this.getFallbackProjects();
        }
    }

    createPortfolioInterface() {
        const portfolioSection = document.createElement('section');
        portfolioSection.className = 'portfolio-section enhanced-portfolio';
        portfolioSection.innerHTML = `
            <div class="container">
                <div class="section-header">
                    <span class="section-label">💼 Portfolio</span>
                    <h2 class="section-title gradient-text">Real-World Projects</h2>
                    <p class="section-description">Corte de proyectos innovadores en blockchain y Web3</p>
                </div>

                <!-- Search Bar -->
                <div class="portfolio-search">
                    <div class="search-container">
                        <i class="fas fa-search"></i>
                        <input type="text" class="search-input" placeholder="Search projects..." id="portfolio-search">
                        <div class="search-filters" id="portfolio-filters">
                            ${this.filters.map(filter => `
                                <button class="filter-btn ${filter === 'All' ? 'active' : ''}" data-filter="${filter}">
                                    ${filter}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Featured Projects -->
                <div class="featured-showcase">
                    <h3 class="showcase-title">🌟 Featured Projects</h3>
                    <div class="featured-projects-grid" id="featured-projects">
                        ${this.renderFeaturedProjects()}
                    </div>
                </div>

                <!-- All Projects Grid -->
                <div class="projects-grid-container">
                    <div class="projects-header">
                        <h3 class="projects-title">🚀 All Projects</h3>
                        <div class="view-toggle">
                            <button class="view-btn active" data-view="grid">
                                <i class="fas fa-th"></i>
                            </button>
                            <button class="view-btn" data-view="list">
                                <i class="fas fa-list"></i>
                            </button>
                        </div>
                    </div>
                    <div class="projects-grid" id="projects-grid">
                        ${this.renderAllProjects()}
                    </div>
                </div>

                <!-- Achievements Section -->
                <div class="achievements-section">
                    <h3 class="achievements-title">🏆 Achievements & Recognition</h3>
                    <div class="achievements-grid">
                        ${this.renderAchievements()}
                    </div>
                </div>

                <!-- Testimonials -->
                <div class="testimonials-section">
                    <h3 class="testimonials-title">💬 Client Testimonials</h3>
                    <div class="testimonials-slider">
                        ${this.renderTestimonials()}
                    </div>
                </div>
            </div>
        `;

        // Add to main content
        const mainContent = document.querySelector('main') || document.body;
        mainContent.appendChild(portfolioSection);

        // Initialize animations
        this.initializeProjectAnimations();
    }

    renderFeaturedProjects() {
        return this.projects.map(project => this.renderFeaturedProjectCard(project)).join('');
    }

    renderFeaturedProjectCard(project) {
        return `
            <div class="featured-project-card card card-interactive" data-category="${project.category}">
                <div class="featured-badge">🌟 Featured</div>
                <div class="project-image-container">
                    <img src="${project.image}" alt="${project.title}" class="project-image">
                    <div class="project-overlay">
                        <a href="${project.url}" target="_blank" class="project-link">
                            <i class="fas fa-external-link-alt"></i>
                            View Project
                        </a>
                    </div>
                </div>
                <div class="project-content">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-description">${project.description}</p>
                    <div class="project-technologies">
                        ${project.technologies.map(tech => `
                            <span class="tech-tag">${tech}</span>
                        `).join('')}
                    </div>
                    <div class="project-stats">
                        ${Object.entries(project.stats).map(([key, value]) => `
                            <div class="stat-item">
                                <span class="stat-icon">${this.getStatIcon(key)}</span>
                                <div class="stat-info">
                                    <span class="stat-value">${value}</span>
                                    <span class="stat-label">${this.formatStatLabel(key)}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="project-actions">
                        <a href="${project.url}" target="_blank" class="btn btn-primary">
                            <i class="fas fa-external-link-alt"></i>
                            Live Demo
                        </a>
                        <button class="btn btn-secondary" onclick="portfolioManager.showProjectDetails('${project.id}')">
                            <i class="fas fa-info-circle"></i>
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderAllProjects() {
        const allProjects = [...this.projects, ...(this.otherProjects || [])];
        return allProjects.map(project => this.renderProjectCard(project)).join('');
    }

    renderProjectCard(project) {
        return `
            <div class="project-card card card-interactive" data-category="${project.category}" data-id="${project.id}">
                <div class="project-image-container">
                    <img src="${project.image}" alt="${project.title}" class="project-image">
                    <div class="category-badge">${project.category}</div>
                </div>
                <div class="project-content">
                    <h3 class="project-title">${project.title}</h3>
                    <p class="project-description">${project.description}</p>
                    <div class="project-technologies">
                        ${project.technologies.slice(0, 3).map(tech => `
                            <span class="tech-tag">${tech}</span>
                        `).join('')}
                        ${project.technologies.length > 3 ? `
                            <span class="tech-tag more">+${project.technologies.length - 3}</span>
                        ` : ''}
                    </div>
                    <div class="project-actions">
                        ${project.url ? `
                            <a href="${project.url}" target="_blank" class="btn btn-primary btn-sm">
                                <i class="fas fa-external-link-alt"></i>
                                View
                            </a>
                        ` : ''}
                        <button class="btn btn-secondary btn-sm" onclick="portfolioManager.showProjectDetails('${project.id}')">
                            <i class="fas fa-info-circle"></i>
                            Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderAchievements() {
        return this.achievements.map(achievement => `
            <div class="achievement-card card card-glass">
                <div class="achievement-icon">${achievement.icon}</div>
                <h4 class="achievement-title">${achievement.title}</h4>
                <p class="achievement-description">${achievement.description}</p>
            </div>
        `).join('');
    }

    renderTestimonials() {
        return this.testimonials.map(testimonial => `
            <div class="testimonial-card">
                <div class="testimonial-content">
                    <div class="testimonial-rating">
                        ${Array(testimonial.rating).fill('⭐').join('')}
                    </div>
                    <p class="testimonial-text">"${testimonial.content}"</p>
                    <div class="testimonial-author">
                        <div class="author-info">
                            <h5 class="author-name">${testimonial.name}</h5>
                            <span class="author-role">${testimonial.role}</span>
                            <span class="author-project">for ${testimonial.project}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    setupFiltering() {
        const filterButtons = document.querySelectorAll('#portfolio-filters .filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.dataset.filter;

                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Filter projects
                this.filterProjects(filter);
            });
        });
    }

    setupSearch() {
        const searchInput = document.getElementById('portfolio-search');
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchProjects(e.target.value);
            }, 300);
        });
    }

    filterProjects(category) {
        const projectCards = document.querySelectorAll('.project-card');

        projectCards.forEach(card => {
            if (category === 'All' || card.dataset.category === category) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.classList.add('animate-in');
                }, 100);
            } else {
                card.style.display = 'none';
                card.classList.remove('animate-in');
            }
        });
    }

    searchProjects(query) {
        const projectCards = document.querySelectorAll('.project-card');
        const searchQuery = query.toLowerCase();

        projectCards.forEach(card => {
            const title = card.querySelector('.project-title').textContent.toLowerCase();
            const description = card.querySelector('.project-description').textContent.toLowerCase();
            const technologies = Array.from(card.querySelectorAll('.tech-tag')).map(tag => tag.textContent.toLowerCase()).join(' ');

            const matchesSearch = title.includes(searchQuery) ||
                                 description.includes(searchQuery) ||
                                 technologies.includes(searchQuery);

            if (matchesSearch) {
                card.style.display = 'block';
                setTimeout(() => {
                    card.classList.add('animate-in');
                }, 100);
            } else {
                card.style.display = 'none';
                card.classList.remove('animate-in');
            }
        });
    }

    setupAnimations() {
        // View toggle functionality
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                const view = button.dataset.view;
                viewButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                const grid = document.getElementById('projects-grid');
                grid.className = view === 'list' ? 'projects-grid list-view' : 'projects-grid';
            });
        });

        // Intersection Observer for animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.project-card, .achievement-card, .testimonial-card').forEach(card => {
            observer.observe(card);
        });
    }

    setupProjectModal() {
        // Create modal container
        const modal = document.createElement('div');
        modal.className = 'project-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title" id="modal-title">Project Details</h3>
                    <button class="modal-close" onclick="portfolioManager.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body" id="modal-body">
                    <!-- Content will be dynamically inserted -->
                </div>
            </div>
            <div class="modal-backdrop" onclick="portfolioManager.closeModal()"></div>
        `;
        document.body.appendChild(modal);
    }

    showProjectDetails(projectId) {
        const allProjects = [...this.projects, ...(this.otherProjects || [])];
        const project = allProjects.find(p => p.id === projectId);

        if (!project) return;

        const modal = document.querySelector('.project-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        modalTitle.textContent = project.title;
        modalBody.innerHTML = `
            <div class="project-details">
                <div class="detail-hero">
                    <img src="${project.image}" alt="${project.title}" class="detail-image">
                    <div class="project-meta">
                        <div class="meta-item">
                            <span class="meta-label">Category:</span>
                            <span class="meta-value">${project.category}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Status:</span>
                            <span class="meta-value status-live">🟢 Live</span>
                        </div>
                    </div>
                </div>

                <div class="detail-content">
                    <div class="detail-section">
                        <h4>Overview</h4>
                        <p>${project.description}</p>
                    </div>

                    ${project.achievements ? `
                        <div class="detail-section">
                            <h4>Key Features & Achievements</h4>
                            <ul class="achievements-list">
                                ${project.achievements.map(achievement => `
                                    <li class="achievement-item">
                                        <i class="fas fa-check-circle"></i>
                                        ${achievement}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    <div class="detail-section">
                        <h4>Technologies Used</h4>
                        <div class="tech-stack">
                            ${project.technologies.map(tech => `
                                <div class="tech-item">
                                    <span class="tech-name">${tech}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="detail-actions">
                        ${project.url ? `
                            <a href="${project.url}" target="_blank" class="btn btn-primary btn-lg">
                                <i class="fas fa-external-link-alt"></i>
                                Visit Live Project
                            </a>
                        ` : ''}
                        <button class="btn btn-secondary btn-lg" onclick="portfolioManager.closeModal()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    closeModal() {
        const modal = document.querySelector('.project-modal');
        modal.classList.remove('active');
    }

    initializeProjectAnimations() {
        // Add hover effects
        document.querySelectorAll('.project-card, .featured-project-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    getStatIcon(statKey) {
        const icons = {
            'visitors': '👥',
            'articles': '📄',
            'accuracy': '🎯',
            'users': '👤',
            'strategies': '📊',
            'success_rate': '✅'
        };
        return icons[statKey] || '📈';
    }

    formatStatLabel(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    getFallbackProjects() {
        return [
            {
                id: 'crypto-blog',
                title: 'Crypto Market Indicators',
                description: 'Technical analysis and market insights',
                url: 'https://nachoweb3.github.io/blog/crypto-market-indicators/',
                technologies: ['React', 'Web3', 'Chart.js'],
                category: 'Blockchain'
            }
        ];
    }
}

// Initialize portfolio manager
let portfolioManager;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize after a short delay to ensure DOM is ready
    setTimeout(() => {
        portfolioManager = new PortfolioManager();
    }, 500);
});

// Add CSS for dynamic portfolio
const portfolioCSS = `
    .enhanced-portfolio {
        padding: 5rem 0;
        background: linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-secondary) 100%);
    }

    .portfolio-search {
        margin-bottom: 3rem;
    }

    .search-container {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        backdrop-filter: blur(10px);
    }

    .search-container i {
        position: absolute;
        left: 1.5rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--color-text-muted);
    }

    .search-input {
        width: 100%;
        padding: 1rem 1rem 1rem 3rem;
        background: var(--color-bg-secondary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text);
        font-size: var(--font-size-lg);
        margin-bottom: 1rem;
    }

    .search-filters {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .filter-btn {
        padding: 0.5rem 1rem;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-full);
        color: var(--color-text);
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: all var(--transition-normal);
    }

    .filter-btn:hover,
    .filter-btn.active {
        background: var(--gradient-primary);
        color: white;
        border-color: transparent;
    }

    .featured-showcase {
        margin-bottom: 4rem;
    }

    .showcase-title {
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text);
        margin-bottom: 2rem;
        text-align: center;
    }

    .featured-projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 2rem;
    }

    .featured-project-card {
        position: relative;
        overflow: hidden;
        border: 2px solid var(--color-primary);
        background: var(--color-surface);
        backdrop-filter: blur(10px);
    }

    .featured-badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: var(--gradient-primary);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-bold);
        z-index: 2;
    }

    .project-image-container {
        position: relative;
        width: 100%;
        height: 200px;
        overflow: hidden;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .project-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform var(--transition-normal);
    }

    .project-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity var(--transition-normal);
    }

    .featured-project-card:hover .project-overlay {
        opacity: 1;
    }

    .featured-project-card:hover .project-image {
        transform: scale(1.1);
    }

    .project-link {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        color: white;
        text-decoration: none;
        font-weight: var(--font-weight-semibold);
    }

    .project-link i {
        font-size: var(--icon-xl);
    }

    .category-badge {
        position: absolute;
        top: 1rem;
        left: 1rem;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
    }

    .project-content {
        padding: 1.5rem;
    }

    .project-title {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text);
        margin-bottom: 1rem;
    }

    .project-description {
        color: var(--color-text-secondary);
        margin-bottom: 1rem;
        line-height: var(--line-height-relaxed);
    }

    .project-technologies {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }

    .tech-tag {
        background: rgba(99, 102, 241, 0.1);
        color: var(--color-primary);
        padding: 0.25rem 0.75rem;
        border-radius: var(--radius-full);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
    }

    .tech-tag.more {
        background: rgba(156, 163, 175, 0.1);
        color: var(--color-text-muted);
    }

    .project-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .stat-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .stat-icon {
        font-size: var(--icon-lg);
    }

    .stat-info {
        display: flex;
        flex-direction: column;
    }

    .stat-value {
        font-weight: var(--font-weight-bold);
        color: var(--color-primary);
    }

    .stat-label {
        font-size: var(--font-size-xs);
        color: var(--color-text-muted);
        text-transform: uppercase;
    }

    .project-actions {
        display: flex;
        gap: 1rem;
    }

    .projects-grid-container {
        margin-bottom: 4rem;
    }

    .projects-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
    }

    .projects-title {
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text);
    }

    .view-toggle {
        display: flex;
        gap: 0.5rem;
    }

    .view-btn {
        width: 40px;
        height: 40px;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius);
        color: var(--color-text);
        cursor: pointer;
        transition: all var(--transition-normal);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .view-btn:hover,
    .view-btn.active {
        background: var(--gradient-primary);
        color: white;
        border-color: transparent;
    }

    .projects-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        gap: 2rem;
    }

    .projects-grid.list-view {
        grid-template-columns: 1fr;
    }

    .project-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        overflow: hidden;
        transition: all var(--transition-normal);
        opacity: 0;
        transform: translateY(30px);
    }

    .project-card.animate-in {
        opacity: 1;
        transform: translateY(0);
    }

    .achievements-section,
    .testimonials-section {
        margin-top: 4rem;
    }

    .achievements-title,
    .testimonials-title {
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text);
        margin-bottom: 2rem;
        text-align: center;
    }

    .achievements-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
    }

    .achievement-card {
        text-align: center;
        padding: 2rem;
    }

    .achievement-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }

    .achievement-title {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-text);
        margin-bottom: 0.5rem;
    }

    .achievement-description {
        color: var(--color-text-secondary);
        line-height: var(--line-height-relaxed);
    }

    .testimonials-slider {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 2rem;
    }

    .testimonial-card {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        padding: 2rem;
        position: relative;
    }

    .testimonial-rating {
        margin-bottom: 1rem;
    }

    .testimonial-text {
        color: var(--color-text-secondary);
        font-style: italic;
        margin-bottom: 1.5rem;
        line-height: var(--line-height-relaxed);
    }

    .author-info {
        display: flex;
        flex-direction: column;
    }

    .author-name {
        font-weight: var(--font-weight-bold);
        color: var(--color-text);
        margin-bottom: 0.25rem;
    }

    .author-role {
        color: var(--color-text-muted);
        font-size: var(--font-size-sm);
        margin-bottom: 0.25rem;
    }

    .author-project {
        color: var(--color-primary);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-semibold);
    }

    /* Modal Styles */
    .project-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: var(--z-modal);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all var(--transition-normal);
    }

    .project-modal.active {
        opacity: 1;
        visibility: visible;
    }

    .modal-content {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl);
        max-width: 800px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        z-index: 1;
        transform: scale(0.9);
        transition: transform var(--transition-normal);
    }

    .project-modal.active .modal-content {
        transform: scale(1);
    }

    .modal-backdrop {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--color-overlay-heavy);
        backdrop-filter: blur(10px);
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 2rem 2rem 1rem;
        border-bottom: 1px solid var(--color-border-light);
    }

    .modal-title {
        font-size: var(--font-size-2xl);
        font-weight: var(--font-weight-bold);
        color: var(--color-text);
    }

    .modal-close {
        background: none;
        border: none;
        color: var(--color-text-muted);
        font-size: var(--font-size-xl);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: var(--radius);
        transition: all var(--transition-normal);
    }

    .modal-close:hover {
        color: var(--color-text);
        background: var(--color-surface-hover);
    }

    .modal-body {
        padding: 2rem;
    }

    .detail-hero {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 2rem;
        margin-bottom: 2rem;
    }

    .detail-image {
        width: 100%;
        max-height: 300px;
        object-fit: cover;
        border-radius: var(--radius-lg);
    }

    .project-meta {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .meta-item {
        display: flex;
        flex-direction: column;
    }

    .meta-label {
        font-size: var(--font-size-sm);
        color: var(--color-text-muted);
        margin-bottom: 0.25rem;
    }

    .meta-value {
        font-weight: var(--font-weight-semibold);
        color: var(--color-text);
    }

    .status-live {
        color: var(--color-success) !important;
    }

    .detail-section {
        margin-bottom: 2rem;
    }

    .detail-section h4 {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-bold);
        color: var(--color-text);
        margin-bottom: 1rem;
    }

    .achievements-list {
        list-style: none;
        padding: 0;
    }

    .achievement-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 0;
        color: var(--color-text-secondary);
    }

    .achievement-item i {
        color: var(--color-success);
    }

    .tech-stack {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 1rem;
    }

    .tech-item {
        background: rgba(99, 102, 241, 0.1);
        border: 1px solid var(--color-primary);
        border-radius: var(--radius-md);
        padding: 1rem;
        text-align: center;
    }

    .tech-name {
        font-weight: var(--font-weight-semibold);
        color: var(--color-primary);
    }

    .detail-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    @media (max-width: 768px) {
        .featured-projects-grid {
            grid-template-columns: 1fr;
        }

        .projects-grid {
            grid-template-columns: 1fr;
        }

        .projects-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
        }

        .detail-hero {
            grid-template-columns: 1fr;
        }

        .tech-stack {
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        }

        .modal-content {
            margin: 1rem;
            max-height: 95vh;
        }
    }
`;

const portfolioStyleSheet = document.createElement('style');
portfolioStyleSheet.textContent = portfolioCSS;
document.head.appendChild(portfolioStyleSheet);