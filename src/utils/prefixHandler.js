import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApplicationCommandOptionType } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../../config.json');

export class PrefixCommandHandler {
  constructor(client) {
    this.client = client;
    this.loadConfig();
    this.commandCache = new Map(); // Cache pour les commandes et leurs options
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      this.config = JSON.parse(configData);
      
      // Initialiser la configuration du préfixe si elle n'existe pas
      if (!this.config.prefix_system) {
        this.config.prefix_system = {
          enabled: false,
          prefix: '!',
          help_enabled: true
        };
        this.saveConfig();
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      this.config = {
        prefix_system: {
          enabled: false,
          prefix: '!',
          help_enabled: true
        }
      };
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
    }
  }

  // Obtenir les données de préfixe pour un serveur
  async getPrefixData(guildId) {
    if (!this.config.prefix_system) {
      return null;
    }

    return this.config.prefix_system;
  }

  // Configurer le préfixe pour un serveur
  setPrefixConfig(guildId, enabled, prefix, helpEnabled = null) {
    if (!this.config.prefix_system) {
      this.config.prefix_system = {
        help_enabled: true
      };
    }

    this.config.prefix_system.enabled = enabled;
    this.config.prefix_system.prefix = prefix;
    
    // Mettre à jour help_enabled seulement si fourni
    if (helpEnabled !== null) {
      this.config.prefix_system.help_enabled = helpEnabled;
    } else if (this.config.prefix_system.help_enabled === undefined) {
      // Valeur par défaut si non définie
      this.config.prefix_system.help_enabled = true;
    }
    
    this.saveConfig();
    
    // Log de la configuration
    console.log(`[PREFIX] Configuration mise à jour: enabled=${enabled}, prefix=${prefix}, help_enabled=${this.config.prefix_system.help_enabled}`);
  }

  // Créer une interaction factice à partir d'un message avec préfixe
  async createFakeInteraction(message, command, args) {
    try {
      const commandData = command.data.toJSON();
      
      // Mettre en cache les données de commande pour une utilisation future
      this.commandCache.set(commandData.name, commandData);
      
      // Créer l'objet interaction factice
      const fakeInteraction = {
        // Propriétés de base
        user: message.author,
        member: message.member,
        guild: message.guild,
        channel: message.channel,
        channelId: message.channel.id,
        guildId: message.guild.id,
        applicationId: this.client.application.id,
        commandName: commandData.name,
        commandType: 1,
        type: 2,
        replied: false,
        deferred: false,
        ephemeral: false,
        
        // Méthodes de réponse
        reply: async (options) => {
          if (fakeInteraction.replied || fakeInteraction.deferred) {
            throw new Error('Interaction déjà répondue');
          }
          
          fakeInteraction.replied = true;
          
          if (typeof options === 'string') {
            return await message.reply(options);
          } else {
            return await message.reply(options);
          }
        },
        
        editReply: async (options) => {
          if (!fakeInteraction.replied && !fakeInteraction.deferred) {
            throw new Error('Interaction non répondue');
          }
          
          if (typeof options === 'string') {
            return await message.reply(options);
          } else {
            return await message.reply(options);
          }
        },
        
        followUp: async (options) => {
          if (!fakeInteraction.replied && !fakeInteraction.deferred) {
            throw new Error('Interaction non répondue');
          }
          
          if (typeof options === 'string') {
            return await message.reply(options);
          } else {
            return await message.reply(options);
          }
        },
        
        deferReply: async (options = {}) => {
          if (fakeInteraction.replied || fakeInteraction.deferred) {
            throw new Error('Interaction déjà répondue');
          }
          
          fakeInteraction.deferred = true;
          fakeInteraction.ephemeral = options.ephemeral || false;
          
          // Réagir au message pour indiquer que la commande est en cours
          await message.react('⏳');
          
          return Promise.resolve();
        },
        
        showModal: async (modal) => {
          throw new Error('Les modales ne sont pas supportées avec les commandes préfixe');
        },
        
        // Méthodes pour obtenir les options
        getSubcommand: function(required = true) {
          const subcommandGroup = this.options.getSubcommandGroup(false);
          const subcommand = this.options.getSubcommand(false);
          
          if (subcommandGroup && subcommand) {
            return `${subcommandGroup} ${subcommand}`;
          } else if (subcommand) {
            return subcommand;
          } else if (required) {
            throw new Error('Sous-commande requise');
          }
          return null;
        },
        
        getSubcommandGroup: function(required = true) {
          const group = this.options.getSubcommandGroup(false);
          if (!group && required) {
            throw new Error('Groupe de sous-commandes requis');
          }
          return group;
        },
      };

      // Créer l'objet options avec les méthodes nécessaires
      fakeInteraction.options = this.createOptionsObject(commandData.options || [], args, this.client, message.guild);

      return fakeInteraction;
    } catch (error) {
      console.error('Erreur lors de la création de l\'interaction factice:', error);
      return null;
    }
  }
  
