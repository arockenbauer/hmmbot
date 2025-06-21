import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { Logger } from './src/utils/logger.js';
import { UserManager } from './src/utils/userManager.js';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 25584;
const JWT_SECRET = process.env.WEB_JWT_SECRET || 'supersecret';
const PASSWORD = process.env.WEB_PASSWORD || 'admin';
const CONFIG_PATH = path.join(__dirname, 'config.json');

// Fonction utilitaire pour formater l'uptime
function formatUptime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0s';
  }
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'webui')));

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Vérifier que UserManager est initialisé
    if (typeof UserManager.validateSession !== 'function') {
      console.error('[AUTH] UserManager.validateSession n\'est pas une fonction');
      return res.status(503).json({ error: 'Système d\'authentification non initialisé' });
    }
    
    const session = UserManager.validateSession(decoded.sessionId);
    if (!session) {
      console.log(`[AUTH] Session invalide ou expirée: ${decoded.sessionId}`);
      return res.status(401).json({ error: 'Session invalide ou expirée' });
    }
    
    req.user = { ...session, sessionId: decoded.sessionId };
    next();
  } catch (error) {
    console.error('[AUTH] Erreur de validation du token:', error.message);
    return res.status(401).json({ error: 'Token invalide' });
  }
};

// Middleware de vérification de permission
const checkPermission = (module, permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    
    if (!UserManager.hasPermission(req.user, module, permission)) {
      return res.status(403).json({ error: 'Permission insuffisante' });
    }
    
    next();
  };
};

