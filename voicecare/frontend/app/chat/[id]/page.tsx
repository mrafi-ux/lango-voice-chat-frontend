"use client"

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Settings, Wifi, WifiOff, Volume2, VolumeX, AlertCircle } from 'lucide-react'

import AudioRecorder from '../../components/AudioRecorder'
import MessageBubble from '../../components/MessageBubble'
import { useWebSocket } from '../../hooks/useWebSocket'
import { authService } from '../../auth'

interface User {
  id: string
  name: string
  role: string
  preferred_lang: string
}

interface Conversation {
  id: string
  user_a_id: string
  user_b_id: string
  created_at: string
  user_a?: User
  user_b?: User
}

interface Message {
  id: string
  sender_id: string
  sender_name: string
  sender_role: string
  text_source: string
  text_translated: string
  source_lang: string
  target_lang: string
  status: 'sent' | 'delivered' | 'played'
  created_at: string
  audio_url?: string
  duration?: number
}

export default function ConversationChatPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const conversationId = params?.id

  const [user, setUser] = useState<User | null>(null)
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { isConnected, isConnecting, send: sendWebSocketMessage } = useWebSocket({
    userId: user?.id,
    onMessage: handleWebSocketMessage,
    onError: (err) => setError(err)
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const init = async () => {
      try {
        const current = authService.getCurrentUser()
        const token = authService.getToken()
        if (!current || !token) {
          router.push('/auth/login')
          return
        }
        setUser(current)

        // Load conversation and messages
        const [convRes, msgsRes] = await Promise.all([
          fetch(`/api/v1/conversations/${conversationId}`),
          fetch(`/api/v1/messages/${conversationId}`)
        ])

        if (!convRes.ok) throw new Error('Conversation not found')
        const convJson = await convRes.json()
        const conv: Conversation = convJson
        setConversation(conv)

        if (!msgsRes.ok) throw new Error('Failed to load messages')
        const msgsJson = await msgsRes.json()
        const apiMessages = (msgsJson.messages || []) as any[]
        const list: Message[] = apiMessages.map((m) => ({
          id: m.id,
          sender_id: m.sender_id,
          sender_name: m.sender?.name || 'Unknown',
          sender_role: m.sender?.role || 'user',
          text_source: m.text_source,
          text_translated: m.text_translated,
          source_lang: m.source_lang,
          target_lang: m.target_lang,
          status: (m.status || 'sent').toLowerCase(),
          created_at: m.created_at,
        }))
        setMessages(list)
      } catch (e) {
        setError('Failed to load conversation')
      } finally {
        setLoading(false)
      }
    }
    if (conversationId) {
      init()
    }
  }, [conversationId, router])

  function handleWebSocketMessage(message: any) {
    if (message.type === 'message') {
      // Only accept messages for this conversation
      if (message?.message?.conversation_id !== conversationId) return
      const newMessage: Message = {
        id: message.message.id,
        sender_id: message.message.sender_id,
        sender_name: message.message.sender?.name || 'Unknown',
        sender_role: message.message.sender?.role || 'user',
        text_source: message.message.text_source,
        text_translated: message.message.text_translated,
        source_lang: message.message.source_lang,
        target_lang: message.message.target_lang,
        status: 'delivered',
        created_at: message.message.created_at,
        duration: message.play_now?.duration
      }

      setMessages(prev => {
        // Replace optimistic if matches
        if (user && newMessage.sender_id === user.id) {
          const idx = [...prev].reverse().findIndex(m => m.sender_id === user.id && m.id.startsWith('temp-') && m.text_source === newMessage.text_source)
          if (idx !== -1) {
            const realIdx = prev.length - 1 - idx
            const existing = prev[realIdx]
            const merged: Message = {
              ...newMessage,
              audio_url: existing.audio_url || newMessage.audio_url,
              duration: existing.duration || newMessage.duration,
            }
            const copy = [...prev]
            copy[realIdx] = merged
            return copy
          }
        }
        return [...prev, newMessage]
      })

      if (message.play_now) {
        generateTTSAudio(message.play_now.text, message.play_now.lang, newMessage.id, !isMuted)
      }
    }
  }

  const generateTTSAudio = async (text: string, language: string, messageId: string, autoPlay: boolean = false) => {
    try {
      const response = await fetch('/api/v1/tts/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: language, voice_hint: null })
      })
      if (response.ok) {
        const ttsResponse = await response.json()
        if (ttsResponse.needs_browser_fallback || !ttsResponse.audio_base64) {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = language
          speechSynthesis.speak(utterance)
          return
        }
        const audioData = atob(ttsResponse.audio_base64)
        const audioArray = new Uint8Array(audioData.length)
        for (let i = 0; i < audioData.length; i++) audioArray[i] = audioData.charCodeAt(i)
        const audioBlob = new Blob([audioArray], { type: ttsResponse.content_type || 'audio/mpeg' })
        const audioUrl = URL.createObjectURL(audioBlob)
        const estimatedDuration = Math.max(text.length * 0.1, 1)
        setMessages(prev => prev.map(msg => msg.id === messageId ? { ...msg, audio_url: audioUrl, duration: estimatedDuration } : msg))
        if (autoPlay) playAudioFromUrl(audioUrl, messageId)
      }
    } catch {}
  }

  const playAudioFromUrl = async (audioUrl: string, messageId: string) => {
    try {
      if (currentlyPlayingAudio) {
        currentlyPlayingAudio.pause()
        currentlyPlayingAudio.currentTime = 0
      }
      const audio = new Audio(audioUrl)
      setCurrentlyPlayingAudio(audio)
      audio.onended = () => setCurrentlyPlayingAudio(null)
      await audio.play()
    } catch {}
  }

  const handleRecordingComplete = async (audioBlob: Blob, duration: number) => {
    if (!user || !conversation) return

    if (isTranscribing) return
    setIsTranscribing(true)
    setError('')
    const transcribingTimeout = setTimeout(() => setIsTranscribing(false), 30000)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      const sttResponse = await fetch('/api/v1/stt/transcribe', { method: 'POST', body: formData })
      if (!sttResponse.ok) throw new Error('Failed to transcribe audio')
      const sttResult = await sttResponse.json()
      if (sttResult.error) throw new Error(sttResult.error)
      const transcribedText = sttResult.text
      const detectedLang = sttResult.language
      if (!transcribedText.trim()) { setError('No speech detected. Please try again.'); return }

      const recipientId = conversation.user_a_id === user.id ? conversation.user_b_id : conversation.user_a_id
      let targetLang = 'en'
      if (conversation.user_a_id === recipientId) targetLang = conversation.user_a?.preferred_lang || 'en'
      else if (conversation.user_b_id === recipientId) targetLang = conversation.user_b?.preferred_lang || 'en'

      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        sender_name: user.name,
        sender_role: user.role,
        text_source: transcribedText,
        text_translated: transcribedText,
        source_lang: detectedLang,
        target_lang: targetLang,
        status: 'sent',
        created_at: new Date().toISOString(),
        duration
      }
      setMessages(prev => [...prev, tempMessage])
      generateTTSAudio(transcribedText, detectedLang, tempMessage.id, false)

      if (isConnected) {
        const voiceNoteMessage = {
          type: 'voice_note',
          conversation_id: conversation.id,
          sender_id: user.id,
          text_source: transcribedText,
          source_lang: detectedLang,
          target_lang: targetLang,
          client_sent_at: new Date().toISOString()
        }
        sendWebSocketMessage(voiceNoteMessage)
      } else {
        // Fallback: call translation API for demo
        setTimeout(async () => {
          try {
            const translateResponse = await fetch('/api/v1/capabilities/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: transcribedText, source: detectedLang, target: targetLang })
            })
            if (translateResponse.ok) {
              const translateResult = await translateResponse.json()
              const translatedText = translateResult.translatedText || transcribedText
              setMessages(prev => prev.map(msg => msg.id === tempMessage.id ? { ...msg, text_translated: translatedText, status: 'delivered' as const } : msg))
              await generateTTSAudio(translatedText, targetLang, tempMessage.id, true)
            }
          } catch {}
        }, 1000)
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to send voice message')
    } finally {
      clearTimeout(transcribingTimeout)
      setIsTranscribing(false)
    }
  }

  const handlePlayAudio = (audioUrl: string, messageId: string) => {
    if (audioUrl === 'generate') {
      const message = messages.find(m => m.id === messageId)
      if (message) {
        if (user && message.sender_id === user.id) {
          generateTTSAudio(message.text_source, message.source_lang, messageId, true)
        } else {
          const textToSpeak = message.text_translated || message.text_source
          const targetLang = message.target_lang
          generateTTSAudio(textToSpeak, targetLang, messageId, true)
        }
      }
    } else {
      playAudioFromUrl(audioUrl, messageId)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    )
  }
  if (!user || !conversation) return null

  const connectionStatus = isConnected ? 'Online' : isConnecting ? 'Connecting...' : 'Offline'
  const otherName = conversation.user_a_id === user.id ? conversation.user_b?.name : conversation.user_a?.name

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header (same style as /chat) */}
      <div className="glass-card border-b border-white/10 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-white">
                Voice<span className="text-purple-300">Care</span>
              </Link>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-purple-300" />
                <span className="text-white">{otherName}</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <Wifi className="w-5 h-5 text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
                <span className={`text-sm ${isConnected ? 'text-green-400' : 'text-red-400'}`}>{connectionStatus}</span>
              </div>

              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-lg transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white'}`}
                title={isMuted ? 'Unmute audio' : 'Mute audio'}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>

              <button
                onClick={() => { authService.logout(); router.push('/') }}
                className="btn-secondary px-4 py-2 rounded-lg text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex-1 py-6 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-white mb-2">Start Your Conversation</h3>
                <p className="text-purple-100 mb-6">Press the microphone to record your voice message. It will be translated automatically.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {messages.map(m => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isOwnMessage={m.sender_id === user.id}
                  currentUserId={user.id}
                  onPlayAudio={handlePlayAudio}
                  onMarkAsPlayed={(id) => setMessages(prev => prev.map(x => x.id === id ? { ...x, status: 'played' } : x))}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Recorder */}
        <div className="py-6 border-t border-white/10">
          <div className="flex justify-center">
            {isTranscribing ? (
              <div className="flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                <span className="text-white">Processing voice message...</span>
              </div>
            ) : (
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                onRecordingStart={() => setIsRecording(true)}
                onRecordingStop={() => setIsRecording(false)}
                disabled={!conversation || isTranscribing}
                maxDuration={120}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 