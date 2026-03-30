const STORAGE_KEY = 'cirebox_username';
const DEVICE_ID_KEY = 'cirebox_device_id';

let ws = null;
let username = localStorage.getItem(STORAGE_KEY);
let deviceId = localStorage.getItem(DEVICE_ID_KEY);
let reconnectAttempts = 0;
const MAX_RECONNECT = 5;

const loginScreen = document.getElementById('login-screen');
const chatScreen = document.getElementById('chat-screen');
const chatPlaceholder = document.getElementById('chat-placeholder');
const chatInputArea = document.getElementById('chat-input-area');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const connectionStatus = document.getElementById('connection-status');
const deviceNameElement = document.getElementById('device-name');
const searchBtn = document.getElementById('search-btn');
const clearBtn = document.getElementById('clear-btn');
const discoverModal = document.getElementById('discover-modal');
const serverListDiv = document.getElementById('server-list');
const manualIpInput = document.getElementById('manual-ip');
const connectManualBtn = document.getElementById('connect-manual');
const closeModalBtn = document.getElementById('close-modal');
const fileInput = document.getElementById('file-input');
const confirmModal = document.getElementById('confirm-modal');
const confirmCancel = document.getElementById('confirm-cancel');
const confirmOk = document.getElementById('confirm-ok');
const searchModal = document.getElementById('search-modal');
const searchText = document.getElementById('search-text');
const searchUser = document.getElementById('search-user');
const searchResults = document.getElementById('search-results');
const closeSearch = document.getElementById('close-search');

let allMessages = [];

if (username) {
  if (!deviceId) {
    deviceId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  usernameInput.value = username;
  if (deviceNameElement) {
    deviceNameElement.textContent = username;
  }
  showChatScreen();
  connect();
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  username = usernameInput.value.trim().replace(/[<>'"\\/]/g, '');
  if (username) {
    localStorage.setItem(STORAGE_KEY, username);
    if (!deviceId) {
      deviceId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    if (deviceNameElement) {
      deviceNameElement.textContent = username;
    }
    showChatScreen();
    connect();
  }
});

function showChatScreen() {
  loginScreen.classList.add('hidden');
  chatScreen.classList.remove('hidden');
  document.title = `CHATBOX - ${username}`;
}

function connect(serverUrl = null) {
  let url = serverUrl;
  if (!url) {
    const saved = getSavedServer();
    if (saved) {
      const host = saved.includes(':') ? saved : `${saved}:${window.location.port || 8765}`;
      url = `ws://${host}`;
    } else {
      const currentHost = window.location.hostname;
      const currentPort = window.location.port || '8765';
      url = `ws://${currentHost}:${currentPort}`;
    }
  }
  
  console.log('Conectando ao WebSocket:', url);
  updateConnectionStatus('connecting');
  ws = new WebSocket(url);

  ws.onopen = () => {
    reconnectAttempts = 0;
    updateConnectionStatus('online');
    const hostOnly = url.replace('ws://', '').replace(':8765', '').replace(':8766', '').replace(':80', '').replace(':443', '');
    saveServer(hostOnly);
    
    ws.send(JSON.stringify({ 
      type: 'join', 
      name: username,
      id: deviceId
    }));
    
    enableChat();
    chatPlaceholder.classList.add('hidden');
    messagesDiv.classList.remove('hidden');
    chatInputArea.classList.remove('hidden');
  };

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    handleMessage(msg);
  };

  ws.onclose = () => {
    updateConnectionStatus('offline');
    disableChat();
    
    if (reconnectAttempts < MAX_RECONNECT) {
      reconnectAttempts++;
      setTimeout(() => connect(serverUrl), 2000 * reconnectAttempts);
    }
  };

  ws.onerror = () => {
    console.error('Erro na conexão WebSocket');
    updateConnectionStatus('offline');
  };
}

function handleMessage(msg) {
  switch (msg.type) {
    case 'init':
      deviceId = msg.device_id;
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
      if (deviceNameElement && msg.device_name) {
        deviceNameElement.textContent = msg.device_name;
      }
      if (msg.messages && msg.messages.length > 0) {
        msg.messages.forEach(addMessage);
      }
      break;
      
    case 'message':
      addMessage(msg);
      break;
      
    case 'system':
      addSystemMessage(msg);
      break;
      
    case 'chat_cleared':
      messagesDiv.innerHTML = '';
      break;
  }
}

let lastMessageDate = null;

function addMessage(msg) {
  chatPlaceholder.classList.add('hidden');
  messagesDiv.classList.remove('hidden');
  chatInputArea.classList.remove('hidden');
  enableChat();
  
  const msgDate = new Date(msg.timestamp || msg.time);
  const dateKey = msgDate.toDateString();
  
  if (lastMessageDate !== dateKey) {
    const dateDiv = document.createElement('div');
    dateDiv.className = 'date-divider';
    const dateText = formatDateDivider(msgDate);
    dateDiv.textContent = dateText;
    messagesDiv.appendChild(dateDiv);
    lastMessageDate = dateKey;
  }
  
  const div = document.createElement('div');
  const isOwn = msg.is_own || msg.device_id === deviceId;
  div.className = `message ${isOwn ? 'own' : 'other'}`;
  
  const time = msgDate.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const fullDate = msgDate.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  div.title = fullDate;

  let content = '';
  if (!isOwn) {
    const nameColor = msg.name_color || '#128c7e';
    content += `<div class="message-name" style="color: ${nameColor}">${escapeHtml(msg.device_name || msg.name)}</div>`;
  }
  content += `<div class="message-text">${msg.content || msg.text}</div>`;
  
  if (msg.image) {
    content += `<img src="${msg.image}" class="message-image" alt="imagem">`;
  }
  
  content += `<div class="message-time">${time}</div>`;

  div.innerHTML = content;
  messagesDiv.appendChild(div);
  
  const codeEls = div.querySelectorAll('code');
  codeEls.forEach(codeEl => {
    codeEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      copyToClipboard(codeEl.textContent, codeEl);
    });
  });
  
  msg.element = div;
  allMessages.push(msg);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function formatDateDivider(date) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Hoje';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  } else {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}

function addSystemMessage(msg) {
  chatPlaceholder.classList.add('hidden');
  messagesDiv.classList.remove('hidden');
  chatInputArea.classList.remove('hidden');
  
  const div = document.createElement('div');
  div.className = 'message system';
  div.textContent = msg.text;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function updateConnectionStatus(status) {
  if (status === 'online') {
    connectionStatus.textContent = 'online';
    connectionStatus.className = 'header-status online';
  } else if (status === 'connecting') {
    connectionStatus.textContent = 'Conectando...';
    connectionStatus.className = 'header-status';
  } else {
    connectionStatus.textContent = 'Offline';
    connectionStatus.className = 'header-status';
  }
}

function enableChat() {
  messageInput.disabled = false;
  sendBtn.disabled = false;
  messageInput.focus();
}

function disableChat() {
  messageInput.disabled = true;
  sendBtn.disabled = true;
}

clearBtn.addEventListener('click', () => {
  confirmModal.classList.remove('hidden');
});

confirmCancel.addEventListener('click', () => {
  confirmModal.classList.add('hidden');
});

confirmOk.addEventListener('click', () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'clear_chat' }));
    messagesDiv.innerHTML = '';
  }
  confirmModal.classList.add('hidden');
});

