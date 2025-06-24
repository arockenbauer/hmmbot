import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { AdvancedTicketManager } from '../utils/ticket.js';

export const data = new SlashCommandBuilder()
  .setName('sendpanel')
  .setDescription('Envoie le panneau d\'ouverture de ticket dans un salon configuré')
  .addChannelOption(option =>
    option.setName('channel').setDescription('Salon cible (optionnel, utilise la config par défaut)').setRequired(false))
  .addBooleanOption(option =>
    option.setName('force').setDescription('Forcer l\'envoi même si la configuration est incomplète').setRequired(false));

export async function execute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ 
      content: '❌ Vous devez être administrateur pour utiliser cette commande.', 
      ephemeral: true 
    });
  }

  const ticketManager = new AdvancedTicketManager(interaction.client);
  const config = ticketManager.getTicketConfig();
  const force = interaction.options.getBoolean('force') || false;
  
  // Vérifier la configuration si pas forcé
  if (!force) {
    const validation = ticketManager.validateConfig();
    if (!validation.valid) {
      return interaction.reply({
        content: `❌ Configuration invalide:\n${validation.errors.map(e => `• ${e}`).join('\n')}\n\nUtilisez \`force: true\` pour ignorer ces erreurs.`,
        ephemeral: true
      });
    }

    const permissionCheck = await ticketManager.validatePermissions(interaction.guild);
    if (!permissionCheck.valid) {
      return interaction.reply({
        content: `❌ Permissions insuffisantes:\n${permissionCheck.errors.map(e => `• ${e}`).join('\n')}\n\nVérifiez les permissions du bot.`,
        ephemeral: true
      });
    }
  }

  // Déterminer le salon cible
  const targetChannel = interaction.options.getChannel('channel') || 
                        (config.panel?.channel ? interaction.guild.channels.cache.get(config.panel.channel) : null);
  
  if (!targetChannel) {
    return interaction.reply({ 
      content: '❌ Aucun salon spécifié et aucun salon configuré dans la configuration.', 
      ephemeral: true 
    });
  }

  try {
    await interaction.deferReply({ ephemeral: true });

    // Temporairement modifier la config si un salon différent est spécifié
    const originalChannel = config.panel?.channel;
    if (interaction.options.getChannel('channel')) {
      config.panel = config.panel || {};
      config.panel.channel = targetChannel.id;
    }

    // Créer et envoyer le panel
    const message = await ticketManager.createTicketPanel(interaction.guild);
    
    // Restaurer la config originale si modifiée
    if (originalChannel !== undefined && interaction.options.getChannel('channel')) {
      config.panel.channel = originalChannel;
    }

    await interaction.editReply({
      content: `✅ Panel de tickets envoyé avec succès dans ${targetChannel} !\n\n**Détails du panel:**\n• Type: ${config.panel?.selection_type || 'button'}\n• Titre: ${config.panel?.embed_title || 'Support'}\n• ID du message: ${message.id}`
    });

    // Logger l'action
    if (config.log_all_actions) {
      await ticketManager.logAction('PANEL_SENT', {
        user: interaction.user.tag,
        userId: interaction.user.id,
        channelId: targetChannel.id,
        channelName: targetChannel.name,
        messageId: message.id,
        forced: force
      });
    }

  } catch (error) {
    console.error('Erreur lors de l\'envoi du panel:', error);
    
    const errorMessage = error.message.includes('Configuration invalide') || 
                        error.message.includes('Permissions insuffisantes') 
      ? error.message 
      : 'Une erreur inattendue est survenue lors de l\'envoi du panel.';

    if (interaction.deferred) {
      await interaction.editReply({
        content: `❌ ${errorMessage}`
      });
    } else {
      await interaction.reply({
        content: `❌ ${errorMessage}`,
        ephemeral: true
      });
    }
  }
}
