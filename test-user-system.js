import { UserManager } from './src/utils/userManager.js';

async function testUserSystem() {
  console.log('🔧 Test du système d\'utilisateurs');
  console.log('='.repeat(50));

  try {
    // Test 1: Créer un utilisateur admin
    console.log('\n📝 Test 1: Création d\'un utilisateur admin...');
    const adminUser = await UserManager.createUser({
      username: 'admin',
      password: 'admin123',
      email: 'admin@example.com',
      role: 'admin'
    });
    console.log('✅ Utilisateur admin créé:', adminUser.username);

    // Test 2: Créer un utilisateur modérateur
    console.log('\n📝 Test 2: Création d\'un utilisateur modérateur...');
    const modUser = await UserManager.createUser({
      username: 'moderator',
      password: 'mod123',
      email: 'mod@example.com',
      role: 'moderator'
    });
    console.log('✅ Utilisateur modérateur créé:', modUser.username);

    // Test 3: Créer un utilisateur viewer
    console.log('\n📝 Test 3: Création d\'un utilisateur viewer...');
    const viewerUser = await UserManager.createUser({
      username: 'viewer',
      password: 'viewer123',
      email: 'viewer@example.com',
      role: 'viewer'
    });
    console.log('✅ Utilisateur viewer créé:', viewerUser.username);

    // Test 4: Authentification SuperAdmin
    console.log('\n🔐 Test 4: Authentification SuperAdmin...');
    const superAdmin = await UserManager.authenticateUser('superadmin', 'SuperAdmin2024!');
    console.log('✅ SuperAdmin authentifié:', superAdmin.username);

    // Test 5: Authentification utilisateur normal
    console.log('\n🔐 Test 5: Authentification utilisateur admin...');
    const authAdmin = await UserManager.authenticateUser('admin', 'admin123');
    console.log('✅ Admin authentifié:', authAdmin.username);

    // Test 6: Créer une session
    console.log('\n📱 Test 6: Création de session...');
    const sessionId = UserManager.createSession(authAdmin);
    console.log('✅ Session créée:', sessionId);

    // Test 7: Valider la session
    console.log('\n✔️ Test 7: Validation de session...');
    const session = UserManager.validateSession(sessionId);
    console.log('✅ Session validée pour:', session.username);

    // Test 8: Vérifier les permissions
    console.log('\n🔒 Test 8: Vérification des permissions...');
    console.log('Admin peut voir tickets:', UserManager.hasPermission(authAdmin, 'tickets', 'view'));
    console.log('Viewer peut gérer users:', UserManager.hasPermission(viewerUser, 'users', 'manage_permissions'));

    // Test 9: Obtenir les statistiques
    console.log('\n📊 Test 9: Statistiques utilisateurs...');
    const stats = UserManager.getStats();
    console.log('Total utilisateurs:', stats.totalUsers);
    console.log('Utilisateurs actifs:', stats.activeUsers);
    console.log('Sessions actives:', stats.activeSessions);

    // Test 10: Lister tous les utilisateurs
    console.log('\n👥 Test 10: Liste des utilisateurs...');
    const allUsers = UserManager.getAllUsers();
    allUsers.forEach(user => {
      console.log(`- ${user.username} (${user.role}) - ${user.isActive ? 'Actif' : 'Inactif'}`);
    });

    console.log('\n🎉 Tous les tests réussis !');
    console.log('\n💡 Informations de connexion:');
    console.log('SuperAdmin: superadmin / SuperAdmin2024!');
    console.log('Admin: admin / admin123');
    console.log('Modérateur: moderator / mod123');
    console.log('Viewer: viewer / viewer123');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Lancer les tests
testUserSystem();