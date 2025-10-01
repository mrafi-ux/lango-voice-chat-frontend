'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface LanguageCapabilities {
  stt_languages: string[]
  translation_languages: { source: string[], target: string[] }
  tts_voices: { [key: string]: string[] }
}

export default function LanguageCapabilitiesPage() {
  const [capabilities, setCapabilities] = useState<LanguageCapabilities | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCapabilities()
  }, [])

  const fetchCapabilities = async () => {
    try {
      // Mock data for now - in real app this would come from backend
      const mockCapabilities: LanguageCapabilities = {
        stt_languages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'ru'],
        translation_languages: {
          source: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'ru'],
          target: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ar', 'hi', 'ja', 'ko', 'zh', 'ru']
        },
        tts_voices: {
          'English': ['Rachel', 'Clyde', 'Domi', 'Dave', 'Fin'],
          'Spanish': ['Mateo', 'Valentina', 'Liam', 'Mia'],
          'French': ['Thomas', 'Charlotte', 'Antoine', 'Amelie'],
          'German': ['Daniel', 'Giselle', 'Ralf', 'Elli'],
          'Italian': ['Giovanni', 'Bianca', 'Andrea', 'Chiara'],
          'Portuguese': ['Camila', 'Ricardo', 'Vitoria'],
          'Japanese': ['Takuya', 'Ryo', 'Takako'],
          'Korean': ['Seoyeon', 'Hyunsu'],
          'Chinese': ['Xiaoxiao', 'Xiaochen', 'Kangkang']
        }
      }
      setCapabilities(mockCapabilities)
    } catch (error) {
      setError('Failed to load language capabilities')
    } finally {
      setLoading(false)
    }
  }

  const getLanguageName = (code: string): string => {
    const languages: { [key: string]: string } = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ru': 'Russian'
    }
    return languages[code] || code.toUpperCase()
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-gray-800">
                Voice<span className="text-blue-600">Care</span>
              </Link>
              <div className="text-gray-600 text-sm">Language Capabilities</div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Language Capabilities
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive overview of supported languages across our AI-powered voice processing pipeline
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading capabilities...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <div className="text-red-500 mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h3>
            <p className="text-gray-600">{error}</p>
          </div>
        ) : capabilities ? (
          <div className="space-y-8">
            {/* Speech-to-Text */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 mb-8">
              <div className="flex items-center mb-6">
                <div className="text-3xl mr-4 opacity-80">🎤</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Speech-to-Text (Whisper)</h2>
                  <p className="text-gray-600">Supported input languages for voice recognition</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {capabilities.stt_languages.map((lang) => (
                  <div key={lang} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 hover:bg-gray-50 transition-colors">
                    <div className="font-medium text-gray-800">{getLanguageName(lang)}</div>
                    <div className="text-sm text-gray-500">{lang.toUpperCase()}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Translation */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 mb-8">
              <div className="flex items-center mb-6">
                <div className="text-3xl mr-4">🌍</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Translation (LibreTranslate)</h2>
                  <p className="text-gray-600">Real-time translation between languages</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Source Languages</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {capabilities.translation_languages.source.map((lang) => (
                      <div key={lang} className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
                        <div className="text-gray-800 text-sm">{getLanguageName(lang)}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Target Languages</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {capabilities.translation_languages.target.map((lang) => (
                      <div key={lang} className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
                        <div className="text-gray-800 text-sm">{getLanguageName(lang)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Text-to-Speech */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 mb-8">
              <div className="flex items-center mb-6">
                <div className="text-3xl mr-4">💬</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Text-to-Speech (ElevenLabs)</h2>
                  <p className="text-gray-600">Premium voices available for natural speech synthesis</p>
                </div>
              </div>
              <div className="space-y-6">
                {Object.entries(capabilities.tts_voices).map(([language, voices]) => (
                  <div key={language}>
                    <h3 className="text-lg font-semibold text-white mb-3">{language}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {voices.map((voice) => (
                        <div key={voice} className="bg-gray-50 rounded-lg p-3 text-center border border-gray-100 hover:bg-gray-50 transition-colors">
                          <div className="text-gray-800 font-medium">{voice}</div>
                          <div className="text-xs text-blue-500">Premium Voice</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Integration Flow */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 mb-8">
              <div className="flex items-center mb-6">
                <div className="text-3xl mr-4">⚡</div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Integration Flow</h2>
                  <p className="text-gray-600">How our AI pipeline processes multilingual communication</p>
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-6">
                {[
                  { step: '1', title: 'Voice Input', desc: 'Whisper STT converts speech to text in 80+ languages' },
                  { step: '2', title: 'Translation', desc: 'LibreTranslate converts text between languages' },
                  { step: '3', title: 'Voice Output', desc: 'ElevenLabs synthesizes natural speech' },
                  { step: '4', title: 'Delivery', desc: 'Real-time audio delivered to recipient' }
                ].map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold text-white">
                      {item.step}
                    </div>
                    <h4 className="font-semibold text-gray-800 mb-2">{item.title}</h4>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
} 