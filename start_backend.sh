#!/bin/bash
# VoiceCare Backend Startup Script

cd /home/codingcops/Projects/lango_voice_chat/voicecare/backend
source ../../venv/bin/activate

# Load environment variables
export $(grep -v '^#' .env | xargs)

echo "🚀 Starting VoiceCare Backend..."
echo "📋 Configuration:"
echo "   STT Provider: $STT_PROVIDER"
echo "   TTS Provider: $TTS_PROVIDER" 
echo "   Translation Provider: $TRANSLATION_PROVIDER"
echo "   OpenAI API Key: ${OPENAI_API_KEY:0:20}..."
echo "   ElevenLabs API Key: ${ELEVENLABS_API_KEY:-'Not set'}"
echo ""

python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
