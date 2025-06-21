import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { Logger } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class UserManager {
  static USERS_FILE = path.join(__dirname, '../../data/users.json');
  static SESSIONS_FILE = path.join(__dirname, '../../data/sessions.json');
  static SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD || 'SuperAdmin2024!';
  
  // Modules disponibles avec leurs permissions
  static MODULES = {
    dashboard: {
      name: 'Dashboard',
      icon: 'fas fa-tachometer-alt',
      permissions: ['view']
    },
    tickets: {
      name: 'Système Tickets',
      icon: 'fas fa-ticket-alt',
      permissions: ['view', 'create', 'close', 'manage']
    },
    moderation: {
      name: 'Modération',
      icon: 'fas fa-shield-alt',
      permissions: ['view', 'ban', 'kick', 'mute', 'warn']
    },
    economy: {
      name: 'Économie',
      icon: 'fas fa-coins',
      permissions: ['view', 'manage', 'give', 'remove']
    },
    channels: {
      name: 'Salons',
      icon: 'fas fa-hashtag',
      permissions: ['view', 'create', 'edit', 'delete']
    },
    roles: {
      name: 'Rôles',
      icon: 'fas fa-users-cog',
      permissions: ['view', 'create', 'edit', 'delete', 'assign']
    },
    logs: {
      name: 'Logs',
      icon: 'fas fa-file-alt',
      permissions: ['view', 'download', 'delete']
    },
    embeds: {
      name: 'Embeds',
      icon: 'fas fa-code',
      permissions: ['view', 'create', 'edit', 'send']
    },
    users: {
      name: 'Utilisateurs',
      icon: 'fas fa-users',
      permissions: ['view', 'create', 'edit', 'delete', 'manage_permissions']
    }
  };

  // Rôles prédéfinis
  static ROLES = {
    superadmin: {
      name: 'Super Admin',
      color: '#ff4757',
      permissions: Object.keys(UserManager.MODULES).reduce((acc, module) => {
        acc[module] = UserManager.MODULES[module].permissions;
        return acc;
      }, {})
    },
    admin: {
      name: 'Administrateur',
      color: '#3742fa',
      permissions: {
        dashboard: ['view'],
        tickets: ['view', 'create', 'close', 'manage'],
        moderation: ['view', 'ban', 'kick', 'mute', 'warn'],
        economy: ['view', 'manage'],
        channels: ['view', 'create', 'edit'],
        roles: ['view', 'assign'],
        logs: ['view', 'download'],
        embeds: ['view', 'create', 'edit', 'send']
      }
    },
    moderator: {
      name: 'Modérateur',
      color: '#2ed573',
      permissions: {
        dashboard: ['view'],
        tickets: ['view', 'create', 'close'],
        moderation: ['view', 'kick', 'mute', 'warn'],
        economy: ['view'],
        logs: ['view']
      }
    },
    support: {
      name: 'Support',
      color: '#ffa502',
      permissions: {
        dashboard: ['view'],
        tickets: ['view', 'create', 'close'],
        logs: ['view']
      }
    },
    viewer: {
      name: 'Lecteur',
      color: '#747d8c',
      permissions: {
        dashboard: ['view']
      }
    }
  };

  // Initialiser le système d'utilisateurs
  static async initialize() {
    console.log('[USER] Initialisation du système d\'utilisateurs...');
    
    try {
      // Étape 1: Créer le dossier data
      console.log('[USER] Création du dossier data...');
      this.ensureDataDir();
      
      // Étape 2: Charger les utilisateurs existants
      console.log('[USER] Chargement des utilisateurs...');
      const users = this.loadUsers();
      
      // Étape 3: Créer le SuperAdmin s'il n'existe pas
      if (!users.superadmin) {
        console.log('[USER] Création du compte SuperAdmin...');
        
        // Vérifier que bcrypt est disponible
        if (!bcrypt || typeof bcrypt.hash !== 'function') {
          throw new Error('bcrypt n\'est pas correctement chargé');
        }
        
        const hashedPassword = await bcrypt.hash(this.SUPERADMIN_PASSWORD, 12);
        
        users.superadmin = {
          id: 'superadmin',
          username: 'superadmin',
          email: 'superadmin@hmmbot.local',
          password: hashedPassword,
          role: 'superadmin',
          isActive: true,
          isSuperAdmin: true,
          createdAt: new Date().toISOString(),
          lastLogin: null,
          permissions: null // SuperAdmin a toutes les permissions
        };
        
        const saved = this.saveUsers(users);
        if (!saved) {
          throw new Error('Impossible de sauvegarder le SuperAdmin');
        }
        
        console.log('[USER] ✅ SuperAdmin créé avec succès');
      } else {
        console.log('[USER] ✅ SuperAdmin déjà présent');
      }
      
      // Étape 4: Nettoyer les anciennes sessions (optionnel, ne doit pas faire échouer l'init)
      try {
        this.cleanupExpiredSessions();
        console.log('[USER] ✅ Sessions nettoyées');
      } catch (error) {
        console.warn('[USER] ⚠️ Erreur lors du nettoyage des sessions:', error.message);
      }
      
      // Étape 5: Obtenir les stats (optionnel)
      try {
        const stats = this.getStats();
        console.log(`[USER] ✅ Système initialisé - ${stats.totalUsers} utilisateurs, ${stats.activeSessions} sessions actives`);
      } catch (error) {
        console.warn('[USER] ⚠️ Impossible d\'obtenir les stats:', error.message);
        console.log('[USER] ✅ Système initialisé (sans stats)');
      }
      
      return true;
    } catch (error) {
      console.error('[USER] ❌ Erreur lors de l\'initialisation:', error);
      console.error('[USER] Stack trace:', error.stack);
      throw error;
    }
  }

  static ensureDataDir() {
    const dataDir = path.dirname(this.USERS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  }

  static loadUsers() {
    this.ensureDataDir();
    if (!fs.existsSync(this.USERS_FILE)) {
      return {};
    }
    try {
      return JSON.parse(fs.readFileSync(this.USERS_FILE, 'utf8'));
    } catch (error) {
      Logger.error('Erreur lors du chargement des utilisateurs:', error);
      return {};
    }
  }

  static saveUsers(users) {
    this.ensureDataDir();
    try {
      fs.writeFileSync(this.USERS_FILE, JSON.stringify(users, null, 2));
      return true;
    } catch (error) {
      Logger.error('Erreur lors de la sauvegarde des utilisateurs:', error);
      return false;
    }
  }

  static loadSessions() {
    this.ensureDataDir();
    if (!fs.existsSync(this.SESSIONS_FILE)) {
      return {};
    }
    try {
      return JSON.parse(fs.readFileSync(this.SESSIONS_FILE, 'utf8'));
    } catch (error) {
      Logger.error('Erreur lors du chargement des sessions:', error);
      return {};
    }
  }

  static saveSessions(sessions) {
    this.ensureDataDir();
    try {
      fs.writeFileSync(this.SESSIONS_FILE, JSON.stringify(sessions, null, 2));
      return true;
    } catch (error) {
      Logger.error('Erreur lors de la sauvegarde des sessions:', error);
      return false;
    }
  }

  static async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateUserId() {
    return crypto.randomUUID();
  }

  // Nettoyer les sessions expirées
  static cleanupExpiredSessions() {
    const sessions = this.loadSessions();
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [sessionId, session] of Object.entries(sessions)) {
      if (now > session.expiresAt) {
        delete sessions[sessionId];
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.saveSessions(sessions);
      console.log(`[USER] Nettoyé ${cleanedCount} sessions expirées`);
    }
  }

  // Authentification SuperAdmin
  static async authenticateSuperAdmin(password) {
    return password === this.SUPERADMIN_PASSWORD;
  }

  // Créer un utilisateur
  static async createUser(userData) {
    const users = this.loadUsers();
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = Object.values(users).find(u => u.username === userData.username);
    if (existingUser) {
      throw new Error('Nom d\'utilisateur déjà utilisé');
    }

    const userId = this.generateUserId();
    const hashedPassword = await this.hashPassword(userData.password);
    
    const newUser = {
      id: userId,
      username: userData.username,
      email: userData.email || null,
      password: hashedPassword,
      role: userData.role || 'viewer',
      customPermissions: userData.customPermissions || {},
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null,
      loginCount: 0,
      createdBy: userData.createdBy || null
    };

    users[userId] = newUser;
    
    if (this.saveUsers(users)) {
      console.log(`[UserManager] Utilisateur créé: ${userData.username} (${userData.role})`);
      return { ...newUser, password: undefined }; // Ne pas retourner le mot de passe
    } else {
      throw new Error('Erreur lors de la sauvegarde de l\'utilisateur');
    }
  }

  // Authentifier un utilisateur
  static async authenticateUser(username, password) {
    const users = this.loadUsers();
    
    // Vérifier SuperAdmin
    if (username === 'superadmin') {
      // Charger le SuperAdmin depuis la base ou créer temporairement
      let superAdmin = users.superadmin;
      if (!superAdmin) {
        // Cas où le SuperAdmin n'existe pas encore
        if (password === this.SUPERADMIN_PASSWORD) {
          superAdmin = {
            id: 'superadmin',
            username: 'superadmin',
            email: 'superadmin@hmmbot.local',
            role: 'superadmin',
            isActive: true,
            isSuperAdmin: true
          };
        } else {
          throw new Error('Identifiants incorrects');
        }
      } else {
        // Vérifier le mot de passe hashé
        const isValidPassword = await this.verifyPassword(password, superAdmin.password);
        if (!isValidPassword) {
          throw new Error('Identifiants incorrects');
        }
      }
      
      return {
        id: superAdmin.id,
        username: superAdmin.username,
        email: superAdmin.email,
        role: superAdmin.role,
        permissions: this.getUserPermissions(superAdmin),
        isSuperAdmin: true,
        isActive: true,
        lastLogin: superAdmin.lastLogin,
        createdAt: superAdmin.createdAt
      };
    }

    // Vérifier utilisateur normal
    const user = Object.values(users).find(u => u.username === username);
    if (!user || !user.isActive) {
      throw new Error('Utilisateur non trouvé ou désactivé');
    }

    if (await this.verifyPassword(password, user.password)) {
      // Mettre à jour les stats de connexion
      user.lastLogin = new Date().toISOString();
      user.loginCount = (user.loginCount || 0) + 1;
      users[user.id] = user;
      this.saveUsers(users);

      console.log(`[UserManager] Connexion réussie: ${username}`);
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: this.getUserPermissions(user),
        lastLogin: user.lastLogin,
        loginCount: user.loginCount
      };
    } else {
      Logger.warn(`Tentative de connexion échouée: ${username}`);
      throw new Error('Mot de passe incorrect');
    }
  }

  // Créer une session
  static createSession(user, expiresIn = '2h') {
    const sessions = this.loadSessions();
    const sessionId = this.generateToken();
    
    const expiresAt = new Date();
    if (expiresIn.endsWith('h')) {
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));
    } else if (expiresIn.endsWith('m')) {
      expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(expiresIn));
    } else {
      expiresAt.setHours(expiresAt.getHours() + 2); // Par défaut 2h
    }

    sessions[sessionId] = {
      userId: user.id,
      username: user.username,
      role: user.role,
      permissions: user.permissions,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastActivity: new Date().toISOString(),
      ip: null,
      userAgent: null
    };

    this.saveSessions(sessions);
    this.cleanupExpiredSessions();

    return sessionId;
  }

  // Valider une session
  static validateSession(sessionId) {
    const sessions = this.loadSessions();
    const session = sessions[sessionId];

    if (!session) {
      return null;
    }

    if (new Date() > new Date(session.expiresAt)) {
      delete sessions[sessionId];
      this.saveSessions(sessions);
      return null;
    }

    // Mettre à jour la dernière activité
    session.lastActivity = new Date().toISOString();
    sessions[sessionId] = session;
    this.saveSessions(sessions);

    return session;
  }

  // Déconnecter (supprimer session)
  static logout(sessionId) {
    const sessions = this.loadSessions();
    if (sessions[sessionId]) {
      delete sessions[sessionId];
      this.saveSessions(sessions);
      return true;
    }
    return false;
  }

  // Nettoyer les sessions expirées
  static cleanExpiredSessions() {
    const sessions = this.loadSessions();
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, session] of Object.entries(sessions)) {
      if (new Date(session.expiresAt) < now) {
        delete sessions[sessionId];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.saveSessions(sessions);
      console.log(`[UserManager] ${cleaned} sessions expirées nettoyées`);
    }
  }

  // Obtenir les permissions d'un utilisateur
  static getUserPermissions(user) {
    // SuperAdmin a toutes les permissions
    if (user.isSuperAdmin || user.role === 'superadmin') {
      const allPermissions = {};
      
      // Donner toutes les permissions pour tous les modules
      for (const [moduleName, moduleInfo] of Object.entries(this.MODULES)) {
        allPermissions[moduleName] = moduleInfo.permissions || ['view', 'create', 'edit', 'delete', 'manage'];
      }
      
      return allPermissions;
    }
    
    const rolePermissions = this.ROLES[user.role]?.permissions || {};
    const customPermissions = user.customPermissions || {};
    
    // Fusionner les permissions du rôle avec les permissions personnalisées
    const finalPermissions = { ...rolePermissions };
    
    for (const [module, perms] of Object.entries(customPermissions)) {
      if (perms && perms.length > 0) {
        finalPermissions[module] = perms;
      }
    }

    return finalPermissions;
  }

  // Vérifier si un utilisateur a une permission spécifique
  static hasPermission(user, module, permission) {
    // SuperAdmin a toutes les permissions
    if (user.isSuperAdmin || user.role === 'superadmin') {
      return true;
    }
    
    const permissions = this.getUserPermissions(user);
    return permissions[module]?.includes(permission) || false;
  }

  // Obtenir tous les utilisateurs
  static getAllUsers() {
    const users = this.loadUsers();
    return Object.values(users).map(user => ({
      ...user,
      password: undefined, // Ne pas exposer le mot de passe
      permissions: this.getUserPermissions(user)
    }));
  }

  // Obtenir un utilisateur par ID
  static getUserById(userId) {
    const users = this.loadUsers();
    const user = users[userId];
    if (user) {
      return {
        ...user,
        password: undefined,
        permissions: this.getUserPermissions(user)
      };
    }
    return null;
  }

  // Mettre à jour un utilisateur
  static async updateUser(userId, updates) {
    const users = this.loadUsers();
    const user = users[userId];
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    // Vérifier si le nouveau nom d'utilisateur est déjà pris
    if (updates.username && updates.username !== user.username) {
      const existingUser = Object.values(users).find(u => u.username === updates.username);
      if (existingUser) {
        throw new Error('Nom d\'utilisateur déjà utilisé');
      }
    }

    // Hasher le nouveau mot de passe si fourni
    if (updates.password) {
      updates.password = await this.hashPassword(updates.password);
    }

    // Mettre à jour les champs
    const updatedUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    users[userId] = updatedUser;
    
    if (this.saveUsers(users)) {
      console.log(`[UserManager] Utilisateur mis à jour: ${updatedUser.username}`);
      return {
        ...updatedUser,
        password: undefined,
        permissions: this.getUserPermissions(updatedUser)
      };
    } else {
      throw new Error('Erreur lors de la sauvegarde');
    }
  }

  // Supprimer un utilisateur
  static deleteUser(userId) {
    const users = this.loadUsers();
    const user = users[userId];
    
    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    delete users[userId];
    
    if (this.saveUsers(users)) {
      // Supprimer toutes les sessions de cet utilisateur
      const sessions = this.loadSessions();
      const sessionsToDelete = Object.entries(sessions)
        .filter(([_, session]) => session.userId === userId)
        .map(([sessionId]) => sessionId);
      
      sessionsToDelete.forEach(sessionId => delete sessions[sessionId]);
      this.saveSessions(sessions);

      console.log(`[UserManager] Utilisateur supprimé: ${user.username}`);
      return true;
    } else {
      throw new Error('Erreur lors de la suppression');
    }
  }

  // Obtenir les statistiques
  static getStats() {
    const users = this.loadUsers();
    const sessions = this.loadSessions();
    
    const stats = {
      totalUsers: Object.keys(users).length,
      activeUsers: Object.values(users).filter(u => u.isActive).length,
      activeSessions: Object.keys(sessions).length,
      usersByRole: {},
      recentLogins: []
    };

    // Comptage par rôle
    for (const user of Object.values(users)) {
      stats.usersByRole[user.role] = (stats.usersByRole[user.role] || 0) + 1;
    }

    // Connexions récentes
    stats.recentLogins = Object.values(users)
      .filter(u => u.lastLogin)
      .sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin))
      .slice(0, 10)
      .map(u => ({
        username: u.username,
        role: u.role,
        lastLogin: u.lastLogin,
        loginCount: u.loginCount
      }));

    return stats;
  }

  // Obtenir les rôles disponibles
  static getRoles() {
    return this.ROLES;
  }

  // Obtenir les modules et permissions disponibles
  static getModules() {
    return this.MODULES;
  }

  // Détruire une session
  static destroySession(sessionId) {
    const sessions = this.loadSessions();
    
    if (sessions[sessionId]) {
      delete sessions[sessionId];
      this.saveSessions(sessions);
      console.log(`[UserManager] Session détruite: ${sessionId}`);
      return true;
    }
    
    return false;
  }
}

export { UserManager };