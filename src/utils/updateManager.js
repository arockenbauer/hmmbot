import { simpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Gestionnaire des mises à jour Git
 * Vérifie les mises à jour disponibles et permet l'application des changements
 */
export class UpdateManager {
  constructor() {
    this.git = simpleGit();
    this.projectRoot = path.resolve(__dirname, '../..');
    this.updateAvailable = false;
    this.lastCheck = null;
    this.pendingChanges = null;
    this.checkInterval = null;
    
    // Fichiers à exclure par défaut lors des mises à jour
    this.defaultExcludedFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'config.json',
      'data/',
      'logs/',
      'node_modules/',
      '.git/',
      'package-lock.json'
    ];
    
    // Configuration par défaut
    this.config = {
      checkIntervalMinutes: parseInt(process.env.UPDATE_CHECK_INTERVAL) || 30,
      remoteBranch: process.env.UPDATE_REMOTE_BRANCH || 'origin/main',
      autoCheck: process.env.UPDATE_AUTO_CHECK !== 'false',
      excludedFiles: this.defaultExcludedFiles
    };
    
    this.init();
  }

  /**
   * Initialise le gestionnaire de mises à jour
   */
  async init() {
    try {
      // Vérifier si on est dans un repo Git
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        console.warn('Le projet n\'est pas dans un repository Git');
        return;
      }

      console.log('UpdateManager initialisé');
      
      // Démarrer la vérification automatique si activée
      if (this.config.autoCheck) {
        this.startAutoCheck();
      }
      
      // Faire une première vérification
      await this.checkForUpdates();
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de UpdateManager:', error);
    }
  }

  /**
   * Démarre la vérification automatique des mises à jour
   */
  startAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    const intervalMs = this.config.checkIntervalMinutes * 60 * 1000;
    this.checkInterval = setInterval(() => {
      this.checkForUpdates().catch(error => {
        console.error('Erreur lors de la vérification automatique:', error);
      });
    }, intervalMs);
    
    console.log(`Vérification automatique démarrée (${this.config.checkIntervalMinutes} minutes)`);
  }

  /**
   * Arrête la vérification automatique
   */
  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Vérification automatique arrêtée');
    }
  }

  /**
   * Vérifie s'il y a des mises à jour disponibles
   */
  async checkForUpdates() {
    try {
      console.log('Vérification des mises à jour...');
      
      // Récupérer les dernières informations du remote
      await this.git.fetch();
      
      // Obtenir le hash du commit local
      const localCommit = await this.git.revparse(['HEAD']);
      
      // Obtenir le hash du commit distant
      const remoteCommit = await this.git.revparse([this.config.remoteBranch]);
      
      this.lastCheck = new Date();
      
      if (localCommit !== remoteCommit) {
        // Il y a des mises à jour disponibles
        this.updateAvailable = true;
        this.pendingChanges = await this.getChanges(localCommit, remoteCommit);
        
        console.log(`Mise à jour disponible! ${this.pendingChanges.files.length} fichier(s) modifié(s)`);
        return {
          available: true,
          changes: this.pendingChanges,
          localCommit: localCommit.substring(0, 7),
          remoteCommit: remoteCommit.substring(0, 7)
        };
      } else {
        this.updateAvailable = false;
        this.pendingChanges = null;
        console.log('Aucune mise à jour disponible');
        return {
          available: false,
          localCommit: localCommit.substring(0, 7),
          remoteCommit: remoteCommit.substring(0, 7)
        };
      }
      
    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error);
      throw error;
    }
  }

  /**
   * Obtient les changements entre deux commits
   */
  async getChanges(localCommit, remoteCommit) {
    try {
      // Obtenir la liste des fichiers modifiés
      const diffSummary = await this.git.diffSummary([localCommit, remoteCommit]);
      
      // Obtenir les détails des commits
      const commits = await this.git.log({
        from: localCommit,
        to: remoteCommit
      });

      const changes = {
        files: [],
        commits: commits.all.map(commit => ({
          hash: commit.hash.substring(0, 7),
          message: commit.message,
          author: commit.author_name,
          date: commit.date
        })),
        summary: {
          total: diffSummary.files.length,
          insertions: diffSummary.insertions,
          deletions: diffSummary.deletions
        }
      };

      // Analyser chaque fichier modifié
      for (const file of diffSummary.files) {
        const fileInfo = {
          file: file.file,
          status: this.getFileStatus(file),
          insertions: file.insertions,
          deletions: file.deletions,
          excluded: this.isFileExcluded(file.file)
        };
        
        changes.files.push(fileInfo);
      }

      return changes;
      
    } catch (error) {
      console.error('Erreur lors de l\'analyse des changements:', error);
      throw error;
    }
  }

  /**
   * Détermine le statut d'un fichier (ajouté, modifié, supprimé)
   */
  getFileStatus(file) {
    if (file.insertions > 0 && file.deletions === 0) {
      return 'added';
    } else if (file.insertions === 0 && file.deletions > 0) {
      return 'deleted';
    } else {
      return 'modified';
    }
  }

  /**
   * Vérifie si un fichier doit être exclu de la mise à jour
   */
  isFileExcluded(filePath) {
    return this.config.excludedFiles.some(excluded => {
      if (excluded.endsWith('/')) {
        return filePath.startsWith(excluded);
      }
      return filePath === excluded || filePath.includes(excluded);
    });
  }

  /**
   * Applique la mise à jour
   */
  async applyUpdate() {
    try {
      console.log('Application de la mise à jour...');
      
      if (!this.updateAvailable || !this.pendingChanges) {
        throw new Error('Aucune mise à jour disponible');
      }

      // Configurer Git pour éviter les avertissements
      await this.configureGit();

      // Vérifier s'il y a des modifications locales
      const status = await this.git.status();
      const hasLocalChanges = status.files.length > 0;
      
      let stashCreated = false;
      let backupData = {};

      try {
        // Sauvegarder les fichiers exclus
        backupData = await this.backupExcludedFiles();
        
        // Si il y a des modifications locales, les stash
        if (hasLocalChanges) {
          console.log('Sauvegarde des modifications locales...');
          await this.git.stash(['push', '-m', 'Auto-stash before update']);
          stashCreated = true;
        }
        
        // Effectuer le pull avec stratégie de merge
        console.log('Téléchargement des mises à jour...');
        const pullResult = await this.git.pull('origin', 'main', ['--no-rebase']);
        
        // Restaurer les fichiers exclus
        await this.restoreExcludedFiles(backupData);
        
        console.log('Mise à jour appliquée avec succès');
        
        // Réinitialiser l'état
        this.updateAvailable = false;
        this.pendingChanges = null;
        
        return {
          success: true,
          message: 'Mise à jour appliquée avec succès',
          details: pullResult,
          stashCreated: stashCreated
        };
        
      } catch (pullError) {
        console.error('Erreur lors du pull:', pullError);
        
        // En cas d'erreur, restaurer les fichiers exclus
        await this.restoreExcludedFiles(backupData);
        
        // Si on a créé un stash, le restaurer
        if (stashCreated) {
          try {
            console.log('Restauration des modifications locales...');
            await this.git.stash(['pop']);
          } catch (stashError) {
            console.error('Erreur lors de la restauration du stash:', stashError);
          }
        }
        
        // Analyser l'erreur pour donner un message plus clair
        const errorMessage = this.parseGitError(pullError);
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('Erreur lors de l\'application de la mise à jour:', error);
      throw error;
    }
  }

  /**
   * Configure Git pour éviter les avertissements et conflits
   */
  async configureGit() {
    try {
      // Configurer la stratégie de pull par défaut
      await this.git.addConfig('pull.rebase', 'false');
      
      // Configurer le comportement pour les fast-forward
      await this.git.addConfig('pull.ff', 'only', false, 'local');
      
      console.log('Configuration Git mise à jour');
    } catch (error) {
      console.warn('Impossible de configurer Git:', error.message);
    }
  }

  /**
   * Analyse les erreurs Git pour fournir des messages plus clairs
   */
  parseGitError(error) {
    const errorMessage = error.message || error.toString();
    
    if (errorMessage.includes('Your local changes to the following files would be overwritten')) {
      return 'Des modifications locales entrent en conflit avec la mise à jour. Les changements ont été sauvegardés automatiquement.';
    }
    
    if (errorMessage.includes('Pulling without specifying how to reconcile divergent branches')) {
      return 'Configuration Git manquante pour la stratégie de merge. Veuillez réessayer.';
    }
    
    if (errorMessage.includes('fatal: unable to access')) {
      return 'Impossible d\'accéder au repository distant. Vérifiez votre connexion internet.';
    }
    
    if (errorMessage.includes('fatal: not a git repository')) {
      return 'Le projet n\'est pas dans un repository Git valide.';
    }
    
    if (errorMessage.includes('CONFLICT')) {
      return 'Conflit détecté lors de la mise à jour. Intervention manuelle requise.';
    }
    
    // Message par défaut
    return `Erreur Git: ${errorMessage}`;
  }

  /**
   * Sauvegarde les fichiers exclus
   */
  async backupExcludedFiles() {
    const backupData = {};
    
    for (const excludedPattern of this.config.excludedFiles) {
      try {
        const filePath = path.join(this.projectRoot, excludedPattern);
        
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          
          if (stats.isFile()) {
            backupData[excludedPattern] = fs.readFileSync(filePath, 'utf8');
          }
        }
      } catch (error) {
        console.warn(`Impossible de sauvegarder ${excludedPattern}:`, error.message);
      }
    }
    
    return backupData;
  }

  /**
   * Restaure les fichiers exclus
   */
  async restoreExcludedFiles(backupData) {
    for (const [filePath, content] of Object.entries(backupData)) {
      try {
        const fullPath = path.join(this.projectRoot, filePath);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Fichier restauré: ${filePath}`);
      } catch (error) {
        console.error(`Erreur lors de la restauration de ${filePath}:`, error);
      }
    }
  }

  /**
   * Vérifie si le projet est dans un repository Git
   */
  async isGitRepository() {
    try {
      return await this.git.checkIsRepo();
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtient le statut actuel des mises à jour
   */
  getStatus() {
    return {
      updateAvailable: this.updateAvailable,
      lastCheck: this.lastCheck,
      pendingChanges: this.pendingChanges,
      config: this.config,
      autoCheckRunning: this.checkInterval !== null
    };
  }

  /**
   * Met à jour la configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Redémarrer la vérification automatique si nécessaire
    if (this.config.autoCheck && !this.checkInterval) {
      this.startAutoCheck();
    } else if (!this.config.autoCheck && this.checkInterval) {
      this.stopAutoCheck();
    } else if (this.checkInterval) {
      // Redémarrer avec le nouvel intervalle
      this.startAutoCheck();
    }
    
    console.log('Configuration mise à jour');
  }

  /**
   * Récupère les modifications stashées
   */
  async restoreStashedChanges() {
    try {
      const stashList = await this.git.stashList();
      
      if (stashList.all.length === 0) {
        return { success: false, message: 'Aucune modification sauvegardée trouvée' };
      }
      
      // Récupérer le dernier stash
      await this.git.stash(['pop']);
      
      console.log('Modifications locales restaurées');
      return { success: true, message: 'Modifications locales restaurées avec succès' };
      
    } catch (error) {
      console.error('Erreur lors de la restauration des modifications:', error);
      return { success: false, message: `Erreur: ${error.message}` };
    }
  }

  /**
   * Obtient la liste des modifications stashées
   */
  async getStashedChanges() {
    try {
      const stashList = await this.git.stashList();
      return stashList.all.map(stash => ({
        index: stash.index,
        message: stash.message,
        date: stash.date,
        author: stash.author_name
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des stash:', error);
      return [];
    }
  }

  /**
   * Force la mise à jour en ignorant les conflits locaux
   */
  async forceUpdate() {
    try {
      console.log('Mise à jour forcée en cours...');
      
      // Sauvegarder les fichiers exclus
      const backupData = await this.backupExcludedFiles();
      
      // Reset hard vers le commit distant
      await this.git.fetch();
      await this.git.reset(['--hard', this.config.remoteBranch]);
      
      // Restaurer les fichiers exclus
      await this.restoreExcludedFiles(backupData);
      
      console.log('Mise à jour forcée appliquée avec succès');
      
      // Réinitialiser l'état
      this.updateAvailable = false;
      this.pendingChanges = null;
      
      return {
        success: true,
        message: 'Mise à jour forcée appliquée avec succès (modifications locales perdues)'
      };
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour forcée:', error);
      throw error;
    }
  }

  /**
   * Redémarre l'application (pour PM2)
   */
  async restartApplication() {
    console.log('Redémarrage de l\'application...');
    
    // Arrêter la vérification automatique
    this.stopAutoCheck();
    
    // Attendre un peu pour que les logs soient écrits
    setTimeout(() => {
      process.exit(1); // PM2 redémarrera automatiquement
    }, 1000);
  }

  /**
   * Nettoie les ressources
   */
  cleanup() {
    this.stopAutoCheck();
    console.log('UpdateManager nettoyé');
  }
}

// Instance singleton
export const updateManager = new UpdateManager();