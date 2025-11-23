/**
 * ============================================
 * GENERADOR DE GUIONES CON IA - FRONTEND
 * Versión mejorada con modo oscuro, historial,
 * streaming, editor inline y más
 * ============================================
 */

// ============================================
// ESTADO DE LA APLICACIÓN
// ============================================
let currentTranscription = '';
let currentResult = '';
let isEditing = false;
let eventSource = null;

// ============================================
// ELEMENTOS DEL DOM
// ============================================
const elements = {
    // Header
    themeToggle: document.getElementById('themeToggle'),
    providerStatus: document.getElementById('providerStatus'),

    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    loadingText: document.getElementById('loadingText'),

    // Results
    resultsSection: document.getElementById('resultsSection'),
    resultContent: document.getElementById('resultContent'),
    statsBar: document.getElementById('statsBar'),

    // Progress
    progressContainer: document.getElementById('progressContainer'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),

    // Editor
    editarBtn: document.getElementById('editarBtn'),
    guardarEdicionBtn: document.getElementById('guardarEdicionBtn'),
    editorToolbar: document.getElementById('editorToolbar'),
    saveIndicator: document.getElementById('saveIndicator'),

    // Historial
    historialContainer: document.getElementById('historialContainer'),
    buscarHistorial: document.getElementById('buscarHistorial'),
    limpiarHistorialBtn: document.getElementById('limpiarHistorialBtn'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    initializeTabs();
    initializeButtons();
    initializeKeyboardShortcuts();
    checkServerHealth();
    loadHistorial();
});

// ============================================
// TEMA OSCURO
// ============================================
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    elements.themeToggle.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    showToast(
        `Tema ${newTheme === 'dark' ? 'oscuro' : 'claro'} activado`,
        'success'
    );
}

// ============================================
// SISTEMA DE TABS
// ============================================
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            // Remover active de todos
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Activar el seleccionado
            button.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');

            // Si cambiamos al tab de historial, recargarlo
            if (tabName === 'historial') {
                loadHistorial();
            }
        });
    });
}

// ============================================
// BOTONES
// ============================================
function initializeButtons() {
    // Generar guion
    document.getElementById('generarBtn').addEventListener('click', generarGuion);

    // Transcribir
    document.getElementById('transcribirBtn').addEventListener('click', procesarTranscripcion);

    // Convertir a guion
    document.getElementById('convertirGuionBtn').addEventListener('click', convertirAGuion);

    // Investigar
    document.getElementById('investigarBtn').addEventListener('click', investigarTema);

    // Acciones de resultados
    document.getElementById('copiarBtn').addEventListener('click', copiarResultado);
    document.getElementById('descargarBtn').addEventListener('click', descargarResultado);
    document.getElementById('limpiarBtn').addEventListener('click', limpiarResultados);

    // Editor
    elements.editarBtn.addEventListener('click', toggleEditMode);
    elements.guardarEdicionBtn.addEventListener('click', saveEdition);

    // Editor toolbar
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const command = btn.getAttribute('data-command');
            document.execCommand(command, false, null);
        });
    });

    // Historial
    elements.buscarHistorial.addEventListener('input', filterHistorial);
    elements.limpiarHistorialBtn.addEventListener('click', clearAllHistorial);
}

// ============================================
// ATAJOS DE TECLADO
// ============================================
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+Enter: Generar guion
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab && activeTab.id === 'tab-generar') {
                generarGuion();
            }
        }
    });

    // Auto-guardado en edición
    elements.resultContent.addEventListener('input', debounce(() => {
        if (isEditing) {
            autoSaveEdit();
        }
    }, 1000));
}

// ============================================
// VERIFICAR ESTADO DEL SERVIDOR
// ============================================
async function checkServerHealth() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();

        let statusHTML = '<span class="status-indicator online">✓ Online</span>';

        if (data.providers.groq) {
            statusHTML += ' <span style="margin-left: 10px;">Groq: ✅</span>';
        }
        if (data.providers.ollama) {
            statusHTML += ' <span style="margin-left: 10px;">Ollama: ✅</span>';
        }

        elements.providerStatus.innerHTML = '<span class="status-label">Estado:</span> ' + statusHTML;
    } catch (error) {
        elements.providerStatus.innerHTML = '<span class="status-label">Estado:</span> <span class="status-indicator offline">✗ Offline</span>';
        console.error('Error checking health:', error);
    }
}

