const https = require('https');

const options = {
    hostname: 'localhost',
    port: 4040,
    path: '/api/tunnels',
    method: 'GET'
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const tunnels = JSON.parse(data);
            if (tunnels.tunnels && tunnels.tunnels.length > 0) {
                const publicUrl = tunnels.tunnels[0].public_url;
                console.log('\n✅ URL de ngrok encontrada:');
                console.log(publicUrl);
                console.log('\n📝 Copia esta URL y actualiza tu archivo .env');
            } else {
                console.log('❌ No hay túneles activos. Asegúrate de que ngrok esté corriendo con: ngrok http 8080');
            }
        } catch (e) {
            console.log('❌ Error al parsear la respuesta. Asegúrate de que ngrok esté corriendo.');
        }
    });
});

req.on('error', (e) => {
    console.log('❌ Error conectando con ngrok. Asegúrate de que ngrok esté corriendo en el puerto 4040');
});

req.end();