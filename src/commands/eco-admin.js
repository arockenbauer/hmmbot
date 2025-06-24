import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Economy } from '../utils/economy.js';
import { Logger } from '../utils/logger.js';

export const data = new SlashCommandBuilder()
  .setName('eco-admin')
  .setDescription('Commandes d\'administration économique')
  .addSubcommand(subcommand =>
    subcommand
      .setName('add')
      .setDescription('Ajouter de l\'argent à un utilisateur')
      .addUserOption(option =>
        option.setName('utilisateur')
          .setDescription('L\'utilisateur')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('montant')
          .setDescription('Le montant à ajouter')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('type')
          .setDescription('Où ajouter l\'argent')
          .setRequired(false)
          .addChoices(
            { name: 'Portefeuille', value: 'wallet' },
            { name: 'Banque', value: 'bank' }
          )))
  .addSubcommand(subcommand =>
    subcommand
      .setName('remove')
      .setDescription('Retirer de l\'argent à un utilisateur')
      .addUserOption(option =>
        option.setName('utilisateur')
          .setDescription('L\'utilisateur')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('montant')
          .setDescription('Le montant à retirer')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('type')
          .setDescription('D\'où retirer l\'argent')
          .setRequired(false)
          .addChoices(
            { name: 'Portefeuille', value: 'wallet' },
            { name: 'Banque', value: 'bank' }
          )))
  .addSubcommand(subcommand =>
    subcommand
      .setName('reset')
      .setDescription('Remettre à zéro l\'économie d\'un utilisateur')
      .addUserOption(option =>
        option.setName('utilisateur')
          .setDescription('L\'utilisateur')
          .setRequired(true)))
  .addSubcommand(subcommand =>
    subcommand
      .setName('set')
      .setDescription('Définir le solde d\'un utilisateur')
      .addUserOption(option =>
        option.setName('utilisateur')
          .setDescription('L\'utilisateur')
          .setRequired(true))
      .addIntegerOption(option =>
        option.setName('montant')
          .setDescription('Le nouveau montant')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('type')
          .setDescription('Quel solde modifier')
          .setRequired(false)
          .addChoices(
            { name: 'Portefeuille', value: 'wallet' },
            { name: 'Banque', value: 'bank' }
          )))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  const targetUser = interaction.options.getUser('utilisateur');
  const amount = interaction.options.getInteger('montant');
  const type = interaction.options.getString('type') || 'wallet';

  switch (subcommand) {
    case 'add':
      Economy.addMoney(targetUser.id, amount, type);
      
      await Logger.log(interaction.client, 'ECONOMY', {
        user: `Admin: ${interaction.user.tag} → ${targetUser.tag}`,
        action: `Ajout (${type === 'bank' ? 'banque' : 'portefeuille'})`,
        amount: amount
      });

      const addEmbed = new EmbedBuilder()
        .setTitle('✅ Argent ajouté')
        .setDescription(`**${Economy.formatMoney(amount)}** ajouté au ${type === 'bank' ? 'compte bancaire' : 'portefeuille'} de ${targetUser}`)
        .setColor('#51cf66')
        .setTimestamp();

      await interaction.reply({ embeds: [addEmbed] });
      break;

    case 'remove':
      const success = Economy.removeMoney(targetUser.id, amount, type);
      if (!success) {
        return await interaction.reply({ content: '❌ L\'utilisateur n\'a pas assez d\'argent !', ephemeral: true });
      }

      await Logger.log(interaction.client, 'ECONOMY', {
        user: `Admin: ${interaction.user.tag} → ${targetUser.tag}`,
        action: `Retrait (${type === 'bank' ? 'banque' : 'portefeuille'})`,
        amount: amount
      });

      const removeEmbed = new EmbedBuilder()
        .setTitle('✅ Argent retiré')
        .setDescription(`**${Economy.formatMoney(amount)}** retiré du ${type === 'bank' ? 'compte bancaire' : 'portefeuille'} de ${targetUser}`)
        .setColor('#ff6b6b')
        .setTimestamp();

      await interaction.reply({ embeds: [removeEmbed] });
      break;

    case 'reset':
      const userData = Economy.getUser(targetUser.id);
      userData.balance = 0;
      userData.bank = 0;
      userData.lastDaily = 0;
      userData.lastWork = 0;
      userData.level = 1;
      userData.xp = 0;
      Economy.updateUser(targetUser.id, userData);

      await Logger.log(interaction.client, 'ECONOMY', {
        user: `Admin: ${interaction.user.tag} → ${targetUser.tag}`,
        action: 'Reset économique',
        amount: 0
      });

      const resetEmbed = new EmbedBuilder()
        .setTitle('✅ Économie remise à zéro')
        .setDescription(`L'économie de ${targetUser} a été remise à zéro`)
        .setColor('#868e96')
        .setTimestamp();

      await interaction.reply({ embeds: [resetEmbed] });
      break;

    case 'set':
      const user = Economy.getUser(targetUser.id);
      if (type === 'bank') {
        user.bank = amount;
      } else {
        user.balance = amount;
      }
      Economy.updateUser(targetUser.id, user);

      await Logger.log(interaction.client, 'ECONOMY', {
        user: `Admin: ${interaction.user.tag} → ${targetUser.tag}`,
        action: `Définition (${type === 'bank' ? 'banque' : 'portefeuille'})`,
        amount: amount
      });

      const setEmbed = new EmbedBuilder()
        .setTitle('✅ Solde défini')
        .setDescription(`Le ${type === 'bank' ? 'compte bancaire' : 'portefeuille'} de ${targetUser} a été défini à **${Economy.formatMoney(amount)}**`)
        .setColor('#339af0')
        .setTimestamp();

      await interaction.reply({ embeds: [setEmbed] });
      break;
  }
}