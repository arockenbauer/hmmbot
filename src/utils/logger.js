import { EmbedBuilder } from 'discord.js';
import { Config } from './config.js';
import fs from 'fs';
import path from 'path';

export class Logger {
  static logHistory = [];
  static maxHistorySize = 1000;

  static async log(client, type, data) {
    try {
      const logChannelId = Config.getChannel('logs');
      if (!logChannelId) {
        console.warn('Canal de logs non configuré dans config.json');
        return;
      }
      
      const logChannel = await client.channels.fetch(logChannelId);
      if (!logChannel) return;

      // Créer l'heure précise en timezone Europe/Paris
      const now = new Date();
      const parisTime = now.toLocaleString('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });

      const embed = new EmbedBuilder()
        .setTimestamp()
        .setColor(this.getColorForType(type));

      switch (type) {
        case 'MODERATION':
          embed
            .setTitle('🛡️ Action de modération')
            .setDescription(`**Action:** ${data.action}\n**Modérateur:** ${data.moderator}\n**Cible:** ${data.target}\n**Raison:** ${data.reason || 'Aucune raison fournie'}`)
            .setColor('#ff6b6b')
            .addFields({ name: '🕐 Heure précise (Paris)', value: parisTime, inline: true });
          if (data.duration) embed.addFields({ name: 'Durée', value: data.duration, inline: true });
          break;

        case 'MEMBER_JOIN':
          embed
            .setTitle('📥 Membre rejoint')
            .setDescription(`${data.member} a rejoint le serveur`)
            .setColor('#51cf66')
            .setThumbnail(data.member.user.displayAvatarURL())
            .addFields({ name: '🕐 Heure précise (Paris)', value: parisTime, inline: true });
          break;

        case 'MEMBER_LEAVE':
          embed
            .setTitle('📤 Membre parti')
            .setDescription(`${data.member} a quitté le serveur`)
            .setColor('#ffa8a8')
            .setThumbnail(data.member.user.displayAvatarURL())
            .addFields({ name: '🕐 Heure précise (Paris)', value: parisTime, inline: true });
          break;

        case 'MESSAGE_DELETE':
          embed
            .setTitle('🗑️ Message supprimé')
            .setDescription(`**Auteur:** ${data.author}\n**Canal:** ${data.channel}\n**Contenu:** ${data.content || 'Contenu non disponible'}`)
            .setColor('#868e96')
            .addFields({ name: '🕐 Heure précise (Paris)', value: parisTime, inline: true });
          break;

        case 'MESSAGE_EDIT':
          embed
            .setTitle('✏️ Message modifié')
            .setDescription(`**Auteur:** ${data.author}\n**Canal:** ${data.channel}`)
            .addFields(
              { name: 'Ancien contenu', value: data.oldContent || 'Contenu non disponible', inline: false },
              { name: 'Nouveau contenu', value: data.newContent || 'Contenu non disponible', inline: false },
              { name: '🕐 Heure précise (Paris)', value: parisTime, inline: true }
            )
            .setColor('#339af0');
          break;

        case 'VOICE_JOIN':
          embed
            .setTitle('🔊 Connexion vocale')
            .setDescription(`${data.member} a rejoint ${data.channel}`)
            .setColor('#51cf66')
            .addFields({ name: '🕐 Heure précise (Paris)', value: parisTime, inline: true });
          break;

        case 'VOICE_LEAVE':
          embed
            .setTitle('🔇 Déconnexion vocale')
            .setDescription(`${data.member} a quitté ${data.channel}`)
            .setColor('#ffa8a8')
            .addFields({ name: '🕐 Heure précise (Paris)', value: parisTime, inline: true });
          break;

        case 'VOICE_SWITCH':
          embed
            .setTitle('🔄 Changement de salon vocal')
            .setDescription(`${data.member} est passé de ${data.oldChannel} à ${data.newChannel}`)
            .setColor('#339af0')
            .addFields({ name: '🕐 Heure précise (Paris)', value: parisTime, inline: true });
          break;

        case 'ECONOMY':
          embed
            .setTitle('💰 Transaction économique')
            .setDescription(`**Utilisateur:** ${data.user}\n**Action:** ${data.action}\n**Montant:** ${data.amount} coins`)
            .setColor('#ffd43b')
            .addFields({ name: '🕐 Heure précise (Paris)', value: parisTime, inline: true });
          break;

        case 'COMMAND':
          embed
            .setTitle('⚡ Commande utilisée')
            .setDescription(`**Utilisateur:** ${data.user}\n**Commande:** ${data.command}\n**Canal:** ${data.channel}`)
            .setColor('#495057')
            .addFields({ name: '🕐 Heure précise (Paris)', value: parisTime, inline: true });
          break;

        case 'SYSTEM':
          embed
            .setTitle('⚙️ Événement système')
            .setDescription(data.message || 'Événement système')
            .setColor('#7c3aed')
            .addFields({ name: '🕐 Heure précise (Paris)', value: parisTime, inline: true });
          if (data.guilds) embed.addFields({ name: 'Serveurs', value: data.guilds.toString(), inline: true });
          if (data.users) embed.addFields({ name: 'Utilisateurs', value: data.users.toString(), inline: true });
          if (data.channels) embed.addFields({ name: 'Salons', value: data.channels.toString(), inline: true });
          break;

        default:
          embed
            .setTitle('📋 Log générique')
            .setDescription(data.message || 'Aucune information')
            .setColor('#868e96')
            .addFields({ name: '🕐 Heure précise (Paris)', value: parisTime, inline: true });
      }

      await logChannel.send({ embeds: [embed] });

      // Sauvegarder dans l'historique et les fichiers
      this.saveToHistory(type, data, parisTime);
      this.saveToFile(type, data, parisTime);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du log:', error);
      // Même en cas d'erreur Discord, on sauvegarde dans les fichiers
      this.saveToHistory(type, data, new Date().toLocaleString('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      }));
      this.saveToFile(type, data, new Date().toLocaleString('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      }));
    }
  }

  static saveToHistory(type, data, timestamp) {
    const logEntry = {
      type,
      data,
      timestamp: Date.now(), // Utiliser un timestamp Unix pour éviter les problèmes de parsing
      timestampFormatted: timestamp, // Garder aussi la version formatée pour l'affichage
      id: Date.now() + Math.random()
    };

    this.logHistory.unshift(logEntry);
    
    // Limiter la taille de l'historique
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory = this.logHistory.slice(0, this.maxHistorySize);
    }
  }

  static saveToFile(type, data, timestamp) {
    try {
      const logsDir = path.join(process.cwd(), 'data', 'logs');
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      const today = new Date().toISOString().split('T')[0];
      const logFile = path.join(logsDir, `${today}.log`);
      
      let logMessage = '';
      switch (type) {
        case 'MODERATION':
          logMessage = `[${timestamp}] [MODERATION] ${data.action} - Modérateur: ${data.moderator} - Cible: ${data.target} - Raison: ${data.reason || 'Aucune'}`;
          if (data.duration) logMessage += ` - Durée: ${data.duration}`;
          break;
        case 'MEMBER_JOIN':
          logMessage = `[${timestamp}] [MEMBER_JOIN] ${data.member} a rejoint le serveur`;
          break;
        case 'MEMBER_LEAVE':
          logMessage = `[${timestamp}] [MEMBER_LEAVE] ${data.member} a quitté le serveur`;
          break;
        case 'MESSAGE_DELETE':
          logMessage = `[${timestamp}] [MESSAGE_DELETE] Auteur: ${data.author} - Canal: ${data.channel} - Contenu: ${data.content || 'Non disponible'}`;
          break;
        case 'MESSAGE_EDIT':
          logMessage = `[${timestamp}] [MESSAGE_EDIT] Auteur: ${data.author} - Canal: ${data.channel} - Ancien: ${data.oldContent || 'Non disponible'} - Nouveau: ${data.newContent || 'Non disponible'}`;
          break;
        case 'VOICE_JOIN':
          logMessage = `[${timestamp}] [VOICE_JOIN] ${data.member} a rejoint ${data.channel}`;
          break;
        case 'VOICE_LEAVE':
          logMessage = `[${timestamp}] [VOICE_LEAVE] ${data.member} a quitté ${data.channel}`;
          break;
        case 'VOICE_SWITCH':
          logMessage = `[${timestamp}] [VOICE_SWITCH] ${data.member} est passé de ${data.oldChannel} à ${data.newChannel}`;
          break;
        case 'ECONOMY':
          logMessage = `[${timestamp}] [ECONOMY] Utilisateur: ${data.user} - Action: ${data.action} - Montant: ${data.amount} coins`;
          break;
        case 'COMMAND':
          logMessage = `[${timestamp}] [COMMAND] Utilisateur: ${data.user} - Commande: ${data.command} - Canal: ${data.channel}`;
          break;
        case 'SYSTEM':
          logMessage = `[${timestamp}] [SYSTEM] ${data.message}`;
          if (data.guilds) logMessage += ` - Serveurs: ${data.guilds}`;
          if (data.users) logMessage += ` - Utilisateurs: ${data.users}`;
          if (data.channels) logMessage += ` - Salons: ${data.channels}`;
          break;
        default:
          logMessage = `[${timestamp}] [${type}] ${data.message || JSON.stringify(data)}`;
      }

      fs.appendFileSync(logFile, logMessage + '\n');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du log dans le fichier:', error);
    }
  }

  static getRecentLogs(limit = 10) {
    return this.logHistory.slice(0, limit);
  }

  static getLogFiles() {
    try {
      const logsDir = path.join(process.cwd(), 'data', 'logs');
      if (!fs.existsSync(logsDir)) {
        return [];
      }

      return fs.readdirSync(logsDir)
        .filter(file => file.endsWith('.log'))
        .map(file => {
          const filePath = path.join(logsDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => new Date(b.modified) - new Date(a.modified));
    } catch (error) {
      console.error('Erreur lors de la récupération des fichiers de logs:', error);
      return [];
    }
  }

  static readLogFile(filename) {
    try {
      const logsDir = path.join(process.cwd(), 'data', 'logs');
      const filePath = path.join(logsDir, filename);
      
      if (!fs.existsSync(filePath)) {
        return null;
      }

      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.error('Erreur lors de la lecture du fichier de log:', error);
      return null;
    }
  }

  static getColorForType(type) {
    const colors = {
      'MODERATION': '#ff6b6b',
      'MEMBER_JOIN': '#51cf66',
      'MEMBER_LEAVE': '#ffa8a8',
      'MESSAGE_DELETE': '#868e96',
      'MESSAGE_EDIT': '#339af0',
      'VOICE_JOIN': '#51cf66',
      'VOICE_LEAVE': '#ffa8a8',
      'VOICE_SWITCH': '#339af0',
      'ECONOMY': '#ffd43b',
      'COMMAND': '#495057',
      'SYSTEM': '#7c3aed'
    };
    return colors[type] || '#868e96';
  }

  // Méthode pour forcer la sauvegarde de tous les logs en mémoire
  static flushAllLogs() {
    try {
      console.log('[LOGGER] Sauvegarde forcée des logs en mémoire...');
      
      // Sauvegarder tous les logs en mémoire qui ne sont peut-être pas encore sur disque
      this.logHistory.slice(0, 50).forEach(entry => {
        this.saveToFile(entry.type, entry.data, entry.timestampFormatted || entry.timestamp);
      });
      
      console.log('[LOGGER] Sauvegarde forcée terminée');
    } catch (error) {
      console.error('[LOGGER] Erreur lors de la sauvegarde forcée:', error);
    }
  }

  // Méthode pour créer des logs de test (utile pour le développement)
  static createTestLogs() {
    const testLogs = [
      {
        type: 'SYSTEM',
        data: { message: 'Bot démarré avec succès' }
      },
      {
        type: 'MEMBER_JOIN',
        data: { member: 'TestUser#1234' }
      },
      {
        type: 'COMMAND',
        data: { user: 'Admin#0001', command: '/ping', channel: '#général' }
      },
      {
        type: 'ECONOMY',
        data: { user: 'User#5678', action: 'daily', amount: 250 }
      },
      {
        type: 'MODERATION',
        data: { action: 'timeout', moderator: 'Mod#1111', target: 'BadUser#9999', reason: 'Spam' }
      }
    ];

    testLogs.forEach((log, index) => {
      setTimeout(() => {
        const now = new Date();
        const parisTime = now.toLocaleString('fr-FR', {
          timeZone: 'Europe/Paris',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          fractionalSecondDigits: 3
        });
        
        this.saveToHistory(log.type, log.data, parisTime);
        this.saveToFile(log.type, log.data, parisTime);
      }, index * 1000); // Espacer les logs de 1 seconde
    });

    console.log('[LOGGER] Logs de test créés');
  }

  // Méthode pour vérifier si les logs de test doivent être créés au démarrage
  static shouldCreateTestLogsOnStartup() {
    try {
      const configPath = path.join(process.cwd(), 'config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.logs?.create_test_logs_on_startup === true;
      }
    } catch (error) {
      console.error('Erreur lors de la lecture de la configuration:', error);
    }
    return false; // Par défaut, ne pas créer de logs de test
  }
}