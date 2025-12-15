const axios = require('axios');

async function testJupiter() {
    try {
        console.log('🔄 Probando Jupiter API...');

        const response = await axios.get('https://quote-api.jup.ag/v6/quote', {
            params: {
                inputMint: 'So11111111111111111111111111111111111111112',
                outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
                amount: 10000000, // 0.01 SOL
                slippageBps: 1000
            },
            timeout: 10000
        });

        console.log('✅ Jupiter API responde!');
        console.log('📊 Quote:', response.data);

        return true;
    } catch (error) {
        console.error('❌ Error Jupiter:', error.message);
        console.error('Código:', error.code);

        // Probar endpoint alternativo
        try {
            console.log('\n🔄 Probando alternativa...');
            const res = await fetch('https://jup.ag/api/quote/v1?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=10000000');
            const data = await res.json();
            console.log('✅ Alternativa funciona!');
            console.log('📊:', data);
        } catch (e) {
            console.error('❌ Alternativa también falla:', e.message);
        }

        return false;
    }
}

testJupiter();