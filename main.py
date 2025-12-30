#!/usr/bin/env python3
"""
AI Chat Client - A multi-model chat interface.

Supports:
- OpenAI (GPT-4, GPT-3.5, etc.)
- Anthropic (Claude 3)
- Google (Gemini)
- LM Studio (Local models)

Usage:
    python main.py
"""
import sys
import os

# Add src to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from PyQt6.QtWidgets import QApplication
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont

from src.ui.main_window import MainWindow


def main():
    """Main entry point."""
    # Enable high DPI scaling
    QApplication.setHighDpiScaleFactorRoundingPolicy(
        Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
    )

    app = QApplication(sys.argv)
    app.setApplicationName("AI Chat Client")
    app.setOrganizationName("AI Tools")

    # Set default font
    font = QFont("Segoe UI", 10)
    if not font.exactMatch():
        font = QFont("SF Pro Display", 10)
        if not font.exactMatch():
            font = QFont("Helvetica Neue", 10)
    app.setFont(font)

    # Create and show main window
    window = MainWindow()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