// Route de connexion
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log(`[API] Tentative de connexion: ${username}`);
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    // Authentifier l'utilisateur (peut lancer une exception)
    let user;
    try {
      user = await UserManager.authenticateUser(username, password);
    } catch (authError) {
      console.log(`[API] Échec d'authentification pour ${username}: ${authError.message}`);
      return res.status(401).json({ error: authError.message || 'Identifiants incorrects' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    if (user.isActive === false) {
      return res.status(401).json({ error: 'Compte désactivé' });
    }

    console.log(`[API] ✅ Connexion réussie: ${user.username} (${user.role})`);

    const sessionId = UserManager.createSession(user);
    const token = jwt.sign({ sessionId, userId: user.id }, JWT_SECRET, { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' 
    });

    res.json({ 
      token, 
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        isSuperAdmin: user.isSuperAdmin
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route de déconnexion
app.post('/api/logout', authenticateToken, (req, res) => {
  try {
    console.log(`[API] Déconnexion demandée pour la session: ${req.user.sessionId}`);
    
    if (typeof UserManager.destroySession !== 'function') {
      console.error('[API] UserManager.destroySession n\'est pas une fonction');
      console.error('[API] UserManager disponible:', Object.getOwnPropertyNames(UserManager));
      return res.status(500).json({ error: 'Système d\'utilisateurs non initialisé' });
    }
    
    const result = UserManager.destroySession(req.user.sessionId);
    console.log(`[API] Session détruite: ${result}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Apply JWT middleware to protected routes (except auth routes)
app.use('/api', (req, res, next) => {
  // Skip authentication for auth routes
  if (req.path === '/login' || req.path === '/logout') {
    return next();
  }
  authenticateToken(req, res, next);
});

// Routes pour la gestion des rôles personnalisés
app.get('/api/roles/custom', checkPermission('users', 'manage_roles'), (req, res) => {
  try {
    const customRoles = UserManager.getCustomRoles();
    res.json(customRoles);
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles personnalisés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.get('/api/roles/custom/:roleId', checkPermission('users', 'manage_roles'), (req, res) => {
  try {
    const { roleId } = req.params;
    const customRoles = UserManager.getCustomRoles();
    
    if (!customRoles[roleId]) {
      return res.status(404).json({ error: 'Rôle non trouvé' });
    }
    
    res.json(customRoles[roleId]);
  } catch (error) {
    console.error('Erreur lors de la récupération du rôle:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

app.post('/api/roles/custom', checkPermission('users', 'manage_roles'), (req, res) => {
  try {
    const { name, color, permissions } = req.body;
    
    if (!name || !permissions) {
      return res.status(400).json({ error: 'Nom et permissions requis' });
    }
    
    const roleData = {
      name,
      color,
      permissions,
      createdBy: req.user.username
    };
    
    const newRole = UserManager.createCustomRole(roleData);
    res.json({ id: newRole.id, message: 'Rôle créé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création du rôle:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

app.put('/api/roles/custom/:roleId', checkPermission('users', 'manage_roles'), (req, res) => {
  try {
    const { roleId } = req.params;
    const { name, color, permissions } = req.body;
    
    const updatedRole = UserManager.updateCustomRole(roleId, { name, color, permissions });
    res.json({ message: 'Rôle mis à jour avec succès', role: updatedRole });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

app.delete('/api/roles/custom/:roleId', checkPermission('users', 'manage_roles'), (req, res) => {
  try {
    const { roleId } = req.params;
    
    UserManager.deleteCustomRole(roleId);
    res.json({ message: 'Rôle supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression du rôle:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Get config
app.get('/api/config', checkPermission('config', 'view'), (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    res.json(config);
  } catch {
    res.status(500).json({ error: 'Impossible de lire la config' });
  }
});

// Save config
app.post('/api/config', checkPermission('config', 'edit'), (req, res) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Impossible de sauvegarder la config' });
  }
});

// Get ticket stats
app.get('/api/tickets/stats', checkPermission('tickets', 'view'), (req, res) => {
  try {
    const activeTicketsPath = path.join(__dirname, 'data', 'active-tickets.json');
    const ticketsPath = path.join(__dirname, 'data', 'tickets.json');
    
    let activeTickets = {};
    let userTickets = {};
    
    if (fs.existsSync(activeTicketsPath)) {
      activeTickets = JSON.parse(fs.readFileSync(activeTicketsPath, 'utf8'));
    }
    
    if (fs.existsSync(ticketsPath)) {
      userTickets = JSON.parse(fs.readFileSync(ticketsPath, 'utf8'));
    }
    
    const stats = {
      activeCount: Object.keys(activeTickets).length,
      totalUsers: Object.keys(userTickets).length,
      ticketsByType: {},
      recentTickets: []
    };
    
    // Analyser les tickets actifs
    const activeTicketsList = Object.values(activeTickets);
    
    for (const ticket of activeTicketsList) {
      // Par type
      stats.ticketsByType[ticket.type] = (stats.ticketsByType[ticket.type] || 0) + 1;
    }
    
    // Tickets récents (5 derniers)
    stats.recentTickets = activeTicketsList
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(ticket => ({
        id: ticket.id,
        type: ticket.type,
        createdAt: ticket.createdAt,
        userId: ticket.userId
      }));
    
    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des stats tickets:', error);
    res.status(500).json({ error: 'Impossible de récupérer les statistiques' });
  }
});

// Get active tickets
app.get('/api/tickets/active', (req, res) => {
  try {
    const activeTicketsPath = path.join(__dirname, 'data', 'active-tickets.json');
    
    if (!fs.existsSync(activeTicketsPath)) {
      return res.json([]);
    }
    
    const activeTickets = JSON.parse(fs.readFileSync(activeTicketsPath, 'utf8'));
    const ticketsList = Object.values(activeTickets).map(ticket => ({
      id: ticket.id,
      type: ticket.type,
      userId: ticket.userId,
      channelId: ticket.channelId,
      createdAt: ticket.createdAt,
      status: ticket.status
    }));
    
    res.json(ticketsList);
  } catch (error) {
    console.error('Erreur lors de la récupération des tickets actifs:', error);
    res.status(500).json({ error: 'Impossible de récupérer les tickets actifs' });
  }
});

// Get transcripts list
app.get('/api/tickets/transcripts', (req, res) => {
  try {
    const transcriptsDir = path.join(__dirname, 'data', 'transcripts');
    
    if (!fs.existsSync(transcriptsDir)) {
      return res.json([]);
    }
    
    const files = fs.readdirSync(transcriptsDir)
      .filter(file => file.endsWith('.html'))
      .map(file => {
        const filePath = path.join(transcriptsDir, file);
        const stats = fs.statSync(filePath);
        return {
          filename: file,
          ticketId: file.replace('.html', ''),
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime
        };
      })
      .sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));
    
    res.json(files);
  } catch (error) {
    console.error('Erreur lors de la récupération des transcripts:', error);
    res.status(500).json({ error: 'Impossible de récupérer les transcripts' });
  }
});

// Download transcript
app.get('/api/tickets/transcripts/:ticketId', (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const filePath = path.join(__dirname, 'data', 'transcripts', `${ticketId}.html`);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Transcript non trouvé' });
    }
    
    res.download(filePath, `transcript-${ticketId}.html`);
  } catch (error) {
    console.error('Erreur lors du téléchargement du transcript:', error);
    res.status(500).json({ error: 'Impossible de télécharger le transcript' });
  }
});

// Test ticket panel
app.post('/api/tickets/test-panel', async (req, res) => {
  try {
    if (!global.botClient || !global.botClient.isReady()) {
      return res.status(503).json({ error: 'Bot non connecté' });
    }

    // Importer dynamiquement le module ticket
    const { AdvancedTicketManager } = await import('./src/utils/ticket.js');
    
    const ticketManager = new AdvancedTicketManager(global.botClient);
    const config = ticketManager.getTicketConfig();
    
    // Vérifier qu'un canal est configuré
    if (!config.panel?.channel) {
      return res.status(400).json({ 
        error: 'Aucun canal configuré pour le panel de tickets' 
      });
    }

    const guild = global.botClient.guilds.cache.first();
    if (!guild) {
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }

    const targetChannel = guild.channels.cache.get(config.panel.channel);
    if (!targetChannel) {
      return res.status(404).json({ 
        error: 'Canal configuré non trouvé ou inaccessible' 
      });
    }

    // Vérifier les permissions
    const permissionCheck = await ticketManager.validatePermissions(guild);
    if (!permissionCheck.valid) {
      return res.status(400).json({
        error: 'Permissions insuffisantes',
        details: permissionCheck.errors
      });
    }

    // Créer et envoyer le panel
    const message = await ticketManager.createTicketPanel(guild);

    // Logger l'action
    if (config.log_all_actions) {
      await ticketManager.logAction('PANEL_SENT', {
        user: 'Web Interface',
        userId: 'web-interface',
        channelId: targetChannel.id,
        channelName: targetChannel.name,
        messageId: message.id,
        source: 'web-test'
      });
    }

    res.json({ 
      success: true, 
      message: `Panel envoyé avec succès dans #${targetChannel.name}`,
      details: {
        channelId: targetChannel.id,
        channelName: targetChannel.name,
        messageId: message.id,
        panelType: config.panel?.selection_type || 'button'
      }
    });
  } catch (error) {
    console.error('Erreur lors du test du panel:', error);
    res.status(500).json({ 
      error: 'Erreur lors du test du panel',
      details: error.message 
    });
  }
});

// Get bot stats
app.get('/api/bot/stats', (req, res) => {
  try {
    // Statistiques basiques du bot
    const uptime = process.uptime();
    const stats = {
      uptime: Number.isFinite(uptime) ? uptime : 0,
      uptimeFormatted: formatUptime(uptime),
      memoryUsage: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      timestamp: new Date().toISOString(),
      status: global.botClient ? (global.botClient.isReady() ? 'online' : 'connecting') : 'offline'
    };
    
    // Ajouter des statistiques réelles si le bot est connecté
    if (global.botClient && global.botClient.isReady()) {
      stats.guilds = global.botClient.guilds.cache.size;
      stats.users = global.botClient.users.cache.size;
      stats.channels = global.botClient.channels.cache.size;
      
      // Statistiques économiques
      try {
        const economyPath = path.join(__dirname, 'src', 'data', 'economy.json');
        if (fs.existsSync(economyPath)) {
          const economyData = JSON.parse(fs.readFileSync(economyPath, 'utf8'));
          stats.economyUsers = Object.keys(economyData).length;
          stats.totalCoins = Object.values(economyData).reduce((total, user) => {
            const coins = user.coins || 0;
            return total + (Number.isFinite(coins) ? coins : 0);
          }, 0);
        } else {
          stats.economyUsers = 0;
          stats.totalCoins = 0;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stats économiques:', error);
        stats.economyUsers = 0;
        stats.totalCoins = 0;
      }
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des stats bot:', error);
    res.status(500).json({ error: 'Impossible de récupérer les statistiques du bot' });
  }
});

// Get bot logs (recent activity)
app.get('/api/bot/logs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recentLogs = Logger.getRecentLogs(limit);
    res.json(recentLogs);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de lire les logs' });
  }
});

// Get log files
app.get('/api/bot/logs/files', (req, res) => {
  try {
    const logFiles = Logger.getLogFiles();
    res.json(logFiles);
  } catch (error) {
    res.status(500).json({ error: 'Impossible de récupérer les fichiers de logs' });
  }
});

// Get specific log file content
app.get('/api/bot/logs/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const download = req.query.download === 'true';
    
    if (download) {
      // Mode téléchargement
      const logsDir = path.join(__dirname, 'data', 'logs');
      const filePath = path.join(logsDir, filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Fichier de log non trouvé' });
      }
      
      res.download(filePath, filename);
    } else {
      // Mode visualisation
      const content = Logger.readLogFile(filename);
      
      if (content === null) {
        return res.status(404).json({ error: 'Fichier de log non trouvé' });
      }
      
      res.json({ filename, content });
    }
  } catch (error) {
    res.status(500).json({ error: 'Impossible de lire le fichier de log' });
  }
});

// Send custom embed
app.post('/api/embeds/send', async (req, res) => {
  try {
    if (!global.botClient || !global.botClient.isReady()) {
      return res.status(503).json({ error: 'Bot non connecté' });
    }

    const { channelId, embed } = req.body;

    if (!channelId || !embed) {
      return res.status(400).json({ error: 'channelId et embed sont requis' });
    }

    const guild = global.botClient.guilds.cache.first();
    if (!guild) {
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Salon non trouvé' });
    }

    if (channel.type !== 0) { // GUILD_TEXT
      return res.status(400).json({ error: 'Le salon doit être un salon textuel' });
    }

    // Vérifier les permissions du bot
    const permissions = channel.permissionsFor(guild.members.me);
    if (!permissions.has('SendMessages') || !permissions.has('EmbedLinks')) {
      return res.status(403).json({ 
        error: 'Le bot n\'a pas les permissions nécessaires (SendMessages, EmbedLinks)' 
      });
    }

    // Convertir la couleur hex en nombre
    if (embed.color && typeof embed.color === 'string') {
      embed.color = embed.color.startsWith('#') 
        ? parseInt(embed.color.slice(1), 16) 
        : parseInt(embed.color, 16);
    }

    // Valider les limites Discord
    if (embed.title && embed.title.length > 256) {
      return res.status(400).json({ error: 'Le titre ne peut pas dépasser 256 caractères' });
    }
    if (embed.description && embed.description.length > 4096) {
      return res.status(400).json({ error: 'La description ne peut pas dépasser 4096 caractères' });
    }
    if (embed.fields && embed.fields.length > 25) {
      return res.status(400).json({ error: 'Un embed ne peut pas avoir plus de 25 champs' });
    }
    if (embed.footer?.text && embed.footer.text.length > 2048) {
      return res.status(400).json({ error: 'Le footer ne peut pas dépasser 2048 caractères' });
    }

    // Valider les champs
    if (embed.fields) {
      for (const field of embed.fields) {
        if (!field.name || !field.value) {
          return res.status(400).json({ error: 'Tous les champs doivent avoir un nom et une valeur' });
        }
        if (field.name.length > 256) {
          return res.status(400).json({ error: 'Le nom d\'un champ ne peut pas dépasser 256 caractères' });
        }
        if (field.value.length > 1024) {
          return res.status(400).json({ error: 'La valeur d\'un champ ne peut pas dépasser 1024 caractères' });
        }
      }
    }

    // Envoyer l'embed
    const message = await channel.send({ embeds: [embed] });

    // Logger l'action
    if (global.botClient.user) {
      await Logger.log(global.botClient, 'EMBED', {
        user: 'Web Interface',
        channel: channel.name,
        channelId: channel.id,
        messageId: message.id,
        embedTitle: embed.title || 'Sans titre',
        source: 'webui'
      });
    }

    res.json({ 
      success: true, 
      messageId: message.id,
      channelName: channel.name 
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'embed:', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'envoi de l\'embed',
      details: error.message 
    });
  }
});

// Get Discord server data (channels, roles, categories)
app.get('/api/discord/server-data', (req, res) => {
  try {
    if (!global.botClient || !global.botClient.isReady()) {
      return res.status(503).json({ error: 'Bot non connecté' });
    }

    const guild = global.botClient.guilds.cache.first();
    if (!guild) {
      return res.status(404).json({ error: 'Serveur non trouvé' });
    }

    const channels = guild.channels.cache
      .filter(channel => channel.type === 0) // Text channels
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        type: 'GUILD_TEXT',
        parent: channel.parent ? {
          id: channel.parent.id,
          name: channel.parent.name
        } : null
      }));

    const categories = guild.channels.cache
      .filter(channel => channel.type === 4) // Categories
      .map(category => ({
        id: category.id,
        name: category.name,
        type: 'GUILD_CATEGORY'
      }));

    const roles = guild.roles.cache
      .filter(role => !role.managed && role.name !== '@everyone')
      .map(role => ({
        id: role.id,
        name: role.name,
        color: role.color,
        position: role.position
      }));

    res.json({
      channels,
      categories,
      roles
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données du serveur:', error);
    res.status(500).json({ error: 'Impossible de récupérer les données du serveur' });
  }
});

// Create test logs (for development)
app.post('/api/bot/logs/test', (req, res) => {
  try {
    Logger.createTestLogs();
    res.json({ success: true, message: 'Logs de test créés avec succès' });
  } catch (error) {
    console.error('Erreur lors de la création des logs de test:', error);
    res.status(500).json({ error: 'Impossible de créer les logs de test' });
  }
});

// Get logs configuration
app.get('/api/bot/logs/config', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    res.json({
      create_test_logs_on_startup: config.logs?.create_test_logs_on_startup || false,
      max_log_files: config.logs?.max_log_files || 30,
      max_memory_logs: config.logs?.max_memory_logs || 1000,
      log_level: config.logs?.log_level || 'info',
      auto_cleanup: config.logs?.auto_cleanup || true
    });
  } catch (error) {
    console.error('Erreur lors de la lecture de la config logs:', error);
    res.status(500).json({ error: 'Impossible de lire la configuration des logs' });
  }
});

