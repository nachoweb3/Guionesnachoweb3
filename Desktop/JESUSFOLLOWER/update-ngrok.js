require('dotenv').config();
const fs = require('fs');

// Leer el nuevo ngrok URL de los argumentos
const newNgrokUrl = process.argv[2];

if (!newNgrokUrl) {
    console.log('❌ Por favor, proporciona la nueva URL de ngrok');
    console.log('Uso: node update-ngrok.js https://tu-nueva-url.ngrok-free.app');
    process.exit(1);
}

// Actualizar el archivo ai-trading-bot.js con la nueva URL
const botFile = fs.readFileSync('./ai-trading-bot.js', 'utf8');
const updatedBotFile = botFile.replace(
    /https:\/\/[a-f0-9]+\.ngrok-free\.app/g,
    newNgrokUrl
);

fs.writeFileSync('./ai-trading-bot.js', updatedBotFile);

// También actualizar otros archivos de bot
const files = ['enhanced-bot-webhook.js', 'bot-webhook.js'];
files.forEach(file => {
    if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8');
        const updated = content.replace(
            /https:\/\/[a-f0-9]+\.ngrok-free\.app/g,
            newNgrokUrl
        );
        fs.writeFileSync(file, updated);
        console.log(`✅ Actualizado ${file}`);
    }
});

// Actualizar el .env con la nueva URL
const envFile = fs.readFileSync('.env', 'utf8');
const updatedEnv = envFile.replace(
    /NGROK_URL=.+/g,
    `NGROK_URL=${newNgrokUrl}`
);
fs.writeFileSync('.env', updatedEnv);

console.log(`\n✅ URL de ngrok actualizada a: ${newNgrokUrl}`);
console.log('\n📌 Archivos actualizados:');
console.log('  • ai-trading-bot.js');
console.log('  • enhanced-bot-webhook.js');
console.log('  • bot-webhook.js');
console.log('  • .env');
console.log('\n🚀 Ahora puedes reiniciar el bot con: node ai-trading-bot.js');