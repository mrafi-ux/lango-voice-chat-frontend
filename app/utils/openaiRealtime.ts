export interface RealtimeSessionOptions {
  tokenEndpoint: string
  model?: string
  voice?: string
  format?: string
  sampleRate?: number
  sourceLanguage?: string
  targetLanguage: string
  onPartialTranscription?: (text: string) => void
  onPartialTranslation?: (text: string) => void
  onFinalResult?: (result: RealtimeFinalResult) => void
  onError?: (error: Error | string) => void
}

export interface RealtimeFinalResult {
  transcript: string
  translation?: string
  detectedLanguage?: string
  rawResponse?: Record<string, unknown>
}

const DEFAULT_REALTIME_MODEL = 'gpt-realtime-mini'
const DEFAULT_AUDIO_VOICE = 'alloy'

export class OpenAIRealtimeSession {
  private readonly options: RealtimeSessionOptions
  private peer?: RTCPeerConnection
  private dataChannel?: RTCDataChannel
  private remoteStream?: MediaStream
  private remoteAudioEl?: HTMLAudioElement
  private token?: string
  private partialTranscript = ''
  private partialTranslation = ''
  private finalized = false
  private channelReady?: Promise<void>
  private channelReadyResolve?: () => void
  private sessionStartTime = 0

  private attachDataChannel(channel: RTCDataChannel) {
    this.dataChannel = channel
    channel.onmessage = (msgEvent) => {
      this.handleRealtimeMessage(msgEvent.data)
    }
    channel.onerror = (errorEvent) => {
      this.emitError(new Error(`Realtime data channel error: ${JSON.stringify(errorEvent)}`))
    }
    if (channel.readyState === 'open') {
      this.configureSession()
      this.channelReadyResolve?.()
    } else {
      channel.onopen = () => {
        this.configureSession()
        this.channelReadyResolve?.()
      }
    }
  }

  constructor(options: RealtimeSessionOptions) {
    this.options = options
  }

  async start(localStream: MediaStream) {
    try {
      this.token = await this.fetchToken()
    } catch (err) {
      this.emitError(err)
      throw err
    }

    this.partialTranscript = ''
    this.partialTranslation = ''
    this.finalized = false
    this.sessionStartTime = Date.now()

    const pc = new RTCPeerConnection({ iceServers: [] })
    this.peer = pc

    const localChannel = pc.createDataChannel('oai-events')
    this.attachDataChannel(localChannel)
    
    pc.ontrack = (event) => {
      if (!this.remoteStream) {
        console.log('Creating remote stream')
        this.remoteStream = new MediaStream()
        const audioEl = new Audio()
        audioEl.autoplay = true
        audioEl.muted = true // Start muted, unmute on finalize
        audioEl.srcObject = this.remoteStream
        this.remoteAudioEl = audioEl
        console.log('Playing remote audio stream')
        void audioEl.play().catch(() => {
          /* autoplay might be blocked; ignore here */
        })
      }

      console.log('Received remote track', event.track)
      event.streams[0]?.gpc.onetAudioTracks().forEach((track) => {
        track.enabled = true
        console.log('Adding remote track to remote stream', track)
        if (this.remoteStream) {
          this.remoteStream.addTrack(track)
        }
      })
    }

    localStream.getTracks().forEach((track) => {
      console.log('Adding local track to peer connection', track)
      if (track.kind === 'audio') {
        track.enabled = true
        console.log('Track state:', track.readyState, 'enabled:', track.enabled)
      }
      pc.addTrack(track, localStream)
    })

    this.channelReady = new Promise<void>((resolve) => {
      this.channelReadyResolve = resolve
    })

    pc.ondatachannel = (event) => {
      console.log('Received remote data channel', event)
      this.attachDataChannel(event.channel)
    }

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    const answer = await this.sendOffer(offer.sdp || '')
    await pc.setRemoteDescription({ type: 'answer', sdp: answer })

    if (this.channelReady) {
      await this.channelReady
      this.channelReady = undefined
      this.channelReadyResolve = undefined
    }
  }

