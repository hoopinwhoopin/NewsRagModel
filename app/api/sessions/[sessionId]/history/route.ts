import { type NextRequest, NextResponse } from "next/server"
import { getSessionHistory } from "@/lib/redis"

export async function GET(req: NextRequest, { params }: { params: { sessionId: string } }) {
  try {
    const sessionId = params.sessionId

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    const history = await getSessionHistory(sessionId)
    return NextResponse.json({ history })
  } catch (error) {
    console.error("Error fetching session history:", error)
    return NextResponse.json({ error: "Failed to fetch session history" }, { status: 500 })
  }
}
