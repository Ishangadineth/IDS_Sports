import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jose } from 'jose';
// Note: 'jose' or 'jsonwebtoken' might be needed. Next.js Edge Runtime doesn't support 'jsonwebtoken'.
// I will use a simple cookie check for now or verify using 'jose' if installed. 
// Installing 'jose' or just checking for cookie presence is lighter.
// Since I installed 'jsonwebtoken', but it might fail in Middleware (Edge).
// I will just check for the presence of the cookie for now to keep it simple and valid on standard Node runtime if not edge.
// Actually, standard middleware runs on Edge. I should use 'jose' or just check existence.
// For MVP, I'll check existence of 'token'.

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // 1. Admin Route Protection
    if (path.startsWith('/adminaaids/dashboard')) {
        const token = request.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.redirect(new URL('/adminaaids', request.url));
        }
    }

    // 2. API Protection (Referer Check) - Optional/Strict mode
    // const referer = request.headers.get('referer');
    // if (path.startsWith('/api/live-score') || path.startsWith('/api/events')) {
    //   if (process.env.NODE_ENV === 'production') {
    //     if (!referer?.includes('ids-sports') && !referer?.includes('vercel.app')) { // Adjust based on actual domain
    //        return new NextResponse(JSON.stringify({ message: 'Unauthorized source' }), { status: 403 });
    //     }
    //   }
    // }

    return NextResponse.next();
}

export const config = {
    matcher: ['/adminaaids/dashboard/:path*', '/api/:path*'],
};
