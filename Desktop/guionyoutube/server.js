import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { generarGuionLargo } from './utils/generadorGuion.js';
import { transcribirConWhisper } from './utils/whisperTranscriber.js';
import { obtenerContenidoRelacionado } from './utils/contenidoRelacionado.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: Generar guion largo con IA
app.post('/api/generar-guion', async (req, res) => {
  try {
    const { tema, nicho, duracion, tono, incluirIntro, incluirOutro, provider } = req.body;

    if (!tema) {
      return res.status(400).json({ error: 'El tema es requerido' });
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

    res.json({
      success: true,
      guion,
      palabras: guion.split(/\s+/).length,
      caracteres: guion.length
    });
  } catch (error) {
    console.error('Error generando guion:', error);
    res.status(500).json({
      error: 'Error al generar el guion',
      mensaje: error.message
    });
  }
});

// API: Transcribir audio con Whisper
app.post('/api/transcribir-audio', async (req, res) => {
  try {
    const { audioUrl, audioBase64 } = req.body;

    if (!audioUrl && !audioBase64) {
      return res.status(400).json({ error: 'Se requiere audioUrl o audioBase64' });
    }

    console.log('🎙️ Transcribiendo audio con Whisper...');

    const transcripcion = await transcribirConWhisper({ audioUrl, audioBase64 });

    res.json({
      success: true,
      transcripcion,
      palabras: transcripcion.split(/\s+/).length
    });
  } catch (error) {
    console.error('Error transcribiendo audio:', error);
    res.status(500).json({
      error: 'Error al transcribir el audio',
      mensaje: error.message
    });
  }
});

// API: Obtener contenido relacionado para investigación
app.post('/api/contenido-relacionado', async (req, res) => {
  try {
    const { tema, cantidad } = req.body;

    if (!tema) {
      return res.status(400).json({ error: 'El tema es requerido' });
    }

    console.log(`🔍 Buscando contenido relacionado sobre: ${tema}`);

    const contenido = await obtenerContenidoRelacionado(tema, cantidad || 5);

    res.json({
      success: true,
      contenido
    });
  } catch (error) {
    console.error('Error obteniendo contenido:', error);
    res.status(500).json({
      error: 'Error al obtener contenido relacionado',
      mensaje: error.message
    });
  }
});

// API: Expandir guion (para hacerlo más largo)
app.post('/api/expandir-guion', async (req, res) => {
  try {
    const { guionActual, seccionesAExpandir, provider } = req.body;

    if (!guionActual) {
      return res.status(400).json({ error: 'El guion actual es requerido' });
    }

    console.log('📝 Expandiendo guion...');

    const guionExpandido = await generarGuionLargo({
      tema: 'Expansión de guion existente',
      guionBase: guionActual,
      seccionesAExpandir,
      duracion: 60,
      provider: provider || 'groq'
    });

    res.json({
      success: true,
      guion: guionExpandido,
      palabras: guionExpandido.split(/\s+/).length
    });
  } catch (error) {
    console.error('Error expandiendo guion:', error);
    res.status(500).json({
      error: 'Error al expandir el guion',
      mensaje: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    providers: {
      groq: !!process.env.GROQ_API_KEY,
      ollama: true
    }
  });
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  🎬 GENERADOR DE GUIONES LARGOS CON IA                    ║
║  📝 Guiones profesionales de 30+ minutos                  ║
║  🆓 100% GRATIS usando IA                                 ║
╚═══════════════════════════════════════════════════════════╝

🚀 Servidor iniciado en http://localhost:${PORT}
📚 Proveedores de IA disponibles:
   ${process.env.GROQ_API_KEY ? '✅' : '⚠️'} Groq (API Key ${process.env.GROQ_API_KEY ? 'configurada' : 'no configurada'})
   ✅ Ollama (Local - 100% gratis)

💡 Configura tu GROQ_API_KEY en .env para mejores resultados
   Obtén tu clave gratis en: https://console.groq.com
  `);
});
