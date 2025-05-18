// Flag to track if we're using mock LLM
export const usingMockLLM = true // Default to true until we confirm the API works

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}

interface Passage {
  text: string
  articleTitle: string
  articleUrl: string
  publishedAt: string
  chunkType?: string
  score: number
}

// Simple in-memory cache for responses
const responseCache = new Map<string, { text: string; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 10 // 10 minutes in milliseconds (reduced from 1 hour)

// Generate a response using our mock implementation
export async function generateResponse(query: string, passages: Passage[], history: ChatMessage[]): Promise<string> {
  console.log("Using mock response generator for query:", query)
  console.log("Found passages:", passages.length)

  // Generate a unique cache key that includes the query and a hash of the passages
  const cacheKey = getCacheKey(query, passages)

  // Only use cache for identical queries with identical passages
  const cachedResponse = responseCache.get(cacheKey)

  if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
    console.log("Using cached response for query:", query)
    return cachedResponse.text
  }

  // Get the previous question from history if available
  const previousQuestions = history.filter((msg) => msg.role === "user").map((msg) => msg.content)

  const previousQuestion = previousQuestions.length > 1 ? previousQuestions[previousQuestions.length - 2] : null

  // Check if this is a follow-up question
  const isFollowUp =
    previousQuestion &&
    (query.toLowerCase().includes("what about") ||
      query.toLowerCase().includes("how about") ||
      query.toLowerCase().includes("and") ||
      query.toLowerCase().includes("also") ||
      query.length < 15)

  // Generate response based on query type and available passages
  let response = ""

  if (passages.length === 0) {
    response = generateNoPassagesResponse(query)
  } else if (isFollowUp && previousQuestion) {
    response = generateFollowUpResponse(query, previousQuestion, passages)
  } else {
    response = generateStandardResponse(query, passages)
  }

  // Cache the response
  responseCache.set(cacheKey, {
    text: response,
    timestamp: Date.now(),
  })

  return response
}

// Generate a response when no relevant passages are found
function generateNoPassagesResponse(query: string): string {
  const responses = [
    `I don't have specific information about "${query}" in my recent news database.`,
    `I couldn't find any recent news articles about "${query}" in my database.`,
    `I don't have enough information about "${query}" to provide a meaningful answer.`,
    `I don't have any recent news coverage about "${query}" in my knowledge base.`,
  ]

  const randomResponse = responses[Math.floor(Math.random() * responses.length)]

  return `${randomResponse}

Note: I'm currently operating with simplified responses.`
}

// Generate a response for follow-up questions
function generateFollowUpResponse(query: string, previousQuestion: string, passages: Passage[]): string {
  // Combine the current query with context from the previous question
  const combinedQuery = `${previousQuestion} ${query}`
  const keywords = getKeywords(combinedQuery)

  // Find the most relevant passage
  const relevantPassage = findMostRelevantPassage(keywords, passages)

  return `Regarding your follow-up about ${query.replace(/[?.,!]/g, "")}, based on "${relevantPassage.articleTitle}":

${relevantPassage.text}

This information was published on ${formatDate(relevantPassage.publishedAt)}.

Note: I'm currently operating with simplified responses.`
}

