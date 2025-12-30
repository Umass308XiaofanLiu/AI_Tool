// ==================== Storage Module ====================
// Handles localStorage for settings and chat history

const Storage = {
    KEYS: {
        SETTINGS: 'ai_chat_settings',
        CHATS: 'ai_chat_history',
        CURRENT_CHAT: 'ai_chat_current'
    },

    // Settings management
    getSettings() {
        const defaults = {
            apiKeys: {
                openai: '',
                anthropic: '',
                anthropicProxy: '', // CORS proxy URL for Claude
                gemini: '',
                deepseek: ''
            },
            lmstudio: {
                url: 'http://localhost:1234',
                models: []
            },
            visibleModels: {
                // Gemini models
                'gemini-2.5-flash-lite': true,
                'gemini-3-flash': true,
                'gemini-3-pro': true,
                // OpenAI GPT-5 models
                'gpt-5-nano': true,
                'gpt-5-mini': true,
                'gpt-5.2': true,
                // Claude 4.5 models
                'claude-haiku-4.5': true,
                'claude-sonnet-4.5': true,
                'claude-opus-4.5': true,
                // DeepSeek models
                'deepseek-v3.2': true,
                'deepseek-v3.2-reasoner': true
            },
            visibleLocalModels: {}, // Track visibility of individual LM Studio models
            currentModel: 'gemini-2.5-flash-lite',
            theme: 'system' // 'light', 'dark', 'system'
        };

        try {
            const saved = localStorage.getItem(this.KEYS.SETTINGS);
            if (saved) {
                const parsed = JSON.parse(saved);
                return this.deepMerge(defaults, parsed);
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
        return defaults;
    },

    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        return result;
    },

    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Failed to save settings:', e);
            return false;
        }
    },

    // Chat history management
    getChats() {
        try {
            const saved = localStorage.getItem(this.KEYS.CHATS);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('Failed to load chats:', e);
            return {};
        }
    },

    saveChats(chats) {
        try {
            localStorage.setItem(this.KEYS.CHATS, JSON.stringify(chats));
            return true;
        } catch (e) {
            console.error('Failed to save chats:', e);
            return false;
        }
    },

    getCurrentChatId() {
        return localStorage.getItem(this.KEYS.CURRENT_CHAT) || null;
    },

    setCurrentChatId(chatId) {
        if (chatId) {
            localStorage.setItem(this.KEYS.CURRENT_CHAT, chatId);
        } else {
            localStorage.removeItem(this.KEYS.CURRENT_CHAT);
        }
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
};

// ==================== Theme Manager ====================
const ThemeManager = {
    init() {
        this.applyTheme(Storage.getSettings().theme || 'system');

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            const settings = Storage.getSettings();
            if (settings.theme === 'system') {
                this.applyTheme('system');
            }
        });
    },

    applyTheme(theme) {
        const root = document.documentElement;

        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', theme);
        }
    },

    setTheme(theme) {
        const settings = Storage.getSettings();
        settings.theme = theme;
        Storage.saveSettings(settings);
        this.applyTheme(theme);
    },

    getCurrentTheme() {
        return Storage.getSettings().theme || 'system';
    }
};
