import { EmbedBuilder } from 'discord.js';
import { AutomationStorage } from './automationStorage.js';
import { AutomationValidator } from './automationValidator.js';

export class AutomationManager {
  constructor() {
    this.scheduledAutomations = new Map();
    this.client = null;
  }

  async start(client) {
    if (!client) {
      throw new Error('Discord client is required to start AutomationManager');
    }

    this.client = client;
    console.log('[AutomationManager] Starting automation scheduler...');

    const automations = AutomationStorage.loadAll();
    console.log(`[AutomationManager] Loaded ${automations.length} automations`);

    for (const automation of automations) {
      if (automation.enabled) {
        this.scheduleAutomation(automation);
      }
    }

    console.log(`[AutomationManager] Scheduled ${this.scheduledAutomations.size} active automations`);
  }

  stop() {
    console.log('[AutomationManager] Stopping all scheduled automations...');

    for (const [automationId, timeoutId] of this.scheduledAutomations) {
      clearInterval(timeoutId);
    }

    this.scheduledAutomations.clear();
    console.log('[AutomationManager] All automations stopped');
  }

  scheduleAutomation(automation) {
    const validation = AutomationValidator.validateAutomation(automation);
    if (!validation.valid) {
      console.error(`[AutomationManager] Cannot schedule automation ${automation.id}: ${validation.error}`);
      return false;
    }

    if (this.scheduledAutomations.has(automation.id)) {
      clearInterval(this.scheduledAutomations.get(automation.id));
    }

    let intervalMs;
    if (automation.scheduleType === 'daily') {
      intervalMs = 60000;
      console.log(`[AutomationManager] Scheduled automation ${automation.id} as daily schedule (checking every minute)`);
    } else {
      intervalMs = AutomationValidator.validateInterval(automation.interval.amount, automation.interval.unit).intervalMs;
      console.log(`[AutomationManager] Scheduled automation ${automation.id} with interval ${automation.interval.amount}${automation.interval.unit.charAt(0)}`);
    }

    const intervalId = setInterval(async () => {
      await this.executeAutomation(automation.id);
    }, intervalMs);

    this.scheduledAutomations.set(automation.id, intervalId);
    return true;
  }

  unscheduleAutomation(automationId) {
    if (this.scheduledAutomations.has(automationId)) {
      clearInterval(this.scheduledAutomations.get(automationId));
      this.scheduledAutomations.delete(automationId);
      console.log(`[AutomationManager] Unscheduled automation ${automationId}`);
      return true;
    }
    return false;
  }

  async addAutomation(automation) {
    const validation = AutomationValidator.validateAutomation(automation);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    automation.createdAt = Date.now();
    automation.updatedAt = Date.now();
    automation.messageIndex = 0;
    automation.lastExecution = null;
    
    if (automation.scheduleType === 'daily') {
      automation.nextExecution = Date.now() + 60000;
    } else {
      automation.nextExecution = Date.now() + AutomationValidator.validateInterval(automation.interval.amount, automation.interval.unit).intervalMs;
    }

    const saved = AutomationStorage.save(automation);
    if (!saved) {
      return { success: false, error: 'Failed to save automation to config' };
    }

    if (automation.enabled && this.client) {
      this.scheduleAutomation(automation);
    }

    return { success: true, automation };
  }

  removeAutomation(automationId) {
    this.unscheduleAutomation(automationId);
    const deleted = AutomationStorage.delete(automationId);
    if (!deleted) {
      return { success: false, error: 'Failed to delete automation from config' };
    }
    return { success: true };
  }

  updateAutomation(automationId, updates) {
    const current = AutomationStorage.getById(automationId);
    if (!current) {
      return { success: false, error: 'Automation not found' };
    }

    const updated = { ...current, ...updates };

    const validation = AutomationValidator.validateAutomation(updated);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const saved = AutomationStorage.update(automationId, updates);
    if (!saved) {
      return { success: false, error: 'Failed to update automation in config' };
    }

    this.unscheduleAutomation(automationId);
    if (updated.enabled && this.client) {
      this.scheduleAutomation(updated);
    }

    return { success: true, automation: updated };
  }

