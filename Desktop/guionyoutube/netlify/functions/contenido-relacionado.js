import { obtenerContenidoRelacionado } from '../../utils/contenidoRelacionado.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { tema, cantidad } = JSON.parse(event.body);

    if (!tema) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El tema es requerido' })
      };
    }

    console.log(`🔍 Buscando contenido relacionado sobre: ${tema}`);

    const contenido = await obtenerContenidoRelacionado(tema, cantidad || 5);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        contenido
      })
    };
  } catch (error) {
    console.error('Error obteniendo contenido:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error al obtener contenido relacionado',
        mensaje: error.message
      })
    };
  }
}
