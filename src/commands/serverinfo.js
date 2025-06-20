import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('Affiche les informations du serveur');

export async function execute(interaction) {
  const guild = interaction.guild;
  
  const embed = new EmbedBuilder()
    .setTitle(`📊 Informations sur ${guild.name}`)
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .addFields(
      { name: '👑 Propriétaire', value: `<@${guild.ownerId}>`, inline: true },
      { name: '📅 Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
      { name: '👥 Membres', value: `${guild.memberCount}`, inline: true },
      { name: '💬 Salons texte', value: `${guild.channels.cache.filter(c => c.type === 0).size}`, inline: true },
      { name: '🔊 Salons vocaux', value: `${guild.channels.cache.filter(c => c.type === 2).size}`, inline: true },
      { name: '🎭 Rôles', value: `${guild.roles.cache.size}`, inline: true },
      { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
      { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount || 0} (Niveau ${guild.premiumTier})`, inline: true },
      { name: '🆔 ID du serveur', value: guild.id, inline: true }
    )
    .setColor('#5865f2')
    .setTimestamp();

  if (guild.description) {
    embed.setDescription(guild.description);
  }

  await interaction.reply({ embeds: [embed] });
}