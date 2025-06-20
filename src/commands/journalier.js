import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Economy } from '../utils/economy.js';
import { Logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('journalier')
  .setDescription('Récupère votre récompense journalière');

export async function execute(interaction) {
  const userId = interaction.user.id;
  
  if (!Economy.canDaily(userId)) {
    const timeLeft = Economy.getTimeUntilDaily(userId);
    const embed = new EmbedBuilder()
      .setTitle('⏰ Récompense journalière')
      .setDescription(`Vous avez déjà récupéré votre récompense journalière !\nRevenez dans **${timeLeft}**`)
      .setColor('#ff6b6b')
      .setTimestamp();
    
    return await interaction.reply({ embeds: [embed] });
  }

  const amount = Economy.claimDaily(userId);
  
  // Log de la transaction
  await Logger.log(interaction.client, 'ECONOMY', {
    user: interaction.user.tag,
    action: 'Récompense journalière',
    amount: amount
  });

  const embed = new EmbedBuilder()
    .setTitle('🎁 Récompense journalière récupérée !')
    .setDescription(`Vous avez reçu **${Economy.formatMoney(amount)}** !`)
    .setColor('#51cf66')
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}