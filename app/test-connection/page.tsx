'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function TestConnectionPage() {
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [wsStatus, setWsStatus] = useState<'checking' | 'connected' | 'failed'>('checking')
  const [testResults, setTestResults] = useState<string[]>([])

  useEffect(() => {
    runTests()
  }, [])

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const runTests = async () => {
    addResult('Starting connection tests...')

    // Test 1: Backend Health Check
    try {
      addResult('Testing backend health endpoint...')
      const response = await fetch('http://localhost:8000/health')
      if (response.ok) {
        const data = await response.json()
        setBackendStatus('online')
        addResult(`✅ Backend online: ${data.status}`)
      } else {
        setBackendStatus('offline')
        addResult(`❌ Backend returned ${response.status}`)
      }
    } catch (error) {
      setBackendStatus('offline')
      addResult(`❌ Backend connection failed: ${error}`)
    }

    // Test 2: WebSocket Connection
    try {
      addResult('Testing WebSocket connection...')
      const ws = new WebSocket('ws://localhost:8000/api/v1/ws')
      
      const timeout = setTimeout(() => {
        ws.close()
        setWsStatus('failed')
        addResult('❌ WebSocket connection timeout')
      }, 5000)

      ws.onopen = () => {
        clearTimeout(timeout)
        setWsStatus('connected')
        addResult('✅ WebSocket connected successfully')
        
        // Test sending a message
        ws.send(JSON.stringify({
          type: 'join',
          user_id: 'test-user'
        }))
        addResult('📤 Sent test join message')
        
        setTimeout(() => {
          ws.close(1000, 'Test complete')
        }, 1000)
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          addResult(`📥 Received: ${JSON.stringify(data)}`)
        } catch (err) {
          addResult(`📥 Received raw: ${event.data}`)
        }
      }

      ws.onerror = (error) => {
        clearTimeout(timeout)
        setWsStatus('failed')
        addResult(`❌ WebSocket error: ${error}`)
      }

      ws.onclose = (event) => {
        if (event.code === 1000) {
          addResult('✅ WebSocket closed normally')
        } else {
          addResult(`⚠️ WebSocket closed: ${event.code} - ${event.reason}`)
        }
      }
    } catch (error) {
      setWsStatus('failed')
      addResult(`❌ WebSocket creation failed: ${error}`)
    }

    // Test 3: STT Endpoint
    try {
      addResult('Testing STT languages endpoint...')
      const response = await fetch('/api/v1/stt/languages')
      if (response.ok) {
        const data = await response.json()
        addResult(`✅ STT endpoint: ${data.count} languages supported`)
      } else {
        addResult(`❌ STT endpoint failed: ${response.status}`)
      }
    } catch (error) {
      addResult(`❌ STT endpoint error: ${error}`)
    }

    // Test 4: TTS Voices Endpoint
    try {
      addResult('Testing TTS voices endpoint...')
      const response = await fetch('/api/v1/tts/voices')
      if (response.ok) {
        const data = await response.json()
        addResult(`✅ TTS endpoint: Found voices for ${Object.keys(data).length} languages`)
      } else {
        addResult(`❌ TTS endpoint failed: ${response.status}`)
      }
    } catch (error) {
      addResult(`❌ TTS endpoint error: ${error}`)
    }

    addResult('🏁 All tests completed')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
        return 'text-green-400'
      case 'offline':
      case 'failed':
        return 'text-red-400'
      default:
        return 'text-yellow-400'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
        return '✅'
      case 'offline':
      case 'failed':
        return '❌'
      default:
        return '🔄'
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-card border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-2xl font-bold text-white">
                Voice<span className="text-purple-300">Care</span>
              </Link>
              <div className="text-purple-100">Connection Test</div>
            </div>
            <Link
              href="/chat"
              className="btn-secondary px-4 py-2 rounded-lg text-sm"
            >
              Back to Chat
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="glass-card rounded-2xl p-8 mb-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            System Connection Test
          </h1>
          <p className="text-purple-100 mb-8">
            Testing all backend services and connections to ensure everything is working properly.
          </p>

          {/* Status Overview */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Backend API</h3>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getStatusIcon(backendStatus)}</span>
                <div>
                  <div className={`font-medium ${getStatusColor(backendStatus)}`}>
                    {backendStatus === 'checking' ? 'Checking...' : 
                     backendStatus === 'online' ? 'Online' : 'Offline'}
                  </div>
                  <div className="text-sm text-purple-200">REST API Health</div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">WebSocket</h3>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getStatusIcon(wsStatus)}</span>
                <div>
                  <div className={`font-medium ${getStatusColor(wsStatus)}`}>
                    {wsStatus === 'checking' ? 'Checking...' : 
                     wsStatus === 'connected' ? 'Connected' : 'Failed'}
                  </div>
                  <div className="text-sm text-purple-200">Real-time Communication</div>
                </div>
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="bg-black/20 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Test Results</h3>
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2 font-mono text-sm">
                {testResults.map((result, index) => (
                  <div key={index} className="text-purple-100">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => {
                setTestResults([])
                setBackendStatus('checking')
                setWsStatus('checking')
                runTests()
              }}
              className="btn-primary px-6 py-3 rounded-xl"
            >
              Run Tests Again
            </button>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="glass-card rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Troubleshooting</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Backend Offline</h3>
              <p className="text-purple-100 mb-2">If the backend is offline, try:</p>
              <ul className="text-purple-100 space-y-1 ml-4">
                <li>• Check if the backend server is running on port 8000</li>
                <li>• Run: <code className="bg-black/30 px-2 py-1 rounded">cd voicecare/backend && uvicorn app.main:app --reload</code></li>
                <li>• Verify the backend health at: <a href="http://localhost:8000/health" className="text-purple-300 underline">http://localhost:8000/health</a></li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">WebSocket Failed</h3>
              <p className="text-purple-100 mb-2">If WebSocket connection fails:</p>
              <ul className="text-purple-100 space-y-1 ml-4">
                <li>• The chat will automatically switch to demo mode</li>
                <li>• STT and translation will still work</li>
                <li>• Real-time messaging will be disabled</li>
                <li>• Check browser console for detailed error messages</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Next Steps</h3>
              <p className="text-purple-100 mb-2">Once connections are working:</p>
              <ul className="text-purple-100 space-y-1 ml-4">
                <li>• Go to <Link href="/chat" className="text-purple-300 underline">Chat Interface</Link></li>
                <li>• Test voice recording and transcription</li>
                <li>• Try the two-browser E2E test flow</li>
                <li>• Check <Link href="/settings/languages" className="text-purple-300 underline">Language Capabilities</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 