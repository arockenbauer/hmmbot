import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Config } from '../utils/config.js';
import { Logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('role')
  .setDescription('Gère les rôles des membres')
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('Ajoute un rôle à un membre')
      .addUserOption(option =>
        option.setName('membre')
          .setDescription('Le membre à qui ajouter le rôle')
          .setRequired(true))
      .addRoleOption(option =>
        option.setName('role')
          .setDescription('Le rôle à ajouter')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('raison')
          .setDescription('Raison de l\'ajout du rôle')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Retire un rôle d\'un membre')
      .addUserOption(option =>
        option.setName('membre')
          .setDescription('Le membre à qui retirer le rôle')
          .setRequired(true))
      .addRoleOption(option =>
        option.setName('role')
          .setDescription('Le rôle à retirer')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('raison')
          .setDescription('Raison du retrait du rôle')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('list')
      .setDescription('Liste les rôles d\'un membre')
      .addUserOption(option =>
        option.setName('membre')
          .setDescription('Le membre dont lister les rôles')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('auto-assign')
      .setDescription('Assigne automatiquement le rôle membre aux nouveaux arrivants')
      .addUserOption(option =>
        option.setName('membre')
          .setDescription('Le membre à qui assigner le rôle membre')
          .setRequired(true)))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  try {
    switch (subcommand) {
      case 'add':
        await handleAddRole(interaction);
        break;
      case 'remove':
        await handleRemoveRole(interaction);
        break;
      case 'list':
        await handleListRoles(interaction);
        break;
      case 'auto-assign':
        await handleAutoAssign(interaction);
        break;
    }
  } catch (error) {
    console.error('Erreur dans la commande role:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '❌ Une erreur est survenue lors de la gestion des rôles.', ephemeral: true });
    }
  }
}

async function handleAddRole(interaction) {
  const user = interaction.options.getUser('membre');
  const role = interaction.options.getRole('role');
  const reason = interaction.options.getString('raison');

  try {
    const member = await interaction.guild.members.fetch(user.id);
    
    // Vérifications de permissions
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return await interaction.reply({ content: '❌ Je n\'ai pas la permission de gérer les rôles !', ephemeral: true });
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return await interaction.reply({ content: '❌ Je ne peux pas gérer ce rôle (position trop élevée).', ephemeral: true });
    }

    if (role.position >= interaction.member.roles.highest.position && interaction.member.id !== interaction.guild.ownerId) {
      return await interaction.reply({ content: '❌ Vous ne pouvez pas assigner ce rôle (position trop élevée).', ephemeral: true });
    }

    if (member.roles.cache.has(role.id)) {
      return await interaction.reply({ content: '❌ Ce membre possède déjà ce rôle.', ephemeral: true });
    }

    await member.roles.add(role, reason || `Ajouté par ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
      .setTitle('✅ Rôle ajouté')
      .setDescription(`Le rôle ${role} a été ajouté à ${member}`)
      .addFields(
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: reason || 'Aucune raison fournie', inline: true }
      )
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Log de l'action
    await Logger.log(interaction.client, 'MODERATION', {
      action: 'Rôle ajouté',
      moderator: interaction.user.tag,
      target: member.user.tag,
      reason: `Rôle: ${role.name} - ${reason || 'Aucune raison fournie'}`
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout du rôle:', error);
    await interaction.reply({ content: '❌ Erreur lors de l\'ajout du rôle.', ephemeral: true });
  }
}

async function handleRemoveRole(interaction) {
  const user = interaction.options.getUser('membre');
  const role = interaction.options.getRole('role');
  const reason = interaction.options.getString('raison');

  try {
    const member = await interaction.guild.members.fetch(user.id);
    
    // Vérifications de permissions
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return await interaction.reply({ content: '❌ Je n\'ai pas la permission de gérer les rôles !', ephemeral: true });
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return await interaction.reply({ content: '❌ Je ne peux pas gérer ce rôle (position trop élevée).', ephemeral: true });
    }

    if (role.position >= interaction.member.roles.highest.position && interaction.member.id !== interaction.guild.ownerId) {
      return await interaction.reply({ content: '❌ Vous ne pouvez pas retirer ce rôle (position trop élevée).', ephemeral: true });
    }

    if (!member.roles.cache.has(role.id)) {
      return await interaction.reply({ content: '❌ Ce membre ne possède pas ce rôle.', ephemeral: true });
    }

    await member.roles.remove(role, reason || `Retiré par ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
      .setTitle('✅ Rôle retiré')
      .setDescription(`Le rôle ${role} a été retiré de ${member}`)
      .addFields(
        { name: 'Modérateur', value: interaction.user.tag, inline: true },
        { name: 'Raison', value: reason || 'Aucune raison fournie', inline: true }
      )
      .setColor('#ff6b6b')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Log de l'action
    await Logger.log(interaction.client, 'MODERATION', {
      action: 'Rôle retiré',
      moderator: interaction.user.tag,
      target: member.user.tag,
      reason: `Rôle: ${role.name} - ${reason || 'Aucune raison fournie'}`
    });

  } catch (error) {
    console.error('Erreur lors du retrait du rôle:', error);
    await interaction.reply({ content: '❌ Erreur lors du retrait du rôle.', ephemeral: true });
  }
}

async function handleListRoles(interaction) {
  const user = interaction.options.getUser('membre');

  try {
    const member = await interaction.guild.members.fetch(user.id);
    
    const roles = member.roles.cache
      .filter(role => role.id !== interaction.guild.id) // Exclure @everyone
      .sort((a, b) => b.position - a.position)
      .map(role => role.toString())
      .join('\n') || 'Aucun rôle';

    const embed = new EmbedBuilder()
      .setTitle(`📋 Rôles de ${member.displayName}`)
      .setDescription(roles)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields({ name: 'Nombre de rôles', value: member.roles.cache.size.toString(), inline: true })
      .setColor('#339af0')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    console.error('Erreur lors de la liste des rôles:', error);
    await interaction.reply({ content: '❌ Erreur lors de la récupération des rôles.', ephemeral: true });
  }
}

async function handleAutoAssign(interaction) {
  const user = interaction.options.getUser('membre');
  const memberRoleId = Config.getRole('member');

  if (!memberRoleId) {
    return await interaction.reply({ content: '❌ Le rôle membre n\'est pas configuré. Utilisez `/config role` pour le configurer.', ephemeral: true });
  }

  try {
    const member = await interaction.guild.members.fetch(user.id);
    const memberRole = interaction.guild.roles.cache.get(memberRoleId);

    if (!memberRole) {
      return await interaction.reply({ content: '❌ Le rôle membre configuré n\'existe plus.', ephemeral: true });
    }

    if (member.roles.cache.has(memberRole.id)) {
      return await interaction.reply({ content: '❌ Ce membre possède déjà le rôle membre.', ephemeral: true });
    }

    await member.roles.add(memberRole, `Rôle membre assigné par ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
      .setTitle('✅ Rôle membre assigné')
      .setDescription(`Le rôle membre a été assigné à ${member}`)
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Log de l'action
    await Logger.log(interaction.client, 'MODERATION', {
      action: 'Rôle membre auto-assigné',
      moderator: interaction.user.tag,
      target: member.user.tag,
      reason: 'Attribution automatique du rôle membre'
    });

  } catch (error) {
    console.error('Erreur lors de l\'auto-assignation:', error);
    await interaction.reply({ content: '❌ Erreur lors de l\'assignation du rôle membre.', ephemeral: true });
  }
}