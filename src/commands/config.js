import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Config } from '../utils/config.js';

export const data = new SlashCommandBuilder()
  .setName('config')
  .setDescription('Interface de configuration complète du bot')
  .addSubcommand(subcommand =>
    subcommand
      .setName('channel')
      .setDescription('Configure un canal')
      .addStringOption(option =>
        option.setName('type')
          .setDescription('Type de canal à configurer')
          .setRequired(true)
          .addChoices(
            { name: 'Logs', value: 'logs' },
            { name: 'Bienvenue', value: 'welcome' },
            { name: 'Au revoir', value: 'goodbye' },
            { name: 'Modération', value: 'moderation' },
            { name: 'Économie', value: 'economy' },
            { name: 'Logs vocaux', value: 'voice_logs' },
            { name: 'Général', value: 'general' }
          ))
      .addChannelOption(option =>
        option.setName('canal')
          .setDescription('Le canal à configurer')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('role')
      .setDescription('Configure un rôle')
      .addStringOption(option =>
        option.setName('type')
          .setDescription('Type de rôle à configurer')
          .setRequired(true)
          .addChoices(
            { name: 'Modérateur', value: 'moderator' },
            { name: 'Administrateur', value: 'admin' },
            { name: 'Membre', value: 'member' },
            { name: 'Muet', value: 'muted' },
            { name: 'VIP', value: 'vip' }
          ))
      .addRoleOption(option =>
        option.setName('role')
          .setDescription('Le rôle à configurer')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('moderation')
      .setDescription('Configure les paramètres de modération')
      .addStringOption(option =>
        option.setName('parametre')
          .setDescription('Paramètre à modifier')
          .setRequired(true)
          .addChoices(
            { name: 'Auto-suppression réponse clear', value: 'auto_delete_clear_response' },
            { name: 'Délai suppression réponse clear', value: 'clear_response_delay' },
            { name: 'MP lors des sanctions', value: 'dm_on_punishment' },
            { name: 'Logger toutes les actions', value: 'log_all_actions' }
          ))
      .addStringOption(option =>
        option.setName('valeur')
          .setDescription('Nouvelle valeur (true/false pour les booléens, nombre pour les délais)')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('economy')
      .setDescription('Configure les paramètres d\'économie')
      .addStringOption(option =>
        option.setName('parametre')
          .setDescription('Paramètre à modifier')
          .setRequired(true)
          .addChoices(
            { name: 'Montant journalier', value: 'daily_amount' },
            { name: 'Travail minimum', value: 'work_min' },
            { name: 'Travail maximum', value: 'work_max' },
            { name: 'Taux de réussite vol', value: 'rob_success_rate' },
            { name: 'Vol minimum', value: 'rob_min' },
            { name: 'Vol maximum', value: 'rob_max' }
          ))
      .addStringOption(option =>
        option.setName('valeur')
          .setDescription('Nouvelle valeur')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('voice')
      .setDescription('Configure les paramètres vocaux')
      .addStringOption(option =>
        option.setName('parametre')
          .setDescription('Paramètre à modifier')
          .setRequired(true)
          .addChoices(
            { name: 'Suivre le temps vocal', value: 'track_voice_time' },
            { name: 'Coins par minute', value: 'coins_per_minute' }
          ))
      .addStringOption(option =>
        option.setName('valeur')
          .setDescription('Nouvelle valeur')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('ticket')
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
        option.setName('auto_close_delay').setDescription('Délai de fermeture auto (s)')))
  .addSubcommand(subcommand =>
    subcommand
      .setName('panel')
      .setDescription('Configure le panneau d\'ouverture de ticket')
      .addChannelOption(option =>
        option.setName('channel').setDescription('Salon où envoyer le panneau').setRequired(true))
      .addStringOption(option =>
        option.setName('embed_title').setDescription('Titre de l\'embed'))
      .addStringOption(option =>
        option.setName('embed_text').setDescription('Texte de l\'embed'))
      .addStringOption(option =>
        option.setName('selection_type').setDescription('Type de sélection').addChoices(
          { name: 'Bouton', value: 'button' },
          { name: 'Menu déroulant', value: 'dropdown' }
        ))
      .addStringOption(option =>
        option.setName('button_label').setDescription('Nom du bouton'))
      .addStringOption(option =>
        option.setName('button_color').setDescription('Couleur du bouton').addChoices(
          { name: 'Bleu', value: 'Primary' },
          { name: 'Vert', value: 'Success' },
          { name: 'Rouge', value: 'Danger' }
        ))
      .addStringOption(option =>
        option.setName('dropdown_options').setDescription('Liste des valeurs du dropdown (séparées par |)'))
      .addStringOption(option =>
        option.setName('welcome_message').setDescription('Message de bienvenue dans le ticket'))
      .addBooleanOption(option =>
        option.setName('confirm_before_delete').setDescription('Demander confirmation avant suppression')))
  .addSubcommand(subcommand =>
    subcommand
      .setName('webui')
      .setDescription('Configure l\'interface web')
      .addIntegerOption(option =>
        option.setName('port').setDescription('Port de l\'interface web'))
      .addStringOption(option =>
        option.setName('password').setDescription('Mot de passe de l\'interface web'))
      .addStringOption(option =>
        option.setName('session_duration').setDescription('Durée de session (ex: 2h, 30m)')))
  .addSubcommand(subcommand =>
    subcommand
      .setName('logs')
      .setDescription('Configure le système de logs')
      .addBooleanOption(option =>
        option.setName('create_test_logs').setDescription('Créer des logs de test au démarrage'))
      .addIntegerOption(option =>
        option.setName('max_log_files').setDescription('Nombre maximum de fichiers de logs'))
      .addIntegerOption(option =>
        option.setName('max_memory_logs').setDescription('Nombre maximum de logs en mémoire'))
      .addStringOption(option =>
        option.setName('log_level').setDescription('Niveau de log').addChoices(
          { name: 'Debug', value: 'debug' },
          { name: 'Info', value: 'info' },
          { name: 'Warn', value: 'warn' },
          { name: 'Error', value: 'error' }
        ))
      .addBooleanOption(option =>
        option.setName('auto_cleanup').setDescription('Nettoyage automatique des anciens logs')))
  .addSubcommand(subcommand =>
    subcommand
      .setName('features')
      .setDescription('Active/désactive les fonctionnalités du bot')
      .addBooleanOption(option =>
        option.setName('tickets').setDescription('Système de tickets'))
      .addBooleanOption(option =>
        option.setName('economy').setDescription('Système d\'économie'))
      .addBooleanOption(option =>
        option.setName('moderation').setDescription('Système de modération')))
  .addSubcommand(subcommand =>
    subcommand
      .setName('setup')
      .setDescription('Assistant de configuration complète du bot'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('show')
      .setDescription('Affiche la configuration actuelle'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('reload')
      .setDescription('Recharge la configuration depuis le fichier'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('backup')
      .setDescription('Crée une sauvegarde de la configuration'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('restore')
      .setDescription('Restaure une sauvegarde de configuration')
      .addStringOption(option =>
        option.setName('backup_file').setDescription('Nom du fichier de sauvegarde').setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('reset')
      .setDescription('Remet la configuration aux valeurs par défaut')
      .addStringOption(option =>
        option.setName('section').setDescription('Section à réinitialiser (ou "all" pour tout)').addChoices(
          { name: 'Tout', value: 'all' },
          { name: 'Canaux', value: 'channels' },
          { name: 'Rôles', value: 'roles' },
          { name: 'Modération', value: 'moderation' },
          { name: 'Économie', value: 'economy' },
          { name: 'Vocal', value: 'voice' },
          { name: 'Tickets', value: 'ticket' },
          { name: 'Interface Web', value: 'webui' },
          { name: 'Logs', value: 'logs' }
        ).setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('global')
      .setDescription('Interface de configuration centralisée complète'))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'global':
        await showMainConfigInterface(interaction);
        break;
      case 'channel':
        await handleChannelConfig(interaction);
        break;
      case 'role':
        await handleRoleConfig(interaction);
        break;
      case 'moderation':
        await handleModerationConfig(interaction);
        break;
      case 'economy':
        await handleEconomyConfig(interaction);
        break;
      case 'voice':
        await handleVoiceConfig(interaction);
        break;
      case 'ticket':
        await handleTicketConfig(interaction);
        break;
      case 'panel':
        await handlePanelConfig(interaction);
        break;
      case 'webui':
        await handleWebuiConfig(interaction);
        break;
      case 'logs':
        await handleLogsConfig(interaction);
        break;
      case 'features':
        await handleFeaturesConfig(interaction);
        break;
      case 'setup':
        await handleSetupWizard(interaction);
        break;
      case 'show':
        await handleShowConfig(interaction);
        break;
      case 'reload':
        await handleReloadConfig(interaction);
        break;
      case 'backup':
        await handleBackupConfig(interaction);
        break;
      case 'restore':
        await handleRestoreConfig(interaction);
        break;
      case 'reset':
        await handleResetConfig(interaction);
        break;
    }
  } catch (error) {
    console.error('Erreur dans la commande config:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Une erreur est survenue lors de la configuration.', ephemeral: true });
    }
  }
}

// Interface principale de configuration
async function showMainConfigInterface(interaction) {
  const config = Config.getConfig();
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Panneau de Configuration HmmBot')
    .setDescription('**Interface de configuration centralisée**\n\nUtilisez les boutons ci-dessous pour configurer tous les aspects de votre bot. Cette interface se met à jour automatiquement après chaque modification.')
    .setColor('#339af0')
    .setTimestamp()
    .setFooter({ text: 'Configuration HmmBot • Interface Interactive' });

  // Statut des modules
  const featuresStatus = [];
  if (config.features?.tickets?.enabled) featuresStatus.push('🎟️ Tickets');
  if (config.features?.economy?.enabled) featuresStatus.push('💰 Économie');
  if (config.features?.moderation?.enabled) featuresStatus.push('🛡️ Modération');
  
  embed.addFields(
    { 
      name: '🎯 Modules Actifs', 
      value: featuresStatus.length > 0 ? featuresStatus.join(' • ') : 'Aucun module activé', 
      inline: false 
    },
    { 
      name: '📊 État de la Configuration', 
      value: getConfigurationStatus(config), 
      inline: false 
    }
  );

  const components = createMainConfigComponents();
  
  await interaction.reply({ 
    embeds: [embed], 
    components: components,
    ephemeral: false
  });
}

// Créer les composants de l'interface principale
function createMainConfigComponents() {
  const row1 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_main_channels')
        .setLabel('📺 Canaux')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('config_main_roles')
        .setLabel('👥 Rôles')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('config_main_features')
        .setLabel('🎯 Modules')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('config_main_moderation')
        .setLabel('🛡️ Modération')
        .setStyle(ButtonStyle.Secondary)
    );

  const row2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_main_economy')
        .setLabel('💰 Économie')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('config_main_tickets')
        .setLabel('🎟️ Tickets')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('config_main_voice')
        .setLabel('🎤 Vocal')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('config_main_webui')
        .setLabel('🌐 WebUI')
        .setStyle(ButtonStyle.Secondary)
    );

  const row3 = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_main_tools')
        .setPlaceholder('🛠️ Outils de Configuration')
        .addOptions(
          { label: '🧙‍♂️ Assistant de Configuration', value: 'setup', emoji: '🧙‍♂️' },
          { label: '📋 Voir Configuration Complète', value: 'show', emoji: '📋' },
          { label: '🔄 Recharger Configuration', value: 'reload', emoji: '🔄' },
          { label: '💾 Créer Sauvegarde', value: 'backup', emoji: '💾' },
          { label: '📂 Restaurer Sauvegarde', value: 'restore', emoji: '📂' },
          { label: '🗑️ Réinitialiser', value: 'reset', emoji: '🗑️' },
          { label: '📝 Logs Système', value: 'logs', emoji: '📝' }
        )
    );

  const row4 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_main_refresh')
        .setLabel('🔄 Actualiser')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('config_main_close')
        .setLabel('❌ Fermer')
        .setStyle(ButtonStyle.Danger)
    );

  return [row1, row2, row3, row4];
}

// Obtenir le statut de configuration
function getConfigurationStatus(config) {
  const status = [];
  
  // Canaux configurés
  const channels = Object.values(config.channels || {}).filter(id => id).length;
  const totalChannels = Object.keys(config.channels || {}).length;
  status.push(`📺 Canaux: ${channels}/${totalChannels}`);
  
  // Rôles configurés
  const roles = Object.values(config.roles || {}).filter(id => id).length;
  const totalRoles = Object.keys(config.roles || {}).length;
  status.push(`👥 Rôles: ${roles}/${totalRoles}`);
  
  // WebUI
  const webuiConfigured = config.webui?.port ? '✅' : '❌';
  status.push(`🌐 WebUI: ${webuiConfigured}`);
  
  // Tickets
  const ticketsConfigured = config.ticket?.enabled ? '✅' : '❌';
  status.push(`🎟️ Tickets: ${ticketsConfigured}`);
  
  return status.join(' • ');
}

async function handleChannelConfig(interaction) {
  const type = interaction.options.getString('type');
  const channel = interaction.options.getChannel('canal');

  const success = Config.setChannel(type, channel.id);
  
  if (success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Canal configuré')
      .setDescription(`Le canal **${type}** a été configuré sur ${channel}`)
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: '❌ Erreur lors de la sauvegarde de la configuration.', ephemeral: true });
  }
}

