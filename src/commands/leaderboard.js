import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Economy } from '../utils/economy.js';

export const data = new SlashCommandBuilder()
  .setName('leaderboard')
  .setDescription('Affiche le classement économique')
  .addStringOption(option =>
    option.setName('type')
      .setDescription('Type de classement')
      .setRequired(false)
      .addChoices(
        { name: 'Total (portefeuille + banque)', value: 'total' },
        { name: 'Banque uniquement', value: 'bank' }
      ))
  .addIntegerOption(option =>
    option.setName('limite')
      .setDescription('Nombre d\'utilisateurs à afficher (max 20)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(20));

export async function execute(interaction) {
  const type = interaction.options.getString('type') || 'total';
  const limit = interaction.options.getInteger('limite') || 10;
  
  const leaderboard = Economy.getLeaderboard(type === 'bank' ? 'bank' : 'balance', limit);

  if (leaderboard.length === 0) {
    return await interaction.reply({ content: '❌ Aucune donnée économique disponible.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setTitle('💰 Classement')
    .setDescription(`Les utilisateurs les plus riches ${type === 'bank' ? '(banque)' : '(total)'}`)
    .setColor('#ffd43b')
    .setTimestamp();

  let description = '';
  for (let i = 0; i < leaderboard.length; i++) {
    const entry = leaderboard[i];
    const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
    const username = user ? user.username : 'Utilisateur inconnu';
    
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
    description += `${medal} **${username}** - ${Economy.formatMoney(entry.value)}\n`;
  }

  embed.setDescription(description);
  
  await interaction.reply({ embeds: [embed] });
}