"use client"

import { Suspense } from "react"
import App from "../App"

export default function Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <App />
    </Suspense>
  )
}