async function handleRoleConfig(interaction) {
  const type = interaction.options.getString('type');
  const role = interaction.options.getRole('role');

  const success = Config.setRole(type, role.id);
  
  if (success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Rôle configuré')
      .setDescription(`Le rôle **${type}** a été configuré sur ${role}`)
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: '❌ Erreur lors de la sauvegarde de la configuration.', ephemeral: true });
  }
}

async function handleModerationConfig(interaction) {
  const parameter = interaction.options.getString('parametre');
  const value = interaction.options.getString('valeur');

  let parsedValue;
  
  // Parser la valeur selon le type
  if (parameter === 'clear_response_delay') {
    parsedValue = parseInt(value);
    if (isNaN(parsedValue)) {
      return await interaction.reply({ content: '❌ La valeur doit être un nombre.', ephemeral: true });
    }
  } else {
    // Booléens
    if (value.toLowerCase() === 'true') parsedValue = true;
    else if (value.toLowerCase() === 'false') parsedValue = false;
    else {
      return await interaction.reply({ content: '❌ La valeur doit être "true" ou "false".', ephemeral: true });
    }
  }

  const success = Config.setModerationSetting(parameter, parsedValue);
  
  if (success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Paramètre de modération configuré')
      .setDescription(`**${parameter}** a été configuré sur \`${parsedValue}\``)
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: '❌ Erreur lors de la sauvegarde de la configuration.', ephemeral: true });
  }
}

async function handleEconomyConfig(interaction) {
  const parameter = interaction.options.getString('parametre');
  const value = interaction.options.getString('valeur');

  let parsedValue;
  
  if (parameter === 'rob_success_rate') {
    parsedValue = parseFloat(value);
    if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 1) {
      return await interaction.reply({ content: '❌ Le taux de réussite doit être entre 0 et 1.', ephemeral: true });
    }
  } else {
    parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      return await interaction.reply({ content: '❌ La valeur doit être un nombre positif.', ephemeral: true });
    }
  }

  const success = Config.setEconomySetting(parameter, parsedValue);
  
  if (success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Paramètre d\'économie configuré')
      .setDescription(`**${parameter}** a été configuré sur \`${parsedValue}\``)
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: '❌ Erreur lors de la sauvegarde de la configuration.', ephemeral: true });
  }
}

async function handleVoiceConfig(interaction) {
  const parameter = interaction.options.getString('parametre');
  const value = interaction.options.getString('valeur');

  let parsedValue;
  
  if (parameter === 'track_voice_time') {
    if (value.toLowerCase() === 'true') parsedValue = true;
    else if (value.toLowerCase() === 'false') parsedValue = false;
    else {
      return await interaction.reply({ content: '❌ La valeur doit être "true" ou "false".', ephemeral: true });
    }
  } else {
    parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < 0) {
      return await interaction.reply({ content: '❌ La valeur doit être un nombre positif.', ephemeral: true });
    }
  }

  const success = Config.setVoiceSetting(parameter, parsedValue);
  
  if (success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Paramètre vocal configuré')
      .setDescription(`**${parameter}** a été configuré sur \`${parsedValue}\``)
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: '❌ Erreur lors de la sauvegarde de la configuration.', ephemeral: true });
  }
}

async function handleTicketConfig(interaction) {
  const enabled = interaction.options.getBoolean('enabled');
  const category = interaction.options.getChannel('category');
  const supportRole = interaction.options.getRole('support_role');
  const transcriptChannel = interaction.options.getChannel('transcript_channel');
  const ticketLimit = interaction.options.getInteger('ticket_limit');
  const message = interaction.options.getString('message');
  const closeMessage = interaction.options.getString('close_message');
  const logTranscripts = interaction.options.getBoolean('log_transcripts');
  const autoClose = interaction.options.getBoolean('auto_close');
  const autoCloseDelay = interaction.options.getInteger('auto_close_delay');

  const ticketConfig = {};
  
  if (enabled !== null) ticketConfig.enabled = enabled;
  if (category) ticketConfig.category = category.id;
  if (supportRole) ticketConfig.support_role = supportRole.id;
  if (transcriptChannel) ticketConfig.transcript_channel = transcriptChannel.id;
  if (ticketLimit !== null) ticketConfig.ticket_limit = ticketLimit;
  if (message) ticketConfig.message = message;
  if (closeMessage) ticketConfig.close_message = closeMessage;
  if (logTranscripts !== null) ticketConfig.log_transcripts = logTranscripts;
  if (autoClose !== null) ticketConfig.auto_close = autoClose;
  if (autoCloseDelay !== null) ticketConfig.auto_close_delay = autoCloseDelay;

  const success = Config.setTicketConfig(ticketConfig);
  
  if (success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Configuration des tickets mise à jour')
      .setDescription('Les paramètres du système de tickets ont été configurés avec succès.')
      .setColor('#51cf66')
      .setTimestamp();

    // Ajouter les champs modifiés
    const fields = [];
    if (enabled !== null) fields.push({ name: 'Activé', value: enabled ? 'Oui' : 'Non', inline: true });
    if (category) fields.push({ name: 'Catégorie', value: category.name, inline: true });
    if (supportRole) fields.push({ name: 'Rôle support', value: supportRole.name, inline: true });
    if (transcriptChannel) fields.push({ name: 'Canal transcripts', value: transcriptChannel.name, inline: true });
    if (ticketLimit !== null) fields.push({ name: 'Limite tickets', value: ticketLimit.toString(), inline: true });
    if (logTranscripts !== null) fields.push({ name: 'Log transcripts', value: logTranscripts ? 'Oui' : 'Non', inline: true });

    if (fields.length > 0) {
      embed.addFields(fields);
    }

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: '❌ Erreur lors de la sauvegarde de la configuration.', ephemeral: true });
  }
}

