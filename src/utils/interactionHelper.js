/**
 * Utilitaire pour gérer les réponses aux interactions de manière sécurisée
 */
export class InteractionHelper {
  /**
   * Répond à une interaction de manière sécurisée
   * @param {CommandInteraction} interaction - L'interaction Discord
   * @param {Object} options - Options de réponse
   * @returns {Promise<void>}
   */
  static async safeReply(interaction, options) {
    try {
      if (interaction.replied) {
        return await interaction.followUp(options);
      } else if (interaction.deferred) {
        return await interaction.editReply(options);
      } else {
        return await interaction.reply(options);
      }
    } catch (error) {
      console.error('Erreur lors de la réponse à l\'interaction:', error.message);
      
      // Tentative de fallback
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
        }
      } catch (fallbackError) {
        console.error('Impossible de répondre à l\'interaction:', fallbackError.message);
      }
    }
  }

  /**
   * Défère une interaction si elle n'est pas déjà répondue
   * @param {CommandInteraction} interaction - L'interaction Discord
   * @param {Object} options - Options de déférence
   * @returns {Promise<void>}
   */
  static async safeDefer(interaction, options = {}) {
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.deferReply(options);
      }
    } catch (error) {
      console.error('Erreur lors du defer:', error.message);
    }
  }

  /**
   * Vérifie si une interaction peut encore être utilisée
   * @param {CommandInteraction} interaction - L'interaction Discord
   * @returns {boolean}
   */
  static canUseInteraction(interaction) {
    const now = Date.now();
    const interactionTime = interaction.createdTimestamp;
    const timeDiff = now - interactionTime;
    
    // Les interactions expirent après 15 minutes
    return timeDiff < 15 * 60 * 1000;
  }
}