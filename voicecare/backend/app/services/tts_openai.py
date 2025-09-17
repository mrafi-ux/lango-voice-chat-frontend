"""OpenAI TTS service using tts-1 via OpenAI SDK."""

from typing import Optional, Tuple

# Make OpenAI dependency optional so the app can start without it
try:  # pragma: no cover - import guard
    from openai import OpenAI  # type: ignore
except Exception:  # ModuleNotFoundError or other import-time issues
    OpenAI = None  # type: ignore[assignment]

from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger(__name__)


class OpenAITTSService:
    def __init__(self) -> None:
        self.api_key = getattr(settings, 'openai_api_key', None)
        self.model_id = getattr(settings, 'openai_tts_model', 'tts-1')
        self.voice = getattr(settings, 'openai_tts_voice', 'alloy')
        self.client: Optional["OpenAI"] = None
        if OpenAI is None:
            logger.warning("'openai' package not installed; OpenAI TTS disabled")
        elif self.api_key:
            try:
                self.client = OpenAI(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to init OpenAI client: {e}")
        else:
            logger.warning("OPENAI_API_KEY not configured")

    async def synthesize(self, text: str, lang: str, voice_hint: Optional[str] = None) -> Tuple[bytes, str, bool]:
        if not self.client:
            return b"", "audio/mpeg", True

        try:
            voice = voice_hint or self.voice
            speech = self.client.audio.speech.create(
                model=self.model_id,
                voice=voice,
                input=text
            )
            audio_bytes: bytes = speech.content  # type: ignore[attr-defined]
            return audio_bytes, "audio/mpeg", False
        except Exception as e:
            logger.error(f"OpenAI TTS failed: {e}")
            return b"", "audio/mpeg", True


openai_tts_service = OpenAITTSService()

