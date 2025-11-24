import { generarArticulo } from '../../utils/generadorArticulos.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const {
      titulo,
      tipo,
      palabrasObjetivo,
      tono,
      tema,
      nichoArticulo,
      provider,
      incluirSEO,
      incluirImagenes,
      incluirCTA,
      audiencia
    } = JSON.parse(event.body);

    if (!titulo || !tema) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El título y tema son requeridos' })
      };
    }

    console.log(`📝 Generando artículo: ${titulo}`);

    const articulo = await generarArticulo({
      titulo,
      tipo: tipo || 'blog',
      palabrasObjetivo: palabrasObjetivo || 2000,
      tono: tono || 'profesional',
      tema,
      nichoArticulo: nichoArticulo || 'general',
      provider: provider || 'groq',
      incluirSEO: incluirSEO !== false,
      incluirImagenes: incluirImagenes !== false,
      incluirCTA: incluirCTA !== false,
      audiencia: audiencia || 'general'
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        guion: articulo,
        palabras: articulo.split(/\s+/).length,
        caracteres: articulo.length,
        tipo: 'articulo'
      })
    };
  } catch (error) {
    console.error('Error generando artículo:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error al generar el artículo',
        mensaje: error.message
      })
    };
  }
}
