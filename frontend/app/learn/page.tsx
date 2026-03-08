"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sparkles, ArrowRight, Loader2, BookOpen, ChevronRight, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AppShell } from "@/components/app-shell"

const suggestions = [
  "basketball fundamentals",
  "how to cook Italian food",
  "machine learning",
  "music theory",
  "photography",
  "investing and finance",
  "web development",
  "speak Spanish",
  "chess strategy",
  "video editing",
]

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface LearningGoalItem {
  id: number
  goal: string
  created_at: string | null
}

function getUserId(): string {
  if (typeof window === "undefined") return "user-1"
  return localStorage.getItem("hackai_user_id") || "user-1"
}

export default function LearnPage() {
  const router = useRouter()
  const [goal, setGoal] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pastGoals, setPastGoals] = useState<LearningGoalItem[]>([])
  const [loadingPast, setLoadingPast] = useState(true)
  const [resumingId, setResumingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    const uid = getUserId()
    fetch(`${API_BASE}/api/learning-goals/${uid}`)
      .then((r) => r.json())
      .then((list: LearningGoalItem[]) => setPastGoals(Array.isArray(list) ? list : []))
      .catch(() => setPastGoals([]))
      .finally(() => setLoadingPast(false))
  }, [])

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed) return

    setLoading(true)
    setError("")

    try {
      const uid = getUserId()
      const res = await fetch(`${API_BASE}/api/generate-graph`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, goal: trimmed, force: true }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.detail || "Failed to generate graph")
      }

      const data = await res.json()
      if (typeof window !== "undefined") {
        localStorage.setItem("hackai_goal", trimmed)
        localStorage.setItem("hackai_user_id", uid)
        if (data.goal_id != null) localStorage.setItem("hackai_goal_id", String(data.goal_id))
      }
      router.push("/mindmap")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.")
      setLoading(false)
    }
  }

  const handleResume = async (item: LearningGoalItem) => {
    const uid = getUserId()
    setResumingId(item.id)
    try {
      const res = await fetch(`${API_BASE}/api/current-goal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, goal_id: item.id }),
      })
      if (!res.ok) throw new Error("Failed to set goal")
      if (typeof window !== "undefined") {
        localStorage.setItem("hackai_goal", item.goal)
        localStorage.setItem("hackai_goal_id", String(item.id))
      }
      router.push("/mindmap")
    } catch {
      setResumingId(null)
    }
  }

  const handleDelete = async (e: React.MouseEvent, item: LearningGoalItem) => {
    e.stopPropagation()
    if (deletingId !== null) return
    const uid = getUserId()
    setDeletingId(item.id)
    try {
      const res = await fetch(
        `${API_BASE}/api/learning-goals/${uid}/${item.id}`,
        { method: "DELETE" }
      )
      if (!res.ok) throw new Error("Failed to delete")
      setPastGoals((prev) => prev.filter((g) => g.id !== item.id))
    } catch {
      // keep list as is
    }
    setDeletingId(null)
  }

  return (
    <AppShell>
    <div className="min-h-screen bg-background bg-page-gradient flex items-center justify-center p-6">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-stretch lg:items-start justify-center lg:justify-between">
        {/* Left: main input */}
        <div className="flex-1 max-w-xl space-y-8 stagger-reveal">

          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold text-foreground tracking-tight">MapScribe.ai</span>
            </div>
            <h1 className="text-4xl font-bold text-foreground leading-tight tracking-tight">
              What do you want to learn?
            </h1>
            <p className="text-muted-foreground text-lg">
              Type anything — AI will build you a personalized learning path.
            </p>
          </div>

          <Card className="border-border/80 shadow-lg shadow-primary/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="e.g. basketball, machine learning, cooking..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit(goal)}
                  className="text-base h-12"
                  disabled={loading}
                  autoFocus
                />
                <Button
                  onClick={() => handleSubmit(goal)}
                  disabled={!goal.trim() || loading}
                  className="h-12 px-6 shrink-0"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Start
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {loading && (
                <p className="text-sm text-muted-foreground text-center animate-pulse">
                  AI is building your learning path...
                </p>
              )}

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </CardContent>
          </Card>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">Or try one of these</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {suggestions.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors px-3 py-1 text-sm"
                  onClick={() => !loading && handleSubmit(s)}
                >
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Right: past learning — pushed right */}
        <Card className="w-full lg:w-80 lg:ml-8 shrink-0 border-border/80 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Your past learning</h2>
            </div>
            {loadingPast ? (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : pastGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Start a topic above — your goals will appear here so you can resume anytime.
              </p>
            ) : (
              <ul className="space-y-2">
                {pastGoals.map((item) => (
                  <li key={item.id}>
                    <div className="flex items-center gap-1 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/60 hover:border-primary/30 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => handleResume(item)}
                        disabled={resumingId !== null}
                        className="flex-1 min-w-0 text-left flex items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-foreground transition-colors disabled:opacity-50"
                      >
                        <span className="truncate">{item.goal}</span>
                        {resumingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin shrink-0 text-primary" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, item)}
                        disabled={deletingId !== null}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                        title="Delete this learning goal"
                      >
                        {deletingId === item.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
    </AppShell>
  )
}