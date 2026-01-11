'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  name: string
  username: string
  avatar?: string
  totalScore: number
  totalSessions: number
}

export default function Home() {
  const router = useRouter()
  const [sessionName, setSessionName] = useState('')
  const [topic, setTopic] = useState('')
  const [players, setPlayers] = useState<string[]>([''])
  const [playerProfiles, setPlayerProfiles] = useState<string[]>([''])
  const [error, setError] = useState('')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [hostProfileId, setHostProfileId] = useState('')

  useEffect(() => {
    const loadProfiles = async () => {
      try {
        const res = await fetch('/api/profiles')
        if (!res.ok) return
        const data = await res.json()
        setProfiles(data.profiles || [])
        const saved = localStorage.getItem('currentProfileId') || ''
        if (saved) {
          setHostProfileId(saved)
        }
      } catch (err) {
        console.error('Failed to load profiles', err)
      }
    }
    loadProfiles()
  }, [])

  const addPlayer = () => {
    if (players.length < 6) {
      setPlayers([...players, ''])
      setPlayerProfiles((prev) => [...prev, ''])
    }
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index))
      setPlayerProfiles(playerProfiles.filter((_, i) => i !== index))
    }
  }

  const updatePlayer = (index: number, value: string) => {
    const newPlayers = [...players]
    newPlayers[index] = value
    setPlayers(newPlayers)
  }

  const updatePlayerProfile = (index: number, value: string) => {
    const next = [...playerProfiles]
    next[index] = value
    setPlayerProfiles(next)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const validPlayers = players.filter(p => p.trim() !== '')
    
    if (!sessionName.trim()) {
      setError('Please enter a session name')
      return
    }
    
    if (!topic.trim()) {
      setError('Please enter a course/topic')
      return
    }
    
    if (validPlayers.length < 2) {
      setError('Please add at least 2 players')
      return
    }
    
    if (validPlayers.length > 6) {
      setError('Maximum 6 players allowed')
      return
    }

    if (hostProfileId) {
      localStorage.setItem('currentProfileId', hostProfileId)
    }

    // Store session data and navigate
    const sessionData = {
      sessionName: sessionName.trim(),
      topic: topic.trim(),
      players: validPlayers,
      hostProfileId: hostProfileId || null,
      participants: validPlayers.map((name, index) => ({
        name,
        profileId: playerProfiles[index] || null,
      })),
      startTime: Date.now(),
    }
    
    localStorage.setItem('studySession', JSON.stringify(sessionData))
    router.push('/session')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-lavender-50 to-beige-100 flex items-center justify-center p-4">
      <div className="card p-10 w-full max-w-2xl">
        <div className="mb-10">
          <div className="flex flex-col items-center justify-center sm:flex-row sm:items-center sm:justify-start">
            <Image
              src="/guardIcon.png"
              alt="ChirpGuard"
              width={128}
              height={128}
              className="h-28 w-28 sm:h-32 sm:w-32 sm:ml-2 rounded-3xl border border-beige-100 bg-white object-contain"
              priority
            />
            <div className="text-center sm:flex-1 sm:text-center -ml-12">
              <h1 className="text-6xl font-light text-gray-800 tracking-tight mb-2">
                Chirp<span className="font-semibold text-lavender-400">Guard</span>
              </h1>
              <p className="text-gray-500 text-xl">Create your study party</p>
            </div>
          </div>
        </div>

            <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-4 bg-beige-50 border border-beige-100">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Host Profile</h2>
              <div className="flex items-center gap-3">
                <Link
                  href="/account"
                  className="w-8 h-8 rounded-full bg-beige-100 text-gray-600 flex items-center justify-center shadow-soft hover:shadow-soft-lg transition-all border border-beige-200"
                  aria-label="View account"
                  title="View account"
                >
                  👤
                </Link>
                <Link
                  href="/profiles/new"
                  className="w-8 h-8 rounded-full bg-lavender-100 text-lavender-600 flex items-center justify-center shadow-soft hover:shadow-soft-lg transition-all"
                  aria-label="Create profile"
                  title="Create profile"
                >
                  ＋
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <select
                value={hostProfileId}
                onChange={(e) => setHostProfileId(e.target.value)}
                className="input-field"
              >
                <option value="">Select a host profile (optional)</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.avatar ? `${profile.avatar} ` : ''}{profile.name} (@{profile.username})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="sessionName" className="block text-sm font-medium text-gray-600 mb-2.5">
              Session Name
            </label>
            <input
              id="sessionName"
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="input-field"
              placeholder="e.g., CS101 Study Group"
            />
          </div>

          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-600 mb-2.5">
              Course/Topic <span className="text-lavender-400">*</span>
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input-field"
              placeholder="e.g., Data Structures – Trees & Graphs"
              required
            />
            <p className="text-xs text-gray-400 mt-2 ml-1">This helps AI detect relevant conversations</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2.5">
              Players ({players.filter(p => p.trim() !== '').length}/6)
            </label>
            <div className="space-y-2.5">
              {players.map((player, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    value={player}
                    onChange={(e) => updatePlayer(index, e.target.value)}
                    className="input-field md:col-span-2"
                    placeholder={`Player ${index + 1} name`}
                  />
                  <select
                    value={playerProfiles[index] || ''}
                    onChange={(e) => updatePlayerProfile(index, e.target.value)}
                    className="input-field"
                  >
                    <option value="">Guest</option>
                    {profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.avatar ? `${profile.avatar} ` : ''}{profile.name}
                      </option>
                    ))}
                  </select>
                  {players.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      className="px-4 py-3 bg-beige-100 text-gray-600 rounded-xl hover:bg-beige-200 transition-all duration-200 text-sm font-medium border border-beige-200 md:col-span-3"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            {players.length < 6 && (
              <button
                type="button"
                onClick={addPlayer}
                className="mt-3 px-4 py-2.5 bg-lavender-50 text-lavender-500 rounded-xl hover:bg-lavender-100 transition-all duration-200 text-sm font-medium border border-lavender-200"
              >
                + Add Player
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full text-base py-3.5"
          >
            Start Study Session
          </button>
        </form>
      </div>
    </div>
  )
}
