import { type NextRequest, NextResponse } from "next/server"
import { deleteSession } from "@/lib/redis"

export async function POST(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    await deleteSession(sessionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error resetting session:", error)
    return NextResponse.json({ error: "Failed to reset session" }, { status: 500 })
  }
}