async function handlePanelConfig(interaction) {
  const channel = interaction.options.getChannel('channel');
  const embedTitle = interaction.options.getString('embed_title');
  const embedText = interaction.options.getString('embed_text');
  const selectionType = interaction.options.getString('selection_type');
  const buttonLabel = interaction.options.getString('button_label');
  const buttonColor = interaction.options.getString('button_color');
  const dropdownOptions = interaction.options.getString('dropdown_options');
  const welcomeMessage = interaction.options.getString('welcome_message');
  const confirmBeforeDelete = interaction.options.getBoolean('confirm_before_delete');

  const panelConfig = { channel: channel.id };
  
  if (embedTitle) panelConfig.embed_title = embedTitle;
  if (embedText) panelConfig.embed_text = embedText;
  if (selectionType) panelConfig.selection_type = selectionType;
  if (buttonLabel) panelConfig.button_label = buttonLabel;
  if (buttonColor) panelConfig.button_color = buttonColor;
  if (dropdownOptions) panelConfig.dropdown_options = dropdownOptions.split('|');
  if (welcomeMessage) panelConfig.welcome_message = welcomeMessage;
  if (confirmBeforeDelete !== null) panelConfig.confirm_before_delete = confirmBeforeDelete;

  const success = Config.setPanelConfig(panelConfig);
  
  if (success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Panneau de tickets configuré')
      .setDescription(`Le panneau de tickets a été configuré pour ${channel}`)
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else {
    await interaction.reply({ content: '❌ Erreur lors de la sauvegarde de la configuration.', ephemeral: true });
  }
}

async function handleWebuiConfig(interaction) {
  const port = interaction.options.getInteger('port');
  const password = interaction.options.getString('password');
  const sessionDuration = interaction.options.getString('session_duration');

  const config = Config.getConfig();
  if (!config.webui) config.webui = {};

  let updated = false;
  const changes = [];

  if (port !== null) {
    config.webui.port = port;
    changes.push(`Port: ${port}`);
    updated = true;
  }
  if (password) {
    config.webui.password = password;
    changes.push('Mot de passe: ••••••••');
    updated = true;
  }
  if (sessionDuration) {
    config.webui.session_duration = sessionDuration;
    changes.push(`Durée de session: ${sessionDuration}`);
    updated = true;
  }

  if (updated) {
    const success = Config.saveConfig();
    
    if (success) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Interface web configurée')
        .setDescription('Les paramètres de l\'interface web ont été mis à jour.')
        .addFields({ name: 'Modifications', value: changes.join('\n'), inline: false })
        .setColor('#51cf66')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ content: '❌ Erreur lors de la sauvegarde de la configuration.', ephemeral: true });
    }
  } else {
    await interaction.reply({ content: '❌ Aucun paramètre à modifier spécifié.', ephemeral: true });
  }
}

async function handleLogsConfig(interaction) {
  const createTestLogs = interaction.options.getBoolean('create_test_logs');
  const maxLogFiles = interaction.options.getInteger('max_log_files');
  const maxMemoryLogs = interaction.options.getInteger('max_memory_logs');
  const logLevel = interaction.options.getString('log_level');
  const autoCleanup = interaction.options.getBoolean('auto_cleanup');

  const config = Config.getConfig();
  if (!config.logs) config.logs = {};

  let updated = false;
  const changes = [];

  if (createTestLogs !== null) {
    config.logs.create_test_logs_on_startup = createTestLogs;
    changes.push(`Logs de test: ${createTestLogs ? 'Activés' : 'Désactivés'}`);
    updated = true;
  }
  if (maxLogFiles !== null) {
    config.logs.max_log_files = maxLogFiles;
    changes.push(`Max fichiers logs: ${maxLogFiles}`);
    updated = true;
  }
  if (maxMemoryLogs !== null) {
    config.logs.max_memory_logs = maxMemoryLogs;
    changes.push(`Max logs mémoire: ${maxMemoryLogs}`);
    updated = true;
  }
  if (logLevel) {
    config.logs.log_level = logLevel;
    changes.push(`Niveau de log: ${logLevel}`);
    updated = true;
  }
  if (autoCleanup !== null) {
    config.logs.auto_cleanup = autoCleanup;
    changes.push(`Nettoyage auto: ${autoCleanup ? 'Activé' : 'Désactivé'}`);
    updated = true;
  }

  if (updated) {
    const success = Config.saveConfig();
    
    if (success) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Système de logs configuré')
        .setDescription('Les paramètres du système de logs ont été mis à jour.')
        .addFields({ name: 'Modifications', value: changes.join('\n'), inline: false })
        .setColor('#51cf66')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ content: '❌ Erreur lors de la sauvegarde de la configuration.', ephemeral: true });
    }
  } else {
    await interaction.reply({ content: '❌ Aucun paramètre à modifier spécifié.', ephemeral: true });
  }
}

async function handleFeaturesConfig(interaction) {
  const tickets = interaction.options.getBoolean('tickets');
  const economy = interaction.options.getBoolean('economy');
  const moderation = interaction.options.getBoolean('moderation');

  const config = Config.getConfig();
  if (!config.features) config.features = {};

  let updated = false;
  const changes = [];

  if (tickets !== null) {
    if (!config.features.tickets) config.features.tickets = {};
    config.features.tickets.enabled = tickets;
    changes.push(`Tickets: ${tickets ? 'Activés' : 'Désactivés'}`);
    updated = true;
  }
  if (economy !== null) {
    if (!config.features.economy) config.features.economy = {};
    config.features.economy.enabled = economy;
    changes.push(`Économie: ${economy ? 'Activée' : 'Désactivée'}`);
    updated = true;
  }
  if (moderation !== null) {
    if (!config.features.moderation) config.features.moderation = {};
    config.features.moderation.enabled = moderation;
    changes.push(`Modération: ${moderation ? 'Activée' : 'Désactivée'}`);
    updated = true;
  }

  if (updated) {
    const success = Config.saveConfig();
    
    if (success) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Fonctionnalités configurées')
        .setDescription('L\'état des fonctionnalités du bot a été mis à jour.')
        .addFields({ name: 'Modifications', value: changes.join('\n'), inline: false })
        .setColor('#51cf66')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ content: '❌ Erreur lors de la sauvegarde de la configuration.', ephemeral: true });
    }
  } else {
    await interaction.reply({ content: '❌ Aucune fonctionnalité à modifier spécifiée.', ephemeral: true });
  }
}

async function handleSetupWizard(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🧙‍♂️ Assistant de Configuration HmmBot')
    .setDescription('Bienvenue dans l\'assistant de configuration ! Cet outil vous guidera pour configurer votre bot étape par étape.')
    .addFields(
      { name: '📋 Étapes de configuration', value: '1️⃣ Configuration de base\n2️⃣ Canaux importants\n3️⃣ Rôles du serveur\n4️⃣ Modules optionnels\n5️⃣ Finalisation', inline: false },
      { name: '⏱️ Temps estimé', value: '5-10 minutes', inline: true },
      { name: '🔧 Prérequis', value: 'Permissions administrateur', inline: true }
    )
    .setColor('#339af0')
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setup_start')
        .setLabel('🚀 Commencer la configuration')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('setup_cancel')
        .setLabel('❌ Annuler')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleShowConfig(interaction) {
  const config = Config.getConfig();
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Configuration actuelle de HmmBot')
    .setColor('#339af0')
    .setTimestamp();

  // Informations générales
  const botInfo = `**Nom**: ${config.bot?.name || 'HmmBot'}\n**Version**: ${config.bot?.version || '1.0.0'}\n**Description**: ${config.bot?.description || 'Bot Discord multitâches'}`;
  embed.addFields({ name: '🤖 Bot', value: botInfo, inline: false });

  // Channels
  const channels = Object.entries(config.channels || {})
    .map(([key, value]) => `**${key}**: ${value ? `<#${value}>` : 'Non configuré'}`)
    .join('\n') || 'Aucun canal configuré';
  embed.addFields({ name: '📺 Canaux', value: channels.length > 1024 ? channels.substring(0, 1021) + '...' : channels, inline: false });

  // Roles
  const roles = Object.entries(config.roles || {})
    .map(([key, value]) => `**${key}**: ${value ? `<@&${value}>` : 'Non configuré'}`)
    .join('\n') || 'Aucun rôle configuré';
  embed.addFields({ name: '👥 Rôles', value: roles.length > 1024 ? roles.substring(0, 1021) + '...' : roles, inline: false });

  // Features status
  const features = [];
  if (config.features?.tickets?.enabled) features.push('✅ Tickets');
  else features.push('❌ Tickets');
  if (config.features?.economy?.enabled) features.push('✅ Économie');
  else features.push('❌ Économie');
  if (config.features?.moderation?.enabled) features.push('✅ Modération');
  else features.push('❌ Modération');
  
  embed.addFields({ name: '🎯 Fonctionnalités', value: features.join('\n'), inline: true });

  // WebUI status
  const webui = `**Port**: ${config.webui?.port || 25584}\n**Session**: ${config.webui?.session_duration || '2h'}`;
  embed.addFields({ name: '🌐 Interface Web', value: webui, inline: true });

  // Logs status
  const logs = `**Niveau**: ${config.logs?.log_level || 'info'}\n**Max fichiers**: ${config.logs?.max_log_files || 30}\n**Nettoyage auto**: ${config.logs?.auto_cleanup ? 'Oui' : 'Non'}`;
  embed.addFields({ name: '📝 Logs', value: logs, inline: true });

  const row = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_details')
        .setPlaceholder('Voir les détails d\'une section')
        .addOptions(
          { label: 'Modération', value: 'moderation', emoji: '🛡️' },
          { label: 'Économie', value: 'economy', emoji: '💰' },
          { label: 'Vocal', value: 'voice', emoji: '🎤' },
          { label: 'Tickets', value: 'tickets', emoji: '🎟️' },
          { label: 'Interface Web', value: 'webui_details', emoji: '🌐' }
        )
    );

  await interaction.reply({ embeds: [embed], components: [row] });
}

async function handleReloadConfig(interaction) {
  Config.reloadConfig();
  
  const embed = new EmbedBuilder()
    .setTitle('🔄 Configuration rechargée')
    .setDescription('La configuration a été rechargée depuis le fichier config.json')
    .setColor('#51cf66')
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function handleBackupConfig(interaction) {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const backupDir = path.join(__dirname, '../../src/data/config-backups');
    
    // Créer le dossier de sauvegarde s'il n'existe pas
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `config-backup-${timestamp}.json`);
    
    const config = Config.getConfig();
    fs.writeFileSync(backupFile, JSON.stringify(config, null, 2));
    
    const embed = new EmbedBuilder()
      .setTitle('✅ Sauvegarde créée')
      .setDescription(`La configuration a été sauvegardée dans :\n\`config-backup-${timestamp}.json\``)
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    await interaction.reply({ content: '❌ Erreur lors de la création de la sauvegarde.', ephemeral: true });
  }
}

