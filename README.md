# CIREBOX Chat

Chat local P2P para CIREBOX - funciona em rede local sem necessidade de login.

## Como usar

### 1. Iniciar o servidor ( Tablet )

```bash
cd server
npm install
npm start
```

O servidor vai iniciar na porta 3000 (HTTP) e 8080 (WebSocket).

### 2. Acessar de outros dispositivos

Em outro dispositivo na mesma rede Wi-Fi, abra o navegador e vá para:
- `http://<IP_DO_TABLET>:3000`

Exemplo: `http://192.168.1.100:3000`

### 3. Usar o chat

1. Abra a página e digite seu nome
2. O chat mostra quem está online
3. Envie mensagens de texto e imagens

## Funcionalidades

- **Sem login**: Apenas informe seu nome
- **Descoberta automática**: Servidores são descobertos via broadcast UDP
- **Mensagens de texto**: Comunicação em tempo real
- **Imagens**: Envio de imagens via chat
- **Lista de online**: Veja quem está conectado
- **Histórico**: Últimas 100 mensagens em memória

## Estrutura

```
cirebox-chat/
├── server/
│   ├── index.js      # Servidor WebSocket + HTTP
│   ├── discovery.js  # Descoberta UDP
│   └── package.json
├── web/
│   ├── index.html    # Interface
│   ├── style.css
│   └── client.js
└── README.md
```

## Rede

- WebSocket: Porta 8080
- HTTP: Porta 3000
- UDP Broadcast: Porta 41234
