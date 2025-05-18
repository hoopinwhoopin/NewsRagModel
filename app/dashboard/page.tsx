"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, Database, MessageSquare, Info, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { ToastAction } from "@/components/ui/toast"

interface DashboardStats {
  activeSessions: number
  totalMessages: number
  vectorCount: number
  lastIngestion: string
  usingMockRedis: boolean
  usingMockVectorStore: boolean
  usingMockLLM: boolean
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingestSuccess, setIngestSuccess] = useState<{ count: number; mock: boolean } | null>(null)

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/dashboard/stats")

      if (!response.ok) {
        throw new Error(`Error fetching stats: ${response.status}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error fetching stats:", error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard stats. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const triggerIngestion = async () => {
    try {
      setIsIngesting(true)
      setIngestSuccess(null)

      const response = await fetch("/api/dashboard/ingest", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Error triggering ingestion: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setIngestSuccess({
          count: data.ingestedCount || 0,
          mock: data.mockArticles || false,
        })

        toast({
          title: "Success",
          description: `Successfully ingested ${data.ingestedCount} articles.`,
          action: <ToastAction altText="Refresh">Refresh</ToastAction>,
        })
      } else {
        throw new Error(data.message || "Unknown error")
      }

      // Refresh stats after successful ingestion
      await fetchStats()
    } catch (error) {
      console.error("Error triggering ingestion:", error)
      toast({
        title: "Error",
        description: "Failed to run news ingestion. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsIngesting(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">RAG Chatbot Dashboard</h1>
        <Button onClick={fetchStats} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {stats?.usingMockRedis && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Using In-Memory Storage</AlertTitle>
          <AlertDescription>
            The application is currently using in-memory storage instead of Redis. Your chat history will be lost when
            the server restarts.
          </AlertDescription>
        </Alert>
      )}

      {stats?.usingMockVectorStore && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Using Mock Vector Store</AlertTitle>
          <AlertDescription>
            The application is currently using a mock vector store instead of Qdrant. Search results may not be
            accurate.
          </AlertDescription>
        </Alert>
      )}

      {stats?.usingMockLLM && (
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertTitle>Using Simplified AI Responses</AlertTitle>
          <AlertDescription>
            The application is currently using simplified AI responses due to technical limitations. Responses are
            generated based on keyword matching and may not be as comprehensive as full AI responses.
          </AlertDescription>
        </Alert>
      )}

      {ingestSuccess && (
        <Alert className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>News Ingestion Complete</AlertTitle>
          <AlertDescription>
            Successfully ingested {ingestSuccess.count} {ingestSuccess.mock ? "mock " : ""}articles into the vector
            store.
          </AlertDescription>
        </Alert>
      )}

      {isLoading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
                <p className="text-xs text-muted-foreground">Total active chat sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
                <p className="text-xs text-muted-foreground">Messages across all sessions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vector Database</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.vectorCount || 0}</div>
                <p className="text-xs text-muted-foreground">Total vectors in database</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>News Ingestion</CardTitle>
                <CardDescription>
                  Last ingestion: {stats?.lastIngestion ? new Date(stats.lastIngestion).toLocaleString() : "Never"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button onClick={triggerIngestion} disabled={isIngesting} className="w-full sm:w-auto">
                    {isIngesting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Ingesting...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Run News Ingestion
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    This will ingest mock news articles into the vector store for demonstration purposes.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system component status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Database:</span>
                    <Badge variant={stats?.usingMockRedis ? "outline" : "default"}>
                      {stats?.usingMockRedis ? "In-Memory" : "Redis"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Vector Store:</span>
                    <Badge variant={stats?.usingMockVectorStore ? "outline" : "default"}>
                      {stats?.usingMockVectorStore ? "Mock" : "Qdrant"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>AI Model:</span>
                    <Badge variant={stats?.usingMockLLM ? "outline" : "default"}>
                      {stats?.usingMockLLM ? "Simplified" : "Gemini"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
