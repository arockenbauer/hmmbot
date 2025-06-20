// Ce fichier est optionnel ici car la logique du tirage est dans la commande, mais il peut servir pour des logs ou des bonus plus tard.
export const name = 'messageReactionAdd';
export const once = false;
export function execute(reaction, user, client) {
  // Exemple de log stylé
  if (reaction.emoji.name === '🎉' && !user.bot) {
    console.log(`\x1b[33m[GIVEAWAY]\x1b[0m ${user.tag} a participé à un giveaway !`);
  }
}
