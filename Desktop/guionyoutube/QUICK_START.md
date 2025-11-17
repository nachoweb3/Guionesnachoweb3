# 🚀 Guía de Inicio Rápido - 5 Minutos

## Método 1: Groq API (Más Fácil) ⚡

### Paso 1: Obtener API Key GRATIS
1. Ve a https://console.groq.com
2. Registrate (gratis)
3. Ve a "API Keys"
4. Crea una nueva API key
5. Cópiala

### Paso 2: Instalar
```bash
# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env
```

### Paso 3: Configurar
Abre el archivo `.env` y pega tu clave:
```
GROQ_API_KEY=gsk_tu_clave_aqui
```

### Paso 4: Ejecutar
```bash
npm start
```

### Paso 5: Usar
1. Abre http://localhost:3000
2. Ingresa un tema (ej: "Cómo usar ChatGPT para crecer tu negocio")
3. Selecciona duración (30 min)
4. Click en "Generar Guion"
5. Espera 30-60 segundos
6. ¡Listo! Copia o descarga tu guion

---

## Método 2: Ollama Local (100% Gratis, Sin Límites) 🏠

### Paso 1: Instalar Ollama
```bash
# Windows/Mac/Linux
# Descarga desde: https://ollama.ai
```

### Paso 2: Descargar Modelo
```bash
ollama pull llama2
```

### Paso 3: Iniciar Ollama
```bash
ollama serve
```

### Paso 4: Instalar Proyecto
```bash
npm install
npm start
```

### Paso 5: Usar
1. Abre http://localhost:3000
2. En "Motor de IA", selecciona "Ollama"
3. Ingresa tu tema
4. ¡Genera tu guion!

---

## 💡 Primera Prueba Recomendada

**Tema sugerido**: "Los 10 mejores trucos de productividad para emprendedores en 2025"

**Configuración**:
- Nicho: Negocios
- Duración: 30 minutos
- Tono: Profesional
- Motor: Groq (o Ollama)
- ✅ Incluir Introducción
- ✅ Incluir Conclusión

**Resultado esperado**: ~7,500 palabras, guion estructurado completo

---

## 🎯 Casos de Uso Rápidos

### 1. Video Tutorial
```
Tema: "Cómo crear una app móvil sin programar"
Nicho: Tecnología
Duración: 45 min
Tono: Educativo
```

### 2. Video Motivacional
```
Tema: "Cómo superar el miedo al fracaso y alcanzar tus metas"
Nicho: Desarrollo Personal
Duración: 30 min
Tono: Motivacional
```

### 3. Review Detallado
```
Tema: "iPhone 16 Pro: Review completo y comparación"
Nicho: Tecnología
Duración: 35 min
Tono: Profesional
```

### 4. Explicación Científica
```
Tema: "Cómo funciona la física cuántica explicada simple"
Nicho: Ciencia
Duración: 40 min
Tono: Educativo
```

---

## ⚠️ Solución Rápida de Problemas

### "Error al generar el guion"
- ✅ Verifica tu GROQ_API_KEY en .env
- ✅ Reinicia el servidor (Ctrl+C y npm start)
- ✅ Prueba con Ollama en su lugar

### "Ollama no disponible"
```bash
# Verifica que Ollama esté corriendo
ollama serve

# En otra terminal, verifica modelos disponibles
ollama list

# Si no hay modelos, descarga uno
ollama pull llama2
```

### "El guion es muy corto"
- Aumenta la duración a 45-60 minutos
- Usa Groq en lugar de Ollama
- Genera múltiples veces y combina las mejores partes

---

## 📊 Estadísticas de Generación

| Duración | Palabras | Tiempo de Generación |
|----------|----------|---------------------|
| 10 min   | ~2,500   | 15-20 seg           |
| 30 min   | ~7,500   | 30-45 seg           |
| 60 min   | ~15,000  | 60-90 seg           |

---

## 🎓 Tips Pro

1. **Investigar primero**: Usa la pestaña "Investigar Tema" antes de generar
2. **Sé específico**: "IA en marketing" → "Cómo usar IA para crear contenido en Instagram"
3. **Revisa y edita**: La IA crea el borrador, tú le das el toque personal
4. **Combina resultados**: Genera 2-3 veces y quédate con las mejores secciones
5. **Guarda tus favoritos**: Descarga los buenos guiones como referencia

---

## 🔥 Empieza AHORA

```bash
# 1. Clona o descarga el proyecto
cd guionyoutube

# 2. Instala
npm install

# 3. Configura (opcional si usas Ollama)
cp .env.example .env
# Edita .env y agrega tu GROQ_API_KEY

# 4. Ejecuta
npm start

# 5. Abre
# http://localhost:3000
```

## 🎬 ¡Ya estás listo para crear guiones increíbles!

**Próximos pasos**:
- Lee el README.md completo para funciones avanzadas
- Experimenta con diferentes tonos y nichos
- Usa Whisper para transcribir contenido existente
- ¡Comparte tus resultados!

---

¿Preguntas? Revisa el README.md o abre un Issue en GitHub.
