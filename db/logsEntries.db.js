// db/logsEntries.db.js
const db = require('../services/db');

async function insertEntry({
  guildId,
  eventKey,
  authorId = null,
  victimId = null,
  channelId = null,
  messageId = null,
  extra = null,
}) {
  await db.query(
    `INSERT INTO logs_entries (guild_id, event_key, author_id, victim_id, channel_id, message_id, extra_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [guildId, eventKey, authorId, victimId, channelId, messageId, extra ? JSON.stringify(extra) : null]
  );
}

module.exports = { insertEntry };
