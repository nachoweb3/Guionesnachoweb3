import { generarGuionVideojuego } from '../../utils/generadorVideojuegos.js';

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
      plataforma,
      tipoJuego,
      duracion,
      tema,
      provider,
      incluirNarrativa,
      incluirMecanicas,
      incluirNiveles,
      incluirPersonajes
    } = JSON.parse(event.body);

    if (!titulo || !tema) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El título y tema son requeridos' })
      };
    }

    console.log(`🎮 Generando GDD de videojuego: ${titulo}`);

    const guion = await generarGuionVideojuego({
      titulo,
      genero: genero || 'accion',
      plataforma: plataforma || 'multiplataforma',
      tipoJuego: tipoJuego || 'single-player',
      duracion: duracion || 20,
      tema,
      provider: provider || 'groq',
      incluirNarrativa: incluirNarrativa !== false,
      incluirMecanicas: incluirMecanicas !== false,
      incluirNiveles: incluirNiveles !== false,
      incluirPersonajes: incluirPersonajes !== false
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
        tipo: 'videojuego'
      })
    };
  } catch (error) {
    console.error('Error generando GDD de videojuego:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error al generar el GDD de videojuego',
        mensaje: error.message
      })
    };
  }
}
