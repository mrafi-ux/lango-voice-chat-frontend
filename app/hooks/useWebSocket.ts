'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseWebSocketOptions {
  userId?: string
  onMessage?: (data: any) => void
  onError?: (error: string) => void
}

export function useWebSocket({ userId, onMessage, onError }: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 3
  const connectingRef = useRef(false) // Prevent multiple connection attempts
  const userIdRef = useRef(userId)
  const onMessageRef = useRef(onMessage)
  const onErrorRef = useRef(onError)

  // Update refs when props change
  useEffect(() => {
    userIdRef.current = userId
    onMessageRef.current = onMessage
    onErrorRef.current = onError
  }, [userId, onMessage, onError])

  const connect = useCallback(() => {
    // Prevent multiple simultaneous connections
    if (connectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      console.log('Connection already in progress or established')
      return
    }

    connectingRef.current = true
    setIsConnecting(true)
    console.log('Attempting WebSocket connection to: ws://localhost:8000/api/v1/ws')

    try {
      const ws = new WebSocket('ws://localhost:8000/api/v1/ws')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected successfully')
        connectingRef.current = false
        setIsConnected(true)
        setIsConnecting(false)
        reconnectAttempts.current = 0

        // Send join message immediately if userId is provided
        if (userIdRef.current) {
          const joinMessage = {
            type: 'join',
            user_id: userIdRef.current
          }
          console.log('Sending join message:', joinMessage)
          ws.send(JSON.stringify(joinMessage))
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket message received:', data)
          if (onMessageRef.current) {
            onMessageRef.current(data)
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err)
        }
      }

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason)
        connectingRef.current = false
        setIsConnected(false)
        setIsConnecting(false)
        wsRef.current = null

        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++
          console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`)
          setTimeout(() => {
            if (!connectingRef.current) {
              connect()
            }
          }, 2000)
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached')
          if (onErrorRef.current) {
            onErrorRef.current('WebSocket connection failed after multiple attempts')
          }
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        connectingRef.current = false
        setIsConnecting(false)
        if (onErrorRef.current) {
          onErrorRef.current('WebSocket connection error')
        }
      }

    } catch (error) {
      console.error('Failed to create WebSocket:', error)
      connectingRef.current = false
      setIsConnecting(false)
      if (onErrorRef.current) {
        onErrorRef.current('Failed to create WebSocket connection')
      }
    }
  }, []) // Empty dependency array to prevent recreation

  const disconnect = useCallback(() => {
    connectingRef.current = false
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect')
      wsRef.current = null
    }
    setIsConnected(false)
    setIsConnecting(false)
    reconnectAttempts.current = 0
  }, [])

  const send = useCallback((message: any) => {
    console.log('Attempting to send WebSocket message:', message)
    console.log('WebSocket state:', wsRef.current?.readyState)
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify(message))
        console.log('WebSocket message sent successfully')
        return true
      } catch (error) {
        console.error('Failed to send WebSocket message:', error)
        return false
      }
    }
    console.warn('WebSocket not connected, cannot send message')
    return false
  }, [])

  // Auto-connect when userId is provided
  useEffect(() => {
    if (userId && !isConnected && !connectingRef.current) {
      console.log(`Auto-connecting WebSocket for user: ${userId}`)
      connect()
    }
    
    // Cleanup on unmount or userId change
    return () => {
      if (!userId) {
        disconnect()
      }
    }
  }, [userId]) // Only depend on userId

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    send
  }
} 