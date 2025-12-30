"""UI Styles for AI Chat Client - ChatGPT/Claude inspired dark theme."""

DARK_THEME = """
/* Main Window */
QMainWindow {
    background-color: #212121;
    color: #ECECEC;
}

/* Sidebar */
#sidebar {
    background-color: #171717;
    border-right: 1px solid #2D2D2D;
}

#sidebar QPushButton {
    background-color: transparent;
    color: #ECECEC;
    border: 1px solid #4A4A4A;
    border-radius: 8px;
    padding: 12px 16px;
    text-align: left;
    font-size: 14px;
}

#sidebar QPushButton:hover {
    background-color: #2D2D2D;
}

#sidebar QPushButton#newChatBtn {
    background-color: transparent;
    border: 1px dashed #4A4A4A;
    margin: 8px;
}

#sidebar QPushButton#newChatBtn:hover {
    background-color: #2D2D2D;
    border-style: solid;
}

/* Chat list */
#chatList {
    background-color: transparent;
    border: none;
    padding: 4px;
}

#chatList::item {
    background-color: transparent;
    color: #ECECEC;
    border-radius: 8px;
    padding: 12px;
    margin: 2px 8px;
}

#chatList::item:hover {
    background-color: #2D2D2D;
}

#chatList::item:selected {
    background-color: #343541;
}

/* Chat Area */
#chatArea {
    background-color: #212121;
    border: none;
}

#chatScroll {
    background-color: #212121;
    border: none;
}

#chatScroll QScrollBar:vertical {
    background-color: #212121;
    width: 8px;
    border-radius: 4px;
}

#chatScroll QScrollBar::handle:vertical {
    background-color: #4A4A4A;
    border-radius: 4px;
    min-height: 40px;
}

#chatScroll QScrollBar::handle:vertical:hover {
    background-color: #5A5A5A;
}

#chatScroll QScrollBar::add-line:vertical,
#chatScroll QScrollBar::sub-line:vertical {
    height: 0px;
}

/* Message Bubbles */
#userMessage {
    background-color: #343541;
    color: #ECECEC;
    border-radius: 16px;
    padding: 16px 20px;
    margin: 8px 60px 8px 120px;
}

#assistantMessage {
    background-color: #444654;
    color: #ECECEC;
    border-radius: 16px;
    padding: 16px 20px;
    margin: 8px 120px 8px 60px;
}

/* Input Area */
#inputArea {
    background-color: #212121;
    border-top: 1px solid #2D2D2D;
    padding: 16px;
}

#inputContainer {
    background-color: #40414F;
    border-radius: 16px;
    border: 1px solid #565869;
    padding: 8px;
}

#inputContainer:focus-within {
    border-color: #8E8EA0;
}

#messageInput {
    background-color: transparent;
    color: #ECECEC;
    border: none;
    font-size: 14px;
    padding: 8px 12px;
}

#messageInput:focus {
    outline: none;
}

#sendBtn {
    background-color: #10A37F;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: bold;
}

#sendBtn:hover {
    background-color: #1A7F64;
}

#sendBtn:disabled {
    background-color: #4A4A4A;
    color: #8E8EA0;
}

/* Model Selector */
#modelSelector {
    background-color: #40414F;
    color: #ECECEC;
    border: 1px solid #565869;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
}

#modelSelector:hover {
    border-color: #8E8EA0;
}

#modelSelector::drop-down {
    border: none;
    padding-right: 8px;
}

#modelSelector QAbstractItemView {
    background-color: #40414F;
    color: #ECECEC;
    border: 1px solid #565869;
    border-radius: 8px;
    selection-background-color: #343541;
}

/* Settings Button */
#settingsBtn {
    background-color: transparent;
    color: #8E8EA0;
    border: none;
    border-radius: 8px;
    padding: 8px;
    font-size: 18px;
}

#settingsBtn:hover {
    background-color: #2D2D2D;
    color: #ECECEC;
}

/* Header */
#header {
    background-color: #212121;
    border-bottom: 1px solid #2D2D2D;
    padding: 12px 16px;
}

#headerTitle {
    color: #ECECEC;
    font-size: 16px;
    font-weight: bold;
}

/* Settings Dialog */
QDialog {
    background-color: #212121;
    color: #ECECEC;
}

QDialog QLabel {
    color: #ECECEC;
    font-size: 14px;
}

QDialog QLineEdit {
    background-color: #40414F;
    color: #ECECEC;
    border: 1px solid #565869;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
}

QDialog QLineEdit:focus {
    border-color: #10A37F;
}

QDialog QPushButton {
    background-color: #10A37F;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: bold;
}

QDialog QPushButton:hover {
    background-color: #1A7F64;
}

QDialog QPushButton#cancelBtn {
    background-color: #4A4A4A;
}

QDialog QPushButton#cancelBtn:hover {
    background-color: #5A5A5A;
}

QDialog QPushButton#connectBtn {
    background-color: #2563EB;
}

QDialog QPushButton#connectBtn:hover {
    background-color: #1D4ED8;
}

/* Tabs */
QTabWidget::pane {
    border: 1px solid #2D2D2D;
    border-radius: 8px;
    background-color: #171717;
}

QTabBar::tab {
    background-color: #2D2D2D;
    color: #8E8EA0;
    border: none;
    padding: 12px 24px;
    margin-right: 4px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
}

QTabBar::tab:selected {
    background-color: #171717;
    color: #ECECEC;
}

QTabBar::tab:hover:!selected {
    background-color: #343541;
}

/* Checkboxes */
QCheckBox {
    color: #ECECEC;
    spacing: 8px;
}

QCheckBox::indicator {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    border: 2px solid #565869;
    background-color: transparent;
}

QCheckBox::indicator:checked {
    background-color: #10A37F;
    border-color: #10A37F;
}

QCheckBox::indicator:hover {
    border-color: #8E8EA0;
}

/* Group Box */
QGroupBox {
    color: #ECECEC;
    font-size: 14px;
    font-weight: bold;
    border: 1px solid #2D2D2D;
    border-radius: 8px;
    margin-top: 16px;
    padding-top: 16px;
}

QGroupBox::title {
    subcontrol-origin: margin;
    left: 12px;
    padding: 0 8px;
}

/* Scroll Area */
QScrollArea {
    background-color: transparent;
    border: none;
}

/* Status Label */
#statusLabel {
    color: #8E8EA0;
    font-size: 12px;
    padding: 4px;
}

#statusLabel[status="success"] {
    color: #10A37F;
}

#statusLabel[status="error"] {
    color: #EF4444;
}

/* Welcome Screen */
#welcomeScreen {
    background-color: #212121;
}

#welcomeTitle {
    color: #ECECEC;
    font-size: 32px;
    font-weight: bold;
}

#welcomeSubtitle {
    color: #8E8EA0;
    font-size: 16px;
}
"""