// Generate a standard response based on query type
function generateStandardResponse(query: string, passages: Passage[]): string {
  const keywords = getKeywords(query)
  const queryLower = query.toLowerCase()

  // Find the most relevant passage
  const relevantPassage = findMostRelevantPassage(keywords, passages)

  // Determine query type and generate appropriate response
  if (queryLower.includes("when") || queryLower.includes("date") || queryLower.includes("time")) {
    return `According to "${relevantPassage.articleTitle}" (published on ${formatDate(relevantPassage.publishedAt)}), ${relevantPassage.text}

This information is from ${formatDate(relevantPassage.publishedAt)}.

Note: I'm currently operating with simplified responses.`
  }

  if (queryLower.includes("who") || queryLower.includes("person") || queryLower.includes("people")) {
    return `Based on the article "${relevantPassage.articleTitle}", ${relevantPassage.text}

This information was published on ${formatDate(relevantPassage.publishedAt)}.

Note: I'm currently operating with simplified responses.`
  }

  if (queryLower.includes("why") || queryLower.includes("reason") || queryLower.includes("cause")) {
    return `The article "${relevantPassage.articleTitle}" provides this information: ${relevantPassage.text}

This might help explain the reasons you're asking about.

Note: I'm currently operating with simplified responses.`
  }

  if (queryLower.includes("how") || queryLower.includes("process") || queryLower.includes("method")) {
    return `According to "${relevantPassage.articleTitle}", ${relevantPassage.text}

This explains the process you're asking about.

Note: I'm currently operating with simplified responses.`
  }

  if (queryLower.includes("where") || queryLower.includes("location") || queryLower.includes("place")) {
    return `The article "${relevantPassage.articleTitle}" mentions: ${relevantPassage.text}

This information about the location was published on ${formatDate(relevantPassage.publishedAt)}.

Note: I'm currently operating with simplified responses.`
  }

  if (
    queryLower.includes("compare") ||
    queryLower.includes("difference") ||
    queryLower.includes("versus") ||
    queryLower.includes("vs")
  ) {
    // For comparison questions, try to find multiple relevant passages
    const topPassages = passages.slice(0, 2)

    if (topPassages.length > 1) {
      return `I found some information that might help with your comparison:

From "${topPassages[0].articleTitle}": ${topPassages[0].text}

And from "${topPassages[1].articleTitle}": ${topPassages[1].text}

Note: I'm currently operating with simplified responses.`
    }
  }

  if (
    queryLower.includes("latest") ||
    queryLower.includes("recent") ||
    queryLower.includes("new") ||
    queryLower.includes("update")
  ) {
    // Sort passages by date for recency questions
    const recentPassages = [...passages].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )

    if (recentPassages.length > 0) {
      const recentPassage = recentPassages[0]
      return `The most recent information I have is from "${recentPassage.articleTitle}" (${formatDate(recentPassage.publishedAt)}):

${recentPassage.text}

Note: I'm currently operating with simplified responses.`
    }
  }

  // Default response with some variation
  const intros = [
    `Based on recent news from "${relevantPassage.articleTitle}":`,
    `According to the article "${relevantPassage.articleTitle}":`,
    `The information from "${relevantPassage.articleTitle}" indicates:`,
    `As reported in "${relevantPassage.articleTitle}":`,
  ]

  const randomIntro = intros[Math.floor(Math.random() * intros.length)]

  return `${randomIntro}

${relevantPassage.text}

This information was published on ${formatDate(relevantPassage.publishedAt)}.

Note: I'm currently operating with simplified responses.`
}

// Find the most relevant passage based on keywords
function findMostRelevantPassage(keywords: string[], passages: Passage[]): Passage {
  let bestPassage = passages[0]
  let bestScore = 0

  for (const passage of passages) {
    const passageText = passage.text.toLowerCase()
    const passageTitle = passage.articleTitle.toLowerCase()
    let score = 0

    for (const keyword of keywords) {
      if (passageText.includes(keyword)) {
        score += 1
      }
      if (passageTitle.includes(keyword)) {
        score += 0.5
      }
    }

    // Add a small random factor to prevent always selecting the same passage
    score += Math.random() * 0.1

    if (score > bestScore) {
      bestScore = score
      bestPassage = passage
    }
  }

  return bestPassage
}

// Generate a more specific cache key from the query and passages
function getCacheKey(query: string, passages: Passage[]): string {
  const normalizedQuery = query.toLowerCase().trim()

  // Create a simple hash of the passages to include in the cache key
  let passageHash = ""
  if (passages.length > 0) {
    passageHash = passages
      .slice(0, 3)
      .map((p) => p.articleTitle.substring(0, 10))
      .join("|")
  }

  return `${normalizedQuery}:${passageHash}`
}

// Format a date string
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch (e) {
    return dateString
  }
}

// Extract keywords from a query
function getKeywords(query: string): string[] {
  // Remove common stop words
  const stopWords = [
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "is",
    "are",
    "was",
    "were",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "about",
    "what",
    "when",
    "where",
    "who",
    "how",
    "why",
    "which",
    "do",
    "does",
    "did",
    "have",
    "has",
    "had",
    "can",
    "could",
    "will",
    "would",
    "should",
    "may",
    "might",
    "me",
    "my",
    "mine",
    "your",
    "yours",
    "we",
    "our",
    "ours",
    "they",
    "their",
    "theirs",
    "this",
    "that",
    "these",
    "those",
    "it",
    "its",
    "of",
    "from",
  ]

  // Normalize and split the query
  const words = query
    .toLowerCase()
    .replace(/[.,?!;:()[\]{}""'']/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.includes(word))

  return [...new Set(words)] // Remove duplicates
}

// Function to clear the response cache
export function clearResponseCache() {
  responseCache.clear()
  console.log("Response cache cleared")
  return true
}
