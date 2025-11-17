# 🎬 Generador Profesional de Guiones Largos con IA

Una herramienta **100% GRATUITA** para generar guiones profesionales de YouTube de **30+ minutos** usando Inteligencia Artificial.

## ✨ Características Principales

- 📝 **Guiones Ultra Largos**: Genera guiones de 30-120 minutos (7,500+ palabras)
- 🆓 **100% Gratis**: Usa Groq (API gratuita) u Ollama (local, sin límites)
- 🎙️ **Integración con Whisper**: Transcribe audio y conviértelo en guiones
- 🔍 **Investigación de Temas**: Obtén investigación profunda antes de generar
- 📊 **Múltiples Nichos**: Tecnología, negocios, educación, salud y más
- 🎨 **Interfaz Profesional**: UI moderna y fácil de usar
- 💾 **Exportación**: Copia o descarga tus guiones en .txt
- 🌐 **Deploy Online**: Despliega gratis en Vercel, Netlify, Railway o Render

## 🌍 NUEVO: Úsalo Online (100% Gratis)

**¿Quieres usar la herramienta sin instalar nada?**

Despliégala online en 5 minutos:

### ⚡ Deploy Rápido en Vercel (Recomendado)

```bash
# 1. Sube a GitHub
git init
git add .
git commit -m "Initial commit"
gh repo create guion-youtube-ia --public --source=. --push

# 2. Deploy en Vercel
npm install -g vercel
vercel login
vercel
vercel env add GROQ_API_KEY  # Pega tu clave de Groq
vercel --prod

# ✅ ¡Listo! Tu app está online
```

**📚 Guías completas:**
- [DEPLOY_RAPIDO.md](DEPLOY_RAPIDO.md) - Deploy en 5 minutos
- [DEPLOYMENT.md](DEPLOYMENT.md) - Guía completa para todas las plataformas

**Plataformas soportadas:**
- ✅ Vercel (Recomendado - Lo más fácil)
- ✅ Netlify (Alternativa popular)
- ✅ Railway (Backend tradicional)
- ✅ Render (100% gratis)

---

## 🚀 Inicio Rápido (Local)

### Opción 1: Usar Groq (Recomendado - Más fácil)

