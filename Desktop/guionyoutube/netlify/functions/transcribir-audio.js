import { transcribirConWhisper } from '../../utils/whisperTranscriber.js';

export async function handler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { audioUrl, audioBase64 } = JSON.parse(event.body);

    if (!audioUrl && !audioBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Se requiere audioUrl o audioBase64' })
      };
    }

    console.log('🎙️ Transcribiendo audio con Whisper...');

    const transcripcion = await transcribirConWhisper({ audioUrl, audioBase64 });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        transcripcion,
        palabras: transcripcion.split(/\s+/).length
      })
    };
  } catch (error) {
    console.error('Error transcribiendo audio:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error al transcribir el audio',
        mensaje: error.message
      })
    };
  }
}
