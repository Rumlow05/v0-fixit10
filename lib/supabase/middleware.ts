import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  // For mock implementation, just pass through all requests
  return NextResponse.next({
    request,
  })
}
