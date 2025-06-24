import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import { TicketManager } from '../utils/ticket.js';

const ticketManager = new TicketManager();

export const data = new SlashCommandBuilder()
  .setName('ticket')
  .setDescription('Gère le système de tickets')
  .addSubcommand(subcommand =>
    subcommand
      .setName('config')
      .setDescription('Configure le système de tickets')
      .addBooleanOption(option =>
        option.setName('enabled').setDescription('Activer le système de tickets'))
      .addChannelOption(option =>
        option.setName('category').setDescription('Catégorie des tickets').addChannelTypes(ChannelType.GuildCategory))
      .addRoleOption(option =>
        option.setName('support_role').setDescription('Rôle support'))
      .addChannelOption(option =>
        option.setName('transcript_channel').setDescription('Canal pour les transcripts').addChannelTypes(ChannelType.GuildText))
      .addIntegerOption(option =>
        option.setName('ticket_limit').setDescription('Nombre max de tickets par utilisateur'))
      .addStringOption(option =>
        option.setName('message').setDescription('Message d\'ouverture de ticket'))
      .addStringOption(option =>
        option.setName('close_message').setDescription('Message de fermeture de ticket'))
      .addBooleanOption(option =>
        option.setName('log_transcripts').setDescription('Logger les transcripts'))
      .addBooleanOption(option =>
        option.setName('auto_close').setDescription('Fermeture auto des tickets'))
      .addIntegerOption(option =>
        option.setName('auto_close_delay').setDescription('Délai de fermeture auto (s)'))
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('info')
      .setDescription('Affiche la configuration du système de tickets')
  );

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
  }
  const sub = interaction.options.getSubcommand();
  if (sub === 'config') {
    const updates = {};
    for (const key of ['enabled', 'category', 'support_role', 'transcript_channel', 'ticket_limit', 'message', 'close_message', 'log_transcripts', 'auto_close', 'auto_close_delay']) {
      const value = interaction.options.get(key);
      if (value !== null && value !== undefined) updates[key] = value;
    }
    ticketManager.updateTicketConfig(updates);
    return interaction.reply({ content: 'Configuration du système de tickets mise à jour.', ephemeral: true });
  } else if (sub === 'info') {
    const config = ticketManager.getTicketConfig();
    const embed = new EmbedBuilder()
      .setTitle('Configuration du système de tickets')
      .setDescription('Voici la configuration actuelle:')
      .addFields(Object.entries(config).map(([k, v]) => ({ name: k, value: String(v), inline: false })))
      .setColor(0x00AE86);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