1. **Obtén tu API Key de Groq** (100% gratis):
   - Ve a [console.groq.com](https://console.groq.com)
   - Crea una cuenta gratuita
   - Genera tu API key

2. **Instala las dependencias**:
```bash
npm install
```

3. **Configura tu API Key**:
```bash
cp .env.example .env
```
Edita `.env` y agrega tu clave:
```
GROQ_API_KEY=tu_clave_aqui
```

4. **Inicia el servidor**:
```bash
npm start
```

5. **Abre tu navegador**:
```
http://localhost:3000
```

### Opción 2: Usar Ollama (100% Local, Sin Límites)

1. **Instala Ollama**:
   - Descarga desde [ollama.ai](https://ollama.ai)
   - Instala en tu sistema

2. **Descarga un modelo**:
```bash
ollama pull llama2
# o
ollama pull mistral
```

3. **Inicia Ollama**:
```bash
ollama serve
```

4. **Instala dependencias e inicia**:
```bash
npm install
npm start
```

5. **Abre tu navegador**:
```
http://localhost:3000
```
Selecciona "Ollama" en el motor de IA.

## 📖 Cómo Usar

### 1. Generar Guion Desde Cero

1. Ve a la pestaña "📝 Generar Guion"
2. Ingresa el tema de tu video
3. Selecciona el nicho (tecnología, negocios, etc.)
4. Elige la duración deseada (30-120 minutos)
5. Selecciona el tono (profesional, casual, educativo, etc.)
6. Haz clic en "🚀 Generar Guion"
7. Espera 30-60 segundos mientras la IA crea tu guion extenso

**Resultado**: Un guion profesional y estructurado con:
- Introducción atractiva
- Múltiples secciones detalladas
- Ejemplos y casos prácticos
- Preguntas frecuentes
- Conclusión y llamada a la acción

### 2. Transcribir Audio con Whisper

#### Opción A: Usar Groq Whisper (Recomendado)

1. Configura tu `GROQ_API_KEY` en `.env`
2. Ve a la pestaña "🎙️ Transcribir con Whisper"
3. Pega la URL de tu audio o sube el archivo
4. Haz clic en "🎙️ Procesar Transcripción"

#### Opción B: Whisper Local (100% Gratis)

1. Instala Whisper:
```bash
pip install openai-whisper
```

2. Transcribe tu audio:
```bash
whisper audio.mp3 --model medium --language es
```

3. Copia la transcripción resultante
4. Pégala en el campo "O pega tu transcripción aquí"
5. Haz clic en "📝 Convertir a Guion Profesional"

### 3. Investigar un Tema

1. Ve a la pestaña "🔍 Investigar Tema"
2. Ingresa el tema que quieres investigar
3. Selecciona cuántos subtemas quieres explorar
4. Haz clic en "🔍 Investigar Tema"

**Resultado**: Investigación profunda con:
- Contexto e historia del tema
- Estado actual y tendencias
- Subtemas importantes
- Preguntas frecuentes de la audiencia

## 🎯 Características Avanzadas

### Estructura de Guiones Generados

Cada guion incluye:

1. **Introducción Poderosa** (800-1000 palabras)
   - Gancho inicial
   - Estadísticas impactantes
   - Establecimiento de credibilidad

2. **Contenido Principal** (Múltiples secciones)
   - Explicaciones paso a paso
   - Ejemplos concretos
   - Analogías y metáforas
   - Datos y estadísticas

3. **Ejemplos Prácticos** (1500-2000 palabras)
   - 3-5 casos de estudio detallados
   - Análisis en profundidad
   - Resultados y métricas

4. **Preguntas Frecuentes** (1000-1500 palabras)
   - 5-7 preguntas comunes
   - Respuestas extensas
   - Anticipación de objeciones

5. **Conclusión y CTA** (600-800 palabras)
   - Resumen de puntos clave
   - Inspiración a la acción
   - Llamada a la acción clara

### Duración y Palabras

| Duración | Palabras Aprox. | Caracteres |
|----------|-----------------|------------|
| 10 min   | 2,500           | 15,000     |
| 20 min   | 5,000           | 30,000     |
| 30 min   | 7,500           | 45,000     |
| 45 min   | 11,250          | 67,500     |
| 60 min   | 15,000          | 90,000     |

## 🔧 Configuración Avanzada

### Variables de Entorno

Crea un archivo `.env` con:

```env
# API Keys (Opcional)
GROQ_API_KEY=tu_clave_de_groq

# Configuración del servidor
PORT=3000

# Configuración de Ollama (Local)
OLLAMA_HOST=http://localhost:11434
```

### Modelos Disponibles

#### Groq (API - Gratis)
- `mixtral-8x7b-32768` - Rápido, contexto largo (por defecto)
- `llama2-70b-4096` - Muy preciso
- `gemma-7b-it` - Ligero y rápido

#### Ollama (Local - Gratis)
- `llama2` - Equilibrado (por defecto)
- `mistral` - Muy rápido
- `codellama` - Excelente para temas técnicos
- `llama3` - Última versión (si está disponible)

Para cambiar el modelo en Ollama, edita `config/iaProviders.js`:
```javascript
const {
  model = 'mistral', // Cambia aquí
  temperature = 0.7
} = opciones;
```

## 🎨 Personalización

### Tonos Disponibles

- **Profesional**: Serio, informado, confiable
- **Casual**: Relajado, amigable, conversacional
- **Educativo**: Claro, didáctico, paso a paso
- **Motivacional**: Inspirador, energético, positivo
- **Entretenido**: Divertido, enganchante, dinámico
- **Técnico**: Preciso, detallado, especializado

### Nichos Soportados

- General
- Tecnología
- Educación
- Negocios
- Salud y Bienestar
- Entretenimiento
- Ciencia
- Finanzas
- Marketing
- Desarrollo Personal

## 💡 Tips para Mejores Resultados

1. **Sé específico con el tema**: En lugar de "IA", usa "Inteligencia Artificial en Marketing Digital 2025"

2. **Usa la investigación primero**: Investiga el tema antes de generar el guion para contenido más rico

3. **Ajusta la duración**: Para temas complejos, usa duraciones más largas (45-60 min)

4. **Combina métodos**: Investiga → Genera guion → Expande secciones específicas

5. **Revisa y personaliza**: La IA genera el borrador, tú le das el toque final

## 🛠️ Solución de Problemas

### Error: "GROQ_API_KEY no configurada"

**Solución**:
1. Crea un archivo `.env` en la raíz del proyecto
2. Agrega tu clave: `GROQ_API_KEY=tu_clave`
3. Reinicia el servidor

### Error: "Ollama no está disponible"

**Solución**:
1. Asegúrate de tener Ollama instalado
2. Inicia Ollama: `ollama serve`
3. Verifica que esté corriendo: `curl http://localhost:11434/api/tags`

### El guion es muy corto

**Solución**:
1. Aumenta la duración objetivo
2. Usa el proveedor Groq (genera más contenido)
3. Después de generar, usa la función de expandir guion

### Error de límite de tokens

**Solución**:
1. Reduce la duración del guion
2. Genera por secciones y combínalas manualmente
3. Usa Ollama (sin límites)

## 📊 API Endpoints

Si quieres integrar esta herramienta en otros proyectos:

### POST `/api/generar-guion`

```json
{
  "tema": "Inteligencia Artificial",
  "nicho": "tecnologia",
  "duracion": 30,
  "tono": "profesional",
  "incluirIntro": true,
  "incluirOutro": true,
  "provider": "groq"
}
```

**Respuesta**:
```json
{
  "success": true,
  "guion": "...",
  "palabras": 7500,
  "caracteres": 45000
}
```

### POST `/api/contenido-relacionado`

```json
{
  "tema": "Blockchain",
  "cantidad": 5
}
```

### POST `/api/expandir-guion`

```json
{
  "guionActual": "...",
  "seccionesAExpandir": ["introducción", "ejemplos"],
  "provider": "groq"
}
```

## 🤝 Contribuir

Las contribuciones son bienvenidas! Si quieres mejorar esta herramienta:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

MIT License - Usa libremente en proyectos personales y comerciales.

## 🙏 Agradecimientos

- [Groq](https://groq.com) - Por proporcionar API de IA súper rápida y gratuita
- [Ollama](https://ollama.ai) - Por hacer IA local accesible
- [OpenAI Whisper](https://github.com/openai/whisper) - Por la transcripción de audio

## 📧 Soporte

Si tienes problemas o preguntas:
1. Revisa la sección de Solución de Problemas
2. Abre un Issue en GitHub
3. Lee la documentación de [Groq](https://console.groq.com/docs) o [Ollama](https://ollama.ai)

---

**¡Crea guiones increíbles y haz crecer tu canal de YouTube! 🚀📹**
