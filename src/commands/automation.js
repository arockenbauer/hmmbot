import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { automationManager } from '../utils/automationManager.js';
import { AutomationValidator } from '../utils/automationValidator.js';
import { AutomationStorage } from '../utils/automationStorage.js';

export const data = new SlashCommandBuilder()
  .setName('automation')
  .setDescription('Gère les messages automatisés')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub => sub
    .setName('list')
    .setDescription('Liste tous les messages automatisés'))
  .addSubcommand(sub => sub
    .setName('create')
    .setDescription('Crée un nouveau message automatisé'))
  .addSubcommand(sub => sub
    .setName('configure')
    .setDescription('Configure un message automatisé existant')
    .addStringOption(opt => opt
      .setName('automation_id')
      .setDescription('ID du message automatisé')
      .setRequired(true)
      .setAutocomplete(true)))
  .addSubcommand(sub => sub
    .setName('delete')
    .setDescription('Supprime un message automatisé')
    .addStringOption(opt => opt
      .setName('automation_id')
      .setDescription('ID du message automatisé')
      .setRequired(true)
      .setAutocomplete(true)))
  .addSubcommand(sub => sub
    .setName('test')
    .setDescription('Teste un message automatisé')
    .addStringOption(opt => opt
      .setName('automation_id')
      .setDescription('ID du message automatisé')
      .setRequired(true)
      .setAutocomplete(true)));

export async function autocomplete(interaction) {
  const focused = interaction.options.getFocused(true);
  const subcommand = interaction.options.getSubcommand();

  if (focused.name === 'automation_id') {
    const automations = automationManager.getAutomations();
    const filtered = automations
      .filter(a => a.id.includes(focused.value) || a.name.includes(focused.value))
      .slice(0, 25);

    return interaction.respond(
      filtered.map(a => ({
        name: `${a.name} (${a.enabled ? '✅' : '❌'})`,
        value: a.id
      }))
    );
  }
}

export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();

  const memberPermissions = interaction.memberPermissions;
  if (!memberPermissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({
      content: '❌ Vous devez être administrateur pour utiliser cette commande.',
      ephemeral: true
    });
  }

  switch (subcommand) {
    case 'list':
      return handleList(interaction);
    case 'create':
      return handleCreate(interaction);
    case 'configure':
      return handleConfigure(interaction);
    case 'delete':
      return handleDelete(interaction);
    case 'test':
      return handleTest(interaction);
  }
}

async function handleList(interaction) {
  const automations = automationManager.getAutomations();

  if (automations.length === 0) {
    return interaction.reply({
      content: '❌ Aucun message automatisé trouvé.',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setTitle('📋 Messages Automatisés')
    .setColor('#0099ff');

  for (const auto of automations) {
    const status = auto.enabled ? '✅ Actif' : '❌ Inactif';
    const intervalText = `${auto.interval.amount} ${auto.interval.unit}`;
    const modeText = auto.randomMode ? '🎲 Aléatoire' : '📊 Séquentiel';
    const channelText = `<#${auto.channelId}>`;

    embed.addFields({
      name: `${status} ${auto.name}`,
      value: `**Description:** ${auto.description || 'N/A'}\n**Intervalle:** ${intervalText}\n**Mode:** ${modeText}\n**Salon:** ${channelText}\n**Messages:** ${auto.messages.length}\n**ID:** \`${auto.id}\``,
      inline: false
    });
  }

  embed.setFooter({ text: `Total: ${automations.length} message(s)` });

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleCreate(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('automation_create_modal')
    .setTitle('Créer un Message Automatisé');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('auto_name')
        .setLabel('Nom')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('auto_description')
        .setLabel('Description')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
    )
  );

  return interaction.showModal(modal);
}

async function handleConfigure(interaction) {
  const automationId = interaction.options.getString('automation_id');
  const automation = automationManager.getAutomation(automationId);

  if (!automation) {
    return interaction.reply({
      content: '❌ Message automatisé introuvable.',
      ephemeral: true
    });
  }

  const channelSelectMenu = new StringSelectMenuBuilder()
    .setCustomId(`auto_channel_select_${automationId}`)
    .setPlaceholder('Sélectionnez un salon');

  const channels = await interaction.guild.channels.fetch();
  const textChannels = channels.filter(c => c.isTextBased()).toArray().slice(0, 25);

  for (const channel of textChannels) {
    channelSelectMenu.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(channel.name)
        .setValue(channel.id)
        .setDefault(channel.id === automation.channelId)
    );
  }

  const embed = new EmbedBuilder()
    .setTitle(`⚙️ Configuration: ${automation.name}`)
    .setColor('#0099ff')
    .addFields(
      { name: 'Statut', value: automation.enabled ? '✅ Actif' : '❌ Inactif', inline: true },
      { name: 'Mode', value: automation.randomMode ? '🎲 Aléatoire' : '📊 Séquentiel', inline: true },
      { name: 'Messages', value: automation.messages.length.toString(), inline: true },
      { name: 'Intervalle', value: `${automation.interval.amount} ${automation.interval.unit}`, inline: true }
    );

  return interaction.reply({
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(channelSelectMenu)],
    ephemeral: true
  });
}

async function handleDelete(interaction) {
  const automationId = interaction.options.getString('automation_id');
  const automation = automationManager.getAutomation(automationId);

  if (!automation) {
    return interaction.reply({
      content: '❌ Message automatisé introuvable.',
      ephemeral: true
    });
  }

  const result = automationManager.removeAutomation(automationId);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Message Supprimé')
      .setDescription(`Le message automatisé "${automation.name}" a été supprimé avec succès.`)
      .setColor('#51CF66');

    return interaction.reply({ embeds: [embed], ephemeral: true });
  } else {
    return interaction.reply({
      content: `❌ Erreur: ${result.error}`,
      ephemeral: true
    });
  }
}

async function handleTest(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const automationId = interaction.options.getString('automation_id');
  const automation = automationManager.getAutomation(automationId);

  if (!automation) {
    return interaction.editReply({
      content: '❌ Message automatisé introuvable.'
    });
  }

  const result = await automationManager.testAutomation(automationId);

  if (result.success) {
    const embed = new EmbedBuilder()
      .setTitle('✅ Test Réussi')
      .setDescription(`Le message automatisé "${automation.name}" a été exécuté avec succès dans <#${automation.channelId}>.`)
      .setColor('#51CF66');

    return interaction.editReply({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setTitle('❌ Erreur lors du Test')
      .setDescription(`Erreur: ${result.error}`)
      .setColor('#FF6B6B');

    return interaction.editReply({ embeds: [embed] });
  }
}
