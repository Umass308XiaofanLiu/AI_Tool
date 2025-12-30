"""Base model client interface."""
from abc import ABC, abstractmethod
from typing import Generator, List, Dict, Optional


class BaseModelClient(ABC):
    """Abstract base class for all model clients."""

    def __init__(self, api_key: str = None, base_url: str = None):
        self.api_key = api_key
        self.base_url = base_url

    @abstractmethod
    def chat(self, messages: List[Dict[str, str]], model: str = None,
             stream: bool = False) -> str | Generator[str, None, None]:
        """Send chat messages and get response.

        Args:
            messages: List of message dicts with 'role' and 'content'
            model: Model identifier to use
            stream: Whether to stream the response

        Returns:
            Response string or generator for streaming
        """
        pass

    @abstractmethod
    def list_models(self) -> List[str]:
        """List available models.

        Returns:
            List of model identifiers
        """
        pass

    @abstractmethod
    def validate_connection(self) -> bool:
        """Validate API connection and credentials.

        Returns:
            True if connection is valid
        """
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Get the provider name."""
        pass
