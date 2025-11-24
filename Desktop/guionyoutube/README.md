# 🎯 Generador Universal de Guiones con IA - SaaS Completo

**La herramienta definitiva 100% GRATUITA** para generar guiones profesionales para YouTube, Libros, Películas, Videojuegos y Artículos usando Inteligencia Artificial.

---

## ✨ Características Principales

### 📝 **YouTube - Videos Largos**
- Genera guiones de 30-120 minutos (7,500+ palabras)
- Estructura completa: intro, contenido, ejemplos, FAQs, conclusión
- Hooks y retención de audiencia
- Sugerencias de B-Roll y música
- Transcripción con Whisper
- Investigación de temas profunda

### 📚 **Libros Completos**
- Estructura de 5-50 capítulos
- Desarrollo de personajes detallado
- Sinopsis y arco narrativo
- Escenas clave y diálogos
- Worldbuilding para fantasía/sci-fi
- Temas y subtextos
- Notas del autor
- 3,000+ palabras por capítulo

### 🎬 **Películas y Cortometrajes**
- Guiones cinematográficos formato profesional
- Logline y sinopsis
- Tratamiento completo
- Estructura en 3 actos
- Escaleta (beat sheet)
- Desarrollo de escenas y diálogos
- Indicaciones de producción
- Guía de locaciones y estética
- 30-180 minutos de duración

### 🎮 **Videojuegos (GDD)**
- Game Design Document completo
- Mecánicas de juego detalladas
- Narrativa y worldbuilding
- Sistema de progresión
- Diseño de niveles (hasta 15 niveles)
- Sistema de combate
- UI/UX y arte
- Economía del juego
- Monetización y tecnología

### 📄 **Artículos Profesionales**
- Artículos SEO-optimizados
- 500-10,000 palabras
- Meta descripción y keywords
- Tabla de contenidos
- Ejemplos prácticos y estadísticas
- Tips accionables
- FAQs optimizadas para snippets
- Sugerencias de imágenes
- Call-to-Action efectivos
- Tipos: blog, tutorial, opinión, investigación, noticia, guía

---

## 🚀 Inicio Rápido

### Instalación Local

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-usuario/guionyoutube.git
cd guionyoutube

# 2. Instalar dependencias
npm install

# 3. Configurar API Key de Groq (gratis en console.groq.com)
cp .env.example .env
# Edita .env y agrega: GROQ_API_KEY=tu_clave_aqui

# 4. Iniciar servidor
npm start

# 5. Abrir navegador
# http://localhost:3000
```

### Deploy Online (Recomendado)

#### Opción A: Vercel (Lo más fácil)
```bash
npm install -g vercel
vercel login
vercel
vercel env add GROQ_API_KEY  # Pega tu clave
vercel --prod
```

#### Opción B: Netlify
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
netlify env:set GROQ_API_KEY "tu_clave_aqui"
```

---

## 📖 Guía de Uso por Tipo de Contenido

### 📝 YouTube

1. Ve a la tab "📝 YouTube"
2. Ingresa el tema de tu video
3. Selecciona nicho (tecnología, negocios, educación, etc.)
4. Elige duración (30-120 minutos)
5. Selecciona tono (profesional, casual, educativo, etc.)
6. Haz clic en "🚀 Generar Guion"

**Resultado**: Guion completo con introducción, múltiples secciones, ejemplos, FAQs, conclusión, hooks de retención, sugerencias de B-Roll y música.

---

### 📚 Libros

1. Ve a la tab "📚 Libros"
2. Ingresa el título del libro
3. Selecciona género (ficción, fantasía, thriller, etc.)
4. Describe el tema/concepto en detalle
5. Configura:
   - Número de capítulos (5-50)
   - Palabras por capítulo (1,000-10,000)
   - Tono (narrativo, descriptivo, poético, directo)
6. Marca opciones:
   - ✅ Incluir Personajes
   - ✅ Incluir Sinopsis
   - ✅ Incluir Arco Narrativo
