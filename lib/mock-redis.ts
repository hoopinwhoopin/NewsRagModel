// Mock Redis implementation for when Redis is not available
import { v4 as uuidv4 } from "uuid"

console.log("Initializing mock Redis implementation")

// In-memory storage
const sessions = new Map<string, { created: number }>()
const messages = new Map<string, any[]>()

// TTL cleanup interval (5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000
const DEFAULT_TTL = 24 * 60 * 60 // 24 hours in seconds

// Start cleanup interval
const cleanupInterval = setInterval(() => {
  const now = Date.now()

  // Clean up expired sessions
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.created > DEFAULT_TTL * 1000) {
      sessions.delete(sessionId)
      messages.delete(`session:${sessionId}:messages`)
    }
  }
}, CLEANUP_INTERVAL)

// Make sure to clear the interval when the module is unloaded
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    clearInterval(cleanupInterval)
  })
}

export async function createSession(): Promise<string> {
  const sessionId = uuidv4()
  sessions.set(sessionId, { created: Date.now() })
  console.log(`[MOCK] Created new session: ${sessionId}`)
  return sessionId
}

export async function saveMessage(sessionId: string, message: any): Promise<void> {
  const key = `session:${sessionId}:messages`

  if (!messages.has(key)) {
    messages.set(key, [])
  }

  const sessionMessages = messages.get(key)!
  sessionMessages.unshift(message)

  // Limit to 100 messages
  if (sessionMessages.length > 100) {
    sessionMessages.length = 100
  }

  // Update session timestamp
  if (sessions.has(sessionId)) {
    sessions.set(sessionId, { created: Date.now() })
  }
}

export async function getSessionHistory(sessionId: string): Promise<any[]> {
  const key = `session:${sessionId}:messages`

  if (!messages.has(key)) {
    return []
  }

  // Update session timestamp
  if (sessions.has(sessionId)) {
    sessions.set(sessionId, { created: Date.now() })
  }

  return [...messages.get(key)!].reverse()
}

export async function sessionExists(sessionId: string): Promise<boolean> {
  return sessions.has(sessionId)
}

export async function deleteSession(sessionId: string): Promise<void> {
  sessions.delete(sessionId)
  messages.delete(`session:${sessionId}:messages`)
  console.log(`[MOCK] Deleted session ${sessionId}`)
}

export async function getSessionStats(): Promise<{ activeSessions: number; totalMessages: number }> {
  let totalMessages = 0

  for (const [key, sessionMessages] of messages.entries()) {
    if (key.includes(":messages")) {
      totalMessages += sessionMessages.length
    }
  }

  return {
    activeSessions: sessions.size,
    totalMessages,
  }
}
