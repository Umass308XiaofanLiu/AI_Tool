"""Chat widget components for AI Chat Client."""
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTextEdit,
    QScrollArea, QFrame, QPushButton, QSizePolicy
)
from PyQt6.QtCore import Qt, pyqtSignal, QTimer
from PyQt6.QtGui import QFont, QTextCursor
import markdown


class MessageWidget(QFrame):
    """Widget for displaying a single chat message."""

    def __init__(self, role: str, content: str, model: str = None, parent=None):
        super().__init__(parent)
        self.role = role
        self.setup_ui(content, model)

    def setup_ui(self, content: str, model: str = None):
        """Setup the message UI."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 12, 16, 12)
        layout.setSpacing(8)

        # Header with role/model indicator
        header_layout = QHBoxLayout()

        role_label = QLabel("You" if self.role == "user" else "Assistant")
        role_label.setFont(QFont("", 12, QFont.Weight.Bold))
        header_layout.addWidget(role_label)

        if model and self.role == "assistant":
            model_label = QLabel(f"({model})")
            model_label.setStyleSheet("color: #8E8EA0; font-size: 11px;")
            header_layout.addWidget(model_label)

        header_layout.addStretch()
        layout.addLayout(header_layout)

        # Message content
        content_label = QLabel()
        content_label.setWordWrap(True)
        content_label.setTextFormat(Qt.TextFormat.RichText)
        content_label.setOpenExternalLinks(True)

        # Convert markdown to HTML
        html_content = markdown.markdown(
            content,
            extensions=['fenced_code', 'codehilite', 'tables']
        )
        content_label.setText(html_content)
        content_label.setStyleSheet("""
            QLabel {
                color: #ECECEC;
                font-size: 14px;
                line-height: 1.6;
            }
        """)

        layout.addWidget(content_label)

        # Set object name for styling
        self.setObjectName("userMessage" if self.role == "user" else "assistantMessage")


class StreamingMessageWidget(QFrame):
    """Widget for displaying a streaming message."""

    def __init__(self, role: str, parent=None):
        super().__init__(parent)
        self.role = role
        self.content = ""
        self.setup_ui()

    def setup_ui(self):
        """Setup the streaming message UI."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 12, 16, 12)
        layout.setSpacing(8)

        # Header
        header_layout = QHBoxLayout()
        role_label = QLabel("Assistant")
        role_label.setFont(QFont("", 12, QFont.Weight.Bold))
        header_layout.addWidget(role_label)
        header_layout.addStretch()
        layout.addLayout(header_layout)

        # Content label for streaming
        self.content_label = QLabel("")
        self.content_label.setWordWrap(True)
        self.content_label.setTextFormat(Qt.TextFormat.PlainText)
        self.content_label.setStyleSheet("""
            QLabel {
                color: #ECECEC;
                font-size: 14px;
                line-height: 1.6;
            }
        """)
        layout.addWidget(self.content_label)

        self.setObjectName("assistantMessage")

    def append_text(self, text: str):
        """Append text to the streaming message."""
        self.content += text
        self.content_label.setText(self.content)

    def finalize(self):
        """Finalize the message by converting to HTML."""
        html_content = markdown.markdown(
            self.content,
            extensions=['fenced_code', 'codehilite', 'tables']
        )
        self.content_label.setTextFormat(Qt.TextFormat.RichText)
        self.content_label.setText(html_content)

    def get_content(self) -> str:
        """Get the current content."""
        return self.content


