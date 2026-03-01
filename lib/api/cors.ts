import { NextResponse } from "next/server"

/**
 * CORS headers for API routes
 * Allows cross-origin requests from any domain
 * For production, you may want to restrict this to specific domains
 */
export function getCorsHeaders(origin?: string | null) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400", // 24 hours
  }
}

/**
 * Handle OPTIONS request for CORS preflight
 */
export function handleCorsPreflight(request: Request) {
  const origin = request.headers.get("origin")
  return NextResponse.json({}, { headers: getCorsHeaders(origin) })
}

/**
 * Add CORS headers to a NextResponse
 */
export function addCorsHeaders(
  response: NextResponse,
  request?: Request
): NextResponse {
  const origin = request?.headers.get("origin")
  const corsHeaders = getCorsHeaders(origin)
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}
