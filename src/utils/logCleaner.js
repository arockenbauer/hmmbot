import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

export class LogCleaner {
  static testPatterns = [
    'TestUser#1234',
    'Admin#0001',
    'User#5678',
    'Mod#1111',
    'BadUser#9999'
  ];

  static cleanAllLogFiles() {
    try {
      const logsDir = path.join(process.cwd(), 'data', 'logs');
      
      if (!fs.existsSync(logsDir)) {
        console.log(chalk.yellow('📁 Dossier de logs introuvable'));
        return { cleaned: 0, total: 0 };
      }

      const logFiles = fs.readdirSync(logsDir).filter(file => file.endsWith('.log'));
      let totalCleaned = 0;
      let filesProcessed = 0;

      logFiles.forEach(filename => {
        const filePath = path.join(logsDir, filename);
        const result = this.cleanLogFile(filePath);
        
        if (result.linesCleaned > 0) {
          console.log(chalk.green(`✅ ${filename}: ${result.linesCleaned} logs de test supprimés`));
          totalCleaned += result.linesCleaned;
        }
        
        filesProcessed++;
      });

      return {
        cleaned: totalCleaned,
        total: filesProcessed,
        success: true
      };

    } catch (error) {
      console.log(chalk.red(`❌ Erreur lors du nettoyage: ${error.message}`));
      return { cleaned: 0, total: 0, success: false, error: error.message };
    }
  }

  static cleanLogFile(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return { linesCleaned: 0, totalLines: 0 };
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const originalCount = lines.length;

      // Filtrer les lignes pour supprimer les logs de test
      const cleanedLines = lines.filter(line => {
        if (!line.trim()) return false;
        return !this.testPatterns.some(pattern => line.includes(pattern));
      });

      // Supprimer les doublons et trier
      const uniqueLines = [...new Set(cleanedLines)];
      const linesCleaned = originalCount - uniqueLines.length;

      if (linesCleaned > 0) {
        // Créer une sauvegarde si c'est un nettoyage important
        if (linesCleaned > 10) {
          const backupPath = `${filePath}.backup-${Date.now()}`;
          fs.copyFileSync(filePath, backupPath);
        }

        // Écrire le contenu nettoyé
        fs.writeFileSync(filePath, uniqueLines.join('\n'));
      }

      return {
        linesCleaned,
        totalLines: originalCount,
        finalLines: uniqueLines.length
      };

    } catch (error) {
      console.log(chalk.red(`❌ Erreur avec ${filePath}: ${error.message}`));
      return { linesCleaned: 0, totalLines: 0, error: error.message };
    }
  }

  static isTestLog(logLine) {
    return this.testPatterns.some(pattern => logLine.includes(pattern));
  }

  static getLogStats() {
    try {
      const logsDir = path.join(process.cwd(), 'data', 'logs');
      
      if (!fs.existsSync(logsDir)) {
        return { totalFiles: 0, totalLines: 0, testLines: 0 };
      }

      const logFiles = fs.readdirSync(logsDir).filter(file => file.endsWith('.log'));
      let totalLines = 0;
      let testLines = 0;

      logFiles.forEach(filename => {
        const filePath = path.join(logsDir, filename);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n').filter(line => line.trim());
        
        totalLines += lines.length;
        testLines += lines.filter(line => this.isTestLog(line)).length;
      });

      return {
        totalFiles: logFiles.length,
        totalLines,
        testLines,
        cleanLines: totalLines - testLines
      };

    } catch (error) {
      return { error: error.message };
    }
  }

  static cleanSpecificFile(filename) {
    const logsDir = path.join(process.cwd(), 'data', 'logs');
    const filePath = path.join(logsDir, filename);
    
    return this.cleanLogFile(filePath);
  }
}