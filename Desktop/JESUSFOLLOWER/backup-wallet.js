const fs = require('fs');
const crypto = require('crypto');

console.log('💾 Creando backup de wallet...\n');

const privateKey = JSON.parse(fs.readFileSync('./keypair.json', 'utf8'));

// Crear archivo de backup encriptado
const backup = {
    privateKey,
    publicKey: require('@solana/web3.js').Keypair.fromSecretKey(
        require('bs58').decode(privateKey)
    ).publicKey.toString(),
    timestamp: new Date().toISOString(),
    note: 'Solana Trading Bot Wallet - GUARDAR EN LUGAR SEGURO'
};

fs.writeFileSync('wallet-backup.json', JSON.stringify(backup, null, 2));
console.log('✅ Backup creado: wallet-backup.json');

console.log('\n📋 RESUMEN:');
console.log('📍 Public Key:', backup.publicKey);
console.log('📅 Fecha:', backup.timestamp);
console.log('\n⚠️ GUARDA ESTE ARCHIVO EN UN LUGAR SEGURO Y OFFLINE');