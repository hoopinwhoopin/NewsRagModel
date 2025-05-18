import { NextResponse } from "next/server"
import { getSessionStats } from "@/lib/redis"
import { getVectorStats, usingMockVectorStore } from "@/lib/vectorstore"
import { usingMockRedis } from "@/lib/redis"
import { usingMockLLM } from "@/lib/llm"
import fs from "fs"
import path from "path"

export async function GET() {
  try {
    // Get Redis session stats
    const sessionStats = await getSessionStats()

    // Get vector database stats
    const vectorStats = await getVectorStats()

    // Get last ingestion time from cache
    const cachePath = path.join(process.cwd(), ".cache", "ingested-articles.json")
    let lastIngestion = null

    if (fs.existsSync(cachePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(cachePath, "utf-8"))
        if (data.length > 0) {
          // Find the most recent ingestion timestamp
          const timestamps = data
            .filter((article) => article.ingestedAt)
            .map((article) => new Date(article.ingestedAt).getTime())

          if (timestamps.length > 0) {
            lastIngestion = new Date(Math.max(...timestamps)).toISOString()
          }
        }
      } catch (error) {
        console.error("Error reading ingestion cache:", error)
      }
    }

    return NextResponse.json({
      activeSessions: sessionStats.activeSessions,
      totalMessages: sessionStats.totalMessages,
      vectorCount: vectorStats.vectorCount,
      lastIngestion,
      usingMockRedis,
      usingMockVectorStore,
      usingMockLLM,
    })
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