7. Haz clic en "📚 Generar Guion de Libro"

**Resultado**:
- Concepto del libro
- Sinopsis completa
- 5-8 personajes desarrollados
- Arco narrativo en fases
- Estructura de cada capítulo
- Escenas clave
- Diálogos destacados
- Temas y subtextos
- Worldbuilding (si aplica)
- Notas del autor

**Palabras totales**: numeroCapitulos × palabrasPorCapitulo + ~10,000 palabras adicionales de estructura

---

### 🎬 Películas

1. Ve a la tab "🎬 Películas"
2. Ingresa el título de la película
3. Selecciona género (drama, comedia, acción, thriller, etc.)
4. Describe el tema/sinopsis
5. Configura:
   - Duración en minutos (30-180)
   - Formato (largometraje/cortometraje)
   - Tono (serio, cómico, épico, intimista, experimental)
6. Marca opciones:
   - ✅ Incluir Tratamiento
   - ✅ Incluir Personajes
   - ✅ Incluir Escenas
7. Haz clic en "🎬 Generar Guion de Película"

**Resultado**:
- Portada profesional
- Logline y sinopsis (corta y extendida)
- Tratamiento cinematográfico (2,000-3,000 palabras)
- Desarrollo de 4-6 personajes
- Estructura en 3 actos detallada
- Escaleta con 30-50 beats
- Hasta 20 escenas escritas en formato de guion
- 8-10 diálogos clave memorables
- Indicaciones de producción
- Descripción de locaciones
- Guía de atmósfera y estética visual
- Diseño de música y sonido

**Formato**: Guion cinematográfico profesional (1 página ≈ 1 minuto)

---

### 🎮 Videojuegos

1. Ve a la tab "🎮 Videojuegos"
2. Ingresa el título del juego
3. Selecciona género (acción, RPG, estrategia, aventura, etc.)
4. Describe el concepto del juego
5. Configura:
   - Plataforma (PC, consolas, mobile, multiplataforma)
   - Tipo (single-player, multiplayer, co-op)
   - Duración estimada en horas (5-200)
6. Marca opciones:
   - ✅ Incluir Narrativa
   - ✅ Incluir Mecánicas
   - ✅ Incluir Niveles
   - ✅ Incluir Personajes
7. Haz clic en "🎮 Generar GDD"

**Resultado - Game Design Document (GDD)**:
- Concepto y visión del juego
- Resumen ejecutivo
- Mecánicas de juego principales (core loop)
- Narrativa completa con lore
- 5-8 personajes desarrollados
- Sistema de progresión del jugador
- Hasta 15 niveles diseñados detalladamente
- Sistema de combate y desafíos
- Interfaces UI/UX
- Dirección de arte y estética
- Diseño de audio y música
- Economía del juego
- Funcionalidades multijugador (si aplica)
- Monetización y modelo de negocio
- Tecnología y herramientas recomendadas

**Total**: 15,000-25,000 palabras de documentación completa

---

### 📄 Artículos

1. Ve a la tab "📝 Artículos"
2. Ingresa el título del artículo
3. Selecciona tipo (blog, tutorial, opinión, investigación, noticia, guía)
4. Describe el tema
5. Configura:
   - Palabras objetivo (500-10,000)
   - Nicho (tecnología, negocios, salud, educación, etc.)
   - Tono (profesional, casual, académico, conversacional, técnico)
   - Audiencia (general, principiantes, profesionales, expertos)
6. Marca opciones:
   - ✅ Incluir SEO
   - ✅ Incluir Sugerencias de Imágenes
   - ✅ Incluir CTA
7. Haz clic en "📝 Generar Artículo"

**Resultado**:
- Título optimizado (H1) + 3-5 alternativas
- Meta Title, Meta Description, Keywords
- URL slug optimizado
- Introducción atractiva con hook
- Tabla de contenidos clickeable
- 5-10 secciones principales desarrolladas
- 3-5 ejemplos prácticos
- 8-12 estadísticas relevantes
- 7-10 tips accionables
- 6-10 FAQs optimizadas para featured snippets
- Sugerencias de 5-8 imágenes con alt text
- Recursos y herramientas recomendadas
- Conclusión poderosa
- 3 versiones de Call-to-Action
- Keywords primarias, secundarias y long-tail

