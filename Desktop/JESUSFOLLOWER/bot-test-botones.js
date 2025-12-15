require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { session } = require('telegraf');

// Verificar configuración
if (!process.env.BOT_TOKEN) {
    console.error('❌ ERROR: BOT_TOKEN requerido');
    process.exit(1);
}

console.log('🚀 Iniciando Bot Test de Botones...');

// Crear bot
const bot = new Telegraf(process.env.BOT_TOKEN);

// Middleware de sesión - ¡FUNDAMENTAL!
bot.use(session());

// Teclado principal
const mainKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🟢 Test 1', 'test_1')],
    [Markup.button.callback('🔵 Test 2', 'test_2')],
    [Markup.button.callback('❌ Cerrar', 'close')]
]);

// Comando start
bot.start(async (ctx) => {
    await ctx.reply('🤖 **Bot de Test de Botones**\n\nLos botones deberían funcionar ahora:', mainKeyboard);
});

// Manejadores de botones
bot.action('test_1', async (ctx) => {
    await ctx.reply('✅ ¡Botón 1 funcionando!');
    await ctx.answerCbQuery(); // Importante para quitar el "loading"
});

bot.action('test_2', async (ctx) => {
    await ctx.reply('✅ ¡Botón 2 funcionando!');
    await ctx.answerCbQuery();
});

bot.action('close', async (ctx) => {
    await ctx.reply('❌ Menú cerrado');
    await ctx.answerCbQuery();
});

// Mensaje de estado
console.log('✅ Bot test iniciado correctamente');
console.log('📮 Los botones ahora deberían responder');

// Iniciar bot
bot.launch()
    .then(() => {
        console.log('🎉 Bot activo! Prueba los botones con /start');
    })
    .catch(err => {
        console.error('❌ Error iniciando bot:', err);
    });

// Graceful shutdown
process.once('SIGINT', () => {
    console.log('\n🛑 Deteniendo bot...');
    bot.stop('SIGINT');
});

process.once('SIGTERM', () => {
    console.log('\n🛑 Deteniendo bot...');
    bot.stop('SIGTERM');
});