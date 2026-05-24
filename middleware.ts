import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes the admin dashboard onto the `admin.<domain>` subdomain:
//  - admin.<domain>/        → /admin (dashboard)
//  - admin.<domain>/login   → /admin/login
//  - public <domain>/admin  → 404 in production (admin is subdomain-only)
//  - localhost/admin        → still works for local development
// Real authorization (admin allowlist) is re-checked in requireAdmin() — this is routing + UX.

function hostOf(request: NextRequest): string {
  return (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
}
function isAdminHost(host: string): boolean {
  return host.startsWith("admin.") || host === process.env.ADMIN_HOST?.toLowerCase();
}
function isLocalHost(host: string): boolean {
  return host === "localhost" || host.endsWith(".localhost") || host.startsWith("127.");
}

export async function middleware(request: NextRequest) {
  const host = hostOf(request);
  const adminHost = isAdminHost(host);
  const local = isLocalHost(host);
  const path = request.nextUrl.pathname;

  // Admin is reachable only via the admin subdomain. In local dev, redirect
  // localhost/admin/* → admin.localhost/* ; in production, hide it entirely (404).
  if (!adminHost && path.startsWith("/admin")) {
    if (local) {
      const target = new URL(request.url);
      target.host = `admin.${target.host}`;
      target.pathname = path.replace(/^\/admin/, "") || "/";
      return NextResponse.redirect(target);
    }
    return new NextResponse("Not Found", { status: 404 });
  }

  // On the admin subdomain, map clean URLs onto the /admin segment.
  let rewrite: URL | null = null;
  if (adminHost && !path.startsWith("/admin")) {
    rewrite = request.nextUrl.clone();
    rewrite.pathname = path === "/" ? "/admin" : `/admin${path}`;
  }

  const effectivePath = rewrite ? rewrite.pathname : path;

  // Anything outside the admin area: pass straight through (no auth work).
  if (!effectivePath.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Admin area → refresh the Supabase session, then gate.
  let response = rewrite ? NextResponse.rewrite(rewrite) : NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = rewrite ? NextResponse.rewrite(rewrite) : NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && effectivePath !== "/admin/login") {
    const url = request.nextUrl.clone();
    url.pathname = adminHost ? "/login" : "/admin/login";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // Run on everything except static assets (needed so the admin subdomain root is caught).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|css|js)$).*)"],
};
