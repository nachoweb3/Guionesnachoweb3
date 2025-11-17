#!/usr/bin/env node

/**
 * 🚀 Script de Deploy Automatizado
 * Despliega la aplicación en múltiples plataformas fácilmente
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

const PLATFORMS = {
  netlify: {
    name: 'Netlify',
    command: 'netlify deploy --prod',
    setup: 'npm install -g netlify-cli && netlify login',
    description: 'Mejor para funciones serverless'
  },
  vercel: {
    name: 'Vercel', 
    command: 'vercel --prod',
    setup: 'npm install -g vercel',
    description: 'Deploy más rápido'
  },
  railway: {
    name: 'Railway',
    command: 'railway deploy',
    setup: 'npm install -g @railway/cli && railway login',
    description: 'Bueno para apps persistentes'
  }
};

function showBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🚀 DEPLOY AUTOMATIZADO - GENERADOR DE GUIONES IA           ║
║  📝 Deploy tu app en minutos a cualquier plataforma         ║
╚══════════════════════════════════════════════════════════════╝
`);
}

function showPlatforms() {
  console.log('📋 Plataformas disponibles:\n');
  Object.entries(PLATFORMS).forEach(([key, platform], index) => {
    console.log(`${index + 1}. ${platform.name} - ${platform.description}`);
  });
  console.log('');
}

function checkDependencies() {
  console.log('🔍 Verificando dependencias...');
  
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  const hasAllDeps = [
    'express',
    'cors', 
    'dotenv',
    'groq-sdk'
  ].every(dep => packageJson.dependencies[dep]);
  
  if (!hasAllDeps) {
    console.log('❌ Faltan dependencias. Ejecutando npm install...');
    return runCommand('npm install');
  }
  
  console.log('✅ Dependencias verificadas');
  return Promise.resolve();
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`⚡ Ejecutando: ${command}`);
    const child = spawn(command, { shell: true, stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Comando falló con código ${code}`));
      }
    });
    
    child.on('error', reject);
  });
}

async function deployTo(platform) {
  const config = PLATFORMS[platform];
  if (!config) {
    throw new Error(`Plataforma desconocida: ${platform}`);
  }
  
  console.log(`\n🚀 Desplegando en ${config.name}...`);
  
  try {
    await runCommand(config.command);
    console.log(`\n✅ ¡Deploy en ${config.name} completado!`);
    showPostDeployInfo(platform);
  } catch (error) {
    console.log(`\n❌ Error en deploy de ${config.name}:`);
    console.log(`💡 Primero ejecuta: ${config.setup}`);
    console.log(`📖 Luego intenta de nuevo: npm run deploy`);
  }
}

function showPostDeployInfo(platform) {
  console.log(`
🎉 ¡DEPLOY EXITOSO!

📋 Qué verificar ahora:
1. ✅ Visita tu sitio web
2. ✅ Prueba: /api/health 
3. ✅ Configura GROQ_API_KEY (opcional)
4. ✅ Genera tu primer guion

🔑 Para configurar API Key:
   - Ve a console.groq.com
   - Obtén clave gratis
   - Agrégala en variables de entorno

💡 Tu app funciona sin API Key usando Ollama local.
`);
}

function showEnvironmentHelp() {
  console.log(`
🔧 CONFIGURACIÓN DE VARIABLES DE ENTORNO:

📍 Netlify:
   Site Settings → Environment Variables → Add:
   GROQ_API_KEY = tu_clave_aqui

📍 Vercel:
   vercel env add GROQ_API_KEY
   (o desde dashboard web)

📍 Railway:
   Variables tab → Add:
   GROQ_API_KEY = tu_clave_aqui

🆓 Obtener clave GRATIS:
   https://console.groq.com → Create account → Copy API Key
`);
}

async function main() {
  showBanner();
  
  const platform = process.argv[2];
  
  if (!platform) {
    showPlatforms();
    console.log('💡 Uso: npm run deploy [plataforma]');
    console.log('   Ejemplo: npm run deploy netlify\n');
    showEnvironmentHelp();
    return;
  }
  
  if (platform === 'help' || platform === '--help') {
    showEnvironmentHelp();
    return;
  }
  
  try {
    await checkDependencies();
    await deployTo(platform);
  } catch (error) {
    console.error('\n❌ Error durante el deploy:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);