// ============================================
// GENERAR GUION CON STREAMING
// ============================================
async function generarGuion() {
    const tema = document.getElementById('tema').value.trim();
    const nicho = document.getElementById('nicho').value;
    const duracion = parseInt(document.getElementById('duracion').value);
    const tono = document.getElementById('tono').value;
    const incluirIntro = document.getElementById('incluirIntro').checked;
    const incluirOutro = document.getElementById('incluirOutro').checked;
    const provider = document.getElementById('provider').value;

    if (!tema) {
        showToast('Por favor ingresa un tema para el video', 'warning');
        return;
    }

    // Intentar streaming primero
    const supportsSSE = typeof EventSource !== 'undefined';

    if (supportsSSE) {
        await generarGuionStreaming(tema, nicho, duracion, tono, incluirIntro, incluirOutro, provider);
    } else {
        await generarGuionTradicional(tema, nicho, duracion, tono, incluirIntro, incluirOutro, provider);
    }
}

async function generarGuionStreaming(tema, nicho, duracion, tono, incluirIntro, incluirOutro, provider) {
    showLoading(`Generando guion sobre "${tema}"...`);
    showProgress();

    let acumulado = '';
    let palabrasAcumuladas = 0;

    // Mostrar sección de resultados inmediatamente
    elements.resultsSection.style.display = 'block';
    elements.resultContent.textContent = '';

    const params = new URLSearchParams({
        tema,
        nicho,
        duracion: duracion.toString(),
        tono,
        incluirIntro: incluirIntro.toString(),
        incluirOutro: incluirOutro.toString(),
        provider
    });

    eventSource = new EventSource(`/api/generar-guion-stream?${params}`);

    eventSource.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);

            if (data.done) {
                // Completado
                eventSource.close();
                hideLoading();
                hideProgress();
                currentResult = acumulado;

                // Guardar en historial
                saveToHistorial(tema, acumulado);

                showToast('¡Guion generado exitosamente!', 'success');
                updateStats(acumulado);

            } else if (data.chunk) {
                // Nuevo chunk de texto
                acumulado += data.chunk;
                palabrasAcumuladas = contarPalabras(acumulado);

                // Actualizar UI con efecto typewriter
                elements.resultContent.textContent = acumulado;

                // Actualizar stats en tiempo real
                document.getElementById('palabrasCount').textContent = palabrasAcumuladas.toLocaleString();
                document.getElementById('caracteresCount').textContent = acumulado.length.toLocaleString();

                // Actualizar progreso estimado (basado en palabras esperadas)
                const palabrasEsperadas = duracion * 250; // 250 palabras por minuto
                const progreso = Math.min((palabrasAcumuladas / palabrasEsperadas) * 100, 95);
                updateProgress(progreso);

                // Scroll al final
                elements.resultContent.scrollTop = elements.resultContent.scrollHeight;
            }

        } catch (error) {
            console.error('Error procesando stream:', error);
        }
    };

    eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        eventSource.close();

        // Fallback a método tradicional
        showToast('Streaming no disponible, usando método tradicional...', 'warning');
        generarGuionTradicional(tema, nicho, duracion, tono, incluirIntro, incluirOutro, provider);
    };
}

async function generarGuionTradicional(tema, nicho, duracion, tono, incluirIntro, incluirOutro, provider) {
    showLoading(`Generando guion sobre "${tema}"...`);

    try {
        const response = await fetch('/api/generar-guion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tema,
                nicho,
                duracion,
                tono,
                incluirIntro,
                incluirOutro,
                provider
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || data.error || 'Error al generar el guion');
        }

        currentResult = data.guion;
        mostrarResultado(data.guion, data.palabras, data.caracteres);

        // Guardar en historial
        saveToHistorial(tema, data.guion);

        showToast('¡Guion generado exitosamente!', 'success');

    } catch (error) {
        hideLoading();
        showToast(`Error: ${error.message}`, 'error');
        console.error('Error:', error);
    }
}

// ============================================
// PROGRESO
// ============================================
function showProgress() {
    elements.progressContainer.style.display = 'block';
    updateProgress(0);
}

