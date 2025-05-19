'use client'

import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="bg-[#D8FF4F] rounded-xl shadow-lg p-10 flex flex-col items-center max-w-lg w-full border-4 border-black">
        <h1 className="text-4xl font-extrabold mb-6 text-black tracking-tight text-center">
          Welcome to <span className="text-black">Roots Dashboard</span>
        </h1>
        <p className="mb-8 text-lg text-black text-center">
          Explore real estate analytics and insights.
        </p>
        <Link href="/dashboard">
          <button className="px-8 py-4 bg-black text-[#ffffff] font-bold rounded-lg shadow hover:bg-gray-900 transition text-xl border-2 border-black">
            Go to Dashboard
          </button>
        </Link>
      </div>
    </main>
  )
}
