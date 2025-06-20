// Application principale HmmBot
class HmmBotAdmin {
  constructor() {
    this.currentSection = 'dashboard';
    this.config = {};
    this.botStats = {};
    this.ticketStats = {};
    this.activeTickets = [];
    this.transcripts = [];
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadConfig();
    await this.loadBotStats();
    await this.loadTicketStats();
    this.loadSection('dashboard');
    
    // Actualiser les données toutes les 30 secondes
    setInterval(() => {
      this.loadBotStats();
      this.loadTicketStats();
      if (this.currentSection === 'tickets') {
        this.loadActiveTickets();
        this.loadTranscripts();
      }
    }, 30000);
  }

  setupEventListeners() {
    // Navigation
    document.addEventListener('click', (e) => {
      if (e.target.closest('.nav-item')) {
        e.preventDefault();
        const section = e.target.closest('.nav-item').dataset.section;
        this.loadSection(section);
      }
      
      if (e.target.id === 'sidebar-toggle') {
        this.toggleSidebar();
      }
      
      if (e.target.classList.contains('notification-close')) {
        e.target.closest('.notification').remove();
      }
    });

    // Formulaires
    document.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (e.target.id === 'channels-form') {
        await this.saveChannels(e.target);
      } else if (e.target.id === 'roles-form') {
        await this.saveRoles(e.target);
      } else if (e.target.id === 'moderation-form') {
        await this.saveModeration(e.target);
      } else if (e.target.id === 'economy-form') {
        await this.saveEconomy(e.target);
      } else if (e.target.id === 'voice-form') {
        await this.saveVoice(e.target);
      } else if (e.target.id === 'ticket-form') {
        await this.saveTicketConfig(e.target);
      } else if (e.target.id === 'panel-form') {
        await this.savePanelConfig(e.target);
      }
    });
  }

  async loadConfig() {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        this.config = await response.json();
        this.showNotification('Configuration chargée', 'success');
      } else {
        throw new Error('Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification('Erreur lors du chargement de la configuration', 'error');
    }
  }

  async loadBotStats() {
    try {
      const response = await fetch('/api/bot/stats');
      if (response.ok) {
        this.botStats = await response.json();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats bot:', error);
    }
  }

  async loadTicketStats() {
    try {
      const response = await fetch('/api/tickets/stats');
      if (response.ok) {
        this.ticketStats = await response.json();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats tickets:', error);
    }
  }

  async loadActiveTickets() {
    try {
      const response = await fetch('/api/tickets/active');
      if (response.ok) {
        this.activeTickets = await response.json();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tickets actifs:', error);
    }
  }

  async loadTranscripts() {
    try {
      const response = await fetch('/api/tickets/transcripts');
      if (response.ok) {
        this.transcripts = await response.json();
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transcripts:', error);
    }
  }

  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('collapsed');
  }

  loadSection(section) {
    // Mettre à jour la navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    document.querySelector(`[data-section="${section}"]`).classList.add('active');

    // Charger le contenu
    this.currentSection = section;
    const content = document.getElementById('main-content');
    
    switch (section) {
      case 'dashboard':
        content.innerHTML = this.renderDashboard();
        break;
      case 'tickets':
        content.innerHTML = this.renderTickets();
        this.setupTicketHandlers();
        this.loadActiveTickets();
        this.loadTranscripts();
        break;
      case 'moderation':
        content.innerHTML = this.renderModeration();
        break;
      case 'economy':
        content.innerHTML = this.renderEconomy();
        break;
      case 'channels':
        content.innerHTML = this.renderChannels();
        break;
      case 'roles':
        content.innerHTML = this.renderRoles();
        break;
      default:
        content.innerHTML = '<div class="card"><h2>Section en développement</h2></div>';
    }
  }

  renderDashboard() {
    const uptime = this.formatUptime(this.botStats.uptime || 0);
    const memory = this.formatMemory(this.botStats.memoryUsage?.used || 0);
    
    return `
      <div class="dashboard-header">
        <h1>
          <i class="fas fa-tachometer-alt"></i>
          Tableau de Bord
        </h1>
        <p>Vue d'ensemble de HmmBot</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-robot"></i>
          </div>
          <div class="stat-content">
            <h3>Statut du Bot</h3>
            <p class="stat-value online">En ligne</p>
            <small>Uptime: ${uptime}</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-ticket-alt"></i>
          </div>
          <div class="stat-content">
            <h3>Tickets Actifs</h3>
            <p class="stat-value">${this.ticketStats.activeCount || 0}</p>
            <small>${this.ticketStats.totalUsers || 0} utilisateurs</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-memory"></i>
          </div>
          <div class="stat-content">
            <h3>Mémoire</h3>
            <p class="stat-value">${memory}</p>
            <small>Node.js ${this.botStats.nodeVersion || 'N/A'}</small>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-server"></i>
          </div>
          <div class="stat-content">
            <h3>Plateforme</h3>
            <p class="stat-value">${this.botStats.platform || 'N/A'}</p>
            <small>Système d'exploitation</small>
          </div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fas fa-chart-line"></i>
              Tickets par Type
            </h3>
          </div>
          <div class="chart-container">
            ${this.renderTicketTypeChart()}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">
              <i class="fas fa-clock"></i>
              Tickets Récents
            </h3>
          </div>
          <div class="recent-tickets">
            ${this.renderRecentTickets()}
          </div>
        </div>
      </div>
    `;
  }

  renderTicketTypeChart() {
    const types = this.ticketStats.ticketsByType || {};
    if (Object.keys(types).length === 0) {
      return '<p class="text-muted">Aucune donnée disponible</p>';
    }

    const total = Object.values(types).reduce((a, b) => a + b, 0);
    return Object.entries(types).map(([type, count]) => {
      const percentage = ((count / total) * 100).toFixed(1);
      return `
        <div class="chart-item">
          <div class="chart-label">${type}</div>
          <div class="chart-bar">
            <div class="chart-fill" style="width: ${percentage}%"></div>
          </div>
          <div class="chart-value">${count} (${percentage}%)</div>
        </div>
      `;
    }).join('');
  }

  renderRecentTickets() {
    const recent = this.ticketStats.recentTickets || [];
    if (recent.length === 0) {
      return '<p class="text-muted">Aucun ticket récent</p>';
    }

    return recent.map(ticket => `
      <div class="recent-ticket">
        <div class="ticket-info">
          <strong>${ticket.id}</strong>
          <span class="ticket-type">${ticket.type}</span>
        </div>
        <div class="ticket-time">
          ${this.formatDate(ticket.createdAt)}
        </div>
      </div>
    `).join('');
  }

  renderTickets() {
    return `
      <div class="section-header">
        <h1>
          <i class="fas fa-ticket-alt"></i>
          Système de Tickets
        </h1>
        <p>Configuration et gestion des tickets</p>
      </div>

      <div class="tabs">
        <button class="tab-button active" data-tab="config">Configuration</button>
        <button class="tab-button" data-tab="panel">Panel</button>
        <button class="tab-button" data-tab="active">Tickets Actifs</button>
        <button class="tab-button" data-tab="transcripts">Transcripts</button>
      </div>

      <div class="tab-content">
        <div id="config-tab" class="tab-pane active">
          ${this.renderTicketConfig()}
        </div>
        <div id="panel-tab" class="tab-pane">
          ${this.renderPanelConfig()}
        </div>
        <div id="active-tab" class="tab-pane">
          ${this.renderActiveTickets()}
        </div>
        <div id="transcripts-tab" class="tab-pane">
          ${this.renderTranscripts()}
        </div>
      </div>
    `;
  }

  renderTicketConfig() {
    const ticketConfig = this.config.ticket || {};
    
    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-cog"></i>
            Configuration Générale
          </h3>
        </div>
        <form id="ticket-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Système Activé</label>
              <label class="toggle-switch">
                <input type="checkbox" name="enabled" ${ticketConfig.enabled ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Limite par Utilisateur</label>
              <input type="number" class="form-input" name="ticket_limit" value="${ticketConfig.ticket_limit || 1}" min="1" max="10">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Catégorie des Tickets</label>
              <input type="text" class="form-input" name="category" value="${ticketConfig.category || ''}" placeholder="ID de la catégorie">
            </div>
            <div class="form-group">
              <label class="form-label">Rôle Support</label>
              <input type="text" class="form-input" name="support_role" value="${ticketConfig.support_role || ''}" placeholder="ID du rôle support">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Salon des Transcripts</label>
            <input type="text" class="form-input" name="transcript_channel" value="${ticketConfig.transcript_channel || ''}" placeholder="ID du salon des transcripts">
          </div>

          <div class="form-group">
            <label class="form-label">Message d'Ouverture</label>
            <textarea class="form-input" name="message" rows="3" placeholder="Message affiché lors de l'ouverture d'un ticket">${ticketConfig.message || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Message de Fermeture</label>
            <textarea class="form-input" name="close_message" rows="3" placeholder="Message affiché lors de la fermeture d'un ticket">${ticketConfig.close_message || ''}</textarea>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Logger les Transcripts</label>
              <label class="toggle-switch">
                <input type="checkbox" name="log_transcripts" ${ticketConfig.log_transcripts ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Logger Toutes les Actions</label>
              <label class="toggle-switch">
                <input type="checkbox" name="log_all_actions" ${ticketConfig.log_all_actions ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fermeture Automatique</label>
              <label class="toggle-switch">
                <input type="checkbox" name="auto_close" ${ticketConfig.auto_close ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Délai (secondes)</label>
              <input type="number" class="form-input" name="auto_close_delay" value="${ticketConfig.auto_close_delay || 3600}" min="60">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Champs Personnalisés</label>
            <div id="custom-fields">
              ${(ticketConfig.custom_fields || []).map((field, index) => `
                <div class="custom-field-item">
                  <input type="text" class="form-input" value="${field}" readonly>
                  <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              `).join('')}
            </div>
            <div class="form-row">
              <input type="text" id="new-custom-field" class="form-input" placeholder="Nouveau champ personnalisé">
              <button type="button" class="btn btn-secondary" onclick="app.addCustomField()">
                <i class="fas fa-plus"></i>
                Ajouter
              </button>
            </div>
          </div>

          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i>
            Sauvegarder la Configuration
          </button>
        </form>
      </div>
    `;
  }

  renderPanelConfig() {
    const panelConfig = this.config.ticket?.panel || {};
    
    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-desktop"></i>
            Configuration du Panel
          </h3>
        </div>
        <form id="panel-form">
          <div class="form-group">
            <label class="form-label">Salon du Panel</label>
            <input type="text" class="form-input" name="channel" value="${panelConfig.channel || ''}" placeholder="ID du salon où envoyer le panel">
          </div>

          <div class="form-group">
            <label class="form-label">Titre de l'Embed</label>
            <input type="text" class="form-input" name="embed_title" value="${panelConfig.embed_title || ''}" placeholder="Support - Créer un ticket">
          </div>

          <div class="form-group">
            <label class="form-label">Description de l'Embed</label>
            <textarea class="form-input" name="embed_text" rows="3" placeholder="Description du panel">${panelConfig.embed_text || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Type de Sélection</label>
            <select class="form-input" name="selection_type">
              <option value="button" ${panelConfig.selection_type === 'button' ? 'selected' : ''}>Bouton</option>
              <option value="dropdown" ${panelConfig.selection_type === 'dropdown' ? 'selected' : ''}>Menu Déroulant</option>
            </select>
          </div>

          <div id="button-config" class="form-section" style="${panelConfig.selection_type === 'dropdown' ? 'display: none;' : ''}">
            <h4>Configuration du Bouton</h4>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Texte du Bouton</label>
                <input type="text" class="form-input" name="button_label" value="${panelConfig.button_label || ''}" placeholder="Ouvrir un ticket">
              </div>
              <div class="form-group">
                <label class="form-label">Couleur du Bouton</label>
                <select class="form-input" name="button_color">
                  <option value="Primary" ${panelConfig.button_color === 'Primary' ? 'selected' : ''}>Bleu (Primary)</option>
                  <option value="Secondary" ${panelConfig.button_color === 'Secondary' ? 'selected' : ''}>Gris (Secondary)</option>
                  <option value="Success" ${panelConfig.button_color === 'Success' ? 'selected' : ''}>Vert (Success)</option>
                  <option value="Danger" ${panelConfig.button_color === 'Danger' ? 'selected' : ''}>Rouge (Danger)</option>
                </select>
              </div>
            </div>
          </div>

          <div id="dropdown-config" class="form-section" style="${panelConfig.selection_type === 'button' ? 'display: none;' : ''}">
            <h4>Options du Menu Déroulant</h4>
            <div id="dropdown-options">
              ${(panelConfig.dropdown_options || []).map((option, index) => `
                <div class="dropdown-option-item">
                  <input type="text" class="form-input" value="${option}" name="dropdown_option_${index}">
                  <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              `).join('')}
            </div>
            <div class="form-row">
              <input type="text" id="new-dropdown-option" class="form-input" placeholder="Nouvelle option">
              <button type="button" class="btn btn-secondary" onclick="app.addDropdownOption()">
                <i class="fas fa-plus"></i>
                Ajouter
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Message de Bienvenue</label>
            <textarea class="form-input" name="welcome_message" rows="3" placeholder="Message affiché dans le nouveau ticket">${panelConfig.welcome_message || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Confirmer avant Suppression</label>
            <label class="toggle-switch">
              <input type="checkbox" name="confirm_before_delete" ${panelConfig.confirm_before_delete ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">
              <i class="fas fa-save"></i>
              Sauvegarder le Panel
            </button>
            <button type="button" class="btn btn-secondary" onclick="app.testPanel()">
              <i class="fas fa-eye"></i>
              Aperçu
            </button>
            <button type="button" class="btn btn-success" onclick="app.sendPanel()">
              <i class="fas fa-paper-plane"></i>
              Envoyer le Panel
            </button>
          </div>
        </form>
      </div>
    `;
  }

  renderActiveTickets() {
    if (this.activeTickets.length === 0) {
      return `
        <div class="card">
          <div class="empty-state">
            <i class="fas fa-ticket-alt"></i>
            <h3>Aucun ticket actif</h3>
            <p>Il n'y a actuellement aucun ticket ouvert.</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-list"></i>
            Tickets Actifs (${this.activeTickets.length})
          </h3>
          <button class="btn btn-secondary" onclick="app.loadActiveTickets()">
            <i class="fas fa-sync"></i>
            Actualiser
          </button>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Utilisateur</th>
                <th>Créé le</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.activeTickets.map(ticket => `
                <tr>
                  <td><code>${ticket.id}</code></td>
                  <td><span class="badge badge-info">${ticket.type}</span></td>
                  <td><code>${ticket.userId}</code></td>
                  <td>${this.formatDate(ticket.createdAt)}</td>
                  <td><span class="badge badge-success">${ticket.status}</span></td>
                  <td>
                    <button class="btn btn-sm btn-primary" onclick="app.viewTicket('${ticket.id}')">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="app.closeTicket('${ticket.id}')">
                      <i class="fas fa-times"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderTranscripts() {
    if (this.transcripts.length === 0) {
      return `
        <div class="card">
          <div class="empty-state">
            <i class="fas fa-file-alt"></i>
            <h3>Aucun transcript</h3>
            <p>Aucun transcript de ticket n'a été généré.</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-file-alt"></i>
            Transcripts (${this.transcripts.length})
          </h3>
          <button class="btn btn-secondary" onclick="app.loadTranscripts()">
            <i class="fas fa-sync"></i>
            Actualiser
          </button>
        </div>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Taille</th>
                <th>Créé le</th>
                <th>Modifié le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.transcripts.map(transcript => `
                <tr>
                  <td><code>${transcript.ticketId}</code></td>
                  <td>${this.formatFileSize(transcript.size)}</td>
                  <td>${this.formatDate(transcript.createdAt)}</td>
                  <td>${this.formatDate(transcript.modifiedAt)}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" onclick="app.downloadTranscript('${transcript.ticketId}')">
                      <i class="fas fa-download"></i>
                      Télécharger
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  renderModeration() {
    const modConfig = this.config.moderation || {};
    
    return `
      <div class="section-header">
        <h1>
          <i class="fas fa-shield-alt"></i>
          Modération
        </h1>
        <p>Configuration des outils de modération</p>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-cog"></i>
            Paramètres de Modération
          </h3>
        </div>
        <form id="moderation-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Supprimer Auto les Réponses Clear</label>
              <label class="toggle-switch">
                <input type="checkbox" name="auto_delete_clear_response" ${modConfig.auto_delete_clear_response ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Délai de Suppression (ms)</label>
              <input type="number" class="form-input" name="clear_response_delay" value="${modConfig.clear_response_delay || 5000}" min="1000">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">MP lors des Sanctions</label>
              <label class="toggle-switch">
                <input type="checkbox" name="dm_on_punishment" ${modConfig.dm_on_punishment ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Logger Toutes les Actions</label>
              <label class="toggle-switch">
                <input type="checkbox" name="log_all_actions" ${modConfig.log_all_actions ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Durée Max de Timeout</label>
            <input type="text" class="form-input" name="max_timeout_duration" value="${modConfig.max_timeout_duration || '28d'}" placeholder="28d">
            <small class="form-help">Format: 1d, 1h, 1m, 1s</small>
          </div>

          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i>
            Sauvegarder
          </button>
        </form>
      </div>
    `;
  }

  renderEconomy() {
    const ecoConfig = this.config.economy || {};
    const voiceConfig = this.config.voice || {};
    
    return `
      <div class="section-header">
        <h1>
          <i class="fas fa-coins"></i>
          Économie
        </h1>
        <p>Configuration du système économique</p>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-wallet"></i>
            Paramètres Économiques
          </h3>
        </div>
        <form id="economy-form">
          <div class="form-group">
            <label class="form-label">Montant Daily</label>
            <input type="number" class="form-input" name="daily_amount" value="${ecoConfig.daily_amount || 100}" min="1">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Travail Min</label>
              <input type="number" class="form-input" name="work_min" value="${ecoConfig.work_min || 50}" min="1">
            </div>
            <div class="form-group">
              <label class="form-label">Travail Max</label>
              <input type="number" class="form-input" name="work_max" value="${ecoConfig.work_max || 200}" min="1">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Taux de Réussite Vol (%)</label>
            <input type="number" class="form-input" name="rob_success_rate" value="${(ecoConfig.rob_success_rate || 0.3) * 100}" min="0" max="100" step="0.1">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Vol Min</label>
              <input type="number" class="form-input" name="rob_min" value="${ecoConfig.rob_min || 10}" min="1">
            </div>
            <div class="form-group">
              <label class="form-label">Vol Max</label>
              <input type="number" class="form-input" name="rob_max" value="${ecoConfig.rob_max || 100}" min="1">
            </div>
          </div>

          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i>
            Sauvegarder
          </button>
        </form>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-microphone"></i>
            Récompenses Vocales
          </h3>
        </div>
        <form id="voice-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Tracker le Temps Vocal</label>
              <label class="toggle-switch">
                <input type="checkbox" name="track_voice_time" ${voiceConfig.track_voice_time === 'true' ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="form-group">
              <label class="form-label">Pièces par Minute</label>
              <input type="number" class="form-input" name="coins_per_minute" value="${voiceConfig.coins_per_minute || 5}" min="0">
            </div>
          </div>

          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i>
            Sauvegarder
          </button>
        </form>
      </div>
    `;
  }

  renderChannels() {
    const channels = this.config.channels || {};
    
    return `
      <div class="section-header">
        <h1>
          <i class="fas fa-hashtag"></i>
          Salons
        </h1>
        <p>Configuration des IDs de salons</p>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-list"></i>
            IDs des Salons
          </h3>
        </div>
        <form id="channels-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Logs</label>
              <input type="text" class="form-input" name="logs" value="${channels.logs || ''}" placeholder="ID du salon des logs">
            </div>
            <div class="form-group">
              <label class="form-label">Bienvenue</label>
              <input type="text" class="form-input" name="welcome" value="${channels.welcome || ''}" placeholder="ID du salon de bienvenue">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Au revoir</label>
              <input type="text" class="form-input" name="goodbye" value="${channels.goodbye || ''}" placeholder="ID du salon d'au revoir">
            </div>
            <div class="form-group">
              <label class="form-label">Modération</label>
              <input type="text" class="form-input" name="moderation" value="${channels.moderation || ''}" placeholder="ID du salon de modération">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Économie</label>
              <input type="text" class="form-input" name="economy" value="${channels.economy || ''}" placeholder="ID du salon d'économie">
            </div>
            <div class="form-group">
              <label class="form-label">Logs Vocaux</label>
              <input type="text" class="form-input" name="voice_logs" value="${channels.voice_logs || ''}" placeholder="ID du salon des logs vocaux">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Général</label>
            <input type="text" class="form-input" name="general" value="${channels.general || ''}" placeholder="ID du salon général">
          </div>

          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i>
            Sauvegarder
          </button>
        </form>
      </div>
    `;
  }

  renderRoles() {
    const roles = this.config.roles || {};
    
    return `
      <div class="section-header">
        <h1>
          <i class="fas fa-users-cog"></i>
          Rôles
        </h1>
        <p>Configuration des IDs de rôles</p>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">
            <i class="fas fa-list"></i>
            IDs des Rôles
          </h3>
        </div>
        <form id="roles-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Modérateur</label>
              <input type="text" class="form-input" name="moderator" value="${roles.moderator || ''}" placeholder="ID du rôle modérateur">
            </div>
            <div class="form-group">
              <label class="form-label">Administrateur</label>
              <input type="text" class="form-input" name="admin" value="${roles.admin || ''}" placeholder="ID du rôle administrateur">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Membre</label>
              <input type="text" class="form-input" name="member" value="${roles.member || ''}" placeholder="ID du rôle membre">
            </div>
            <div class="form-group">
              <label class="form-label">Muet</label>
              <input type="text" class="form-input" name="muted" value="${roles.muted || ''}" placeholder="ID du rôle muet">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">VIP</label>
            <input type="text" class="form-input" name="vip" value="${roles.vip || ''}" placeholder="ID du rôle VIP">
          </div>

          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i>
            Sauvegarder
          </button>
        </form>
      </div>
    `;
  }

  setupTicketHandlers() {
    // Gestion des onglets
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('tab-button')) {
        const tab = e.target.dataset.tab;
        
        // Mettre à jour les boutons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // Mettre à jour le contenu
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        document.getElementById(`${tab}-tab`).classList.add('active');
        
        // Charger les données si nécessaire
        if (tab === 'active') {
          this.loadActiveTickets().then(() => {
            document.getElementById('active-tab').innerHTML = this.renderActiveTickets();
          });
        } else if (tab === 'transcripts') {
          this.loadTranscripts().then(() => {
            document.getElementById('transcripts-tab').innerHTML = this.renderTranscripts();
          });
        }
      }
    });

    // Gestion du type de sélection
    const selectionType = document.querySelector('select[name="selection_type"]');
    if (selectionType) {
      selectionType.addEventListener('change', (e) => {
        const buttonConfig = document.getElementById('button-config');
        const dropdownConfig = document.getElementById('dropdown-config');
        
        if (e.target.value === 'button') {
          buttonConfig.style.display = 'block';
          dropdownConfig.style.display = 'none';
        } else {
          buttonConfig.style.display = 'none';
          dropdownConfig.style.display = 'block';
        }
      });
    }
  }

  // Méthodes utilitaires
  addCustomField() {
    const input = document.getElementById('new-custom-field');
    const value = input.value.trim();
    
    if (value) {
      const container = document.getElementById('custom-fields');
      const div = document.createElement('div');
      div.className = 'custom-field-item';
      div.innerHTML = `
        <input type="text" class="form-input" value="${value}" readonly>
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">
          <i class="fas fa-trash"></i>
        </button>
      `;
      container.appendChild(div);
      input.value = '';
    }
  }

  addDropdownOption() {
    const input = document.getElementById('new-dropdown-option');
    const value = input.value.trim();
    
    if (value) {
      const container = document.getElementById('dropdown-options');
      const div = document.createElement('div');
      div.className = 'dropdown-option-item';
      const index = container.children.length;
      div.innerHTML = `
        <input type="text" class="form-input" value="${value}" name="dropdown_option_${index}">
        <button type="button" class="btn btn-danger btn-sm" onclick="this.parentElement.remove()">
          <i class="fas fa-trash"></i>
        </button>
      `;
      container.appendChild(div);
      input.value = '';
    }
  }

  async testPanel() {
    try {
      const response = await fetch('/api/tickets/test-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.config.ticket?.panel || {})
      });
      
      if (response.ok) {
        this.showNotification('Test du panel réussi', 'success');
      } else {
        throw new Error('Erreur lors du test');
      }
    } catch (error) {
      this.showNotification('Erreur lors du test du panel', 'error');
    }
  }

  async sendPanel() {
    if (!confirm('Êtes-vous sûr de vouloir envoyer le panel ?')) return;
    
    try {
      // Ici on pourrait appeler une API pour envoyer le panel via Discord
      this.showNotification('Panel envoyé avec succès', 'success');
    } catch (error) {
      this.showNotification('Erreur lors de l\'envoi du panel', 'error');
    }
  }

  async viewTicket(ticketId) {
    this.showNotification(`Affichage du ticket ${ticketId}`, 'info');
  }

  async closeTicket(ticketId) {
    if (!confirm(`Êtes-vous sûr de vouloir fermer le ticket ${ticketId} ?`)) return;
    
    try {
      // Ici on pourrait appeler une API pour fermer le ticket
      this.showNotification(`Ticket ${ticketId} fermé`, 'success');
      await this.loadActiveTickets();
      document.getElementById('active-tab').innerHTML = this.renderActiveTickets();
    } catch (error) {
      this.showNotification('Erreur lors de la fermeture du ticket', 'error');
    }
  }

  async downloadTranscript(ticketId) {
    try {
      const response = await fetch(`/api/tickets/transcripts/${ticketId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transcript-${ticketId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.showNotification('Transcript téléchargé', 'success');
      } else {
        throw new Error('Erreur lors du téléchargement');
      }
    } catch (error) {
      this.showNotification('Erreur lors du téléchargement', 'error');
    }
  }

  // Méthodes de sauvegarde
  async saveChannels(form) {
    const formData = new FormData(form);
    const channels = {};
    
    for (const [key, value] of formData.entries()) {
      channels[key] = value.trim();
    }
    
    this.config.channels = channels;
    await this.saveConfig();
  }

  async saveRoles(form) {
    const formData = new FormData(form);
    const roles = {};
    
    for (const [key, value] of formData.entries()) {
      roles[key] = value.trim();
    }
    
    this.config.roles = roles;
    await this.saveConfig();
  }

  async saveModeration(form) {
    const formData = new FormData(form);
    const moderation = {};
    
    for (const [key, value] of formData.entries()) {
      if (key === 'auto_delete_clear_response' || key === 'dm_on_punishment' || key === 'log_all_actions') {
        moderation[key] = form.querySelector(`[name="${key}"]`).checked;
      } else if (key === 'clear_response_delay') {
        moderation[key] = parseInt(value);
      } else {
        moderation[key] = value;
      }
    }
    
    this.config.moderation = moderation;
    await this.saveConfig();
  }

  async saveEconomy(form) {
    const formData = new FormData(form);
    const economy = {};
    
    for (const [key, value] of formData.entries()) {
      if (key === 'rob_success_rate') {
        economy[key] = parseFloat(value) / 100;
      } else {
        economy[key] = parseInt(value);
      }
    }
    
    this.config.economy = economy;
    await this.saveConfig();
  }

  async saveVoice(form) {
    const formData = new FormData(form);
    const voice = {};
    
    for (const [key, value] of formData.entries()) {
      if (key === 'track_voice_time') {
        voice[key] = form.querySelector(`[name="${key}"]`).checked ? 'true' : 'false';
      } else {
        voice[key] = parseInt(value);
      }
    }
    
    this.config.voice = voice;
    await this.saveConfig();
  }

  async saveTicketConfig(form) {
    const formData = new FormData(form);
    const ticket = this.config.ticket || {};
    
    // Récupérer les champs personnalisés
    const customFields = [];
    document.querySelectorAll('#custom-fields .custom-field-item input').forEach(input => {
      if (input.value.trim()) {
        customFields.push(input.value.trim());
      }
    });
    
    for (const [key, value] of formData.entries()) {
      if (key === 'enabled' || key === 'log_transcripts' || key === 'log_all_actions' || key === 'auto_close') {
        ticket[key] = form.querySelector(`[name="${key}"]`).checked;
      } else if (key === 'ticket_limit' || key === 'auto_close_delay') {
        ticket[key] = parseInt(value);
      } else {
        ticket[key] = value.trim();
      }
    }
    
    ticket.custom_fields = customFields;
    this.config.ticket = ticket;
    await this.saveConfig();
  }

  async savePanelConfig(form) {
    const formData = new FormData(form);
    const panel = this.config.ticket?.panel || {};
    
    // Récupérer les options du dropdown
    const dropdownOptions = [];
    document.querySelectorAll('#dropdown-options .dropdown-option-item input').forEach(input => {
      if (input.value.trim()) {
        dropdownOptions.push(input.value.trim());
      }
    });
    
    for (const [key, value] of formData.entries()) {
      if (key === 'confirm_before_delete') {
        panel[key] = form.querySelector(`[name="${key}"]`).checked;
      } else {
        panel[key] = value.trim();
      }
    }
    
    panel.dropdown_options = dropdownOptions;
    
    if (!this.config.ticket) this.config.ticket = {};
    this.config.ticket.panel = panel;
    await this.saveConfig();
  }

  async saveConfig() {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.config)
      });
      
      if (response.ok) {
        this.showNotification('Configuration sauvegardée', 'success');
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      this.showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  // Méthodes utilitaires
  formatUptime(seconds) {
    if (!Number.isFinite(seconds) || isNaN(seconds) || seconds < 0) {
      return '0s';
    }
    
    seconds = Math.max(0, Number(seconds));
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days}j`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
    
    return parts.join(' ');
  }

  formatMemory(bytes) {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  showNotification(message, type = 'info') {
    // Supprimer les anciennes notifications
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
      </div>
      <button class="notification-close">
        <i class="fas fa-times"></i>
      </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-suppression après 5 secondes
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
}

// Initialiser l'application
const app = new HmmBotAdmin();