# HmmBot - Bot Discord Multitâches

HmmBot est un bot Discord complet et polyvalent conçu pour gérer tous les aspects d'un serveur Discord. Il offre un système de commandes slash moderne, une interface web d'administration, et de nombreuses fonctionnalités intégrées.

## Table des matières

- [Fonctionnalités principales](#fonctionnalités-principales)
- [Installation](#installation)
- [Configuration](#configuration)
- [Commandes disponibles](#commandes-disponibles)
- [Interface web](#interface-web)
- [Système de logs](#système-de-logs)
- [Économie](#économie)
- [Système de tickets](#système-de-tickets)
- [Giveaways](#giveaways)
- [Modération](#modération)
- [Développement](#développement)

## Fonctionnalités principales

### Core Features
- **Commandes Slash** : Interface moderne avec autocomplétion
- **Interface Web** : Panel d'administration complet avec authentification JWT
- **Système de logs** : Enregistrement détaillé de toutes les activités
- **Console interactive** : Commandes terminal pour la gestion en temps réel
- **Déploiement automatique** : Les commandes slash sont déployées automatiquement au démarrage
- **Gestion gracieuse** : Arrêt propre avec sauvegarde des données

### Modules intégrés
- **Système d'économie** : Monnaie virtuelle, travail, banque, jeux
- **Système de tickets** : Support client avec transcripts automatiques
- **Modération avancée** : Sanctions, nettoyage, gestion des rôles
- **Giveaways** : Concours automatisés avec gestion complète
- **Suivi vocal** : Statistiques de temps passé en vocal avec récompenses
- **Planification** : Messages programmés
- **Rôles personnalisés** : Système de rôles avec permissions

## Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn
- Un bot Discord configuré sur le Discord Developer Portal

### Étapes d'installation

1. **Cloner le repository**
```bash
git clone https://github.com/arockenbauer/hmmbot.git
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration des variables d'environnement**
```bash
cp .env.example .env
```

Éditez le fichier `.env` avec vos informations :
```env
DISCORD_TOKEN=votre_token_bot
DISCORD_GUILD_ID=id_de_votre_serveur
WEB_PASSWORD=mot_de_passe_admin
WEB_JWT_SECRET=clé_secrète_jwt
TENOR_API_KEY=clé_api_tenor_optionnelle
```

4. **Configuration du bot**
Éditez le fichier `config.json` selon vos besoins (voir section Configuration)

5. **Démarrage**
```bash
npm start
```

## Configuration

Le fichier `config.json` contient toute la configuration du bot :

### Configuration générale
```json
{
  "bot": {
    "name": "HmmBot",
    "version": "1.0.0",
    "description": "Bot Discord multitâches avec interface web d'administration"
  }
}
```

### Interface web
```json
{
  "webui": {
    "port": 25584,
    "password": "admin",
    "jwt_secret": "supersecret",
    "session_duration": "2h"
  }
}
```

### Système de logs
```json
{
  "logs": {
    "create_test_logs_on_startup": false,
    "max_log_files": 30,
    "max_memory_logs": 1000,
    "log_level": "info",
    "auto_cleanup": true
  }
}
```

### Canaux et rôles
Configurez les IDs de vos canaux et rôles Discord :
```json
{
  "channels": {
    "logs": "ID_CANAL_LOGS",
    "welcome": "ID_CANAL_BIENVENUE",
    "goodbye": "ID_CANAL_AUREVOIR",
    "moderation": "ID_CANAL_MODERATION",
    "economy": "ID_CANAL_ECONOMIE",
    "voice_logs": "ID_CANAL_LOGS_VOCAL",
    "general": "ID_CANAL_GENERAL"
  },
  "roles": {
    "moderator": "ID_ROLE_MODERATEUR",
    "admin": "ID_ROLE_ADMIN",
    "member": "ID_ROLE_MEMBRE",
    "muted": "ID_ROLE_MUTE",
    "vip": "ID_ROLE_VIP"
  }
}
```

## Commandes disponibles

### Modération
- `/moderation` - Commandes de modération (ban, kick, timeout, etc.)
- `/massdelete` - Suppression en masse de messages
- `/lock` - Verrouillage/déverrouillage de canaux
- `/slowmode` - Gestion du mode lent

### Économie
- `/balance` - Consulter le solde
- `/bank` - Gestion du compte bancaire (dépôt, retrait)
- `/work` - Travailler pour gagner de l'argent
- `/journalier` - Récompense quotidienne
- `/pay` - Transférer de l'argent
- `/rob` - Tenter de voler un autre utilisateur
- `/gamble` - Jeux d'argent
- `/leaderboard` - Classement économique
- `/eco-admin` - Administration de l'économie

### Tickets
- `/ticket` - Gestion des tickets
- `/newticket` - Créer un nouveau ticket
- `/closeticket` - Fermer un ticket
- `/ticket-admin` - Administration des tickets
- `/sendpanel` - Envoyer le panel de tickets

### Giveaways
- `/giveaway` - Lancer un giveaway
- `/giveaway-end` - Terminer un giveaway
- `/giveaway-kill` - Annuler un giveaway
- `/giveaway-reroll` - Relancer le tirage

### Communication
- `/announce` - Faire des annonces
- `/embed` - Créer des embeds personnalisés
- `/send` - Envoyer des messages dans des canaux

### Statistiques
- `/stats` - Statistiques du serveur
- `/serverinfo` - Informations du serveur
- `/userinfo` - Informations d'un utilisateur
- `/profile` - Profil utilisateur
- `/vocleaderboard` - Classement vocal

### Utilitaires
- `/help` - Aide interactive complète
- `/ping` - Test de latence
- `/role` - Gestion des rôles
- `/config` - Configuration du bot
- `/admin` - Commandes d'administration
- `/shedule` - Planification de messages

### Divertissement
- `/fun gif` - Recherche de GIFs via Tenor

## Interface web

L'interface web est accessible sur `http://localhost:25584` et offre :

### Fonctionnalités
- **Dashboard** : Vue d'ensemble des statistiques
- **Gestion des tickets** : Visualisation et gestion des tickets actifs
- **Téléchargement des transcripts** : Accès aux historiques de tickets
- **Configuration** : Modification de la configuration en temps réel
- **Logs** : Consultation des logs système
- **Gestion des utilisateurs** : Système de rôles et permissions

### Authentification
- Système JWT avec sessions
- Rôles et permissions granulaires
- Gestion des utilisateurs personnalisés

## Système de logs

### Types de logs
- **SYSTEM** : Événements système (démarrage, arrêt)
- **MEMBER_JOIN/LEAVE** : Arrivées/départs de membres
- **MESSAGE_DELETE/UPDATE** : Modifications de messages
- **VOICE** : Activité vocale
- **ECONOMY** : Transactions économiques
- **MODERATION** : Actions de modération
- **TICKETS** : Gestion des tickets

### Fonctionnalités
- Rotation automatique des fichiers de logs
- Nettoyage automatique des anciens logs
- Logs en mémoire pour les performances
- Interface web pour la consultation

## Économie

### Système monétaire
- **Monnaie** : Coins (configurable)
- **Récompense quotidienne** : 250 coins par défaut
- **Travail** : 50-500 coins par session
- **Vol** : Système de vol entre utilisateurs (30% de réussite)

### Fonctionnalités bancaires
- **Compte courant** : Argent disponible
- **Compte épargne** : Argent sécurisé
- **Transferts** : Entre utilisateurs
- **Historique** : Suivi des transactions

### Récompenses vocales
- **5 coins par minute** passée en vocal
- Suivi automatique du temps vocal
- Classement des utilisateurs les plus actifs

## Système de tickets

### Fonctionnalités
- **Création automatique** : Via panel avec boutons/dropdown
- **Catégorisation** : Support général, signalement, partenariat, etc.
- **Transcripts automatiques** : Sauvegarde HTML de tous les échanges
- **Limite par utilisateur** : Configurable
- **Permissions** : Rôles de support configurables

### Panel de tickets
- **Embed personnalisable** : Titre et description configurables
- **Types de sélection** : Boutons ou menu déroulant
- **Options multiples** : Différentes catégories de tickets
- **Messages de bienvenue** : Personnalisables par type

## Giveaways

### Fonctionnalités complètes
- **Durée flexible** : Minutes, heures, jours
- **Multiples gagnants** : Configurable
- **Gestion complète** : Fin anticipée, annulation, reroll
- **Réactions automatiques** : Système de participation par réaction
- **Notifications** : Annonces automatiques des résultats

### Administration
- **Permissions** : Réservé aux modérateurs
- **Logs** : Traçabilité complète
- **Validation** : Vérification des participants

## Modération

### Outils disponibles
- **Sanctions** : Ban, kick, timeout
- **Nettoyage** : Suppression de messages en masse
- **Gestion des canaux** : Lock, slowmode
- **Logs automatiques** : Toutes les actions sont enregistrées
- **Messages privés** : Notification des sanctions aux utilisateurs

### Fonctionnalités avancées
- **Durées flexibles** : Timeouts jusqu'à 28 jours
- **Raisons obligatoires** : Traçabilité des actions
- **Permissions granulaires** : Contrôle d'accès précis

## Développement

### Structure du projet
```
src/
├── commands/          # Commandes slash
├── events/           # Gestionnaires d'événements Discord
├── utils/            # Utilitaires et modules
└── data/             # Données persistantes

webui/                # Interface web
├── index.html        # Page principale
├── app.js           # Logique frontend
└── style.css        # Styles

data/                 # Données runtime
├── logs/            # Fichiers de logs
├── transcripts/     # Transcripts de tickets
└── *.json          # Données JSON
```

### Scripts disponibles
```bash
npm start                 # Démarrer le bot
npm run deploy-commands   # Déployer les commandes slash
```

### Console interactive
Une fois le bot démarré, une console interactive est disponible avec les commandes :
- `help` - Aide des commandes console
- `status` - Statut du bot
- `logs` - Afficher les logs récents
- `users` - Gestion des utilisateurs
- `config` - Configuration
- `stop` - Arrêt propre du bot

### Ajout de nouvelles commandes
1. Créer un fichier dans `src/commands/`
2. Exporter `data` (SlashCommandBuilder) et `execute` (fonction)
3. Le bot rechargera automatiquement au redémarrage

### Gestion des événements
1. Créer un fichier dans `src/events/`
2. Exporter `name`, `once` (boolean), et `execute`
3. L'événement sera automatiquement enregistré

## Support et contribution

### Logs et debugging
- Les logs sont disponibles dans `data/logs/`
- L'interface web offre une vue en temps réel
- La console interactive permet le debugging

### Configuration avancée
- Tous les paramètres sont dans `config.json`
- Les variables sensibles dans `.env`
- Rechargement à chaud pour certaines configurations

### Extensibilité
- Architecture modulaire
- Système de permissions flexible
- API web pour intégrations externes
- Hooks pour événements personnalisés

---

**Version** : 1.0.0  
**Licence** : Voir fichier LICENSE  
**Auteur** : Axel

Pour plus d'informations ou pour signaler des bugs, consultez la documentation ou ouvrez une issue sur le repo.