require('dotenv').config();
const { Telegraf } = require('telegraf');
const axios = require('axios');

console.log('🔧 Configurando webhook para el bot...\n');

async function setupWebhook() {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    // Obtener info del bot
    const botInfo = await bot.telegram.getMe();
    console.log(`✅ Bot conectado: @${botInfo.username}`);
    console.log(`📱 Bot ID: ${botInfo.id}`);

    // Configurar ngrok URL temporal para probar
    const ngrokUrl = process.env.NGROK_URL || 'https://your-ngrok-url.ngrok.io';

    console.log(`\n⚠️ CONFIGURACIÓN MANUAL REQUERIDA:`);
    console.log(`1️⃣ Inicia ngrok: ngrok http 3000`);
    console.log(`2️⃣ Copia la URL que aparece (terminada en .ngrok.io)`);
    console.log(`3️⃣ Actualiza NGROK_URL en .env con esa URL`);
    console.log(`4️⃣ Vuelve a ejecutar este script`);

    if (process.env.NGROK_URL && !process.env.NGROK_URL.includes('your-ngrok-url')) {
        try {
            await bot.telegram.setWebhook(`${ngrokUrl}/webhook/${process.env.BOT_TOKEN}`);
            console.log(`\n✅ Webhook configurado exitosamente!`);
            console.log(`🌐 URL del webhook: ${ngrokUrl}/webhook/${process.env.BOT_TOKEN}`);
        } catch (error) {
            console.error('\n❌ Error configurando webhook:', error);
        }
    }

    // Información sobre suscribirse al canal
    console.log(`\n📋 PASOS ADICIONALES:`);
    console.log(`1️⃣ El bot debe unirse al canal como miembro normal`);
    console.log(`2️⃣ Para recibir actualizaciones de canales públicos, el bot no necesita ser admin`);
    console.log(`3️⃣ Asegúrate de que el bot tenga acceso al canal`);

    // Verificar webhook actual
    try {
        const webhookInfo = await bot.telegram.getWebhookInfo();
        console.log(`\n📊 Webhook actual:`);
        console.log(`URL: ${webhookInfo.url || 'No configurado'}`);
        console.log(`Pending updates: ${webhookInfo.pending_update_count || 0}`);
    } catch (error) {
        console.error('\n❌ Error obteniendo info del webhook:', error);
    }
}

setupWebhook().catch(console.error);