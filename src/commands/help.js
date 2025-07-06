import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Affiche l\'aide complète du bot avec toutes les commandes disponibles')
  .addStringOption(option =>
    option.setName('commande')
      .setDescription('Nom de la commande pour obtenir des détails spécifiques')
      .setRequired(false)
      .setAutocomplete(true));

export async function execute(interaction) {
  const specificCommand = interaction.options.getString('commande');
  
  if (specificCommand) {
    await showSpecificCommandHelp(interaction, specificCommand);
  } else {
    await showMainHelpInterface(interaction);
  }
}

// Fonction pour l'autocomplétion
export async function autocomplete(interaction) {
  const focusedValue = interaction.options.getFocused();
  const commands = await loadAllCommands();
  
  const filtered = commands
    .filter(cmd => cmd.name.toLowerCase().includes(focusedValue.toLowerCase()))
    .slice(0, 25) // Discord limite à 25 choix
    .map(cmd => ({
      name: `${cmd.name} - ${cmd.description.substring(0, 80)}`,
      value: cmd.name
    }));

  await interaction.respond(filtered);
}



// Charge toutes les commandes dynamiquement
async function loadAllCommands() {
  const commands = [];
  const commandsPath = path.join(__dirname);
  
  try {
    const files = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js') && f !== 'help.js');
    
    for (const file of files) {
      try {
        const command = await import(`./${file}`);
        if (command.data && command.data.name) {
          // Utiliser toJSON() pour obtenir la structure complète avec les types
          const jsonData = command.data.toJSON ? command.data.toJSON() : command.data;
          
          const commandData = {
            name: jsonData.name,
            description: jsonData.description,
            options: jsonData.options || [],
            permissions: jsonData.default_member_permissions,
            category: categorizeCommand(jsonData.name),
            file: file
          };
          commands.push(commandData);
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de ${file}:`, error);
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des commandes:', error);
  }
  
  return commands.sort((a, b) => a.name.localeCompare(b.name));
}

// Catégorise les commandes
function categorizeCommand(commandName) {
  const categories = {
    '🛡️ Modération': ['moderation', 'ban', 'kick', 'timeout', 'clear', 'lock', 'slowmode', 'massdelete'],
    '⚙️ Configuration': ['config', 'setup'],
    '🎟️ Tickets': ['ticket', 'newticket', 'closeticket', 'ticket-admin', 'sendpanel'],
    '💰 Économie': ['balance', 'bank', 'work', 'journalier', 'pay', 'rob', 'gamble', 'eco-admin', 'leaderboard'],
    '🎉 Giveaways': ['giveaway', 'giveaway-end', 'giveaway-kill', 'giveaway-reroll'],
    '📊 Statistiques': ['stats', 'serverinfo', 'userinfo', 'profile', 'vocleaderboard'],
    '🎭 Rôles & Utilisateurs': ['role'],
    '📢 Communication': ['announce', 'embed', 'send'],
    '📅 Planification': ['shedule'],
    '🔧 Administration': ['admin'],
    '🏓 Utilitaires': ['ping']
  };

  for (const [category, commands] of Object.entries(categories)) {
    if (commands.includes(commandName)) {
      return category;
    }
  }
  
  return '📋 Autres';
}

// Calcule des statistiques sur les commandes
function calculateCommandStats(commands) {
  let subcommands = 0;
  let withPermissions = 0;
  let totalOptions = 0;

  commands.forEach(cmd => {
    // Compter les sous-commandes
    if (cmd.options) {
      const subcommandCount = cmd.options.filter(opt => opt.type === 1).length;
      subcommands += subcommandCount;
      totalOptions += cmd.options.length;
    }

    // Compter les commandes avec permissions
    if (cmd.permissions) {
      withPermissions++;
    }
  });

  return {
    subcommands,
    withPermissions,
    totalOptions,
    averageOptionsPerCommand: Math.round(totalOptions / commands.length * 10) / 10
  };
}

// Interface principale d'aide
async function showMainHelpInterface(interaction) {
  const commands = await loadAllCommands();
  const categories = {};
  
  // Grouper les commandes par catégorie
  commands.forEach(cmd => {
    if (!categories[cmd.category]) {
      categories[cmd.category] = [];
    }
    categories[cmd.category].push(cmd);
  });

  // Calculer des statistiques
  const stats = calculateCommandStats(commands);

  const embed = new EmbedBuilder()
    .setTitle('📚 Guide Complet des Commandes HmmBot')
    .setDescription(`**Bienvenue dans l'aide interactive !**\n\n` +
      `🎯 **${commands.length} commandes** disponibles réparties en **${Object.keys(categories).length} catégories**\n` +
      `🔧 **${stats.subcommands}** sous-commandes au total\n` +
      `⚡ **${stats.withPermissions}** commandes avec permissions spéciales\n\n` +
      `**Navigation :**\n` +
      `• Utilisez le menu déroulant pour explorer par catégorie\n` +
      `• Cliquez sur "📋 Liste Complète" pour voir toutes les commandes\n` +
      `• Utilisez \`/help <commande>\` pour des détails spécifiques\n\n` +
      `**Astuce :** La plupart des commandes supportent l'autocomplétion !`)
    .setColor('#339af0')
    .setTimestamp()
    .setFooter({ 
      text: `HmmBot • ${commands.length} commandes chargées • Dernière mise à jour`, 
      iconURL: interaction.client.user.displayAvatarURL() 
    });

  // Ajouter un aperçu des catégories
  let categoryOverview = '';
  Object.entries(categories).forEach(([category, cmds]) => {
    categoryOverview += `${category} **${cmds.length}** commande${cmds.length > 1 ? 's' : ''}\n`;
  });
  
  embed.addFields({
    name: '📂 Catégories Disponibles',
    value: categoryOverview,
    inline: false
  });

  // Ajouter les commandes les plus populaires (basé sur le nombre de sous-commandes)
  const topCommands = commands
    .filter(cmd => cmd.options && cmd.options.length > 0)
    .sort((a, b) => (b.options?.filter(opt => opt.type === 1).length || 0) - (a.options?.filter(opt => opt.type === 1).length || 0))
    .slice(0, 3);

  if (topCommands.length > 0) {
    const topCommandsText = topCommands.map(cmd => {
      const subCount = cmd.options?.filter(opt => opt.type === 1).length || 0;
      return `**/${cmd.name}** (${subCount} sous-commandes)`;
    }).join('\n');
    
    embed.addFields({
      name: '⭐ Commandes Principales',
      value: topCommandsText,
      inline: true
    });
  }

  // Menu de sélection des catégories
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_category_select')
    .setPlaceholder('🔍 Choisissez une catégorie à explorer...')
    .addOptions(
      Object.keys(categories).map(category => ({
        label: category.replace(/^.{2}\s/, ''), // Enlever l'emoji pour le label
        description: `${categories[category].length} commande${categories[category].length > 1 ? 's' : ''} disponible${categories[category].length > 1 ? 's' : ''}`,
        value: category,
        emoji: category.split(' ')[0] // Utiliser l'emoji comme emoji de l'option
      }))
    );

  // Boutons d'action
  const buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_all_commands')
        .setLabel('📋 Liste Complète')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_search')
        .setLabel('🔍 Rechercher')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_stats')
        .setLabel('📊 Statistiques')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('help_refresh')
        .setLabel('🔄 Actualiser')
        .setStyle(ButtonStyle.Success)
    );

  const selectRow = new ActionRowBuilder().addComponents(selectMenu);

  await interaction.reply({
    embeds: [embed],
    components: [selectRow, buttons],
    ephemeral: false
  });
}

// Affiche l'aide pour une commande spécifique
async function showSpecificCommandHelp(interaction, commandName) {
  const commands = await loadAllCommands();
  const command = commands.find(cmd => cmd.name.toLowerCase() === commandName.toLowerCase());
  
  if (!command) {
    const embed = new EmbedBuilder()
      .setTitle('❌ Commande Introuvable')
      .setDescription(`La commande \`${commandName}\` n'existe pas.\n\nUtilisez \`/help\` pour voir toutes les commandes disponibles.`)
      .setColor('#ff6b6b');
    
    return await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Charger les détails complets de la commande
  try {
    const fullCommand = await import(`./${command.file}`);
    const commandData = fullCommand.data;
    
    const embed = new EmbedBuilder()
      .setTitle(`📖 Aide - /${command.name}`)
      .setDescription(command.description)
      .setColor('#339af0')
      .setTimestamp();

    // Informations de base
    embed.addFields({
      name: '📂 Catégorie',
      value: command.category,
      inline: true
    });

    // Permissions requises
    if (command.permissions) {
      const permissions = getPermissionNames(command.permissions);
      embed.addFields({
        name: '🔐 Permissions Requises',
        value: permissions.join(', ') || 'Aucune',
        inline: true
      });
    }

    // Sous-commandes
    const subcommands = commandData.options?.filter(opt => opt.type === 1) || [];
    if (subcommands.length > 0) {
      let subcommandList = '';
      subcommands.forEach(sub => {
        subcommandList += `**/${command.name} ${sub.name}**\n${sub.description}\n\n`;
      });
      
      embed.addFields({
        name: `🔧 Sous-commandes (${subcommands.length})`,
        value: subcommandList.substring(0, 1024), // Limite Discord
        inline: false
      });
    }

    // Options principales (non sous-commandes)
    const mainOptions = commandData.options?.filter(opt => opt.type !== 1) || [];
    if (mainOptions.length > 0) {
      let optionsList = '';
      mainOptions.forEach(opt => {
        const required = opt.required ? '**[Requis]**' : '*[Optionnel]*';
        const type = getOptionTypeName(opt.type);
        optionsList += `**${opt.name}** (${type}) ${required}\n${opt.description}\n\n`;
      });
      
      embed.addFields({
        name: `⚙️ Options (${mainOptions.length})`,
        value: optionsList.substring(0, 1024),
        inline: false
      });
    }

    // Exemples d'utilisation
    const examples = generateUsageExamples(command.name, commandData);
    if (examples.length > 0) {
      embed.addFields({
        name: '💡 Exemples d\'utilisation',
        value: examples.join('\n'),
        inline: false
      });
    }

    // Bouton pour revenir au menu principal
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('help_back_to_main')
          .setLabel('← Retour au menu principal')
          .setStyle(ButtonStyle.Secondary)
      );

    await interaction.reply({
      embeds: [embed],
      components: [backButton],
      ephemeral: false
    });

  } catch (error) {
    console.error(`Erreur lors du chargement des détails de ${commandName}:`, error);
    
    const embed = new EmbedBuilder()
      .setTitle('❌ Erreur')
      .setDescription(`Impossible de charger les détails de la commande \`${commandName}\`.`)
      .setColor('#ff6b6b');
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}

// Génère des exemples d'utilisation
function generateUsageExamples(commandName, commandData) {
  const examples = [];
  
  // Exemples basés sur le nom de la commande
  switch (commandName) {
    case 'moderation':
      examples.push(
        '`/moderation ban @utilisateur Spam répété`',
        '`/moderation clear 10`',
        '`/moderation timeout @membre 1h Comportement inapproprié`'
      );
      break;
    case 'config':
      examples.push(
        '`/config channel logs #logs-channel`',
        '`/config role moderator @Modérateur`',
        '`/config show`'
      );
      break;
    case 'ticket':
      examples.push(
        '`/ticket create Support technique`',
        '`/ticket close Problème résolu`'
      );
      break;
    case 'balance':
      examples.push(
        '`/balance` - Voir votre solde',
        '`/balance @utilisateur` - Voir le solde d\'un autre utilisateur'
      );
      break;
    case 'giveaway':
      examples.push(
        '`/giveaway 1h 1 Nitro Discord` - Giveaway d\'1 heure',
        '`/giveaway 3d 2 Jeux Steam` - Giveaway de 3 jours'
      );
      break;
    default:
      // Exemple générique basé sur les options
      if (commandData.options && commandData.options.length > 0) {
        const requiredOptions = commandData.options.filter(opt => opt.required);
        if (requiredOptions.length > 0) {
          const exampleOptions = requiredOptions.map(opt => `<${opt.name}>`).join(' ');
          examples.push(`\`/${commandName} ${exampleOptions}\``);
        }
      } else {
        examples.push(`\`/${commandName}\``);
      }
  }
  
  return examples;
}

// Convertit les types d'options en noms lisibles
function getOptionTypeName(type) {
  const types = {
    1: 'Sous-commande',
    2: 'Groupe de sous-commandes',
    3: 'Texte',
    4: 'Nombre entier',
    5: 'Booléen',
    6: 'Utilisateur',
    7: 'Canal',
    8: 'Rôle',
    9: 'Mentionnable',
    10: 'Nombre décimal',
    11: 'Fichier'
  };
  return types[type] || 'Inconnu';
}

// Convertit les permissions en noms lisibles
function getPermissionNames(permissions) {
  const permissionNames = {
    'Administrator': 'Administrateur',
    'ManageGuild': 'Gérer le serveur',
    'ManageChannels': 'Gérer les salons',
    'ManageRoles': 'Gérer les rôles',
    'ManageMessages': 'Gérer les messages',
    'ModerateMembers': 'Modérer les membres',
    'KickMembers': 'Expulser des membres',
    'BanMembers': 'Bannir des membres'
  };
  
  // Si permissions est un BigInt, le convertir
  if (typeof permissions === 'bigint') {
    // Logique pour convertir BigInt en noms de permissions
    // Pour simplifier, on retourne "Permissions spéciales"
    return ['Permissions spéciales'];
  }
  
  return ['Permissions requises'];
}

// Gestionnaire d'interactions pour les boutons et menus
export async function handleHelpInteraction(interaction) {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  // Gérer les boutons de pagination d'aide pour les commandes préfixe
  if (interaction.isButton() && 
      ['help_first', 'help_prev', 'help_next', 'help_last'].includes(interaction.customId)) {
    
    // Les boutons de pagination sont gérés directement dans messageCreate.js
    // Cette fonction est appelée par interactionCreate.js mais n'a pas besoin de faire quoi que ce soit
    // car le collecteur dans messageCreate.js s'occupe déjà de la pagination
    
    // Si nous arrivons ici, c'est que l'interaction n'a pas été traitée par le collecteur
    // Cela peut arriver si le collecteur a expiré ou si l'interaction provient d'un autre contexte
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "Cette interaction n'est plus valide. Veuillez utiliser à nouveau la commande d'aide.",
        ephemeral: true
      });
    }
    return;
  }

  // Gérer les autres interactions d'aide (pour les commandes slash)
  const commands = await loadAllCommands();
  
  if (interaction.customId === 'help_all_commands') {
    await showAllCommandsList(interaction, commands);
  } else if (interaction.customId === 'help_category_select') {
    const selectedCategory = interaction.values[0];
    await showCategoryCommands(interaction, selectedCategory, commands);
  } else if (interaction.customId === 'help_back_to_main') {
    await showMainHelpInterface(interaction);
  } else if (interaction.customId === 'help_refresh') {
    await showMainHelpInterface(interaction);
  } else if (interaction.customId === 'help_search') {
    await showSearchInterface(interaction);
  } else if (interaction.customId === 'help_stats') {
    await showDetailedStats(interaction, commands);
  }
}

