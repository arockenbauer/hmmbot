import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('send')
  .setDescription('Envoie un message dans un salon')
  .addChannelOption(opt =>
    opt.setName('salon').setDescription('Salon cible').setRequired(true).addChannelTypes(ChannelType.GuildText))
  .addStringOption(opt =>
    opt.setName('contenu').setDescription('Contenu du message').setRequired(true))
  .addBooleanOption(opt =>
    opt.setName('mention').setDescription('Mentionner everyone/here ?'))
  .addBooleanOption(opt =>
    opt.setName('ephemere').setDescription('Message éphémère (si possible)'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
  const channel = interaction.options.getChannel('salon');
  const content = interaction.options.getString('contenu');
  const mention = interaction.options.getBoolean('mention');
  // L'option "ephemere" n'est pas applicable pour un message envoyé dans un salon, seulement pour les interactions
  let msg = content;
  if (mention) msg = '@everyone ' + msg;
  await channel.send({ content: msg });
  await interaction.reply({ content: 'Message envoyé !', ephemeral: true });
}