// Update logs configuration
app.post('/api/bot/logs/config', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    
    // Mettre à jour la configuration des logs
    if (!config.logs) config.logs = {};
    
    if (typeof req.body.create_test_logs_on_startup === 'boolean') {
      config.logs.create_test_logs_on_startup = req.body.create_test_logs_on_startup;
    }
    if (typeof req.body.max_log_files === 'number') {
      config.logs.max_log_files = req.body.max_log_files;
    }
    if (typeof req.body.max_memory_logs === 'number') {
      config.logs.max_memory_logs = req.body.max_memory_logs;
    }
    if (typeof req.body.log_level === 'string') {
      config.logs.log_level = req.body.log_level;
    }
    if (typeof req.body.auto_cleanup === 'boolean') {
      config.logs.auto_cleanup = req.body.auto_cleanup;
    }
    
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    res.json({ success: true, message: 'Configuration des logs mise à jour' });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la config logs:', error);
    res.status(500).json({ error: 'Impossible de sauvegarder la configuration des logs' });
  }
});

// ==========================================================================
// ROUTES API SYSTÈME D'UTILISATEURS
// ==========================================================================

// Obtenir les informations de l'utilisateur actuel
app.get('/api/user/me', authenticateToken, (req, res) => {
  try {
    const user = {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      permissions: req.user.permissions,
      isSuperAdmin: req.user.isSuperAdmin,
      isActive: req.user.isActive,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt
    };
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Lister tous les utilisateurs
app.get('/api/users', authenticateToken, checkPermission('users', 'view'), (req, res) => {
  try {
    if (typeof UserManager.getAllUsers !== 'function') {
      console.error('[API] UserManager.getAllUsers n\'est pas une fonction');
      return res.status(503).json({ error: 'Système d\'utilisateurs non initialisé' });
    }
    
    const users = UserManager.getAllUsers();
    console.log(`[API] Récupération de ${users.length} utilisateurs`);
    
    const cleanedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      permissions: user.permissions
    }));
    
    res.json(cleanedUsers);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Créer un nouvel utilisateur
app.post('/api/users', authenticateToken, checkPermission('users', 'create'), async (req, res) => {
  try {
    const { username, email, password, role, customPermissions } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }

    const newUser = await UserManager.createUser({
      username,
      email,
      password,
      role: role || 'viewer',
      customPermissions
    });

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    });
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    console.error('Stack trace:', error.stack);
    
    if (error.message.includes('existe déjà')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ 
        error: 'Erreur lors de la création de l\'utilisateur',
        details: error.message
      });
    }
  }
});

