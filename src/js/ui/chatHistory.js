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

    // Get messages for display - respects branching
    getDisplayMessages(chatId = null) {
        const id = chatId || this.currentChatId;
        if (!id || !this.chats[id]) return [];

        const messages = this.chats[id].messages;
        const result = [];

        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            result.push(msg);

            // If this message has history and current branch has continuation that's truncated
            // We stop here and don't show messages after
            if (msg.responseHistory && msg.currentHistoryIndex !== undefined) {
                const currentEntry = msg.responseHistory[msg.currentHistoryIndex];
                if (currentEntry && currentEntry.truncateAfter) {
                    break;
                }
            }
        }

        return result;
    },

    // Get messages for API - only up to a certain point for regeneration
    getMessagesForAPI(upToIndex) {
        if (!this.currentChatId || !this.chats[this.currentChatId]) return [];
        const messages = this.chats[this.currentChatId].messages;
        return messages.slice(0, upToIndex);
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

    // Prepare for regeneration - stores continuation and prepares for new branch
    prepareRegenerate(messageIndex) {
        if (!this.currentChatId || !this.chats[this.currentChatId]) return false;

        const messages = this.chats[this.currentChatId].messages;
        if (messageIndex < 0 || messageIndex >= messages.length) return false;

        const message = messages[messageIndex];

        // Initialize history if not exists
        if (!message.responseHistory) {
            message.responseHistory = [{
                content: message.content,
                model: message.model,
                timestamp: message.timestamp,
                continuation: messages.slice(messageIndex + 1) // Store all messages after this
            }];
            message.currentHistoryIndex = 0;
        } else {
            // Update current entry's continuation with any new messages
            const currentEntry = message.responseHistory[message.currentHistoryIndex];
            if (currentEntry && !currentEntry.continuation) {
                currentEntry.continuation = messages.slice(messageIndex + 1);
            }
        }

        // Truncate messages array to this point (visually creating new branch)
        this.chats[this.currentChatId].messages = messages.slice(0, messageIndex + 1);

        this.save();
        return true;
    },

    // Prepare for user message edit - stores the original conversation as a branch
    prepareUserEdit(messageIndex) {
        if (!this.currentChatId || !this.chats[this.currentChatId]) return false;

        const messages = this.chats[this.currentChatId].messages;
        if (messageIndex < 0 || messageIndex >= messages.length) return false;

        const message = messages[messageIndex];
        if (message.role !== 'user') return false;

        // Initialize edit history if not exists
        if (!message.editHistory) {
            message.editHistory = [{
                content: message.content,
                timestamp: message.timestamp,
                attachments: message.attachments,
                continuation: messages.slice(messageIndex + 1) // Store all messages after this
            }];
            message.currentEditIndex = 0;
        } else {
            // Update current entry's continuation with any new messages
            const currentEntry = message.editHistory[message.currentEditIndex];
            if (currentEntry) {
                currentEntry.continuation = messages.slice(messageIndex + 1);
            }

            // Add new edit entry
            message.editHistory.push({
                content: message.content,
                timestamp: new Date().toISOString(),
                attachments: message.attachments,
                continuation: [] // New branch starts empty
            });
            message.currentEditIndex = message.editHistory.length - 1;
        }

        this.save();
        return true;
    },

    // Complete regeneration - add new response as new branch
    completeRegenerate(messageIndex, newContent, newModel) {
        if (!this.currentChatId || !this.chats[this.currentChatId]) return false;

        const messages = this.chats[this.currentChatId].messages;
        if (messageIndex < 0 || messageIndex >= messages.length) return false;

        const message = messages[messageIndex];

        // Add new response to history (without continuation - it's a new branch)
        message.responseHistory.push({
            content: newContent,
            model: newModel,
            timestamp: new Date().toISOString(),
            continuation: [] // New branch starts empty
        });

        // Update current display to new response
        message.currentHistoryIndex = message.responseHistory.length - 1;
        message.content = newContent;
        message.model = newModel;
        message.timestamp = new Date().toISOString();

        this.chats[this.currentChatId].updatedAt = new Date().toISOString();
        this.save();
        return true;
    },

    // Navigate response history with branch support
    navigateHistory(messageIndex, direction) {
        if (!this.currentChatId || !this.chats[this.currentChatId]) return null;

        const messages = this.chats[this.currentChatId].messages;
        if (messageIndex < 0 || messageIndex >= messages.length) return null;

        const message = messages[messageIndex];
        if (!message.responseHistory || message.responseHistory.length <= 1) return null;

        let newIndex = message.currentHistoryIndex + direction;
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= message.responseHistory.length) newIndex = message.responseHistory.length - 1;

        if (newIndex !== message.currentHistoryIndex) {
            // Save current continuation before switching
            const currentEntry = message.responseHistory[message.currentHistoryIndex];
            if (currentEntry) {
                currentEntry.continuation = messages.slice(messageIndex + 1);
            }

            // Switch to new history entry
            message.currentHistoryIndex = newIndex;
            const historyItem = message.responseHistory[newIndex];
            message.content = historyItem.content;
            message.model = historyItem.model;

            // Restore continuation from new branch
            const continuation = historyItem.continuation || [];
            this.chats[this.currentChatId].messages = [
                ...messages.slice(0, messageIndex + 1),
                ...continuation
            ];

            this.save();
            return historyItem;
        }
        return null;
    },

    // Get branch info for a message
    getBranchInfo(messageIndex) {
        if (!this.currentChatId || !this.chats[this.currentChatId]) return null;

        const messages = this.chats[this.currentChatId].messages;
        if (messageIndex < 0 || messageIndex >= messages.length) return null;

        const message = messages[messageIndex];
        if (!message.responseHistory || message.responseHistory.length <= 1) return null;

        return {
            current: message.currentHistoryIndex + 1,
            total: message.responseHistory.length
        };
    },

    save() {
        Storage.saveChats(this.chats);
        Storage.setCurrentChatId(this.currentChatId);
    }
};
