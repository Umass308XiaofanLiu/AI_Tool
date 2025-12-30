"""Main window for AI Chat Client."""
from PyQt6.QtWidgets import (
    QMainWindow, QWidget, QHBoxLayout, QVBoxLayout,
    QComboBox, QLabel, QStackedWidget, QMessageBox, QFrame
)
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from PyQt6.QtGui import QFont

from .sidebar import SidebarWidget
from .chat_widget import ChatDisplayWidget, ChatInputWidget, WelcomeWidget
from .settings_dialog import SettingsDialog
from .styles import get_theme
from ..utils.config_manager import ConfigManager
from ..utils.chat_history import ChatHistoryManager
from ..models.openai_client import OpenAIClient
from ..models.claude_client import ClaudeClient
from ..models.gemini_client import GeminiClient
from ..models.lmstudio_client import LMStudioClient


class ChatWorker(QThread):
    """Worker thread for handling chat requests."""

    chunk_received = pyqtSignal(str)
    finished = pyqtSignal(str)
    error = pyqtSignal(str)

    def __init__(self, client, messages, model, stream=True):
        super().__init__()
        self.client = client
        self.messages = messages
        self.model = model
        self.stream = stream
        self._full_response = ""

    def run(self):
        """Run the chat request."""
        try:
            if self.stream:
                response_gen = self.client.chat(self.messages, self.model, stream=True)
                for chunk in response_gen:
                    self._full_response += chunk
                    self.chunk_received.emit(chunk)
                self.finished.emit(self._full_response)
            else:
                response = self.client.chat(self.messages, self.model, stream=False)
                self.finished.emit(response)
        except Exception as e:
            self.error.emit(str(e))


