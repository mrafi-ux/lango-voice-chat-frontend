"""ElevenLabs STT service for speech recognition (Scribe v1)."""

import asyncio
from typing import Optional, Dict

import httpx

from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger(__name__)


class ElevenLabsSTTService:
    """Speech-to-Text service using ElevenLabs Scribe API."""

    def __init__(self) -> None:
        self.api_key = getattr(settings, 'elevenlabs_api_key', None)
        self.model_id = getattr(settings, 'elevenlabs_stt_model', 'scribe_v1')
        self.endpoint = 'https://api.elevenlabs.io/v1/speech-to-text'

    async def transcribe_audio(
        self,
        audio_data: bytes,
        language: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Transcribe audio bytes to text using ElevenLabs.

        Returns dictionary: {"text": str, "language": str, "confidence": float? , "error": str?}
        """
        if not self.api_key:
            logger.error("ELEVENLABS_API_KEY missing in configuration")
            return {"text": "", "language": language or "en", "error": "ElevenLabs API key not configured"}

        try:
            # Prepare multipart form
            headers = {
                'xi-api-key': self.api_key,
            }

            # Normalize 2-letter code for API
            lang = (language or 'en')[:2]

            form_data = {
                'model_id': self.model_id,
                'language_code': lang,
            }

            # Use a single shared AsyncClient for the request
            async with httpx.AsyncClient(timeout=60) as client:
                files = {'file': ('audio.webm', audio_data, 'audio/webm')}
                resp = await client.post(self.endpoint, headers=headers, data=form_data, files=files)

            if resp.status_code >= 400:
                logger.error(f"ElevenLabs STT error {resp.status_code}: {resp.text}")
                return {"text": "", "language": lang, "error": f"HTTP {resp.status_code}"}

            data = resp.json()

            # ElevenLabs returns various shapes; try common fields
            text = data.get('text') or data.get('transcript') or data.get('content') or ''
            detected_lang = data.get('language') or lang
            confidence = data.get('confidence') or None

            logger.info(f"ElevenLabs STT transcription: '{text[:100]}...' (lang: {detected_lang})")

            return {
                "text": (text or '').strip(),
                "language": detected_lang or lang,
                "confidence": confidence
            }

        except Exception as e:
            logger.error(f"ElevenLabs STT failed: {e}")
            return {"text": "", "language": language or "en", "error": str(e)}


# Global instance
elevenlabs_stt_service = ElevenLabsSTTService()


