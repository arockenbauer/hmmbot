import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';

// Configuration
const DATA_PATH = path.join(process.cwd(), 'data', 'scheduledMessages.json');
const CHECK_INTERVAL = 60 * 1000; // 1 minute

// Helpers
function loadScheduled() {
  if (!fs.existsSync(DATA_PATH)) {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, '[]');
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function saveScheduled(arr) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(arr, null, 2));
}

function generateId() {
  return Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

function validateDate(year, month, day, hour, minute, second) {
  const date = new Date(year, month, day, hour, minute, second);
  const timestamp = date.getTime();
  
  if (isNaN(timestamp)) return { valid: false };
  if (timestamp <= Date.now()) return { valid: false };
  
  return { 
    valid: true,
    date,
    timestamp
  };
}

// Date helpers for autocomplete
const dateHelpers = {
  getNextYears() {
    const now = new Date();
    return Array.from({ length: 5 }, (_, i) => now.getFullYear() + i);
  },
  
  getMonths() {
    return [
      { name: 'Janvier', value: 0 }, { name: 'Février', value: 1 }, { name: 'Mars', value: 2 },
      { name: 'Avril', value: 3 }, { name: 'Mai', value: 4 }, { name: 'Juin', value: 5 },
      { name: 'Juillet', value: 6 }, { name: 'Août', value: 7 }, { name: 'Septembre', value: 8 },
      { name: 'Octobre', value: 9 }, { name: 'Novembre', value: 10 }, { name: 'Décembre', value: 11 }
    ];
  },
  
  getDays(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  },
  
  getHours() { 
    return Array.from({ length: 24 }, (_, i) => i); 
  },
  
  getMinutes() { 
    return Array.from({ length: 60 }, (_, i) => i); 
  },
  
  getSeconds() { 
    return Array.from({ length: 60 }, (_, i) => i); 
  }
};

// Scheduler
export function startScheduler(client) {
  if (global._sheduleInterval) clearInterval(global._sheduleInterval);
  
  global._sheduleInterval = setInterval(async () => {
    const messages = loadScheduled();
    const now = Date.now();
    let needsSave = false;
    
    for (const msg of messages.filter(m => !m.sent && m.timestamp <= now)) {
      try {
        const channel = await client.channels.fetch(msg.channelId).catch(() => null);
        if (!channel) continue;
        
        const payload = msg.embed 
          ? { embeds: [new EmbedBuilder(msg.embed)] } 
          : { content: msg.content };
        
        await channel.send(payload);
        msg.sent = true;
        needsSave = true;
      } catch (error) {
        console.error(`Failed to send scheduled message ${msg.id}:`, error);
      }
    }
    
    if (needsSave) saveScheduled(messages);
  }, CHECK_INTERVAL);
}

// Command Builder
export const data = new SlashCommandBuilder()
  .setName('shedule')
  .setDescription('Gère les messages programmés')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
  .addSubcommand(sub => sub
    .setName('create')
    .setDescription('Crée un nouveau message programmé')
    .addChannelOption(opt => opt
      .setName('channel')
      .setDescription('Salon où envoyer le message')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true))
    .addStringOption(opt => opt
      .setName('content')
      .setDescription('Contenu du message')
      .setRequired(true))
    .addIntegerOption(opt => opt
      .setName('year')
      .setDescription('Année')
      .setRequired(true)
      .setAutocomplete(true))
    .addIntegerOption(opt => opt
      .setName('month')
      .setDescription('Mois (0-11)')
      .setRequired(true)
      .setAutocomplete(true))
    .addIntegerOption(opt => opt
      .setName('day')
      .setDescription('Jour du mois')
      .setRequired(true))
    .addIntegerOption(opt => opt
      .setName('hour')
      .setDescription('Heure (0-23)')
      .setRequired(true)
      .setAutocomplete(true))
    .addIntegerOption(opt => opt
      .setName('minute')
      .setDescription('Minute (0-59)')
      .setRequired(true))
    .addIntegerOption(opt => opt
      .setName('second')
      .setDescription('Seconde (0-59)')
      .setRequired(true))
    .addBooleanOption(opt => opt
      .setName('embed')
      .setDescription('Envoyer en tant qu\'embed ?')))
  .addSubcommand(sub => sub
    .setName('list')
    .setDescription('Liste tous les messages programmés')
    .addBooleanOption(opt => opt
      .setName('show_all')
      .setDescription('Afficher aussi les messages déjà envoyés ?')))
  .addSubcommand(sub => sub
    .setName('delete')
    .setDescription('Supprime un message programmé')
    .addStringOption(opt => opt
      .setName('id')
      .setDescription('ID du message à supprimer')
      .setRequired(true)
      .setAutocomplete(true)))
  .addSubcommand(sub => sub
    .setName('edit')
    .setDescription('Modifie un message programmé')
    .addStringOption(opt => opt
      .setName('id')
      .setDescription('ID du message à modifier')
      .setRequired(true)
      .setAutocomplete(true))
    .addStringOption(opt => opt
      .setName('content')
      .setDescription('Nouveau contenu'))
    .addIntegerOption(opt => opt
      .setName('year')
      .setDescription('Nouvelle année')
      .setAutocomplete(true))
    .addIntegerOption(opt => opt
      .setName('month')
      .setDescription('Nouveau mois (0-11)')
      .setAutocomplete(true))
    .addIntegerOption(opt => opt
      .setName('day')
      .setDescription('Nouveau jour du mois'))
    .addIntegerOption(opt => opt
      .setName('hour')
      .setDescription('Nouvelle heure (0-23)')
      .setAutocomplete(true))
    .addIntegerOption(opt => opt
      .setName('minute')
      .setDescription('Nouvelle minute (0-59)'))
    .addIntegerOption(opt => opt
      .setName('second')
      .setDescription('Nouvelle seconde (0-59)'))
    .addBooleanOption(opt => opt
      .setName('embed')
      .setDescription('Envoyer en tant qu\'embed ?')));