async function handleRestoreConfig(interaction) {
  const backupFile = interaction.options.getString('backup_file');
  
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const backupPath = path.join(__dirname, '../../src/data/config-backups', backupFile);
    
    if (!fs.existsSync(backupPath)) {
      return await interaction.reply({ content: '❌ Fichier de sauvegarde introuvable.', ephemeral: true });
    }
    
    const backupData = fs.readFileSync(backupPath, 'utf8');
    const backupConfig = JSON.parse(backupData);
    
    // Sauvegarder la config actuelle avant restauration
    const currentTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentBackupPath = path.join(__dirname, '../../src/data/config-backups', `config-before-restore-${currentTimestamp}.json`);
    fs.writeFileSync(currentBackupPath, JSON.stringify(Config.getConfig(), null, 2));
    
    // Restaurer la configuration
    const configPath = path.join(__dirname, '../../config.json');
    fs.writeFileSync(configPath, JSON.stringify(backupConfig, null, 2));
    Config.reloadConfig();
    
    const embed = new EmbedBuilder()
      .setTitle('✅ Configuration restaurée')
      .setDescription(`La configuration a été restaurée depuis \`${backupFile}\`\n\nUne sauvegarde de l'ancienne configuration a été créée : \`config-before-restore-${currentTimestamp}.json\``)
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur lors de la restauration:', error);
    await interaction.reply({ content: '❌ Erreur lors de la restauration de la configuration.', ephemeral: true });
  }
}

async function handleResetConfig(interaction) {
  const section = interaction.options.getString('section');
  
  const embed = new EmbedBuilder()
    .setTitle('⚠️ Confirmation de réinitialisation')
    .setDescription(`Êtes-vous sûr de vouloir réinitialiser **${section === 'all' ? 'toute la configuration' : section}** ?\n\n⚠️ Cette action est irréversible !`)
    .setColor('#ff6b6b')
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`reset_confirm_${section}`)
        .setLabel('✅ Confirmer')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('reset_cancel')
        .setLabel('❌ Annuler')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({ embeds: [embed], components: [row] });
}

// Gestionnaires des interfaces spécialisées
async function showChannelsInterface(interaction) {
  const config = Config.getConfig();
  
  const embed = new EmbedBuilder()
    .setTitle('📺 Configuration des Canaux')
    .setDescription('Configurez les canaux utilisés par le bot pour ses différentes fonctionnalités.')
    .setColor('#5865f2')
    .setTimestamp();

  const channelsList = [];
  const channelTypes = {
    logs: 'Logs du bot',
    welcome: 'Messages de bienvenue',
    goodbye: 'Messages d\'au revoir',
    moderation: 'Actions de modération',
    economy: 'Système d\'économie',
    voice_logs: 'Logs vocaux',
    general: 'Canal général'
  };

  for (const [key, description] of Object.entries(channelTypes)) {
    const channelId = config.channels?.[key];
    const status = channelId ? `<#${channelId}>` : '❌ Non configuré';
    channelsList.push(`**${description}**: ${status}`);
  }

  embed.addFields({ name: '📋 État des Canaux', value: channelsList.join('\n'), inline: false });

  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_channel_select')
        .setPlaceholder('Sélectionnez un canal à configurer')
        .addOptions(
          { label: 'Logs', value: 'logs', emoji: '📝' },
          { label: 'Bienvenue', value: 'welcome', emoji: '👋' },
          { label: 'Au revoir', value: 'goodbye', emoji: '👋' },
          { label: 'Modération', value: 'moderation', emoji: '🛡️' },
          { label: 'Économie', value: 'economy', emoji: '💰' },
          { label: 'Logs vocaux', value: 'voice_logs', emoji: '🎤' },
          { label: 'Général', value: 'general', emoji: '💬' }
        )
    );

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_main')
        .setLabel('⬅️ Retour')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({ embeds: [embed], components: [selectMenu, backButton] });
}

async function showRolesInterface(interaction) {
  const config = Config.getConfig();
  
  const embed = new EmbedBuilder()
    .setTitle('👥 Configuration des Rôles')
    .setDescription('Configurez les rôles utilisés par le bot pour ses différentes fonctionnalités.')
    .setColor('#57f287')
    .setTimestamp();

  const rolesList = [];
  const roleTypes = {
    moderator: 'Modérateur',
    admin: 'Administrateur',
    member: 'Membre',
    muted: 'Muet',
    vip: 'VIP'
  };

  for (const [key, description] of Object.entries(roleTypes)) {
    const roleId = config.roles?.[key];
    const status = roleId ? `<@&${roleId}>` : '❌ Non configuré';
    rolesList.push(`**${description}**: ${status}`);
  }

  embed.addFields({ name: '📋 État des Rôles', value: rolesList.join('\n'), inline: false });

  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_role_select')
        .setPlaceholder('Sélectionnez un rôle à configurer')
        .addOptions(
          { label: 'Modérateur', value: 'moderator', emoji: '🛡️' },
          { label: 'Administrateur', value: 'admin', emoji: '👑' },
          { label: 'Membre', value: 'member', emoji: '👤' },
          { label: 'Muet', value: 'muted', emoji: '🔇' },
          { label: 'VIP', value: 'vip', emoji: '⭐' }
        )
    );

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_main')
        .setLabel('⬅️ Retour')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({ embeds: [embed], components: [selectMenu, backButton] });
}

async function showFeaturesInterface(interaction) {
  const config = Config.getConfig();
  
  const embed = new EmbedBuilder()
    .setTitle('🎯 Gestion des Modules')
    .setDescription('Activez ou désactivez les différents modules du bot.')
    .setColor('#fee75c')
    .setTimestamp();

  const features = [
    {
      name: '🎟️ Système de Tickets',
      enabled: config.features?.tickets?.enabled || false,
      key: 'tickets'
    },
    {
      name: '💰 Système d\'Économie',
      enabled: config.features?.economy?.enabled || false,
      key: 'economy'
    },
    {
      name: '🛡️ Système de Modération',
      enabled: config.features?.moderation?.enabled || false,
      key: 'moderation'
    }
  ];

  const featuresList = features.map(f => 
    `${f.name}: ${f.enabled ? '✅ Activé' : '❌ Désactivé'}`
  ).join('\n');

  embed.addFields({ name: '📋 État des Modules', value: featuresList, inline: false });

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_toggle_tickets')
        .setLabel('🎟️ Tickets')
        .setStyle(config.features?.tickets?.enabled ? ButtonStyle.Success : ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('config_toggle_economy')
        .setLabel('💰 Économie')
        .setStyle(config.features?.economy?.enabled ? ButtonStyle.Success : ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('config_toggle_moderation')
        .setLabel('🛡️ Modération')
        .setStyle(config.features?.moderation?.enabled ? ButtonStyle.Success : ButtonStyle.Danger)
    );

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_main')
        .setLabel('⬅️ Retour')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({ embeds: [embed], components: [buttons, backButton] });
}

async function showModerationInterface(interaction) {
  const config = Config.getConfig();
  
  const embed = new EmbedBuilder()
    .setTitle('🛡️ Configuration Modération')
    .setDescription('Configurez les paramètres du système de modération.')
    .setColor('#ed4245')
    .setTimestamp();

  const settings = [
    `**Auto-suppression réponse clear**: ${config.moderation?.auto_delete_clear_response ? '✅ Activé' : '❌ Désactivé'}`,
    `**Délai suppression**: ${config.moderation?.clear_response_delay || 5000}ms`,
    `**MP lors des sanctions**: ${config.moderation?.dm_on_punishment ? '✅ Activé' : '❌ Désactivé'}`,
    `**Logger toutes les actions**: ${config.moderation?.log_all_actions ? '✅ Activé' : '❌ Désactivé'}`
  ];

  embed.addFields({ name: '⚙️ Paramètres Actuels', value: settings.join('\n'), inline: false });

  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_moderation_select')
        .setPlaceholder('Sélectionnez un paramètre à modifier')
        .addOptions(
          { label: 'Auto-suppression réponse clear', value: 'auto_delete_clear_response', emoji: '🗑️' },
          { label: 'Délai suppression réponse clear', value: 'clear_response_delay', emoji: '⏱️' },
          { label: 'MP lors des sanctions', value: 'dm_on_punishment', emoji: '📨' },
          { label: 'Logger toutes les actions', value: 'log_all_actions', emoji: '📝' }
        )
    );

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_main')
        .setLabel('⬅️ Retour')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({ embeds: [embed], components: [selectMenu, backButton] });
}

