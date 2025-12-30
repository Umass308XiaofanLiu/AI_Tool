// ==================== Sidebar UI Module ====================

const Sidebar = {
    element: null,
    chatListElement: null,

    init() {
        this.element = document.getElementById('sidebar');
        this.chatListElement = document.getElementById('chat-list');
        this.bindEvents();
        this.refresh();
    },

    bindEvents() {
        // New chat button
        document.getElementById('new-chat-btn').addEventListener('click', () => {
            this.onNewChat();
        });

        // Settings button
        document.getElementById('settings-btn').addEventListener('click', () => {
            SettingsDialog.show();
        });

        // Toggle sidebar on mobile
        document.getElementById('toggle-sidebar-btn')?.addEventListener('click', () => {
            this.toggle();
        });
    },

    refresh() {
        const chats = ChatHistory.getChatList();
        this.chatListElement.innerHTML = '';

        if (chats.length === 0) {
            this.chatListElement.innerHTML = `
                <div class="empty-chats">
                    <p>No conversations yet</p>
                </div>
            `;
            return;
        }

        chats.forEach(chat => {
            const item = this.createChatItem(chat);
            this.chatListElement.appendChild(item);
        });
    },

    createChatItem(chat) {
        const div = document.createElement('div');
        div.className = 'chat-item';
        div.dataset.chatId = chat.id;

        if (chat.id === ChatHistory.currentChatId) {
            div.classList.add('active');
        }

        div.innerHTML = `
            <div class="chat-item-content">
                <span class="chat-title">${this.escapeHtml(chat.title)}</span>
            </div>
            <div class="chat-item-actions">
                <button class="chat-action-btn rename-btn" title="Rename">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="chat-action-btn delete-btn" title="Delete">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        `;

        // Click to select
        div.addEventListener('click', (e) => {
            if (!e.target.closest('.chat-item-actions')) {
                this.onSelectChat(chat.id);
            }
        });

        // Rename button
        div.querySelector('.rename-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.onRenameChat(chat.id, chat.title);
        });

        // Delete button
        div.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.onDeleteChat(chat.id, chat.title);
        });

        return div;
    },

    onNewChat() {
        const chatId = ChatHistory.createNewChat();
        this.refresh();
        ChatUI.clear();
        ChatUI.showWelcome(false);
        ChatUI.focusInput();
    },

    onSelectChat(chatId) {
        ChatHistory.setCurrentChat(chatId);
        this.refresh();
        ChatUI.loadMessages(ChatHistory.getMessages(chatId));
        ChatUI.showWelcome(false);
    },

    onRenameChat(chatId, currentTitle) {
        const newTitle = prompt('Enter new title:', currentTitle);
        if (newTitle && newTitle.trim()) {
            ChatHistory.renameChat(chatId, newTitle.trim());
            this.refresh();
        }
    },

    onDeleteChat(chatId, title) {
        if (confirm(`Delete "${title}"?`)) {
            ChatHistory.deleteChat(chatId);
            this.refresh();

            if (ChatHistory.getChatList().length === 0) {
                ChatUI.showWelcome(true);
            } else {
                ChatUI.clear();
            }
        }
    },

    toggle() {
        this.element.classList.toggle('collapsed');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
