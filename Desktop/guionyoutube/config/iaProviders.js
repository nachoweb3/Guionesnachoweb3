import Groq from 'groq-sdk';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Cliente de Groq (Gratis y rápido)
let groqClient = null;
if (process.env.GROQ_API_KEY) {
  groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
}

// Configuración de Ollama (Local - 100% Gratis)
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

/**
 * Genera texto usando Groq (modelos rápidos y gratuitos)
 */
export async function generarConGroq(prompt, opciones = {}) {
  if (!groqClient) {
    throw new Error('GROQ_API_KEY no configurada. Obtén una clave gratis en https://console.groq.com');
  }

  const {
    model = 'mixtral-8x7b-32768', // Modelo gratuito con contexto largo
    maxTokens = 8000,
    temperature = 0.7
  } = opciones;

  try {
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Eres un guionista profesional experto en crear contenido extenso, detallado y atractivo para YouTube. Tus guiones son informativos, entretenidos y mantienen la atención del espectador.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model,
      max_tokens: maxTokens,
      temperature
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error con Groq:', error.message);
    throw error;
  }
}

/**
 * Genera texto usando Ollama (Local - 100% Gratis)
 */
export async function generarConOllama(prompt, opciones = {}) {
  const {
    model = 'llama2', // Modelo por defecto, también puedes usar 'mistral', 'codellama', etc.
    temperature = 0.7
  } = opciones;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt: `Eres un guionista profesional experto en crear contenido extenso, detallado y atractivo para YouTube. Tus guiones son informativos, entretenidos y mantienen la atención del espectador.\n\n${prompt}`,
        stream: false,
        options: {
          temperature
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  } catch (error) {
    console.error('Error con Ollama:', error.message);
    throw new Error(`Ollama no está disponible. Asegúrate de tener Ollama instalado y ejecutándose (ollama serve). Descárgalo en: https://ollama.ai\nError: ${error.message}`);
  }
}

/**
 * Función genérica para generar texto con el proveedor especificado
 */
export async function generarTexto(prompt, opciones = {}) {
  const { provider = 'groq' } = opciones;

  if (provider === 'ollama') {
    return await generarConOllama(prompt, opciones);
  } else if (provider === 'groq') {
    return await generarConGroq(prompt, opciones);
  } else {
    throw new Error(`Proveedor desconocido: ${provider}`);
  }
}

/**
 * Verifica qué proveedores están disponibles
 */
export async function verificarProveedores() {
  const proveedores = {
    groq: false,
    ollama: false
  };

  // Verificar Groq
  if (groqClient) {
    proveedores.groq = true;
  }

  // Verificar Ollama
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      method: 'GET'
    });
    if (response.ok) {
      proveedores.ollama = true;
    }
  } catch (error) {
    proveedores.ollama = false;
  }

  return proveedores;
}