async function showEconomyInterface(interaction) {
  const config = Config.getConfig();
  
  const embed = new EmbedBuilder()
    .setTitle('💰 Configuration Économie')
    .setDescription('Configurez les paramètres du système d\'économie.')
    .setColor('#57f287')
    .setTimestamp();

  const settings = [
    `**Montant journalier**: ${config.economy?.daily_amount || 250} coins`,
    `**Travail minimum**: ${config.economy?.work_min || 50} coins`,
    `**Travail maximum**: ${config.economy?.work_max || 500} coins`,
    `**Taux de réussite vol**: ${(config.economy?.rob_success_rate || 0.3) * 100}%`,
    `**Vol minimum**: ${config.economy?.rob_min || 10} coins`,
    `**Vol maximum**: ${config.economy?.rob_max || 100} coins`
  ];

  embed.addFields({ name: '💰 Paramètres Actuels', value: settings.join('\n'), inline: false });

  const selectMenu = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('config_economy_select')
        .setPlaceholder('Sélectionnez un paramètre à modifier')
        .addOptions(
          { label: 'Montant journalier', value: 'daily_amount', emoji: '📅' },
          { label: 'Travail minimum', value: 'work_min', emoji: '⬇️' },
          { label: 'Travail maximum', value: 'work_max', emoji: '⬆️' },
          { label: 'Taux de réussite vol', value: 'rob_success_rate', emoji: '🎯' },
          { label: 'Vol minimum', value: 'rob_min', emoji: '💸' },
          { label: 'Vol maximum', value: 'rob_max', emoji: '💰' }
        )
    );

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_main')
        .setLabel('⬅️ Retour')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({ embeds: [embed], components: [selectMenu, backButton] });
}

async function showTicketsInterface(interaction) {
  const config = Config.getConfig();
  
  const embed = new EmbedBuilder()
    .setTitle('🎟️ Configuration Tickets')
    .setDescription('Configurez le système de tickets complet.')
    .setColor('#f59f00')
    .setTimestamp();

  const settings = [
    `**Système activé**: ${config.ticket?.enabled ? '✅ Oui' : '❌ Non'}`,
    `**Catégorie**: ${config.ticket?.category ? `<#${config.ticket.category}>` : '❌ Non configurée'}`,
    `**Rôle support**: ${config.ticket?.support_role ? `<@&${config.ticket.support_role}>` : '❌ Non configuré'}`,
    `**Canal transcripts**: ${config.ticket?.transcript_channel ? `<#${config.ticket.transcript_channel}>` : '❌ Non configuré'}`,
    `**Limite par utilisateur**: ${config.ticket?.ticket_limit || 1}`,
    `**Fermeture automatique**: ${config.ticket?.auto_close ? '✅ Activée' : '❌ Désactivée'}`
  ];

  embed.addFields({ name: '🎟️ Configuration Actuelle', value: settings.join('\n'), inline: false });

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_ticket_toggle')
        .setLabel(config.ticket?.enabled ? '❌ Désactiver' : '✅ Activer')
        .setStyle(config.ticket?.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('config_ticket_settings')
        .setLabel('⚙️ Paramètres')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('config_ticket_panel')
        .setLabel('📋 Panneau')
        .setStyle(ButtonStyle.Secondary)
    );

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_main')
        .setLabel('⬅️ Retour')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({ embeds: [embed], components: [buttons, backButton] });
}

async function showVoiceInterface(interaction) {
  const config = Config.getConfig();
  
  const embed = new EmbedBuilder()
    .setTitle('🎤 Configuration Vocal')
    .setDescription('Configurez les paramètres du système vocal.')
    .setColor('#9b59b6')
    .setTimestamp();

  const settings = [
    `**Suivre le temps vocal**: ${config.voice?.track_voice_time ? '✅ Activé' : '❌ Désactivé'}`,
    `**Coins par minute**: ${config.voice?.coins_per_minute || 5} coins`
  ];

  embed.addFields({ name: '🎤 Paramètres Actuels', value: settings.join('\n'), inline: false });

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_voice_toggle_tracking')
        .setLabel(config.voice?.track_voice_time ? '❌ Désactiver Suivi' : '✅ Activer Suivi')
        .setStyle(config.voice?.track_voice_time ? ButtonStyle.Danger : ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('config_voice_coins')
        .setLabel('💰 Modifier Coins/Min')
        .setStyle(ButtonStyle.Primary)
    );

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_main')
        .setLabel('⬅️ Retour')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({ embeds: [embed], components: [buttons, backButton] });
}

async function showWebuiInterface(interaction) {
  const config = Config.getConfig();
  
  const embed = new EmbedBuilder()
    .setTitle('🌐 Configuration Interface Web')
    .setDescription('Configurez l\'interface web d\'administration.')
    .setColor('#845ef7')
    .setTimestamp();

  const settings = [
    `**Port**: ${config.webui?.port || 25584}`,
    `**Mot de passe**: ${config.webui?.password ? '••••••••' : '❌ Non configuré'}`,
    `**Durée de session**: ${config.webui?.session_duration || '2h'}`
  ];

  embed.addFields({ name: '🌐 Configuration Actuelle', value: settings.join('\n'), inline: false });

  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_webui_port')
        .setLabel('🔌 Port')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('config_webui_password')
        .setLabel('🔐 Mot de passe')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('config_webui_session')
        .setLabel('⏱️ Session')
        .setStyle(ButtonStyle.Primary)
    );

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_back_main')
        .setLabel('⬅️ Retour')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({ embeds: [embed], components: [buttons, backButton] });
}

