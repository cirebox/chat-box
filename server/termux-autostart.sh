#!/data/data/com.termux/files/usr/bin/bash
cd /data/data/com.termux/files/home/workspace/chat-box/server
pm2 start ecosystem.config.js
pm2 save
