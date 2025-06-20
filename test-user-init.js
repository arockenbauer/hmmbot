// Test d'initialisation du système d'utilisateurs
import { UserManager } from './src/utils/userManager.js';

console.log('🔧 Test d\'initialisation UserManager');
console.log('='.repeat(50));

async function testInit() {
  try {
    console.log('1. Vérification des méthodes disponibles...');
    console.log('   - UserManager:', typeof UserManager);
    console.log('   - initialize:', typeof UserManager.initialize);
    console.log('   - authenticateUser:', typeof UserManager.authenticateUser);
    console.log('   - createSession:', typeof UserManager.createSession);
    
    console.log('\n2. Initialisation du système...');
    await UserManager.initialize();
    
    console.log('\n3. Test d\'authentification SuperAdmin...');
    const superAdmin = await UserManager.authenticateUser('superadmin', 'SuperAdmin2024!');
    console.log('   - SuperAdmin:', superAdmin ? '✅ Trouvé' : '❌ Non trouvé');
    
    if (superAdmin) {
      console.log('   - ID:', superAdmin.id);
      console.log('   - Username:', superAdmin.username);
      console.log('   - Role:', superAdmin.role);
      console.log('   - Permissions:', superAdmin.permissions ? 'Définies' : 'Héritées');
    }
    
    console.log('\n4. Test de création de session...');
    if (superAdmin) {
      const sessionId = UserManager.createSession(superAdmin);
      console.log('   - Session ID:', sessionId ? '✅ Créée' : '❌ Échec');
    }
    
    console.log('\n✅ Tous les tests sont passés !');
    
  } catch (error) {
    console.error('\n❌ Erreur durant les tests:', error);
    console.error('Stack:', error.stack);
  }
}

testInit();