import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { Logger } from './src/utils/logger.js';

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

// Auth route
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    const token = jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  }
  res.status(401).json({ error: 'Mot de passe incorrect' });
});

// Middleware JWT function
function authenticateToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  const token = auth.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

// Apply JWT middleware to protected routes (except login)
app.use('/api', (req, res, next) => {
  // Skip authentication for login route
  if (req.path === '/login') {
    return next();
  }
  authenticateToken(req, res, next);
});

// Get config
app.get('/api/config', (req, res) => {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    res.json(config);
  } catch {
    res.status(500).json({ error: 'Impossible de lire la config' });
  }
});

// Save config
app.post('/api/config', (req, res) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Impossible de sauvegarder la config' });
  }
});

// Get ticket stats
app.get('/api/tickets/stats', (req, res) => {
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

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'webui', 'index.html'));
});

export function startWebServer() {
  app.listen(PORT, () => {
    console.log(`[WEB] Interface web démarrée sur http://localhost:${PORT}`);
    
    // Créer des logs de test au démarrage pour avoir du contenu
    setTimeout(() => {
      Logger.createTestLogs();
    }, 2000);
  });
}
