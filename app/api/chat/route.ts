import { type NextRequest, NextResponse } from "next/server"
import { getSessionHistory, saveMessage, sessionExists } from "@/lib/redis"
import { retrieveRelevantPassages } from "@/lib/vectorstore"
import { generateResponse, usingMockLLM } from "@/lib/llm"

// Simple request throttling
const requestTimestamps = new Map<string, number[]>()
const MAX_REQUESTS_PER_MINUTE = 5
const MINUTE_MS = 60 * 1000

function isThrottled(sessionId: string): boolean {
  const now = Date.now()
  const timestamps = requestTimestamps.get(sessionId) || []

  // Filter out timestamps older than 1 minute
  const recentTimestamps = timestamps.filter((ts) => now - ts < MINUTE_MS)

  // Update the timestamps
  requestTimestamps.set(sessionId, [...recentTimestamps, now])

  // Check if we've exceeded the limit
  return recentTimestamps.length >= MAX_REQUESTS_PER_MINUTE
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, message } = await req.json()

    if (!sessionId || !message) {
      return NextResponse.json({ error: "Session ID and message are required" }, { status: 400 })
    }

    // Check if session exists
    const exists = await sessionExists(sessionId)
    if (!exists) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 404 })
    }

    // Check if the user is sending too many requests
    if (isThrottled(sessionId)) {
      return NextResponse.json({
        text: "You're sending messages too quickly. Please wait a moment before trying again.",
        throttled: true,
      })
    }

    // Save user message to Redis
    await saveMessage(sessionId, {
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    })

    // Retrieve relevant passages from vector store
    let relevantPassages = []
    try {
      relevantPassages = await retrieveRelevantPassages(message)
    } catch (error) {
      console.error("Error retrieving passages:", error)
      // Continue with empty passages rather than failing
    }

    // Get session history
    const history = await getSessionHistory(sessionId)

    try {
      // Generate response
      const responseText = await generateResponse(message, relevantPassages, history)

      // Save assistant response to Redis
      await saveMessage(sessionId, {
        role: "assistant",
        content: responseText,
        timestamp: new Date().toISOString(),
      })

      // Return response
      return NextResponse.json({
        text: responseText,
        usingMockLLM,
      })
    } catch (error) {
      console.error("Error generating response:", error)

      // Fallback response
      const fallbackResponse =
        "Sorry, I encountered an error while generating a response. Please try again in a moment."

      // Save fallback response to Redis
      await saveMessage(sessionId, {
        role: "assistant",
        content: fallbackResponse,
        timestamp: new Date().toISOString(),
      })

      // Return fallback response
      return NextResponse.json({
        text: fallbackResponse,
        error: true,
      })
    }
  } catch (error) {
    console.error("Error in chat endpoint:", error)
    return NextResponse.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
