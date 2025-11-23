/**
 * EXPORTADOR MULTI-FORMATO
 * Exporta guiones a diferentes formatos: PDF, SRT, Markdown, HTML, DOCX
 */

/**
 * Exporta un guión al formato especificado
 * @param {string} guion - El texto del guión
 * @param {string} formato - Formato de exportación (pdf, srt, markdown, html, txt, docx)
 * @param {object} metadata - Metadata adicional (título, autor, fecha, etc.)
 * @returns {object} - Datos del archivo exportado
 */
export function exportarGuion(guion, formato, metadata = {}) {
  const {
    titulo = 'Guión de YouTube',
    autor = 'Generador de Guiones IA',
    fecha = new Date().toISOString().split('T')[0],
    duracionEstimada = null,
    palabras = null,
    tema = null
  } = metadata;

  try {
    console.log(`📦 Exportando a formato ${formato.toUpperCase()}...`);

    let contenido;
    let mimeType;
    let extension;
    let nombreArchivo;

    switch (formato.toLowerCase()) {
      case 'pdf':
        ({ contenido, mimeType, extension } = exportarPDF(guion, { titulo, autor, fecha, duracionEstimada, palabras }));
        break;

      case 'srt':
        ({ contenido, mimeType, extension } = exportarSRT(guion, { titulo }));
        break;

      case 'markdown':
      case 'md':
        ({ contenido, mimeType, extension } = exportarMarkdown(guion, { titulo, autor, fecha, duracionEstimada, palabras, tema }));
        break;

      case 'html':
        ({ contenido, mimeType, extension } = exportarHTML(guion, { titulo, autor, fecha, duracionEstimada, palabras, tema }));
        break;

      case 'txt':
      case 'text':
        ({ contenido, mimeType, extension } = exportarTXT(guion, { titulo, autor, fecha }));
        break;

      case 'docx':
        ({ contenido, mimeType, extension } = exportarDOCX(guion, { titulo, autor, fecha, duracionEstimada, palabras }));
        break;

      case 'json':
        ({ contenido, mimeType, extension } = exportarJSON(guion, { titulo, autor, fecha, duracionEstimada, palabras, tema }));
        break;

      default:
        throw new Error(`Formato no soportado: ${formato}`);
    }

    nombreArchivo = `${sanitizarNombreArchivo(titulo)}.${extension}`;

    console.log(`✅ Exportación completada: ${nombreArchivo}`);

    return {
      success: true,
      contenido: contenido,
      mimeType: mimeType,
      extension: extension,
      nombreArchivo: nombreArchivo,
      tamaño: contenido.length
    };

  } catch (error) {
    console.error('❌ Error exportando:', error);
    throw new Error(`Error al exportar a ${formato}: ${error.message}`);
  }
}

/**
 * Exporta a formato PDF (usando estructura de texto enriquecida)
 * Nota: Para PDF real se necesitaría jsPDF en el cliente
 * Esta versión genera un formato compatible con generadores PDF
 */
function exportarPDF(guion, metadata) {
  // Generar contenido en formato compatible con jsPDF
  // El cliente usará jsPDF para convertir esto a PDF real
  const contenido = {
    tipo: 'pdf-data',
    metadata: metadata,
    contenido: guion,
    formateo: {
      fuente: 'Arial',
      tamañoFuente: 11,
      lineHeight: 1.5,
      margenes: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      }
    },
    portada: {
      titulo: metadata.titulo,
      autor: metadata.autor,
      fecha: metadata.fecha,
      stats: metadata.duracionEstimada ? `Duración estimada: ${metadata.duracionEstimada}` : null
    }
  };

  return {
    contenido: JSON.stringify(contenido),
    mimeType: 'application/json',
    extension: 'pdf-data.json'
  };
}

/**
 * Exporta a formato SRT (subtítulos)
 * Divide el guión en segmentos con timestamps
 */
function exportarSRT(guion, metadata) {
  const oraciones = guion
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  let srtContent = '';
  let tiempoActual = 0;

  oraciones.forEach((oracion, index) => {
    const palabras = oracion.split(/\s+/).length;
    const duracionSegmento = Math.max(2, Math.ceil(palabras / 2.5)); // ~2.5 palabras por segundo

    const inicio = formatearTiempoSRT(tiempoActual);
    const fin = formatearTiempoSRT(tiempoActual + duracionSegmento);

    srtContent += `${index + 1}\n`;
    srtContent += `${inicio} --> ${fin}\n`;
    srtContent += `${oracion}\n\n`;

    tiempoActual += duracionSegmento;
  });

  return {
    contenido: srtContent,
    mimeType: 'text/srt',
    extension: 'srt'
  };
}

