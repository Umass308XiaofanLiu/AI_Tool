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
                gemini: ''
            },
            lmstudio: {
                url: 'http://localhost:1234',
                models: []
            },
            visibleModels: {
                'gpt-4': true,
                'gpt-4-turbo': true,
                'gpt-4o': true,
                'gpt-4o-mini': true,
                'gpt-3.5-turbo': true,
                'claude-3-opus': true,
                'claude-3-sonnet': true,
                'claude-3-haiku': true,
                'claude-3.5-sonnet': true,
                'claude-3.5-haiku': true,
                'gemini-pro': true,
                'gemini-1.5-pro': true,
                'gemini-1.5-flash': true,
                'gemini-2.0-flash': true,
                'lmstudio': true
            },
            currentModel: 'gpt-4',
            theme: 'dark'
        };

        try {
            const saved = localStorage.getItem(this.KEYS.SETTINGS);
            if (saved) {
                return { ...defaults, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
        return defaults;
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
