import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const { pathname } = req.nextUrl

  // Bloqueia se não estiver autenticado e acessar área restrita
  if (!token && (pathname.startsWith("/admin") || pathname.startsWith("/client"))) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Acesso à /admin só para agência
  if (pathname.startsWith("/admin") && token?.role !== "agency") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  // Acesso à /client só para cliente
  if (pathname.startsWith("/client") && token?.role !== "client") {
    return NextResponse.redirect(new URL("/unauthorized", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/client/:path*"]
}
