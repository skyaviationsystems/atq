"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
    AlertCircle,
    ArrowLeft,
    Check,
    CheckCircle,
    ChevronRight,
    Cloud01,
    FileCheck03,
    Lock01,
    RefreshCw01,
    Save01,
    Send01,
    ShieldTick,
    Wifi,
    WifiOff,
    X,
} from "@untitledui/icons";
import { Badge } from "@/components/base/badges/badges";
import { Button } from "@/components/base/buttons/button";
import { TextArea } from "@/components/base/textarea/textarea";
import { loadOfflineDraft, queueOfflineMutation, saveOfflineDraft } from "@/lib/offline";
import { cx } from "@/utils/cx";
import { EventSetBlock } from "./event-set-block";
import { type RequiredItem, RequiredItemsTray, SectionNavigator } from "./required-items-tray";
import { emptyAssessment, initialRuntimeSections, syntheticEventSets } from "./synthetic-data";
import type { EventAttempt, RuntimeSection } from "./types";

type SaveState = "saved" | "saving" | "queued";

const RUNTIME_DRAFT_ID = "synthetic-b747-cq-frm-260730-021";
const RUNTIME_EVENT_ID = "synthetic-b747-cq-evt-7412";
const RUNTIME_FORM_VERSION_ID = "synthetic-b747-cq-v4.8";

interface StoredRuntimePayload {
    attemptsByEventSet: Record<string, EventAttempt[]>;
    overallOutcome: OverallOutcome;
    overallComments: string;
    instructorAttested: boolean;
    participantAcknowledged: boolean;
}

function isStoredRuntimePayload(value: unknown): value is StoredRuntimePayload {
    if (!value || typeof value !== "object") return false;
    const candidate = value as Partial<StoredRuntimePayload>;
    return (
        typeof candidate.attemptsByEventSet === "object" &&
        candidate.attemptsByEventSet !== null &&
        typeof candidate.overallOutcome === "string" &&
        typeof candidate.overallComments === "string" &&
        typeof candidate.instructorAttested === "boolean" &&
        typeof candidate.participantAcknowledged === "boolean"
    );
}

const seedAttempts = (): Record<string, EventAttempt[]> => ({
    "es-flight-management": [
        {
            id: "attempt-es-flight-management-1",
            number: 1,
            startedAt: "19:04",
            outcome: "in-progress",
            assessment: {
                ratings: {
                    safety: 4,
                    technical: 3,
                    procedures: 3,
                    crew: null,
                },
                comments: "Maintained a stable plan while the scenario inputs changed.",
            },
        },
    ],
    "es-systems-prioritization": [
        {
            id: "attempt-es-systems-prioritization-1",
            number: 1,
            startedAt: "19:28",
            outcome: "in-progress",
            assessment: emptyAssessment(),
        },
    ],
    "es-arrival-planning": [],
});

const saveCopy: Record<SaveState, { label: string; detail: string; className: string }> = {
    saved: {
        label: "Saved",
        detail: "All changes stored on this device",
        className: "text-utility-green-700",
    },
    saving: {
        label: "Saving",
        detail: "Storing your latest changes",
        className: "text-utility-blue-700",
    },
    queued: {
        label: "Saved locally",
        detail: "Browser draft is ready for reconnection",
        className: "text-utility-orange-700",
    },
};

const outcomeOptions = [
    { value: "satisfactory", label: "Satisfactory", description: "Required standards were demonstrated." },
    { value: "additional-review", label: "Additional review", description: "Evidence needs coordinator review." },
    { value: "unsatisfactory", label: "Unsatisfactory", description: "One or more required standards were not met." },
] as const;

type OverallOutcome = (typeof outcomeOptions)[number]["value"] | "";

interface SubmitReviewProps {
    missingItems: RequiredItem[];
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    isSubmitted: boolean;
}

