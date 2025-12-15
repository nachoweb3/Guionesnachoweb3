#!/bin/bash
echo "🚀 Iniciando Bot de Trading..."

# Verificar si existe el archivo .env
if [ ! -f ".env" ]; then
    echo "❌ ERROR: No se encuentra el archivo .env"
    echo "   Crea un archivo .env con tu BOT_TOKEN"
    exit 1
fi

# Verificar si el token está configurado
if ! grep -q "BOT_TOKEN=" .env || grep -q "TU_BOT_TOKEN_DE_TELEGRAM" .env; then
    echo "❌ ERROR: BOT_TOKEN no está configurado correctamente"
    echo "   Edita el archivo .env y coloca tu token real"
    exit 1
fi

# Iniciar el bot
echo "✅ Configuración verificada"
echo "🔧 Iniciando bot..."
node bot-simple.js