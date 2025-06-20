import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('embed')
  .setDescription('Crée et envoie un embed personnalisé dans un salon')
  .addChannelOption(opt =>
    opt.setName('salon').setDescription('Salon cible').setRequired(true).addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
  const channel = interaction.options.getChannel('salon');
  
  // Stocker le salon cible temporairement
  if (!global.embedChannels) global.embedChannels = new Map();
  global.embedChannels.set(interaction.user.id, channel.id);
  
  // Affiche une modale pour la création d'embed
  const modal = new ModalBuilder()
    .setCustomId('embed_create')
    .setTitle('Création d\'embed');
  const titleInput = new TextInputBuilder()
    .setCustomId('embed_title')
    .setLabel('Titre (optionnel)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  const descInput = new TextInputBuilder()
    .setCustomId('embed_desc')
    .setLabel('Description')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);
  const colorInput = new TextInputBuilder()
    .setCustomId('embed_color')
    .setLabel('Couleur hex (ex: #00AE86)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  const footerInput = new TextInputBuilder()
    .setCustomId('embed_footer')
    .setLabel('Footer (optionnel)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  const imageInput = new TextInputBuilder()
    .setCustomId('embed_image')
    .setLabel('URL de l\'image (optionnel)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);
  
  modal.addComponents(
    new ActionRowBuilder().addComponents(titleInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(colorInput),
    new ActionRowBuilder().addComponents(footerInput),
    new ActionRowBuilder().addComponents(imageInput)
  );
  await interaction.showModal(modal);
}
