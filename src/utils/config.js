import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TicketManager } from './ticket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const configPath = path.join(__dirname, '../../config.json');

class ConfigManager {
  constructor() {
    this.config = null;
    this.loadConfig();
  }

  loadConfig() {
    try {
      const configData = fs.readFileSync(configPath, 'utf8');
      this.config = JSON.parse(configData);
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      this.config = this.getDefaultConfig();
    }
  }

  saveConfig() {
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
      return true;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      return false;
    }
  }

  getDefaultConfig() {
    return {
      bot: {
        name: "HmmBot",
        version: "1.0.0",
        description: "Bot Discord multitâches avec interface web d'administration"
      },
      webui: {
        port: 25584,
        password: "admin",
        jwt_secret: "supersecret",
        session_duration: "2h"
      },
      logs: {
        create_test_logs_on_startup: false,
        max_log_files: 30,
        max_memory_logs: 1000,
        log_level: "info",
        auto_cleanup: true
      },
      features: {
        tickets: {
          enabled: true,
          auto_transcript: true,
          max_tickets_per_user: 3
        },
        economy: {
          enabled: true,
          daily_amount: 250,
          currency_name: "coins"
        },
        moderation: {
          enabled: true,
          auto_log: true,
          dm_on_action: true
        }
      },
      discord: {
        guild_id: "",
        log_channel: "",
        admin_roles: []
      },
      channels: {
        logs: "",
        welcome: "",
        goodbye: "",
        moderation: "",
        economy: "",
        voice_logs: "",
        general: ""
      },
      roles: {
        moderator: "",
        admin: "",
        member: "",
        muted: "",
        vip: ""
      },
      moderation: {
        auto_delete_clear_response: true,
        clear_response_delay: 5000,
        dm_on_punishment: true,
        log_all_actions: true,
        max_timeout_duration: "28d"
      },
      economy: {
        daily_amount: 250,
        work_min: 50,
        work_max: 500,
        rob_success_rate: 0.3,
        rob_min: 10,
        rob_max: 100
      },
      voice: {
        track_voice_time: true,
        coins_per_minute: 5
      },
      ticket: {
        enabled: true,
        category: "",
        support_role: "",
        transcript_channel: "",
        ticket_limit: 1,
        message: "Merci de créer un ticket pour contacter le support.",
        close_message: "Votre ticket a été fermé. Merci de nous avoir contactés.",
        log_transcripts: true,
        log_all_actions: true,
        auto_close: false,
        auto_close_delay: 3600,
        custom_fields: [],
        panel: {
          channel: "",
          embed_title: "Support - Créer un ticket",
          embed_text: "Cliquez sur le bouton ci-dessous pour ouvrir un ticket et contacter notre équipe de support.",
          selection_type: "dropdown",
          button_label: "Ouvrir un ticket",
          button_color: "Primary",
          dropdown_options: [
            "Support général",
            "Signalement",
            "Demande de partenariat",
            "Autre"
          ],
          welcome_message: "Bienvenue dans votre ticket ! Un membre de notre équipe va vous répondre sous peu.",
          confirm_before_delete: true
        }
      }
    };
  }

  // Getters pour les channels
  getChannel(channelName) {
    return this.config?.channels?.[channelName] || null;
  }

  setChannel(channelName, channelId) {
    if (!this.config.channels) this.config.channels = {};
    this.config.channels[channelName] = channelId;
    return this.saveConfig();
  }

  // Getters pour les rôles
  getRole(roleName) {
    return this.config?.roles?.[roleName] || null;
  }

  setRole(roleName, roleId) {
    if (!this.config.roles) this.config.roles = {};
    this.config.roles[roleName] = roleId;
    return this.saveConfig();
  }

  // Getters pour la modération
  getModerationSetting(setting) {
    return this.config?.moderation?.[setting];
  }

  setModerationSetting(setting, value) {
    if (!this.config.moderation) this.config.moderation = {};
    this.config.moderation[setting] = value;
    return this.saveConfig();
  }

  // Getters pour l'économie
  getEconomySetting(setting) {
    return this.config?.economy?.[setting];
  }

  setEconomySetting(setting, value) {
    if (!this.config.economy) this.config.economy = {};
    this.config.economy[setting] = value;
    return this.saveConfig();
  }

  // Getters pour la voix
  getVoiceSetting(setting) {
    return this.config?.voice?.[setting];
  }

  setVoiceSetting(setting, value) {
    if (!this.config.voice) this.config.voice = {};
    this.config.voice[setting] = value;
    return this.saveConfig();
  }

  // Méthode pour obtenir toute la configuration
  getConfig() {
    return this.config;
  }

  // Méthode pour recharger la configuration
  reloadConfig() {
    this.loadConfig();
    return this.config;
  }

  // Méthode pour valider les IDs Discord
  isValidDiscordId(id) {
    return /^\d{17,19}$/.test(id);
  }

  // Méthode pour obtenir tous les channels configurés
  getAllChannels() {
    return this.config?.channels || {};
  }

  // Méthode pour obtenir tous les rôles configurés
  getAllRoles() {
    return this.config?.roles || {};
  }

  // Méthodes pour la configuration des tickets
  updateTicketConfig(newConfig) {
    if (!this.config.ticket) this.config.ticket = {};
    this.config.ticket = { ...this.config.ticket, ...newConfig };
    return this.saveConfig();
  }

  setTicketConfig(newConfig) {
    if (!this.config.ticket) this.config.ticket = {};
    
    // Filtrer les valeurs null/undefined
    const filteredConfig = {};
    for (const [key, value] of Object.entries(newConfig)) {
      if (value !== null && value !== undefined) {
        filteredConfig[key] = value;
      }
    }
    
    this.config.ticket = { ...this.config.ticket, ...filteredConfig };
    return this.saveConfig();
  }

  getTicketConfig() {
    return this.config.ticket || {};
  }

  setPanelConfig(panelConfig) {
    if (!this.config.ticket) this.config.ticket = {};
    this.config.ticket.panel = { ...this.config.ticket.panel, ...panelConfig };
    return this.saveConfig();
  }

  // Méthodes pour la configuration WebUI
  setWebuiSetting(setting, value) {
    if (!this.config.webui) this.config.webui = {};
    this.config.webui[setting] = value;
    return this.saveConfig();
  }

  getWebuiSetting(setting) {
    return this.config?.webui?.[setting];
  }

  // Méthodes pour la configuration des logs
  setLogsSetting(setting, value) {
    if (!this.config.logs) this.config.logs = {};
    this.config.logs[setting] = value;
    return this.saveConfig();
  }

  getLogsSetting(setting) {
    return this.config?.logs?.[setting];
  }

  // Méthodes pour la configuration des features
  setFeatureSetting(feature, setting, value) {
    if (!this.config.features) this.config.features = {};
    if (!this.config.features[feature]) this.config.features[feature] = {};
    this.config.features[feature][setting] = value;
    return this.saveConfig();
  }

  getFeatureSetting(feature, setting) {
    return this.config?.features?.[feature]?.[setting];
  }



  // Méthode pour créer une sauvegarde
  createBackup() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const backupDir = path.join(__dirname, '../../src/data/config-backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(backupDir, `config-backup-${timestamp}.json`);
      
      fs.writeFileSync(backupFile, JSON.stringify(this.config, null, 2));
      return `config-backup-${timestamp}.json`;
    } catch (error) {
      console.error('Erreur lors de la création de la sauvegarde:', error);
      return null;
    }
  }

  // Méthode pour lister les sauvegardes disponibles
  listBackups() {
    try {
      const fs = require('fs');
      const path = require('path');
      
      const backupDir = path.join(__dirname, '../../src/data/config-backups');
      if (!fs.existsSync(backupDir)) {
        return [];
      }
      
      return fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.json'))
        .sort((a, b) => b.localeCompare(a)); // Tri par date décroissante
    } catch (error) {
      console.error('Erreur lors de la lecture des sauvegardes:', error);
      return [];
    }
  }

  // Méthode pour valider la configuration
  validateConfig() {
    const errors = [];
    
    // Vérifier les IDs Discord
    const channelIds = Object.values(this.config.channels || {}).filter(id => id);
    const roleIds = Object.values(this.config.roles || {}).filter(id => id);
    
    [...channelIds, ...roleIds].forEach(id => {
      if (!this.isValidDiscordId(id)) {
        errors.push(`ID Discord invalide: ${id}`);
      }
    });
    
    // Vérifier les paramètres numériques
    if (this.config.webui?.port && (this.config.webui.port < 1 || this.config.webui.port > 65535)) {
      errors.push('Port WebUI invalide (doit être entre 1 et 65535)');
    }
    
    if (this.config.economy?.rob_success_rate && (this.config.economy.rob_success_rate < 0 || this.config.economy.rob_success_rate > 1)) {
      errors.push('Taux de réussite vol invalide (doit être entre 0 et 1)');
    }
    
    return errors;
  }
}

// Instance singleton
export const Config = new ConfigManager();