**SEO**: Completamente optimizado para motores de búsqueda

---

## 🔧 Configuración Avanzada

### Variables de Entorno

```env
# API Keys
GROQ_API_KEY=tu_clave_de_groq  # Gratis en console.groq.com

# Servidor
PORT=3000

# Ollama (Opcional - 100% local)
OLLAMA_HOST=http://localhost:11434
```

### Modelos de IA Disponibles

#### Groq (API Gratuita)
- `mixtral-8x7b-32768` - Rápido, contexto largo (por defecto)
- `llama2-70b-4096` - Muy preciso
- `gemma-7b-it` - Ligero y rápido

#### Ollama (Local - Sin límites)
```bash
# Instalar Ollama
# Descargar desde: https://ollama.ai

# Descargar modelos
ollama pull llama2
ollama pull mistral
ollama pull codellama

# Iniciar servidor
ollama serve
```

---

## 🎨 Personalización

### Tonos Disponibles

**Para YouTube/Artículos:**
- **Profesional**: Serio, informado, confiable
- **Casual**: Relajado, amigable, conversacional
- **Educativo**: Claro, didáctico, paso a paso
- **Motivacional**: Inspirador, energético, positivo
- **Entretenido**: Divertido, enganchante, dinámico
- **Técnico**: Preciso, detallado, especializado

**Para Libros:**
- **Narrativo**: Fluido, storytelling natural
- **Descriptivo**: Rico en detalles, inmersivo
- **Poético**: Lírico, metafórico, artístico
- **Directo**: Claro, conciso, al grano

**Para Películas:**
- **Serio**: Dramático, profundo
- **Cómico**: Ligero, divertido
- **Épico**: Grand escala, heroico
- **Intimista**: Personal, cercano
- **Experimental**: Innovador, vanguardista

---

## 💡 Tips para Mejores Resultados

### General
1. **Sé específico**: En lugar de "IA", usa "Inteligencia Artificial en el Marketing Digital 2025"
2. **Usa el campo de tema extensamente**: Cuanto más detalle des, mejor será el resultado
3. **Revisa y personaliza**: La IA genera el borrador, tú le das el toque final

### YouTube
- Usa la función de investigación primero para contenido más rico
- Para temas complejos, usa duraciones más largas (45-60 min)
- Combina métodos: Investiga → Genera → Expande secciones específicas

### Libros
- Define bien el género para que el worldbuilding sea apropiado
- Para libros largos, genera en partes (primeros 10 caps, luego siguientes 10)
- Usa el arco narrativo como guía antes de desarrollar capítulos

### Películas
- El tratamiento es tu mejor amigo - siempre inclúyelo
- Revisa la escaleta antes de escribir escenas completas
- Para cortometrajes (< 30 min), menos escenas pero más detalladas

### Videojuegos
- Define bien el core loop (mecánica principal) desde el inicio
- La narrativa debe servir al gameplay, no al revés
- Piensa en la progresión: ¿cómo mantener al jugador enganchado?

### Artículos
- Siempre activa el SEO para máxima visibilidad
- Usa keywords en títulos de secciones naturalmente
- Las FAQs son gold para featured snippets de Google
- Los CTAs deben ofrecer valor real

---

## 📊 API Endpoints

### POST `/api/generar-guion` (YouTube)
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

### POST `/api/generar-libro`
```json
{
  "titulo": "El Último Guardián",
  "tema": "Fantasía épica sobre...",
  "genero": "fantasia",
  "numeroCapitulos": 20,
  "palabrasPorCapitulo": 3000,
  "tono": "narrativo",
  "incluirPersonajes": true,
  "incluirSinopsis": true,
  "incluirArcoNarrativo": true,
  "provider": "groq"
}
```

