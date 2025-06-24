import { SlashCommandBuilder, EmbedBuilder } from 'discord.js'

export const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Affiche les informations d\'un utilisateur')
  .addUserOption(option =>
    option.setName('utilisateur')
      .setDescription('L\'utilisateur dont vous voulez voir les informations')
      .setRequired(false))

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('utilisateur') || interaction.user
  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null)

  const embed = new EmbedBuilder()
    .setTitle(`👤 Informations sur ${targetUser.username}`)
    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '🏷️ Tag', value: targetUser.tag, inline: true },
      { name: '🆔 ID', value: targetUser.id, inline: true },
      { name: '📅 Compte créé', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`, inline: false }
    )
    .setColor('#5865f2')
    .setTimestamp()

  if (member) {
    embed.addFields(
      { name: '📥 A rejoint le serveur', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`, inline: false },
      { name: '🎭 Rôles', value: member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => r).slice(0, 10).join(', ') || 'Aucun rôle', inline: false }
    )

    if (member.nickname) {
      embed.addFields({ name: '📝 Surnom', value: member.nickname, inline: true })
    }

    if (member.premiumSince) {
      embed.addFields({ name: '💎 Boost depuis', value: `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:F>`, inline: true })
    }
  }

  await interaction.reply({ embeds: [embed] })
}