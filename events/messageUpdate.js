// events/messageUpdate.js
const { makeLogEmbed, trim } = require('../services/logs/embed');
const { sendLog } = require('../services/logs/logger');
const catalog = require('../services/logs/catalog.json');
const ALL_KEYS = Object.values(catalog).flat().map(([k]) => k);

module.exports = {
  name: 'messageUpdate',
  async execute(oldMessage, newMessage, client) {
    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return;

    const embed = makeLogEmbed({
      category: 'MESSAGES',
      name: '💬 Message Edited',
      eventKey: 'MESSAGE_EDIT',
      authorUser: newMessage.author,
      victimUser: newMessage.author,
      guild: newMessage.guild,
      fields: [
        { name: 'Salon', value: `${newMessage.channel} \`${newMessage.channelId}\``, inline: true },
        { name: 'Avant', value: trim(oldMessage.content || '(vide)'), inline: false },
        { name: 'Après', value: trim(newMessage.content || '(vide)'), inline: false },
      ],
    });

    await sendLog({
      client,
      guild: newMessage.guild,
      eventKey: 'MESSAGE_EDIT',
      allEventKeys: ALL_KEYS,
      embed,
      authorId: newMessage.author.id,
      victimId: newMessage.author.id,
      channelIdHint: newMessage.channelId,
      messageId: newMessage.id,
      extra: { channelId: newMessage.channelId }
    });
  }
};
