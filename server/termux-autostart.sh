#!/data/data/com.termux/files/usr/bin/bash
cd /root/workspace/chat-box/server
pm2 start index.js --name chat-box
pm2 save
