# 🚀 Inicio Rápido - Bot de Trading 24/7

## ⚡ Pasos para ponerlo en marcha en 5 minutos

### 1️⃣ Preparar el entorno

```bash
# Instalar dependencias
npm install

# O si tienes Docker:
docker-compose up -d
```

### 2️⃣ Configurar el bot

```bash
# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus datos:
nano .env
```

**Necesitarás:**
- Bot Token de Telegram (crea uno en @BotFather)
- API Key de Helius RPC (regístrate en helius.dev)
- Clave privada de tu wallet de Solana

### 3️⃣ Configurar la wallet

```bash
# Opción A: Importar wallet existente
node setup-wallet.js
# Selecciona opción 1 o 3

# Opción B: Generar nueva wallet
node setup-wallet.js
# Selecciona opción 2
# ¡ENVÍA SOL A LA DIRECCIÓN QUE APAREZCA!
```

### 4️⃣ Probar localmente

```bash
# Probar el bot
npm start

# En Telegram, envíale un mensaje a tu bot:
/start
```

### 5️⃣ Desplegar 24/7

**Opción A: VPS Linux (Recomendado)**
```bash
# Subir archivos al VPS
scp -r . user@tu-vps:/home/user/bot/

# Conectarse al VPS
ssh user@tu-vps

# Desplegar
cd bot
chmod +x deploy-bot.sh
./deploy-bot.sh
```

**Opción B: Docker**
```bash
# Iniciar contenedor
docker-compose up -d

# Ver logs
docker logs solana-memecoin-bot
```

**Opción C: PM2 (Local)**
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar bot con PM2
pm2 start memecoin-trading-bot.js --name "trading-bot"
pm2 save
pm2 startup
```

## 📊 Monitoreo

Accede al dashboard web:
- Local: http://localhost:3000
- VPS: http://IP_DEL_VPS:3000

## ⚠️ ANTES DE EMPEZAR

1. **Empieza con poco**: 0.01 SOL por trade
2. **Prueba primero**: Haz una compra manual con `/manual`
3. **Verifica la wallet**: Asegúrate que tiene fondos
4. **Configura stop loss**: Por defecto es -30%

## 🎯 Estrategia Configurada

- ✅ Compra automática al detectar token
- ✅ Vende 60% cuando duplica (2x)
- ✅ Vende progresivamente: 20% más en 3x, resto en 5x
- ✅ Stop loss si cae 30%
- ✅ Solo compra tokens con liquidez > $10,000

## 🔧 Comandos útiles

```bash
# Ver estado del bot (PM2)
pm2 status

# Ver logs en tiempo real
pm2 logs trading-bot

# Reiniciar bot
pm2 restart trading-bot

# Ver logs de Docker
docker logs -f solana-memecoin-bot
```

## 📱 Telegram Commands

- `/start` - Iniciar bot
- `/status` - Ver posiciones activas
- `/manual <direccion>` - Comprar manualmente
- `/balance` - Ver balance wallet

## 🚨 EMERGENCIA

Para detener todo inmediatamente:
```bash
# PM2
pm2 delete trading-bot

# Docker
docker-compose down

# VPS
pkill -f memecoin-trading-bot
```

**¡Listo! Tu bot está operando 24/7 automáticamente.**