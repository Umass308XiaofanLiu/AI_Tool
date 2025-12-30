// ==================== DeepSeek API Client ====================

const DeepSeekClient = {
    MODELS: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat', displayKey: 'deepseek-chat', color: '#6366f1' },
        { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', displayKey: 'deepseek-reasoner', color: '#6366f1' }
    ],

    async chat(messages, model, apiKey, onChunk) {
        if (!apiKey) {
            throw new Error('DeepSeek API key not set. Please configure it in Settings.');
        }

        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: true
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `DeepSeek API error: ${response.status}`);
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
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const json = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content;
                        if (content) {
                            fullContent += content;
                            if (onChunk) onChunk(content);
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
        try {
            const response = await fetch('https://api.deepseek.com/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    }
};
