// ==================== OpenAI API Client ====================

const OpenAIClient = {
    MODELS: [
        { id: 'gpt-5-nano', name: 'GPT-5 Nano', displayKey: 'gpt-5-nano', color: '#10a37f' },
        { id: 'gpt-5-mini', name: 'GPT-5 Mini', displayKey: 'gpt-5-mini', color: '#10a37f' },
        { id: 'gpt-5.2', name: 'GPT-5.2', displayKey: 'gpt-5.2', color: '#10a37f' }
    ],

    async chat(messages, model, apiKey, onChunk) {
        if (!apiKey) {
            throw new Error('OpenAI API key not set. Please configure it in Settings.');
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
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
            const response = await fetch('https://api.openai.com/v1/models', {
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
