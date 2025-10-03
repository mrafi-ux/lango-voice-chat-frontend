# VoiceCare Frontend

A modern React/Next.js frontend for VoiceCare - a real-time voice translation system designed for healthcare communication between patients and nurses who speak different languages.

## Features

- **Real-time Voice Translation**: Speak in your native language and have messages automatically translated
- **Profile Management**: Create and manage user profiles with language preferences
- **Persistent Chat History**: All conversations are saved and accessible across sessions
- **WebSocket Communication**: Real-time messaging with instant delivery confirmations
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS and Radix UI components

## Tech Stack

- **Framework**: Next.js 14.2.32
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Animations**: Framer Motion

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (see [VoiceCare Backend](https://github.com/mrafi-ux/lango-voice-chat-backend))

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mrafi-ux/lango-voice-chat-frontend.git
   cd lango-voice-chat-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard
│   ├── auth/              # Authentication pages
│   ├── chat/              # Voice chat interface
│   ├── components/        # Reusable components
│   ├── conversations/     # Conversation management
│   ├── hooks/             # Custom React hooks
│   ├── settings/          # User settings
│   └── test-connection/   # API connection testing
├── src/
│   ├── components/ui/     # Base UI components
│   └── libs/             # Utility libraries
├── public/               # Static assets
└── docs/                # Documentation
```

## Key Components

### AudioRecorder
Handles voice recording with visual feedback and automatic processing.

### MessageBubble
Displays chat messages with translation indicators and playback controls.

### HomePage
Main dashboard with user management and navigation.

### WebSocket Hook
Manages real-time communication with the backend.

## API Integration

The frontend communicates with the backend through:

- **REST API**: User management, conversations, settings
- **WebSocket**: Real-time messaging and voice processing
- **File Upload**: Audio recording transmission

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

**Note**: Voice recording requires HTTPS in production or localhost for development.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Tailwind CSS for styling

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

3. Configure your web server to serve the Next.js application

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:8000` |

## Troubleshooting

### Common Issues

1. **Microphone not working**
   - Ensure HTTPS or localhost
   - Check browser permissions
   - Try a different browser

2. **WebSocket connection failed**
   - Verify backend is running
   - Check CORS settings
   - Ensure correct WebSocket URL

3. **Translation not working**
   - Check internet connection
   - Verify backend API is accessible
   - Check browser console for errors

### Debug Mode

Enable debug logging by opening browser console and looking for:
- WebSocket connection status
- API request/response logs
- Audio recording status

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For technical support or questions:
1. Check the troubleshooting section
2. Review browser console for errors
3. Open an issue on GitHub
4. Contact the development team

---

**VoiceCare Frontend** - Facilitating healthcare communication through technology.