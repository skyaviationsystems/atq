import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/atq/app-shell";
import { getBackendMode } from "@/lib/platform/backend-config";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PlatformLayout({ children }: { children: ReactNode }) {
    if (getBackendMode() === "supabase") {
        const supabase = await createServerSupabaseClient();
        const { data, error } = (await supabase?.auth.getClaims()) ?? {};

        if (error || !data?.claims?.sub) {
            redirect("/sign-in");
        }
    }

    return <AppShell>{children}</AppShell>;
}