const messageFormElement = document.getElementById('message-form');
messageFormElement.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
});

sendBtn.addEventListener('click', () => {
  sendMessage();
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (text && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'message', text }));
    messageInput.value = '';
    messageInput.style.height = 'auto';
  }
}

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function copyToClipboard(text, element) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showCopyFeedback(element, 'Copiado!');
    }).catch(() => {
      fallbackCopy(text, element);
    });
  } else {
    fallbackCopy(text, element);
  }
}

function fallbackCopy(text, element) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    const success = document.execCommand('copy');
    showCopyFeedback(element, success ? 'Copiado!' : 'Erro ao copiar');
  } catch {
    showCopyFeedback(element, 'Erro ao copiar');
  }
  document.body.removeChild(textarea);
}

function showCopyFeedback(element, message) {
  element.title = message;
  setTimeout(() => element.title = '', 2000);
}

messagesDiv.addEventListener('click', (e) => {
  const codeEl = e.target.closest('code');
  if (codeEl) {
    e.preventDefault();
    e.stopPropagation();
    copyToClipboard(codeEl.textContent, codeEl);
  }
});

messageInput.addEventListener('input', () => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'typing' }));
  }
  messageInput.style.height = 'auto';
  messageInput.style.height = messageInput.scrollHeight + 'px';
});

