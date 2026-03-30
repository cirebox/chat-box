const dgram = require('dgram');
const os = require('os');

const BROADCAST_PORT = 41234;
const MESSAGE_TYPE = {
  ANNOUNCE: 'CIREBOX_ANNOUNCE',
  DISCOVER: 'CIREBOX_DISCOVER',
  RESPONSE: 'CIREBOX_RESPONSE'
};

function getLocalIP() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (e) {}
  return null;
}

function startDiscoveryServer(port) {
  const server = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  const localIP = getLocalIP();

  server.on('message', (msg, rinfo) => {
    try {
      const data = JSON.parse(msg.toString());
      
      if (data.type === MESSAGE_TYPE.DISCOVER) {
        const response = JSON.stringify({
          type: MESSAGE_TYPE.RESPONSE,
          ip: localIP,
          wsPort: port,
          name: 'CIREBOX Chat'
        });
        server.send(response, rinfo.port, rinfo.address);
      }
    } catch (e) {
      console.log('Erro ao processar mensagem UDP:', e.message);
    }
  });

  server.on('error', (err) => {
    console.error('Erro no servidor UDP:', err);
    server.close();
  });

  server.bind(BROADCAST_PORT, () => {
    server.setBroadcast(true);
    console.log(`[UDP] Servidor de descoberta rodando na porta ${BROADCAST_PORT}`);
  });

  return server;
}

function broadcastAnnounce(port) {
  const client = dgram.createSocket({ type: 'udp4', reuseAddr: true });
  const localIP = getLocalIP();

  const message = JSON.stringify({
    type: MESSAGE_TYPE.ANNOUNCE,
    ip: localIP,
    wsPort: port,
    name: 'CIREBOX Chat'
  });

  const broadcast = () => {
    client.send(message, BROADCAST_PORT, '255.255.255.255', (err) => {
      if (err) console.error('Erro no broadcast:', err);
    });
  };

  client.bind(() => {
    client.setBroadcast(true);
    broadcast();
    setInterval(broadcast, 10000);
    console.log(`[UDP] Anunciando servidor: ${localIP}:${port}`);
  });

  return client;
}

function discoverServers(timeout = 3000) {
  return new Promise((resolve) => {
    const client = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    const servers = [];
    let resolved = false;

    const message = JSON.stringify({ type: MESSAGE_TYPE.DISCOVER });

    client.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === MESSAGE_TYPE.RESPONSE && !resolved) {
          servers.push(data);
        }
      } catch (e) {}
    });

    client.bind(() => {
      client.setBroadcast(true);
      client.send(message, BROADCAST_PORT, '255.255.255.255');
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        client.close();
        resolve(servers);
      }
    }, timeout);
  });
}

module.exports = {
  startDiscoveryServer,
  broadcastAnnounce,
  discoverServers,
  BROADCAST_PORT
};