  // Générer un message d'aide pour une commande
  generateCommandHelp(commandName) {
    const commandData = this.commandCache.get(commandName);
    if (!commandData) return null;
    
    const prefixData = this.config.prefix_system;
    const prefix = prefixData?.prefix || '!';
    
    let helpText = `**Commande: ${prefix}${commandName}**\n`;
    helpText += `${commandData.description || 'Aucune description disponible'}\n\n`;
    
    // Vérifier si la commande a beaucoup de sous-commandes
    const hasManySubs = commandData.options && 
                        (commandData.options.length > 15 || 
                         commandData.options.filter(opt => opt.type === ApplicationCommandOptionType.Subcommand).length > 8);
    
    // Si la commande a beaucoup de sous-commandes, limiter l'affichage
    if (hasManySubs) {
      helpText += '**Sous-commandes:**\n';
      helpText += 'Cette commande a de nombreuses sous-commandes. Voici les principales:\n';
      
      // Afficher seulement les 5 premières sous-commandes
      const subcommands = commandData.options.filter(opt => opt.type === ApplicationCommandOptionType.Subcommand).slice(0, 5);
      subcommands.forEach(subcommand => {
        helpText += `\`${prefix}${commandName} ${subcommand.name}\` - ${subcommand.description || 'Aucune description'}\n`;
      });
      
      helpText += `\n*Utilisez \`${prefix}help ${commandName} <sous-commande>\` pour plus de détails sur une sous-commande.*`;
    }
    // Sinon, afficher toutes les sous-commandes
    else if (commandData.options && commandData.options.some(opt => opt.type === ApplicationCommandOptionType.Subcommand)) {
      helpText += '**Sous-commandes:**\n';
      
      commandData.options.filter(opt => opt.type === ApplicationCommandOptionType.Subcommand).forEach(subcommand => {
        helpText += `\`${prefix}${commandName} ${subcommand.name}\` - ${subcommand.description || 'Aucune description'}\n`;
        
        // Ajouter les options de la sous-commande (limiter pour éviter les messages trop longs)
        if (subcommand.options && subcommand.options.length > 0) {
          helpText += '  **Options:**\n';
          // Limiter à 3 options par sous-commande pour éviter les messages trop longs
          const displayOptions = subcommand.options.slice(0, 3);
          displayOptions.forEach(option => {
            const required = option.required ? '<obligatoire>' : '[optionnel]';
            helpText += `  \`${option.name}\` ${required} - ${option.description || 'Aucune description'}\n`;
          });
          
          if (subcommand.options.length > 3) {
            helpText += `  *...et ${subcommand.options.length - 3} autres options*\n`;
          }
        }
      });
    } 
    // Ajouter les options directes si elles existent
    else if (commandData.options && commandData.options.length > 0) {
      helpText += '**Options:**\n';
      
      commandData.options.forEach(option => {
        const required = option.required ? '<obligatoire>' : '[optionnel]';
        helpText += `\`${option.name}\` ${required} - ${option.description || 'Aucune description'}\n`;
      });
    }
    
    helpText += `\n**Utilisation:** \`${prefix}${commandName} [sous-commande] [options]\``;
    
    return helpText;
  }
  
