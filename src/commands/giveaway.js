import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('giveaway')
  .setDescription('Lance un giveaway dans un salon.')
  .addStringOption(option =>
    option.setName('prix').setDescription('Le prix à gagner').setRequired(true))
  .addIntegerOption(option =>
    option.setName('duree').setDescription('Durée en minutes').setRequired(true))
  .addChannelOption(option =>
    option.setName('salon').setDescription('Salon où lancer le giveaway').setRequired(true))
  .addIntegerOption(option =>
    option.setName('gagnants').setDescription('Nombre de gagnants').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const prix = interaction.options.getString('prix');
  const duree = interaction.options.getInteger('duree');
  const salon = interaction.options.getChannel('salon');
  const gagnants = interaction.options.getInteger('gagnants') || 1;

  if (!salon.isTextBased()) return interaction.reply({ content: 'Le salon doit être textuel.', ephemeral: true });

  let timeLeft = duree;
  const embed = new EmbedBuilder()
    .setTitle('🎉 GIVEAWAY 🎉')
    .setDescription(`Prix : **${prix}**\nRéagis avec 🎉 pour participer !`)
    .setColor(0xFFD700)
    .setFooter({ text: `Se termine dans ${timeLeft} minute(s) | ${gagnants} gagnant${gagnants > 1 ? 's' : ''}` })
    .setTimestamp(Date.now() + duree * 60000);

  const message = await salon.send({ embeds: [embed] });
  await message.react('🎉');

  await interaction.reply({ content: `Giveaway lancé dans ${salon}!`, ephemeral: true });

  // Mise à jour du footer chaque minute
  const interval = setInterval(async () => {
    timeLeft--;
    if (timeLeft > 0) {
      const newEmbed = EmbedBuilder.from(embed)
        .setFooter({ text: `Se termine dans ${timeLeft} minute(s) | ${gagnants} gagnant${gagnants > 1 ? 's' : ''}` });
      await message.edit({ embeds: [newEmbed] });
    }
  }, 60000);

  setTimeout(async () => {
    clearInterval(interval);
    const fetched = await message.fetch();
    const users = (await fetched.reactions.cache.get('🎉').users.fetch()).filter(u => !u.bot);
    if (users.size === 0) {
      salon.send('Personne n\'a participé au giveaway. 😢');
      return;
    }
    const winners = users.random(gagnants);
    salon.send(`🎉 Félicitations ${Array.isArray(winners) ? winners.map(u => u).join(', ') : winners} ! Vous gagnez **${prix}** !`);
    // Dernière mise à jour du footer
    const finalEmbed = EmbedBuilder.from(embed)
      .setFooter({ text: `Giveaway terminé !` });
    await message.edit({ embeds: [finalEmbed] });
  }, duree * 60000);
}
