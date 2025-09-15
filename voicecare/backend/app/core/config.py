"""Application configuration."""

import json
from typing import List, Optional

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Database
    database_url: str = "sqlite+aiosqlite:///./voicecare.db"
    
    # Server
    app_host: str = "127.0.0.1"
    app_port: int = 8000
    
    # External services
    libre_translate_url: str = "https://libretranslate.com/translate"
    
    # CORS
    cors_origins: str = '["http://localhost:3000"]'
    
    # Voice Settings
    max_voice_seconds: int = 120
    
    # STT Configuration
    stt_provider: str = "whisper"
    whisper_model: str = "tiny"  # Changed from "small" to "tiny" for better reliability
    whisper_compute: str = "cpu"
    whisper_beam_size: int = 1
    whisper_vad: bool = True
    whisper_temperature: float = 0.0
    whisper_no_speech_threshold: float = 0.45
    
    # TTS Configuration
    tts_provider: str = "elevenlabs"
    piper_voices_dir: str = "./voices/piper"
    elevenlabs_api_key: Optional[str] = None
    
    # Logging
    log_level: str = "INFO"

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from JSON string."""
        try:
            return json.loads(self.cors_origins)
        except json.JSONDecodeError:
            return ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = False


# Global settings instance
settings = Settings()
