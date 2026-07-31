"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    BookOpen01,
    Calendar,
    Check,
    CheckCircle,
    ChevronRight,
    Download01,
    File02,
    MarkerPin01,
    Moon01,
    PlayCircle,
    RefreshCw01,
    ShieldTick,
    Sun,
    Users01,
    Wifi,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { syntheticInstructorEvents } from "../forms/synthetic-data";
import type { InstructorEvent } from "../forms/types";

const offlineMeta: Record<
    InstructorEvent["offlineState"],
    {
        label: string;
        detail: string;
        className: string;
    }
> = {
    ready: {
        label: "Available offline",
        detail: "Roster, form, anchors, and brief are current.",
        className: "bg-utility-green-50 text-utility-green-700 ring-utility-green-200",
    },
    "update-available": {
        label: "Update available",
        detail: "A newer event snapshot is ready to download.",
        className: "bg-utility-orange-50 text-utility-orange-700 ring-utility-orange-200",
    },
    "not-downloaded": {
        label: "Not downloaded",
        detail: "This event is not yet available without connectivity.",
        className: "bg-secondary text-secondary ring-secondary",
    },
};

export interface MyEventsProps {
    events: InstructorEvent[];
    selectedEventId: string;
    onSelectEvent: (eventId: string) => void;
    className?: string;
}

