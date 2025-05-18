# News RAG Chatbot

A full-stack chatbot application that answers questions about recent news using Retrieval-Augmented Generation (RAG).

## Features

- **RAG Pipeline**: Ingests news articles, embeds them, and retrieves relevant passages for each query
- **Streaming Responses**: Real-time streaming of AI responses
- **Session Management**: Each user gets a unique session with chat history
- **Caching**: Redis-based caching for session data with TTL
- **Dashboard**: Monitor system stats and trigger news ingestion

## Tech Stack

- **Frontend**: React, Next.js, Tailwind CSS
- **Backend**: Next.js API Routes
- **Embeddings**: OpenAI Embeddings API
- **Vector Database**: Qdrant
- **LLM**: Google Gemini Pro
- **Caching**: Redis

## Getting Started

### Prerequisites

- Node.js 18+
- Redis server
- Qdrant vector database
- OpenAI API key (for embeddings)
- Google Gemini API key

### Environment Variables

Create a `.env` file with the following variables:

\`\`\`
REDIS_URL=redis://localhost:6379
QDRANT_URL=http://localhost:6333
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
SESSION_TTL=86400
\`\`\`

## Caching Strategy

This application uses Redis for caching with the following considerations:

### TTL Configuration

- Session data expires after 24 hours by default (configurable via `SESSION_TTL` env var)
- This prevents memory leaks and ensures old sessions are cleaned up

### Cache Warming

- The news ingestion script can be scheduled to run periodically
- This ensures the vector database always has fresh news articles
- You can trigger ingestion manually from the dashboard

### Performance Optimizations

- Chat history is limited to recent messages to prevent large payloads
- Vector search is optimized with proper indexing in Qdrant

## Deployment

### Docker

A Dockerfile is provided for containerized deployment:

\`\`\`bash
docker build -t news-rag-chatbot .
docker run -p 3000:3000 --env-file .env news-rag-chatbot
\`\`\`

## Project Structure

- `/app`: Next.js app router pages and API routes
- `/components`: React components
- `/lib`: Core functionality (vector store, Redis, LLM)
- `/scripts`: Utility scripts (news ingestion)

## License

MIT
