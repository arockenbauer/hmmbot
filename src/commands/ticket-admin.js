import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { AdvancedTicketManager } from '../utils/ticket.js';

export const data = new SlashCommandBuilder()
  .setName('ticket-admin')
  .setDescription('Commandes d\'administration pour le système de tickets')
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('Liste tous les tickets actifs')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('close')
      .setDescription('Fermer un ticket spécifique')
      .addStringOption(option =>
        option.setName('ticket_id').setDescription('ID du ticket à fermer').setRequired(true))
      .addStringOption(option =>
        option.setName('reason').setDescription('Raison de la fermeture').setRequired(false))
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('Ajouter un utilisateur à un ticket')
      .addStringOption(option =>
        option.setName('ticket_id').setDescription('ID du ticket').setRequired(true))
      .addUserOption(option =>
        option.setName('user').setDescription('Utilisateur à ajouter').setRequired(true))
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Retirer un utilisateur d\'un ticket')
      .addStringOption(option =>
        option.setName('ticket_id').setDescription('ID du ticket').setRequired(true))
      .addUserOption(option =>
        option.setName('user').setDescription('Utilisateur à retirer').setRequired(true))
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('transcript')
      .setDescription('Générer le transcript d\'un ticket')
      .addStringOption(option =>
        option.setName('ticket_id').setDescription('ID du ticket').setRequired(true))
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('stats')
      .setDescription('Afficher les statistiques des tickets')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('cleanup')
      .setDescription('Nettoyer les tickets orphelins')
  );

export async function execute(interaction) {
  const ticketManager = new AdvancedTicketManager(interaction.client);
  const config = ticketManager.getTicketConfig();
  
  // Vérifier si le système de tickets est activé
  if (!config.enabled) {
    return interaction.reply({
      content: '❌ Le système de tickets est actuellement désactivé.',
      ephemeral: true
    });
  }
  
  // Vérifier les permissions
  const hasPermission = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) || 
                       (config.support_role && interaction.member.roles.cache.has(config.support_role));

  if (!hasPermission) {
    return interaction.reply({
      content: '❌ Vous n\'avez pas la permission d\'utiliser ces commandes.',
      ephemeral: true
    });
  }

  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'list':
        await handleListTickets(interaction, ticketManager);
        break;
      case 'close':
        await handleCloseTicket(interaction, ticketManager);
        break;
      case 'add':
        await handleAddUser(interaction, ticketManager);
        break;
      case 'remove':
        await handleRemoveUser(interaction, ticketManager);
        break;
      case 'transcript':
        await handleTranscript(interaction, ticketManager);
        break;
      case 'stats':
        await handleStats(interaction, ticketManager);
        break;
      case 'cleanup':
        await handleCleanup(interaction, ticketManager);
        break;
      default:
        await interaction.reply({
          content: '❌ Sous-commande non reconnue.',
          ephemeral: true
        });
    }
  } catch (error) {
    console.error('Erreur dans ticket-admin:', error);
    const content = '❌ Une erreur est survenue lors de l\'exécution de la commande.';
    
    if (interaction.deferred) {
      await interaction.editReply({ content });
    } else {
      await interaction.reply({ content, ephemeral: true });
    }
  }
}