class MainWindow(QMainWindow):
    """Main application window."""

    def __init__(self):
        super().__init__()
        self.setWindowTitle("AI Chat Client")
        self.setMinimumSize(1200, 800)

        # Initialize managers
        self.config_manager = ConfigManager()
        self.chat_manager = ChatHistoryManager()

        # Initialize model clients
        self.clients = {}
        self._init_clients()

        # Current state
        self.current_worker = None

        # Setup UI
        self.setup_ui()
        self.apply_theme()

        # Connect signals
        self._connect_signals()

    def _init_clients(self):
        """Initialize model clients."""
        self.clients = {
            "openai": OpenAIClient(self.config_manager.get_api_key("openai")),
            "anthropic": ClaudeClient(self.config_manager.get_api_key("anthropic")),
            "gemini": GeminiClient(self.config_manager.get_api_key("gemini")),
            "lmstudio": LMStudioClient(self.config_manager.get_lmstudio_url())
        }

    def setup_ui(self):
        """Setup the main UI."""
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # Sidebar
        self.sidebar = SidebarWidget(self.chat_manager)
        main_layout.addWidget(self.sidebar)

        # Main content area
        content_widget = QWidget()
        content_layout = QVBoxLayout(content_widget)
        content_layout.setContentsMargins(0, 0, 0, 0)
        content_layout.setSpacing(0)

        # Header with model selector
        header = self._create_header()
        content_layout.addWidget(header)

        # Chat display area (stacked widget for welcome/chat)
        self.content_stack = QStackedWidget()

        # Welcome screen
        self.welcome_widget = WelcomeWidget()
        self.content_stack.addWidget(self.welcome_widget)

        # Chat display
        self.chat_display = ChatDisplayWidget()
        self.content_stack.addWidget(self.chat_display)

        content_layout.addWidget(self.content_stack, 1)

        # Input area
        self.chat_input = ChatInputWidget()
        content_layout.addWidget(self.chat_input)

        main_layout.addWidget(content_widget, 1)

        # Show welcome screen initially
        self.content_stack.setCurrentWidget(self.welcome_widget)

    def _create_header(self) -> QWidget:
        """Create the header with model selector."""
        header = QFrame()
        header.setObjectName("header")
        layout = QHBoxLayout(header)
        layout.setContentsMargins(16, 12, 16, 12)

        # Title
        title = QLabel("AI Chat")
        title.setObjectName("headerTitle")
        layout.addWidget(title)

        layout.addStretch()

        # Model selector
        model_label = QLabel("Model:")
        model_label.setStyleSheet("color: #8E8EA0;")
        layout.addWidget(model_label)

        self.model_selector = QComboBox()
        self.model_selector.setObjectName("modelSelector")
        self.model_selector.setMinimumWidth(200)
        self._populate_model_selector()
        layout.addWidget(self.model_selector)

        return header

    def _populate_model_selector(self):
        """Populate the model selector with visible models."""
        self.model_selector.clear()
        visible = self.config_manager.get_visible_models()

        # Model mapping: display name -> (provider, model_id)
        self.model_map = {}

        # OpenAI models
        if visible.get("gpt-4", True):
            self.model_selector.addItem("GPT-4")
            self.model_map["GPT-4"] = ("openai", "gpt-4")
        if visible.get("gpt-4-turbo", True):
            self.model_selector.addItem("GPT-4 Turbo")
            self.model_map["GPT-4 Turbo"] = ("openai", "gpt-4-turbo")
        if visible.get("gpt-4o", True):
            self.model_selector.addItem("GPT-4o")
            self.model_map["GPT-4o"] = ("openai", "gpt-4o")
        if visible.get("gpt-4o-mini", True):
            self.model_selector.addItem("GPT-4o Mini")
            self.model_map["GPT-4o Mini"] = ("openai", "gpt-4o-mini")
        if visible.get("gpt-3.5-turbo", True):
            self.model_selector.addItem("GPT-3.5 Turbo")
            self.model_map["GPT-3.5 Turbo"] = ("openai", "gpt-3.5-turbo")

        # Claude models
        if visible.get("claude-3-opus", True):
            self.model_selector.addItem("Claude 3 Opus")
            self.model_map["Claude 3 Opus"] = ("anthropic", "claude-3-opus-20240229")
        if visible.get("claude-3-sonnet", True):
            self.model_selector.addItem("Claude 3 Sonnet")
            self.model_map["Claude 3 Sonnet"] = ("anthropic", "claude-3-sonnet-20240229")
        if visible.get("claude-3-haiku", True):
            self.model_selector.addItem("Claude 3 Haiku")
            self.model_map["Claude 3 Haiku"] = ("anthropic", "claude-3-haiku-20240307")
        if visible.get("claude-3.5-sonnet", True):
            self.model_selector.addItem("Claude 3.5 Sonnet")
            self.model_map["Claude 3.5 Sonnet"] = ("anthropic", "claude-3-5-sonnet-20241022")
        if visible.get("claude-3.5-haiku", True):
            self.model_selector.addItem("Claude 3.5 Haiku")
            self.model_map["Claude 3.5 Haiku"] = ("anthropic", "claude-3-5-haiku-20241022")

        # Gemini models
        if visible.get("gemini-pro", True):
            self.model_selector.addItem("Gemini Pro")
            self.model_map["Gemini Pro"] = ("gemini", "gemini-pro")
        if visible.get("gemini-1.5-pro", True):
            self.model_selector.addItem("Gemini 1.5 Pro")
            self.model_map["Gemini 1.5 Pro"] = ("gemini", "gemini-1.5-pro")
        if visible.get("gemini-1.5-flash", True):
            self.model_selector.addItem("Gemini 1.5 Flash")
            self.model_map["Gemini 1.5 Flash"] = ("gemini", "gemini-1.5-flash")
        if visible.get("gemini-2.0-flash", True):
            self.model_selector.addItem("Gemini 2.0 Flash")
            self.model_map["Gemini 2.0 Flash"] = ("gemini", "gemini-2.0-flash-exp")

        # LM Studio models
        if visible.get("lmstudio", True):
            lm_models = self.config_manager.get_lmstudio_models()
            if lm_models:
                for model in lm_models:
                    display_name = f"LM Studio: {model}"
                    self.model_selector.addItem(display_name)
                    self.model_map[display_name] = ("lmstudio", model)
            else:
                self.model_selector.addItem("LM Studio (Local)")
                self.model_map["LM Studio (Local)"] = ("lmstudio", None)

        # Set current model
        current = self.config_manager.get_current_model()
        for i in range(self.model_selector.count()):
            item_text = self.model_selector.itemText(i)
            if item_text in self.model_map:
                _, model_id = self.model_map[item_text]
                if model_id == current:
                    self.model_selector.setCurrentIndex(i)
                    break

    def _connect_signals(self):
        """Connect UI signals."""
        # Sidebar signals
        self.sidebar.new_chat_clicked.connect(self._on_new_chat)
        self.sidebar.chat_selected.connect(self._on_chat_selected)
        self.sidebar.chat_deleted.connect(self._on_chat_deleted)
        self.sidebar.chat_renamed.connect(self._on_chat_renamed)
        self.sidebar.settings_clicked.connect(self._open_settings)

        # Chat input
        self.chat_input.message_sent.connect(self._on_message_sent)

        # Model selector
        self.model_selector.currentTextChanged.connect(self._on_model_changed)

    def apply_theme(self):
        """Apply the current theme."""
        theme = self.config_manager.get_theme()
        self.setStyleSheet(get_theme(theme))

    def _on_new_chat(self):
        """Handle new chat creation."""
        chat_id = self.chat_manager.create_new_chat()
        self.sidebar.add_chat(chat_id, "New Chat")
        self.chat_display.clear_messages()
        self.content_stack.setCurrentWidget(self.chat_display)
        self.chat_input.focus_input()

    def _on_chat_selected(self, chat_id: str):
        """Handle chat selection."""
        self.chat_manager.set_current_chat(chat_id)
        messages = self.chat_manager.get_messages(chat_id)
        self.chat_display.load_messages(messages)
        self.content_stack.setCurrentWidget(self.chat_display)
        self.chat_input.focus_input()

    def _on_chat_deleted(self, chat_id: str):
        """Handle chat deletion."""
        self.chat_manager.delete_chat(chat_id)
        if self.chat_manager.current_chat_id is None:
            self.content_stack.setCurrentWidget(self.welcome_widget)

    def _on_chat_renamed(self, chat_id: str, new_title: str):
        """Handle chat rename."""
        self.chat_manager.rename_chat(chat_id, new_title)

    def _open_settings(self):
        """Open settings dialog."""
        dialog = SettingsDialog(self.config_manager, self)
        dialog.settings_saved.connect(self._on_settings_saved)
        dialog.exec()

    def _on_settings_saved(self):
        """Handle settings saved."""
        # Reinitialize clients with new API keys
        self._init_clients()
        # Refresh model selector
        self._populate_model_selector()
        # Reapply theme
        self.apply_theme()

    def _on_model_changed(self, model_name: str):
        """Handle model selection change."""
        if model_name in self.model_map:
            _, model_id = self.model_map[model_name]
            if model_id:
                self.config_manager.set_current_model(model_id)
                self.config_manager.save_config()

    def _on_message_sent(self, message: str):
        """Handle message sent by user."""
        # Ensure we have an active chat
        if self.chat_manager.current_chat_id is None:
            chat_id = self.chat_manager.create_new_chat()
            self.sidebar.add_chat(chat_id, message[:30] + "..." if len(message) > 30 else message)
            self.content_stack.setCurrentWidget(self.chat_display)

        # Add user message to display and history
        self.chat_display.add_message("user", message)
        self.chat_manager.add_message("user", message)

        # Disable input while processing
        self.chat_input.set_enabled(False)

        # Get current model info
        model_name = self.model_selector.currentText()
        if model_name not in self.model_map:
            self._show_error("Please select a model")
            self.chat_input.set_enabled(True)
            return

        provider, model_id = self.model_map[model_name]
        client = self.clients.get(provider)

        if not client:
            self._show_error(f"Client for {provider} not available")
            self.chat_input.set_enabled(True)
            return

        # Check API key for online models
        if provider != "lmstudio":
            api_key = self.config_manager.get_api_key(provider)
            if not api_key:
                self._show_error(f"Please set your {provider.title()} API key in Settings")
                self.chat_input.set_enabled(True)
                return
            # Update client with current API key
            client.api_key = api_key

        # Prepare messages for API
        messages = self._prepare_messages()

        # Start streaming widget
        streaming_widget = self.chat_display.start_streaming()

        # Create and start worker
        self.current_worker = ChatWorker(client, messages, model_id, stream=True)
        self.current_worker.chunk_received.connect(streaming_widget.append_text)
        self.current_worker.finished.connect(lambda resp: self._on_response_finished(resp, model_name))
        self.current_worker.error.connect(self._on_response_error)
        self.current_worker.start()

    def _prepare_messages(self):
        """Prepare messages for API call."""
        history = self.chat_manager.get_messages()
        messages = []
        for msg in history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"]
            })
        return messages

    def _on_response_finished(self, response: str, model_name: str):
        """Handle completed response."""
        self.chat_display.finish_streaming()
        self.chat_manager.add_message("assistant", response, model=model_name)
        self.chat_input.set_enabled(True)
        self.chat_input.focus_input()

        # Update sidebar with new title if this is first exchange
        if len(self.chat_manager.get_messages()) == 2:
            self.sidebar.refresh_chat_list()

    def _on_response_error(self, error: str):
        """Handle response error."""
        self.chat_display.finish_streaming()
        self.chat_display.add_message("assistant", f"Error: {error}")
        self.chat_input.set_enabled(True)
        self._show_error(error)

    def _show_error(self, message: str):
        """Show error message."""
        QMessageBox.warning(self, "Error", message)

    def closeEvent(self, event):
        """Handle window close."""
        if self.current_worker and self.current_worker.isRunning():
            self.current_worker.terminate()
            self.current_worker.wait()
        event.accept()