/**
 * Exporta a formato Markdown
 */
function exportarMarkdown(guion, metadata) {
  let md = '';

  // Portada
  md += `# ${metadata.titulo}\n\n`;

  if (metadata.tema) {
    md += `**Tema:** ${metadata.tema}\n\n`;
  }

  md += `**Autor:** ${metadata.autor}\n\n`;
  md += `**Fecha:** ${metadata.fecha}\n\n`;

  if (metadata.duracionEstimada) {
    md += `**Duración estimada:** ${metadata.duracionEstimada}\n\n`;
  }

  if (metadata.palabras) {
    md += `**Palabras:** ${metadata.palabras.toLocaleString()}\n\n`;
  }

  md += '---\n\n';

  // Contenido del guión formateado
  const lineas = guion.split('\n');
  let enSeccion = false;

  lineas.forEach(linea => {
    const lineaTrim = linea.trim();

    // Detectar títulos/secciones
    if (lineaTrim.match(/^[A-ZÁÉÍÓÚÑ\s]{5,50}:?\s*$/) ||
        lineaTrim.match(/^\[.+\]$/) ||
        lineaTrim.match(/^#{1,3}\s+/)) {

      if (!lineaTrim.startsWith('#')) {
        md += `\n## ${lineaTrim.replace(/[\[\]]/g, '')}\n\n`;
      } else {
        md += lineaTrim + '\n\n';
      }
      enSeccion = true;
    } else if (lineaTrim.length > 0) {
      md += lineaTrim + '\n\n';
    } else {
      md += '\n';
    }
  });

  // Footer
  md += '\n---\n\n';
  md += '*Generado con Generador de Guiones IA*\n';

  return {
    contenido: md,
    mimeType: 'text/markdown',
    extension: 'md'
  };
}

/**
 * Exporta a formato HTML
 */
function exportarHTML(guion, metadata) {
  const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHTML(metadata.titulo)}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #f5f5f5;
            color: #333;
        }

        .container {
            background: white;
            padding: 60px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .header {
            text-align: center;
            border-bottom: 3px solid #333;
            padding-bottom: 30px;
            margin-bottom: 40px;
        }

        h1 {
            font-size: 2.5em;
            margin-bottom: 20px;
            color: #1a1a1a;
        }

        .metadata {
            color: #666;
            font-size: 0.95em;
            margin-top: 20px;
        }

        .metadata div {
            margin: 5px 0;
        }

        .content {
            font-size: 1.1em;
            text-align: justify;
        }

        .content h2 {
            font-size: 1.6em;
            margin: 40px 0 20px 0;
            color: #2c3e50;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }

        .content p {
            margin-bottom: 20px;
        }

        .footer {
            margin-top: 60px;
            padding-top: 30px;
            border-top: 2px solid #eee;
            text-align: center;
            color: #999;
            font-size: 0.9em;
        }

        @media print {
            body {
                background: white;
            }
            .container {
                box-shadow: none;
                padding: 20px;
            }
        }

        @media (max-width: 768px) {
            .container {
                padding: 30px 20px;
            }
            h1 {
                font-size: 1.8em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${escapeHTML(metadata.titulo)}</h1>
            <div class="metadata">
                ${metadata.tema ? `<div><strong>Tema:</strong> ${escapeHTML(metadata.tema)}</div>` : ''}
                <div><strong>Autor:</strong> ${escapeHTML(metadata.autor)}</div>
                <div><strong>Fecha:</strong> ${metadata.fecha}</div>
                ${metadata.duracionEstimada ? `<div><strong>Duración estimada:</strong> ${metadata.duracionEstimada}</div>` : ''}
                ${metadata.palabras ? `<div><strong>Palabras:</strong> ${metadata.palabras.toLocaleString()}</div>` : ''}
            </div>
        </div>

        <div class="content">
            ${formatearGuionHTML(guion)}
        </div>

        <div class="footer">
            <p>Generado con Generador de Guiones IA</p>
            <p>${new Date().toLocaleString('es-ES')}</p>
        </div>
    </div>
</body>
</html>`;

  return {
    contenido: html,
    mimeType: 'text/html',
    extension: 'html'
  };
}

/**
 * Exporta a formato TXT plano
 */
function exportarTXT(guion, metadata) {
  let txt = '';

  txt += '='.repeat(60) + '\n';
  txt += metadata.titulo.toUpperCase().padStart(30 + metadata.titulo.length / 2) + '\n';
  txt += '='.repeat(60) + '\n\n';

  txt += `Autor: ${metadata.autor}\n`;
  txt += `Fecha: ${metadata.fecha}\n\n`;

  txt += '='.repeat(60) + '\n\n';

  txt += guion;

  txt += '\n\n' + '='.repeat(60) + '\n';
  txt += 'Generado con Generador de Guiones IA\n';
  txt += '='.repeat(60) + '\n';

  return {
    contenido: txt,
    mimeType: 'text/plain',
    extension: 'txt'
  };
}

/**
 * Exporta a formato DOCX compatible (XML simplificado)
 * Nota: Para DOCX real se necesitaría docx.js en el cliente
 */
function exportarDOCX(guion, metadata) {
  // Generar estructura compatible con docx
  const docxData = {
    tipo: 'docx-data',
    metadata: metadata,
    secciones: []
  };

  // Portada
  docxData.secciones.push({
    tipo: 'portada',
    contenido: {
      titulo: metadata.titulo,
      autor: metadata.autor,
      fecha: metadata.fecha,
      stats: []
    }
  });

  if (metadata.duracionEstimada) {
    docxData.secciones[0].contenido.stats.push(`Duración: ${metadata.duracionEstimada}`);
  }
  if (metadata.palabras) {
    docxData.secciones[0].contenido.stats.push(`Palabras: ${metadata.palabras.toLocaleString()}`);
  }

  // Contenido
  const parrafos = guion.split('\n\n').filter(p => p.trim().length > 0);

  parrafos.forEach(parrafo => {
    // Detectar si es título
    if (parrafo.match(/^[A-ZÁÉÍÓÚÑ\s]{5,50}:?\s*$/) ||
        parrafo.match(/^\[.+\]$/) ||
        parrafo.match(/^#{1,3}\s+/)) {

      docxData.secciones.push({
        tipo: 'titulo',
        contenido: parrafo.replace(/[\[\]#]/g, '').trim()
      });
    } else {
      docxData.secciones.push({
        tipo: 'parrafo',
        contenido: parrafo.trim()
      });
    }
  });

  return {
    contenido: JSON.stringify(docxData),
    mimeType: 'application/json',
    extension: 'docx-data.json'
  };
}

/**
 * Exporta a formato JSON estructurado
 */
function exportarJSON(guion, metadata) {
  const jsonData = {
    metadata: {
      titulo: metadata.titulo,
      autor: metadata.autor,
      fecha: metadata.fecha,
      tema: metadata.tema,
      duracionEstimada: metadata.duracionEstimada,
      palabras: metadata.palabras,
      generado: new Date().toISOString()
    },
    contenido: {
      guionCompleto: guion,
      secciones: detectarSeccionesJSON(guion),
      estadisticas: {
        palabras: contarPalabras(guion),
        caracteres: guion.length,
        lineas: guion.split('\n').length,
        oraciones: guion.split(/[.!?]+/).length
      }
    },
    version: '1.0'
  };

  return {
    contenido: JSON.stringify(jsonData, null, 2),
    mimeType: 'application/json',
    extension: 'json'
  };
}

/**
 * Detecta secciones en el guión para JSON estructurado
 */
function detectarSeccionesJSON(guion) {
  const secciones = [];
  const lineas = guion.split('\n');
  let seccionActual = null;

  lineas.forEach(linea => {
    const lineaTrim = linea.trim();

    // Detectar título de sección
    if (lineaTrim.match(/^[A-ZÁÉÍÓÚÑ\s]{5,50}:?\s*$/) ||
        lineaTrim.match(/^\[.+\]$/) ||
        lineaTrim.match(/^#{1,3}\s+/)) {

      // Guardar sección anterior si existe
      if (seccionActual) {
        secciones.push(seccionActual);
      }

      // Crear nueva sección
      seccionActual = {
        titulo: lineaTrim.replace(/[\[\]#]/g, '').trim(),
        contenido: ''
      };
    } else if (lineaTrim.length > 0 && seccionActual) {
      seccionActual.contenido += lineaTrim + '\n';
    }
  });

  // Agregar última sección
  if (seccionActual) {
    secciones.push(seccionActual);
  }

  // Si no se detectaron secciones, crear una genérica
  if (secciones.length === 0) {
    secciones.push({
      titulo: 'Contenido',
      contenido: guion
    });
  }

  return secciones;
}

/**
 * Formatea tiempo en formato SRT (00:00:00,000)
 */
function formatearTiempoSRT(segundosTotales) {
  const horas = Math.floor(segundosTotales / 3600);
  const minutos = Math.floor((segundosTotales % 3600) / 60);
  const segundos = Math.floor(segundosTotales % 60);
  const milisegundos = Math.floor((segundosTotales % 1) * 1000);

  return `${pad(horas, 2)}:${pad(minutos, 2)}:${pad(segundos, 2)},${pad(milisegundos, 3)}`;
}

/**
 * Formatea el guión para HTML
 */
function formatearGuionHTML(guion) {
  const lineas = guion.split('\n');
  let html = '';
  let parrafoActual = '';

  lineas.forEach(linea => {
    const lineaTrim = linea.trim();

    // Detectar títulos
    if (lineaTrim.match(/^[A-ZÁÉÍÓÚÑ\s]{5,50}:?\s*$/) ||
        lineaTrim.match(/^\[.+\]$/) ||
        lineaTrim.match(/^#{1,3}\s+/)) {

      // Cerrar párrafo anterior si existe
      if (parrafoActual) {
        html += `<p>${escapeHTML(parrafoActual)}</p>\n`;
        parrafoActual = '';
      }

      // Agregar título
      const tituloLimpio = lineaTrim.replace(/[\[\]#]/g, '').trim();
      html += `<h2>${escapeHTML(tituloLimpio)}</h2>\n`;

    } else if (lineaTrim.length > 0) {
      // Agregar a párrafo actual
      parrafoActual += (parrafoActual ? ' ' : '') + lineaTrim;

    } else if (parrafoActual) {
      // Línea vacía: cerrar párrafo
      html += `<p>${escapeHTML(parrafoActual)}</p>\n`;
      parrafoActual = '';
    }
  });

  // Cerrar último párrafo si existe
  if (parrafoActual) {
    html += `<p>${escapeHTML(parrafoActual)}</p>\n`;
  }

  return html;
}

/**
 * Escapa caracteres HTML
 */
function escapeHTML(texto) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return texto.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Sanitiza nombre de archivo
 */
function sanitizarNombreArchivo(nombre) {
  return nombre
    .replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 100);
}

/**
 * Rellena con ceros a la izquierda
 */
function pad(numero, longitud) {
  return numero.toString().padStart(longitud, '0');
}

/**
 * Cuenta palabras
 */
function contarPalabras(texto) {
  return texto.split(/\s+/).filter(p => p.length > 0).length;
}

/**
 * Obtiene información sobre formatos soportados
 */
export function getFormatosSoportados() {
  return [
    {
      formato: 'pdf',
      nombre: 'PDF',
      descripcion: 'Documento PDF profesional con formato',
      extension: 'pdf',
      mimeType: 'application/pdf',
      requiereLibreria: 'jsPDF (cliente)'
    },
    {
      formato: 'srt',
      nombre: 'SRT (Subtítulos)',
      descripcion: 'Archivo de subtítulos con timestamps',
      extension: 'srt',
      mimeType: 'text/srt'
    },
    {
      formato: 'markdown',
      nombre: 'Markdown',
      descripcion: 'Formato Markdown para documentación',
      extension: 'md',
      mimeType: 'text/markdown'
    },
    {
      formato: 'html',
      nombre: 'HTML',
      descripcion: 'Página web con estilos profesionales',
      extension: 'html',
      mimeType: 'text/html'
    },
    {
      formato: 'txt',
      nombre: 'Texto Plano',
      descripcion: 'Archivo de texto simple',
      extension: 'txt',
      mimeType: 'text/plain'
    },
    {
      formato: 'docx',
      nombre: 'Word (DOCX)',
      descripcion: 'Documento de Microsoft Word',
      extension: 'docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      requiereLibreria: 'docx (cliente)'
    },
    {
      formato: 'json',
      nombre: 'JSON',
      descripcion: 'Formato JSON estructurado',
      extension: 'json',
      mimeType: 'application/json'
    }
  ];
}