const formatToolbar = document.getElementById('format-toolbar');
if (formatToolbar) {
  formatToolbar.addEventListener('click', (e) => {
    const btn = e.target.closest('.format-btn');
    if (!btn) return;
    
    const format = btn.dataset.format;
    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;
    const text = messageInput.value;
    const selectedText = text.substring(start, end);
    
    let wrapper = '';
    switch (format) {
      case 'bold':
        wrapper = `*${selectedText}*`;
        break;
      case 'italic':
        wrapper = `_${selectedText}_`;
        break;
      case 'strike':
        wrapper = `~${selectedText}~`;
        break;
      case 'code':
        wrapper = `\`${selectedText}\``;
        break;
    }
    
    messageInput.value = text.substring(0, start) + wrapper + text.substring(end);
    messageInput.focus();
    messageInput.setSelectionRange(start + 1, start + 1 + selectedText.length);
  });
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ 
          type: 'message', 
          text: `[Imagem: ${file.name}]`,
          image: reader.result 
        }));
      }
    };
    reader.readAsDataURL(file);
  }
  fileInput.value = '';
});

searchBtn.addEventListener('click', () => {
  searchModal.classList.remove('hidden');
  searchText.value = '';
  searchUser.innerHTML = '<option value="">Todos os usuários</option>';
  const users = [...new Set(allMessages.map(m => m.device_name).filter(Boolean))];
  users.forEach(user => {
    const opt = document.createElement('option');
    opt.value = user;
    opt.textContent = user;
    searchUser.appendChild(opt);
  });
  searchResults.innerHTML = '';
  performSearch();
});

searchText.addEventListener('input', performSearch);
searchUser.addEventListener('change', performSearch);

closeSearch.addEventListener('click', () => {
  searchModal.classList.add('hidden');
});

function performSearch() {
  const text = searchText.value.toLowerCase();
  const user = searchUser.value;
  
  let results = allMessages.filter(m => {
    const matchText = !text || (m.content || m.text || '').toLowerCase().includes(text);
    const matchUser = !user || m.device_name === user;
    return matchText && matchUser;
  });
  
  if (results.length === 0) {
    searchResults.innerHTML = '<div class="search-no-results">Nenhuma mensagem encontrada</div>';
    return;
  }
  
  searchResults.innerHTML = '';
  results.slice(-20).reverse().forEach(msg => {
    const item = document.createElement('div');
    item.className = 'search-result-item';
    const time = new Date(msg.timestamp || msg.time);
    item.innerHTML = `
      <div class="search-result-name" style="color: ${msg.name_color || '#128c7e'}">${escapeHtml(msg.device_name || msg.name)}</div>
      <div class="search-result-text">${msg.content || msg.text}</div>
      <div class="search-result-time">${time.toLocaleString('pt-BR')}</div>
    `;
    item.onclick = () => {
      searchModal.classList.add('hidden');
      msg.element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      msg.element?.classList.add('highlight');
      setTimeout(() => msg.element?.classList.remove('highlight'), 2000);
    };
    searchResults.appendChild(item);
  });
}

function showDiscoverModal() {
  discoverModal.classList.remove('hidden');
  serverListDiv.innerHTML = '<p>Buscando servidores...</p>';
  
  discoverServers().then(servers => {
    if (servers.length === 0) {
      serverListDiv.innerHTML = '<p>Nenhum servidor encontrado na rede.<br>Conecte-se manualmente.</p>';
    } else {
      serverListDiv.innerHTML = '';
      servers.forEach(server => {
        const div = document.createElement('div');
        div.className = 'server-item';
        div.innerHTML = `<strong>${server.name}</strong><br>${server.ip}:${server.wsPort}`;
        div.onclick = () => {
          connect(`ws://${server.ip}:${server.wsPort}`);
          discoverModal.classList.add('hidden');
        };
        serverListDiv.appendChild(div);
      });
    }
  });
}

const savedServer = getSavedServer();
if (!savedServer && username) {
  showDiscoverModal();
}

connectManualBtn.addEventListener('click', () => {
  let ip = manualIpInput.value.trim();
  if (ip) {
    if (!ip.includes(':')) {
      ip = `${ip}:8765`;
    }
    connect(`ws://${ip}`);
    discoverModal.classList.add('hidden');
  }
});

closeModalBtn.addEventListener('click', () => {
  discoverModal.classList.add('hidden');
});

function discoverServers() {
  return new Promise((resolve) => {
    const socket = new WebSocket(`ws://localhost:${window.location.port || 8765}`);
    socket.onopen = () => {
      socket.close();
      resolve([{ name: 'Servidor Local', ip: 'localhost', wsPort: window.location.port || 8765 }]);
    };
    socket.onerror = () => {
      resolve([]);
    };
    setTimeout(() => resolve([]), 3000);
  });
}

function getSavedServer() {
  return localStorage.getItem('cirebox_server');
}

function saveServer(server) {
  localStorage.setItem('cirebox_server', server);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
