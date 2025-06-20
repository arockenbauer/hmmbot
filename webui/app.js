// Application principale HmmBot
class HmmBotAdmin {
  constructor() {
    this.currentSection = 'dashboard';
    this.config = {};
    this.botStats = {};
    this.ticketStats = {};
    this.activeTickets = [];
    this.transcripts = [];
    this.recentLogs = [];
    this.logFiles = [];
    this.serverData = {};
    this.token = localStorage.getItem('jwt') || '';
    this.currentUser = null;
    this.users = [];
    this.roles = {};
    this.modules = {};
    this.init();
  }

  async init() {
    this.setupEventListeners();
    if (!this.token) {
      this.showLogin();
    } else {
      try {
        await this.loadCurrentUser();
        await this.loadConfig();
        await this.loadBotStats();
        await this.loadTicketStats();
        await this.loadRecentLogs();
        await this.loadServerData();
        this.showApp();
        this.loadSection('dashboard');
        setInterval(() => {
          this.loadBotStats();
          this.loadTicketStats();
          this.loadRecentLogs();
          if (this.currentSection === 'logs') {
            this.loadLogFiles();
          }
          if (this.currentSection === 'tickets') {
            this.loadActiveTickets();
            this.loadTranscripts();
          }
        }, 30000);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        this.showLogin();
      }
    }
  }

