import { NextResponse } from "next/server"
import { clearResponseCache } from "@/lib/llm"

export async function POST() {
  try {
    const success = clearResponseCache()
    return NextResponse.json({ success })
  } catch (error) {
    console.error("Error clearing cache:", error)
    return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 })
  }
}
