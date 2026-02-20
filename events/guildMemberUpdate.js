// events/guildMemberUpdate.js
const { makeLogEmbed, trim } = require('../services/logs/embed');
const { sendLog } = require('../services/logs/logger');
const catalog = require('../services/logs/catalog.json');

const ALL_KEYS = Object.values(catalog).flat().map(([k]) => k);

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember, client) {
    const guild = newMember.guild;

    // Nickname
    if ((oldMember.nickname || null) !== (newMember.nickname || null)) {
      const embed = makeLogEmbed({
        category: 'MEMBERS',
        name: '👥 Nickname Change',
        eventKey: 'MEMBER_NICKNAME_CHANGE',
        authorUser: null,
        victimUser: newMember.user,
        guild,
        fields: [
          { name: 'Avant', value: trim(oldMember.nickname || oldMember.user.username), inline: true },
          { name: 'Après', value: trim(newMember.nickname || newMember.user.username), inline: true },
        ],
      });
      await sendLog({ client, guild, eventKey: 'MEMBER_NICKNAME_CHANGE', allEventKeys: ALL_KEYS, embed, authorId: null, victimId: newMember.id });
    }

    // Timeout
    const oldTo = oldMember.communicationDisabledUntilTimestamp || 0;
    const newTo = newMember.communicationDisabledUntilTimestamp || 0;
    if (oldTo !== newTo) {
      const applied = newTo && newTo > Date.now();
      const embed = makeLogEmbed({
        category: 'MEMBERS',
        name: applied ? '👥 Timeout Applied' : '👥 Timeout Removed',
        eventKey: applied ? 'MEMBER_TIMEOUT_APPLIED' : 'MEMBER_TIMEOUT_REMOVED',
        authorUser: null,
        victimUser: newMember.user,
        guild,
        description: applied ? `Jusqu’au <t:${Math.floor(newTo/1000)}:F>` : 'Timeout retiré.',
      });
      await sendLog({
        client, guild,
        eventKey: applied ? 'MEMBER_TIMEOUT_APPLIED' : 'MEMBER_TIMEOUT_REMOVED',
        allEventKeys: ALL_KEYS,
        embed,
        authorId: null,
        victimId: newMember.id
      });
    }

    // Roles added/removed
    const oldRoles = new Set(oldMember.roles.cache.keys());
    const newRoles = new Set(newMember.roles.cache.keys());

    for (const r of newRoles) {
      if (!oldRoles.has(r)) {
        const role = newMember.guild.roles.cache.get(r);
        const embed = makeLogEmbed({
          category: 'MEMBERS',
          name: '👥 Role Added',
          eventKey: 'MEMBER_ROLE_ADDED',
          authorUser: null,
          victimUser: newMember.user,
          guild,
          fields: [{ name: 'Rôle', value: role ? `${role} \`${role.id}\`` : `\`${r}\``, inline: true }]
        });
        await sendLog({ client, guild, eventKey: 'MEMBER_ROLE_ADDED', allEventKeys: ALL_KEYS, embed, authorId: null, victimId: newMember.id, extra: { roleId: r } });
      }
    }

    for (const r of oldRoles) {
      if (!newRoles.has(r)) {
        const role = newMember.guild.roles.cache.get(r);
        const embed = makeLogEmbed({
          category: 'MEMBERS',
          name: '👥 Role Removed',
          eventKey: 'MEMBER_ROLE_REMOVED',
          authorUser: null,
          victimUser: newMember.user,
          guild,
          fields: [{ name: 'Rôle', value: role ? `${role} \`${role.id}\`` : `\`${r}\``, inline: true }]
        });
        await sendLog({ client, guild, eventKey: 'MEMBER_ROLE_REMOVED', allEventKeys: ALL_KEYS, embed, authorId: null, victimId: newMember.id, extra: { roleId: r } });
      }
    }
  }
};
