"""Settings dialog for AI Chat Client."""
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QTabWidget, QWidget,
    QLabel, QLineEdit, QPushButton, QGroupBox, QCheckBox,
    QScrollArea, QFrame, QMessageBox, QGridLayout
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont

from ..utils.config_manager import ConfigManager
from ..models.lmstudio_client import LMStudioClient


class SettingsDialog(QDialog):
    """Settings dialog for managing API keys and model visibility."""

    settings_saved = pyqtSignal()

    def __init__(self, config_manager: ConfigManager, parent=None):
        super().__init__(parent)
        self.config_manager = config_manager
        self.lmstudio_client = LMStudioClient(config_manager.get_lmstudio_url())
        self.model_checkboxes = {}

        self.setWindowTitle("Settings")
        self.setMinimumSize(600, 500)
        self.setup_ui()
        self.load_settings()

    def setup_ui(self):
        """Setup the settings UI."""
        layout = QVBoxLayout(self)
        layout.setSpacing(16)
        layout.setContentsMargins(24, 24, 24, 24)

        # Tab widget
        self.tabs = QTabWidget()
        layout.addWidget(self.tabs)

        # API Keys tab
        api_tab = self.create_api_keys_tab()
        self.tabs.addTab(api_tab, "API Keys")

        # LM Studio tab
        lmstudio_tab = self.create_lmstudio_tab()
        self.tabs.addTab(lmstudio_tab, "LM Studio")

        # Model Visibility tab
        models_tab = self.create_models_tab()
        self.tabs.addTab(models_tab, "Model Visibility")

        # Buttons
        button_layout = QHBoxLayout()
        button_layout.addStretch()

        self.cancel_btn = QPushButton("Cancel")
        self.cancel_btn.setObjectName("cancelBtn")
        self.cancel_btn.clicked.connect(self.reject)
        button_layout.addWidget(self.cancel_btn)

        self.save_btn = QPushButton("Save Settings")
        self.save_btn.clicked.connect(self.save_settings)
        button_layout.addWidget(self.save_btn)

        layout.addLayout(button_layout)

    def create_api_keys_tab(self) -> QWidget:
        """Create the API Keys configuration tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.setSpacing(20)

        # OpenAI
        openai_group = QGroupBox("OpenAI")
        openai_layout = QVBoxLayout(openai_group)

        openai_label = QLabel("API Key:")
        self.openai_key_input = QLineEdit()
        self.openai_key_input.setPlaceholderText("sk-...")
        self.openai_key_input.setEchoMode(QLineEdit.EchoMode.Password)

        show_openai = QCheckBox("Show API Key")
        show_openai.stateChanged.connect(
            lambda state: self.openai_key_input.setEchoMode(
                QLineEdit.EchoMode.Normal if state else QLineEdit.EchoMode.Password
            )
        )

        openai_layout.addWidget(openai_label)
        openai_layout.addWidget(self.openai_key_input)
        openai_layout.addWidget(show_openai)
        layout.addWidget(openai_group)

        # Anthropic (Claude)
        anthropic_group = QGroupBox("Anthropic (Claude)")
        anthropic_layout = QVBoxLayout(anthropic_group)

        anthropic_label = QLabel("API Key:")
        self.anthropic_key_input = QLineEdit()
        self.anthropic_key_input.setPlaceholderText("sk-ant-...")
        self.anthropic_key_input.setEchoMode(QLineEdit.EchoMode.Password)

        show_anthropic = QCheckBox("Show API Key")
        show_anthropic.stateChanged.connect(
            lambda state: self.anthropic_key_input.setEchoMode(
                QLineEdit.EchoMode.Normal if state else QLineEdit.EchoMode.Password
            )
        )

        anthropic_layout.addWidget(anthropic_label)
        anthropic_layout.addWidget(self.anthropic_key_input)
        anthropic_layout.addWidget(show_anthropic)
        layout.addWidget(anthropic_group)

        # Google (Gemini)
        gemini_group = QGroupBox("Google (Gemini)")
        gemini_layout = QVBoxLayout(gemini_group)

        gemini_label = QLabel("API Key:")
        self.gemini_key_input = QLineEdit()
        self.gemini_key_input.setPlaceholderText("AI...")
        self.gemini_key_input.setEchoMode(QLineEdit.EchoMode.Password)

        show_gemini = QCheckBox("Show API Key")
        show_gemini.stateChanged.connect(
            lambda state: self.gemini_key_input.setEchoMode(
                QLineEdit.EchoMode.Normal if state else QLineEdit.EchoMode.Password
            )
        )

        gemini_layout.addWidget(gemini_label)
        gemini_layout.addWidget(self.gemini_key_input)
        gemini_layout.addWidget(show_gemini)
        layout.addWidget(gemini_group)

        layout.addStretch()
        return tab

    def create_lmstudio_tab(self) -> QWidget:
        """Create the LM Studio configuration tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)
        layout.setSpacing(20)

        # Connection settings
        connection_group = QGroupBox("Connection Settings")
        connection_layout = QVBoxLayout(connection_group)

        url_label = QLabel("LM Studio Server URL:")
        self.lmstudio_url_input = QLineEdit()
        self.lmstudio_url_input.setPlaceholderText("http://localhost:1234")

        connect_layout = QHBoxLayout()
        self.connect_btn = QPushButton("Connect & Verify")
        self.connect_btn.setObjectName("connectBtn")
        self.connect_btn.clicked.connect(self.verify_lmstudio_connection)

        self.connection_status = QLabel("")
        self.connection_status.setObjectName("statusLabel")

        connect_layout.addWidget(self.connect_btn)
        connect_layout.addWidget(self.connection_status)
        connect_layout.addStretch()

        connection_layout.addWidget(url_label)
        connection_layout.addWidget(self.lmstudio_url_input)
        connection_layout.addLayout(connect_layout)
        layout.addWidget(connection_group)

        # Available models
        models_group = QGroupBox("Available Models")
        models_layout = QVBoxLayout(models_group)

        self.lmstudio_models_label = QLabel("No models detected. Click 'Connect & Verify' to detect models.")
        self.lmstudio_models_label.setWordWrap(True)
        models_layout.addWidget(self.lmstudio_models_label)

        # Model list (will be populated after connection)
        self.lmstudio_models_container = QVBoxLayout()
        models_layout.addLayout(self.lmstudio_models_container)

        layout.addWidget(models_group)
        layout.addStretch()
        return tab

    def create_models_tab(self) -> QWidget:
        """Create the Model Visibility configuration tab."""
        tab = QWidget()
        layout = QVBoxLayout(tab)

        description = QLabel("Select which models to show in the model selector:")
        description.setWordWrap(True)
        layout.addWidget(description)

        # Scroll area for model checkboxes
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setFrameShape(QFrame.Shape.NoFrame)

        scroll_content = QWidget()
        scroll_layout = QVBoxLayout(scroll_content)

        # OpenAI models
        openai_group = QGroupBox("OpenAI Models")
        openai_layout = QVBoxLayout(openai_group)
        for model in ["gpt-4", "gpt-4-turbo", "gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"]:
            cb = QCheckBox(model)
            self.model_checkboxes[model] = cb
            openai_layout.addWidget(cb)
        scroll_layout.addWidget(openai_group)

        # Claude models
        claude_group = QGroupBox("Anthropic Models")
        claude_layout = QVBoxLayout(claude_group)
        for model in ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku",
                      "claude-3.5-sonnet", "claude-3.5-haiku"]:
            cb = QCheckBox(model)
            self.model_checkboxes[model] = cb
            claude_layout.addWidget(cb)
        scroll_layout.addWidget(claude_group)

        # Gemini models
        gemini_group = QGroupBox("Google Models")
        gemini_layout = QVBoxLayout(gemini_group)
        for model in ["gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"]:
            cb = QCheckBox(model)
            self.model_checkboxes[model] = cb
            gemini_layout.addWidget(cb)
        scroll_layout.addWidget(gemini_group)

        # LM Studio models
        lmstudio_group = QGroupBox("Local Models (LM Studio)")
        lmstudio_layout = QVBoxLayout(lmstudio_group)
        cb = QCheckBox("LM Studio Local Models")
        self.model_checkboxes["lmstudio"] = cb
        lmstudio_layout.addWidget(cb)
        scroll_layout.addWidget(lmstudio_group)

        scroll_layout.addStretch()
        scroll.setWidget(scroll_content)
        layout.addWidget(scroll)

        return tab

    def verify_lmstudio_connection(self):
        """Verify LM Studio connection and detect available models."""
        url = self.lmstudio_url_input.text().strip()
        if not url:
            url = "http://localhost:1234"
            self.lmstudio_url_input.setText(url)

        self.lmstudio_client.base_url = url
        self.connection_status.setText("Connecting...")
        self.connection_status.setProperty("status", "")
        self.connection_status.style().polish(self.connection_status)

        # Try to connect
        if self.lmstudio_client.validate_connection():
            models = self.lmstudio_client.list_models()
            if models:
                self.connection_status.setText(f"Connected! Found {len(models)} model(s)")
                self.connection_status.setProperty("status", "success")
                self.lmstudio_models_label.setText("Detected models:")

                # Clear previous model checkboxes
                while self.lmstudio_models_container.count():
                    item = self.lmstudio_models_container.takeAt(0)
                    if item.widget():
                        item.widget().deleteLater()

                # Add model checkboxes
                for model in models:
                    cb = QCheckBox(model)
                    cb.setChecked(True)
                    self.lmstudio_models_container.addWidget(cb)

                # Save models to config
                self.config_manager.set_lmstudio_models(models)
            else:
                self.connection_status.setText("Connected but no models loaded")
                self.connection_status.setProperty("status", "success")
                self.lmstudio_models_label.setText("No models currently loaded in LM Studio.")
        else:
            self.connection_status.setText("Connection failed!")
            self.connection_status.setProperty("status", "error")
            self.lmstudio_models_label.setText(
                "Could not connect to LM Studio. Make sure:\n"
                "1. LM Studio is running\n"
                "2. The server is started (Server tab)\n"
                "3. The URL is correct"
            )

        self.connection_status.style().polish(self.connection_status)

    def load_settings(self):
        """Load current settings into the UI."""
        # API Keys
        self.openai_key_input.setText(self.config_manager.get_api_key("openai"))
        self.anthropic_key_input.setText(self.config_manager.get_api_key("anthropic"))
        self.gemini_key_input.setText(self.config_manager.get_api_key("gemini"))

        # LM Studio
        self.lmstudio_url_input.setText(self.config_manager.get_lmstudio_url())

        # Model visibility
        visible_models = self.config_manager.get_visible_models()
        for model, checkbox in self.model_checkboxes.items():
            checkbox.setChecked(visible_models.get(model, True))

    def save_settings(self):
        """Save settings to configuration."""
        # API Keys
        self.config_manager.set_api_key("openai", self.openai_key_input.text().strip())
        self.config_manager.set_api_key("anthropic", self.anthropic_key_input.text().strip())
        self.config_manager.set_api_key("gemini", self.gemini_key_input.text().strip())

        # LM Studio
        self.config_manager.set_lmstudio_url(
            self.lmstudio_url_input.text().strip() or "http://localhost:1234"
        )

        # Model visibility
        for model, checkbox in self.model_checkboxes.items():
            self.config_manager.set_model_visibility(model, checkbox.isChecked())

        # Save to file
        if self.config_manager.save_config():
            self.settings_saved.emit()
            self.accept()
        else:
            QMessageBox.warning(self, "Error", "Failed to save settings.")
