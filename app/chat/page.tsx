'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Heart, 
  Users, 
  AlertCircle, 
  MessageCircle, 
  Settings2, 
  Info,
  Settings
} from 'lucide-react'

import AudioRecorder from '../components/AudioRecorder'
import MessageBubble from '../components/MessageBubble'
import { useWebSocket } from '../hooks/useWebSocket'
import { apiClient } from '../api-client'
import { OpenAIRealtimeSession, RealtimeFinalResult } from '../utils/openaiRealtime'

interface User {
  id: string
  name: string
  role: string
  gender?: string
  tts_gender?: string
  preferred_lang: string
  preferred_voice?: string
}

interface Message {
  id: string
  sender_id: string
  sender_name: string
  sender_role: string
  sender_gender?: string
  text_source: string
  text_translated: string | null
  original_text?: string
  source_lang: string
  target_lang: string
  status: 'sent' | 'delivered' | 'played'
  created_at: string
  audio_url?: string
  duration?: number
}

interface Conversation {
  id: string
  user_a_id: string
  user_b_id: string
  user_a_name: string
  user_b_name: string
  created_at: string
  user_a?: User
  user_b?: User
}

interface ChatPageProps {
  conversationId: string | null;
}

export default function ChatPage({ conversationId }: ChatPageProps) {
  const [user, setUser] = useState<User | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const isTranscribingRef = useRef(false)
  const [currentlyPlayingAudio, setCurrentlyPlayingAudio] = useState<HTMLAudioElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [useWebSocketMode, setUseWebSocketMode] = useState(true)
  const [showStartChat, setShowStartChat] = useState(false)
  const [modelInfo, setModelInfo] = useState<null | {
    stt: { provider: string; model?: string }
    tts: { provider: string; model?: string; voice?: string }
    translation: { provider: string; model?: string }
  }>(null)
  const [realtimeEnabled, setRealtimeEnabled] = useState(false)

  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const realtimeSessionRef = useRef<OpenAIRealtimeSession | null>(null)
  const recordingDurationRef = useRef(0)
  const streamingBuffersRef = useRef<Map<string, { chunks: string[]; fmt: string; autoplay: boolean }>>(new Map())

  const convertBlobToPCMChunks = useCallback(
    async (blob: Blob, targetSampleRate = 24000, chunkMillis = 100): Promise<string[]> => {
      let audioCtx = audioContextRef.current
      if (!audioCtx) {
        audioCtx = new AudioContext()
        audioContextRef.current = audioCtx
      }

      const arrayBuffer = await blob.arrayBuffer()
      const decoded = await audioCtx.decodeAudioData(arrayBuffer.slice(0))

      const offlineCtx = new OfflineAudioContext(
        1,
        Math.ceil(decoded.duration * targetSampleRate),
        targetSampleRate
      )

      const downmixed = offlineCtx.createBuffer(1, decoded.length, decoded.sampleRate)
      const downmixData = downmixed.getChannelData(0)
      for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
        const channelData = decoded.getChannelData(channel)
        for (let i = 0; i < channelData.length; i += 1) {
          downmixData[i] += channelData[i] / decoded.numberOfChannels
        }
      }

      const source = offlineCtx.createBufferSource()
      source.buffer = downmixed
      source.connect(offlineCtx.destination)
      source.start(0)

      const rendered = await offlineCtx.startRendering()
      const floatData = rendered.getChannelData(0)
      const pcm16 = new Int16Array(floatData.length)
      for (let i = 0; i < floatData.length; i += 1) {
        const sample = Math.max(-1, Math.min(1, floatData[i]))
        pcm16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      }

      const chunkSamples = Math.max(1, Math.floor((targetSampleRate * chunkMillis) / 1000))
      const bytes = new Uint8Array(pcm16.buffer)
      const bytesPerSample = 2
      const chunks: string[] = []

      for (let offsetSamples = 0; offsetSamples < pcm16.length; offsetSamples += chunkSamples) {
        const samples = Math.min(chunkSamples, pcm16.length - offsetSamples)
        if (samples <= 0) break
        const byteOffset = offsetSamples * bytesPerSample
        const byteLength = samples * bytesPerSample
        const view = bytes.subarray(byteOffset, byteOffset + byteLength)
        let binary = ''
        const subChunkSize = 0x4000
        for (let j = 0; j < view.length; j += subChunkSize) {
          const sub = view.subarray(j, j + subChunkSize)
          binary += String.fromCharCode(...sub)
        }
        chunks.push(btoa(binary))
      }

      return chunks
    },
    []
  )

  // WebSocket connection
  const { 
    isConnected, 
    isConnecting, 
    send: sendWebSocketMessage
  } = useWebSocket({
    userId: user?.id,
    onMessage: handleWebSocketMessage,
    onError: (error) => {
      console.error('WebSocket error:', error)
      setError(error)
    }
  })

  // Track scroll and message state
  const userScrolledUp = useRef(false);
  const lastScrollTop = useRef(0);
  const lastMessageCount = useRef(0);

  // Handle scroll events to detect if user has scrolled up
  const handleScroll = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      
      // Check if user has scrolled up (current scroll position is not at the bottom)
      const isAtBottom = scrollHeight - (scrollTop + clientHeight) < 50; // 50px threshold
      userScrolledUp.current = !isAtBottom;
      lastScrollTop.current = scrollTop;
    }
  }, []);

  const finishTranscribing = useCallback(() => {
    isTranscribingRef.current = false
    setIsTranscribing(false)
  }, [])

  const resolveRecipientInfo = useCallback((conversation: Conversation, senderId: string) => {
    if (conversation.user_a_id !== senderId && conversation.user_b_id !== senderId) {
      throw new Error('Sender not part of conversation')
    }

    const recipientId = conversation.user_a_id === senderId
      ? conversation.user_b_id
      : conversation.user_a_id

    let targetLang = 'en'
    if (conversation.user_a_id === recipientId) {
      targetLang = conversation.user_a?.preferred_lang || 'en'
    } else if (conversation.user_b_id === recipientId) {
      targetLang = conversation.user_b?.preferred_lang || 'en'
    }

    return { recipientId, targetLang }
  }, [])

  useEffect(() => {
    let mounted = true;
    const checkRealtimeSupport = async () => {
      try {
        const res = await fetch('/api/v1/realtime/health');
        if (!mounted) return;
        setRealtimeEnabled(res.ok);
      } catch (err) {
        console.warn('Realtime health check failed', err);
        if (mounted) {
          setRealtimeEnabled(false);
        }
      }
    };
    void checkRealtimeSupport();
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-scroll to bottom only when new messages arrive and user is at the bottom
  const scrollToBottom = useCallback(({ behavior = 'smooth' }: { behavior?: 'auto' | 'smooth' } = {}) => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      
      // Only auto-scroll if user is at the bottom or very close
      if (!userScrolledUp.current || (scrollHeight - (lastScrollTop.current + clientHeight) < 100)) {
        messagesEndRef.current?.scrollIntoView({ behavior });
      }
    }
  }, []);

  // Handle new messages
  useEffect(() => {
    if (messages.length > lastMessageCount.current) {
      // Only auto-scroll if a new message was added
      scrollToBottom({ behavior: 'smooth' });
      lastMessageCount.current = messages.length;
    } else if (messages.length < lastMessageCount.current) {
      // Handle case where messages were deleted
      lastMessageCount.current = messages.length;
    }
  }, [messages.length, scrollToBottom]);

  // Initial scroll to bottom on first load
  useEffect(() => {
    scrollToBottom({ behavior: 'auto' });
    lastMessageCount.current = messages.length;
    
    // Add scroll event listener
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
    };
  }, [scrollToBottom, handleScroll]);


  // Initialize user and load conversations
  useEffect(() => {
    initializeUser()
    // Also fetch model/provider info for display
    fetch('/api/v1/capabilities/models')
      .then(res => res.ok ? res.json() : Promise.reject(new Error('Failed to fetch models')))
      .then(data => setModelInfo(data))
      .catch(err => console.warn('Model info load failed:', err))
  }, [conversationId])

  // Redirect to conversations page with the conversation ID
  useEffect(() => {
    if (activeConversation && router) {
      // Update URL to use the conversations route
      const newUrl = `/conversations?conversationId=${activeConversation.id}`;
      if (window.location.pathname + window.location.search !== newUrl) {
        router.push(newUrl);
      }
    }
  }, [activeConversation, router]);
  
  // Handle direct access to /chat?conversationId=...
  useEffect(() => {
    if (conversationId && router) {
      // Redirect to conversations page with the same conversationId
      router.push(`/conversations?conversationId=${conversationId}`);
    } else if (router) {
      // If no conversationId, redirect to conversations page
      router.push('/conversations');
    }
  }, [conversationId, router]);

  // Load messages when active conversation changes or when conversationId prop changes
  useEffect(() => {
    const loadConversationAndMessages = async () => {
      if (activeConversation) {
        await loadMessages(activeConversation.id);
      } else if (conversationId) {
        // If we have a conversationId from URL but no active conversation,
        // load all conversations and find the matching one
        try {
          const res = await apiClient.getConversations();
          if (res.success && res.data) {
            const conversations = res.data as unknown as Conversation[];
            const conversation = conversations.find(c => c.id === conversationId);
            
            if (conversation) {
              setActiveConversation(conversation);
            } else {
              console.error('Conversation not found');
              router.push('/conversations');
            }
          } else {
            console.error('Failed to load conversations:', res.error);
            router.push('/conversations');
          }
        } catch (error) {
          console.error('Error loading conversations:', error);
          router.push('/conversations');
        }
      }
    };

    loadConversationAndMessages();
  }, [activeConversation, conversationId, router]);
  
  // Handle conversation selection
  const handleConversationSelect = useCallback((conversation: Conversation) => {
    setActiveConversation(conversation);
  }, [])

  const initializeUser = async () => {
    try {
      const token = localStorage.getItem('voicecare_token')
      const userData = localStorage.getItem('voicecare_user')
      
      if (!token || !userData) {
        router.push('/auth/login')
        return
      }

      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)

      await loadConversations(parsedUser.id)
    } catch (error) {
      console.error('Failed to initialize user:', error)
      localStorage.removeItem('voicecare_token')
      localStorage.removeItem('voicecare_user')
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }


  const loadConversations = async (userId: string) => {
    try {
      // Get conversationId from URL if available
      const searchParams = new URLSearchParams(window.location.search);
      const urlConversationId = searchParams.get('conversationId');
      const targetConversationId = conversationId || urlConversationId;
      
      // Try to load conversations from API first
      const response = await fetch('/api/v1/conversations/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('voicecare_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const apiConversations = await response.json();
        if (apiConversations && apiConversations.length > 0) {
          const formattedConversations: Conversation[] = apiConversations.map((conv: any) => ({
            id: conv.id,
            user_a_id: conv.user_a_id,
            user_b_id: conv.user_b_id,
            user_a_name: conv.user_a?.name || 'User A',
            user_b_name: conv.user_b?.name || 'User B',
            created_at: conv.created_at,
            user_a: conv.user_a,
            user_b: conv.user_b
          }));
          
          setConversations(formattedConversations);
          
          // If we have a target conversationId, find and set that conversation
          if (targetConversationId) {
            const targetConversation = formattedConversations.find(c => c.id === targetConversationId);
            if (targetConversation) {
              setActiveConversation(targetConversation);
              return;
            }
          }
          
          // If no specific conversation is requested, use the first one
          if (formattedConversations.length > 0) {
            setActiveConversation(formattedConversations[0]);
            // Update URL to reflect the selected conversation
            if (!targetConversationId) {
              const newUrl = `/chat?conversationId=${formattedConversations[0].id}`;
              window.history.replaceState({}, '', newUrl);
            }
          }
          return;
        }
      }
      
      // Fallback: Create a conversation between Ana and Ben if none exist
      console.log('No conversations found, creating one between Ana (2) and Ben (3)');
      const createResponse = await fetch('/api/v1/conversations/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('voicecare_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_a_id: '2', // Ana
          user_b_id: '3'  // Ben
        })
      });
      
      if (createResponse.ok) {
        const newConv = await createResponse.json();
        const conversation: Conversation = {
          id: newConv.id,
          user_a_id: newConv.user_a_id,
          user_b_id: newConv.user_b_id,
          user_a_name: newConv.user_a?.name || 'Ana Rodriguez',
          user_b_name: newConv.user_b?.name || 'Ben Smith',
          created_at: newConv.created_at,
          user_a: newConv.user_a,
          user_b: newConv.user_b
        };
        
        setConversations([conversation]);
        setActiveConversation(conversation);
        console.log('Created new conversation:', conversation.id);
      } else {
        throw new Error('Failed to create conversation');
      }
      
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations');
      
      // Last resort fallback to mock data
      const mockConversations: Conversation[] = [
        {
          id: 'conv-1',
          user_a_id: '2', // Ana
          user_b_id: '3', // Ben
          user_a_name: 'Ana Rodriguez',
          user_b_name: 'Ben Smith',
          created_at: new Date().toISOString(),
          user_a: { id: '2', name: 'Ana Rodriguez', role: 'admin', preferred_lang: 'es' },
          user_b: { id: '3', name: 'Ben Smith', role: 'nurse', preferred_lang: 'en' }
        }
      ];
      
      setConversations(mockConversations);
      if (mockConversations.length > 0) {
        setActiveConversation(mockConversations[0]);
      }
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/v1/messages/${conversationId}`)
      if (!res.ok) throw new Error('Failed to load messages')
      const payload = await res.json()
      const apiMessages = (payload.messages || []) as any[]
      const list: Message[] = apiMessages.map((m) => {
        const isOwnMessage = user && m.sender_id === user.id
        return {
          id: m.id,
          sender_id: m.sender_id,
          sender_name: m.sender?.name || 'Unknown',
          sender_role: m.sender?.role || 'user',
          sender_gender: m.sender?.gender,
          text_source: m.text_source,
          // For sender's own messages, don't show translated text
          // For received messages, show translated text
          text_translated: isOwnMessage ? null : m.text_translated,
          original_text: m.original_text || m.text_source,
          source_lang: m.source_lang,
          target_lang: m.target_lang,
          status: (m.status || 'sent').toLowerCase(),
          created_at: m.created_at,
        }
      })
      setMessages(list)
    } catch (error) {
      console.error('Failed to load messages:', error)
      setError('Failed to load messages')
    }
  }

  function handleWebSocketMessage(message: any) {
    console.log('Received WebSocket message:', message)
    
    if (message.type === 'message') {
      // New message received
      console.log(`Message from ${message.message.sender?.name}: "${message.message.text_source}" → "${message.message.text_translated}"`)
      console.log(`Language: ${message.message.source_lang} → ${message.message.target_lang}`)
      
      // Determine if this is our own message
      const isOwnMessage = user && message.message.sender_id === user.id;
      
      const newMessage: Message = {
        id: message.message.id,
        sender_id: message.message.sender_id,
        sender_name: message.message.sender?.name || 'Unknown',
        sender_role: message.message.sender?.role || 'user',
        sender_gender: message.message.sender?.gender || message.play_now?.sender_gender,
        text_source: message.message.text_source,
        // For sender's own messages, don't show translated text
        // For received messages, show translated text
        text_translated: isOwnMessage ? null : message.message.text_translated,
        original_text: message.message.original_text || message.message.text_source,
        source_lang: message.message.source_lang,
        target_lang: message.message.target_lang,
        status: 'delivered',
        created_at: message.message.created_at,
        duration: message.play_now?.duration
      };
      
      // Update messages state
      setMessages(prev => {
        // If this is our own message, replace the last optimistic temp message instead of duplicating
        if (isOwnMessage) {
          const idx = [...prev].reverse().findIndex(m => m.sender_id === user.id && m.id.startsWith('temp-') && m.text_source === newMessage.text_source)
          if (idx !== -1) {
            const realIdx = prev.length - 1 - idx
            const existing = prev[realIdx]
            const merged: Message = {
              ...newMessage,
              // Preserve any generated audio/duration from the optimistic message
              audio_url: existing.audio_url || newMessage.audio_url,
              duration: existing.duration || newMessage.duration,
            }
            const copy = [...prev]
            copy[realIdx] = merged
            return copy
          }
        }
        console.log(`Adding message to chat: ${newMessage.sender_name} → ${newMessage.text_translated}`)
        return [...prev, newMessage]
      })
      
      // Only handle audio for received messages (not our own)
      if (!isOwnMessage) {
        // For received messages, use translated text in recipient's preferred language
        const textToSpeak = message.message.text_translated || message.message.text_source;
        const langToUse = user?.preferred_lang || 'en';
        const voiceUserId = message.message.sender_id; // Use sender's voice

        const useRealtimeStream = message.play_now?.stream_realtime

        if (useRealtimeStream) {
          streamingBuffersRef.current.set(newMessage.id, {
            chunks: [],
            fmt: message.play_now?.fmt || 'mp3',
            autoplay: true,
          })
        } else {
          // Generate TTS audio and cache it for manual playback
          generateTTSAudio(
            textToSpeak, 
            langToUse, 
            newMessage.id, 
            false,
            message.play_now?.sender_gender || message.message.sender?.gender,
            voiceUserId
          ).catch(error => {
            console.error('Error generating TTS audio for received message:', error);
          });
        }
      } else if (!message.message.audio_url) {
        // For our own messages, ensure the audio is in the cache
        // This is needed in case the message is received via WebSocket (e.g., after reconnect)
        generateTTSAudio(
          message.message.text_source,
          message.message.source_lang,
          newMessage.id,
          false, // Don't auto-play (already played during send)
          user?.tts_gender || user?.gender,
          user?.id
        ).catch(error => {
          console.error('Error ensuring TTS for own message:', error);
        });
      }
    }

    else if (message.type === 'tts_stream_start') {
      const messageId = message.message_id
      if (!messageId) {
        console.warn('tts_stream_start missing message_id')
        return
      }
      const existing = streamingBuffersRef.current.get(messageId)
      streamingBuffersRef.current.set(messageId, {
        chunks: existing?.chunks || [],
        fmt: message.fmt || existing?.fmt || 'mp3',
        autoplay: existing?.autoplay ?? true,
      })
    }

    else if (message.type === 'tts_stream_chunk') {
      const messageId = message.message_id
      const data = message.data
      if (!messageId || !data) {
        return
      }
      const existing = streamingBuffersRef.current.get(messageId)
      if (!existing) {
        streamingBuffersRef.current.set(messageId, {
          chunks: [data],
          fmt: message.fmt || 'mp3',
          autoplay: true,
        })
      } else {
        existing.chunks.push(data)
      }
    }

    else if (message.type === 'tts_stream_end') {
      const messageId = message.message_id
      if (!messageId) {
        return
      }
      const entry = streamingBuffersRef.current.get(messageId)
      if (!entry) {
        return
      }

      const binaryString = entry.chunks.map(chunk => atob(chunk)).join('')
      const buffer = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        buffer[i] = binaryString.charCodeAt(i)
      }
      const contentType = entry.fmt === 'wav' ? 'audio/wav' : 'audio/mpeg'
      const audioBlob = new Blob([buffer], { type: contentType })
      const audioUrl = URL.createObjectURL(audioBlob)

      const approxDuration = (() => {
        const streamBytes = message.bytes || audioBlob.size
        const sampleRate = message.sr || 24000
        const channels = 1
        const bytesPerSample = entry.fmt === 'pcm16' ? 2 : 2
        const est = streamBytes / (sampleRate * channels * bytesPerSample)
        return Math.max(est, 1)
      })()

      setMessages(prev => prev.map(msg => 
        msg.id === messageId
          ? { ...msg, audio_url: audioUrl, duration: approxDuration }
          : msg
      ))

      if (entry.autoplay) {
        playAudioFromUrl(audioUrl, messageId).catch(err => {
          console.error('Failed to autoplay realtime stream:', err)
        })
      }

      streamingBuffersRef.current.delete(messageId)
    }
  }

  const generateTTSAudio = async (text: string, language: string, messageId: string, autoPlay: boolean = false, senderGender?: string, senderId?: string) => {
    try {
      const requestBody = {
        text,
        lang: language,
        voice_hint: null,
        sender_gender: senderGender,
        sender_id: senderId
      };
      
      console.log('Sending TTS request to /api/v1/tts/speak with:', requestBody);
      
      const response = await fetch('/api/v1/tts/speak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      if (response.ok) {
        const ttsResponse = await response.json()
        
        if (ttsResponse.needs_browser_fallback || !ttsResponse.audio_base64) {
          console.log('Using browser TTS fallback')
          // Use browser speech synthesis as fallback
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = language
          speechSynthesis.speak(utterance)
          return
        }
        
        // Decode base64 audio data
        const audioData = atob(ttsResponse.audio_base64)
        const audioArray = new Uint8Array(audioData.length)
        for (let i = 0; i < audioData.length; i++) {
          audioArray[i] = audioData.charCodeAt(i)
        }
        
        const audioBlob = new Blob([audioArray], { type: ttsResponse.content_type || 'audio/mpeg' })
        const audioUrl = URL.createObjectURL(audioBlob)
        
        // Update the message with audio URL and estimated duration
        const estimatedDuration = Math.max(text.length * 0.1, 1) // Rough estimate: 0.1 seconds per character
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { 
                ...msg, 
                audio_url: audioUrl, 
                duration: estimatedDuration
              }
            : msg
        ))

        // Auto-play if requested
        if (autoPlay) {
          playAudioFromUrl(audioUrl, messageId)
        }
        
        console.log(`Generated TTS audio for message ${messageId}: ${audioBlob.size} bytes`)
      } else {
        console.error('TTS request failed:', response.status, response.statusText)
        const errorText = await response.text()
        console.error('TTS error details:', errorText)
      }
    } catch (error) {
      console.error('Failed to generate TTS audio:', error)
    }
  }

  const playAudioFromUrl = async (audioUrl: string, messageId: string) => {
    try {
      // Stop any currently playing audio
      if (currentlyPlayingAudio) {
        currentlyPlayingAudio.pause()
        currentlyPlayingAudio.currentTime = 0
      }

      const audio = new Audio(audioUrl)
      setCurrentlyPlayingAudio(audio)

      audio.onended = () => {
        setCurrentlyPlayingAudio(null)
        if (useWebSocketMode) {
          // sendPlayedStatus(messageId) // This function is no longer available from useWebSocket
        }
      }

      await audio.play()
    } catch (error) {
      console.error('Failed to play audio:', error)
    }
  }

  const playTTSAudio = async (text: string, language: string, messageId: string) => {
    // This function is now just a wrapper for generateTTSAudio with autoPlay
    await generateTTSAudio(text, language, messageId, true, undefined, undefined)
  }

  const processVoiceNote = useCallback(async ({
    transcribedText,
    detectedLang,
    duration,
    translationHint,
    fromRealtime = false,
  }: {
    transcribedText: string
    detectedLang: string
    duration: number
    translationHint?: string | null
    fromRealtime?: boolean
  }) => {
    try {
      if (!user || !activeConversation) {
        throw new Error('No active conversation selected')
      }

      const trimmed = (transcribedText || '').trim()
      if (!trimmed) {
        setError('No speech detected. Please try again.')
        return
      }

      const { recipientId, targetLang } = resolveRecipientInfo(activeConversation, user.id)

      console.log(`Translation: ${user.name} (${detectedLang}) → Recipient ${recipientId} (${targetLang})`)

      const tempMessageId = `temp-${Date.now()}`
      const tempMessage: Message = {
        id: tempMessageId,
        sender_id: user.id,
        sender_name: user.name,
        sender_role: user.role,
        sender_gender: user.tts_gender || user.gender,
        text_source: trimmed,
        text_translated: null, // Sender should see original text only
        source_lang: detectedLang,
        target_lang: targetLang,
        status: 'sent',
        created_at: new Date().toISOString(),
        duration,
        original_text: trimmed,
      }

      setMessages(prev => [...prev, tempMessage])

      if (!fromRealtime) {
        generateTTSAudio(
          trimmed,
          detectedLang,
          tempMessage.id,
          false,
          user.tts_gender || user.gender,
          user.id
        ).catch(err => {
          console.error('Error generating sender TTS:', err)
        })
      }

      let webSocketSent = false
      if (!fromRealtime && useWebSocketMode && isConnected) {
        const voiceNoteMessage = {
          type: 'voice_note' as const,
          conversation_id: activeConversation.id,
          sender_id: user.id,
          text_source: trimmed,
          source_lang: detectedLang,
          target_lang: targetLang,
          client_sent_at: new Date().toISOString(),
          play_now: null,
        }

        console.log('Sending voice note via WebSocket:', voiceNoteMessage)
        webSocketSent = sendWebSocketMessage(voiceNoteMessage)

        if (!webSocketSent) {
          console.log('WebSocket send failed, falling back to demo mode')
        }
      }

      if (translationHint) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempMessageId
              ? { ...msg, status: 'delivered' as const }
              : msg
          )
        )

        if (!fromRealtime) {
          await generateTTSAudio(
            translationHint,
            targetLang,
            tempMessageId,
            false
          ).catch(err => console.error('Error generating realtime translated TTS:', err))

          if (user) {
            await generateTTSAudio(
              trimmed,
              user.preferred_lang,
              tempMessageId,
              false,
              user.tts_gender || user.gender,
              user.id
            ).catch(err => console.error('Error generating sender preferred TTS:', err))
          }
        }
      }

      if (!translationHint && (!useWebSocketMode || !isConnected || !webSocketSent)) {
        console.log('Running in demo mode (no WebSocket or realtime translation)')
        setTimeout(async () => {
          try {
            const translateResponse = await fetch('/api/v1/capabilities/translate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text: trimmed,
                source: detectedLang,
                target: targetLang,
              }),
            })

            if (translateResponse.ok) {
              const translateResult = await translateResponse.json()

              if (translateResult.error) {
                console.error('Translation error:', translateResult.error)
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === tempMessageId
                      ? { ...msg, text_translated: null, status: 'delivered' as const }
                      : msg
                  )
                )
              } else {
                const translatedText = translateResult.translatedText

                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === tempMessageId
                      ? { ...msg, text_translated: null, status: 'delivered' as const }
                      : msg
                  )
                )

                if (!fromRealtime) {
                  await generateTTSAudio(
                    translatedText,
                    targetLang,
                    tempMessageId,
                    false
                  )

                  if (user) {
                    await generateTTSAudio(
                      trimmed,
                      user.preferred_lang,
                      tempMessageId,
                      false,
                      user.tts_gender || user.gender,
                      user.id
                    )
                  }
                }
              }
            } else {
              console.error('Translation API failed:', translateResponse.status)
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === tempMessageId
                    ? { ...msg, text_translated: null, status: 'delivered' as const }
                    : msg
                )
              )
            }
          } catch (err) {
            console.error('Translation failed:', err)
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Failed to process voice message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send voice message')
    }
  }, [user, activeConversation, resolveRecipientInfo, setMessages, generateTTSAudio, useWebSocketMode, isConnected, sendWebSocketMessage])

  const handleRealtimeFinal = useCallback(async (result: RealtimeFinalResult) => {
    try {
      const transcript = (result.transcript || '').trim()

      const detectedLang = result.detectedLanguage || user?.preferred_lang || 'en'
      const translationText = (result.translation || '').trim()
      const translationForRecipient = translationText || transcript

      if (!translationForRecipient) {
        setError('Realtime session did not capture any speech. Please try again.')
        return
      }

      await processVoiceNote({
        transcribedText: transcript,
        detectedLang,
        duration: recordingDurationRef.current,
        translationHint: translationText || null,
        fromRealtime: true,
      })

      if (useWebSocketMode && isConnected && activeConversation && user && translationForRecipient) {
        try {
          const { targetLang } = resolveRecipientInfo(activeConversation, user.id)
          sendWebSocketMessage({
            type: 'realtime_translation_final',
            conversation_id: activeConversation.id,
            sender_id: user.id,
            target_lang: targetLang,
            source_lang: detectedLang,
            text: translationForRecipient,
            text_source: transcript,
            voice_hint: user.tts_gender || user.gender,
            client_sent_at: new Date().toISOString(),
          })
        } catch (err) {
          console.error('Failed to send realtime_translation_final message:', err)
        }
      }
    } catch (err) {
      console.error('Realtime final handler failed:', err)
      setError(err instanceof Error ? err.message : 'Realtime processing failed')
    } finally {
      realtimeSessionRef.current?.stop()
      realtimeSessionRef.current = null
      finishTranscribing()
    }
  }, [
    processVoiceNote,
    finishTranscribing,
    user,
    useWebSocketMode,
    isConnected,
    activeConversation,
    sendWebSocketMessage,
    resolveRecipientInfo,
  ])

  const handleRealtimeStreamAvailable = useCallback(async (stream: MediaStream) => {
    if (!realtimeEnabled || !user || !activeConversation) {
      return
    }

    const handleSessionError = (err: unknown) => {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : (() => {
                try {
                  return JSON.stringify(err)
                } catch {
                  return String(err)
                }
              })()

      console.error('Realtime session error:', err)
      setError(`Realtime session error: ${errorMessage}`)
      finishTranscribing()
      if (realtimeSessionRef.current) {
        realtimeSessionRef.current.stop()
        realtimeSessionRef.current = null
      }
    }

    try {
      const { targetLang } = resolveRecipientInfo(activeConversation, user.id)
      const session = new OpenAIRealtimeSession({
        tokenEndpoint: '/api/v1/realtime/webrtc/token',
        targetLanguage: targetLang,
        sourceLanguage: user.preferred_lang || 'auto',
        onFinalResult: handleRealtimeFinal,
        onError: handleSessionError,
      })

      realtimeSessionRef.current?.stop()
      realtimeSessionRef.current = session
      const session_started = await session.start(stream)
    } catch (err) {
      handleSessionError(err)
    }
  }, [realtimeEnabled, user, activeConversation, resolveRecipientInfo, handleRealtimeFinal, finishTranscribing])

  const handleRealtimeStreamStopped = useCallback(() => {
    // Session cleanup happens after finalize or error handlers.
  }, [])

  const onRecordingStart = useCallback(() => {
    setIsRecording(true)
    recordingDurationRef.current = 0
    setError('')
  }, [])

  const onRecordingStop = useCallback(() => {
    setIsRecording(false)
  }, [])

  const handleRecordingComplete = useCallback(async (audioBlob: Blob, duration: number) => {
    if (!user || !activeConversation) return

    recordingDurationRef.current = duration

    if (realtimeEnabled && realtimeSessionRef.current) {
      if (isTranscribingRef.current) {
        console.warn('Realtime finalize already in progress')
        return
      }
      isTranscribingRef.current = true
      setIsTranscribing(true)
      try {
        const sessionAny = realtimeSessionRef.current as unknown as { appendAudioBase64?: (c: string) => Promise<void>; finalize: () => Promise<unknown> }
        if (typeof sessionAny.appendAudioBase64 === 'function') {
          const pcmChunks = await convertBlobToPCMChunks(audioBlob)
          for (const chunk of pcmChunks) {
            await sessionAny.appendAudioBase64!(chunk)
          }
          await new Promise((resolve) => setTimeout(resolve, 200))
        }
        const data = await realtimeSessionRef.current.finalize()
        console.log('Realtime finalize data:', data)
        return
      } catch (err) {
        console.error('Realtime finalize failed, falling back to STT pipeline:', err)
        setError('Realtime session could not be completed. Falling back to standard processing.')
        realtimeSessionRef.current?.stop()
        realtimeSessionRef.current = null
        finishTranscribing()
        // Continue with STT fallback below
      }
    }

    if (isTranscribingRef.current) {
      return
    }

    isTranscribingRef.current = true
    setIsTranscribing(true)
    setError('')

    const transcribingTimeout = setTimeout(() => {
      setIsTranscribing(false)
    }, 30000)

    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('language', user.preferred_lang)

     
      const sttResponse = await fetch('/api/v1/stt/transcribe', {
        method: 'POST',
        body: formData,
      })

      if (!sttResponse.ok) {
        throw new Error('Failed to transcribe audio')
      }

      const sttResult = await sttResponse.json()

      if (sttResult.error) {
        throw new Error(sttResult.error)
      }

      const transcribedText = sttResult.text
      const detectedLang = sttResult.language

      await processVoiceNote({
        transcribedText,
        detectedLang,
        duration,
      })
    } catch (error) {
      console.error('Failed to process voice message:', error)
      setError(error instanceof Error ? error.message : 'Failed to send voice message')
    } finally {
      clearTimeout(transcribingTimeout)
      finishTranscribing()
    }
  }, [user, activeConversation, realtimeEnabled, processVoiceNote, finishTranscribing, convertBlobToPCMChunks])

  const handlePlayAudio = (audioUrl: string, messageId: string) => {
    if (audioUrl === 'generate') {
      // Generate TTS for this message
      const message = messages.find(msg => msg.id === messageId)
      if (message) {
        // For the current user, always use their preferred language
        if (user) {
          // If this is the sender, use original text and their preferred language
          if (message.sender_id === user.id) {
            generateTTSAudio(
              message.text_source, 
              user.preferred_lang, // Use user's preferred language
              messageId, 
              true, 
              user.tts_gender || user.gender, 
              user.id
            )
          } else {
            // For received messages, use translated text and recipient's preferred language
            const textToSpeak = message.text_translated || message.text_source
            generateTTSAudio(
              textToSpeak, 
              user.preferred_lang, // Use current user's preferred language
              messageId, 
              true, 
              message.sender_gender,
              message.sender_id
            )
          }
        } else {
          // Fallback if user is not available
          const textToSpeak = message.text_translated || message.text_source
          const targetLang = message.target_lang
          generateTTSAudio(
            textToSpeak,
            targetLang,
            messageId,
            true,
            message.sender_gender,
            message.sender_id
          )
        }
      }
    } else {
      // Play existing audio
      playAudioFromUrl(audioUrl, messageId)
    }
  }

  const handleMarkAsPlayed = (messageId: string) => {
    // Update message status to played
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, status: 'played' as const } : msg
    ))
    
    // Send played status via WebSocket
    if (useWebSocketMode && isConnected) {
      const playedMessage = {
        type: 'played',
        message_id: messageId
      }
      console.log('Sending played status:', playedMessage)
      sendWebSocketMessage(playedMessage)
    }
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem('voicecare_token')
    localStorage.removeItem('voicecare_user')
    router.push('/')
  }, [router])

  const getOtherParticipant = useCallback((conversation: Conversation) => {
    if (!user) return null
    
    return {
      id: conversation.user_a_id === user.id ? conversation.user_b_id : conversation.user_a_id,
      name: conversation.user_a_id === user.id ? conversation.user_b_name : conversation.user_a_name
    }
  }, [user])

  const toggleWebSocketMode = useCallback(() => {
    setUseWebSocketMode(prev => !prev)
    setError('')
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!conversationId) return
      
      setLoading(true)
      try {
        // Fetch all conversations and find the active one
        const convsRes = await apiClient.getConversations()
        if (!convsRes.success || !convsRes.data) {
          throw new Error(convsRes.error || 'Failed to load conversations')
        }
        
        const conv = (convsRes.data as unknown as Conversation[]).find(c => c.id === conversationId)
        if (!conv) {
          throw new Error('Conversation not found')
        }
        
        setActiveConversation(conv)
        
        // Fetch messages for the conversation
        const messagesRes = await apiClient.getMessages(conversationId)
        if (messagesRes.success && messagesRes.data) {
          // Ensure all messages have required sender_name and sender_role
          const processedMessages = (messagesRes.data as unknown as Message[]).map(msg => ({
            ...msg,
            sender_name: msg.sender_name || 'Unknown',
            sender_role: msg.sender_role || 'user',
            status: msg.status || 'sent',
            source_lang: msg.source_lang || 'en',
            target_lang: msg.target_lang || 'en',
            text_translated: msg.text_translated || null,
            created_at: msg.created_at || new Date().toISOString()
          }))
          setMessages(processedMessages)
        }
        
        // Get provider info which includes model information
        const providerRes = await apiClient.getProviderInfo()
        if (providerRes.success && providerRes.data) {
          setModelInfo({
            stt: { provider: providerRes.data.stt.name },
            tts: { provider: providerRes.data.tts.name },
            translation: { provider: providerRes.data.translation.name }
          })
        }
        
      } catch (err) {
        console.error('Error fetching conversation data:', err)
        setError('Failed to load conversation. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [conversationId])

  if (loading) {
    return null;
  }

  if (!user || !activeConversation) {
    return null;
  }

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mb-4">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">No conversation selected</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Please select a conversation from the sidebar or start a new one.
        </p>
      </div>
    )
  }

  const connectionStatus = useWebSocketMode 
    ? (isConnected ? 'Online' : isConnecting ? 'Connecting...' : 'Offline')
    : 'Demo Mode';

  return (
    <div className="flex flex-col h-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="relative flex-1 overflow-y-auto p-4 bg-cover bg-center" 
          style={{ background: 'linear-gradient(0deg, rgba(239, 246, 255, 0.2), rgba(239, 246, 255, 0.2)), url(/background.png) repeat' }}
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <MessageCircle className="w-12 h-12 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Start Your Conversation
              </h3>
              <p className="text-muted-foreground text-center mb-8 max-w-md">
                Press the microphone to record your voice message.
                It will be automatically translated for your recipient.
              </p>
                     
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwnMessage={message.sender_id === user?.id}
                  currentUserId={user?.id || ''}
                  onPlayAudio={handlePlayAudio}
                  onMarkAsPlayed={handleMarkAsPlayed}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Error/Status Message */}
        {error && (
          <div className={`rounded-xl p-4 mb-6 ${
            error.includes('Demo mode')
              ? 'bg-blue-500/10 border border-blue-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}>
            <p className={`flex items-center text-sm ${
              error.includes('Demo mode') ? 'text-blue-500' : 'text-red-500'
            }`}>
              {error.includes('Demo mode') ? (
                <Info className="w-4 h-4 mr-2" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2" />
              )}
              {error}
            </p>
          </div>
        )}

        {/* Recording Area */}
        <div 
          className="border-t border-border/50 bg-background/80 backdrop-blur-sm p-4 relative"
          style={{
            background: 'linear-gradient(0deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url(/background.png)',
            backgroundSize: 'auto',
            backgroundRepeat: 'repeat',
          }}
        >
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex justify-center">
              {isTranscribing ? (
                <div className="flex items-center space-x-3 px-4 py-2 bg-accent/20 rounded-full">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent"></div>
                  <span className="text-foreground text-sm">Processing voice message...</span>
                </div>
              ) : (
                <AudioRecorder
                  onRecordingComplete={handleRecordingComplete}
                  onRecordingStart={onRecordingStart}
                  onRecordingStop={onRecordingStop}
                  onStreamAvailable={handleRealtimeStreamAvailable}
                  onStreamStopped={handleRealtimeStreamStopped}
                  disabled={!activeConversation || isTranscribing}
                  maxDuration={120}
                />
              )}
            </div>
            
            {/* Connection status */}
            <div className="mt-2 text-center">
              <div className="inline-flex items-center justify-center text-xs text-muted-foreground">
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                  useWebSocketMode 
                    ? (isConnected ? 'bg-green-500' : 'bg-red-500') 
                    : 'bg-amber-500'
                }`}></span>
                {connectionStatus}
                {useWebSocketMode && !isConnected && !isConnecting && (
                  <button 
                    onClick={toggleWebSocketMode}
                    className="ml-2 text-xs text-primary hover:underline"
                  >
                    Switch to Demo Mode
                  </button>
                )}
              </div>
            </div>

            {/* Recording Instructions */}
            {!isRecording && !isTranscribing && (
              <div className="text-center mt-3">
                <p className="text-sm text-muted-foreground">
                  {useWebSocketMode 
                    ? (isConnected 
                        ? 'Press the microphone to start recording'
                        : (
                          <span className="flex items-center justify-center text-amber-500">
                            <WifiOff className="w-4 h-4 mr-1.5" />
                            WebSocket disconnected - using demo mode
                          </span>
                        )
                      )
                    : 'Demo mode - STT and translation only'
                  }
                </p>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center text-sm text-primary hover:text-primary/80 mt-2 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-1.5" />
                    Admin Dashboard
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
