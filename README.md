# StudyGuard 🎓

A gamified group study application that encourages focused study sessions by detecting distractions using AI.

## Features

- 🎯 **Group Study Sessions**: Create study parties with 2-6 players
- 🎤 **Real-time Audio Analysis**: Records and transcribes conversations every 15 seconds
- 🤖 **AI Distraction Detection**: Uses Gemini AI to determine if conversations are on-topic
- ⚠️ **Focus Warnings**: Alerts the group when conversations drift off-topic
- 🎮 **Point System**: Tracks focus scores and distractions for each player
- ⏰ **Break Mode**: Track break time with automatic reminders after 10 minutes
- 🏆 **Leaderboard**: View session results with focus percentages and distraction counts

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS
- **Backend**: Next.js API Routes (serverless)
- **AI Services**:
  - ElevenLabs Scribe (Speech-to-Text)
  - Google Gemini (Conversation Analysis)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the root directory:

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

### 1. Create Study Session
- Enter session name, course/topic, and player names (2-6 players)
- No login required - frictionless setup

### 2. Start Session
- Click "Start Listening" to begin audio recording
- The app records audio in 15-second chunks
- Focus meter shows group focus level (green → yellow → red)

### 3. Conversation Analysis
- Every 15 seconds, audio is transcribed using ElevenLabs
- Transcript is analyzed by Gemini AI with the study topic
- AI classifies conversation as RELEVANT or DISTRACTION

### 4. Distraction Detection
- When distraction is detected:
  - Session pauses
  - Warning modal appears
  - Group manually attributes the distraction to a player
  - Points are deducted from the responsible player

### 5. Break Mode
- Click "Start Break" to pause study tracking
- Break timer runs automatically
- Reminder appears after 10 minutes

### 6. End Session
- View leaderboard with:
  - Focus percentages
  - Distraction counts
  - Total scores