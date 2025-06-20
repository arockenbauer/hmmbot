import { EmbedBuilder } from 'discord.js';

export async function endGiveaway(interaction, lien, killOnly = false) {
  try {
    const message = await fetchGiveawayMessage(interaction, lien);
    if (!message) return;
    if (killOnly) {
      await message.edit({ embeds: [EmbedBuilder.from(message.embeds[0]).setFooter({ text: 'Giveaway annulé.' })] });
      await interaction.reply({ content: 'Giveaway annulé.', ephemeral: true });
      return;
    }
    // Tirage gagnant(s)
    const users = (await message.reactions.cache.get('🎉').users.fetch()).filter(u => !u.bot);
    if (users.size === 0) {
      await message.channel.send('Personne n\'a participé au giveaway. 😢');
      await interaction.reply({ content: 'Aucun participant.', ephemeral: true });
      return;
    }
    // Nombre de gagnants depuis l'embed
    const embed = message.embeds[0];
    let gagnants = 1;
    const match = embed?.footer?.text?.match(/(\d+) gagnant/);
    if (match) gagnants = parseInt(match[1]);
    const winners = users.random(gagnants);
    await message.channel.send(`🎉 Félicitations ${Array.isArray(winners) ? winners.map(u => u).join(', ') : winners} ! Vous gagnez **${embed?.description?.split('Prix : **')[1]?.split('**')[0] || 'le prix'}** !`);
    await message.edit({ embeds: [EmbedBuilder.from(embed).setFooter({ text: 'Giveaway terminé !' })] });
    await interaction.reply({ content: 'Giveaway terminé et gagnant(s) annoncé(s) !', ephemeral: true });
  } catch (e) {
    await interaction.reply({ content: 'Erreur lors de la fin du giveaway.', ephemeral: true });
  }
}

export async function rerollGiveaway(interaction, lien) {
  try {
    const message = await fetchGiveawayMessage(interaction, lien);
    if (!message) return;
    const users = (await message.reactions.cache.get('🎉').users.fetch()).filter(u => !u.bot);
    if (users.size === 0) {
      await message.channel.send('Personne n\'a participé au giveaway. 😢');
      await interaction.reply({ content: 'Aucun participant.', ephemeral: true });
      return;
    }
    // Nombre de gagnants depuis l'embed
    const embed = message.embeds[0];
    let gagnants = 1;
    const match = embed?.footer?.text?.match(/(\d+) gagnant/);
    if (match) gagnants = parseInt(match[1]);
    const winners = users.random(gagnants);
    await message.channel.send(`🎉 Nouveau tirage ! Félicitations ${Array.isArray(winners) ? winners.map(u => u).join(', ') : winners} ! Vous gagnez **${embed?.description?.split('Prix : **')[1]?.split('**')[0] || 'le prix'}** !`);
    await interaction.reply({ content: 'Nouveau gagnant tiré !', ephemeral: true });
  } catch (e) {
    await interaction.reply({ content: 'Erreur lors du reroll.', ephemeral: true });
  }
}

async function fetchGiveawayMessage(interaction, lien) {
  try {
    // Support pour différents formats de liens Discord
    let match = lien.match(/(?:https?:\/\/)?(?:www\.)?discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
    if (!match) {
      // Essayer le format sans guild ID (messages privés)
      match = lien.match(/(?:https?:\/\/)?(?:www\.)?discord\.com\/channels\/@me\/(\d+)\/(\d+)/);
      if (match) {
        const channel = await interaction.client.channels.fetch(match[1]);
        const message = await channel.messages.fetch(match[2]);
        return message;
      }
      throw new Error('Lien invalide');
    }
    
    const [, guildId, channelId, messageId] = match;
    const channel = await interaction.client.channels.fetch(channelId);
    const message = await channel.messages.fetch(messageId);
    return message;
  } catch (error) {
    console.error('Erreur lors de la récupération du message:', error);
    await interaction.reply({ content: 'Lien de message invalide. Assurez-vous d\'utiliser un lien Discord valide.', ephemeral: true });
    return null;
  }
}