  async finalize() {
    if ((!this.dataChannel || this.dataChannel.readyState !== 'open') && this.channelReady) {
      await this.channelReady
    }
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Realtime data channel not ready')
    }
    if (this.finalized) {
      return
    }

    // For WebRTC audio streaming, wait for sufficient time to pass
    // instead of checking appendedAudioBytes (which is only for manual audio)
    const minRecordingTime = 1000 // At least 1 second of recording
    const elapsed = Date.now() - this.sessionStartTime
    if (elapsed < minRecordingTime) {
      const waitTime = minRecordingTime - elapsed
      console.log(`Waiting ${waitTime}ms for sufficient audio recording...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }

    const voice = this.options.voice || DEFAULT_AUDIO_VOICE
    const targetLang = this.options.targetLanguage
    const sourceLang = this.options.sourceLanguage || 'auto'
    const sourceLabel = this.languageLabel(sourceLang)
    const targetLabel = this.languageLabel(targetLang)

    const payload = {
      type: 'response.create',
      response: {
        instructions: [
          'You operate strictly as a translation pipeline.',
          `Listen to the microphone audio in ${sourceLabel} and produce a faithful transcript.`,
          `Translate the transcript into ${targetLabel}.`,
          `Respond with synthesized speech in ${targetLabel} and provide the text translation.`,
          'Never ask questions, request clarification, or add commentary.',
        ].join(' '),
        modalities: ['audio','text'], // Must use this combination
        output_audio_format: "pcm16",
        metadata: {
          source_language: sourceLang,
          target_language: targetLang,
        },
      },
    }

    if (voice) {
      (payload.response as Record<string, unknown>)["voice"] = voice
    }

    console.log('Finalizing with payload:', payload)
    
    // Commit the audio buffer and request response
    this.dataChannel.send(JSON.stringify({ type: 'input_audio_buffer.commit' }))
    this.dataChannel.send(JSON.stringify(payload))
    console.log("Outgoing payload:", JSON.stringify(payload, null, 2))

    
    // Unmute remote audio to hear the translation
    if (this.remoteAudioEl) {
      this.remoteAudioEl.muted = false
    }
    
    this.finalized = true
  }

  stop() {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.close()
      } catch (err) {
        this.emitError(err)
      }
    }
    if (this.peer) {
      this.peer.getSenders().forEach((sender) => {
        try {
          sender.track?.stop()
        } catch {
          /* ignore */
        }
      })
      this.peer.close()
      this.peer = undefined
    }
    this.dataChannel = undefined
    this.remoteStream = undefined
    if (this.remoteAudioEl) {
      try {
        this.remoteAudioEl.muted = true
        this.remoteAudioEl.pause()
        this.remoteAudioEl.srcObject = null
      } catch {
        /* ignore */
      }
    }
    this.remoteAudioEl = undefined
    this.token = undefined
    this.partialTranscript = ''
    this.partialTranslation = ''
    this.finalized = false
    this.channelReady = undefined
    this.channelReadyResolve = undefined
    this.sessionStartTime = 0
  }

  private languageLabel(code: string | undefined): string {
    if (!code || code.toLowerCase() === 'auto') {
      return 'the detected language'
    }
    try {
      const display = new Intl.DisplayNames(['en'], { type: 'language' })
      const label = display.of(code)
      if (label) {
        return label
      }
    } catch {
      // Ignore
    }
    const lower = code.toLowerCase()
    const fallback: Record<string, string> = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      zh: 'Chinese',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
      hi: 'Hindi',
      ru: 'Russian',
    }
    return fallback[lower] || code
  }

  private async fetchToken(): Promise<string> {
    const res = await fetch(this.options.tokenEndpoint, {
      method: 'POST',
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch realtime token (${res.status})`)
    }

