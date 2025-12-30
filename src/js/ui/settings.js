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

        // LM Studio
        document.getElementById('lmstudio-url').value = this.settings.lmstudio?.url || 'http://localhost:1234';
        this.updateLMStudioStatus('');

        // Display existing LM Studio models if any
        if (this.settings.lmstudio?.models?.length > 0) {
            this.displayLMStudioModels(this.settings.lmstudio.models);
        }

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

    updateLocalModelsVisibility() {
        const container = document.getElementById('local-models-visibility');
        if (!container) return;

        const lmModels = this.settings.lmstudio?.models || [];
        const visibleLocalModels = this.settings.visibleLocalModels || {};

        if (lmModels.length === 0) {
            container.innerHTML = '<p class="no-models">Connect to LM Studio to see available models</p>';
            return;
        }

        container.innerHTML = lmModels.map(model => {
            const modelId = model.id || model;
            const modelName = model.name || model;
            const isChecked = visibleLocalModels[modelId] !== false;
            return `
                <label class="checkbox-item">
                    <input type="checkbox"
                           class="local-model-visibility-checkbox"
                           data-model="${modelId}"
                           id="vis-local-${modelId.replace(/[^a-z0-9]/gi, '-')}"
                           ${isChecked ? 'checked' : ''}>
                    <span class="checkbox-custom"></span>
                    <span class="checkbox-label">${modelName}</span>
                </label>
            `;
        }).join('');
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
                // Initialize visibility for new models
                if (!this.settings.visibleLocalModels) {
                    this.settings.visibleLocalModels = {};
                }
                models.forEach(m => {
                    const modelId = m.id || m;
                    if (this.settings.visibleLocalModels[modelId] === undefined) {
                        this.settings.visibleLocalModels[modelId] = true;
                    }
                });
                this.updateLMStudioStatus(`Connected! Found ${models.length} model(s)`, 'success');
                this.displayLMStudioModels(models);
                this.updateLocalModelsVisibility();
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
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="3" width="20" height="14" rx="2"/>
                    <path d="M8 21h8M12 17v4"/>
                </svg>
                <span class="model-name">${m.name || m.id}</span>
            </div>
        `).join('');
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

        // Save LM Studio URL
        this.settings.lmstudio = this.settings.lmstudio || {};
        this.settings.lmstudio.url = document.getElementById('lmstudio-url').value.trim() || 'http://localhost:1234';

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
