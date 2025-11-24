import { generarGuionLibro } from '../../utils/generadorLibros.js';

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
      numeroCapitulos,
      palabrasPorCapitulo,
      tono,
      tema,
      provider,
      incluirPersonajes,
      incluirSinopsis,
      incluirArcoNarrativo
    } = JSON.parse(event.body);

    if (!titulo || !tema) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'El título y tema son requeridos' })
      };
    }

    console.log(`📚 Generando guion de libro: ${titulo}`);

    const guion = await generarGuionLibro({
      titulo,
      genero: genero || 'ficcion',
      numeroCapitulos: numeroCapitulos || 20,
      palabrasPorCapitulo: palabrasPorCapitulo || 3000,
      tono: tono || 'narrativo',
      tema,
      provider: provider || 'groq',
      incluirPersonajes: incluirPersonajes !== false,
      incluirSinopsis: incluirSinopsis !== false,
      incluirArcoNarrativo: incluirArcoNarrativo !== false
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
        tipo: 'libro'
      })
    };
  } catch (error) {
    console.error('Error generando guion de libro:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error al generar el guion de libro',
        mensaje: error.message
      })
    };
  }
}
