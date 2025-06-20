import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import { config } from 'dotenv';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { startWebServer } from '../webserver.js';
import { Logger } from './utils/logger.js';
import { TerminalCommands } from './utils/terminalCommands.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer les dossiers nécessaires au démarrage
function createRequiredDirectories() {
  const directories = [
    path.join(process.cwd(), 'data'),
    path.join(process.cwd(), 'data', 'logs'),
    path.join(process.cwd(), 'data', 'transcripts'),
    path.join(__dirname, 'data')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(chalk.cyan(`[INIT] Dossier créé: ${dir}`));
    }
  });
}

// Gestion de la fermeture propre
function setupGracefulShutdown(client) {
  const shutdown = async (signal) => {
    console.log(chalk.yellow(`\n[${signal}] Arrêt en cours...`));
    
    try {
      // Sauvegarder les logs finaux
      if (client.isReady()) {
        await Logger.log(client, 'SYSTEM', {
          message: `Bot arrêté (${signal})`,
          uptime: process.uptime()
        });
      }
      
      // Forcer la sauvegarde de tous les logs en mémoire
      Logger.flushAllLogs();
      
      // Arrêter la console interactive
      TerminalCommands.stop();
      
      // Fermer la connexion Discord
      if (client.isReady()) {
        await client.destroy();
        console.log(chalk.green('[SHUTDOWN] Connexion Discord fermée'));
      }
      
      // Attendre un peu pour s'assurer que les logs sont écrits
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log(chalk.green('[SHUTDOWN] Arrêt complet'));
      process.exit(0);
    } catch (error) {
      console.error(chalk.red('[SHUTDOWN] Erreur lors de l\'arrêt:'), error);
      process.exit(1);
    }
  };

  // Écouter les signaux d'arrêt
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Gestion d'erreurs non capturées
  process.on('unhandledRejection', (reason, promise) => {
    console.error(chalk.red('[ERROR] Rejection non gérée:'), reason);
    if (client.isReady()) {
      Logger.log(client, 'SYSTEM', {
        message: `Erreur non gérée: ${reason}`
      }).catch(() => {});
    }
  });

  process.on('uncaughtException', (error) => {
    console.error(chalk.red('[ERROR] Exception non gérée:'), error);
    if (client.isReady()) {
      Logger.log(client, 'SYSTEM', {
        message: `Exception non gérée: ${error.message}`
      }).catch(() => {});
    }
    process.exit(1);
  });
}

// Initialiser les dossiers
createRequiredDirectories();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  console.log(chalk.green(`[COMMAND]`) + ` ${command.data.name} chargée.`);
}

// Load events
const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))) {
  const event = await import(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(chalk.blue(`[EVENT]`) + ` ${event.name} chargé.`);
}

// Fonction de validation des commandes
function validateCommand(command, filename) {
  const json = command.data.toJSON();
  
  // Vérifier l'ordre des options (obligatoires d'abord)
  if (json.options) {
    let foundOptional = false;
    for (const option of json.options) {
      if (option.required === false || !option.required) {
        foundOptional = true;
      } else if (foundOptional && option.required) {
        console.error(chalk.red(`[VALIDATION] Erreur dans ${filename}: Option obligatoire "${option.name}" après une option optionnelle`));
        return false;
      }
    }
  }
  
  return true;
}

// Déploiement automatique des commandes slash au démarrage
async function deployCommands() {
  const { REST, Routes } = await import('discord.js');
  const commands = [];
  let hasErrors = false;
  
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    try {
      const command = await import(`./commands/${file}`);
      
      // Valider la commande
      if (!validateCommand(command, file)) {
        hasErrors = true;
        continue;
      }
      
      commands.push(command.data.toJSON());
    } catch (error) {
      console.error(chalk.red(`[VALIDATION] Erreur lors du chargement de ${file}:`), error.message);
      hasErrors = true;
    }
  }
  
  if (hasErrors) {
    console.error(chalk.red('[SLASH] Déploiement annulé à cause d\'erreurs de validation'));
    return;
  }
  
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
  try {
    await rest.put(
      Routes.applicationGuildCommands(
        (await rest.get(Routes.user())).id,
        process.env.DISCORD_GUILD_ID
      ),
      { body: commands }
    );
    console.log(chalk.yellow(`[SLASH] ${commands.length} commandes slash déployées automatiquement.`));
  } catch (error) {
    console.error('[SLASH] Erreur lors du déploiement automatique :', error);
  }
}

// Déployer les commandes au démarrage
await deployCommands();

// Exposer le client globalement pour le webserver
global.botClient = client;

// Configurer la fermeture propre
setupGracefulShutdown(client);

// Démarrer le système de planification, console interactive et créer des logs de test si configuré
client.once('ready', () => {
  // Import et démarrage du scheduler
  import('./commands/shedule.js').then(scheduleModule => {
    if (typeof scheduleModule.startScheduler === 'function') {
      scheduleModule.startScheduler(client);
      console.log(chalk.green('[SCHEDULER] Système de planification démarré'));
    }
  }).catch(err => {
    console.error('[SCHEDULER] Erreur lors du démarrage du planificateur:', err);
  });

  // Initialiser et démarrer la console interactive
  TerminalCommands.init(client);
  setTimeout(() => {
    TerminalCommands.start();
  }, 2000); // Démarrer la console après 1 seconde

  // Créer des logs de test si configuré
  if (Logger.shouldCreateTestLogsOnStartup()) {
    console.log(chalk.yellow('[LOGS] Création de logs de test au démarrage...'));
    setTimeout(() => {
      Logger.createTestLogs();
    }, 2000); // Attendre 2 secondes après le démarrage
  }
});

startWebServer(); // Lance le serveur web admin

client.login(process.env.DISCORD_TOKEN);