async function handleListTickets(interaction, ticketManager) {
  const activeTickets = ticketManager.getAllActiveTickets();
  
  if (activeTickets.length === 0) {
    return interaction.reply({
      content: '📋 Aucun ticket actif.',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('📋 Tickets Actifs')
    .setDescription(`${activeTickets.length} ticket(s) actuellement ouvert(s)`)
    .setColor(0x5865f2)
    .setTimestamp();

  // Limiter à 25 tickets pour éviter les embeds trop longs
  const ticketsToShow = activeTickets.slice(0, 25);
  
  for (const ticket of ticketsToShow) {
    const channel = interaction.guild.channels.cache.get(ticket.channelId);
    const user = await interaction.client.users.fetch(ticket.userId).catch(() => null);
    
    embed.addFields([{
      name: `🎫 ${ticket.id}`,
      value: `**Utilisateur:** ${user ? user.tag : 'Inconnu'}\n**Type:** ${ticket.type}\n**Salon:** ${channel ? channel.toString() : 'Supprimé'}\n**Créé:** <t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:R>`,
      inline: true
    }]);
  }

  if (activeTickets.length > 25) {
    embed.setFooter({ text: `... et ${activeTickets.length - 25} autres tickets` });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleCloseTicket(interaction, ticketManager) {
  const ticketId = interaction.options.getString('ticket_id');
  const reason = interaction.options.getString('reason');
  
  await ticketManager.closeTicket(interaction, ticketId, reason);
}

async function handleAddUser(interaction, ticketManager) {
  const ticketId = interaction.options.getString('ticket_id');
  const user = interaction.options.getUser('user');
  
  const ticketData = ticketManager.getActiveTicket(ticketId);
  if (!ticketData) {
    return interaction.reply({
      content: '❌ Ticket introuvable.',
      ephemeral: true
    });
  }

  const channel = interaction.guild.channels.cache.get(ticketData.channelId);
  if (!channel) {
    return interaction.reply({
      content: '❌ Salon du ticket introuvable.',
      ephemeral: true
    });
  }

  try {
    await channel.permissionOverwrites.create(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true
    });

    const embed = new EmbedBuilder()
      .setTitle('➕ Utilisateur ajouté')
      .setDescription(`${user} a été ajouté au ticket par ${interaction.user}`)
      .setColor(0x00d26a)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    
    await interaction.reply({
      content: `✅ ${user} a été ajouté au ticket ${ticketId}.`,
      ephemeral: true
    });

    // Logger l'action
    const config = ticketManager.getTicketConfig();
    if (config.log_all_actions) {
      await ticketManager.logAction('USER_ADDED', {
        ticketId,
        addedUser: user.tag,
        addedUserId: user.id,
        addedBy: interaction.user.tag,
        addedById: interaction.user.id
      });
    }

  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
    await interaction.reply({
      content: '❌ Erreur lors de l\'ajout de l\'utilisateur au ticket.',
      ephemeral: true
    });
  }
}

async function handleRemoveUser(interaction, ticketManager) {
  const ticketId = interaction.options.getString('ticket_id');
  const user = interaction.options.getUser('user');
  
  const ticketData = ticketManager.getActiveTicket(ticketId);
  if (!ticketData) {
    return interaction.reply({
      content: '❌ Ticket introuvable.',
      ephemeral: true
    });
  }

  const channel = interaction.guild.channels.cache.get(ticketData.channelId);
  if (!channel) {
    return interaction.reply({
      content: '❌ Salon du ticket introuvable.',
      ephemeral: true
    });
  }

  // Empêcher de retirer le créateur du ticket
  if (user.id === ticketData.userId) {
    return interaction.reply({
      content: '❌ Vous ne pouvez pas retirer le créateur du ticket.',
      ephemeral: true
    });
  }

  try {
    await channel.permissionOverwrites.delete(user.id);

    const embed = new EmbedBuilder()
      .setTitle('➖ Utilisateur retiré')
      .setDescription(`${user} a été retiré du ticket par ${interaction.user}`)
      .setColor(0xf23f43)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    
    await interaction.reply({
      content: `✅ ${user} a été retiré du ticket ${ticketId}.`,
      ephemeral: true
    });

    // Logger l'action
    const config = ticketManager.getTicketConfig();
    if (config.log_all_actions) {
      await ticketManager.logAction('USER_REMOVED', {
        ticketId,
        removedUser: user.tag,
        removedUserId: user.id,
        removedBy: interaction.user.tag,
        removedById: interaction.user.id
      });
    }

  } catch (error) {
    console.error('Erreur lors du retrait de l\'utilisateur:', error);
    await interaction.reply({
      content: '❌ Erreur lors du retrait de l\'utilisateur du ticket.',
      ephemeral: true
    });
  }
}

async function handleTranscript(interaction, ticketManager) {
  const ticketId = interaction.options.getString('ticket_id');
  
  const ticketData = ticketManager.getActiveTicket(ticketId);
  if (!ticketData) {
    return interaction.reply({
      content: '❌ Ticket introuvable.',
      ephemeral: true
    });
  }

  const channel = interaction.guild.channels.cache.get(ticketData.channelId);
  if (!channel) {
    return interaction.reply({
      content: '❌ Salon du ticket introuvable.',
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const filePath = await ticketManager.generateAndSaveTranscript(channel, ticketData);
    
    if (filePath) {
      await interaction.editReply({
        content: `✅ Transcript généré pour le ticket ${ticketId}.`,
        files: [{ attachment: filePath, name: `transcript-${ticketId}.html` }]
      });
    } else {
      await interaction.editReply({
        content: '❌ Erreur lors de la génération du transcript.'
      });
    }
  } catch (error) {
    console.error('Erreur lors de la génération du transcript:', error);
    await interaction.editReply({
      content: '❌ Erreur lors de la génération du transcript.'
    });
  }
}

async function handleStats(interaction, ticketManager) {
  const activeTickets = ticketManager.getAllActiveTickets();
  
  // Calculer les statistiques
  const totalTickets = activeTickets.length;
  const ticketsByType = {};
  const ticketsByUser = {};
  let oldestTicket = null;
  let newestTicket = null;

  for (const ticket of activeTickets) {
    // Par type
    ticketsByType[ticket.type] = (ticketsByType[ticket.type] || 0) + 1;
    
    // Par utilisateur
    ticketsByUser[ticket.userId] = (ticketsByUser[ticket.userId] || 0) + 1;
    
    // Plus ancien/récent
    const createdAt = new Date(ticket.createdAt);
    if (!oldestTicket || createdAt < new Date(oldestTicket.createdAt)) {
      oldestTicket = ticket;
    }
    if (!newestTicket || createdAt > new Date(newestTicket.createdAt)) {
      newestTicket = ticket;
    }
  }

  const embed = new EmbedBuilder()
    .setTitle('📊 Statistiques des Tickets')
    .setColor(0x5865f2)
    .setTimestamp();

  embed.addFields([
    {
      name: '📈 Général',
      value: `**Total actifs:** ${totalTickets}\n**Plus ancien:** ${oldestTicket ? `<t:${Math.floor(new Date(oldestTicket.createdAt).getTime() / 1000)}:R>` : 'Aucun'}\n**Plus récent:** ${newestTicket ? `<t:${Math.floor(new Date(newestTicket.createdAt).getTime() / 1000)}:R>` : 'Aucun'}`,
      inline: true
    }
  ]);

  // Types de tickets
  if (Object.keys(ticketsByType).length > 0) {
    const typeStats = Object.entries(ticketsByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => `**${type}:** ${count}`)
      .join('\n');
    
    embed.addFields([{
      name: '🏷️ Par Type',
      value: typeStats,
      inline: true
    }]);
  }

  // Utilisateurs avec le plus de tickets
  if (Object.keys(ticketsByUser).length > 0) {
    const userStats = Object.entries(ticketsByUser)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([userId, count]) => `<@${userId}>: ${count}`)
      .join('\n');
    
    embed.addFields([{
      name: '👥 Top Utilisateurs',
      value: userStats,
      inline: true
    }]);
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleCleanup(interaction, ticketManager) {
  await interaction.deferReply({ ephemeral: true });

  const activeTickets = ticketManager.getAllActiveTickets();
  let cleanedCount = 0;

  for (const ticket of activeTickets) {
    const channel = interaction.guild.channels.cache.get(ticket.channelId);
    if (!channel) {
      // Salon supprimé, nettoyer les données
      ticketManager.removeActiveTicket(ticket.id);
      ticketManager.removeUserTicket(ticket.userId, ticket.channelId);
      cleanedCount++;
    }
  }

  await interaction.editReply({
    content: `✅ Nettoyage terminé. ${cleanedCount} ticket(s) orphelin(s) supprimé(s).`
  });

  // Logger l'action
  const config = ticketManager.getTicketConfig();
  if (config.log_all_actions) {
    await ticketManager.logAction('CLEANUP', {
      cleanedBy: interaction.user.tag,
      cleanedById: interaction.user.id,
      cleanedCount
    });
  }
}