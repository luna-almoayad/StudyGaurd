import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import FormData from 'form-data'

// Initialize Gemini
const genAI = new GoogleGenerativeAI((process.env.GEMINI_API_KEY || '').trim())
const geminiModel = (process.env.GEMINI_MODEL || 'gemini-1.5-flash').trim()

export async function POST(request: NextRequest) {
  try {
    const { audio, topic } = await request.json()

    if (!audio || !topic) {
      return NextResponse.json(
        { error: 'Missing audio or topic' },
        { status: 400 }
      )
    }

    // Step 1: Transcribe audio using ElevenLabs
    const transcript = await transcribeAudio(audio)

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({
        transcript: '',
        isDistraction: false,
        confidence: 0,
      })
    }

    // Step 2: Analyze transcript with Gemini
    const analysis = await analyzeTranscript(transcript, topic)

    return NextResponse.json({
      transcript,
      isDistraction: analysis.isDistraction,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
    })
  } catch (error) {
    console.error('Error in analyze route:', error)
    return NextResponse.json(
      { error: 'Failed to analyze audio' },
      { status: 500 }
    )
  }
}

async function transcribeAudio(base64Audio: string): Promise<string> {
  try {
    // ElevenLabs Scribe Speech-to-Text API
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(base64Audio, 'base64')
    
    // Use form-data for multipart/form-data request
    const formData = new FormData()
    formData.append('file', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm',
    })
    formData.append('model_id', 'scribe_v1')

    // Use axios for better FormData handling in Node.js
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/speech-to-text',
      formData,
      {
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          ...formData.getHeaders(),
        },
      }
    )

    // Adjust this based on actual ElevenLabs API response structure
    // Common response formats: { text: "..." } or { transcript: "..." }
    return response.data.text || response.data.transcript || response.data.result?.text || ''
  } catch (error: any) {
    console.error('Error transcribing audio:', error.response?.data || error.message)
    
    // Fallback: Return empty transcript if API fails
    // You may need to adjust the API endpoint/format based on ElevenLabs documentation
    // Check: https://elevenlabs.io/docs/api-reference/speech-to-text
    return ''
  }
}

async function analyzeTranscript(
  transcript: string,
  topic: string
): Promise<{
  isDistraction: boolean
  confidence: number
  reasoning: string
}> {
  try {
    const model = genAI.getGenerativeModel({ model: geminiModel })

    const prompt = `You are analyzing study conversations.

Course topic: "${topic}"

Transcript:
"${transcript}"

Classify the conversation as either:
RELEVANT or DISTRACTION

Only respond with one word: either "RELEVANT" or "DISTRACTION".`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text().trim().toUpperCase()

    const isDistraction = text === 'DISTRACTION'
    
    // Simple confidence scoring (can be enhanced)
    const confidence = isDistraction ? 0.8 : 0.9

    return {
      isDistraction,
      confidence,
      reasoning: text,
    }
  } catch (error) {
    console.error('Error analyzing transcript:', error)
    // Default to not a distraction if analysis fails
    return {
      isDistraction: false,
      confidence: 0.5,
      reasoning: 'Analysis failed',
    }
  }
}
