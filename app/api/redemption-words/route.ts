import { NextResponse } from 'next/server'

const REDEMPTION_WORDS = [
  'algebra',
  'array',
  'calculua',
  'complexity',
  'data',
  'graph',
  'hash',
  'recursion',
  'discrete',
  'tree',
]

export async function GET() {
  return NextResponse.json({ words: REDEMPTION_WORDS })
}