const SubmitReview = ({ missingItems, isOpen, onClose, onSubmit, isSubmitted }: SubmitReviewProps) => {
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        closeButtonRef.current?.focus();
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const ready = missingItems.length === 0;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-gray-950/45 backdrop-blur-[2px]" role="presentation" onMouseDown={onClose}>
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="submit-review-title"
                className="flex h-full w-full max-w-xl flex-col bg-primary shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-secondary px-5 py-5 sm:px-6">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-utility-blue-700 uppercase">Final review</p>
                        <h2 id="submit-review-title" className="mt-1 text-xl font-semibold text-primary">
                            Review before submission
                        </h2>
                        <p className="mt-1 text-sm text-tertiary">
                            The POC validates this version and places it in the local delivery outbox for later server processing.
                        </p>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Close submit review"
                        className="flex size-10 shrink-0 items-center justify-center rounded-lg text-fg-quaternary transition outline-none hover:bg-primary_hover hover:text-primary focus-visible:ring-2 focus-visible:ring-utility-blue-500"
                    >
                        <X aria-hidden="true" className="size-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6">
                    {isSubmitted ? (
                        <div className="flex min-h-full flex-col items-center justify-center text-center">
                            <span className="flex size-14 items-center justify-center rounded-full bg-utility-green-50 text-utility-green-700 ring-8 ring-utility-green-50/70">
                                <CheckCircle aria-hidden="true" className="size-7" />
                            </span>
                            <h3 className="mt-5 text-lg font-semibold text-primary">Queued for server validation</h3>
                            <p className="mt-2 max-w-sm text-sm text-tertiary">
                                Record FRM-260730-021 is preserved in the local outbox. It is not a system-of-record submission until a configured backend
                                accepts it and returns a receipt.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div
                                className={cx(
                                    "flex items-start gap-3 rounded-xl border px-4 py-4",
                                    ready
                                        ? "border-utility-green-200 bg-utility-green-50 text-utility-green-700"
                                        : "border-utility-orange-200 bg-utility-orange-50 text-utility-orange-700",
                                )}
                            >
                                {ready ? (
                                    <CheckCircle aria-hidden="true" className="size-5 shrink-0" />
                                ) : (
                                    <AlertCircle aria-hidden="true" className="size-5 shrink-0" />
                                )}
                                <div>
                                    <p className="text-sm font-semibold">{ready ? "Ready to submit" : `${missingItems.length} required items remain`}</p>
                                    <p className="mt-1 text-sm opacity-90">
                                        {ready
                                            ? "The required fields, ratings, outcomes, and attestations are complete."
                                            : "Return to the listed sections and complete each item before submission."}
                                    </p>
                                </div>
                            </div>

                            {!ready && (
                                <ul className="mt-5 divide-y divide-secondary rounded-xl border border-secondary">
                                    {missingItems.map((item) => (
                                        <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                                            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-utility-red-600" />
                                            <div>
                                                <p className="text-sm font-semibold text-primary">{item.label}</p>
                                                <p className="mt-0.5 text-xs text-tertiary">{item.detail}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            <div className="mt-6 rounded-xl border border-secondary">
                                <div className="flex items-center gap-3 border-b border-secondary px-4 py-4">
                                    <FileCheck03 aria-hidden="true" className="size-5 text-utility-blue-600" />
                                    <div>
                                        <p className="text-sm font-semibold text-primary">Record summary</p>
                                        <p className="text-xs text-tertiary">Bound to the form version and program below</p>
                                    </div>
                                </div>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 py-4 text-sm">
                                    <div>
                                        <dt className="text-xs text-tertiary">Program</dt>
                                        <dd className="mt-1 font-semibold text-primary">B747 AQP CQ</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-tertiary">Version</dt>
                                        <dd className="mt-1 font-semibold text-primary">2026.2 · v4.8</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-tertiary">Event</dt>
                                        <dd className="mt-1 font-semibold text-primary">EVT-7412</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-tertiary">Participant</dt>
                                        <dd className="mt-1 font-semibold text-primary">Participant 1842</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="mt-6 flex items-start gap-3 rounded-xl bg-secondary px-4 py-4">
                                <Lock01 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-fg-quaternary" />
                                <p className="text-sm text-tertiary">
                                    Your attestation applies to the exact record shown here. Corrections after submission create a new amendment; they do not
                                    replace this evidence.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                    <Button color="secondary" size="md" onClick={onClose}>
                        {isSubmitted ? "Done" : "Return to form"}
                    </Button>
                    {!isSubmitted && (
                        <Button color="primary" size="md" iconLeading={Send01} isDisabled={!ready} onClick={onSubmit}>
                            Validate and queue
                        </Button>
                    )}
                </div>
            </section>
        </div>
    );
};

export interface B747AQPCQFormRuntimeProps {
    className?: string;
    onExit?: () => void;
    onSubmitted?: (recordId: string) => void;
}

export const B747AQPCQFormRuntime = ({ className, onExit, onSubmitted }: B747AQPCQFormRuntimeProps) => {
    const [attemptsByEventSet, setAttemptsByEventSet] = useState<Record<string, EventAttempt[]>>(seedAttempts);
    const [overallOutcome, setOverallOutcome] = useState<OverallOutcome>("");
    const [overallComments, setOverallComments] = useState("");
    const [instructorAttested, setInstructorAttested] = useState(false);
    const [participantAcknowledged, setParticipantAcknowledged] = useState(false);
    const [activeSectionId, setActiveSectionId] = useState("event-sets");
    const [isOnline, setIsOnline] = useState(true);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [storageReady, setStorageReady] = useState(false);
    const [persistenceError, setPersistenceError] = useState("");
    const runtimePayload = useMemo<StoredRuntimePayload>(
        () => ({
            attemptsByEventSet,
            overallOutcome,
            overallComments,
            instructorAttested,
            participantAcknowledged,
        }),
        [attemptsByEventSet, instructorAttested, overallComments, overallOutcome, participantAcknowledged],
    );
    const saveSnapshot = useMemo(() => JSON.stringify(runtimePayload), [runtimePayload]);
    const [lastSavedSnapshot, setLastSavedSnapshot] = useState(saveSnapshot);
    const saveState: SaveState = !isOnline ? "queued" : saveSnapshot === lastSavedSnapshot ? "saved" : "saving";

    const completedRatingDimensions = syntheticEventSets.reduce((count, definition) => {
        const latestAttempt = attemptsByEventSet[definition.id]?.at(-1);
        return count + (latestAttempt ? Object.values(latestAttempt.assessment.ratings).filter((rating) => rating !== null).length : 0);
    }, 0);
    const requiredRatingDimensions = syntheticEventSets.length * 4;
    const eventSetOutcomesComplete = syntheticEventSets.filter((definition) => attemptsByEventSet[definition.id]?.at(-1)?.outcome === "satisfactory").length;

    const sections = useMemo<RuntimeSection[]>(() => {
        const eventSetCompleted = Math.min(requiredRatingDimensions, completedRatingDimensions) + eventSetOutcomesComplete;
        const eventSetRequired = requiredRatingDimensions + syntheticEventSets.length;
        const overallCompleted = (overallOutcome ? 1 : 0) + (overallComments.trim() ? 1 : 0);
        const signatureCompleted = Number(instructorAttested) + Number(participantAcknowledged);

        return initialRuntimeSections.map((section) => {
            if (section.id === "event-sets") {
                return {
                    ...section,
                    requiredCount: eventSetRequired,
                    completedCount: eventSetCompleted,
                    status: eventSetCompleted === eventSetRequired ? "complete" : "in-progress",
                };
            }
            if (section.id === "overall-assessment") {
                return {
                    ...section,
                    requiredCount: 2,
                    completedCount: overallCompleted,
                    status: overallCompleted === 2 ? "complete" : overallCompleted > 0 ? "in-progress" : "not-started",
                };
            }
            if (section.id === "signatures") {
                return {
                    ...section,
                    completedCount: signatureCompleted,
                    status: signatureCompleted === 2 ? "complete" : signatureCompleted > 0 ? "in-progress" : "not-started",
                };
            }
            return section;
        });
    }, [
        completedRatingDimensions,
        eventSetOutcomesComplete,
        instructorAttested,
        overallComments,
        overallOutcome,
        participantAcknowledged,
        requiredRatingDimensions,
    ]);

    const missingItems = useMemo<RequiredItem[]>(() => {
        const items: RequiredItem[] = [];
        syntheticEventSets.forEach((definition) => {
            const latestAttempt = attemptsByEventSet[definition.id]?.at(-1);
            const unratedCount = latestAttempt ? Object.values(latestAttempt.assessment.ratings).filter((rating) => rating === null).length : 4;
            if (unratedCount > 0) {
                items.push({
                    id: `missing-rating-${definition.id}`,
                    sectionId: "event-sets",
                    label: `${definition.code} rating`,
                    detail: `${unratedCount} performance ${unratedCount === 1 ? "dimension is" : "dimensions are"} not rated.`,
                });
            }
            if (!latestAttempt || latestAttempt.outcome !== "satisfactory") {
                items.push({
                    id: `missing-outcome-${definition.id}`,
                    sectionId: "event-sets",
                    label: `${definition.code} outcome`,
                    detail: "Record a satisfactory final attempt or escalate the repeat cap.",
                });
            }
            (attemptsByEventSet[definition.id] ?? []).forEach((attempt) => {
                const hasLowRating = Object.values(attempt.assessment.ratings).some((rating) => rating === 1 || rating === 2);
                if (!hasLowRating || attempt.assessment.comments.trim()) return;
                items.push({
                    id: `missing-comments-${definition.id}-${attempt.id}`,
                    sectionId: "event-sets",
                    label: `${definition.code} attempt ${attempt.number} evidence`,
                    detail: "Comments are required for every preserved attempt with a rating of 1 or 2.",
                });
            });
        });
        if (!overallOutcome) {
            items.push({
                id: "missing-overall-outcome",
                sectionId: "overall-assessment",
                label: "Overall outcome",
                detail: "Select the overall event outcome.",
            });
        }
        if (!overallComments.trim()) {
            items.push({
                id: "missing-overall-comments",
                sectionId: "overall-assessment",
                label: "Overall evidence",
                detail: "Summarize the evidence supporting the outcome.",
            });
        }
        if (!instructorAttested) {
            items.push({
                id: "missing-instructor-attestation",
                sectionId: "signatures",
                label: "Instructor attestation",
                detail: "Review and apply the instructor attestation.",
            });
        }
        if (!participantAcknowledged) {
            items.push({
                id: "missing-participant-ack",
                sectionId: "signatures",
                label: "Participant acknowledgment",
                detail: "Record the participant acknowledgment.",
            });
        }
        return items;
    }, [attemptsByEventSet, instructorAttested, overallComments, overallOutcome, participantAcknowledged]);

    useEffect(() => {
        let cancelled = false;

        const restoreDraft = async () => {
            try {
                const draft = await loadOfflineDraft(RUNTIME_DRAFT_ID);
                if (cancelled || !draft || !isStoredRuntimePayload(draft.payload)) return;

                setAttemptsByEventSet(draft.payload.attemptsByEventSet);
                setOverallOutcome(draft.payload.overallOutcome);
                setOverallComments(draft.payload.overallComments);
                setInstructorAttested(draft.payload.instructorAttested);
                setParticipantAcknowledged(draft.payload.participantAcknowledged);
            } catch (error) {
                if (!cancelled) {
                    setPersistenceError(error instanceof Error ? error.message : "The browser draft could not be restored.");
                }
            } finally {
                if (!cancelled) setStorageReady(true);
            }
        };

        void restoreDraft();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!storageReady || saveSnapshot === lastSavedSnapshot) return;

        const timer = window.setTimeout(() => {
            void saveOfflineDraft({
                id: RUNTIME_DRAFT_ID,
                eventId: RUNTIME_EVENT_ID,
                formVersionId: RUNTIME_FORM_VERSION_ID,
                payload: runtimePayload,
                state: "draft",
                revision: Date.now(),
                updatedAt: new Date().toISOString(),
            })
                .then(() => {
                    setLastSavedSnapshot(saveSnapshot);
                    setPersistenceError("");
                })
                .catch((error: unknown) => {
                    setPersistenceError(error instanceof Error ? error.message : "The browser draft could not be saved.");
                });
        }, 650);

        return () => window.clearTimeout(timer);
    }, [lastSavedSnapshot, runtimePayload, saveSnapshot, storageReady]);

    const goToSection = (sectionId: string) => {
        setActiveSectionId(sectionId);
        document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const submit = async () => {
        if (missingItems.length > 0) return;

        try {
            await saveOfflineDraft({
                id: RUNTIME_DRAFT_ID,
                eventId: RUNTIME_EVENT_ID,
                formVersionId: RUNTIME_FORM_VERSION_ID,
                payload: runtimePayload,
                state: "ready",
                revision: Date.now(),
                updatedAt: new Date().toISOString(),
            });
            await queueOfflineMutation({
                aggregateId: RUNTIME_DRAFT_ID,
                operation: "submit-form-instance",
                payload: runtimePayload,
            });
            setPersistenceError("");
            setIsSubmitted(true);
            onSubmitted?.("FRM-260730-021");
        } catch (error) {
            setPersistenceError(error instanceof Error ? error.message : "The submission could not be queued.");
        }
    };

    if (!storageReady) {
        return (
            <div className={cx("flex min-h-[60vh] items-center justify-center bg-secondary p-6", className)} role="status" aria-live="polite">
                <div className="rounded-xl border border-secondary bg-primary px-5 py-4 text-center shadow-xs">
                    <RefreshCw01 aria-hidden="true" className="mx-auto size-5 animate-spin text-utility-blue-600" />
                    <p className="mt-3 text-sm font-semibold text-primary">Restoring browser draft</p>
                    <p className="mt-1 text-xs text-tertiary">The form opens after local state has been checked.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cx("min-h-screen bg-secondary", className)}>
            <header className="sticky top-[72px] z-20 border-b border-[#235985] bg-[#003b70] text-white shadow-sm">
                <div className="flex min-h-16 items-center gap-3 px-3 sm:px-5">
                    <Button color="tertiary" size="sm" iconLeading={ArrowLeft} className="text-white hover:bg-white/10 hover:text-white" onClick={onExit}>
                        <span className="hidden sm:inline">My events</span>
                    </Button>
                    <div className="h-7 w-px bg-white/20" />
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                            <h1 className="truncate text-sm font-semibold text-white sm:text-md">CQ evaluation · Participant 1842</h1>
                            <Badge color="blue" size="sm" className="hidden bg-white/12 text-white ring-white/20 sm:flex">
                                B747 AQP CQ
                            </Badge>
                            <Badge color="gray" size="sm" className="hidden bg-white/12 text-white ring-white/20 md:flex">
                                v4.8
                            </Badge>
                        </div>
                        <p className="truncate text-xs text-white/70">EVT-7412 · Jul 30, 2026 · Training Center Bay 4</p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsOnline((online) => !online)}
                        className="flex min-h-10 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white sm:px-3"
                        aria-label={isOnline ? "Switch to offline preview" : "Reconnect form"}
                    >
                        {isOnline ? (
                            <Wifi aria-hidden="true" className="size-4 text-[#87d0ff]" />
                        ) : (
                            <WifiOff aria-hidden="true" className="size-4 text-[#ffc46b]" />
                        )}
                        <span className="hidden sm:block">
                            <span className="block text-xs font-semibold">{isOnline ? "Online" : "Offline"}</span>
                            <span className="block text-[11px] text-white/65">{isOnline ? "Tap to preview offline" : "Changes stay on device"}</span>
                        </span>
                    </button>

                    <div className="hidden h-7 w-px bg-white/20 sm:block" />
                    <div className="hidden items-center gap-2 sm:flex">
                        {saveState === "saving" ? (
                            <RefreshCw01 aria-hidden="true" className="size-4 animate-spin text-[#87d0ff]" />
                        ) : saveState === "queued" ? (
                            <Cloud01 aria-hidden="true" className="size-4 text-[#ffc46b]" />
                        ) : (
                            <Save01 aria-hidden="true" className="size-4 text-[#70d6a4]" />
                        )}
                        <span>
                            <span className="block text-xs font-semibold">{saveCopy[saveState].label}</span>
                            <span className="hidden text-[11px] text-white/65 lg:block">{saveCopy[saveState].detail}</span>
                        </span>
                    </div>

                    <Button color="secondary" size="sm" className="bg-white text-[#003b70] ring-white hover:bg-[#e9f5ff]" onClick={() => setReviewOpen(true)}>
                        Review
                        <ChevronRight aria-hidden="true" className="size-4" />
                    </Button>
                </div>

                <div className="overflow-x-auto border-t border-white/15 bg-[#003561] px-3 py-2 lg:hidden">
                    <SectionNavigator orientation="horizontal" sections={sections} activeSectionId={activeSectionId} onSelectSection={goToSection} />
                </div>
            </header>

            {persistenceError && (
                <div role="alert" className="border-b border-utility-red-200 bg-utility-red-50 px-4 py-2.5 text-sm text-utility-red-700">
                    Browser persistence is unavailable: {persistenceError} Keep this screen open and do not treat the record as submitted.
                </div>
            )}

            {!isOnline && (
                <div className="border-b border-utility-orange-200 bg-utility-orange-50 px-4 py-2.5 text-utility-orange-700">
                    <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 text-sm">
                        <span className="flex items-center gap-2">
                            <WifiOff aria-hidden="true" className="size-4 shrink-0" />
                            Offline preview: ratings and notes are stored in this browser. Use synthetic data only until an approved device-encryption policy
                            exists.
                        </span>
                        <button type="button" className="shrink-0 font-semibold underline underline-offset-2" onClick={() => setIsOnline(true)}>
                            Reconnect
                        </button>
                    </div>
                </div>
            )}

            <main className="mx-auto grid max-w-[1500px] gap-5 px-3 py-5 sm:px-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start xl:grid-cols-[280px_minmax(0,1fr)]">
                <RequiredItemsTray
                    sections={sections}
                    activeSectionId={activeSectionId}
                    onSelectSection={goToSection}
                    missingItems={missingItems}
                    className="sticky top-21 hidden max-h-[calc(100vh-104px)] overflow-y-auto lg:block"
                />

                <div className="min-w-0 space-y-5">
                    <section id="event-context" className="scroll-mt-28 rounded-xl border border-secondary bg-primary shadow-xs">
                        <div className="flex flex-col gap-3 border-b border-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-utility-blue-700 uppercase">Bound event record</p>
                                <h2 className="mt-1 text-lg font-semibold text-primary">Event context</h2>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-medium text-utility-green-700">
                                <ShieldTick aria-hidden="true" className="size-4" />
                                Program resolved
                            </div>
                        </div>
                        <dl className="grid gap-px overflow-hidden rounded-b-xl bg-border-secondary sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                ["Event", "EVT-7412"],
                                ["Participant", "Participant 1842"],
                                ["Instructor", "Instructor 046"],
                                ["Session", "Jul 30 · 18:30–22:15"],
                                ["Aircraft", "B747 fleet"],
                                ["Program", "AQP continuing qualification"],
                                ["Curriculum", "2026.2"],
                                ["Form version", "v4.8 · Effective Jul 1"],
                            ].map(([label, value]) => (
                                <div key={label} className="bg-primary px-4 py-3">
                                    <dt className="text-xs font-medium text-tertiary">{label}</dt>
                                    <dd className="mt-1 text-sm font-semibold text-primary">{value}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section id="event-sets" className="scroll-mt-28 space-y-4">
                        <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold tracking-wide text-utility-blue-700 uppercase">Section 2</p>
                                <h2 className="mt-1 text-xl font-semibold text-primary">Event set assessments</h2>
                                <p className="mt-1 text-sm text-tertiary">
                                    Rate observed performance. Repeat attempts are appended and never overwrite earlier evidence.
                                </p>
                            </div>
                            <span className="text-xs font-medium text-tertiary">
                                {eventSetOutcomesComplete}/{syntheticEventSets.length} event sets complete
                            </span>
                        </div>

                        {syntheticEventSets.map((definition, index) => (
                            <EventSetBlock
                                key={definition.id}
                                definition={definition}
                                attempts={attemptsByEventSet[definition.id] ?? []}
                                onAttemptsChange={(nextAttempts) =>
                                    setAttemptsByEventSet((current) => ({
                                        ...current,
                                        [definition.id]: nextAttempts,
                                    }))
                                }
                                defaultExpanded={index === 0}
                            />
                        ))}
                    </section>

                    <section id="overall-assessment" className="scroll-mt-28 rounded-xl border border-secondary bg-primary shadow-xs">
                        <div className="border-b border-secondary px-4 py-4 sm:px-5">
                            <p className="text-xs font-semibold tracking-wide text-utility-blue-700 uppercase">Section 3</p>
                            <h2 className="mt-1 text-lg font-semibold text-primary">Overall assessment</h2>
                            <p className="mt-1 text-sm text-tertiary">Base the outcome on evidence captured across the complete event.</p>
                        </div>
                        <div className="space-y-5 px-4 py-5 sm:px-5">
                            <fieldset>
                                <legend className="text-sm font-semibold text-primary">
                                    Event outcome <span className="text-utility-red-600">*</span>
                                </legend>
                                <div className="mt-3 grid gap-3 md:grid-cols-3">
                                    {outcomeOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type="button"
                                            aria-pressed={overallOutcome === option.value}
                                            onClick={() => setOverallOutcome(option.value)}
                                            className={cx(
                                                "flex min-h-24 items-start gap-3 rounded-xl border p-4 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-utility-blue-500 focus-visible:ring-offset-2",
                                                overallOutcome === option.value
                                                    ? "border-utility-blue-500 bg-utility-blue-50 ring-1 ring-utility-blue-500"
                                                    : "border-secondary bg-primary hover:border-utility-blue-300 hover:bg-primary_hover",
                                            )}
                                        >
                                            <span
                                                className={cx(
                                                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border",
                                                    overallOutcome === option.value
                                                        ? "border-utility-blue-600 bg-utility-blue-600 text-white"
                                                        : "border-secondary bg-primary",
                                                )}
                                            >
                                                {overallOutcome === option.value && <Check aria-hidden="true" className="size-3.5" />}
                                            </span>
                                            <span>
                                                <span className="block text-sm font-semibold text-primary">{option.label}</span>
                                                <span className="mt-1 block text-xs text-tertiary">{option.description}</span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </fieldset>

                            <TextArea
                                label="Overall evidence"
                                isRequired
                                value={overallComments}
                                onChange={setOverallComments}
                                rows={4}
                                placeholder="Summarize the observable behaviors that support the outcome…"
                                hint="This summary is included in the final record and quality-control review."
                            />
                        </div>
                    </section>

                    <section id="signatures" className="scroll-mt-28 rounded-xl border border-secondary bg-primary shadow-xs">
                        <div className="border-b border-secondary px-4 py-4 sm:px-5">
                            <p className="text-xs font-semibold tracking-wide text-utility-blue-700 uppercase">Section 4</p>
                            <h2 className="mt-1 text-lg font-semibold text-primary">Attestations</h2>
                            <p className="mt-1 text-sm text-tertiary">
                                Attestations are bound to this record version. This proof of concept does not capture production credentials.
                            </p>
                        </div>
                        <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-2">
                            <label
                                className={cx(
                                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
                                    instructorAttested ? "border-utility-green-300 bg-utility-green-50" : "border-secondary hover:bg-primary_hover",
                                )}
                            >
                                <input
                                    type="checkbox"
                                    className="mt-1 size-4 accent-utility-blue-600"
                                    checked={instructorAttested}
                                    onChange={(event) => setInstructorAttested(event.target.checked)}
                                />
                                <span>
                                    <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                                        Instructor attestation
                                        {instructorAttested && <CheckCircle aria-hidden="true" className="size-4 text-utility-green-600" />}
                                    </span>
                                    <span className="mt-1 block text-xs text-tertiary">
                                        I attest that the ratings and comments accurately reflect the observed event.
                                    </span>
                                    <span className="mt-3 block text-xs font-medium text-secondary">Instructor 046 · Authenticated session</span>
                                </span>
                            </label>

                            <label
                                className={cx(
                                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition",
                                    participantAcknowledged ? "border-utility-green-300 bg-utility-green-50" : "border-secondary hover:bg-primary_hover",
                                )}
                            >
                                <input
                                    type="checkbox"
                                    className="mt-1 size-4 accent-utility-blue-600"
                                    checked={participantAcknowledged}
                                    onChange={(event) => setParticipantAcknowledged(event.target.checked)}
                                />
                                <span>
                                    <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                                        Participant acknowledgment
                                        {participantAcknowledged && <CheckCircle aria-hidden="true" className="size-4 text-utility-green-600" />}
                                    </span>
                                    <span className="mt-1 block text-xs text-tertiary">
                                        The participant acknowledges that the debrief and outcome were presented.
                                    </span>
                                    <span className="mt-3 block text-xs font-medium text-secondary">Participant 1842 · In-person acknowledgment</span>
                                </span>
                            </label>
                        </div>
                    </section>

                    <div className="flex flex-col gap-3 rounded-xl border border-secondary bg-primary p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-5">
                        <div className="flex items-start gap-3">
                            {missingItems.length === 0 ? (
                                <CheckCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-utility-green-600" />
                            ) : (
                                <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-utility-orange-600" />
                            )}
                            <div>
                                <p className="text-sm font-semibold text-primary">
                                    {missingItems.length === 0 ? "Ready for final review" : `${missingItems.length} required items remain`}
                                </p>
                                <p className="mt-0.5 text-xs text-tertiary">Review shows every missing item before the record can be locked.</p>
                            </div>
                        </div>
                        <Button color="primary" size="md" iconLeading={FileCheck03} onClick={() => setReviewOpen(true)}>
                            Review submission
                        </Button>
                    </div>
                </div>
            </main>

            <SubmitReview isOpen={reviewOpen} missingItems={missingItems} onClose={() => setReviewOpen(false)} onSubmit={submit} isSubmitted={isSubmitted} />
        </div>
    );
};
