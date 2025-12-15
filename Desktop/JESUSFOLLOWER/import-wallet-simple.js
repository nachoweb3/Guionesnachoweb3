const fs = require('fs');
const bs58 = require('bs58');

console.log('🔐 Importación de wallet\n');
console.log('⚠️ ADVERTENCIA: Escribe tu clave con cuidado\n');

// Procesar la clave que mencionaste (como ejemplo)
const exampleKey = '2f4zwYy1ZegnA4YJ22HrVnequkYYgdJJ1kqxgrKW6Aabzme9xu3nbUX4i1q8BXatthVKEPx4npDR22EqBxCAxwH5';

try {
    const { Keypair } = require('@solana/web3.js');
    const keypair = Keypair.fromSecretKey(bs58.decode(exampleKey));

    console.log(`✅ Wallet válida!`);
    console.log(`📍 Public Key: ${keypair.publicKey.toString()}`);

    // Guardar en keypair.json
    fs.writeFileSync('./keypair.json', JSON.stringify(exampleKey));
    console.log('✅ Clave guardada en keypair.json');

    // Actualizar .env
    let envContent = fs.readFileSync('.env', 'utf8');
    envContent = envContent.replace(
        'WALLET_PRIVATE_KEY=TU_CLAVE_PRIVADA_BASE58',
        `WALLET_PRIVATE_KEY=${exampleKey}`
    );
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env actualizado');

    console.log('\n🎯 LISTO! La wallet está configurada');
    console.log('\n⚠️ PRÓXIMO PASO:');
    console.log('1. Envía SOL a esta dirección:');
    console.log(`💳 ${keypair.publicKey.toString()}`);
    console.log('\n2. Luego prueba el bot con:');
    console.log('   node test-bot.js');
    console.log('\n3. Empieza con pequeños montos (0.01 SOL)');

} catch (error) {
    console.error('\n❌ Error al procesar la clave:', error.message);
}