/**
 * Script de prueba para las mejoras del backend
 * Ejecutar con: node test-mejoras.js
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, emoji, message) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Health Check
async function testHealthCheck() {
  log(colors.blue, '🏥', 'Test 1: Health Check');

  try {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();

    if (data.status === 'ok') {
      log(colors.green, '✅', 'Health check: OK');
      console.log('   Caché size:', data.cache.size);
      console.log('   Rate limit:', data.rateLimit.maxRequests, 'req/', data.rateLimit.window);
    } else {
      log(colors.red, '❌', 'Health check: FAILED');
    }
  } catch (error) {
    log(colors.red, '❌', 'Health check error: ' + error.message);
  }
  console.log('');
}

// Test 2: Validación de inputs
async function testValidacion() {
  log(colors.blue, '✅', 'Test 2: Validación de Inputs');

  const testCases = [
    {
      name: 'Tema vacío',
      data: { tema: '', duracion: 30 },
      shouldFail: true
    },
    {
      name: 'Tema muy largo',
      data: { tema: 'A'.repeat(250), duracion: 30 },
      shouldFail: true
    },
    {
      name: 'Duración inválida (muy corta)',
      data: { tema: 'Test', duracion: 5 },
      shouldFail: true
    },
    {
      name: 'Duración inválida (muy larga)',
      data: { tema: 'Test', duracion: 200 },
      shouldFail: true
    },
    {
      name: 'Tono inválido',
      data: { tema: 'Test', duracion: 30, tono: 'invalido' },
      shouldFail: true
    },
    {
      name: 'Datos válidos',
      data: { tema: 'Test válido', duracion: 30, tono: 'profesional' },
      shouldFail: false
    }
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${API_URL}/api/generar-guion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.data)
      });

      const success = response.ok;
      const expected = !testCase.shouldFail;

      if (success === expected) {
        log(colors.green, '✅', `${testCase.name}: PASS`);
      } else {
        log(colors.red, '❌', `${testCase.name}: FAIL`);
        const data = await response.json();
        console.log('   Response:', data);
      }
    } catch (error) {
      log(colors.red, '❌', `${testCase.name}: ERROR - ${error.message}`);
    }
  }
  console.log('');
}

// Test 3: Sistema de caché
async function testCache() {
  log(colors.blue, '💾', 'Test 3: Sistema de Caché');

  const requestData = {
    tema: 'Test de Caché',
    duracion: 10,
    tono: 'profesional'
  };

  try {
    // Primera request - debe ser MISS
    log(colors.cyan, '📤', 'Primera request (esperando MISS)...');
    const response1 = await fetch(`${API_URL}/api/generar-guion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    const cacheStatus1 = response1.headers.get('X-Cache-Status');
    const data1 = await response1.json();

    if (cacheStatus1 === 'MISS') {
      log(colors.green, '✅', `Primera request: MISS (correcto)`);
    } else {
      log(colors.red, '❌', `Primera request: ${cacheStatus1} (esperaba MISS)`);
    }

    await sleep(1000);

    // Segunda request - debe ser HIT
    log(colors.cyan, '📤', 'Segunda request (esperando HIT)...');
    const response2 = await fetch(`${API_URL}/api/generar-guion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData)
    });

    const cacheStatus2 = response2.headers.get('X-Cache-Status');
    const data2 = await response2.json();

    if (cacheStatus2 === 'HIT') {
      log(colors.green, '✅', `Segunda request: HIT (correcto)`);
      console.log('   Guión desde caché:', data2.fromCache ? 'SÍ' : 'NO');
    } else {
      log(colors.red, '❌', `Segunda request: ${cacheStatus2} (esperaba HIT)`);
    }

    // Verificar que el contenido es idéntico
    if (data1.guion === data2.guion) {
      log(colors.green, '✅', 'Contenido idéntico en ambas requests');
    } else {
      log(colors.red, '❌', 'Contenido diferente (¡error!)');
    }

  } catch (error) {
    log(colors.red, '❌', 'Cache test error: ' + error.message);
  }
  console.log('');
}

// Test 4: Rate Limiting
async function testRateLimit() {
  log(colors.blue, '🛡️', 'Test 4: Rate Limiting');

  try {
    log(colors.cyan, '📤', 'Enviando 12 requests rápidas (límite: 10)...');

    let rateLimitTriggered = false;
    let successCount = 0;

    for (let i = 1; i <= 12; i++) {
      const response = await fetch(`${API_URL}/api/generar-guion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: `Rate limit test ${i}`, duracion: 10 })
      });

      const remaining = response.headers.get('X-RateLimit-Remaining');

      if (response.status === 429) {
        rateLimitTriggered = true;
        const data = await response.json();
        log(colors.yellow, '⚠️', `Request ${i}: Rate limit activado (correcto)`);
        console.log('   Retry-After:', data.retryAfter, 'segundos');
        break;
      } else {
        successCount++;
        console.log(`   Request ${i}: OK (Remaining: ${remaining})`);
      }

      await sleep(100);
    }

    if (rateLimitTriggered) {
      log(colors.green, '✅', 'Rate limiting funciona correctamente');
    } else {
      log(colors.red, '❌', 'Rate limiting NO se activó');
    }

  } catch (error) {
    log(colors.red, '❌', 'Rate limit test error: ' + error.message);
  }
  console.log('');
}

// Test 5: Estadísticas de caché
async function testCacheStats() {
  log(colors.blue, '📊', 'Test 5: Estadísticas de Caché');

  try {
    const response = await fetch(`${API_URL}/api/cache-stats`);
    const data = await response.json();

    log(colors.green, '✅', 'Estadísticas obtenidas:');
    console.log('   Entradas en caché:', data.entradas);
    console.log('   IPs en rate limit:', data.rateLimitIPs);
    console.log('   TTL:', data.ttl, 'ms');
  } catch (error) {
    log(colors.red, '❌', 'Cache stats error: ' + error.message);
  }
  console.log('');
}

// Test 6: Limpiar caché
async function testCacheClear() {
  log(colors.blue, '🧹', 'Test 6: Limpiar Caché');

  try {
    const response = await fetch(`${API_URL}/api/cache-clear`, {
      method: 'POST'
    });

    const data = await response.json();

    if (data.success) {
      log(colors.green, '✅', 'Caché limpiado exitosamente');
    } else {
      log(colors.red, '❌', 'Error al limpiar caché');
    }
  } catch (error) {
    log(colors.red, '❌', 'Cache clear error: ' + error.message);
  }
  console.log('');
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('\n');
  log(colors.cyan, '🚀', '='.repeat(60));
  log(colors.cyan, '🧪', 'INICIANDO TESTS DE MEJORAS DEL BACKEND');
  log(colors.cyan, '🚀', '='.repeat(60));
  console.log('\n');

  log(colors.yellow, '⚠️', 'Asegúrate de que el servidor esté corriendo en http://localhost:3000');
  console.log('\n');

  await sleep(2000);

  await testHealthCheck();
  await testValidacion();
  await testCache();
  await testRateLimit();
  await testCacheStats();
  await testCacheClear();

  log(colors.cyan, '🏁', '='.repeat(60));
  log(colors.cyan, '✨', 'TESTS COMPLETADOS');
  log(colors.cyan, '🏁', '='.repeat(60));
  console.log('\n');
}

// Ejecutar
runAllTests().catch(error => {
  log(colors.red, '❌', 'Error fatal: ' + error.message);
  process.exit(1);
});
