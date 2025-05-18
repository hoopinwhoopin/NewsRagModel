import { NextResponse } from "next/server"
import { ingestNewsArticles } from "@/lib/news-ingestion"
import { initVectorStore } from "@/lib/vectorstore"

export async function POST() {
  try {
    console.log("Starting news ingestion process from API endpoint...")

    // Initialize vector store
    await initVectorStore()

    // Run news ingestion
    const result = await ingestNewsArticles()

    console.log(`News ingestion completed with result:`, result)

    return NextResponse.json({
      success: true,
      ingestedCount: result.ingestedCount,
      mockArticles: result.mockArticles,
    })
  } catch (error) {
    console.error("Error running news ingestion:", error)
    return NextResponse.json(
      {
        error: "Failed to run news ingestion",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
