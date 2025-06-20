import { Logger } from '../utils/logger.js';

export const name = 'messageUpdate';
export const once = false;

export async function execute(oldMessage, newMessage) {
  if (newMessage.author?.bot) return;
  if (!newMessage.guild) return;
  if (oldMessage.content === newMessage.content) return;
  
  // Log de la modification du message
  await Logger.log(newMessage.client, 'MESSAGE_EDIT', {
    author: newMessage.author?.tag || 'Utilisateur inconnu',
    channel: newMessage.channel.name,
    oldContent: oldMessage.content,
    newContent: newMessage.content
  });
}