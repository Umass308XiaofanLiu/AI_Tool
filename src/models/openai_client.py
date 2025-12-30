"""OpenAI API client."""
from typing import Generator, List, Dict
from .base_model import BaseModelClient


class OpenAIClient(BaseModelClient):
    """Client for OpenAI API."""

    AVAILABLE_MODELS = [
        "gpt-4",
        "gpt-4-turbo",
        "gpt-4-turbo-preview",
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-3.5-turbo",
        "gpt-3.5-turbo-16k"
    ]

    def __init__(self, api_key: str = None):
        super().__init__(api_key=api_key)
        self._client = None

    def _get_client(self):
        """Get or create OpenAI client."""
        if self._client is None and self.api_key:
            try:
                from openai import OpenAI
                self._client = OpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError("openai package not installed. Run: pip install openai")
        return self._client

    def chat(self, messages: List[Dict[str, str]], model: str = "gpt-4",
             stream: bool = False) -> str | Generator[str, None, None]:
        """Send chat messages to OpenAI."""
        client = self._get_client()
        if not client:
            raise ValueError("API key not set")

        try:
            if stream:
                return self._stream_chat(messages, model)
            else:
                response = client.chat.completions.create(
                    model=model,
                    messages=messages
                )
                return response.choices[0].message.content
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")

    def _stream_chat(self, messages: List[Dict[str, str]],
                     model: str) -> Generator[str, None, None]:
        """Stream chat response from OpenAI."""
        client = self._get_client()
        try:
            stream = client.chat.completions.create(
                model=model,
                messages=messages,
                stream=True
            )
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"\n[Error: {str(e)}]"

    def list_models(self) -> List[str]:
        """List available OpenAI models."""
        return self.AVAILABLE_MODELS.copy()

    def validate_connection(self) -> bool:
        """Validate OpenAI API connection."""
        try:
            client = self._get_client()
            if not client:
                return False
            # Try a simple API call
            client.models.list()
            return True
        except Exception:
            return False

    @property
    def provider_name(self) -> str:
        return "OpenAI"