### POST `/api/generar-pelicula`
```json
{
  "titulo": "Sombras del Pasado",
  "tema": "Un detective debe enfrentar...",
  "genero": "thriller",
  "duracion": 90,
  "formato": "largometraje",
  "tono": "serio",
  "incluirTratamiento": true,
  "incluirPersonajes": true,
  "incluirEscenas": true,
  "provider": "groq"
}
```

### POST `/api/generar-videojuego`
```json
{
  "titulo": "Echoes of Tomorrow",
  "tema": "RPG cyberpunk donde...",
  "genero": "rpg",
  "plataforma": "multiplataforma",
  "tipoJuego": "single-player",
  "duracion": 40,
  "incluirNarrativa": true,
  "incluirMecanicas": true,
  "incluirNiveles": true,
  "incluirPersonajes": true,
  "provider": "groq"
}
```

### POST `/api/generar-articulo`
```json
{
  "titulo": "Guía Completa de SEO 2025",
  "tema": "Todo sobre optimización...",
  "tipo": "guia",
  "palabrasObjetivo": 3000,
  "nichoArticulo": "marketing",
  "tono": "profesional",
  "audiencia": "profesionales",
  "incluirSEO": true,
  "incluirImagenes": true,
  "incluirCTA": true,
  "provider": "groq"
}
```

**Todos los endpoints retornan:**
```json
{
  "success": true,
  "guion": "contenido generado...",
  "palabras": 7500,
  "caracteres": 45000,
  "tipo": "libro"
}
```

---

## 🛠️ Solución de Problemas

