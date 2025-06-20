import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Economy } from '../utils/economy.js';
import { VoiceTracker } from '../utils/voiceTracker.js';

export const data = new SlashCommandBuilder()
  .setName('stats')
  .setDescription('Affiche les statistiques globales du serveur');

export async function execute(interaction) {
  // Statistiques économiques
  const economyData = Economy.loadData();
  const totalUsers = Object.keys(economyData).length;
  const totalMoney = Object.values(economyData).reduce((sum, user) => sum + user.balance + user.bank, 0);
  const averageMoney = totalUsers > 0 ? Math.floor(totalMoney / totalUsers) : 0;
  const highestLevel = Math.max(...Object.values(economyData).map(user => user.level || 1));

  // Statistiques vocales
  const voiceData = VoiceTracker.loadData();
  const totalVoiceTime = Object.values(voiceData).reduce((sum, user) => sum + user.totalTime, 0);
  const averageVoiceTime = Object.keys(voiceData).length > 0 ? totalVoiceTime / Object.keys(voiceData).length : 0;

  // Statistiques du serveur
  const guild = interaction.guild;
  const totalMembers = guild.memberCount;
  const onlineMembers = guild.members.cache.filter(member => member.presence?.status !== 'offline').size;
  const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
  const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
  const roles = guild.roles.cache.size;

  const embed = new EmbedBuilder()
    .setTitle('📊 Statistiques du serveur')
    .setThumbnail(guild.iconURL({ dynamic: true }))
    .setColor('#5865f2')
    .setTimestamp();

  embed.addFields(
    { 
      name: '👥 Membres', 
      value: `**Total:** ${totalMembers}\n**En ligne:** ${onlineMembers}\n**Hors ligne:** ${totalMembers - onlineMembers}`, 
      inline: true 
    },
    { 
      name: '💬 Salons', 
      value: `**Texte:** ${textChannels}\n**Vocal:** ${voiceChannels}\n**Rôles:** ${roles}`, 
      inline: true 
    },
    { 
      name: '💰 Économie', 
      value: `**Utilisateurs actifs:** ${totalUsers}\n**Argent total:** ${Economy.formatMoney(totalMoney)}\n**Moyenne par utilisateur:** ${Economy.formatMoney(averageMoney)}\n**Niveau max:** ${highestLevel}`, 
      inline: true 
    }
  );

  if (Object.keys(voiceData).length > 0) {
    embed.addFields({
      name: '🎤 Vocal',
      value: `**Temps total:** ${VoiceTracker.formatTime(totalVoiceTime)}\n**Moyenne par utilisateur:** ${VoiceTracker.formatTime(averageVoiceTime)}\n**Utilisateurs actifs:** ${Object.keys(voiceData).length}`,
      inline: true
    });
  }

  // Top 3 économique
  const topEconomy = Economy.getLeaderboard('balance', 3);
  let topEconomyText = '';
  for (let i = 0; i < topEconomy.length; i++) {
    const user = await interaction.client.users.fetch(topEconomy[i].userId).catch(() => null);
    const medal = ['🥇', '🥈', '🥉'][i];
    topEconomyText += `${medal} ${user?.username || 'Inconnu'}: ${Economy.formatMoney(topEconomy[i].value)}\n`;
  }

  if (topEconomyText) {
    embed.addFields({ name: '🏆 Top 3 Économie', value: topEconomyText, inline: true });
  }

  // Top 3 vocal
  const topVoice = VoiceTracker.getLeaderboard(3);
  let topVoiceText = '';
  for (let i = 0; i < topVoice.length; i++) {
    const user = await interaction.client.users.fetch(topVoice[i].userId).catch(() => null);
    const medal = ['🥇', '🥈', '🥉'][i];
    topVoiceText += `${medal} ${user?.username || 'Inconnu'}: ${VoiceTracker.formatTime(topVoice[i].totalTime)}\n`;
  }

  if (topVoiceText) {
    embed.addFields({ name: '🎵 Top 3 Vocal', value: topVoiceText, inline: true });
  }

  await interaction.reply({ embeds: [embed] });
}