// Affiche toutes les commandes
async function showAllCommandsList(interaction, commands) {
  const embed = new EmbedBuilder()
    .setTitle('📋 Liste Complète des Commandes')
    .setDescription(`**${commands.length} commandes disponibles**\n\nUtilisez \`/help <commande>\` pour plus de détails.`)
    .setColor('#339af0')
    .setTimestamp();

  // Diviser les commandes en chunks pour respecter les limites Discord
  const chunks = [];
  for (let i = 0; i < commands.length; i += 10) {
    chunks.push(commands.slice(i, i + 10));
  }

  chunks.forEach((chunk, index) => {
    const commandList = chunk.map(cmd => 
      `**/${cmd.name}** - ${cmd.description.substring(0, 60)}${cmd.description.length > 60 ? '...' : ''}`
    ).join('\n');
    
    embed.addFields({
      name: index === 0 ? '🎯 Commandes' : '\u200b',
      value: commandList,
      inline: false
    });
  });

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_to_main')
        .setLabel('← Retour au menu principal')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({
    embeds: [embed],
    components: [backButton]
  });
}

// Affiche les commandes d'une catégorie
async function showCategoryCommands(interaction, category, commands) {
  const categoryCommands = commands.filter(cmd => cmd.category === category);
  
  const embed = new EmbedBuilder()
    .setTitle(`${category}`)
    .setDescription(`**${categoryCommands.length} commande${categoryCommands.length > 1 ? 's' : ''} dans cette catégorie**`)
    .setColor('#339af0')
    .setTimestamp();

  categoryCommands.forEach(cmd => {
    let fieldValue = cmd.description;
    
    // Ajouter les sous-commandes si elles existent
    if (cmd.options && cmd.options.length > 0) {
      const subcommands = cmd.options.filter(opt => opt.type === 1);
      if (subcommands.length > 0) {
        fieldValue += `\n**Sous-commandes:** ${subcommands.map(sub => sub.name).join(', ')}`;
      }
    }
    
    embed.addFields({
      name: `/${cmd.name}`,
      value: fieldValue.substring(0, 1024),
      inline: false
    });
  });

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_to_main')
        .setLabel('← Retour au menu principal')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({
    embeds: [embed],
    components: [backButton]
  });
}

