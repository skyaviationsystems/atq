"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Command, SearchLg, Users01, XClose } from "@untitledui/icons";
import Link from "next/link";
import { moduleRegistry } from "@/features/modules/module-registry";
import { recordPeople } from "@/features/records/demo-records-repository";

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const dialogRef = useRef<HTMLElement>(null);
    const returnFocusRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
        return () => {
            window.cancelAnimationFrame(frame);
            window.requestAnimationFrame(() => returnFocusRef.current?.focus());
        };
    }, [isOpen]);

    const close = () => {
        setQuery("");
        onClose();
    };

    const results = useMemo(() => {
        const normalized = query.trim().toLowerCase();
        const commands = moduleRegistry.flatMap((module) => [
            {
                key: module.id,
                title: module.title,
                context: `${module.id} · ${module.group}`,
                href: `/${module.slug}`,
                icon: module.icon,
                entityType: "Workspace",
            },
            ...module.routes.map((route) => ({
                key: `${module.id}-${route.code}`,
                title: route.label,
                context: `${module.shortTitle} · ${route.code}`,
                href: `/${module.slug}/${route.code}`,
                icon: module.icon,
                entityType: "Screen",
            })),
        ]);

        if (!normalized) return commands.slice(0, 9);

        const people = recordPeople.map((person) => ({
            key: `person-${person.id}`,
            title: person.displayName,
            context: `Employee ${person.employeeNumber} · ${person.fleetCode}/${person.seatCode} · ${person.baseCode}`,
            href: `/records/people/${person.id}`,
            icon: Users01,
            entityType: "Person",
        }));

        return [...people, ...commands].filter((item) => `${item.title} ${item.context} ${item.entityType}`.toLowerCase().includes(normalized)).slice(0, 12);
    }, [query]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-start justify-center bg-[#061b36]/60 px-4 pt-[9vh] backdrop-blur-[2px]"
            role="presentation"
            onMouseDown={(event) => {
                if (event.currentTarget === event.target) close();
            }}
        >
            <section
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Global search and command palette"
                className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl"
                onKeyDown={(event) => {
                    if (event.key === "Escape") close();
                    if (event.key !== "Tab") return;

                    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
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
                }}
            >
                <div className="flex items-center gap-3 border-b border-gray-200 px-4">
                    <SearchLg className="size-5 shrink-0 text-gray-500" aria-hidden="true" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search people, forms, events, tasks, or go to…"
                        className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-gray-900 outline-none placeholder:text-gray-500"
                    />
                    <button
                        type="button"
                        onClick={close}
                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-blue-600"
                        aria-label="Close command palette"
                    >
                        <XClose className="size-5" />
                    </button>
                </div>

                <div className="max-h-[58vh] overflow-y-auto p-2">
                    <p className="px-2 py-2 text-xs font-semibold tracking-wide text-gray-500 uppercase">
                        {query ? `${results.length} results` : "Quick access"}
                    </p>
                    {results.length > 0 ? (
                        <ul className="space-y-1">
                            {results.map((result) => {
                                const Icon = result.icon;
                                return (
                                    <li key={result.key}>
                                        <Link
                                            href={result.href}
                                            onClick={close}
                                            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 outline-none hover:bg-blue-50 focus-visible:bg-blue-50"
                                        >
                                            <span className="flex size-9 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-700">
                                                <Icon className="size-5" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex min-w-0 items-center gap-2">
                                                    <span className="truncate text-sm font-semibold text-gray-900">{result.title}</span>
                                                    <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gray-600 uppercase">
                                                        {result.entityType}
                                                    </span>
                                                </span>
                                                <span className="block truncate text-xs text-gray-500">{result.context}</span>
                                            </span>
                                            <ArrowRight className="size-4 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-blue-700" />
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <div className="px-4 py-12 text-center">
                            <p className="font-semibold text-gray-900">No matching ATQ workspace</p>
                            <p className="mt-1 text-sm text-gray-500">Try a module name, screen number, person, form, or event.</p>
                        </div>
                    )}
                </div>

                <footer className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <Command className="size-3.5" /> Global navigation
                    </span>
                    <span>Esc to close</span>
                </footer>
            </section>
        </div>
    );
}
