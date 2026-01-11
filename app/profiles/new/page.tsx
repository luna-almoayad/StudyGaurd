"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const AVATARS = ["✨", "🌸", "🌟", "🎧", "📚", "🪴", "🧠", "⚡", "🎯", "🫶", "🐈", "🐻", "🦊", "🐼", "🦄"]

export default function NewProfilePage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [username, setUsername] = useState("")
  const [avatar, setAvatar] = useState(AVATARS[0])
  const [status, setStatus] = useState("")

  const isValid = useMemo(() => name.trim() && username.trim(), [name, username])

  const createProfile = async () => {
    if (!isValid) {
      setStatus("Enter name and username")
      return
    }
    setStatus("")
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), username: username.trim(), avatar }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus(data.error || "Could not create profile")
        return
      }
      localStorage.setItem("currentProfileId", data.profile.id)
      router.push("/account")
    } catch (error) {
      console.error("Profile create failed", error)
      setStatus("Could not create profile")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-lavender-50 to-beige-100 flex items-center justify-center p-4">
      <div className="card p-10 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800 mb-1">Create Profile</h1>
            <p className="text-sm text-gray-500">Pick a name, username, and avatar.</p>
          </div>
          <Link href="/" className="btn-secondary">
            Back
          </Link>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2.5">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2.5">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="Your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2.5">Avatar</label>
            <div className="grid grid-cols-5 gap-2.5">
              {AVATARS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAvatar(option)}
                  className={`p-3 rounded-xl border-2 text-xl transition-all ${
                    avatar === option
                      ? "border-lavender-300 bg-lavender-100 shadow-soft"
                      : "border-beige-200 bg-white hover:border-lavender-200 hover:bg-lavender-50"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {status && <div className="text-xs text-gray-500">{status}</div>}
          <button onClick={createProfile} className="btn-primary w-full" disabled={!isValid}>
            Create Profile
          </button>
        </div>
      </div>
    </div>
  )
}