  toggleAutomation(automationId, enabled) {
    const current = AutomationStorage.getById(automationId);
    if (!current) {
      return { success: false, error: 'Automation not found' };
    }

    if (enabled) {
      if (this.client && !this.scheduledAutomations.has(automationId)) {
        this.scheduleAutomation(current);
      }
      AutomationStorage.update(automationId, { enabled: true });
    } else {
      this.unscheduleAutomation(automationId);
      AutomationStorage.update(automationId, { enabled: false });
    }

    return { success: true };
  }

  selectMessage(automation) {
    if (!automation.messages || automation.messages.length === 0) {
      return null;
    }

    let selectedMessage;
    if (automation.randomMode) {
      const randomIndex = Math.floor(Math.random() * automation.messages.length);
      selectedMessage = automation.messages[randomIndex];
    } else {
      selectedMessage = automation.messages[automation.messageIndex];
      automation.messageIndex = (automation.messageIndex + 1) % automation.messages.length;
    }

    return selectedMessage;
  }

  async executeAutomation(automationId) {
    const automation = AutomationStorage.getById(automationId);
    if (!automation) {
      console.warn(`[AutomationManager] Automation ${automationId} not found`);
      return { success: false, error: 'Automation not found' };
    }

    if (!automation.enabled) {
      return { success: false, error: 'Automation is disabled' };
    }

    if (!this.client) {
      console.warn(`[AutomationManager] Discord client not available`);
      return { success: false, error: 'Discord client not available' };
    }

    try {
      const channel = await this.client.channels.fetch(automation.channelId).catch(() => null);
      if (!channel) {
        console.error(`[AutomationManager] Channel ${automation.channelId} not found or inaccessible`);
        return { success: false, error: 'Channel not found or not accessible' };
      }

      const message = this.selectMessage(automation);
      if (!message) {
        console.error(`[AutomationManager] No message available for automation ${automationId}`);
        return { success: false, error: 'No messages available' };
      }

      let payload = {};

      if (message.type === 'text' || message.type === 'combined') {
        payload.content = message.content;
      }

      if (message.type === 'embed' || message.type === 'combined') {
        const embed = new EmbedBuilder(message.embed);
        payload.embeds = [embed];
      }

      await channel.send(payload);

      const now = Date.now();
      let nextExecution;
      
      if (automation.scheduleType === 'daily') {
        nextExecution = now + 60000;
      } else {
        nextExecution = now + AutomationValidator.validateInterval(automation.interval.amount, automation.interval.unit).intervalMs;
      }
      
      AutomationStorage.update(automationId, {
        lastExecution: now,
        messageIndex: automation.messageIndex,
        nextExecution: nextExecution
      });

      console.log(`[AutomationManager] Executed automation ${automationId} in channel ${automation.channelId}`);
      return { success: true };
    } catch (error) {
      console.error(`[AutomationManager] Error executing automation ${automationId}:`, error);
      return { success: false, error: error.message };
    }
  }

  async testAutomation(automationId) {
    return this.executeAutomation(automationId);
  }

  reloadAll() {
    this.stop();
    this.scheduledAutomations.clear();

    if (this.client) {
      this.start(this.client);
    }
  }

  getAutomations() {
    return AutomationStorage.loadAll();
  }

  getAutomation(automationId) {
    return AutomationStorage.getById(automationId);
  }

  getScheduledAutomationIds() {
    return Array.from(this.scheduledAutomations.keys());
  }

  isScheduled(automationId) {
    return this.scheduledAutomations.has(automationId);
  }

  getStatus(automationId) {
    const automation = AutomationStorage.getById(automationId);
    if (!automation) {
      return null;
    }

    return {
      id: automation.id,
      name: automation.name,
      enabled: automation.enabled,
      scheduled: this.isScheduled(automationId),
      interval: automation.interval,
      lastExecution: automation.lastExecution,
      nextExecution: automation.nextExecution,
      messageCount: automation.messages.length,
      randomMode: automation.randomMode,
      currentMessageIndex: automation.messageIndex,
      channelId: automation.channelId
    };
  }
}

export const automationManager = new AutomationManager();
