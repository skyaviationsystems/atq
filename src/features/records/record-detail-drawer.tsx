"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, CheckCircle, FileCheck02, User01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { StatusBadge, type StatusTone } from "@/features/modules/module-ui";
import type { QualificationRecord, TrainingPerson, TrainingRecord } from "./types";

interface RecordDetailDrawerProps {
    record?: TrainingRecord;
    qualification?: QualificationRecord;
    person?: TrainingPerson;
    onClose: () => void;
    onOpenPerson: (personId: string) => void;
}

const titleCase = (value: string) =>
    value
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

const statusTone = (value: string): StatusTone => {
    if (["current", "satisfactory", "credited", "approved"].includes(value)) return "green";
    if (["expiring", "in-progress", "submitted", "qc-review", "incomplete"].includes(value)) return "amber";
    if (["expired", "suspended", "unsatisfactory", "voided", "qc-returned"].includes(value)) return "red";
    return "blue";
};

const formatDate = (value?: string) => {
    if (!value) return "Not established";
    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
};

const DetailRow = ({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) => (
    <div className="grid gap-1 border-b border-secondary py-3 last:border-0 sm:grid-cols-[150px_minmax(0,1fr)] sm:gap-4">
        <dt className="text-xs font-semibold tracking-wide text-quaternary uppercase">{label}</dt>
        <dd className={mono ? "font-mono text-xs font-semibold text-secondary" : "text-sm text-secondary"}>{value}</dd>
    </div>
);

const EvidenceStep = ({ label, title, detail }: { label: string; title: string; detail: string }) => (
    <li className="relative flex gap-3 pb-5 last:pb-0">
        <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-utility-blue-50 text-utility-blue-700 ring-1 ring-utility-blue-200">
            <CheckCircle aria-hidden="true" className="size-4" />
        </span>
        <div className="min-w-0 pt-0.5">
            <p className="text-[11px] font-semibold tracking-wide text-quaternary uppercase">{label}</p>
            <p className="mt-0.5 text-sm font-semibold text-primary">{title}</p>
            <p className="mt-0.5 text-xs text-tertiary">{detail}</p>
        </div>
        <span aria-hidden="true" className="absolute top-8 bottom-0 left-[15px] w-px bg-border-secondary last:hidden" />
    </li>
);

export function RecordDetailDrawer({ record, qualification, person, onClose, onOpenPerson }: RecordDetailDrawerProps) {
    const closeRef = useRef<HTMLButtonElement>(null);
    const returnFocusRef = useRef<HTMLElement | null>(null);
    const isOpen = Boolean(record || qualification);

    useEffect(() => {
        if (!isOpen) return;

        returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const frame = window.requestAnimationFrame(() => closeRef.current?.focus());
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", closeOnEscape);

        return () => {
            window.cancelAnimationFrame(frame);
            document.removeEventListener("keydown", closeOnEscape);
            window.requestAnimationFrame(() => returnFocusRef.current?.focus());
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const resolvedPersonId = record?.personId ?? qualification?.personId ?? person?.id;
    const drawerTitle = qualification?.title ?? record?.taskTitle ?? "Training record";
    const drawerEyebrow = qualification ? "Qualification evidence" : "Training record";

    return (
        <div
            className="fixed inset-0 z-[90] flex justify-end bg-[#061b36]/55 backdrop-blur-[2px]"
            role="presentation"
            onMouseDown={(event) => {
                if (event.currentTarget === event.target) onClose();
            }}
        >
            <aside
                role="dialog"
                aria-modal="true"
                aria-labelledby="record-detail-title"
                className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-primary shadow-2xl"
            >
                <header className="flex shrink-0 items-start gap-4 border-b border-secondary px-5 py-5 md:px-6">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-utility-blue-50 text-utility-blue-700 ring-1 ring-utility-blue-200">
                        {qualification ? <FileCheck02 aria-hidden="true" className="size-5" /> : <User01 aria-hidden="true" className="size-5" />}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold tracking-[0.1em] text-brand-secondary uppercase">{drawerEyebrow}</p>
                        <h2 id="record-detail-title" className="mt-1 text-lg font-semibold text-primary">
                            {drawerTitle}
                        </h2>
                        <p className="mt-1 text-sm text-tertiary">
                            {person?.displayName ?? record?.personName} · Employee {person?.employeeNumber ?? record?.employeeNumber}
                        </p>
                    </div>
                    <button
                        ref={closeRef}
                        type="button"
                        onClick={onClose}
                        aria-label="Close record details"
                        className="rounded-lg p-2 text-fg-quaternary outline-focus-ring hover:bg-secondary hover:text-fg-secondary focus-visible:outline-2"
                    >
                        <XClose aria-hidden="true" className="size-5" />
                    </button>
                </header>

                {resolvedPersonId && (
                    <div className="shrink-0 border-b border-secondary bg-primary px-5 py-3 sm:hidden">
                        <Button
                            className="w-full"
                            size="sm"
                            iconTrailing={ArrowRight}
                            onPress={() => {
                                onClose();
                                onOpenPerson(resolvedPersonId);
                            }}
                        >
                            Open person profile
                        </Button>
                    </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto bg-secondary px-5 pt-5 pb-40 md:px-6">
                    {qualification && (
                        <section className="rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="font-mono text-xs font-semibold text-brand-secondary">{qualification.requirementCode}</p>
                                    <p className="mt-1 text-sm font-semibold text-primary">{qualification.title}</p>
                                </div>
                                <StatusBadge tone={statusTone(qualification.status)}>{titleCase(qualification.status)}</StatusBadge>
                            </div>
                            <dl className="mt-4 border-t border-secondary">
                                <DetailRow label="Last completed" value={formatDate(qualification.lastCompletedDate)} />
                                <DetailRow label="Next due" value={formatDate(qualification.nextDueDate ?? qualification.expirationDate)} />
                                <DetailRow label="Source form" value={qualification.sourceFormName ?? qualification.sourceFormId ?? "No source form linked"} />
                                <DetailRow label="Calculation" value={qualification.calculationSummary} />
                            </dl>
                        </section>
                    )}

                    {record && (
                        <>
                            <section className="rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="font-mono text-xs font-semibold text-brand-secondary">{record.recordNumber}</p>
                                        <p className="mt-1 text-sm font-semibold text-primary">{record.taskTitle}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <StatusBadge tone={statusTone(record.outcome)}>{titleCase(record.outcome)}</StatusBadge>
                                        <StatusBadge tone={statusTone(record.formState)}>{titleCase(record.formState)}</StatusBadge>
                                    </div>
                                </div>
                                <dl className="mt-4 border-t border-secondary">
                                    <DetailRow label="Completed" value={formatDate(record.eventDate)} />
                                    <DetailRow label="Task / Vision ID" value={`${record.taskId} / ${record.visionTaskId}`} mono />
                                    <DetailRow label="Outline location" value={record.outlineNumber} mono />
                                    <DetailRow label="Instructor" value={record.instructorName} />
                                    <DetailRow label="Device" value={`${record.deviceCode} · ${record.deviceType}`} />
                                    <DetailRow label="Attempt" value={String(record.attempt)} />
                                    {typeof record.score === "number" && (
                                        <DetailRow label="Score" value={record.score <= 5 ? `${record.score} / 5` : `${record.score}%`} />
                                    )}
                                    {record.remarks && <DetailRow label="Remarks" value={record.remarks} />}
                                </dl>
                            </section>

                            <section className="mt-5 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary">
                                <h3 className="text-sm font-semibold text-primary">Evidence chain</h3>
                                <p className="mt-1 text-xs text-tertiary">Stable links from the selected person through the qualification effect.</p>
                                <ol className="mt-5">
                                    <EvidenceStep
                                        label="Person"
                                        title={`${record.personName} · ${record.employeeNumber}`}
                                        detail={`${record.fleetCode}/${record.seatCode} · ${record.baseCode} · ${record.programType}`}
                                    />
                                    <EvidenceStep
                                        label="Task"
                                        title={`${record.taskId} · ${record.taskTitle}`}
                                        detail={`Vision ${record.visionTaskId} · outline ${record.outlineNumber}`}
                                    />
                                    <EvidenceStep
                                        label="Curriculum"
                                        title={`${record.curriculumCode} · ${record.curriculumTitle}`}
                                        detail={`${record.curriculumVersion} · ${record.moduleCode} ${record.moduleTitle}`}
                                    />
                                    <EvidenceStep
                                        label="Event"
                                        title={`${record.eventId} · ${record.eventType}`}
                                        detail={`${formatDate(record.eventDate)} · ${record.eventLocation}`}
                                    />
                                    <EvidenceStep
                                        label="Source form"
                                        title={`${record.formId} · ${record.formName}`}
                                        detail={`${titleCase(record.formState)} · attempt ${record.attempt}`}
                                    />
                                    <EvidenceStep
                                        label="Qualification effect"
                                        title={titleCase(record.qualificationEffect.type)}
                                        detail={record.qualificationEffect.explanation}
                                    />
                                </ol>
                            </section>
                        </>
                    )}
                </div>

                <footer className="absolute right-0 bottom-0 left-0 z-50 flex flex-wrap items-center justify-between gap-3 border-t border-secondary bg-primary px-5 py-4 md:px-6">
                    <p className="text-xs text-quaternary">Synthetic POC evidence · source lineage preserved</p>
                    <div className="flex gap-2">
                        <Button size="sm" color="secondary" onPress={onClose}>
                            Close
                        </Button>
                        {resolvedPersonId && (
                            <Button
                                className="max-sm:hidden"
                                size="sm"
                                iconTrailing={ArrowRight}
                                onPress={() => {
                                    onClose();
                                    onOpenPerson(resolvedPersonId);
                                }}
                            >
                                Open person profile
                            </Button>
                        )}
                    </div>
                </footer>
            </aside>
        </div>
    );
}
