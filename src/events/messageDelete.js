import { Logger } from '../utils/logger.js';

export const name = 'messageDelete';
export const once = false;

export async function execute(message) {
  if (message.author?.bot) return;
  if (!message.guild) return;
  
  // Log de la suppression du message
  await Logger.log(message.client, 'MESSAGE_DELETE', {
    author: message.author?.tag || 'Utilisateur inconnu',
    channel: message.channel.name,
    content: message.content
  });
}