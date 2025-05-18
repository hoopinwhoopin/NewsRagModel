import { QdrantClient } from "@qdrant/js-client-rest"
import { openai } from "@ai-sdk/openai"

// Flag to track if we're using mock vector store
export const usingMockVectorStore = true

// Initialize Qdrant client with better error handling
let qdrantClient

try {
  const qdrantUrl = process.env.QDRANT_URL

  // Check if Qdrant URL is valid
  if (!qdrantUrl || !qdrantUrl.startsWith("http")) {
    console.warn(`Invalid Qdrant URL format: "${qdrantUrl}". Using mock vector store.`)
  } else {
    // Initialize Qdrant client
    qdrantClient = new QdrantClient({
      url: qdrantUrl,
    })
  }
} catch (error) {
  console.error("Failed to create Qdrant client:", error)
  console.log("Using mock vector store implementation")
}

const COLLECTION_NAME = "news_articles"
const EMBEDDING_MODEL = openai.embedding("text-embedding-3-small")
const VECTOR_SIZE = 1536 // Size of OpenAI embeddings

// Mock vector store for when Qdrant is not available
const mockVectors = [
  {
    id: "mock-1",
    text: "The latest economic report shows inflation has decreased to 3.2% in the last quarter, beating analyst expectations. This marks the third consecutive quarter of declining inflation rates, suggesting that the central bank's monetary policies are having the desired effect. Economists predict this trend will continue, potentially allowing for interest rate cuts in the coming months.",
    articleTitle: "Inflation Continues to Ease",
    articleUrl: "https://example.com/news/economy/inflation",
    publishedAt: new Date().toISOString(),
    chunkType: "paragraph",
  },
  {
    id: "mock-2",
    text: "Scientists have discovered a new species of deep-sea fish that can survive extreme pressure at ocean depths of over 8,000 meters. The fish, named Pseudoliparis swirei, has several unique adaptations including specialized cell membranes and pressure-resistant proteins. This discovery could lead to new applications in biotechnology and medicine.",
    articleTitle: "New Deep-Sea Species Discovered",
    articleUrl: "https://example.com/news/science/deep-sea-discovery",
    publishedAt: new Date().toISOString(),
    chunkType: "paragraph",
  },
  {
    id: "mock-3",
    text: "The latest smartphone from Apple features a revolutionary AI system that can process complex tasks directly on the device without cloud computing. This on-device AI capability significantly enhances privacy while reducing latency for AI-powered features. The new chip is reportedly 40% faster than previous generations while consuming 30% less power.",
    articleTitle: "Apple Unveils New AI-Powered Smartphone",
    articleUrl: "https://example.com/news/tech/apple-ai-phone",
    publishedAt: new Date().toISOString(),
    chunkType: "paragraph",
  },
  {
    id: "mock-4",
    text: "Global climate negotiations have reached a breakthrough agreement on carbon emissions targets. The new accord, signed by 195 countries, commits major economies to reduce carbon emissions by 50% by 2030 and achieve carbon neutrality by 2050. Developing nations will receive financial and technological support to meet these targets while continuing economic growth.",
    articleTitle: "Historic Climate Agreement Reached",
    articleUrl: "https://example.com/news/environment/climate-agreement",
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    chunkType: "paragraph",
  },
  {
    id: "mock-5",
    text: "A major breakthrough in quantum computing was announced today as researchers achieved quantum supremacy with a 1,000-qubit processor. The quantum computer successfully completed calculations that would take the world's fastest supercomputer over 10,000 years to solve. This milestone opens new possibilities for drug discovery, materials science, and cryptography.",
    articleTitle: "Quantum Computing Milestone Achieved",
    articleUrl: "https://example.com/news/tech/quantum-computing",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    chunkType: "paragraph",
  },
  {
    id: "mock-6",
    text: "Healthcare researchers have developed a new blood test that can detect multiple types of cancer at early stages with over 90% accuracy. The test, which identifies specific DNA fragments released by cancer cells, requires only a small blood sample and provides results within hours. Clinical trials show particularly promising results for pancreatic, ovarian, and liver cancers, which are typically difficult to detect early.",
    articleTitle: "Revolutionary Cancer Blood Test Developed",
    articleUrl: "https://example.com/news/health/cancer-blood-test",
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    chunkType: "paragraph",
  },
  {
    id: "mock-7",
    text: "The World Health Organization has declared the recent outbreak of a novel respiratory virus a global health emergency. The virus, which first appeared in Southeast Asia, has now spread to 27 countries with over 5,000 confirmed cases. Health officials are recommending increased surveillance, contact tracing, and preventive measures while pharmaceutical companies accelerate vaccine development.",
    articleTitle: "WHO Declares Global Health Emergency",
    articleUrl: "https://example.com/news/health/global-health-emergency",
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    chunkType: "paragraph",
  },
  {
    id: "mock-8",
    text: "A landmark study on renewable energy has found that solar power is now the cheapest form of electricity in history. The cost of solar energy has dropped by 89% over the past decade, making it more economical than coal and natural gas in most regions. The study projects that solar will account for 50% of global electricity generation by 2040, up from about 3% today.",
    articleTitle: "Solar Power Now Cheapest Energy Source",
    articleUrl: "https://example.com/news/energy/solar-power-costs",
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    chunkType: "paragraph",
  },
  {
    id: "mock-9",
    text: "Archaeologists have uncovered an ancient city dating back 4,000 years in the Amazon rainforest. The discovery challenges previous assumptions about pre-Columbian civilization in the region, revealing sophisticated urban planning, advanced agriculture, and complex water management systems. The site covers approximately 30 square kilometers and may have housed up to 100,000 people at its peak.",
    articleTitle: "Ancient City Discovered in Amazon Rainforest",
    articleUrl: "https://example.com/news/archaeology/amazon-ancient-city",
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    chunkType: "paragraph",
  },
  {
    id: "mock-10",
    text: "A new educational approach combining artificial intelligence with personalized learning has shown remarkable results in a five-year study. Students using the AI-assisted learning platform demonstrated 40% faster mastery of mathematics and reading comprehension compared to traditional methods. The system adapts in real-time to each student's learning style, strengths, and weaknesses, providing customized exercises and feedback.",
    articleTitle: "AI-Powered Education Shows Promising Results",
    articleUrl: "https://example.com/news/education/ai-learning-platform",
    publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    chunkType: "paragraph",
  },
]

