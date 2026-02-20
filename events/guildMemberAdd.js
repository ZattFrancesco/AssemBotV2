// events/guildMemberAdd.js
const { makeLogEmbed } = require('../services/logs/embed');
const { sendLog } = require('../services/logs/logger');
const catalog = require('../services/logs/catalog.json');

const ALL_KEYS = Object.values(catalog).flat().map(([k]) => k);

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    const embed = makeLogEmbed({
      category: 'MEMBERS',
      name: '👥 Member Join',
      eventKey: 'MEMBER_JOIN',
      authorUser: null,
      victimUser: member.user,
      guild: member.guild,
      description: `${member.user.tag} a rejoint le serveur.`,
    });

    await sendLog({
      client,
      guild: member.guild,
      eventKey: 'MEMBER_JOIN',
      allEventKeys: ALL_KEYS,
      embed,
      authorId: null,
      victimId: member.id,
    });
  }
};