LIGHT_THEME = """
/* Light theme - similar structure but with light colors */
QMainWindow {
    background-color: #FFFFFF;
    color: #1A1A1A;
}

#sidebar {
    background-color: #F7F7F8;
    border-right: 1px solid #E5E5E5;
}

#sidebar QPushButton {
    background-color: transparent;
    color: #1A1A1A;
    border: 1px solid #E5E5E5;
    border-radius: 8px;
    padding: 12px 16px;
    text-align: left;
    font-size: 14px;
}

#sidebar QPushButton:hover {
    background-color: #ECECEC;
}

#chatArea {
    background-color: #FFFFFF;
}

#userMessage {
    background-color: #F7F7F8;
    color: #1A1A1A;
    border-radius: 16px;
    padding: 16px 20px;
    margin: 8px 60px 8px 120px;
}

#assistantMessage {
    background-color: #FFFFFF;
    color: #1A1A1A;
    border: 1px solid #E5E5E5;
    border-radius: 16px;
    padding: 16px 20px;
    margin: 8px 120px 8px 60px;
}

#inputContainer {
    background-color: #FFFFFF;
    border: 1px solid #E5E5E5;
    border-radius: 16px;
    padding: 8px;
}

#messageInput {
    background-color: transparent;
    color: #1A1A1A;
    border: none;
    font-size: 14px;
    padding: 8px 12px;
}
"""


def get_theme(theme_name: str = "dark") -> str:
    """Get stylesheet for the specified theme."""
    if theme_name == "light":
        return LIGHT_THEME
    return DARK_THEME
