import { UserManager } from './src/utils/userManager.js';

async function quickTest() {
  console.log('🔧 Test rapide du système d\'utilisateurs');
  console.log('='.repeat(50));

  try {
    // Initialiser le système
    await UserManager.initialize();
    console.log('✅ Système initialisé');

    // Test authentification SuperAdmin
    const superAdmin = await UserManager.authenticateUser('superadmin', 'SuperAdmin2024!');
    if (superAdmin) {
      console.log('✅ SuperAdmin trouvé et authentifié');
      console.log(`   - ID: ${superAdmin.id}`);
      console.log(`   - Username: ${superAdmin.username}`);
      console.log(`   - Role: ${superAdmin.role}`);
    } else {
      console.log('❌ SuperAdmin non trouvé');
    }

    // Test des statistiques
    const stats = UserManager.getStats();
    console.log('📊 Statistiques:');
    console.log(`   - Total: ${stats.totalUsers}`);
    console.log(`   - Actifs: ${stats.activeUsers}`);
    console.log(`   - Sessions: ${stats.activeSessions}`);

    console.log('\n🎉 Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

quickTest();