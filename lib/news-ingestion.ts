import { ingestArticle } from "./vectorstore"
import fs from "fs"
import path from "path"

// Mock news data for when we can't fetch real news
const MOCK_NEWS_ARTICLES = [
  {
    title: "Global Economy Shows Signs of Recovery",
    content:
      "Recent economic indicators suggest that the global economy is showing signs of recovery after months of uncertainty. Experts point to increased consumer spending, lower inflation rates, and improved supply chain conditions as key factors driving this positive trend. However, challenges remain in certain sectors, particularly those affected by ongoing geopolitical tensions and labor market disruptions.",
    summary: "Global economy showing positive signs with increased consumer spending and lower inflation.",
    url: "https://example.com/news/economy/recovery",
    publishedAt: new Date().toISOString(),
  },
  {
    title: "New Breakthrough in Renewable Energy Technology",
    content:
      "Scientists have announced a significant breakthrough in solar panel efficiency, potentially revolutionizing renewable energy production. The new technology, developed by a team of international researchers, increases solar panel efficiency by up to 37%, making solar energy more viable in regions with less direct sunlight. Industry experts suggest this could accelerate the global transition to renewable energy sources and help combat climate change.",
    summary:
      "Scientists develop solar panels with 37% higher efficiency, potentially revolutionizing renewable energy.",
    url: "https://example.com/news/science/solar-breakthrough",
    publishedAt: new Date().toISOString(),
  },
  {
    title: "Major Tech Companies Announce AI Ethics Coalition",
    content:
      "Leading technology companies have formed a coalition to establish ethical guidelines for artificial intelligence development and deployment. The initiative aims to address concerns about AI bias, privacy, and potential misuse while promoting responsible innovation. The coalition will work with policymakers, academics, and civil society organizations to develop industry-wide standards that balance technological advancement with ethical considerations and public welfare.",
    summary: "Tech giants form coalition to establish ethical guidelines for AI development and use.",
    url: "https://example.com/news/tech/ai-ethics-coalition",
    publishedAt: new Date().toISOString(),
  },
  {
    title: "Global Health Organization Reports Decline in Infectious Disease Cases",
    content:
      "The World Health Organization has reported a significant decline in cases of several major infectious diseases over the past year. Improved vaccination rates, better public health infrastructure, and continued awareness campaigns have contributed to this positive trend. However, officials warn that vigilance is still necessary, particularly in regions with limited healthcare access and in the face of emerging disease variants.",
    summary: "WHO reports decline in infectious diseases due to better vaccination and public health measures.",
    url: "https://example.com/news/health/disease-decline",
    publishedAt: new Date().toISOString(),
  },
  {
    title: "New Study Reveals Impact of Climate Change on Ocean Ecosystems",
    content:
      "A comprehensive study published in Nature has revealed alarming changes in ocean ecosystems due to climate change. Rising sea temperatures, increased acidity, and changing currents are affecting marine biodiversity at unprecedented rates. The research, conducted over a decade, shows that coral reefs are particularly vulnerable, with cascading effects on thousands of species that depend on these ecosystems. Scientists call for immediate action to reduce carbon emissions and implement marine conservation strategies.",
    summary: "Decade-long study shows severe impact of climate change on ocean ecosystems, particularly coral reefs.",
    url: "https://example.com/news/environment/ocean-ecosystems",
    publishedAt: new Date().toISOString(),
  },
]

// Cache directory for ingested articles
const CACHE_DIR = path.join(process.cwd(), ".cache")

// Ensure cache directory exists
function ensureCacheDirectory() {
  try {
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true })
      console.log(`Created cache directory at ${CACHE_DIR}`)
    }
    return true
  } catch (error) {
    console.error("Error creating cache directory:", error)
    return false
  }
}

// Save ingested articles to cache
function saveIngestedArticles(articles) {
  try {
    if (!ensureCacheDirectory()) {
      console.warn("Could not save ingested articles due to cache directory issues")
      return false
    }

    const cachePath = path.join(CACHE_DIR, "ingested-articles.json")
    fs.writeFileSync(cachePath, JSON.stringify(articles, null, 2))
    console.log(`Saved ${articles.length} ingested articles to cache at ${cachePath}`)
    return true
  } catch (error) {
    console.error("Error saving ingested articles:", error)
    return false
  }
}

// Load previously ingested articles from cache
function loadIngestedArticles() {
  try {
    const cachePath = path.join(CACHE_DIR, "ingested-articles.json")
    if (fs.existsSync(cachePath)) {
      const data = fs.readFileSync(cachePath, "utf-8")
      const articles = JSON.parse(data)
      console.log(`Loaded ${articles.length} previously ingested articles from cache`)
      return articles
    }
    console.log("No previously ingested articles found in cache")
    return []
  } catch (error) {
    console.error("Error loading ingested articles:", error)
    return []
  }
}

// Ingest news articles
export async function ingestNewsArticles() {
  try {
    console.log("Starting news ingestion process...")

    // Track previously ingested articles to avoid duplicates
    const previouslyIngested = loadIngestedArticles()
    const previousUrls = new Set(previouslyIngested.map((a) => a.url))
    console.log(`Found ${previouslyIngested.length} previously ingested articles`)

    // Since we're using mock data, we'll check if we've already ingested these articles
    const newArticles = MOCK_NEWS_ARTICLES.filter((article) => !previousUrls.has(article.url))
    console.log(`Found ${newArticles.length} new mock articles to ingest`)

    // If all mock articles are already ingested, we'll add a new one with current timestamp
    if (newArticles.length === 0) {
      const currentDate = new Date()
      const newMockArticle = {
        title: `Latest News Update - ${currentDate.toLocaleDateString()}`,
        content: `This is a newly generated mock article created on ${currentDate.toLocaleString()}. It contains the latest simulated news for testing purposes. The content discusses various current events and trends across different sectors including technology, health, economy, and environment. This article is automatically generated when all existing mock articles have already been ingested.`,
        summary: "Latest mock news update with current information across various sectors.",
        url: `https://example.com/news/latest-update-${Date.now()}`,
        publishedAt: currentDate.toISOString(),
      }

      newArticles.push(newMockArticle)
      console.log("Added a new mock article with current timestamp")
    }

    // Process each article
    let successCount = 0
    const ingestedArticles = [...previouslyIngested]

    for (const [index, article] of newArticles.entries()) {
      try {
        console.log(`Processing mock article ${index + 1}/${newArticles.length}: ${article.title}`)

        // Generate a unique ID for the article
        const articleId = `article-${Date.now()}-${index}`

        // Ingest article into vector store
        await ingestArticle({
          id: articleId,
          title: article.title,
          content: article.content,
          summary: article.summary,
          url: article.url,
          publishedAt: article.publishedAt,
        })

        // Add to ingested articles list
        ingestedArticles.push({
          id: articleId,
          title: article.title,
          url: article.url,
          publishedAt: article.publishedAt,
          ingestedAt: new Date().toISOString(),
        })

        successCount++
        console.log(`Successfully ingested article: ${article.title}`)
      } catch (error) {
        console.error(`Error processing article ${article.title}:`, error)
      }
    }

    // Save ingested articles to cache
    saveIngestedArticles(ingestedArticles)

    console.log(`News ingestion complete. Successfully ingested ${successCount}/${newArticles.length} new articles.`)
    return {
      ingestedCount: successCount,
      mockArticles: true,
    }
  } catch (error) {
    console.error("Error in news ingestion process:", error)
    throw error
  }
}
