#!/bin/bash

echo "🚀 Deploying Trading Bot Landing to GitHub Pages..."

# Variables
REPO_DIR="bot-trading-landing"
GITHUB_USERNAME="yourusername" # CAMBIA ESTO
REPO_NAME="trading-bot-landing"

# Verificar que el directorio existe
if [ ! -d "$REPO_DIR" ]; then
    echo "❌ Error: El directorio $REPO_DIR no existe"
    exit 1
fi

# Entrar al directorio
cd $REPO_DIR

# Inicializar repo si no existe
if [ ! -d ".git" ]; then
    echo "📦 Inicializando repositorio..."
    git init
    git branch -M main

    # Agregar remote
    git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git

    echo "⚠️  Recuerda crear el repositorio en GitHub:"
    echo "   https://github.com/new"
    echo "   Nombre: $REPO_NAME"
    echo "   Marcar 'Public'"
    echo "   Marcar 'Add a README file'"
fi

# Agregar archivos
git add .
git commit -m "🚀 Deploy landing page - $(date)"

# Push a GitHub
echo "📤 Subiendo a GitHub..."
git push -u origin main --force

# Habilitar GitHub Pages (manejar esto manualmente por ahora)
echo "✅ Listo! Para habilitar GitHub Pages:"
echo "1. Ve a: https://github.com/$GITHUB_USERNAME/$REPO_NAME/settings/pages"
echo "2. En 'Source', selecciona 'Deploy from a branch'"
echo "3. Elige 'main' y '/root'"
echo "4. Guarda y espera 2 minutos"
echo ""
echo "🌐 Tu sitio estará en: https://$GITHUB_USERNAME.github.io/$REPO_NAME/"
echo ""
echo "💡 O usa tu dominio personal en la configuración de Pages"

echo ""
echo "📊 Para verificar el deploy:"
echo "   curl -I https://$GITHUB_USERNAME.github.io/$REPO_NAME/"