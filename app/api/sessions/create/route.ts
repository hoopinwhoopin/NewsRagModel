import { NextResponse } from "next/server"
import { createSession, usingMockRedis } from "@/lib/redis"

export async function POST() {
  try {
    const sessionId = await createSession()
    return NextResponse.json({
      sessionId,
      usingMockRedis,
    })
  } catch (error) {
    console.error("Error creating session:", error)
    // Make sure we return a proper JSON response even in case of error
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}
