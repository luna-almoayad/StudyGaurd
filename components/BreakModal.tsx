'use client'

interface BreakModalProps {
  onEndBreak: () => void
}

export default function BreakModal({ onEndBreak }: BreakModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">⏰</div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Break Time's Up!</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Your 10-minute break has ended. Time to get back to studying!
          </p>
        </div>

        <button
          onClick={onEndBreak}
          className="btn-primary w-full"
        >
          Resume Study Session
        </button>
      </div>
    </div>
  )
}

