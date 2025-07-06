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
    this.customRoles = {};
    this.allRoles = {};
    this.modules = {};
    
    // Données pour le module de mise à jour
    this.updateStatus = null;
    this.updateChanges = null;
    this.updateConfig = null;
    this.updateCheckInterval = null;
    
    // Données par défaut pour les rôles et modules
    this.initDefaultData();
    this.init();
  }

  // Initialiser les données par défaut
  initDefaultData() {
    // Définir les rôles par défaut
    this.roles = {
      superadmin: { 
        name: 'Super Admin', 
        level: 5,
        permissions: {
          dashboard: ['view'],
          tickets: ['view', 'edit'],
          moderation: ['view', 'edit'],
          economy: ['view', 'edit'],
          channels: ['view', 'edit'],
          roles: ['view', 'edit'],
          servers: ['view', 'leave'],
          logs: ['view', 'config'],
          embeds: ['view', 'edit', 'send'],
          users: ['view', 'create', 'edit', 'delete', 'manage_roles'],
          updates: ['view', 'apply', 'config'],
          prefix: ['view', 'edit']
        }
      },
      admin: { 
        name: 'Administrateur', 
        level: 4,
        permissions: {
          dashboard: ['view'],
          tickets: ['view', 'edit'],
          moderation: ['view', 'edit'],
          economy: ['view', 'edit'],
          channels: ['view', 'edit'],
          roles: ['view'],
          servers: ['view'],
          logs: ['view'],
          embeds: ['view', 'edit', 'send'],
          users: ['view', 'edit'],
          updates: ['view'],
          prefix: ['view']
        }
      },
      moderator: { 
        name: 'Modérateur', 
        level: 3,
        permissions: {
          dashboard: ['view'],
          tickets: ['view', 'edit'],
          moderation: ['view', 'edit'],
          economy: ['view'],
          channels: ['view'],
          roles: ['view'],
          servers: ['view'],
          logs: ['view'],
          embeds: ['view', 'send'],
          users: ['view'],
          updates: ['view'],
          prefix: ['view']
        }
      },
      support: { 
        name: 'Support', 
        level: 2,
        permissions: {
          dashboard: ['view'],
          tickets: ['view', 'edit'],
          moderation: ['view'],
          economy: ['view'],
          channels: ['view'],
          roles: ['view'],
          servers: ['view'],
          logs: ['view'],
          embeds: ['view'],
          users: ['view'],
          updates: ['view']
        }
      },
      viewer: { 
        name: 'Lecteur', 
        level: 1,
        permissions: {
          dashboard: ['view'],
          tickets: ['view'],
          moderation: ['view'],
          economy: ['view'],
          channels: ['view'],
          roles: ['view'],
          servers: ['view'],
          logs: ['view'],
          embeds: ['view'],
          users: ['view'],
          updates: ['view']
        }
      }
    };

    // Définir les modules par défaut
    this.modules = {
      dashboard: {
        name: 'Dashboard',
        icon: 'fas fa-tachometer-alt',
        permissions: ['view']
      },
      tickets: {
        name: 'Tickets',
        icon: 'fas fa-ticket-alt',
        permissions: ['view', 'edit']
      },
      moderation: {
        name: 'Modération',
        icon: 'fas fa-shield-alt',
        permissions: ['view', 'edit']
      },
      economy: {
        name: 'Économie',
        icon: 'fas fa-coins',
        permissions: ['view', 'edit']
      },
      channels: {
        name: 'Salons',
        icon: 'fas fa-hashtag',
        permissions: ['view', 'edit']
      },
      roles: {
        name: 'Rôles',
        icon: 'fas fa-users-cog',
        permissions: ['view', 'edit']
      },
      servers: {
        name: 'Serveurs',
        icon: 'fas fa-server',
        permissions: ['view', 'leave']
      },
      logs: {
        name: 'Logs',
        icon: 'fas fa-file-alt',
        permissions: ['view', 'config']
      },
      embeds: {
        name: 'Embeds',
        icon: 'fas fa-code',
        permissions: ['view', 'edit', 'send']
      },
      updates: {
        name: 'Mise à jour',
        icon: 'fas fa-download',
        permissions: ['view', 'apply', 'config']
      },
      users: {
        name: 'Utilisateurs',
        icon: 'fas fa-users',
        permissions: ['view', 'create', 'edit', 'delete', 'manage_roles']
      },
      prefix: {
        name: 'Préfixe',
        icon: 'fas fa-terminal',
        permissions: ['view', 'edit']
      }
    };
  }

  async init() {
    this.setupEventListeners();
    
    // Ajouter un gestionnaire d'événements spécifique pour le bouton de déconnexion
    setTimeout(() => {
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        console.log('Ajout du gestionnaire d\'événements pour le bouton de déconnexion');
        logoutBtn.addEventListener('click', () => {
          console.log('Clic sur le bouton de déconnexion (gestionnaire direct)');
          this.showLogoutConfirmModal();
        });
      }
    }, 1000);
    
    if (!this.token) {
      this.showLogin();
    } else {
      // Afficher l'écran de connexion avec un loader pendant la vérification de la session
      this.showLogin();
      
      // Afficher un loader sur le bouton de connexion
      const loginBtn = document.querySelector('.login-btn');
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      
      if (loginBtn) {
        const originalBtnText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vérification de la session...';
        loginBtn.disabled = true;
      }
      
      // Désactiver les champs de formulaire pendant la vérification
      if (usernameInput) usernameInput.disabled = true;
      if (passwordInput) passwordInput.disabled = true;
      
      try {
        // Vérifier si la session est valide
        await this.loadCurrentUser();
        
        // Si on arrive ici, la session est valide, charger les données
        await this.loadConfig();
        await this.loadBotStats();
        await this.loadTicketStats();
        await this.loadRecentLogs();
        await this.loadServerData();
        await this.loadUsers();
        await this.loadRoles();
        await this.loadUpdateStatus();
        
        // Afficher l'application
        this.showApp();
        this.updateUserInfo();
        this.updateNavigation();
        this.loadSection('dashboard');
        
        // Configurer l'actualisation périodique
        setInterval(() => {
          this.loadBotStats();
          this.loadTicketStats();
          this.loadRecentLogs();
          this.loadUpdateStatus(); // Vérifier les mises à jour périodiquement
          if (this.currentSection === 'logs') {
            this.loadLogFiles();
          }
          if (this.currentSection === 'tickets') {
            this.loadActiveTickets();
            this.loadTranscripts();
          }
          if (this.currentSection === 'updates') {
            this.loadUpdateChanges();
          }
        }, 30000);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        
        // Session expirée ou invalide, réinitialiser le token
        localStorage.removeItem('jwt');
        this.token = '';
        this.currentUser = null;
        
        // Réinitialiser le formulaire de connexion
        if (loginBtn) {
          loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
          loginBtn.disabled = false;
        }
        
        if (usernameInput) usernameInput.disabled = false;
        if (passwordInput) passwordInput.disabled = false;
        
        // Afficher un message d'erreur
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
          errorDiv.textContent = 'Session expirée. Veuillez vous reconnecter.';
          errorDiv.style.display = 'block';
        }
        
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
      if (e.target.id === 'prefix-form') {
        e.preventDefault();
        await this.savePrefixConfig(e.target);
      }
      if (e.target.id === 'general-config-form') {
        e.preventDefault();
        await this.saveConfig(e.target);
      }
    });
    document.addEventListener('click', (e) => {
      if (e.target.closest('.nav-item')) {
        e.preventDefault();
        const section = e.target.closest('.nav-item').dataset.section;
        this.loadSection(section);
      }
      if (e.target.id === 'logout-btn' || e.target.closest('#logout-btn')) {
        console.log('Clic sur le bouton de déconnexion détecté');
        // Appeler directement la fonction showLogoutConfirmModal au lieu de logout
        this.showLogoutConfirmModal();
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
        this.showLogsConfigModal();
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
      // Gestionnaire pour le changement de rôle dans les formulaires utilisateur
      if (e.target.id === 'user-role') {
        this.handleRoleChange(e.target);
      }
      // Gestionnaires pour les permissions
      if (e.target.classList.contains('permission-checkbox-input')) {
        this.handlePermissionChange(e.target);
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
      // Gestionnaires pour les utilisateurs
      if (e.target.classList.contains('show-create-user-btn')) {
        this.showCreateUserModal();
      }
      if (e.target.classList.contains('show-role-manager-btn')) {
        this.showRoleManagerModal();
      }
      if (e.target.classList.contains('show-create-role-btn')) {
        this.showCreateRoleModal();
      }
      // Gestionnaires pour les serveurs
      if (e.target.classList.contains('leave-server-btn')) {
        const serverId = e.target.dataset.serverId;
        const serverName = e.target.dataset.serverName;
        this.showLeaveServerConfirmModal(serverId, serverName);
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
    const loginBtn = document.querySelector('.login-btn');
    
    if (!username || !password) {
      errorDiv.textContent = 'Veuillez saisir votre nom d\'utilisateur et votre mot de passe';
      errorDiv.style.display = 'block';
      return;
    }
    
    try {
      // Afficher l'indicateur de chargement sur le bouton
      const originalBtnText = loginBtn.innerHTML;
      loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';
      loginBtn.disabled = true;
      
      // Désactiver les champs du formulaire pendant la connexion
      document.getElementById('username').disabled = true;
      document.getElementById('password').disabled = true;
      
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
        
        // Garder le loader pendant le chargement des données
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement des données...';
        
        await this.loadConfig();
        await this.loadBotStats();
        await this.loadTicketStats();
        await this.loadRecentLogs();
        await this.loadServerData();
        await this.loadUsers();
        await this.loadRoles();
        
        // Restaurer le bouton et les champs (même si on va cacher l'écran de login)
        loginBtn.innerHTML = originalBtnText;
        loginBtn.disabled = false;
        document.getElementById('username').disabled = false;
        document.getElementById('password').disabled = false;
        
        this.hideLogin();
        this.showApp();
        this.updateUserInfo();
        this.updateNavigation();
        this.loadSection('dashboard');
        
        this.showNotification(`Bienvenue, ${this.currentUser.username} !`, 'success');
      } else {
        // Restaurer le bouton et les champs en cas d'erreur
        loginBtn.innerHTML = originalBtnText;
        loginBtn.disabled = false;
        document.getElementById('username').disabled = false;
        document.getElementById('password').disabled = false;
        
        const error = await res.json();
        errorDiv.textContent = error.error || 'Erreur de connexion';
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      // Restaurer le bouton et les champs en cas d'erreur
      loginBtn.innerHTML = originalBtnText;
      loginBtn.disabled = false;
      document.getElementById('username').disabled = false;
      document.getElementById('password').disabled = false;
      
      console.error('Erreur lors de la connexion:', error);
      errorDiv.textContent = 'Erreur de connexion au serveur';
      errorDiv.style.display = 'block';
    }
  }

  // Afficher le modal de confirmation de déconnexion
  logout() {
    console.log('Fonction logout appelée');
    this.showLogoutConfirmModal();
  }
  
  // Effectuer la déconnexion après confirmation
  async performLogout() {
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
      // Fermer le modal
      this.closeModal();
      
      // Réinitialiser les données de session
      localStorage.removeItem('jwt');
      this.token = '';
      this.currentUser = null;
      
      // Réinitialiser le formulaire de connexion
      const loginBtn = document.querySelector('.login-btn');
      if (loginBtn) {
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
        loginBtn.disabled = false;
      }
      
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      if (usernameInput) usernameInput.disabled = false;
      if (passwordInput) {
        passwordInput.disabled = false;
        passwordInput.value = ''; // Effacer le mot de passe par sécurité
      }
      
      // Masquer les messages d'erreur précédents
      const errorDiv = document.getElementById('login-error');
      if (errorDiv) errorDiv.style.display = 'none';
      
      // Afficher l'écran de connexion
      this.showLogin();
    }
  }

  // Charger les informations de l'utilisateur actuel
  async loadCurrentUser() {
    try {
      const res = await fetch('/api/user/me', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      
      // Gérer les différents cas d'erreur
      if (res.status === 401 || res.status === 403) {
        throw new Error('Session expirée ou non autorisée');
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Erreur inconnue' }));
        throw new Error(errorData.error || `Erreur de chargement (${res.status})`);
      }
      
      // Charger les données de l'utilisateur
      const userData = await res.json();
      
      // Vérifier que les données contiennent les informations nécessaires
      if (!userData || !userData.username || !userData.role) {
        throw new Error('Données utilisateur incomplètes');
      }
      
      this.currentUser = userData;
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

  // Obtenir le nom d'affichage d'un rôle
  getRoleDisplayName(roleKey) {
    if (!roleKey) return 'Aucun';
    
    // Chercher dans les rôles système
    if (this.roles[roleKey]) {
      return this.roles[roleKey].name;
    }
    
    // Chercher dans les rôles personnalisés
    if (this.customRoles && this.customRoles[roleKey]) {
      return this.customRoles[roleKey].name;
    }
    
    // Fallback
    return roleKey.charAt(0).toUpperCase() + roleKey.slice(1);
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
    if (!this.currentUser) return false;
    
    // Les super admins ont toutes les permissions
    if (this.currentUser.isSuperAdmin) return true;
    
    // Vérifier d'abord les permissions personnalisées de l'utilisateur (si elles existent)
    if (this.currentUser.permissions && this.currentUser.permissions[module]) {
      return this.currentUser.permissions[module].includes(permission);
    }
    
    // Sinon, utiliser les permissions du rôle
    const userRole = this.currentUser.role;
    if (!userRole) return false;
    
    // Vérifier dans les rôles système
    const systemRole = this.roles[userRole];
    if (systemRole && systemRole.permissions && systemRole.permissions[module]) {
      return systemRole.permissions[module].includes(permission);
    }
    
    // Vérifier dans les rôles personnalisés
    const customRole = this.customRoles && this.customRoles[userRole];
    if (customRole && customRole.permissions && customRole.permissions[module]) {
      return customRole.permissions[module].includes(permission);
    }
    
    return false;
  }

  // Appliquer les restrictions selon les permissions edit
  applyEditPermissions(module) {
    const hasEditPermission = this.hasPermission(module, 'edit');
    
    // Désactiver tous les boutons de sauvegarde si pas de permission edit
    const saveButtons = document.querySelectorAll('button[type="submit"], .btn-save, .save-btn');
    saveButtons.forEach(btn => {
      if (!hasEditPermission) {
        btn.disabled = true;
        btn.title = 'Vous n\'avez pas la permission de modifier cette section';
      }
    });
    
    // Désactiver tous les inputs si pas de permission edit (sauf les inputs de connexion)
    const formInputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    formInputs.forEach(input => {
      // Ne jamais désactiver les inputs de connexion
      if (input.id === 'username' || input.id === 'password' || input.closest('#login-form')) {
        return;
      }
      
      if (!hasEditPermission) {
        input.disabled = true;
        input.title = 'Vous n\'avez pas la permission de modifier cette section';
      }
    });
    
    // Masquer les boutons d'action d'édition
    const editButtons = document.querySelectorAll('.btn-edit, .edit-btn');
    editButtons.forEach(btn => {
      if (!hasEditPermission) {
        btn.style.display = 'none';
      }
    });
  }

  // Appliquer les permissions pour les embeds (plus flexible)
  applyEmbedPermissions() {
    const hasEditPermission = this.hasPermission('embeds', 'edit');
    const hasSendPermission = this.hasPermission('embeds', 'send');
    
    // Les inputs sont activés si on a au moins la permission send (sauf les inputs de connexion)
    const formInputs = document.querySelectorAll('input:not([type="hidden"]), textarea, select');
    formInputs.forEach(input => {
      // Ne jamais désactiver les inputs de connexion
      if (input.id === 'username' || input.id === 'password' || input.closest('#login-form')) {
        return;
      }
      
      if (!hasSendPermission) {
        input.disabled = true;
        input.title = 'Vous n\'avez pas la permission d\'utiliser cette section';
      } else {
        input.disabled = false;
        input.title = '';
      }
    });
    
    // Les boutons de sauvegarde/édition nécessitent la permission edit
    const saveButtons = document.querySelectorAll('button[type="submit"], .btn-save, .save-btn');
    saveButtons.forEach(btn => {
      if (!hasEditPermission) {
        btn.disabled = true;
        btn.title = 'Vous n\'avez pas la permission de modifier cette section';
      }
    });
    
    // Le bouton send nécessite seulement la permission send
    const sendButton = document.getElementById('send-embed-btn');
    if (sendButton) {
      if (!hasSendPermission) {
        sendButton.disabled = true;
        sendButton.title = 'Vous n\'avez pas la permission d\'envoyer des embeds';
      } else {
        sendButton.disabled = false;
        sendButton.title = '';
      }
    }
    
    // Masquer les boutons d'action d'édition
    const editButtons = document.querySelectorAll('.btn-edit, .edit-btn');
    editButtons.forEach(btn => {
      if (!hasEditPermission) {
        btn.style.display = 'none';
      }
    });
  }

  // Appliquer les permissions pour les logs
  applyLogPermissions() {
    const hasConfigPermission = this.hasPermission('logs', 'config');
    
    // Le bouton de configuration nécessite la permission config
    const configButton = document.getElementById('logs-config-btn');
    if (configButton) {
      if (!hasConfigPermission) {
        configButton.disabled = true;
        configButton.title = 'Vous n\'avez pas la permission de configurer les logs';
      } else {
        configButton.disabled = false;
        configButton.title = '';
      }
    }
    
    // Les boutons "Voir" restent fonctionnels pour tous ceux qui ont 'view'
    const viewButtons = document.querySelectorAll('.view-log-btn');
    viewButtons.forEach(btn => {
      btn.disabled = false;
      btn.title = '';
    });
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
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          this.showLogModal(filename, data.content || data);
        } else {
          // Si ce n'est pas du JSON, traiter comme du texte brut
          const textContent = await res.text();
          if (textContent.includes('<!DOCTYPE html>') || textContent.includes('<html>')) {
            // Si c'est une page HTML, c'est probablement une erreur de routage
            this.showNotification('Erreur: Le serveur a renvoyé une page web au lieu du contenu du log. Vérifiez la configuration de l\'API.', 'error');
            this.closeModal();
            return;
          }
          this.showLogModal(filename, textContent);
        }
      } else if (res.status === 401) {
        this.showNotification('Session expirée, veuillez vous reconnecter.', 'error');
        this.logout();
      } else {
        const errorText = await res.text();
        console.error('Erreur du serveur:', errorText);
        this.showNotification(`Erreur ${res.status}: ${res.statusText}`, 'error');
        this.closeModal();
      }
    } catch (error) {
      console.error('Erreur lors du chargement du contenu du log:', error);
      this.showNotification('Erreur lors du chargement du fichier de log: ' + error.message, 'error');
      this.closeModal();
    }
  }

  async downloadLogFile(filename) {
    try {
      const res = await fetch(`/api/bot/logs/files/${filename}`, {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        let content;
        
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          content = data.content || data;
        } else {
          content = await res.text();
          if (content.includes('<!DOCTYPE html>') || content.includes('<html>')) {
            this.showNotification('Erreur: Le serveur a renvoyé une page web au lieu du contenu du log.', 'error');
            return;
          }
        }
        
        // Créer un blob avec le contenu du fichier
        const blob = new Blob([content], { type: 'text/plain' });
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
    // Vérifier les permissions
    if (!this.hasPermission('logs', 'config')) {
      this.showNotification('Vous n\'avez pas la permission de configurer les logs', 'error');
      return;
    }

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
          <button class="btn btn-primary" onclick="app.saveBotLogsConfig()">
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

  async saveBotLogsConfig() {
    // Vérifier les permissions
    if (!this.hasPermission('logs', 'config')) {
      this.showNotification('Vous n\'avez pas la permission de configurer les logs', 'error');
      return;
    }

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

  async loadServers() {
    try {
      const res = await fetch('/api/discord/servers', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.ok) {
        this.servers = await res.json();
        this.updateServersDisplay();
      } else {
        throw new Error('Erreur lors du chargement des serveurs');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des serveurs:', error);
      this.showNotification('Erreur lors du chargement des serveurs', 'error');
    }
  }

  updateServersDisplay() {
    const serversContainer = document.getElementById('servers-list');
    if (!serversContainer || !this.servers) return;

    if (this.servers.length === 0) {
      serversContainer.innerHTML = '<div class="no-data">Aucun serveur trouvé</div>';
      return;
    }

    serversContainer.innerHTML = this.servers.map(server => `
      <div class="server-card">
        <div class="server-info">
          <div class="server-avatar">
            ${server.icon ? 
              `<img src="${server.icon}" alt="${server.name}" class="server-icon">` : 
              `<div class="server-icon-placeholder">${server.name.charAt(0).toUpperCase()}</div>`
            }
          </div>
          <div class="server-details">
            <h3 class="server-name">${server.name}</h3>
            <div class="server-stats">
              <span class="member-count">
                <i class="fas fa-users"></i>
                ${server.memberCount} membres
              </span>
              <span class="join-date">
                <i class="fas fa-calendar"></i>
                Rejoint le ${new Date(server.joinedAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
            ${server.description ? `<p class="server-description">${server.description}</p>` : ''}
          </div>
        </div>
        <div class="server-actions">
          ${this.hasPermission('servers', 'leave') ? 
            `<button class="btn btn-danger leave-server-btn" 
                     data-server-id="${server.id}" 
                     data-server-name="${server.name}">
              <i class="fas fa-sign-out-alt"></i>
              Quitter
            </button>` : ''
          }
        </div>
      </div>
    `).join('');
  }

  showLeaveServerConfirmModal(serverId, serverName) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay active';
    modalOverlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Quitter le serveur ?</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <div class="modal-warning">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Êtes-vous sûr de vouloir faire quitter le bot du serveur <strong>"${serverName}"</strong> ?</p>
            <p class="warning-text">Cette action est irréversible. Le bot devra être réinvité pour rejoindre à nouveau ce serveur.</p>
          </div>
          <div class="modal-actions">
            <button id="confirm-leave-server" class="btn btn-danger" data-server-id="${serverId}" data-server-name="${serverName}">
              <i class="fas fa-sign-out-alt"></i>
              Confirmer
            </button>
            <button id="cancel-leave-server" class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">
              <i class="fas fa-times"></i>
              Annuler
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);

    // Ajouter le gestionnaire d'événement pour le bouton de confirmation
    document.getElementById('confirm-leave-server').addEventListener('click', (e) => {
      const serverId = e.target.dataset.serverId;
      const serverName = e.target.dataset.serverName;
      this.leaveServer(serverId, serverName);
      modalOverlay.remove();
    });
  }

  async leaveServer(serverId, serverName) {
    try {
      this.showNotification(`Sortie du serveur "${serverName}" en cours...`, 'info');
      
      const res = await fetch(`/api/discord/servers/${serverId}/leave`, {
        method: 'POST',
        headers: { 
          'Authorization': 'Bearer ' + this.token,
          'Content-Type': 'application/json'
        }
      });

      const result = await res.json();

      if (res.ok) {
        this.showNotification(`Bot a quitté le serveur "${serverName}" avec succès`, 'success');
        // Recharger la liste des serveurs
        await this.loadServers();
      } else {
        throw new Error(result.error || 'Erreur lors de la sortie du serveur');
      }
    } catch (error) {
      console.error('Erreur lors de la sortie du serveur:', error);
      this.showNotification(`Erreur lors de la sortie du serveur: ${error.message}`, 'error');
    }
  }

  showApp() {
    this.hideLogin();
    this.updateUserInfo();
    this.updateNavigation();
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
      servers: 'Serveurs',
      logs: 'Logs',
      embeds: 'Embeds',
      users: 'Utilisateurs',
      prefix: 'Configuration Préfixe',
      updates: 'Mise à jour'
    };
    document.getElementById('page-title').textContent = titles[section] || section;
    this.currentSection = section;
    this.renderSection(section);
  }

  renderSection(section) {
    const content = document.getElementById('content');
    switch (section) {
      case 'dashboard':
        if (this.hasPermission('dashboard', 'view')) {
          content.innerHTML = this.renderDashboard();
          this.applyEditPermissions('dashboard');
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;
      case 'tickets':
        if (this.hasPermission('tickets', 'view')) {
          content.innerHTML = this.renderTickets();
          this.applyEditPermissions('tickets');
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;
      case 'moderation':
        if (this.hasPermission('moderation', 'view')) {
          content.innerHTML = this.renderModeration();
          this.applyEditPermissions('moderation');
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;
      case 'economy':
        if (this.hasPermission('economy', 'view')) {
          content.innerHTML = this.renderEconomy();
          this.applyEditPermissions('economy');
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;
      case 'channels':
        if (this.hasPermission('channels', 'view')) {
          content.innerHTML = this.renderChannels();
          this.applyEditPermissions('channels');
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;
      case 'roles':
        if (this.hasPermission('roles', 'view')) {
          content.innerHTML = this.renderRoles();
          this.applyEditPermissions('roles');
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;
      case 'logs':
        if (this.hasPermission('logs', 'view')) {
          content.innerHTML = this.renderLogs();
          this.loadLogFiles(); // Charger les fichiers de logs
          this.applyLogPermissions();
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;
      case 'embeds':
        if (this.hasPermission('embeds', 'view')) {
          content.innerHTML = this.renderEmbeds();
          // Charger les données du serveur si nécessaire
          if (!this.serverData.channels) {
            this.loadServerData();
          }
          this.applyEmbedPermissions();
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;

      case 'users':
        if (this.hasPermission('users', 'view')) {
          content.innerHTML = this.renderUsers();
          this.loadUsers();
          this.loadRoles();
          this.loadModules();
          // Pas de applyEditPermissions car users a sa propre logique de permissions
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;
      case 'roles':
        if (this.hasPermission('roles', 'view')) {
          content.innerHTML = this.renderRoles();
          this.loadRoles();
          this.loadModules();
          // Pas de applyEditPermissions car roles a sa propre logique de permissions
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;
      case 'servers':
        if (this.hasPermission('servers', 'view')) {
          content.innerHTML = this.renderServers();
          this.loadServers();
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;
      case 'prefix':
        if (this.hasPermission('prefix', 'view')) {
          content.innerHTML = this.renderPrefix();
          this.applyPrefixPermissions();
        } else {
          content.innerHTML = '<div class="card"><h2>Accès refusé</h2><p>Vous n\'avez pas les permissions nécessaires pour accéder à cette section.</p></div>';
        }
        break;
      case 'updates':
        if (this.hasPermission('updates', 'view')) {
          content.innerHTML = this.renderUpdates();
          this.loadUpdateStatus();
          this.loadUpdateChanges();
          this.loadUpdateConfig();
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
            Fichiers de logs
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
            Activité récente en temps réel
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
    document.getElementById('modal-overlay').classList.remove('active');
  }
  
  // Afficher le modal de confirmation de déconnexion
  showLogoutConfirmModal() {
    console.log('Fonction showLogoutConfirmModal appelée');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');
    const modalOverlay = document.getElementById('modal-overlay');
    
    console.log('Éléments du modal:', { modalTitle, modalContent, modalOverlay });
    
    modalTitle.textContent = 'Confirmation de déconnexion';
    modalContent.innerHTML = `
      <div class="logout-confirm-modal">
        <div class="logout-icon">
          <i class="fas fa-sign-out-alt"></i>
        </div>
        <p class="logout-message">Êtes-vous sûr de vouloir vous déconnecter ?</p>
        <div class="logout-actions">
          <button id="cancel-logout-btn" class="btn btn-secondary">
            <i class="fas fa-times"></i>
            Annuler
          </button>
          <button id="confirm-logout-btn" class="btn btn-danger">
            <i class="fas fa-sign-out-alt"></i>
            Se déconnecter
          </button>
        </div>
      </div>
    `;
    
    // Ajouter les gestionnaires d'événements
    setTimeout(() => {
      document.getElementById('cancel-logout-btn').addEventListener('click', () => {
        this.closeModal();
      });
      
      document.getElementById('confirm-logout-btn').addEventListener('click', async () => {
        // Afficher le loader sur le bouton de confirmation
        const confirmBtn = document.getElementById('confirm-logout-btn');
        const originalBtnText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Déconnexion...';
        confirmBtn.disabled = true;
        
        // Désactiver le bouton d'annulation également
        const cancelBtn = document.getElementById('cancel-logout-btn');
        cancelBtn.disabled = true;
        
        // Effectuer la déconnexion
        await this.performLogout();
      });
    }, 100);
    
    // Rendre le modal visible en ajoutant la classe active
    modalOverlay.classList.add('active');
  }
  

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Rendre la section de configuration
  renderConfig() {
    return `
    `;
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

  renderServers() {
    return `
      <div class="section-header">
        <h1>
          <i class="fas fa-server"></i>
          Gestion des Serveurs
        </h1>
        <p>Visualisez et gérez les serveurs où le bot est présent.</p>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-list"></i>
            Liste des Serveurs
          </h3>
          <div class="card-actions">
            <button class="btn btn-secondary" onclick="app.loadServers()">
              <i class="fas fa-sync-alt"></i>
              Actualiser
            </button>
          </div>
        </div>
        <div class="card-content">
          <div id="servers-list" class="servers-container">
            <div class="loading-spinner">
              <i class="fas fa-spinner fa-spin"></i>
              Chargement des serveurs...
            </div>
          </div>
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
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Erreur serveur:', errorText);
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }
      
      const responseText = await res.text();
      try {
        this.users = JSON.parse(responseText);
        this.renderUsersTable();
      } catch (jsonError) {
        console.error('Erreur de parsing JSON:', jsonError);
        console.error('Réponse reçue:', responseText);
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      this.showNotification(`Erreur lors du chargement des utilisateurs: ${error.message}`, 'error');
    }
  }

  // Charger les rôles disponibles
  async loadRoles() {
    try {
      // Charger les rôles système
      const res = await fetch('/api/users/roles', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      
      if (!res.ok) {
        console.error(`Erreur lors du chargement des rôles: ${res.status} ${res.statusText}`);
        return; // Utiliser les rôles par défaut définis dans initDefaultData()
      }
      
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          const rolesData = await res.json();
          // Ne remplacer que si on reçoit des données valides
          if (rolesData && typeof rolesData === 'object') {
            this.roles = rolesData;
          }
        } catch (jsonError) {
          console.error('Erreur de parsing JSON pour les rôles:', jsonError);
        }
      } else {
        const responseText = await res.text();
        if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
          console.error('Le serveur a renvoyé une page HTML au lieu des données de rôles. Vérifiez la configuration de l\'API.');
          return; // Garder les rôles par défaut
        }
        
        // Essayer de parser comme JSON malgré le content-type incorrect
        try {
          const rolesData = JSON.parse(responseText);
          if (rolesData && typeof rolesData === 'object') {
            this.roles = rolesData;
          }
        } catch (jsonError) {
          console.error('Impossible de parser la réponse comme JSON:', jsonError);
        }
      }

      // Charger les rôles personnalisés et les fusionner
      if (this.hasPermission('users', 'manage_roles')) {
        try {
          const customRes = await fetch('/api/roles/custom', {
            headers: { Authorization: 'Bearer ' + this.token }
          });
          
          if (customRes.ok) {
            const customContentType = customRes.headers.get('content-type');
            if (customContentType && customContentType.includes('application/json')) {
              const customRoles = await customRes.json();
              this.customRoles = customRoles || {};
              // Créer allRoles en fusionnant les rôles système et personnalisés
              this.allRoles = { ...this.roles, ...this.customRoles };
            } else {
              const customText = await customRes.text();
              if (!customText.includes('<!DOCTYPE html>') && !customText.includes('<html>')) {
                try {
                  const customRoles = JSON.parse(customText);
                  this.customRoles = customRoles || {};
                  this.allRoles = { ...this.roles, ...this.customRoles };
                } catch (e) {
                  console.warn('Impossible de parser les rôles personnalisés:', e);
                  this.customRoles = {};
                  this.allRoles = { ...this.roles };
                }
              } else {
                console.warn('Le serveur a renvoyé une page HTML pour les rôles personnalisés');
                this.customRoles = {};
                this.allRoles = { ...this.roles };
              }
            }
          } else {
            console.warn('Impossible de charger les rôles personnalisés:', customRes.status);
            this.customRoles = {};
            this.allRoles = { ...this.roles };
          }
        } catch (error) {
          console.warn('Erreur lors du chargement des rôles personnalisés:', error);
          this.customRoles = {};
          this.allRoles = { ...this.roles };
        }
      } else {
        // Si l'utilisateur n'a pas la permission manage_roles, utiliser seulement les rôles système
        this.customRoles = {};
        this.allRoles = { ...this.roles };
      }

      // Mettre à jour les filtres si la page utilisateurs est affichée
      this.updateRoleFilters();
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
      this.showNotification(`Erreur lors du chargement des rôles: ${error.message}`, 'error');
    }
  }

  // Mettre à jour les filtres par rôle dans la page utilisateurs
  updateRoleFilters() {
    const roleFilter = document.getElementById('role-filter');
    if (roleFilter) {
      const currentValue = roleFilter.value;
      
      // Séparer les rôles système des rôles personnalisés pour l'affichage
      const systemRoles = {};
      const customRoles = {};
      
      // Rôles système par défaut
      const defaultSystemRoles = ['superadmin', 'admin', 'moderator', 'support', 'viewer'];
      defaultSystemRoles.forEach(roleKey => {
        if (this.roles[roleKey]) {
          systemRoles[roleKey] = this.roles[roleKey];
        }
      });
      
      // Rôles personnalisés
      Object.assign(customRoles, this.customRoles || {});
      
      let optionsHTML = '<option value="">Tous les rôles</option>';
      
      // Ajouter les rôles système
      if (Object.keys(systemRoles).length > 0) {
        optionsHTML += '<optgroup label="Rôles Système">';
        optionsHTML += Object.entries(systemRoles).map(([roleKey, roleData]) => 
          `<option value="${roleKey}" ${currentValue === roleKey ? 'selected' : ''}>${roleData.name}</option>`
        ).join('');
        optionsHTML += '</optgroup>';
      }
      
      // Ajouter les rôles personnalisés
      if (Object.keys(customRoles).length > 0) {
        optionsHTML += '<optgroup label="Rôles Personnalisés">';
        optionsHTML += Object.entries(customRoles).map(([roleKey, roleData]) => 
          `<option value="${roleKey}" ${currentValue === roleKey ? 'selected' : ''}>${roleData.name}</option>`
        ).join('');
        optionsHTML += '</optgroup>';
      }
      
      roleFilter.innerHTML = optionsHTML;
    }
  }

  // Charger les modules disponibles
  async loadModules() {
    try {
      const res = await fetch('/api/users/modules', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Erreur serveur:', errorText);
        throw new Error(`Erreur ${res.status}: ${res.statusText}`);
      }
      
      const responseText = await res.text();
      try {
        this.modules = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Erreur de parsing JSON pour les modules:', jsonError);
        console.error('Réponse reçue:', responseText);
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des modules:', error);
      this.showNotification(`Erreur lors du chargement des modules: ${error.message}`, 'error');
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
        <div class="header-actions">
          ${this.hasPermission('users', 'create') ? `
            <button class="btn btn-primary" onclick="app.showCreateUserModal()">
              <i class="fas fa-plus"></i>
              Nouvel Utilisateur
            </button>
          ` : ''}
          ${this.hasPermission('users', 'manage_roles') ? `
            <button class="btn btn-secondary" onclick="app.showRoleManagerModal()">
              <i class="fas fa-users-cog"></i>
              Gérer les Rôles
            </button>
          ` : ''}
        </div>
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
            ${user.id === this.currentUser.id ? `
              <span class="user-self-indicator" title="Votre compte">
                <i class="fas fa-user"></i>
              </span>
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
    const userRole = user?.role || 'viewer';

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
                <label class="form-label">Rôle *</label>
                <select name="role" class="form-select" onchange="app.handleRoleChange(this)" required>
                  ${Object.entries(this.allRoles || this.roles).map(([roleKey, roleData]) => `
                    <option value="${roleKey}" ${userRole === roleKey ? 'selected' : ''}>
                      ${roleData.name}
                    </option>
                  `).join('')}
                </select>
                <small class="form-help">Sélectionnez un rôle prédéfini. Pour des permissions personnalisées, créez un nouveau rôle.</small>
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

            <div class="permissions-section" id="permissions-section">
              <h3>Permissions</h3>
              <div class="role-preview" id="role-preview" style="display: none;">
                <div class="role-preview-header">
                  <i class="fas fa-eye"></i>
                  <span>Aperçu des permissions du rôle sélectionné</span>
                </div>
                <div class="role-preview-content" id="role-preview-content"></div>
              </div>
              
              <div class="permissions-grid" id="permissions-grid">
                ${Object.entries(this.modules).map(([moduleKey, moduleData]) => `
                  <div class="permission-module">
                    <div class="permission-module-header">
                      <i class="${moduleData.icon}"></i>
                      <h4>${moduleData.name}</h4>
                    </div>
                    <div class="permission-checkboxes">
                      ${moduleData.permissions.map(permission => {
                        const isChecked = user?.permissions?.[moduleKey]?.includes(permission) || false;
                        return `
                          <div class="permission-checkbox">
                            <input type="checkbox" 
                                   class="permission-checkbox-input"
                                   name="permissions[${moduleKey}][]" 
                                   value="${permission}"
                                   id="perm-${moduleKey}-${permission}"
                                   data-module="${moduleKey}"
                                   data-permission="${permission}"
                                   ${isChecked ? 'checked' : ''}
                                   onchange="app.handlePermissionChange(this)">
                            <label for="perm-${moduleKey}-${permission}">${this.formatPermissionName(permission)}</label>
                          </div>
                        `;
                      }).join('')}
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
    
    // Initialiser l'état des permissions
    setTimeout(() => {
      const roleSelect = document.querySelector('select[name="role"]');
      if (roleSelect) {
        this.handleRoleChange(roleSelect, false);
      }
    }, 100);
  }

  // Gérer le changement de rôle
  handleRoleChange(selectElement, updatePermissions = true) {
    if (!selectElement) return;
    
    const selectedRole = selectElement.value;
    const rolePreview = document.getElementById('role-preview');
    const rolePreviewContent = document.getElementById('role-preview-content');
    const permissionsGrid = document.getElementById('permissions-grid');
    
    if (!permissionsGrid) return;
    
    const checkboxes = permissionsGrid.querySelectorAll('input[type="checkbox"]');
    
    // Mode rôle prédéfini uniquement (plus de mode custom)
    const roleData = (this.allRoles || this.roles)[selectedRole];
    if (!roleData) return;
    
    // Afficher l'aperçu du rôle
    if (rolePreview && rolePreviewContent) {
      rolePreview.style.display = 'block';
      rolePreviewContent.innerHTML = this.renderRolePreview(roleData);
    }
    
    // Désactiver toutes les checkboxes et appliquer les permissions du rôle
    checkboxes.forEach(checkbox => {
      checkbox.disabled = true;
      const module = checkbox.dataset.module;
      const permission = checkbox.dataset.permission;
      
      if (updatePermissions) {
        const hasPermission = roleData.permissions?.[module]?.includes(permission) || false;
        checkbox.checked = hasPermission;
      }
    });
  }





  // Mettre à jour la logique des permissions (désactivée car plus de permissions personnalisées)
  updatePermissionLogic(changedCheckbox) {
    // Les permissions sont maintenant gérées uniquement par les rôles prédéfinis
    // Cette fonction est conservée pour la compatibilité mais ne fait plus rien
    return;
  }

  // Gérer le changement de permission individuelle (désactivé car plus de permissions personnalisées)
  handlePermissionChange(checkbox) {
    // Les permissions sont maintenant gérées uniquement par les rôles prédéfinis
    // Cette fonction est conservée pour la compatibilité mais ne fait plus rien
    return;
  }

  // Rendre l'aperçu d'un rôle
  renderRolePreview(roleData) {
    const permissions = roleData.permissions || {};
    
    return `
      <div class="role-preview-permissions">
        ${Object.entries(permissions).map(([module, perms]) => {
          const moduleData = this.modules[module];
          if (!moduleData || !perms || perms.length === 0) return '';
          
          return `
            <div class="role-preview-module">
              <div class="role-preview-module-header">
                <i class="${moduleData.icon}"></i>
                <span>${moduleData.name}</span>
              </div>
              <div class="role-preview-perms">
                ${perms.map(perm => `<span class="perm-badge">${this.formatPermissionName(perm)}</span>`).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // Formater le nom d'une permission
  formatPermissionName(permission) {
    const names = {
      'view': 'Voir',
      'edit': 'Modifier',
      'create': 'Créer',
      'delete': 'Supprimer',
      'manage_roles': 'Gérer les rôles'
    };
    return names[permission] || permission;
  }

  // Afficher la modal de gestion des rôles
  showRoleManagerModal() {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay active';
    modalOverlay.innerHTML = `
      <div class="modal modal-large">
        <div class="modal-header">
          <h3>Gestion des Rôles</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <div class="roles-manager">
            <div class="roles-section">
              <div class="section-header">
                <h4>Rôles Système</h4>
                <p>Ces rôles sont prédéfinis et ne peuvent pas être modifiés.</p>
              </div>
              <div class="roles-grid" id="system-roles-grid">
                <!-- Rôles système générés dynamiquement -->
              </div>
            </div>

            <div class="roles-section">
              <div class="section-header">
                <h4>Rôles Personnalisés</h4>
                <div class="section-actions">
                  <button class="btn btn-primary btn-sm" onclick="app.showCreateRoleModal()">
                    <i class="fas fa-plus"></i>
                    Nouveau Rôle
                  </button>
                </div>
              </div>
              <div class="roles-grid" id="custom-roles-grid">
                <!-- Rôles personnalisés générés dynamiquement -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);
    this.loadRoleManagerData();
  }

  // Charger les données pour le gestionnaire de rôles
  async loadRoleManagerData() {
    try {
      // Charger les rôles système
      const systemRolesGrid = document.getElementById('system-roles-grid');
      if (systemRolesGrid) {
        systemRolesGrid.innerHTML = Object.entries(this.roles).map(([roleKey, roleData]) => 
          this.renderRoleCard(roleKey, roleData, true)
        ).join('');
      }

      // Charger les rôles personnalisés
      const res = await fetch('/api/roles/custom', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      
      if (res.ok) {
        const customRoles = await res.json();
        const customRolesGrid = document.getElementById('custom-roles-grid');
        if (customRolesGrid) {
          if (Object.keys(customRoles).length === 0) {
            customRolesGrid.innerHTML = '<p class="no-roles">Aucun rôle personnalisé défini.</p>';
          } else {
            customRolesGrid.innerHTML = Object.entries(customRoles).map(([roleKey, roleData]) => 
              this.renderRoleCard(roleKey, roleData, false)
            ).join('');
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
      this.showNotification('Erreur lors du chargement des rôles', 'error');
    }
  }

  // Rendre une carte de rôle
  renderRoleCard(roleKey, roleData, isSystem) {
    const permissionCount = Object.values(roleData.permissions || {}).reduce((acc, perms) => acc + perms.length, 0);
    
    return `
      <div class="role-card ${isSystem ? 'system-role' : 'custom-role'}">
        <div class="role-header">
          <div class="role-info">
            <div class="role-name" style="color: ${roleData.color || '#747d8c'}">
              ${roleData.name}
            </div>
            <div class="role-type">
              ${isSystem ? 'Système' : 'Personnalisé'}
            </div>
          </div>
          <div class="role-actions">
            ${!isSystem ? `
              <button class="btn btn-sm btn-secondary" onclick="app.showEditRoleModal('${roleKey}')" title="Modifier">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="app.deleteCustomRole('${roleKey}')" title="Supprimer">
                <i class="fas fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>
        <div class="role-permissions">
          <div class="permission-count">
            <i class="fas fa-key"></i>
            ${permissionCount} permissions
          </div>
          <div class="permission-preview">
            ${Object.entries(roleData.permissions || {}).slice(0, 3).map(([module, perms]) => {
              const moduleData = this.modules[module];
              return moduleData ? `
                <div class="permission-module-preview">
                  <i class="${moduleData.icon}"></i>
                  <span>${moduleData.name}</span>
                  <span class="perm-count">(${perms.length})</span>
                </div>
              ` : '';
            }).join('')}
            ${Object.keys(roleData.permissions || {}).length > 3 ? 
              `<div class="more-permissions">+${Object.keys(roleData.permissions).length - 3} modules</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Afficher la modal d'édition de rôle
  async showEditRoleModal(roleId) {
    try {
      const res = await fetch(`/api/roles/custom/${roleId}`, {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      
      if (res.ok) {
        const roleData = await res.json();
        this.showCreateRoleModal(roleId, roleData);
      } else {
        this.showNotification('Erreur lors du chargement du rôle', 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du rôle:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  // Afficher la modal de gestion des rôles
  async showRoleManagerModal() {
    // Charger les rôles personnalisés
    await this.loadCustomRoles();
    
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay active';
    modalOverlay.innerHTML = `
      <div class="modal modal-xlarge">
        <div class="modal-header">
          <h3><i class="fas fa-users-cog"></i> Gestion des Rôles</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <div class="roles-manager">
            <div class="roles-section">
              <div class="section-header">
                <div>
                  <h4>Rôles Système</h4>
                  <p>Rôles prédéfinis avec permissions fixes</p>
                </div>
              </div>
              <div class="roles-grid" id="system-roles-grid">
                ${Object.entries(this.roles).map(([roleKey, roleData]) => 
                  this.renderRoleCard(roleKey, roleData, true)
                ).join('')}
              </div>
            </div>
            
            <div class="roles-section">
              <div class="section-header">
                <div>
                  <h4>Rôles Personnalisés</h4>
                  <p>Rôles créés avec permissions configurables</p>
                </div>
                <div class="section-actions">
                  <button class="btn btn-primary" onclick="app.showCreateRoleModal()">
                    <i class="fas fa-plus"></i>
                    Nouveau Rôle
                  </button>
                </div>
              </div>
              <div class="roles-grid" id="custom-roles-grid">
                ${this.customRoles && Object.keys(this.customRoles).length > 0 ? 
                  Object.entries(this.customRoles).map(([roleKey, roleData]) => 
                    this.renderRoleCard(roleKey, roleData, false)
                  ).join('') : 
                  '<div class="no-roles">Aucun rôle personnalisé créé</div>'
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalOverlay);
  }

  // Rendre une carte de rôle
  renderRoleCard(roleKey, roleData, isSystem) {
    const permissions = roleData.permissions || {};
    const permissionCount = Object.values(permissions).reduce((acc, perms) => acc + perms.length, 0);
    const moduleCount = Object.keys(permissions).length;
    
    return `
      <div class="role-card ${isSystem ? 'system-role' : 'custom-role'}">
        <div class="role-header">
          <div class="role-info">
            <div class="role-name">${roleData.name}</div>
            <div class="role-type">${isSystem ? 'Système' : 'Personnalisé'}</div>
          </div>
          ${!isSystem ? `
            <div class="role-actions">
              <button class="btn btn-sm btn-secondary" onclick="app.showEditRoleModal('${roleKey}')" title="Modifier">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="app.deleteCustomRole('${roleKey}')" title="Supprimer">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          ` : ''}
        </div>
        
        <div class="role-permissions">
          <div class="permission-count">
            <i class="fas fa-key"></i>
            <span>${permissionCount} permissions sur ${moduleCount} modules</span>
          </div>
          
          <div class="permission-preview">
            ${Object.entries(permissions).slice(0, 3).map(([module, perms]) => {
              const moduleData = this.modules[module];
              if (!moduleData) return '';
              return `
                <div class="permission-module-preview">
                  <i class="${moduleData.icon}"></i>
                  <span>${moduleData.name}</span>
                  <span class="perm-count">(${perms.length})</span>
                </div>
              `;
            }).join('')}
            ${Object.keys(permissions).length > 3 ? 
              `<div class="more-permissions">+${Object.keys(permissions).length - 3} autres modules...</div>` : 
              ''
            }
          </div>
        </div>
      </div>
    `;
  }

  // Charger les rôles personnalisés
  async loadCustomRoles() {
    try {
      const res = await fetch('/api/roles/custom', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      
      if (res.ok) {
        this.customRoles = await res.json();
      } else {
        console.error('Erreur lors du chargement des rôles personnalisés');
        this.customRoles = {};
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles personnalisés:', error);
      this.customRoles = {};
    }
  }

  // Mettre à jour un rôle personnalisé
  async updateCustomRole(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const roleId = formData.get('roleId');
    
    const roleData = {
      name: formData.get('name'),
      color: formData.get('color'),
      permissions: this.extractPermissionsFromForm(formData)
    };

    try {
      const res = await fetch(`/api/roles/custom/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token
        },
        body: JSON.stringify(roleData)
      });

      if (res.ok) {
        this.showNotification('Rôle mis à jour avec succès !', 'success');
        document.querySelector('.modal-overlay').remove();
        await this.showRoleManagerModal();
        this.loadRoles(); // Recharger les rôles pour les sélecteurs
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la mise à jour', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  // Extraire les permissions du formulaire
  extractPermissionsFromForm(formData) {
    const permissions = {};
    
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('permissions[') && key.endsWith('][]')) {
        // Extraire le nom du module
        const module = key.match(/permissions\[(.+)\]\[\]/)[1];
        if (!permissions[module]) {
          permissions[module] = [];
        }
        permissions[module].push(value);
      }
    }
    
    return permissions;
  }

  // Afficher la modal d'édition de rôle
  async showEditRoleModal(roleId) {
    const roleData = this.customRoles[roleId];
    if (!roleData) {
      this.showNotification('Rôle non trouvé', 'error');
      return;
    }
    this.showCreateRoleModal(roleId, roleData);
  }

  // Afficher la modal de création/édition de rôle
  showCreateRoleModal(roleId = null, roleData = null) {
    const isEdit = !!roleId;
    const title = isEdit ? 'Modifier le rôle' : 'Nouveau rôle';
    
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
          <form class="role-form" onsubmit="app.${isEdit ? 'updateCustomRole' : 'createCustomRole'}(event)">
            ${isEdit ? `<input type="hidden" name="roleId" value="${roleId}">` : ''}
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nom du rôle *</label>
                <input type="text" name="name" class="form-input" required 
                       value="${roleData?.name || ''}" placeholder="Nom du rôle">
              </div>
              <div class="form-group">
                <label class="form-label">Couleur</label>
                <input type="color" name="color" class="form-input" 
                       value="${roleData?.color || '#747d8c'}">
              </div>
            </div>

            <div class="permissions-section">
              <h4>Permissions du rôle</h4>
              <p>Sélectionnez les permissions que ce rôle doit avoir.</p>
              
              <div class="permissions-grid">
                ${Object.entries(this.modules).map(([moduleKey, moduleData]) => `
                  <div class="permission-module">
                    <div class="permission-module-header">
                      <i class="${moduleData.icon}"></i>
                      <h5>${moduleData.name}</h5>
                    </div>
                    <div class="permission-checkboxes">
                      ${moduleData.permissions.map(permission => `
                        <div class="permission-checkbox">
                          <input type="checkbox" 
                                 name="permissions[${moduleKey}][]" 
                                 value="${permission}"
                                 id="role-perm-${moduleKey}-${permission}"
                                 data-module="${moduleKey}"
                                 data-permission="${permission}"
                                 ${roleData?.permissions?.[moduleKey]?.includes(permission) ? 'checked' : ''}
                                 onchange="app.handleRolePermissionChange(this)">
                          <label for="role-perm-${moduleKey}-${permission}">${this.formatPermissionName(permission)}</label>
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
                ${isEdit ? 'Mettre à jour' : 'Créer le rôle'}
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

  // Gérer le changement de permission pour un rôle
  handleRolePermissionChange(checkbox) {
    const module = checkbox.dataset.module;
    const permission = checkbox.dataset.permission;
    
    // Même logique que pour les utilisateurs
    if (permission === 'view' && !checkbox.checked) {
      const moduleCheckboxes = document.querySelectorAll(`input[data-module="${module}"]`);
      moduleCheckboxes.forEach(cb => {
        if (cb !== checkbox) {
          cb.checked = false;
          cb.disabled = true;
        }
      });
    } else if (permission === 'view' && checkbox.checked) {
      const moduleCheckboxes = document.querySelectorAll(`input[data-module="${module}"]`);
      moduleCheckboxes.forEach(cb => {
        if (cb !== checkbox) {
          cb.disabled = false;
        }
      });
    } else if (permission !== 'view' && checkbox.checked) {
      const viewCheckbox = document.querySelector(`input[data-module="${module}"][data-permission="view"]`);
      if (viewCheckbox && !viewCheckbox.checked) {
        viewCheckbox.checked = true;
      }
    }
  }



  // Supprimer un rôle personnalisé
  async deleteCustomRole(roleId) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ? Les utilisateurs associés seront basculés vers le rôle "Lecteur" avec leurs permissions personnalisées.')) {
      return;
    }

    try {
      const res = await fetch(`/api/roles/custom/${roleId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + this.token }
      });

      if (res.ok) {
        this.showNotification('Rôle supprimé avec succès !', 'success');
        this.loadRoleManagerData();
        this.loadRoles(); // Recharger les rôles pour les sélecteurs
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du rôle:', error);
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

  // Obtenir le nom d'affichage d'un rôle
  getRoleDisplayName(role) {
    const roleNames = {
      'superadmin': 'Super Admin',
      'admin': 'Administrateur',
      'moderator': 'Modérateur',
      'support': 'Support',
      'viewer': 'Lecteur'
    };
    
    // Vérifier d'abord dans les rôles par défaut
    if (roleNames[role]) {
      return roleNames[role];
    }
    
    // Puis vérifier dans les rôles chargés (système + personnalisés)
    if (this.roles && this.roles[role]) {
      return this.roles[role].name;
    }
    
    return role;
  }

  // Charger les informations de l'utilisateur actuel
  async loadCurrentUser() {
    try {
      const res = await fetch('/api/user/me', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      if (res.status === 401) {
        this.logout();
        return;
      }
      if (!res.ok) throw new Error('Erreur de chargement');
      this.currentUser = await res.json();
      this.updateUserInfo();
    } catch (error) {
      console.error('Erreur lors du chargement de l\'utilisateur:', error);
      this.logout();
    }
  }

  // Mettre à jour les informations utilisateur dans l'interface
  updateUserInfo() {
    if (!this.currentUser) return;

    // Mettre à jour l'avatar
    const avatarElement = document.getElementById('user-avatar-letter');
    if (avatarElement) {
      avatarElement.textContent = this.currentUser.username.charAt(0).toUpperCase();
    }

    // Mettre à jour le nom d'utilisateur
    const usernameElement = document.getElementById('current-username');
    if (usernameElement) {
      usernameElement.textContent = this.currentUser.username;
    }

    // Mettre à jour le rôle
    const roleElement = document.getElementById('current-role');
    if (roleElement) {
      roleElement.textContent = this.getRoleDisplayName(this.currentUser.role);
    }

    // Mettre à jour la navigation en fonction des permissions
    this.updateNavigationPermissions();
  }

  // Mettre à jour la navigation selon les permissions
  updateNavigationPermissions() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
      const section = item.getAttribute('data-section');
      
      // Permissions spéciales pour certaines sections
      const sectionPermissions = {
        'dashboard': true, // Toujours accessible
        'tickets': this.hasPermission('tickets', 'view'),
        'moderation': this.hasPermission('moderation', 'view'),
        'economy': this.hasPermission('economy', 'view'),
        'channels': this.hasPermission('channels', 'view'),
        'roles': this.hasPermission('roles', 'view'),
        'logs': this.hasPermission('logs', 'view'),
        'embeds': this.hasPermission('embeds', 'view'),
        'users': this.hasPermission('users', 'view')
      };

      const hasAccess = sectionPermissions[section] !== undefined ? 
        sectionPermissions[section] : true;

      if (hasAccess) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
        // Si l'utilisateur est sur cette section, le rediriger vers le dashboard
        if (this.currentSection === section) {
          this.loadSection('dashboard');
        }
      }
    });
  }

  // Afficher la modal de configuration des logs
  showLogsConfigModal() {
    if (!this.hasPermission('logs', 'config')) {
      this.showNotification('Vous n\'avez pas la permission de configurer les logs', 'error');
      return;
    }

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay active';
    modalOverlay.innerHTML = `
      <div class="modal modal-medium">
        <div class="modal-header">
          <h3>
            <i class="fas fa-cog"></i>
            Configuration des Logs
          </h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-content">
          <form id="logs-config-form" onsubmit="app.saveLogsConfig(event)">
            <div class="form-group">
              <label class="form-label">Niveau de logging</label>
              <select name="logLevel" class="form-input">
                <option value="debug">Debug (Très détaillé)</option>
                <option value="info" selected>Info (Normal)</option>
                <option value="warn">Warning (Avertissements uniquement)</option>
                <option value="error">Error (Erreurs uniquement)</option>
              </select>
              <small class="form-help">Définit le niveau de détail des logs</small>
            </div>

            <div class="form-group">
              <label class="form-label">Rotation des logs</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" name="autoRotate" checked>
                  <span class="checkbox-custom"></span>
                  Rotation automatique des fichiers
                </label>
              </div>
              <small class="form-help">Crée un nouveau fichier de log chaque jour</small>
            </div>

            <div class="form-group">
              <label class="form-label">Taille maximale des logs (MB)</label>
              <input type="number" name="maxLogSize" class="form-input" value="10" min="1" max="100">
              <small class="form-help">Taille maximale d'un fichier de log avant rotation</small>
            </div>

            <div class="form-group">
              <label class="form-label">Nombre de fichiers à conserver</label>
              <input type="number" name="maxLogFiles" class="form-input" value="7" min="1" max="30">
              <small class="form-help">Nombre de fichiers de log à garder en archive</small>
            </div>

            <div class="form-group">
              <label class="form-label">Logs à conserver</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" name="logCommands" checked>
                  <span class="checkbox-custom"></span>
                  Commandes utilisateur
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="logErrors" checked>
                  <span class="checkbox-custom"></span>
                  Erreurs système
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="logModerationActions" checked>
                  <span class="checkbox-custom"></span>
                  Actions de modération
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="logJoinLeave">
                  <span class="checkbox-custom"></span>
                  Arrivées/Départs de membres
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i>
                Sauvegarder
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

  // Sauvegarder la configuration des logs
  async saveLogsConfig(event) {
    if (event) {
      event.preventDefault();
    }
    
    if (!this.hasPermission('logs', 'config')) {
      this.showNotification('Vous n\'avez pas la permission de configurer les logs', 'error');
      return;
    }

    if (!event || !event.target) {
      this.showNotification('Erreur: formulaire non trouvé', 'error');
      return;
    }
    
    const formData = new FormData(event.target);
    const configData = {
      logLevel: formData.get('logLevel'),
      autoRotate: formData.has('autoRotate'),
      maxLogSize: parseInt(formData.get('maxLogSize')),
      maxLogFiles: parseInt(formData.get('maxLogFiles')),
      logCommands: formData.has('logCommands'),
      logErrors: formData.has('logErrors'),
      logModerationActions: formData.has('logModerationActions'),
      logJoinLeave: formData.has('logJoinLeave')
    };

    try {
      const res = await fetch('/api/logs/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token
        },
        body: JSON.stringify(configData)
      });

      if (res.ok) {
        this.showNotification('Configuration des logs sauvegardée avec succès !', 'success');
        document.querySelector('.modal-overlay').remove();
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la sauvegarde', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration des logs:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  // Afficher une notification
  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    // Ajouter au conteneur de notifications (ou créer s'il n'existe pas)
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.id = 'notification-container';
      notificationContainer.className = 'notification-container';
      document.body.appendChild(notificationContainer);
    }
    
    notificationContainer.appendChild(notification);
    
    // Auto-suppression après 5 secondes
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // ===== MÉTHODES MANQUANTES POUR LA GESTION DES UTILISATEURS ET RÔLES =====

  // Charger la liste des utilisateurs
  async loadUsers() {
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: 'Bearer ' + this.token }
      });
      
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          this.users = await res.json();
        } else {
          const responseText = await res.text();
          if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
            console.error('Le serveur a renvoyé une page HTML au lieu des données utilisateurs. Vérifiez la configuration de l\'API.');
            this.showNotification('Erreur: Configuration API incorrecte pour les utilisateurs', 'error');
            return;
          }
          // Essayer de parser comme JSON
          try {
            this.users = JSON.parse(responseText);
          } catch (e) {
            console.error('Impossible de parser la réponse utilisateurs:', e);
            this.users = [];
          }
        }
        this.renderUsersTable();
        this.updateUsersFilterOptions();
      } else if (res.status === 401) {
        this.logout();
      } else {
        console.error(`Erreur lors du chargement des utilisateurs: ${res.status} ${res.statusText}`);
        this.showNotification(`Erreur ${res.status}: ${res.statusText}`, 'error');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      this.showNotification('Erreur lors du chargement des utilisateurs: ' + error.message, 'error');
    }
  }



  // Charger les modules disponibles
  async loadModules() {
    // Les modules sont déjà définis dans initDefaultData()
    // Cette méthode peut être utilisée pour charger des modules dynamiques si nécessaire
    return Promise.resolve();
  }

  // Mettre à jour les options de filtre des utilisateurs
  updateUsersFilterOptions() {
    const roleFilter = document.getElementById('role-filter');
    if (roleFilter) {
      const currentValue = roleFilter.value;
      roleFilter.innerHTML = '<option value="">Tous les rôles</option>' +
        Object.entries(this.allRoles || this.roles).map(([roleKey, roleData]) => 
          `<option value="${roleKey}" ${currentValue === roleKey ? 'selected' : ''}>${roleData.name}</option>`
        ).join('');
    }
  }

  // Rendre la section Utilisateurs
  renderUsers() {
    return `
      <div class="section-header">
        <div>
          <h1>
            <i class="fas fa-users"></i>
            Gestion des Utilisateurs
          </h1>
          <p>Gérez les utilisateurs et leurs permissions d'accès au panel d'administration.</p>
        </div>
        <div class="section-actions">
          ${this.hasPermission('users', 'create') ? `
            <button class="btn btn-primary" onclick="app.showCreateUserModal()">
              <i class="fas fa-plus"></i>
              Nouvel Utilisateur
            </button>
          ` : ''}
          ${this.hasPermission('users', 'manage_roles') ? `
            <button class="btn btn-secondary" onclick="app.showRoleManagerModal()">
              <i class="fas fa-users-cog"></i>
              Gérer les Rôles
            </button>
          ` : ''}
        </div>
      </div>

      <div class="stats-grid">
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

  // Rendre la section Rôles
  renderRoles() {
    // Séparer les rôles système des rôles personnalisés
    const systemRoles = {};
    const customRoles = {};
    
    // Initialiser les rôles système avec ceux définis dans initDefaultData
    const defaultSystemRoles = ['superadmin', 'admin', 'moderator', 'support', 'viewer'];
    defaultSystemRoles.forEach(roleKey => {
      if (this.roles[roleKey]) {
        systemRoles[roleKey] = this.roles[roleKey];
      }
    });
    
    // Les rôles personnalisés sont dans this.customRoles
    Object.assign(customRoles, this.customRoles || {});
    
    return `
      <div class="section-header">
        <div>
          <h1>
            <i class="fas fa-users-cog"></i>
            Gestion des Rôles
          </h1>
          <p>Configurez les rôles et permissions d'accès au panel d'administration.</p>
        </div>
        <div class="section-actions">
          ${this.hasPermission('users', 'manage_roles') ? `
            <button class="btn btn-primary" onclick="app.showCreateRoleModal()">
              <i class="fas fa-plus"></i>
              Nouveau Rôle
            </button>
          ` : ''}
        </div>
      </div>

      <div class="roles-section">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fas fa-cog"></i>
              Rôles Système
            </h3>
            <small class="card-subtitle">Rôles prédéfinis avec permissions fixes</small>
          </div>
          <div class="card-content">
            <div class="roles-grid" id="system-roles-grid">
              ${Object.entries(systemRoles).map(([roleKey, roleData]) => 
                this.renderRoleCard(roleKey, roleData, true)
              ).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fas fa-user-cog"></i>
              Rôles Personnalisés
            </h3>
            <small class="card-subtitle">Rôles créés avec permissions configurables</small>
          </div>
          <div class="card-content">
            <div class="roles-grid" id="custom-roles-grid">
              ${Object.keys(customRoles).length > 0 ? 
                Object.entries(customRoles).map(([roleKey, roleData]) => 
                  this.renderRoleCard(roleKey, roleData, false)
                ).join('') : 
                '<div class="no-roles">Aucun rôle personnalisé créé</div>'
              }
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Rendre une carte de rôle
  renderRoleCard(roleKey, roleData, isSystemRole) {
    const permissionCount = roleData.permissions ? 
      Object.values(roleData.permissions).flat().length : 0;
    
    return `
      <div class="role-card ${isSystemRole ? 'system-role' : 'custom-role'}">
        <div class="role-header">
          <div class="role-info">
            <h4 class="role-name">${roleData.name}</h4>
            <span class="role-type">${isSystemRole ? 'Système' : 'Personnalisé'}</span>
          </div>
          <div class="role-actions">
            ${!isSystemRole && this.hasPermission('users', 'manage_roles') ? `
              <button class="btn btn-sm btn-secondary" onclick="app.showCreateRoleModal('${roleKey}', ${JSON.stringify(roleData).replace(/"/g, '&quot;')})">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger" onclick="app.deleteCustomRole('${roleKey}')">
                <i class="fas fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>
        <div class="role-content">
          <div class="role-stats">
            <div class="role-stat">
              <span class="stat-label">Permissions</span>
              <span class="stat-value">${permissionCount}</span>
            </div>
            <div class="role-stat">
              <span class="stat-label">Niveau</span>
              <span class="stat-value">${roleData.level || 'N/A'}</span>
            </div>
          </div>
          <div class="role-permissions">
            ${roleData.permissions ? Object.entries(roleData.permissions).map(([module, perms]) => `
              <div class="permission-tag">
                <span class="module-name">${module}</span>
                <span class="permission-count">${perms.length}</span>
              </div>
            `).join('') : '<span class="no-permissions">Aucune permission</span>'}
          </div>
        </div>
      </div>
    `;
  }

  // Créer un nouvel utilisateur
  async createUser(event) {
    event.preventDefault();
    
    if (!this.hasPermission('users', 'create')) {
      this.showNotification('Vous n\'avez pas la permission de créer des utilisateurs', 'error');
      return;
    }

    const formData = new FormData(event.target);
    const userData = {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
      role: formData.get('role'),
      isActive: true
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
        this.showNotification('Utilisateur créé avec succès !', 'success');
        document.querySelector('.modal-overlay').remove();
        await this.loadUsers();
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la création', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  // Mettre à jour un utilisateur
  async updateUser(event) {
    event.preventDefault();
    
    if (!this.hasPermission('users', 'edit')) {
      this.showNotification('Vous n\'avez pas la permission de modifier des utilisateurs', 'error');
      return;
    }

    const formData = new FormData(event.target);
    const userId = formData.get('userId');
    const userData = {
      username: formData.get('username'),
      email: formData.get('email'),
      role: formData.get('role'),
      isActive: formData.has('isActive')
    };

    // Ajouter le mot de passe seulement s'il est fourni
    const password = formData.get('password');
    if (password && password.trim() !== '') {
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
        await this.loadUsers();
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la mise à jour', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  // Supprimer un utilisateur
  async deleteUser(userId) {
    if (!this.hasPermission('users', 'delete')) {
      this.showNotification('Vous n\'avez pas la permission de supprimer des utilisateurs', 'error');
      return;
    }

    if (userId === this.currentUser.id) {
      this.showNotification('Vous ne pouvez pas supprimer votre propre compte', 'error');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + this.token }
      });

      if (res.ok) {
        this.showNotification('Utilisateur supprimé avec succès !', 'success');
        await this.loadUsers();
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  // Afficher la modal de création de rôle personnalisé
  showCreateRoleModal(roleId = null, roleData = null) {
    const isEdit = roleId && roleData;
    const title = isEdit ? 'Modifier le rôle' : 'Nouveau rôle personnalisé';
    
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
          <form class="role-form" onsubmit="app.${isEdit ? 'updateCustomRole' : 'createCustomRole'}(event)">
            ${isEdit ? `<input type="hidden" name="roleId" value="${roleId}">` : ''}
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nom du rôle *</label>
                <input type="text" name="name" class="form-input" required 
                       value="${roleData?.name || ''}" placeholder="Nom du rôle">
              </div>
              <div class="form-group">
                <label class="form-label">Couleur (optionnel)</label>
                <input type="color" name="color" class="form-input" 
                       value="${roleData?.color || '#747d8c'}">
              </div>
            </div>

            <div class="permissions-section">
              <h3>Permissions</h3>
              <p class="permissions-help">Sélectionnez les permissions que ce rôle doit avoir.</p>
              
              <div class="permissions-grid">
                ${Object.entries(this.modules).map(([moduleKey, moduleData]) => `
                  <div class="permission-module">
                    <div class="permission-module-header">
                      <i class="${moduleData.icon}"></i>
                      <h4>${moduleData.name}</h4>
                    </div>
                    <div class="permission-checkboxes">
                      ${moduleData.permissions.map(permission => {
                        const isChecked = roleData?.permissions?.[moduleKey]?.includes(permission) || false;
                        return `
                          <div class="permission-checkbox">
                            <input type="checkbox" 
                                   name="permissions[${moduleKey}][]" 
                                   value="${permission}"
                                   id="perm-${moduleKey}-${permission}"
                                   ${isChecked ? 'checked' : ''}>
                            <label for="perm-${moduleKey}-${permission}">${this.formatPermissionName(permission)}</label>
                          </div>
                        `;
                      }).join('')}
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

  // Créer un rôle personnalisé
  async createCustomRole(event) {
    event.preventDefault();
    
    if (!this.hasPermission('users', 'manage_roles')) {
      this.showNotification('Vous n\'avez pas la permission de créer des rôles', 'error');
      return;
    }

    const formData = new FormData(event.target);
    const roleData = {
      name: formData.get('name'),
      color: formData.get('color'),
      permissions: this.extractPermissionsFromForm(formData)
    };

    try {
      const res = await fetch('/api/roles/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token
        },
        body: JSON.stringify(roleData)
      });

      if (res.ok) {
        this.showNotification('Rôle créé avec succès !', 'success');
        document.querySelector('.modal-overlay').remove();
        await this.loadRoles();
        this.loadSection('roles'); // Recharger la section
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la création', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la création du rôle:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  // Supprimer un rôle personnalisé
  async deleteCustomRole(roleId) {
    if (!this.hasPermission('users', 'manage_roles')) {
      this.showNotification('Vous n\'avez pas la permission de supprimer des rôles', 'error');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rôle ? Les utilisateurs avec ce rôle seront convertis en "viewer".')) {
      return;
    }

    try {
      const res = await fetch(`/api/roles/custom/${roleId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + this.token }
      });

      if (res.ok) {
        this.showNotification('Rôle supprimé avec succès !', 'success');
        await this.loadRoles();
        this.loadSection('roles'); // Recharger la section
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la suppression', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du rôle:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  // Sauvegarder la configuration générale
  async saveConfig(event) {
    if (event) {
      event.preventDefault();
    }
    
    if (!this.hasPermission('config', 'edit')) {
      this.showNotification('Vous n\'avez pas la permission de modifier la configuration', 'error');
      return;
    }

    let configData;
    
    if (event && event.target) {
      // Mode formulaire : lire les données du formulaire
      const formData = new FormData(event.target);
      configData = {
        prefix: formData.get('prefix'),
        language: formData.get('language'),
        debug_mode: formData.has('debug_mode'),
        auto_backup: formData.has('auto_backup')
      };
    } else {
      // Mode direct : utiliser la configuration actuelle
      configData = this.config;
    }

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token
        },
        body: JSON.stringify(configData)
      });

      if (res.ok) {
        this.showNotification('Configuration sauvegardée avec succès !', 'success');
        await this.loadConfig();
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la sauvegarde', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  // ===== MÉTHODES POUR LE MODULE DE MISE À JOUR =====

  /**
   * Charge le statut des mises à jour depuis l'API
   */
  async loadUpdateStatus() {
    try {
      const res = await fetch('/api/updates/status', {
        headers: {
          'Authorization': 'Bearer ' + this.token
        }
      });

      if (res.ok) {
        this.updateStatus = await res.json();
        this.updateUpdateBadge();
      } else {
        console.error('Erreur lors du chargement du statut des mises à jour');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du statut des mises à jour:', error);
    }
  }

  /**
   * Charge les détails des changements depuis l'API
   */
  async loadUpdateChanges() {
    try {
      const res = await fetch('/api/updates/changes', {
        headers: {
          'Authorization': 'Bearer ' + this.token
        }
      });

      if (res.ok) {
        const data = await res.json();
        this.updateChanges = data.available ? data.changes : null;
        
        // Mettre à jour l'affichage si on est sur la section updates
        if (this.currentSection === 'updates') {
          this.renderUpdatesContent();
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des changements:', error);
    }
  }

  /**
   * Charge la configuration des mises à jour (permission config requise)
   */
  async loadUpdateConfig() {
    if (!this.hasPermission('updates', 'config')) return;

    try {
      const res = await fetch('/api/updates/config', {
        headers: {
          'Authorization': 'Bearer ' + this.token
        }
      });

      if (res.ok) {
        this.updateConfig = await res.json();
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration des mises à jour:', error);
    }
  }

  /**
   * Met à jour le badge de notification de mise à jour
   */
  updateUpdateBadge() {
    const badge = document.getElementById('update-badge');
    if (badge) {
      if (this.updateStatus?.updateAvailable) {
        badge.style.display = 'inline';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  /**
   * Vérifie manuellement les mises à jour
   */
  async checkForUpdates() {
    try {
      const res = await fetch('/api/updates/check', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + this.token
        }
      });

      if (res.ok) {
        const result = await res.json();
        await this.loadUpdateStatus();
        await this.loadUpdateChanges();
        
        if (result.available) {
          this.showNotification('Mise à jour disponible !', 'warning');
        } else {
          this.showNotification('Aucune mise à jour disponible', 'success');
        }
        
        // Mettre à jour l'affichage
        if (this.currentSection === 'updates') {
          this.renderUpdatesContent();
        }
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la vérification', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  /**
   * Applique la mise à jour (permission apply requise)
   */
  async applyUpdate() {
    if (!this.hasPermission('updates', 'apply')) {
      this.showNotification('Vous n\'avez pas la permission d\'appliquer les mises à jour', 'error');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir appliquer cette mise à jour ? L\'application va redémarrer.')) {
      return;
    }

    try {
      const res = await fetch('/api/updates/apply', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + this.token
        }
      });

      if (res.ok) {
        const result = await res.json();
        this.showNotification('Mise à jour appliquée ! Redémarrage en cours...', 'success');
        
        // Afficher un message de redémarrage
        setTimeout(() => {
          document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: var(--bg-primary); color: var(--text-primary); text-align: center;">
              <div>
                <i class="fas fa-sync fa-spin" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h2>Redémarrage en cours...</h2>
                <p>L'application va redémarrer automatiquement.</p>
                <p><small>Veuillez patienter quelques secondes puis rafraîchir la page.</small></p>
              </div>
            </div>
          `;
        }, 2000);
        
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de l\'application de la mise à jour', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'application de la mise à jour:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  /**
   * Redémarre l'application manuellement (permission apply requise)
   */
  async restartApplication() {
    if (!this.hasPermission('updates', 'apply')) {
      this.showNotification('Vous n\'avez pas la permission de redémarrer l\'application', 'error');
      return;
    }

    if (!confirm('Êtes-vous sûr de vouloir redémarrer l\'application ?')) {
      return;
    }

    try {
      const res = await fetch('/api/updates/restart', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + this.token
        }
      });

      if (res.ok) {
        this.showNotification('Redémarrage en cours...', 'info');
        
        setTimeout(() => {
          document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: var(--bg-primary); color: var(--text-primary); text-align: center;">
              <div>
                <i class="fas fa-sync fa-spin" style="font-size: 48px; margin-bottom: 20px;"></i>
                <h2>Redémarrage en cours...</h2>
                <p>L'application va redémarrer automatiquement.</p>
                <p><small>Veuillez patienter quelques secondes puis rafraîchir la page.</small></p>
              </div>
            </div>
          `;
        }, 1000);
        
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors du redémarrage', 'error');
      }
    } catch (error) {
      console.error('Erreur lors du redémarrage:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  /**
   * Met à jour la configuration des mises à jour (permission config requise)
   */
  async updateUpdateConfig(configData) {
    if (!this.hasPermission('updates', 'config')) {
      this.showNotification('Vous n\'avez pas la permission de modifier la configuration des mises à jour', 'error');
      return;
    }

    try {
      const res = await fetch('/api/updates/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + this.token
        },
        body: JSON.stringify(configData)
      });

      if (res.ok) {
        this.showNotification('Configuration mise à jour avec succès !', 'success');
        await this.loadUpdateConfig();
        
        // Mettre à jour l'affichage
        if (this.currentSection === 'updates') {
          this.renderUpdatesContent();
        }
      } else {
        const error = await res.json();
        this.showNotification(error.error || 'Erreur lors de la mise à jour de la configuration', 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la configuration:', error);
      this.showNotification('Erreur de connexion', 'error');
    }
  }

  /**
   * Rend le contenu de la section préfixe
   */
  renderPrefix() {
    const prefixConfig = this.config.prefix_system || { enabled: false, prefix: '!', help_enabled: true };
    
    return `
      <div class="section-header">
        <h2>Configuration du Système de Préfixe <span class="beta-badge">BÊTA</span></h2>
        <p>Configurez le système de préfixe pour permettre l'utilisation de commandes textuelles.</p>
      </div>
      
      <div class="card warning-card">
        <div class="card-content">
          <div class="warning-message">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
              <h4>Fonctionnalité en version bêta</h4>
              <p>Le système de préfixe est actuellement en phase de test et peut présenter des instabilités. Utilisez-le avec précaution et signalez tout problème rencontré.</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3>
            <i class="fas fa-terminal"></i>
            Paramètres du Préfixe
          </h3>
        </div>
        <div class="card-content">
          <form id="prefix-form" class="config-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Système Activé</label>
                <label class="toggle-switch">
                  <input type="checkbox" name="enabled" ${prefixConfig.enabled ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
                <small class="form-help">Active ou désactive le système de commandes avec préfixe.</small>
              </div>
              
              <div class="form-group">
                <label class="form-label">Préfixe</label>
                <input type="text" class="form-input" name="prefix" value="${prefixConfig.prefix || '!'}" maxlength="5" placeholder="!" required>
                <small class="form-help">Le préfixe à utiliser pour les commandes (ex: !, ., $). Maximum 5 caractères, pas d'espaces.</small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Commande d'aide activée</label>
                <label class="toggle-switch">
                  <input type="checkbox" name="help_enabled" ${prefixConfig.help_enabled ? 'checked' : ''}>
                  <span class="toggle-slider"></span>
                </label>
                <small class="form-help">Active ou désactive la commande d'aide (${prefixConfig.prefix || '!'}help).</small>
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-save"></i>
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3>
            <i class="fas fa-info-circle"></i>
            Informations
          </h3>
        </div>
        <div class="card-content">
          <div class="info-block">
            <h4>Utilisation</h4>
            <p>Lorsque le système de préfixe est activé, les utilisateurs peuvent utiliser les commandes avec le préfixe configuré.</p>
            <p>Exemple: <code>${prefixConfig.prefix || '!'}ping</code> au lieu de <code>/ping</code></p>
            
            <h4>Commande d'aide</h4>
            <p>Si activée, la commande <code>${prefixConfig.prefix || '!'}help</code> affiche la liste des commandes disponibles.</p>
            <p>Les utilisateurs peuvent également obtenir de l'aide sur une commande spécifique avec <code>${prefixConfig.prefix || '!'}help [commande]</code></p>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Applique les permissions pour la section préfixe
   */
  applyPrefixPermissions() {
    if (!this.hasPermission('prefix', 'edit')) {
      const form = document.getElementById('prefix-form');
      if (form) {
        const inputs = form.querySelectorAll('input, select, button[type="submit"]');
        inputs.forEach(input => {
          input.disabled = true;
        });
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.style.display = 'none';
        }
        
        form.insertAdjacentHTML('beforeend', 
          '<div class="permission-notice">' +
          '<i class="fas fa-lock"></i> ' +
          'Vous n\'avez pas la permission de modifier la configuration du préfixe.' +
          '</div>'
        );
      }
    }
  }
  
  /**
   * Sauvegarde la configuration du préfixe
   */
  async savePrefixConfig(form) {
    try {
      // Afficher l'indicateur de chargement
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';
      submitBtn.disabled = true;
      
      const formData = new FormData(form);
      const enabled = formData.get('enabled') === 'on';
      const prefix = formData.get('prefix');
      const helpEnabled = formData.get('help_enabled') === 'on';
      
      // Validation du préfixe
      if (!prefix || prefix.length > 5 || /\s/.test(prefix)) {
        this.showNotification('Le préfixe ne peut pas contenir d\'espaces et doit faire moins de 5 caractères.', 'error');
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        return;
      }
      
      const response = await fetch('/api/config/prefix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({
          enabled,
          prefix,
          help_enabled: helpEnabled
        })
      });
      
      // Restaurer le bouton
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
      
      if (response.ok) {
        // Mettre à jour la configuration locale
        if (!this.config.prefix_system) {
          this.config.prefix_system = {};
        }
        this.config.prefix_system.enabled = enabled;
        this.config.prefix_system.prefix = prefix;
        this.config.prefix_system.help_enabled = helpEnabled;
        
        this.showNotification('✅ Configuration du préfixe mise à jour avec succès.', 'success');
        
        // Mettre à jour l'affichage
        const prefixStatusText = enabled ? 'Activé' : 'Désactivé';
        const helpStatusText = helpEnabled ? 'Activée' : 'Désactivée';
        
        this.showNotification(`
          <strong>Préfixe mis à jour:</strong><br>
          État: ${prefixStatusText}<br>
          Préfixe: ${prefix}<br>
          Commande d'aide: ${helpStatusText}
        `, 'info', 5000);
      } else {
        const error = await response.json();
        this.showNotification(`❌ Erreur: ${error.error || 'Impossible de mettre à jour la configuration du préfixe.'}`, 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration du préfixe:', error);
      this.showNotification('❌ Erreur lors de la sauvegarde de la configuration du préfixe.', 'error');
    }
  }

  /**
   * Rend le contenu principal du module de mise à jour
   */
  renderUpdates() {
    if (!this.hasPermission('updates', 'view')) {
      return `
        <div class="access-denied-section">
          <div class="access-denied-icon">
            <i class="fas fa-lock"></i>
          </div>
          <h2 class="access-denied-title">Accès Refusé</h2>
          <p class="access-denied-message">
            Vous n'avez pas les permissions nécessaires pour accéder au module de mise à jour.<br>
            Contactez un administrateur pour obtenir les permissions appropriées.
          </p>
        </div>
      `;
    }

    return `
      <div class="updates-section">
        <div class="updates-header">
          <h1 class="updates-title">
            <i class="fas fa-download"></i>
            Système de mise à jour
          </h1>
          <div class="updates-actions">
            <button class="btn btn-secondary" onclick="app.checkForUpdates()">
              <i class="fas fa-sync"></i>
              Vérifier
            </button>
            ${this.hasPermission('updates', 'apply') ? `
              <button class="btn btn-warning" onclick="app.restartApplication()">
                <i class="fas fa-power-off"></i>
                Redémarrer
              </button>
            ` : ''}
          </div>
        </div>
        
        <div id="updates-content">
          ${this.renderUpdatesContent()}
        </div>
      </div>
    `;
  }

  /**
   * Rend le contenu dynamique du module de mise à jour
   */
  renderUpdatesContent() {
    const content = document.getElementById('updates-content');
    if (!content) return '';

    let html = '';

    // Statut des mises à jour
    html += this.renderUpdateStatus();

    // Changements disponibles
    if (this.updateStatus?.updateAvailable && this.updateChanges) {
      html += this.renderUpdateChanges();
    }

    // Configuration (permission config requise)
    if (this.hasPermission('updates', 'config')) {
      html += this.renderUpdateConfig();
    }

    if (content) {
      content.innerHTML = html;
    }

    return html;
  }

  /**
   * Rend la section de statut des mises à jour
   */
  renderUpdateStatus() {
    const status = this.updateStatus;
    if (!status) {
      return `
        <div class="update-status-card">
          <div class="update-status-header">
            <h3 class="update-status-title">Statut des Mises à Jour</h3>
            <div class="update-status-indicator">
              <i class="fas fa-spinner fa-spin"></i>
              Chargement...
            </div>
          </div>
        </div>
      `;
    }

    const indicatorClass = status.updateAvailable ? 'available' : 'up-to-date';
    const indicatorText = status.updateAvailable ? 'Mise à jour disponible' : 'À jour';
    const indicatorIcon = status.updateAvailable ? 'fas fa-exclamation-triangle' : 'fas fa-check-circle';

    return `
      <div class="update-status-card">
        <div class="update-status-header">
          <h3 class="update-status-title">Statut des Mises à Jour</h3>
          <div class="update-status-indicator ${indicatorClass}">
            <i class="${indicatorIcon}"></i>
            ${indicatorText}
          </div>
        </div>
        
        <div class="update-status-info">
          <div class="update-info-item">
            <span class="update-info-label">Dernière vérification</span>
            <span class="update-info-value">
              ${status.lastCheck ? new Date(status.lastCheck).toLocaleString('fr-FR') : 'Jamais'}
            </span>
          </div>
          <div class="update-info-item">
            <span class="update-info-label">Vérification automatique</span>
            <span class="update-info-value">
              ${status.autoCheckRunning ? 'Activée' : 'Désactivée'}
            </span>
          </div>
          <div class="update-info-item">
            <span class="update-info-label">Intervalle de vérification</span>
            <span class="update-info-value">
              ${status.config?.checkIntervalMinutes || 30} minutes
            </span>
          </div>
        </div>
        
        ${status.updateAvailable && this.hasPermission('updates', 'apply') ? `
          <div style="margin-top: 20px;">
            <button class="btn btn-primary" onclick="app.applyUpdate()">
              <i class="fas fa-download"></i>
              Appliquer la mise à jour
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Rend la section des changements disponibles
   */
  renderUpdateChanges() {
    if (!this.updateChanges) return '';

    const changes = this.updateChanges;
    
    return `
      <div class="changes-section">
        <div class="changes-header">
          <h3 class="changes-title">Changements Disponibles</h3>
          <div class="changes-summary">
            <div class="changes-summary-item">
              <i class="fas fa-file"></i>
              ${changes.summary.total} fichier(s)
            </div>
            <div class="changes-summary-item additions">
              <i class="fas fa-plus"></i>
              +${changes.summary.insertions}
            </div>
            <div class="changes-summary-item deletions">
              <i class="fas fa-minus"></i>
              -${changes.summary.deletions}
            </div>
          </div>
        </div>
        
        <div class="changes-content">
          ${this.renderFilesList(changes.files)}
          ${this.renderCommitsList(changes.commits)}
        </div>
      </div>
    `;
  }

  /**
   * Rend la liste des fichiers modifiés
   */
  renderFilesList(files) {
    if (!files || files.length === 0) return '';

    return `
      <div class="files-list">
        <h4 class="files-list-header">Fichiers Modifiés</h4>
        ${files.map(file => {
          const statusIcons = {
            added: '+',
            modified: 'M',
            deleted: '-'
          };
          
          return `
            <div class="file-item ${file.excluded ? 'file-excluded' : ''}">
              <div class="file-info">
                <div class="file-status-icon ${file.status}">
                  ${statusIcons[file.status] || '?'}
                </div>
                <span class="file-path">${file.file}</span>
                ${file.excluded ? '<span class="excluded-badge">Exclu</span>' : ''}
              </div>
              <div class="file-changes">
                ${file.insertions > 0 ? `<span class="file-changes-additions">+${file.insertions}</span>` : ''}
                ${file.deletions > 0 ? `<span class="file-changes-deletions">-${file.deletions}</span>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Rend la liste des commits
   */
  renderCommitsList(commits) {
    if (!commits || commits.length === 0) return '';

    return `
      <div class="commits-list">
        <h4 class="commits-list-header">Commits</h4>
        ${commits.map(commit => `
          <div class="commit-item">
            <div class="commit-hash">${commit.hash}</div>
            <div class="commit-info">
              <div class="commit-message">${commit.message}</div>
              <div class="commit-meta">
                Par ${commit.author} • ${new Date(commit.date).toLocaleString('fr-FR')}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Rend la section de configuration des mises à jour
   */
  renderUpdateConfig() {
    if (!this.hasPermission('updates', 'config') || !this.updateConfig) return '';

    return `
      <div class="config-section">
        <h3 class="config-title">Configuration des mises à jour</h3>
        
        <form class="config-form" onsubmit="app.handleUpdateConfigSubmit(event)">
          <div class="config-row">
            <div class="config-field">
              <label class="config-label">Intervalle de vérification (minutes)</label>
              <input type="number" class="config-input" name="checkIntervalMinutes" 
                     value="${this.updateConfig.checkIntervalMinutes}" min="1" max="1440">
            </div>
          </div>
          
          <div class="config-checkbox">
            <input type="checkbox" name="autoCheck" ${this.updateConfig.autoCheck ? 'checked' : ''}>
            <label>Vérification automatique activée</label>
          </div>
          
          <div class="excluded-files-section">
            <h4>Fichiers Exclus</h4>
            <div class="excluded-files-list">
              ${this.updateConfig.excludedFiles.map((file, index) => `
                <div class="excluded-file-item">
                  <span class="excluded-file-path">${file}</span>
                  <button type="button" class="remove-excluded-btn" onclick="app.removeExcludedFile(${index})">
                    <i class="fas fa-times"></i>
                  </button>
                </div>
              `).join('')}
            </div>
            
            <div class="add-excluded-form">
              <input type="text" class="add-excluded-input" id="new-excluded-file" 
                     placeholder="Chemin du fichier à exclure (ex: .env, data/)">
              <button type="button" class="add-excluded-btn" onclick="app.addExcludedFile()">
                <i class="fas fa-plus"></i>
                Ajouter
              </button>
            </div>
          </div>
          
          <div style="margin-top: 20px;">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i>
              Sauvegarder la Configuration
            </button>
          </div>
        </form>
      </div>
    `;
  }

  /**
   * Gère la soumission du formulaire de configuration
   */
  async handleUpdateConfigSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const configData = {
      checkIntervalMinutes: parseInt(formData.get('checkIntervalMinutes')),
      autoCheck: formData.has('autoCheck'),
      excludedFiles: this.updateConfig.excludedFiles
    };
    
    await this.updateUpdateConfig(configData);
  }

  /**
   * Ajoute un fichier à la liste des exclusions
   */
  addExcludedFile() {
    const input = document.getElementById('new-excluded-file');
    const filePath = input.value.trim();
    
    if (!filePath) {
      this.showNotification('Veuillez saisir un chemin de fichier', 'warning');
      return;
    }
    
    if (this.updateConfig.excludedFiles.includes(filePath)) {
      this.showNotification('Ce fichier est déjà dans la liste des exclusions', 'warning');
      return;
    }
    
    this.updateConfig.excludedFiles.push(filePath);
    input.value = '';
    
    // Mettre à jour l'affichage
    this.renderUpdatesContent();
  }

  /**
   * Supprime un fichier de la liste des exclusions
   */
  removeExcludedFile(index) {
    if (index >= 0 && index < this.updateConfig.excludedFiles.length) {
      this.updateConfig.excludedFiles.splice(index, 1);
      
      // Mettre à jour l'affichage
      this.renderUpdatesContent();
    }
  }

}

// Initialiser l'application
const app = new HmmBotAdmin();
