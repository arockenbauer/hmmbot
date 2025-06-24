import { EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';

export const name = 'guildMemberRemove';
export const once = false;

export async function execute(member) {
  console.log(`${member.user.tag} a quitté le serveur.`);
  
  // Message d'au revoir si configuré
  const channelId = Config.getChannel('goodbye');
  if (channelId) {
    const channel = member.guild.channels.cache.get(channelId);
    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(0xff6b6b)
        .setTitle('👋 Au revoir !')
        .setDescription(`**${member.user.tag}** a quitté le serveur.\n\nNous sommes maintenant **${member.guild.memberCount}** membres.`)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: `ID: ${member.user.id}` })
        .setTimestamp();

      channel.send({ embeds: [embed] });
    }
  }
  
  // Log du départ du membre
  await Logger.log(member.client, 'MEMBER_LEAVE', {
    member: member
  });
}