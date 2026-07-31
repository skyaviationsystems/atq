import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "@/lib/platform/backend-config";

export async function createServerSupabaseClient() {
    const config = getSupabasePublicConfig();
    if (!config) return null;

    const cookieStore = await cookies();

    return createServerClient(config.url, config.publishableKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                } catch {
                    // Server Components cannot write cookies. The request proxy
                    // performs session refreshes before rendering.
                }
            },
        },
    });
}
