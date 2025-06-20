import fs from 'fs';
import path from 'path';

// Script pour nettoyer les logs de test
const logsPath = '/home/axel/Documents/orazioubot/data/logs/2025-06-20.log';
const cleanedLogsPath = '/home/axel/Documents/orazioubot/data/logs/2025-06-20-cleaned.log';

// Lire le fichier de logs
const logsContent = fs.readFileSync(logsPath, 'utf8');
const lines = logsContent.split('\n').filter(line => line.trim() !== '');

// Filtrer les lignes pour enlever les logs de test
const cleanedLines = lines.filter(line => {
  const testPatterns = [
    'TestUser#1234',
    'Admin#0001',
    'User#5678', 
    'Mod#1111',
    'BadUser#9999'
  ];
  
  return !testPatterns.some(pattern => line.includes(pattern));
});

// Trier les lignes par timestamp (approximatif)
cleanedLines.sort((a, b) => {
  const timeA = a.match(/\[(.*?)\]/)?.[1] || '';
  const timeB = b.match(/\[(.*?)\]/)?.[1] || '';
  return timeA.localeCompare(timeB);
});

// Écrire le fichier nettoyé
fs.writeFileSync(cleanedLogsPath, cleanedLines.join('\n') + '\n');

// Remplacer l'original
fs.copyFileSync(cleanedLogsPath, logsPath);
fs.unlinkSync(cleanedLogsPath);

console.log('Logs de test supprimés avec succès!');
console.log(`Lignes originales: ${lines.length}`);
console.log(`Lignes nettoyées: ${cleanedLines.length}`);