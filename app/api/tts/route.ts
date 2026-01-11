import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 })
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID
    const apiKey = process.env.ELEVENLABS_API_KEY || ''

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing ElevenLabs API key' }, { status: 500 })
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_multilingual_v2',
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: 'Failed to synthesize speech', details: errorText },
        { status: 500 }
      )
    }

    const audioBuffer = await response.arrayBuffer()
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    })
  } catch (error) {
    console.error('Error in TTS route:', error)
    return NextResponse.json({ error: 'Failed to synthesize speech' }, { status: 500 })
  }
}
