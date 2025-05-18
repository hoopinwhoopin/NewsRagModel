import { NextResponse } from "next/server"
import { usingMockRedis } from "@/lib/redis"
import { usingMockVectorStore } from "@/lib/vectorstore"
import { usingMockLLM } from "@/lib/llm"

export async function GET() {
  return NextResponse.json({
    usingMockRedis,
    usingMockVectorStore,
    usingMockLLM,
  })
}
