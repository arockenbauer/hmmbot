import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Config } from '../utils/config.js';
import { Economy } from '../utils/economy.js';
import { VoiceTracker } from '../utils/voiceTracker.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupDir = path.join(__dirname, '../data/config-backups');
const ecoBackupDir = path.join(__dirname, '../data/eco-backups');
const allBackupDir = path.join(__dirname, '../data/all-backups');
const ecoDataPath = path.join(__dirname, '../data/economy.json');
const voiceDataPath = path.join(__dirname, '../data/voiceTime.json');

// Ajout des sous-commandes
export const data = new SlashCommandBuilder()
  .setName('admin')
  .setDescription('Commandes d\'administration')
  .addSubcommand(subcommand =>
    subcommand
      .setName('stats')
      .setDescription('Affiche les statistiques du bot et du serveur'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('config-check')
      .setDescription('Vérifie la configuration du bot'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('backup-config')
      .setDescription('Crée une sauvegarde de la configuration'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('reset-economy')
      .setDescription('Remet à zéro l\'économie (DANGEREUX)')
      .addBooleanOption(option =>
        option.setName('confirmer')
          .setDescription('Confirmer la remise à zéro')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('restore-config')
      .setDescription('Restaure la configuration à partir d\'un fichier JSON')
      .addAttachmentOption(option =>
        option.setName('fichier')
          .setDescription('Fichier de configuration JSON à restaurer')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('restore-backup')
      .setDescription('Restaure la configuration depuis une sauvegarde locale')
      .addStringOption(option =>
        option.setName('fichier')
          .setDescription('Nom du fichier de backup à restaurer')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('backup-eco')
      .setDescription('Sauvegarde les données économiques des utilisateurs'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('restore-eco')
      .setDescription('Restaure les données économiques depuis une sauvegarde')
      .addStringOption(option =>
        option.setName('fichier')
          .setDescription('Nom du fichier de backup éco à restaurer')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('backup-all')
      .setDescription('Sauvegarde toute la configuration et les données utilisateurs'))
  .addSubcommand(subcommand =>
    subcommand
      .setName('restore-all')
      .setDescription('Restaure toute la configuration et les données utilisateurs depuis une sauvegarde')
      .addStringOption(option =>
        option.setName('fichier')
          .setDescription('Nom du fichier de backup all à restaurer')
          .setRequired(true)
          .setAutocomplete(true)
      )
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'stats':
        await handleStats(interaction);
        break;
      case 'config-check':
        await handleConfigCheck(interaction);
        break;
      case 'backup-config':
        await handleBackupConfig(interaction);
        break;
      case 'reset-economy':
        await handleResetEconomy(interaction);
        break;
      case 'restore-config':
        await handleRestoreConfig(interaction);
        break;
      case 'restore-backup':
        await handleRestoreBackup(interaction);
        break;
      case 'backup-eco':
        await handleBackupEco(interaction);
        break;
      case 'restore-eco':
        await handleRestoreEco(interaction);
        break;
      case 'backup-all':
        await handleBackupAll(interaction);
        break;
      case 'restore-all':
        await handleRestoreAll(interaction);
        break;
    }
  } catch (error) {
    console.error('Erreur dans la commande admin:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Une erreur est survenue lors de l\'exécution de la commande.', ephemeral: true });
    }
  }
}

async function handleStats(interaction) {
  const guild = interaction.guild;
  const config = Config.getConfig();
  
  // Statistiques du serveur
  const totalMembers = guild.memberCount;
  const onlineMembers = guild.members.cache.filter(member => member.presence?.status !== 'offline').size;
  const botCount = guild.members.cache.filter(member => member.user.bot).size;
  const humanCount = totalMembers - botCount;
  
  // Statistiques des channels
  const textChannels = guild.channels.cache.filter(channel => channel.type === 0).size;
  const voiceChannels = guild.channels.cache.filter(channel => channel.type === 2).size;
  const categories = guild.channels.cache.filter(channel => channel.type === 4).size;
  
  // Statistiques des rôles
  const totalRoles = guild.roles.cache.size;
  
  // Statistiques économiques
  const economyData = Economy.loadData();
  const totalUsers = Object.keys(economyData).length;
  const totalCoins = Object.values(economyData).reduce((sum, user) => sum + user.balance + user.bank, 0);
  
  // Statistiques vocales
  const voiceData = VoiceTracker.loadData();
  const totalVoiceUsers = Object.keys(voiceData).length;
  const totalVoiceTime = Object.values(voiceData).reduce((sum, user) => sum + user.totalTime, 0);

  const embed = new EmbedBuilder()
    .setTitle('📊 Statistiques du serveur')
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .addFields(
      {
        name: '👥 Membres',
        value: `**Total:** ${totalMembers}\n**Humains:** ${humanCount}\n**Bots:** ${botCount}\n**En ligne:** ${onlineMembers}`,
        inline: true
      },
      {
        name: '📺 Channels',
        value: `**Texte:** ${textChannels}\n**Vocal:** ${voiceChannels}\n**Catégories:** ${categories}`,
        inline: true
      },
      {
        name: '🎭 Rôles',
        value: `**Total:** ${totalRoles}`,
        inline: true
      },
      {
        name: '💰 Économie',
        value: `**Utilisateurs:** ${totalUsers}\n**Coins totaux:** ${Economy.formatMoney(totalCoins)}`,
        inline: true
      },
      {
        name: '🔊 Vocal',
        value: `**Utilisateurs:** ${totalVoiceUsers}\n**Temps total:** ${VoiceTracker.formatTime(totalVoiceTime)}`,
        inline: true
      },
      {
        name: '⚙️ Configuration',
        value: `**Channels configurés:** ${Object.values(config.channels).filter(id => id).length}/7\n**Rôles configurés:** ${Object.values(config.roles).filter(id => id).length}/5`,
        inline: true
      }
    )
    .setColor('#339af0')
    .setTimestamp()
    .setFooter({ text: `Serveur créé le ${guild.createdAt.toLocaleDateString('fr-FR')}` });

  await interaction.reply({ embeds: [embed] });
}

async function handleConfigCheck(interaction) {
  const config = Config.getConfig();
  const guild = interaction.guild;
  
  let issues = [];
  let warnings = [];
  
  // Vérifier les channels
  for (const [key, channelId] of Object.entries(config.channels)) {
    if (channelId) {
      const channel = guild.channels.cache.get(channelId);
      if (!channel) {
        issues.push(`❌ Channel **${key}**: ID ${channelId} introuvable`);
      } else if (!channel.permissionsFor(guild.members.me).has(['ViewChannel', 'SendMessages'])) {
        warnings.push(`⚠️ Channel **${key}**: Permissions insuffisantes`);
      }
    } else {
      warnings.push(`⚠️ Channel **${key}**: Non configuré`);
    }
  }
  
  // Vérifier les rôles
  for (const [key, roleId] of Object.entries(config.roles)) {
    if (roleId) {
      const role = guild.roles.cache.get(roleId);
      if (!role) {
        issues.push(`❌ Rôle **${key}**: ID ${roleId} introuvable`);
      } else if (role.position >= guild.members.me.roles.highest.position) {
        warnings.push(`⚠️ Rôle **${key}**: Position trop élevée pour le bot`);
      }
    } else {
      warnings.push(`⚠️ Rôle **${key}**: Non configuré`);
    }
  }
  
  // Vérifier les permissions du bot
  const botPermissions = guild.members.me.permissions;
  const requiredPermissions = [
    'SendMessages', 'EmbedLinks', 'AttachFiles', 'ReadMessageHistory',
    'ManageMessages', 'ManageRoles', 'KickMembers', 'BanMembers',
    'ModerateMembers', 'ManageChannels'
  ];
  
  for (const permission of requiredPermissions) {
    if (!botPermissions.has(permission)) {
      issues.push(`❌ Permission manquante: **${permission}**`);
    }
  }

  const embed = new EmbedBuilder()
    .setTitle('🔍 Vérification de la configuration')
    .setColor(issues.length > 0 ? '#ff6b6b' : warnings.length > 0 ? '#ffa500' : '#51cf66')
    .setTimestamp();

  if (issues.length === 0 && warnings.length === 0) {
    embed.setDescription('✅ **Configuration parfaite !**\nAucun problème détecté.');
  } else {
    let description = '';
    
    if (issues.length > 0) {
      description += '**🚨 Problèmes critiques:**\n' + issues.join('\n') + '\n\n';
    }
    
    if (warnings.length > 0) {
      description += '**⚠️ Avertissements:**\n' + warnings.join('\n');
    }
    
    embed.setDescription(description);
  }

  await interaction.reply({ embeds: [embed] });
}

async function handleBackupConfig(interaction) {
  try {
    const config = Config.getConfig();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `config-backup-${timestamp}.json`;
    const backupContent = JSON.stringify(config, null, 2);
    const buffer = Buffer.from(backupContent, 'utf8');
    // Création du dossier si besoin
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    // Sauvegarde locale
    fs.writeFileSync(path.join(backupDir, backupName), backupContent);
    const embed = new EmbedBuilder()
      .setTitle('💾 Sauvegarde de la configuration')
      .setDescription('Votre configuration actuelle a été sauvegardée en pièce jointe et localement.')
      .setColor('#339af0')
      .setTimestamp();
    await interaction.reply({
      embeds: [embed],
      files: [{ attachment: buffer, name: backupName }],
      ephemeral: true
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    await interaction.reply({ content: '❌ Erreur lors de la création de la sauvegarde.', ephemeral: true });
  }
}

// Autocomplétion pour la liste des backups
export async function autocomplete(interaction) {
  const focused = interaction.options.getFocused();
  let files = [];
  if (interaction.options.getSubcommand() === 'restore-backup') {
    if (!fs.existsSync(backupDir)) return interaction.respond([]);
    files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
  } else if (interaction.options.getSubcommand() === 'restore-eco') {
    if (!fs.existsSync(ecoBackupDir)) return interaction.respond([]);
    files = fs.readdirSync(ecoBackupDir).filter(f => f.endsWith('.json'));
  } else if (interaction.options.getSubcommand() === 'restore-all') {
    if (!fs.existsSync(allBackupDir)) return interaction.respond([]);
    files = fs.readdirSync(allBackupDir).filter(f => f.endsWith('.json'));
  }
  const filtered = files.map(f => ({ name: f, value: f })).filter(f => f.name.includes(focused));
  await interaction.respond(filtered.slice(0, 25));
}

async function handleRestoreBackup(interaction) {
  const fileName = interaction.options.getString('fichier');
  const filePath = path.join(backupDir, fileName);
  if (!fs.existsSync(filePath)) {
    return await interaction.reply({ content: '❌ Fichier de backup introuvable.', ephemeral: true });
  }
  try {
    const text = fs.readFileSync(filePath, 'utf8');
    let newConfig;
    try {
      newConfig = JSON.parse(text);
    } catch (e) {
      return await interaction.reply({ content: '❌ Le fichier n\'est pas un JSON valide.', ephemeral: true });
    }
    if (!newConfig.channels || !newConfig.roles || !newConfig.moderation || !newConfig.economy || !newConfig.voice) {
      return await interaction.reply({ content: '❌ Le fichier de configuration est incomplet ou invalide.', ephemeral: true });
    }
    Config.config = newConfig;
    const ok = Config.saveConfig();
    if (!ok) throw new Error('Erreur lors de la sauvegarde.');
    Config.reloadConfig();
    const embed = new EmbedBuilder()
      .setTitle('✅ Configuration restaurée')
      .setDescription(`La configuration a été restaurée depuis le backup **${fileName}**.`)
      .setColor('#51cf66')
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Erreur lors de la restauration de la config:', error);
    await interaction.reply({ content: '❌ Erreur lors de la restauration de la configuration.', ephemeral: true });
  }
}

async function handleRestoreConfig(interaction) {
  try {
    const attachment = interaction.options.getAttachment('fichier');
    if (!attachment || !attachment.url.endsWith('.json')) {
      return await interaction.reply({ content: '❌ Veuillez fournir un fichier .json valide.', ephemeral: true });
    }
    // Télécharger le fichier
    const response = await fetch(attachment.url);
    if (!response.ok) throw new Error('Erreur lors du téléchargement du fichier.');
    const text = await response.text();
    let newConfig;
    try {
      newConfig = JSON.parse(text);
    } catch (e) {
      return await interaction.reply({ content: '❌ Le fichier n\'est pas un JSON valide.', ephemeral: true });
    }
    // Validation basique (on vérifie la présence des sections principales)
    if (!newConfig.channels || !newConfig.roles || !newConfig.moderation || !newConfig.economy || !newConfig.voice) {
      return await interaction.reply({ content: '❌ Le fichier de configuration est incomplet ou invalide.', ephemeral: true });
    }
    // Sauvegarder la nouvelle config
    Config.config = newConfig;
    const ok = Config.saveConfig();
    if (!ok) throw new Error('Erreur lors de la sauvegarde.');
    Config.reloadConfig();
    const embed = new EmbedBuilder()
      .setTitle('✅ Configuration restaurée')
      .setDescription('La configuration a été restaurée avec succès à partir du fichier fourni.')
      .setColor('#51cf66')
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Erreur lors de la restauration de la config:', error);
    await interaction.reply({ content: '❌ Erreur lors de la restauration de la configuration.', ephemeral: true });
  }
}

async function handleResetEconomy(interaction) {
  const confirm = interaction.options.getBoolean('confirmer');
  
  if (!confirm) {
    return await interaction.reply({ 
      content: '❌ Vous devez confirmer la remise à zéro en mettant `confirmer` sur `True`.', 
      ephemeral: true 
    });
  }

  try {
    // Sauvegarder l'ancienne économie
    const oldData = Economy.loadData();
    const userCount = Object.keys(oldData).length;
    const totalCoins = Object.values(oldData).reduce((sum, user) => sum + user.balance + user.bank, 0);
    
    // Réinitialiser
    Economy.saveData({});
    
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Économie réinitialisée')
      .setDescription('L\'économie du serveur a été complètement remise à zéro.')
      .addFields(
        { name: 'Utilisateurs supprimés', value: userCount.toString(), inline: true },
        { name: 'Coins supprimés', value: Economy.formatMoney(totalCoins), inline: true }
      )
      .setColor('#ff6b6b')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    await interaction.reply({ content: '❌ Erreur lors de la réinitialisation de l\'économie.', ephemeral: true });
  }
}

// Commande backup-eco
async function handleBackupEco(interaction) {
  try {
    if (!fs.existsSync(ecoBackupDir)) fs.mkdirSync(ecoBackupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `eco-backup-${timestamp}.json`;
    const ecoData = fs.readFileSync(ecoDataPath, 'utf8');
    fs.writeFileSync(path.join(ecoBackupDir, backupName), ecoData);
    const embed = new EmbedBuilder()
      .setTitle('💾 Sauvegarde des données économiques')
      .setDescription('Les données économiques ont été sauvegardées localement.')
      .setColor('#339af0')
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Erreur backup eco:', error);
    await interaction.reply({ content: '❌ Erreur lors de la sauvegarde des données économiques.', ephemeral: true });
  }
}

// Restore eco avec overview et confirmation
async function handleRestoreEco(interaction) {
  const fileName = interaction.options.getString('fichier');
  const filePath = path.join(ecoBackupDir, fileName);
  if (!fs.existsSync(filePath)) {
    return await interaction.reply({ content: '❌ Fichier de backup éco introuvable.', ephemeral: true });
  }
  const ecoData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const userCount = Object.keys(ecoData).length;
  const totalCoins = Object.values(ecoData).reduce((sum, user) => sum + (user.balance || 0) + (user.bank || 0), 0);
  const embed = new EmbedBuilder()
    .setTitle('Aperçu de la restauration économique')
    .setDescription(`Utilisateurs: **${userCount}**\nCoins totaux: **${totalCoins}**\n\nVoulez-vous vraiment restaurer ce backup ?`)
    .setColor('#ffa500')
    .setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('eco-restore-yes').setLabel('Oui').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('eco-restore-no').setLabel('Non').setStyle(ButtonStyle.Danger)
  );
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  // Gestion du bouton
  const collector = interaction.channel.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id && (i.customId === 'eco-restore-yes' || i.customId === 'eco-restore-no'),
    time: 15000
  });
  collector.on('collect', async i => {
    if (i.customId === 'eco-restore-yes') {
      fs.writeFileSync(ecoDataPath, JSON.stringify(ecoData, null, 2));
      await i.update({ content: '✅ Données économiques restaurées avec succès.', embeds: [], components: [], ephemeral: true });
    } else {
      await i.update({ content: '❌ Restauration annulée.', embeds: [], components: [], ephemeral: true });
    }
    collector.stop();
  });
  collector.on('end', collected => {
    if (collected.size === 0) {
      interaction.editReply({ content: '⏰ Temps écoulé, restauration annulée.', embeds: [], components: [], ephemeral: true });
    }
  });
}

// Backup all
async function handleBackupAll(interaction) {
  try {
    if (!fs.existsSync(allBackupDir)) fs.mkdirSync(allBackupDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `all-backup-${timestamp}.json`;
    const config = Config.getConfig();
    const ecoData = JSON.parse(fs.readFileSync(ecoDataPath, 'utf8'));
    const voiceData = JSON.parse(fs.readFileSync(voiceDataPath, 'utf8'));
    const allData = { config, economy: ecoData, voice: voiceData };
    fs.writeFileSync(path.join(allBackupDir, backupName), JSON.stringify(allData, null, 2));
    const embed = new EmbedBuilder()
      .setTitle('💾 Sauvegarde complète')
      .setDescription('Toutes les données (config, économie, vocal) ont été sauvegardées localement.')
      .setColor('#339af0')
      .setTimestamp();
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error('Erreur backup all:', error);
    await interaction.reply({ content: '❌ Erreur lors de la sauvegarde complète.', ephemeral: true });
  }
}

// Restore all avec overview et confirmation
async function handleRestoreAll(interaction) {
  const fileName = interaction.options.getString('fichier');
  const filePath = path.join(allBackupDir, fileName);
  if (!fs.existsSync(filePath)) {
    return await interaction.reply({ content: '❌ Fichier de backup all introuvable.', ephemeral: true });
  }
  const allData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const userCount = Object.keys(allData.economy || {}).length;
  const totalCoins = Object.values(allData.economy || {}).reduce((sum, user) => sum + (user.balance || 0) + (user.bank || 0), 0);
  const voiceCount = Object.keys(allData.voice || {}).length;
  const embed = new EmbedBuilder()
    .setTitle('Aperçu de la restauration complète')
    .setDescription(`Config: **${Object.keys(allData.config || {}).length}** sections\nUtilisateurs économie: **${userCount}**\nCoins totaux: **${totalCoins}**\nUtilisateurs vocal: **${voiceCount}**\n\nVoulez-vous vraiment restaurer ce backup ?`)
    .setColor('#ffa500')
    .setTimestamp();
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('all-restore-yes').setLabel('Oui').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('all-restore-no').setLabel('Non').setStyle(ButtonStyle.Danger)
  );
  await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  // Gestion du bouton
  const collector = interaction.channel.createMessageComponentCollector({
    filter: i => i.user.id === interaction.user.id && (i.customId === 'all-restore-yes' || i.customId === 'all-restore-no'),
    time: 15000
  });
  collector.on('collect', async i => {
    if (i.customId === 'all-restore-yes') {
      // Écrase tout
      Config.config = allData.config;
      Config.saveConfig();
      Config.reloadConfig();
      fs.writeFileSync(ecoDataPath, JSON.stringify(allData.economy || {}, null, 2));
      fs.writeFileSync(voiceDataPath, JSON.stringify(allData.voice || {}, null, 2));
      await i.update({ content: '✅ Toutes les données ont été restaurées avec succès.', embeds: [], components: [], ephemeral: true });
    } else {
      await i.update({ content: '❌ Restauration annulée.', embeds: [], components: [], ephemeral: true });
    }
    collector.stop();
  });
  collector.on('end', collected => {
    if (collected.size === 0) {
      interaction.editReply({ content: '⏰ Temps écoulé, restauration annulée.', embeds: [], components: [], ephemeral: true });
    }
  });
}