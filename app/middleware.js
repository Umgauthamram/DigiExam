import { NextResponse } from 'next/server';
// import { jwtVerify } from 'jose';

// We use 'jose' for middleware because 'jsonwebtoken' runs on Node.js runtime 
// which is not fully supported in Edge Middleware.
// However, since we are using Node.js runtime for API, we stick to standard patterns.
// Actually, Next.js middleware runs in Edge. 'jsonwebtoken' might fail.
// So we'll decode manually or use a simple check if we don't want to import jose.
// Let's stick to reading the cookie and basic redirect for now.
// For robust verification in middleware, 'jose' is recommended.
// I will assuming 'jose' is not installed, but I should probably install it or use a lightweight approach.
// Alternatively, since I already installed 'jsonwebtoken', I can try to use it if I switch middleware to NodeJS runtime (not recommended for performance).
// Let's try to do a basic check: presence of token. For security, real validation happens in API/Server Actions.
// BUT, to redirect /admin vs /user, we need to know the role.
// Let's use 'jose' (it's standard for Next.js middleware). 
// Wait, I didn't install 'jose'. I'll proceed without it for now and just check for token existence 
// OR I can quickly install it.
// Better plan: I'll use a simple decode if possible or just rely on 'jsonwebtoken' but careful about runtime.
// Actually, 'jsonwebtoken' usually throws error in Edge.
// Let's rely on logic:
// If /admin/* -> check if cookie 'token' exists. 
// Ideally we need to read the role.
// I'll install 'jose' quickly to do this right. 
// WAIT, I cannot install checks without user permission easily (although I can run safe commands).
// I'll use a simpler approach: Just check if token exists. 
// AND I'll expose the user role in a non-httpOnly cookie for the client/middleware to read easily? No, insecure.
// Let's try to interpret the token payload without verification (base64 decode) just for redirection.
// Verification still happens on the server components/API.

export async function middleware(request) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    const publicPaths = ['/login', '/access-denied', '/_next', '/favicon.ico'];

    // Allow public paths
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    // Redirect to login if no token
    if (!token) {
        // If trying to access protected route
        if (pathname.startsWith('/admin') || pathname.startsWith('/user')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    } else {
        // Basic decoding to check role (Not verification, just routing)
        try {
            // JWT is header.payload.signature
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);
            const role = payload.role;

            // Admin trying to access user dashboard?
            // Actually admins might want to see user stuff, but usually seperated.
            // Definite rule: Users cannot access /admin
            if (pathname.startsWith('/admin') && role !== 'admin') {
                return NextResponse.redirect(new URL('/access-denied', request.url));
            }

            // If user is already logged in and tries to go to /login, redirect to dashboard
            if (pathname === '/login') {
                if (role === 'admin') {
                    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
                } else {
                    return NextResponse.redirect(new URL('/user/dashboard', request.url));
                }
            }

        } catch (e) {
            // If token is invalid/corrupt, clear it and redirect to login
            // We can't clear cookie easily in middleware response of redirect, 
            // but we can just redirect to login which will likely overwrite or fail logic.
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/user/:path*', '/login'],
};
