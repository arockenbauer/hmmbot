import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Economy } from '../utils/economy.js';
import { Logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('pay')
  .setDescription('Donnez de l\'argent à un autre utilisateur')
  .addUserOption(option =>
    option.setName('utilisateur')
      .setDescription('L\'utilisateur à qui donner de l\'argent')
      .setRequired(true))
  .addIntegerOption(option =>
    option.setName('montant')
      .setDescription('Le montant à donner')
      .setRequired(true)
      .setMinValue(1));

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('utilisateur');
  const amount = interaction.options.getInteger('montant');
  
  if (targetUser.id === interaction.user.id) {
    return await interaction.reply({ content: '❌ Vous ne pouvez pas vous donner de l\'argent à vous-même !', ephemeral: true });
  }

  if (targetUser.bot) {
    return await interaction.reply({ content: '❌ Vous ne pouvez pas donner de l\'argent à un bot !', ephemeral: true });
  }

  const senderData = Economy.getUser(interaction.user.id);
  if (senderData.balance < amount) {
    return await interaction.reply({ content: '❌ Vous n\'avez pas assez d\'argent dans votre portefeuille !', ephemeral: true });
  }

  const success = Economy.transferMoney(interaction.user.id, targetUser.id, amount);
  if (!success) {
    return await interaction.reply({ content: '❌ Erreur lors du transfert !', ephemeral: true });
  }

  // Log de la transaction
  await Logger.log(interaction.client, 'ECONOMY', {
    user: `${interaction.user.tag} → ${targetUser.tag}`,
    action: 'Transfert',
    amount: amount
  });

  const embed = new EmbedBuilder()
    .setTitle('💸 Transfert effectué')
    .setDescription(`Vous avez donné **${Economy.formatMoney(amount)}** à ${targetUser}`)
    .setColor('#51cf66')
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}