// Mettre à jour un utilisateur
app.put('/api/users/:id', authenticateToken, checkPermission('users', 'edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, password, role, isActive, customPermissions } = req.body;
    
    const updates = {
      username,
      email,
      role,
      isActive,
      customPermissions
    };
    
    // Ajouter le mot de passe seulement s'il est fourni
    if (password && password.trim()) {
      updates.password = password;
    }

    const updatedUser = await UserManager.updateUser(id, updates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      lastLogin: updatedUser.lastLogin,
      createdAt: updatedUser.createdAt
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
    if (error.message.includes('existe déjà')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l\'utilisateur' });
    }
  }
});

// Supprimer un utilisateur
app.delete('/api/users/:id', authenticateToken, checkPermission('users', 'delete'), (req, res) => {
  try {
    const { id } = req.params;
    
    // Empêcher la suppression de son propre compte
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }

    const deleted = UserManager.deleteUser(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'utilisateur' });
  }
});

// Obtenir les statistiques des utilisateurs
app.get('/api/users/stats', authenticateToken, checkPermission('users', 'view'), (req, res) => {
  try {
    const stats = UserManager.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les informations de l'utilisateur connecté
app.get('/api/user/me', authenticateToken, (req, res) => {
  try {
    const user = UserManager.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
      isSuperAdmin: user.isSuperAdmin,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Obtenir les rôles disponibles
app.get('/api/users/roles', authenticateToken, (req, res) => {
  try {
    if (typeof UserManager.getRoles !== 'function') {
      console.error('[API] UserManager.getRoles n\'est pas une fonction');
      return res.status(503).json({ error: 'Système d\'utilisateurs non initialisé' });
    }
    
    const roles = UserManager.getRoles();
    console.log(`[API] Récupération des rôles: ${Object.keys(roles).length} rôles disponibles`);
    res.json(roles);
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Obtenir les modules et permissions disponibles
app.get('/api/users/modules', authenticateToken, (req, res) => {
  try {
    if (typeof UserManager.getModules !== 'function') {
      console.error('[API] UserManager.getModules n\'est pas une fonction');
      return res.status(503).json({ error: 'Système d\'utilisateurs non initialisé' });
    }
    
    const modules = UserManager.getModules();
    console.log(`[API] Récupération des modules: ${Object.keys(modules).length} modules disponibles`);
    res.json(modules);
  } catch (error) {
    console.error('Erreur lors de la récupération des modules:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// ROUTES POUR LA GESTION DES RÔLES

// Obtenir tous les rôles personnalisés
app.get('/api/roles/custom', authenticateToken, checkPermission('users', 'manage_roles'), (req, res) => {
  try {
    if (typeof UserManager.getCustomRoles !== 'function') {
      console.error('[API] UserManager.getCustomRoles n\'est pas une fonction');
      return res.status(503).json({ error: 'Système d\'utilisateurs non initialisé' });
    }
    
    const customRoles = UserManager.getCustomRoles();
    console.log(`[API] Récupération des rôles personnalisés: ${Object.keys(customRoles).length} rôles`);
    res.json(customRoles);
  } catch (error) {
    console.error('Erreur lors de la récupération des rôles personnalisés:', error);
    res.status(500).json({ error: 'Erreur serveur', details: error.message });
  }
});

// Créer un rôle personnalisé
app.post('/api/roles/custom', authenticateToken, checkPermission('users', 'manage_roles'), async (req, res) => {
  try {
    const { name, color, permissions } = req.body;
    
    if (!name || !permissions) {
      return res.status(400).json({ error: 'Nom et permissions requis' });
    }

    if (typeof UserManager.createCustomRole !== 'function') {
      console.error('[API] UserManager.createCustomRole n\'est pas une fonction');
      return res.status(503).json({ error: 'Système d\'utilisateurs non initialisé' });
    }

    const roleData = {
      name,
      color: color || '#747d8c',
      permissions,
      createdBy: req.user.username
    };

    const newRole = UserManager.createCustomRole(roleData);
    console.log(`[API] Rôle personnalisé créé: ${newRole.name} par ${req.user.username}`);
    
    res.json({ success: true, role: newRole });
  } catch (error) {
    console.error('Erreur lors de la création du rôle personnalisé:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Mettre à jour un rôle personnalisé
app.put('/api/roles/custom/:roleId', authenticateToken, checkPermission('users', 'manage_roles'), async (req, res) => {
  try {
    const { roleId } = req.params;
    const updates = req.body;

    if (typeof UserManager.updateCustomRole !== 'function') {
      console.error('[API] UserManager.updateCustomRole n\'est pas une fonction');
      return res.status(503).json({ error: 'Système d\'utilisateurs non initialisé' });
    }

    const updatedRole = UserManager.updateCustomRole(roleId, updates);
    console.log(`[API] Rôle personnalisé mis à jour: ${updatedRole.name} par ${req.user.username}`);
    
    res.json({ success: true, role: updatedRole });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du rôle personnalisé:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Supprimer un rôle personnalisé
app.delete('/api/roles/custom/:roleId', authenticateToken, checkPermission('users', 'manage_roles'), async (req, res) => {
  try {
    const { roleId } = req.params;

    if (typeof UserManager.deleteCustomRole !== 'function') {
      console.error('[API] UserManager.deleteCustomRole n\'est pas une fonction');
      return res.status(503).json({ error: 'Système d\'utilisateurs non initialisé' });
    }

    const deleted = UserManager.deleteCustomRole(roleId);
    console.log(`[API] Rôle personnalisé supprimé: ${roleId} par ${req.user.username}`);
    
    res.json({ success: deleted });
  } catch (error) {
    console.error('Erreur lors de la suppression du rôle personnalisé:', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

// Fallback to index.html for SPA (DOIT ÊTRE EN DERNIER)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'webui', 'index.html'));
});

export async function startWebServer() {
  try {
    // Initialiser le système d'utilisateurs AVANT de démarrer le serveur
    console.log('[WEB] Initialisation du système d\'utilisateurs...');
    await UserManager.initialize();
    console.log('[WEB] ✅ Système d\'utilisateurs initialisé');
    
    // Démarrer le serveur web
    app.listen(PORT, () => {
      console.log(`[WEB] ✅ Interface web démarrée sur http://localhost:${PORT}`);
      
      // Créer des logs de test au démarrage pour avoir du contenu
      setTimeout(() => {
        Logger.createTestLogs();
      }, 2000);
    });
    
  } catch (error) {
    console.error('[WEB] ❌ Erreur lors de l\'initialisation du système d\'utilisateurs:', error);
    console.error('[WEB] Stack trace:', error.stack);
    process.exit(1);
  }
}
