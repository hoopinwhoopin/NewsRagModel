import { createClient } from "redis"
import * as mockRedis from "./mock-redis"

// Flag to track if we're using mock Redis
export let usingMockRedis = false

// Initialize Redis client with better error handling
let redisClient

// Initialize Redis client with direct connection parameters
const initRedisClient = () => {
  try {
    // Use direct connection parameters instead of Redis URL
    const client = createClient({
      socket: {
        host: "redis://default:nAMAsl67FNPgLk22OTVJ0bM0aIjE9E36@redis-16500.c326.us-east-1-3.ec2.redns.redis-cloud.com:16500",
        port: 16500,
      },
      username: "default",
      password: "nAMAsl67FNPgLk22OTVJ0bM0aIjE9E36",
      // Enable decode_responses equivalent
      legacyMode: false,
    })

    // Handle Redis client errors
    client.on("error", (err) => {
      console.error("Redis client error:", err)
      if (!usingMockRedis) {
        console.log("Switching to mock Redis implementation due to error")
        usingMockRedis = true
      }
    })

    return client
  } catch (error) {
    console.error("Failed to create Redis client:", error)
    usingMockRedis = true
    console.log("Using mock Redis implementation due to initialization error")
    return null
  }
}

// Initialize the client
redisClient = initRedisClient()

// Connect to Redis on server start (with better error handling)
const connectToRedis = async () => {
  if (usingMockRedis) {
    return true // Mock Redis is always "connected"
  }

  if (!redisClient) {
    console.error("Redis client not initialized")
    usingMockRedis = true
    console.log("Switching to mock Redis implementation")
    return true
  }

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect()
      console.log("Connected to Redis")

      // Test the connection with a simple operation
      await redisClient.set("connection_test", "success")
      const testResult = await redisClient.get("connection_test")
      console.log("Redis connection test:", testResult)
    }
    return true
  } catch (error) {
    console.error("Redis connection error:", error)
    usingMockRedis = true
    console.log("Switching to mock Redis implementation")
    return true
  }
}

// Session TTL in seconds (24 hours by default)
const SESSION_TTL = Number.parseInt(process.env.SESSION_TTL || "86400", 10)

// Maximum number of messages to keep per session
const MAX_MESSAGES_PER_SESSION = 100

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: string
}

// Create a new session
export async function createSession(): Promise<string> {
  await connectToRedis()

  if (usingMockRedis) {
    return mockRedis.createSession()
  }

  const sessionId = generateSessionId()

  try {
    await redisClient.set(`session:${sessionId}:created`, Date.now().toString(), {
      EX: SESSION_TTL,
    })
    console.log(`Created new session: ${sessionId}`)
    return sessionId
  } catch (error) {
    console.error("Error creating session:", error)
    // Fall back to mock Redis
    usingMockRedis = true
    console.log("Falling back to mock Redis")
    return mockRedis.createSession()
  }
}

// Save a message to a session
export async function saveMessage(sessionId: string, message: ChatMessage): Promise<void> {
  await connectToRedis()

  if (usingMockRedis) {
    return mockRedis.saveMessage(sessionId, message)
  }

  const key = `session:${sessionId}:messages`

  try {
    // Add message to the list
    await redisClient.lPush(key, JSON.stringify(message))

    // Trim the list to keep only the most recent messages
    await redisClient.lTrim(key, 0, MAX_MESSAGES_PER_SESSION - 1)

    // Reset TTL on access
    await redisClient.expire(key, SESSION_TTL)

    // Also reset TTL for the session creation timestamp
    await redisClient.expire(`session:${sessionId}:created`, SESSION_TTL)
  } catch (error) {
    console.error(`Error saving message for session ${sessionId}:`, error)
    // Fall back to mock Redis
    usingMockRedis = true
    console.log("Falling back to mock Redis")
    return mockRedis.saveMessage(sessionId, message)
  }
}

// Get all messages for a session
export async function getSessionHistory(sessionId: string): Promise<ChatMessage[]> {
  await connectToRedis()

  if (usingMockRedis) {
    return mockRedis.getSessionHistory(sessionId)
  }

  const key = `session:${sessionId}:messages`

  try {
    const messages = await redisClient.lRange(key, 0, -1)

    // Reset TTL on access
    await redisClient.expire(key, SESSION_TTL)
    await redisClient.expire(`session:${sessionId}:created`, SESSION_TTL)

    return messages
      .map((msg) => {
        try {
          return JSON.parse(msg) as ChatMessage
        } catch (e) {
          console.error("Error parsing message:", e)
          return null
        }
      })
      .filter(Boolean) // Remove any null values
      .reverse() // Reverse to get chronological order
  } catch (error) {
    console.error(`Error getting session history for ${sessionId}:`, error)
    // Fall back to mock Redis
    usingMockRedis = true
    console.log("Falling back to mock Redis")
    return mockRedis.getSessionHistory(sessionId)
  }
}

// Check if a session exists
export async function sessionExists(sessionId: string): Promise<boolean> {
  await connectToRedis()

  if (usingMockRedis) {
    return mockRedis.sessionExists(sessionId)
  }

  try {
    const exists = await redisClient.exists(`session:${sessionId}:created`)
    return exists === 1
  } catch (error) {
    console.error(`Error checking if session ${sessionId} exists:`, error)
    // Fall back to mock Redis
    usingMockRedis = true
    console.log("Falling back to mock Redis")
    return mockRedis.sessionExists(sessionId)
  }
}

// Delete a session and all its data
export async function deleteSession(sessionId: string): Promise<void> {
  await connectToRedis()

  if (usingMockRedis) {
    return mockRedis.deleteSession(sessionId)
  }

  try {
    const keys = await redisClient.keys(`session:${sessionId}:*`)

    if (keys.length > 0) {
      await redisClient.del(keys)
      console.log(`Deleted session ${sessionId} with ${keys.length} keys`)
    } else {
      console.log(`No keys found for session ${sessionId}`)
    }
  } catch (error) {
    console.error(`Error deleting session ${sessionId}:`, error)
    // Fall back to mock Redis
    usingMockRedis = true
    console.log("Falling back to mock Redis")
    return mockRedis.deleteSession(sessionId)
  }
}

// Get session stats
export async function getSessionStats(): Promise<{
  activeSessions: number
  totalMessages: number
}> {
  await connectToRedis()

  if (usingMockRedis) {
    return mockRedis.getSessionStats()
  }

  try {
    const sessionKeys = await redisClient.keys("session:*:created")
    const activeSessions = sessionKeys.length

    let totalMessages = 0
    for (const key of sessionKeys) {
      const sessionId = key.split(":")[1]
      const messageCount = await redisClient.lLen(`session:${sessionId}:messages`)
      totalMessages += messageCount
    }

    return {
      activeSessions,
      totalMessages,
    }
  } catch (error) {
    console.error("Error getting session stats:", error)
    // Fall back to mock Redis
    usingMockRedis = true
    console.log("Falling back to mock Redis")
    return mockRedis.getSessionStats()
  }
}

// Generate a random session ID
function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
