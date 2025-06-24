import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Economy } from '../utils/economy.js';
import { Logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('bank')
  .setDescription('Gérez votre compte en banque')
  .addSubcommand(subcommand =>
    subcommand
      .setName('deposit')
      .setDescription('Déposez de l\'argent à la banque')
      .addIntegerOption(option =>
        option.setName('montant')
          .setDescription('Le montant à déposer (ou "all" pour tout)')
          .setRequired(true)
          .setMinValue(1)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('withdraw')
      .setDescription('Retirez de l\'argent de la banque')
      .addIntegerOption(option =>
        option.setName('montant')
          .setDescription('Le montant à retirer (ou "all" pour tout)')
          .setRequired(true)
          .setMinValue(1)));

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const amount = interaction.options.getInteger('montant');
  const userId = interaction.user.id;
  const userData = Economy.getUser(userId);

  if (subcommand === 'deposit') {
    const depositAmount = amount === -1 ? userData.balance : amount;
    
    if (userData.balance < depositAmount) {
      return await interaction.reply({ content: '❌ Vous n\'avez pas assez d\'argent dans votre portefeuille !', ephemeral: true });
    }

    userData.balance -= depositAmount;
    userData.bank += depositAmount;
    Economy.updateUser(userId, userData);

    // Log de la transaction
    await Logger.log(interaction.client, 'ECONOMY', {
      user: interaction.user.tag,
      action: 'Dépôt bancaire',
      amount: depositAmount
    });

    const embed = new EmbedBuilder()
      .setTitle('🏦 Dépôt effectué')
      .setDescription(`Vous avez déposé **${Economy.formatMoney(depositAmount)}** à la banque`)
      .addFields(
        { name: '🪙 Nouveau solde portefeuille', value: Economy.formatMoney(userData.balance), inline: true },
        { name: '🏦 Nouveau solde banque', value: Economy.formatMoney(userData.bank), inline: true }
      )
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } else if (subcommand === 'withdraw') {
    const withdrawAmount = amount === -1 ? userData.bank : amount;
    
    if (userData.bank < withdrawAmount) {
      return await interaction.reply({ content: '❌ Vous n\'avez pas assez d\'argent à la banque !', ephemeral: true });
    }

    userData.bank -= withdrawAmount;
    userData.balance += withdrawAmount;
    Economy.updateUser(userId, userData);

    // Log de la transaction
    await Logger.log(interaction.client, 'ECONOMY', {
      user: interaction.user.tag,
      action: 'Retrait bancaire',
      amount: withdrawAmount
    });

    const embed = new EmbedBuilder()
      .setTitle('🏦 Retrait effectué')
      .setDescription(`Vous avez retiré **${Economy.formatMoney(withdrawAmount)}** de la banque`)
      .addFields(
        { name: '🪙 Nouveau solde portefeuille', value: Economy.formatMoney(userData.balance), inline: true },
        { name: '🏦 Nouveau solde banque', value: Economy.formatMoney(userData.bank), inline: true }
      )
      .setColor('#339af0')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}