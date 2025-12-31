import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
    const session = await auth();
    const { pathname } = request.nextUrl;

    // Public routes that don't require authentication
    const publicRoutes = ["/login", "/register", "/api/register", "/api/auth"];

    // Check if current path is public
    const isPublicRoute = publicRoutes.some(route =>
        pathname.startsWith(route)
    );

    // If not authenticated and trying to access protected route
    if (!session && !isPublicRoute) {
        const loginUrl = new URL("/login", request.url);
        return NextResponse.redirect(loginUrl);
    }

    // If authenticated and trying to access login/register
    if (session && (pathname === "/login" || pathname === "/register")) {
        const homeUrl = new URL("/", request.url);
        return NextResponse.redirect(homeUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (icons, manifest, etc)
         */
        "/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|workbox-*).*)",
    ],
};
