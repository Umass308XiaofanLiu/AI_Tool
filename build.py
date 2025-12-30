#!/usr/bin/env python3
"""
Build script for AI Chat Client.

This script assembles all JavaScript modules and CSS files into a single HTML file
that can be run directly in a browser.

Usage:
    python build.py

Output:
    dist/AI_Chat_Client.html
"""

import os
import sys
from pathlib import Path


def read_file(filepath: str) -> str:
    """Read file content."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()


def get_project_root() -> Path:
    """Get project root directory."""
    return Path(__file__).parent


def collect_js_files(src_dir: Path) -> str:
    """Collect all JavaScript files in order."""
    js_files = [
        # Utils (must come first)
        src_dir / 'js' / 'utils' / 'storage.js',
        src_dir / 'js' / 'utils' / 'markdown.js',

        # API clients
        src_dir / 'js' / 'api' / 'openai.js',
        src_dir / 'js' / 'api' / 'claude.js',
        src_dir / 'js' / 'api' / 'gemini.js',
        src_dir / 'js' / 'api' / 'deepseek.js',
        src_dir / 'js' / 'api' / 'lmstudio.js',

        # UI components
        src_dir / 'js' / 'ui' / 'chatHistory.js',
        src_dir / 'js' / 'ui' / 'sidebar.js',
        src_dir / 'js' / 'ui' / 'chat.js',
        src_dir / 'js' / 'ui' / 'settings.js',
        src_dir / 'js' / 'ui' / 'main.js',
    ]

    combined_js = []
    for js_file in js_files:
        if js_file.exists():
            print(f"  Adding: {js_file.relative_to(src_dir)}")
            combined_js.append(f"// === {js_file.name} ===")
            combined_js.append(read_file(str(js_file)))
            combined_js.append("")
        else:
            print(f"  Warning: {js_file} not found")

    return '\n'.join(combined_js)


def collect_css_files(src_dir: Path) -> str:
    """Collect all CSS files."""
    css_dir = src_dir / 'css'
    combined_css = []

    for css_file in sorted(css_dir.glob('*.css')):
        print(f"  Adding: {css_file.relative_to(src_dir)}")
        combined_css.append(f"/* === {css_file.name} === */")
        combined_css.append(read_file(str(css_file)))
        combined_css.append("")

    return '\n'.join(combined_css)


def build():
    """Build the final HTML file."""
    print("=" * 50)
    print("AI Chat Client - Build Script")
    print("=" * 50)

    root = get_project_root()
    src_dir = root / 'src'
    dist_dir = root / 'dist'
    template_file = src_dir / 'html' / 'template.html'

    # Ensure dist directory exists
    dist_dir.mkdir(exist_ok=True)

    # Read template
    print("\n[1/4] Reading template...")
    if not template_file.exists():
        print(f"Error: Template file not found: {template_file}")
        sys.exit(1)
    template = read_file(str(template_file))

    # Collect CSS
    print("\n[2/4] Collecting CSS files...")
    css_content = collect_css_files(src_dir)

    # Collect JavaScript
    print("\n[3/4] Collecting JavaScript files...")
    js_content = collect_js_files(src_dir)

    # Replace placeholders
    print("\n[4/4] Assembling final HTML...")
    final_html = template.replace('/* {{CSS_PLACEHOLDER}} */', css_content)
    final_html = final_html.replace('/* {{JS_PLACEHOLDER}} */', js_content)

    # Write output
    output_file = dist_dir / 'AI_Chat_Client.html'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(final_html)

    print("\n" + "=" * 50)
    print(f"Build complete!")
    print(f"Output: {output_file}")
    print(f"File size: {output_file.stat().st_size / 1024:.1f} KB")
    print("=" * 50)
    print("\nYou can now open the HTML file in your browser.")


if __name__ == '__main__':
    build()
