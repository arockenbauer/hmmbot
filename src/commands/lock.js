import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } from 'discord.js';
import { Logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('lock')
  .setDescription('Verrouille ou déverrouille un salon')
  .addSubcommand(subcommand =>
    subcommand
      .setName('lock')
      .setDescription('Verrouille un salon')
      .addChannelOption(option =>
        option
          .setName('salon')
          .setDescription('Le salon à verrouiller (optionnel, par défaut le salon actuel)')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
          .setRequired(false))
      .addStringOption(option =>
        option
          .setName('raison')
          .setDescription('Raison du verrouillage')
          .setRequired(false)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('unlock')
      .setDescription('Déverrouille un salon')
      .addChannelOption(option =>
        option
          .setName('salon')
          .setDescription('Le salon à déverrouiller (optionnel, par défaut le salon actuel)')
          .addChannelTypes(ChannelType.GuildText, ChannelType.GuildVoice)
          .setRequired(false))
      .addStringOption(option =>
        option
          .setName('raison')
          .setDescription('Raison du déverrouillage')
          .setRequired(false)))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
  const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
  const isLocking = subcommand === 'lock';

  // Vérifier les permissions
  const permissions = targetChannel.permissionsFor(interaction.guild.members.me);
  if (!permissions.has(PermissionFlagsBits.ManageChannels)) {
    return await interaction.reply({
      content: '❌ Je n\'ai pas la permission de gérer ce salon.',
      ephemeral: true
    });
  }

  try {
    await interaction.deferReply();

    // Récupérer le rôle @everyone
    const everyoneRole = interaction.guild.roles.everyone;
    
    // Modifier les permissions selon le type de salon
    if (targetChannel.type === ChannelType.GuildText) {
      // Salon textuel
      if (isLocking) {
        await targetChannel.permissionOverwrites.edit(everyoneRole, {
          SendMessages: false,
          SendMessagesInThreads: false,
          CreatePublicThreads: false,
          CreatePrivateThreads: false
        }, { reason });
      } else {
        await targetChannel.permissionOverwrites.edit(everyoneRole, {
          SendMessages: null,
          SendMessagesInThreads: null,
          CreatePublicThreads: null,
          CreatePrivateThreads: null
        }, { reason });
      }
    } else if (targetChannel.type === ChannelType.GuildVoice) {
      // Salon vocal
      if (isLocking) {
        await targetChannel.permissionOverwrites.edit(everyoneRole, {
          Connect: false,
          Speak: false
        }, { reason });
      } else {
        await targetChannel.permissionOverwrites.edit(everyoneRole, {
          Connect: null,
          Speak: null
        }, { reason });
      }
    }

    const embed = new EmbedBuilder()
      .setColor(isLocking ? '#FF6B6B' : '#51CF66')
      .setTimestamp()
      .setFooter({ text: `Action par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    if (isLocking) {
      embed
        .setTitle('🔒 Salon verrouillé')
        .setDescription(`${targetChannel.toString()} a été verrouillé`)
        .addFields(
          { name: 'Type', value: targetChannel.type === ChannelType.GuildText ? '💬 Textuel' : '🔊 Vocal', inline: true },
          { name: 'Modérateur', value: interaction.user.toString(), inline: true },
          { name: 'Raison', value: reason, inline: false }
        );
    } else {
      embed
        .setTitle('🔓 Salon déverrouillé')
        .setDescription(`${targetChannel.toString()} a été déverrouillé`)
        .addFields(
          { name: 'Type', value: targetChannel.type === ChannelType.GuildText ? '💬 Textuel' : '🔊 Vocal', inline: true },
          { name: 'Modérateur', value: interaction.user.toString(), inline: true },
          { name: 'Raison', value: reason, inline: false }
        );
    }

    await interaction.editReply({ embeds: [embed] });

    // Envoyer un message dans le salon concerné si c'est un salon textuel et différent
    if (targetChannel.type === ChannelType.GuildText && targetChannel.id !== interaction.channel.id) {
      const channelEmbed = new EmbedBuilder()
        .setColor(isLocking ? '#FF6B6B' : '#51CF66')
        .setTimestamp();

      if (isLocking) {
        channelEmbed
          .setTitle('🔒 Salon verrouillé')
          .setDescription('Ce salon a été verrouillé par un modérateur.')
          .addFields(
            { name: 'Modérateur', value: interaction.user.toString(), inline: true },
            { name: 'Raison', value: reason, inline: true }
          );
      } else {
        channelEmbed
          .setTitle('🔓 Salon déverrouillé')
          .setDescription('Ce salon a été déverrouillé. Vous pouvez à nouveau y écrire.')
          .addFields(
            { name: 'Modérateur', value: interaction.user.toString(), inline: true },
            { name: 'Raison', value: reason, inline: true }
          );
      }

      try {
        await targetChannel.send({ embeds: [channelEmbed] });
      } catch (error) {
        // Si on ne peut pas envoyer le message (par exemple si le salon est verrouillé pour le bot aussi)
        console.log('Impossible d\'envoyer le message de confirmation dans le salon');
      }
    }

    // Log l'action
    await Logger.log(interaction.client, 'MODERATION', {
      action: isLocking ? 'Salon verrouillé' : 'Salon déverrouillé',
      moderator: interaction.user.tag,
      target: targetChannel.name,
      reason: reason
    });

  } catch (error) {
    console.error('Erreur lors du verrouillage/déverrouillage:', error);
    
    const errorMessage = isLocking ? 
      '❌ Une erreur est survenue lors du verrouillage du salon.' :
      '❌ Une erreur est survenue lors du déverrouillage du salon.';
    
    if (interaction.deferred) {
      await interaction.editReply({ content: errorMessage });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
}