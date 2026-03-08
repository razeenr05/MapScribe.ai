"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, Lightbulb, Target, Zap, Loader2 } from "lucide-react"
import { RecommendationCard } from "@/components/cards/recommendation-card"

interface NodeSkill {
  id: string
  label: string
  level: number
  status: string
  description: string
}

interface Recommendation {
  id: string
  topic: string
  category: string
  reason: string
  currentLevel: number
  predictedLevel: number
  timeEstimate: string
  priority: "High" | "Medium" | "Low"
  prerequisites: string[]
  benefits: string[]
  learningPath: { step: string; completed: boolean }[]
}

interface SkillPrediction {
  skill: string
  current: number
  predicted: number
  change: string
}

interface QuickWin {
  topic: string
  time: string
  boost: string
}

export default function AssessmentPage() {
  const router = useRouter()
  const [nodes,        setNodes]        = useState<NodeSkill[]>([])
  const [loadingNodes, setLoadingNodes] = useState(true)
  const [savedGoal,    setSavedGoal]    = useState("")
  const [avgLevelDisplay, setAvgLevelDisplay] = useState<string>("—")
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [skillPredictions, setSkillPredictions] = useState<SkillPrediction[]>([])
  const [quickWins, setQuickWins] = useState<QuickWin[]>([])
  const [loadingRecs, setLoadingRecs] = useState(true)

  useEffect(() => {
    const uid = localStorage.getItem("hackai_user_id") || "user-1"
    const localGoal = localStorage.getItem("hackai_goal") || ""

    fetch(`http://localhost:8000/api/goal/${uid}`)
      .then(r => r.json())
      .then(d => { const g = d.goal || localGoal; setSavedGoal(g) })
      .catch(() => { setSavedGoal(localGoal) })

    fetch(`http://localhost:8000/api/mindmap/${uid}`)
      .then(r => r.json())
      .then(d => {
        setNodes((d.nodes || []).map((n: any) => ({
          id: n.id, label: n.data.label, level: n.data.level,
          status: n.data.status, description: n.data.description || "",
        })))
        setLoadingNodes(false)
      })
      .catch(() => setLoadingNodes(false))

    fetch(`http://localhost:8000/api/recommendations/${uid}`)
      .then(r => r.json())
      .then((d) => {
        setRecommendations(d.recommendations || [])
        setSkillPredictions(d.skillPredictions || [])
        setQuickWins(d.quickWins || [])
        setLoadingRecs(false)
      })
      .catch(() => {
        setRecommendations([])
        setSkillPredictions([])
        setQuickWins([])
        setLoadingRecs(false)
      })

    fetch(`http://localhost:8000/api/dashboard/${uid}`)
      .then(r => r.json())
      .then((d) => {
        if (d && d.averageSkillLevel) setAvgLevelDisplay(d.averageSkillLevel)
      })
      .catch(() => {})
  }, [])

  const completedCount = nodes.filter(n => n.status === "completed").length

  const statusColors: Record<string, string> = {
    completed:     "bg-success/10 text-success border-success/30",
    "in-progress": "bg-warning/10 text-warning border-warning/30",
    weak:          "bg-destructive/10 text-destructive border-destructive/30",
    recommended:   "bg-primary/10 text-primary border-primary/30",
    locked:        "bg-muted text-muted-foreground",
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Skill Assessment</h1>
          <p className="text-muted-foreground">See your current skill levels and AI-powered next steps.</p>
        </div>

        {/* Progress summary */}
        {savedGoal && nodes.length > 0 && (
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Topic</p>
                    <p className="text-xl font-bold text-primary truncate max-w-[200px]">{savedGoal}</p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-foreground">{completedCount}/{nodes.length}</p>
                  </div>
                  <div className="h-10 w-px bg-border" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Level</p>
                    <p className="text-2xl font-bold text-primary">{avgLevelDisplay}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.push("/mindmap")}>
                    <BookOpen className="mr-2 h-4 w-4" />Mind Map
                  </Button>
                  <Button size="sm" onClick={() => router.push("/practice")}>
                    Practice <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Completion</span>
                  <span className="text-sm font-medium">{Math.round((completedCount / nodes.length) * 100)}%</span>
                </div>
                <Progress value={(completedCount / nodes.length) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Node grid */}
        {loadingNodes ? (
          <div className="flex items-center gap-3 text-muted-foreground py-8 justify-center">
            <Loader2 className="h-5 w-5 animate-spin" /><span>Loading your graph...</span>
          </div>
        ) : nodes.length > 0 ? (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Knowledge Nodes — {savedGoal}</CardTitle>
                <Badge variant="secondary">{nodes.length} topics</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2">
                {nodes.map(node => (
                  <div key={node.id}
                    onClick={() => router.push(`/practice?topic=${encodeURIComponent(node.label)}`)}
                    className="flex items-center justify-between rounded-lg border border-border p-3 cursor-pointer hover:border-primary/30 hover:bg-secondary/30 transition-all">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="font-medium text-foreground text-sm truncate">{node.label}</p>
                      {node.description && <p className="text-xs text-muted-foreground truncate">{node.description}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className={`h-2 w-2 rounded-full ${i < node.level ? "bg-primary" : "bg-muted"}`} />
                        ))}
                      </div>
                      <Badge variant="outline" className={`text-xs ${statusColors[node.status] || ""}`}>
                        {node.status === "in-progress" ? "In Progress" : node.status.charAt(0).toUpperCase() + node.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-10 text-center space-y-2">
              <Target className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="font-medium text-foreground">No learning graph yet</p>
              <p className="text-sm text-muted-foreground">Go to the Learn tab to create your first learning map.</p>
            </CardContent>
          </Card>
        )}

        {/* AI recommendations (from former Recommendations tab) */}
        {!loadingRecs && (recommendations.length > 0 || skillPredictions.length > 0 || quickWins.length > 0) && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Recommended Next Topics</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => router.push("/practice")}>
                    Practice Now <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Complete a few concepts to unlock personalised recommendations.
                  </p>
                ) : (
                  recommendations.slice(0, 3).map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      title={rec.topic}
                      description={rec.reason}
                      reason={rec.benefits?.[0] || "High-impact next step in your path."}
                      improvement={`Up to ${rec.predictedLevel}/5 skill on this topic`}
                      difficulty={rec.currentLevel <= 1 ? "Beginner" : rec.currentLevel <= 3 ? "Intermediate" : "Advanced"}
                      href={`/practice?topic=${encodeURIComponent(rec.topic)}`}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Skill Outlook & Quick Wins</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Skill improvement prediction (from old Recommendations page) */}
                {skillPredictions.length > 0 && (
                  <div className="space-y-3">
                    {skillPredictions.slice(0, 4).map((item) => (
                      <div key={item.skill} className="rounded-lg border border-border bg-secondary/30 p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-sm font-medium text-foreground truncate max-w-[150px]">
                            {item.skill}
                          </p>
                          <Badge className="bg-success/10 text-success border-success/30 text-xs">
                            {item.change}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-muted-foreground/40 rounded-full"
                              style={{ width: `${(item.current / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {item.current}/5
                          </span>
                          <span className="text-xs text-muted-foreground">→</span>
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${(item.predicted / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-primary">
                            {item.predicted}/5
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick wins list */}
                {quickWins.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Quick Wins
                    </p>
                    {quickWins.slice(0, 3).map((win) => (
                      <button
                        key={win.topic}
                        onClick={() => router.push(`/practice?topic=${encodeURIComponent(win.topic)}`)}
                        className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:border-primary/30 hover:bg-secondary/40 transition-colors"
                      >
                        <span className="text-left">
                          <span className="block font-medium text-foreground">{win.topic}</span>
                          <span className="block text-xs text-muted-foreground">{win.time}</span>
                        </span>
                        <Badge className="bg-success/10 text-success border-success/30 text-xs">
                          {win.boost}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}

                {skillPredictions.length === 0 && quickWins.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Start completing topics to see skill predictions and quick wins.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </AppShell>
  )
}