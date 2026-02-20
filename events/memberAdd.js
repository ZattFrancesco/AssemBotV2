
// events/memberAdd.js
const { sendLog } = require('../services/logs/logger');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    await sendLog(client, member.guild, 'MEMBER_JOIN', {
      title: '👥 Member Join',
      author: null,
      victim: member.id,
      description: `${member.user.tag} a rejoint le serveur.`
    });
  }
};
