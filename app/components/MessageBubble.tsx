'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, Check, CheckCheck } from 'lucide-react'

interface Message {
  id: string
  sender_id: string
  sender_name: string
  sender_role: string
  text_source: string
  text_translated: string | null
  source_lang: string
  target_lang: string
  status: 'sent' | 'delivered' | 'played'
  created_at: string
  audio_url?: string
  duration?: number
}

interface MessageBubbleProps {
  message: Message
  isOwnMessage: boolean
  currentUserId: string
  onPlayAudio?: (audioUrl: string, messageId: string) => void
  onMarkAsPlayed?: (messageId: string) => void
}

export default function MessageBubble({
  message,
  isOwnMessage,
  currentUserId,
  onPlayAudio,
  onMarkAsPlayed
}: MessageBubbleProps) {
  const [isPlaying, setIsPlaying ] = useState(false)
  const [playbackProgress, setPlaybackProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element if audio URL is provided
    if (message.audio_url && !audioRef.current) {
      audioRef.current = new Audio(message.audio_url)
      
      audioRef.current.addEventListener('loadedmetadata', () => {
        // Audio loaded
      })
      
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
          setPlaybackProgress(progress)
        }
      })
      
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false)
        setPlaybackProgress(0)
        onMarkAsPlayed?.(message.id)
      })
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [message.audio_url, message.id, onMarkAsPlayed])

  const handlePlayPause = async () => {
    if (!audioRef.current) {
      // If no audio element, try to play via parent component
      if (message.audio_url) {
        onPlayAudio?.(message.audio_url, message.id)
      }
      return
    }

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        await audioRef.current.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Failed to play audio:', error)
      }
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'text-red-600'
      case 'nurse': return 'text-blue-600'
      case 'patient': return 'text-green-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Check className="w-4 h-4 text-gray-500" />
      case 'delivered':
        return <CheckCheck className="w-4 h-4 text-gray-500" />
      case 'played':
        return <CheckCheck className="w-4 h-4 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 animate-slide-up`}>
      <div className={`
        max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm
        ${isOwnMessage 
          ? 'bg-blue-500 text-white ml-12' 
          : 'bg-white text-gray-800 border border-gray-200 mr-12'
        }
        transform transition-all duration-300 hover:scale-[1.02]
      `}>
        {/* Sender Info (for received messages) */}
        {!isOwnMessage && (
          <div className="flex items-center space-x-2 mb-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white bg-blue-500`}>
              {message.sender_name.split(' ').map(n => n[0]).join('')}
            </div>
            <span className="text-sm font-medium text-gray-700">{message.sender_name}</span>
            <span className={`text-xs ${getRoleColor(message.sender_role)}`}>
              {message.sender_role}
            </span>
          </div>
        )}

        {/* Language Translation Badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full ${
              isOwnMessage 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {isOwnMessage 
                ? message.source_lang.toUpperCase()
                : message.target_lang.toUpperCase()
              }
            </span>
            
            {/* Speaker Icon */}
            <button
              onClick={() => {
                if (message.audio_url) {
                  onPlayAudio?.(message.audio_url, message.id)
                } else {
                  onPlayAudio?.('generate', message.id)
                }
              }}
              className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                isOwnMessage 
                  ? 'bg-white/20 hover:bg-white/30' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title={message.audio_url ? 'Play audio' : 'Generate and play audio'}
            >
              <Volume2 className={`w-3 h-3 ${isOwnMessage ? 'text-white' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>

        {/* Audio Player (if audio available) */}
        {message.audio_url && (
          <div className={`flex items-center space-x-3 mb-3 p-3 rounded-xl ${
            isOwnMessage ? 'bg-white/10' : 'bg-gray-50'
          }`}>
            <button
              onClick={handlePlayPause}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isOwnMessage 
                  ? 'bg-white/20 hover:bg-white/30' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {isPlaying ? (
                <Pause className={`w-5 h-5 ${isOwnMessage ? 'text-white' : 'text-gray-600'}`} />
              ) : (
                <Play className={`w-5 h-5 ml-0.5 ${isOwnMessage ? 'text-white' : 'text-gray-600'}`} />
              )}
            </button>
            
            {/* Waveform/Progress Bar */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Volume2 className={`w-4 h-4 ${isOwnMessage ? 'text-white' : 'text-gray-500'}`} />
                <div className={`flex-1 h-1 rounded-full overflow-hidden ${
                  isOwnMessage ? 'bg-white/20' : 'bg-gray-200'
                }`}>
                  <div 
                    className={`h-full transition-all duration-100 ${
                      isOwnMessage ? 'bg-white' : 'bg-blue-500'
                    }`}
                    style={{ width: `${playbackProgress}%` }}
                  />
                </div>
                <span className={`text-xs ${isOwnMessage ? 'text-white/80' : 'text-gray-500'}`}>
                  {formatDuration(message.duration)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Message Text */}
        <div className="space-y-2">
          <div className="text-sm leading-relaxed">
            {isOwnMessage 
              ? message.text_source
              : (message.text_translated || message.text_source)
            }
          </div>
        </div>

        {/* Message Footer */}
        <div className={`flex items-center justify-between mt-2 text-xs ${
          isOwnMessage ? 'text-white/80' : 'text-gray-500'
        }`}>
          <span>{formatTime(message.created_at)}</span>
          {isOwnMessage && (
            <div className="flex items-center space-x-1">
              {getStatusIcon()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
