import { initVectorStore } from "../lib/vectorstore"
import { ingestNewsArticles } from "../lib/news-ingestion"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

async function main() {
  try {
    console.log("Starting news ingestion script...")

    // Initialize vector store
    console.log("Initializing vector store...")
    await initVectorStore()

    // Ingest news articles
    console.log("Starting news ingestion...")
    const ingestedCount = await ingestNewsArticles()

    console.log(`News ingestion completed successfully! Ingested ${ingestedCount} new articles.`)
    process.exit(0)
  } catch (error) {
    console.error("Error in news ingestion script:", error)
    process.exit(1)
  }
}

main()
