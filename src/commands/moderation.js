import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { ModerationUtils } from '../utils/moderation.js';
import { Logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('moderation')
  .setDescription('Commandes de modération centralisées')
  .addSubcommand(subcommand =>
    subcommand
      .setName('ban')
      .setDescription('Bannit un utilisateur du serveur')
      .addUserOption(option =>
        option.setName('utilisateur')
          .setDescription('L\'utilisateur à bannir')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('raison')
          .setDescription('Raison du bannissement')
          .setRequired(false))
      .addBooleanOption(option =>
        option.setName('supprimer_messages')
          .setDescription('Supprimer les messages des 7 derniers jours')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('kick')
      .setDescription('Expulse un membre du serveur')
      .addUserOption(option =>
        option.setName('membre')
          .setDescription('Le membre à expulser')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('raison')
          .setDescription('Raison de l\'expulsion')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('timeout')
      .setDescription('Met un membre en timeout')
      .addUserOption(option =>
        option.setName('membre')
          .setDescription('Le membre à mettre en timeout')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('duree')
          .setDescription('Durée du timeout (ex: 10m, 1h, 1d)')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('raison')
          .setDescription('Raison du timeout')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('untimeout')
      .setDescription('Retire le timeout d\'un membre')
      .addUserOption(option =>
        option.setName('membre')
          .setDescription('Le membre à libérer du timeout')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('raison')
          .setDescription('Raison de la levée du timeout')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('unban')
      .setDescription('Débannit un utilisateur')
      .addStringOption(option =>
        option.setName('userid')
          .setDescription('L\'ID de l\'utilisateur à débannir')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('raison')
          .setDescription('Raison du débannissement')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('clear')
      .setDescription('Supprime un nombre spécifique de messages')
      .addIntegerOption(option =>
        option.setName('nombre')
          .setDescription('Nombre de messages à supprimer (1-100)')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(100))
      .addUserOption(option =>
        option.setName('utilisateur')
          .setDescription('Supprimer uniquement les messages de cet utilisateur')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('lock')
      .setDescription('Verrouille ou déverrouille un salon')
      .addBooleanOption(option =>
        option.setName('verrouiller')
          .setDescription('True pour verrouiller, false pour déverrouiller')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('raison')
          .setDescription('Raison du verrouillage/déverrouillage')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('slowmode')
      .setDescription('Active ou désactive le mode lent sur le salon')
      .addIntegerOption(option =>
        option.setName('duree')
          .setDescription('Durée en secondes (0 pour désactiver, max 21600)')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(21600))
      .addStringOption(option =>
        option.setName('raison')
          .setDescription('Raison du slowmode')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('warn')
      .setDescription('Avertit un membre')
      .addUserOption(option =>
        option.setName('membre')
          .setDescription('Le membre à avertir')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('raison')
          .setDescription('Raison de l\'avertissement')
          .setRequired(true)))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'ban':
        await handleBan(interaction);
        break;
      case 'kick':
        await handleKick(interaction);
        break;
      case 'timeout':
        await handleTimeout(interaction);
        break;
      case 'untimeout':
        await handleUntimeout(interaction);
        break;
      case 'unban':
        await handleUnban(interaction);
        break;
      case 'clear':
        await handleClear(interaction);
        break;
      case 'lock':
        await handleLock(interaction);
        break;
      case 'slowmode':
        await handleSlowmode(interaction);
        break;
      case 'warn':
        await handleWarn(interaction);
        break;
    }
  } catch (error) {
    console.error('Erreur dans la commande moderation:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Une erreur est survenue lors de l\'exécution de la commande.', ephemeral: true });
    }
  }
}

async function handleBan(interaction) {
  const user = interaction.options.getUser('utilisateur');
  const reason = interaction.options.getString('raison');
  const deleteMessages = interaction.options.getBoolean('supprimer_messages') || false;

  await ModerationUtils.ban(interaction, user, reason, deleteMessages);
}

async function handleKick(interaction) {
  const user = interaction.options.getUser('membre');
  const reason = interaction.options.getString('raison');
  
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    return await interaction.reply({ content: '❌ Ce membre n\'est pas sur le serveur.', ephemeral: true });
  }

  await ModerationUtils.kick(interaction, member, reason);
}

async function handleTimeout(interaction) {
  const user = interaction.options.getUser('membre');
  const duration = interaction.options.getString('duree');
  const reason = interaction.options.getString('raison');
  
  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) {
    return await interaction.reply({ content: '❌ Ce membre n\'est pas sur le serveur.', ephemeral: true });
  }

  await ModerationUtils.timeout(interaction, member, duration, reason);
}

async function handleUntimeout(interaction) {
  const user = interaction.options.getUser('membre');
  const reason = interaction.options.getString('raison');
  
  try {
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return await interaction.reply({ content: '❌ Ce membre n\'est pas sur le serveur.', ephemeral: true });
    }

    if (!member.isCommunicationDisabled()) {
      return await interaction.reply({ content: '❌ Ce membre n\'est pas en timeout.', ephemeral: true });
    }

    // Vérifier les permissions
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return await interaction.reply({ content: '❌ Je n\'ai pas la permission de gérer les timeouts !', ephemeral: true });
    }

    // Retirer le timeout
    await member.timeout(null, `${reason || 'Aucune raison fournie'} - Par ${interaction.user.tag}`);

    // Répondre
    const embed = new EmbedBuilder()
      .setTitle('✅ Timeout retiré')
      .setDescription(`Le timeout de **${member.user.tag}** a été retiré`)
      .addFields(
        { name: 'Raison', value: reason || 'Aucune raison fournie', inline: false },
        { name: 'Modérateur', value: interaction.user.tag, inline: true }
      )
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Logger
    await Logger.log(interaction.client, 'MODERATION', {
      action: 'Untimeout',
      moderator: interaction.user.tag,
      target: member.user.tag,
      reason: reason || 'Aucune raison fournie'
    });

  } catch (error) {
    console.error('Erreur lors du untimeout:', error);
    await interaction.reply({ content: '❌ Une erreur est survenue lors de la suppression du timeout.', ephemeral: true });
  }
}