// Autocomplete
export async function autocomplete(interaction) {
  const focused = interaction.options.getFocused(true);
  const subcommand = interaction.options.getSubcommand();
  const options = interaction.options.data;
  
  // Handle ID autocomplete for delete/edit
  if ((subcommand === 'delete' || subcommand === 'edit') && focused.name === 'id') {
    const messages = loadScheduled();
    const filtered = messages
      .filter(m => !m.sent || subcommand === 'edit')
      .filter(m => m.id.includes(focused.value))
      .slice(0, 25);
    
    return interaction.respond(
      filtered.map(m => ({
        name: `${m.id} (${new Date(m.timestamp).toLocaleString()})`,
        value: m.id
      }))
    );
  }
  
  // Date autocompletes
  switch (focused.name) {
    case 'year':
      return interaction.respond(
        dateHelpers.getNextYears().map(y => ({ name: y.toString(), value: y }))
      );
    
    case 'month':
      return interaction.respond(
        dateHelpers.getMonths().map(m => ({ name: m.name, value: m.value }))
      );
    
    case 'day':
      const yearOpt = options.find(o => o.name === 'year');
      const monthOpt = options.find(o => o.name === 'month');
      if (!yearOpt || !monthOpt) return interaction.respond([]);
      
      return interaction.respond(
        dateHelpers.getDays(yearOpt.value, monthOpt.value)
          .map(d => ({ name: d.toString(), value: d }))
      );
    
    case 'hour':
      return interaction.respond(
        dateHelpers.getHours().map(h => ({ 
          name: h.toString().padStart(2, '0'), 
          value: h 
        }))
      );
    
    case 'minute':
    case 'second':
      return interaction.respond(
        dateHelpers.getMinutes().map(m => ({ 
          name: m.toString().padStart(2, '0'), 
          value: m 
        }))
      );
  }
}

// Command Execution
export async function execute(interaction) {
  const subcommand = interaction.options.getSubcommand();
  
  switch (subcommand) {
    case 'create':
      return handleCreate(interaction);
    case 'list':
      return handleList(interaction);
    case 'delete':
      return handleDelete(interaction);
    case 'edit':
      return handleEdit(interaction);
  }
}

