# IMPLEMENTACIÓN DE FEATURES AVANZADAS - FRONTEND

## ARCHIVOS CREADOS (BACKEND) ✅

Todos los archivos del backend ya están creados y funcionando:

### 1. `utils/templates.js` ✅
- 10 templates profesionales pre-configurados
- Sistema completo de selección de templates
- Optimización de prompts por tipo de video

### 2. `utils/timestampGenerator.js` ✅
- Generación automática de timestamps
- Detección inteligente de secciones
- Múltiples formatos de exportación

### 3. `utils/seoGenerator.js` ✅
- Generación de títulos optimizados (8 variantes)
- Descripciones SEO (3 longitudes diferentes)
- Keywords, hashtags y tags
- Clickbait score

### 4. `utils/readabilityAnalyzer.js` ✅
- Flesch Reading Ease
- Detección de oraciones largas
- Análisis de palabras complejas
- Score global de legibilidad

### 5. `utils/exportFormats.js` ✅
- Exportación a PDF, SRT, Markdown, HTML, TXT, DOCX, JSON
- Formateo profesional para cada tipo

### 6. `utils/generadorGuion.js` ✅ MEJORADO
Nuevas secciones agregadas:
- HOOKS Y RETENCIÓN (técnicas para mantener audiencia)
- SUGERENCIAS DE B-ROLL (qué mostrar visualmente)
- MÚSICA Y SONIDO (guía de diseño sonoro)

### 7. `server.js` ✅ ACTUALIZADO
Nuevos endpoints:
- `GET /api/templates` - Obtener templates
- `GET /api/templates/:id` - Template específico
- `POST /api/generar-timestamps` - Generar timestamps
- `POST /api/generar-seo` - Generar elementos SEO
- `POST /api/analizar-legibilidad` - Analizar legibilidad
- `POST /api/export` - Exportar guion
- `GET /api/export/formatos` - Formatos disponibles

---

## IMPLEMENTACIÓN DEL FRONTEND (PENDIENTE)

Para completar la implementación, necesitas actualizar los siguientes archivos frontend:

### A. `public/index.html`

#### 1. Agregar nuevas TABS en la navegación:

Reemplaza la sección de tabs existente con:

```html
<div class="tabs">
    <button class="tab-button active" data-tab="generar">
        📝 Generar Guion
    </button>
    <button class="tab-button" data-tab="templates">
        🎯 Templates
    </button>
    <button class="tab-button" data-tab="seo">
        🔍 Herramientas SEO
    </button>
    <button class="tab-button" data-tab="analisis">
        📊 Análisis
    </button>
    <button class="tab-button" data-tab="whisper">
        🎙️ Transcribir
    </button>
    <button class="tab-button" data-tab="investigar">
        🔬 Investigar Tema
    </button>
</div>
```

#### 2. Agregar TAB DE TEMPLATES:

Después del tab "generar", agrega:

```html
<!-- Tab: Templates -->
<div class="tab-content" id="tab-templates">
    <div class="form-card">
        <h2>🎯 Selecciona un Template</h2>
        <p>Usa plantillas prediseñadas para diferentes tipos de videos</p>

        <div id="templates-grid" class="templates-grid">
            <!-- Los templates se cargarán dinámicamente desde JS -->
        </div>

        <div id="template-details" class="template-details" style="display: none;">
            <h3>Detalles del Template</h3>
            <div id="template-info"></div>
            <button class="btn btn-primary" id="useTemplateBtn">
                Usar este Template
            </button>
        </div>
    </div>
</div>
```

#### 3. Agregar TAB DE HERRAMIENTAS SEO:

```html
<!-- Tab: Herramientas SEO -->
<div class="tab-content" id="tab-seo">
    <div class="form-card">
        <h2>🎯 Optimización SEO para YouTube</h2>

        <div class="info-box">
            Para usar estas herramientas, primero genera o pega un guion
        </div>

        <div class="form-group">
            <label for="guionParaSEO">Guion (requerido)</label>
            <textarea
                id="guionParaSEO"
                rows="6"
                placeholder="Pega aquí el guion para optimizar..."
            ></textarea>
        </div>

        <div class="form-row">
            <div class="form-group">
                <label for="temaSEO">Tema del Video</label>
                <input type="text" id="temaSEO" placeholder="Ej: Inteligencia Artificial">
            </div>
            <div class="form-group">
                <label for="nichoSEO">Nicho</label>
                <select id="nichoSEO">
                    <option value="general">General</option>
                    <option value="tecnologia">Tecnología</option>
                    <option value="educacion">Educación</option>
                    <option value="negocios">Negocios</option>
                    <option value="entretenimiento">Entretenimiento</option>
                </select>
            </div>
        </div>

        <div class="seo-tools-buttons">
            <button class="btn btn-primary" id="generarTimestampsBtn">
                ⏱️ Generar Timestamps
            </button>
            <button class="btn btn-primary" id="generarSEOBtn">
                🎯 Generar SEO Completo
            </button>
        </div>
    </div>
</div>
```

