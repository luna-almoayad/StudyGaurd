"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

interface SessionResult {
  name: string
  points: number
  distractions: number
}

interface SessionRecord {
  _id: string
  sessionName: string
  topic: string
  duration: number
  endedAt?: number
  results: SessionResult[]
}

export default function SessionHistoryLeaderboard() {
  const router = useRouter()
  const [sessions, setSessions] = useState<SessionRecord[]>([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/sessions", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      setSessions(data.sessions || [])
    }
    load().catch((error) => console.error("Failed to load sessions", error))
  }, [])

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Session completed"
    return new Date(timestamp).toLocaleDateString()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const sortedSessions = useMemo(() => sessions.slice(0, 20), [sessions])

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-lavender-50 to-beige-100 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="card p-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 mb-2">Session Leaderboards</h1>
            <p className="text-sm text-gray-500">Top performers from recent sessions.</p>
          </div>
          <button onClick={() => router.push("/")} className="btn-secondary">
            Back to Home
          </button>
        </div>

        {sortedSessions.length === 0 ? (
          <div className="card p-8 text-gray-500">No sessions recorded yet.</div>
        ) : (
          <div className="space-y-4">
            {sortedSessions.map((session) => {
              const topResults = [...(session.results || [])]
                .sort((a, b) => b.points - a.points)
                .slice(0, 3)
              return (
                <div key={session._id} className="card p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">{formatDate(session.endedAt)}</div>
                      <div className="text-lg font-semibold text-gray-800">{session.sessionName}</div>
                      <div className="text-sm text-gray-500">Topic: {session.topic}</div>
                    </div>
                    <div className="text-sm text-gray-400">
                      Duration: {formatTime(session.duration)}
                    </div>
                  </div>

                  {topResults.length === 0 ? (
                    <div className="text-sm text-gray-400">No results yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {topResults.map((result, index) => (
                        <div
                          key={`${result.name}-${index}`}
                          className="p-4 rounded-xl border border-beige-100 bg-beige-50"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-gray-800">{result.name}</div>
                              <div className="text-xs text-gray-400">
                                {result.distractions} distractions
                              </div>
                            </div>
                            <div className="text-lg font-light text-lavender-400">
                              {result.points} pts
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
