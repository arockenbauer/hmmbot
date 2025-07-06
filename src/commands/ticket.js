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
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('rename')
      .setDescription('Renomme le ticket actuel')
      .addStringOption(option =>
        option.setName('new_name').setDescription('Nouveau nom du ticket').setRequired(true))
  );

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  
  if (sub === 'config') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
    }
    
    const updates = {};
    for (const key of ['enabled', 'category', 'support_role', 'transcript_channel', 'ticket_limit', 'message', 'close_message', 'log_transcripts', 'auto_close', 'auto_close_delay']) {
      const value = interaction.options.get(key);
      if (value !== null && value !== undefined) updates[key] = value;
    }
    ticketManager.updateTicketConfig(updates);
    return interaction.reply({ content: 'Configuration du système de tickets mise à jour.', ephemeral: true });
  } else if (sub === 'info') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: 'Permission refusée.', ephemeral: true });
    }
    
    const config = ticketManager.getTicketConfig();
    const embed = new EmbedBuilder()
      .setTitle('Configuration du système de tickets')
      .setDescription('Voici la configuration actuelle:')
      .addFields(Object.entries(config).map(([k, v]) => ({ name: k, value: String(v), inline: false })))
      .setColor(0x00AE86);
    return interaction.reply({ embeds: [embed], ephemeral: true });
  } else if (sub === 'rename') {
    return await handleTicketRename(interaction, ticketManager);
  }
}

async function handleTicketRename(interaction, ticketManager) {
  const newName = interaction.options.getString('new_name', true);
  const channel = interaction.channel;
  
  // Vérifier si on est dans un ticket
  const ticketData = ticketManager.getTicketByChannelId(channel.id);
  if (!ticketData) {
    return interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans un ticket.', ephemeral: true });
  }
  
  // Vérifier les permissions
  const config = ticketManager.getTicketConfig();
  const isTicketOwner = ticketData.userId === interaction.user.id;
  const hasStaffPermission = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) || 
                            (config.support_role && interaction.member.roles.cache.has(config.support_role));
  
  if (!isTicketOwner && !hasStaffPermission) {
    return interaction.reply({ content: '❌ Vous ne pouvez pas renommer ce ticket.', ephemeral: true });
  }
  
  // Valider le nom
  if (newName.length < 1 || newName.length > 50) {
    return interaction.reply({ content: '❌ Le nom du ticket doit contenir entre 1 et 50 caractères.', ephemeral: true });
  }
  
  // Nettoyer le nom pour Discord
  const cleanedName = newName.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  const finalName = `ticket-${cleanedName}`;
  
  try {
    // Renommer le salon
    await channel.setName(finalName);
    
    // Mettre à jour le topic du salon
    const currentTopic = channel.topic || '';
    const newTopic = currentTopic.includes(' - Type:') 
      ? currentTopic.replace(/^.*? - Type:/, `Ticket de ${interaction.guild.members.cache.get(ticketData.userId)?.user.tag || 'Utilisateur inconnu'} - Type:`)
      : `Ticket de ${interaction.guild.members.cache.get(ticketData.userId)?.user.tag || 'Utilisateur inconnu'} - Nom personnalisé: ${newName}`;
    
    await channel.setTopic(newTopic);
    
    // Créer un embed de confirmation
    const embed = new EmbedBuilder()
      .setTitle('🏷️ Ticket renommé')
      .setDescription(`Le ticket a été renommé avec succès !`)
      .addFields([
        { name: 'Nouveau nom', value: newName, inline: true },
        { name: 'Renommé par', value: `${interaction.user}`, inline: true },
        { name: 'ID Ticket', value: ticketData.id, inline: true }
      ])
      .setColor(0x00d26a)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    
    // Logger l'action
    if (config.log_all_actions) {
      await ticketManager.logAction('TICKET_RENAMED', {
        user: interaction.user.tag,
        userId: interaction.user.id,
        ticketId: ticketData.id,
        channelId: channel.id,
        oldName: channel.name,
        newName: finalName,
        customName: newName
      });
    }
    
  } catch (error) {
    console.error('Erreur lors du renommage du ticket:', error);
    await interaction.reply({ content: '❌ Une erreur est survenue lors du renommage du ticket.', ephemeral: true });
  }
}
