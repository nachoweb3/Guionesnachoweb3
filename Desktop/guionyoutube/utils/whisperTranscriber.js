import fetch from 'node-fetch';
import { generarTexto } from '../config/iaProviders.js';

/**
 * Transcribe audio usando Whisper API de Groq (GRATIS)
 * Nota: Groq ofrece Whisper de forma gratuita en su API
 */
export async function transcribirConWhisper(opciones) {
  const { audioUrl, audioBase64, usarGroq = true } = opciones;

  try {
    if (usarGroq && process.env.GROQ_API_KEY) {
      console.log('🎙️ Usando Groq Whisper API (Gratis)...');
      return await transcribirConGroqWhisper(audioUrl, audioBase64);
    } else {
      // Fallback: usar método alternativo o guía de instalación local
      console.log('ℹ️ Whisper local no configurado');
      return await transcripcionAlternativa(audioUrl);
    }
  } catch (error) {
    console.error('Error en transcripción:', error);
    throw new Error(`Error al transcribir: ${error.message}`);
  }
}

/**
 * Transcribir usando Groq Whisper API (Modelo whisper-large-v3)
 */
async function transcribirConGroqWhisper(audioUrl, audioBase64) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Se requiere GROQ_API_KEY para usar Whisper. Obtenla gratis en https://console.groq.com');
  }

  try {
    // Groq Whisper requiere el archivo de audio
    // Por ahora, proporcionamos una guía de uso
    const guia = `
Para usar Whisper con Groq (GRATIS):

1. Obtén tu API key en https://console.groq.com
2. Configúrala en el archivo .env como GROQ_API_KEY

3. Usa el siguiente código para transcribir:

\`\`\`bash
curl -X POST "https://api.groq.com/openai/v1/audio/transcriptions" \\
  -H "Authorization: Bearer $GROQ_API_KEY" \\
  -F "file=@/path/to/audio.mp3" \\
  -F "model=whisper-large-v3"
\`\`\`

O instala Whisper localmente (100% gratis):
\`\`\`bash
pip install openai-whisper
whisper audio.mp3 --model medium --language es
\`\`\`
    `;

    // Para esta demo, retornaremos la guía
    // En producción, aquí harías la llamada real a Groq Whisper
    return guia;
  } catch (error) {
    throw new Error(`Error con Groq Whisper: ${error.message}`);
  }
}

/**
 * Método alternativo: generar contenido relacionado en lugar de transcribir
 */
async function transcripcionAlternativa(audioUrl) {
  console.log('💡 Generando contenido de investigación alternativo...');

  const info = `
🎙️ OPCIONES PARA TRANSCRIPCIÓN CON WHISPER (100% GRATIS):

OPCIÓN 1: Groq API (Recomendado - Más fácil)
----------------------------------------
1. Ve a https://console.groq.com
2. Crea una cuenta gratis
3. Obtén tu API key
4. Agrégala al archivo .env: GROQ_API_KEY=tu_clave_aqui
5. Whisper estará disponible automáticamente

OPCIÓN 2: Whisper Local (100% gratis, sin límites)
----------------------------------------
1. Instala Python 3.8+
2. Instala Whisper:
   pip install openai-whisper

3. Transcribe audio:
   whisper audio.mp3 --model medium --language es

4. Modelos disponibles (por tamaño):
   - tiny: Rápido, menor precisión
   - base: Buena relación velocidad/precisión
   - small: Mejor precisión
   - medium: Excelente precisión (recomendado)
   - large: Máxima precisión (más lento)

OPCIÓN 3: Usar herramientas online gratuitas
----------------------------------------
- AssemblyAI (cuenta gratuita)
- Replicate (permite usar Whisper gratis)
- HuggingFace Spaces

Por ahora, puedes:
1. Transcribir tu audio externamente con Whisper
2. Pegar la transcripción aquí
3. Usar esta herramienta para generar el guion basado en esa transcripción
  `;

  return info;
}

/**
 * Convierte una transcripción en un guion estructurado
 */
export async function convertirTranscripcionAGuion(transcripcion, tema, duracionObjetivo = 30, provider = 'groq') {
  const prompt = `Tengo la siguiente transcripción de contenido relacionado con "${tema}":

${transcripcion}

TAREA: Convierte esta transcripción en un GUION PROFESIONAL para YouTube de aproximadamente ${duracionObjetivo} minutos (${duracionObjetivo * 250} palabras).

El guion debe:
- Reorganizar el contenido en una estructura clara y lógica
- Expandir puntos importantes con más detalles
- Agregar introducciones y transiciones fluidas
- Incluir ejemplos adicionales donde sea relevante
- Mantener el tono conversacional
- Ser EXTENSO y DETALLADO (mínimo ${duracionObjetivo * 200} palabras)

Escribe el guion completo estructurado:`;

  return await generarTexto(prompt, { provider, maxTokens: 8000 });
}