// Initialize vector store (should be called during app initialization)
export async function initVectorStore() {
  console.log("Using mock vector store - no initialization needed")
  return
}

// Ingest a news article into the vector store
export async function ingestArticle(article: {
  id: string
  title: string
  content: string
  summary?: string
  url: string
  publishedAt: string
}) {
  console.log(`[MOCK] Ingesting article: ${article.title}`)

  // Create chunks from the article
  const chunks = createChunks(article)
  console.log(`Created ${chunks.length} chunks from article`)

  // Add each chunk to mock vectors
  for (const [index, chunk] of chunks.entries()) {
    mockVectors.push({
      id: `${article.id}-chunk-${index}`,
      text: chunk.text,
      articleTitle: article.title,
      articleUrl: article.url,
      publishedAt: article.publishedAt,
      chunkType: chunk.type,
    })
  }

  console.log(`Added ${chunks.length} chunks to mock vector store`)
  return chunks.length
}

// Retrieve relevant passages for a query
export async function retrieveRelevantPassages(query: string, topK = 5) {
  console.log(`[MOCK] Retrieving passages for query: ${query}`)

  // Extract keywords from the query
  const keywords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3)
    .filter((word) => !["what", "when", "where", "which", "who", "whom", "whose", "why", "how"].includes(word))

  console.log("Keywords extracted:", keywords)

  // Score passages based on keyword matches and other factors
  const scoredPassages = mockVectors.map((vector) => {
    const text = vector.text.toLowerCase()
    const title = vector.articleTitle.toLowerCase()
    let score = 0

    // Count keyword matches in text
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        // Full word match is worth more
        if (new RegExp(`\\b${keyword}\\b`).test(text)) {
          score += 2
        } else {
          score += 1
        }
      }
    }

    // Boost score for title matches
    for (const keyword of keywords) {
      if (title.includes(keyword)) {
        score += 1.5
      }
    }

    // Boost score for more recent articles
    const ageInDays = (Date.now() - new Date(vector.publishedAt).getTime()) / (1000 * 60 * 60 * 24)
    const recencyBoost = Math.max(0, 1 - ageInDays / 30) // Higher boost for newer articles

    // Check if query is about recent news
    if (
      query.toLowerCase().includes("recent") ||
      query.toLowerCase().includes("latest") ||
      query.toLowerCase().includes("new")
    ) {
      score += recencyBoost * 3 // Triple the recency boost for queries about recent news
    } else {
      score += recencyBoost
    }

    // Add a small random factor to prevent always returning the same passages
    score += Math.random() * 0.1

    return {
      ...vector,
      score: score > 0 ? score : 0.1, // Give a small score even if no matches
    }
  })

  // Sort by score and take top K
  const topPassages = scoredPassages
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((p) => ({
      text: p.text,
      articleTitle: p.articleTitle,
      articleUrl: p.articleUrl,
      publishedAt: p.publishedAt,
      chunkType: p.chunkType,
      score: p.score,
    }))

  console.log(`Found ${topPassages.length} relevant passages`)
  return topPassages
}

// Get vector database stats
export async function getVectorStats() {
  return {
    vectorCount: mockVectors.length,
    collectionSize: mockVectors.length,
    indexStatus: "mock",
  }
}

// Delete all vectors in the collection
export async function clearVectorStore() {
  mockVectors.length = 0
  console.log("[MOCK] Cleared vector store")
  return true
}

// Helper function to create chunks from an article
function createChunks(article: {
  title: string
  content: string
  summary?: string
}) {
  const chunks = []
  const MAX_CHUNK_SIZE = 1000 // Maximum characters per chunk

  // Add title as a chunk with higher importance
  chunks.push({
    text: `Title: ${article.title}`,
    type: "title",
  })

  // Add summary as a chunk if available
  if (article.summary) {
    chunks.push({
      text: `Summary: ${article.summary}`,
      type: "summary",
    })
  }

  // Split content into paragraphs
  const paragraphs = article.content.split("\n\n")

  // Process each paragraph
  for (const paragraph of paragraphs) {
    if (paragraph.trim().length === 0) continue

    // If paragraph is short enough, add it as a chunk
    if (paragraph.length <= MAX_CHUNK_SIZE) {
      chunks.push({
        text: paragraph.trim(),
        type: "paragraph",
      })
    } else {
      // Split long paragraphs into smaller chunks
      let currentChunk = ""
      const sentences = paragraph.split(". ")

      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length + 2 <= MAX_CHUNK_SIZE) {
          currentChunk += (currentChunk ? ". " : "") + sentence
        } else {
          if (currentChunk) {
            chunks.push({
              text: currentChunk.trim() + ".",
              type: "paragraph",
            })
          }
          currentChunk = sentence
        }
      }

      // Add the last chunk if there's anything left
      if (currentChunk) {
        chunks.push({
          text: currentChunk.trim() + ".",
          type: "paragraph",
        })
      }
    }
  }

  return chunks
}
