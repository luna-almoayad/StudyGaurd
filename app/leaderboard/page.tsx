'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Player {
  name: string
  points: number
  distractions: number
}

interface SessionResults {
  sessionData: {
    sessionName: string
    topic: string
    players: string[]
    startTime: number
  }
  players: Player[]
  duration: number
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [results, setResults] = useState<SessionResults | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('sessionResults')
    if (!stored) {
      router.push('/')
      return
    }
    setResults(JSON.parse(stored))
  }, [router])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const calculateFocusPercentage = (player: Player, maxPoints: number) => {
    return Math.round((player.points / maxPoints) * 100)
  }

  if (!results) {
    return <div className="min-h-screen flex items-center justify-center bg-beige-50">Loading...</div>
  }

  const sortedPlayers = [...results.players].sort((a, b) => b.points - a.points)
  const maxPoints = Math.max(...results.players.map(p => p.points), 100)

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return `${index + 1}.`
  }

  const getRankStyle = (index: number) => {
    if (index === 0) return 'bg-gradient-to-br from-beige-100 to-lavender-50 border-lavender-200'
    if (index === 1) return 'bg-beige-50 border-beige-200'
    if (index === 2) return 'bg-lavender-50 border-lavender-100'
    return 'bg-white border-beige-100'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-lavender-50 to-beige-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="card p-10">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-light text-gray-800 mb-3">
              <span className="font-semibold">Session</span> Complete
            </h1>
            
            <div className="space-y-1 mb-6">
              <p className="text-lg text-gray-700 font-medium">{results.sessionData.sessionName}</p>
              <p className="text-sm text-gray-500">Topic: {results.sessionData.topic}</p>
              <p className="text-xs text-gray-400 mt-2">Duration: {formatTime(results.duration)}</p>
            </div>
          </div>

          <div className="space-y-4 mb-10">
            {sortedPlayers.map((player, index) => {
              const focusPercentage = calculateFocusPercentage(player, maxPoints)
              return (
                <div
                  key={player.name}
                  className={`p-6 rounded-2xl border-2 transition-all shadow-soft ${getRankStyle(index)}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{getRankEmoji(index)}</div>
                      <div>
                        <div className="text-xl font-semibold text-gray-800 mb-1">{player.name}</div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">
                          {focusPercentage}% Focus
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-light text-lavender-400 mb-1">{player.points}</div>
                      <div className="text-xs text-gray-400">points</div>
                      {player.distractions > 0 && (
                        <div className="text-xs text-focus-red mt-1">
                          {player.distractions} distraction{player.distractions !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Focus bar */}
                  <div className="w-full bg-beige-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        focusPercentage >= 70
                          ? 'bg-focus-green'
                          : focusPercentage >= 40
                          ? 'bg-focus-yellow'
                          : 'bg-focus-red'
                      }`}
                      style={{ width: `${focusPercentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => router.push('/')}
              className="btn-primary flex-1"
            >
              Start New Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

