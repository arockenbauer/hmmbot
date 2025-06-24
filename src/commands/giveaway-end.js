import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { endGiveaway } from '../utils/giveawayUtils.js';

export const data = new SlashCommandBuilder()
  .setName('giveaway-end')
  .setDescription('Arrête un giveaway et choisit un/des gagnants.')
  .addStringOption(option =>
    option.setName('lien').setDescription('Lien du message du giveaway').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const lien = interaction.options.getString('lien');
  await endGiveaway(interaction, lien, false);
}
