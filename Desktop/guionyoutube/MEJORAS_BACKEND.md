# MEJORAS DEL BACKEND - Generador de Guiones YouTube

## Resumen de Mejoras Implementadas

Este documento detalla todas las mejoras radicales implementadas en el backend del generador de guiones de YouTube.

---

## 1. STREAMING DE RESPUESTAS (Server-Sent Events)

### ¿Qué es?
Sistema de streaming en tiempo real que envía el guión a medida que se genera, palabra por palabra, permitiendo al usuario ver el contenido instantáneamente.

### Implementación

**Nuevo Endpoint:**
```
POST /api/generar-guion-stream
```

**Uso desde el frontend:**
```javascript
const eventSource = new EventSource('/api/generar-guion-stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'start':
      console.log('Iniciando generación...');
      break;
    case 'chunk':
      // Agregar chunk al DOM
      document.getElementById('guion').textContent += data.contenido;
      break;
    case 'complete':
      console.log('Guión completo:', data);
      eventSource.close();
      break;
    case 'error':
      console.error('Error:', data.mensaje);
      eventSource.close();
      break;
  }
};
```

**Archivos modificados:**
- `server.js` - Nuevo endpoint `/api/generar-guion-stream`
- `config/iaProviders.js` - Soporte para streaming en Groq y Ollama
- `utils/generadorGuion.js` - Nueva función `generarGuionLargoStream()`

---

## 2. SISTEMA DE CACHÉ EN MEMORIA

### ¿Qué es?
Sistema inteligente de caché que almacena guiones generados para evitar regenerar contenido idéntico, mejorando velocidad y reduciendo llamadas a la API.

### Características

- **Hash MD5:** Cada combinación única de parámetros genera un hash que sirve como clave de caché
- **TTL:** 1 hora de expiración automática
- **Headers HTTP:** `X-Cache-Status: HIT/MISS` indica si se sirvió desde caché
- **Limpieza automática:** Proceso que elimina entradas expiradas cada 10 minutos

### Ejemplo de uso

```bash
# Primera llamada - MISS (genera nuevo guión)
curl -X POST http://localhost:3000/api/generar-guion \
  -H "Content-Type: application/json" \
  -d '{"tema": "Inteligencia Artificial", "duracion": 30}'
# Response header: X-Cache-Status: MISS

# Segunda llamada con mismos parámetros - HIT (desde caché)
curl -X POST http://localhost:3000/api/generar-guion \
  -H "Content-Type: application/json" \
  -d '{"tema": "Inteligencia Artificial", "duracion": 30}'
# Response header: X-Cache-Status: HIT
```

### Endpoints adicionales

```bash
# Ver estadísticas de caché
GET /api/cache-stats

# Limpiar caché manualmente
POST /api/cache-clear
```

---

## 3. RATE LIMITING POR IP

### ¿Qué es?
Sistema de protección que limita las solicitudes por IP para prevenir abuso y sobrecarga del servidor.

### Configuración

- **Límite:** 10 requests por minuto por IP
- **Ventana:** 60 segundos
- **Respuesta:** HTTP 429 (Too Many Requests) cuando se excede

### Headers informativos

Cada respuesta incluye:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 2025-11-23T10:30:00.000Z
Retry-After: 42
```

### Ejemplo de respuesta al exceder límite

```json
{
  "error": "Too Many Requests",
  "mensaje": "Has excedido el límite de 10 solicitudes por minuto. Intenta de nuevo en 42 segundos.",
  "retryAfter": 42
}
```

---

## 4. VALIDACIÓN Y SANITIZACIÓN DE INPUTS

### Validaciones implementadas

#### Tema
- ✅ Requerido
- ✅ Debe ser texto
- ✅ Máximo 200 caracteres
- ✅ No puede estar vacío

#### Duración
- ✅ Debe ser número
- ✅ Rango: 10-120 minutos

#### Nicho
- ✅ Máximo 100 caracteres (opcional)

#### Tono
- ✅ Valores permitidos: `profesional`, `casual`, `divertido`, `educativo`, `motivacional`

#### Provider
- ✅ Valores permitidos: `groq`, `ollama`

### Sanitización

Todos los textos son sanitizados para prevenir injection:
- Elimina caracteres peligrosos (`<`, `>`)
- Solo permite caracteres seguros (letras, números, puntuación básica)
- Limita longitud máxima

### Ejemplo de error de validación

```json
{
  "error": "Datos de entrada inválidos",
  "errores": [
    "El tema no puede exceder 200 caracteres",
    "La duración debe ser un número entre 10 y 120 minutos",
    "El tono debe ser uno de: profesional, casual, divertido, educativo, motivacional"
  ],
  "timestamp": "2025-11-23T10:15:30.000Z"
}
```

---

## 5. MANEJO CENTRALIZADO DE ERRORES

### ¿Qué es?
Middleware global que captura todos los errores, registra logs detallados y retorna mensajes user-friendly.

### Características

- **Logging con timestamps:** Todos los errores se registran con fecha/hora
- **Mensajes amigables:** Errores técnicos se traducen a mensajes comprensibles
- **Códigos HTTP apropiados:** 400, 401, 403, 404, 429, 500, 503
- **Stack traces:** Solo en desarrollo (protege info sensible en producción)

### Mensajes por código de estado

```javascript
{
  400: 'Los datos enviados no son válidos',
  401: 'No estás autorizado para realizar esta acción',
  403: 'No tienes permisos para acceder a este recurso',
  404: 'El recurso solicitado no fue encontrado',
  429: 'Has realizado demasiadas solicitudes. Por favor, espera un momento',
  500: 'Ocurrió un error en el servidor. Estamos trabajando para solucionarlo',
  503: 'El servicio no está disponible temporalmente'
}
```

### Ejemplo de respuesta de error

```json
{
  "error": true,
  "mensaje": "Ocurrió un error en el servidor. Estamos trabajando para solucionarlo",
  "detalles": "GROQ_API_KEY no configurada",
  "timestamp": "2025-11-23T10:15:30.000Z",
  "path": "/api/generar-guion"
}
```

---

## 6. LOGGING MEJORADO

### Sistema de logs con niveles

```javascript
log('info', 'Mensaje informativo', { dato: 'valor' });
log('success', 'Operación exitosa', { resultado: 'ok' });
log('warning', 'Advertencia', { alerta: 'revisar' });
log('error', 'Error crítico', { error: 'detalles' });
```

### Formato de logs

```
[2025-11-23T10:15:30.000Z] ℹ️ Generando nuevo guión { tema: 'IA', duracion: 30 }
[2025-11-23T10:15:45.000Z] ✅ Guión generado exitosamente { palabras: 7500 }
[2025-11-23T10:16:00.000Z] ⚠️ Rate limit próximo a excederse { ip: '127.0.0.1' }
[2025-11-23T10:16:15.000Z] ❌ Error en generación { error: 'API timeout' }
```

---

## ENDPOINTS DISPONIBLES

### Generar guión (con caché)
```bash
POST /api/generar-guion
Content-Type: application/json

