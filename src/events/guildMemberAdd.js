import { EmbedBuilder } from 'discord.js';
import { Logger } from '../utils/logger.js';
import { Config } from '../utils/config.js';

export const name = 'guildMemberAdd';
export const once = false;

export async function execute(member, client) {
  const channelId = Config.getChannel('welcome');
  if (!channelId) return; // Pas de canal de bienvenue configuré
  
  const channel = member.guild.channels.cache.get(channelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x00bfff)
    .setTitle('✨ Bienvenue !')
    .setDescription(`Bienvenue sur **${member.guild.name}**, ${member.user} !\n\nNous sommes maintenant **${member.guild.memberCount}** membres.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: 'Règles', value: 'Merci de lire les règles du serveur !' },
      { name: 'Amuse-toi bien !', value: 'N’hésite pas à participer et à discuter.' }
    )
    .setFooter({ text: `ID: ${member.user.id}` })
    .setTimestamp();

  channel.send({ content: `Bienvenue ${member.user} !`, embeds: [embed] });
  
  // Log de l'arrivée du membre
  await Logger.log(member.client, 'MEMBER_JOIN', {
    member: member
  });
}
