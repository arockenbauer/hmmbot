import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Economy } from '../utils/economy.js';

export const data = new SlashCommandBuilder()
  .setName('balance')
  .setDescription('Affiche votre solde ou celui d\'un autre utilisateur')
  .addUserOption(option =>
    option.setName('utilisateur')
      .setDescription('L\'utilisateur dont vous voulez voir le solde')
      .setRequired(false));

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('utilisateur') || interaction.user;
  const userData = Economy.getUser(targetUser.id);
  const xpForNext = Economy.getXpForNextLevel(targetUser.id);

  const embed = new EmbedBuilder()
    .setTitle(`💰 Solde de ${targetUser.username}`)
    .setThumbnail(targetUser.displayAvatarURL())
    .addFields(
      { name: '🪙 Portefeuille', value: Economy.formatMoney(userData.balance), inline: true },
      { name: '🏦 Banque', value: Economy.formatMoney(userData.bank), inline: true },
      { name: '💎 Total', value: Economy.formatMoney(userData.balance + userData.bank), inline: true },
      { name: '📊 Niveau', value: `${userData.level}`, inline: true },
      { name: '⭐ Expérience', value: `${userData.xp} XP`, inline: true },
      { name: '🎯 Prochain niveau', value: `${xpForNext} XP`, inline: true },
    )
    .setColor('#ffd43b')
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}