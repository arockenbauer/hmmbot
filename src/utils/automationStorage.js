import { Config } from './config.js';

export class AutomationStorage {
  static loadAll() {
    try {
      const automations = Config.getAutomations();
      return Array.isArray(automations) ? automations : [];
    } catch (error) {
      console.error('[AutomationStorage] Error loading automations:', error);
      return [];
    }
  }

  static save(automation) {
    try {
      if (!automation || !automation.id) {
        throw new Error('Automation must have an ID');
      }
      
      const success = Config.saveAutomation(automation);
      if (success) {
        console.log(`[AutomationStorage] Automation saved: ${automation.id}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[AutomationStorage] Error saving automation:', error);
      return false;
    }
  }

  static update(automationId, updates) {
    try {
      if (!automationId) {
        throw new Error('Automation ID is required');
      }

      const success = Config.updateAutomation(automationId, updates);
      if (success) {
        console.log(`[AutomationStorage] Automation updated: ${automationId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[AutomationStorage] Error updating automation:', error);
      return false;
    }
  }

  static delete(automationId) {
    try {
      if (!automationId) {
        throw new Error('Automation ID is required');
      }

      const success = Config.deleteAutomation(automationId);
      if (success) {
        console.log(`[AutomationStorage] Automation deleted: ${automationId}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('[AutomationStorage] Error deleting automation:', error);
      return false;
    }
  }

  static getById(automationId) {
    try {
      return Config.getAutomationById(automationId) || null;
    } catch (error) {
      console.error('[AutomationStorage] Error getting automation by ID:', error);
      return null;
    }
  }

  static exists(automationId) {
    try {
      return !!Config.getAutomationById(automationId);
    } catch (error) {
      console.error('[AutomationStorage] Error checking automation existence:', error);
      return false;
    }
  }

  static count() {
    try {
      return Config.getAutomations().length;
    } catch (error) {
      console.error('[AutomationStorage] Error counting automations:', error);
      return 0;
    }
  }
}
