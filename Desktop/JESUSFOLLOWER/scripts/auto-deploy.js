const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Auto-Deploy Script para JESUS FOLLOWER BOT
const deploy = async () => {
    console.log('🚀 Iniciando auto-deploy...');

    // Verificar si hay cambios en el repositorio
    exec('git status --porcelain', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Error verificando git:', error);
            return;
        }

        if (stdout.trim()) {
            console.log('📝 Cambios detectados, iniciando deploy...');

            // Hacer commit de cambios
            exec('git add .', (err) => {
                if (err) console.error(err);

                exec('git commit -m "🚀 Auto-deploy: Bot ultimate version"', (err) => {
                    if (err) console.error(err);

                    // Push a GitHub
                    exec('git push origin main', (err) => {
                        if (err) console.error(err);
                        console.log('✅ Deploy completado!');

                        // Reiniciar bot con PM2
                        exec('pm2 restart JF-BOT-ULTIMATE', (err) => {
                            if (err) console.error(err);
                            console.log('🔄 Bot reiniciado con éxito!');
                        });
                    });
                });
            });
        } else {
            console.log('✅ No hay cambios, deploy no necesario');
        }
    });
};

// Ejecutar cada 5 minutos
setInterval(deploy, 300000);

// Ejecutar inmediatamente
deploy();