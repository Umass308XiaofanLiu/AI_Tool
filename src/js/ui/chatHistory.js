// ==================== Chat History Manager ====================

const ChatHistory = {
    chats: {},
    currentChatId: null,

    init() {
        this.chats = Storage.getChats();
        this.currentChatId = Storage.getCurrentChatId();
    },

    createNewChat(title = 'New Chat') {
        const chatId = Storage.generateId();
        this.chats[chatId] = {
            id: chatId,
            title: title,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: []
        };
        this.currentChatId = chatId;
        this.save();
        return chatId;
    },

    addMessage(role, content, model = null, attachments = null) {
        if (!this.currentChatId) {
            this.createNewChat();
        }

        const message = {
            role: role,
            content: content,
            timestamp: new Date().toISOString()
        };

        if (model) {
            message.model = model;
        }

        if (attachments && attachments.length > 0) {
            message.attachments = attachments;
        }

        this.chats[this.currentChatId].messages.push(message);
        this.chats[this.currentChatId].updatedAt = new Date().toISOString();

        // Update title if first user message
        if (role === 'user' && this.chats[this.currentChatId].messages.length === 1) {
            // Use content or "Image" if only images attached
            let title = content || (attachments?.length ? 'Image attachment' : 'New Chat');
            title = title.length > 40 ? title.substring(0, 40) + '...' : title;
            this.chats[this.currentChatId].title = title;
        }

        this.save();
    },

    getMessages(chatId = null) {
        const id = chatId || this.currentChatId;
        if (!id || !this.chats[id]) return [];
        return this.chats[id].messages;
    },

    setMessages(messages, chatId = null) {
        const id = chatId || this.currentChatId;
        if (!id || !this.chats[id]) return false;
        this.chats[id].messages = messages;
        this.chats[id].updatedAt = new Date().toISOString();
        this.save();
        return true;
    },

    getChatList() {
        return Object.values(this.chats)
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .map(chat => ({
                id: chat.id,
                title: chat.title,
                updatedAt: chat.updatedAt,
                messageCount: chat.messages.length
            }));
    },

    setCurrentChat(chatId) {
        if (this.chats[chatId]) {
            this.currentChatId = chatId;
            Storage.setCurrentChatId(chatId);
            return true;
        }
        return false;
    },

    deleteChat(chatId) {
        if (this.chats[chatId]) {
            delete this.chats[chatId];
            if (this.currentChatId === chatId) {
                this.currentChatId = null;
                Storage.setCurrentChatId(null);
            }
            this.save();
            return true;
        }
        return false;
    },

    renameChat(chatId, newTitle) {
        if (this.chats[chatId]) {
            this.chats[chatId].title = newTitle;
            this.save();
            return true;
        }
        return false;
    },

    getCurrentChat() {
        if (this.currentChatId && this.chats[this.currentChatId]) {
            return this.chats[this.currentChatId];
        }
        return null;
    },

    save() {
        Storage.saveChats(this.chats);
        Storage.setCurrentChatId(this.currentChatId);
    }
};
