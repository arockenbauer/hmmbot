import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Economy } from '../utils/economy.js';
import { Logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('gamble')
  .setDescription('Pariez votre argent au casino')
  .addIntegerOption(option =>
    option.setName('montant')
      .setDescription('Le montant à parier')
      .setRequired(true)
      .setMinValue(10));

export async function execute(interaction) {
  const amount = interaction.options.getInteger('montant');
  const userId = interaction.user.id;
  const userData = Economy.getUser(userId);

  if (userData.balance < amount) {
    return await interaction.reply({ content: '❌ Vous n\'avez pas assez d\'argent dans votre portefeuille !', ephemeral: true });
  }

  // Différents jeux de hasard avec différentes probabilités
  const games = [
    { name: 'Machine à sous', winChance: 0.3, multiplier: 2 },
    { name: 'Roulette', winChance: 0.4, multiplier: 1.5 },
    { name: 'Blackjack', winChance: 0.45, multiplier: 1.8 },
    { name: 'Poker', winChance: 0.25, multiplier: 3 }
  ];

  const game = games[Math.floor(Math.random() * games.length)];
  const won = Math.random() < game.winChance;

  if (won) {
    // Victoire
    const winAmount = Math.floor(amount * game.multiplier);
    Economy.addMoney(userId, winAmount - amount, 'wallet'); // -amount car on retire la mise, +winAmount car on gagne

    // Log de la transaction
    await Logger.log(interaction.client, 'ECONOMY', {
      user: interaction.user.tag,
      action: `Pari gagné (${game.name})`,
      amount: winAmount - amount
    });

    const embed = new EmbedBuilder()
      .setTitle('🎰 Victoire !')
      .setDescription(`**${game.name}**\n\nVous avez gagné **${Economy.formatMoney(winAmount)}** !\n(Mise: ${Economy.formatMoney(amount)})`)
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else {
    // Défaite
    Economy.removeMoney(userId, amount, 'wallet');

    // Log de la transaction
    await Logger.log(interaction.client, 'ECONOMY', {
      user: interaction.user.tag,
      action: `Pari perdu (${game.name})`,
      amount: -amount
    });

    const embed = new EmbedBuilder()
      .setTitle('💸 Défaite !')
      .setDescription(`**${game.name}**\n\nVous avez perdu **${Economy.formatMoney(amount)}** !`)
      .setColor('#ff6b6b')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}