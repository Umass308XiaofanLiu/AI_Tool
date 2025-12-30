// ==================== Google Gemini API Client ====================

const GeminiClient = {
    MODELS: [
        { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', displayKey: 'gemini-2.5-flash-lite', color: '#4285f4' },
        { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', displayKey: 'gemini-3-flash-preview', color: '#4285f4' },
        { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', displayKey: 'gemini-3-pro-preview', color: '#4285f4' }
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
                systemInstruction = typeof msg.content === 'string' ? msg.content : '';
            } else {
                const parts = [];

                // Handle multimodal content (array format with images)
                if (Array.isArray(msg.content)) {
                    for (const item of msg.content) {
                        if (item.type === 'text') {
                            parts.push({ text: item.text });
                        } else if (item.type === 'image_url' && item.image_url?.url) {
                            // Extract base64 data from data URL
                            const dataUrl = item.image_url.url;
                            const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
                            if (match) {
                                parts.push({
                                    inlineData: {
                                        mimeType: match[1],
                                        data: match[2]
                                    }
                                });
                            }
                        }
                    }
                } else {
                    // Simple text content
                    parts.push({ text: msg.content });
                }

                contents.push({
                    role: msg.role === 'assistant' ? 'model' : 'user',
                    parts: parts
                });
            }
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

        const body = {
            contents,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192
            }
        };

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
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) {
                            fullContent += text;
                            if (onChunk) onChunk(text);
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }

        // Process remaining buffer
        if (buffer.startsWith('data: ')) {
            try {
                const data = JSON.parse(buffer.slice(6));
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    fullContent += text;
                    if (onChunk) onChunk(text);
                }
            } catch (e) {
                // Ignore
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
