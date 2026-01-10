import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'StudyGuard - Focus Together',
  description: 'Group study sessions with distraction detection',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}

