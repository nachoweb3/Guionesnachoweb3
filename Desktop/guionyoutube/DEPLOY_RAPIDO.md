# ⚡ Deploy en 5 Minutos - Vercel

La forma MÁS RÁPIDA de tener tu app online y funcionando.

## 🎯 Lo que Necesitas

- [ ] Cuenta de GitHub (gratis)
- [ ] Cuenta de Vercel (gratis)
- [ ] API Key de Groq (gratis)
- [ ] 5 minutos de tiempo

---

## 📝 Paso 1: Obtener Groq API Key (1 min)

1. Ve a https://console.groq.com
2. Click en "Sign Up" (regístrate gratis)
3. Verifica tu email
4. Ve a "API Keys" en el menú
5. Click en "Create API Key"
6. **COPIA la clave** (empieza con `gsk_...`)
7. Guárdala en un lugar seguro

---

## 🔧 Paso 2: Preparar el Proyecto (1 min)

```bash
# Navega a tu proyecto
cd guionyoutube

# Inicializa git (si no lo has hecho)
git init

# Agrega todos los archivos
git add .

# Haz el primer commit
git commit -m "Generador de guiones con IA - listo para deploy"
```

---

## 🐙 Paso 3: Subir a GitHub (2 min)

### Opción A: Desde GitHub.com (Más fácil)

1. Ve a https://github.com/new
2. Nombre del repo: `guion-youtube-ia`
3. Descripción: `Generador profesional de guiones largos con IA`
4. Público o Privado (tú eliges)
5. **NO marques** "Initialize with README" ni nada más
6. Click en "Create repository"

7. Copia los comandos que aparecen y ejecútalos:
```bash
git remote add origin https://github.com/TU_USUARIO/guion-youtube-ia.git
git branch -M main
git push -u origin main
```

### Opción B: Desde CLI

```bash
# Instalar GitHub CLI
# Windows: https://cli.github.com
# Mac: brew install gh
# Linux: Ver https://github.com/cli/cli/blob/trunk/docs/install_linux.md

gh auth login
gh repo create guion-youtube-ia --public --source=. --push
```

---

## 🚀 Paso 4: Deploy en Vercel (2 min)

### Método 1: Dashboard Web (Recomendado)

1. Ve a https://vercel.com
2. Click en "Sign Up" y selecciona "Continue with GitHub"
3. Autoriza Vercel en GitHub
4. En el dashboard, click en "Add New..." → "Project"
5. Busca y selecciona `guion-youtube-ia`
6. Click en "Import"

**Configurar:**
- Framework Preset: Vercel detectará automáticamente (Node.js)
- Root Directory: `.` (dejar por defecto)
- Build Command: Dejar por defecto
- Output Directory: Dejar por defecto

7. **IMPORTANTE:** Antes de deploy, agregar variable de entorno:
   - Click en "Environment Variables"
   - Name: `GROQ_API_KEY`
   - Value: Pega tu clave de Groq aquí
   - Click en "Add"

8. Click en "Deploy"

9. **Espera 1-2 minutos** mientras Vercel:
   - ✅ Clona tu repo
   - ✅ Instala dependencias
   - ✅ Build del proyecto
   - ✅ Despliega a producción

10. ✅ **¡LISTO!** Recibirás una URL como:
    ```
    https://guion-youtube-ia.vercel.app
    ```

### Método 2: CLI (Más rápido si sabes usar terminal)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login (se abrirá tu navegador)
vercel login

# Deploy
vercel

# Agregar API Key
vercel env add GROQ_API_KEY
# Pega tu clave cuando te lo pida
# Selecciona: Production, Preview, Development (todas)

# Deploy a producción
vercel --prod

# ✅ ¡Listo! Te dará tu URL
```

---

## ✅ Paso 5: Verificar que Funciona

1. Abre la URL que te dio Vercel
2. Deberías ver la interfaz del generador
3. Prueba generar un guion:
   - Tema: "Productividad para emprendedores"
   - Duración: 30 min
   - Click en "Generar Guion"
4. Espera 30-45 segundos
5. ¡Deberías ver tu guion generado!

---

## 🎨 Personalizar tu URL (Opcional)

Por defecto obtienes: `https://tu-proyecto.vercel.app`

