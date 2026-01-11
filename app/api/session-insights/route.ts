import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI((process.env.GEMINI_API_KEY || '').trim())
const geminiModel = (process.env.GEMINI_MODEL || 'gemini-1.5-flash').trim()

export async function POST(request: NextRequest) {
  try {
    const { sessionName, topic, durationMinutes, totalDistractions, avgPoints, topPerformer } =
      await request.json()

    if (!topic || durationMinutes == null || totalDistractions == null || avgPoints == null) {
      return NextResponse.json({ error: 'Missing session stats' }, { status: 400 })
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        insight:
          'Session insights are unavailable right now. Add GEMINI_API_KEY to enable AI takeaways.',
      })
    }

    const model = genAI.getGenerativeModel({ model: geminiModel })

    const prompt = `You are a study coach. Provide 1-2 concise sentence of actionable insight for a group study session.
Use the stats to suggest one improvement or reinforcement for future sessions. Be specific, short and encouraging.

Session: ${sessionName || 'Unnamed session'}
Topic: ${topic}
Duration (minutes): ${durationMinutes}
Total distractions: ${totalDistractions}
Average points: ${avgPoints}
Top performer: ${topPerformer || 'N/A'}

Output: plain text only, no bullet points.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const insight = response.text().trim()

    return NextResponse.json({ insight })
  } catch (error) {
    console.error('Error generating session insights:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
