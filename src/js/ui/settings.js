// ==================== Settings Dialog Module ====================

const SettingsDialog = {
    element: null,
    settings: null,
    serverIdCounter: 0,

    init() {
        this.element = document.getElementById('settings-dialog');
        this.settings = Storage.getSettings();
        this.bindEvents();
    },

    bindEvents() {
        // Close button
        document.getElementById('settings-close-btn').addEventListener('click', () => {
            this.hide();
        });

        // Cancel button
        document.getElementById('settings-cancel-btn').addEventListener('click', () => {
            this.hide();
        });

        // Save button
        document.getElementById('settings-save-btn').addEventListener('click', () => {
            this.save();
        });

        // Tab switching
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchTab(btn.dataset.tab);
            });
        });

        // LM Studio add server button
        document.getElementById('lmstudio-add-server-btn').addEventListener('click', () => {
            this.addLMStudioServer();
        });

        // Theme selector
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                ThemeManager.setTheme(e.target.value);
            });
        });

        // Show/hide API key toggles
        document.querySelectorAll('.toggle-visibility-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.previousElementSibling;
                const eyeOpen = btn.querySelector('.eye-open');
                const eyeClosed = btn.querySelector('.eye-closed');
                if (input.type === 'password') {
                    input.type = 'text';
                    if (eyeOpen) eyeOpen.style.display = 'none';
                    if (eyeClosed) eyeClosed.style.display = 'block';
                } else {
                    input.type = 'password';
                    if (eyeOpen) eyeOpen.style.display = 'block';
                    if (eyeClosed) eyeClosed.style.display = 'none';
                }
            });
        });

        // Close on overlay click
        this.element.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.hide();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.element.classList.contains('visible')) {
                this.hide();
            }
        });
    },

    show() {
        this.settings = Storage.getSettings();
        this.loadValues();
        this.element.classList.add('visible');
    },

    hide() {
        this.element.classList.remove('visible');
    },

    switchTab(tabId) {
        // Update buttons
        document.querySelectorAll('.settings-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update content
        document.querySelectorAll('.settings-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });
    },

    loadValues() {
        // API Keys
        document.getElementById('openai-key').value = this.settings.apiKeys?.openai || '';
        document.getElementById('anthropic-key').value = this.settings.apiKeys?.anthropic || '';
        document.getElementById('anthropic-proxy').value = this.settings.apiKeys?.anthropicProxy || '';
        document.getElementById('gemini-key').value = this.settings.apiKeys?.gemini || '';
        document.getElementById('deepseek-key').value = this.settings.apiKeys?.deepseek || '';

        // LM Studio Servers - load existing or add default
        this.loadLMStudioServers();

        // Theme
        const currentTheme = this.settings.theme || 'system';
        const themeRadio = document.querySelector(`input[name="theme"][value="${currentTheme}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        }

        // Model visibility - Online models
        const visibleModels = this.settings.visibleModels || {};
        document.querySelectorAll('.model-visibility-checkbox').forEach(checkbox => {
            const modelKey = checkbox.dataset.model;
            checkbox.checked = visibleModels[modelKey] !== false;
        });

        // Model visibility - Local models
        this.updateLocalModelsVisibility();
    },

    loadLMStudioServers() {
        const container = document.getElementById('lmstudio-servers-container');
        container.innerHTML = '';
        this.serverIdCounter = 0;

        // Load existing servers or create default
        const servers = this.settings.lmstudioServers || [];

        if (servers.length === 0) {
            // Migrate from old single-server format if exists
            if (this.settings.lmstudio?.url) {
                this.addLMStudioServer(this.settings.lmstudio.url, this.settings.lmstudio.models || []);
            } else {
                // Add default server
                this.addLMStudioServer('http://localhost:1234', []);
            }
        } else {
            servers.forEach(server => {
                this.addLMStudioServer(server.url, server.models || [], server.connected);
            });
        }

        // Update models display
        this.updateAllLMStudioModels();
    },

    addLMStudioServer(url = 'http://localhost:1234', models = [], connected = false) {
        const container = document.getElementById('lmstudio-servers-container');
        const serverId = ++this.serverIdCounter;
        const serverName = `Server ${serverId}`;

        const serverDiv = document.createElement('div');
        serverDiv.className = 'lmstudio-server-entry';
        serverDiv.dataset.serverId = serverId;
        serverDiv.innerHTML = `
            <div class="lmstudio-server-header">
                <span class="lmstudio-server-title">${serverName}</span>
                <button class="lmstudio-server-remove" onclick="SettingsDialog.removeLMStudioServer(${serverId})" title="Remove server">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
            <div class="form-group">
                <input type="text" id="lmstudio-url-${serverId}" placeholder="http://localhost:1234" value="${url}">
            </div>
            <div class="connect-row">
                <button class="lmstudio-connect-btn" onclick="SettingsDialog.connectLMStudioServer(${serverId})">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <span>Connect</span>
                </button>
                <span id="lmstudio-status-${serverId}" class="connection-status ${connected ? 'success' : ''}">${connected ? 'Connected' : ''}</span>
            </div>
        `;

        // Store models data in the element
        serverDiv.dataset.models = JSON.stringify(models);
        serverDiv.dataset.connected = connected;

        container.appendChild(serverDiv);
    },

    removeLMStudioServer(serverId) {
        const serverDiv = document.querySelector(`.lmstudio-server-entry[data-server-id="${serverId}"]`);
        if (serverDiv) {
            serverDiv.remove();
            this.updateAllLMStudioModels();
            this.updateLocalModelsVisibility();
        }
    },

    async connectLMStudioServer(serverId) {
        const serverDiv = document.querySelector(`.lmstudio-server-entry[data-server-id="${serverId}"]`);
        if (!serverDiv) return;

        const urlInput = document.getElementById(`lmstudio-url-${serverId}`);
        const statusEl = document.getElementById(`lmstudio-status-${serverId}`);
        const url = urlInput.value.trim() || 'http://localhost:1234';

        statusEl.textContent = 'Connecting...';
        statusEl.className = 'connection-status pending';

        const isConnected = await LMStudioClient.validate(url);

        if (isConnected) {
            const models = await LMStudioClient.getModels(url);
            if (models.length > 0) {
                serverDiv.dataset.models = JSON.stringify(models);
                serverDiv.dataset.connected = 'true';
                statusEl.textContent = `Connected! Found ${models.length} model(s)`;
                statusEl.className = 'connection-status success';

                // Initialize visibility for new models
                if (!this.settings.visibleLocalModels) {
                    this.settings.visibleLocalModels = {};
                }
                models.forEach(m => {
                    const modelId = `server${serverId}:${m.id || m}`;
                    if (this.settings.visibleLocalModels[modelId] === undefined) {
                        this.settings.visibleLocalModels[modelId] = true;
                    }
                });
            } else {
                serverDiv.dataset.models = '[]';
                serverDiv.dataset.connected = 'true';
                statusEl.textContent = 'Connected, but no models loaded';
                statusEl.className = 'connection-status warning';
            }
        } else {
            serverDiv.dataset.connected = 'false';
            statusEl.textContent = 'Connection failed. Is LM Studio running?';
            statusEl.className = 'connection-status error';
        }

        this.updateAllLMStudioModels();
        this.updateLocalModelsVisibility();
    },

    getAllLMStudioServers() {
        const servers = [];
        document.querySelectorAll('.lmstudio-server-entry').forEach(serverDiv => {
            const serverId = serverDiv.dataset.serverId;
            const urlInput = document.getElementById(`lmstudio-url-${serverId}`);
            const url = urlInput?.value.trim() || 'http://localhost:1234';
            const models = JSON.parse(serverDiv.dataset.models || '[]');
            const connected = serverDiv.dataset.connected === 'true';
            const serverName = `Server ${serverId}`;

            servers.push({
                id: parseInt(serverId),
                name: serverName,
                url: url,
                models: models,
                connected: connected
            });
        });
        return servers;
    },

    updateAllLMStudioModels() {
        const container = document.getElementById('lmstudio-models-list');
        const servers = this.getAllLMStudioServers();
        const allModels = [];

        servers.forEach(server => {
            if (server.models && server.models.length > 0) {
                server.models.forEach(m => {
                    allModels.push({
                        serverName: server.name,
                        serverId: server.id,
                        serverUrl: server.url,
                        id: m.id || m,
                        name: m.name || m.id || m
                    });
                });
            }
        });

        if (allModels.length === 0) {
            container.innerHTML = '<p class="no-models">Connect to servers to see models</p>';
            return;
        }

        container.innerHTML = allModels.map(m => `
            <div class="lmstudio-model-item">
                <span class="model-server-tag">${m.serverName}</span>
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <path d="M8 21h8M12 17v4"/>
                </svg>
                <span class="model-name">${m.name}</span>
            </div>
        `).join('');
    },

    updateLocalModelsVisibility() {
        const container = document.getElementById('local-models-visibility');
        if (!container) return;

        const servers = this.getAllLMStudioServers();
        const visibleLocalModels = this.settings.visibleLocalModels || {};
        const allModels = [];

        servers.forEach(server => {
            if (server.models && server.models.length > 0) {
                server.models.forEach(m => {
                    const modelId = `server${server.id}:${m.id || m}`;
                    allModels.push({
                        serverName: server.name,
                        modelId: modelId,
                        modelName: m.name || m.id || m
                    });
                });
            }
        });

        if (allModels.length === 0) {
            container.innerHTML = '<p class="no-models">Connect to LM Studio servers to see available models</p>';
            return;
        }

        container.innerHTML = allModels.map(model => {
            const isChecked = visibleLocalModels[model.modelId] !== false;
            return `
                <label class="checkbox-item">
                    <input type="checkbox"
                           class="local-model-visibility-checkbox"
                           data-model="${model.modelId}"
                           id="vis-local-${model.modelId.replace(/[^a-z0-9]/gi, '-')}"
                           ${isChecked ? 'checked' : ''}>
                    <span class="checkbox-custom"></span>
                    <span class="checkbox-label">${model.serverName} / ${model.modelName}</span>
                </label>
            `;
        }).join('');
    },

    save() {
        // Save API keys
        this.settings.apiKeys = {
            openai: document.getElementById('openai-key').value.trim(),
            anthropic: document.getElementById('anthropic-key').value.trim(),
            anthropicProxy: document.getElementById('anthropic-proxy').value.trim(),
            gemini: document.getElementById('gemini-key').value.trim(),
            deepseek: document.getElementById('deepseek-key').value.trim()
        };

        // Save LM Studio Servers
        this.settings.lmstudioServers = this.getAllLMStudioServers();

        // Keep backward compatibility - set lmstudio to first server
        if (this.settings.lmstudioServers.length > 0) {
            this.settings.lmstudio = {
                url: this.settings.lmstudioServers[0].url,
                models: this.settings.lmstudioServers[0].models
            };
        }

        // Save theme
        const selectedTheme = document.querySelector('input[name="theme"]:checked');
        if (selectedTheme) {
            this.settings.theme = selectedTheme.value;
        }

        // Save online model visibility
        this.settings.visibleModels = {};
        document.querySelectorAll('.model-visibility-checkbox').forEach(checkbox => {
            this.settings.visibleModels[checkbox.dataset.model] = checkbox.checked;
        });

        // Save local model visibility
        this.settings.visibleLocalModels = this.settings.visibleLocalModels || {};
        document.querySelectorAll('.local-model-visibility-checkbox').forEach(checkbox => {
            this.settings.visibleLocalModels[checkbox.dataset.model] = checkbox.checked;
        });

        // Save to storage
        Storage.saveSettings(this.settings);

        // Apply theme
        ThemeManager.applyTheme(this.settings.theme);

        // Refresh UI
        ChatUI.initModelSelector();

        this.hide();
    }
};
