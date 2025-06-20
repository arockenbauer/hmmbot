import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Config } from './config.js';
import { Economy } from './economy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '..', 'data', 'voiceTime.json');

export class VoiceTracker {
  static voiceSessions = new Map(); // userId -> { joinTime, channelId }

  static loadData() {
    try {
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        return data;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données vocales:', error);
    }
    return {};
  }

  static saveData(data) {
    try {
      const dir = path.dirname(dataPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données vocales:', error);
    }
  }

  static onVoiceJoin(member, channel) {
    // Vérifier si le suivi vocal est activé
    if (!Config.getVoiceSetting('track_voice_time')) return;
    
    this.voiceSessions.set(member.id, {
      joinTime: Date.now(),
      channelId: channel.id
    });
  }

  static onVoiceLeave(member) {
    const session = this.voiceSessions.get(member.id);
    if (session) {
      const timeSpent = Date.now() - session.joinTime;
      this.addVoiceTime(member.id, timeSpent);
      
      // Récompenser avec des coins si configuré
      const coinsPerMinute = Config.getVoiceSetting('coins_per_minute');
      if (coinsPerMinute && coinsPerMinute > 0) {
        const minutes = Math.floor(timeSpent / (60 * 1000));
        if (minutes > 0) {
          const coinsEarned = minutes * coinsPerMinute;
          Economy.addMoney(member.id, coinsEarned, 'wallet');
        }
      }
      
      this.voiceSessions.delete(member.id);
    }
  }

  static onVoiceSwitch(member, oldChannel, newChannel) {
    // Traiter comme une déconnexion puis reconnexion
    this.onVoiceLeave(member);
    this.onVoiceJoin(member, newChannel);
  }

  static addVoiceTime(userId, timeMs) {
    const data = this.loadData();
    if (!data[userId]) {
      data[userId] = { totalTime: 0 };
    }
    data[userId].totalTime += timeMs;
    this.saveData(data);
  }

  static getVoiceTime(userId) {
    const data = this.loadData();
    return data[userId]?.totalTime || 0;
  }

  static getLeaderboard(limit = 10) {
    const data = this.loadData();
    const sorted = Object.entries(data)
      .map(([userId, userData]) => ({
        userId,
        totalTime: userData.totalTime
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit);
    
    return sorted;
  }

  static formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}j ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}