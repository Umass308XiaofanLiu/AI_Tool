"""LM Studio local model client."""
import requests
from typing import Generator, List, Dict
from .base_model import BaseModelClient


class LMStudioClient(BaseModelClient):
    """Client for LM Studio local server (OpenAI-compatible API)."""

    def __init__(self, base_url: str = "http://localhost:1234"):
        super().__init__(base_url=base_url)
        self._available_models = []

    def chat(self, messages: List[Dict[str, str]], model: str = None,
             stream: bool = False) -> str | Generator[str, None, None]:
        """Send chat messages to LM Studio."""
        if not self.base_url:
            raise ValueError("LM Studio URL not set")

        try:
            if stream:
                return self._stream_chat(messages, model)
            else:
                response = requests.post(
                    f"{self.base_url}/v1/chat/completions",
                    json={
                        "model": model or "local-model",
                        "messages": messages,
                        "stream": False
                    },
                    timeout=120
                )
                response.raise_for_status()
                return response.json()["choices"][0]["message"]["content"]
        except requests.exceptions.ConnectionError:
            raise Exception("Cannot connect to LM Studio. Make sure LM Studio is running.")
        except Exception as e:
            raise Exception(f"LM Studio error: {str(e)}")

    def _stream_chat(self, messages: List[Dict[str, str]],
                     model: str = None) -> Generator[str, None, None]:
        """Stream chat response from LM Studio."""
        try:
            response = requests.post(
                f"{self.base_url}/v1/chat/completions",
                json={
                    "model": model or "local-model",
                    "messages": messages,
                    "stream": True
                },
                stream=True,
                timeout=120
            )
            response.raise_for_status()

            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith('data: '):
                        data = line[6:]
                        if data == '[DONE]':
                            break
                        try:
                            import json
                            chunk = json.loads(data)
                            if chunk["choices"][0]["delta"].get("content"):
                                yield chunk["choices"][0]["delta"]["content"]
                        except (json.JSONDecodeError, KeyError):
                            continue
        except requests.exceptions.ConnectionError:
            yield "\n[Error: Cannot connect to LM Studio]"
        except Exception as e:
            yield f"\n[Error: {str(e)}]"

    def list_models(self) -> List[str]:
        """List available models from LM Studio."""
        try:
            response = requests.get(
                f"{self.base_url}/v1/models",
                timeout=10
            )
            response.raise_for_status()
            models_data = response.json()
            self._available_models = [m["id"] for m in models_data.get("data", [])]
            return self._available_models
        except Exception:
            return self._available_models

    def validate_connection(self) -> bool:
        """Validate LM Studio connection."""
        try:
            response = requests.get(
                f"{self.base_url}/v1/models",
                timeout=5
            )
            return response.status_code == 200
        except Exception:
            return False

    def refresh_models(self) -> List[str]:
        """Refresh and return available models."""
        return self.list_models()

    @property
    def provider_name(self) -> str:
        return "LM Studio"
