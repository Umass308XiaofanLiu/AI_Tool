"""Google Gemini API client."""
from typing import Generator, List, Dict
from .base_model import BaseModelClient


class GeminiClient(BaseModelClient):
    """Client for Google Gemini API."""

    AVAILABLE_MODELS = [
        "gemini-pro",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-2.0-flash-exp"
    ]

    def __init__(self, api_key: str = None):
        super().__init__(api_key=api_key)
        self._configured = False

    def _configure(self):
        """Configure Gemini API."""
        if not self._configured and self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._configured = True
            except ImportError:
                raise ImportError("google-generativeai package not installed. Run: pip install google-generativeai")

    def chat(self, messages: List[Dict[str, str]], model: str = "gemini-pro",
             stream: bool = False) -> str | Generator[str, None, None]:
        """Send chat messages to Gemini."""
        self._configure()
        if not self._configured:
            raise ValueError("API key not set")

        try:
            import google.generativeai as genai

            # Convert messages to Gemini format
            gemini_messages = []
            system_instruction = None

            for msg in messages:
                if msg["role"] == "system":
                    system_instruction = msg["content"]
                elif msg["role"] == "user":
                    gemini_messages.append({"role": "user", "parts": [msg["content"]]})
                elif msg["role"] == "assistant":
                    gemini_messages.append({"role": "model", "parts": [msg["content"]]})

            # Create model
            model_kwargs = {}
            if system_instruction:
                model_kwargs["system_instruction"] = system_instruction

            gemini_model = genai.GenerativeModel(model, **model_kwargs)

            if stream:
                return self._stream_chat(gemini_model, gemini_messages)
            else:
                chat = gemini_model.start_chat(history=gemini_messages[:-1] if len(gemini_messages) > 1 else [])
                response = chat.send_message(gemini_messages[-1]["parts"][0] if gemini_messages else "")
                return response.text
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")

    def _stream_chat(self, model, messages: List[Dict]) -> Generator[str, None, None]:
        """Stream chat response from Gemini."""
        try:
            chat = model.start_chat(history=messages[:-1] if len(messages) > 1 else [])
            response = chat.send_message(
                messages[-1]["parts"][0] if messages else "",
                stream=True
            )
            for chunk in response:
                yield chunk.text
        except Exception as e:
            yield f"\n[Error: {str(e)}]"

    def list_models(self) -> List[str]:
        """List available Gemini models."""
        return self.AVAILABLE_MODELS.copy()

    def validate_connection(self) -> bool:
        """Validate Gemini API connection."""
        try:
            self._configure()
            if not self._configured:
                return False

            import google.generativeai as genai
            model = genai.GenerativeModel("gemini-pro")
            model.generate_content("Hi", generation_config={"max_output_tokens": 10})
            return True
        except Exception:
            return False

    @property
    def provider_name(self) -> str:
        return "Google"
