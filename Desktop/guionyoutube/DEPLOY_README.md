# 🚀 DEPLOY INMEDIATO - Guión YouTube IA

## ⚡ Deploy en 3 Pasos (5 minutos)

### 🎯 OPCIÓN RÁPIDA: Netlify

```bash
# 1. Instalar Netlify CLI
npm install -g netlify-cli

# 2. Login y deploy
netlify login
netlify deploy --prod

# 3. Configurar API Key (opcional)
# Ve a tu dashboard → Environment Variables → Add:
# GROQ_API_KEY = tu_clave_de_groq
```

**✅ LISTO!** Tu app estará en: `https://tu-sitio.netlify.app`

---

## 🔥 OPCIÓN AUTOMATIZADA: Scripts incluidos

```bash
# Ver opciones de deploy
npm run deploy

# Deploy directo a Netlify
npm run deploy:netlify

# Deploy directo a Vercel  
npm run deploy:vercel

# Deploy directo a Railway
npm run deploy:railway

# Ver ayuda de configuración
npm run deploy:help
```

---

## 🎯 URLs que tendrás después del deploy:

- **🏠 App Principal:** `https://tu-sitio.com/`
- **⚡ API Guiones:** `https://tu-sitio.com/api/generar-guion` 
- **🔍 API Investigación:** `https://tu-sitio.com/api/contenido-relacionado`
- **🎙️ API Transcripción:** `https://tu-sitio.com/api/transcribir-audio`
- **❤️ Health Check:** `https://tu-sitio.com/api/health`

---

## 🔑 Configurar API Key (Opcional - Mejora velocidad)

### 1. Obtener clave GRATIS:
- Ve a [console.groq.com](https://console.groq.com)
- Crear cuenta → Copiar API Key

### 2. Configurar según plataforma:

**📍 Netlify:**
```bash
# Opción 1: Desde CLI
netlify env:set GROQ_API_KEY tu_clave_aqui

# Opción 2: Desde web
# Dashboard → Site Settings → Environment Variables
```

**📍 Vercel:**
```bash
# Opción 1: Desde CLI
vercel env add GROQ_API_KEY

# Opción 2: Desde web  
# Dashboard → Settings → Environment Variables
```

**📍 Railway:**
```bash
# Desde web: Variables tab → Add Variable
# GROQ_API_KEY = tu_clave
```

---

## ✅ Verificar que funciona:

1. **Health Check:** `https://tu-sitio.com/api/health`
   - Debe retornar: `{"status": "ok", "providers": {...}}`

2. **Probar generación:**
   - Ve a tu sitio
   - Escribe un tema
   - Click "Generar Guión"
   - ✅ Debe generar script completo

3. **Verificar velocidad:**
   - Con Groq: ~10-30 segundos
   - Sin Groq (Ollama): Mostrará guía de instalación

---

## 🔧 Solución de Problemas

### ❌ Error "Function timeout" 
- **Causa:** Primera ejecución de función serverless
- **Solución:** Esperar 1-2 minutos y reintentar

### ❌ Error "GROQ_API_KEY not configured"
- **Causa:** Variable de entorno no configurada
- **Solución:** Agregar `GROQ_API_KEY` en dashboard

### ❌ Build falla
- **Causa:** Dependencias no instaladas
- **Solución:** `npm install` y redeploy

### ❌ 404 en /api/*
- **Causa:** Redirects mal configurados
- **Solución:** Verificar `netlify.toml` o `vercel.json`

---

## 🎯 Resultado Final

**Tu aplicación tendrá:**
- ✅ Interfaz web profesional
- ✅ Generación de guiones largos (30+ min)
- ✅ Investigación de contenido automática
- ✅ Transcripción de audio (con API key)
- ✅ Export de texto
- ✅ 100% responsive
- ✅ Funciona en móviles

**URLs públicas:**
- 🌐 **Sitio:** `https://tu-app.com`
- 🔗 **API:** `https://tu-app.com/api/*`

---

## 🚀 ¡A USAR!

1. **Deploy** → Elige tu plataforma favorita
2. **Configura** → Agregar GROQ_API_KEY (opcional)
3. **Usa** → Genera guiones profesionales
4. **Comparte** → Envía el link a tu equipo

**¡Tu generador de guiones IA está LISTO! 🎉**