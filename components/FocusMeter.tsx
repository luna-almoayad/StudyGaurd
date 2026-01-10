'use client'

interface FocusMeterProps {
  level: number
}

export default function FocusMeter({ level }: FocusMeterProps) {
  const getColor = () => {
    if (level >= 70) return 'bg-focus-green'
    if (level >= 40) return 'bg-focus-yellow'
    return 'bg-focus-red'
  }

  const getLabel = () => {
    if (level >= 70) return 'Focused'
    if (level >= 40) return 'Warning'
    return 'Distracted'
  }

  const getLabelColor = () => {
    if (level >= 70) return 'text-sage-200'
    if (level >= 40) return 'text-focus-yellow'
    return 'text-focus-red'
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className={`text-sm font-medium ${getLabelColor()}`}>{getLabel()}</span>
        <span className="text-lg font-semibold text-gray-700">{level}%</span>
      </div>
      <div className="w-full bg-beige-100 rounded-full h-10 overflow-hidden shadow-inner">
        <div
          className={`h-full ${getColor()} transition-all duration-700 ease-out flex items-center justify-center text-gray-700 text-sm font-medium rounded-full`}
          style={{ width: `${level}%` }}
        >
          {level > 20 && <span className="text-xs">{level}%</span>}
        </div>
      </div>
    </div>
  )
}