{
  "tema": "Inteligencia Artificial en 2025",
  "nicho": "tecnología",
  "duracion": 30,
  "tono": "profesional",
  "incluirIntro": true,
  "incluirOutro": true,
  "provider": "groq"
}
```

### Generar guión (con streaming)
```bash
POST /api/generar-guion-stream
Content-Type: application/json

{
  "tema": "Criptomonedas",
  "duracion": 45,
  "tono": "educativo",
  "provider": "groq"
}
```

### Health check
```bash
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2025-11-23T10:15:30.000Z",
  "providers": {
    "groq": true,
    "ollama": true
  },
  "cache": {
    "size": 15,
    "ttl": "60 minutos"
  },
  "rateLimit": {
    "window": "60 segundos",
    "maxRequests": 10
  }
}
```

### Estadísticas de caché
```bash
GET /api/cache-stats

Response:
{
  "entradas": 15,
  "ttl": 3600000,
  "rateLimitIPs": 8
}
```

### Limpiar caché
```bash
POST /api/cache-clear

Response:
{
  "success": true,
  "mensaje": "Caché limpiado exitosamente"
}
```

---

## COMPATIBILIDAD

- ✅ **Retrocompatible:** Todos los endpoints anteriores siguen funcionando
- ✅ **Nuevos endpoints:** Agregados como mejora, no reemplazan existentes
- ✅ **ES6 Modules:** Usa import/export nativo de Node.js
- ✅ **Sin breaking changes:** El código existente no se ve afectado

---

## TESTING

### Test de endpoint normal
```bash
curl -X POST http://localhost:3000/api/generar-guion \
  -H "Content-Type: application/json" \
  -d '{"tema": "Testing", "duracion": 10}'
```

### Test de streaming (con curl)
```bash
curl -N -X POST http://localhost:3000/api/generar-guion-stream \
  -H "Content-Type: application/json" \
  -d '{"tema": "Streaming", "duracion": 10}'
```

### Test de rate limiting
```bash
# Ejecutar 11 veces rápidamente
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/generar-guion \
    -H "Content-Type: application/json" \
    -d '{"tema": "Test '$i'", "duracion": 10}'
  echo "\n---\n"
done
```

### Test de validación
```bash
# Tema demasiado largo (debe fallar)
curl -X POST http://localhost:3000/api/generar-guion \
  -H "Content-Type: application/json" \
  -d '{"tema": "'"$(python3 -c 'print("A"*250)')"'", "duracion": 10}'

# Duración inválida (debe fallar)
curl -X POST http://localhost:3000/api/generar-guion \
  -H "Content-Type: application/json" \
  -d '{"tema": "Test", "duracion": 500}'
```

---

## MEJORAS DE RENDIMIENTO

1. **Caché en memoria:** Respuestas hasta 1000x más rápidas para requests repetidos
2. **Streaming:** Usuario ve contenido instantáneamente (mejor UX)
3. **Rate limiting:** Previene sobrecarga del servidor
4. **Validación temprana:** Rechaza requests inválidos antes de procesarlos
5. **Limpieza automática:** Memoria se mantiene optimizada

---

## SEGURIDAD

1. **Sanitización de inputs:** Previene injection attacks
2. **Rate limiting:** Previene DoS y abuso
3. **Validación estricta:** Solo acepta datos válidos
4. **Error handling:** No expone información sensible
5. **Headers de seguridad:** CORS configurado apropiadamente

---

## PRÓXIMOS PASOS RECOMENDADOS

1. **Redis para caché:** Reemplazar Map en memoria por Redis para escalabilidad
2. **JWT Authentication:** Agregar sistema de autenticación
3. **WebSockets:** Alternativa a SSE para streaming bidireccional
4. **Métricas:** Implementar Prometheus/Grafana para monitoreo
5. **Tests unitarios:** Jest para testing automatizado
6. **Rate limiting distribuido:** Para múltiples instancias del servidor

---

## AUTOR

Mejoras implementadas para el proyecto Generador de Guiones YouTube
Fecha: 2025-11-23