async function handleUnban(interaction) {
  const userId = interaction.options.getString('userid');
  const reason = interaction.options.getString('raison');

  try {
    // Vérifier si l'utilisateur est banni
    const bans = await interaction.guild.bans.fetch();
    const bannedUser = bans.get(userId);
    
    if (!bannedUser) {
      return await interaction.reply({ content: '❌ Cet utilisateur n\'est pas banni.', ephemeral: true });
    }

    // Débannir l'utilisateur
    await interaction.guild.members.unban(userId, reason || 'Aucune raison fournie');

    // Log de l'action
    await Logger.log(interaction.client, 'MODERATION', {
      action: 'Unban',
      moderator: interaction.user.tag,
      target: bannedUser.user.tag,
      reason: reason
    });

    const embed = new EmbedBuilder()
      .setTitle('✅ Utilisateur débanni')
      .setDescription(`${bannedUser.user.tag} a été débanni du serveur`)
      .addFields({ name: 'Raison', value: reason || 'Aucune raison fournie' })
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur lors du unban:', error);
    await interaction.reply({ content: '❌ Erreur lors du débannissement.', ephemeral: true });
  }
}

async function handleClear(interaction) {
  const amount = interaction.options.getInteger('nombre');
  const targetUser = interaction.options.getUser('utilisateur');

  try {
    // Vérifier si le bot a les permissions nécessaires
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return await interaction.reply({ content: '❌ Je n\'ai pas la permission de gérer les messages !', ephemeral: true });
    }

    const messages = await interaction.channel.messages.fetch({ limit: amount });
    
    let messagesToDelete = messages;
    if (targetUser) {
      messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
    }

    const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true);

    // Log de l'action
    await Logger.log(interaction.client, 'MODERATION', {
      action: 'Clear',
      moderator: interaction.user.tag,
      target: targetUser ? targetUser.tag : 'Tous les utilisateurs',
      reason: `${deletedMessages.size} messages supprimés`
    });

    const embed = new EmbedBuilder()
      .setTitle('🧹 Messages supprimés')
      .setDescription(`${deletedMessages.size} message(s) supprimé(s)${targetUser ? ` de ${targetUser}` : ''}`)
      .setColor('#51cf66')
      .setTimestamp();

    const reply = await interaction.reply({ embeds: [embed], ephemeral: true });
    
    // Supprimer la réponse après 5 secondes
    setTimeout(() => {
      reply.delete().catch(() => {});
    }, 5000);

  } catch (error) {
    console.error('Erreur lors du clear:', error);
    await interaction.reply({ content: '❌ Erreur lors de la suppression des messages.', ephemeral: true });
  }
}

