const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('📦 Instalando Ngrok para webhook público...\n');

// Determinar OS
const isWindows = process.platform === 'win32';
const ngrokPath = isWindows ? './ngrok.exe' : './ngrok';
const ngrokZip = './ngrok.zip';

// Descargar ngrok
const downloadNgrok = () => {
    return new Promise((resolve, reject) => {
        const platform = isWindows ? 'windows' : 'linux';
        const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
        const version = 'v3.9.0';
        const url = `https://bin.equinox.io/c/bNyj1mQVY4c/${platform}-${arch}/ngrok-${version}-${platform}-${arch}.zip`;

        console.log(`📥 Descargando ngrok para ${platform}-${arch}...`);

        const file = fs.createWriteStream(ngrokZip);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', reject);
    });
};

// Extraer ngrok
const extractNgrok = () => {
    return new Promise((resolve, reject) => {
        const { exec } = require('child_process');

        if (isWindows) {
            exec(`powershell -Command "Expand-Archive -Path ${ngrokZip} -DestinationPath . -Force"`, (error) => {
                if (error) {
                    console.log('Intentando extracción manual...');
                    fs.copyFileSync(path.join('./ngrok-v3-stable-windows-amd64', 'ngrok.exe'), './ngrok.exe');
                }
                resolve();
            });
        } else {
            exec(`unzip ${ngrokZip}`, (error) => {
                resolve();
            });
        }
    });
};

// Proceso de instalación
async function install() {
    try {
        // Verificar si ya existe
        if (fs.existsSync(ngrokPath)) {
            console.log('✅ Ngrok ya está instalado');
            return;
        }

        // Descargar
        await downloadNgrok();
        console.log('✅ Ngrok descargado');

        // Extraer
        await extractNgrok();
        console.log('✅ Ngolk extraído');

        // Limpiar
        fs.unlinkSync(ngrokZip);
        if (isWindows && fs.existsSync('./ngrok-v3-stable-windows-amd64')) {
            fs.rmSync('./ngrok-v3-stable-windows-amd64', { recursive: true });
        }

        // Probar
        try {
            execSync(`${isWindows ? '' : './'}ngrok version`, { stdio: 'pipe' });
            console.log('\n✅ Ngolk instalado exitosamente!');
            console.log('\n➡️ Ahora ejecuta start-webhook.sh para iniciar todo');
        } catch (error) {
            console.log('\n⚠️ Instalación completada pero necesitas configurar ngrok manualmente');
        }

    } catch (error) {
        console.error('❌ Error en instalación:', error.message);
    }
}

install();