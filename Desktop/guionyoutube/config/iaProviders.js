import Groq from 'groq-sdk';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

// Cliente de Groq (Gratis y rápido)
let groqClient = null;
if (process.env.GROQ_API_KEY) {
  groqClient = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
}

// Configuración de Ollama (Local - 100% Gratis)
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

/**
 * Genera texto usando Groq (modelos rápidos y gratuitos)
 */
export async function generarConGroq(prompt, opciones = {}) {
  if (!groqClient) {
    throw new Error('GROQ_API_KEY no configurada. Obtén una clave gratis en https://console.groq.com');
  }

  const {
    model = 'mixtral-8x7b-32768', // Modelo gratuito con contexto largo
    maxTokens = 8000,
    temperature = 0.7
  } = opciones;

  try {
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Eres un guionista profesional experto en crear contenido extenso, detallado y atractivo para YouTube. Tus guiones son informativos, entretenidos y mantienen la atención del espectador.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model,
      max_tokens: maxTokens,
      temperature
    });

    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error con Groq:', error.message);
    throw error;
  }
}

/**
 * Genera texto usando Ollama (Local - 100% Gratis)
 */
export async function generarConOllama(prompt, opciones = {}) {
  const {
    model = 'llama2', // Modelo por defecto, también puedes usar 'mistral', 'codellama', etc.
    temperature = 0.7
  } = opciones;

  try {
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        prompt: `Eres un guionista profesional experto en crear contenido extenso, detallado y atractivo para YouTube. Tus guiones son informativos, entretenidos y mantienen la atención del espectador.\n\n${prompt}`,
        stream: false,
        options: {
          temperature
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response || '';
  } catch (error) {
    console.error('Error con Ollama:', error.message);
    throw new Error(`Ollama no está disponible. Asegúrate de tener Ollama instalado y ejecutándose (ollama serve). Descárgalo en: https://ollama.ai\nError: ${error.message}`);
  }
}

/**
 * Genera contenido de demostración cuando no hay API Key válida
 */
function generarContenidoDemo(prompt) {
  // Extraer el tema del prompt
  const temaMatch = prompt.match(/sobre["\s]*([^"]*)["\s]*/i);
  const tema = temaMatch ? temaMatch[1].trim() : 'este tema';
  
  return `
# GUIÓN PROFESIONAL DE YOUTUBE: ${tema.toUpperCase()}

¡Hola! Bienvenidos a un nuevo video donde vamos a explorar en profundidad todo lo que necesitas saber sobre ${tema}. 

## ¿POR QUÉ ES IMPORTANTE ESTE TEMA?

En los últimos años, ${tema} se ha convertido en uno de los aspectos más relevantes en nuestro campo. Las estadísticas muestran que más del 70% de los profesionales consideran que entender ${tema} es fundamental para el éxito.

Yo he estado investigando ${tema} durante varios años, y lo que he descubierto va a cambiar completamente tu perspectiva. En este video de más de 30 minutos, vamos a cubrir:

## LO QUE APRENDERÁS HOY

✅ Los fundamentos esenciales de ${tema}
✅ Las estrategias más efectivas que realmente funcionan
✅ Errores comunes que debes evitar a toda costa
✅ Casos de estudio reales con resultados comprobados
✅ Un plan de acción paso a paso que puedes implementar inmediatamente

## SECCIÓN 1: FUNDAMENTOS ESENCIALES

Comencemos con lo básico. ${tema} no es solo una tendencia pasajera, es un cambio fundamental en la forma en que trabajamos y pensamos. 

Para entender realmente ${tema}, necesitamos examinar tres componentes principales:

**Primer componente:** La base teórica
Aquí es donde muchas personas se confunden. La teoría detrás de ${tema} se basa en principios que han sido validados durante décadas de investigación. Los estudios más recientes de universidades como MIT y Stanford confirman que cuando aplicamos estos principios correctamente, podemos ver mejoras de hasta un 300% en los resultados.

**Segundo componente:** La aplicación práctica
La teoría sin práctica no sirve de nada. He trabajado con más de 200 clientes en los últimos tres años, y he identificado exactamente qué funciona y qué no en el mundo real. Los resultados son fascinantes.

**Tercer componente:** La mentalidad correcta
Este es el factor que más subestiman. Tu mentalidad hacia ${tema} determina el 80% de tus resultados. Voy a compartir contigo la mentalidad exacta que usan los expertos más exitosos.

## SECCIÓN 2: ESTRATEGIAS AVANZADAS

Ahora que tienes los fundamentos claros, vamos a profundizar en las estrategias avanzadas que separan a los principiantes de los expertos.

### Estrategia #1: El Método de la Pirámide Invertida

Esta técnica revolucionaria cambia completamente la forma en que abordas ${tema}. En lugar de empezar desde abajo, comenzamos desde la cima y trabajamos hacia abajo. Los resultados son inmediatos y sostenibles.

He probado esta estrategia con más de 50 proyectos diferentes, y en el 94% de los casos, hemos visto mejoras significativas en las primeras dos semanas. Te voy a mostrar exactamente cómo implementarla.

### Estrategia #2: La Regla del 80/20 Aplicada

Aplicar el principio de Pareto a ${tema} puede multiplicar tus resultados por cinco. Después de analizar miles de datos, he identificado exactamente cuál es ese 20% que genera el 80% de los resultados.

Esto es lo que nadie más te va a contar, porque la mayoría de las personas están enfocadas en las tácticas equivocadas. Están gastando el 80% de su tiempo en actividades que solo generan el 20% de los resultados.

## SECCIÓN 3: CASOS DE ESTUDIO REALES

Permíteme compartir contigo tres casos de estudio que van a abrir tu mente completamente.

### Caso de Estudio #1: La Transformación de María

María llegó a mí completamente frustrada. Había intentado todo lo que encontró en internet sobre ${tema}, pero no veía resultados. En solo 30 días, usando las estrategias que te estoy enseñando, logró:
- Incrementar su eficiencia en un 250%
- Reducir el tiempo invertido en un 40%
- Obtener resultados que antes le tomaban meses

¿Cómo lo hizo? Aplicando exactamente lo que te estoy enseñando en este video.

### Caso de Estudio #2: El Proyecto de $100,000

Una empresa de tecnología me contrató para aplicar estos principios de ${tema} en un proyecto crítico de $100,000. Los resultados fueron tan impresionantes que decidieron implementarlo en toda la organización.

En 90 días:
- Mejoraron la productividad del equipo en un 180%
- Redujeron los costos operativos en un 35%
- Aumentaron la satisfacción del cliente al 98%

Te voy a mostrar exactamente qué hicimos y cómo puedes replicarlo.

## SECCIÓN 4: ERRORES FATALES QUE DEBES EVITAR

En mis años de experiencia, he visto que el 90% de las personas cometen los mismos errores una y otra vez. Estos errores no solo limitan sus resultados, sino que pueden destruir completamente sus esfuerzos.

### Error #1: La Trampa de la Información Excesiva

Muchas personas piensan que necesitan saber todo sobre ${tema} antes de empezar. Esto es completamente falso. De hecho, el exceso de información paraliza la acción. Los expertos saben exactamente qué información necesitan y cuál pueden ignorar.

### Error #2: No Medir las Métricas Correctas

Si no estás midiendo las métricas correctas, estás navegando a ciegas. He visto proyectos enteros fracasar porque estaban optimizando para las métricas equivocadas.

### Error #3: La Mentalidad de Solución Rápida

${tema} no es algo que dominas de la noche a la mañana. Requiere práctica deliberada y paciencia. Las personas que buscan soluciones mágicas siempre terminan frustradas.

## SECCIÓN 5: TU PLAN DE ACCIÓN PASO A PASO

Ahora vamos a lo más importante: cómo vas a implementar todo esto starting from tomorrow.

### Semana 1: Fundamentos
- Días 1-2: Evalúa tu situación actual
- Días 3-5: Implementa los tres componentes esenciales
- Días 6-7: Mide y ajusta

### Semana 2: Estrategias Avanzadas
- Días 8-10: Aplica el Método de la Pirámide Invertida
- Días 11-14: Implementa la Regla del 80/20

### Semana 3: Optimización
- Días 15-17: Analiza tus resultados
- Días 18-21: Optimiza basado en datos

### Semana 4: Escalamiento
- Días 22-24: Escala las estrategias que funcionan
- Días 25-28: Documenta tu proceso

## PREGUNTAS FRECUENTES

**¿Cuánto tiempo toma ver resultados?**
Basado en mi experiencia con más de 1,000 estudiantes, la mayoría ve resultados significativos en las primeras 2-3 semanas. Sin embargo, los resultados transformacionales vienen después de 90 días de aplicación consistente.

**¿Funciona esto en todas las industrias?**
Absolutamente. He aplicado estos principios de ${tema} en tecnología, finanzas, salud, educación, y más. Los principios fundamentales son universales.

**¿Qué pasa si no tengo experiencia previa?**
Perfecto. De hecho, a veces es mejor empezar sin experiencia previa porque no tienes malos hábitos que romper. Mis estudiantes más exitosos han sido principiantes completos.

## RECURSOS Y HERRAMIENTAS RECOMENDADAS

Para implementar todo lo que hemos cubierto, vas a necesitar las herramientas correctas:

1. **Para análisis:** Herramientas de medición específicas
2. **Para implementación:** Software de gestión de proyectos
3. **Para seguimiento:** Dashboards de métricas
4. **Para aprendizaje:** Cursos especializados

## CONCLUSIÓN Y PRÓXIMOS PASOS

Hemos cubierto mucho terreno en este video. ${tema} ya no debería ser un misterio para ti. Tienes los fundamentos, las estrategias, los casos de estudio, y un plan de acción concreto.

Pero aquí está lo más importante: el conocimiento sin acción es inútil. Te desafío a que tomes al menos una cosa de las que hemos cubierto y la implementes en las próximas 24 horas.

Si este video te ha dado valor, asegúrate de darle like y suscribirte al canal. Cada semana subimos contenido profundo sobre temas como este.

¿Cuál va a ser tu primer paso? Déjamelo saber en los comentarios abajo. Leo y respondo a cada comentario.

Nos vemos en el próximo video. ¡Hasta pronto!

---

**📝 NOTA: Este es un guión de demostración generado sin API Key. Para obtener guiones personalizados y únicos, configura tu API Key de Groq (gratis) en las variables de entorno.**

**🔧 Para configurar:**
1. Ve a https://console.groq.com
2. Crea una cuenta gratuita  
3. Copia tu API Key
4. Configúrala en tu plataforma de deploy
`;
}

/**
 * Función genérica para generar texto con el proveedor especificado
 */
export async function generarTexto(prompt, opciones = {}) {
  const { provider = 'groq' } = opciones;

  // Intentar con el proveedor preferido primero
  try {
    if (provider === 'ollama') {
      return await generarConOllama(prompt, opciones);
    } else if (provider === 'groq') {
      return await generarConGroq(prompt, opciones);
    }
  } catch (error) {
    console.error(`Error con ${provider}:`, error.message);
    
    // Si falla Groq, intentar con Ollama
    if (provider === 'groq') {
      try {
        console.log('🔄 Intentando con Ollama como fallback...');
        return await generarConOllama(prompt, opciones);
      } catch (ollamaError) {
        console.error('❌ Ollama tampoco está disponible:', ollamaError.message);
        // Si ambos fallan, usar contenido de demostración
        console.log('📝 Usando modo demostración...');
        return generarContenidoDemo(prompt);
      }
    } else {
      // Si falla Ollama, usar contenido de demostración directamente
      console.log('📝 Usando modo demostración...');
      return generarContenidoDemo(prompt);
    }
  }
  
  throw new Error(`Proveedor desconocido: ${provider}`);
}

/**
 * Verifica qué proveedores están disponibles
 */
export async function verificarProveedores() {
  const proveedores = {
    groq: false,
    ollama: false
  };

  // Verificar Groq
  if (groqClient) {
    proveedores.groq = true;
  }

  // Verificar Ollama
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/tags`, {
      method: 'GET'
    });
    if (response.ok) {
      proveedores.ollama = true;
    }
  } catch (error) {
    proveedores.ollama = false;
  }

  return proveedores;
}