  // Générer des pages d'aide pour une commande avec beaucoup de sous-commandes
  generateCommandHelpPages(commandName, pageSize = 10) {
    const commandData = this.commandCache.get(commandName);
    if (!commandData) return null;
    
    const prefixData = this.config.prefix_system;
    const prefix = prefixData?.prefix || '!';
    
    // Créer l'en-tête commun à toutes les pages
    const header = `**Commande: ${prefix}${commandName}**\n${commandData.description || 'Aucune description disponible'}\n\n`;
    
    const pages = [];
    
    // Si la commande a des sous-commandes
    if (commandData.options && commandData.options.some(opt => opt.type === ApplicationCommandOptionType.Subcommand)) {
      const subcommands = commandData.options.filter(opt => opt.type === ApplicationCommandOptionType.Subcommand);
      
      // Diviser les sous-commandes en pages
      for (let i = 0; i < subcommands.length; i += pageSize) {
        const pageSubcommands = subcommands.slice(i, i + pageSize);
        let pageContent = header + '**Sous-commandes:**\n';
        
        pageSubcommands.forEach(subcommand => {
          pageContent += `\`${prefix}${commandName} ${subcommand.name}\` - ${subcommand.description || 'Aucune description'}\n`;
          
          // Ajouter les options de la sous-commande
          if (subcommand.options && subcommand.options.length > 0) {
            pageContent += '  **Options:**\n';
            subcommand.options.forEach(option => {
              const required = option.required ? '<obligatoire>' : '[optionnel]';
              pageContent += `  \`${option.name}\` ${required} - ${option.description || 'Aucune description'}\n`;
            });
          }
        });
        
        // Ajouter la pagination
        const currentPage = Math.floor(i / pageSize) + 1;
        const totalPages = Math.ceil(subcommands.length / pageSize);
        pageContent += `\n**Page ${currentPage}/${totalPages}** • Utilisez les boutons pour naviguer`;
        
        pages.push(pageContent);
      }
    } 
    // Si la commande a des options directes
    else if (commandData.options && commandData.options.length > 0) {
      const options = commandData.options;
      
      // Diviser les options en pages
      for (let i = 0; i < options.length; i += pageSize) {
        const pageOptions = options.slice(i, i + pageSize);
        let pageContent = header + '**Options:**\n';
        
        pageOptions.forEach(option => {
          const required = option.required ? '<obligatoire>' : '[optionnel]';
          pageContent += `\`${option.name}\` ${required} - ${option.description || 'Aucune description'}\n`;
        });
        
        // Ajouter la pagination
        const currentPage = Math.floor(i / pageSize) + 1;
        const totalPages = Math.ceil(options.length / pageSize);
        pageContent += `\n**Page ${currentPage}/${totalPages}** • Utilisez les boutons pour naviguer`;
        
        pages.push(pageContent);
      }
    }
    
    // Si aucune page n'a été créée, ajouter une page par défaut
    if (pages.length === 0) {
      pages.push(header + `**Utilisation:** \`${prefix}${commandName} [options]\``);
    } else {
      // Ajouter l'utilisation à la dernière page
      pages[pages.length - 1] += `\n\n**Utilisation:** \`${prefix}${commandName} [sous-commande] [options]\``;
    }
    
    return pages;
  }

