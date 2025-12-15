# 🚀 Instalación y Configuración 24/7

## 📋 Pasos para tener el bot corriendo 24/7

### 1. Instalar Node.js
- Descargar desde: https://nodejs.org
- Versión 16+ recomendada

### 2. Configurar el proyecto
```bash
# Clonar o descargar el proyecto
cd C:\Users\Usuario\Desktop\JESUSFOLLOWER

# Instalar dependencias
npm install

# Instalar PM2 globalmente
npm install -g pm2
```

### 3. Configurar variables de entorno
Editar el archivo `.env`:
```
BOT_TOKEN=TuTokenDeTelegram
SOLANA_RPC_URL=TuRPCdeSolana
PAYMENT_WALLET_PUBLIC_KEY=TuWalletParaPagos
GITHUB_PAGES_URL=https://usuario.github.io/repo
```

### 4. Iniciar el bot 24/7
Opción A: Ejecutar el batch
```bash
# Doble clic en:
start-bot-service.bat
```

Opción B: Manualmente
```bash
# Iniciar servicios
pm2 start ecosystem.config.json

# Guardar configuración
pm2 save

# Configurar inicio automático
pm2 startup
```

### 5. Verificar estado
```bash
# Ver procesos corriendo
pm2 status

# Ver logs en tiempo real
pm2 logs

# Ver logs de un servicio específico
pm2 logs jesus-premium-bot
pm2 logs payment-server
```

## 🔄 Comandos útiles PM2

```bash
# Reiniciar todos los servicios
pm2 restart all

# Detener todos los servicios
pm2 stop all

# Eliminar todos los servicios
pm2 delete all

# Monitorear
pm2 monit

# Ver estadísticas
pm2 show jesus-premium-bot
```

## ⚡ Auto-inicio en Windows

El bot ya está configurado para iniciar automáticamente gracias al startup script que se encuentra en:
- `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\startup-bot.vbs`

## 🌐 Integración con GitHub Pages

Para aceptar pagos web:
1. Sube el frontend a GitHub Pages
2. Configura la variable `GITHUB_PAGES_URL` en `.env`
3. El bot generará enlaces de pago automáticamente

## 📱 Bot Commands

- `/start` - Iniciar y crear wallet
- `/upgrade` - Actualizar plan
- `/plan` - Ver plan actual
- `/depositar` - Depositar SOL
- `/balance` - Ver balance
- `/posiciones` - Ver posiciones activas

## 💡 Troubleshooting

### Si el bot no inicia:
1. Verificar que Node.js esté instalado
2. Revisar el archivo `.env`
3. Ejecutar `npm install` para actualizar dependencias
4. Ver logs con `pm2 logs`

### Si los pagos no se verifican:
1. Asegurar que el servidor de pagos esté corriendo
2. Verificar la conexión con GitHub Pages
3. Revisar logs del payment-server

### Para reiniciar todo:
```bash
pm2 delete all
npm run premium-vendedor
npm run server
# O mejor: usa start-bot-service.bat
```

## 📊 Monitoreo

Puedes monitorear el bot con:
- PM2 Monit: `pm2 monit`
- Logs en `./logs/`
- Comandos del bot `/stats`

---

🚀 **¡Tu bot está listo para operar 24/7!**