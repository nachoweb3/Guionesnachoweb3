import { generarGuionPelicula } from '../../utils/generadorPeliculas.js';

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
      genero,
      duracion,
      formato,
      tono,
      tema,
      provider,
      incluirTratamiento,
      incluirPersonajes,
      incluirEscenas
    } = JSON.parse(event.body);

    if (!titulo || !tema) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El título y tema son requeridos' })
      };
    }

    console.log(`🎬 Generando guion de película: ${titulo}`);

    const guion = await generarGuionPelicula({
      titulo,
      genero: genero || 'drama',
      duracion: duracion || 90,
      formato: formato || 'largometraje',
      tono: tono || 'serio',
      tema,
      provider: provider || 'groq',
      incluirTratamiento: incluirTratamiento !== false,
      incluirPersonajes: incluirPersonajes !== false,
      incluirEscenas: incluirEscenas !== false
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        guion,
        palabras: guion.split(/\s+/).length,
        caracteres: guion.length,
        tipo: 'pelicula'
      })
    };
  } catch (error) {
    console.error('Error generando guion de película:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error al generar el guion de película',
        mensaje: error.message
      })
    };
  }
}
