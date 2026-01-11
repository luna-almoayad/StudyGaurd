'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  name: string
  username: string
  avatar?: string
  totalScore: number
  totalSessions: number
}

interface SessionResult {
  name: string
  profileId?: string | null
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

export default function AccountPage() {
  const router = useRouter()
  const [profileId, setProfileId] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessions, setSessions] = useState<SessionRecord[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('currentProfileId')
    if (!stored) return
    setProfileId(stored)
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!profileId) return
      const [profileRes, sessionsRes] = await Promise.all([
        fetch(`/api/profiles/${profileId}`),
        fetch(`/api/sessions?profileId=${profileId}`),
      ])
      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile(data.profile)
      }
      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        setSessions(data.sessions || [])
      }
    }
    load().catch((error) => console.error('Account load failed', error))
  }, [profileId])

  const averageScore = useMemo(() => {
    if (!profile || profile.totalSessions === 0) return 100
    return Math.round(profile.totalScore / profile.totalSessions)
  }, [profile])

  const starCount = useMemo(() => {
    if (!profile || profile.totalSessions === 0) return 5
    if (averageScore >= 90) return 5
    if (averageScore >= 80) return 4
    if (averageScore >= 70) return 3
    if (averageScore >= 60) return 2
    return 1
  }, [averageScore])

  const recentSessions = useMemo(() => sessions.slice(0, 8), [sessions])

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Session completed'
    return new Date(timestamp).toLocaleDateString()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  if (!profileId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-beige-50 via-lavender-50 to-beige-100 flex items-center justify-center p-4">
        <div className="card p-10 max-w-lg w-full text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-3">No profile selected</h1>
          <p className="text-gray-500 mb-6">
            Choose a host profile on the home page to view account details.
          </p>
          <button onClick={() => router.push('/')} className="btn-primary w-full">
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-lavender-50 to-beige-100 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="card p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-lavender-100 text-2xl flex items-center justify-center shadow-soft">
              {profile?.avatar || '✨'}
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-800 mb-2">
                {profile?.name || 'Loading...'}
              </h1>
              <p className="text-gray-500 text-sm">@{profile?.username}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Average Score</div>
              <div className="text-3xl font-light text-gray-700">{averageScore || 0}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Stars</div>
              <div className="text-2xl text-lavender-400">
                {'★'.repeat(starCount)}
                <span className="text-beige-200">{'★'.repeat(5 - starCount)}</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">Sessions</div>
              <div className="text-2xl font-light text-gray-700">
                {profile?.totalSessions ?? 0}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Recent Sessions</h2>
            <button onClick={() => router.push('/')} className="btn-secondary">
              Start a Session
            </button>
          </div>
          {recentSessions.length === 0 ? (
            <div className="text-gray-500">No sessions recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => {
                const match = session.results.find((r) => r.profileId === profileId)
                return (
                  <div
                    key={session._id}
                    className="p-4 rounded-xl border border-beige-100 bg-beige-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm text-gray-400 mb-1">
                        {formatDate(session.endedAt)}
                      </div>
                      <div className="text-lg font-semibold text-gray-800">
                        {session.sessionName}
                      </div>
                      <div className="text-sm text-gray-500">Topic: {session.topic}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-light text-lavender-400">
                        {match?.points ?? 0} pts
                      </div>
                      <div className="text-xs text-gray-400">
                        {match?.distractions ?? 0} distractions • {formatTime(session.duration)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
