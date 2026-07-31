"use client";

import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell01, CheckCircle, ChevronRight, Clock, Command, HelpCircle, Menu01, SearchLg, ShieldTick, XClose } from "@untitledui/icons";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badges";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { moduleRegistry, modulesByGroup } from "@/features/modules/module-registry";
import { useHydrated } from "@/hooks/use-hydrated";
import { getBrowserSupabaseClient } from "@/lib/supabase/client";
import { cx } from "@/utils/cx";
import { AtlasWordmark } from "./atlas-wordmark";
import { CommandPalette } from "./command-palette";

interface AppShellProps {
    children: ReactNode;
}

const groupLabels = {
    Operate: "Operate",
    Build: "Build & govern",
    Assure: "Assure",
    Configure: "Configure",
} as const;

const notifications = [
    {
        title: "3 records require QC review",
        detail: "B747 CQ forms · submitted today",
        time: "12 min",
        icon: CheckCircle,
        tone: "text-emerald-700 bg-emerald-50",
    },
    {
        title: "MATS exception requires a decision",
        detail: "One transition date conflicts with an active curriculum",
        time: "42 min",
        icon: ShieldTick,
        tone: "text-amber-700 bg-amber-50",
    },
    {
        title: "Offline pack synchronized",
        detail: "Event SIM-747-2608 is device-ready",
        time: "1 hr",
        icon: Clock,
        tone: "text-blue-700 bg-blue-50",
    },
];

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = getBrowserSupabaseClient();
    const isHydrated = useHydrated();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [isCommandOpen, setIsCommandOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const mobileOpenButtonRef = useRef<HTMLButtonElement>(null);
    const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);
    const helpDialogRef = useRef<HTMLElement>(null);
    const helpCloseButtonRef = useRef<HTMLButtonElement>(null);
    const helpReturnFocusRef = useRef<HTMLElement | null>(null);

    const currentModule = useMemo(() => {
        const slug = pathname.split("/").filter(Boolean)[0] ?? "operations";
        return moduleRegistry.find((module) => module.slug === slug) ?? moduleRegistry[0];
    }, [pathname]);

    const openHelp = useCallback(() => {
        helpReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setIsHelpOpen(true);
    }, []);

    const closeHelp = useCallback(() => {
        setIsHelpOpen(false);
        window.requestAnimationFrame(() => helpReturnFocusRef.current?.focus());
    }, []);

    const closeMobileNav = useCallback(() => {
        setIsMobileNavOpen(false);
        window.requestAnimationFrame(() => mobileOpenButtonRef.current?.focus());
    }, []);

    useEffect(() => {
        let goSequenceActive = false;
        let goSequenceTimer: number | undefined;

        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                setIsCommandOpen(true);
            }
            if (event.key === "?" && !["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement).tagName)) {
                event.preventDefault();
                openHelp();
            }

            const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes((event.target as HTMLElement).tagName);
            if (isTyping || event.metaKey || event.ctrlKey || event.altKey) return;

            const key = event.key.toLowerCase();
            if (key === "g") {
                goSequenceActive = true;
                window.clearTimeout(goSequenceTimer);
                goSequenceTimer = window.setTimeout(() => {
                    goSequenceActive = false;
                }, 900);
                return;
            }

            if (goSequenceActive && (key === "f" || key === "r")) {
                event.preventDefault();
                goSequenceActive = false;
                window.clearTimeout(goSequenceTimer);
                router.push(key === "f" ? "/forms" : "/records");
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.clearTimeout(goSequenceTimer);
        };
    }, [openHelp, router]);

    useEffect(() => {
        if (!isHelpOpen) return;

        const frame = window.requestAnimationFrame(() => helpCloseButtonRef.current?.focus());
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeHelp();
                return;
            }

            if (event.key === "Tab") {
                const focusable = helpDialogRef.current?.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                );
                if (!focusable?.length) return;

                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [closeHelp, isHelpOpen]);

    useEffect(() => {
        if (!isMobileNavOpen) return;

        const frame = window.requestAnimationFrame(() => mobileCloseButtonRef.current?.focus());
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                closeMobileNav();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => {
            window.cancelAnimationFrame(frame);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [closeMobileNav, isMobileNavOpen]);

    const leaveSession = async () => {
        await supabase?.auth.signOut();
        router.replace("/sign-in");
        router.refresh();
    };

    const sidebar = (
        <div className="flex h-full min-h-0 flex-col bg-[#072b60] text-white">
            <div className="flex h-[72px] shrink-0 items-center border-b border-white/10 px-4">
                <AtlasWordmark />
                <button
                    ref={mobileCloseButtonRef}
                    type="button"
                    onClick={closeMobileNav}
                    className="ml-auto rounded-md p-2 text-blue-100 hover:bg-white/10 lg:hidden"
                    aria-label="Close navigation"
                >
                    <XClose className="size-5" />
                </button>
            </div>

            <nav className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-3 py-4" aria-label="ATQ modules">
                {Object.entries(modulesByGroup).map(([group, modules]) => (
                    <section key={group} className="mb-5">
                        <h2 className="mb-1.5 px-2 text-[10px] font-bold tracking-[0.16em] text-blue-200/80 uppercase">
                            {groupLabels[group as keyof typeof groupLabels]}
                        </h2>
                        <ul className="space-y-0.5">
                            {modules.map((module) => {
                                const isCurrent = currentModule.id === module.id;
                                const Icon = module.icon;
                                return (
                                    <li key={module.id}>
                                        <Link
                                            href={`/${module.slug}`}
                                            onClick={() => setIsMobileNavOpen(false)}
                                            aria-current={isCurrent ? "page" : undefined}
                                            className={cx(
                                                "group flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition outline-none",
                                                isCurrent
                                                    ? "bg-white text-[#0b3d80] shadow-sm"
                                                    : "text-blue-50 hover:bg-white/10 hover:text-white focus-visible:bg-white/15",
                                            )}
                                        >
                                            <Icon className={cx("size-[18px] shrink-0", isCurrent ? "text-blue-700" : "text-blue-200")} />
                                            <span className="min-w-0 flex-1 truncate">{module.shortTitle}</span>
                                            {isCurrent && <ChevronRight className="size-3.5 shrink-0 text-blue-500" />}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                ))}
            </nav>

            <div className="shrink-0 border-t border-white/10 p-3">
                <div className="mb-3 rounded-lg border border-blue-300/20 bg-white/[0.07] p-3">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-white">Proof-of-concept</span>
                        <span className="rounded-full bg-sky-300/20 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-100 uppercase">Demo</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-4 text-blue-200">Synthetic records only · Supabase-ready</p>
                </div>
                <div className="flex w-full items-center gap-3 rounded-lg p-2 text-left">
                    <Avatar initials="AT" size="sm" status="online" className="ring-2 ring-white/20" />
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">{supabase ? "ATQ user" : "Demo operator"}</span>
                        <span className="block truncate text-xs text-blue-200">{supabase ? "Verified session" : "Local demo session"}</span>
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => void leaveSession()}
                    className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-blue-100 outline-none hover:bg-white/10 hover:text-white focus-visible:bg-white/15"
                >
                    {supabase ? "Sign out" : "Exit demo"}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-dvh bg-[#f7f9fc]" data-atq-ready={isHydrated ? "true" : "false"}>
            <a
                href="#main-content"
                className="fixed top-2 left-2 z-[120] -translate-y-20 rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-800 shadow-lg transition focus:translate-y-0"
            >
                Skip to main content
            </a>

            <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] lg:block" data-no-print>
                {sidebar}
            </aside>

            {isMobileNavOpen && (
                <div className="fixed inset-0 z-50 lg:hidden" data-no-print>
                    <button
                        type="button"
                        className="absolute inset-0 bg-[#041326]/60 backdrop-blur-[1px]"
                        onClick={closeMobileNav}
                        aria-label="Close navigation overlay"
                    />
                    <aside className="relative h-full w-[292px] max-w-[88vw] shadow-2xl">{sidebar}</aside>
                </div>
            )}

            <div className="lg:pl-[248px]" inert={isMobileNavOpen ? true : undefined}>
                <header
                    className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-blue-900/30 bg-[#0b3d80] px-4 text-white shadow-sm sm:px-6"
                    data-no-print
                >
                    <button
                        ref={mobileOpenButtonRef}
                        type="button"
                        onClick={() => setIsMobileNavOpen(true)}
                        className="rounded-lg p-2 text-blue-50 hover:bg-white/10 lg:hidden"
                        aria-label="Open navigation"
                    >
                        <Menu01 className="size-5" />
                    </button>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold tracking-[0.13em] text-blue-200 uppercase">{currentModule.id}</span>
                            <span aria-hidden="true" className="size-1 rounded-full bg-blue-300/70" />
                            <span className="truncate text-[11px] text-blue-100">Atlas Training &amp; Qualification</span>
                        </div>
                        <p className="truncate text-sm font-semibold sm:text-base">{currentModule.shortTitle}</p>
                    </div>

                    <div className="ml-auto flex items-center gap-1.5">
                        <button
                            type="button"
                            onClick={() => setIsCommandOpen(true)}
                            className="hidden h-9 min-w-60 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 text-left text-sm text-blue-100 outline-none hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/80 md:flex"
                        >
                            <SearchLg className="size-4" />
                            <span className="flex-1">Search or go to…</span>
                            <span className="flex items-center gap-0.5 rounded border border-white/20 bg-blue-950/30 px-1.5 py-0.5 text-[10px] font-semibold">
                                <Command className="size-3" />K
                            </span>
                        </button>
                        <ButtonUtility
                            size="sm"
                            color="tertiary"
                            icon={SearchLg}
                            tooltip="Search"
                            className="text-white hover:bg-white/10 md:hidden"
                            onClick={() => setIsCommandOpen(true)}
                        />
                        <ButtonUtility
                            size="sm"
                            color="tertiary"
                            icon={HelpCircle}
                            tooltip="Keyboard help"
                            className="hidden text-white hover:bg-white/10 sm:inline-flex"
                            onClick={openHelp}
                        />
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsNotificationsOpen((open) => !open)}
                                className="relative rounded-lg p-2 text-white outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/80"
                                aria-label="Open notifications"
                                aria-expanded={isNotificationsOpen}
                            >
                                <Bell01 className="size-5" />
                                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-amber-300 ring-2 ring-[#0b3d80]" />
                            </button>
                            {isNotificationsOpen && (
                                <section className="absolute top-12 right-0 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-900 shadow-xl">
                                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                                        <div>
                                            <h2 className="text-sm font-semibold">Synthetic notifications</h2>
                                            <p className="text-xs text-gray-500">Demonstration updates and modeled actions</p>
                                        </div>
                                        <Badge color="blue" size="sm">
                                            Demo
                                        </Badge>
                                    </div>
                                    <ul className="divide-y divide-gray-100">
                                        {notifications.map((notification) => {
                                            const Icon = notification.icon;
                                            return (
                                                <li key={notification.title} className="flex gap-3 px-4 py-3 hover:bg-gray-50">
                                                    <span
                                                        className={cx(
                                                            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                                                            notification.tone,
                                                        )}
                                                    >
                                                        <Icon className="size-4" />
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block text-sm font-semibold text-gray-900">{notification.title}</span>
                                                        <span className="mt-0.5 block text-xs leading-4 text-gray-500">{notification.detail}</span>
                                                    </span>
                                                    <span className="text-[11px] whitespace-nowrap text-gray-400">{notification.time}</span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                    <Link
                                        href="/operations/0.8"
                                        className="block border-t border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-blue-700 hover:bg-blue-50"
                                    >
                                        Open notification center
                                    </Link>
                                </section>
                            )}
                        </div>
                    </div>
                </header>

                <div className="border-b border-gray-200 bg-white px-4 py-2.5 sm:px-6" data-no-print>
                    <div className="mx-auto flex max-w-[1600px] items-center gap-2 overflow-x-auto">
                        <Badge color="blue" size="sm">
                            B747
                        </Badge>
                        <span className="text-xs font-semibold whitespace-nowrap text-gray-700">AQP / N&amp;O transition</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs whitespace-nowrap text-gray-500">Program resolution required on every record</span>
                        <Link href="/operations/0.1" className="ml-auto text-xs font-semibold whitespace-nowrap text-blue-700 hover:text-blue-900">
                            Resolve program
                        </Link>
                    </div>
                </div>

                <main id="main-content" className="mx-auto min-h-[calc(100dvh-113px)] w-full max-w-[1600px] p-4 sm:p-6">
                    {children}
                </main>
            </div>

            <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

            {isHelpOpen && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-[#061b36]/60 p-4 backdrop-blur-[2px]"
                    onMouseDown={(event) => {
                        if (event.currentTarget === event.target) closeHelp();
                    }}
                >
                    <section
                        ref={helpDialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Keyboard shortcuts"
                        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Keyboard shortcuts</h2>
                                <p className="mt-1 text-sm text-gray-500">ATQ is designed to be keyboard-complete.</p>
                            </div>
                            <button
                                ref={helpCloseButtonRef}
                                type="button"
                                onClick={closeHelp}
                                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
                                aria-label="Close"
                            >
                                <XClose className="size-5" />
                            </button>
                        </div>
                        <dl className="mt-5 divide-y divide-gray-100">
                            {[
                                ["⌘ / Ctrl + K", "Open global search"],
                                ["?", "Open this shortcut guide"],
                                ["G then F", "Go to forms"],
                                ["G then R", "Go to records"],
                            ].map(([keys, action]) => (
                                <div key={keys} className="flex items-center justify-between gap-4 py-2.5">
                                    <dt className="text-sm text-gray-600">{action}</dt>
                                    <dd className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs font-semibold text-gray-700">
                                        {keys}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                </div>
            )}
        </div>
    );
}
