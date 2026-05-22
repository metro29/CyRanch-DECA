import { createServerClient } from "@supabase/ssr";
import { resolveUserHomePath } from "@/lib/navigation";
import { isBootstrapAdminEmail } from "@/lib/bootstrap-admins";
import { isAdminRole } from "@/lib/roles";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return NextResponse.next({ request });
  }

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const path = request.nextUrl.pathname;
    const isAuthRoute =
      path.startsWith("/login") || path.startsWith("/signup");
    const isUserRoute =
      path.startsWith("/apply") ||
      path.startsWith("/status") ||
      path.startsWith("/confirmation");
    const isMemberRoute =
      path.startsWith("/settings") || path.startsWith("/reports");
    const isDashboard = path.startsWith("/dashboard");
    const isAdminOnlyRoute =
      path.startsWith("/members") || path.startsWith("/dashboard");

    if (path.startsWith("/admin-access")) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/";
      return NextResponse.redirect(redirectUrl);
    }

    if (!user && (isUserRoute || isDashboard || isMemberRoute || isAdminOnlyRoute)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("redirect", path);
      return NextResponse.redirect(redirectUrl);
    }

    if (user) {
      const [{ data: profile }, { data: settings }, { data: application }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("role, status")
            .eq("id", user.id)
            .maybeSingle(),
          supabase
            .from("app_settings")
            .select("applications_open")
            .eq("id", 1)
            .maybeSingle(),
          supabase
            .from("applications")
            .select("status")
            .eq("user_id", user.id)
            .maybeSingle(),
        ]);

      const applicationsOpen = settings?.applications_open ?? false;

      if (profile?.status === "suspended" && path !== "/suspended") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/suspended";
        return NextResponse.redirect(redirectUrl);
      }

      const isAdmin =
        isAdminRole(profile?.role) || isBootstrapAdminEmail(user.email);

      if (isAdmin) {
        if (isUserRoute || path === "/confirmation") {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/dashboard";
          return NextResponse.redirect(redirectUrl);
        }
      } else {
        if (path.startsWith("/members")) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/";
          return NextResponse.redirect(redirectUrl);
        }

        if (isDashboard) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = resolveUserHomePath({
            role: profile?.role,
            applicationStatus: application?.status ?? null,
            applicationsOpen,
          });
          return NextResponse.redirect(redirectUrl);
        }

        if (path === "/confirmation") {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/status";
          return NextResponse.redirect(redirectUrl);
        }

        if (path.startsWith("/apply")) {
          const hasDraft = application?.status === "draft";
          const locked =
            application?.status && application.status !== "draft";

          if (locked) {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = "/status";
            return NextResponse.redirect(redirectUrl);
          }

          if (!applicationsOpen && !hasDraft) {
            const redirectUrl = request.nextUrl.clone();
            redirectUrl.pathname = "/";
            return NextResponse.redirect(redirectUrl);
          }
        }
      }

      if (user && isAuthRoute && profile?.status !== "suspended") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = resolveUserHomePath({
          role: profile?.role,
          applicationStatus: application?.status ?? null,
          applicationsOpen,
        });
        return NextResponse.redirect(redirectUrl);
      }
    }

    return supabaseResponse;
  } catch (err) {
    console.error("[middleware] Session error:", err);
    return NextResponse.next({ request });
  }
}
