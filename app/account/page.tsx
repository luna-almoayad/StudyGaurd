'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [profiles, setProfiles] = useState<Profile[]>([])
  const activeRequestRef = useRef<number>(0)

  const isLikelyObjectId = (value: string | null) =>
    typeof value === 'string' && /^[a-f0-9]{24}$/i.test(value)

  useEffect(() => {
    const stored = localStorage.getItem('currentProfileId')
    if (stored && isLikelyObjectId(stored)) {
      setProfileId(stored)
    }
    const loadProfiles = async () => {
      const res = await fetch('/api/profiles')
      if (!res.ok) return
      const data = await res.json()
      const normalized = Array.isArray(data.profiles)
        ? data.profiles.map((profile: any) => ({
            id: profile.id || profile._id,
            name: profile.name,
            username: profile.username,
            avatar: profile.avatar,
            totalScore: profile.totalScore,
            totalSessions: profile.totalSessions,
          }))
        : []
      setProfiles(normalized)
      if ((!stored || !isLikelyObjectId(stored)) && normalized.length) {
        setProfileId(normalized[0].id)
        localStorage.setItem('currentProfileId', normalized[0].id)
      }
    }
    loadProfiles().catch((error) => console.error('Profiles load failed', error))
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!profileId) return
      const requestId = Date.now()
      activeRequestRef.current = requestId
      const [profileRes, sessionsRes] = await Promise.all([
        fetch(`/api/profiles/${profileId}`, { cache: 'no-store' }),
        fetch(`/api/sessions?profileId=${profileId}`, { cache: 'no-store' }),
      ])
      if (profileRes.ok) {
        const data = await profileRes.json()
        if (activeRequestRef.current === requestId) {
          setProfile(data.profile)
        }
      }
      if (sessionsRes.ok) {
        const data = await sessionsRes.json()
        if (activeRequestRef.current === requestId) {
          setSessions(data.sessions || [])
        }
      }
    }
    load().catch((error) => console.error('Account load failed', error))
  }, [profileId])

  const handleProfileChange = (value: string) => {
    setProfileId(value)
    localStorage.setItem('currentProfileId', value)
  }

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

  const recentSessions = useMemo(() => {
    if (!profileId) return []
    return sessions
      .filter((session) => session.results?.some((r) => r.profileId === profileId))
      .slice(0, 8)
  }, [sessions, profileId])

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Session completed'
    return new Date(timestamp).toLocaleDateString()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const showEmptyState = !profileId && profiles.length === 0

  if (showEmptyState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-beige-50 via-lavender-50 to-beige-100 flex items-center justify-center p-4">
        <div className="card p-10 max-w-lg w-full text-center">
          <h1 className="text-2xl font-semibold text-gray-800 mb-3">No profiles yet</h1>
          <p className="text-gray-500 mb-6">
            Create a profile to start tracking sessions.
          </p>
          <div className="flex gap-3">
            <button onClick={() => router.push('/profiles/new')} className="btn-primary w-full">
              Create Profile
            </button>
            <button onClick={() => router.push('/')} className="btn-secondary w-full">
              Back to Home
            </button>
          </div>
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
          {profiles.length > 0 && (
            <div className="min-w-[220px]">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Switch Profile
              </label>
              <select
                value={profileId || ''}
                onChange={(e) => handleProfileChange(e.target.value)}
                className="input-field"
              >
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.avatar ? `${p.avatar} ` : ''}{p.name} (@{p.username})
                  </option>
                ))}
              </select>
            </div>
          )}
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
            <div className="flex gap-3">
              <button onClick={() => router.push('/leaderboard/history')} className="btn-secondary">
                Session Leaderboards
              </button>
              <button onClick={() => router.push('/')} className="btn-secondary">
                Start a Session
              </button>
            </div>
          </div>
          {recentSessions.length === 0 ? (
            <div className="text-gray-500">No sessions recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {recentSessions.map((session) => {
                const match = session.results.find((r) => r.profileId === profileId)
                const scoreDisplay =
                  match && match.distractions === 0
                    ? 100
                    : match?.points ?? 0
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
                        {match ? `${scoreDisplay} pts` : 'Not linked'}
                      </div>
                      <div className="text-xs text-gray-400">
                        {match
                          ? `${match.distractions ?? 0} distractions`
                          : 'No profile match'} • {formatTime(session.duration)}
                      </div>
                      {match && match.distractions === 0 && (
                        <div className="text-[11px] text-sage-200">0 deductions</div>
                      )}
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
