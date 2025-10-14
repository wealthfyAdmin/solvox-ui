interface StartAgentRequest {
  assistantId: string
  roomName: string
  sessionType: 'chat' | 'voice' | 'outbound'
  phoneNumber?: string
  metadata?: Record<string, any>
}

interface StartAgentResponse {
  success: boolean
  message: string
  agentId: string
  agentName: string
  roomName: string
  processId: number
  token?: string
  livekitUrl?: string
}

class AgentService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
  }

  async startAgent(request: StartAgentRequest): Promise<StartAgentResponse> {
    console.log('🚀 Starting agent with request:', request)
    console.log('🌐 Backend URL:', this.baseUrl)
    
    try {
      // **FIXED: Use singular "agent" not "agents"**
      const url = `${this.baseUrl}/api/agent/start`
      console.log('📡 Making request to:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        credentials: 'include',
        body: JSON.stringify(request)
      })

      console.log('📨 Response status:', response.status)
      console.log('📨 Response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        
        try {
          const errorData = JSON.parse(errorText)
          throw new Error(errorData.detail || errorData.message || 'Failed to start agent')
        } catch (parseError) {
          throw new Error(`HTTP ${response.status}: ${errorText}`)
        }
      }

      const result = await response.json()
      console.log('✅ Agent started successfully:', result)
      return result

    } catch (error) {
      console.error('💥 Agent service error:', error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(`Cannot connect to backend at ${this.baseUrl}. Please check if backend is running.`)
      }
      throw error
    }
  }

  async stopAgent(roomName: string, agentId: string): Promise<void> {
    console.log('🛑 Stopping agent:', { roomName, agentId })
    
    try {
      // **FIXED: Use singular "agent" not "agents"**
      const response = await fetch(`${this.baseUrl}/api/agent/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        credentials: 'include',
        body: JSON.stringify({ roomName, agentId })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.warn('⚠️ Stop agent failed:', errorText)
      } else {
        console.log('✅ Agent stopped successfully')
      }
    } catch (error) {
      console.warn('⚠️ Failed to stop agent:', error)
    }
  }

  async getAgentStatus(roomName: string): Promise<any> {
    try {
      // **FIXED: Use singular "agent" not "agents"**
      const response = await fetch(`${this.baseUrl}/api/agent/status/${roomName}`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        credentials: 'include'
      })
      return response.json()
    } catch (error) {
      console.warn('Failed to get agent status:', error)
      return { roomName, agents: [] }
    }
  }

  async getAvailableAgents(): Promise<any[]> {
    try {
      // **FIXED: Use singular "agent" not "agents"**
      const response = await fetch(`${this.baseUrl}/api/agent/available`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        credentials: 'include'
      })
      
      if (response.ok) {
        return await response.json()
      }
      return []
    } catch (error) {
      console.warn('Failed to get available agents:', error)
      return []
    }
  }

  private getAuthToken(): string {
    // Try different storage locations for auth token
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken') || 
             localStorage.getItem('token') || 
             localStorage.getItem('access_token') || 
             sessionStorage.getItem('authToken') || 
             ''
    }
    return ''
  }
}

export const agentService = new AgentService()
