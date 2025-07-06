import { Logger } from '../utils/logger.js';
import { PrefixCommandHandler } from '../utils/prefixHandler.js';
import { EmbedBuilder } from 'discord.js';

export const name = 'messageCreate';

export async function execute(message, client) {
  // Ignorer les messages du bot
  if (message.author.bot) return;

  // Vérifier si c'est un message en DM
  if (!message.guild) return;

  // Initialiser le gestionnaire de préfixe
  const prefixHandler = new PrefixCommandHandler(client);
  
  // Vérifier si le message commence par un préfixe configuré
  const prefixData = await prefixHandler.getPrefixData(message.guild.id);
  
  if (!prefixData || !prefixData.enabled) return;

  // Vérifier si le message commence par le préfixe
  if (!message.content.startsWith(prefixData.prefix)) return;

  // Extraire la commande et les arguments
  const args = message.content.slice(prefixData.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  // Commande d'aide spéciale
  if (commandName === 'help' && prefixData.help_enabled) {
    await handleHelpCommand(message, client, prefixHandler, prefixData, args);
    return;
  }

  // Vérifier si la commande existe
  const command = client.commands.get(commandName);
  if (!command) {
    // Commande non trouvée, on ne fait rien
    return;
  }

  try {
    // Vérifier si l'argument est "help" pour afficher l'aide de la commande
    if (args.length === 1 && args[0].toLowerCase() === 'help') {
      const helpText = prefixHandler.generateCommandHelp(commandName);
      if (helpText) {
        await message.reply(helpText);
        return;
      }
    }
    
    // Convertir les arguments en interaction factice
    const fakeInteraction = await prefixHandler.createFakeInteraction(message, command, args);
    
    if (!fakeInteraction) {
      // Créer un embed stylisé pour l'erreur
      const { EmbedBuilder } = await import('discord.js');
      const errorEmbed = new EmbedBuilder()
        .setTitle('⚠️ Erreur de commande préfixe')
        .setDescription(`La commande \`${prefixData.prefix}${commandName}\` n'a pas pu être exécutée correctement.`)
        .addFields(
          { name: '📝 Problème', value: 'Impossible de convertir les arguments pour cette commande.' },
          { name: '💡 Solution recommandée', value: `Utilisez plutôt la commande slash \`/${commandName}\` qui est plus stable et guidée.` },
          { name: '🧪 Note', value: 'Le système de commandes préfixe est actuellement en version **BÊTA** et peut présenter des instabilités.' }
        )
        .setColor('#f59f00')
        .setFooter({ text: 'Système de préfixe • Version bêta' })
        .setTimestamp();
      
      await message.reply({ embeds: [errorEmbed] });
      return;
    }

    // Exécuter la commande
    await command.execute(fakeInteraction);
    
    // Log l'utilisation de la commande
    console.log(`\x1b[36m[PREFIX]\x1b[0m ${prefixData.prefix}${commandName} exécutée par ${message.author.tag}`);
    
    await Logger.log(client, 'COMMAND', {
      user: message.author.tag,
      command: `${prefixData.prefix}${commandName}`,
      channel: message.channel.name || 'Unknown',
      type: 'prefix'
    });

  } catch (error) {
    console.error(`Erreur lors de l'exécution de la commande préfixe ${commandName}:`, error);
    
    try {
      // Importer EmbedBuilder
      const { EmbedBuilder } = await import('discord.js');
      
      // Vérifier si l'erreur est liée à des arguments manquants
      if (error.message && error.message.includes('requise')) {
        // Utiliser la pagination pour les messages d'aide longs
        const helpText = prefixHandler.generateCommandHelp(commandName);
        if (helpText) {
          // Vérifier si le message d'aide est trop long
          if (helpText.length > 1500) {
            await sendPaginatedHelp(message, prefixHandler, commandName);
          } else {
            // Créer un embed pour l'erreur d'argument manquant
            const errorEmbed = new EmbedBuilder()
              .setTitle('⚠️ Argument manquant')
              .setDescription(`La commande \`${prefixData.prefix}${commandName}\` nécessite des arguments supplémentaires.`)
              .addFields(
                { name: '📝 Erreur', value: `\`${error.message}\`` },
                { name: '💡 Solution recommandée', value: `Utilisez la commande slash \`/${commandName}\` qui guide l'entrée des paramètres.` },
                { name: '🧪 Note', value: 'Le système de commandes préfixe est en version **BÊTA** et peut présenter des instabilités.' },
                { name: '📚 Aide de la commande', value: helpText.length > 1024 ? helpText.substring(0, 1021) + '...' : helpText }
              )
              .setColor('#f59f00')
              .setFooter({ text: 'Système de préfixe • Version bêta' })
              .setTimestamp();
            
            await message.reply({ embeds: [errorEmbed] });
          }
          return;
        }
      }
      
      // Embed d'erreur générique
      const genericErrorEmbed = new EmbedBuilder()
        .setTitle('❌ Erreur d\'exécution')
        .setDescription(`La commande \`${prefixData.prefix}${commandName}\` a rencontré une erreur lors de son exécution.`)
        .addFields(
          { name: '📝 Détails', value: error.message ? `\`${error.message}\`` : 'Erreur inconnue' },
          { name: '💡 Alternative', value: `Essayez plutôt la commande slash \`/${commandName}\` qui est plus stable.` },
          { name: '🧪 Note', value: 'Le système de commandes préfixe est en version **BÊTA**. Merci de signaler ce problème.' }
        )
        .setColor('#f04747')
        .setFooter({ text: 'Système de préfixe • Version bêta' })
        .setTimestamp();
      
      await message.reply({ embeds: [genericErrorEmbed] });
    } catch (replyError) {
      console.error('Impossible de répondre au message:', replyError.message);
      // Tenter une réponse simple en cas d'échec de l'embed
      try {
        await message.reply('❌ Erreur lors de l\'exécution de la commande. Utilisez plutôt les commandes slash (/).');
      } catch (e) {
        console.error('Échec total de la réponse:', e.message);
      }
    }
  }
}

// Gestion de la commande d'aide
async function handleHelpCommand(message, client, prefixHandler, prefixData, args) {
  const prefix = prefixData.prefix;
  
  // Si un argument est fourni, afficher l'aide pour cette commande spécifique
  if (args.length > 0) {
    const commandName = args[0].toLowerCase();
    const command = client.commands.get(commandName);
    
    if (command) {
      try {
        // Vérifier si la commande a beaucoup de sous-commandes
        await prefixHandler.createFakeInteraction(message, command, []);
        const commandData = prefixHandler.commandCache.get(commandName);
        
        // Si la commande a beaucoup de sous-commandes, utiliser la pagination
        if (commandData && commandData.options && 
            (commandData.options.length > 15 || 
             commandData.options.filter(opt => opt.type === 1).length > 10)) {
          
          await sendPaginatedHelp(message, prefixHandler, commandName);
          return;
        }
        
        // Sinon, utiliser l'affichage normal
        const helpText = prefixHandler.generateCommandHelp(commandName);
        if (helpText) {
          await message.reply(helpText);
          return;
        }
      } catch (error) {
        console.error(`Erreur lors de la génération de l'aide pour ${commandName}:`, error);
        // Continuer avec l'affichage normal en cas d'erreur
        const helpText = prefixHandler.generateCommandHelp(commandName);
        if (helpText) {
          await message.reply(helpText);
          return;
        }
      }
    }
    
    // Créer un embed pour la commande introuvable
    const { EmbedBuilder } = await import('discord.js');
    const errorEmbed = new EmbedBuilder()
      .setTitle('❓ Commande introuvable')
      .setDescription(`La commande \`${commandName}\` n'existe pas ou n'est pas disponible.`)
      .addFields(
        { name: '💡 Suggestions', value: 'Vérifiez l\'orthographe ou utilisez `/help` pour voir la liste des commandes disponibles.' },
        { name: '🧪 Note', value: 'Le système de commandes préfixe est en version **BÊTA** et peut présenter des limitations.' }
      )
      .setColor('#5865f2')
      .setFooter({ text: 'Système de préfixe • Version bêta' })
      .setTimestamp();
    
    await message.reply({ embeds: [errorEmbed] });
    return;
  }
  
  // Sinon, afficher la liste des commandes disponibles
  const embed = new EmbedBuilder()
    .setTitle('📚 Aide des commandes')
    .setDescription(`Voici la liste des commandes disponibles avec le préfixe \`${prefix}\`.\nUtilisez \`${prefix}help <commande>\` pour plus d'informations sur une commande spécifique.`)
    .setColor('#5865F2')
    .setTimestamp();
  
  // Regrouper les commandes par catégorie
  const categories = {};
  
  for (const [name, cmd] of client.commands.entries()) {
    const category = cmd.category || 'Divers';
    
    if (!categories[category]) {
      categories[category] = [];
    }
    
    categories[category].push(`\`${prefix}${name}\``);
  }
  
  // Ajouter les catégories à l'embed
  for (const [category, commands] of Object.entries(categories)) {
    embed.addFields({ name: category, value: commands.join(', '), inline: false });
  }
  
  // Ajouter un pied de page
  embed.setFooter({ 
    text: `Utilisez les commandes avec le préfixe ${prefix} ou en slash commands /` 
  });
  
  await message.reply({ embeds: [embed] });
}

// Fonction pour envoyer une aide paginée avec des boutons
async function sendPaginatedHelp(message, prefixHandler, commandName) {
  // Générer les pages d'aide
  const pages = prefixHandler.generateCommandHelpPages(commandName);
  if (!pages || pages.length === 0) {
    // Fallback au format standard si la pagination échoue
    const helpText = prefixHandler.generateCommandHelp(commandName);
    if (helpText) {
      await message.reply(helpText);
    } else {
      await message.reply(`❌ Impossible de générer l'aide pour la commande \`${commandName}\`.`);
    }
    return;
  }
  
  // Créer les boutons de navigation
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
  
  let currentPage = 0;
  
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('help_first')
        .setLabel('⏮️ Première')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('help_prev')
        .setLabel('◀️ Précédente')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId('help_next')
        .setLabel('▶️ Suivante')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pages.length <= 1),
      new ButtonBuilder()
        .setCustomId('help_last')
        .setLabel('⏭️ Dernière')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(pages.length <= 1)
    );
  
  // Envoyer le message initial avec les boutons
  const reply = await message.reply({
    content: pages[currentPage],
    components: [row]
  });
  
  // Créer un collecteur pour les interactions avec les boutons
  const filter = i => {
    return i.user.id === message.author.id && 
           ['help_first', 'help_prev', 'help_next', 'help_last'].includes(i.customId);
  };
  
  const collector = reply.createMessageComponentCollector({ 
    filter, 
    time: 300000 // 5 minutes
  });
  
  // Gérer les interactions avec les boutons
  collector.on('collect', async i => {
    // Mettre à jour la page en fonction du bouton cliqué
    if (i.customId === 'help_first') {
      currentPage = 0;
    } else if (i.customId === 'help_prev') {
      currentPage = Math.max(0, currentPage - 1);
    } else if (i.customId === 'help_next') {
      currentPage = Math.min(pages.length - 1, currentPage + 1);
    } else if (i.customId === 'help_last') {
      currentPage = pages.length - 1;
    }
    
    // Mettre à jour l'état des boutons
    row.components[0].setDisabled(currentPage === 0); // Premier
    row.components[1].setDisabled(currentPage === 0); // Précédent
    row.components[2].setDisabled(currentPage === pages.length - 1); // Suivant
    row.components[3].setDisabled(currentPage === pages.length - 1); // Dernier
    
    // Mettre à jour le message
    await i.update({
      content: pages[currentPage],
      components: [row]
    });
  });
  
  // Gérer la fin du collecteur (timeout)
  collector.on('end', async () => {
    try {
      // Désactiver tous les boutons à la fin du temps imparti
      row.components.forEach(button => button.setDisabled(true));
      
      await reply.edit({
        content: pages[currentPage] + "\n\n*Les boutons de navigation ont expiré.*",
        components: [row]
      });
    } catch (error) {
      console.error('Erreur lors de la désactivation des boutons:', error);
    }
  });
}