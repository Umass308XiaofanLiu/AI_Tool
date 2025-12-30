// ==================== Settings Dialog Module ====================

const SettingsDialog = {
    element: null,
    settings: null,

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

        // LM Studio connect button
        document.getElementById('lmstudio-connect-btn').addEventListener('click', () => {
            this.connectLMStudio();
        });

        // Show/hide API key toggles
        document.querySelectorAll('.toggle-visibility-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const input = btn.previousElementSibling;
                if (input.type === 'password') {
                    input.type = 'text';
                    btn.textContent = '🙈';
                } else {
                    input.type = 'password';
                    btn.textContent = '👁️';
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
        document.getElementById('gemini-key').value = this.settings.apiKeys?.gemini || '';

        // LM Studio
        document.getElementById('lmstudio-url').value = this.settings.lmstudio?.url || 'http://localhost:1234';
        this.updateLMStudioStatus('');

        // Model visibility
        const visibleModels = this.settings.visibleModels || {};
        document.querySelectorAll('.model-visibility-checkbox').forEach(checkbox => {
            const modelKey = checkbox.dataset.model;
            checkbox.checked = visibleModels[modelKey] !== false;
        });
    },

    async connectLMStudio() {
        const url = document.getElementById('lmstudio-url').value.trim() || 'http://localhost:1234';
        this.updateLMStudioStatus('Connecting...', 'pending');

        const isConnected = await LMStudioClient.validate(url);

        if (isConnected) {
            const models = await LMStudioClient.getModels(url);
            if (models.length > 0) {
                this.settings.lmstudio = {
                    url: url,
                    models: models
                };
                this.updateLMStudioStatus(`Connected! Found ${models.length} model(s)`, 'success');
                this.displayLMStudioModels(models);
            } else {
                this.updateLMStudioStatus('Connected, but no models loaded', 'warning');
                this.settings.lmstudio = { url: url, models: [] };
            }
        } else {
            this.updateLMStudioStatus('Connection failed. Is LM Studio running?', 'error');
        }
    },

    updateLMStudioStatus(message, status = '') {
        const statusEl = document.getElementById('lmstudio-status');
        statusEl.textContent = message;
        statusEl.className = 'connection-status ' + status;
    },

    displayLMStudioModels(models) {
        const container = document.getElementById('lmstudio-models-list');
        if (models.length === 0) {
            container.innerHTML = '<p class="no-models">No models loaded in LM Studio</p>';
            return;
        }

        container.innerHTML = models.map(m => `
            <div class="lmstudio-model-item">
                <span class="model-icon">🤖</span>
                <span class="model-name">${m.name || m.id}</span>
            </div>
        `).join('');
    },

    save() {
        // Save API keys
        this.settings.apiKeys = {
            openai: document.getElementById('openai-key').value.trim(),
            anthropic: document.getElementById('anthropic-key').value.trim(),
            gemini: document.getElementById('gemini-key').value.trim()
        };

        // Save LM Studio URL
        this.settings.lmstudio = this.settings.lmstudio || {};
        this.settings.lmstudio.url = document.getElementById('lmstudio-url').value.trim() || 'http://localhost:1234';

        // Save model visibility
        this.settings.visibleModels = {};
        document.querySelectorAll('.model-visibility-checkbox').forEach(checkbox => {
            this.settings.visibleModels[checkbox.dataset.model] = checkbox.checked;
        });

        // Save to storage
        Storage.saveSettings(this.settings);

        // Refresh UI
        ChatUI.initModelSelector();

        this.hide();
    }
};
