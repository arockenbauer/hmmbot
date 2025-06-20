import fs from 'fs';
import path from 'path';

const LOG_FILE = '/home/axel/Documents/orazioubot/data/logs/2025-06-20.log';
const CLEAN_CONTENT = `[20/06/2025 13:17:46,549] [SYSTEM] Bot démarré avec succès - Hmmbot#0779 - Serveurs: 2 - Utilisateurs: 2 - Salons: 102
[20/06/2025 13:18:36,663] [VOICE_JOIN] <@1352169513818525779> a rejoint Farming RP
[20/06/2025 13:18:41,111] [VOICE_JOIN] <@1161709894685179985> a rejoint Farming RP
[20/06/2025 13:19:19.386] [SYSTEM] Bot démarré avec succès
[20/06/2025 13:19:31,384] [MESSAGE_DELETE] Auteur: Utilisateur inconnu - Canal: ║🚪・départs - Contenu: Non disponible
[20/06/2025 13:23:10,953] [SYSTEM] Bot arrêté (SIGINT)
[20/06/2025 13:27:27,388] [SYSTEM] Bot démarré avec succès - Hmmbot#0779 - Serveurs: 2 - Utilisateurs: 4 - Salons: 102
[20/06/2025 13:27:30,538] [SYSTEM] Bot arrêté (SIGINT)
[20/06/2025 13:28:02,863] [SYSTEM] Bot démarré avec succès - Hmmbot#0779 - Serveurs: 2 - Utilisateurs: 4 - Salons: 102
[20/06/2025 13:28:12,770] [SYSTEM] Bot arrêté (SIGINT)`;

try {
  // Créer une sauvegarde
  const backupFile = LOG_FILE + '.backup-' + Date.now();
  fs.copyFileSync(LOG_FILE, backupFile);
  console.log(`✅ Sauvegarde créée: ${backupFile}`);
  
  // Remplacer le contenu
  fs.writeFileSync(LOG_FILE, CLEAN_CONTENT);
  console.log(`✅ Fichier de logs nettoyé: ${LOG_FILE}`);
  
  // Nettoyer les fichiers temporaires
  const logsDir = '/home/axel/Documents/orazioubot/data/logs';
  const tempFiles = ['2025-06-20-clean.log', '2025-06-20-cleaned.log', '2025-06-20-final.log'];
  
  tempFiles.forEach(file => {
    const filePath = path.join(logsDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️  Fichier temporaire supprimé: ${file}`);
    }
  });
  
  console.log('🎉 Nettoyage terminé avec succès !');
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
}