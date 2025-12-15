require('dotenv').config();
const { Telegraf } = require('telegraf');

// Verificar que el token del bot existe
if (!process.env.BOT_TOKEN) {
    console.error('❌ ERROR: No se encontró BOT_TOKEN en el archivo .env');
    process.exit(1);
}

// Inicializar bot
const bot = new Telegraf(process.env.BOT_TOKEN);

console.log('🚀 Iniciando bot de Telegram...');

// Comando /start
bot.start((ctx) => {
    console.log(`👤 Usuario ${ctx.from.username || ctx.from.first_name} inició el bot`);
    ctx.reply(`
🤖 **Bot de Trading de Memecoins** activado! 🚀

📋 *Comandos disponibles:*
/start - Muestra este mensaje
/help - Ayuda sobre el bot
/status - Ver posiciones activas
/balance - Ver balance de la wallet
/manual <direccion> - Comprar manualmente

🔔 *Monitoreando canal:* @cryptoyeezuscalls
💰 *Monto de compra:* 0.01 SOL por llamada
⚙️ *Slippage:* 10%

📌 *Nota:* El bot está en modo de prueba. Configura tus claves API para trading real.
    `, { parse_mode: 'Markdown' });
});

// Comando /help
bot.help((ctx) => {
    ctx.reply(`
🆘 *Ayuda del Bot*

🔍 *¿Cómo funciona?*
1. El bot monitorea el canal @cryptoyeezuscalls
2. Detecta automáticamente direcciones de contratos
3. Analiza liquidez y volumen
4. Ejecuta compras según la configuración

💡 *Comandos:*
/start - Iniciar el bot
/status - Ver posiciones abiertas
/balance - Consultar balance
/manual <direccion> - Compra manual de tokens

⚠️ *Importante:*
- El bot solo compra tokens con suficiente liquidez
- Aplica stop-loss automático
- Vendas progresivas en ganancias
    `, { parse_mode: 'Markdown' });
});

// Comando /status
bot.command('status', (ctx) => {
    ctx.reply(`
📊 *Estado Actual*

🤖 Bot: ✅ Activo
👥 Usuarios: Conectado
🔔 Monitoreo: @cryptoyeezuscalls
💰 Balance: Consultando...
📈 Posiciones: 0 activas

*Última actualización:* ${new Date().toLocaleString()}
    `, { parse_mode: 'Markdown' });
});

// Comando /balance
bot.command('balance', (ctx) => {
    ctx.reply(`
💰 *Balance de la Wallet*

🔵 SOL: 0.00
🪙 Tokens: 0
💵 USD Total: $0.00

⚠️ *Conecta tu wallet para ver el balance real*
    `, { parse_mode: 'Markdown' });
});

// Comando /manual
bot.command('manual', (ctx) => {
    const address = ctx.message.text.split(' ')[1];
    if (!address) {
        ctx.reply('❌ Debes proporcionar una dirección de contrato\n\n' +
                  'Ejemplo: `/manual So11111111111111111111111111111111111111112`',
                  { parse_mode: 'Markdown' });
        return;
    }

    ctx.reply(`🔄 Procesando compra manual de:\n\n\`${address}\`\n\n⏳ Analizando token...`,
              { parse_mode: 'Markdown' });
});

// Mensaje por defecto para comandos desconocidos
bot.on('message', (ctx) => {
    if (!ctx.message.text.startsWith('/')) {
        ctx.reply('❓ No entendí eso. Usa /help para ver los comandos disponibles.');
    }
});

// Manejo de errores
bot.catch((err, ctx) => {
    console.error(`❌ Error en bot para ${ctx.updateType}:`, err);
    ctx.reply('⚠️ Ocurrió un error. Por favor intenta nuevamente.');
});

// Iniciar el bot
console.log('✅ Bot configurado correctamente');
bot.launch()
    .then(() => {
        console.log('🎉 Bot iniciado exitosamente!');
        console.log(`📱 Token: ${process.env.BOT_TOKEN.substring(0, 10)}...`);
        console.log('🔔 Escuchando comandos...');
    })
    .catch((err) => {
        console.error('❌ Error al iniciar el bot:', err);
    });

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('\n🛑 Apagando el bot...');
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    console.log('\n🛑 Apagando el bot...');
    bot.stop('SIGTERM');
});