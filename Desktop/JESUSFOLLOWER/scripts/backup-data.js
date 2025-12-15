const fs = require('fs');
const path = require('path');
const moment = require('moment');

// Script de Backup Automático para datos del bot
const backupData = () => {
    console.log('💾 Iniciando backup de datos...');

    const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
    const backupFolder = path.join(__dirname, '../backups');

    // Crear carpeta de backups si no existe
    if (!fs.existsSync(backupFolder)) {
        fs.mkdirSync(backupFolder, { recursive: true });
    }

    // Archivos a respaldar
    const filesToBackup = [
        'users_db.json',
        'payments_db.json',
        'positions_db.json',
        'wallets_backup.json'
    ];

    filesToBackup.forEach(file => {
        const source = path.join(__dirname, '../', file);
        const dest = path.join(backupFolder, `${timestamp}_${file}`);

        if (fs.existsSync(source)) {
            fs.copyFile(source, dest, (err) => {
                if (err) {
                    console.error(`❌ Error backup ${file}:`, err);
                } else {
                    console.log(`✅ Backup ${file} completado`);
                }
            });
        }
    });

    // Eliminar backups antiguos (mantener últimos 7 días)
    const files = fs.readdirSync(backupFolder);
    const sevenDaysAgo = moment().subtract(7, 'days');

    files.forEach(file => {
        const filePath = path.join(backupFolder, file);
        const stats = fs.statSync(filePath);

        if (moment(stats.mtime) < sevenDaysAgo) {
            fs.unlink(filePath, (err) => {
                if (!err) {
                    console.log(`🗑️  Backup antiguo eliminado: ${file}`);
                }
            });
        }
    });

    console.log('✨ Backup completado!');
};

// Ejecutar backup cada 6 horas
setInterval(backupData, 21600000);

// Ejecutar al iniciar
backupData();