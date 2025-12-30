"""Configuration manager for AI Chat Client."""
import json
import os
from typing import Any, Dict, Optional


class ConfigManager:
    """Manages application configuration and settings."""

    def __init__(self, config_path: str = None):
        if config_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            config_path = os.path.join(base_dir, "config", "settings.json")

        self.config_path = config_path
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from file."""
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return self._get_default_config()
        return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration."""
        return {
            "api_keys": {
                "openai": "",
                "anthropic": "",
                "gemini": ""
            },
            "lmstudio": {
                "url": "http://localhost:1234",
                "available_models": []
            },
            "visible_models": {
                "gpt-4": True,
                "gpt-4-turbo": True,
                "gpt-3.5-turbo": True,
                "claude-3-opus": True,
                "claude-3-sonnet": True,
                "claude-3-haiku": True,
                "gemini-pro": True,
                "gemini-1.5-pro": True,
                "lmstudio": True
            },
            "current_model": "gpt-4",
            "theme": "dark"
        }

    def save_config(self) -> bool:
        """Save configuration to file."""
        try:
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=4, ensure_ascii=False)
            return True
        except IOError:
            return False

    def get_api_key(self, provider: str) -> str:
        """Get API key for a provider."""
        return self.config.get("api_keys", {}).get(provider, "")

    def set_api_key(self, provider: str, key: str) -> None:
        """Set API key for a provider."""
        if "api_keys" not in self.config:
            self.config["api_keys"] = {}
        self.config["api_keys"][provider] = key

    def get_lmstudio_url(self) -> str:
        """Get LM Studio URL."""
        return self.config.get("lmstudio", {}).get("url", "http://localhost:1234")

    def set_lmstudio_url(self, url: str) -> None:
        """Set LM Studio URL."""
        if "lmstudio" not in self.config:
            self.config["lmstudio"] = {}
        self.config["lmstudio"]["url"] = url

    def get_lmstudio_models(self) -> list:
        """Get available LM Studio models."""
        return self.config.get("lmstudio", {}).get("available_models", [])

    def set_lmstudio_models(self, models: list) -> None:
        """Set available LM Studio models."""
        if "lmstudio" not in self.config:
            self.config["lmstudio"] = {}
        self.config["lmstudio"]["available_models"] = models

    def get_visible_models(self) -> Dict[str, bool]:
        """Get visible models configuration."""
        return self.config.get("visible_models", {})

    def set_model_visibility(self, model: str, visible: bool) -> None:
        """Set visibility for a model."""
        if "visible_models" not in self.config:
            self.config["visible_models"] = {}
        self.config["visible_models"][model] = visible

    def get_current_model(self) -> str:
        """Get current selected model."""
        return self.config.get("current_model", "gpt-4")

    def set_current_model(self, model: str) -> None:
        """Set current selected model."""
        self.config["current_model"] = model

    def get_theme(self) -> str:
        """Get current theme."""
        return self.config.get("theme", "dark")

    def set_theme(self, theme: str) -> None:
        """Set current theme."""
        self.config["theme"] = theme
