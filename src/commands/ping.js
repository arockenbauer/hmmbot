import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Renvoie Pong avec la latence.');

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('🏓 Pong!')
    .setDescription(`Latence : \`${Date.now() - interaction.createdTimestamp}ms\``)
    .setTimestamp();
  await interaction.reply({ embeds: [embed], ephemeral: false });
}
