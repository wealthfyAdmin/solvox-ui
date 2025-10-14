import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

async function getAuthHeaders() {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get('access_token')?.value
  
  return {
    'Content-Type': 'application/json',
    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const orgId = searchParams.get("orgId") || searchParams.get("organization_id")
    
    console.log('Fetching agents for organization:', orgId)
    
    if (!orgId) {
      console.log('No organization ID provided')
      return NextResponse.json({ agents: [] })
    }

    // Build query params for FastAPI backend
    const params = new URLSearchParams({ organization_id: orgId })
    const queryString = `?${params}`
    
    console.log('Calling backend:', `${BACKEND_URL}/api/agent${queryString}`)
    
    const response = await fetch(`${BACKEND_URL}/api/agent${queryString}`, {
      headers: await getAuthHeaders(),
    })

    console.log('Backend response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Backend error:', errorText)
      return NextResponse.json({ agents: [] })
    }

    const backendAgents = await response.json()
    console.log('Backend agents received:', backendAgents.length, 'agents')
    
    // Map backend agent structure to frontend structure
    const agents = backendAgents.map((agent: any) => ({
      id: agent.id.toString(),
      name: agent.display_name || agent.name,
      description: agent.description,
      // Agent Tab
      welcomeMessage: agent.greeting_message,
      prompt: agent.instructions,
      // LLM Tab  
      llmProvider: agent.llm_provider?.charAt(0).toUpperCase() + agent.llm_provider?.slice(1) || "OpenAI",
      llmModel: agent.llm_model,
      llmTokens: agent.token_limit,
      llmTemperature: agent.temperature,
      knowledgeBaseId: agent.knowledgebase_id,
      // Audio Tab
      language: agent.stt_language?.includes("en-IN") ? "English (India)" : "English (US)",
      asrProvider: agent.stt_provider?.charAt(0).toUpperCase() + agent.stt_provider?.slice(1) || "Deepgram",
      asrModel: agent.stt_model,
      asrKeywords: "Bruce:100",
      ttsProvider: agent.tts_provider?.charAt(0).toUpperCase() + agent.tts_provider?.slice(1) || "OpenAI",
      ttsModel: agent.tts_model || "tts-1",
      ttsVoice: agent.tts_voice,
      bufferSize: 200,
      speedRate: 1,
      orgId: agent.organization_id?.toString(),
      // Backend specific fields
      organization_id: agent.organization_id,
      is_active: agent.is_active,
      created_at: agent.created_at,
      updated_at: agent.updated_at
    }))

    console.log('Mapped agents:', agents.length, 'agents')
    return NextResponse.json({ agents })
    
  } catch (error) {
    console.error('Error fetching agents:', error)
    return NextResponse.json({ agents: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const { action } = payload as { action: "create" | "update" | "delete" }
    
    if (action === "create") {
      const { agent } = payload as { agent: any }
      
      console.log('Creating agent:', agent)
      
      // Map frontend agent structure to backend structure
      const backendAgent = {
        name: agent.name,
        display_name: agent.name,
        description: agent.description,
        instructions: agent.prompt || agent.instructions || "You are a helpful assistant",
        greeting_message: agent.welcomeMessage || agent.greeting_message || "Hello!",
        llm_provider: agent.llmProvider?.toLowerCase() || "openai",
        llm_model: agent.llmModel || "gpt-4o-mini",
        temperature: agent.llmTemperature || 0.2,
        token_limit: agent.llmTokens || 450,
        stt_provider: agent.asrProvider?.toLowerCase() || "deepgram",
        stt_model: agent.asrModel || "nova-2",
        stt_language: agent.language?.includes("India") ? "en-IN" : "en-US",
        tts_provider: agent.ttsProvider?.toLowerCase() || "openai",
        tts_model: agent.ttsModel,
        tts_voice: agent.ttsVoice || "alloy",
        knowledgebase_id: agent.knowledgeBaseId,
        tools: agent.tools,
        organization_id: parseInt(agent.orgId),
        is_active: true,
      }

      console.log('Backend agent data:', backendAgent)

      const response = await fetch(`${BACKEND_URL}/api/agent`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify(backendAgent),
      })

      console.log('Create agent response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Backend create error:', errorText)
        return NextResponse.json({ error: 'Failed to create agent' }, { status: response.status })
      }

      const createdAgent = await response.json()
      
      // Map back to frontend structure
      const frontendAgent = {
        id: createdAgent.id.toString(),
        name: createdAgent.display_name || createdAgent.name,
        description: createdAgent.description,
        welcomeMessage: createdAgent.greeting_message,
        prompt: createdAgent.instructions,
        llmProvider: createdAgent.llm_provider?.charAt(0).toUpperCase() + createdAgent.llm_provider?.slice(1),
        llmModel: createdAgent.llm_model,
        llmTokens: createdAgent.token_limit,
        llmTemperature: createdAgent.temperature,
        knowledgeBaseId: createdAgent.knowledgebase_id,
        language: createdAgent.stt_language?.includes("en-IN") ? "English (India)" : "English (US)",
        asrProvider: createdAgent.stt_provider?.charAt(0).toUpperCase() + createdAgent.stt_provider?.slice(1),
        asrModel: createdAgent.stt_model,
        asrKeywords: "Bruce:100",
        ttsProvider: createdAgent.tts_provider?.charAt(0).toUpperCase() + createdAgent.tts_provider?.slice(1),
        ttsModel: createdAgent.tts_model,
        ttsVoice: createdAgent.tts_voice,
        bufferSize: 200,
        speedRate: 1,
        orgId: createdAgent.organization_id?.toString(),
        organization_id: createdAgent.organization_id,
        is_active: createdAgent.is_active
      }
      
      return NextResponse.json({ agent: frontendAgent })
    }

    if (action === "update") {
      const { agent, section } = payload as { agent: any; section?: string }
      
      // Map frontend agent structure to backend structure
      const backendAgent = {
        name: agent.name,
        display_name: agent.name,
        description: agent.description,
        instructions: agent.prompt || agent.instructions,
        greeting_message: agent.welcomeMessage || agent.greeting_message,
        llm_provider: agent.llmProvider?.toLowerCase(),
        llm_model: agent.llmModel,
        temperature: agent.llmTemperature,
        token_limit: agent.llmTokens,
        stt_provider: agent.asrProvider?.toLowerCase(),
        stt_model: agent.asrModel,
        stt_language: agent.language?.includes("India") ? "en-IN" : "en-US",
        tts_provider: agent.ttsProvider?.toLowerCase(),
        tts_model: agent.ttsModel,
        tts_voice: agent.ttsVoice,
        knowledgebase_id: agent.knowledgeBaseId,
        tools: agent.tools,
        organization_id: parseInt(agent.orgId || agent.organization_id),
        is_active: agent.is_active !== undefined ? agent.is_active : true,
      }

      const response = await fetch(`${BACKEND_URL}/api/agent/${agent.id}`, {
        method: 'PATCH',
        headers: await getAuthHeaders(),
        body: JSON.stringify(backendAgent),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Backend update error:', errorText)
        return NextResponse.json({ error: 'Failed to update agent' }, { status: response.status })
      }

      const updatedAgent = await response.json()
      
      // Map back to frontend structure
      const frontendAgent = {
        id: updatedAgent.id.toString(),
        name: updatedAgent.display_name || updatedAgent.name,
        description: updatedAgent.description,
        welcomeMessage: updatedAgent.greeting_message,
        prompt: updatedAgent.instructions,
        llmProvider: updatedAgent.llm_provider?.charAt(0).toUpperCase() + updatedAgent.llm_provider?.slice(1),
        llmModel: updatedAgent.llm_model,
        llmTokens: updatedAgent.token_limit,
        llmTemperature: updatedAgent.temperature,
        knowledgeBaseId: updatedAgent.knowledgebase_id,
        language: updatedAgent.stt_language?.includes("en-IN") ? "English (India)" : "English (US)",
        asrProvider: updatedAgent.stt_provider?.charAt(0).toUpperCase() + updatedAgent.stt_provider?.slice(1),
        asrModel: updatedAgent.stt_model,
        asrKeywords: "Bruce:100",
        ttsProvider: updatedAgent.tts_provider?.charAt(0).toUpperCase() + updatedAgent.tts_provider?.slice(1),
        ttsModel: updatedAgent.tts_model,
        ttsVoice: updatedAgent.tts_voice,
        bufferSize: 200,
        speedRate: 1,
        orgId: updatedAgent.organization_id?.toString(),
        organization_id: updatedAgent.organization_id,
        is_active: updatedAgent.is_active
      }
      
      return NextResponse.json({ agent: frontendAgent, section })
    }

    if (action === "delete") {
      const { id } = payload as { id: string }
      
      const response = await fetch(`${BACKEND_URL}/api/agent/${id}`, {
        method: 'DELETE',
        headers: await getAuthHeaders(),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Backend delete error:', errorText)
        return NextResponse.json({ error: 'Failed to delete agent' }, { status: response.status })
      }

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('Error processing agent request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
