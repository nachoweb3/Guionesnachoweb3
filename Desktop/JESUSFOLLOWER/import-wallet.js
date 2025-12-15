const fs = require('fs');
const bs58 = require('bs58');
const readline = require('readline');

console.log('🔐 Importación segura de wallet\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Ocultar entrada de clave
const hideInput = (query) => {
    return new Promise((resolve) => {
        const stdin = process.stdin;
        stdin.setRawMode(true);
        process.stdout.write(query);

        let password = '';
        stdin.on('data', function(char) {
            char = char.toString();
            switch(char) {
                case "\n":
                case "\r":
                case "\u0004":
                    stdin.setRawMode(false);
                    stdin.removeAllListeners('data');
                    console.log('\n');
                    resolve(password);
                    break;
                case "\u0003":
                    console.log('\nCancelado');
                    process.exit();
                    break;
                default:
                    password += char;
                    process.stdout.write('*');
                    break;
            }
        });
    });
};

async function importPrivateKey() {
    console.log('✅ Modo seguro activado\n');

    const privateKey = await hideInput('Introduce tu clave privada (base58): ');

    try {
        const { Keypair } = require('@solana/web3.js');
        const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

        console.log(`\n✅ Wallet válida!`);
        console.log(`📍 Public Key: ${keypair.publicKey.toString()}`);

        // Guardar en keypair.json
        fs.writeFileSync('./keypair.json', JSON.stringify(privateKey));
        console.log('✅ Clave guardada en keypair.json');

        // Actualizar .env
        const fs = require('fs');
        let envContent = fs.readFileSync('.env', 'utf8');
        envContent = envContent.replace(
            'WALLET_PRIVATE_KEY=TU_CLAVE_PRIVADA_BASE58',
            `WALLET_PRIVATE_KEY=${privateKey}`
        );
        fs.writeFileSync('.env', envContent);
        console.log('✅ .env actualizado');

        console.log('\n🎯 LISTO! Envía SOL a esta dirección:');
        console.log(`💳 ${keypair.publicKey.toString()}`);

    } catch (error) {
        console.error('\n❌ Clave inválida:', error.message);
    }

    rl.close();
}

importPrivateKey();