// Gestionnaire d'interactions pour les boutons et menus
export async function handleInteraction(interaction) {
  if (!interaction.isButton() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  try {
    // Navigation principale
    if (interaction.customId === 'config_main_channels') {
      await showChannelsInterface(interaction);
    } else if (interaction.customId === 'config_main_roles') {
      await showRolesInterface(interaction);
    } else if (interaction.customId === 'config_main_features') {
      await showFeaturesInterface(interaction);
    } else if (interaction.customId === 'config_main_moderation') {
      await showModerationInterface(interaction);
    } else if (interaction.customId === 'config_main_economy') {
      await showEconomyInterface(interaction);
    } else if (interaction.customId === 'config_main_tickets') {
      await showTicketsInterface(interaction);
    } else if (interaction.customId === 'config_main_voice') {
      await showVoiceInterface(interaction);
    } else if (interaction.customId === 'config_main_webui') {
      await showWebuiInterface(interaction);
    } else if (interaction.customId === 'config_back_main') {
      await showMainConfigInterface(interaction);
    } else if (interaction.customId === 'config_main_refresh') {
      await showMainConfigInterface(interaction);
    } else if (interaction.customId === 'config_main_close') {
      await interaction.update({ content: '✅ Interface de configuration fermée.', embeds: [], components: [] });
    }
    
    // Outils de configuration
    else if (interaction.customId === 'config_main_tools') {
      const selected = interaction.values[0];
      switch (selected) {
        case 'setup':
          await handleSetupWizard(interaction);
          break;
        case 'show':
          await handleShowConfig(interaction);
          break;
        case 'reload':
          await handleReloadConfig(interaction);
          break;
        case 'backup':
          await handleBackupConfig(interaction);
          break;
        case 'restore':
          await showRestoreInterface(interaction);
          break;
        case 'reset':
          await showResetInterface(interaction);
          break;
        case 'logs':
          await showLogsInterface(interaction);
          break;
      }
    }
    
    // Configuration des canaux
    else if (interaction.customId === 'config_channel_select') {
      const channelType = interaction.values[0];
      await showChannelConfigModal(interaction, channelType);
    }
    
    // Configuration des rôles
    else if (interaction.customId === 'config_role_select') {
      const roleType = interaction.values[0];
      await showRoleConfigModal(interaction, roleType);
    }
    
    // Toggle des fonctionnalités
    else if (interaction.customId === 'config_toggle_tickets') {
      await toggleFeature(interaction, 'tickets');
    } else if (interaction.customId === 'config_toggle_economy') {
      await toggleFeature(interaction, 'economy');
    } else if (interaction.customId === 'config_toggle_moderation') {
      await toggleFeature(interaction, 'moderation');
    }
    
    // Configuration modération
    else if (interaction.customId === 'config_moderation_select') {
      const parameter = interaction.values[0];
      await showModerationConfigModal(interaction, parameter);
    }
    
    // Configuration économie
    else if (interaction.customId === 'config_economy_select') {
      const parameter = interaction.values[0];
      await showEconomyConfigModal(interaction, parameter);
    }
    
    // Configuration tickets
    else if (interaction.customId === 'config_ticket_toggle') {
      await toggleTicketSystem(interaction);
    } else if (interaction.customId === 'config_ticket_settings') {
      await showTicketSettingsModal(interaction);
    } else if (interaction.customId === 'config_ticket_panel') {
      await showTicketPanelModal(interaction);
    }
    
    // Configuration vocal
    else if (interaction.customId === 'config_voice_toggle_tracking') {
      await toggleVoiceTracking(interaction);
    } else if (interaction.customId === 'config_voice_coins') {
      await showVoiceCoinsModal(interaction);
    }
    
    // Configuration WebUI
    else if (interaction.customId === 'config_webui_port') {
      await showWebuiPortModal(interaction);
    } else if (interaction.customId === 'config_webui_password') {
      await showWebuiPasswordModal(interaction);
    } else if (interaction.customId === 'config_webui_session') {
      await showWebuiSessionModal(interaction);
    }
    
    // Gestion des modales
    else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    }
    
    // Assistant de configuration (étapes)
    else if (interaction.customId === 'setup_start') {
      await handleSetupStep1(interaction);
    } else if (interaction.customId === 'setup_step2') {
      await handleSetupStep2(interaction);
    } else if (interaction.customId === 'setup_step3') {
      await handleSetupStep3(interaction);
    } else if (interaction.customId === 'setup_step4') {
      await handleSetupStep4(interaction);
    } else if (interaction.customId === 'setup_step5') {
      await handleSetupStep5(interaction);
    } else if (interaction.customId === 'setup_finish') {
      await handleSetupFinish(interaction);
    } else if (interaction.customId === 'setup_cancel') {
      await interaction.update({ content: '❌ Configuration annulée.', embeds: [], components: [] });
    } else if (interaction.customId === 'setup_back_step1') {
      await handleSetupStep1(interaction);
    } else if (interaction.customId === 'setup_back_step2') {
      await handleSetupStep2(interaction);
    } else if (interaction.customId === 'setup_back_step3') {
      await handleSetupStep3(interaction);
    } else if (interaction.customId === 'setup_back_step4') {
      await handleSetupStep4(interaction);
    } else if (interaction.customId === 'config_main_interface') {
      await showMainConfigInterface(interaction);
    } else if (interaction.customId === 'setup_close') {
      await interaction.update({ content: '✅ Assistant de configuration fermé.', embeds: [], components: [] });
    }
    
    // Anciennes interactions (compatibilité)
    else if (interaction.customId === 'config_details') {
      await handleConfigDetails(interaction);
    } else if (interaction.customId.startsWith('reset_confirm_')) {
      const section = interaction.customId.replace('reset_confirm_', '');
      await executeReset(interaction, section);
    } else if (interaction.customId === 'reset_cancel') {
      await interaction.update({ content: '❌ Réinitialisation annulée.', embeds: [], components: [] });
    }
    
  } catch (error) {
    console.error('Erreur dans handleInteraction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Une erreur est survenue.', ephemeral: true });
    }
  }
}

// Fonctions utilitaires pour les modales et actions

