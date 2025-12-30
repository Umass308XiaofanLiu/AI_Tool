// ==================== Google Gemini API Client ====================

const GeminiClient = {
    MODELS: [
        { id: 'gemini-pro', name: 'Gemini Pro', displayKey: 'gemini-pro' },
        { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', displayKey: 'gemini-1.5-pro' },
        { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', displayKey: 'gemini-1.5-flash' },
        { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', displayKey: 'gemini-2.0-flash' }
    ],

    async chat(messages, model, apiKey, onChunk) {
        if (!apiKey) {
            throw new Error('Gemini API key not set. Please configure it in Settings.');
        }

        // Convert messages to Gemini format
        const contents = [];
        let systemInstruction = '';

        for (const msg of messages) {
            if (msg.role === 'system') {
                systemInstruction = msg.content;
            } else {
                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: msg.content }]
                });
            }
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}`;

        const body = { contents };
        if (systemInstruction) {
            body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
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

            // Gemini returns JSON array chunks
            try {
                // Try to parse as JSON array
                const jsonMatch = buffer.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                    const data = JSON.parse(jsonMatch[0]);
                    for (const item of data) {
                        const text = item.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            fullContent += text;
                            if (onChunk) onChunk(text);
                        }
                    }
                    buffer = buffer.slice(jsonMatch.index + jsonMatch[0].length);
                }
            } catch (e) {
                // Keep buffering
            }
        }

        // Handle any remaining content
        if (buffer.trim()) {
            try {
                const data = JSON.parse(buffer);
                if (Array.isArray(data)) {
                    for (const item of data) {
                        const text = item.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text && !fullContent.includes(text)) {
                            fullContent += text;
                            if (onChunk) onChunk(text);
                        }
                    }
                }
            } catch (e) {
                // Ignore parse errors
            }
        }

        return fullContent;
    },

    async validate(apiKey) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            const response = await fetch(url);
            return response.ok;
        } catch (e) {
            return false;
        }
    }
};
