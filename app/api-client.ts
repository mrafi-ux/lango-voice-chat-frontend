/**
 * API Client for VoiceCare backend communication
 */

import { User } from './auth';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Conversation {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
  user_a?: User;
  user_b?: User;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  text_source: string;
  text_translated?: string;
  source_lang: string;
  target_lang: string;
  status: string;
  created_at: string;
  delivered_at?: string;
  played_at?: string;
  sender?: User;
}

export interface Voice {
  voice_id: string;
  name: string;
  description?: string;
  language?: string;
}

export interface LanguageCapability {
  code: string;
  name: string;
  supported: boolean;
}

export interface ProviderInfo {
  name: string;
  available: boolean;
  version?: string;
  models?: string[];
}

export class ApiClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Generic request helper
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      };
      
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get auth headers
   */
  private getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  
  /**
   * Get stored token
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('voicecare_token');
  }
  
  /**
   * Set token
   */
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('voicecare_token', token);
  }
  
  /**
   * Clear token
   */
  clearToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('voicecare_token');
    localStorage.removeItem('voicecare_user');
  }
  
  // Auth endpoints
  
  /**
   * Register new user
   */
  async register(userData: {
    name: string;
    role: string;
    preferred_lang: string;
    preferred_voice?: string;
  }): Promise<ApiResponse<User>> {
    return this.request<User>('/v1/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
  
  /**
   * Login user (demo implementation)
   */
  async login(userId: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    // For demo, we'll return a mock response
    // In a real app, this would make a proper auth API call
    return {
      success: true,
      data: {
        user: { id: userId, name: 'Demo User', role: 'patient', preferred_lang: 'en' },
        token: `demo-token-${userId}`
      }
    };
  }
  
  /**
   * Get current user profile
   */
  async getMe(): Promise<ApiResponse<User>> {
    return this.request<User>('/v1/users/me');
  }
  
  // User management endpoints
  
  /**
   * Get all users
   */
  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>('/v1/users/');
  }
  
  /**
   * Create user
   */
  async createUser(userData: {
    name: string;
    role: string;
    preferred_lang: string;
    preferred_voice?: string;
  }): Promise<ApiResponse<User>> {
    return this.request<User>('/v1/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
  
  /**
   * Update user
   */
  async updateUser(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>(`/v1/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
  
  // Conversation endpoints
  
  /**
   * Get conversations
   */
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return this.request<Conversation[]>('/v1/conversations/');
  }
  
  /**
   * Create or get conversation
   */
  async createOrGetConversation(userAId: string, userBId: string): Promise<ApiResponse<Conversation>> {
    return this.request<Conversation>('/v1/conversations/', {
      method: 'POST',
      body: JSON.stringify({
        user_a_id: userAId,
        user_b_id: userBId,
      }),
    });
  }
  
  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<ApiResponse<Message[]>> {
    return this.request<Message[]>(`/v1/conversations/${conversationId}/messages`);
  }
  
  // STT endpoints
  
  /**
   * Transcribe audio
   */
  async transcribeAudio(audioBlob: Blob, language?: string): Promise<ApiResponse<{
    text: string;
    language: string;
    confidence?: number;
    provider: string;
  }>> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      if (language) {
        formData.append('language', language);
      }
      
      const url = `${this.baseUrl}/v1/stt/transcribe`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('STT transcription failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transcription failed'
      };
    }
  }
  
  // TTS endpoints
  
  /**
   * Synthesize speech
   */
  async synthesizeSpeech(
    text: string, 
    language: string = 'en',
    voiceId?: string
  ): Promise<ApiResponse<{ audio_url: string; voice_id: string }>> {
    return this.request<{ audio_url: string; voice_id: string }>('/v1/tts/speak', {
      method: 'POST',
      body: JSON.stringify({
        text,
        language,
        voice_id: voiceId,
      }),
    });
  }
  
  /**
   * Get available voices
   */
  async getVoices(): Promise<ApiResponse<Voice[]>> {
    return this.request<Voice[]>('/v1/tts/voices');
  }
  
  // Capabilities endpoints
  
  /**
   * Get language capabilities
   */
  async getLanguageCapabilities(): Promise<ApiResponse<{
    stt: LanguageCapability[];
    translation: LanguageCapability[];
    tts: Voice[];
  }>> {
    return this.request('/v1/capabilities/languages');
  }
  
  /**
   * Get provider information
   */
  async getProviderInfo(): Promise<ApiResponse<{
    stt: ProviderInfo;
    translation: ProviderInfo;
    tts: ProviderInfo;
  }>> {
    return this.request('/v1/capabilities/providers');
  }
  
  // Health check
  
  /**
   * Check backend health
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; service: string }>> {
    return this.request('/health');
  }
}

// Utility functions

/**
 * Get current user from storage
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('voicecare_user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('voicecare_token') && !!getCurrentUser();
}

/**
 * Check if user has specific role
 */
export function hasRole(role: string): boolean {
  const user = getCurrentUser();
  return user?.role === role;
}

// Export singleton instance
export const apiClient = new ApiClient(); 