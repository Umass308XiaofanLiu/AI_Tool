// ==================== Google Gemini API Client ====================

const GeminiClient = {
    MODELS: [
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', displayKey: 'gemini-2.5-flash-lite', color: '#4285f4' },
        { id: 'gemini-3-flash', name: 'Gemini 3 Flash', displayKey: 'gemini-3-flash', color: '#4285f4' },
        { id: 'gemini-3-pro', name: 'Gemini 3 Pro', displayKey: 'gemini-3-pro', color: '#4285f4' }
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
