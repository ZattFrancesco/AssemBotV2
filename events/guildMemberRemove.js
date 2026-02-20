// events/guildMemberRemove.js
const { makeLogEmbed } = require('../services/logs/embed');
const { sendLog } = require('../services/logs/logger');
const { fetchAudit, AuditLogEvent } = require('../services/logs/audit');
const catalog = require('../services/logs/catalog.json');

const ALL_KEYS = Object.values(catalog).flat().map(([k]) => k);

module.exports = {
  name: 'guildMemberRemove',
  async execute(member, client) {
    const guild = member.guild;

    // Try detect kick via audit logs
    const kick = await fetchAudit(guild, AuditLogEvent.MemberKick, e => e.target?.id === member.id);
    if (kick) {
      const embed = makeLogEmbed({
        category: 'MEMBERS',
        name: '👥 Member Kicked',
        eventKey: 'MEMBER_KICK',
        authorUser: kick.executor || null,
        victimUser: member.user || null,
        guild,
        description: kick.reason ? `Raison: ${kick.reason}` : null,
      });
      return sendLog({ client, guild, eventKey: 'MEMBER_KICK', allEventKeys: ALL_KEYS, embed, authorId: kick.executorId, victimId: member.id });
    }

    const embed = makeLogEmbed({
      category: 'MEMBERS',
      name: '👥 Member Leave',
      eventKey: 'MEMBER_LEAVE',
      authorUser: null,
      victimUser: member.user || null,
      guild,
      description: member.user ? `${member.user.tag} a quitté le serveur.` : 'Un membre a quitté le serveur.',
    });

    await sendLog({ client, guild, eventKey: 'MEMBER_LEAVE', allEventKeys: ALL_KEYS, embed, authorId: null, victimId: member.id });
  }
};
