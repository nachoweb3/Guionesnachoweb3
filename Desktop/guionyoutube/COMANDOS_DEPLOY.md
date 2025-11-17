# ⚡ COMANDOS RÁPIDOS DE DEPLOY

## 🎯 Deploy en 1 comando

```bash
# 🔍 Verificar que todo esté listo
npm run check-deploy

# 🚀 Deploy automático a Netlify (recomendado)
npm run deploy:netlify

# 🚀 Deploy automático a Vercel
npm run deploy:vercel

# 🚀 Deploy automático a Railway  
npm run deploy:railway
```

## 🔧 Setup inicial (solo primera vez)

```bash
# Netlify
npm install -g netlify-cli
netlify login

# Vercel  
npm install -g vercel
vercel login

# Railway
npm install -g @railway/cli
railway login
```

## ✅ Verificar deploy

```bash
# Verificar que funciona
curl https://tu-sitio.com/api/health

# Debe retornar:
# {"status":"ok","timestamp":"...","providers":{"groq":true,"ollama":false}}
```

## 🔑 Configurar API Key (opcional)

```bash
# 1. Obtener clave gratis en: https://console.groq.com

# 2. Configurar según plataforma:

# Netlify:
netlify env:set GROQ_API_KEY tu_clave_aqui

# Vercel:
vercel env add GROQ_API_KEY

# Railway:
# (Desde web: Variables tab → Add Variable)
```

## 🎉 ¡Ya está!

Tu app estará disponible en:
- **Netlify:** `https://tu-sitio.netlify.app`
- **Vercel:** `https://tu-sitio.vercel.app` 
- **Railway:** `https://tu-proyecto.up.railway.app`

## 🔗 URLs importantes:

- **🏠 Home:** `https://tu-sitio.com/`
- **❤️ Health:** `https://tu-sitio.com/api/health`
- **🎬 API Guión:** `https://tu-sitio.com/api/generar-guion`

---

**📱 ¡Comparte el link y empieza a generar guiones profesionales!**