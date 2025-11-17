// Estado de la aplicación
let currentTranscription = '';
let currentResult = '';

// Elementos del DOM
const providerStatus = document.getElementById('providerStatus');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingText = document.getElementById('loadingText');
const resultsSection = document.getElementById('resultsSection');
const resultContent = document.getElementById('resultContent');
const statsBar = document.getElementById('statsBar');

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    initializeButtons();
    checkServerHealth();
});

/**
 * Inicializar sistema de tabs
 */
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
        });
    });
}

/**
 * Inicializar botones
 */
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
}

/**
 * Verificar estado del servidor
 */
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

        providerStatus.innerHTML = '<span class="status-label">Estado:</span> ' + statusHTML;
    } catch (error) {
        providerStatus.innerHTML = '<span class="status-label">Estado:</span> <span class="status-indicator offline">✗ Offline</span>';
        console.error('Error checking health:', error);
    }
}

/**
 * Generar guion largo
 */
async function generarGuion() {
    const tema = document.getElementById('tema').value.trim();
    const nicho = document.getElementById('nicho').value;
    const duracion = parseInt(document.getElementById('duracion').value);
    const tono = document.getElementById('tono').value;
    const incluirIntro = document.getElementById('incluirIntro').checked;
    const incluirOutro = document.getElementById('incluirOutro').checked;
    const provider = document.getElementById('provider').value;

    if (!tema) {
        alert('Por favor ingresa un tema para el video');
        return;
    }

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
    } catch (error) {
        hideLoading();
        alert(`Error: ${error.message}`);
        console.error('Error:', error);
    }
}

/**
 * Procesar transcripción
 */
async function procesarTranscripcion() {
    const audioUrl = document.getElementById('audioUrl').value.trim();
    const transcripcionManual = document.getElementById('transcripcionManual').value.trim();

    if (!audioUrl && !transcripcionManual) {
        alert('Por favor proporciona una URL de audio o pega una transcripción');
        return;
    }

    // Si hay transcripción manual, usarla directamente
    if (transcripcionManual) {
        currentTranscription = transcripcionManual;
        mostrarResultado(transcripcionManual, contarPalabras(transcripcionManual), transcripcionManual.length);
        document.getElementById('convertirGuionBtn').style.display = 'block';
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
    } catch (error) {
        hideLoading();
        alert(`Error: ${error.message}`);
        console.error('Error:', error);
    }
}

/**
 * Convertir transcripción a guion
 */
async function convertirAGuion() {
    if (!currentTranscription) {
        alert('No hay transcripción para convertir');
        return;
    }

    const tema = document.getElementById('temaTranscripcion').value.trim() || 'Tema general';
    const provider = document.getElementById('provider').value;

    showLoading('Convirtiendo transcripción a guion profesional...');

    try {
        // Usar la API de expansión de guion
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
    } catch (error) {
        hideLoading();
        alert(`Error: ${error.message}`);
        console.error('Error:', error);
    }
}

/**
 * Investigar tema
 */
async function investigarTema() {
    const tema = document.getElementById('temaInvestigar').value.trim();
    const cantidad = parseInt(document.getElementById('cantidadSubtemas').value);

    if (!tema) {
        alert('Por favor ingresa un tema para investigar');
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
    } catch (error) {
        hideLoading();
        alert(`Error: ${error.message}`);
        console.error('Error:', error);
    }
}

/**
 * Mostrar resultado
 */
function mostrarResultado(texto, palabras, caracteres) {
    hideLoading();

    resultContent.textContent = texto;
    document.getElementById('palabrasCount').textContent = palabras.toLocaleString();
    document.getElementById('caracteresCount').textContent = caracteres.toLocaleString();

    // Calcular duración estimada (250 palabras por minuto)
    const duracionMinutos = Math.ceil(palabras / 250);
    document.getElementById('duracionEstimada').textContent = `~${duracionMinutos} min`;

    resultsSection.style.display = 'block';
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Copiar resultado
 */
function copiarResultado() {
    const texto = resultContent.textContent;

    navigator.clipboard.writeText(texto).then(() => {
        const btn = document.getElementById('copiarBtn');
        const originalText = btn.textContent;
        btn.textContent = '✓ Copiado!';
        setTimeout(() => {
            btn.textContent = originalText;
        }, 2000);
    }).catch(err => {
        alert('Error al copiar: ' + err.message);
    });
}

/**
 * Descargar resultado
 */
function descargarResultado() {
    const texto = resultContent.textContent;
    const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guion-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Limpiar resultados
 */
function limpiarResultados() {
    resultsSection.style.display = 'none';
    resultContent.textContent = '';
    currentResult = '';
    currentTranscription = '';
    document.getElementById('convertirGuionBtn').style.display = 'none';
}

/**
 * Mostrar loading
 */
function showLoading(mensaje) {
    loadingText.textContent = mensaje;
    loadingOverlay.style.display = 'flex';
}

/**
 * Ocultar loading
 */
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

/**
 * Contar palabras
 */
function contarPalabras(texto) {
    return texto.split(/\s+/).filter(palabra => palabra.length > 0).length;
}
