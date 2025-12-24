export class AutomationValidator {
  static INTERVAL_UNITS = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000
  };

  static MIN_INTERVAL_MS = 5000;
  static VALID_MESSAGE_TYPES = ['text', 'embed', 'combined'];

  static validateInterval(amount, unit) {
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return { valid: false, error: 'Interval amount must be a positive number' };
    }

    if (!unit || !this.INTERVAL_UNITS[unit]) {
      return { valid: false, error: `Invalid interval unit. Must be one of: ${Object.keys(this.INTERVAL_UNITS).join(', ')}` };
    }

    const intervalMs = amount * this.INTERVAL_UNITS[unit];
    if (intervalMs < this.MIN_INTERVAL_MS) {
      return { 
        valid: false, 
        error: `Interval must be at least ${this.MIN_INTERVAL_MS / 1000} seconds (you specified ${(intervalMs / 1000).toFixed(2)}s)` 
      };
    }

    return { valid: true, intervalMs };
  }

  static validateChannelId(channelId) {
    if (!channelId || typeof channelId !== 'string') {
      return { valid: false, error: 'Channel ID must be a non-empty string' };
    }

    if (!/^\d{17,19}$/.test(channelId)) {
      return { valid: false, error: 'Invalid channel ID format' };
    }

    return { valid: true };
  }

  static validateMessage(message) {
    if (!message || typeof message !== 'object') {
      return { valid: false, error: 'Message must be an object' };
    }

    if (!message.id || typeof message.id !== 'string') {
      return { valid: false, error: 'Message must have a valid ID' };
    }

    if (!message.type || !this.VALID_MESSAGE_TYPES.includes(message.type)) {
      return { 
        valid: false, 
        error: `Message type must be one of: ${this.VALID_MESSAGE_TYPES.join(', ')}` 
      };
    }

    if ((message.type === 'text' || message.type === 'combined') && (!message.content || typeof message.content !== 'string')) {
      return { valid: false, error: 'Text message must have non-empty content' };
    }

    if ((message.type === 'embed' || message.type === 'combined') && !this.validateEmbedStructure(message.embed)) {
      return { valid: false, error: 'Invalid embed structure' };
    }

    return { valid: true };
  }

  static validateEmbedStructure(embed) {
    if (!embed || typeof embed !== 'object') {
      return false;
    }

    if (embed.title && typeof embed.title !== 'string') return false;
    if (embed.description && typeof embed.description !== 'string') return false;
    if (embed.color && typeof embed.color !== 'string') return false;
    if (embed.url && typeof embed.url !== 'string') return false;

    if (embed.fields && Array.isArray(embed.fields)) {
      for (const field of embed.fields) {
        if (!field.name || typeof field.name !== 'string') return false;
        if (!field.value || typeof field.value !== 'string') return false;
        if (field.inline !== undefined && typeof field.inline !== 'boolean') return false;
      }
    }

    if (embed.footer && typeof embed.footer === 'object') {
      if (!embed.footer.text || typeof embed.footer.text !== 'string') return false;
      if (embed.footer.iconUrl && typeof embed.footer.iconUrl !== 'string') return false;
    }

    if (embed.image && typeof embed.image === 'object') {
      if (!embed.image.url || typeof embed.image.url !== 'string') return false;
    }

    if (embed.thumbnail && typeof embed.thumbnail === 'object') {
      if (!embed.thumbnail.url || typeof embed.thumbnail.url !== 'string') return false;
    }

    return true;
  }

  static validateMessages(messages) {
    if (!Array.isArray(messages)) {
      return { valid: false, error: 'Messages must be an array' };
    }

    if (messages.length === 0) {
      return { valid: false, error: 'At least one message is required' };
    }

    for (let i = 0; i < messages.length; i++) {
      const result = this.validateMessage(messages[i]);
      if (!result.valid) {
        return { valid: false, error: `Message ${i + 1}: ${result.error}` };
      }
    }

    const messageIds = new Set(messages.map(m => m.id));
    if (messageIds.size !== messages.length) {
      return { valid: false, error: 'Message IDs must be unique' };
    }

    return { valid: true };
  }

  static validateRandomMode(randomMode) {
    return typeof randomMode === 'boolean';
  }

  static validateAutomation(automation) {
    if (!automation || typeof automation !== 'object') {
      return { valid: false, error: 'Automation must be an object' };
    }

    if (!automation.id || typeof automation.id !== 'string') {
      return { valid: false, error: 'Automation must have a valid ID' };
    }

    if (!automation.name || typeof automation.name !== 'string' || automation.name.trim().length === 0) {
      return { valid: false, error: 'Automation name is required and must be non-empty' };
    }

    if (automation.description && typeof automation.description !== 'string') {
      return { valid: false, error: 'Automation description must be a string' };
    }

    const intervalValidation = this.validateInterval(automation.interval?.amount, automation.interval?.unit);
    if (!intervalValidation.valid) {
      return { valid: false, error: `Invalid interval: ${intervalValidation.error}` };
    }

    const channelValidation = this.validateChannelId(automation.channelId);
    if (!channelValidation.valid) {
      return { valid: false, error: `Invalid channel: ${channelValidation.error}` };
    }

    const messagesValidation = this.validateMessages(automation.messages);
    if (!messagesValidation.valid) {
      return { valid: false, error: `Invalid messages: ${messagesValidation.error}` };
    }

    if (!this.validateRandomMode(automation.randomMode)) {
      return { valid: false, error: 'Random mode must be a boolean' };
    }

    if (typeof automation.enabled !== 'boolean') {
      return { valid: false, error: 'Enabled field must be a boolean' };
    }

    return { valid: true };
  }

  static generateId() {
    return `auto_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
