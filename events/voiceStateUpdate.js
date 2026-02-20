// events/voiceStateUpdate.js
const { makeLogEmbed } = require('../services/logs/embed');
const { sendLog } = require('../services/logs/logger');
const { fetchAudit, AuditLogEvent } = require('../services/logs/audit');
const catalog = require('../services/logs/catalog.json');
const ALL_KEYS = Object.values(catalog).flat().map(([k]) => k);

module.exports = {
  name: 'voiceStateUpdate',
  async execute(oldState, newState, client) {
    const guild = newState.guild;
    const member = newState.member || oldState.member;
    if (!guild || !member) return;

    // join/leave/move
    if (!oldState.channel && newState.channel) {
      const embed = makeLogEmbed({
        category: 'VOICE',
        name: '🔊 Voice Join',
        eventKey: 'VOICE_JOIN',
        authorUser: null,
        victimUser: member.user,
        guild,
        description: `${member} a rejoint ${newState.channel}.`,
      });
      return sendLog({ client, guild, eventKey: 'VOICE_JOIN', allEventKeys: ALL_KEYS, embed, authorId: null, victimId: member.id, extra: { channelId: newState.channelId } });
    }

    if (oldState.channel && !newState.channel) {
      const embed = makeLogEmbed({
        category: 'VOICE',
        name: '🔊 Voice Leave',
        eventKey: 'VOICE_LEAVE',
        authorUser: null,
        victimUser: member.user,
        guild,
        description: `${member} a quitté ${oldState.channel}.`,
      });
      return sendLog({ client, guild, eventKey: 'VOICE_LEAVE', allEventKeys: ALL_KEYS, embed, authorId: null, victimId: member.id, extra: { channelId: oldState.channelId } });
    }

    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      const embed = makeLogEmbed({
        category: 'VOICE',
        name: '🔊 Voice Move',
        eventKey: 'VOICE_MOVE',
        authorUser: null,
        victimUser: member.user,
        guild,
        description: `${member} a bougé de ${oldState.channel} vers ${newState.channel}.`,
      });
      return sendLog({ client, guild, eventKey: 'VOICE_MOVE', allEventKeys: ALL_KEYS, embed, authorId: null, victimId: member.id, extra: { from: oldState.channelId, to: newState.channelId } });
    }

    // server mute/unmute
    if (oldState.serverMute !== newState.serverMute) {
      const eventKey = newState.serverMute ? 'VOICE_MUTE' : 'VOICE_UNMUTE';
      const embed = makeLogEmbed({
        category: 'VOICE',
        name: newState.serverMute ? '🔊 Server Mute' : '🔊 Server Unmute',
        eventKey,
        authorUser: null,
        victimUser: member.user,
        guild,
      });
      return sendLog({ client, guild, eventKey, allEventKeys: ALL_KEYS, embed, authorId: null, victimId: member.id });
    }

    // self mute/unmute
    if (oldState.selfMute !== newState.selfMute) {
      const eventKey = newState.selfMute ? 'VOICE_SELF_MUTE' : 'VOICE_SELF_UNMUTE';
      const embed = makeLogEmbed({
        category: 'VOICE',
        name: newState.selfMute ? '🔊 Self Mute' : '🔊 Self Unmute',
        eventKey,
        authorUser: null,
        victimUser: member.user,
        guild,
      });
      return sendLog({ client, guild, eventKey, allEventKeys: ALL_KEYS, embed, authorId: null, victimId: member.id });
    }

    // disconnect (mod action) => try audit log
    if (oldState.channel && !newState.channel) {
      const entry = await fetchAudit(guild, AuditLogEvent.MemberDisconnect, e => e.target?.id === member.id);
      if (entry) {
        const embed = makeLogEmbed({
          category: 'VOICE',
          name: '🔊 Member Disconnect (Mod)',
          eventKey: 'VOICE_MEMBER_DISCONNECT',
          authorUser: entry.executor || null,
          victimUser: member.user,
          guild,
          description: entry.reason ? `Raison: ${entry.reason}` : null,
        });
        return sendLog({ client, guild, eventKey: 'VOICE_MEMBER_DISCONNECT', allEventKeys: ALL_KEYS, embed, authorId: entry.executorId, victimId: member.id });
      }
    }
  }
};
