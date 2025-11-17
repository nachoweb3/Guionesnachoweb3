#!/usr/bin/env node

/**
 * 🔍 Verificador de Deploy
 * Revisa que todo esté listo para desplegar
 */

import { existsSync, readFileSync } from 'fs';
import { spawn } from 'child_process';

function showBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🔍 VERIFICADOR DE DEPLOY READY                              ║
║  📋 Checklist completo antes del deploy                     ║
╚══════════════════════════════════════════════════════════════╝
`);
}

function checkFile(path, name) {
  const exists = existsSync(path);
  console.log(`${exists ? '✅' : '❌'} ${name}: ${path}`);
  return exists;
}

function checkPackageJson() {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    console.log('\n📦 Package.json:');
    
    const checks = [
      ['✅ Tiene type: module', pkg.type === 'module'],
      ['✅ Tiene start script', !!pkg.scripts?.start],
      ['✅ Tiene dependencies', Object.keys(pkg.dependencies || {}).length > 0],
      ['✅ Tiene express', !!pkg.dependencies?.express],
      ['✅ Tiene groq-sdk', !!pkg.dependencies?.['groq-sdk']],
      ['✅ Node version >= 18', pkg.engines?.node?.includes('18')]
    ];
    
    checks.forEach(([desc, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${desc.slice(2)}`);
    });
    
    return checks.every(([, passed]) => passed);
  } catch (error) {
    console.log('❌ Error leyendo package.json');
    return false;
  }
}

function checkConfigFiles() {
  console.log('\n🔧 Archivos de configuración:');
  
  const files = [
    ['netlify.toml', 'Netlify config'],
    ['vercel.json', 'Vercel config'], 
    ['railway.json', 'Railway config'],
    ['render.yaml', 'Render config'],
    ['.env.example', 'Environment template']
  ];
  
  return files.map(([file, desc]) => checkFile(file, desc)).every(Boolean);
}

function checkSourceFiles() {
  console.log('\n📁 Archivos fuente:');
  
  const files = [
    ['server.js', 'Servidor principal'],
    ['public/index.html', 'Frontend'],
    ['public/js/app.js', 'JavaScript frontend'],
    ['public/css/styles.css', 'Estilos'],
    ['config/iaProviders.js', 'Providers IA'],
    ['utils/generadorGuion.js', 'Generador de guiones'],
    ['utils/whisperTranscriber.js', 'Transcripción'],
    ['utils/contenidoRelacionado.js', 'Investigación']
  ];
  
  return files.map(([file, desc]) => checkFile(file, desc)).every(Boolean);
}

function checkNetlifyFunctions() {
  console.log('\n⚡ Funciones Netlify:');
  
  const functions = [
    ['netlify/functions/generar-guion.js', 'Generar guión'],
    ['netlify/functions/transcribir-audio.js', 'Transcribir audio'],
    ['netlify/functions/contenido-relacionado.js', 'Contenido relacionado'],
    ['netlify/functions/expandir-guion.js', 'Expandir guión'],
    ['netlify/functions/health.js', 'Health check']
  ];
  
  return functions.map(([file, desc]) => checkFile(file, desc)).every(Boolean);
}

function checkImports() {
  console.log('\n📦 Verificando imports...');
  
  try {
    const serverContent = readFileSync('server.js', 'utf8');
    const hasCorrectImports = [
      serverContent.includes("from './utils/generadorGuion.js'"),
      serverContent.includes("from './utils/whisperTranscriber.js'"),
      serverContent.includes("from './utils/contenidoRelacionado.js'")
    ].every(Boolean);
    
    console.log(`${hasCorrectImports ? '✅' : '❌'} Imports correctos en server.js`);
    return hasCorrectImports;
  } catch (error) {
    console.log('❌ Error verificando imports');
    return false;
  }
}

async function testServer() {
  console.log('\n🧪 Test rápido del servidor...');
  
  return new Promise((resolve) => {
    try {
      const server = spawn('node', ['server.js'], { 
        stdio: 'pipe',
        env: { ...process.env, PORT: '3001' }
      });
      
      let output = '';
      server.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      server.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      setTimeout(() => {
        server.kill();
        
        if (output.includes('Servidor iniciado')) {
          console.log('✅ Servidor inicia correctamente');
          resolve(true);
        } else {
          console.log('❌ Error al iniciar servidor');
          console.log('📋 Output:', output.slice(0, 200));
          resolve(false);
        }
      }, 3000);
      
    } catch (error) {
      console.log('❌ Error en test de servidor');
      resolve(false);
    }
  });
}

function showDeployOptions() {
  console.log(`
🚀 OPCIONES DE DEPLOY DISPONIBLES:

📍 NETLIFY (Recomendado):
   npm run deploy:netlify

📍 VERCEL (Más rápido):  
   npm run deploy:vercel

📍 RAILWAY (Control total):
   npm run deploy:railway

🔧 CONFIGURAR API KEY (opcional):
   1. console.groq.com → Crear cuenta
   2. Copiar API key
   3. Agregar en variables de entorno

💡 La app funciona SIN API key usando Ollama local.
`);
}

function showResults(results) {
  const allPassed = results.every(Boolean);
  
  console.log(`
════════════════════════════════════════════════════════════════

${allPassed ? '🎉 ¡LISTO PARA DEPLOY!' : '⚠️  REVISAR ERRORES'}

${allPassed 
  ? '✅ Todos los checks pasaron\n✅ Tu app está lista para producción\n✅ Puedes hacer deploy ahora mismo' 
  : '❌ Hay algunos problemas que resolver\n💡 Revisa los errores arriba\n🔧 Corrige y vuelve a verificar'
}

════════════════════════════════════════════════════════════════
`);

  if (allPassed) {
    showDeployOptions();
  }
}

async function main() {
  showBanner();
  
  const results = [
    checkPackageJson(),
    checkConfigFiles(),
    checkSourceFiles(),
    checkNetlifyFunctions(),
    checkImports(),
    await testServer()
  ];
  
  showResults(results);
}

main().catch(console.error);