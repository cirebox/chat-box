const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'cirebox.db');
const db = new Database(dbPath);

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_online INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      device_name TEXT,
      content TEXT,
      image TEXT,
      is_own INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE INDEX IF NOT EXISTS idx_messages_device ON messages(device_id);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
  `);
  
  console.log('[DB] Banco de dados inicializado');
}

function getOrCreateDevice(id, name) {
  const existing = db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  
  if (existing) {
    db.prepare('UPDATE devices SET name = ?, last_seen = CURRENT_TIMESTAMP, is_online = 1 WHERE id = ?').run(name, id);
    return db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
  }
  
  db.prepare('INSERT INTO devices (id, name, is_online) VALUES (?, ?, 1)').run(id, name);
  return db.prepare('SELECT * FROM devices WHERE id = ?').get(id);
}

function setDeviceOffline(id) {
  db.prepare('UPDATE devices SET is_online = 0, last_seen = CURRENT_TIMESTAMP WHERE id = ?').run(id);
}

function saveMessage(message) {
  const stmt = db.prepare(`
    INSERT INTO messages (id, device_id, device_name, content, image, is_own, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    message.id,
    message.device_id,
    message.device_name,
    message.content,
    message.image || null,
    message.is_own ? 1 : 0,
    message.timestamp
  );
}

function getMessages(deviceId, limit = 100) {
  return db.prepare(`
    SELECT * FROM messages 
    WHERE device_id = ?
    ORDER BY timestamp ASC
    LIMIT ?
  `).all(deviceId, limit);
}

function getAllConversations() {
  return db.prepare(`
    SELECT d.*, 
           (SELECT content FROM messages WHERE device_id = d.id ORDER BY timestamp DESC LIMIT 1) as last_message,
           (SELECT timestamp FROM messages WHERE device_id = d.id ORDER BY timestamp DESC LIMIT 1) as last_message_time,
           (SELECT COUNT(*) FROM messages WHERE device_id = d.id) as message_count
    FROM devices d
    WHERE d.id IN (SELECT DISTINCT device_id FROM messages)
    ORDER BY last_message_time DESC
  `).all();
}

function clearConversation(deviceId) {
  db.prepare('DELETE FROM messages WHERE device_id = ?').run(deviceId);
}

function getAllMessages(limit = 100) {
  return db.prepare(`
    SELECT * FROM messages 
    ORDER BY timestamp ASC
    LIMIT ?
  `).all(limit);
}

function clearAllMessages() {
  db.prepare('DELETE FROM messages').run();
}

function getAllDevices() {
  return db.prepare('SELECT * FROM devices ORDER BY last_seen DESC').all();
}

function getOnlineDevices() {
  return db.prepare('SELECT * FROM devices WHERE is_online = 1 ORDER BY name').all();
}

function updateDeviceName(id, name) {
  db.prepare('UPDATE devices SET name = ? WHERE id = ?').run(name, id);
}

module.exports = {
  initDatabase,
  getOrCreateDevice,
  setDeviceOffline,
  saveMessage,
  getMessages,
  getAllMessages,
  getAllConversations,
  clearConversation,
  clearAllMessages,
  getAllDevices,
  getOnlineDevices,
  updateDeviceName,
  db
};
