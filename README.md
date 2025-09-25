# VoiceCare Client Guide

## What is VoiceCare?

VoiceCare is a real-time voice translation system designed specifically for healthcare communication between patients and nurses who speak different languages. It allows you to speak in your native language and have your message automatically translated and spoken to the other person in their preferred language.

## Key Features

- **Instant Voice Translation**: Speak for up to 2 minutes, and your message is automatically translated
- **Profile-Based Languages**: Each user sets their preferred language once in their profile
- **Persistent Chat History**: All conversations are saved and can be accessed from any browser
- **Real-Time Communication**: Messages are delivered and played within 1-3 seconds
- **No App Download Required**: Works directly in your web browser

## Getting Started

### Step 1: Access VoiceCare
Open your web browser and navigate to: `http://localhost:3000`

### Step 2: Create User Profiles
Before starting conversations, you need to create user profiles:

1. Click "Manage Users" on the home page
2. Click "Add User" to create a new profile
3. Fill out the form:
   - **Name**: Enter the person's full name
   - **Role**: Select "Patient" or "Nurse"
   - **Preferred Language**: Choose from English, Spanish, French, Arabic, Urdu, German
   - **Preferred Voice** (optional): Specify a voice preference like "Google UK English Female"
4. Click "Create User"

Repeat this process for each person who will use the system.

### Step 3: Start a Conversation
1. Go to the "Voice Chat" page
2. In the left sidebar:
   - **From (You)**: Select your profile
   - **To (Recipient)**: Select who you want to talk to
3. Click "Start Chat"
4. The system will load any previous conversation history

## How to Send Voice Messages

### Recording Process
1. **Press the Blue Microphone Button**: This starts recording
2. **Speak Clearly**: You have up to 2 minutes to record your message
3. **Watch the Progress**: A red ring shows how much time you've used
4. **Release or Wait**: Stop talking and the system will automatically process your message

### What Happens Next
1. **Speech Recognition**: Your voice is converted to text in your language
2. **Translation**: The text is translated to the recipient's preferred language
3. **Text-to-Speech**: The translated message is spoken aloud to the recipient
4. **Confirmation**: You'll see delivery confirmations (✓ for delivered, ✓✓ for played)

## Understanding the Interface

### Chat Layout
- **Left Sidebar**: User selection and chat status
- **Main Area**: Message history with speech bubbles
- **Bottom**: Recording controls and current transcript

### Message Bubbles
- **Your messages**: Blue bubbles on the right
- **Received messages**: White bubbles on the left
- **Language badges**: Show translation direction (e.g., "EN → ES")
- **Status indicators**: Show if messages were delivered/played
- **Playing indicator**: Green dot appears when audio is playing

### Connection Status
- **Green dot**: Connected and ready
- **Red dot**: Connection issues
- **TTFA display**: Shows response time in milliseconds

## Tips for Best Results

### For Clear Voice Recognition
- **Speak clearly** and at a normal pace
- **Use a quiet environment** when possible
- **Hold the device steady** during recording
- **Speak in complete sentences** for better translation

### For Better Translations
- **Use simple, clear language** when possible
- **Avoid idioms or slang** that may not translate well
- **Speak in your native language** - don't try to use the recipient's language
- **Be patient** - translation takes 1-3 seconds

## Common Scenarios

### Patient Describing Symptoms
**Patient** (Spanish): "Me duele mucho la cabeza y tengo náuseas desde esta mañana"
**System translates to Nurse** (English): "My head hurts a lot and I have nausea since this morning"

### Nurse Giving Instructions
**Nurse** (English): "Please take this medication twice daily with food"
**System translates to Patient** (Arabic): "يرجى تناول هذا الدواء مرتين يوميا مع الطعام"

## Troubleshooting

### "Speech recognition not supported"
- Use Chrome, Edge, or Safari browsers
- Ensure microphone permissions are granted
- Check that you're using HTTPS (or localhost)

### "Recording failed"
- Check microphone permissions in your browser
- Ensure no other applications are using the microphone
- Try refreshing the page and starting again

### "Translation not working"
- Check internet connection
- Verify both users have different preferred languages set
- Try shorter, simpler sentences

### "No audio playback"
- Check speaker volume and browser audio settings
- Ensure browser allows audio playback
- Try clicking the message bubble to replay

## Data and Privacy

### What is Stored
- User profiles (names, roles, language preferences)
- Message text (original and translated)
- Message timestamps and delivery status

### What is NOT Stored
- Audio recordings (voice data is processed in real-time only)
- Personal health information beyond what you choose to share
- Browser or device information

### Data Access
- Messages are stored locally on the server
- Only users in the conversation can see the messages
- Chat history persists across browser sessions

## Getting Help

### For Technical Issues
- Refresh the browser page
- Check the connection status indicator
- Ensure microphone and speaker permissions are granted
- Try using a different browser (Chrome recommended)

### For Translation Quality
- Speak more slowly and clearly
- Use simpler sentence structures
- Verify the correct languages are set in user profiles
- Remember that medical terminology may not always translate perfectly

### System Limitations
- Maximum 2-minute voice recordings
- Requires internet connection for translation
- Works best with supported languages (English, Spanish, French, Arabic, Urdu, German)
- Translation accuracy depends on speech clarity and internet connection

## Support

If you continue to experience issues:
1. Note the exact error message or behavior
2. Check the browser console for technical details
3. Contact your system administrator
4. Provide details about your browser, operating system, and the specific problem

---

*VoiceCare is designed to facilitate healthcare communication. Always verify critical medical information through additional means when necessary.* 
