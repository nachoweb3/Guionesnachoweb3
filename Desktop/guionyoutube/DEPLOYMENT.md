# 🚀 Guía de Deployment - Usar Online GRATIS

Esta guía te muestra cómo desplegar tu generador de guiones en la nube **100% GRATIS**.

## 📋 Tabla de Contenidos

1. [Vercel (Recomendado)](#vercel) - Lo más fácil
2. [Netlify](#netlify) - Alternativa popular
3. [Railway](#railway) - Backend tradicional
4. [Render](#render) - Backend gratis

---

## 🏆 Opción 1: Vercel (RECOMENDADO)

**Por qué Vercel:**
- ✅ Súper fácil de usar
- ✅ Deploy en 2 minutos
- ✅ 100% gratis para proyectos personales
- ✅ SSL automático (HTTPS)
- ✅ CDN global
- ✅ Actualizaciones automáticas desde GitHub

### Paso a Paso:

#### 1. Preparar el Proyecto

```bash
# Asegúrate de tener todo commiteado
git init
git add .
git commit -m "Initial commit"
```

#### 2. Subir a GitHub

```bash
# Crear repositorio en GitHub primero en https://github.com/new
# Luego conectar tu proyecto local:

git remote add origin https://github.com/TU_USUARIO/guion-youtube-ia.git
git branch -M main
git push -u origin main
```

#### 3. Desplegar en Vercel

**Opción A: Desde el Dashboard (Más fácil)**

1. Ve a [vercel.com](https://vercel.com)
2. Regístrate con tu cuenta de GitHub
3. Click en "Add New Project"
4. Selecciona tu repositorio `guion-youtube-ia`
5. Vercel detectará automáticamente la configuración
6. En "Environment Variables" agrega:
   ```
   GROQ_API_KEY = tu_clave_de_groq
   ```
7. Click en "Deploy"
8. ¡Listo! En 2 minutos tendrás tu URL

**Opción B: Desde CLI**

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Agregar variable de entorno
vercel env add GROQ_API_KEY

# Deploy a producción
vercel --prod
```

#### 4. Configurar Variables de Entorno

En el dashboard de Vercel:
1. Ve a tu proyecto
2. Settings → Environment Variables
3. Agrega:
   - `GROQ_API_KEY`: Tu clave de Groq
   - `NODE_ENV`: production

#### 5. Acceder a tu App

Tu app estará en: `https://tu-proyecto.vercel.app`

### Actualizaciones Automáticas

Cada vez que hagas push a GitHub, Vercel desplegará automáticamente:

```bash
git add .
git commit -m "Mejoras al generador"
git push
# ✅ Vercel despliega automáticamente
```

---

## 🌐 Opción 2: Netlify

**Por qué Netlify:**
- ✅ Gratis ilimitado
- ✅ Funciones serverless incluidas
- ✅ Muy popular y confiable
- ✅ SSL automático

### Paso a Paso:

#### 1. Preparar y Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/guion-youtube-ia.git
git push -u origin main
```

#### 2. Desplegar en Netlify

**Opción A: Desde el Dashboard**

1. Ve a [netlify.com](https://netlify.com)
2. Regístrate con GitHub
3. Click en "Add new site" → "Import an existing project"
4. Conecta con GitHub y selecciona tu repo
5. Netlify detectará `netlify.toml` automáticamente
6. En "Environment variables" agrega:
   ```
   GROQ_API_KEY = tu_clave
   ```
7. Click en "Deploy site"

**Opción B: Desde CLI**

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy a producción
netlify deploy --prod
```

#### 3. Configurar Variables de Entorno

En Netlify Dashboard:
1. Site settings → Environment variables
2. Agrega `GROQ_API_KEY`

#### 4. Acceder a tu App

Tu app estará en: `https://tu-proyecto.netlify.app`

**Nota:** En Netlify, Ollama NO estará disponible (solo Groq), ya que es serverless.

---

## 🚂 Opción 3: Railway

**Por qué Railway:**
- ✅ Soporta backend Node.js tradicional
- ✅ $5/mes gratis
- ✅ Puede usar Ollama (con configuración adicional)
- ✅ Base de datos incluida si la necesitas

### Paso a Paso:

#### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/guion-youtube-ia.git
git push -u origin main
```

#### 2. Desplegar en Railway

1. Ve a [railway.app](https://railway.app)
2. Regístrate con GitHub
3. Click en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Elige tu repositorio
6. Railway detectará automáticamente que es Node.js
7. En Variables → Add Variable:
   ```
   GROQ_API_KEY = tu_clave
   PORT = 3000
   ```
8. Click en "Deploy"

#### 3. Configurar Dominio

1. En tu proyecto Railway, ve a "Settings"
2. Click en "Generate Domain"
3. Tendrás una URL como: `https://tu-proyecto.up.railway.app`

#### 4. Ver Logs

Railway te muestra logs en tiempo real para debugging.

---

## 🎨 Opción 4: Render

**Por qué Render:**
- ✅ 100% gratis (con límites)
- ✅ Muy fácil de usar
- ✅ SSL automático
- ✅ Auto-sleep después de inactividad

### Paso a Paso:

#### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/guion-youtube-ia.git
git push -u origin main
```

#### 2. Desplegar en Render

1. Ve a [render.com](https://render.com)
2. Regístrate con GitHub
3. Click en "New +" → "Web Service"
4. Conecta tu repositorio GitHub
5. Configuración:
   - **Name:** guion-youtube-ia
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free
6. En "Environment Variables" agrega:
   ```
   GROQ_API_KEY = tu_clave
   NODE_ENV = production
   ```
7. Click en "Create Web Service"

#### 3. Acceder a tu App

Tu app estará en: `https://tu-proyecto.onrender.com`

**Nota:** En el plan gratuito, la app se "duerme" después de 15 min de inactividad. El primer request puede tardar 30 segundos en "despertar".

---

## 🆚 Comparación de Plataformas

| Plataforma | Precio | Facilidad | Velocidad | Ollama | Auto Deploy |
|------------|--------|-----------|-----------|--------|-------------|
| **Vercel** | Gratis | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡⚡ | ❌ | ✅ |
| **Netlify** | Gratis | ⭐⭐⭐⭐⭐ | ⚡⚡⚡⚡ | ❌ | ✅ |
| **Railway** | $5 gratis/mes | ⭐⭐⭐⭐ | ⚡⚡⚡⚡ | ⚠️ Posible | ✅ |
| **Render** | Gratis | ⭐⭐⭐⭐ | ⚡⚡⚡ | ❌ | ✅ |

### Recomendaciones:

- **Para la mayoría:** Vercel (lo más fácil y rápido)
- **Si prefieres Netlify:** Netlify (igual de fácil)
- **Si necesitas backend tradicional:** Railway o Render
- **Si quieres Ollama:** Necesitas servidor VPS (no serverless)

---

## 🔑 Configurar API Keys

### Obtener Groq API Key (Gratis)

1. Ve a [console.groq.com](https://console.groq.com)
2. Regístrate gratis
3. Ve a "API Keys"
4. Click en "Create API Key"
5. Copia la clave (empieza con `gsk_...`)
6. Agrégala como variable de entorno en tu plataforma

### Agregar Variables de Entorno

**En Vercel:**
```
Settings → Environment Variables → Add
```

**En Netlify:**
```
Site settings → Environment variables → Add variable
```

**En Railway:**
```
Variables → New Variable
```

**En Render:**
```
Environment → Add Environment Variable
```

---

## 🔄 Workflow Recomendado

### 1. Desarrollo Local

```bash
# Trabajar localmente
npm run dev

# Hacer cambios
# Probar en localhost:3000
```

### 2. Commit y Push

```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

### 3. Deploy Automático

- ✅ Vercel/Netlify/Railway/Render detectan el push
- ✅ Despliegan automáticamente
- ✅ Recibes notificación cuando termina
- ✅ Tu app se actualiza en vivo

---

## 🐛 Solución de Problemas

### Error: "Build failed"

**Solución:**
1. Verifica que `package.json` tenga todas las dependencias
2. Asegúrate de que `"type": "module"` esté en package.json
3. Revisa los logs de build en tu plataforma

### Error: "GROQ_API_KEY not configured"

**Solución:**
1. Ve a las variables de entorno de tu plataforma
2. Agrega `GROQ_API_KEY` con tu clave
3. Redeploy la aplicación

### Error: "Function timeout"

**Solución:**
- Guiones muy largos (120+ min) pueden tardar más de lo permitido
- Reduce la duración objetivo a 30-60 minutos
- Vercel/Netlify tienen timeout de 10 segundos (plan gratis)
- Railway/Render tienen timeouts más largos

### La app es lenta en Render

**Solución:**
- Es normal en el plan gratuito (cold start)
- La primera carga tarda ~30 seg después de inactividad
- Considera Railway o Vercel para mejor performance

---

## 📊 Monitoreo y Logs

### Vercel
```bash
vercel logs [deployment-url]
```

### Netlify
```bash
netlify logs
```

### Railway
- Logs en tiempo real en el dashboard
- Click en "View Logs"

### Render
- Logs automáticos en el dashboard
- Actualización en tiempo real

---

## 🎯 Después del Deployment

### Tu App Estará Disponible En:

- **Vercel:** `https://tu-proyecto.vercel.app`
- **Netlify:** `https://tu-proyecto.netlify.app`
- **Railway:** `https://tu-proyecto.up.railway.app`
- **Render:** `https://tu-proyecto.onrender.com`

### Compartir tu App:

1. Copia la URL de tu deployment
2. Compártela con quien quieras
3. Funciona igual que localhost, pero online
4. SSL (HTTPS) automático

### Dominio Personalizado (Opcional):

Todas las plataformas permiten dominios custom gratis:
1. Compra un dominio (ej: Namecheap, Google Domains)
2. En tu plataforma, ve a Settings → Domains
3. Agrega tu dominio y sigue las instrucciones
4. Espera propagación DNS (1-24 horas)

---

## 🚀 Inicio Rápido - Vercel (1 Minuto)

```bash
# 1. Instalar Vercel CLI
npm install -g vercel

# 2. Desde tu proyecto
cd guionyoutube

# 3. Deploy
vercel

# 4. Agregar API Key
vercel env add GROQ_API_KEY

# 5. Deploy a producción
vercel --prod

# ✅ ¡Listo! Tu app está online
```

---

## 💡 Tips Pro

1. **Usa GitHub:** Conecta siempre con GitHub para auto-deploys
2. **Variables de entorno:** NUNCA subas API keys al código
3. **Preview deployments:** Vercel/Netlify crean previews de cada PR
4. **Rollback fácil:** Puedes volver a versiones anteriores con 1 click
5. **Analytics:** Vercel y Netlify ofrecen analytics gratis

---

## 🎉 ¡Ya Puedes Usar tu App Online!

Una vez desplegada:
1. Abre la URL de tu deployment
2. Usa la app normalmente
3. Compártela con amigos/clientes
4. Crea guiones desde cualquier lugar
5. 100% gratis y profesional

---

¿Problemas? Revisa los logs de tu plataforma o abre un issue en GitHub.
