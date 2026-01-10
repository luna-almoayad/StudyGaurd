'use client'

import { useState, useEffect } from 'react'

interface DistractionModalProps {
  players: string[]
  transcript: string
  onAttribution: (playerName: string | null) => void
}

export default function DistractionModal({ players, transcript, onAttribution }: DistractionModalProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  useEffect(() => {
    // Play warning sound or use ElevenLabs TTS here
    // For now, we'll just show the modal
  }, [])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card p-8 max-w-md w-full animate-pulse-once">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Focus Drift Detected</h2>
          <p className="text-gray-500 text-sm">
            Looks like the conversation drifted off-topic.
          </p>
        </div>

        {transcript && (
          <div className="bg-beige-50 rounded-xl p-4 mb-6 border border-beige-100">
            <p className="text-sm text-gray-600 italic leading-relaxed">"{transcript.substring(0, 100)}..."</p>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-3">
            Who caused the distraction?
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            {players.map((player) => (
              <button
                key={player}
                onClick={() => setSelectedPlayer(player)}
                className={`p-3.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm ${
                  selectedPlayer === player
                    ? 'border-focus-red bg-focus-red text-white shadow-soft'
                    : 'border-beige-200 bg-white text-gray-600 hover:border-lavender-200 hover:bg-lavender-50'
                }`}
              >
                {player}
              </button>
            ))}
            <button
              onClick={() => setSelectedPlayer('shared')}
              className={`p-3.5 rounded-xl border-2 transition-all duration-200 col-span-2 font-medium text-sm ${
                selectedPlayer === 'shared'
                  ? 'border-lavender-300 bg-lavender-200 text-gray-700 shadow-soft'
                  : 'border-beige-200 bg-white text-gray-600 hover:border-lavender-200 hover:bg-lavender-50'
              }`}
            >
              Shared Distraction
            </button>
          </div>
        </div>

        <button
          onClick={() => onAttribution(selectedPlayer === 'shared' ? null : selectedPlayer)}
          disabled={!selectedPlayer}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
        >
          Confirm & Resume
        </button>
      </div>
    </div>
  )
}

