"""ElevenLabs TTS service for premium voice synthesis."""

import asyncio
from typing import Optional, Dict, List, Any
import base64

import httpx

from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger(__name__)


class ElevenLabsTTSService:
    """ElevenLabs-based Text-to-Speech service."""
    
    def __init__(self):
        self.voices_cache: Optional[List[Dict]] = None
        self.base_url = "https://api.elevenlabs.io/v1"
        
    async def _load_voices_cache(self):
        """Load available ElevenLabs voices."""
        if self.voices_cache is not None:
            return
            
        if not settings.elevenlabs_api_key:
            logger.warning("ElevenLabs API key not configured")
            self.voices_cache = []
            return
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/voices",
                    headers={"xi-api-key": settings.elevenlabs_api_key},
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.voices_cache = data.get("voices", [])
                    logger.info(f"Loaded {len(self.voices_cache)} ElevenLabs voices")
                elif response.status_code == 401:
                    logger.warning("ElevenLabs API key invalid - disabling ElevenLabs TTS")
                    self.voices_cache = []
                    # Don't clear the API key here as it might be valid for other operations
                else:
                    logger.error(f"Failed to load ElevenLabs voices: {response.status_code}")
                    self.voices_cache = []
                    
        except Exception as e:
            logger.error(f"Error loading ElevenLabs voices: {e}")
            self.voices_cache = []
    
    async def get_voices_list(self) -> List[Dict]:
        """Get list of available voices with details."""
        await self._load_voices_cache()
        return self.voices_cache or []
    
    async def synthesize_elevenlabs(
        self, 
        text: str, 
        lang: str, 
        voice_hint: Optional[str] = None
    ) -> tuple[bytes, str, bool]:
        """
        Synthesize speech using ElevenLabs.
        
        Args:
            text: Text to synthesize
            lang: Target language code
            voice_hint: Optional voice ID or name hint
            
        Returns:
            Tuple of (audio_bytes, content_type, needs_browser_fallback)
        """
        if not settings.elevenlabs_api_key:
            logger.warning("ElevenLabs API key not configured")
            return b"", "audio/mpeg", True
        
        await self._load_voices_cache()
        
        # Find best voice for language
        voice_id = self._find_best_voice(lang, voice_hint)
        
        if not voice_id:
            logger.warning(f"No ElevenLabs voice found for language: {lang}")
            return b"", "audio/mpeg", True
        
        try:
            # Synthesize with ElevenLabs
            audio_bytes = await self._synthesize_with_voice(text, voice_id)
            return audio_bytes, "audio/mpeg", False
            
        except Exception as e:
            logger.error(f"ElevenLabs synthesis failed: {e}")
            return b"", "audio/mpeg", True
    
    def _find_best_voice(self, lang: str, voice_hint: Optional[str] = None) -> Optional[str]:
        """Find the best voice ID for a language."""
        if not self.voices_cache:
            # If we could not load voices, try hardcoded defaults
            return self._fallback_voice_for(lang)
        
        # If voice hint provided, try to match it first (could be voice_id or name)
        if voice_hint:
            # Try exact voice_id match first
            for voice in self.voices_cache:
                if voice["voice_id"] == voice_hint:
                    logger.info(f"Using exact voice ID match: {voice['name']}")
                    return voice["voice_id"]
            
            # Try name match
            for voice in self.voices_cache:
                if voice_hint.lower() in voice["name"].lower():
                    logger.info(f"Using voice name match: {voice['name']}")
                    return voice["voice_id"]
        
        # Language preference mapping for multilingual model
        lang_preferences = {
            "en": ["Rachel", "Bella", "Antoni", "Elli", "Josh", "Arnold", "Adam", "Sam"],
            "es": ["Matilda", "Isabella", "Diego", "Valentina"],  # Spanish voices
            "fr": ["Charlotte", "Alice", "Antoine", "Camille"],   # French voices
            "de": ["Hans", "Giselle", "Klaus", "Ingrid"],        # German voices
            "it": ["Giorgio", "Bianca", "Marco", "Giulia"],      # Italian voices
            "pt": ["Camila", "Ricardo", "Fernanda"],             # Portuguese voices
            "ar": ["Khalil", "Amara"],                           # Arabic voices
            "hi": ["Aditi", "Ravi"],                             # Hindi voices
            "ja": ["Takeshi", "Akiko"],                          # Japanese voices
            "ko": ["Jin", "Soo-jin"],                            # Korean voices
            "zh": ["Wei", "Li"],                                 # Chinese voices
        }
        
        lang_code = lang.split('-')[0].lower()
        preferred_names = lang_preferences.get(lang_code, lang_preferences["en"])
        
        # Try to find voice by language preference
        for preferred_name in preferred_names:
            for voice in self.voices_cache:
                if preferred_name.lower() in voice["name"].lower():
                    logger.info(f"Using language preference match: {voice['name']} for {lang_code}")
                    return voice["voice_id"]
        
        # Fallback to first available voice
        if self.voices_cache:
            fallback_voice = self.voices_cache[0]
            logger.info(f"Using fallback voice: {fallback_voice['name']}")
            return fallback_voice["voice_id"]
        
        # As a last resort, return a known public voice id (Rachel)
        return self._fallback_voice_for(lang)

    def _fallback_voice_for(self, lang: str) -> Optional[str]:
        """Return a known public ElevenLabs premade voice id as fallback.
        The multilingual model can speak many languages regardless of the voice name.
        """
        # Rachel (public): 21m00Tcm4TlvDq8ikWAM
        # Other public voices can be added here if needed
        defaults = {
            "default": "21m00Tcm4TlvDq8ikWAM",
            "en": "21m00Tcm4TlvDq8ikWAM",
            "es": "21m00Tcm4TlvDq8ikWAM",
            "fr": "21m00Tcm4TlvDq8ikWAM",
            "de": "21m00Tcm4TlvDq8ikWAM",
            "it": "21m00Tcm4TlvDq8ikWAM",
            "pt": "21m00Tcm4TlvDq8ikWAM",
        }
        lang_code = (lang or "").split('-')[0].lower()
        voice_id = defaults.get(lang_code) or defaults["default"]
        logger.info(f"Using hardcoded fallback voice id for {lang_code}: {voice_id}")
        return voice_id
    
    async def _synthesize_with_voice(self, text: str, voice_id: str) -> bytes:
        """Synthesize text with specific voice."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/text-to-speech/{voice_id}",
                    headers={
                        "xi-api-key": settings.elevenlabs_api_key,
                        "Content-Type": "application/json"
                    },
                    json={
                        "text": text,
                        "model_id": "eleven_multilingual_v2",  # Use multilingual model
                        "voice_settings": {
                            "stability": 0.5,
                            "similarity_boost": 0.75,
                            "style": 0.0,
                            "use_speaker_boost": True
                        }
                    },
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    audio_bytes = response.content
                    logger.info(f"ElevenLabs synthesis successful: {len(audio_bytes)} bytes with voice {voice_id}")
                    return audio_bytes
                else:
                    logger.error(f"ElevenLabs synthesis failed: {response.status_code} - {response.text}")
                    raise RuntimeError(f"ElevenLabs API error: {response.status_code}")
                    
        except httpx.TimeoutException:
            logger.error("ElevenLabs synthesis timed out")
            raise RuntimeError("ElevenLabs synthesis timed out")
        except Exception as e:
            logger.error(f"ElevenLabs synthesis error: {e}")
            raise
    
    def get_supported_languages(self) -> List[Dict[str, Any]]:
        """Get list of supported languages with available voices."""
        # Updated for multilingual model
        return [
            {
                "code": "en",
                "name": "English", 
                "voices": ["Rachel", "Bella", "Antoni", "Elli", "Josh", "Arnold", "Adam", "Sam"],
                "count": 8
            },
            {
                "code": "es", 
                "name": "Spanish",
                "voices": ["Matilda", "Isabella", "Diego", "Valentina"],
                "count": 4
            },
            {
                "code": "fr",
                "name": "French", 
                "voices": ["Charlotte", "Alice", "Antoine", "Camille"],
                "count": 4
            },
            {
                "code": "de",
                "name": "German",
                "voices": ["Hans", "Giselle", "Klaus", "Ingrid"], 
                "count": 4
            },
            {
                "code": "it",
                "name": "Italian",
                "voices": ["Giorgio", "Bianca", "Marco", "Giulia"],
                "count": 4
            },
            {
                "code": "pt",
                "name": "Portuguese",
                "voices": ["Camila", "Ricardo", "Fernanda"],
                "count": 3
            },
            {
                "code": "ar",
                "name": "Arabic",
                "voices": ["Khalil", "Amara"],
                "count": 2
            },
            {
                "code": "hi",
                "name": "Hindi",
                "voices": ["Aditi", "Ravi"],
                "count": 2
            },
            {
                "code": "ja",
                "name": "Japanese",
                "voices": ["Takeshi", "Akiko"],
                "count": 2
            },
            {
                "code": "ko",
                "name": "Korean",
                "voices": ["Jin", "Soo-jin"],
                "count": 2
            },
            {
                "code": "zh",
                "name": "Chinese",
                "voices": ["Wei", "Li"],
                "count": 2
            }
        ]
    
    async def check_elevenlabs_available(self) -> bool:
        """Check if ElevenLabs API is available."""
        if not settings.elevenlabs_api_key:
            return False
            
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/voices",
                    headers={"xi-api-key": settings.elevenlabs_api_key},
                    timeout=5.0
                )
                return response.status_code == 200
        except Exception:
            return False


# Global service instance
elevenlabs_tts_service = ElevenLabsTTSService() 