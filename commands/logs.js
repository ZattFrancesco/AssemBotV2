const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');

const catalog = require('../services/logs/catalog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Configurer les logs')
    .addSubcommand(s => s.setName('setup').setDescription('Ouvrir le dashboard'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'setup') return;

    const categories = Object.keys(catalog).map(cat => ({
      label: cat,
      value: cat
    }));

    const embed = new EmbedBuilder()
      .setTitle('🧾 Logs Dashboard')
      .setDescription('Choisis une catégorie pour configurer les logs.')
      .setColor(0x2b2d31);

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('logs_category')
        .setPlaceholder('Choisir une catégorie')
        .addOptions(categories)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};