export const MyEvents = ({ events, selectedEventId, onSelectEvent, className }: MyEventsProps) => {
    return (
        <section className={cx("overflow-hidden rounded-xl border border-secondary bg-primary shadow-xs", className)} aria-labelledby="my-events-title">
            <div className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-4 sm:px-5">
                <div>
                    <h2 id="my-events-title" className="text-md font-semibold text-primary">
                        My events
                    </h2>
                    <p className="mt-1 text-xs text-tertiary">Scheduled evaluation events assigned to you</p>
                </div>
                <span className="rounded-full bg-utility-blue-50 px-2.5 py-1 text-xs font-semibold text-utility-blue-700 ring-1 ring-utility-blue-200 ring-inset">
                    {events.length} upcoming
                </span>
            </div>

            <div className="divide-y divide-secondary">
                {events.map((event) => {
                    const selected = event.id === selectedEventId;
                    const offline = offlineMeta[event.offlineState];
                    return (
                        <button
                            key={event.id}
                            type="button"
                            onClick={() => onSelectEvent(event.id)}
                            aria-pressed={selected}
                            className={cx(
                                "group grid w-full gap-3 px-4 py-4 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-utility-blue-500 focus-visible:ring-inset sm:grid-cols-[minmax(0,1fr)_auto] sm:px-5",
                                selected ? "bg-utility-blue-50/70" : "hover:bg-primary_hover",
                            )}
                        >
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs font-semibold text-utility-blue-700">{event.eventCode}</span>
                                    <span className="text-xs text-quaternary">·</span>
                                    <span className="text-xs font-medium text-tertiary">{event.program}</span>
                                    <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", offline.className)}>
                                        {offline.label}
                                    </span>
                                </div>
                                <h3 className="mt-1.5 text-sm font-semibold text-primary">{event.title}</h3>
                                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-tertiary">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Calendar aria-hidden="true" className="size-3.5" />
                                        {event.dateLabel} · {event.timeLabel}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <MarkerPin01 aria-hidden="true" className="size-3.5" />
                                        {event.location}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Users01 aria-hidden="true" className="size-3.5" />
                                        {event.participantCount} participants
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between gap-4 sm:justify-end">
                                <div className="text-left sm:text-right">
                                    <p className="text-sm font-semibold text-primary">
                                        {event.openFormCount}/{event.formCount}
                                    </p>
                                    <p className="text-xs text-tertiary">forms open</p>
                                </div>
                                <ChevronRight
                                    aria-hidden="true"
                                    className={cx(
                                        "size-5 shrink-0 text-fg-quaternary transition group-hover:translate-x-0.5",
                                        selected && "text-utility-blue-600",
                                    )}
                                />
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export interface OfflinePackPanelProps {
    event: InstructorEvent;
    isDownloading?: boolean;
    onDownload: () => void;
    className?: string;
}

export const OfflinePackPanel = ({ event, isDownloading = false, onDownload, className }: OfflinePackPanelProps) => {
    const meta = offlineMeta[event.offlineState];
    const packItems = [
        { label: "Event roster", current: event.offlineState !== "not-downloaded" },
        { label: "Published form v4.8", current: event.offlineState !== "not-downloaded" },
        { label: "Rating anchors", current: event.offlineState !== "not-downloaded" },
        { label: "Brief and resources", current: event.offlineState === "ready" },
    ];
    const currentCount = packItems.filter((item) => item.current).length;

    return (
        <section className={cx("rounded-xl border border-secondary bg-primary p-4 shadow-xs sm:p-5", className)} aria-labelledby="offline-pack-title">
            <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-utility-blue-50 text-utility-blue-700">
                    <Download01 aria-hidden="true" className="size-5" />
                </span>
                <span className={cx("rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset", meta.className)}>{meta.label}</span>
            </div>
            <h2 id="offline-pack-title" className="mt-4 text-md font-semibold text-primary">
                Offline event pack
            </h2>
            <p className="mt-1 text-sm text-tertiary">{meta.detail}</p>

            <div className="mt-4 space-y-2">
                {packItems.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-secondary">{item.label}</span>
                        {item.current ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-utility-green-700">
                                <Check aria-hidden="true" className="size-3.5" />
                                Current
                            </span>
                        ) : (
                            <span className="text-xs font-semibold text-utility-orange-700">Needs download</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-tertiary">
                    <span>Pack readiness</span>
                    <span className="font-semibold text-secondary">{currentCount}/4</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                        className={cx("h-full rounded-full transition-[width]", currentCount === 4 ? "bg-utility-green-600" : "bg-utility-blue-600")}
                        style={{ width: `${(currentCount / 4) * 100}%` }}
                    />
                </div>
            </div>

            <Button
                color={event.offlineState === "ready" ? "secondary" : "primary"}
                size="sm"
                iconLeading={event.offlineState === "ready" ? RefreshCw01 : Download01}
                className="mt-5 w-full"
                isLoading={isDownloading}
                showTextWhileLoading
                onClick={onDownload}
            >
                {event.offlineState === "ready" ? "Refresh pack" : "Download pack"}
            </Button>
            <p className="mt-2 text-center text-[11px] text-tertiary">Synthetic pack · 4.8 MB · browser-local preview</p>
        </section>
    );
};

interface SyntheticOpenForm {
    id: string;
    participant: string;
    seat: string;
    state: "not-started" | "in-progress" | "ready-to-review";
    progress: number;
    savedAt?: string;
}

const formStateMeta: Record<SyntheticOpenForm["state"], { label: string; className: string }> = {
    "not-started": { label: "Not started", className: "bg-secondary text-secondary ring-secondary" },
    "in-progress": { label: "In progress", className: "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200" },
    "ready-to-review": { label: "Ready to review", className: "bg-utility-green-50 text-utility-green-700 ring-utility-green-200" },
};

export interface OpenFormsPanelProps {
    event: InstructorEvent;
    onOpenForm?: (formId: string) => void;
    className?: string;
}

export const OpenFormsPanel = ({ event, onOpenForm, className }: OpenFormsPanelProps) => {
    const forms: SyntheticOpenForm[] = [
        {
            id: `${event.id}-left`,
            participant: "Participant 1842",
            seat: "Roster position A",
            state: event.openFormCount > 0 ? "in-progress" : "not-started",
            progress: event.openFormCount > 0 ? 38 : 0,
            savedAt: event.openFormCount > 0 ? "Saved 1 min ago" : undefined,
        },
        {
            id: `${event.id}-right`,
            participant: "Participant 3176",
            seat: "Roster position B",
            state: "not-started",
            progress: 0,
        },
    ];

    return (
        <section className={cx("overflow-hidden rounded-xl border border-secondary bg-primary shadow-xs", className)} aria-labelledby="open-forms-title">
            <div className="flex items-center justify-between gap-3 border-b border-secondary px-4 py-4 sm:px-5">
                <div>
                    <h2 id="open-forms-title" className="text-md font-semibold text-primary">
                        Event forms
                    </h2>
                    <p className="mt-1 text-xs text-tertiary">{event.eventCode} · roster-bound records</p>
                </div>
                <span className="text-xs font-medium text-tertiary">
                    {event.openFormCount}/{event.formCount} open
                </span>
            </div>

            <div className="divide-y divide-secondary">
                {forms.map((form) => {
                    const meta = formStateMeta[form.state];
                    return (
                        <article key={form.id} className="px-4 py-4 sm:px-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-sm font-semibold text-primary">{form.participant}</h3>
                                        <span className={cx("rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset", meta.className)}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-tertiary">{form.seat} · B747 AQP CQ · v4.8</p>
                                    {form.state !== "not-started" && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                                                <div className="h-full rounded-full bg-utility-blue-600" style={{ width: `${form.progress}%` }} />
                                            </div>
                                            <span className="text-xs font-medium text-tertiary">
                                                {form.progress}% · {form.savedAt}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <Button
                                    color={form.state === "not-started" ? "primary" : "secondary"}
                                    size="sm"
                                    iconLeading={form.state === "not-started" ? PlayCircle : File02}
                                    onClick={() => onOpenForm?.(form.id)}
                                >
                                    {form.state === "not-started" ? "Start form" : "Resume form"}
                                </Button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export interface PreEventBriefProps {
    event: InstructorEvent;
    className?: string;
}

export const PreEventBrief = ({ event, className }: PreEventBriefProps) => {
    return (
        <section className={cx("overflow-hidden rounded-xl border border-secondary bg-primary shadow-xs", className)} aria-labelledby="pre-event-brief-title">
            <div className="border-b border-secondary bg-[#003b70] px-4 py-4 text-white sm:px-5">
                <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/12">
                        <BookOpen01 aria-hidden="true" className="size-5" />
                    </span>
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-[#9cd7ff] uppercase">Pre-event brief</p>
                        <h2 id="pre-event-brief-title" className="mt-1 text-md font-semibold text-white">
                            {event.title}
                        </h2>
                        <p className="mt-1 text-xs text-white/70">
                            {event.eventCode} · {event.version}
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-5 px-4 py-5 sm:px-5">
                <div>
                    <h3 className="text-xs font-semibold tracking-wide text-tertiary uppercase">Objective</h3>
                    <p className="mt-2 text-sm leading-6 text-secondary">{event.brief.objective}</p>
                </div>

                <div>
                    <h3 className="text-xs font-semibold tracking-wide text-tertiary uppercase">Emphasis items</h3>
                    <ul className="mt-2 space-y-2">
                        {event.brief.emphasisItems.map((item) => (
                            <li key={item} className="flex items-start gap-2 text-sm text-secondary">
                                <ShieldTick aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-utility-blue-600" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div>
                    <h3 className="text-xs font-semibold tracking-wide text-tertiary uppercase">Pack resources</h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {event.brief.resources.map((resource) => (
                            <button
                                key={resource}
                                type="button"
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-secondary bg-primary px-2.5 py-1.5 text-xs font-semibold text-secondary shadow-xs transition outline-none hover:bg-primary_hover focus-visible:ring-2 focus-visible:ring-utility-blue-500"
                            >
                                <File02 aria-hidden="true" className="size-3.5 text-fg-quaternary" />
                                {resource}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg bg-secondary px-3 py-3">
                    <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />
                    <p className="text-xs text-tertiary">{event.brief.note}</p>
                </div>
            </div>
        </section>
    );
};

export interface InstructorWorkspaceProps {
    initialEvents?: InstructorEvent[];
    className?: string;
    onOpenForm?: (formId: string, eventId: string) => void;
}

export const InstructorWorkspace = ({ initialEvents = syntheticInstructorEvents, className, onOpenForm }: InstructorWorkspaceProps) => {
    const [events, setEvents] = useState(initialEvents);
    const [selectedEventId, setSelectedEventId] = useState(initialEvents[0]?.id ?? "");
    const [isLowLight, setIsLowLight] = useState(false);
    const [downloadingEventId, setDownloadingEventId] = useState("");
    const [statusMessage, setStatusMessage] = useState("");

    const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId) ?? events[0], [events, selectedEventId]);

    const downloadPack = () => {
        if (!selectedEvent || downloadingEventId) return;
        setDownloadingEventId(selectedEvent.id);
        setStatusMessage(`Updating ${selectedEvent.eventCode} offline pack…`);
        window.setTimeout(() => {
            setEvents((current) => current.map((event) => (event.id === selectedEvent.id ? { ...event, offlineState: "ready" as const } : event)));
            setDownloadingEventId("");
            setStatusMessage(`${selectedEvent.eventCode} is ready offline.`);
        }, 900);
    };

    if (!selectedEvent) {
        return <div className="rounded-xl border border-secondary bg-primary p-8 text-center text-sm text-tertiary">No instructor events assigned.</div>;
    }

    return (
        <div className={cx(isLowLight && "dark-mode", className)}>
            <div className="min-h-screen bg-secondary text-primary">
                <header className="sticky top-[72px] z-20 border-b border-[#235985] bg-[#003b70] text-white shadow-sm">
                    <div className="mx-auto flex min-h-16 max-w-[1500px] items-center gap-3 px-4 sm:px-6">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/12 text-sm font-bold tracking-tight">ATQ</div>
                        <div className="h-7 w-px bg-white/20" />
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-sm font-semibold text-white sm:text-md">Instructor workspace</h1>
                            <p className="truncate text-xs text-white/65">
                                {selectedEvent.eventCode} · {selectedEvent.dateLabel} · {selectedEvent.timeLabel}
                            </p>
                        </div>
                        <div className="hidden items-center gap-2 text-xs font-medium text-white/80 sm:flex">
                            <Wifi aria-hidden="true" className="size-4 text-[#70d6a4]" />
                            Synced now
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsLowLight((lowLight) => !lowLight)}
                            aria-label={isLowLight ? "Use light mode" : "Use low-light mode"}
                            aria-pressed={isLowLight}
                            className="flex size-10 items-center justify-center rounded-lg text-white/80 transition outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-white"
                        >
                            {isLowLight ? <Sun aria-hidden="true" className="size-5" /> : <Moon01 aria-hidden="true" className="size-5" />}
                        </button>
                    </div>
                </header>

                {statusMessage && (
                    <div className="border-b border-utility-blue-200 bg-utility-blue-50 px-4 py-2.5 text-utility-blue-700" role="status">
                        <div className="mx-auto flex max-w-[1500px] items-center gap-2 text-sm font-medium">
                            {downloadingEventId ? (
                                <RefreshCw01 aria-hidden="true" className="size-4 animate-spin" />
                            ) : (
                                <CheckCircle aria-hidden="true" className="size-4" />
                            )}
                            {statusMessage}
                        </div>
                    </div>
                )}

                <main className="mx-auto max-w-[1500px] px-4 py-5 sm:px-6 sm:py-6">
                    <section className="mb-5 overflow-hidden rounded-xl bg-[#003b70] text-white shadow-sm">
                        <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                            <div className="px-5 py-5 sm:px-6">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-semibold text-[#a6dcff] ring-1 ring-white/15 ring-inset">
                                        Next assigned event
                                    </span>
                                    <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/15 ring-inset">
                                        {selectedEvent.program} · {selectedEvent.version}
                                    </span>
                                </div>
                                <h2 className="mt-3 text-xl font-semibold text-white">{selectedEvent.title}</h2>
                                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/75">
                                    <span className="inline-flex items-center gap-1.5">
                                        <Calendar aria-hidden="true" className="size-4" />
                                        {selectedEvent.dateLabel} · {selectedEvent.timeLabel}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <MarkerPin01 aria-hidden="true" className="size-4" />
                                        {selectedEvent.location}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <Users01 aria-hidden="true" className="size-4" />
                                        {selectedEvent.participantCount} participants
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-3 border-t border-white/15 bg-white/6 px-5 py-4 sm:px-6 lg:border-t-0 lg:border-l">
                                <Button color="secondary" size="sm" className="bg-white text-[#003b70] ring-white hover:bg-[#e9f5ff]" onClick={downloadPack}>
                                    Check pack
                                </Button>
                                <Button
                                    color="secondary"
                                    size="sm"
                                    iconLeading={PlayCircle}
                                    className="bg-[#0b67a5] text-white ring-white/20 hover:bg-[#1478b9]"
                                    onClick={() => onOpenForm?.(`${selectedEvent.id}-left`, selectedEvent.id)}
                                >
                                    Open forms
                                </Button>
                            </div>
                        </div>
                    </section>

                    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)] xl:items-start">
                        <div className="min-w-0 space-y-5">
                            <MyEvents events={events} selectedEventId={selectedEvent.id} onSelectEvent={setSelectedEventId} />
                            <OpenFormsPanel event={selectedEvent} onOpenForm={(formId) => onOpenForm?.(formId, selectedEvent.id)} />
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
                            <OfflinePackPanel event={selectedEvent} isDownloading={downloadingEventId === selectedEvent.id} onDownload={downloadPack} />
                            <PreEventBrief event={selectedEvent} />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
