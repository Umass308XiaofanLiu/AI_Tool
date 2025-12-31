// ==================== Markdown Module ====================
// Simple markdown parser for chat messages with LaTeX support

const MarkdownParser = {
    parse(text) {
        if (!text) return '';

        // Store LaTeX expressions to protect them from other parsing
        // Use a format that won't be affected by markdown processing
        const latexBlocks = [];
        const latexInlines = [];

        // Extract block LaTeX - \[...\] format (must be done before escaping)
        let html = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, latex) => {
            const id = `%%LATEXBLOCK${latexBlocks.length}%%`;
            latexBlocks.push(latex.trim());
            return id;
        });

        // Extract block LaTeX - $$...$$ format
        html = html.replace(/\$\$([\s\S]*?)\$\$/g, (match, latex) => {
            const id = `%%LATEXBLOCK${latexBlocks.length}%%`;
            latexBlocks.push(latex.trim());
            return id;
        });

        // Extract inline LaTeX - \(...\) format
        html = html.replace(/\\\(([\s\S]*?)\\\)/g, (match, latex) => {
            const id = `%%LATEXINLINE${latexInlines.length}%%`;
            latexInlines.push(latex.trim());
            return id;
        });

        // Extract inline LaTeX - $...$ format (but not $$)
        html = html.replace(/\$([^\$\n]+?)\$/g, (match, latex) => {
            const id = `%%LATEXINLINE${latexInlines.length}%%`;
            latexInlines.push(latex.trim());
            return id;
        });

        // Now escape HTML
        html = this.escapeHtml(html);

        // Code blocks (```language\ncode```)
        html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'code';
            const codeId = 'code-' + Math.random().toString(36).substr(2, 9);
            return `<div class="code-block-wrapper">
                <div class="code-block-header">
                    <span class="code-language">${language}</span>
                    <button class="code-copy-btn" onclick="MarkdownParser.copyCode('${codeId}')">Copy</button>
                </div>
                <pre><code id="${codeId}" class="code-block language-${language}">${code.trim()}</code></pre>
            </div>`;
        });

        // Inline code (`code`)
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Bold (**text** or __text__)
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');

        // Italic (*text* or _text_) - be careful not to affect LaTeX placeholders
        html = html.replace(/(?<![%\w])\*([^*]+)\*(?![%\w])/g, '<em>$1</em>');
        html = html.replace(/(?<![%\w])_([^_]+)_(?![%\w])/g, '<em>$1</em>');

        // Links [text](url)
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

        // Headers
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

        // Unordered lists
        html = html.replace(/^[\-\*] (.+)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

        // Ordered lists
        html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

        // Blockquotes
        html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

        // Horizontal rules
        html = html.replace(/^---$/gm, '<hr>');

        // Line breaks (preserve newlines)
        html = html.replace(/\n/g, '<br>');

        // Clean up multiple <br> after block elements
        html = html.replace(/(<\/pre>)<br>/g, '$1');
        html = html.replace(/(<\/div>)<br>/g, '$1');
        html = html.replace(/(<\/h[1-3]>)<br>/g, '$1');
        html = html.replace(/(<\/ul>)<br>/g, '$1');
        html = html.replace(/(<\/blockquote>)<br>/g, '$1');

        // Restore LaTeX block expressions
        latexBlocks.forEach((latex, i) => {
            const rendered = this.renderLatex(latex, true);
            html = html.replace(`%%LATEXBLOCK${i}%%`, `<div class="latex-block">${rendered}</div>`);
        });

        // Restore LaTeX inline expressions
        latexInlines.forEach((latex, i) => {
            const rendered = this.renderLatex(latex, false);
            html = html.replace(`%%LATEXINLINE${i}%%`, `<span class="latex-inline">${rendered}</span>`);
        });

        return html;
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    renderLatex(latex, displayMode) {
        // Check if KaTeX is available
        if (typeof katex !== 'undefined') {
            try {
                return katex.renderToString(latex, {
                    displayMode: displayMode,
                    throwOnError: false,
                    output: 'html'
                });
            } catch (e) {
                console.warn('KaTeX error:', e);
                return `<span class="latex-error">${this.escapeHtml(latex)}</span>`;
            }
        }
        // Fallback if KaTeX not loaded - just show the raw LaTeX
        return displayMode
            ? `<div class="latex-fallback">$$${this.escapeHtml(latex)}$$</div>`
            : `<span class="latex-fallback">$${this.escapeHtml(latex)}$</span>`;
    },

    copyCode(codeId) {
        const codeElement = document.getElementById(codeId);
        if (codeElement) {
            const text = codeElement.textContent;
            navigator.clipboard.writeText(text).then(() => {
                // Find the button and update its text
                const btn = codeElement.closest('.code-block-wrapper').querySelector('.code-copy-btn');
                if (btn) {
                    const originalText = btn.textContent;
                    btn.textContent = 'Copied!';
                    setTimeout(() => {
                        btn.textContent = originalText;
                    }, 2000);
                }
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        }
    }
};
