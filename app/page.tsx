'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [sessionName, setSessionName] = useState('')
  const [topic, setTopic] = useState('')
  const [players, setPlayers] = useState<string[]>([''])
  const [error, setError] = useState('')

  const addPlayer = () => {
    if (players.length < 6) {
      setPlayers([...players, ''])
    }
  }

  const removePlayer = (index: number) => {
    if (players.length > 1) {
      setPlayers(players.filter((_, i) => i !== index))
    }
  }

  const updatePlayer = (index: number, value: string) => {
    const newPlayers = [...players]
    newPlayers[index] = value
    setPlayers(newPlayers)
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

    // Store session data and navigate
    const sessionData = {
      sessionName: sessionName.trim(),
      topic: topic.trim(),
      players: validPlayers,
      startTime: Date.now(),
    }
    
    localStorage.setItem('studySession', JSON.stringify(sessionData))
    router.push('/session')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-lavender-50 to-beige-100 flex items-center justify-center p-4">
      <div className="card p-10 w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-light text-gray-800 mb-3 tracking-tight">
            Study<span className="font-semibold text-lavender-400">Guard</span>
          </h1>
          <p className="text-gray-500 text-lg">Create your study party</p>
        </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <div key={index} className="flex gap-2.5">
                  <input
                    type="text"
                    value={player}
                    onChange={(e) => updatePlayer(index, e.target.value)}
                    className="input-field flex-1"
                    placeholder={`Player ${index + 1} name`}
                  />
                  {players.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlayer(index)}
                      className="px-4 py-3 bg-beige-100 text-gray-600 rounded-xl hover:bg-beige-200 transition-all duration-200 text-sm font-medium border border-beige-200"
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

