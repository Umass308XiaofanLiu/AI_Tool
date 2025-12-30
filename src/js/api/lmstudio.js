// ==================== LM Studio Local API Client ====================

const LMStudioClient = {
    async chat(messages, model, baseUrl, onChunk) {
        if (!baseUrl) {
            baseUrl = 'http://localhost:1234';
        }

        const response = await fetch(`${baseUrl}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model || 'local-model',
                messages: messages,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`LM Studio error: ${response.status}. Make sure LM Studio is running.`);
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

    async getModels(baseUrl) {
        if (!baseUrl) {
            baseUrl = 'http://localhost:1234';
        }

        try {
            const response = await fetch(`${baseUrl}/v1/models`);
            if (!response.ok) {
                throw new Error('Failed to fetch models');
            }

            const data = await response.json();
            return data.data?.map(m => ({
                id: m.id,
                name: m.id
            })) || [];
        } catch (e) {
            console.error('Failed to get LM Studio models:', e);
            return [];
        }
    },

    async validate(baseUrl) {
        if (!baseUrl) {
            baseUrl = 'http://localhost:1234';
        }

        try {
            const response = await fetch(`${baseUrl}/v1/models`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    }
};
