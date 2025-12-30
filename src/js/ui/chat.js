// ==================== Chat UI Module ====================

const ChatUI = {
    messagesContainer: null,
    inputField: null,
    sendButton: null,
    welcomeScreen: null,
    chatArea: null,
    isGenerating: false,
    currentStreamingElement: null,
    currentStreamingMsgDiv: null,

    init() {
        this.messagesContainer = document.getElementById('messages-container');
        this.inputField = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-btn');
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.chatArea = document.getElementById('chat-area');

        this.bindEvents();
        this.initModelSelector();

        // Show welcome or load current chat
        if (ChatHistory.currentChatId && ChatHistory.getCurrentChat()) {
            this.loadMessages(ChatHistory.getMessages());
            this.showWelcome(false);
        } else {
            this.showWelcome(true);
        }
    },

    bindEvents() {
        // Send button
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key (without Shift)
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        this.inputField.addEventListener('input', () => {
            this.inputField.style.height = 'auto';
            this.inputField.style.height = Math.min(this.inputField.scrollHeight, 150) + 'px';
        });
    },

    initModelSelector() {
        const selector = document.getElementById('model-selector');
        const settings = Storage.getSettings();

        selector.innerHTML = '';

        // Gemini models (first as in screenshot)
        GeminiClient.MODELS.forEach(model => {
            if (settings.visibleModels[model.displayKey] !== false) {
                const option = document.createElement('option');
                option.value = `gemini:${model.id}`;
                option.textContent = model.name;
                option.style.color = model.color;
                selector.appendChild(option);
            }
        });

        // OpenAI GPT models
        OpenAIClient.MODELS.forEach(model => {
            if (settings.visibleModels[model.displayKey] !== false) {
                const option = document.createElement('option');
                option.value = `openai:${model.id}`;
                option.textContent = model.name;
                option.style.color = model.color;
                selector.appendChild(option);
            }
        });

        // Claude models
        ClaudeClient.MODELS.forEach(model => {
            if (settings.visibleModels[model.displayKey] !== false) {
                const option = document.createElement('option');
                option.value = `anthropic:${model.id}`;
                option.textContent = model.name;
                option.style.color = model.color;
                selector.appendChild(option);
            }
        });

        // DeepSeek models
        DeepSeekClient.MODELS.forEach(model => {
            if (settings.visibleModels[model.displayKey] !== false) {
                const option = document.createElement('option');
                option.value = `deepseek:${model.id}`;
                option.textContent = model.name;
                option.style.color = model.color;
                selector.appendChild(option);
            }
        });

        // LM Studio models
        const lmModels = settings.lmstudio?.models || [];
        const visibleLocalModels = settings.visibleLocalModels || {};

        lmModels.forEach(model => {
            const modelId = model.id || model;
            const modelName = model.name || model;
            // Check if this specific local model is visible
            if (visibleLocalModels[modelId] !== false) {
                const option = document.createElement('option');
                option.value = `lmstudio:${modelId}`;
                option.textContent = modelName;
                selector.appendChild(option);
            }
        });

        // Set current model
        if (settings.currentModel) {
            const currentOption = [...selector.options].find(opt => opt.value.includes(settings.currentModel));
            if (currentOption) {
                selector.value = currentOption.value;
            }
        }

        // Save selection
        selector.addEventListener('change', () => {
            const [provider, modelId] = selector.value.split(':');
            const currentSettings = Storage.getSettings();
            currentSettings.currentModel = modelId;
            Storage.saveSettings(currentSettings);
        });
    },

    showWelcome(show) {
        if (show) {
            this.welcomeScreen.style.display = 'flex';
            this.chatArea.style.display = 'none';
        } else {
            this.welcomeScreen.style.display = 'none';
            this.chatArea.style.display = 'flex';
        }
    },

    loadMessages(messages) {
        this.messagesContainer.innerHTML = '';
        messages.forEach((msg, index) => {
            this.addMessage(msg.role, msg.content, msg.model, false, index);
        });
        this.scrollToBottom();
    },

    addMessage(role, content, model = null, scroll = true, messageIndex = null) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}-message`;

        if (role === 'user') {
            // User message - right aligned bubble
            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'message-bubble';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = MarkdownParser.parse(content);

            bubbleDiv.appendChild(contentDiv);
            msgDiv.appendChild(bubbleDiv);
        } else {
            // Assistant message - centered with icon
            const headerDiv = document.createElement('div');
            headerDiv.className = 'message-header';
            headerDiv.innerHTML = `
                <div class="assistant-icon">✦</div>
                ${model ? `<span class="message-model">${model}</span>` : '<span class="message-model">Assistant</span>'}
            `;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = MarkdownParser.parse(content);

            // Action buttons for assistant messages
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';

            const idx = messageIndex !== null ? messageIndex : this.getNextAssistantIndex();
            actionsDiv.innerHTML = `
                <button class="message-action-btn" onclick="ChatUI.copyMessage(this)" data-content="${this.escapeAttr(content)}">
                    <span>📋</span> Copy
                </button>
                <button class="message-action-btn" onclick="ChatUI.regenerateMessage(${idx})">
                    <span>🔄</span> Regenerate
                </button>
            `;

            msgDiv.appendChild(headerDiv);
            msgDiv.appendChild(contentDiv);
            msgDiv.appendChild(actionsDiv);
        }

        this.messagesContainer.appendChild(msgDiv);

        if (scroll) {
            this.scrollToBottom();
        }
    },

    escapeAttr(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    getNextAssistantIndex() {
        const messages = ChatHistory.getMessages();
        return messages.length;
    },

    copyMessage(button) {
        const content = button.dataset.content;
        navigator.clipboard.writeText(content).then(() => {
            button.classList.add('copied');
            button.innerHTML = '<span>✓</span> Copied!';
            setTimeout(() => {
                button.classList.remove('copied');
                button.innerHTML = '<span>📋</span> Copy';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    },

    async regenerateMessage(messageIndex) {
        if (this.isGenerating) return;

        const messages = ChatHistory.getMessages();

        // Find the assistant message at this index and remove it and all after
        // The messageIndex should be the index of the assistant message
        if (messageIndex < 0 || messageIndex >= messages.length) return;

        // Get messages up to the assistant message (exclude the assistant message)
        const messagesUpTo = messages.slice(0, messageIndex);

        // Update chat history - remove messages from messageIndex onwards
        ChatHistory.setMessages(messagesUpTo);

        // Reload the UI
        this.loadMessages(messagesUpTo);

        // Get the last user message to regenerate
        const lastUserMsg = messagesUpTo.filter(m => m.role === 'user').pop();
        if (!lastUserMsg) return;

        // Get selected model
        const selector = document.getElementById('model-selector');
        const [provider, modelId] = selector.value.split(':');
        const modelName = selector.options[selector.selectedIndex].text;

        // Disable input
        this.setGenerating(true);

        try {
            // Start streaming display
            this.startStreaming();

            // Prepare messages for API
            const apiMessages = messagesUpTo.map(m => ({
                role: m.role,
                content: m.content
            }));

            // Get settings
            const settings = Storage.getSettings();
            let fullResponse = '';

            // Call appropriate API
            const onChunk = (chunk) => {
                this.appendToStream(chunk);
            };

            switch (provider) {
                case 'openai':
                    fullResponse = await OpenAIClient.chat(apiMessages, modelId, settings.apiKeys.openai, onChunk);
                    break;
                case 'anthropic':
                    fullResponse = await ClaudeClient.chat(
                        apiMessages,
                        modelId,
                        settings.apiKeys.anthropic,
                        onChunk,
                        settings.apiKeys.anthropicProxy
                    );
                    break;
                case 'gemini':
                    fullResponse = await GeminiClient.chat(apiMessages, modelId, settings.apiKeys.gemini, onChunk);
                    break;
                case 'deepseek':
                    fullResponse = await DeepSeekClient.chat(apiMessages, modelId, settings.apiKeys.deepseek, onChunk);
                    break;
                case 'lmstudio':
                    fullResponse = await LMStudioClient.chat(apiMessages, modelId, settings.lmstudio?.url, onChunk);
                    break;
            }

            // Finish streaming display
            this.finishStreaming();

            // Save assistant message
            ChatHistory.addMessage('assistant', fullResponse, modelName);
            Sidebar.refresh();

        } catch (error) {
            console.error('Regenerate error:', error);
            this.finishStreaming();
            this.addMessage('assistant', `Error: ${error.message}`);
            ChatHistory.addMessage('assistant', `Error: ${error.message}`);
        }

        this.setGenerating(false);
        this.focusInput();
    },

    startStreaming() {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message assistant-message streaming';

        // Get selected model name for header
        const selector = document.getElementById('model-selector');
        const modelName = selector.options[selector.selectedIndex]?.text || 'Assistant';

        const headerDiv = document.createElement('div');
        headerDiv.className = 'message-header';
        headerDiv.innerHTML = `
            <div class="assistant-icon">✦</div>
            <span class="message-model">${modelName}</span>
        `;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        msgDiv.appendChild(headerDiv);
        msgDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(msgDiv);

        this.currentStreamingElement = contentDiv;
        this.currentStreamingMsgDiv = msgDiv;
        this.scrollToBottom();

        return contentDiv;
    },

    appendToStream(text) {
        if (this.currentStreamingElement) {
            const currentText = this.currentStreamingElement.dataset.rawText || '';
            this.currentStreamingElement.dataset.rawText = currentText + text;
            this.currentStreamingElement.textContent = this.currentStreamingElement.dataset.rawText;
            this.scrollToBottom();
        }
    },

    finishStreaming() {
        if (this.currentStreamingElement) {
            const rawText = this.currentStreamingElement.dataset.rawText || '';
            this.currentStreamingElement.innerHTML = MarkdownParser.parse(rawText);
            this.currentStreamingElement.parentElement.classList.remove('streaming');

            // Add action buttons
            const msgDiv = this.currentStreamingMsgDiv;
            if (msgDiv) {
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'message-actions';
                const idx = ChatHistory.getMessages().length; // Will be added after this
                actionsDiv.innerHTML = `
                    <button class="message-action-btn" onclick="ChatUI.copyMessage(this)" data-content="${this.escapeAttr(rawText)}">
                        <span>📋</span> Copy
                    </button>
                    <button class="message-action-btn" onclick="ChatUI.regenerateMessage(${idx})">
                        <span>🔄</span> Regenerate
                    </button>
                `;
                msgDiv.appendChild(actionsDiv);
            }

            this.currentStreamingElement = null;
            this.currentStreamingMsgDiv = null;
        }
    },

    async sendMessage() {
        const content = this.inputField.value.trim();
        if (!content || this.isGenerating) return;

        // Ensure we have a chat
        if (!ChatHistory.currentChatId) {
            ChatHistory.createNewChat();
            Sidebar.refresh();
            this.showWelcome(false);
        }

        // Add user message
        this.addMessage('user', content);
        ChatHistory.addMessage('user', content);
        Sidebar.refresh();

        // Clear input
        this.inputField.value = '';
        this.inputField.style.height = 'auto';

        // Get selected model
        const selector = document.getElementById('model-selector');
        const [provider, modelId] = selector.value.split(':');
        const modelName = selector.options[selector.selectedIndex].text;

        // Disable input
        this.setGenerating(true);

        try {
            // Start streaming display
            this.startStreaming();

            // Prepare messages for API
            const messages = ChatHistory.getMessages().map(m => ({
                role: m.role,
                content: m.content
            }));

            // Get settings
            const settings = Storage.getSettings();
            let fullResponse = '';

            // Call appropriate API
            const onChunk = (chunk) => {
                this.appendToStream(chunk);
            };

            switch (provider) {
                case 'openai':
                    fullResponse = await OpenAIClient.chat(messages, modelId, settings.apiKeys.openai, onChunk);
                    break;
                case 'anthropic':
                    fullResponse = await ClaudeClient.chat(
                        messages,
                        modelId,
                        settings.apiKeys.anthropic,
                        onChunk,
                        settings.apiKeys.anthropicProxy
                    );
                    break;
                case 'gemini':
                    fullResponse = await GeminiClient.chat(messages, modelId, settings.apiKeys.gemini, onChunk);
                    break;
                case 'deepseek':
                    fullResponse = await DeepSeekClient.chat(messages, modelId, settings.apiKeys.deepseek, onChunk);
                    break;
                case 'lmstudio':
                    fullResponse = await LMStudioClient.chat(messages, modelId, settings.lmstudio?.url, onChunk);
                    break;
            }

            // Finish streaming display
            this.finishStreaming();

            // Save assistant message
            ChatHistory.addMessage('assistant', fullResponse, modelName);
            Sidebar.refresh();

        } catch (error) {
            console.error('Chat error:', error);
            this.finishStreaming();
            this.addMessage('assistant', `Error: ${error.message}`);
            ChatHistory.addMessage('assistant', `Error: ${error.message}`);
        }

        this.setGenerating(false);
        this.focusInput();
    },

    setGenerating(generating) {
        this.isGenerating = generating;
        this.sendButton.disabled = generating;
        this.inputField.disabled = generating;
        this.sendButton.textContent = generating ? '...' : 'Send';
    },

    clear() {
        this.messagesContainer.innerHTML = '';
    },

    focusInput() {
        this.inputField.focus();
    },

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
};
