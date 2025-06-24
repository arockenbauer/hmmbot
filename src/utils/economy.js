import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Logger } from './logger.js';
import { Config } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '..', 'data', 'economy.json');

export class Economy {
  static loadData() {
    try {
      if (fs.existsSync(dataPath)) {
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        return data;
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données économiques:', error);
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
      console.error('Erreur lors de la sauvegarde des données économiques:', error);
    }
  }

  static getUser(userId) {
    const data = this.loadData();
    if (!data[userId]) {
      data[userId] = {
        balance: 0,
        bank: 0,
        lastDaily: 0,
        lastWork: 0,
        lastRob: 0,
        level: 1,
        xp: 0
      };
      this.saveData(data);
    }
    return data[userId];
  }

  static updateUser(userId, userData) {
    const data = this.loadData();
    data[userId] = userData;
    this.saveData(data);
  }

  static addMoney(userId, amount, type = 'wallet') {
    const user = this.getUser(userId);
    if (type === 'bank') {
      user.bank += amount;
    } else {
      user.balance += amount;
    }
    this.updateUser(userId, user);
    return user;
  }

  static removeMoney(userId, amount, type = 'wallet') {
    const user = this.getUser(userId);
    if (type === 'bank') {
      if (user.bank < amount) return false;
      user.bank -= amount;
    } else {
      if (user.balance < amount) return false;
      user.balance -= amount;
    }
    this.updateUser(userId, user);
    return user;
  }

  static transferMoney(fromId, toId, amount) {
    const fromUser = this.getUser(fromId);
    const toUser = this.getUser(toId);
    
    if (fromUser.balance < amount) return false;
    
    fromUser.balance -= amount;
    toUser.balance += amount;
    
    this.updateUser(fromId, fromUser);
    this.updateUser(toId, toUser);
    
    return true;
  }

  static canDaily(userId) {
    const user = this.getUser(userId);
    const now = Date.now();
    const lastDaily = user.lastDaily || 0;
    const timeDiff = now - lastDaily;
    const oneDay = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
    
    return timeDiff >= oneDay;
  }

  static claimDaily(userId) {
    if (!this.canDaily(userId)) return false;
    
    const user = this.getUser(userId);
    const dailyAmount = Config.getEconomySetting('daily_amount') || 100;
    
    user.balance += dailyAmount;
    user.lastDaily = Date.now();
    
    this.updateUser(userId, user);
    return dailyAmount;
  }

  static canWork(userId) {
    const user = this.getUser(userId);
    const now = Date.now();
    const lastWork = user.lastWork || 0;
    const timeDiff = now - lastWork;
    const oneHour = 60 * 60 * 1000; // 1 heure en millisecondes
    
    return timeDiff >= oneHour;
  }

  static work(userId) {
    if (!this.canWork(userId)) return false;
    
    const user = this.getUser(userId);
    
    // Utiliser les paramètres de configuration
    const workMin = Config.getEconomySetting('work_min') || 50;
    const workMax = Config.getEconomySetting('work_max') || 200;
    
    // Montant de base + bonus selon le niveau
    const baseAmount = Math.floor(Math.random() * (workMax - workMin + 1)) + workMin;
    const levelBonus = Math.floor(user.level * 10); // 10 coins par niveau
    const workAmount = baseAmount + levelBonus;
    
    user.balance += workAmount;
    user.lastWork = Date.now();
    
    // XP plus valorisé selon le niveau
    const baseXp = Math.floor(Math.random() * 50) + 25; // 25-75 XP de base
    const workBonus = Math.floor(Math.random() * 25) + 10; // 10-35 XP bonus pour le travail
    const xpGain = baseXp + workBonus;
    user.xp += xpGain;
    
    // Système de niveau amélioré (plus d'XP requis par niveau)
    const xpRequired = user.level * 1000 + (user.level - 1) * 500; // XP requis augmente
    const newLevel = this.calculateLevel(user.xp);
    const leveledUp = newLevel > user.level;
    user.level = newLevel;
    
    this.updateUser(userId, user);
    return { 
      amount: workAmount, 
      xp: xpGain, 
      leveledUp, 
      newLevel,
      levelBonus: levelBonus > 0 ? levelBonus : null
    };
  }

  static calculateLevel(totalXp) {
    let level = 1;
    let xpNeeded = 1000;
    let currentXp = totalXp;
    
    while (currentXp >= xpNeeded) {
      currentXp -= xpNeeded;
      level++;
      xpNeeded = level * 1000 + (level - 1) * 500; // XP requis augmente progressivement
    }
    
    return level;
  }

  static getXpForNextLevel(userId) {
    const user = this.getUser(userId);
    const currentLevelXp = this.getXpUsedForCurrentLevel(user.xp, user.level);
    const xpNeededForNext = user.level * 1000 + (user.level - 1) * 500;
    return xpNeededForNext - currentLevelXp;
  }

  static getXpUsedForCurrentLevel(totalXp, currentLevel) {
    let usedXp = 0;
    for (let i = 1; i < currentLevel; i++) {
      usedXp += i * 1000 + (i - 1) * 500;
    }
    return totalXp - usedXp;
  }

  static getLeaderboard(type = 'balance', limit = 10) {
    const data = this.loadData();
    const sorted = Object.entries(data)
      .map(([userId, userData]) => ({
        userId,
        value: type === 'bank' ? userData.bank : userData.balance + userData.bank
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
    
    return sorted;
  }

  static formatMoney(amount) {
    return amount.toLocaleString('fr-FR') + ' 🪙';
  }

  static getTimeUntilDaily(userId) {
    const user = this.getUser(userId);
    const now = Date.now();
    const lastDaily = user.lastDaily || 0;
    const oneDay = 24 * 60 * 60 * 1000;
    const timeLeft = oneDay - (now - lastDaily);
    
    if (timeLeft <= 0) return null;
    
    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    
    return `${hours}h ${minutes}m`;
  }

  static getTimeUntilWork(userId) {
    const user = this.getUser(userId);
    const now = Date.now();
    const lastWork = user.lastWork || 0;
    const oneHour = 60 * 60 * 1000;
    const timeLeft = oneHour - (now - lastWork);
    
    if (timeLeft <= 0) return null;
    
    const minutes = Math.floor(timeLeft / (60 * 1000));
    const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }
}