"""Sidebar widget for AI Chat Client."""
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QListWidget,
    QListWidgetItem, QLabel, QMenu, QLineEdit, QFrame
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QAction, QFont

from ..utils.chat_history import ChatHistoryManager


class ChatListItem(QListWidgetItem):
    """Custom list item for chat history."""

    def __init__(self, chat_id: str, title: str, parent=None):
        super().__init__(parent)
        self.chat_id = chat_id
        self.setText(title)
        self.setToolTip(title)


class SidebarWidget(QWidget):
    """Sidebar widget with chat history and navigation."""

    new_chat_clicked = pyqtSignal()
    chat_selected = pyqtSignal(str)  # chat_id
    chat_deleted = pyqtSignal(str)  # chat_id
    chat_renamed = pyqtSignal(str, str)  # chat_id, new_title
    settings_clicked = pyqtSignal()

    def __init__(self, chat_manager: ChatHistoryManager, parent=None):
        super().__init__(parent)
        self.chat_manager = chat_manager
        self.setObjectName("sidebar")
        self.setFixedWidth(260)
        self.setup_ui()

    def setup_ui(self):
        """Setup the sidebar UI."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Header area
        header = QWidget()
        header_layout = QVBoxLayout(header)
        header_layout.setContentsMargins(8, 12, 8, 12)

        # New Chat button
        self.new_chat_btn = QPushButton("+ New Chat")
        self.new_chat_btn.setObjectName("newChatBtn")
        self.new_chat_btn.clicked.connect(self.new_chat_clicked.emit)
        header_layout.addWidget(self.new_chat_btn)

        layout.addWidget(header)

        # Search box (optional, can be enabled later)
        # self.search_box = QLineEdit()
        # self.search_box.setPlaceholderText("Search chats...")
        # layout.addWidget(self.search_box)

        # Chat list
        self.chat_list = QListWidget()
        self.chat_list.setObjectName("chatList")
        self.chat_list.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.chat_list.customContextMenuRequested.connect(self._show_context_menu)
        self.chat_list.itemClicked.connect(self._on_chat_clicked)
        layout.addWidget(self.chat_list, 1)

        # Bottom area with settings
        bottom = QWidget()
        bottom_layout = QHBoxLayout(bottom)
        bottom_layout.setContentsMargins(8, 8, 8, 12)

        self.settings_btn = QPushButton("⚙")
        self.settings_btn.setObjectName("settingsBtn")
        self.settings_btn.setToolTip("Settings")
        self.settings_btn.clicked.connect(self.settings_clicked.emit)
        self.settings_btn.setFixedSize(40, 40)

        bottom_layout.addWidget(self.settings_btn)
        bottom_layout.addStretch()

        layout.addWidget(bottom)

        # Load initial chat list
        self.refresh_chat_list()

    def refresh_chat_list(self):
        """Refresh the chat list from history."""
        self.chat_list.clear()
        chats = self.chat_manager.get_chat_list()

        for chat in chats:
            item = ChatListItem(chat["id"], chat["title"])
            self.chat_list.addItem(item)

            # Highlight current chat
            if chat["id"] == self.chat_manager.current_chat_id:
                item.setSelected(True)

    def _on_chat_clicked(self, item: ChatListItem):
        """Handle chat item click."""
        if isinstance(item, ChatListItem):
            self.chat_selected.emit(item.chat_id)

    def _show_context_menu(self, position):
        """Show context menu for chat item."""
        item = self.chat_list.itemAt(position)
        if not isinstance(item, ChatListItem):
            return

        menu = QMenu(self)

        rename_action = QAction("Rename", self)
        rename_action.triggered.connect(lambda: self._rename_chat(item))
        menu.addAction(rename_action)

        delete_action = QAction("Delete", self)
        delete_action.triggered.connect(lambda: self._delete_chat(item))
        menu.addAction(delete_action)

        menu.exec(self.chat_list.mapToGlobal(position))

    def _rename_chat(self, item: ChatListItem):
        """Start renaming a chat."""
        from PyQt6.QtWidgets import QInputDialog

        new_title, ok = QInputDialog.getText(
            self,
            "Rename Chat",
            "Enter new title:",
            text=item.text()
        )

        if ok and new_title.strip():
            self.chat_renamed.emit(item.chat_id, new_title.strip())
            item.setText(new_title.strip())

    def _delete_chat(self, item: ChatListItem):
        """Delete a chat."""
        from PyQt6.QtWidgets import QMessageBox

        reply = QMessageBox.question(
            self,
            "Delete Chat",
            f"Are you sure you want to delete '{item.text()}'?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )

        if reply == QMessageBox.StandardButton.Yes:
            self.chat_deleted.emit(item.chat_id)
            self.chat_list.takeItem(self.chat_list.row(item))

    def select_chat(self, chat_id: str):
        """Select a chat by ID."""
        for i in range(self.chat_list.count()):
            item = self.chat_list.item(i)
            if isinstance(item, ChatListItem) and item.chat_id == chat_id:
                item.setSelected(True)
                self.chat_list.setCurrentItem(item)
                break

    def add_chat(self, chat_id: str, title: str):
        """Add a new chat to the list."""
        item = ChatListItem(chat_id, title)
        self.chat_list.insertItem(0, item)
        item.setSelected(True)
        self.chat_list.setCurrentItem(item)
