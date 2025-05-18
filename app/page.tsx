"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Send, Trash2, Loader2, RefreshCw, AlertCircle, Info, LayoutDashboard, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  isUsingMockLLM?: boolean
}

export default function ChatPage() {
  const [sessionId, setSessionId] = useState<string>("")
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content: "Hello! I can answer questions about recent news. What would you like to know?",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)
  const [usingMockRedis, setUsingMockRedis] = useState(false)
  const [usingMockLLM, setUsingMockLLM] = useState(true) // Default to true
  const [isThrottled, setIsThrottled] = useState(false)
  const [throttleTimer, setThrottleTimer] = useState(0)
  const [isClearingCache, setIsClearingCache] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const throttleTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize session on component mount
  useEffect(() => {
    const initSession = async () => {
      try {
        setIsInitializing(true)
        setInitError(null)

        const response = await fetch("/api/sessions/create", {
          method: "POST",
        })

        if (!response.ok) {
          throw new Error(`Failed to create session: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()

        if (!data.sessionId) {
          throw new Error("No session ID returned from server")
        }

        setSessionId(data.sessionId)
        setUsingMockRedis(data.usingMockRedis || false)

        // Check LLM status
        try {
          const statusResponse = await fetch("/api/status")
          const statusData = await statusResponse.json()
          setUsingMockLLM(statusData.usingMockLLM || true) // Default to true if not specified
        } catch (error) {
          console.error("Failed to check LLM status:", error)
          // Assume we're using mock LLM if we can't check
          setUsingMockLLM(true)
        }

        setIsInitializing(false)
      } catch (error) {
        console.error("Failed to initialize session:", error)
        setInitError(error instanceof Error ? error.message : "Unknown error occurred")
        setIsInitializing(false)
      }
    }

    initSession()

    // Clean up throttle timer on unmount
    return () => {
      if (throttleTimerRef.current) {
        clearInterval(throttleTimerRef.current)
      }
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Start throttle countdown timer
  const startThrottleTimer = () => {
    setThrottleTimer(15) // 15 seconds cooldown
    setIsThrottled(true)

    if (throttleTimerRef.current) {
      clearInterval(throttleTimerRef.current)
    }

    throttleTimerRef.current = setInterval(() => {
      setThrottleTimer((prev) => {
        if (prev <= 1) {
          clearInterval(throttleTimerRef.current!)
          setIsThrottled(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || !sessionId || isLoading || isThrottled) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: input,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      // Check if we're being throttled
      if (data.throttled) {
        startThrottleTimer()
      }

      // Update the mock LLM status if it changed
      if (data.usingMockLLM !== undefined) {
        setUsingMockLLM(data.usingMockLLM)
      }

      const botMessage: Message = {
        id: Date.now().toString() + "-bot",
        content: data.text,
        role: "assistant",
        timestamp: new Date(),
        isUsingMockLLM: data.usingMockLLM,
      }

      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error("Chat error:", error)

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString() + "-error",
          content: "Sorry, there was an error processing your request. Please try again.",
          role: "assistant",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const resetSession = async () => {
    try {
      setIsInitializing(true)
      setInitError(null)

      if (sessionId) {
        // Try to reset the current session
        try {
          await fetch(`/api/sessions/${sessionId}/reset`, {
            method: "POST",
          })
        } catch (error) {
          console.error("Failed to reset session, but continuing:", error)
        }
      }

      // Create new session
      const response = await fetch("/api/sessions/create", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data.sessionId) {
        throw new Error("No session ID returned from server")
      }

      setSessionId(data.sessionId)
      setUsingMockRedis(data.usingMockRedis || false)

      // Reset messages
      setMessages([
        {
          id: "welcome",
          content: "Hello! I can answer questions about recent news. What would you like to know?",
          role: "assistant",
          timestamp: new Date(),
        },
      ])

      setIsInitializing(false)
    } catch (error) {
      console.error("Failed to reset session:", error)
      setInitError(error instanceof Error ? error.message : "Unknown error occurred")
      setIsInitializing(false)
    }
  }

  const clearCache = async () => {
    try {
      setIsClearingCache(true)
      const response = await fetch("/api/cache/clear", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Failed to clear cache: ${response.status}`)
      }

      toast({
        title: "Cache Cleared",
        description: "Response cache has been cleared. You should now get fresh responses.",
      })
    } catch (error) {
      console.error("Error clearing cache:", error)
      toast({
        title: "Error",
        description: "Failed to clear response cache.",
        variant: "destructive",
      })
    } finally {
      setIsClearingCache(false)
    }
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const retryInitialization = () => {
    resetSession()
  }

  // Suggested questions to help users get started
  const suggestedQuestions = [
    "What are the latest developments in AI technology?",
    "Tell me about recent climate change news",
    "What's happening in the global economy?",
    "Are there any recent medical breakthroughs?",
    "What's the latest in renewable energy?",
  ]

  const askSuggestedQuestion = (question: string) => {
    if (isLoading || isThrottled) return

    setInput(question)
    // Focus the input field
    const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement
    if (inputElement) {
      inputElement.focus()
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto p-4">
      <header className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">News RAG Chatbot</h1>
          <p className="text-sm text-gray-500">Ask me anything about recent news</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearCache}
            disabled={isClearingCache}
            title="Clear response cache"
          >
            <Zap className={`h-4 w-4 ${isClearingCache ? "animate-pulse" : ""}`} />
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" title="Dashboard">
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </Link>
          {sessionId && (
            <Badge variant="outline" className="px-2 py-1">
              Session: {sessionId.substring(0, 8)}...
            </Badge>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={resetSession}
            title="Reset session"
            disabled={isInitializing || isLoading}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <Separator className="my-2" />

      {usingMockRedis && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Using In-Memory Storage</AlertTitle>
          <AlertDescription>
            The application is currently using in-memory storage instead of Redis. Your chat history will be lost when
            the server restarts.
          </AlertDescription>
        </Alert>
      )}

      {usingMockLLM && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Using Simplified AI Responses</AlertTitle>
          <AlertDescription>
            The application is currently using simplified AI responses due to technical limitations. Responses are
            generated based on keyword matching and may not be as comprehensive as full AI responses.
          </AlertDescription>
        </Alert>
      )}

      {initError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {initError}
            <Button variant="outline" size="sm" onClick={retryInitialization} className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {messages.length === 1 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Try asking about:</h3>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => askSuggestedQuestion(question)}
                className="text-xs"
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <Card
              className={`max-w-[80%] p-3 ${
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              <div className="flex flex-col">
                <div className="whitespace-pre-wrap">{message.content}</div>
                <div className="flex justify-between items-center mt-1">
                  <div className="text-xs opacity-70">{formatTime(message.timestamp)}</div>
                  {message.isUsingMockLLM && (
                    <Badge variant="outline" className="text-xs">
                      Simplified
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] p-3 bg-muted">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            isThrottled
              ? `Please wait ${throttleTimer} seconds...`
              : sessionId
                ? "Ask about recent news..."
                : "Initializing..."
          }
          disabled={isInitializing || isLoading || !sessionId || isThrottled}
          className="flex-1"
        />
        <Button type="submit" disabled={isInitializing || isLoading || !sessionId || !input.trim() || isThrottled}>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {isInitializing && !initError && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin" />
            <p>Initializing chatbot...</p>
          </div>
        </div>
      )}
    </div>
  )
}