Para personalizar:

1. En Vercel Dashboard → Tu Proyecto
2. Settings → Domains
3. Puedes:
   - Cambiar el subdominio de Vercel (gratis)
   - Agregar tu propio dominio (si tienes uno)

---

## 🔄 Actualizar tu App

Cada vez que hagas cambios:

```bash
# 1. Hacer cambios en tu código
# 2. Commit
git add .
git commit -m "Descripción de tus cambios"

# 3. Push
git push

# ✅ Vercel desplegará automáticamente!
# Recibirás un email cuando termine
```

---

## 🐛 Solución Rápida de Problemas

### ❌ "Build Failed"

**Causa:** Algún error en el código

**Solución:**
1. Ve a Vercel Dashboard → Tu proyecto → Deployments
2. Click en el deployment fallido
3. Lee el log para ver el error
4. Arregla el error localmente
5. Push de nuevo

### ❌ "Error al generar guion"

**Causa:** API Key no configurada o inválida

**Solución:**
1. Vercel Dashboard → Tu proyecto → Settings
2. Environment Variables
3. Verifica que `GROQ_API_KEY` esté correcta
4. Si la cambiaste, haz un nuevo deployment:
   ```bash
   # Forzar nuevo deployment
   git commit --allow-empty -m "Trigger deploy"
   git push
   ```

### ❌ La app carga pero no genera guiones

**Causa:** Variable de entorno no disponible

**Solución:**
1. Settings → Environment Variables
2. Asegúrate de que `GROQ_API_KEY` esté en:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
3. Redeploy

---

## 📊 Estadísticas y Analytics

Vercel te da estadísticas gratis:

1. Analytics → Tu proyecto
2. Verás:
   - Número de visitas
   - Performance
   - Errores
   - Países de origen

---

## 💰 Costos

**TODO ES GRATIS:**
- ✅ Vercel: 100% gratis para proyectos personales
- ✅ Groq API: Gratis con límites generosos
- ✅ GitHub: Gratis (repos públicos o privados)
- ✅ HTTPS/SSL: Incluido gratis
- ✅ CDN Global: Incluido gratis

**Límites del plan gratuito:**
- Ancho de banda: 100GB/mes (más que suficiente)
- Builds: Ilimitados
- Deployments: Ilimitados
- Tiempo de ejecución: 10 seg por función (suficiente)

---

## 🎯 Checklist Final

Antes de compartir tu app, verifica:

- [ ] La app carga correctamente en la URL
- [ ] Puedes generar guiones sin errores
- [ ] El diseño se ve bien en móvil
- [ ] Las estadísticas funcionan (palabras, duración)
- [ ] Puedes copiar/descargar guiones

---

## 🚀 ¡Ya Está!

Tu app está online en:
```
https://tu-proyecto.vercel.app
```

**Compártela:**
- Con amigos
- En redes sociales
- En tu portafolio
- Con clientes

**Todo funciona igual que en localhost, pero:**
- ✅ Accesible desde cualquier lugar
- ✅ HTTPS automático
- ✅ Super rápido (CDN global)
- ✅ Sin mantener tu computadora encendida

---

## 🎁 Bonus: Badge para tu README

Agrega esto a tu README de GitHub:

```markdown
[![Deployed on Vercel](https://vercel.com/button)](https://tu-proyecto.vercel.app)
```

---

## 📚 Recursos

- [Documentación de Vercel](https://vercel.com/docs)
- [Groq Docs](https://console.groq.com/docs)
- [GitHub Docs](https://docs.github.com)

---

**¿Preguntas?** Abre un issue en GitHub o lee DEPLOYMENT.md para más opciones.

## ⏱️ Tiempo Total: ~5 minutos

1. ✅ Groq API Key: 1 min
2. ✅ Git setup: 1 min
3. ✅ GitHub: 2 min
4. ✅ Vercel: 2 min

**¡Empieza ahora!** 🚀
