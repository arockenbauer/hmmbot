import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { rerollGiveaway } from '../utils/giveawayUtils.js';

export const data = new SlashCommandBuilder()
  .setName('giveaway-reroll')
  .setDescription('Reroll un giveaway et choisit un/des nouveaux gagnants.')
  .addStringOption(option =>
    option.setName('lien').setDescription('Lien du message du giveaway').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const lien = interaction.options.getString('lien');
  await rerollGiveaway(interaction, lien);
}