  setupEventListeners() {
    document.addEventListener('submit', async (e) => {
      if (e.target.id === 'login-form') {
        e.preventDefault();
        await this.handleLogin();
      }
      if (e.target.id === 'ticket-config-form') {
        e.preventDefault();
        await this.saveTicketConfig(e.target);
      }
      if (e.target.id === 'ticket-panel-form') {
        e.preventDefault();
        await this.saveTicketPanelConfig(e.target);
      }
      if (e.target.id === 'moderation-form') {
        e.preventDefault();
        await this.saveModerationConfig(e.target);
      }
      if (e.target.id === 'economy-form') {
        e.preventDefault();
        await this.saveEconomyConfig(e.target);
      }
      if (e.target.id === 'channels-form') {
        e.preventDefault();
        await this.saveChannelsConfig(e.target);
      }
      if (e.target.id === 'roles-form') {
        e.preventDefault();
        await this.saveRolesConfig(e.target);
      }
    });
    document.addEventListener('click', (e) => {
      if (e.target.closest('.nav-item')) {
        e.preventDefault();
        const section = e.target.closest('.nav-item').dataset.section;
        this.loadSection(section);
      }
      if (e.target.id === 'logout-btn') {
        this.logout();
      }
      if (e.target.id === 'sidebar-toggle') {
        this.toggleSidebar();
      }
      if (e.target.id === 'modal-close' || e.target.id === 'modal-overlay') {
        this.closeModal();
      }
      if (e.target.classList.contains('notification-close')) {
        e.target.closest('.notification').remove();
      }
      if (e.target.classList.contains('view-log-btn')) {
        const filename = e.target.dataset.filename;
        this.loadLogFileContent(filename);
      }
      if (e.target.classList.contains('download-log-btn')) {
        const filename = e.target.dataset.filename;
        this.downloadLogFile(filename);
      }
      if (e.target.id === 'create-test-logs-btn') {
        this.createTestLogs();
      }
      if (e.target.id === 'logs-config-btn') {
        this.showLogsConfig();
      }
      if (e.target.id === 'refresh-logs-btn') {
        this.loadLogFiles();
      }
      if (e.target.id === 'test-panel-btn') {
        this.testTicketPanel();
      }
      if (e.target.id === 'refresh-server-data-btn') {
        this.refreshServerData();
      }
      // Gestionnaires pour les embeds
      if (e.target.id === 'create-embed-btn') {
        this.showEmbedCreator();
      }
      if (e.target.id === 'send-embed-btn') {
        this.sendEmbed();
      }
      if (e.target.id === 'preview-embed-btn') {
        this.previewEmbed();
      }
      if (e.target.id === 'reset-embed-btn') {
        this.resetEmbedForm();
      }
      if (e.target.classList.contains('embed-template-btn')) {
        const template = e.target.dataset.template;
        this.loadEmbedTemplate(template);
      }
      if (e.target.id === 'add-field-btn') {
        this.addEmbedField();
      }
      // Synchronisation des champs de couleur
      if (e.target.id === 'embed-color') {
        document.getElementById('embed-color-hex').value = e.target.value;
      }
      if (e.target.id === 'embed-color-hex') {
        const colorValue = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(colorValue)) {
          document.getElementById('embed-color').value = colorValue;
        }
      }
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 768) {
        document.getElementById('sidebar').classList.remove('active');
      }
    });
  }

  showLogin() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }

  hideLogin() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('app').style.display = 'flex';
  }

  async handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    
    if (!username || !password) {
      errorDiv.textContent = 'Veuillez saisir votre nom d\'utilisateur et votre mot de passe';
      errorDiv.style.display = 'block';
      return;
    }
    
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        this.token = data.token;
        this.currentUser = data.user;
        localStorage.setItem('jwt', this.token);
        
        await this.loadConfig();
        await this.loadBotStats();
        await this.loadTicketStats();
        await this.loadRecentLogs();
        await this.loadServerData();
        
        this.hideLogin();
        this.showApp();
        this.updateUserInfo();
        this.updateNavigation();
        this.loadSection('dashboard');
        
        this.showNotification('success', `Bienvenue, ${this.currentUser.username} !`);
      } else {
        const error = await res.json();
        errorDiv.textContent = error.error || 'Erreur de connexion';
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      errorDiv.textContent = 'Erreur de connexion au serveur';
      errorDiv.style.display = 'block';
    }
  }

  async logout() {
    try {
      // Informer le serveur de la déconnexion
      if (this.token) {
        await fetch('/api/logout', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + this.token }
        });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('jwt');
      this.token = '';
      this.currentUser = null;
      this.showLogin();
    }
  }

  // Charger les informations de l'utilisateur actuel
  async loadCurrentUser() {
    try {
      const res = await fetch('/api/user/me', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.status === 401) {
        throw new Error('Session expirée');
      }
      if (!res.ok) throw new Error('Erreur de chargement');
      this.currentUser = await res.json();
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
      throw error;
    }
  }

  // Mettre à jour les informations utilisateur dans l'interface
  updateUserInfo() {
    if (!this.currentUser) return;
    
    const usernameEl = document.getElementById('current-username');
    const roleEl = document.getElementById('current-role');
    
    if (usernameEl) usernameEl.textContent = this.currentUser.username;
    if (roleEl) roleEl.textContent = this.getRoleDisplayName(this.currentUser.role);
  }

  // Mettre à jour la navigation selon les permissions
  updateNavigation() {
    if (!this.currentUser) return;
    
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const section = item.dataset.section;
      if (section && section !== 'dashboard') {
        if (!this.hasPermission(section, 'view')) {
          item.style.display = 'none';
        } else {
          item.style.display = 'flex';
        }
      }
    });
  }

  // Vérifier si l'utilisateur a une permission
  hasPermission(module, permission) {
    if (!this.currentUser || !this.currentUser.permissions) return false;
    if (this.currentUser.isSuperAdmin) return true;
    
    const modulePermissions = this.currentUser.permissions[module];
    return modulePermissions && modulePermissions.includes(permission);
  }

  // Obtenir le nom d'affichage du rôle
  getRoleDisplayName(role) {
    const roleNames = {
      superadmin: 'Super Admin',
      admin: 'Administrateur',
      moderator: 'Modérateur',
      support: 'Support',
      viewer: 'Lecteur'
    };
    return roleNames[role] || role;
  }

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
  }

  async loadConfig() {
    try {
      const res = await fetch('/api/config', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.status === 401) {
        this.showNotification('Session expirée, veuillez vous reconnecter.', 'error');
        this.logout();
        return;
      }
      if (!res.ok) throw new Error('Erreur de chargement');
      this.config = await res.json();
    } catch (error) {
      console.error('Erreur lors du chargement de la config:', error);
      this.showNotification('Erreur lors du chargement de la configuration.', 'error');
    }
  }

  async loadBotStats() {
    try {
      const res = await fetch('/api/bot/stats', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.ok) {
        this.botStats = await res.json();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats bot:', error);
    }
  }

  async loadTicketStats() {
    try {
      const res = await fetch('/api/tickets/stats', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.ok) {
        this.ticketStats = await res.json();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats tickets:', error);
    }
  }

  async loadActiveTickets() {
    try {
      const res = await fetch('/api/tickets/active', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.ok) {
        this.activeTickets = await res.json();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tickets actifs:', error);
    }
  }

  async loadTranscripts() {
    try {
      const res = await fetch('/api/tickets/transcripts', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.ok) {
        this.transcripts = await res.json();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transcripts:', error);
    }
  }

  async loadRecentLogs() {
    try {
      const res = await fetch('/api/bot/logs?limit=10', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.ok) {
        this.recentLogs = await res.json();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs récents:', error);
    }
  }

  async loadLogFiles() {
    try {
      const res = await fetch('/api/bot/logs/files', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.ok) {
        this.logFiles = await res.json();
        if (this.currentSection === 'logs') {
          this.renderCurrentSection();
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers de logs:', error);
    }
  }

  async loadLogFileContent(filename) {
    try {
      // Afficher un indicateur de chargement
      this.showLogModal(filename, '<div class="loading-indicator"><i class="fas fa-spinner fa-spin"></i> Chargement du fichier...</div>');
      
      const res = await fetch(`/api/bot/logs/files/${filename}`, {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      
      if (res.ok) {
        const data = await res.json();
        this.showLogModal(filename, data.content);
      } else if (res.status === 401) {
        this.showNotification('Session expirée, veuillez vous reconnecter.', 'error');
        this.logout();
      } else {
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du contenu du log:', error);
      this.showNotification('Erreur lors du chargement du fichier de log', 'error');
      this.closeModal();
    }
  }

  async downloadLogFile(filename) {
    try {
      const res = await fetch(`/api/bot/logs/files/${filename}`, {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // Créer un blob avec le contenu du fichier
        const blob = new Blob([data.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        
        // Créer un lien de téléchargement
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Nettoyer
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showNotification(`Fichier ${filename} téléchargé avec succès !`, 'success');
      } else if (res.status === 401) {
        this.showNotification('Session expirée, veuillez vous reconnecter.', 'error');
        this.logout();
      } else {
        throw new Error('Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error);
      this.showNotification('Erreur lors du téléchargement du fichier', 'error');
    }
  }

  async createTestLogs() {
    try {
      const res = await fetch('/api/bot/logs/test', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.ok) {
        this.showNotification('Logs de test créés avec succès !', 'success');
        // Recharger les logs après 3 secondes
        setTimeout(() => {
          this.loadRecentLogs();
          this.loadLogFiles();
        }, 3000);
      } else {
        throw new Error('Erreur lors de la création des logs de test');
      }
    } catch (error) {
      console.error('Erreur lors de la création des logs de test:', error);
      this.showNotification('Erreur lors de la création des logs de test', 'error');
    }
  }

  async showLogsConfig() {
    try {
      // Charger la configuration actuelle
      const res = await fetch('/api/bot/logs/config', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      
      if (res.ok) {
        const config = await res.json();
        this.showLogConfigModal(config);
      } else if (res.status === 401) {
        this.showNotification('Session expirée, veuillez vous reconnecter.', 'error');
        this.logout();
      } else {
        throw new Error('Erreur lors du chargement de la configuration');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la config logs:', error);
      this.showNotification('Erreur lors du chargement de la configuration', 'error');
    }
  }

  showLogConfigModal(config) {
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');

    modalTitle.textContent = 'Configuration des Logs';
    modalContent.innerHTML = `
      <div class="config-form">
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" id="create-test-logs-startup" ${config.create_test_logs_on_startup ? 'checked' : ''}>
            <span class="checkmark"></span>
            Créer des logs de test au démarrage
          </label>
          <small class="form-help">Si activé, des logs de test seront automatiquement créés à chaque démarrage du bot.</small>
        </div>
        
        <div class="form-group">
          <label class="form-label">Nombre maximum de fichiers de logs</label>
          <input type="number" id="max-log-files" value="${config.max_log_files}" min="1" max="365" class="form-input">
          <small class="form-help">Nombre de fichiers de logs à conserver (1-365 jours).</small>
        </div>
        
        <div class="form-group">
          <label class="form-label">Logs en mémoire maximum</label>
          <input type="number" id="max-memory-logs" value="${config.max_memory_logs}" min="100" max="10000" class="form-input">
          <small class="form-help">Nombre de logs à garder en mémoire pour l'affichage rapide.</small>
        </div>
        
        <div class="form-group">
          <label class="form-label">Niveau de log</label>
          <select id="log-level" class="form-select">
            <option value="debug" ${config.log_level === 'debug' ? 'selected' : ''}>Debug</option>
            <option value="info" ${config.log_level === 'info' ? 'selected' : ''}>Info</option>
            <option value="warn" ${config.log_level === 'warn' ? 'selected' : ''}>Warning</option>
            <option value="error" ${config.log_level === 'error' ? 'selected' : ''}>Error</option>
          </select>
          <small class="form-help">Niveau minimum des logs à enregistrer.</small>
        </div>
        
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" id="auto-cleanup" ${config.auto_cleanup ? 'checked' : ''}>
            <span class="checkmark"></span>
            Nettoyage automatique
          </label>
          <small class="form-help">Supprime automatiquement les anciens fichiers de logs.</small>
        </div>
        
        <div class="form-actions">
          <button class="btn btn-primary" onclick="app.saveLogsConfig()">
            <i class="fas fa-save"></i>
            Sauvegarder
          </button>
          <button class="btn btn-secondary" onclick="app.closeModal()">
            <i class="fas fa-times"></i>
            Annuler
          </button>
        </div>
      </div>
    `;

    modalOverlay.style.display = 'flex';
  }

  async saveLogsConfig() {
    try {
      const config = {
        create_test_logs_on_startup: document.getElementById('create-test-logs-startup').checked,
        max_log_files: parseInt(document.getElementById('max-log-files').value),
        max_memory_logs: parseInt(document.getElementById('max-memory-logs').value),
        log_level: document.getElementById('log-level').value,
        auto_cleanup: document.getElementById('auto-cleanup').checked
      };

      const res = await fetch('/api/bot/logs/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token
        },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        this.showNotification('Configuration sauvegardée avec succès !', 'success');
        this.closeModal();
      } else if (res.status === 401) {
        this.showNotification('Session expirée, veuillez vous reconnecter.', 'error');
        this.logout();
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la config logs:', error);
      this.showNotification('Erreur lors de la sauvegarde de la configuration', 'error');
    }
  }

  async loadServerData() {
    try {
      const res = await fetch('/api/discord/server-data', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.ok) {
        this.serverData = await res.json();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données du serveur:', error);
    }
  }

  async refreshServerData() {
    try {
      this.showNotification('Actualisation des données du serveur...', 'info');
      await this.loadServerData();
      
      // Recharger la section actuelle pour mettre à jour les menus déroulants
      this.loadSection(this.currentSection);
      
      this.showNotification('Données du serveur actualisées !', 'success');
    } catch (error) {
      console.error('Erreur lors de l\'actualisation des données du serveur:', error);
      this.showNotification('Erreur lors de l\'actualisation des données', 'error');
    }
  }

  showApp() {
    this.hideLogin();
  }

  loadSection(section) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');
    const titles = {
      dashboard: 'Dashboard',
      tickets: 'Système Tickets',
      moderation: 'Modération',
      economy: 'Économie',
      channels: 'Salons',
      roles: 'Rôles',
      logs: 'Logs'
    };
    document.getElementById('page-title').textContent = titles[section] || section;
    this.currentSection = section;
    this.renderSection(section);
  }

  renderSection(section) {
    const content = document.getElementById('content');
    switch (section) {
      case 'dashboard':
        content.innerHTML = this.renderDashboard();
        break;
      case 'tickets':
        content.innerHTML = this.renderTickets();
        break;
      case 'moderation':
        content.innerHTML = this.renderModeration();
        break;
      case 'economy':
        content.innerHTML = this.renderEconomy();
        break;
      case 'channels':
        content.innerHTML = this.renderChannels();
        break;
      case 'roles':
        content.innerHTML = this.renderRoles();
        break;
      case 'logs':
        content.innerHTML = this.renderLogs();
        this.loadLogFiles(); // Charger les fichiers de logs
        break;
      case 'embeds':
        content.innerHTML = this.renderEmbeds();
        // Charger les données du serveur si nécessaire
        if (!this.serverData.channels) {
          this.loadServerData();
        }
        break;
      case 'users':
        if (this.hasPermission('users', 'view')) {
          content.innerHTML = this.renderUsers();
          this.loadUsers();
          this.loadRoles();
          this.loadModules();
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;
      default:
        content.innerHTML = '<div class="card"><h2>Section en développement</h2></div>';
    }
  }

  renderCurrentSection() {
    if (this.currentSection === 'logs') {
      const content = document.getElementById('content');
      content.innerHTML = this.renderLogs();
    }
  }

  formatUptime(seconds) {
    if (!seconds || seconds === 'Calculé côté serveur' || !Number.isFinite(seconds) || isNaN(seconds)) {
      return '<span class="loading">⏳ Chargement...</span>';
    }
    
    // S'assurer que seconds est un nombre positif
    seconds = Math.max(0, Number(seconds));
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    let result = '';
    if (days > 0) result += `${days}j `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m `;
    if (secs > 0) result += `${secs}s `;
    if (ms > 0 && days === 0 && hours === 0) result += `${ms}ms`;
    
    return result.trim() || '0s';
  }

  getStatusInfo() {
    const status = this.botStats.status || 'offline';
    const statusMap = {
      'online': { dot: 'online', text: 'En ligne', color: '#00d26a' },
      'connecting': { dot: 'away', text: 'Connexion...', color: '#faa61a' },
      'offline': { dot: 'offline', text: 'Hors ligne', color: '#f04747' }
    };
    return statusMap[status] || statusMap.offline;
  }

  // Fonction pour parser correctement les timestamps
  parseTimestamp(timestamp) {
    if (!timestamp) return new Date();
    
    // Si c'est déjà un nombre (timestamp Unix)
    if (typeof timestamp === 'number') {
      return new Date(timestamp);
    }
    
    // Si c'est une chaîne de caractères
    if (typeof timestamp === 'string') {
      // Essayer de parser comme ISO string d'abord
      const isoDate = new Date(timestamp);
      if (!isNaN(isoDate.getTime())) {
        return isoDate;
      }
      
      // Essayer de parser comme timestamp Unix en string
      const unixTimestamp = parseInt(timestamp);
      if (!isNaN(unixTimestamp)) {
        return new Date(unixTimestamp);
      }
    }
    
    // Fallback vers la date actuelle
    return new Date();
  }

  renderRecentActivity() {
    if (!this.recentLogs || this.recentLogs.length === 0) {
      return '<p class="no-activity">Aucune activité récente à afficher.</p>';
    }

    return this.recentLogs.map(log => {
      const typeIcons = {
        'MODERATION': '🛡️',
        'MEMBER_JOIN': '📥',
        'MEMBER_LEAVE': '📤',
        'MESSAGE_DELETE': '🗑️',
        'MESSAGE_EDIT': '✏️',
        'VOICE_JOIN': '🔊',
        'VOICE_LEAVE': '🔇',
        'VOICE_SWITCH': '🔄',
        'ECONOMY': '💰',
        'COMMAND': '⚡'
      };

      const icon = typeIcons[log.type] || '📋';
      
      // Utiliser la fonction parseTimestamp pour éviter les NaN
      const parsedDate = this.parseTimestamp(log.timestamp);
      const time = parsedDate.toLocaleTimeString('fr-FR');
      
      let description = '';
      switch (log.type) {
        case 'MODERATION':
          description = `${log.data.action} - ${log.data.target}`;
          break;
        case 'MEMBER_JOIN':
        case 'MEMBER_LEAVE':
          description = `${log.data.member}`;
          break;
        case 'COMMAND':
          description = `${log.data.command} par ${log.data.user}`;
          break;
        case 'ECONOMY':
          description = `${log.data.action} - ${log.data.amount} coins`;
          break;
        default:
          description = log.data.message || 'Action inconnue';
      }

      return `
        <div class="activity-item">
          <span class="activity-icon">${icon}</span>
          <div class="activity-content">
            <div class="activity-description">${description}</div>
            <div class="activity-time">${time}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderDashboard() {
    const statusInfo = this.getStatusInfo();
    
    return `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-ticket-alt"></i>
          </div>
          <div class="stat-value">${this.ticketStats.activeCount || 0}</div>
          <div class="stat-label">Tickets Actifs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-value">${this.botStats.users || 0}</div>
          <div class="stat-label">Utilisateurs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-server"></i>
          </div>
          <div class="stat-value">${this.botStats.guilds || 0}</div>
          <div class="stat-label">Serveurs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-hashtag"></i>
          </div>
          <div class="stat-value">${this.botStats.channels || 0}</div>
          <div class="stat-label">Salons</div>
        </div>
      </div>
      
      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fas fa-robot"></i>
              Statut du Bot
            </h3>
          </div>
          <div class="card-content">
            <div class="status-info">
              <div class="status-indicator">
                <span class="status-dot ${statusInfo.dot}"></span>
                <span class="status-text">${statusInfo.text}</span>
              </div>
              <div class="uptime-info">
                <strong>Uptime:</strong> ${this.formatUptime(this.botStats.uptime)}
              </div>
              <div class="memory-info">
                <strong>Mémoire:</strong> ${Math.round((this.botStats.memoryUsage?.used || 0) / 1024 / 1024)}MB
              </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fas fa-clock"></i>
              Activité Récente
            </h3>
          </div>
          <div class="card-content">
            <div class="recent-activity">
              ${this.renderRecentActivity()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderLogs() {
    const logFiles = Array.isArray(this.logFiles) ? this.logFiles : [];
    
    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-file-alt"></i>
            Fichiers de Logs
          </h3>
          <div class="card-actions">
            <button class="btn btn-primary" id="create-test-logs-btn">
              <i class="fas fa-plus"></i>
              Créer des logs de test
            </button>
            <button class="btn btn-secondary" id="refresh-logs-btn">
              <i class="fas fa-sync-alt"></i>
              Actualiser
            </button>
            <button class="btn btn-secondary" id="logs-config-btn">
              <i class="fas fa-cog"></i>
              Configuration
            </button>
          </div>
        </div>
        <div class="card-content">
          ${logFiles.length === 0 ? `
            <div class="empty-state">
              <i class="fas fa-file-alt"></i>
              <h4>Aucun fichier de log disponible</h4>
              <p>Les logs apparaîtront ici une fois que le bot aura généré des événements.</p>
            </div>
          ` : `
            <div class="table-container">
              <table class="table">
                <thead>
                  <tr>
                    <th>Nom du fichier</th>
                    <th>Taille</th>
                    <th>Dernière modification</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${logFiles.map(file => `
                    <tr>
                      <td>
                        <i class="fas fa-file-alt"></i>
                        ${file.filename}
                      </td>
                      <td>${this.formatFileSize(file.size)}</td>
                      <td>${new Date(file.modified).toLocaleString('fr-FR')}</td>
                      <td>
                        <button class="btn btn-sm btn-primary view-log-btn" data-filename="${file.filename}">
                          <i class="fas fa-eye"></i>
                          Voir
                        </button>
                        <button class="btn btn-sm btn-secondary download-log-btn" data-filename="${file.filename}">
                          <i class="fas fa-download"></i>
                          Télécharger
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-clock"></i>
            Activité Récente en Temps Réel
          </h3>
        </div>
        <div class="card-content">
          <div class="recent-activity">
            ${this.renderRecentActivity()}
          </div>
        </div>
      </div>
    `;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  showLogModal(filename, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');

    modalTitle.textContent = `Log: ${filename}`;
    
    // Si c'est un indicateur de chargement, l'afficher directement
    if (content.includes('loading-indicator')) {
      modalContent.innerHTML = content;
    } else {
      // Formater le contenu des logs avec coloration syntaxique
      const formattedContent = this.formatLogContent(content);
      modalContent.innerHTML = `
        <div class="log-content">
          <div class="log-header">
            <span class="log-filename">${filename}</span>
            <span class="log-lines">${content.split('\n').length} lignes</span>
          </div>
          <pre><code>${formattedContent}</code></pre>
        </div>
      `;
    }

    modalOverlay.style.display = 'flex';
  }

  formatLogContent(content) {
    return content
      .split('\n')
      .map(line => {
        if (!line.trim()) return '';
        
        // Échapper le HTML
        line = this.escapeHtml(line);
        
        // Colorer les différents types de logs
        if (line.includes('[SYSTEM]')) {
          line = line.replace(/\[SYSTEM\]/g, '<span class="log-type log-system">[SYSTEM]</span>');
        } else if (line.includes('[MEMBER_JOIN]')) {
          line = line.replace(/\[MEMBER_JOIN\]/g, '<span class="log-type log-member-join">[MEMBER_JOIN]</span>');
        } else if (line.includes('[MEMBER_LEAVE]')) {
          line = line.replace(/\[MEMBER_LEAVE\]/g, '<span class="log-type log-member-leave">[MEMBER_LEAVE]</span>');
        } else if (line.includes('[COMMAND]')) {
          line = line.replace(/\[COMMAND\]/g, '<span class="log-type log-command">[COMMAND]</span>');
        } else if (line.includes('[ECONOMY]')) {
          line = line.replace(/\[ECONOMY\]/g, '<span class="log-type log-economy">[ECONOMY]</span>');
        } else if (line.includes('[MODERATION]')) {
          line = line.replace(/\[MODERATION\]/g, '<span class="log-type log-moderation">[MODERATION]</span>');
        } else if (line.includes('[MESSAGE_DELETE]')) {
          line = line.replace(/\[MESSAGE_DELETE\]/g, '<span class="log-type log-message-delete">[MESSAGE_DELETE]</span>');
        } else if (line.includes('[MESSAGE_EDIT]')) {
          line = line.replace(/\[MESSAGE_EDIT\]/g, '<span class="log-type log-message-edit">[MESSAGE_EDIT]</span>');
        } else if (line.includes('[VOICE_')) {
          line = line.replace(/\[VOICE_[A-Z]+\]/g, '<span class="log-type log-voice">$&</span>');
        }
        
        // Colorer les timestamps
        line = line.replace(/^\[([^\]]+)\]/, '<span class="log-timestamp">[$1]</span>');
        
        return line;
      })
      .join('\n');
  }

  closeModal() {
    document.getElementById('modal-overlay').style.display = 'none';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Fonction utilitaire pour récupérer correctement les valeurs des formulaires
  getFormData(form, checkboxFields = [], numberFields = [], booleanAsString = false) {
    const data = {};
    
    // Récupérer tous les champs normaux
    const formData = new FormData(form);
    for (const [key, value] of formData.entries()) {
      if (!checkboxFields.includes(key)) {
        if (numberFields.includes(key)) {
          data[key] = parseInt(value) || 0;
        } else {
          data[key] = value;
        }
      }
    }
    
    // Récupérer les checkboxes (qui ne sont pas incluses dans FormData si non cochées)
    checkboxFields.forEach(name => {
      const checkbox = form.querySelector(`[name="${name}"]`);
      if (checkbox) {
        data[name] = booleanAsString ? checkbox.checked.toString() : checkbox.checked;
      } else {
        data[name] = booleanAsString ? 'false' : false;
      }
    });
    
    return data;
  }

  generateChannelOptions(selectedId = '', includeEmpty = true) {
    let options = '';
    if (includeEmpty) {
      options += '<option value="">-- Sélectionner un salon --</option>';
    }
    
    if (!this.serverData || !this.serverData.channels) {
      options += '<option value="" disabled>⚠️ Données du serveur non disponibles - Cliquez sur Actualiser</option>';
      return options;
    }
    
    if (this.serverData && this.serverData.channels) {
      // Grouper par catégories
      const categories = {};
      const noCategory = [];
      
      this.serverData.channels.forEach(channel => {
        if (channel.type === 'GUILD_TEXT') {
          if (channel.parent) {
            if (!categories[channel.parent.name]) {
              categories[channel.parent.name] = [];
            }
            categories[channel.parent.name].push(channel);
          } else {
            noCategory.push(channel);
          }
        }
      });
      
      // Ajouter les salons sans catégorie
      noCategory.forEach(channel => {
        const selected = channel.id === selectedId ? 'selected' : '';
        options += `<option value="${channel.id}" ${selected}># ${this.escapeHtml(channel.name)}</option>`;
      });
      
      // Ajouter les catégories avec leurs salons
      Object.keys(categories).sort().forEach(categoryName => {
        options += `<optgroup label="📁 ${this.escapeHtml(categoryName)}">`;
        categories[categoryName].forEach(channel => {
          const selected = channel.id === selectedId ? 'selected' : '';
          options += `<option value="${channel.id}" ${selected}># ${this.escapeHtml(channel.name)}</option>`;
        });
        options += '</optgroup>';
      });
    }
    
    return options;
  }

  generateRoleOptions(selectedId = '', includeEmpty = true) {
    let options = '';
    if (includeEmpty) {
      options += '<option value="">-- Sélectionner un rôle --</option>';
    }
    
    if (!this.serverData || !this.serverData.roles) {
      options += '<option value="" disabled>⚠️ Données du serveur non disponibles - Cliquez sur Actualiser</option>';
      return options;
    }
    
    if (this.serverData && this.serverData.roles) {
      // Trier les rôles par position (les plus hauts en premier)
      const sortedRoles = [...this.serverData.roles]
        .filter(role => role.name !== '@everyone') // Exclure @everyone
        .sort((a, b) => b.position - a.position);
      
      sortedRoles.forEach(role => {
        const selected = role.id === selectedId ? 'selected' : '';
        const color = role.color ? `style="color: #${role.color.toString(16).padStart(6, '0')}"` : '';
        options += `<option value="${role.id}" ${selected} ${color}>@${this.escapeHtml(role.name)}</option>`;
      });
    }
    
    return options;
  }

  generateCategoryOptions(selectedId = '', includeEmpty = true) {
    let options = '';
    if (includeEmpty) {
      options += '<option value="">-- Sélectionner une catégorie --</option>';
    }
    
    if (!this.serverData || !this.serverData.categories) {
      options += '<option value="" disabled>⚠️ Données du serveur non disponibles - Cliquez sur Actualiser</option>';
      return options;
    }
    
    if (this.serverData && this.serverData.categories) {
      this.serverData.categories.forEach(category => {
        const selected = category.id === selectedId ? 'selected' : '';
        options += `<option value="${category.id}" ${selected}>📁 ${this.escapeHtml(category.name)}</option>`;
      });
    }
    
    return options;
  }

  renderTickets() {
    const ticketConfig = this.config.ticket || {};
    const panelConfig = ticketConfig.panel || {};
    
    return `
      <div class="section-header">
        <h1>
          <i class="fas fa-ticket-alt"></i>
          Configuration des Tickets
        </h1>
        <p>Gérez le système de tickets de support de votre serveur Discord.</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-cog"></i>
            Configuration Générale
          </h3>
        </div>
        <div class="card-content">
          <form id="ticket-config-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Système Activé</label>
                <label class="toggle-switch">
                  <input type="checkbox" name="enabled" ${ticketConfig.enabled ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
                <small class="form-help">Active ou désactive le système de tickets.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Limite de Tickets par Utilisateur</label>
                <input type="number" class="form-input" name="ticket_limit" value="${ticketConfig.ticket_limit || 1}" min="1" max="10">
                <small class="form-help">Nombre maximum de tickets ouverts simultanément par utilisateur.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Catégorie des Tickets</label>
                <select class="form-select" name="category">
                  ${this.generateCategoryOptions(ticketConfig.category)}
                </select>
                <small class="form-help">Catégorie Discord où créer les tickets.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Rôle de Support</label>
                <select class="form-select" name="support_role">
                  ${this.generateRoleOptions(ticketConfig.support_role)}
                </select>
                <small class="form-help">Rôle qui peut voir et gérer les tickets.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Canal des Transcripts</label>
                <select class="form-select" name="transcript_channel">
                  ${this.generateChannelOptions(ticketConfig.transcript_channel)}
                </select>
                <small class="form-help">Canal où envoyer les transcripts des tickets fermés.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Message d'Ouverture</label>
                <textarea class="form-input form-textarea" name="message" placeholder="Message affiché lors de l'ouverture d'un ticket">${ticketConfig.message || ''}</textarea>
                <small class="form-help">Message automatique envoyé lors de l'ouverture d'un ticket.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Message de Fermeture</label>
                <textarea class="form-input form-textarea" name="close_message" placeholder="Message affiché lors de la fermeture d'un ticket">${ticketConfig.close_message || ''}</textarea>
                <small class="form-help">Message automatique envoyé lors de la fermeture d'un ticket.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Logs des Transcripts</label>
                <label class="toggle-switch">
                  <input type="checkbox" name="log_transcripts" ${ticketConfig.log_transcripts ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
                <small class="form-help">Enregistre automatiquement les transcripts des tickets fermés.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Logger Toutes les Actions</label>
                <label class="toggle-switch">
                  <input type="checkbox" name="log_all_actions" ${ticketConfig.log_all_actions ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
                <small class="form-help">Enregistre toutes les actions liées aux tickets.</small>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i>
                Sauvegarder
              </button>
              <button type="button" class="btn btn-secondary" onclick="location.reload()">
                <i class="fas fa-undo"></i>
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-desktop"></i>
            Configuration du Panel
          </h3>
        </div>
        <div class="card-content">
          <form id="ticket-panel-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Canal du Panel</label>
                <select class="form-select" name="panel_channel">
                  ${this.generateChannelOptions(panelConfig.channel)}
                </select>
                <small class="form-help">Canal où afficher le panel de création de tickets.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Type de Sélection</label>
                <select class="form-select" name="selection_type">
                  <option value="button" ${panelConfig.selection_type === 'button' ? 'selected' : ''}>Bouton Simple</option>
                  <option value="dropdown" ${panelConfig.selection_type === 'dropdown' ? 'selected' : ''}>Menu Déroulant</option>
                </select>
                <small class="form-help">Type d'interface pour créer un ticket.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Titre de l'Embed</label>
                <input type="text" class="form-input" name="embed_title" value="${panelConfig.embed_title || ''}" placeholder="Titre du panel">
                <small class="form-help">Titre affiché sur le panel de tickets.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Texte de l'Embed</label>
                <textarea class="form-input form-textarea" name="embed_text" placeholder="Description du panel">${panelConfig.embed_text || ''}</textarea>
                <small class="form-help">Description affichée sur le panel de tickets.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Label du Bouton</label>
                <input type="text" class="form-input" name="button_label" value="${panelConfig.button_label || ''}" placeholder="Texte du bouton">
                <small class="form-help">Texte affiché sur le bouton de création de ticket.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Couleur du Bouton</label>
                <select class="form-select" name="button_color">
                  <option value="Primary" ${panelConfig.button_color === 'Primary' ? 'selected' : ''}>Bleu (Primary)</option>
                  <option value="Secondary" ${panelConfig.button_color === 'Secondary' ? 'selected' : ''}>Gris (Secondary)</option>
                  <option value="Success" ${panelConfig.button_color === 'Success' ? 'selected' : ''}>Vert (Success)</option>
                  <option value="Danger" ${panelConfig.button_color === 'Danger' ? 'selected' : ''}>Rouge (Danger)</option>
                </select>
                <small class="form-help">Couleur du bouton de création de ticket.</small>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Options du Menu Déroulant</label>
              <textarea class="form-input form-textarea" name="dropdown_options" placeholder="Une option par ligne">${(panelConfig.dropdown_options || []).join('\n')}</textarea>
              <small class="form-help">Options disponibles dans le menu déroulant (une par ligne).</small>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i>
                Sauvegarder Panel
              </button>
              <button type="button" class="btn btn-success" id="test-panel-btn">
                <i class="fas fa-paper-plane"></i>
                Tester le Panel
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  renderModeration() {
    const modConfig = this.config.moderation || {};
    
    return `
      <div class="section-header">
        <h1>
          <i class="fas fa-shield-alt"></i>
          Configuration de la Modération
        </h1>
        <p>Gérez les paramètres de modération de votre serveur Discord.</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-cog"></i>
            Paramètres de Modération
          </h3>
        </div>
        <div class="card-content">
          <form id="moderation-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Supprimer Auto les Réponses Clear</label>
                <label class="toggle-switch">
                  <input type="checkbox" name="auto_delete_clear_response" ${modConfig.auto_delete_clear_response === 'true' ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
                <small class="form-help">Supprime automatiquement les messages de confirmation après un clear.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Délai de Suppression (ms)</label>
                <input type="number" class="form-input" name="clear_response_delay" value="${modConfig.clear_response_delay || '5000'}" min="1000" max="30000">
                <small class="form-help">Temps avant suppression des messages de confirmation (1000-30000ms).</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">MP lors des Sanctions</label>
                <label class="toggle-switch">
                  <input type="checkbox" name="dm_on_punishment" ${modConfig.dm_on_punishment === 'true' ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
                <small class="form-help">Envoie un message privé à l'utilisateur lors d'une sanction.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Logger Toutes les Actions</label>
                <label class="toggle-switch">
                  <input type="checkbox" name="log_all_actions" ${modConfig.log_all_actions === 'true' ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
                <small class="form-help">Enregistre toutes les actions de modération dans les logs.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Durée Max de Timeout</label>
                <input type="text" class="form-input" name="max_timeout_duration" value="${modConfig.max_timeout_duration || '28d'}" placeholder="28d">
                <small class="form-help">Durée maximale pour un timeout (ex: 1h, 1d, 28d).</small>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i>
                Sauvegarder
              </button>
              <button type="button" class="btn btn-secondary" onclick="location.reload()">
                <i class="fas fa-undo"></i>
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  renderEconomy() {
    const ecoConfig = this.config.economy || {};
    
    return `
      <div class="section-header">
        <h1>
          <i class="fas fa-coins"></i>
          Configuration de l'Économie
        </h1>
        <p>Gérez les paramètres économiques de votre serveur Discord.</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-cog"></i>
            Paramètres Économiques
          </h3>
        </div>
        <div class="card-content">
          <form id="economy-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Montant Journalier</label>
                <input type="number" class="form-input" name="daily_amount" value="${ecoConfig.daily_amount || '250'}" min="1" max="10000">
                <small class="form-help">Montant de coins reçu avec la commande daily.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Travail Min</label>
                <input type="number" class="form-input" name="work_min" value="${ecoConfig.work_min || '50'}" min="1" max="1000">
                <small class="form-help">Montant minimum gagné avec la commande work.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Travail Max</label>
                <input type="number" class="form-input" name="work_max" value="${ecoConfig.work_max || 500}" min="1" max="10000">
                <small class="form-help">Montant maximum gagné avec la commande work.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Taux de Réussite Vol</label>
                <input type="number" class="form-input" name="rob_success_rate" value="${parseFloat(ecoConfig.rob_success_rate || '0.3') * 100}" min="0" max="100" step="1">
                <small class="form-help">Pourcentage de réussite pour la commande rob (0-100%).</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Vol Min</label>
                <input type="number" class="form-input" name="rob_min" value="${ecoConfig.rob_min || '10'}" min="1" max="1000">
                <small class="form-help">Montant minimum volé avec la commande rob.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Vol Max</label>
                <input type="number" class="form-input" name="rob_max" value="${ecoConfig.rob_max || '100'}" min="1" max="10000">
                <small class="form-help">Montant maximum volé avec la commande rob.</small>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i>
                Sauvegarder
              </button>
              <button type="button" class="btn btn-secondary" onclick="location.reload()">
                <i class="fas fa-undo"></i>
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  renderChannels() {
    const channels = this.config.channels || {};
    
    return `
      <div class="section-header">
        <h1>
          <i class="fas fa-hashtag"></i>
          Configuration des Salons
        </h1>
        <p>Configurez les salons utilisés par le bot pour différentes fonctionnalités.</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-cog"></i>
            Salons du Serveur
          </h3>
          <div class="card-actions">
            <button class="btn btn-sm btn-secondary" id="refresh-server-data-btn" title="Actualiser les données du serveur">
              <i class="fas fa-sync-alt"></i>
              Actualiser
            </button>
          </div>
        </div>
        <div class="card-content">
          <form id="channels-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Salon des Logs</label>
                <select class="form-select" name="logs">
                  ${this.generateChannelOptions(channels.logs)}
                </select>
                <small class="form-help">Salon où seront envoyés tous les logs du bot.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Salon de Bienvenue</label>
                <select class="form-select" name="welcome">
                  ${this.generateChannelOptions(channels.welcome)}
                </select>
                <small class="form-help">Salon pour les messages de bienvenue des nouveaux membres.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Salon d'Au revoir</label>
                <select class="form-select" name="goodbye">
                  ${this.generateChannelOptions(channels.goodbye)}
                </select>
                <small class="form-help">Salon pour les messages d'au revoir des membres qui partent.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Salon de Modération</label>
                <select class="form-select" name="moderation">
                  ${this.generateChannelOptions(channels.moderation)}
                </select>
                <small class="form-help">Salon pour les logs de modération.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Salon d'Économie</label>
                <select class="form-select" name="economy">
                  ${this.generateChannelOptions(channels.economy)}
                </select>
                <small class="form-help">Salon pour les logs économiques.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Salon des Logs Vocaux</label>
                <select class="form-select" name="voice_logs">
                  ${this.generateChannelOptions(channels.voice_logs)}
                </select>
                <small class="form-help">Salon pour les logs d'activité vocale.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Salon Général</label>
                <select class="form-select" name="general">
                  ${this.generateChannelOptions(channels.general)}
                </select>
                <small class="form-help">Salon général principal du serveur.</small>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i>
                Sauvegarder
              </button>
              <button type="button" class="btn btn-secondary" onclick="location.reload()">
                <i class="fas fa-undo"></i>
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  renderRoles() {
    const roles = this.config.roles || {};
    
    return `
      <div class="section-header">
        <h1>
          <i class="fas fa-users-cog"></i>
          Configuration des Rôles
        </h1>
        <p>Configurez les rôles utilisés par le bot pour différentes fonctionnalités.</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-cog"></i>
            Rôles du Serveur
          </h3>
        </div>
        <div class="card-content">
          <form id="roles-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Rôle Modérateur</label>
                <select class="form-select" name="moderator">
                  ${this.generateRoleOptions(roles.moderator)}
                </select>
                <small class="form-help">Rôle pour les modérateurs du serveur.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Rôle Administrateur</label>
                <select class="form-select" name="admin">
                  ${this.generateRoleOptions(roles.admin)}
                </select>
                <small class="form-help">Rôle pour les administrateurs du serveur.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Rôle Membre</label>
                <select class="form-select" name="member">
                  ${this.generateRoleOptions(roles.member)}
                </select>
                <small class="form-help">Rôle de base pour tous les membres.</small>
              </div>
              <div class="form-group">
                <label class="form-label">Rôle Muet</label>
                <select class="form-select" name="muted">
                  ${this.generateRoleOptions(roles.muted)}
                </select>
                <small class="form-help">Rôle appliqué lors d'un mute/timeout.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Rôle VIP</label>
                <select class="form-select" name="vip">
                  ${this.generateRoleOptions(roles.vip)}
                </select>
                <small class="form-help">Rôle pour les membres VIP/premium.</small>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i>
                Sauvegarder
              </button>
              <button type="button" class="btn btn-secondary" onclick="location.reload()">
                <i class="fas fa-undo"></i>
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${message}</span>
        <button class="notification-close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  async saveModerationConfig(form) {
    try {
      const checkboxFields = ['auto_delete_clear_response', 'dm_on_punishment', 'log_all_actions'];
      const moderation = this.getFormData(form, checkboxFields, [], true); // true = boolean as string
      
      this.config.moderation = moderation;
      await this.saveConfig();
      this.showNotification('Configuration de modération sauvegardée !', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la modération:', error);
      this.showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  async saveEconomyConfig(form) {
    try {
      const numberFields = ['work_max', 'daily_amount', 'work_min', 'rob_min', 'rob_max'];
      const economy = this.getFormData(form, [], numberFields, false);
      
      // Traitement spécial pour rob_success_rate (pourcentage)
      const robSuccessField = form.querySelector('[name="rob_success_rate"]');
      if (robSuccessField) {
        economy.rob_success_rate = (parseFloat(robSuccessField.value) / 100).toString();
      }
      
      this.config.economy = economy;
      await this.saveConfig();
      this.showNotification('Configuration économique sauvegardée !', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de l\'économie:', error);
      this.showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  async saveChannelsConfig(form) {
    try {
      const formData = new FormData(form);
      const channels = {};
      
      for (const [key, value] of formData.entries()) {
        channels[key] = value;
      }
      
      this.config.channels = channels;
      await this.saveConfig();
      this.showNotification('Configuration des salons sauvegardée !', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des salons:', error);
      this.showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  async saveRolesConfig(form) {
    try {
      const formData = new FormData(form);
      const roles = {};
      
      for (const [key, value] of formData.entries()) {
        roles[key] = value;
      }
      
      this.config.roles = roles;
      await this.saveConfig();
      this.showNotification('Configuration des rôles sauvegardée !', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des rôles:', error);
      this.showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  async saveTicketConfig(form) {
    try {
      const checkboxFields = ['enabled', 'log_transcripts', 'log_all_actions'];
      const numberFields = ['ticket_limit', 'auto_close_delay'];
      const ticket = this.getFormData(form, checkboxFields, numberFields, false); // false = boolean as boolean
      
      // Fusionner avec la configuration existante
      this.config.ticket = { ...this.config.ticket, ...ticket };
      
      await this.saveConfig();
      this.showNotification('Configuration des tickets sauvegardée !', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des tickets:', error);
      this.showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  async saveTicketPanelConfig(form) {
    try {
      const formData = new FormData(form);
      const ticket = this.config.ticket || {};
      const panel = ticket.panel || {};
      
      for (const [key, value] of formData.entries()) {
        if (key === 'panel_channel') {
          panel.channel = value;
        } else if (key === 'dropdown_options') {
          panel.dropdown_options = value.split('\n').filter(option => option.trim());
        } else {
          panel[key] = value;
        }
      }
      
      ticket.panel = panel;
      this.config.ticket = ticket;
      await this.saveConfig();
      this.showNotification('Configuration du panel sauvegardée !', 'success');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du panel:', error);
      this.showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  async testTicketPanel() {
    try {
      const res = await fetch('/api/tickets/test-panel', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + this.token
        }
      });

      if (res.ok) {
        const data = await res.json();
        this.showNotification(data.message, 'success');
      } else if (res.status === 401) {
        this.showNotification('Session expirée, veuillez vous reconnecter.', 'error');
        this.logout();
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors du test du panel', 'error');
      }
    } catch (error) {
      console.error('Erreur lors du test du panel:', error);
      this.showNotification('Erreur lors du test du panel', 'error');
    }
  }

  async saveConfig() {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token
        },
        body: JSON.stringify(this.config)
      });

      if (!res.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la config:', error);
      throw error;
    }
  }
  // ===== MÉTHODES POUR LES EMBEDS =====

  renderEmbeds() {
    return `
      <div class="section-header">
        <h2>
          <i class="fas fa-code"></i>
          Créateur d'Embeds
        </h2>
        <p>Créez et envoyez des embeds personnalisés complexes dans vos salons Discord</p>
      </div>

      <div class="grid grid-2">
        <!-- Formulaire de création -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fas fa-edit"></i>
              Créateur d'Embed
            </h3>
            <div class="card-actions">
              <button class="btn btn-sm btn-secondary" id="reset-embed-btn">
                <i class="fas fa-undo"></i>
                Reset
              </button>
            </div>
          </div>
          <div class="card-content">
            <form id="embed-form">
              <!-- Informations de base -->
              <div class="form-section">
                <h4><i class="fas fa-info-circle"></i> Informations de base</h4>
                
                <div class="form-group">
                  <label class="form-label">Salon de destination</label>
                  <select id="embed-channel" class="form-select" required>
                    <option value="">Sélectionner un salon...</option>
                    ${this.renderChannelOptions()}
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Titre</label>
                  <input type="text" id="embed-title" class="form-input" placeholder="Titre de l'embed" maxlength="256">
                </div>

                <div class="form-group">
                  <label class="form-label">Description</label>
                  <textarea id="embed-description" class="form-textarea" placeholder="Description de l'embed" rows="4" maxlength="4096"></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">URL (lien sur le titre)</label>
                  <input type="url" id="embed-url" class="form-input" placeholder="https://example.com">
                </div>
              </div>

              <!-- Apparence -->
              <div class="form-section">
                <h4><i class="fas fa-palette"></i> Apparence</h4>
                
                <div class="form-group">
                  <label class="form-label">Couleur</label>
                  <div class="color-input-group">
                    <input type="color" id="embed-color" class="form-color" value="#00AE86">
                    <input type="text" id="embed-color-hex" class="form-input" placeholder="#00AE86" maxlength="7">
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Image principale</label>
                  <input type="url" id="embed-image" class="form-input" placeholder="URL de l'image">
                </div>

                <div class="form-group">
                  <label class="form-label">Miniature</label>
                  <input type="url" id="embed-thumbnail" class="form-input" placeholder="URL de la miniature">
                </div>
              </div>

              <!-- Auteur -->
              <div class="form-section">
                <h4><i class="fas fa-user"></i> Auteur</h4>
                
                <div class="form-group">
                  <label class="form-label">Nom de l'auteur</label>
                  <input type="text" id="embed-author-name" class="form-input" placeholder="Nom de l'auteur" maxlength="256">
                </div>

                <div class="form-group">
                  <label class="form-label">URL de l'auteur</label>
                  <input type="url" id="embed-author-url" class="form-input" placeholder="https://example.com">
                </div>

                <div class="form-group">
                  <label class="form-label">Avatar de l'auteur</label>
                  <input type="url" id="embed-author-icon" class="form-input" placeholder="URL de l'avatar">
                </div>
              </div>

              <!-- Footer -->
              <div class="form-section">
                <h4><i class="fas fa-align-left"></i> Footer</h4>
                
                <div class="form-group">
                  <label class="form-label">Texte du footer</label>
                  <input type="text" id="embed-footer-text" class="form-input" placeholder="Texte du footer" maxlength="2048">
                </div>

                <div class="form-group">
                  <label class="form-label">Icône du footer</label>
                  <input type="url" id="embed-footer-icon" class="form-input" placeholder="URL de l'icône">
                </div>

                <div class="form-group">
                  <label class="form-label">
                    <input type="checkbox" id="embed-timestamp">
                    <span class="checkmark"></span>
                    Ajouter un timestamp
                  </label>
                </div>
              </div>

              <!-- Champs personnalisés -->
              <div class="form-section">
                <h4><i class="fas fa-list"></i> Champs personnalisés</h4>
                <div id="embed-fields-container">
                  <!-- Les champs seront ajoutés dynamiquement -->
                </div>
                <button type="button" class="btn btn-secondary btn-sm" id="add-field-btn">
                  <i class="fas fa-plus"></i>
                  Ajouter un champ
                </button>
              </div>

              <!-- Actions -->
              <div class="form-actions">
                <button type="button" class="btn btn-primary" id="preview-embed-btn">
                  <i class="fas fa-eye"></i>
                  Prévisualiser
                </button>
                <button type="button" class="btn btn-success" id="send-embed-btn">
                  <i class="fas fa-paper-plane"></i>
                  Envoyer
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Prévisualisation et templates -->
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fas fa-eye"></i>
              Prévisualisation
            </h3>
          </div>
          <div class="card-content">
            <div id="embed-preview" class="embed-preview">
              <div class="embed-placeholder">
                <i class="fas fa-eye"></i>
                <p>La prévisualisation apparaîtra ici</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Templates prédéfinis -->
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-templates"></i>
            Templates prédéfinis
          </h3>
        </div>
        <div class="card-content">
          <div class="template-grid">
            <div class="template-card" data-template="announcement">
              <div class="template-preview">
                <div class="mini-embed announcement">
                  <div class="mini-embed-title">📢 Annonce</div>
                  <div class="mini-embed-desc">Template d'annonce officielle</div>
                </div>
              </div>
              <button class="btn btn-sm btn-primary embed-template-btn" data-template="announcement">
                Utiliser ce template
              </button>
            </div>

            <div class="template-card" data-template="event">
              <div class="template-preview">
                <div class="mini-embed event">
                  <div class="mini-embed-title">🎉 Événement</div>
                  <div class="mini-embed-desc">Template pour les événements</div>
                </div>
              </div>
              <button class="btn btn-sm btn-primary embed-template-btn" data-template="event">
                Utiliser ce template
              </button>
            </div>

            <div class="template-card" data-template="info">
              <div class="template-preview">
                <div class="mini-embed info">
                  <div class="mini-embed-title">ℹ️ Information</div>
                  <div class="mini-embed-desc">Template informatif</div>
                </div>
              </div>
              <button class="btn btn-sm btn-primary embed-template-btn" data-template="info">
                Utiliser ce template
              </button>
            </div>

            <div class="template-card" data-template="warning">
              <div class="template-preview">
                <div class="mini-embed warning">
                  <div class="mini-embed-title">⚠️ Avertissement</div>
                  <div class="mini-embed-desc">Template d'avertissement</div>
                </div>
              </div>
              <button class="btn btn-sm btn-primary embed-template-btn" data-template="warning">
                Utiliser ce template
              </button>
            </div>

            <div class="template-card" data-template="success">
              <div class="template-preview">
                <div class="mini-embed success">
                  <div class="mini-embed-title">✅ Succès</div>
                  <div class="mini-embed-desc">Template de confirmation</div>
                </div>
              </div>
              <button class="btn btn-sm btn-primary embed-template-btn" data-template="success">
                Utiliser ce template
              </button>
            </div>

            <div class="template-card" data-template="error">
              <div class="template-preview">
                <div class="mini-embed error">
                  <div class="mini-embed-title">❌ Erreur</div>
                  <div class="mini-embed-desc">Template d'erreur</div>
                </div>
              </div>
              <button class="btn btn-sm btn-primary embed-template-btn" data-template="error">
                Utiliser ce template
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderChannelOptions() {
    if (!this.serverData.channels) return '';
    
    return this.serverData.channels
      .filter(channel => channel.type === 'GUILD_TEXT')
      .map(channel => `
        <option value="${channel.id}">
          ${channel.parent ? `${channel.parent.name} / ` : ''}#${channel.name}
        </option>
      `).join('');
  }

  showEmbedCreator() {
    // Cette méthode peut être utilisée pour des actions spéciales lors de l'ouverture
    this.loadSection('embeds');
  }

  previewEmbed() {
    const embedData = this.getEmbedFormData();
    const previewContainer = document.getElementById('embed-preview');
    
    if (!embedData.title && !embedData.description) {
      previewContainer.innerHTML = `
        <div class="embed-placeholder">
          <i class="fas fa-exclamation-triangle"></i>
          <p>Veuillez remplir au moins le titre ou la description</p>
        </div>
      `;
      return;
    }

    previewContainer.innerHTML = this.renderEmbedPreview(embedData);
  }

  renderEmbedPreview(embedData) {
    const color = embedData.color || '#00AE86';
    
    return `
      <div class="discord-embed" style="border-left-color: ${color}">
        ${embedData.author?.name ? `
          <div class="embed-author">
            ${embedData.author.icon_url ? `<img src="${embedData.author.icon_url}" alt="Author icon" class="embed-author-icon">` : ''}
            ${embedData.author.url ? `<a href="${embedData.author.url}" class="embed-author-name">${embedData.author.name}</a>` : `<span class="embed-author-name">${embedData.author.name}</span>`}
          </div>
        ` : ''}
        
        ${embedData.title ? `
          <div class="embed-title">
            ${embedData.url ? `<a href="${embedData.url}">${embedData.title}</a>` : embedData.title}
          </div>
        ` : ''}
        
        ${embedData.description ? `<div class="embed-description">${embedData.description.replace(/\n/g, '<br>')}</div>` : ''}
        
        ${embedData.fields && embedData.fields.length > 0 ? `
          <div class="embed-fields">
            ${embedData.fields.map(field => `
              <div class="embed-field ${field.inline ? 'inline' : ''}">
                <div class="embed-field-name">${field.name}</div>
                <div class="embed-field-value">${field.value.replace(/\n/g, '<br>')}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${embedData.image?.url ? `<img src="${embedData.image.url}" alt="Embed image" class="embed-image">` : ''}
        
        ${embedData.thumbnail?.url ? `<img src="${embedData.thumbnail.url}" alt="Embed thumbnail" class="embed-thumbnail">` : ''}
        
        ${embedData.footer?.text || embedData.timestamp ? `
          <div class="embed-footer">
            ${embedData.footer?.icon_url ? `<img src="${embedData.footer.icon_url}" alt="Footer icon" class="embed-footer-icon">` : ''}
            <span class="embed-footer-text">
              ${embedData.footer?.text || ''}
              ${embedData.timestamp ? `${embedData.footer?.text ? ' • ' : ''}${new Date().toLocaleString('fr-FR')}` : ''}
            </span>
          </div>
        ` : ''}
      </div>
    `;
  }

  getEmbedFormData() {
    const data = {};
    
    // Informations de base
    const title = document.getElementById('embed-title')?.value.trim();
    const description = document.getElementById('embed-description')?.value.trim();
    const url = document.getElementById('embed-url')?.value.trim();
    const color = document.getElementById('embed-color')?.value;
    
    if (title) data.title = title;
    if (description) data.description = description;
    if (url) data.url = url;
    if (color) data.color = color;
    
    // Images
    const image = document.getElementById('embed-image')?.value.trim();
    const thumbnail = document.getElementById('embed-thumbnail')?.value.trim();
    
    if (image) data.image = { url: image };
    if (thumbnail) data.thumbnail = { url: thumbnail };
    
    // Auteur
    const authorName = document.getElementById('embed-author-name')?.value.trim();
    const authorUrl = document.getElementById('embed-author-url')?.value.trim();
    const authorIcon = document.getElementById('embed-author-icon')?.value.trim();
    
    if (authorName) {
      data.author = { name: authorName };
      if (authorUrl) data.author.url = authorUrl;
      if (authorIcon) data.author.icon_url = authorIcon;
    }
    
    // Footer
    const footerText = document.getElementById('embed-footer-text')?.value.trim();
    const footerIcon = document.getElementById('embed-footer-icon')?.value.trim();
    const timestamp = document.getElementById('embed-timestamp')?.checked;
    
    if (footerText) {
      data.footer = { text: footerText };
      if (footerIcon) data.footer.icon_url = footerIcon;
    }
    
    if (timestamp) data.timestamp = new Date().toISOString();
    
    // Champs personnalisés
    const fields = this.getEmbedFields();
    if (fields.length > 0) data.fields = fields;
    
    return data;
  }

  getEmbedFields() {
    const fields = [];
    const fieldContainers = document.querySelectorAll('.embed-field-container');
    
    fieldContainers.forEach(container => {
      const name = container.querySelector('.field-name')?.value.trim();
      const value = container.querySelector('.field-value')?.value.trim();
      const inline = container.querySelector('.field-inline')?.checked;
      
      if (name && value) {
        fields.push({ name, value, inline: !!inline });
      }
    });
    
    return fields;
  }

  async sendEmbed() {
    const channelId = document.getElementById('embed-channel')?.value;
    const embedData = this.getEmbedFormData();
    
    if (!channelId) {
      this.showNotification('Veuillez sélectionner un salon de destination', 'error');
      return;
    }
    
    if (!embedData.title && !embedData.description) {
      this.showNotification('Veuillez remplir au moins le titre ou la description', 'error');
      return;
    }
    
    try {
      const response = await fetch('/api/embeds/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token
        },
        body: JSON.stringify({
          channelId,
          embed: embedData
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        this.showNotification('Embed envoyé avec succès !', 'success');
        this.resetEmbedForm();
      } else {
        const error = await response.json();
        this.showNotification(error.error || 'Erreur lors de l\'envoi de l\'embed', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'embed:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  resetEmbedForm() {
    // Réinitialiser tous les champs du formulaire
    const form = document.getElementById('embed-form');
    if (form) {
      form.reset();
      document.getElementById('embed-color').value = '#00AE86';
      document.getElementById('embed-color-hex').value = '#00AE86';
      
      // Vider le conteneur des champs
      const fieldsContainer = document.getElementById('embed-fields-container');
      if (fieldsContainer) {
        fieldsContainer.innerHTML = '';
      }
      
      // Réinitialiser la prévisualisation
      const previewContainer = document.getElementById('embed-preview');
      if (previewContainer) {
        previewContainer.innerHTML = `
          <div class="embed-placeholder">
            <i class="fas fa-eye"></i>
            <p>La prévisualisation apparaîtra ici</p>
          </div>
        `;
      }
    }
  }

  loadEmbedTemplate(templateName) {
    const templates = {
      announcement: {
        title: '📢 Annonce Importante',
        description: 'Votre message d\'annonce ici...',
        color: '#FFD700',
        footer: { text: 'Équipe de modération' },
        timestamp: true
      },
      event: {
        title: '🎉 Nouvel Événement',
        description: '**Quand :** Date et heure\n**Où :** Lieu\n**Quoi :** Description de l\'événement',
        color: '#FF6B6B',
        thumbnail: { url: 'https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=EVENT' },
        fields: [
          { name: '📅 Date', value: 'À définir', inline: true },
          { name: '⏰ Heure', value: 'À définir', inline: true },
          { name: '📍 Lieu', value: 'À définir', inline: true }
        ]
      },
      info: {
        title: 'ℹ️ Information',
        description: 'Informations importantes à communiquer...',
        color: '#4ECDC4',
        footer: { text: 'Information' }
      },
      warning: {
        title: '⚠️ Avertissement',
        description: 'Message d\'avertissement important...',
        color: '#FFA500',
        footer: { text: 'Avertissement' }
      },
      success: {
        title: '✅ Opération Réussie',
        description: 'L\'opération s\'est déroulée avec succès !',
        color: '#4CAF50',
        footer: { text: 'Succès' }
      },
      error: {
        title: '❌ Erreur',
        description: 'Une erreur s\'est produite...',
        color: '#F44336',
        footer: { text: 'Erreur' }
      }
    };
    
    const template = templates[templateName];
    if (!template) return;
    
    // Remplir le formulaire avec les données du template
    if (template.title) document.getElementById('embed-title').value = template.title;
    if (template.description) document.getElementById('embed-description').value = template.description;
    if (template.color) {
      document.getElementById('embed-color').value = template.color;
      document.getElementById('embed-color-hex').value = template.color;
    }
    if (template.url) document.getElementById('embed-url').value = template.url;
    if (template.image?.url) document.getElementById('embed-image').value = template.image.url;
    if (template.thumbnail?.url) document.getElementById('embed-thumbnail').value = template.thumbnail.url;
    if (template.author?.name) document.getElementById('embed-author-name').value = template.author.name;
    if (template.author?.url) document.getElementById('embed-author-url').value = template.author.url;
    if (template.author?.icon_url) document.getElementById('embed-author-icon').value = template.author.icon_url;
    if (template.footer?.text) document.getElementById('embed-footer-text').value = template.footer.text;
    if (template.footer?.icon_url) document.getElementById('embed-footer-icon').value = template.footer.icon_url;
    if (template.timestamp) document.getElementById('embed-timestamp').checked = true;
    
    // Gérer les champs personnalisés
    if (template.fields && template.fields.length > 0) {
      const fieldsContainer = document.getElementById('embed-fields-container');
      fieldsContainer.innerHTML = '';
      
      template.fields.forEach(field => {
        this.addEmbedField(field.name, field.value, field.inline);
      });
    }
    
    // Prévisualiser automatiquement
    setTimeout(() => this.previewEmbed(), 100);
    
    this.showNotification(`Template "${templateName}" chargé !`, 'success');
  }

  addEmbedField(name = '', value = '', inline = false) {
    const fieldsContainer = document.getElementById('embed-fields-container');
    const fieldIndex = fieldsContainer.children.length;
    
    const fieldHtml = `
      <div class="embed-field-container" data-index="${fieldIndex}">
        <div class="field-header">
          <span class="field-title">Champ ${fieldIndex + 1}</span>
          <button type="button" class="btn btn-sm btn-danger remove-field-btn">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="form-group">
          <label class="form-label">Nom du champ</label>
          <input type="text" class="form-input field-name" placeholder="Nom du champ" maxlength="256" value="${name}">
        </div>
        <div class="form-group">
          <label class="form-label">Valeur du champ</label>
          <textarea class="form-textarea field-value" placeholder="Valeur du champ" rows="2" maxlength="1024">${value}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">
            <input type="checkbox" class="field-inline" ${inline ? 'checked' : ''}>
            <span class="checkmark"></span>
            Affichage en ligne
          </label>
        </div>
      </div>
    `;
    
    fieldsContainer.insertAdjacentHTML('beforeend', fieldHtml);
    
    // Ajouter l'événement de suppression
    const removeBtn = fieldsContainer.lastElementChild.querySelector('.remove-field-btn');
    removeBtn.addEventListener('click', () => {
      fieldsContainer.removeChild(fieldsContainer.lastElementChild);
    });
  }

  // ==========================================================================
  // FONCTIONS DE GESTION DES UTILISATEURS
  // ==========================================================================

  // Charger la liste des utilisateurs
  async loadUsers() {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.status === 401) {
        this.logout();
        return;
      }
      if (!res.ok) throw new Error('Erreur de chargement');
      this.users = await res.json();
      this.renderUsersTable();
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      this.showNotification('Erreur lors du chargement des utilisateurs.', 'error');
    }
  }

  // Charger les rôles disponibles
  async loadRoles() {
    try {
      const res = await fetch('/api/users/roles', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (!res.ok) throw new Error('Erreur de chargement');
      this.roles = await res.json();
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
    }
  }

  // Charger les modules disponibles
  async loadModules() {
    try {
      const res = await fetch('/api/users/modules', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (!res.ok) throw new Error('Erreur de chargement');
      this.modules = await res.json();
    } catch (error) {
      console.error('Erreur lors du chargement des modules:', error);
    }
  }

  // Rendre la section utilisateurs
  renderUsers() {
    return `
      <div class="users-header">
        <h1>
          <i class="fas fa-users"></i>
          Gestion des Utilisateurs
        </h1>
        ${this.hasPermission('users', 'create') ? `
          <button class="btn btn-primary" onclick="app.showCreateUserModal()">
            <i class="fas fa-plus"></i>
            Nouvel Utilisateur
          </button>
        ` : ''}
      </div>

      <div class="users-stats" id="users-stats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-users"></i>
          </div>
          <div class="stat-value" id="total-users">0</div>
          <div class="stat-label">Total Utilisateurs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-user-check"></i>
          </div>
          <div class="stat-value" id="active-users">0</div>
          <div class="stat-label">Utilisateurs Actifs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-clock"></i>
          </div>
          <div class="stat-value" id="active-sessions">0</div>
          <div class="stat-label">Sessions Actives</div>
        </div>
      </div>

      <div class="filters-bar">
        <div class="filter-group">
          <label class="filter-label">Filtrer par rôle</label>
          <select class="filter-select" id="role-filter" onchange="app.filterUsers()">
            <option value="">Tous les rôles</option>
            <option value="superadmin">Super Admin</option>
            <option value="admin">Administrateur</option>
            <option value="moderator">Modérateur</option>
            <option value="support">Support</option>
            <option value="viewer">Lecteur</option>
          </select>
        </div>
        <div class="filter-group">
          <label class="filter-label">Filtrer par statut</label>
          <select class="filter-select" id="status-filter" onchange="app.filterUsers()">
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
          </select>
        </div>
      </div>

      <div class="users-table" id="users-table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Dernière connexion</th>
              <th>Créé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody id="users-table-body">
            <tr>
              <td colspan="6" class="text-center">Chargement...</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // Rendre le tableau des utilisateurs
  renderUsersTable() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    const roleFilter = document.getElementById('role-filter')?.value || '';
    const statusFilter = document.getElementById('status-filter')?.value || '';

    let filteredUsers = this.users.filter(user => {
      const roleMatch = !roleFilter || user.role === roleFilter;
      const statusMatch = !statusFilter || 
        (statusFilter === 'active' && user.isActive) ||
        (statusFilter === 'inactive' && !user.isActive);
      return roleMatch && statusMatch;
    });

    if (filteredUsers.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Aucun utilisateur trouvé</td></tr>';
      return;
    }

    tbody.innerHTML = filteredUsers.map(user => `
      <tr>
        <td>
          <div class="user-info-table">
            <div class="user-avatar-table">
              ${user.username.charAt(0).toUpperCase()}
            </div>
            <div class="details">
              <div class="username">${user.username}</div>
             ${user.email ? `<div class="email">${user.email}</div>` : ''}
            </div>
          </div>
        </td>
        <td>
          <span class="role-badge ${user.role}">
            ${this.getRoleDisplayName(user.role)}
          </span>
        </td>
        <td>
          <span class="user-status ${user.isActive ? 'active' : 'inactive'}">
            <span class="status-dot"></span>
            ${user.isActive ? 'Actif' : 'Inactif'}
          </span>
        </td>
        <td>
          ${user.lastLogin ? new Date(user.lastLogin).toLocaleString('fr-FR') : 'Jamais'}
        </td>
        <td>
          ${new Date(user.createdAt).toLocaleDateString('fr-FR')}
        </td>
        <td>
          <div class="user-actions">
            ${this.hasPermission('users', 'edit') ? `
              <button class="action-btn action-btn-edit" onclick="app.showEditUserModal('${user.id}')" title="Modifier">
                <i class="fas fa-edit"></i>
              </button>
            ` : ''}
            ${this.hasPermission('users', 'delete') && user.id !== this.currentUser.id ? `
              <button class="action-btn action-btn-delete" onclick="app.deleteUser('${user.id}')" title="Supprimer">
                <i class="fas fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');

    // Mettre à jour les statistiques
    this.updateUsersStats();
  }

  // Mettre à jour les statistiques des utilisateurs
  async updateUsersStats() {
    try {
      const res = await fetch('/api/users/stats', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (!res.ok) throw new Error('Erreur de chargement');
      const stats = await res.json();

      document.getElementById('total-users').textContent = stats.totalUsers || 0;
      document.getElementById('active-users').textContent = stats.activeUsers || 0;
      document.getElementById('active-sessions').textContent = stats.activeSessions || 0;
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }

  // Filtrer les utilisateurs
  filterUsers() {
    this.renderUsersTable();
  }

  // Afficher le modal de création d'utilisateur
  showCreateUserModal() {
    this.showUserModal();
  }

  // Afficher le modal d'édition d'utilisateur
  showEditUserModal(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    this.showUserModal(user);
  }

  // Afficher le modal utilisateur (création/édition)
  showUserModal(user = null) {
    const isEdit = !!user;
    const title = isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur';

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay active';
    modalOverlay.innerHTML = `
      <div class="modal modal-large">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <form class="user-form" onsubmit="app.${isEdit ? 'updateUser' : 'createUser'}(event)">
            ${isEdit ? `<input type="hidden" name="userId" value="${user.id}">` : ''}
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nom d'utilisateur *</label>
                <input type="text" name="username" class="form-input" required 
                       value="${user?.username || ''}" placeholder="Nom d'utilisateur">
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" name="email" class="form-input" 
                       value="${user?.email || ''}" placeholder="email@exemple.com">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">${isEdit ? 'Nouveau mot de passe' : 'Mot de passe *'}</label>
                <input type="password" name="password" class="form-input" 
                       ${!isEdit ? 'required' : ''} placeholder="Mot de passe">
                ${isEdit ? '<small class="form-help">Laissez vide pour conserver le mot de passe actuel</small>' : ''}
              </div>
              <div class="form-group">
                <label class="form-label">Rôle</label>
                <select name="role" class="form-select">
                  ${Object.entries(this.roles).map(([roleKey, roleData]) => `
                    <option value="${roleKey}" ${user?.role === roleKey ? 'selected' : ''}>
                      ${roleData.name}
                    </option>
                  `).join('')}
                </select>
              </div>
            </div>

            ${isEdit ? `
              <div class="form-group">
                <label class="form-label">
                  <input type="checkbox" name="isActive" ${user.isActive ? 'checked' : ''}>
                  Compte actif
                </label>
              </div>
            ` : ''}

            <div class="permissions-section">
              <h3>Permissions personnalisées</h3>
              <p>Cochez les permissions spécifiques pour cet utilisateur (remplace les permissions du rôle).</p>
              
              <div class="permissions-grid">
                ${Object.entries(this.modules).map(([moduleKey, moduleData]) => `
                  <div class="permission-module">
                    <div class="permission-module-header">
                      <i class="${moduleData.icon}"></i>
                      <h4>${moduleData.name}</h4>
                    </div>
                    <div class="permission-checkboxes">
                      ${moduleData.permissions.map(permission => `
                        <div class="permission-checkbox">
                          <input type="checkbox" 
                                 name="permissions[${moduleKey}][]" 
                                 value="${permission}"
                                 id="perm-${moduleKey}-${permission}"
                                 ${user?.permissions?.[moduleKey]?.includes(permission) ? 'checked' : ''}>
                          <label for="perm-${moduleKey}-${permission}">${permission}</label>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i>
                ${isEdit ? 'Mettre à jour' : 'Créer'}
              </button>
              <button type="button" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
                <i class="fas fa-times"></i>
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);
  }

  // Créer un utilisateur
  async createUser(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const userData = {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      customPermissions: this.extractPermissionsFromForm(formData)
    };

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token
        },
        body: JSON.stringify(userData)
      });

      if (res.ok) {
        const newUser = await res.json();
        this.showNotification('Utilisateur créé avec succès !', 'success');
        document.querySelector('.modal-overlay').remove();
        this.loadUsers();
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la création', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  // Mettre à jour un utilisateur
  async updateUser(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const userId = formData.get('userId');
    
    const userData = {
      username: formData.get('username'),
      email: formData.get('email'),
      role: formData.get('role'),
      isActive: formData.has('isActive'),
      customPermissions: this.extractPermissionsFromForm(formData)
    };

    // Ajouter le mot de passe seulement s'il est fourni
    const password = formData.get('password');
    if (password && password.trim()) {
      userData.password = password;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token
        },
        body: JSON.stringify(userData)
      });

      if (res.ok) {
        this.showNotification('Utilisateur mis à jour avec succès !', 'success');
        document.querySelector('.modal-overlay').remove();
        this.loadUsers();
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la mise à jour', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  // Extraire les permissions du formulaire
  extractPermissionsFromForm(formData) {
    const permissions = {};
    
    // Parcourir tous les champs de permissions
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('permissions[') && key.endsWith('][]')) {
        const module = key.match(/permissions\[(.+)\]\[\]/)?.[1];
        if (module) {
          if (!permissions[module]) {
            permissions[module] = [];
          }
          permissions[module].push(value);
        }
      }
    }
    
    return permissions;
  }

  // Supprimer un utilisateur
  async deleteUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur "${user.username}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + this.token }
      });

      if (res.ok) {
        this.showNotification('Utilisateur supprimé avec succès !', 'success');
        this.loadUsers();
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

}

// Initialiser l'application
const app = new HmmBotAdmin();