async function handleCreate(interaction) {
  const channel = interaction.options.getChannel('channel');
  const content = interaction.options.getString('content');
  const year = interaction.options.getInteger('year');
  const month = interaction.options.getInteger('month');
  const day = interaction.options.getInteger('day');
  const hour = interaction.options.getInteger('hour');
  const minute = interaction.options.getInteger('minute');
  const second = interaction.options.getInteger('second');
  const asEmbed = interaction.options.getBoolean('embed') || false;
  
  const { valid, date, timestamp } = validateDate(year, month, day, hour, minute, second);
  if (!valid) {
    return interaction.reply({ 
      content: '❌ Date invalide ou déjà passée.', 
      ephemeral: true 
    });
  }
  
  const messages = loadScheduled();
  const newMessage = {
    id: generateId(),
    channelId: channel.id,
    content,
    embed: asEmbed ? { 
      description: content, 
      color: 0x00AE86,
      timestamp: date.toISOString()
    } : null,
    timestamp,
    sent: false,
    createdAt: Date.now(),
    authorId: interaction.user.id
  };
  
  messages.push(newMessage);
  saveScheduled(messages);
  
  const embed = new EmbedBuilder()
    .setTitle('✅ Message programmé')
    .setDescription(content)
    .addFields(
      { name: 'Salon', value: channel.toString(), inline: true },
      { name: 'Date', value: `<t:${Math.floor(timestamp/1000)}:F>`, inline: true },
      { name: 'ID', value: `\`${newMessage.id}\``, inline: true },
      { name: 'Format', value: asEmbed ? 'Embed' : 'Texte', inline: true }
    )
    .setColor(0x00AE86)
    .setFooter({ text: `Créé par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleList(interaction) {
  const showAll = interaction.options.getBoolean('show_all') || false;
  const messages = loadScheduled()
    .filter(m => showAll || !m.sent)
    .sort((a, b) => a.timestamp - b.timestamp);
  
  if (messages.length === 0) {
    return interaction.reply({ 
      content: '❌ Aucun message programmé trouvé.', 
      ephemeral: true 
    });
  }
  
  const formatMessage = (m) => {
    const status = m.sent ? '✅ Envoyé' : '⏰ En attente';
    return `• **${status}** - <t:${Math.floor(m.timestamp/1000)}:R>\n` +
           `ID: \`${m.id}\` | Salon: <#${m.channelId}>\n` +
           `${m.embed ? '📝 Embed' : '📜 Texte'}: ${m.content.slice(0, 50)}${m.content.length > 50 ? '...' : ''}`;
  };
  
  const embed = new EmbedBuilder()
    .setTitle('📅 Messages programmés')
    .setDescription(messages.map(formatMessage).join('\n\n'))
    .setColor(0x00AE86)
    .setFooter({ text: `Total: ${messages.length} message(s)` });
  
  if (messages.length > 10) {
    embed.setDescription('Trop de messages à afficher. Voici les 10 premiers :\n\n' +
      messages.slice(0, 10).map(formatMessage).join('\n\n'));
    
    await interaction.reply({ 
      content: `📄 ${messages.length} messages trouvés.`, 
      embeds: [embed], 
      ephemeral: true 
    });
    
    // Send remaining messages in follow-ups if more than 10
    for (let i = 10; i < messages.length; i += 10) {
      const chunk = messages.slice(i, i + 10);
      await interaction.followUp({ 
        content: `Suite (${i+1}-${Math.min(i+10, messages.length)}) :`,
        embeds: [new EmbedBuilder()
          .setDescription(chunk.map(formatMessage).join('\n\n'))
          .setColor(0x00AE86)
        ],
        ephemeral: true 
      });
    }
  } else {
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

async function handleDelete(interaction) {
  const id = interaction.options.getString('id');
  const messages = loadScheduled();
  const index = messages.findIndex(m => m.id === id);
  
  if (index === -1) {
    return interaction.reply({ 
      content: '❌ Message programmé introuvable.', 
      ephemeral: true 
    });
  }
  
  const [deleted] = messages.splice(index, 1);
  saveScheduled(messages);
  
  const embed = new EmbedBuilder()
    .setTitle('🗑️ Message supprimé')
    .setDescription(deleted.content)
    .addFields(
      { name: 'Salon', value: `<#${deleted.channelId}>`, inline: true },
      { name: 'Date prévue', value: `<t:${Math.floor(deleted.timestamp/1000)}:F>`, inline: true },
      { name: 'Statut', value: deleted.sent ? '✅ Déjà envoyé' : '❌ Non envoyé', inline: true }
    )
    .setColor(0xFF0000)
    .setFooter({ text: `ID: ${deleted.id}` });
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function handleEdit(interaction) {
  const id = interaction.options.getString('id');
  const messages = loadScheduled();
  const message = messages.find(m => m.id === id);
  
  if (!message) {
    return interaction.reply({ 
      content: '❌ Message programmé introuvable.', 
      ephemeral: true 
    });
  }
  
  if (message.sent) {
    return interaction.reply({ 
      content: '❌ Impossible de modifier un message déjà envoyé.', 
      ephemeral: true 
    });
  }
  
  // Apply changes
  const newContent = interaction.options.getString('content');
  const asEmbed = interaction.options.getBoolean('embed');
  
  if (newContent) message.content = newContent;
  if (asEmbed !== null) {
    message.embed = asEmbed 
      ? { description: message.content, color: 0x00AE86 } 
      : null;
  }
  
  // Handle date changes
  const year = interaction.options.getInteger('year');
  const month = interaction.options.getInteger('month');
  const day = interaction.options.getInteger('day');
  const hour = interaction.options.getInteger('hour');
  const minute = interaction.options.getInteger('minute');
  const second = interaction.options.getInteger('second');
  
  if (year || month || day || hour || minute || second) {
    const oldDate = new Date(message.timestamp);
    const newDate = new Date(
      year ?? oldDate.getFullYear(),
      month ?? oldDate.getMonth(),
      day ?? oldDate.getDate(),
      hour ?? oldDate.getHours(),
      minute ?? oldDate.getMinutes(),
      second ?? oldDate.getSeconds()
    );
    
    const newTimestamp = newDate.getTime();
    if (isNaN(newTimestamp) || newTimestamp <= Date.now()) {
      return interaction.reply({ 
        content: '❌ Nouvelle date invalide ou déjà passée.', 
        ephemeral: true 
      });
    }
    
    message.timestamp = newTimestamp;
  }
  
  saveScheduled(messages);
  
  const embed = new EmbedBuilder()
    .setTitle('✏️ Message modifié')
    .setDescription(message.content)
    .addFields(
      { name: 'Salon', value: `<#${message.channelId}>`, inline: true },
      { name: 'Nouvelle date', value: `<t:${Math.floor(message.timestamp/1000)}:F>`, inline: true },
      { name: 'Format', value: message.embed ? 'Embed' : 'Texte', inline: true }
    )
    .setColor(0x00AE86)
    .setFooter({ text: `ID: ${message.id}` });
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// Initialize scheduler when bot starts
export function initScheduler(client) {
  startScheduler(client);
}