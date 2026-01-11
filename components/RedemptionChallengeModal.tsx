'use client'

import { useEffect, useState } from 'react'

interface RedemptionChallengeModalProps {
  onResolve: (passed: boolean) => void
}

const normalizeAnswer = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default function RedemptionChallengeModal({ onResolve }: RedemptionChallengeModalProps) {
  const [answer, setAnswer] = useState('')
  const [words, setWords] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadWords = async () => {
      try {
        const res = await fetch('/api/redemption-words')
        if (!res.ok) throw new Error('Failed to load words')
        const data = await res.json()
        setWords(Array.isArray(data?.words) ? data.words : [])
      } catch (err) {
        console.error('Failed to load redemption words', err)
        setError('Challenge unavailable right now.')
      } finally {
        setIsLoading(false)
      }
    }

    loadWords()
  }, [])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const normalized = normalizeAnswer(answer)
    const passed =
      normalized.length > 0 &&
      words.some((word) => new RegExp(`\\b${escapeRegExp(word.toLowerCase())}\\b`).test(normalized))
    onResolve(passed)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card p-8 max-w-md w-full animate-pulse-once">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">!!</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Instant Redemption Challenge</h2>
          <p className="text-gray-500 text-sm">
            Name one key concept you are studying right now.
          </p>
        </div>

        {error ? (
          <div className="bg-beige-50 rounded-xl p-4 mb-6 border border-beige-100 text-sm text-gray-600">
            {error}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Type a key concept..."
              className="input-field"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              disabled={isLoading || answer.trim().length === 0}
            >
              Submit Answer
            </button>
          </form>
        )}

        {error && (
          <button
            type="button"
            onClick={() => onResolve(true)}
            className="btn-secondary w-full"
          >
            Resume Session
          </button>
        )}
      </div>
    </div>
  )
}
