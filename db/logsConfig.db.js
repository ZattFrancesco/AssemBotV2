// db/logsConfig.db.js
// Requires: services/db.js -> exports { query(sql, params) } returning rows array.
const db = require('../services/db');

async function ensureDefaults(guildId, eventKeys) {
  if (!guildId || !Array.isArray(eventKeys) || eventKeys.length === 0) return;
  // Insert disabled by default
  for (const key of eventKeys) {
    await db.query(
      `INSERT IGNORE INTO logs_config (guild_id, event_key, enabled, channel_id)
       VALUES (?, ?, 0, NULL)`,
      [guildId, key]
    );
  }
}

async function getAllConfigs(guildId) {
  const rows = await db.query(
    `SELECT event_key, enabled, channel_id
     FROM logs_config
     WHERE guild_id=?`,
    [guildId]
  );
  const map = new Map();
  for (const r of rows || []) map.set(r.event_key, { enabled: !!r.enabled, channelId: r.channel_id || null });
  return map;
}

async function getConfig(guildId, eventKey) {
  const rows = await db.query(
    `SELECT enabled, channel_id FROM logs_config WHERE guild_id=? AND event_key=?`,
    [guildId, eventKey]
  );
  return rows?.[0] ? { enabled: !!rows[0].enabled, channelId: rows[0].channel_id || null } : null;
}

async function setEnabled(guildId, eventKey, enabled) {
  await db.query(
    `INSERT INTO logs_config (guild_id, event_key, enabled, channel_id)
     VALUES (?, ?, ?, NULL)
     ON DUPLICATE KEY UPDATE enabled=VALUES(enabled)`,
    [guildId, eventKey, enabled ? 1 : 0]
  );
}

async function setChannel(guildId, eventKey, channelId) {
  await db.query(
    `INSERT INTO logs_config (guild_id, event_key, enabled, channel_id)
     VALUES (?, ?, 1, ?)
     ON DUPLICATE KEY UPDATE channel_id=VALUES(channel_id)`,
    [guildId, eventKey, channelId || null]
  );
}

async function setChannelForMany(guildId, eventKeys, channelId) {
  if (!Array.isArray(eventKeys) || eventKeys.length === 0) return;
  for (const key of eventKeys) {
    await db.query(
      `INSERT INTO logs_config (guild_id, event_key, enabled, channel_id)
       VALUES (?, ?, 1, ?)
       ON DUPLICATE KEY UPDATE channel_id=VALUES(channel_id)`,
      [guildId, key, channelId || null]
    );
  }
}

async function setEnabledForMany(guildId, eventKeys, enabled) {
  if (!Array.isArray(eventKeys) || eventKeys.length === 0) return;
  for (const key of eventKeys) {
    await db.query(
      `INSERT INTO logs_config (guild_id, event_key, enabled, channel_id)
       VALUES (?, ?, ?, NULL)
       ON DUPLICATE KEY UPDATE enabled=VALUES(enabled)`,
      [guildId, key, enabled ? 1 : 0]
    );
  }
}

module.exports = {
  ensureDefaults,
  getAllConfigs,
  getConfig,
  setEnabled,
  setChannel,
  setChannelForMany,
  setEnabledForMany,
};
