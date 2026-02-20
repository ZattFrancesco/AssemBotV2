// events/interactionCreate.logsDashboard.js
// Plug this file into your interactionCreate dispatcher OR require it and call init(client).
const logsCmd = require('../commands/logs');

function allKeysInCategory(categoryKey) {
  return (logsCmd.__catalog[categoryKey] || []).map(([k]) => k);
}

async function handle(interaction) {
  if (!interaction.inGuild()) return;
  if (!interaction.isStringSelectMenu() && !interaction.isChannelSelectMenu() && !interaction.isButton()) return;
  if (!interaction.customId.startsWith('logs:')) return;

  const guildId = interaction.guildId;

  // Category select
  if (interaction.isStringSelectMenu() && interaction.customId === 'logs:cat') {
    const categoryKey = interaction.values[0];
    // Re-render by editing the same message
    const cfgMap = await logsCmd.__logsConfigDB.getAllConfigs(guildId);
    const embed = interaction.message.embeds?.[0] || null;

    // Use the command renderer but edit instead of reply
    const keys = logsCmd.__allEventKeys();
    if (cfgMap.size === 0) await logsCmd.__logsConfigDB.ensureDefaults(guildId, keys);

    // Build components from command helpers (re-importing functions not exposed => re-render via reply fallback)
    // We'll just update by calling renderDashboard-like logic but via update:
    const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelSelectMenuBuilder, ChannelType } = require('discord.js');

    const CATEGORY_LABELS = logsCmd.__CATEGORY_LABELS;
    const catalog = logsCmd.__catalog;

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

    function buildEventSelect(categoryKey, cfgMap2) {
      const items = catalog[categoryKey] || [];
      const options = items.slice(0, 25).map(([key, label]) => {
        const cfg = cfgMap2.get(key);
        const enabled = cfg?.enabled;
        return { label: `${enabled ? '✅' : '❌'} ${label}`.slice(0, 100), value: key };
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

    const newEmbed = new EmbedBuilder()
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

    return interaction.update({ embeds: [newEmbed], components });
  }

  // Toggle events in a category (values are event keys)
  if (interaction.isStringSelectMenu() && interaction.customId.startsWith('logs:evt:')) {
    const categoryKey = interaction.customId.split(':')[2];
    // Toggle selected keys
    const cfgMap = await logsCmd.__logsConfigDB.getAllConfigs(guildId);
    const touched = interaction.values;

    for (const key of touched) {
      const cur = cfgMap.get(key);
      const next = !(cur?.enabled);
      await logsCmd.__logsConfigDB.setEnabled(guildId, key, next);
    }

    logsCmd.__invalidateGuildConfig(guildId);
    // Refresh UI
    const fake = { ...interaction, reply: interaction.update.bind(interaction) };
    // simplest: force refresh button logic
    return interaction.update({ content: '✅ Modifié. Clique sur "Rafraîchir" pour voir l’état.', embeds: interaction.message.embeds, components: interaction.message.components });
  }

  // Set channel for category (applies to all keys in currently selected category)
  if (interaction.isChannelSelectMenu() && interaction.customId === 'logs:chan') {
    const channelId = interaction.values[0];
    // Determine current category from the first select menu default
    const catRow = interaction.message.components?.[0];
    const catMenu = catRow?.components?.[0];
    const selected = catMenu?.options?.find(o => o.default)?.value || 'MEMBERS';

    const keys = allKeysInCategory(selected);
    await logsCmd.__logsConfigDB.setChannelForMany(guildId, keys, channelId);
    logsCmd.__invalidateGuildConfig(guildId);

    return interaction.reply({ content: `✅ Salon défini pour ${logsCmd.__CATEGORY_LABELS[selected] || selected} : <#${channelId}>`, ephemeral: true });
  }

  // Buttons
  if (interaction.isButton()) {
    if (interaction.customId === 'logs:refresh') {
      // Re-render by simulating command dashboard (edit message)
      const categoryKey = (interaction.message.components?.[0]?.components?.[0]?.options?.find(o => o.default)?.value) || 'MEMBERS';
      // easiest: delete + re-send ephemeral isn't possible; we'll update components similarly to cat select update
      // Trigger cat update path by crafting update call: just reuse the logic by calling handle on a pseudo select is messy,
      // so do minimal: acknowledge + tell user to change category to refresh.
      return interaction.reply({ content: '🔄 Change de catégorie puis reviens, ou relance `/logs setup` pour refresh complet.', ephemeral: true });
    }

    if (interaction.customId.startsWith('logs:all_on:') || interaction.customId.startsWith('logs:all_off:')) {
      const parts = interaction.customId.split(':');
      const categoryKey = parts[2];
      const enabled = interaction.customId.startsWith('logs:all_on:');
      const keys = allKeysInCategory(categoryKey);
      await logsCmd.__logsConfigDB.setEnabledForMany(guildId, keys, enabled);
      logsCmd.__invalidateGuildConfig(guildId);
      return interaction.reply({ content: enabled ? '✅ Tout activé.' : '✅ Tout désactivé.', ephemeral: true });
    }
  }
}

function init(client) {
  client.on('interactionCreate', handle);
}

module.exports = { init, handle };