    const data = await res.json()
    const token = data?.token
    if (!token || typeof token !== 'string') {
      throw new Error('Realtime token response missing token field')
    }
    return token
  }

  private async sendOffer(offerSdp: string): Promise<string> {
    if (!this.token) {
      throw new Error('Realtime token not available')
    }

    const response = await fetch(
      `https://api.openai.com/v1/realtime?model=${encodeURIComponent(
        this.options.model || DEFAULT_REALTIME_MODEL
      )}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/sdp',
          'OpenAI-Beta': 'realtime=v1',
        },
        body: offerSdp,
      }
    )
  
    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Realtime SDP negotiation failed (${response.status}): ${text}`)
    }

    
    return await response.text()
    
  }

  private configureSession() {
    if (!this.dataChannel) return

    const targetLang = this.options.targetLanguage
    const sourceLang = this.options.sourceLanguage || 'auto'

    const sessionUpdate = {
      type: 'session.update',
      session: {
        instructions: [
          'Act strictly as a speech-to-speech translator. No chit-chat.',
          `Listen to the microphone audio (source language: ${sourceLang}).`,
          `Translate into ${targetLang}.`,
          'Respond with synthesized speech and text translation in the target language.',
        ].join(' '),
        modalities: ['audio', 'text'], 
        // Enable input audio transcription so we can see what was heard
        input_audio_transcription: {
          model: 'whisper-1'
        }
      },
    }

    try {
      this.dataChannel.send(JSON.stringify(sessionUpdate))
    } catch (err) {
      this.emitError(err)
    }
  }

  private handleRealtimeMessage(data: any) {
    let payload: any
    try {
      payload = typeof data === 'string' ? JSON.parse(data) : data
    } catch {
      return
    }

    console.log('OpenAI realtime event:', payload.type, payload)

    const type = payload?.type
    if (!type) return

    switch (type) {
      case 'conversation.item.input_audio_transcription.completed': {
        // This is the transcription of what the user said
        const transcript = payload?.transcript ?? ''
        this.partialTranscript = transcript
        this.options.onPartialTranscription?.(transcript)
        console.log('Input transcription:', transcript)
        break
      }
      case 'response.audio_transcript.delta': {
        // This is the translation being spoken
        const delta = payload?.delta ?? ''
        this.partialTranslation += delta
        this.options.onPartialTranslation?.(this.partialTranslation)
        break
      }
      case 'response.audio_transcript.done': {
        // Translation complete
        const transcript = payload?.transcript ?? ''
        this.partialTranslation = transcript
        this.options.onPartialTranslation?.(transcript)
        console.log('Translation complete:', transcript)
        break
      }
      case 'response.done': {
        const transcript = this.partialTranscript.trim()
        const translation = this.partialTranslation.trim()
        
        this.options.onFinalResult?.({
          transcript,
          translation,
          detectedLanguage: payload?.response?.output?.[0]?.content?.[0]?.language,
          rawResponse: payload?.response,
        })
        break
      }
      case 'response.output_item.done': {
        console.log('Output item done:', payload)
        break
      }
      case 'error': {
        const rawError = payload?.error ?? payload
        let formatted = 'Realtime error'
        if (typeof rawError === 'string') {
          formatted = rawError
        } else {
          try {
            formatted = JSON.stringify(rawError, null, 2)
          } catch {
            formatted = String(rawError)
          }
        }
        this.emitError(new Error(formatted))
        break
      }
      default:
        // Log unhandled events for debugging
        if (type.includes('error')) {
          console.error('Realtime error event:', payload)
        }
        break
    }
  }

  private emitError(err: unknown) {
    let errorMessage: string
    if (err instanceof Error) {
      errorMessage = err.message
    } else if (typeof err === 'string') {
      errorMessage = err
    } else {
      try {
        errorMessage = JSON.stringify(err)
      } catch {
        errorMessage = String(err)
      }
    }
    const error = err instanceof Error ? err : new Error(errorMessage)
    this.options.onError?.(error)
  }
}