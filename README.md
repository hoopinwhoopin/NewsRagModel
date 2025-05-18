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

### Prerequisites

- Node.js 18+
- Redis server
- Qdrant vector database
- OpenAI API key (for embeddings)
- Google Gemini API key



## Project Structure

- `/app`: Next.js app router pages and API routes
- `/components`: React components
- `/lib`: Core functionality (vector store, Redis, LLM)
- `/scripts`: Utility scripts (news ingestion)

## License

MIT
