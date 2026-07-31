"use client";

import { type FormEvent, useState } from "react";
import { ArrowRight, Lock01, Mail01, ShieldTick } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { useHydrated } from "@/hooks/use-hydrated";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { AtlasWordmark } from "./atlas-wordmark";

export function SignInScreen() {
    const router = useRouter();
    const isHydrated = useHydrated();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const supabase = getBrowserSupabaseClient();

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!supabase) {
            router.push("/operations");
            return;
        }

        setIsSubmitting(true);
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        setIsSubmitting(false);

        if (signInError) {
            setError(signInError.message);
            return;
        }

        router.replace("/operations");
        router.refresh();
    }

    return (
        <main className="grid min-h-dvh bg-white lg:grid-cols-[minmax(360px,0.85fr)_minmax(520px,1.15fr)]" data-atq-ready={isHydrated ? "true" : "false"}>
            <section className="relative hidden overflow-hidden bg-[#072b60] p-10 text-white lg:flex lg:flex-col">
                <div className="absolute inset-0 opacity-25" aria-hidden="true">
                    <div className="absolute -top-40 -left-48 size-[620px] rounded-full border border-blue-300/50" />
                    <div className="absolute -top-16 -left-20 size-[420px] rounded-full border border-blue-300/40" />
                    <div className="absolute right-[-180px] bottom-[-280px] size-[660px] rounded-full bg-blue-500/30 blur-3xl" />
                </div>
                <AtlasWordmark className="relative z-10" />
                <div className="relative z-10 my-auto max-w-xl">
                    <span className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                        <ShieldTick className="size-4" /> Controlled training records
                    </span>
                    <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white xl:text-5xl">One operating picture for training and qualification.</h1>
                    <p className="mt-5 max-w-lg text-lg leading-8 text-blue-100">
                        Forms, records, curriculum, scheduling, qualification logic, and audit evidence in one program-aware workspace.
                    </p>
                    <dl className="mt-10 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
                        <div>
                            <dt className="text-xs text-blue-200">Fleet</dt>
                            <dd className="mt-1 text-lg font-semibold">B747</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-blue-200">Programs</dt>
                            <dd className="mt-1 text-lg font-semibold">AQP + N&amp;O</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-blue-200">Mode</dt>
                            <dd className="mt-1 text-lg font-semibold">PoC</dd>
                        </div>
                    </dl>
                </div>
                <p className="relative z-10 text-xs text-blue-200">Authorized users only · Production access auditing is a required deployment gate</p>
            </section>

            <section className="flex min-h-dvh items-center justify-center px-5 py-10 sm:px-8">
                <div className="w-full max-w-md">
                    <div className="mb-10 flex lg:hidden">
                        <div className="rounded-xl bg-[#072b60] px-4 py-3">
                            <AtlasWordmark />
                        </div>
                    </div>
                    <p className="text-sm font-semibold text-blue-700">Atlas Training &amp; Qualification</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">Sign in to ATQ</h2>
                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        Use your authorized training systems account. This proof-of-concept contains synthetic data only.
                    </p>

                    <form onSubmit={onSubmit} className="mt-8 space-y-5">
                        <Input
                            label="Email"
                            type="email"
                            icon={Mail01}
                            placeholder="name@atlasair.com"
                            value={email}
                            onChange={setEmail}
                            isRequired={Boolean(supabase)}
                            autoComplete="email"
                        />
                        <Input
                            label="Password"
                            type="password"
                            icon={Lock01}
                            placeholder="Enter your password"
                            value={password}
                            onChange={setPassword}
                            isRequired={Boolean(supabase)}
                            autoComplete="current-password"
                        />
                        {error && (
                            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800">
                                {error}
                            </div>
                        )}
                        <Button
                            type="submit"
                            size="lg"
                            color="primary"
                            className="w-full"
                            iconTrailing={ArrowRight}
                            isLoading={isSubmitting}
                            isDisabled={!isHydrated}
                        >
                            {supabase ? "Sign in" : "Continue to demo"}
                        </Button>
                    </form>

                    {!supabase && (
                        <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-3 text-xs leading-5 text-blue-900">
                            Supabase credentials are not configured, so authentication is in local demo mode. Connect a project to enable verified sessions and
                            RLS.
                        </div>
                    )}
                    <p className="mt-8 text-xs leading-5 text-gray-500">
                        By continuing, you acknowledge that training records are controlled information and must be handled under applicable Atlas policies.
                    </p>
                </div>
            </section>
        </main>
    );
}