#### 4. Agregar TAB DE ANÁLISIS:

```html
<!-- Tab: Análisis -->
<div class="tab-content" id="tab-analisis">
    <div class="form-card">
        <h2>📊 Análisis de Legibilidad</h2>

        <div class="info-box">
            Analiza qué tan fácil es de leer tu guion
        </div>

        <div class="form-group">
            <label for="guionParaAnalisis">Guion a Analizar</label>
            <textarea
                id="guionParaAnalisis"
                rows="8"
                placeholder="Pega aquí el guion a analizar..."
            ></textarea>
        </div>

        <button class="btn btn-primary" id="analizarBtn">
            📊 Analizar Legibilidad
        </button>
    </div>
</div>
```

#### 5. Agregar SELECTOR DE TEMPLATES en tab generar:

Agrega ANTES del botón "Generar Guion":

```html
<div class="form-group">
    <label for="templateSelector">Template (opcional)</label>
    <select id="templateSelector">
        <option value="">Sin template - Guion genérico</option>
        <!-- Se llenarán dinámicamente -->
    </select>
    <small>Los templates optimizan el guion para tipos específicos de videos</small>
</div>
```

#### 6. Agregar BOTONES DE HERRAMIENTAS en la sección de resultados:

Después de los botones "Copiar", "Descargar", "Limpiar", agrega:

```html
<div class="results-tools">
    <h3>🛠️ Herramientas</h3>
    <button class="btn btn-small" id="btnTimestamps">⏱️ Timestamps</button>
    <button class="btn btn-small" id="btnSEO">🎯 SEO</button>
    <button class="btn btn-small" id="btnLegibilidad">📊 Legibilidad</button>
    <button class="btn btn-small" id="btnExport">💾 Exportar</button>
</div>
```

#### 7. Agregar MODAL para mostrar resultados:

Al final del body, antes de los scripts:

```html
<!-- Modal para resultados de herramientas -->
<div class="modal" id="toolModal" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h2 id="modalTitle">Resultado</h2>
            <button class="modal-close" id="modalClose">✕</button>
        </div>
        <div class="modal-body" id="modalBody">
            <!-- Contenido dinámico -->
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" id="modalCopyBtn">📋 Copiar</button>
            <button class="btn btn-primary" id="modalCloseBtn">Cerrar</button>
        </div>
    </div>
</div>
```

---

### B. `public/js/app.js`

Agrega las siguientes funciones:

#### 1. Al inicio del archivo (después de las variables globales):

```javascript
// Estado adicional para nuevas features
let templatesDisponibles = [];
let templateSeleccionado = null;
let ultimoResultadoHerramienta = '';
```

#### 2. En la función `document.addEventListener('DOMContentLoaded')`, agrega:

```javascript
// Cargar templates al iniciar
cargarTemplates();

// Inicializar nuevos event listeners
inicializarNuevosEventos();
```

#### 3. Agregar nueva función para cargar templates:

```javascript
/**
 * Carga templates disponibles del servidor
 */
async function cargarTemplates() {
    try {
        const response = await fetch('/api/templates');
        const data = await response.json();

        if (data.success) {
            templatesDisponibles = data.templates;
            poblarSelectorTemplates();
            mostrarGridTemplates();
        }
    } catch (error) {
        console.error('Error cargando templates:', error);
    }
}

/**
 * Pobla el selector de templates en tab generar
 */
function poblarSelectorTemplates() {
    const selector = document.getElementById('templateSelector');
    if (!selector) return;

    templatesDisponibles.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = `${template.icono} ${template.nombre}`;
        selector.appendChild(option);
    });
}

/**
 * Muestra grid de templates en la tab templates
 */
function mostrarGridTemplates() {
    const grid = document.getElementById('templates-grid');
    if (!grid) return;

    grid.innerHTML = '';

    templatesDisponibles.forEach(template => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `
            <div class="template-icon">${template.icono}</div>
            <h3>${template.nombre}</h3>
            <p>${template.descripcion}</p>
            <div class="template-meta">
                <span>⏱️ ${template.duracionRecomendada} min</span>
                <span>🎨 ${template.tono}</span>
            </div>
        `;
        card.onclick = () => seleccionarTemplate(template);
        grid.appendChild(card);
    });
}

/**
 * Selecciona un template
 */
function seleccionarTemplate(template) {
    templateSeleccionado = template;

    // Mostrar detalles
    const detailsDiv = document.getElementById('template-details');
    const infoDiv = document.getElementById('template-info');

    infoDiv.innerHTML = `
        <h4>${template.icono} ${template.nombre}</h4>
        <p><strong>Descripción:</strong> ${template.descripcion}</p>
        <p><strong>Tono:</strong> ${template.tono}</p>
        <p><strong>Duración recomendada:</strong> ${template.duracionRecomendada} minutos</p>
        <p><strong>Secciones incluidas:</strong></p>
        <ul>
            ${template.estructura.secciones.map(s => `<li>${s}</li>`).join('')}
        </ul>
    `;

    detailsDiv.style.display = 'block';
}
```