async function showChannelConfigModal(interaction, channelType) {
  const modal = new ModalBuilder()
    .setCustomId(`config_channel_modal_${channelType}`)
    .setTitle(`Configuration Canal - ${channelType}`);

  const channelInput = new TextInputBuilder()
    .setCustomId('channel_id')
    .setLabel('ID ou mention du canal')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('#canal ou 123456789012345678')
    .setRequired(true);

  const actionRow = new ActionRowBuilder().addComponents(channelInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

async function showRoleConfigModal(interaction, roleType) {
  const modal = new ModalBuilder()
    .setCustomId(`config_role_modal_${roleType}`)
    .setTitle(`Configuration Rôle - ${roleType}`);

  const roleInput = new TextInputBuilder()
    .setCustomId('role_id')
    .setLabel('ID ou mention du rôle')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('@role ou 123456789012345678')
    .setRequired(true);

  const actionRow = new ActionRowBuilder().addComponents(roleInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

async function showModerationConfigModal(interaction, parameter) {
  const config = Config.getConfig();
  const currentValue = config.moderation?.[parameter];
  
  const modal = new ModalBuilder()
    .setCustomId(`config_moderation_modal_${parameter}`)
    .setTitle(`Configuration Modération - ${parameter}`);

  let placeholder, label;
  switch (parameter) {
    case 'auto_delete_clear_response':
    case 'dm_on_punishment':
    case 'log_all_actions':
      placeholder = 'true ou false';
      label = 'Nouvelle valeur (true/false)';
      break;
    case 'clear_response_delay':
      placeholder = '5000 (en millisecondes)';
      label = 'Délai en millisecondes';
      break;
  }

  const valueInput = new TextInputBuilder()
    .setCustomId('parameter_value')
    .setLabel(label)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(placeholder)
    .setValue(currentValue?.toString() || '')
    .setRequired(true);

  const actionRow = new ActionRowBuilder().addComponents(valueInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

async function showEconomyConfigModal(interaction, parameter) {
  const config = Config.getConfig();
  const currentValue = config.economy?.[parameter];
  
  const modal = new ModalBuilder()
    .setCustomId(`config_economy_modal_${parameter}`)
    .setTitle(`Configuration Économie - ${parameter}`);

  let placeholder, label;
  switch (parameter) {
    case 'daily_amount':
      placeholder = '250';
      label = 'Montant journalier';
      break;
    case 'work_min':
      placeholder = '50';
      label = 'Gain minimum travail';
      break;
    case 'work_max':
      placeholder = '500';
      label = 'Gain maximum travail';
      break;
    case 'rob_success_rate':
      placeholder = '0.3 (entre 0 et 1)';
      label = 'Taux de réussite vol';
      break;
    case 'rob_min':
      placeholder = '10';
      label = 'Vol minimum';
      break;
    case 'rob_max':
      placeholder = '100';
      label = 'Vol maximum';
      break;
  }

  const valueInput = new TextInputBuilder()
    .setCustomId('parameter_value')
    .setLabel(label)
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(placeholder)
    .setValue(currentValue?.toString() || '')
    .setRequired(true);

  const actionRow = new ActionRowBuilder().addComponents(valueInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

async function showVoiceCoinsModal(interaction) {
  const config = Config.getConfig();
  const currentValue = config.voice?.coins_per_minute || 5;
  
  const modal = new ModalBuilder()
    .setCustomId('config_voice_coins_modal')
    .setTitle('Configuration Vocal - Coins par minute');

  const valueInput = new TextInputBuilder()
    .setCustomId('coins_value')
    .setLabel('Coins gagnés par minute')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('5')
    .setValue(currentValue.toString())
    .setRequired(true);

  const actionRow = new ActionRowBuilder().addComponents(valueInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

async function showWebuiPortModal(interaction) {
  const config = Config.getConfig();
  const currentValue = config.webui?.port || 25584;
  
  const modal = new ModalBuilder()
    .setCustomId('config_webui_port_modal')
    .setTitle('Configuration WebUI - Port');

  const valueInput = new TextInputBuilder()
    .setCustomId('port_value')
    .setLabel('Port de l\'interface web')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('25584')
    .setValue(currentValue.toString())
    .setRequired(true);

  const actionRow = new ActionRowBuilder().addComponents(valueInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

async function showWebuiPasswordModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('config_webui_password_modal')
    .setTitle('Configuration WebUI - Mot de passe');

  const valueInput = new TextInputBuilder()
    .setCustomId('password_value')
    .setLabel('Nouveau mot de passe')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Entrez un mot de passe sécurisé')
    .setRequired(true);

  const actionRow = new ActionRowBuilder().addComponents(valueInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

async function showWebuiSessionModal(interaction) {
  const config = Config.getConfig();
  const currentValue = config.webui?.session_duration || '2h';
  
  const modal = new ModalBuilder()
    .setCustomId('config_webui_session_modal')
    .setTitle('Configuration WebUI - Durée de session');

  const valueInput = new TextInputBuilder()
    .setCustomId('session_value')
    .setLabel('Durée de session (ex: 2h, 30m)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('2h')
    .setValue(currentValue)
    .setRequired(true);

  const actionRow = new ActionRowBuilder().addComponents(valueInput);
  modal.addComponents(actionRow);

  await interaction.showModal(modal);
}

async function toggleFeature(interaction, feature) {
  const config = Config.getConfig();
  if (!config.features) config.features = {};
  if (!config.features[feature]) config.features[feature] = {};
  
  const currentState = config.features[feature].enabled || false;
  config.features[feature].enabled = !currentState;
  
  const success = Config.saveConfig();
  
  if (success) {
    await showFeaturesInterface(interaction);
  } else {
    await interaction.reply({ content: '❌ Erreur lors de la sauvegarde.', ephemeral: true });
  }
}

async function toggleTicketSystem(interaction) {
  const config = Config.getConfig();
  if (!config.ticket) config.ticket = {};
  
  const currentState = config.ticket.enabled || false;
  config.ticket.enabled = !currentState;
  
  const success = Config.saveConfig();
  
  if (success) {
    await showTicketsInterface(interaction);
  } else {
    await interaction.reply({ content: '❌ Erreur lors de la sauvegarde.', ephemeral: true });
  }
}

async function toggleVoiceTracking(interaction) {
  const config = Config.getConfig();
  if (!config.voice) config.voice = {};
  
  const currentState = config.voice.track_voice_time || false;
  config.voice.track_voice_time = !currentState;
  
  const success = Config.saveConfig();
  
  if (success) {
    await showVoiceInterface(interaction);
  } else {
    await interaction.reply({ content: '❌ Erreur lors de la sauvegarde.', ephemeral: true });
  }
}

async function handleModalSubmit(interaction) {
  const customId = interaction.customId;
  
  try {
    if (customId.startsWith('config_channel_modal_')) {
      const channelType = customId.replace('config_channel_modal_', '');
      const channelInput = interaction.fields.getTextInputValue('channel_id');
      let channelId = channelInput.replace(/[<#>]/g, '');
      
      const success = Config.setChannel(channelType, channelId);
      
      if (success) {
        await interaction.reply({ 
          content: `✅ Canal **${channelType}** configuré avec succès !`, 
          ephemeral: true 
        });
        // Actualiser l'interface après un délai
        setTimeout(async () => {
          try {
            await showChannelsInterface(interaction);
          } catch (error) {
            console.error('Erreur lors de l\'actualisation:', error);
          }
        }, 2000);
      } else {
        await interaction.reply({ content: '❌ Erreur lors de la sauvegarde.', ephemeral: true });
      }
    }
    
    else if (customId.startsWith('config_role_modal_')) {
      const roleType = customId.replace('config_role_modal_', '');
      const roleInput = interaction.fields.getTextInputValue('role_id');
      let roleId = roleInput.replace(/[<@&>]/g, '');
      
      const success = Config.setRole(roleType, roleId);
      
      if (success) {
        await interaction.reply({ 
          content: `✅ Rôle **${roleType}** configuré avec succès !`, 
          ephemeral: true 
        });
        setTimeout(async () => {
          try {
            await showRolesInterface(interaction);
          } catch (error) {
            console.error('Erreur lors de l\'actualisation:', error);
          }
        }, 2000);
      } else {
        await interaction.reply({ content: '❌ Erreur lors de la sauvegarde.', ephemeral: true });
      }
    }
    
    else if (customId.startsWith('config_moderation_modal_')) {
      const parameter = customId.replace('config_moderation_modal_', '');
      const value = interaction.fields.getTextInputValue('parameter_value');
      
      let parsedValue;
      if (parameter === 'clear_response_delay') {
        parsedValue = parseInt(value);
        if (isNaN(parsedValue)) {
          return await interaction.reply({ content: '❌ La valeur doit être un nombre.', ephemeral: true });
        }
      } else {
        if (value.toLowerCase() === 'true') parsedValue = true;
        else if (value.toLowerCase() === 'false') parsedValue = false;
        else {
          return await interaction.reply({ content: '❌ La valeur doit être "true" ou "false".', ephemeral: true });
        }
      }
      
      const success = Config.setModerationSetting(parameter, parsedValue);
      
      if (success) {
        await interaction.reply({ 
          content: `✅ Paramètre **${parameter}** configuré sur \`${parsedValue}\` !`, 
          ephemeral: true 
        });
        setTimeout(async () => {
          try {
            await showModerationInterface(interaction);
          } catch (error) {
            console.error('Erreur lors de l\'actualisation:', error);
          }
        }, 2000);
      } else {
        await interaction.reply({ content: '❌ Erreur lors de la sauvegarde.', ephemeral: true });
      }
    }
    
    else if (customId.startsWith('config_economy_modal_')) {
      const parameter = customId.replace('config_economy_modal_', '');
      const value = interaction.fields.getTextInputValue('parameter_value');
      
      let parsedValue;
      if (parameter === 'rob_success_rate') {
        parsedValue = parseFloat(value);
        if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > 1) {
          return await interaction.reply({ content: '❌ Le taux doit être entre 0 et 1.', ephemeral: true });
        }
      } else {
        parsedValue = parseInt(value);
        if (isNaN(parsedValue) || parsedValue < 0) {
          return await interaction.reply({ content: '❌ La valeur doit être un nombre positif.', ephemeral: true });
        }
      }
      
      const success = Config.setEconomySetting(parameter, parsedValue);
      
      if (success) {
        await interaction.reply({ 
          content: `✅ Paramètre **${parameter}** configuré sur \`${parsedValue}\` !`, 
          ephemeral: true 
        });
        setTimeout(async () => {
          try {
            await showEconomyInterface(interaction);
          } catch (error) {
            console.error('Erreur lors de l\'actualisation:', error);
          }
        }, 2000);
      } else {
        await interaction.reply({ content: '❌ Erreur lors de la sauvegarde.', ephemeral: true });
      }
    }
    
    else if (customId === 'config_voice_coins_modal') {
      const value = interaction.fields.getTextInputValue('coins_value');
      const parsedValue = parseInt(value);
      
      if (isNaN(parsedValue) || parsedValue < 0) {
        return await interaction.reply({ content: '❌ La valeur doit être un nombre positif.', ephemeral: true });
      }
      
      const success = Config.setVoiceSetting('coins_per_minute', parsedValue);
      
      if (success) {
        await interaction.reply({ 
          content: `✅ Coins par minute configuré sur \`${parsedValue}\` !`, 
          ephemeral: true 
        });
        setTimeout(async () => {
          try {
            await showVoiceInterface(interaction);
          } catch (error) {
            console.error('Erreur lors de l\'actualisation:', error);
          }
        }, 2000);
      } else {
        await interaction.reply({ content: '❌ Erreur lors de la sauvegarde.', ephemeral: true });
      }
    }
    
    else if (customId === 'config_webui_port_modal') {
      const value = interaction.fields.getTextInputValue('port_value');
      const parsedValue = parseInt(value);
      
      if (isNaN(parsedValue) || parsedValue < 1 || parsedValue > 65535) {
        return await interaction.reply({ content: '❌ Le port doit être entre 1 et 65535.', ephemeral: true });
      }
      
      const success = Config.setWebuiSetting('port', parsedValue);
      
      if (success) {
        await interaction.reply({ 
          content: `✅ Port WebUI configuré sur \`${parsedValue}\` !`, 
          ephemeral: true 
        });
        setTimeout(async () => {
          try {
            await showWebuiInterface(interaction);
          } catch (error) {
            console.error('Erreur lors de l\'actualisation:', error);
          }
        }, 2000);
      } else {
        await interaction.reply({ content: '❌ Erreur lors de la sauvegarde.', ephemeral: true });
      }
    }
    
    else if (customId === 'config_webui_password_modal') {
      const value = interaction.fields.getTextInputValue('password_value');
      
      if (value.length < 4) {
        return await interaction.reply({ content: '❌ Le mot de passe doit faire au moins 4 caractères.', ephemeral: true });
      }
      
      const success = Config.setWebuiSetting('password', value);
      
      if (success) {
        await interaction.reply({ 
          content: `✅ Mot de passe WebUI configuré avec succès !`, 
          ephemeral: true 
        });
        setTimeout(async () => {
          try {
            await showWebuiInterface(interaction);
          } catch (error) {
            console.error('Erreur lors de l\'actualisation:', error);
          }
        }, 2000);
      } else {
        await interaction.reply({ content: '❌ Erreur lors de la sauvegarde.', ephemeral: true });
      }
    }
    
    else if (customId === 'config_webui_session_modal') {
      const value = interaction.fields.getTextInputValue('session_value');
      
      const success = Config.setWebuiSetting('session_duration', value);
      
      if (success) {
        await interaction.reply({ 
          content: `✅ Durée de session configurée sur \`${value}\` !`, 
          ephemeral: true 
        });
        setTimeout(async () => {
          try {
            await showWebuiInterface(interaction);
          } catch (error) {
            console.error('Erreur lors de l\'actualisation:', error);
          }
        }, 2000);
      } else {
        await interaction.reply({ content: '❌ Erreur lors de la sauvegarde.', ephemeral: true });
      }
    }
    
  } catch (error) {
    console.error('Erreur dans handleModalSubmit:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ Une erreur est survenue lors de la configuration.', ephemeral: true });
    }
  }
}

async function handleSetupStep1(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🧙‍♂️ Configuration - Étape 1/5')
    .setDescription('**Configuration de base**\n\nCommençons par configurer les informations de base de votre bot.')
    .addFields(
      { name: '📝 À faire maintenant', value: '• Utilisez `/config channel` pour configurer vos canaux\n• Utilisez `/config role` pour configurer vos rôles\n• Utilisez `/config features` pour activer/désactiver les modules', inline: false },
      { name: '💡 Conseil', value: 'Configurez au minimum un canal de logs pour suivre l\'activité du bot.', inline: false }
    )
    .setColor('#339af0')
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setup_step2')
        .setLabel('➡️ Étape suivante')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('setup_cancel')
        .setLabel('❌ Annuler')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({ embeds: [embed], components: [row] });
}

async function handleSetupStep2(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🧙‍♂️ Configuration - Étape 2/5')
    .setDescription('**Configuration des canaux**\n\nConfigurez les canaux essentiels pour le bon fonctionnement du bot.')
    .addFields(
      { name: '📺 Canaux recommandés', value: '• **Canal de logs** - Pour suivre l\'activité du bot\n• **Canal de bienvenue** - Pour accueillir les nouveaux membres\n• **Canal de modération** - Pour les actions de modération', inline: false },
      { name: '⚡ Configuration rapide', value: 'Utilisez `/config channel type:logs canal:#votre-canal` pour configurer rapidement', inline: false }
    )
    .setColor('#339af0')
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setup_back_step1')
        .setLabel('⬅️ Retour')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setup_step3')
        .setLabel('➡️ Étape suivante')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('setup_cancel')
        .setLabel('❌ Annuler')
        .setStyle(ButtonStyle.Danger)
    );

  await interaction.update({ embeds: [embed], components: [row] });
}

async function handleSetupStep3(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🧙‍♂️ Configuration - Étape 3/5')
    .setDescription('**Configuration des rôles**\n\nConfigurez les rôles nécessaires pour la gestion du serveur.')
    .addFields(
      { name: '👥 Rôles recommandés', value: '• **Rôle administrateur** - Pour la gestion complète\n• **Rôle modérateur** - Pour la modération\n• **Rôle muet** - Pour les sanctions temporaires', inline: false },
      { name: '⚡ Configuration rapide', value: 'Utilisez `/config role type:admin role:@VotreRole` pour configurer rapidement', inline: false }
    )
    .setColor('#339af0')
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setup_back_step2')
        .setLabel('⬅️ Retour')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setup_step4')
        .setLabel('➡️ Étape suivante')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('setup_cancel')
        .setLabel('❌ Annuler')
        .setStyle(ButtonStyle.Danger)
    );

  await interaction.update({ embeds: [embed], components: [row] });
}

async function handleSetupStep4(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🧙‍♂️ Configuration - Étape 4/5')
    .setDescription('**Activation des modules**\n\nActivez les fonctionnalités que vous souhaitez utiliser.')
    .addFields(
      { name: '🎯 Modules disponibles', value: '• **🎟️ Système de tickets** - Support client\n• **💰 Système d\'économie** - Monnaie virtuelle\n• **🛡️ Système de modération** - Outils de modération avancés', inline: false },
      { name: '⚡ Configuration rapide', value: 'Utilisez `/config features tickets:true economy:true` pour activer plusieurs modules', inline: false }
    )
    .setColor('#339af0')
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setup_back_step3')
        .setLabel('⬅️ Retour')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setup_step5')
        .setLabel('➡️ Étape suivante')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('setup_cancel')
        .setLabel('❌ Annuler')
        .setStyle(ButtonStyle.Danger)
    );

  await interaction.update({ embeds: [embed], components: [row] });
}

async function handleSetupStep5(interaction) {
  const config = Config.getConfig();
  
  // Vérification de la configuration
  const checks = [];
  if (config.channels?.logs) checks.push('✅ Canal de logs configuré');
  else checks.push('❌ Canal de logs non configuré');
  
  if (config.roles?.admin) checks.push('✅ Rôle administrateur configuré');
  else checks.push('❌ Rôle administrateur non configuré');
  
  if (config.features?.tickets?.enabled || config.features?.economy?.enabled || config.features?.moderation?.enabled) {
    checks.push('✅ Au moins un module activé');
  } else {
    checks.push('❌ Aucun module activé');
  }

  const embed = new EmbedBuilder()
    .setTitle('🧙‍♂️ Configuration - Étape 5/5')
    .setDescription('**Finalisation**\n\nVérification de votre configuration avant finalisation.')
    .addFields(
      { name: '📋 État de la configuration', value: checks.join('\n'), inline: false },
      { name: '💡 Prochaines étapes', value: '• Testez les fonctionnalités activées\n• Ajustez les paramètres selon vos besoins\n• Consultez `/config show` pour voir la configuration complète', inline: false }
    )
    .setColor('#339af0')
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('setup_back_step4')
        .setLabel('⬅️ Retour')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('setup_finish')
        .setLabel('🎉 Terminer')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('setup_cancel')
        .setLabel('❌ Annuler')
        .setStyle(ButtonStyle.Danger)
    );

  await interaction.update({ embeds: [embed], components: [row] });
}

async function handleSetupFinish(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🎉 Configuration terminée !')
    .setDescription('**Félicitations !** Votre bot HmmBot est maintenant configuré et prêt à être utilisé.')
    .addFields(
      { name: '🚀 Prochaines étapes', value: '• Utilisez `/config global` pour l\'interface complète\n• Consultez `/config show` pour voir votre configuration\n• Testez les fonctionnalités activées', inline: false },
      { name: '📚 Aide', value: 'Consultez la documentation ou utilisez `/help` pour plus d\'informations', inline: false }
    )
    .setColor('#51cf66')
    .setTimestamp();

  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('config_main_interface')
        .setLabel('🎛️ Interface principale')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('setup_close')
        .setLabel('✅ Fermer')
        .setStyle(ButtonStyle.Success)
    );

  await interaction.update({ embeds: [embed], components: [row] });
}

async function handleConfigDetails(interaction) {
  const section = interaction.values[0];
  const config = Config.getConfig();
  
  let embed;
  
  switch (section) {
    case 'moderation':
      embed = new EmbedBuilder()
        .setTitle('🛡️ Configuration Modération')
        .addFields(
          { name: 'Auto-suppression réponse clear', value: config.moderation?.auto_delete_clear_response ? 'Activé' : 'Désactivé', inline: true },
          { name: 'Délai suppression (ms)', value: config.moderation?.clear_response_delay?.toString() || '5000', inline: true },
          { name: 'MP lors des sanctions', value: config.moderation?.dm_on_punishment ? 'Activé' : 'Désactivé', inline: true },
          { name: 'Logger toutes les actions', value: config.moderation?.log_all_actions ? 'Activé' : 'Désactivé', inline: true }
        )
        .setColor('#ff6b6b');
      break;
      
    case 'economy':
      embed = new EmbedBuilder()
        .setTitle('💰 Configuration Économie')
        .addFields(
          { name: 'Montant journalier', value: config.economy?.daily_amount?.toString() || '250', inline: true },
          { name: 'Travail min/max', value: `${config.economy?.work_min || 50}/${config.economy?.work_max || 500}`, inline: true },
          { name: 'Taux réussite vol', value: config.economy?.rob_success_rate?.toString() || '0.3', inline: true },
          { name: 'Vol min/max', value: `${config.economy?.rob_min || 10}/${config.economy?.rob_max || 100}`, inline: true }
        )
        .setColor('#51cf66');
      break;
      
    case 'voice':
      embed = new EmbedBuilder()
        .setTitle('🎤 Configuration Vocal')
        .addFields(
          { name: 'Suivre temps vocal', value: config.voice?.track_voice_time ? 'Activé' : 'Désactivé', inline: true },
          { name: 'Coins par minute', value: config.voice?.coins_per_minute?.toString() || '5', inline: true }
        )
        .setColor('#339af0');
      break;
      
    case 'tickets':
      embed = new EmbedBuilder()
        .setTitle('🎟️ Configuration Tickets')
        .addFields(
          { name: 'Système activé', value: config.ticket?.enabled ? 'Oui' : 'Non', inline: true },
          { name: 'Catégorie', value: config.ticket?.category ? `<#${config.ticket.category}>` : 'Non configurée', inline: true },
          { name: 'Rôle support', value: config.ticket?.support_role ? `<@&${config.ticket.support_role}>` : 'Non configuré', inline: true },
          { name: 'Canal transcripts', value: config.ticket?.transcript_channel ? `<#${config.ticket.transcript_channel}>` : 'Non configuré', inline: true },
          { name: 'Limite par utilisateur', value: config.ticket?.ticket_limit?.toString() || '1', inline: true },
          { name: 'Fermeture automatique', value: config.ticket?.auto_close ? 'Activée' : 'Désactivée', inline: true }
        )
        .setColor('#f59f00');
      break;
      
    case 'webui_details':
      embed = new EmbedBuilder()
        .setTitle('🌐 Configuration Interface Web')
        .addFields(
          { name: 'Port', value: config.webui?.port?.toString() || '25584', inline: true },
          { name: 'Durée de session', value: config.webui?.session_duration || '2h', inline: true },
          { name: 'Mot de passe', value: config.webui?.password ? '••••••••' : 'Non configuré', inline: true }
        )
        .setColor('#845ef7');
      break;
  }
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function executeReset(interaction, section) {
  try {
    const config = Config.getConfig();
    const defaultConfig = Config.getDefaultConfig();
    
    if (section === 'all') {
      // Réinitialiser toute la configuration
      Object.assign(config, defaultConfig);
    } else {
      // Réinitialiser une section spécifique
      if (defaultConfig[section]) {
        config[section] = { ...defaultConfig[section] };
      }
    }
    
    const success = Config.saveConfig();
    
    if (success) {
      const embed = new EmbedBuilder()
        .setTitle('✅ Configuration réinitialisée')
        .setDescription(`La section **${section === 'all' ? 'toute la configuration' : section}** a été réinitialisée aux valeurs par défaut.`)
        .setColor('#51cf66')
        .setTimestamp();

      await interaction.update({ embeds: [embed], components: [] });
    } else {
      await interaction.update({ content: '❌ Erreur lors de la réinitialisation.', embeds: [], components: [] });
    }
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    await interaction.update({ content: '❌ Erreur lors de la réinitialisation.', embeds: [], components: [] });
  }
}