class ChatDisplayWidget(QScrollArea):
    """Widget for displaying chat messages."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("chatScroll")
        self.setup_ui()
        self.streaming_widget = None

    def setup_ui(self):
        """Setup the chat display UI."""
        self.setWidgetResizable(True)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setFrameShape(QFrame.Shape.NoFrame)

        # Container for messages
        self.container = QWidget()
        self.container.setObjectName("chatArea")
        self.layout = QVBoxLayout(self.container)
        self.layout.setContentsMargins(0, 16, 0, 16)
        self.layout.setSpacing(8)
        self.layout.addStretch()

        self.setWidget(self.container)

    def add_message(self, role: str, content: str, model: str = None):
        """Add a message to the display."""
        # Remove stretch
        if self.layout.count() > 0:
            item = self.layout.takeAt(self.layout.count() - 1)
            if item.spacerItem():
                pass  # Removed stretch

        message = MessageWidget(role, content, model)
        self.layout.addWidget(message)
        self.layout.addStretch()

        # Scroll to bottom
        QTimer.singleShot(50, self._scroll_to_bottom)

    def start_streaming(self) -> StreamingMessageWidget:
        """Start a streaming message."""
        # Remove stretch
        if self.layout.count() > 0:
            item = self.layout.takeAt(self.layout.count() - 1)

        self.streaming_widget = StreamingMessageWidget("assistant")
        self.layout.addWidget(self.streaming_widget)
        self.layout.addStretch()

        return self.streaming_widget

    def finish_streaming(self):
        """Finalize the streaming message."""
        if self.streaming_widget:
            self.streaming_widget.finalize()
            self.streaming_widget = None
            QTimer.singleShot(50, self._scroll_to_bottom)

    def _scroll_to_bottom(self):
        """Scroll to the bottom of the chat."""
        scrollbar = self.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())

    def clear_messages(self):
        """Clear all messages."""
        while self.layout.count():
            item = self.layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()
        self.layout.addStretch()

    def load_messages(self, messages: list):
        """Load messages from history."""
        self.clear_messages()
        for msg in messages:
            self.add_message(
                msg.get("role", "user"),
                msg.get("content", ""),
                msg.get("model")
            )


class WelcomeWidget(QWidget):
    """Welcome screen shown when no chat is active."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("welcomeScreen")
        self.setup_ui()

    def setup_ui(self):
        """Setup the welcome UI."""
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignmentFlag.AlignCenter)

        # Logo/Title
        title = QLabel("AI Chat Client")
        title.setObjectName("welcomeTitle")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(title)

        # Subtitle
        subtitle = QLabel("Select a chat or start a new conversation")
        subtitle.setObjectName("welcomeSubtitle")
        subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(subtitle)


class ChatInputWidget(QWidget):
    """Widget for chat input."""

    message_sent = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setObjectName("inputArea")
        self.setup_ui()

    def setup_ui(self):
        """Setup the input UI."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(60, 16, 60, 24)

        # Input container
        container = QFrame()
        container.setObjectName("inputContainer")
        container_layout = QHBoxLayout(container)
        container_layout.setContentsMargins(8, 4, 8, 4)
        container_layout.setSpacing(8)

        # Text input
        self.input_field = QTextEdit()
        self.input_field.setObjectName("messageInput")
        self.input_field.setPlaceholderText("Type your message...")
        self.input_field.setMaximumHeight(150)
        self.input_field.setMinimumHeight(40)
        self.input_field.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)
        self.input_field.textChanged.connect(self._adjust_height)
        container_layout.addWidget(self.input_field)

        # Send button
        self.send_btn = QPushButton("Send")
        self.send_btn.setObjectName("sendBtn")
        self.send_btn.clicked.connect(self._send_message)
        self.send_btn.setFixedSize(80, 40)
        container_layout.addWidget(self.send_btn, alignment=Qt.AlignmentFlag.AlignBottom)

        layout.addWidget(container)

        # Install event filter for Enter key
        self.input_field.installEventFilter(self)

    def eventFilter(self, obj, event):
        """Handle key events for Enter to send."""
        from PyQt6.QtCore import QEvent
        from PyQt6.QtGui import QKeyEvent

        if obj == self.input_field and event.type() == QEvent.Type.KeyPress:
            if event.key() == Qt.Key.Key_Return and not event.modifiers() & Qt.KeyboardModifier.ShiftModifier:
                self._send_message()
                return True
        return super().eventFilter(obj, event)

    def _adjust_height(self):
        """Adjust input height based on content."""
        doc_height = self.input_field.document().size().height()
        new_height = min(max(40, int(doc_height) + 16), 150)
        self.input_field.setFixedHeight(new_height)

    def _send_message(self):
        """Send the current message."""
        text = self.input_field.toPlainText().strip()
        if text:
            self.message_sent.emit(text)
            self.input_field.clear()

    def set_enabled(self, enabled: bool):
        """Enable or disable the input."""
        self.input_field.setEnabled(enabled)
        self.send_btn.setEnabled(enabled)
        if not enabled:
            self.send_btn.setText("...")
        else:
            self.send_btn.setText("Send")

    def focus_input(self):
        """Focus the input field."""
        self.input_field.setFocus()
