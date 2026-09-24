import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/env";

/**
 * Keeps the Supabase session fresh: an expired access token is refreshed here and the new cookies
 * are written to both the request (for this render) and the response (for the browser).
 *
 * Not an authorisation check — requireStaff() in the admin layout and every server action is.
 * Runs only on /admin and /login, so public pages never touch cookies and stay static.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Triggers the refresh. Must run before anything else reads the session.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
