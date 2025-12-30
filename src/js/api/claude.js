// ==================== Anthropic Claude API Client ====================

const ClaudeClient = {
    MODELS: [
        { id: 'claude-haiku-4-5-20241022', name: 'Claude Haiku 4.5', displayKey: 'claude-haiku-4.5', color: '#d97706' },
        { id: 'claude-sonnet-4-5-20241022', name: 'Claude Sonnet 4.5', displayKey: 'claude-sonnet-4.5', color: '#d97706' },
        { id: 'claude-opus-4-5-20241022', name: 'Claude Opus 4.5', displayKey: 'claude-opus-4.5', color: '#d97706' }
    ],

    async chat(messages, model, apiKey, onChunk, proxyUrl) {
        if (!apiKey) {
            throw new Error('Anthropic API key not set. Please configure it in Settings.');
        }

        if (!proxyUrl) {
            throw new Error('Claude API requires a CORS proxy URL. Please configure it in Settings.');
        }

        // Extract system message
        let systemMessage = '';
        const chatMessages = [];

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemMessage = msg.content;
            } else {
                chatMessages.push(msg);
            }
        }

        const body = {
            model: model,
            max_tokens: 4096,
            messages: chatMessages,
            stream: true
        };

        if (systemMessage) {
            body.system = systemMessage;
        }

        // Use CORS proxy for browser requests
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Claude API error: ${response.status}`);
        }

        return this.streamResponse(response, onChunk);
    },

    async streamResponse(response, onChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const json = JSON.parse(line.slice(6));
                        if (json.type === 'content_block_delta') {
                            const content = json.delta?.text;
                            if (content) {
                                fullContent += content;
                                if (onChunk) onChunk(content);
                            }
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }

        return fullContent;
    },

    async validate(apiKey) {
        // Simple validation - just check if key format is correct
        return apiKey && apiKey.startsWith('sk-ant-');
    }
};
