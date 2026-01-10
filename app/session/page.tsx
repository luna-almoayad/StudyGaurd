'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DistractionModal from '@/components/DistractionModal'
import FocusMeter from '@/components/FocusMeter'
import BreakModal from '@/components/BreakModal'

interface Player {
  name: string
  points: number
  distractions: number
}

interface SessionData {
  sessionName: string
  topic: string
  players: string[]
  startTime: number
}

export default function SessionPage() {
  const router = useRouter()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isOnBreak, setIsOnBreak] = useState(false)
  const [breakStartTime, setBreakStartTime] = useState<number | null>(null)
  const [breakDuration, setBreakDuration] = useState(0)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [focusLevel, setFocusLevel] = useState(100)
  const [showDistractionModal, setShowDistractionModal] = useState(false)
  const [showBreakModal, setShowBreakModal] = useState(false)
  const [lastTranscript, setLastTranscript] = useState('')
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Load session data
    const stored = localStorage.getItem('studySession')
    if (!stored) {
      router.push('/')
      return
    }

    const data: SessionData = JSON.parse(stored)
    setSessionData(data)
    
    // Initialize players with 100 points each
    const initialPlayers: Player[] = data.players.map(name => ({
      name,
      points: 100,
      distractions: 0,
    }))
    setPlayers(initialPlayers)

    // Start timer
    timerIntervalRef.current = setInterval(() => {
      if (!isPaused && !isOnBreak) {
        setElapsedTime(prev => prev + 1)
      }
    }, 1000)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
      }
      stopRecording()
    }
  }, [router, isPaused, isOnBreak])

  useEffect(() => {
    // Break timer - updates every second when on break
    if (!isOnBreak || !breakStartTime) {
      setBreakDuration(0)
      return
    }

    const breakCheckInterval = setInterval(() => {
      const duration = Math.floor((Date.now() - breakStartTime) / 1000)
      setBreakDuration(duration)
      if (duration >= 600) { // 10 minutes (600 seconds)
        setShowBreakModal(true)
        clearInterval(breakCheckInterval)
      }
    }, 1000)

    return () => clearInterval(breakCheckInterval)
  }, [isOnBreak, breakStartTime])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await analyzeAudio(audioBlob)
        audioChunksRef.current = []
      }

      // Record in chunks every 15 seconds
      mediaRecorder.start()
      setIsRecording(true)

      analysisIntervalRef.current = setInterval(() => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop()
          mediaRecorder.start()
        }
      }, 15000) // 15 seconds
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please grant permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
    }
    setIsRecording(false)
  }

  const analyzeAudio = async (audioBlob: Blob) => {
    if (isPaused || isOnBreak || !sessionData) return

    try {
      // Convert blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)
      const base64Audio = btoa(
        String.fromCharCode.apply(null, Array.from(uint8Array))
      )

      // Call API to transcribe and analyze
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          topic: sessionData.topic,
        }),
      })

      const result = await response.json()
      
      if (result.isDistraction) {
        handleDistraction(result.transcript)
      } else {
        // Positive reinforcement - slight focus increase
        setFocusLevel(prev => Math.min(100, prev + 2))
      }
    } catch (error) {
      console.error('Error analyzing audio:', error)
    }
  }

  const handleDistraction = (transcript: string) => {
    setLastTranscript(transcript)
    setIsPaused(true)
    setShowDistractionModal(true)
    setFocusLevel(prev => Math.max(0, prev - 15))
    stopRecording()
  }

  const handleAttribution = (playerName: string | null) => {
    if (playerName) {
      setPlayers(prev =>
        prev.map(p =>
          p.name === playerName
            ? { ...p, points: Math.max(0, p.points - 10), distractions: p.distractions + 1 }
            : p
        )
      )
    }
    
    setShowDistractionModal(false)
    setIsPaused(false)
    setTimeout(() => {
      startRecording()
    }, 1000)
  }

  const handleStartBreak = () => {
    setIsOnBreak(true)
    setIsPaused(true)
    setBreakStartTime(Date.now())
    stopRecording()
  }

  const handleEndBreak = () => {
    setIsOnBreak(false)
    setIsPaused(false)
    setBreakStartTime(null)
    setShowBreakModal(false)
    setTimeout(() => {
      startRecording()
    }, 1000)
  }

  const handleEndSession = () => {
    stopRecording()
    const finalData = {
      sessionData,
      players,
      duration: elapsedTime,
    }
    localStorage.setItem('sessionResults', JSON.stringify(finalData))
    router.push('/leaderboard')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!sessionData) {
    return <div className="min-h-screen flex items-center justify-center bg-beige-50">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-lavender-50 to-beige-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800 mb-1">{sessionData.sessionName}</h1>
              <p className="text-gray-500 text-sm">Topic: {sessionData.topic}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-light text-gray-700 font-mono tracking-tight">
                {formatTime(elapsedTime)}
              </div>
              <div className="text-xs text-gray-400 mt-1 uppercase tracking-wide">Study Time</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Focus Meter */}
          <div className="lg:col-span-2">
            <div className="card p-8">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Focus Meter</h2>
              <FocusMeter level={focusLevel} />
              
              <div className="mt-8 flex gap-3">
                {!isRecording && !isPaused && (
                  <button
                    onClick={startRecording}
                    className="flex-1 btn-primary"
                  >
                    Start Listening
                  </button>
                )}
                
                {isRecording && (
                  <div className="flex-1 bg-sage-200 text-gray-700 py-3.5 rounded-xl font-medium text-center flex items-center justify-center gap-2.5 shadow-soft">
                    <span className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-pulse"></span>
                    Recording...
                  </div>
                )}

                {isPaused && !isOnBreak && (
                  <div className="flex-1 bg-focus-yellow text-gray-700 py-3.5 rounded-xl font-medium text-center shadow-soft">
                    Paused
                  </div>
                )}

                {isOnBreak && (
                  <div className="flex-1 bg-lavender-200 text-gray-700 py-3.5 rounded-xl font-medium text-center shadow-soft">
                    On Break ({formatTime(breakDuration)})
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                {!isOnBreak && (
                  <button
                    onClick={handleStartBreak}
                    disabled={isPaused}
                    className="flex-1 px-4 py-2.5 bg-lavender-100 text-lavender-600 rounded-xl font-medium hover:bg-lavender-200 transition-all duration-200 border border-lavender-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Start Break
                  </button>
                )}
                
                {isOnBreak && (
                  <button
                    onClick={handleEndBreak}
                    className="flex-1 btn-primary"
                  >
                    End Break
                  </button>
                )}

                <button
                  onClick={handleEndSession}
                  className="flex-1 px-4 py-2.5 bg-focus-red text-white rounded-xl font-medium hover:bg-opacity-90 transition-all duration-200 shadow-soft"
                >
                  End Session
                </button>
              </div>
            </div>
          </div>

          {/* Player Scores */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Group Score</h2>
            <div className="space-y-3">
              {players
                .sort((a, b) => b.points - a.points)
                .map((player, index) => (
                  <div
                    key={player.name}
                    className="p-4 bg-beige-50 rounded-xl border border-beige-100 hover:border-lavender-200 hover:shadow-soft transition-all duration-200"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-800 mb-1">{player.name}</div>
                        <div className="text-xs text-gray-500">
                          {player.distractions} distraction{player.distractions !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="text-2xl font-light text-lavender-400">{player.points}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {showDistractionModal && (
        <DistractionModal
          players={players.map(p => p.name)}
          transcript={lastTranscript}
          onAttribution={handleAttribution}
        />
      )}

      {showBreakModal && (
        <BreakModal onEndBreak={handleEndBreak} />
      )}
    </div>
  )
}

