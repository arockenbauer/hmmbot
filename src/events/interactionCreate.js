import { Logger } from '../utils/logger.js';
import * as SheduleCommand from '../commands/shedule.js';
import { AdvancedTicketManager } from '../utils/ticket.js';
import { ModalBuilder, TextInputBuilder, ActionRowBuilder, TextInputStyle } from 'discord.js';
import * as ConfigCommand from '../commands/config.js';
import * as HelpCommand from '../commands/help.js';
import { automationManager } from '../utils/automationManager.js';

export const name = 'interactionCreate';
export async function execute(interaction, client) {
  // Gestion de l'autocomplétion
  if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName);
    if (!command || !command.autocomplete) return;
    
    try {
      await command.autocomplete(interaction);
    } catch (error) {
      console.error(`Erreur lors de l'autocomplétion de ${interaction.commandName}:`, error);
    }
    return;
  }

  // Gestion des commandes slash
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    
    try {
      // Vérifier si l'interaction n'a pas expiré
      if (interaction.replied || interaction.deferred) return;
      
      await command.execute(interaction);
      console.log(`\x1b[35m[SLASH]\x1b[0m ${interaction.commandName} exécutée par ${interaction.user.tag}`);
      
      // Log de l'utilisation de commande (seulement si pas d'erreur)
      await Logger.log(client, 'COMMAND', {
        user: interaction.user.tag,
        command: `/${interaction.commandName}`,
        channel: interaction.channel?.name || 'MP'
      });
    } catch (error) {
      console.error(`Erreur lors de l'exécution de ${interaction.commandName}:`, error);
      
      // Vérifier si on peut encore répondre à l'interaction
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'Erreur lors de l\'exécution de la commande.', ephemeral: true });
        } else if (interaction.deferred) {
          await interaction.editReply({ content: 'Erreur lors de l\'exécution de la commande.' });
        } else {
          await interaction.followUp({ content: 'Erreur lors de l\'exécution de la commande.', ephemeral: true });
        }
      } catch (replyError) {
        console.error('Impossible de répondre à l\'interaction:', replyError.message);
      }
    }
    return;
  }

  // Système de tickets avancé
  const ticketManager = new AdvancedTicketManager(client);

  // Vérifier si le système de tickets est activé avant toute interaction
  const ticketConfig = ticketManager.getTicketConfig();
  const isTicketInteraction = (
    (interaction.isButton() && (
      interaction.customId === 'create_ticket' ||
      interaction.customId === 'open_ticket' ||
      interaction.customId.startsWith('close_ticket_') ||
      interaction.customId.startsWith('confirm_close_') ||
      interaction.customId.startsWith('cancel_close_') ||
      interaction.customId.startsWith('add_user_') ||
      interaction.customId.startsWith('transcript_')
    )) ||
    (interaction.isStringSelectMenu() && (
      interaction.customId === 'create_ticket_select' ||
      interaction.customId === 'open_ticket_dropdown'
    )) ||
    (interaction.isModalSubmit() && interaction.customId.startsWith('add_user_modal_'))
  );

  if (isTicketInteraction && !ticketConfig.enabled) {
    return await interaction.reply({
      content: '❌ Le système de tickets est actuellement désactivé.',
      ephemeral: true
    });
  }

  // 🎫 Création de ticket via bouton
  if (interaction.isButton() && interaction.customId === 'create_ticket') {
    await ticketManager.createTicket(interaction);
    return;
  }

  // 🎫 Création de ticket via menu déroulant
  if (interaction.isStringSelectMenu() && interaction.customId === 'create_ticket_select') {
    const selectedIndex = parseInt(interaction.values[0].split('_')[1]);
    const config = ticketManager.getTicketConfig();
    const ticketType = config.panel?.dropdown_options?.[selectedIndex] || 'Général';
    await ticketManager.createTicket(interaction, ticketType);
    return;
  }

  // 🔒 Fermeture de ticket
  if (interaction.isButton() && interaction.customId.startsWith('close_ticket_')) {
    const ticketId = interaction.customId.split('_')[2];
    await ticketManager.closeTicket(interaction, ticketId);
    return;
  }

  // ✅ Confirmation de fermeture
  if (interaction.isButton() && interaction.customId.startsWith('confirm_close_')) {
    const ticketId = interaction.customId.split('_')[2];
    const ticketData = ticketManager.getActiveTicket(ticketId);
    
    if (!ticketData) {
      return await interaction.reply({
        content: '❌ Ticket introuvable.',
        ephemeral: true
      });
    }

    const channel = interaction.guild.channels.cache.get(ticketData.channelId);
    if (!channel) {
      ticketManager.removeActiveTicket(ticketId);
      return await interaction.reply({
        content: '❌ Salon du ticket introuvable.',
        ephemeral: true
      });
    }

    await interaction.reply({
      content: '🔒 Fermeture du ticket en cours...',
      ephemeral: true
    });

    await ticketManager.executeTicketClose(channel, ticketData, interaction.user);
    return;
  }

  // ❌ Annulation de fermeture
  if (interaction.isButton() && interaction.customId.startsWith('cancel_close_')) {
    await interaction.reply({
      content: '✅ Fermeture du ticket annulée.',
      ephemeral: true
    });
    return;
  }

  // ➕ Ajouter un utilisateur au ticket
  if (interaction.isButton() && interaction.customId.startsWith('add_user_')) {
    const ticketId = interaction.customId.split('_')[2];
    const ticketData = ticketManager.getActiveTicket(ticketId);
    
    if (!ticketData) {
      return await interaction.reply({
        content: '❌ Ticket introuvable.',
        ephemeral: true
      });
    }

    // Vérifier les permissions (staff seulement)
    const config = ticketManager.getTicketConfig();
    const hasPermission = interaction.member.permissions.has('ManageChannels') || 
                         (config.support_role && interaction.member.roles.cache.has(config.support_role));

    if (!hasPermission) {
      return await interaction.reply({
        content: '❌ Vous n\'avez pas la permission d\'ajouter des utilisateurs.',
        ephemeral: true
      });
    }

    // Créer et afficher la modale pour saisir l'ID utilisateur
    
    const modal = new ModalBuilder()
      .setCustomId(`add_user_modal_${ticketId}`)
      .setTitle('Ajouter un utilisateur au ticket');
    
    const userInput = new TextInputBuilder()
      .setCustomId('user_id')
      .setLabel('ID ou mention de l\'utilisateur')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('123456789012345678 ou @utilisateur')
      .setRequired(true);
    
    const actionRow = new ActionRowBuilder().addComponents(userInput);
    modal.addComponents(actionRow);
    
    await interaction.showModal(modal);
    return;
  }

  // 📄 Générer un transcript manuel
  if (interaction.isButton() && interaction.customId.startsWith('transcript_')) {
    const ticketId = interaction.customId.split('_')[1];
    const ticketData = ticketManager.getActiveTicket(ticketId);
    
    if (!ticketData) {
      return await interaction.reply({
        content: '❌ Ticket introuvable.',
        ephemeral: true
      });
    }

    const channel = interaction.guild.channels.cache.get(ticketData.channelId);
    if (!channel) {
      return await interaction.reply({
        content: '❌ Salon du ticket introuvable.',
        ephemeral: true
      });
    }

    // Vérifier les permissions (staff seulement)
    const config = ticketManager.getTicketConfig();
    const hasPermission = interaction.member.permissions.has('ManageChannels') || 
                         (config.support_role && interaction.member.roles.cache.has(config.support_role));

    if (!hasPermission) {
      return await interaction.reply({
        content: '❌ Vous n\'avez pas la permission de générer des transcripts.',
        ephemeral: true
      });
    }

    await interaction.reply({
      content: '📄 Génération du transcript en cours...',
      ephemeral: true
    });

    try {
      const filePath = await ticketManager.generateAndSaveTranscript(channel, ticketData);
      if (filePath) {
        await interaction.followUp({
          content: '✅ Transcript généré avec succès !',
          files: [{ attachment: filePath, name: `transcript-${ticketId}.html` }],
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: '❌ Erreur lors de la génération du transcript.',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Erreur lors de la génération du transcript:', error);
      await interaction.followUp({
        content: '❌ Erreur lors de la génération du transcript.',
        ephemeral: true
      });
    }
    return;
  }

  // Compatibilité avec l'ancien système
  if (interaction.isButton() && interaction.customId === 'open_ticket') {
    await ticketManager.createTicket(interaction);
    return;
  }

  if (interaction.isStringSelectMenu() && interaction.customId === 'open_ticket_dropdown') {
    const selected = interaction.values[0];
    await ticketManager.createTicket(interaction, selected);
    return;
  }

  // Gestion du modal de création d'embed
  if (interaction.isModalSubmit() && interaction.customId === 'embed_create') {
    const title = interaction.fields.getTextInputValue('embed_title');
    const desc = interaction.fields.getTextInputValue('embed_desc');
    const color = interaction.fields.getTextInputValue('embed_color') || '#00AE86';
    const footer = interaction.fields.getTextInputValue('embed_footer');
    const image = interaction.fields.getTextInputValue('embed_image');
    
    // Récupérer le salon cible
    const targetChannelId = global.embedChannels?.get(interaction.user.id);
    const targetChannel = targetChannelId ? interaction.guild.channels.cache.get(targetChannelId) : interaction.channel;
    
    // Nettoyer la donnée temporaire
    if (global.embedChannels) {
      global.embedChannels.delete(interaction.user.id);
    }
    
    const embed = {
      description: desc,
      color: color.startsWith('#') ? parseInt(color.slice(1), 16) : parseInt(color, 16) || 0x00AE86,
      timestamp: new Date().toISOString()
    };
    
    if (title) embed.title = title;
    if (footer) embed.footer = { text: footer };
    if (image && image.startsWith('http')) embed.image = { url: image };
    
    try {
      await targetChannel.send({ embeds: [embed] });
      await interaction.reply({ 
        content: `✅ Embed envoyé dans ${targetChannel.toString()} !`, 
        ephemeral: true 
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'embed:', error);
      await interaction.reply({ 
        content: '❌ Erreur lors de l\'envoi de l\'embed. Vérifiez les permissions.', 
        ephemeral: true 
      });
    }
    return;
  }

  // Gestion de la modale d'ajout d'utilisateur au ticket
  if (interaction.isModalSubmit() && interaction.customId.startsWith('add_user_modal_')) {
    const ticketId = interaction.customId.split('_')[3];
    const ticketData = ticketManager.getActiveTicket(ticketId);
    
    if (!ticketData) {
      return await interaction.reply({
        content: '❌ Ticket introuvable.',
        ephemeral: true
      });
    }

    const userInput = interaction.fields.getTextInputValue('user_id');
    let userId = userInput.replace(/[<@!>]/g, ''); // Nettoyer les mentions
    
    try {
      const userToAdd = await interaction.guild.members.fetch(userId);
      const channel = interaction.guild.channels.cache.get(ticketData.channelId);
      
      if (!channel) {
        return await interaction.reply({
          content: '❌ Salon du ticket introuvable.',
          ephemeral: true
        });
      }

      // Vérifier si l'utilisateur a déjà accès
      const hasAccess = channel.permissionOverwrites.cache.has(userId);
      if (hasAccess) {
        return await interaction.reply({
          content: '❌ Cet utilisateur a déjà accès au ticket.',
          ephemeral: true
        });
      }

      // Ajouter les permissions
      await channel.permissionOverwrites.create(userToAdd, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
        AttachFiles: true
      });

      // Message de confirmation dans le ticket
      await channel.send({
        content: `✅ ${userToAdd.toString()} a été ajouté au ticket par ${interaction.user.toString()}.`
      });

      await interaction.reply({
        content: `✅ ${userToAdd.toString()} a été ajouté au ticket.`,
        ephemeral: true
      });

      // Log l'action
      await Logger.log(client, 'MODERATION', {
        action: 'Ajout utilisateur ticket',
        moderator: interaction.user.tag,
        target: userToAdd.user.tag,
        reason: `Ajouté au ticket ${ticketId}`
      });

    } catch (error) {
      console.error('Erreur lors de l\'ajout d\'utilisateur au ticket:', error);
      await interaction.reply({
        content: '❌ Impossible de trouver cet utilisateur ou de l\'ajouter au ticket.',
        ephemeral: true
      });
    }
    return;
  }

  // Gestion des interactions de la commande config
  if ((interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) && 
      (interaction.customId.startsWith('setup_') || 
       interaction.customId.startsWith('config_') || 
       interaction.customId.startsWith('reset_'))) {
    try {
      if (typeof ConfigCommand.handleInteraction === 'function') {
        await ConfigCommand.handleInteraction(interaction);
      }
    } catch (error) {
      console.error('Erreur dans les interactions config:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
      }
    }
    return;
  }

  // Gestion des interactions de la commande help
  if ((interaction.isButton() || interaction.isStringSelectMenu()) && 
      (interaction.customId.startsWith('help_'))) {
    try {
      if (typeof HelpCommand.handleHelpInteraction === 'function') {
        await HelpCommand.handleHelpInteraction(interaction);
      }
    } catch (error) {
      console.error('Erreur dans les interactions help:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
      }
    }
    return;
  }

  // Gestion du modal de création d'automatisation
  if (interaction.isModalSubmit() && interaction.customId === 'automation_create_modal') {
    try {
      const name = interaction.fields.getTextInputValue('auto_name');
      const description = interaction.fields.getTextInputValue('auto_description');
      
      if (!name) {
        return await interaction.reply({
          content: '❌ Le nom de l\'automatisation est requis.',
          ephemeral: true
        });
      }

      // Créer l'automatisation avec des valeurs par défaut
      const automation = {
        id: `auto_${Date.now()}`,
        name,
        description,
        channelId: interaction.guild.channels.cache.filter(c => c.isTextBased()).first()?.id || '',
        interval: {
          amount: 1,
          unit: 'hours'
        },
        randomMode: false,
        enabled: true,
        messages: [{
          id: `msg_${Date.now()}`,
          type: 'text',
          content: 'Message automatisé'
        }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: interaction.user.username,
        messageIndex: 0,
        lastExecution: null,
        nextExecution: Date.now() + 3600000
      };

      const result = automationManager.addAutomation(automation);
      if (result.success) {
        await interaction.reply({
          content: `✅ Automatisation **${name}** créée avec succès !`,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `❌ Erreur lors de la création : ${result.error}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Erreur lors du traitement du modal d\'automatisation:', error);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de la création de l\'automatisation.',
        ephemeral: true
      });
    }
    return;
  }

  // Gestion de l'autocomplete pour /shedule
  if (interaction.isAutocomplete() && interaction.commandName === 'shedule') {
    if (typeof SheduleCommand.autocomplete === 'function') {
      await SheduleCommand.autocomplete(interaction);
    }
    return;
  }
}
