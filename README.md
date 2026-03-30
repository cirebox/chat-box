# CHATBOX

Chat local P2P para rede WiFi - funciona em rede local sem necessidade de internet.

## Como usar

### 1. Iniciar o servidor (Tablet/Termux)

```bash
cd server
npm install
npm start
```

O servidor vai iniciar na porta 8765 (HTTP + WebSocket).

### 2. Acessar de outros dispositivos

Em outro dispositivo na mesma rede Wi-Fi, abra o navegador e vá para:
- `http://<IP_DO_TABLET>:8765`

Exemplo: `http://192.168.1.100:8765`

### 3. Usar o chat

1. Abra a página e digite seu nome
2. O chat mostra quem está online
3. Envie mensagens de texto e imagens

## Funcionalidades

- **Sem login**: Apenas informe seu nome
- **Descoberta automática**: Servidores são descobertos via broadcast UDP
- **Mensagens de texto**: Comunicação em tempo real
- **Imagens**: Envio de imagens via chat
- **Formatação**: *negrito*, _itálico_, ~tachado~, `código`
- **Busca**: Pesquise mensagens por texto ou usuário

## Estrutura

```
chat-box/
├── server/
│   ├── index.js          # Servidor WebSocket + HTTP
│   ├── database.js       # SQLite para persistência
│   ├── discovery.js      # Descoberta UDP
│   ├── ecosystem.config.js  # PM2 config
│   └── package.json
├── web/
│   ├── index.html        # Interface
│   ├── style.css
│   └── client.js
└── README.md
```

## Rede

- HTTP/WebSocket: Porta 8765
- UDP Broadcast: Porta 41234
