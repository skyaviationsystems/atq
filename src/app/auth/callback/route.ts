import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export function safeRedirectPath(requestUrl: URL, candidate: string | null) {
    if (!candidate || !candidate.startsWith("/") || candidate.includes("\\") || /%5c/i.test(candidate)) return "/operations";

    try {
        const resolved = new URL(candidate, requestUrl.origin);
        if (resolved.origin !== requestUrl.origin) return "/operations";
        return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    } catch {
        return "/operations";
    }
}

export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const safeNext = safeRedirectPath(requestUrl, requestUrl.searchParams.get("next"));

    if (code) {
        const supabase = await createServerSupabaseClient();
        await supabase?.auth.exchangeCodeForSession(code);
    }

    return NextResponse.redirect(new URL(safeNext, requestUrl.origin));
}
