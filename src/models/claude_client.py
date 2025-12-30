"""Anthropic Claude API client."""
from typing import Generator, List, Dict
from .base_model import BaseModelClient


class ClaudeClient(BaseModelClient):
    """Client for Anthropic Claude API."""

    AVAILABLE_MODELS = [
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022"
    ]

    MODEL_DISPLAY_NAMES = {
        "claude-3-opus-20240229": "claude-3-opus",
        "claude-3-sonnet-20240229": "claude-3-sonnet",
        "claude-3-haiku-20240307": "claude-3-haiku",
        "claude-3-5-sonnet-20241022": "claude-3.5-sonnet",
        "claude-3-5-haiku-20241022": "claude-3.5-haiku"
    }

    def __init__(self, api_key: str = None):
        super().__init__(api_key=api_key)
        self._client = None

    def _get_client(self):
        """Get or create Anthropic client."""
        if self._client is None and self.api_key:
            try:
                import anthropic
                self._client = anthropic.Anthropic(api_key=self.api_key)
            except ImportError:
                raise ImportError("anthropic package not installed. Run: pip install anthropic")
        return self._client

    def chat(self, messages: List[Dict[str, str]], model: str = "claude-3-sonnet-20240229",
             stream: bool = False) -> str | Generator[str, None, None]:
        """Send chat messages to Claude."""
        client = self._get_client()
        if not client:
            raise ValueError("API key not set")

        # Extract system message if present
        system_message = ""
        chat_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                chat_messages.append(msg)

        try:
            if stream:
                return self._stream_chat(chat_messages, model, system_message)
            else:
                kwargs = {
                    "model": model,
                    "max_tokens": 4096,
                    "messages": chat_messages
                }
                if system_message:
                    kwargs["system"] = system_message

                response = client.messages.create(**kwargs)
                return response.content[0].text
        except Exception as e:
            raise Exception(f"Claude API error: {str(e)}")

    def _stream_chat(self, messages: List[Dict[str, str]], model: str,
                     system_message: str = "") -> Generator[str, None, None]:
        """Stream chat response from Claude."""
        client = self._get_client()
        try:
            kwargs = {
                "model": model,
                "max_tokens": 4096,
                "messages": messages,
                "stream": True
            }
            if system_message:
                kwargs["system"] = system_message

            with client.messages.stream(**kwargs) as stream:
                for text in stream.text_stream:
                    yield text
        except Exception as e:
            yield f"\n[Error: {str(e)}]"

    def list_models(self) -> List[str]:
        """List available Claude models."""
        return self.AVAILABLE_MODELS.copy()

    def get_display_name(self, model_id: str) -> str:
        """Get display name for a model."""
        return self.MODEL_DISPLAY_NAMES.get(model_id, model_id)

    def validate_connection(self) -> bool:
        """Validate Claude API connection."""
        try:
            client = self._get_client()
            if not client:
                return False
            # Try a simple API call
            client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=10,
                messages=[{"role": "user", "content": "Hi"}]
            )
            return True
        except Exception:
            return False

    @property
    def provider_name(self) -> str:
        return "Anthropic"
