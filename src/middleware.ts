import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to protect admin routes and API access

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // 1. Admin Route Protection
    if (path.startsWith('/adminaaids/dashboard')) {
        const token = request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.redirect(new URL('/adminaaids', request.url));
        }
    }

    // 2. API Protection (Referer Check)
    const referer = request.headers.get('referer');
    if (path.startsWith('/api/live-score') || path.startsWith('/api/events')) {
        if (process.env.NODE_ENV === 'production') {
            const allowed = referer?.includes('ids-sports') || referer?.includes('vercel.app') || referer?.includes('ishangadineth.online');
            if (!allowed) {
                return new NextResponse(JSON.stringify({ message: 'Unauthorized source: ' + referer }), { status: 403 });
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/adminaaids/dashboard/:path*', '/api/:path*'],
};
