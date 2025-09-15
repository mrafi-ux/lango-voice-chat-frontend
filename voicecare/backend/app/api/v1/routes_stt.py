"""STT (Speech-to-Text) API routes."""

from typing import Dict, Optional, Any
from fastapi import APIRouter, File, Form, UploadFile, HTTPException
from pydantic import BaseModel

from ...services.stt_whisper import whisper_stt_service
from ...services.stt_mock import mock_stt_service
from ...core.logging import get_logger

logger = get_logger(__name__)

router = APIRouter()


class STTResponse(BaseModel):
    text: str
    language: str
    confidence: Optional[float] = None
    provider: str = "whisper"
    error: Optional[str] = None


@router.post("/transcribe", response_model=STTResponse)
async def transcribe_audio(
    audio: UploadFile = File(...),
    language: Optional[str] = Form(None)
) -> STTResponse:
    """
    Transcribe audio file to text.
    
    Args:
        audio: Audio file (WAV, MP3, etc.)
        language: Optional language hint (e.g., 'en', 'es')
        
    Returns:
        Transcription result with text and detected language
    """
    try:
        # Validate file size (max 10MB)
        max_size = 10 * 1024 * 1024  # 10MB
        if audio.size and audio.size > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"Audio file too large. Max size: {max_size} bytes"
            )
        
        # Read audio data
        audio_data = await audio.read()
        
        if not audio_data:
            raise HTTPException(status_code=400, detail="Empty audio file")
        
        logger.info(f"STT transcription request: {len(audio_data)} bytes, lang hint: {language}")
        
        # Try Whisper first, fallback to mock on error
        result = None
        provider = "whisper"
        
        try:
            result = await whisper_stt_service.transcribe_audio(audio_data, language)
            
            # Check if Whisper returned an error
            if "error" in result and result["error"]:
                logger.warning(f"Whisper STT failed: {result['error']}, falling back to mock")
                result = await mock_stt_service.transcribe_audio(audio_data, language)
                provider = "mock"
                
        except Exception as whisper_error:
            logger.warning(f"Whisper STT exception: {whisper_error}, falling back to mock")
            result = await mock_stt_service.transcribe_audio(audio_data, language)
            provider = "mock"
        
        # Check for final transcription errors
        if "error" in result and result["error"]:
            logger.error(f"STT transcription failed completely: {result['error']}")
            return STTResponse(
                text="",
                language=language or "en",
                provider=provider,
                error=result["error"]
            )
        
        # Successful transcription
        logger.info(f"STT transcription successful ({provider}): '{result['text'][:100]}...' (lang: {result['language']})")
        
        return STTResponse(
            text=result["text"],
            language=result["language"],
            confidence=result.get("confidence"),
            provider=provider
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"STT transcription failed: {e}")
        
        # Last resort: try mock service
        try:
            logger.info("Attempting final fallback to mock STT")
            result = await mock_stt_service.transcribe_audio(b"", language)
            return STTResponse(
                text=result["text"],
                language=result["language"],
                confidence=result.get("confidence"),
                provider="mock",
                error="Whisper unavailable, using mock transcription"
            )
        except Exception as mock_error:
            logger.error(f"Mock STT also failed: {mock_error}")
            raise HTTPException(status_code=500, detail=f"All transcription services failed: {str(e)}")


@router.get("/languages")
async def get_supported_languages() -> Dict[str, Any]:
    """
    Get list of languages supported by the STT provider.
    
    Returns:
        Dictionary with provider name and supported languages
    """
    try:
        # Try to get Whisper languages first
        try:
            languages = whisper_stt_service.get_supported_languages()
            return {
                "provider": "whisper",
                "languages": languages,
                "count": len(languages)
            }
        except Exception as whisper_error:
            logger.warning(f"Whisper languages failed: {whisper_error}, using mock")
            languages = mock_stt_service.get_supported_languages()
            return {
                "provider": "mock",
                "languages": languages,
                "count": len(languages),
                "note": "Using mock STT service (Whisper unavailable)"
            }
            
    except Exception as e:
        logger.error(f"Failed to get STT languages: {e}")
        return {
            "provider": "error",
            "languages": [],
            "count": 0,
            "error": str(e)
        } 