@echo off
echo Iniciando JESUS FOLLOWER Bot Premium 24/7...
cd /d "C:\Users\Usuario\Desktop\JESUSFOLLOWER"

pm2 start ecosystem.config.json
pm2 save
pm2 startup

echo.
echo ✅ Bot iniciado correctamente!
echo 💻 Para ver el estado: pm2 status
echo 📋 Para ver logs: pm2 logs
echo 🔄 Para reiniciar: pm2 restart all
echo.
echo El bot se iniciará automáticamente cada vez que enciendas la PC.
pause