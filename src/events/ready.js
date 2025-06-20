import { Logger } from '../utils/logger.js';

export const name = 'ready';
export const once = true;
export async function execute(client) {
  console.log(`\x1b[36m[READY]\x1b[0m Connecté en tant que ${client.user.tag}`);
  
  // Log de démarrage
  await Logger.log(client, 'SYSTEM', {
    message: `Bot démarré avec succès - ${client.user.tag}`,
    guilds: client.guilds.cache.size,
    users: client.users.cache.size,
    channels: client.channels.cache.size
  });
}
