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
    abortController: null,

    // File handling
    attachButton: null,
    fileInput: null,
    filePreviewContainer: null,
    pendingFiles: [],
    imageModal: null,
    dropOverlay: null,

    init() {
        this.messagesContainer = document.getElementById('messages-container');
        this.inputField = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-btn');
        this.welcomeScreen = document.getElementById('welcome-screen');
        this.chatArea = document.getElementById('chat-area');

        // File handling elements
        this.attachButton = document.getElementById('attach-btn');
        this.fileInput = document.getElementById('file-input');
        this.filePreviewContainer = document.getElementById('file-preview-container');
        this.imageModal = document.getElementById('image-modal');
        this.dropOverlay = document.getElementById('drop-overlay');

        this.bindEvents();
        this.initModelSelector();
        this.initFileHandling();
        this.initImageModal();
        this.initDragDrop();

        // Show welcome or load current chat
        if (ChatHistory.currentChatId && ChatHistory.getCurrentChat()) {
            this.loadMessages(ChatHistory.getMessages());
            this.showWelcome(false);
        } else {
            this.showWelcome(true);
        }
    },

    bindEvents() {
        // Send button - handles both send and stop
        this.sendButton.addEventListener('click', () => {
            if (this.isGenerating) {
                this.stopGeneration();
            } else {
                this.sendMessage();
            }
        });

        // Enter key (without Shift)
        this.inputField.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!this.isGenerating) {
                    this.sendMessage();
                }
            }
        });

        // Auto-resize textarea
        this.inputField.addEventListener('input', () => {
            this.inputField.style.height = 'auto';
            this.inputField.style.height = Math.min(this.inputField.scrollHeight, 150) + 'px';
        });
    },

    initFileHandling() {
        // Attach button
        this.attachButton.addEventListener('click', () => {
            this.fileInput.click();
        });

        // File input change
        this.fileInput.addEventListener('change', (e) => {
            this.addFiles(e.target.files);
            this.fileInput.value = ''; // Reset for same file selection
        });

        // Paste handler
        document.addEventListener('paste', (e) => {
            const items = e.clipboardData?.items;
            if (items) {
                const files = [];
                for (const item of items) {
                    if (item.kind === 'file') {
                        const file = item.getAsFile();
                        if (file) files.push(file);
                    }
                }
                if (files.length > 0) {
                    e.preventDefault();
                    this.addFiles(files);
                }
            }
        });
    },

    initImageModal() {
        const modal = this.imageModal;
        const modalImg = document.getElementById('image-modal-img');
        const closeBtn = document.getElementById('image-modal-close');

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeImageModal();
                }
            });

            closeBtn?.addEventListener('click', () => {
                this.closeImageModal();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('visible')) {
                    this.closeImageModal();
                }
            });
        }
    },

    initDragDrop() {
        let dragCounter = 0;

        document.addEventListener('dragenter', (e) => {
            e.preventDefault();
            dragCounter++;
            if (e.dataTransfer.types.includes('Files')) {
                this.dropOverlay?.classList.add('visible');
            }
        });

        document.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0) {
                this.dropOverlay?.classList.remove('visible');
            }
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            dragCounter = 0;
            this.dropOverlay?.classList.remove('visible');

            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                this.addFiles(files);
            }
        });
    },

    addFiles(files) {
        for (const file of files) {
            // Check file size (max 20MB)
            if (file.size > 20 * 1024 * 1024) {
                alert(`File "${file.name}" is too large. Maximum size is 20MB.`);
                continue;
            }

            // Determine if it's a text-based file (including code files)
            const textExtensions = [
                // Text files
                '.txt', '.md', '.json', '.csv', '.xml', '.yaml', '.yml', '.log', '.ini', '.conf', '.cfg',
                // Web development
                '.html', '.htm', '.css', '.scss', '.sass', '.less', '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
                // Programming languages
                '.py', '.pyw', '.pyi',           // Python
                '.java', '.kt', '.kts',          // Java/Kotlin
                '.c', '.h', '.cpp', '.hpp', '.cc', '.cxx', '.hxx',  // C/C++
                '.cs',                           // C#
                '.go',                           // Go
                '.rs',                           // Rust
                '.swift',                        // Swift
                '.m', '.mm',                     // Objective-C / MATLAB
                '.r', '.R',                      // R
                '.rb',                           // Ruby
                '.php',                          // PHP
                '.pl', '.pm',                    // Perl
                '.lua',                          // Lua
                '.scala',                        // Scala
                '.groovy',                       // Groovy
                '.dart',                         // Dart
                '.jl',                           // Julia
                '.hs',                           // Haskell
                '.clj', '.cljs', '.cljc',        // Clojure
                '.ex', '.exs',                   // Elixir
                '.erl',                          // Erlang
                '.ml', '.mli',                   // OCaml
                '.fs', '.fsi', '.fsx',           // F#
                '.f90', '.f95', '.f03', '.f',    // Fortran
                // Shell scripts
                '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
                // Database
                '.sql',
                // Assembly
                '.asm', '.s',
                // Hardware description
                '.v', '.sv', '.vhd', '.vhdl',
                // Other
                '.ipynb', '.tex', '.bib', '.toml', '.dockerfile'
            ];
            const fileName = file.name.toLowerCase();
            const isTextFile = textExtensions.some(ext => fileName.endsWith(ext)) ||
                              file.type.startsWith('text/') ||
                              file.type === 'application/json' ||
                              file.type === 'application/javascript' ||
                              file.type === 'application/typescript';
            const isPDF = file.type === 'application/pdf' || fileName.endsWith('.pdf');

            // Create file object with preview
            const fileObj = {
                id: Date.now() + Math.random().toString(36).substr(2, 9),
                file: file,
                name: file.name,
                size: file.size,
                type: file.type,
                isImage: file.type.startsWith('image/'),
                isTextFile: isTextFile,
                isPDF: isPDF,
                dataUrl: null,
                textContent: null
            };

            // Read file for preview and API
            if (fileObj.isImage) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fileObj.dataUrl = e.target.result;
                    this.updateFilePreview();
                };
                reader.readAsDataURL(file);
            } else if (isTextFile) {
                // Read text files as text
                const reader = new FileReader();
                reader.onload = (e) => {
                    fileObj.textContent = e.target.result;
                    this.updateFilePreview();
                };
                reader.readAsText(file);
            } else if (isPDF) {
                // For PDF, read as base64 for potential API support
                const reader = new FileReader();
                reader.onload = (e) => {
                    fileObj.dataUrl = e.target.result;
                    this.updateFilePreview();
                };
                reader.readAsDataURL(file);
            } else {
                // Other files, just store metadata
                this.updateFilePreview();
            }

            this.pendingFiles.push(fileObj);
        }

        this.updateFilePreview();
    },

    removeFile(fileId) {
        this.pendingFiles = this.pendingFiles.filter(f => f.id !== fileId);
        this.updateFilePreview();
    },

    clearFiles() {
        this.pendingFiles = [];
        this.updateFilePreview();
    },

    updateFilePreview() {
        if (!this.filePreviewContainer) return;

        if (this.pendingFiles.length === 0) {
            this.filePreviewContainer.classList.remove('has-files');
            this.filePreviewContainer.innerHTML = '';
            return;
        }

        this.filePreviewContainer.classList.add('has-files');
        this.filePreviewContainer.innerHTML = this.pendingFiles.map(file => {
            if (file.isImage && file.dataUrl) {
                return `
                    <div class="file-preview-item image-preview" data-file-id="${file.id}">
                        <img src="${file.dataUrl}" alt="${file.name}">
                        <button class="remove-file-btn" onclick="ChatUI.removeFile('${file.id}')">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                `;
            } else {
                return `
                    <div class="file-preview-item file-preview" data-file-id="${file.id}">
                        <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <div class="file-info">
                            <div class="file-name">${file.name}</div>
                            <div class="file-size">${this.formatFileSize(file.size)}</div>
                        </div>
                        <button class="remove-file-btn" onclick="ChatUI.removeFile('${file.id}')">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                `;
            }
        }).join('');
    },

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    openImageModal(src) {
        const modal = this.imageModal;
        const modalImg = document.getElementById('image-modal-img');
        if (modal && modalImg) {
            modalImg.src = src;
            modal.classList.add('visible');
        }
    },

    closeImageModal() {
        this.imageModal?.classList.remove('visible');
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
            this.addMessage(msg.role, msg.content, msg.model, false, index, msg.attachments, msg.responseHistory, msg.currentHistoryIndex);
        });
        this.scrollToBottom();
    },

    addMessage(role, content, model = null, scroll = true, messageIndex = null, attachments = null, responseHistory = null, currentHistoryIndex = 0) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${role}-message`;

        if (role === 'user') {
            // User message - right aligned bubble
            const idx = messageIndex !== null ? messageIndex : ChatHistory.getMessages().length;

            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = 'message-bubble';

            // Add attachments if present
            if (attachments && attachments.length > 0) {
                const attachmentsDiv = this.createAttachmentsDiv(attachments);
                bubbleDiv.appendChild(attachmentsDiv);
            }

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = MarkdownParser.parse(content);

            bubbleDiv.appendChild(contentDiv);

            // Add edit button for user messages
            const editBtn = document.createElement('button');
            editBtn.className = 'user-message-edit-btn';
            editBtn.title = 'Edit message';
            editBtn.onclick = () => this.editUserMessage(idx);
            editBtn.innerHTML = `
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            bubbleDiv.appendChild(editBtn);

            msgDiv.appendChild(bubbleDiv);
        } else {
            // Assistant message - centered with icon
            const headerDiv = document.createElement('div');
            headerDiv.className = 'message-header';
            headerDiv.innerHTML = `
                <div class="assistant-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                </div>
                ${model ? `<span class="message-model">${model}</span>` : '<span class="message-model">Assistant</span>'}
            `;

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.innerHTML = MarkdownParser.parse(content);

            // Action buttons for assistant messages
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'message-actions';

            const idx = messageIndex !== null ? messageIndex : this.getNextAssistantIndex();
            const hasHistory = responseHistory && responseHistory.length > 1;
            const historyIndex = currentHistoryIndex || 0;
            const historyTotal = responseHistory ? responseHistory.length : 1;

            let historyNavHTML = '';
            if (hasHistory) {
                historyNavHTML = `
                    <div class="response-history-nav">
                        <button class="history-nav-btn" onclick="ChatUI.navigateResponseHistory(${idx}, -1)" ${historyIndex === 0 ? 'disabled' : ''}>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                        </button>
                        <span class="history-counter">${historyIndex + 1} / ${historyTotal}</span>
                        <button class="history-nav-btn" onclick="ChatUI.navigateResponseHistory(${idx}, 1)" ${historyIndex >= historyTotal - 1 ? 'disabled' : ''}>
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="9 18 15 12 9 6"/>
                            </svg>
                        </button>
                    </div>
                `;
            }

            actionsDiv.innerHTML = `
                <button class="message-action-btn" onclick="ChatUI.copyMessage(this)" data-content="${this.escapeAttr(content)}">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="9" y="9" width="13" height="13" rx="2"/>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                    Copy
                </button>
                <button class="message-action-btn" onclick="ChatUI.regenerateMessage(${idx})">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M23 4v6h-6M1 20v-6h6"/>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                    </svg>
                    Regenerate
                </button>
                ${historyNavHTML}
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

    createAttachmentsDiv(attachments) {
        const div = document.createElement('div');
        div.className = 'message-attachments';

        attachments.forEach(att => {
            if (att.isImage && att.dataUrl) {
                const imgWrapper = document.createElement('div');
                imgWrapper.className = 'message-attachment image-attachment';
                const img = document.createElement('img');
                img.src = att.dataUrl;
                img.alt = att.name;
                img.onclick = () => this.openImageModal(att.dataUrl);
                imgWrapper.appendChild(img);
                div.appendChild(imgWrapper);
            } else {
                const fileWrapper = document.createElement('div');
                fileWrapper.className = 'message-attachment file-attachment';
                fileWrapper.innerHTML = `
                    <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <span class="file-name">${att.name}</span>
                `;
                div.appendChild(fileWrapper);
            }
        });

        return div;
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
            button.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Copied`;
            setTimeout(() => {
                button.classList.remove('copied');
                button.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy:', err);
        });
    },

    navigateResponseHistory(messageIndex, direction) {
        const result = ChatHistory.navigateHistory(messageIndex, direction);
        if (result) {
            // Reload messages to update the display
            this.loadMessages(ChatHistory.getMessages());
        }
    },

    async regenerateMessage(messageIndex) {
        if (this.isGenerating) return;

        const messages = ChatHistory.getMessages();
        if (messageIndex < 0 || messageIndex >= messages.length) return;

        // Get messages up to (but not including) the assistant message for API call
        const messagesUpTo = messages.slice(0, messageIndex);

        // Get the last user message to regenerate
        const lastUserMsg = messagesUpTo.filter(m => m.role === 'user').pop();
        if (!lastUserMsg) return;

        // Prepare for regeneration - this stores the current branch
        ChatHistory.prepareRegenerate(messageIndex);

        // Clear UI from this message onwards and show streaming placeholder
        this.clearMessagesFrom(messageIndex);

        // Get selected model
        const selector = document.getElementById('model-selector');
        const [provider, modelId] = selector.value.split(':');
        const modelName = selector.options[selector.selectedIndex].text;

        // Disable input
        this.setGenerating(true);

        try {
            // Start streaming display
            this.startStreaming();

            // Prepare messages for API (with image support)
            const apiMessages = this.prepareMessagesForAPI(messagesUpTo);

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

            // Complete regeneration - add new response as new branch
            ChatHistory.completeRegenerate(messageIndex, fullResponse, modelName);

            // Reload UI to show updated message with history navigation
            this.loadMessages(ChatHistory.getMessages());
            Sidebar.refresh();

        } catch (error) {
            console.error('Regenerate error:', error);
            this.finishStreaming();
            this.addMessage('assistant', `Error: ${error.message}`);
        }

        this.setGenerating(false);
        this.focusInput();
    },

    prepareMessagesForAPI(messages) {
        return messages.map(m => {
            // Check if message has attachments
            if (m.attachments && m.attachments.length > 0) {
                const hasImages = m.attachments.some(a => a.isImage);
                const hasTextFiles = m.attachments.some(a => a.isTextFile || a.isPDF);

                // Build combined content
                let combinedText = '';
                const content = [];

                // Process text file attachments - add content to message text
                m.attachments.forEach(att => {
                    if (att.isTextFile && att.textContent) {
                        combinedText += `\n\n--- File: ${att.name} ---\n${att.textContent}\n--- End of ${att.name} ---\n`;
                    } else if (att.isPDF && att.dataUrl) {
                        // For PDF, inform the API that there's a PDF
                        // Some APIs (like Claude) can read PDF via base64
                        combinedText += `\n\n[Attached PDF file: ${att.name}]\n`;
                    }
                });

                // If there are images, use multimodal format
                if (hasImages) {
                    // Add images first
                    m.attachments.forEach(att => {
                        if (att.isImage && att.dataUrl) {
                            const base64Match = att.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
                            if (base64Match) {
                                content.push({
                                    type: 'image_url',
                                    image_url: {
                                        url: att.dataUrl
                                    }
                                });
                            }
                        }
                    });

                    // Add combined text content
                    const fullText = (m.content || '') + combinedText;
                    if (fullText.trim()) {
                        content.push({
                            type: 'text',
                            text: fullText
                        });
                    }

                    return {
                        role: m.role,
                        content: content
                    };
                }

                // Text files only - use simple text format
                const fullText = (m.content || '') + combinedText;
                return {
                    role: m.role,
                    content: fullText
                };
            }

            // Regular text message
            return {
                role: m.role,
                content: m.content
            };
        });
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
            <div class="assistant-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
            </div>
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
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="9" y="9" width="13" height="13" rx="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy
                    </button>
                    <button class="message-action-btn" onclick="ChatUI.regenerateMessage(${idx})">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M23 4v6h-6M1 20v-6h6"/>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                        Regenerate
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
        const hasFiles = this.pendingFiles.length > 0;

        if (!content && !hasFiles) return;
        if (this.isGenerating) return;

        // Ensure we have a chat
        if (!ChatHistory.currentChatId) {
            ChatHistory.createNewChat();
            Sidebar.refresh();
            this.showWelcome(false);
        }

        // Prepare attachments data
        const attachments = this.pendingFiles.map(f => ({
            name: f.name,
            size: f.size,
            type: f.type,
            isImage: f.isImage,
            isTextFile: f.isTextFile,
            isPDF: f.isPDF,
            dataUrl: f.dataUrl,
            textContent: f.textContent
        }));

        // Add user message with attachments
        this.addMessage('user', content, null, true, null, attachments);
        ChatHistory.addMessage('user', content, null, attachments);
        Sidebar.refresh();

        // Clear input and files
        this.inputField.value = '';
        this.inputField.style.height = 'auto';
        this.clearFiles();

        // Get selected model
        const selector = document.getElementById('model-selector');
        const [provider, modelId] = selector.value.split(':');
        const modelName = selector.options[selector.selectedIndex].text;

        // Disable input
        this.setGenerating(true);

        try {
            // Start streaming display
            this.startStreaming();

            // Prepare messages for API (with image support)
            const messages = this.prepareMessagesForAPI(ChatHistory.getMessages());

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
        this.sendButton.disabled = false; // Always enabled for stop functionality
        this.inputField.disabled = generating;

        // Update send button icon and style
        if (generating) {
            this.sendButton.classList.add('generating');
            // Stop icon (square)
            this.sendButton.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>`;
        } else {
            this.sendButton.classList.remove('generating');
            // Send icon (arrow)
            this.sendButton.innerHTML = `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
        }
    },

    stopGeneration() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.finishStreaming();
        this.setGenerating(false);
        this.focusInput();
    },

    editUserMessage(messageIndex) {
        if (this.isGenerating) return;

        const messages = ChatHistory.getMessages();
        if (messageIndex < 0 || messageIndex >= messages.length) return;

        const message = messages[messageIndex];
        if (message.role !== 'user') return;

        // Get the message element
        const messageElements = this.messagesContainer.querySelectorAll('.message');
        const msgElement = messageElements[messageIndex];
        if (!msgElement) return;

        // Find the bubble
        const bubble = msgElement.querySelector('.message-bubble');
        if (!bubble) return;

        // Hide original content and edit button
        const contentDiv = bubble.querySelector('.message-content');
        const editBtn = bubble.querySelector('.user-message-edit-btn');
        const attachmentsDiv = bubble.querySelector('.message-attachments');

        if (contentDiv) contentDiv.style.display = 'none';
        if (editBtn) editBtn.style.display = 'none';

        // Create edit form
        const editForm = document.createElement('div');
        editForm.className = 'user-message-edit-form';
        editForm.innerHTML = `
            <textarea class="edit-textarea">${message.content}</textarea>
            <div class="edit-form-actions">
                <button class="edit-cancel-btn" type="button">Cancel</button>
                <button class="edit-resend-btn" type="button">Resend</button>
            </div>
        `;

        bubble.appendChild(editForm);

        // Focus and auto-resize textarea
        const textarea = editForm.querySelector('.edit-textarea');
        textarea.focus();
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';

        textarea.addEventListener('input', () => {
            textarea.style.height = 'auto';
            textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        });

        // Bind button events
        editForm.querySelector('.edit-cancel-btn').addEventListener('click', () => {
            this.cancelEditUserMessage(msgElement, editForm, contentDiv, editBtn);
        });

        editForm.querySelector('.edit-resend-btn').addEventListener('click', () => {
            const newContent = textarea.value.trim();
            if (newContent) {
                this.resendUserMessage(messageIndex, newContent, message.attachments);
            }
        });

        // Escape key to cancel
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.cancelEditUserMessage(msgElement, editForm, contentDiv, editBtn);
            }
        });
    },

    cancelEditUserMessage(msgElement, editForm, contentDiv, editBtn) {
        // Remove edit form
        if (editForm && editForm.parentNode) {
            editForm.parentNode.removeChild(editForm);
        }

        // Show original content and edit button
        if (contentDiv) contentDiv.style.display = '';
        if (editBtn) editBtn.style.display = '';
    },

    async resendUserMessage(messageIndex, newContent, originalAttachments) {
        if (this.isGenerating) return;

        // Prepare for edit - this saves the current branch
        ChatHistory.prepareUserEdit(messageIndex);

        // Update the user message content
        const messages = ChatHistory.getMessages();
        const userMessage = messages[messageIndex];
        userMessage.content = newContent;
        userMessage.timestamp = new Date().toISOString();

        // Truncate messages to include only up to the edited user message
        ChatHistory.setMessages(messages.slice(0, messageIndex + 1));

        // Clear UI from this message onwards
        this.clearMessagesFrom(messageIndex);

        // Re-add the edited user message to UI
        this.addMessage('user', newContent, null, true, messageIndex, originalAttachments);

        // Get selected model
        const selector = document.getElementById('model-selector');
        const [provider, modelId] = selector.value.split(':');
        const modelName = selector.options[selector.selectedIndex].text;

        // Disable input
        this.setGenerating(true);

        try {
            // Start streaming display
            this.startStreaming();

            // Prepare messages for API (with image support)
            const apiMessages = this.prepareMessagesForAPI(ChatHistory.getMessages());

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

            // Reload UI to show updated message
            this.loadMessages(ChatHistory.getMessages());
            Sidebar.refresh();

        } catch (error) {
            console.error('Resend error:', error);
            this.finishStreaming();
            this.addMessage('assistant', `Error: ${error.message}`);
            ChatHistory.addMessage('assistant', `Error: ${error.message}`);
        }

        this.setGenerating(false);
        this.focusInput();
    },

    clearMessagesFrom(messageIndex) {
        // Remove all message elements from messageIndex onwards
        const messageElements = this.messagesContainer.querySelectorAll('.message');
        for (let i = messageIndex; i < messageElements.length; i++) {
            messageElements[i].remove();
        }
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
