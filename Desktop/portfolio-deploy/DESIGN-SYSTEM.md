# 🎨 Sistema de Diseño - Portfolio Nacho

## Descripción General

Este es un sistema de diseño completo y escalable construido con CSS moderno y variables CSS (Custom Properties). Proporciona componentes consistentes, accesibles y reutilizables para todo el portfolio.

---

## 📚 Tabla de Contenidos

1. [Tokens de Diseño](#tokens-de-diseño)
2. [Sistema de Botones](#sistema-de-botones)
3. [Sistema de Cards](#sistema-de-cards)
4. [Sistema de Formularios](#sistema-de-formularios)
5. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Tokens de Diseño

### Colores

#### Paleta Principal
```css
/* Primarios (50-900) */
--color-primary-500: #6366f1; /* Indigo principal */
--color-primary-600: #4f46e5; /* Indigo oscuro */

/* Secundarios */
--color-secondary-500: #8b5cf6; /* Violeta */

/* Accent */
--color-accent-500: #06b6d4; /* Cyan */
```

#### Colores Semánticos
```css
--color-success-500: #10b981; /* Verde - Éxito */
--color-error-500: #ef4444;   /* Rojo - Error */
--color-warning-500: #f59e0b; /* Amarillo - Advertencia */
--color-info-500: #3b82f6;    /* Azul - Información */
```

#### Colores de Superficie
```css
--color-bg: #0f0f23;              /* Fondo principal */
--color-bg-secondary: #1a1a2e;    /* Fondo secundario */
--color-surface: rgba(255, 255, 255, 0.05);  /* Superficie glassmorphism */
--color-surface-hover: rgba(255, 255, 255, 0.08);
--color-surface-active: rgba(255, 255, 255, 0.12);
```

### Espaciado

Sistema basado en escala de 4px:

```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-5: 1.25rem;  /* 20px */
--spacing-6: 1.5rem;   /* 24px */
--spacing-8: 2rem;     /* 32px */
--spacing-10: 2.5rem;  /* 40px */
--spacing-12: 3rem;    /* 48px */
--spacing-16: 4rem;    /* 64px */
--spacing-20: 5rem;    /* 80px */
--spacing-24: 6rem;    /* 96px */
```

### Tipografía

#### Escalas de Tamaño
```css
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */
--font-size-5xl: 3rem;      /* 48px */
--font-size-6xl: 3.75rem;   /* 60px */
--font-size-7xl: 4.5rem;    /* 72px */
```

#### Pesos
```css
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
--font-weight-black: 900;
```

### Sombras y Elevación

```css
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.15);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);
--shadow-xl: 0 12px 32px rgba(0, 0, 0, 0.25);
--shadow-2xl: 0 16px 48px rgba(0, 0, 0, 0.3);

/* Sombras de enfoque */
--shadow-focus-primary: 0 0 0 3px rgba(99, 102, 241, 0.3);
--shadow-focus-error: 0 0 0 3px rgba(239, 68, 68, 0.3);
--shadow-focus-success: 0 0 0 3px rgba(16, 185, 129, 0.3);
```

### Border Radius

```css
--radius-sm: 0.5rem;    /* 8px */
--radius-md: 0.75rem;   /* 12px */
--radius-lg: 1rem;      /* 16px */
--radius-xl: 1.5rem;    /* 24px */
--radius-2xl: 2rem;     /* 32px */
--radius-full: 9999px;  /* Completamente redondo */
```

### Transiciones

```css
--transition-instant: 100ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-fast: 200ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-normal: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 🔘 Sistema de Botones

### Variantes

#### Primary - Botón Principal
```html
<button class="btn-primary">Click Me</button>
<a href="#" class="btn-primary">Link Button</a>
```
- Color: Gradiente primary/secondary
- Uso: Acción principal de la página

#### Secondary - Botón Secundario
```html
<button class="btn-secondary">Secondary Action</button>
```
- Estilo: Glassmorphism con borde
- Uso: Acciones secundarias

#### Ghost/Tertiary - Botón Transparente
```html
<button class="btn-ghost">Subtle Action</button>
```
- Estilo: Transparente, mínimo
- Uso: Acciones terciarias o menús

#### Outline - Botón con Borde
```html
<button class="btn-outline">Outlined</button>
```
- Estilo: Borde de color primary
- Uso: Alternativa al secondary

#### Semánticos
```html
<button class="btn-success">Success</button>
<button class="btn-warning">Warning</button>
<button class="btn-error">Error</button>
<button class="btn-info">Info</button>
```

### Tamaños

```html
<button class="btn-primary btn-sm">Small</button>
<button class="btn-primary">Medium (default)</button>
<button class="btn-primary btn-lg">Large</button>
<button class="btn-primary btn-xl">Extra Large</button>
```

### Estados

#### Disabled
```html
<button class="btn-primary" disabled>Disabled</button>
<button class="btn-primary disabled">Also Disabled</button>
```

#### Loading
```html
<button class="btn-primary loading">Loading...</button>
<button class="btn-primary btn-loading">Processing</button>
```
- Muestra spinner automático
- Bloquea interacción

#### Con Iconos
```html
<button class="btn-primary">
  <i class="fas fa-download"></i>
  Download
</button>

<button class="btn-primary">
  Save
  <i class="fas fa-save"></i>
</button>
```

#### Solo Icono
```html
<button class="btn-primary btn-icon">
  <i class="fas fa-heart"></i>
</button>
```

### Modificadores

#### Full Width
```html
<button class="btn-primary btn-block">Full Width Button</button>
```

---

## 🃏 Sistema de Cards

### Card Base

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
    <span class="card-subtitle">Subtitle</span>
  </div>
  <div class="card-body">
    <p class="card-description">Card content goes here...</p>
  </div>
  <div class="card-footer">
    <button class="btn-primary">Action</button>
  </div>
</div>
```

### Variantes de Cards

#### Elevated Card
```html
<div class="card card-elevated">
  <!-- Más elevación y profundidad -->
</div>
```

#### Interactive Card
```html
<div class="card card-interactive">
  <!-- Cursor pointer, hover elevado -->
</div>
```

#### Bordered Accent Card
```html
<div class="card card-bordered">
  <!-- Barra superior con gradiente al hover -->
</div>
```

#### Gradient Border Card
```html
<div class="card card-gradient-border">
  <!-- Borde con gradiente -->
</div>
```

#### Glass Card
```html
<div class="card card-glass">
  <!-- Efecto glassmorphism acentuado -->
</div>
```

### Tamaños de Card

```html
<div class="card card-sm">Small Padding</div>
<div class="card card-md">Medium Padding</div>
<div class="card card-lg">Large Padding</div>
<div class="card card-xl">Extra Large Padding</div>
```

### Componentes de Card

#### Con Icono
```html
<div class="card">
  <div class="card-icon">
    <i class="fas fa-rocket"></i>
  </div>
  <h3 class="card-title">Card with Icon</h3>
  <p class="card-description">Description...</p>
</div>
```

#### Con Badge
```html
<div class="card">
  <span class="card-badge">New</span>
  <p class="card-description">Content...</p>
</div>
```

#### Con Imagen
```html
<div class="card">
  <img src="image.jpg" alt="..." class="card-image">
  <div class="card-body">
    <h3 class="card-title">Card with Image</h3>
  </div>
</div>
```

### Cards Especializados

#### Stat Card
```html
<div class="stat-card">
  <div class="stat-number">500+</div>
  <div class="stat-label">Projects</div>
</div>
```

#### Service Card
```html
<div class="service-card">
  <div class="service-icon">
    <i class="fas fa-video"></i>
  </div>
  <h3 class="service-title">Video Editing</h3>
  <p class="service-description">Professional video editing...</p>
  <ul class="service-features">
    <li><i class="fas fa-check"></i> Feature 1</li>
    <li><i class="fas fa-check"></i> Feature 2</li>
  </ul>
</div>
```

#### Product Card
```html
<div class="product-card">
  <img src="product.jpg" class="product-image">
  <div class="product-content">
    <h3 class="product-title">Product Name</h3>
    <p class="product-price">$299</p>
    <button class="btn-primary btn-block">Buy Now</button>
  </div>
</div>
```

---

## 📝 Sistema de Formularios

### Input Básico

```html
<div class="form-group">
  <label class="form-label">Email Address</label>
  <input type="email" class="form-input" placeholder="Enter email">
  <span class="form-help">We'll never share your email.</span>
</div>
```

### Input con Label Requerido

```html
<label class="form-label required">Username</label>
<input type="text" class="form-input" required>
```

### Tamaños de Input

```html
<input type="text" class="form-input input-sm" placeholder="Small">
<input type="text" class="form-input" placeholder="Medium (default)">
<input type="text" class="form-input input-lg" placeholder="Large">
```

### Estados de Validación

#### Success
```html
<div class="form-group">
  <input type="email" class="form-input success" value="user@example.com">
  <span class="form-success-message">
    <i class="fas fa-check-circle"></i>
    Email válido
  </span>
</div>
```

#### Error
```html
<div class="form-group">
  <input type="email" class="form-input error" value="invalid">
  <span class="form-error-message">
    <i class="fas fa-exclamation-circle"></i>
    Email inválido
  </span>
</div>
```

#### Warning
```html
<div class="form-group">
  <input type="text" class="form-input warning" value="admin">
  <span class="form-warning-message">
    <i class="fas fa-exclamation-triangle"></i>
    Username reservado
  </span>
</div>
```

### Input con Iconos

```html
<div class="input-group">
  <span class="input-group-icon left">
    <i class="fas fa-envelope"></i>
  </span>
  <input type="email" class="form-input input-icon-left" placeholder="Email">
</div>

<div class="input-group">
  <input type="password" class="form-input input-icon-right" placeholder="Password">
  <span class="input-group-icon right">
    <i class="fas fa-eye"></i>
  </span>
</div>
```

### Textarea

```html
<div class="form-group">
  <label class="form-label">Message</label>
  <textarea class="form-textarea" rows="5" placeholder="Your message..."></textarea>
</div>
```

### Select

```html
<div class="form-group">
  <label class="form-label">Country</label>
  <select class="form-select">
    <option>Choose...</option>
    <option>España</option>
    <option>México</option>
  </select>
</div>
```

### Checkbox y Radio

```html
<!-- Checkbox -->
<div class="form-check">
  <input type="checkbox" id="terms" class="form-checkbox">
  <label for="terms" class="form-check-label">
    Accept terms and conditions
  </label>
</div>

<!-- Radio -->
<div class="form-check">
  <input type="radio" id="option1" name="options" class="form-radio">
  <label for="option1" class="form-check-label">Option 1</label>
</div>
```

### Toggle Switch

```html
<div class="form-switch">
  <input type="checkbox" id="notifications">
  <label for="notifications">Enable notifications</label>
</div>
```

### Search Input

```html
<div class="form-search">
  <input type="search" class="form-input" placeholder="Search...">
</div>
```

### File Input

```html
<div class="form-file">
  <input type="file" id="file-upload">
  <label for="file-upload" class="form-file-label">
    <i class="fas fa-upload"></i>
    Choose File
  </label>
</div>
```

### Estados de Input

```html
<!-- Disabled -->
<input type="text" class="form-input" disabled placeholder="Disabled">

<!-- Readonly -->
<input type="text" class="form-input" readonly value="Read only">
```

---

## ✨ Mejores Prácticas

### 1. Usa Tokens de Diseño

❌ **Evita:**
```css
.my-element {
  padding: 20px;
  color: #6366f1;
  border-radius: 8px;
}
```

✅ **Correcto:**
```css
.my-element {
  padding: var(--spacing-5);
  color: var(--color-primary);
  border-radius: var(--radius-sm);
}
```

### 2. Combina Clases

```html
<!-- Combina variantes -->
<button class="btn-primary btn-lg btn-block">
  Full Width Large Primary
</button>

<div class="card card-interactive card-bordered card-lg">
  Combined card styles
</div>
```

### 3. Accesibilidad

```html
<!-- Siempre usa labels -->
<label for="email" class="form-label">Email</label>
<input type="email" id="email" class="form-input">

<!-- ARIA cuando sea necesario -->
<button class="btn-primary" aria-label="Close dialog">
  <i class="fas fa-times"></i>
</button>

<!-- Estados disabled apropiados -->
<button class="btn-primary" disabled>Can't click</button>
```

### 4. Estados Visuales

Todos los elementos interactivos tienen:
- `:hover` - Feedback al pasar el mouse
- `:focus` - Ring visible al usar teclado
- `:active` - Feedback al hacer click
- `:disabled` - Estado deshabilitado claro

### 5. Responsive

Usa clases del sistema de diseño que ya son responsive:

```html
<!-- Los botones se adaptan automáticamente -->
<button class="btn-primary btn-block">
  Mobile: full width, Desktop: auto
</button>
```

---

## 🎨 Personalización

### Cambiar Colores del Tema

Modifica las variables en `:root`:

```css
:root {
  --color-primary-500: #your-color;
  --color-secondary-500: #your-color;
}
```

### Modo Claro

Las variables cambian automáticamente con:

```html
<body class="light-mode">
```

---

## 📦 Componentes Disponibles

- ✅ Botones (8 variantes, 4 tamaños, todos los estados)
- ✅ Cards (6 variantes, 4 tamaños, múltiples componentes)
- ✅ Formularios (todos los tipos de input, validación)
- ✅ Tipografía (escala completa, pesos, alturas de línea)
- ✅ Iconos (sistema de tamaños consistente)
- ✅ Sombras (6 niveles de elevación)
- ✅ Espaciado (sistema basado en 4px)
- ✅ Colores (paleta completa con variantes)

---

## 🚀 Próximos Pasos

Para mejorar aún más el diseño:

1. **Componentes Adicionales**: Modals, Dropdowns, Tooltips, Badges
2. **Animaciones**: Sistema de micro-interacciones
3. **Grid System**: Sistema de layout más robusto
4. **Utilities**: Clases utility para spacing, display, flex
5. **Themes**: Múltiples temas predefinidos

---

**Creado con ❤️ para Portfolio Nacho**
*Sistema de Diseño v2.0 - 2025*
