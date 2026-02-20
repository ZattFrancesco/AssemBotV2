// events/messageDelete.js
const { makeLogEmbed, trim } = require('../services/logs/embed');
const { sendLog } = require('../services/logs/logger');
const { fetchAudit, AuditLogEvent } = require('../services/logs/audit');
const catalog = require('../services/logs/catalog.json');
const ALL_KEYS = Object.values(catalog).flat().map(([k]) => k);

module.exports = {
  name: 'messageDelete',
  async execute(message, client) {
    if (!message.guild) return;
    if (message.author?.bot) return;

    const guild = message.guild;
    const author = message.author || null;

    // Try find moderator who deleted
    const entry = await fetchAudit(guild, AuditLogEvent.MessageDelete, e => e.extra?.channel?.id === message.channelId);
    const mod = entry?.executor || null;
    const modId = entry?.executorId || null;

    const embed = makeLogEmbed({
      category: 'MESSAGES',
      name: '💬 Message Deleted',
      eventKey: 'MESSAGE_DELETE',
      authorUser: mod,          // author = deleter if we found it, else —
      victimUser: author,
      guild,
      fields: [
        { name: 'Salon', value: `${message.channel} \`${message.channelId}\``, inline: true },
        { name: 'Contenu', value: trim(message.content || '(aucun texte)'), inline: false },
      ],
    });

    await sendLog({
      client,
      guild,
      eventKey: 'MESSAGE_DELETE',
      allEventKeys: ALL_KEYS,
      embed,
      authorId: modId,
      victimId: author?.id || null,
      channelIdHint: message.channelId,
      messageId: message.id,
      extra: { channelId: message.channelId }
    });
  }
};
