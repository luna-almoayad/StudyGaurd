'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DistractionModal from '@/components/DistractionModal'
import RedemptionChallengeModal from '@/components/RedemptionChallengeModal'
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
  participants?: { name: string; profileId?: string | null }[]
  hostProfileId?: string | null
  startTime: number
}

export default function SessionPage() {
  const router = useRouter()
  const [isDistracted, setIsDistracted] = useState<'idle' | 'walk' | 'zoom' | 'UNKNOWN'>('UNKNOWN')
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
  const [showRedemptionModal, setShowRedemptionModal] = useState(false)
  const [lastTranscript, setLastTranscript] = useState('')
  const [topicStatus, setTopicStatus] = useState<'ON_TOPIC' | 'OFF_TOPIC' | 'NO_SPEECH' | 'UNKNOWN'>('UNKNOWN')
  const [recentTranscripts, setRecentTranscripts] = useState<
    { text: string; time: string }[]
  >([])
  const [pendingAttribution, setPendingAttribution] = useState<string[]>([])
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)
  const isPausedRef = useRef(isPaused)
  const isOnBreakRef = useRef(isOnBreak)
  const sessionDataRef = useRef<SessionData | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const analysisIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const initialChunkTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const watchdogRef = useRef<NodeJS.Timeout | null>(null)
  const chunkTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastChunkAtRef = useRef<number>(Date.now())
  const isRestartingRef = useRef(false)
  const isRecordingRef = useRef(false)
  const nextChunkMsRef = useRef(0)
  const isHandlingDistractionRef = useRef(false)
  const lastDistractionAtRef = useRef(0)
  const lastSpeakAtRef = useRef(0)
  const analysisInFlightRef = useRef(false)
  const CHUNK_MS = 20000
  const RESUME_CHUNK_MS = 20000

  useEffect(() => {
    // Load session data
    const stored = localStorage.getItem('studySession')
    if (!stored) {
      router.push('/')
      return
    }

    const data: SessionData = JSON.parse(stored)
    setSessionData(data)
    sessionDataRef.current = data
    
    // Initialize players with 100 points each
    const initialPlayers: Player[] = data.players.map(name => ({
      name,
      points: 100,
      distractions: 0,
    }))
    setPlayers(initialPlayers)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current)
      }
      if (initialChunkTimeoutRef.current) {
        clearTimeout(initialChunkTimeoutRef.current)
      }
      if (chunkTimerRef.current) {
        clearTimeout(chunkTimerRef.current)
        chunkTimerRef.current = null
      }
      if (watchdogRef.current) {
        clearInterval(watchdogRef.current)
      }
      stopRecording()
    }
  }, [router])

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    isOnBreakRef.current = isOnBreak
  }, [isOnBreak])

  useEffect(() => {
    sessionDataRef.current = sessionData
  }, [sessionData])

  useEffect(() => {
    if (!isRecording || isPaused || isOnBreak) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      if (chunkTimerRef.current) {
        clearTimeout(chunkTimerRef.current)
        chunkTimerRef.current = null
      }
      if (watchdogRef.current) {
        clearInterval(watchdogRef.current)
        watchdogRef.current = null
      }
      return
    }

    timerIntervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    watchdogRef.current = setInterval(() => {
      const gapMs = Date.now() - lastChunkAtRef.current
      if (gapMs > CHUNK_MS + 5000 && !isRestartingRef.current) {
        isRestartingRef.current = true
        stopRecording()
        setTimeout(() => {
          startRecording({ useShortChunk: true }).finally(() => {
            isRestartingRef.current = false
          })
        }, 200)
      }
    }, 5000)

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
      if (watchdogRef.current) {
        clearInterval(watchdogRef.current)
        watchdogRef.current = null
      }
    }
  }, [isRecording, isPaused, isOnBreak])

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

  const startRecording = async (options?: { useShortChunk?: boolean }) => {
    try {
      if (isRecordingRef.current) return
      isRecordingRef.current = true
      setIsDistracted('walk')
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setTopicStatus('UNKNOWN')

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        lastChunkAtRef.current = Date.now()
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await analyzeAudio(audioBlob)
        audioChunksRef.current = []
        if (!isRecordingRef.current || isPausedRef.current || isOnBreakRef.current) return
        mediaRecorder.start()
        nextChunkMsRef.current = CHUNK_MS
        scheduleNextStop(nextChunkMsRef.current)
      }

      mediaRecorder.start()
      setIsRecording(true)

      const useShortChunk = options?.useShortChunk === true
      nextChunkMsRef.current = useShortChunk ? RESUME_CHUNK_MS : CHUNK_MS
      scheduleNextStop(nextChunkMsRef.current)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please grant permissions.')
    }
  }

  const stopRecording = () => {
    isRecordingRef.current = false
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current)
    }
    if (initialChunkTimeoutRef.current) {
      clearTimeout(initialChunkTimeoutRef.current)
    }
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current)
      chunkTimerRef.current = null
    }
    if (watchdogRef.current) {
      clearInterval(watchdogRef.current)
      watchdogRef.current = null
    }
    setIsRecording(false)
    setIsDistracted('idle')
    setTopicStatus('UNKNOWN')
  }

  const scheduleNextStop = (delayMs: number) => {
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current)
    }
    chunkTimerRef.current = setTimeout(() => {
      const recorder = mediaRecorderRef.current
      if (recorder && recorder.state === 'recording') {
        recorder.stop()
      }
    }, delayMs)
  }

  const handleStopListening = () => {
    stopRecording()
    setIsPaused(false)
  }

  const analyzeAudio = async (audioBlob: Blob) => {
    if (isPausedRef.current || isOnBreakRef.current || !sessionDataRef.current) return
    if (analysisInFlightRef.current) return
    analysisInFlightRef.current = true

    try {
      // Convert blob to base64 without blowing the call stack
      const base64Audio = await blobToBase64(audioBlob)

      // Call API to transcribe and analyze
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          topic: sessionDataRef.current?.topic,
        }),
      })

      const result = await response.json()
      const transcriptText = result?.transcript?.trim() || ''

      if (transcriptText) {
        setRecentTranscripts(prev =>
          [{ text: transcriptText, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50)
        )
      }

      if (!transcriptText) {
        setTopicStatus('NO_SPEECH')
      } else if (result.isDistraction) {
        setTopicStatus('OFF_TOPIC')
        handleDistraction(transcriptText)
      } else {
        setTopicStatus('ON_TOPIC')
        // Positive reinforcement - slight focus increase
        setFocusLevel(prev => Math.min(100, prev + 2))
      }
    } catch (error) {
      console.error('Error analyzing audio:', error)
      setTopicStatus('UNKNOWN')
    } finally {
      analysisInFlightRef.current = false
    }
  }

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = () => reject(new Error('Failed to read audio blob'))
      reader.onloadend = () => {
        const result = reader.result
        if (typeof result !== 'string') {
          reject(new Error('Unexpected FileReader result'))
          return
        }
        const base64 = result.split(',')[1] || ''
        resolve(base64)
      }
      reader.readAsDataURL(blob)
    })
  }

  const handleDistraction = (transcript: string) => {
    const now = Date.now()
    if (isHandlingDistractionRef.current || now - lastDistractionAtRef.current < 3000) {
      return
    }
    isHandlingDistractionRef.current = true
    lastDistractionAtRef.current = now
    setIsDistracted('zoom')
    setLastTranscript(transcript)
    setIsPaused(true)
    setShowDistractionModal(true)
    setFocusLevel(prev => Math.max(0, prev - 15))
    stopRecording()
    if (sessionData?.topic) {
      speak(`Quick reset. Let's get back to the topic: ${sessionData.topic}`)
    }
  }

  const applyPenalty = (playerNames: string[]) => {
    if (playerNames.length === 0) return
    const selected = new Set(playerNames)
    setPlayers(prev =>
      prev.map(p =>
        selected.has(p.name)
          ? { ...p, points: Math.max(0, p.points - 10), distractions: p.distractions + 1 }
          : p
      )
    )
  }

  const resumeAfterDistraction = () => {
    setShowDistractionModal(false)
    setShowRedemptionModal(false)
    setIsPaused(false)
    setIsDistracted(false)
    isHandlingDistractionRef.current = false
    if (!isOnBreak) {
      startRecording({ useShortChunk: true })
    }
  }

  const handleAttribution = (playerNames: string[]) => {
    if (playerNames.length === 0) return

    const isShared = playerNames.length === players.length && players.length > 0
    if (isShared) {
      setPendingAttribution(playerNames)
      setShowDistractionModal(false)
      setShowRedemptionModal(true)
      return
    }

    applyPenalty(playerNames)
    resumeAfterDistraction()
  }

  const handleRedemptionResult = (passed: boolean) => {
    if (!passed) {
      applyPenalty(pendingAttribution)
    }
    setPendingAttribution([])
    resumeAfterDistraction()
  }

  const handleStartBreak = () => {
    setIsOnBreak(true)
    setIsDistracted('idle')
    setIsPaused(true)
    setBreakStartTime(Date.now())
    stopRecording()
  }

  const handleEndBreak = () => {
    setIsOnBreak(false)
    setIsDistracted('walk')
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
    persistSession(finalData).catch((error) =>
      console.error('Failed to save session', error)
    )
    router.push('/leaderboard')
  }

  const persistSession = async (finalData: {
    sessionData: SessionData | null
    players: Player[]
    duration: number
  }) => {
    if (!finalData.sessionData) return

    const participants: { name: string; profileId?: string | null }[] =
      finalData.sessionData.participants ||
      finalData.sessionData.players.map((name) => ({ name }))

    const results = finalData.players.map((player, index) => {
      const matched = participants[index]
      return {
        name: player.name,
        profileId: matched?.profileId || null,
        points: player.points,
        distractions: player.distractions,
      }
    })

    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionName: finalData.sessionData.sessionName,
        topic: finalData.sessionData.topic,
        hostProfileId: finalData.sessionData.hostProfileId || null,
        participants,
        results,
        duration: finalData.duration,
        startedAt: finalData.sessionData.startTime,
        endedAt: Date.now(),
      }),
    })
  }

  const speak = async (text: string) => {
    try {
      const now = Date.now()
      if (now - lastSpeakAtRef.current < 3000) return
      lastSpeakAtRef.current = now
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      if (!response.ok) {
        console.error('TTS failed:', await response.text())
        return
      }

      const audioBlob = await response.blob()
      const url = URL.createObjectURL(audioBlob)
      const audio = new Audio(url)
      activeAudioRef.current?.pause()
      activeAudioRef.current = audio
      audio.play().finally(() => {
        setTimeout(() => URL.revokeObjectURL(url), 5000)
      })
    } catch (error) {
      console.error('Error playing TTS:', error)
    }
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
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Focus Meter</h2>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${
                    topicStatus === 'ON_TOPIC'
                      ? 'bg-focus-green text-white'
                      : topicStatus === 'OFF_TOPIC'
                      ? 'bg-focus-red text-white'
                      : topicStatus === 'NO_SPEECH'
                      ? 'bg-beige-200 text-gray-700'
                      : 'bg-lavender-100 text-lavender-700'
                  }`}
                >
                  {topicStatus === 'ON_TOPIC'
                    ? 'On topic'
                    : topicStatus === 'OFF_TOPIC'
                    ? 'Off topic'
                    : topicStatus === 'NO_SPEECH'
                    ? 'No speech'
                    : 'Analyzing'}
                </span>
              </div>
              <FocusMeter level={focusLevel} />
              
              <div className="mt-8 flex gap-3">
                {!isRecording && !isOnBreak && (
                  <button
                    onClick={() => {
                      setIsPaused(false)
                      setIsDistracted('walk')
                      startRecording()
                    }}
                    className="flex-1 btn-primary"
                  >
                    {isPaused ? 'Resume Listening' : 'Start Listening'}
                  </button>
                )}
                
                {isRecording && (
                  <>
                    <div className="flex-1 bg-sage-200 text-gray-700 py-3.5 rounded-xl font-medium text-center flex items-center justify-center gap-2.5 shadow-soft">
                      <span className="w-2.5 h-2.5 bg-gray-600 rounded-full animate-pulse"></span>
                      Recording...
                    </div>
                    <button
                      onClick={handleStopListening}
                      className="px-4 py-3 bg-beige-100 text-gray-700 rounded-xl font-medium hover:bg-beige-200 transition-all duration-200 border border-beige-200 shadow-soft"
                    >
                      Stop Listening
                    </button>
                  </>
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

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Transcript Log</h3>
                <div className="bg-beige-50 border border-beige-100 rounded-xl p-4 h-40 overflow-y-auto text-sm text-gray-700">
                  {recentTranscripts.length === 0 ? (
                    <div className="text-gray-400">No transcripts yet.</div>
                  ) : (
                    recentTranscripts.map((entry, index) => (
                      <div key={`${entry.time}-${index}`} className="mb-3 last:mb-0">
                        <div className="text-xs text-gray-400 mb-1">{entry.time}</div>
                        <div>{entry.text}</div>
                      </div>
                    ))
                  )}
                </div>
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

      {showRedemptionModal && (
        <RedemptionChallengeModal onResolve={handleRedemptionResult} />
      )}

      {showBreakModal && (
        <BreakModal onEndBreak={handleEndBreak} />
      )}

       {isDistracted === "walk" && (
          <div className="walker-track">
            <img src="/plant.gif" className="walker-sprite" />
          </div>
        )}

        {isDistracted === "zoom" && (
          <div className="walker-idle-center">
            <img src="/plant_idle.png" className="walker-idle-sprite" />
          </div>
        )}

        {isDistracted === "idle" && (
          <img
            src="/plant_idle.png"
            alt="idle"
            style={{
              position: "absolute",
              top: "35px",
              left: "190px",
              width: "50px",
              height: "auto",
              zIndex: 99999,
            }}
            />
        )}
    </div>
  )
}
