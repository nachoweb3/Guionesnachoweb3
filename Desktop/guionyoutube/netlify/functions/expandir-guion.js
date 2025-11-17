import { generarGuionLargo } from '../../utils/generadorGuion.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { guionActual, seccionesAExpandir, provider } = JSON.parse(event.body);

    if (!guionActual) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El guion actual es requerido' })
      };
    }

    console.log('📝 Expandiendo guion...');

    const guionExpandido = await generarGuionLargo({
      tema: 'Expansión de guion existente',
      guionBase: guionActual,
      seccionesAExpandir,
      duracion: 60,
      provider: provider || 'groq'
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        guion: guionExpandido,
        palabras: guionExpandido.split(/\s+/).length
      })
    };
  } catch (error) {
    console.error('Error expandiendo guion:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error al expandir el guion',
        mensaje: error.message
      })
    };
  }
}
