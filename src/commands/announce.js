import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('announce')
  .setDescription('Fait une annonce dans un ou plusieurs salons')
  .addStringOption(option =>
    option
      .setName('message')
      .setDescription('Le message à annoncer')
      .setRequired(true))
  .addChannelOption(option =>
    option
      .setName('salon1')
      .setDescription('Premier salon où faire l\'annonce')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true))
  .addChannelOption(option =>
    option
      .setName('salon2')
      .setDescription('Deuxième salon où faire l\'annonce (optionnel)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false))
  .addChannelOption(option =>
    option
      .setName('salon3')
      .setDescription('Troisième salon où faire l\'annonce (optionnel)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false))
  .addChannelOption(option =>
    option
      .setName('salon4')
      .setDescription('Quatrième salon où faire l\'annonce (optionnel)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false))
  .addChannelOption(option =>
    option
      .setName('salon5')
      .setDescription('Cinquième salon où faire l\'annonce (optionnel)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false))
  .addStringOption(option =>
    option
      .setName('titre')
      .setDescription('Titre de l\'annonce (si embed activé)')
      .setRequired(false))
  .addBooleanOption(option =>
    option
      .setName('embed')
      .setDescription('Envoyer comme embed avec style d\'annonce ?')
      .setRequired(false))
  .addBooleanOption(option =>
    option
      .setName('everyone')
      .setDescription('Mentionner @everyone ?')
      .setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
  const message = interaction.options.getString('message');
  const useEmbed = interaction.options.getBoolean('embed') ?? false;
  const title = interaction.options.getString('titre') || '📢 Annonce';
  const mentionEveryone = interaction.options.getBoolean('everyone') ?? false;
  
  // Récupérer tous les salons mentionnés
  const channels = [];
  for (let i = 1; i <= 5; i++) {
    const channel = interaction.options.getChannel(`salon${i}`);
    if (channel) channels.push(channel);
  }

  if (channels.length === 0) {
    return await interaction.reply({
      content: '❌ Aucun salon spécifié.',
      ephemeral: true
    });
  }

  // Vérifier les permissions pour chaque salon
  const forbiddenChannels = [];
  for (const channel of channels) {
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel])) {
      forbiddenChannels.push(channel.name);
    }
  }

  if (forbiddenChannels.length > 0) {
    return await interaction.reply({
      content: `❌ Je n'ai pas les permissions nécessaires dans ces salons : ${forbiddenChannels.join(', ')}`,
      ephemeral: true
    });
  }

  await interaction.deferReply({ ephemeral: true });

  const results = [];
  
  for (const channel of channels) {
    try {
      let payload = {};
      
      if (mentionEveryone) {
        payload.content = '@everyone';
      }

      if (useEmbed) {
        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(message)
          .setColor('#FF6B6B')
          .setTimestamp()
          .setFooter({ 
            text: `Annonce par ${interaction.user.tag}`, 
            iconURL: interaction.user.displayAvatarURL() 
          });

        if (payload.content) {
          payload.embeds = [embed];
        } else {
          payload = { embeds: [embed] };
        }
      } else {
        const content = mentionEveryone ? `@everyone\n\n${message}` : message;
        payload = { content };
      }

      await channel.send(payload);
      results.push(`✅ ${channel.name}`);
    } catch (error) {
      console.error(`Erreur lors de l'envoi dans ${channel.name}:`, error);
      results.push(`❌ ${channel.name} (erreur)`);
    }
  }

  const embed = new EmbedBuilder()
    .setTitle('📢 Résultats de l\'annonce')
    .setDescription(results.join('\n'))
    .setColor(results.every(r => r.startsWith('✅')) ? '#51CF66' : '#FFD43B')
    .addFields(
      { name: 'Message envoyé', value: message.substring(0, 1000) + (message.length > 1000 ? '...' : ''), inline: false },
      { name: 'Format', value: useEmbed ? '📝 Embed' : '📜 Texte simple', inline: true },
      { name: 'Mention @everyone', value: mentionEveryone ? '✅ Oui' : '❌ Non', inline: true },
      { name: 'Salons ciblés', value: channels.length.toString(), inline: true }
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });

  // Log l'annonce
  const { Logger } = await import('../utils/logger.js');
  await Logger.log(interaction.client, 'MODERATION', {
    action: 'Annonce',
    moderator: interaction.user.tag,
    target: `${channels.length} salon(s)`,
    reason: `Message: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`
  });
}