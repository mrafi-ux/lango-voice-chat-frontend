"""API routes for system capabilities."""

from typing import Dict, Any
from fastapi import APIRouter

from ...services.stt_whisper import whisper_stt_service
from ...services.stt_mock import mock_stt_service
from ...services.tts_elevenlabs import elevenlabs_tts_service
from ...services.translate_libre import translate_service

router = APIRouter()


@router.get("/languages")
async def get_language_capabilities() -> Dict[str, Any]:
    """Get supported languages for all services."""
    try:
        # Try Whisper first, fallback to mock
        try:
            stt_languages = whisper_stt_service.get_supported_languages()
        except Exception:
            stt_languages = mock_stt_service.get_supported_languages()
        
        return {
            "stt": {
                "provider": "whisper",
                "languages": stt_languages
            },
            "translation": {
                "provider": "mock",
                "languages": translate_service.get_supported_languages()
            },
            "tts": {
                "provider": "elevenlabs", 
                "languages": elevenlabs_tts_service.get_supported_languages()
            }
        }
    except Exception as e:
        return {
            "error": str(e),
            "stt": {"provider": "mock", "languages": mock_stt_service.get_supported_languages()},
            "translation": {"provider": "mock", "languages": translate_service.get_supported_languages()},
            "tts": {"provider": "mock", "languages": ["en", "es"]}
        }


@router.get("/providers")
async def get_provider_info() -> Dict[str, Any]:
    """Get information about service providers."""
    return {
        "stt": {
            "primary": "whisper",
            "fallback": "mock"
        },
        "translation": {
            "primary": "mock",
            "fallback": "mock"
        },
        "tts": {
            "primary": "elevenlabs",
            "fallback": "mock"
        }
    }


@router.post("/translate")
async def translate_text(request: Dict[str, Any]) -> Dict[str, Any]:
    """Translate text using the translation service."""
    try:
        text = request.get("text", "")
        source_lang = request.get("source", "en")
        target_lang = request.get("target", "es")
        
        if not text:
            return {"error": "Text is required"}
        
        translated_text = await translate_service.translate(text, source_lang, target_lang)
        
        return {
            "translatedText": translated_text,
            "source": source_lang,
            "target": target_lang
        }
    except Exception as e:
        return {"error": str(e)} 