  // Créer l'objet options avec les méthodes pour récupérer les valeurs
  createOptionsObject(commandOptions, args, client, guild) {
    const parsedOptions = this.parseOptionsFromArgs(commandOptions, args);
    
    return {
      _options: parsedOptions,
      _client: client,
      _guild: guild,
      
      get: function(name) {
        const option = this._options.find(opt => opt.name === name);
        return option ? { value: option.value, type: option.type } : null;
      },
      
      getString: function(name, required = false) {
        const option = this.get(name);
        if (!option && required) {
          throw new Error(`Option string requise: ${name}`);
        }
        return option ? String(option.value) : null;
      },
      
      getInteger: function(name, required = false) {
        const option = this.get(name);
        if (!option && required) {
          throw new Error(`Option integer requise: ${name}`);
        }
        return option ? parseInt(option.value) : null;
      },
      
      getNumber: function(name, required = false) {
        const option = this.get(name);
        if (!option && required) {
          throw new Error(`Option number requise: ${name}`);
        }
        return option ? parseFloat(option.value) : null;
      },
      
      getBoolean: function(name, required = false) {
        const option = this.get(name);
        if (!option && required) {
          throw new Error(`Option boolean requise: ${name}`);
        }
        if (!option) return null;
        
        const value = String(option.value).toLowerCase();
        return value === 'true' || value === '1' || value === 'yes' || value === 'on';
      },
      
      getUser: function(name, required = false) {
        const option = this.get(name);
        if (!option && required) {
          throw new Error(`Option user requise: ${name}`);
        }
        if (!option) return null;
        
        // Extraire l'ID utilisateur de la mention
        const userId = String(option.value).replace(/[<@!>]/g, '');
        return this._client?.users.cache.get(userId) || null;
      },
      
      getMember: function(name, required = false) {
        const option = this.get(name);
        if (!option && required) {
          throw new Error(`Option member requise: ${name}`);
        }
        if (!option) return null;
        
        // Extraire l'ID utilisateur de la mention
        const userId = String(option.value).replace(/[<@!>]/g, '');
        return this._guild?.members.cache.get(userId) || null;
      },
      
      getChannel: function(name, required = false) {
        const option = this.get(name);
        if (!option && required) {
          throw new Error(`Option channel requise: ${name}`);
        }
        if (!option) return null;
        
        // Extraire l'ID du salon de la mention
        const channelId = String(option.value).replace(/[<#>]/g, '');
        return this._guild?.channels.cache.get(channelId) || null;
      },
      
      getRole: function(name, required = false) {
        const option = this.get(name);
        if (!option && required) {
          throw new Error(`Option role requise: ${name}`);
        }
        if (!option) return null;
        
        // Extraire l'ID du rôle de la mention
        const roleId = String(option.value).replace(/[<@&>]/g, '');
        return this._guild?.roles.cache.get(roleId) || null;
      },
      
      getSubcommand: function(required = true) {
        const subcommand = this._options.find(opt => opt.type === ApplicationCommandOptionType.Subcommand);
        if (!subcommand && required) {
          throw new Error('Sous-commande requise');
        }
        return subcommand ? subcommand.name : null;
      },
      
      getSubcommandGroup: function(required = true) {
        const group = this._options.find(opt => opt.type === ApplicationCommandOptionType.SubcommandGroup);
        if (!group && required) {
          throw new Error('Groupe de sous-commandes requis');
        }
        return group ? group.name : null;
      }
    };
  }

  // Parser les arguments en options
  parseOptionsFromArgs(commandOptions, args) {
    const parsedOptions = [];
    let argIndex = 0;

    // Gérer les sous-commandes
    if (commandOptions.length > 0 && commandOptions[0].type === ApplicationCommandOptionType.Subcommand) {
      const subcommandName = args[0];
      const subcommand = commandOptions.find(opt => opt.name === subcommandName);
      
      if (subcommand) {
        parsedOptions.push({
          name: subcommand.name,
          type: ApplicationCommandOptionType.Subcommand,
          value: subcommand.name
        });
        
        // Parser les options de la sous-commande
        if (subcommand.options) {
          const subArgs = args.slice(1);
          const subOptions = this.parseOptionsFromArgs(subcommand.options, subArgs);
          parsedOptions.push(...subOptions);
        }
        
        return parsedOptions;
      }
    }

    // Gérer les groupes de sous-commandes
    if (commandOptions.length > 0 && commandOptions[0].type === ApplicationCommandOptionType.SubcommandGroup) {
      const groupName = args[0];
      const subcommandName = args[1];
      
      const group = commandOptions.find(opt => opt.name === groupName);
      if (group && group.options) {
        const subcommand = group.options.find(opt => opt.name === subcommandName);
        if (subcommand) {
          parsedOptions.push({
            name: group.name,
            type: ApplicationCommandOptionType.SubcommandGroup,
            value: group.name
          });
          
          parsedOptions.push({
            name: subcommand.name,
            type: ApplicationCommandOptionType.Subcommand,
            value: subcommand.name
          });
          
          if (subcommand.options) {
            const subArgs = args.slice(2);
            const subOptions = this.parseOptionsFromArgs(subcommand.options, subArgs);
            parsedOptions.push(...subOptions);
          }
          
          return parsedOptions;
        }
      }
    }

    // Parser les options normales
    for (const option of commandOptions) {
      if (option.type === ApplicationCommandOptionType.Subcommand || 
          option.type === ApplicationCommandOptionType.SubcommandGroup) {
        continue;
      }

      let value = null;
      
      if (argIndex < args.length) {
        value = args[argIndex];
        argIndex++;
      } else if (option.required) {
        throw new Error(`Option requise manquante: ${option.name}`);
      }

      if (value !== null) {
        parsedOptions.push({
          name: option.name,
          type: option.type,
          value: this.convertValue(value, option.type)
        });
      }
    }

    return parsedOptions;
  }

  // Convertir une valeur selon le type
  convertValue(value, type) {
    switch (type) {
      case ApplicationCommandOptionType.String:
        return String(value);
      case ApplicationCommandOptionType.Integer:
        return parseInt(value);
      case ApplicationCommandOptionType.Number:
        return parseFloat(value);
      case ApplicationCommandOptionType.Boolean:
        const boolValue = String(value).toLowerCase();
        return boolValue === 'true' || boolValue === '1' || boolValue === 'yes' || boolValue === 'on';
      default:
        return value;
    }
  }
}