function hideProgress() {
    setTimeout(() => {
        elements.progressContainer.style.display = 'none';
    }, 500);
}

function updateProgress(percent) {
    elements.progressFill.style.width = `${percent}%`;
    elements.progressText.textContent = `Generando... ${Math.round(percent)}%`;
}

// ============================================
// HISTORIAL
// ============================================
function saveToHistorial(tema, contenido) {
    const historial = getHistorial();

    const preview = contenido.substring(0, 200).trim() + '...';
    const palabras = contarPalabras(contenido);

    const item = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        tema,
        contenido,
        preview,
        palabras,
        caracteres: contenido.length
    };

    // Agregar al inicio y limitar a 10
    historial.unshift(item);
    if (historial.length > 10) {
        historial.pop();
    }

    localStorage.setItem('guiones_historial', JSON.stringify(historial));
}

function getHistorial() {
    try {
        return JSON.parse(localStorage.getItem('guiones_historial') || '[]');
    } catch {
        return [];
    }
}

function loadHistorial(filter = '') {
    const historial = getHistorial();
    const container = elements.historialContainer;

    if (historial.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <h3>No hay guiones guardados</h3>
                <p>Los guiones que generes se guardarán automáticamente aquí</p>
            </div>
        `;
        return;
    }

    const filteredHistorial = filter
        ? historial.filter(item =>
            item.tema.toLowerCase().includes(filter.toLowerCase()) ||
            item.contenido.toLowerCase().includes(filter.toLowerCase())
          )
        : historial;

    if (filteredHistorial.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No se encontraron resultados</h3>
                <p>Intenta con otra búsqueda</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredHistorial.map(item => {
        const fecha = new Date(item.fecha);
        const fechaFormateada = fecha.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="historial-item">
                <div class="historial-item-header">
                    <div>
                        <div class="historial-item-title">${escapeHtml(item.tema)}</div>
                        <div class="historial-item-date">${fechaFormateada}</div>
                    </div>
                </div>
                <div class="historial-item-preview">${escapeHtml(item.preview)}</div>
                <div class="historial-item-stats">
                    <span class="historial-stat">
                        📊 <strong>${item.palabras.toLocaleString()}</strong> palabras
                    </span>
                    <span class="historial-stat">
                        📝 <strong>${item.caracteres.toLocaleString()}</strong> caracteres
                    </span>
                    <span class="historial-stat">
                        ⏱️ <strong>~${Math.ceil(item.palabras / 250)}</strong> min
                    </span>
                </div>
                <div class="historial-item-actions">
                    <button class="btn btn-small btn-primary" onclick="verHistorialItem(${item.id})">
                        👁️ Ver
                    </button>
                    <button class="btn btn-small" onclick="reuseHistorialItem(${item.id})">
                        🔄 Re-usar
                    </button>
                    <button class="btn btn-small btn-danger" onclick="deleteHistorialItem(${item.id})">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function filterHistorial() {
    const filter = elements.buscarHistorial.value;
    loadHistorial(filter);
}

function clearAllHistorial() {
    if (confirm('¿Estás seguro de eliminar todo el historial?')) {
        localStorage.removeItem('guiones_historial');
        loadHistorial();
        showToast('Historial eliminado', 'success');
    }
}

// Funciones globales para el historial (llamadas desde HTML inline)
window.verHistorialItem = (id) => {
    const historial = getHistorial();
    const item = historial.find(h => h.id === id);
    if (item) {
        currentResult = item.contenido;
        mostrarResultado(item.contenido, item.palabras, item.caracteres);

        // Cambiar a tab de generar para ver resultado
        document.querySelector('[data-tab="generar"]').click();

        // Scroll al resultado
        setTimeout(() => {
            elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
    }
};

window.reuseHistorialItem = (id) => {
    const historial = getHistorial();
    const item = historial.find(h => h.id === id);
    if (item) {
        document.getElementById('tema').value = item.tema;

        // Cambiar a tab de generar
        document.querySelector('[data-tab="generar"]').click();

        showToast('Tema cargado, puedes modificar y regenerar', 'success');
    }
};

window.deleteHistorialItem = (id) => {
    const historial = getHistorial();
    const filtered = historial.filter(h => h.id !== id);
    localStorage.setItem('guiones_historial', JSON.stringify(filtered));
    loadHistorial();
    showToast('Guion eliminado del historial', 'success');
};

// ============================================
// EDITOR INLINE
// ============================================
function toggleEditMode() {
    isEditing = !isEditing;

    if (isEditing) {
        // Activar modo edición
        elements.resultContent.setAttribute('contenteditable', 'true');
        elements.resultContent.focus();
        elements.editorToolbar.style.display = 'flex';
        elements.editarBtn.style.display = 'none';
        elements.guardarEdicionBtn.style.display = 'inline-flex';
        elements.saveIndicator.style.display = 'flex';

        showToast('Modo edición activado', 'success');
    } else {
        // Desactivar modo edición
        elements.resultContent.setAttribute('contenteditable', 'false');
        elements.editorToolbar.style.display = 'none';
        elements.editarBtn.style.display = 'inline-flex';
        elements.guardarEdicionBtn.style.display = 'none';

        saveEdition();
    }
}

function saveEdition() {
    const editedContent = elements.resultContent.textContent;
    currentResult = editedContent;

    // Actualizar stats
    updateStats(editedContent);

    // Guardar en localStorage temporal
    localStorage.setItem('last_edited_content', editedContent);

    // Mostrar indicador
    const indicator = elements.saveIndicator.querySelector('.stat-value');
    indicator.textContent = 'Guardado ✓';
    indicator.classList.remove('saving');

    if (isEditing) {
        showToast('Cambios guardados', 'success');
    } else {
        isEditing = false;
        elements.resultContent.setAttribute('contenteditable', 'false');
        elements.editorToolbar.style.display = 'none';
        elements.editarBtn.style.display = 'inline-flex';
        elements.guardarEdicionBtn.style.display = 'none';
    }
}

function autoSaveEdit() {
    const indicator = elements.saveIndicator.querySelector('.stat-value');
    indicator.textContent = 'Guardando...';
    indicator.classList.add('saving');

    // Simular guardado
    setTimeout(() => {
        saveEdition();
    }, 500);
}

// ============================================
// PROCESAR TRANSCRIPCIÓN
// ============================================
async function procesarTranscripcion() {
    const audioUrl = document.getElementById('audioUrl').value.trim();
    const transcripcionManual = document.getElementById('transcripcionManual').value.trim();

    if (!audioUrl && !transcripcionManual) {
        showToast('Por favor proporciona una URL de audio o pega una transcripción', 'warning');
        return;
    }

    // Si hay transcripción manual, usarla directamente
    if (transcripcionManual) {
        currentTranscription = transcripcionManual;
        mostrarResultado(transcripcionManual, contarPalabras(transcripcionManual), transcripcionManual.length);
        document.getElementById('convertirGuionBtn').style.display = 'block';
        showToast('Transcripción cargada', 'success');
        return;
    }

    // Si hay URL, intentar transcribir
    showLoading('Transcribiendo audio con Whisper...');

    try {
        const response = await fetch('/api/transcribir-audio', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ audioUrl })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || data.error || 'Error al transcribir');
        }

        currentTranscription = data.transcripcion;
        mostrarResultado(data.transcripcion, data.palabras, data.transcripcion.length);
        document.getElementById('convertirGuionBtn').style.display = 'block';
        showToast('Audio transcrito exitosamente', 'success');

    } catch (error) {
        hideLoading();
        showToast(`Error: ${error.message}`, 'error');
        console.error('Error:', error);
    }
}

// ============================================
// CONVERTIR A GUION
// ============================================
async function convertirAGuion() {
    if (!currentTranscription) {
        showToast('No hay transcripción para convertir', 'warning');
        return;
    }

    const tema = document.getElementById('temaTranscripcion').value.trim() || 'Tema general';
    const provider = document.getElementById('provider').value;

    showLoading('Convirtiendo transcripción a guion profesional...');

    try {
        const response = await fetch('/api/expandir-guion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                guionActual: currentTranscription,
                seccionesAExpandir: [],
                provider
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || data.error || 'Error al convertir');
        }

        currentResult = data.guion;
        mostrarResultado(data.guion, data.palabras, data.guion.length);
        showToast('Transcripción convertida a guion', 'success');

    } catch (error) {
        hideLoading();
        showToast(`Error: ${error.message}`, 'error');
        console.error('Error:', error);
    }
}

// ============================================
// INVESTIGAR TEMA
// ============================================
async function investigarTema() {
    const tema = document.getElementById('temaInvestigar').value.trim();
    const cantidad = parseInt(document.getElementById('cantidadSubtemas').value);

    if (!tema) {
        showToast('Por favor ingresa un tema para investigar', 'warning');
        return;
    }

    showLoading(`Investigando "${tema}"...`);

    try {
        const response = await fetch('/api/contenido-relacionado', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tema, cantidad })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.mensaje || data.error || 'Error al investigar');
        }

        // Formatear el contenido de investigación
        let contenidoFormateado = `INVESTIGACIÓN: ${tema}\n\n`;
        contenidoFormateado += `${data.contenido.investigacion}\n\n`;

        if (data.contenido.subtemas && data.contenido.subtemas.length > 0) {
            contenidoFormateado += `\n\nSUBTEMAS IMPORTANTES:\n\n`;
            data.contenido.subtemas.forEach((subtema, index) => {
                contenidoFormateado += `${index + 1}. ${subtema.titulo || 'Subtema'}\n`;
                if (subtema.contenido) {
                    contenidoFormateado += `${subtema.contenido}\n\n`;
                }
            });
        }

        if (data.contenido.preguntas && data.contenido.preguntas.length > 0) {
            contenidoFormateado += `\n\nPREGUNTAS FRECUENTES:\n\n`;
            data.contenido.preguntas.forEach((pregunta, index) => {
                contenidoFormateado += `${index + 1}. ${pregunta}\n`;
            });
        }

        currentResult = contenidoFormateado;
        mostrarResultado(
            contenidoFormateado,
            contarPalabras(contenidoFormateado),
            contenidoFormateado.length
        );
        showToast('Investigación completada', 'success');

    } catch (error) {
        hideLoading();
        showToast(`Error: ${error.message}`, 'error');
        console.error('Error:', error);
    }
}

// ============================================
// MOSTRAR RESULTADO
// ============================================
function mostrarResultado(texto, palabras, caracteres) {
    hideLoading();

    elements.resultContent.textContent = texto;
    updateStats(texto);

    elements.resultsSection.style.display = 'block';
    elements.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateStats(texto) {
    const palabras = contarPalabras(texto);
    const caracteres = texto.length;
    const duracionMinutos = Math.ceil(palabras / 250);

    document.getElementById('palabrasCount').textContent = palabras.toLocaleString();
    document.getElementById('caracteresCount').textContent = caracteres.toLocaleString();
    document.getElementById('duracionEstimada').textContent = `~${duracionMinutos} min`;
}

// ============================================
// COPIAR RESULTADO
// ============================================
function copiarResultado() {
    const texto = elements.resultContent.textContent;

    navigator.clipboard.writeText(texto).then(() => {
        const btn = document.getElementById('copiarBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Copiado!';

        showToast('Texto copiado al portapapeles', 'success');

        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        showToast('Error al copiar: ' + err.message, 'error');
    });
}

// ============================================
// DESCARGAR RESULTADO
// ============================================
function descargarResultado() {
    const texto = elements.resultContent.textContent;
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guion-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Archivo descargado', 'success');
}

// ============================================
// LIMPIAR RESULTADOS
// ============================================
function limpiarResultados() {
    elements.resultsSection.style.display = 'none';
    elements.resultContent.textContent = '';
    currentResult = '';
    currentTranscription = '';
    document.getElementById('convertirGuionBtn').style.display = 'none';

    // Cerrar EventSource si está activo
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }

    showToast('Resultados limpiados', 'success');
}

// ============================================
// LOADING
// ============================================
function showLoading(mensaje) {
    elements.loadingText.textContent = mensaje;
    elements.loadingOverlay.style.display = 'flex';
}

function hideLoading() {
    elements.loadingOverlay.style.display = 'none';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
        info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    elements.toastContainer.appendChild(toast);

    // Auto-remove después de 5 segundos
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ============================================
// UTILIDADES
// ============================================
function contarPalabras(texto) {
    return texto.split(/\s+/).filter(palabra => palabra.length > 0).length;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
