// events/userUpdate.js
const { makeLogEmbed } = require('../services/logs/embed');
const { sendLog } = require('../services/logs/logger');
const catalog = require('../services/logs/catalog.json');
const ALL_KEYS = Object.values(catalog).flat().map(([k]) => k);

module.exports = {
  name: 'userUpdate',
  async execute(oldUser, newUser, client) {
    // Avatar change => can be in any mutual guilds, log per guild where we can resolve member
    if (oldUser.displayAvatarURL() === newUser.displayAvatarURL()) return;

    for (const [, guild] of client.guilds.cache) {
      const member = await guild.members.fetch(newUser.id).catch(() => null);
      if (!member) continue;

      const embed = makeLogEmbed({
        category: 'MEMBERS',
        name: '👥 Avatar Change',
        eventKey: 'MEMBER_AVATAR_CHANGE',
        authorUser: null,
        victimUser: newUser,
        guild,
        description: `Avatar modifié pour ${newUser.tag}.`,
        fields: [
          { name: 'Avant', value: oldUser.displayAvatarURL(), inline: false },
          { name: 'Après', value: newUser.displayAvatarURL(), inline: false },
        ]
      });

      await sendLog({ client, guild, eventKey: 'MEMBER_AVATAR_CHANGE', allEventKeys: ALL_KEYS, embed, authorId: null, victimId: newUser.id });
    }
  }
};