### Error: "GROQ_API_KEY no configurada"
**Solución**:
1. Ve a [console.groq.com](https://console.groq.com)
2. Crea cuenta gratuita
3. Genera API key
4. Agrégala en `.env`: `GROQ_API_KEY=tu_clave`
5. Reinicia el servidor

### Error: "Ollama no está disponible"
**Solución**:
1. Descarga Ollama: [ollama.ai](https://ollama.ai)
2. Instala en tu sistema
3. Ejecuta: `ollama serve`
4. Descarga un modelo: `ollama pull llama2`
5. Selecciona "Ollama" en la interfaz

### El contenido es muy corto
**Solución**:
- Aumenta la duración/palabras objetivo
- Usa Groq (genera más contenido que Ollama)
- Agrega más contexto en el campo de tema
- Activa todas las opciones (personajes, sinopsis, etc.)

### Error de límite de tokens
**Solución**:
- Reduce la duración/palabras objetivo
- Genera en partes (ej: libros de 10 caps a la vez)
- Usa Ollama (sin límites)

### El guion no es relevante
**Solución**:
- Sé MUY específico en el tema
- Usa el investigador de temas primero
- Selecciona el nicho/género correcto
- Agrega contexto y detalles

---

## 🌟 Ejemplos de Uso

### Caso 1: Creador de Contenido YouTube
**Necesidad**: Video de 45 minutos sobre "Criptomonedas 2025"

**Proceso**:
1. Tab "🔍 Investigar" → Investiga "Criptomonedas 2025"
2. Lee la investigación
3. Tab "📝 YouTube" → Genera guion de 45 min
4. Revisa secciones de hooks y B-Roll
5. Personaliza con tu estilo

**Resultado**: Guion de ~11,000 palabras listo para grabar

---

### Caso 2: Escritor de Novelas
**Necesidad**: Novela de fantasía de 30 capítulos

**Proceso**:
1. Tab "📚 Libros"
2. Título: "El Último Guardián"
3. Género: Fantasía
4. Tema: "Historia épica sobre un guardián que debe proteger..."
5. 30 capítulos × 3,000 palabras
6. Activa todo

**Resultado**:
- 90,000 palabras de estructura
- 8 personajes desarrollados
- 30 capítulos con esquema completo
- Worldbuilding detallado

---

### Caso 3: Guionista Indie
**Necesidad**: Cortometraje de 15 minutos

**Proceso**:
1. Tab "🎬 Películas"
2. Duración: 15 minutos
3. Formato: Cortometraje
4. Género: Drama
5. Tema: "Dos extraños se encuentran en..."

**Resultado**:
- Guion de 15 páginas
- 5-7 escenas completas con diálogos
- Indicaciones de producción
- Guía visual y de sonido

---

### Caso 4: Indie Game Developer
**Necesidad**: GDD para juego de puzzles

**Proceso**:
1. Tab "🎮 Videojuegos"
2. Género: Puzzle
3. Plataforma: Mobile
4. Duración: 10 horas
5. Concepto: "Juego de puzzles donde..."

**Resultado**:
- GDD completo de ~12,000 palabras
- 5 niveles diseñados
- Mecánicas core definidas
- UI/UX mockups descritos
- Monetización planificada

---

### Caso 5: Blogger SEO
**Necesidad**: Artículo de 3,000 palabras sobre "Marketing Digital"

**Proceso**:
1. Tab "📝 Artículos"
2. Tipo: Guía
3. Palabras: 3,000
4. Nicho: Marketing
5. Activa todo (SEO, imágenes, CTA)

**Resultado**:
- Artículo completo optimizado
- 15+ keywords identificadas
- 8 sugerencias de imágenes
- FAQs para featured snippets
- 3 CTAs diferentes

---

## 📈 Estadísticas de Generación

| Tipo | Tiempo Generación | Palabras Promedio | Tokens Usados |
|------|-------------------|-------------------|---------------|
| YouTube (30 min) | 45-90s | 7,500 | ~25,000 |
| Libro (20 caps) | 5-8 min | 70,000+ | ~120,000 |
| Película (90 min) | 3-5 min | 25,000+ | ~50,000 |
| Videojuego | 6-10 min | 20,000+ | ~80,000 |
| Artículo (2000) | 30-60s | 4,000+ | ~12,000 |

*Tiempos con Groq API. Ollama puede ser más lento dependiendo de hardware.*

---

## 🔒 Privacidad y Seguridad

- ✅ Todo el procesamiento en tu servidor o Groq (no almacenamos datos)
- ✅ Historial guardado localmente en tu navegador
- ✅ API keys encriptadas en variables de entorno
- ✅ No se comparte contenido con terceros
- ✅ 100% open source - auditable

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

```bash
# 1. Fork el proyecto
# 2. Crea tu rama
git checkout -b feature/MiNuevaCaracteristica

# 3. Commit tus cambios
git commit -m 'Agrega nueva característica'

# 4. Push a la rama
git push origin feature/MiNuevaCaracteristica

# 5. Abre un Pull Request
```

---

## 📝 Licencia

MIT License - Usa libremente en proyectos personales y comerciales.

---

## 🙏 Agradecimientos

- [Groq](https://groq.com) - API de IA súper rápida y gratuita
- [Ollama](https://ollama.ai) - IA local accesible
- [OpenAI Whisper](https://github.com/openai/whisper) - Transcripción de audio
- Comunidad open source

---

## 📧 Soporte

¿Problemas o preguntas?

1. 📖 Lee esta documentación
2. 🔍 Busca en [Issues de GitHub](https://github.com/tu-usuario/guionyoutube/issues)
3. 🐛 Reporta bugs con detalles
4. 💬 Únete a nuestra comunidad

---

## 🚀 Roadmap

### Próximas Funcionalidades

- [ ] **Modo colaborativo** - Edición en tiempo real
- [ ] **Exportación a PDF/DOCX** con formato
- [ ] **Templates predefinidos** por nicho
- [ ] **Generación con imágenes** usando DALL-E/Stable Diffusion
- [ ] **Voiceover automático** para videos
- [ ] **Traducción automática** a 50+ idiomas
- [ ] **API pública** para integración
- [ ] **Extensión de Chrome** para generación rápida
- [ ] **App móvil** iOS y Android
- [ ] **Marketplace de templates** comunitarios

---

**¡Crea contenido increíble sin límites! 🚀📹📚🎬🎮📝**
