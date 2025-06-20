import { UserManager } from './src/utils/userManager.js';

console.log('UserManager:', UserManager);
console.log('UserManager.initialize:', UserManager.initialize);
console.log('Méthodes disponibles:', Object.getOwnPropertyNames(UserManager));

try {
  await UserManager.initialize();
  console.log('✅ Initialize fonctionne !');
} catch (error) {
  console.error('❌ Erreur initialize:', error);
}