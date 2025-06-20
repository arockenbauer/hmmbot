import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('slowmode')
  .setDescription('Gère le mode lent d\'un salon')
  .addIntegerOption(option =>
    option
      .setName('duree')
      .setDescription('Durée en secondes (0 pour désactiver, max 21600)')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(21600))
  .addChannelOption(option =>
    option
      .setName('salon')
      .setDescription('Le salon à modifier (optionnel, par défaut le salon actuel)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false))
  .addStringOption(option =>
    option
      .setName('raison')
      .setDescription('Raison du changement de mode lent')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction) {
  const targetChannel = interaction.options.getChannel('salon') || interaction.channel;
  const duration = interaction.options.getInteger('duree');
  const reason = interaction.options.getString('raison') || 'Aucune raison fournie';
  
  // Vérifier que c'est un salon textuel
  if (targetChannel.type !== ChannelType.GuildText) {
    return await interaction.reply({
      content: '❌ Le mode lent ne peut être appliqué qu\'aux salons textuels.',
      ephemeral: true
    });
  }

  // Vérifier les permissions
  const permissions = targetChannel.permissionsFor(interaction.guild.members.me);
  if (!permissions.has(PermissionFlagsBits.ManageChannels)) {
    return await interaction.reply({
      content: '❌ Je n\'ai pas la permission de gérer ce salon.',
      ephemeral: true
    });
  }

  try {
    await targetChannel.setRateLimitPerUser(duration, reason);
    
    const embed = new EmbedBuilder()
      .setColor(duration === 0 ? '#51CF66' : '#FFD43B')
      .setTimestamp()
      .setFooter({ text: `Modifié par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

    if (duration === 0) {
      embed
        .setTitle('🚀 Mode lent désactivé')
        .setDescription(`Le mode lent a été désactivé dans ${targetChannel.toString()}`)
        .addFields(
          { name: 'Salon', value: targetChannel.toString(), inline: true },
          { name: 'Raison', value: reason, inline: true }
        );
    } else {
      const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        let result = '';
        if (hours > 0) result += `${hours}h `;
        if (minutes > 0) result += `${minutes}m `;
        if (secs > 0) result += `${secs}s`;
        
        return result.trim() || '0s';
      };

      embed
        .setTitle('⏱️ Mode lent activé')
        .setDescription(`Le mode lent a été configuré dans ${targetChannel.toString()}`)
        .addFields(
          { name: 'Salon', value: targetChannel.toString(), inline: true },
          { name: 'Durée', value: formatDuration(duration), inline: true },
          { name: 'Raison', value: reason, inline: false }
        );
    }

    await interaction.reply({ embeds: [embed] });

    // Envoyer un message dans le salon concerné si c'est différent
    if (targetChannel.id !== interaction.channel.id) {
      const channelEmbed = new EmbedBuilder()
        .setColor(duration === 0 ? '#51CF66' : '#FFD43B')
        .setTimestamp();

      if (duration === 0) {
        channelEmbed
          .setTitle('🚀 Mode lent désactivé')
          .setDescription('Le mode lent de ce salon a été désactivé.')
          .addFields({ name: 'Modérateur', value: interaction.user.toString(), inline: true });
      } else {
        const formatDuration = (seconds) => {
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = seconds % 60;
          
          let result = '';
          if (hours > 0) result += `${hours}h `;
          if (minutes > 0) result += `${minutes}m `;
          if (secs > 0) result += `${secs}s`;
          
          return result.trim() || '0s';
        };

        channelEmbed
          .setTitle('⏱️ Mode lent activé')
          .setDescription(`Ce salon est maintenant en mode lent. Vous ne pouvez envoyer qu'un message toutes les **${formatDuration(duration)}**.`)
          .addFields(
            { name: 'Modérateur', value: interaction.user.toString(), inline: true },
            { name: 'Raison', value: reason, inline: true }
          );
      }

      await targetChannel.send({ embeds: [channelEmbed] });
    }

    // Log l'action
    const { Logger } = await import('../utils/logger.js');
    await Logger.log(interaction.client, 'MODERATION', {
      action: duration === 0 ? 'Mode lent désactivé' : `Mode lent activé (${duration}s)`,
      moderator: interaction.user.tag,
      target: targetChannel.name,
      reason: reason
    });

  } catch (error) {
    console.error('Erreur lors de la modification du mode lent:', error);
    await interaction.reply({
      content: '❌ Une erreur est survenue lors de la modification du mode lent.',
      ephemeral: true
    });
  }
}