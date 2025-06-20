import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Economy } from '../utils/economy.js';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';

export const data = new SlashCommandBuilder()
  .setName('rob')
  .setDescription('Tentez de voler de l\'argent à un autre utilisateur')
  .addUserOption(option =>
    option.setName('utilisateur')
      .setDescription('L\'utilisateur à voler')
      .setRequired(true));

export async function execute(interaction) {
  const targetUser = interaction.options.getUser('utilisateur');
  const userId = interaction.user.id;
  
  if (targetUser.id === userId) {
    return await interaction.reply({ content: '❌ Vous ne pouvez pas vous voler vous-même !', ephemeral: true });
  }

  if (targetUser.bot) {
    return await interaction.reply({ content: '❌ Vous ne pouvez pas voler un bot !', ephemeral: true });
  }

  const robberData = Economy.getUser(userId);
  const targetData = Economy.getUser(targetUser.id);

  // Vérifications
  if (robberData.balance < 100) {
    return await interaction.reply({ content: '❌ Vous devez avoir au moins 100 🪙 pour tenter un vol !', ephemeral: true });
  }

  if (targetData.balance < 50) {
    return await interaction.reply({ content: '❌ Cette personne n\'a pas assez d\'argent à voler !', ephemeral: true });
  }

  // Cooldown (1 heure)
  const now = Date.now();
  const lastRob = robberData.lastRob || 0;
  const cooldown = 60 * 60 * 1000; // 1 heure
  
  if (now - lastRob < cooldown) {
    const timeLeft = Math.ceil((cooldown - (now - lastRob)) / (60 * 1000));
    return await interaction.reply({ content: `❌ Vous devez attendre encore ${timeLeft} minutes avant de pouvoir voler à nouveau !`, ephemeral: true });
  }

  // Chance de réussite (configurable)
  const successRate = Config.getEconomySetting('rob_success_rate') || 0.3;
  const success = Math.random() < successRate;
  
  if (success) {
    // Vol réussi
    const robMin = Config.getEconomySetting('rob_min') || 10;
    const robMax = Config.getEconomySetting('rob_max') || 100;
    const stolenAmount = Math.floor(Math.random() * (robMax - robMin + 1)) + robMin;
    
    Economy.removeMoney(targetUser.id, stolenAmount, 'wallet');
    Economy.addMoney(userId, stolenAmount, 'wallet');
    
    robberData.lastRob = now;
    Economy.updateUser(userId, robberData);

    // Log de la transaction
    await Logger.log(interaction.client, 'ECONOMY', {
      user: `${interaction.user.tag} → ${targetUser.tag}`,
      action: 'Vol réussi',
      amount: stolenAmount
    });

    const embed = new EmbedBuilder()
      .setTitle('💰 Vol réussi !')
      .setDescription(`Vous avez volé **${Economy.formatMoney(stolenAmount)}** à ${targetUser} !`)
      .setColor('#51cf66')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  } else {
    // Vol échoué
    const fine = Math.floor(Math.random() * 200) + 100;
    const actualFine = Math.min(fine, robberData.balance);
    
    Economy.removeMoney(userId, actualFine, 'wallet');
    
    robberData.lastRob = now;
    Economy.updateUser(userId, robberData);

    // Log de la transaction
    await Logger.log(interaction.client, 'ECONOMY', {
      user: interaction.user.tag,
      action: 'Vol échoué (amende)',
      amount: -actualFine
    });

    const embed = new EmbedBuilder()
      .setTitle('🚨 Vol échoué !')
      .setDescription(`Vous vous êtes fait prendre ! Vous payez une amende de **${Economy.formatMoney(actualFine)}**`)
      .setColor('#ff6b6b')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
}