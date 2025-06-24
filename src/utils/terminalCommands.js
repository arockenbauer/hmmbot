import readline from 'readline';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { Logger } from './logger.js';
import { LogCleaner } from './logCleaner.js';

export class TerminalCommands {
  static client = null;
  static rl = null;
  static isActive = false;
  static commands = new Map();

  static init(client) {
    this.client = client;
    this.setupCommands();
    this.setupReadline();
  }

  static setupReadline() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('🤖 HmmBot > ')
    });

    this.rl.on('line', (input) => {
      this.handleCommand(input.trim());
    });

    this.rl.on('SIGINT', () => {
      console.log(chalk.yellow('\nUtilisez "exit" ou "quit" pour quitter proprement.'));
      this.rl.prompt();
    });
  }

  static setupCommands() {
    // Commande d'aide
    this.commands.set('help', {
      description: 'Affiche cette aide',
      usage: 'help [commande]',
      execute: (args) => this.showHelp(args)
    });

    // Information sur le bot
    this.commands.set('status', {
      description: 'Affiche le statut du bot',
      usage: 'status',
      execute: () => this.showStatus()
    });

    // Lister les serveurs
    this.commands.set('guilds', {
      description: 'Liste tous les serveurs où le bot est présent',
      usage: 'guilds',
      execute: () => this.listGuilds()
    });

    // Afficher les logs récents
    this.commands.set('logs', {
      description: 'Affiche les logs récents',
      usage: 'logs [nombre]',
      execute: (args) => this.showLogs(args)
    });

    // Envoyer un message dans un salon
    this.commands.set('send', {
      description: 'Envoie un message dans un salon',
      usage: 'send <channel_id> <message>',
      execute: (args) => this.sendMessage(args)
    });

    // Créer des logs de test (pour développement)
    this.commands.set('testlogs', {
      description: 'Crée des logs de test (développement)',
      usage: 'testlogs',
      execute: () => this.createTestLogs()
    });

    // Nettoyer les logs de test
    this.commands.set('cleanlogs', {
      description: 'Supprime tous les logs de test',
      usage: 'cleanlogs [fichier]',
      execute: (args) => this.cleanTestLogs(args)
    });

    // Statistiques des logs
    this.commands.set('logstats', {
      description: 'Affiche les statistiques des logs',
      usage: 'logstats',
      execute: () => this.showLogStats()
    });

    // Recharger les commandes Discord
    this.commands.set('reload', {
      description: 'Recharge les commandes Discord',
      usage: 'reload [commande]',
      execute: (args) => this.reloadCommands(args)
    });

    // Statistiques du bot
    this.commands.set('stats', {
      description: 'Affiche les statistiques du bot',
      usage: 'stats',
      execute: () => this.showStats()
    });

    // Arrêter le bot
    this.commands.set('stop', {
      description: 'Arrête le bot proprement',
      usage: 'stop',
      execute: () => this.stopBot()
    });

    // Quitter la console
    this.commands.set('exit', {
      description: 'Quitte la console interactive (le bot continue)',
      usage: 'exit',
      execute: () => this.exit()
    });

    this.commands.set('quit', {
      description: 'Alias pour exit',
      usage: 'quit',
      execute: () => this.exit()
    });

    // Commande pour exécuter du code JavaScript
    this.commands.set('eval', {
      description: 'Exécute du code JavaScript (DANGEREUX - dev uniquement)',
      usage: 'eval <code>',
      execute: (args) => this.evalCode(args)
    });

    // Commandes de modération
    this.commands.set('ban', {
      description: 'Bannit un utilisateur',
      usage: 'ban <guild_id> <user_id> [raison]',
      execute: (args) => this.banUser(args)
    });

    this.commands.set('unban', {
      description: 'Débannit un utilisateur',
      usage: 'unban <guild_id> <user_id>',
      execute: (args) => this.unbanUser(args)
    });
  }

  static start() {
    if (this.isActive) return;
    
    this.isActive = true;
    console.log(chalk.green('\n🚀 Console interactive démarrée !'));
    console.log(chalk.gray('Tapez "help" pour voir les commandes disponibles'));
    console.log(chalk.gray('Tapez "exit" pour quitter la console (le bot continuera)'));
    console.log(chalk.gray('Tapez "stop" pour arrêter complètement le bot\n'));
    
    this.rl.prompt();
  }

  static stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    if (this.rl) {
      this.rl.close();
    }
    console.log(chalk.yellow('Console interactive fermée.'));
  }

  static async handleCommand(input) {
    if (!input) {
      this.rl.prompt();
      return;
    }

    const [commandName, ...args] = input.split(' ');
    const command = this.commands.get(commandName.toLowerCase());

    if (!command) {
      console.log(chalk.red(`❌ Commande inconnue: ${commandName}`));
      console.log(chalk.gray('Tapez "help" pour voir les commandes disponibles'));
      this.rl.prompt();
      return;
    }

    try {
      await command.execute(args);
    } catch (error) {
      console.log(chalk.red(`❌ Erreur lors de l'exécution de la commande: ${error.message}`));
    }

    this.rl.prompt();
  }

  static showHelp(args) {
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const command = this.commands.get(commandName);
      
      if (command) {
        console.log(chalk.blue(`\n📖 Aide pour "${commandName}"`));
        console.log(chalk.white(`Description: ${command.description}`));
        console.log(chalk.gray(`Usage: ${command.usage}\n`));
      } else {
        console.log(chalk.red(`❌ Commande "${commandName}" non trouvée`));
      }
      return;
    }

    console.log(chalk.blue('\n📖 Commandes disponibles:\n'));
    
    for (const [name, cmd] of this.commands) {
      console.log(chalk.cyan(`  ${name.padEnd(12)} `) + chalk.gray(`- ${cmd.description}`));
    }
    
    console.log(chalk.gray('\nUtilisez "help <commande>" pour plus de détails sur une commande\n'));
  }

  static showStatus() {
    if (!this.client || !this.client.isReady()) {
      console.log(chalk.red('❌ Bot non connecté'));
      return;
    }

    const uptime = process.uptime();
    const uptimeStr = this.formatUptime(uptime);
    
    console.log(chalk.blue('\n📊 Statut du bot:\n'));
    console.log(chalk.green(`✅ Connecté depuis: ${uptimeStr}`));
    console.log(chalk.white(`🔹 Utilisateur: ${this.client.user.tag}`));
    console.log(chalk.white(`🔹 ID: ${this.client.user.id}`));
    console.log(chalk.white(`🔹 Serveurs: ${this.client.guilds.cache.size}`));
    console.log(chalk.white(`🔹 Utilisateurs: ${this.client.users.cache.size}`));
    console.log(chalk.white(`🔹 Ping: ${this.client.ws.ping}ms\n`));
  }

  static listGuilds() {
    if (!this.client || !this.client.isReady()) {
      console.log(chalk.red('❌ Bot non connecté'));
      return;
    }

    console.log(chalk.blue('\n🏠 Serveurs:\n'));
    
    this.client.guilds.cache.forEach(guild => {
      console.log(chalk.cyan(`  ${guild.name.padEnd(25)} `) + 
                  chalk.gray(`(${guild.id}) - ${guild.memberCount} membres`));
    });
    
    console.log();
  }

  static showLogs(args) {
    const limit = args[0] ? parseInt(args[0]) : 10;
    const logs = Logger.getRecentLogs(limit);

    if (logs.length === 0) {
      console.log(chalk.yellow('📝 Aucun log récent'));
      return;
    }

    console.log(chalk.blue(`\n📝 ${logs.length} logs récents:\n`));
    
    logs.forEach(log => {
      const color = this.getColorForLogType(log.type);
      console.log(color(`[${log.type}] ${log.timestampFormatted}`));
      console.log(chalk.gray(`  ${this.formatLogData(log.type, log.data)}`));
    });
    
    console.log();
  }

  static async sendMessage(args) {
    if (args.length < 2) {
      console.log(chalk.red('❌ Usage: send <channel_id> <message>'));
      return;
    }

    const channelId = args[0];
    const message = args.slice(1).join(' ');

    try {
      const channel = await this.client.channels.fetch(channelId);
      await channel.send(message);
      console.log(chalk.green(`✅ Message envoyé dans #${channel.name}`));
    } catch (error) {
      console.log(chalk.red(`❌ Erreur: ${error.message}`));
    }
  }

  static createTestLogs() {
    Logger.createTestLogs();
    console.log(chalk.green('✅ Logs de test créés'));
  }

  static cleanTestLogs(args) {
    if (args.length > 0) {
      // Nettoyer un fichier spécifique
      const filename = args[0];
      const result = LogCleaner.cleanSpecificFile(filename);
      
      if (result.error) {
        console.log(chalk.red(`❌ Erreur: ${result.error}`));
      } else if (result.linesCleaned > 0) {
        console.log(chalk.green(`✅ ${filename}: ${result.linesCleaned} logs de test supprimés`));
        console.log(chalk.gray(`   ${result.totalLines} → ${result.finalLines} lignes`));
      } else {
        console.log(chalk.yellow(`ℹ️  ${filename}: Aucun log de test trouvé`));
      }
    } else {
      // Nettoyer tous les fichiers
      console.log(chalk.blue('🧹 Nettoyage de tous les fichiers de logs...'));
      const result = LogCleaner.cleanAllLogFiles();
      
      if (result.success) {
        console.log(chalk.green(`✅ Nettoyage terminé !`));
        console.log(chalk.white(`   ${result.cleaned} logs de test supprimés sur ${result.total} fichiers`));
      } else {
        console.log(chalk.red(`❌ Erreur lors du nettoyage: ${result.error}`));
      }
    }
  }

  static showLogStats() {
    console.log(chalk.blue('📊 Statistiques des logs:\n'));
    
    const stats = LogCleaner.getLogStats();
    
    if (stats.error) {
      console.log(chalk.red(`❌ Erreur: ${stats.error}`));
      return;
    }
    
    console.log(chalk.white(`🔹 Fichiers de logs: ${stats.totalFiles}`));
    console.log(chalk.white(`🔹 Total des lignes: ${stats.totalLines}`));
    console.log(chalk.green(`🔹 Logs légitimes: ${stats.cleanLines}`));
    console.log(chalk.red(`🔹 Logs de test: ${stats.testLines}`));
    
    if (stats.testLines > 0) {
      const percentage = ((stats.testLines / stats.totalLines) * 100).toFixed(1);
      console.log(chalk.yellow(`⚠️  ${percentage}% des logs sont des logs de test`));
      console.log(chalk.gray('   Utilisez "cleanlogs" pour les supprimer'));
    }
    
    console.log();
  }

  static async reloadCommands(args) {
    try {
      // Ici on pourrait implémenter le rechargement des commandes
      console.log(chalk.yellow('⚠️  Fonctionnalité non encore implémentée'));
    } catch (error) {
      console.log(chalk.red(`❌ Erreur: ${error.message}`));
    }
  }

  static showStats() {
    if (!this.client || !this.client.isReady()) {
      console.log(chalk.red('❌ Bot non connecté'));
      return;
    }

    const memUsage = process.memoryUsage();
    
    console.log(chalk.blue('\n📈 Statistiques:\n'));
    console.log(chalk.white(`🔹 Mémoire utilisée: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`));
    console.log(chalk.white(`🔹 Mémoire totale: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`));
    console.log(chalk.white(`🔹 Uptime: ${this.formatUptime(process.uptime())}`));
    console.log(chalk.white(`🔹 Version Node.js: ${process.version}`));
    console.log(chalk.white(`🔹 Plateforme: ${process.platform}\n`));
  }

  static async stopBot() {
    console.log(chalk.yellow('🛑 Arrêt du bot en cours...'));
    
    try {
      if (this.client && this.client.isReady()) {
        await Logger.log(this.client, 'SYSTEM', {
          message: 'Bot arrêté via console'
        });
      }
      
      Logger.flushAllLogs();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.stop();
      process.exit(0);
    } catch (error) {
      console.log(chalk.red(`❌ Erreur lors de l'arrêt: ${error.message}`));
      process.exit(1);
    }
  }

  static exit() {
    console.log(chalk.yellow('👋 Au revoir ! Le bot continue de fonctionner.'));
    this.stop();
  }

  static evalCode(args) {
    if (args.length === 0) {
      console.log(chalk.red('❌ Usage: eval <code>'));
      return;
    }

    const code = args.join(' ');
    
    console.log(chalk.yellow('⚠️  ATTENTION: Exécution de code JavaScript...'));
    
    try {
      const result = eval(code);
      console.log(chalk.green('✅ Résultat:'));
      console.log(result);
    } catch (error) {
      console.log(chalk.red(`❌ Erreur: ${error.message}`));
    }
  }

  static async banUser(args) {
    if (args.length < 2) {
      console.log(chalk.red('❌ Usage: ban <guild_id> <user_id> [raison]'));
      return;
    }

    const guildId = args[0];
    const userId = args[1];
    const reason = args.slice(2).join(' ') || 'Banni via console';

    try {
      const guild = await this.client.guilds.fetch(guildId);
      await guild.bans.create(userId, { reason });
      console.log(chalk.green(`✅ Utilisateur ${userId} banni de ${guild.name}`));
    } catch (error) {
      console.log(chalk.red(`❌ Erreur: ${error.message}`));
    }
  }

  static async unbanUser(args) {
    if (args.length < 2) {
      console.log(chalk.red('❌ Usage: unban <guild_id> <user_id>'));
      return;
    }

    const guildId = args[0];
    const userId = args[1];

    try {
      const guild = await this.client.guilds.fetch(guildId);
      await guild.bans.remove(userId);
      console.log(chalk.green(`✅ Utilisateur ${userId} débanni de ${guild.name}`));
    } catch (error) {
      console.log(chalk.red(`❌ Erreur: ${error.message}`));
    }
  }

  // Utilitaires
  static formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  static getColorForLogType(type) {
    const colors = {
      'MODERATION': chalk.red,
      'MEMBER_JOIN': chalk.green,
      'MEMBER_LEAVE': chalk.red,
      'MESSAGE_DELETE': chalk.gray,
      'MESSAGE_EDIT': chalk.blue,
      'VOICE_JOIN': chalk.green,
      'VOICE_LEAVE': chalk.red,
      'VOICE_SWITCH': chalk.blue,
      'ECONOMY': chalk.yellow,
      'COMMAND': chalk.gray,
      'SYSTEM': chalk.magenta
    };
    return colors[type] || chalk.gray;
  }

  static formatLogData(type, data) {
    switch (type) {
      case 'MODERATION':
        return `${data.action} - ${data.moderator} → ${data.target} (${data.reason})`;
      case 'MEMBER_JOIN':
      case 'MEMBER_LEAVE':
        return data.member;
      case 'MESSAGE_DELETE':
        return `${data.author} dans ${data.channel}`;
      case 'ECONOMY':
        return `${data.user} - ${data.action} (${data.amount} coins)`;
      case 'COMMAND':
        return `${data.user} - ${data.command} dans ${data.channel}`;
      case 'SYSTEM':
        return data.message;
      default:
        return JSON.stringify(data);
    }
  }
}