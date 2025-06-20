import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('massdelete')
  .setDescription('Supprime des messages en masse')
  .addIntegerOption(option =>
    option
      .setName('nombre')
      .setDescription('Nombre de messages à supprimer (1-100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100))
  .addUserOption(option =>
    option
      .setName('utilisateur')
      .setDescription('Supprimer uniquement les messages de cet utilisateur')
      .setRequired(false))
  .addStringOption(option =>
    option
      .setName('contient')
      .setDescription('Supprimer uniquement les messages contenant ce texte')
      .setRequired(false))
  .addStringOption(option =>
    option
      .setName('raison')
      .setDescription('Raison de la suppression')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
  const amount = interaction.options.getInteger('nombre');
  const targetUser = interaction.options.getUser('utilisateur');
  const searchText = interaction.options.getString('contient');
  const reason = interaction.options.getString('raison') || 'Suppression en masse';

  // Vérifier les permissions
  if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return await interaction.reply({
      content: '❌ Je n\'ai pas la permission de gérer les messages !',
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    // Récupérer les messages
    const messages = await interaction.channel.messages.fetch({ limit: amount });
    
    // Filtrer les messages selon les critères
    let messagesToDelete = Array.from(messages.values());
    
    if (targetUser) {
      messagesToDelete = messagesToDelete.filter(msg => msg.author.id === targetUser.id);
    }
    
    if (searchText) {
      messagesToDelete = messagesToDelete.filter(msg => 
        msg.content.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filtrer les messages trop anciens (plus de 14 jours)
    const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
    const recentMessages = messagesToDelete.filter(msg => msg.createdTimestamp > twoWeeksAgo);
    const oldMessages = messagesToDelete.filter(msg => msg.createdTimestamp <= twoWeeksAgo);

    if (messagesToDelete.length === 0) {
      return await interaction.editReply({
        content: '❌ Aucun message trouvé correspondant aux critères spécifiés.'
      });
    }

    let deletedCount = 0;
    let errors = [];

    // Supprimer les messages récents par lots
    if (recentMessages.length > 0) {
      if (recentMessages.length === 1) {
        // Un seul message
        await recentMessages[0].delete();
        deletedCount = 1;
      } else {
        // Supprimer par lots de 100 maximum
        const chunks = [];
        for (let i = 0; i < recentMessages.length; i += 100) {
          chunks.push(recentMessages.slice(i, i + 100));
        }

        for (const chunk of chunks) {
          try {
            const deleted = await interaction.channel.bulkDelete(chunk, true);
            deletedCount += deleted.size;
          } catch (error) {
            console.error('Erreur lors de la suppression par lots:', error);
            errors.push(`Erreur avec ${chunk.length} messages récents`);
          }
        }
      }
    }

    // Supprimer les messages anciens individuellement
    if (oldMessages.length > 0) {
      for (const message of oldMessages) {
        try {
          await message.delete();
          deletedCount++;
        } catch (error) {
          console.error('Erreur lors de la suppression d\'un message ancien:', error);
          errors.push(`Message ancien (${message.id})`);
        }
      }
    }

    // Créer l'embed de résultat
    const embed = new EmbedBuilder()
      .setTitle('🗑️ Suppression de messages')
      .setColor(errors.length > 0 ? '#FFD43B' : '#51CF66')
      .setTimestamp()
      .setFooter({ text: `Action par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .addFields(
        { name: 'Messages supprimés', value: deletedCount.toString(), inline: true },
        { name: 'Messages demandés', value: amount.toString(), inline: true },
        { name: 'Salon', value: interaction.channel.toString(), inline: true }
      );

    if (targetUser) {
      embed.addFields({ name: 'Utilisateur ciblé', value: targetUser.toString(), inline: true });
    }

    if (searchText) {
      embed.addFields({ name: 'Texte recherché', value: `\`${searchText}\``, inline: true });
    }

    embed.addFields({ name: 'Raison', value: reason, inline: false });

    if (oldMessages.length > 0) {
      embed.addFields({ 
        name: '⚠️ Messages anciens', 
        value: `${oldMessages.length} message(s) de plus de 14 jours supprimés individuellement`, 
        inline: false 
      });
    }

    if (errors.length > 0) {
      embed.addFields({ 
        name: '❌ Erreurs', 
        value: errors.slice(0, 5).join('\n') + (errors.length > 5 ? `\n... et ${errors.length - 5} autres erreurs` : ''),
        inline: false 
      });
    }

    await interaction.editReply({ embeds: [embed] });

    // Log l'action
    const { Logger } = await import('../utils/logger.js');
    await Logger.log(interaction.client, 'MODERATION', {
      action: 'Suppression en masse',
      moderator: interaction.user.tag,
      target: `${deletedCount} messages dans #${interaction.channel.name}`,
      reason: reason
    });

  } catch (error) {
    console.error('Erreur lors de la suppression en masse:', error);
    await interaction.editReply({
      content: '❌ Une erreur est survenue lors de la suppression des messages.'
    });
  }
}