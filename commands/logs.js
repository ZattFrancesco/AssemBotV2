// commands/logs.js
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelSelectMenuBuilder,
  ChannelType,
} = require('discord.js');

const catalog = require('../services/logs/catalog.json');
const logsConfigDB = require('../db/logsConfig.db');
const { invalidateGuildConfig } = require('../services/logs/logger');

const CATEGORY_LABELS = {
  MEMBERS: '👥 MEMBERS',
  MESSAGES: '💬 MESSAGES',
  VOICE: '🔊 VOICE',
  CHANNELS: '🏗 CHANNELS',
  ROLES: '🛡 ROLES',
  GUILD: '🌍 GUILD (SERVER)',
  INVITES: '🔗 INVITES',
  EMOJIS_STICKERS: '🎭 EMOJIS & STICKERS',
  WEBHOOKS_INTEGRATIONS: '🔌 WEBHOOKS & INTEGRATIONS',
  EVENTS: '📅 EVENTS',
  MODERATION_COMMANDS: '⚖ MODERATION ACTIONS (via commands)',
};

function allEventKeys() {
  return Object.values(catalog).flat().map(([k]) => k);
}

function buildCategorySelect(current) {
  const options = Object.keys(catalog).map(k => ({
    label: CATEGORY_LABELS[k] || k,
    value: k,
    default: k === current,
  }));
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('logs:cat')
      .setPlaceholder('Choisir une catégorie')
      .addOptions(options)
  );
}

function buildChannelSelect() {
  return new ActionRowBuilder().addComponents(
    new ChannelSelectMenuBuilder()
      .setCustomId('logs:chan')
      .setPlaceholder('Choisir le salon de logs pour cette catégorie')
      .setChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
  );
}

function buildEventSelect(categoryKey, cfgMap) {
  const items = catalog[categoryKey] || [];
  const options = items.slice(0, 25).map(([key, label]) => {
    const cfg = cfgMap.get(key);
    const enabled = cfg?.enabled;
    return {
      label: `${enabled ? '✅' : '❌'} ${label}`.slice(0, 100),
      value: key,
    };
  });

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`logs:evt:${categoryKey}`)
      .setPlaceholder('Clique pour activer/désactiver des logs')
      .setMinValues(1)
      .setMaxValues(Math.min(25, options.length))
      .addOptions(options)
  );
}

function buildButtons(categoryKey) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`logs:all_on:${categoryKey}`).setLabel('Activer tout').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`logs:all_off:${categoryKey}`).setLabel('Désactiver tout').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('logs:refresh').setLabel('Rafraîchir').setStyle(ButtonStyle.Secondary),
  );
}

async function renderDashboard(interaction, categoryKey = 'MEMBERS') {
  const keys = allEventKeys();
  const cfgMap = await logsConfigDB.getAllConfigs(interaction.guildId);
  // ensure defaults if empty
  if (cfgMap.size === 0) await logsConfigDB.ensureDefaults(interaction.guildId, keys);

  const embed = new EmbedBuilder()
    .setTitle('🧾 Logs Setup Dashboard')
    .setDescription(
      [
        '• Choisis une **catégorie**',
        '• Sélectionne des **events** pour les toggle (✅/❌)',
        '• Choisis un **salon** pour cette catégorie (appliqué à tous les events de la catégorie)',
        '',
        '💡 Astuce: utilise **Rafraîchir** après tes changements.',
      ].join('\n')
    )
    .addFields(
      { name: 'Catégorie', value: CATEGORY_LABELS[categoryKey] || categoryKey, inline: true },
      { name: 'Salon', value: 'Sélectionne un salon ci-dessous', inline: true },
    )
    .setColor(0x2b2d31);

  const components = [
    buildCategorySelect(categoryKey),
    buildEventSelect(categoryKey, cfgMap),
    buildChannelSelect(),
    buildButtons(categoryKey),
  ];

  await interaction.reply({ embeds: [embed], components, ephemeral: true });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Configurer le système de logs (dashboard)')
    .addSubcommand(s => s.setName('setup').setDescription('Ouvrir le dashboard de configuration'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.inGuild()) return interaction.reply({ content: 'Serveur uniquement.', ephemeral: true });
    if (interaction.options.getSubcommand() === 'setup') {
      return renderDashboard(interaction, 'MEMBERS');
    }
  },

  // Expose helpers for the interaction handler
  __renderDashboard: renderDashboard,
  __allEventKeys: allEventKeys,
  __CATEGORY_LABELS: CATEGORY_LABELS,
  __catalog: catalog,
  __logsConfigDB: logsConfigDB,
  __invalidateGuildConfig: invalidateGuildConfig,
};