#### 4. Agregar funciones para las nuevas herramientas:

```javascript
/**
 * Genera timestamps del guion
 */
async function generarTimestampsDeGuion() {
    const guion = document.getElementById('guionParaSEO').value.trim() || currentResult;

    if (!guion) {
        alert('Por favor ingresa o genera un guion primero');
        return;
    }

    showLoading('Generando timestamps...');

    try {
        const response = await fetch('/api/generar-timestamps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guion })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || 'Error al generar timestamps');
        }

        ultimoResultadoHerramienta = data.formatoYouTube;
        mostrarModal('⏱️ Timestamps Generados', data.formatoYouTube);

    } catch (error) {
        hideLoading();
        alert(`Error: ${error.message}`);
    }
}

/**
 * Genera elementos SEO completos
 */
async function generarSEOCompleto() {
    const guion = document.getElementById('guionParaSEO').value.trim() || currentResult;
    const tema = document.getElementById('temaSEO').value.trim();
    const nicho = document.getElementById('nichoSEO').value;

    if (!guion || !tema) {
        alert('Por favor ingresa el guion y el tema');
        return;
    }

    showLoading('Generando elementos SEO...');

    try {
        const response = await fetch('/api/generar-seo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guion, tema, nicho })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || 'Error al generar SEO');
        }

        ultimoResultadoHerramienta = data.textoFormateado;
        mostrarModal('🎯 Optimización SEO Completa', data.textoFormateado);

    } catch (error) {
        hideLoading();
        alert(`Error: ${error.message}`);
    }
}

/**
 * Analiza legibilidad del guion
 */
async function analizarLegibilidadGuion() {
    const guion = document.getElementById('guionParaAnalisis').value.trim() || currentResult;

    if (!guion) {
        alert('Por favor ingresa o genera un guion primero');
        return;
    }

    showLoading('Analizando legibilidad...');

    try {
        const response = await fetch('/api/analizar-legibilidad', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ guion })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || 'Error al analizar');
        }

        ultimoResultadoHerramienta = data.textoFormateado;
        mostrarModal('📊 Análisis de Legibilidad', data.textoFormateado);

    } catch (error) {
        hideLoading();
        alert(`Error: ${error.message}`);
    }
}

/**
 * Muestra modal con resultado
 */
function mostrarModal(titulo, contenido) {
    hideLoading();

    document.getElementById('modalTitle').textContent = titulo;
    document.getElementById('modalBody').innerHTML = `<pre>${contenido}</pre>`;
    document.getElementById('toolModal').style.display = 'flex';
}

/**
 * Cierra modal
 */
function cerrarModal() {
    document.getElementById('toolModal').style.display = 'none';
}

/**
 * Copia contenido del modal
 */
function copiarModal() {
    navigator.clipboard.writeText(ultimoResultadoHerramienta).then(() => {
        const btn = document.getElementById('modalCopyBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Copiado!';
        setTimeout(() => { btn.textContent = originalText; }, 2000);
    });
}
```

#### 5. Agregar inicialización de eventos:

```javascript
/**
 * Inicializa eventos para nuevas features
 */
function inicializarNuevosEventos() {
    // Templates
    const useTemplateBtn = document.getElementById('useTemplateBtn');
    if (useTemplateBtn) {
        useTemplateBtn.addEventListener('click', () => {
            if (templateSeleccionado) {
                // Cambiar a tab generar y aplicar template
                document.querySelector('[data-tab="generar"]').click();
                document.getElementById('templateSelector').value = templateSeleccionado.id;
                document.getElementById('tono').value = templateSeleccionado.tono;
                document.getElementById('duracion').value = templateSeleccionado.duracionRecomendada;
            }
        });
    }

    // SEO Tools
    const btnTimestamps = document.getElementById('generarTimestampsBtn');
    if (btnTimestamps) btnTimestamps.addEventListener('click', generarTimestampsDeGuion);

    const btnSEO = document.getElementById('generarSEOBtn');
    if (btnSEO) btnSEO.addEventListener('click', generarSEOCompleto);

    // Análisis
    const btnAnalizar = document.getElementById('analizarBtn');
    if (btnAnalizar) btnAnalizar.addEventListener('click', analizarLegibilidadGuion);

    // Modal
    const modalClose = document.getElementById('modalClose');
    if (modalClose) modalClose.addEventListener('click', cerrarModal);

    const modalCloseBtn = document.getElementById('modalCloseBtn');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', cerrarModal);

    const modalCopyBtn = document.getElementById('modalCopyBtn');
    if (modalCopyBtn) modalCopyBtn.addEventListener('click', copiarModal);

    // Botones rápidos en resultados
    const btnTimestampsQuick = document.getElementById('btnTimestamps');
    if (btnTimestampsQuick) {
        btnTimestampsQuick.addEventListener('click', () => {
            document.getElementById('guionParaSEO').value = currentResult;
            document.querySelector('[data-tab="seo"]').click();
        });
    }

    const btnSEOQuick = document.getElementById('btnSEO');
    if (btnSEOQuick) {
        btnSEOQuick.addEventListener('click', () => {
            document.getElementById('guionParaSEO').value = currentResult;
            document.getElementById('temaSEO').value = document.getElementById('tema').value;
            document.querySelector('[data-tab="seo"]').click();
        });
    }

    const btnLegibilidad = document.getElementById('btnLegibilidad');
    if (btnLegibilidad) {
        btnLegibilidad.addEventListener('click', () => {
            document.getElementById('guionParaAnalisis').value = currentResult;
            document.querySelector('[data-tab="analisis"]').click();
        });
    }
}
```

---

### C. `public/css/styles.css`

Agrega estos estilos:

```css
/* Templates Grid */
.templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 20px;
    margin: 20px 0;
}

.template-card {
    border: 2px solid #e0e0e0;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
}

.template-card:hover {
    border-color: #4CAF50;
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.template-icon {
    font-size: 3em;
    margin-bottom: 10px;
}

.template-meta {
    display: flex;
    justify-content: space-around;
    margin-top: 15px;
    font-size: 0.85em;
    color: #666;
}

.template-details {
    margin-top: 30px;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 8px;
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    z-index: 1000;
    justify-content: center;
    align-items: center;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 900px;
    width: 90%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
}

.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #999;
}

.modal-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
}

.modal-body pre {
    white-space: pre-wrap;
    word-wrap: break-word;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
    line-height: 1.6;
}

.modal-footer {
    padding: 20px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

/* SEO Tools */
.seo-tools-buttons {
    display: flex;
    gap: 15px;
    margin-top: 20px;
}

.results-tools {
    margin-top: 20px;
    padding: 15px;
    background: #f5f5f5;
    border-radius: 8px;
}

.results-tools h3 {
    margin-bottom: 10px;
    font-size: 1.1em;
}
```

---

## RESUMEN FINAL

### ✅ Backend Completado:
1. Todos los módulos de utilidades creados
2. Todos los endpoints API funcionando
3. Sistema de templates, SEO, timestamps, legibilidad y export listos

### ⏳ Frontend Pendiente:
1. Actualizar `public/index.html` con nuevas tabs y elementos
2. Actualizar `public/js/app.js` con funciones de herramientas
3. Actualizar `public/css/styles.css` con estilos

### 🚀 Próximos Pasos:
1. Aplica los cambios del frontend según esta documentación
2. Prueba cada funcionalidad
3. Ajusta estilos según tu preferencia
4. Considera agregar más templates personalizados

## TESTING

Para probar cada feature:

1. **Templates**: Ve a la tab Templates y selecciona uno
2. **Timestamps**: Genera un guion y usa el botón "Timestamps"
3. **SEO**: Ve a tab SEO, pega un guion y genera SEO
4. **Legibilidad**: Analiza cualquier guion en la tab Análisis
5. **Export**: Usa `/api/export` con Postman o desde el frontend

---

**Nota**: Este documento contiene TODA la información necesaria para completar la implementación. Los archivos backend ya están listos y funcionando.
