"""Chat history manager for AI Chat Client."""
import json
import os
import uuid
from datetime import datetime
from typing import Dict, List, Optional


class ChatHistoryManager:
    """Manages chat history storage and retrieval."""

    def __init__(self, data_dir: str = None):
        if data_dir is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            data_dir = os.path.join(base_dir, "data", "chats")

        self.data_dir = data_dir
        os.makedirs(self.data_dir, exist_ok=True)
        self.current_chat_id: Optional[str] = None
        self.chats: Dict[str, dict] = {}
        self._load_all_chats()

    def _load_all_chats(self) -> None:
        """Load all chat histories from disk."""
        self.chats = {}
        if os.path.exists(self.data_dir):
            for filename in os.listdir(self.data_dir):
                if filename.endswith('.json'):
                    chat_id = filename[:-5]
                    try:
                        with open(os.path.join(self.data_dir, filename), 'r', encoding='utf-8') as f:
                            self.chats[chat_id] = json.load(f)
                    except (json.JSONDecodeError, IOError):
                        continue

    def create_new_chat(self, title: str = "New Chat") -> str:
        """Create a new chat and return its ID."""
        chat_id = str(uuid.uuid4())[:8]
        self.chats[chat_id] = {
            "id": chat_id,
            "title": title,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "messages": []
        }
        self.current_chat_id = chat_id
        self._save_chat(chat_id)
        return chat_id

    def _save_chat(self, chat_id: str) -> bool:
        """Save a specific chat to disk."""
        if chat_id not in self.chats:
            return False
        try:
            filepath = os.path.join(self.data_dir, f"{chat_id}.json")
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(self.chats[chat_id], f, indent=2, ensure_ascii=False)
            return True
        except IOError:
            return False

    def add_message(self, role: str, content: str, model: str = None, chat_id: str = None) -> None:
        """Add a message to the current or specified chat."""
        target_id = chat_id or self.current_chat_id
        if target_id is None:
            target_id = self.create_new_chat()

        if target_id not in self.chats:
            return

        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.now().isoformat()
        }
        if model:
            message["model"] = model

        self.chats[target_id]["messages"].append(message)
        self.chats[target_id]["updated_at"] = datetime.now().isoformat()

        # Update title if this is the first user message
        if role == "user" and len(self.chats[target_id]["messages"]) == 1:
            title = content[:50] + "..." if len(content) > 50 else content
            self.chats[target_id]["title"] = title

        self._save_chat(target_id)

    def get_messages(self, chat_id: str = None) -> List[dict]:
        """Get messages from the current or specified chat."""
        target_id = chat_id or self.current_chat_id
        if target_id is None or target_id not in self.chats:
            return []
        return self.chats[target_id].get("messages", [])

    def get_chat_list(self) -> List[dict]:
        """Get list of all chats sorted by update time."""
        chat_list = []
        for chat_id, chat in self.chats.items():
            chat_list.append({
                "id": chat_id,
                "title": chat.get("title", "Untitled"),
                "updated_at": chat.get("updated_at", ""),
                "message_count": len(chat.get("messages", []))
            })
        return sorted(chat_list, key=lambda x: x["updated_at"], reverse=True)

    def set_current_chat(self, chat_id: str) -> bool:
        """Set the current active chat."""
        if chat_id in self.chats:
            self.current_chat_id = chat_id
            return True
        return False

    def delete_chat(self, chat_id: str) -> bool:
        """Delete a chat."""
        if chat_id in self.chats:
            del self.chats[chat_id]
            filepath = os.path.join(self.data_dir, f"{chat_id}.json")
            if os.path.exists(filepath):
                os.remove(filepath)
            if self.current_chat_id == chat_id:
                self.current_chat_id = None
            return True
        return False

    def rename_chat(self, chat_id: str, new_title: str) -> bool:
        """Rename a chat."""
        if chat_id in self.chats:
            self.chats[chat_id]["title"] = new_title
            self._save_chat(chat_id)
            return True
        return False

    def clear_current_chat(self) -> None:
        """Clear messages in current chat."""
        if self.current_chat_id and self.current_chat_id in self.chats:
            self.chats[self.current_chat_id]["messages"] = []
            self._save_chat(self.current_chat_id)
