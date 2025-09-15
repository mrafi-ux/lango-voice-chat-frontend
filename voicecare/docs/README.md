# VoiceCare - Patient-Nurse Voice Translation System

A production-lean MVP for real-time voice translation between patients and nurses, optimized for 1-3 second time-to-first-audio (TTFA).

## Quick Start

### Prerequisites
- Python 3.11+ 
- Node.js 20+
- npm or pnpm
- Make (optional, for convenience commands)

### Setup Steps

1. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Frontend Setup** (in a new terminal)
   ```bash
   cd frontend
   cp .env.example .env.local
   npm install
   npm run dev
   ```

3. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Optional: Docker Setup
```bash
docker-compose up -d  # Starts PostgreSQL and LibreTranslate services
```

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │     Backend      │    │  LibreTranslate │
│   (Next.js)     │◄──►│   (FastAPI)      │◄──►│   (Translation) │
│                 │    │                  │    │                 │
│ • Speech API    │    │ • WebSocket      │    │ • Free Service  │
│ • TTS           │    │ • REST API       │    │ • Self-hostable │
│ • React UI      │    │ • SQLite/Postgres│    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Key Features

- **Real-time Translation**: 1-3s TTFA using browser STT/TTS + LibreTranslate
- **WebSocket Communication**: Instant message delivery
- **Multi-language Support**: English, Spanish, French, Arabic, Urdu
- **Role-based Users**: Patient and Nurse roles with language preferences
- **Performance Metrics**: Built-in TTFA tracking and analytics
- **Production Ready**: SQLite by default, PostgreSQL ready

## Development

- **Backend**: FastAPI with SQLAlchemy, WebSockets, async/await
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Database**: SQLite (development), PostgreSQL (production)
- **Translation**: LibreTranslate (free, self-hostable)
- **Real-time**: WebSocket connections with auto-reconnect

## Next Steps

1. Create users in `/admin/users`
2. Start a chat session in `/chat`
3. Test voice recording and translation
4. Monitor performance metrics at `/api/v1/metrics`

For detailed information, see:
- [Client Guide](CLIENT_GUIDE.md) - Non-technical overview
- [Team Handbook](TEAM_HANDBOOK.md) - Development guide
- [API Specification](API_SPEC.md) - Technical reference