async function handleLock(interaction) {
  const lock = interaction.options.getBoolean('verrouiller');
  const reason = interaction.options.getString('raison');

  try {
    // Vérifier si le bot a les permissions nécessaires
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({ content: '❌ Je n\'ai pas la permission de gérer les salons !', ephemeral: true });
    }

    const everyone = interaction.guild.roles.everyone;
    
    if (lock) {
      // Verrouiller le salon
      await interaction.channel.permissionOverwrites.edit(everyone, {
        SendMessages: false
      }, { reason: reason || 'Salon verrouillé' });
    } else {
      // Déverrouiller le salon
      await interaction.channel.permissionOverwrites.edit(everyone, {
        SendMessages: null
      }, { reason: reason || 'Salon déverrouillé' });
    }

    // Log de l'action
    await Logger.log(interaction.client, 'MODERATION', {
      action: lock ? 'Salon verrouillé' : 'Salon déverrouillé',
      moderator: interaction.user.tag,
      target: `#${interaction.channel.name}`,
      reason: reason
    });

    const embed = new EmbedBuilder()
      .setTitle(lock ? '🔒 Salon verrouillé' : '🔓 Salon déverrouillé')
      .setDescription(`Le salon ${interaction.channel} a été ${lock ? 'verrouillé' : 'déverrouillé'}`)
      .setColor(lock ? '#ff6b6b' : '#51cf66')
      .setTimestamp();

    if (reason) {
      embed.addFields({ name: 'Raison', value: reason });
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur lors du lock/unlock:', error);
    await interaction.reply({ content: '❌ Erreur lors de la modification des permissions.', ephemeral: true });
  }
}

async function handleSlowmode(interaction) {
  const duration = interaction.options.getInteger('duree');
  const reason = interaction.options.getString('raison');

  try {
    // Vérifier si le bot a les permissions nécessaires
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return await interaction.reply({ content: '❌ Je n\'ai pas la permission de gérer les salons !', ephemeral: true });
    }

    await interaction.channel.setRateLimitPerUser(duration, reason || 'Slowmode modifié');

    // Log de l'action
    await Logger.log(interaction.client, 'MODERATION', {
      action: duration === 0 ? 'Slowmode désactivé' : 'Slowmode activé',
      moderator: interaction.user.tag,
      target: `#${interaction.channel.name}`,
      reason: reason || `${duration} secondes`
    });

    const embed = new EmbedBuilder()
      .setTitle(duration === 0 ? '⚡ Slowmode désactivé' : '🐌 Slowmode activé')
      .setDescription(duration === 0 ? 
        'Le mode lent a été désactivé sur ce salon' : 
        `Mode lent activé: **${duration} seconde(s)** entre chaque message`)
      .addFields({ name: 'Salon', value: `#${interaction.channel.name}`, inline: true })
      .setColor(duration === 0 ? '#51cf66' : '#ffd43b')
      .setTimestamp();

    if (reason) {
      embed.addFields({ name: 'Raison', value: reason, inline: true });
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Erreur lors du slowmode:', error);
    await interaction.reply({ content: '❌ Erreur lors de la modification du slowmode.', ephemeral: true });
  }
}

async function handleWarn(interaction) {
  const user = interaction.options.getUser('membre');
  const reason = interaction.options.getString('raison');
  
  try {
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return await interaction.reply({ content: '❌ Ce membre n\'est pas sur le serveur.', ephemeral: true });
    }

    // Envoyer un MP à l'utilisateur
    try {
      const dmEmbed = new EmbedBuilder()
        .setTitle('⚠️ Vous avez reçu un avertissement')
        .setDescription(`Vous avez reçu un avertissement sur le serveur **${interaction.guild.name}**`)
        .addFields(
          { name: 'Raison', value: reason, inline: false },
          { name: 'Modérateur', value: interaction.user.tag, inline: true }
        )
        .setColor('#ffa500')
        .setTimestamp();
      
      await user.send({ embeds: [dmEmbed] });
    } catch (error) {
      console.log('Impossible d\'envoyer un MP au membre averti');
    }

    // Log de l'action
    await Logger.log(interaction.client, 'MODERATION', {
      action: 'Warn',
      moderator: interaction.user.tag,
      target: user.tag,
      reason: reason
    });

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Membre averti')
      .setDescription(`**${user.tag}** a reçu un avertissement`)
      .addFields(
        { name: 'Raison', value: reason, inline: false },
        { name: 'Modérateur', value: interaction.user.tag, inline: true }
      )
      .setColor('#ffa500')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Erreur lors du warn:', error);
    await interaction.reply({ content: '❌ Une erreur est survenue lors de l\'avertissement.', ephemeral: true });
  }
}