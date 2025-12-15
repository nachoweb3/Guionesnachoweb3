#!/bin/bash

# JESUS FOLLOWER BOT ULTIMATE - Deploy Script
# Script para despliegue en producción con PM2

echo "🚀 Iniciando deploy de JESUS FOLLOWER BOT ULTIMATE..."

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no instalado. Por favor instala Node.js 16+"
    exit 1
fi

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2..."
    npm install -g pm2
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Crear archivos necesarios
echo "📁 Creando estructura de archivos..."
mkdir -p logs
mkdir -p backups

# Verificar .env
if [ ! -f .env ]; then
    echo "⚠️  Archivo .env no encontrado. Creando desde ejemplo..."
    cp .env.example .env
    echo "❗ Por favor edita .env con tus configuraciones"
    exit 1
fi

# Parar instancia anterior si existe
echo "🛑 Deteniendo instancia anterior..."
pm2 stop JF-BOT-ULTIMATE 2>/dev/null || true
pm2 delete JF-BOT-ULTIMATE 2>/dev/null || true

# Iniciar bot con PM2
echo "🚀 Iniciando bot con PM2..."
pm2 start JESUS_FOLLOWER_BOT_ULTIMATE.js --name "JF-BOT-ULTIMATE" --log-date-format "YYYY-MM-DD HH:mm:ss Z"

# Configurar PM2 para auto-restart
pm2 startup
pm2 save

# Verificar estado
echo "📊 Verificando estado..."
sleep 3
pm2 status

# Mostrar logs
echo ""
echo "📝 Para ver logs en tiempo real:"
echo "pm2 logs JF-BOT-ULTIMATE"
echo ""
echo "✅ Deploy completado!"
echo "📊 Dashboard PM2: pm2 monit"
echo "📈 Estadísticas: pm2 show JF-BOT-ULTIMATE"