import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Economy } from '../utils/economy.js';
import { VoiceTracker } from '../utils/voiceTracker.js';

export const data = new SlashCommandBuilder()
  .setName('profile')
  .setDescription('Affiche le profil complet d\'un utilisateur')
  .addUserOption(option =>
    option.setName('utilisateur')
      .setDescription('L\'utilisateur dont vous voulez voir le profil')
      .setRequired(false));

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
  const userData = Economy.getUser(targetUser.id);
  const voiceTime = VoiceTracker.getVoiceTime(targetUser.id);
  const xpForNext = Economy.getXpForNextLevel(targetUser.id);

  // Calculer le rang économique
  const leaderboard = Economy.getLeaderboard('balance', 100);
  const economicRank = leaderboard.findIndex(entry => entry.userId === targetUser.id) + 1;

  // Calculer le rang vocal
  const voiceLeaderboard = VoiceTracker.getLeaderboard(100);
  const voiceRank = voiceLeaderboard.findIndex(entry => entry.userId === targetUser.id) + 1;

  const embed = new EmbedBuilder()
    .setTitle(`👤 Profil de ${targetUser.username}`)
    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
    .setColor('#5865f2')
    .setTimestamp();

  // Informations économiques
  embed.addFields(
    { name: '💰 Économie', value: `**Niveau:** ${userData.level}\n**XP:** ${userData.xp} (${xpForNext} pour le suivant)\n**Argent total:** ${Economy.formatMoney(userData.balance + userData.bank)}\n**Rang:** #${economicRank || 'Non classé'}`, inline: true }
  );

  // Informations vocales
  if (voiceTime > 0) {
    embed.addFields(
      { name: '🎤 Vocal', value: `**Temps total:** ${VoiceTracker.formatTime(voiceTime)}\n**Rang vocal:** #${voiceRank || 'Non classé'}`, inline: true }
    );
  } else {
    embed.addFields(
      { name: '🎤 Vocal', value: `**Temps total:** Aucun\n**Rang vocal:** Non classé`, inline: true }
    );
  }

  // Informations Discord
  const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
  if (member) {
    const joinedDays = Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24));
    embed.addFields(
      { name: '📊 Serveur', value: `**Rejoint:** <t:${Math.floor(member.joinedTimestamp / 1000)}:R>\n**Jours sur le serveur:** ${joinedDays}\n**Rôle principal:** ${member.roles.highest.name}`, inline: true }
    );
  }

  // Badges selon les achievements
  let badges = [];
  if (userData.level >= 10) badges.push('⭐ Niveau 10+');
  if (userData.level >= 25) badges.push('🌟 Niveau 25+');
  if (userData.level >= 50) badges.push('💫 Niveau 50+');
  if (userData.balance + userData.bank >= 100000) badges.push('💎 Riche');
  if (userData.balance + userData.bank >= 1000000) badges.push('👑 Millionnaire');
  if (voiceTime >= 3600000) badges.push('🎤 Bavard (1h+)');
  if (voiceTime >= 36000000) badges.push('📢 Orateur (10h+)');
  if (economicRank <= 3 && economicRank > 0) badges.push('🏆 Top 3 Économie');
  if (voiceRank <= 3 && voiceRank > 0) badges.push('🎵 Top 3 Vocal');

  if (badges.length > 0) {
    embed.addFields({ name: '🏅 Badges', value: badges.join('\n'), inline: false });
  }

  await interaction.reply({ embeds: [embed] });
}