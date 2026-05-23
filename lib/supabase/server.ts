import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client for the SERVER (reads the auth session from cookies).
// Used only for authentication — all data access still goes through Prisma.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component (can't set cookies) — middleware refreshes the session.
          }
        },
      },
    },
  );
}
