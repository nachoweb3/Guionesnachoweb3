import { generarGuionLargo } from '../../utils/generadorGuion.js';

export async function handler(event, context) {
  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tema, nicho, duracion, tono, incluirIntro, incluirOutro, provider } = JSON.parse(event.body);

    if (!tema) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El tema es requerido' })
      };
    }

    console.log(`🎬 Generando guion sobre: ${tema} (${duracion || 30} minutos)`);

    const guion = await generarGuionLargo({
      tema,
      nicho,
      duracion: duracion || 30,
      tono: tono || 'profesional',
      incluirIntro: incluirIntro !== false,
      incluirOutro: incluirOutro !== false,
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
        guion,
        palabras: guion.split(/\s+/).length,
        caracteres: guion.length
      })
    };
  } catch (error) {
    console.error('Error generando guion:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error al generar el guion',
        mensaje: error.message
      })
    };
  }
}
