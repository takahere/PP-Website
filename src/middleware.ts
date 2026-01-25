import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '@/lib/supabase/middleware'

// Staging basic auth password (set this env var to enable basic auth)
const STAGING_PASSWORD = process.env.STAGING_PASSWORD

// Protected routes that require authentication
const protectedRoutes = ['/admin', '/dashboard']

// Protected API routes that require authentication (return 401 instead of redirect)
const protectedApiRoutes = ['/api/analytics', '/api/ai-writer', '/api/canvas']

// Paths to exclude from redirect checks
const excludeFromRedirect = ['/admin', '/api', '/auth', '/_next', '/favicon.ico']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Basic auth for staging environment (when STAGING_PASSWORD is set)
  if (STAGING_PASSWORD) {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Staging Environment"',
        },
      })
    }

    const base64Credentials = authHeader.split(' ')[1]
    const credentials = atob(base64Credentials)
    const [, password] = credentials.split(':')

    if (password !== STAGING_PASSWORD) {
      return new NextResponse('Invalid credentials', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Staging Environment"',
        },
      })
    }
  }

  // Skip redirect check for excluded paths and static files
  const shouldCheckRedirect = !excludeFromRedirect.some((path) =>
    pathname.startsWith(path)
  )

  // Check for 301 redirects from database
  if (shouldCheckRedirect) {
    const redirect = await checkRedirect(request, pathname)
    if (redirect) {
      return NextResponse.redirect(new URL(redirect.to_path, request.url), {
        status: redirect.is_permanent ? 301 : 302,
      })
    }
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Check if the API route is protected
  const isProtectedApiRoute = protectedApiRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Update session and get user
  const { user, supabaseResponse } = await updateSession(request)

  // If accessing protected API route without authentication, return 401
  if (isProtectedApiRoute && !user) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    )
  }

  // If accessing protected route without authentication, redirect to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

// Check redirects table in Supabase
async function checkRedirect(
  request: NextRequest,
  pathname: string
): Promise<{ to_path: string; is_permanent: boolean } | null> {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll() {
            // No need to set cookies for redirect check
          },
        },
      }
    )

    // Normalize pathname (remove trailing slash except for root, decode URL-encoded characters)
    // Japanese tags like /lab/tag/パートナービジネス come URL-encoded from browser
    const normalizedPath = pathname === '/'
      ? '/'
      : decodeURIComponent(pathname.replace(/\/$/, ''))

    const { data, error } = await supabase
      .from('redirects')
      .select('to_path, is_permanent')
      .eq('from_path', normalizedPath)
      .single()

    if (error || !data) {
      return null
    }

    return data
  } catch {
    return null
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
