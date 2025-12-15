@echo off
title JESUS FOLLOWER Bot
echo Iniciando JESUS FOLLOWER Bot...
cd /d "C:\Users\Usuario\Desktop\JESUSFOLLOWER"
pm2 start ecosystem.config.json
pm2 save
echo Bot iniciado correctamente!
pause