// Interface de recherche (placeholder)
async function showSearchInterface(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🔍 Recherche de Commandes')
    .setDescription('**Fonctionnalité de recherche**\n\nPour rechercher une commande spécifique, utilisez :\n`/help <nom_de_commande>`\n\nVous pouvez également utiliser l\'autocomplétion en tapant `/help` et en commençant à taper le nom de la commande.')
    .setColor('#339af0');

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_to_main')
        .setLabel('← Retour au menu principal')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({
    embeds: [embed],
    components: [backButton]
  });
}

// Affiche des statistiques détaillées
async function showDetailedStats(interaction, commands) {
  const stats = calculateCommandStats(commands);
  const categories = {};
  
  // Grouper par catégories pour les stats
  commands.forEach(cmd => {
    if (!categories[cmd.category]) {
      categories[cmd.category] = [];
    }
    categories[cmd.category].push(cmd);
  });

  const embed = new EmbedBuilder()
    .setTitle('📊 Statistiques Détaillées des Commandes')
    .setDescription('**Analyse complète du système de commandes HmmBot**')
    .setColor('#339af0')
    .setTimestamp();

  // Statistiques générales
  embed.addFields({
    name: '📈 Statistiques Générales',
    value: `🎯 **${commands.length}** commandes au total\n` +
           `🔧 **${stats.subcommands}** sous-commandes\n` +
           `⚙️ **${stats.totalOptions}** options au total\n` +
           `⚡ **${stats.withPermissions}** commandes avec permissions\n` +
           `📊 **${stats.averageOptionsPerCommand}** options par commande (moyenne)`,
    inline: false
  });

  // Top 5 des catégories les plus fournies
  const topCategories = Object.entries(categories)
    .sort(([,a], [,b]) => b.length - a.length)
    .slice(0, 5);

  const topCategoriesText = topCategories.map(([category, cmds], index) => {
    const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
    return `${emoji} ${category}: **${cmds.length}** commandes`;
  }).join('\n');

  embed.addFields({
    name: '🏆 Top 5 des Catégories',
    value: topCategoriesText,
    inline: true
  });

  // Commandes les plus complexes (avec le plus de sous-commandes)
  const complexCommands = commands
    .filter(cmd => cmd.options && cmd.options.some(opt => opt.type === 1))
    .sort((a, b) => {
      const aSubcommands = a.options?.filter(opt => opt.type === 1).length || 0;
      const bSubcommands = b.options?.filter(opt => opt.type === 1).length || 0;
      return bSubcommands - aSubcommands;
    })
    .slice(0, 5);

  if (complexCommands.length > 0) {
    const complexCommandsText = complexCommands.map((cmd, index) => {
      const emoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][index];
      const subCount = cmd.options?.filter(opt => opt.type === 1).length || 0;
      return `${emoji} **/${cmd.name}**: ${subCount} sous-commandes`;
    }).join('\n');

    embed.addFields({
      name: '🔧 Commandes les Plus Complexes',
      value: complexCommandsText,
      inline: true
    });
  }

  // Répartition par type de fonctionnalité
  const functionalityStats = {
    'Modération': commands.filter(cmd => cmd.category.includes('Modération')).length,
    'Économie': commands.filter(cmd => cmd.category.includes('Économie')).length,
    'Tickets': commands.filter(cmd => cmd.category.includes('Tickets')).length,
    'Administration': commands.filter(cmd => cmd.category.includes('Administration') || cmd.category.includes('Configuration')).length,
    'Autres': commands.filter(cmd => !cmd.category.includes('Modération') && !cmd.category.includes('Économie') && !cmd.category.includes('Tickets') && !cmd.category.includes('Administration') && !cmd.category.includes('Configuration')).length
  };

  const functionalityText = Object.entries(functionalityStats)
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `**${type}**: ${count} commandes`)
    .join('\n');

  embed.addFields({
    name: '🎯 Répartition Fonctionnelle',
    value: functionalityText,
    inline: false
  });

  // Informations techniques
  embed.addFields({
    name: '⚙️ Informations Techniques',
    value: `📁 **${Object.keys(categories).length}** catégories définies\n` +
           `🔄 Chargement dynamique activé\n` +
           `🔍 Autocomplétion supportée\n` +
           `📱 Interface interactive complète\n` +
           `🛡️ Gestion d'erreurs intégrée`,
    inline: false
  });

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_back_to_main')
        .setLabel('← Retour au menu principal')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({
    embeds: [embed],
    components: [backButton]
  });
}