# 🚀 DESPLIEGUE INMEDIATO - 3 Opciones Fáciles

Esta aplicación está **LISTA PARA DESPLEGAR** ahora mismo. Elige tu opción preferida:

## ⚡ OPCIÓN 1: Netlify (Más fácil - Recomendado)

### Paso 1: Preparar Repositorio
1. Sube tu código a GitHub (si no está ya)
2. Ve a [netlify.com](https://netlify.com)
3. Haz login y click "New site from Git"

### Paso 2: Configurar Deploy
1. **Conecta tu repositorio**
2. **Configuración automática** (ya está en `netlify.toml`):
   ```
   Build command: npm install
   Publish directory: public
   Functions directory: netlify/functions
   ```

### Paso 3: Variables de Entorno
1. En Netlify Dashboard → Site Settings → Environment Variables
2. Agregar:
   ```
   GROQ_API_KEY = tu_clave_de_groq
   ```
   (Opcional - la app funciona sin ella usando Ollama)

### Paso 4: Desplegar
- Click "Deploy site" 
- ✅ **LISTO!** Tu app estará en: `https://tu-sitio.netlify.app`

---

## 🔥 OPCIÓN 2: Vercel (Súper rápido)

### Deploy en 1 Click:
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy inmediato
vercel --prod
```

### O desde la web:
1. Ve a [vercel.com](https://vercel.com)
2. Import tu repositorio
3. Agregar variable: `GROQ_API_KEY`
4. Deploy automático

---

## 🚂 OPCIÓN 3: Railway (Gratis por 5$ al mes)

1. Ve a [railway.app](https://railway.app)
2. "Deploy from GitHub repo"
3. Selecciona tu repo
4. Agrega `GROQ_API_KEY` en variables
5. Deploy automático

---

## 🔑 Obtener API Key GRATIS (Opcional)

1. Ve a [console.groq.com](https://console.groq.com)
2. Crear cuenta gratis
3. Copiar API Key
4. Agregar en variables de entorno

**NOTA:** La app funciona **SIN API Key** usando Ollama localmente.

---

## ✅ Verificar Deployment

Después del deploy, visita:
- `https://tu-sitio.com/api/health` → Debe retornar `{"status": "ok"}`
- `https://tu-sitio.com` → Interface principal

---

## 🔧 Solución de Problemas

### Error "Module not found"
- Verifica que `package.json` tenga `"type": "module"`
- Todas las importaciones usan `.js`

### Error "Function timeout"
- Normal en primeras ejecuciones
- Groq es más rápido que Ollama para serverless

### API Key no funciona
- Verifica que esté bien copiada
- Sin espacios extra
- Variable exactamente: `GROQ_API_KEY`

---

## 🎯 URLs de Ejemplo

Una vez desplegado tendrás:
- **Inicio:** `https://tu-app.com/`
- **API:** `https://tu-app.com/api/generar-guion`
- **Health:** `https://tu-app.com/api/health`

## ⚡ Deploy Ahora Mismo

¿Cuál prefieres?
1. **Netlify** → Mejor para principiantes
2. **Vercel** → Más rápido
3. **Railway** → Más control

¡Tu app estará **ONLINE** en menos de 5 minutos! 🚀