// ==================== Anthropic Claude API Client ====================

const ClaudeClient = {
    MODELS: [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', displayKey: 'claude-3-opus' },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', displayKey: 'claude-3-sonnet' },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', displayKey: 'claude-3-haiku' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', displayKey: 'claude-3.5-sonnet' },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', displayKey: 'claude-3.5-haiku' }
    ],

    async chat(messages, model, apiKey, onChunk) {
        if (!apiKey) {
            throw new Error('Anthropic API key not set. Please configure it in Settings.');
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

        // Note: Direct browser calls to Anthropic API may be blocked by CORS
        // In production, you'd use a proxy server
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true'
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
