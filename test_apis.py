#!/usr/bin/env python3
"""
Test script to validate API keys and providers.
Run this to check if your API keys are working.
"""

import os
import asyncio
import httpx
from openai import OpenAI

async def test_elevenlabs(api_key):
    """Test ElevenLabs API key."""
    if not api_key:
        print("❌ ElevenLabs: No API key provided")
        return False
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.elevenlabs.io/v1/voices",
                headers={"xi-api-key": api_key},
                timeout=10.0
            )
            
            if response.status_code == 200:
                data = response.json()
                voices = data.get("voices", [])
                print(f"✅ ElevenLabs: {len(voices)} voices available")
                return True
            else:
                print(f"❌ ElevenLabs: HTTP {response.status_code} - {response.text}")
                return False
    except Exception as e:
        print(f"❌ ElevenLabs: Error - {e}")
        return False

def test_openai(api_key):
    """Test OpenAI API key."""
    if not api_key:
        print("❌ OpenAI: No API key provided")
        return False
    
    try:
        client = OpenAI(api_key=api_key)
        # Test with a simple completion
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=5
        )
        print("✅ OpenAI: API key valid")
        return True
    except Exception as e:
        print(f"❌ OpenAI: Error - {e}")
        return False

async def main():
    print("🔍 Testing API Keys...\n")
    
    # Test ElevenLabs
    elevenlabs_key = os.getenv("ELEVENLABS_API_KEY")
    await test_elevenlabs(elevenlabs_key)
    
    # Test OpenAI
    openai_key = os.getenv("OPENAI_API_KEY")
    test_openai(openai_key)
    
    print("\n📝 To fix ElevenLabs 401 error:")
    print("1. Get a valid API key from https://elevenlabs.io/app/settings/api-keys")
    print("2. Set it in your environment:")
    print("   export ELEVENLABS_API_KEY=your_valid_key_here")
    print("3. Or add it to .env file:")
    print("   ELEVENLABS_API_KEY=your_valid_key_here")
    
    print("\n🔧 Current recommended setup:")
    print("- STT: whisper (most reliable)")
    print("- TTS: openai (works with your current key)")
    print("- Translation: auto (uses OpenAI when STT is OpenAI)")

if __name__ == "__main__":
    asyncio.run(main())
