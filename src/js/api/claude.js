// ==================== Anthropic Claude API Client ====================

const ClaudeClient = {
    MODELS: [
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', displayKey: 'claude-3.5-haiku', color: '#d97706' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', displayKey: 'claude-3.5-sonnet', color: '#d97706' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', displayKey: 'claude-3-opus', color: '#d97706' }
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
                chatMessages.push({
                    role: msg.role,
                    content: msg.content
                });
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
        // The proxy should forward to https://api.anthropic.com/v1/messages
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
            throw new Error(error.error?.message || `Claude API error: ${response.status} - model: ${model}`);
        }

        return this.streamResponse(response, onChunk);
    },

    async streamResponse(response, onChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') continue;

                    try {
                        const json = JSON.parse(data);
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
