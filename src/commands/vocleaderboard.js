import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { VoiceTracker } from '../utils/voiceTracker.js';

export const data = new SlashCommandBuilder()
  .setName('vocleaderboard')
  .setDescription('Affiche le classement des membres les plus actifs en vocal')
  .addIntegerOption(option =>
    option.setName('limite')
      .setDescription('Nombre de membres à afficher (max 20)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(20));

export async function execute(interaction) {
  const limit = interaction.options.getInteger('limite') || 10;
  const leaderboard = VoiceTracker.getLeaderboard(limit);

  if (leaderboard.length === 0) {
    return await interaction.reply({ content: '❌ Aucune donnée vocale disponible.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('🎤 Classement Vocal')
    .setDescription('Les membres les plus actifs en vocal')
    .setColor('#5865f2')
    .setTimestamp();

  let description = '';
  for (let i = 0; i < leaderboard.length; i++) {
    const entry = leaderboard[i];
    const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
    const username = user ? user.username : 'Utilisateur inconnu';
    const timeFormatted = VoiceTracker.formatTime(entry.totalTime);
    
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    description += `${medal} **${username}** - ${timeFormatted}\n`;
  }

  embed.setDescription(description);
  
  await interaction.reply({ embeds: [embed] });
}