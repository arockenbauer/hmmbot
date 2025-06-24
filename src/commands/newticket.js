import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import { TicketManager } from '../utils/ticket.js';
import { TicketStorage } from '../utils/ticketStorage.js';

const ticketManager = new TicketManager();

export const data = new SlashCommandBuilder()
  .setName('newticket')
  .setDescription('Créer un ticket de support');

export async function execute(interaction) {
  const config = ticketManager.getTicketConfig();
  if (!config.enabled) {
    return interaction.reply({ content: '❌ Le système de tickets est actuellement désactivé.', ephemeral: true });
  }
  // Gestion de la limite de tickets par utilisateur
  const userTickets = TicketStorage.getUserTickets(interaction.user.id);
  if (userTickets.length >= (config.ticket_limit || 1)) {
    return interaction.reply({ content: `Vous avez déjà ${userTickets.length} ticket(s) ouvert(s).`, ephemeral: true });
  }
  // Champs personnalisés
  let customFields = {};
  if (config.custom_fields && config.custom_fields.length > 0) {
    for (const field of config.custom_fields) {
      // Pour une vraie interaction, il faudrait demander à l'utilisateur via modal ou DM
      customFields[field] = 'À remplir';
    }
  }
  // Créer le channel de ticket
  const category = config.category ? interaction.guild.channels.cache.get(config.category) : null;
  const supportRole = config.support_role ? `<@&${config.support_role}>` : '';
  const ticketChannel = await interaction.guild.channels.create({
    name: `ticket-${interaction.user.username}`,
    type: ChannelType.GuildText,
    parent: category || undefined,
    permissionOverwrites: [
      { id: interaction.guild.roles.everyone, deny: ['ViewChannel'] },
      { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
      ...(config.support_role ? [{ id: config.support_role, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] }] : [])
    ]
  });
  TicketStorage.addTicket(ticketChannel.id, interaction.user.id, ticketChannel.id);
  await ticketChannel.send({
    content: `${supportRole} ${interaction.user} a ouvert un ticket !`,
    embeds: [
      new EmbedBuilder()
        .setTitle('Nouveau ticket')
        .setDescription(config.message + (Object.keys(customFields).length ? `\nChamps personnalisés: ${JSON.stringify(customFields)}` : ''))
        .setColor(0x00AE86)
    ]
  });
  await interaction.reply({ content: `Votre ticket a été créé: ${ticketChannel}`, ephemeral: true });
}
