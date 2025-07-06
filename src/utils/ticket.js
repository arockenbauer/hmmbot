// Système de tickets avancé - HmmBot
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../../config.json');
const ticketsDataPath = path.join(__dirname, '../../data/tickets.json');
const activeTicketsPath = path.join(__dirname, '../../data/active-tickets.json');
const transcriptsDir = path.join(__dirname, '../../data/transcripts/');

// Créer les dossiers nécessaires
if (!fs.existsSync(transcriptsDir)) fs.mkdirSync(transcriptsDir, { recursive: true });
if (!fs.existsSync(path.dirname(ticketsDataPath))) fs.mkdirSync(path.dirname(ticketsDataPath), { recursive: true });

export class AdvancedTicketManager {
  constructor(client = null) {
    this.client = client;
    this.loadConfig();
    this.loadTickets();
    this.loadActiveTickets();
    this.autoCloseTimers = new Map();
  }

  // ✅ 1. Prérequis & vérifications
  validateConfig() {
    const config = this.getTicketConfig();
    const errors = [];

    if (!config.enabled) {
      errors.push('Le système de tickets est désactivé');
    }

    if (!config.panel?.channel) {
      errors.push('Salon du panel non configuré');
    }

    if (!config.category) {
      errors.push('Catégorie des tickets non configurée');
    }

    if (!config.support_role) {
      errors.push('Rôle support non configuré');
    }

    if (!config.transcript_channel) {
      errors.push('Salon des transcripts non configuré');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async validatePermissions(guild) {
    const config = this.getTicketConfig();
    const errors = [];

    try {
      // Vérifier la catégorie
      if (config.category) {
        const category = guild.channels.cache.get(config.category);
        if (!category) {
          errors.push('Catégorie introuvable');
        } else if (category.type !== ChannelType.GuildCategory) {
          errors.push('L\'ID fourni n\'est pas une catégorie');
        } else {
          const botMember = guild.members.cache.get(this.client.user.id);
          if (!category.permissionsFor(botMember).has([PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ViewChannel])) {
            errors.push('Permissions insuffisantes sur la catégorie');
          }
        }
      }

      // Vérifier le salon du panel
      if (config.panel?.channel) {
        const panelChannel = guild.channels.cache.get(config.panel.channel);
        if (!panelChannel) {
          errors.push('Salon du panel introuvable');
        } else {
          const botMember = guild.members.cache.get(this.client.user.id);
          if (!panelChannel.permissionsFor(botMember).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
            errors.push('Permissions insuffisantes sur le salon du panel');
          }
        }
      }

      // Vérifier le salon des transcripts
      if (config.transcript_channel) {
        const transcriptChannel = guild.channels.cache.get(config.transcript_channel);
        if (!transcriptChannel) {
          errors.push('Salon des transcripts introuvable');
        } else {
          const botMember = guild.members.cache.get(this.client.user.id);
          if (!transcriptChannel.permissionsFor(botMember).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles])) {
            errors.push('Permissions insuffisantes sur le salon des transcripts');
          }
        }
      }

      // Vérifier le rôle support
      if (config.support_role) {
        const supportRole = guild.roles.cache.get(config.support_role);
        if (!supportRole) {
          errors.push('Rôle support introuvable');
        }
      }

    } catch (error) {
      errors.push(`Erreur lors de la vérification: ${error.message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // 🧱 2. Création du panneau
  async createTicketPanel(guild) {
    const config = this.getTicketConfig();
    const validation = this.validateConfig();
    
    if (!validation.valid) {
      throw new Error(`Configuration invalide: ${validation.errors.join(', ')}`);
    }

    const permissionCheck = await this.validatePermissions(guild);
    if (!permissionCheck.valid) {
      throw new Error(`Permissions insuffisantes: ${permissionCheck.errors.join(', ')}`);
    }

    const channel = guild.channels.cache.get(config.panel.channel);
    if (!channel) {
      throw new Error('Salon du panel introuvable');
    }

    const embed = new EmbedBuilder()
      .setTitle(config.panel.embed_title || 'Support - Créer un ticket')
      .setDescription(config.panel.embed_text || 'Cliquez sur le bouton ci-dessous pour ouvrir un ticket et contacter notre équipe de support.')
      .setColor(0x5865f2)
      .setFooter({ text: 'HmmBot - Système de tickets' })
      .setTimestamp();

    let components = [];

    if (config.panel.selection_type === 'button') {
      const button = new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel(config.panel.button_label || 'Ouvrir un ticket')
        .setStyle(this.getButtonStyle(config.panel.button_color))
        .setEmoji('🎫');

      components.push(new ActionRowBuilder().addComponents(button));
    } else if (config.panel.selection_type === 'dropdown') {
      if (!config.panel.dropdown_options || config.panel.dropdown_options.length === 0) {
        throw new Error('Options du menu déroulant non configurées');
      }

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('create_ticket_select')
        .setPlaceholder('Choisissez le type de ticket')
        .addOptions(
          config.panel.dropdown_options.map((option, index) => ({
            label: option,
            value: `ticket_${index}`,
            description: `Créer un ticket pour: ${option}`,
            emoji: '🎫'
          }))
        );

      components.push(new ActionRowBuilder().addComponents(selectMenu));
    }

    const message = await channel.send({
      embeds: [embed],
      components
    });

    return message;
  }

  getButtonStyle(color) {
    const styles = {
      'Primary': 1,
      'Secondary': 2,
      'Success': 3,
      'Danger': 4,
      'Link': 5
    };
    return styles[color] || 1;
  }

  // 🧑‍💼 3. Ouverture du ticket
  async createTicket(interaction, ticketType = null) {
    const config = this.getTicketConfig();
    const userId = interaction.user.id;
    const guild = interaction.guild;

    // Vérifier la limite de tickets
    const userTickets = this.getUserActiveTickets(userId);
    if (userTickets.length >= config.ticket_limit) {
      return await interaction.reply({
        content: `❌ Vous avez déjà atteint la limite de ${config.ticket_limit} ticket(s) ouvert(s).`,
        ephemeral: true
      });
    }

    // Vérifier les permissions
    const permissionCheck = await this.validatePermissions(guild);
    if (!permissionCheck.valid) {
      return await interaction.reply({
        content: `❌ Configuration incorrecte: ${permissionCheck.errors.join(', ')}`,
        ephemeral: true
      });
    }

    try {
      // Créer le salon
      const category = guild.channels.cache.get(config.category);
      const ticketId = this.generateTicketId();
      const channelName = `ticket-${interaction.user.username}-${ticketId}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: category,
        topic: `Ticket de ${interaction.user.tag} (${interaction.user.id}) - Type: ${ticketType || 'Général'}`,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks
            ]
          },
          {
            id: this.client.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.AttachFiles,
              PermissionFlagsBits.EmbedLinks,
              PermissionFlagsBits.ManageMessages
            ]
          }
        ]
      });

      // Ajouter les permissions du rôle support
      if (config.support_role) {
        await ticketChannel.permissionOverwrites.create(config.support_role, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
          AttachFiles: true,
          EmbedLinks: true
        });
      }

      // Enregistrer le ticket
      const ticketData = {
        id: ticketId,
        channelId: ticketChannel.id,
        userId: interaction.user.id,
        type: ticketType || 'Général',
        createdAt: new Date().toISOString(),
        status: 'open',
        customFields: {}
      };

      this.addActiveTicket(ticketData);
      this.addUserTicket(userId, ticketChannel.id);

      // Message de bienvenue
      const welcomeEmbed = new EmbedBuilder()
        .setTitle('🎫 Nouveau Ticket')
        .setDescription(config.panel.welcome_message || 'Bienvenue dans votre ticket ! Un membre de notre équipe va vous répondre sous peu.')
        .addFields([
          { name: '👤 Utilisateur', value: `${interaction.user}`, inline: true },
          { name: '🏷️ Type', value: ticketType || 'Général', inline: true },
          { name: '🆔 ID Ticket', value: ticketId, inline: true }
        ])
        .setColor(0x00d26a)
        .setTimestamp();

      // Boutons de gestion
      const managementButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`close_ticket_${ticketId}`)
          .setLabel('Fermer le ticket')
          .setStyle(4)
          .setEmoji('🔒'),
        new ButtonBuilder()
          .setCustomId(`add_user_${ticketId}`)
          .setLabel('Ajouter utilisateur')
          .setStyle(2)
          .setEmoji('➕'),
        new ButtonBuilder()
          .setCustomId(`transcript_${ticketId}`)
          .setLabel('Générer transcript')
          .setStyle(1)
          .setEmoji('📄')
      );

      const supportRole = config.support_role ? `<@&${config.support_role}>` : '';
      await ticketChannel.send({
        content: `${supportRole} ${interaction.user}`,
        embeds: [welcomeEmbed],
        components: [managementButtons]
      });

      // Demander les champs personnalisés si configurés
      if (config.custom_fields && config.custom_fields.length > 0) {
        await this.requestCustomFields(ticketChannel, interaction.user, config.custom_fields, ticketId);
      }

      // Programmer la fermeture automatique si activée
      if (config.auto_close) {
        this.scheduleAutoClose(ticketId, ticketChannel, config.auto_close_delay);
      }

      // Logger l'action
      if (config.log_all_actions) {
        await this.logAction('TICKET_CREATED', {
          user: interaction.user.tag,
          userId: interaction.user.id,
          ticketId,
          channelId: ticketChannel.id,
          type: ticketType
        });
      }

      await interaction.reply({
        content: `✅ Votre ticket a été créé: ${ticketChannel}`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Erreur lors de la création du ticket:', error);
      await interaction.reply({
        content: '❌ Une erreur est survenue lors de la création du ticket.',
        ephemeral: true
      });
    }
  }

  // 📝 6. Champs personnalisés
  async requestCustomFields(channel, user, fields, ticketId) {
    const embed = new EmbedBuilder()
      .setTitle('📋 Informations supplémentaires')
      .setDescription('Veuillez fournir les informations suivantes pour nous aider à mieux vous assister:')
      .addFields(fields.map((field, index) => ({
        name: `${index + 1}. ${field}`,
        value: 'En attente de réponse...',
        inline: false
      })))
      .setColor(0xfaa61a);

    await channel.send({ embeds: [embed] });
  }

  // 🔄 4. Gestion des tickets - Fermeture
  async closeTicket(interaction, ticketId, reason = null) {
    const config = this.getTicketConfig();
    const ticketData = this.getActiveTicket(ticketId);
    
    if (!ticketData) {
      return await interaction.reply({
        content: '❌ Ticket introuvable.',
        ephemeral: true
      });
    }

    const channel = interaction.guild.channels.cache.get(ticketData.channelId);
    if (!channel) {
      this.removeActiveTicket(ticketId);
      return await interaction.reply({
        content: '❌ Salon du ticket introuvable.',
        ephemeral: true
      });
    }

    // Confirmation si activée
    if (config.panel.confirm_before_delete) {
      const confirmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Confirmation de fermeture')
        .setDescription('Êtes-vous sûr de vouloir fermer ce ticket ?')
        .setColor(0xfaa61a);

      const confirmButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`confirm_close_${ticketId}`)
          .setLabel('Confirmer')
          .setStyle(4)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId(`cancel_close_${ticketId}`)
          .setLabel('Annuler')
          .setStyle(2)
          .setEmoji('❌')
      );

      return await interaction.reply({
        embeds: [confirmEmbed],
        components: [confirmButtons],
        ephemeral: true
      });
    }

    await this.executeTicketClose(channel, ticketData, interaction.user, reason);
  }

  async executeTicketClose(channel, ticketData, closedBy, reason = null) {
    const config = this.getTicketConfig();

    try {
      // Message de fermeture
      const closeEmbed = new EmbedBuilder()
        .setTitle('🔒 Ticket fermé')
        .setDescription(config.close_message || 'Ce ticket a été fermé.')
        .addFields([
          { name: '👤 Fermé par', value: `${closedBy}`, inline: true },
          { name: '🕐 Fermé le', value: new Date().toLocaleString('fr-FR'), inline: true }
        ])
        .setColor(0xf23f43);

      if (reason) {
        closeEmbed.addFields([{ name: '📝 Raison', value: reason, inline: false }]);
      }

      await channel.send({ embeds: [closeEmbed] });

      // Générer et sauvegarder le transcript
      if (config.log_transcripts) {
        await this.generateAndSaveTranscript(channel, ticketData);
      }

      // Supprimer le timer de fermeture automatique
      if (this.autoCloseTimers.has(ticketData.id)) {
        clearTimeout(this.autoCloseTimers.get(ticketData.id));
        this.autoCloseTimers.delete(ticketData.id);
      }

      // Nettoyer les données
      this.removeActiveTicket(ticketData.id);
      this.removeUserTicket(ticketData.userId, ticketData.channelId);

      // Logger l'action
      if (config.log_all_actions) {
        await this.logAction('TICKET_CLOSED', {
          ticketId: ticketData.id,
          userId: ticketData.userId,
          closedBy: closedBy.tag,
          reason: reason || 'Aucune raison spécifiée'
        });
      }

      // Supprimer le salon après un délai
      setTimeout(async () => {
        try {
          await channel.delete();
        } catch (error) {
          console.error('Erreur lors de la suppression du salon:', error);
        }
      }, 5000);

    } catch (error) {
      console.error('Erreur lors de la fermeture du ticket:', error);
    }
  }

  // ⏲️ 5. Fermeture automatique
  scheduleAutoClose(ticketId, channel, delay) {
    const timer = setTimeout(async () => {
      const ticketData = this.getActiveTicket(ticketId);
      if (ticketData) {
        const embed = new EmbedBuilder()
          .setTitle('⏰ Fermeture automatique')
          .setDescription('Ce ticket va être fermé automatiquement dans 60 secondes pour inactivité.')
          .setColor(0xfaa61a);

        await channel.send({ embeds: [embed] });

        // Délai de grâce de 60 secondes
        setTimeout(async () => {
          const stillExists = this.getActiveTicket(ticketId);
          if (stillExists) {
            await this.executeTicketClose(channel, ticketData, this.client.user, 'Fermeture automatique pour inactivité');
          }
        }, 60000);
      }
      this.autoCloseTimers.delete(ticketId);
    }, delay * 1000);

    this.autoCloseTimers.set(ticketId, timer);
  }

  // 📚 7. Logs & transcripts
  async generateAndSaveTranscript(channel, ticketData) {
    try {
      const messages = await channel.messages.fetch({ limit: 100 });
      const sortedMessages = Array.from(messages.values())
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

      const html = this.generateAdvancedTranscriptHTML(channel, sortedMessages, ticketData);
      const filePath = path.join(transcriptsDir, `${ticketData.id}.html`);
      
      fs.writeFileSync(filePath, html);

      // Envoyer le transcript dans le salon configuré
      const config = this.getTicketConfig();
      if (config.transcript_channel) {
        const transcriptChannel = channel.guild.channels.cache.get(config.transcript_channel);
        if (transcriptChannel) {
          const transcriptEmbed = new EmbedBuilder()
            .setTitle('📄 Transcript de ticket')
            .addFields([
              { name: '🆔 ID Ticket', value: ticketData.id, inline: true },
              { name: '👤 Utilisateur', value: `<@${ticketData.userId}>`, inline: true },
              { name: '🏷️ Type', value: ticketData.type, inline: true },
              { name: '📅 Créé le', value: new Date(ticketData.createdAt).toLocaleString('fr-FR'), inline: true },
              { name: '📅 Fermé le', value: new Date().toLocaleString('fr-FR'), inline: true },
              { name: '💬 Messages', value: sortedMessages.length.toString(), inline: true }
            ])
            .setColor(0x5865f2)
            .setTimestamp();

          await transcriptChannel.send({
            embeds: [transcriptEmbed],
            files: [{ attachment: filePath, name: `transcript-${ticketData.id}.html` }]
          });
        }
      }

      return filePath;
    } catch (error) {
      console.error('Erreur lors de la génération du transcript:', error);
      return null;
    }
  }

  generateAdvancedTranscriptHTML(channel, messages, ticketData) {
    const esc = s => s ? s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])) : '';
    
    const messagesHTML = messages.map(m => {
      const attachments = m.attachments.size > 0 
        ? `<div class="attachments">${Array.from(m.attachments.values()).map(att => 
            `<a href="${att.url}" target="_blank">${att.name}</a>`
          ).join(', ')}</div>` 
        : '';
      
      const embeds = m.embeds.length > 0
        ? `<div class="embeds">${m.embeds.map(embed => 
            `<div class="embed"><strong>${esc(embed.title || '')}</strong><br>${esc(embed.description || '')}</div>`
          ).join('')}</div>`
        : '';

      return `
        <div class="message">
          <div class="message-header">
            <strong class="author">${esc(m.author.tag)}</strong>
            <span class="timestamp">${new Date(m.createdTimestamp).toLocaleString('fr-FR')}</span>
          </div>
          <div class="message-content">${esc(m.content)}</div>
          ${attachments}
          ${embeds}
        </div>
      `;
    }).join('');

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Transcript - Ticket ${esc(ticketData.id)}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #36393f; color: #dcddde; margin: 0; padding: 20px; }
          .header { background: #2f3136; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #5865f2; }
          .info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-top: 15px; }
          .info-item { background: #40444b; padding: 10px; border-radius: 4px; }
          .info-label { font-weight: bold; color: #b9bbbe; }
          .messages { background: #2f3136; border-radius: 8px; padding: 20px; }
          .message { margin-bottom: 15px; padding: 10px; background: #40444b; border-radius: 4px; }
          .message-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
          .author { color: #5865f2; }
          .timestamp { color: #72767d; font-size: 0.8em; }
          .message-content { line-height: 1.4; }
          .attachments { margin-top: 8px; padding: 8px; background: #36393f; border-radius: 4px; }
          .attachments a { color: #00aff4; text-decoration: none; }
          .embeds { margin-top: 8px; }
          .embed { background: #2f3136; border-left: 4px solid #5865f2; padding: 10px; margin: 5px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📄 Transcript du ticket</h1>
          <div class="info">
            <div class="info-item">
              <div class="info-label">ID Ticket</div>
              <div>${esc(ticketData.id)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Salon</div>
              <div>#${esc(channel.name)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Type</div>
              <div>${esc(ticketData.type)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Créé le</div>
              <div>${new Date(ticketData.createdAt).toLocaleString('fr-FR')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Fermé le</div>
              <div>${new Date().toLocaleString('fr-FR')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Messages</div>
              <div>${messages.length}</div>
            </div>
          </div>
        </div>
        <div class="messages">
          ${messagesHTML}
        </div>
      </body>
      </html>
    `;
  }

  async logAction(action, data) {
    // Implémenter le logging selon vos besoins
    console.log(`[TICKET] ${action}:`, data);
  }

  // 💾 9. Sauvegarde et gestion des données
  loadConfig() {
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      this.config = JSON.parse(configData);
      if (!this.config.ticket) {
        this.config.ticket = this.getDefaultTicketConfig();
        this.saveConfig();
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la config:', error);
      this.config = { ticket: this.getDefaultTicketConfig() };
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la config:', error);
    }
  }

  getDefaultTicketConfig() {
    return {
      enabled: true,
      category: '',
      support_role: '',
      transcript_channel: '',
      ticket_limit: 1,
      message: 'Merci de créer un ticket pour contacter le support.',
      close_message: 'Votre ticket a été fermé. Merci de nous avoir contactés.',
      log_transcripts: true,
      log_all_actions: true,
      auto_close: false,
      auto_close_delay: 3600,
      custom_fields: [],
      panel: {
        channel: '',
        embed_title: 'Support - Créer un ticket',
        embed_text: 'Cliquez sur le bouton ci-dessous pour ouvrir un ticket et contacter notre équipe de support.',
        selection_type: 'button',
        button_label: 'Ouvrir un ticket',
        button_color: 'Primary',
        dropdown_options: ['Support Général', 'Signalement', 'Demande de Partenariat', 'Autre'],
        welcome_message: 'Bienvenue dans votre ticket ! Un membre de notre équipe va vous répondre sous peu.',
        confirm_before_delete: true
      }
    };
  }

  updateTicketConfig(newConfig) {
    this.config.ticket = { ...this.config.ticket, ...newConfig };
    this.saveConfig();
  }

  getTicketConfig() {
    return this.config.ticket;
  }

  // Gestion des tickets utilisateur
  loadTickets() {
    try {
      if (!fs.existsSync(ticketsDataPath)) {
        fs.writeFileSync(ticketsDataPath, '{}');
      }
      this.tickets = JSON.parse(fs.readFileSync(ticketsDataPath, 'utf8'));
    } catch (error) {
      console.error('Erreur lors du chargement des tickets:', error);
      this.tickets = {};
    }
  }

  saveTickets() {
    try {
      fs.writeFileSync(ticketsDataPath, JSON.stringify(this.tickets, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des tickets:', error);
    }
  }

  getUserTickets(userId) {
    return this.tickets[userId] || [];
  }

  addUserTicket(userId, channelId) {
    if (!this.tickets[userId]) this.tickets[userId] = [];
    this.tickets[userId].push(channelId);
    this.saveTickets();
  }

  removeUserTicket(userId, channelId) {
    if (!this.tickets[userId]) return;
    this.tickets[userId] = this.tickets[userId].filter(id => id !== channelId);
    if (this.tickets[userId].length === 0) {
      delete this.tickets[userId];
    }
    this.saveTickets();
  }

  // Gestion des tickets actifs
  loadActiveTickets() {
    try {
      if (!fs.existsSync(activeTicketsPath)) {
        fs.writeFileSync(activeTicketsPath, '{}');
      }
      this.activeTickets = JSON.parse(fs.readFileSync(activeTicketsPath, 'utf8'));
    } catch (error) {
      console.error('Erreur lors du chargement des tickets actifs:', error);
      this.activeTickets = {};
    }
  }

  saveActiveTickets() {
    try {
      fs.writeFileSync(activeTicketsPath, JSON.stringify(this.activeTickets, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des tickets actifs:', error);
    }
  }

  addActiveTicket(ticketData) {
    this.activeTickets[ticketData.id] = ticketData;
    this.saveActiveTickets();
  }

  removeActiveTicket(ticketId) {
    delete this.activeTickets[ticketId];
    this.saveActiveTickets();
  }

  getActiveTicket(ticketId) {
    return this.activeTickets[ticketId];
  }

  getUserActiveTickets(userId) {
    return Object.values(this.activeTickets).filter(ticket => ticket.userId === userId);
  }

  getAllActiveTickets() {
    return Object.values(this.activeTickets);
  }

  getTicketByChannelId(channelId) {
    return Object.values(this.activeTickets).find(ticket => ticket.channelId === channelId);
  }

  generateTicketId() {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  }

  // Méthodes de compatibilité avec l'ancien système
  async saveTranscript(channel, messages) {
    const ticketData = {
      id: channel.id,
      type: 'Legacy',
      createdAt: new Date().toISOString()
    };
    return await this.generateAndSaveTranscript(channel, ticketData);
  }

  generateTranscriptHTML(channel, messages) {
    const ticketData = {
      id: channel.id,
      type: 'Legacy',
      createdAt: new Date().toISOString()
    };
    return this.generateAdvancedTranscriptHTML(channel, messages, ticketData);
  }
}

// Maintenir la compatibilité avec l'ancien nom
export const TicketManager = AdvancedTicketManager;
