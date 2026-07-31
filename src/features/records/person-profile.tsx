"use client";

import { useMemo, useState } from "react";
import {
    ActivityHeart,
    AlertCircle,
    ArrowLeft,
    Briefcase01,
    Calendar,
    Certificate01,
    ChevronRight,
    Clock,
    Download01,
    FileCheck02,
    Mail01,
    MarkerPin01,
    Phone01,
    SearchLg,
    ShieldTick,
    XClose,
} from "@untitledui/icons";
import type { IconComponentType } from "@/components/base/badges/badge-types";
import { Button } from "@/components/base/buttons/button";
import { DataTable, MiniStat, ModuleTabs, Panel, ProgressBar, StatusBadge, type StatusTone } from "@/features/modules/module-ui";
import type { QualificationRecord, TrainingPerson, TrainingRecord, TrainingTimelineEntry } from "./types";

export type PersonProfileTab = "overview" | "qualifications" | "training" | "currency" | "timeline";

export interface PersonProfileProps {
    person: TrainingPerson;
    records: readonly TrainingRecord[];
    timeline: readonly TrainingTimelineEntry[];
    initialTab?: PersonProfileTab;
    onBack?: () => void;
    onOpenRecord: (record: TrainingRecord) => void;
    onOpenQualification: (qualification: QualificationRecord) => void;
    onExport?: (person: TrainingPerson) => void;
}

const tabs = [
    { id: "overview", label: "Overview" },
    { id: "qualifications", label: "Qualifications" },
    { id: "training", label: "Training records" },
    { id: "currency", label: "Currency & credentials" },
    { id: "timeline", label: "Timeline" },
] as const;

const sentenceCase = (value: string) =>
    value
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

const formatDate = (value?: string) => {
    if (!value) return undefined;
    const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

const qualificationTone = (status: string): StatusTone => {
    if (status === "current") return "green";
    if (status === "expiring" || status === "in-progress") return "amber";
    if (status === "expired" || status === "suspended" || status === "not-held") return "red";
    return "gray";
};

const outcomeTone = (outcome: string): StatusTone => {
    if (outcome === "satisfactory" || outcome === "credited") return "green";
    if (outcome === "incomplete") return "amber";
    if (outcome === "unsatisfactory") return "red";
    return "gray";
};

const formTone = (state: string): StatusTone => {
    if (state === "approved") return "green";
    if (state === "submitted" || state === "qc-review") return "blue";
    if (state === "qc-returned") return "amber";
    if (state === "voided") return "red";
    return "gray";
};

const timelineTone = (tone: TrainingTimelineEntry["tone"]): StatusTone => {
    if (tone === "success") return "green";
    if (tone === "warning") return "amber";
    if (tone === "danger") return "red";
    return "gray";
};

const maskCredential = (value: string) => {
    const visible = value.slice(-4);
    return value.length > 4 ? `•••• ${visible}` : value;
};

const EmptyState = ({ title, description }: { title: string; description: string }) => (
    <div className="flex flex-col items-center px-5 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-fg-quaternary">
            <FileCheck02 aria-hidden="true" className="size-6" />
        </span>
        <h3 className="mt-4 text-sm font-semibold text-primary">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-tertiary">{description}</p>
    </div>
);

const ProfileField = ({ label, value, icon: Icon }: { label: string; value: string; icon?: IconComponentType }) => (
    <div className="flex min-w-0 items-start gap-3 rounded-lg bg-secondary p-3">
        {Icon && <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-fg-quaternary" />}
        <div className="min-w-0">
            <p className="text-xs font-medium text-quaternary">{label}</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-secondary">{value}</p>
        </div>
    </div>
);

const ProfileOverview = ({
    person,
    records,
    onOpenRecord,
}: {
    person: TrainingPerson;
    records: readonly TrainingRecord[];
    onOpenRecord: (record: TrainingRecord) => void;
}) => {
    const recentRecords = [...records].sort((left, right) => right.eventDate.localeCompare(left.eventDate)).slice(0, 5);
    const activeRestrictions = person.restrictions.filter((restriction) => restriction.status === "active");

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.75fr)]">
            <div className="space-y-5">
                <Panel title="Personal and employment information" description="Proof-of-concept identity fields from synthetic source data.">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <ProfileField label="Employee number" value={person.employeeNumber} icon={Briefcase01} />
                        <ProfileField label="Population" value={sentenceCase(person.population)} icon={Briefcase01} />
                        <ProfileField label="Department" value={person.department} icon={Briefcase01} />
                        <ProfileField label="Fleet / seat" value={`${person.fleetCode} · ${person.seatCode}`} icon={Briefcase01} />
                        <ProfileField label="Base" value={person.baseCode} icon={MarkerPin01} />
                        <ProfileField label="Hire date" value={formatDate(person.hireDate) || person.hireDate} icon={Calendar} />
                        <ProfileField label="Work email" value={person.email} icon={Mail01} />
                        <ProfileField label="Work phone" value={person.phone} icon={Phone01} />
                        <ProfileField label="Employment" value={sentenceCase(person.employmentStatus)} icon={ShieldTick} />
                    </div>
                    <div className="mt-4 flex items-start gap-2 rounded-lg bg-utility-blue-50 p-3 text-xs text-tertiary">
                        <ShieldTick aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-utility-blue-700" />
                        Protected AIMS biographical fields—such as birth details and physical characteristics—are intentionally excluded from this general
                        records view. They require a separate sensitive-person permission and an audited reason for access.
                    </div>
                </Panel>

                <Panel title="Operational assignment" description="Modernized equivalent of the AIMS qualification assignment row.">
                    <dl className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { label: "Main base", value: person.baseCode },
                            { label: "Aircraft", value: person.fleetCode },
                            { label: "Position", value: person.seatCode },
                            {
                                label: "Effective start",
                                value:
                                    formatDate(
                                        person.qualifications
                                            .map((qualification) => qualification.effectiveDate)
                                            .filter((value): value is string => Boolean(value))
                                            .sort()
                                            .at(-1),
                                    ) ?? formatDate(person.hireDate),
                            },
                            { label: "Training qualification", value: person.qualificationState === "in-progress" ? "In progress" : "Yes" },
                            { label: "Primary assignment", value: "Yes" },
                            { label: "Do not schedule", value: person.qualificationState === "suspended" ? "Yes" : "No" },
                            { label: "Secondary bases", value: "None assigned" },
                        ].map((field) => (
                            <div key={field.label}>
                                <dt className="text-xs font-medium text-quaternary">{field.label}</dt>
                                <dd className="mt-1 text-sm font-semibold text-secondary">{field.value}</dd>
                            </div>
                        ))}
                    </dl>
                </Panel>

                <Panel title="Recent training" description="Select a row to inspect the exact event, task, form, and qualification effect." flush>
                    {recentRecords.length > 0 ? (
                        <DataTable
                            label={`Recent training records for ${person.displayName}`}
                            rows={recentRecords}
                            onRowClick={onOpenRecord}
                            columns={[
                                {
                                    id: "event",
                                    label: "Event",
                                    render: (record) => (
                                        <div>
                                            <p className="font-semibold text-primary">{record.eventType}</p>
                                            <p className="mt-0.5 text-xs text-quaternary">
                                                {record.curriculumCode} · v{record.curriculumVersion}
                                            </p>
                                        </div>
                                    ),
                                },
                                {
                                    id: "task",
                                    label: "Task",
                                    render: (record) => (
                                        <div>
                                            <p className="font-medium text-secondary">{record.taskTitle}</p>
                                            <p className="mt-0.5 font-mono text-xs text-quaternary">{record.taskId}</p>
                                        </div>
                                    ),
                                },
                                { id: "date", label: "Date", render: (record) => formatDate(record.eventDate) },
                                {
                                    id: "outcome",
                                    label: "Outcome",
                                    render: (record) => <StatusBadge tone={outcomeTone(record.outcome)}>{sentenceCase(record.outcome)}</StatusBadge>,
                                },
                                {
                                    id: "open",
                                    label: "",
                                    className: "w-12 text-right",
                                    render: () => <ChevronRight aria-hidden="true" className="ml-auto size-5 text-fg-quaternary" />,
                                },
                            ]}
                        />
                    ) : (
                        <EmptyState
                            title="No training records yet"
                            description="Training events for this person will appear here when records are available."
                        />
                    )}
                </Panel>
            </div>

            <div className="space-y-5">
                <Panel title="Qualification summary">
                    <div className="grid grid-cols-2 gap-3">
                        <MiniStat
                            label="Overall status"
                            value={sentenceCase(person.qualificationState)}
                            tone={
                                person.qualificationState === "current"
                                    ? "success"
                                    : person.qualificationState === "expiring" || person.qualificationState === "in-progress"
                                      ? "warning"
                                      : "error"
                            }
                        />
                        <MiniStat label="Next due" value={formatDate(person.nextDueDate) || "Not scheduled"} />
                        <MiniStat label="Qualifications" value={person.qualifications.length.toLocaleString()} />
                        <MiniStat
                            label="Restrictions"
                            value={activeRestrictions.length ? activeRestrictions.length.toLocaleString() : "None"}
                            tone={activeRestrictions.length ? "warning" : "success"}
                        />
                    </div>
                </Panel>

                <Panel title="Record completeness" description="Evidence available for this person’s training jacket.">
                    <ProgressBar
                        label="Jacket completeness"
                        value={person.recordCompleteness}
                        tone={person.recordCompleteness === 100 ? "green" : person.recordCompleteness >= 90 ? "amber" : "red"}
                    />
                    <p className="mt-3 text-xs text-quaternary">
                        Review qualifications and training records to inspect the evidence behind each calculated status.
                    </p>
                </Panel>

                <Panel title="Program assignment" description={`${person.programCode} · ${person.programName}`}>
                    <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-utility-blue-50 text-utility-blue-700 ring-1 ring-utility-blue-200">
                            <ActivityHeart aria-hidden="true" className="size-5" />
                        </span>
                        <div>
                            <StatusBadge tone={person.programType === "AQP" ? "blue" : "purple"}>
                                {person.programType === "NO" ? "N&O" : person.programType}
                            </StatusBadge>
                            <p className="mt-2 text-sm font-semibold text-primary">{person.programName}</p>
                            <p className="mt-1 text-xs text-tertiary">This assignment is the governing program shown on the synthetic training profile.</p>
                        </div>
                    </div>
                </Panel>
            </div>
        </div>
    );
};

const QualificationsTab = ({ person, onOpenQualification }: { person: TrainingPerson; onOpenQualification: (qualification: QualificationRecord) => void }) => (
    <Panel title="Qualifications" description="Every status links to its requirement, source record, source form, and calculation explanation." flush>
        {person.qualifications.length > 0 ? (
            <DataTable
                label={`Qualifications for ${person.displayName}`}
                rows={person.qualifications}
                onRowClick={onOpenQualification}
                columns={[
                    {
                        id: "requirement",
                        label: "Requirement",
                        render: (qualification) => (
                            <div>
                                <p className="font-semibold text-primary">{qualification.title}</p>
                                <p className="mt-0.5 font-mono text-xs text-quaternary">{qualification.requirementCode}</p>
                            </div>
                        ),
                    },
                    {
                        id: "status",
                        label: "Status",
                        render: (qualification) => (
                            <StatusBadge tone={qualificationTone(qualification.status)}>{sentenceCase(qualification.status)}</StatusBadge>
                        ),
                    },
                    {
                        id: "completed",
                        label: "Last completed",
                        render: (qualification) => formatDate(qualification.lastCompletedDate) || <span className="text-quaternary">No completion</span>,
                    },
                    {
                        id: "due",
                        label: "Next due",
                        render: (qualification) => formatDate(qualification.nextDueDate) || <span className="text-quaternary">No due date</span>,
                    },
                    {
                        id: "evidence",
                        label: "Source evidence",
                        render: (qualification) =>
                            qualification.sourceFormName || qualification.sourceRecordId ? (
                                <div>
                                    <p className="font-medium text-secondary">{qualification.sourceFormName || "Training record"}</p>
                                    <p className="mt-0.5 font-mono text-xs text-quaternary">{qualification.sourceFormId || qualification.sourceRecordId}</p>
                                </div>
                            ) : (
                                <span className="text-warning-primary">Evidence not linked</span>
                            ),
                    },
                    {
                        id: "open",
                        label: "",
                        className: "w-12 text-right",
                        render: () => <ChevronRight aria-hidden="true" className="ml-auto size-5 text-fg-quaternary" />,
                    },
                ]}
            />
        ) : (
            <EmptyState title="No qualifications found" description="No qualification requirements are currently associated with this person." />
        )}
    </Panel>
);

const TrainingRecordsTab = ({
    person,
    records,
    onOpenRecord,
}: {
    person: TrainingPerson;
    records: readonly TrainingRecord[];
    onOpenRecord: (record: TrainingRecord) => void;
}) => {
    const [query, setQuery] = useState("");
    const filteredRecords = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return records;

        return records.filter((record) =>
            [
                record.recordNumber,
                record.taskId,
                record.taskTitle,
                record.curriculumCode,
                record.curriculumTitle,
                record.moduleCode,
                record.eventType,
                record.formName,
                record.instructorName,
                record.deviceCode,
            ].some((value) => value.toLowerCase().includes(normalizedQuery)),
        );
    }, [query, records]);

    return (
        <Panel
            title="Training records"
            description={`${filteredRecords.length.toLocaleString()} of ${records.length.toLocaleString()} records shown for ${person.displayName}`}
            action={
                <label className="relative block w-full sm:w-72">
                    <span className="sr-only">Search this person’s training records</span>
                    <SearchLg aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-quaternary" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Task, curriculum, form, event"
                        className="h-9 w-full rounded-lg bg-primary py-2 pr-9 pl-9 text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                    />
                    {query && (
                        <button
                            type="button"
                            aria-label="Clear training record search"
                            onClick={() => setQuery("")}
                            className="absolute top-1/2 right-1 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-fg-quaternary outline-focus-ring hover:bg-secondary focus-visible:outline-2"
                        >
                            <XClose aria-hidden="true" className="size-4" />
                        </button>
                    )}
                </label>
            }
            flush
        >
            {filteredRecords.length > 0 ? (
                <DataTable
                    label={`Training records for ${person.displayName}`}
                    rows={filteredRecords}
                    onRowClick={onOpenRecord}
                    columns={[
                        {
                            id: "record",
                            label: "Record / date",
                            render: (record) => (
                                <div>
                                    <p className="font-mono text-xs font-semibold text-primary">{record.recordNumber}</p>
                                    <p className="mt-0.5 text-xs text-quaternary">{formatDate(record.eventDate)}</p>
                                </div>
                            ),
                        },
                        {
                            id: "event",
                            label: "Event / curriculum",
                            render: (record) => (
                                <div>
                                    <p className="font-semibold text-primary">{record.eventType}</p>
                                    <p className="mt-0.5 text-xs text-quaternary">
                                        {record.curriculumCode} · v{record.curriculumVersion}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            id: "task",
                            label: "Task",
                            render: (record) => (
                                <div>
                                    <p className="font-medium text-secondary">{record.taskTitle}</p>
                                    <p className="mt-0.5 font-mono text-xs text-quaternary">
                                        {record.taskId} · outline {record.outlineNumber}
                                    </p>
                                </div>
                            ),
                        },
                        {
                            id: "form",
                            label: "Form",
                            render: (record) => (
                                <div>
                                    <p className="font-medium text-secondary">{record.formName}</p>
                                    <StatusBadge tone={formTone(record.formState)}>{sentenceCase(record.formState)}</StatusBadge>
                                </div>
                            ),
                        },
                        {
                            id: "outcome",
                            label: "Outcome",
                            render: (record) => <StatusBadge tone={outcomeTone(record.outcome)}>{sentenceCase(record.outcome)}</StatusBadge>,
                        },
                        {
                            id: "open",
                            label: "",
                            className: "w-12 text-right",
                            render: () => <ChevronRight aria-hidden="true" className="ml-auto size-5 text-fg-quaternary" />,
                        },
                    ]}
                />
            ) : (
                <EmptyState
                    title={records.length ? "No records match that search" : "No training records yet"}
                    description={
                        records.length
                            ? "Try a task ID, curriculum, form, event, instructor, or device."
                            : "Training events for this person will appear here when records are available."
                    }
                />
            )}
        </Panel>
    );
};

const CurrencyAndCredentialsTab = ({
    person,
    onOpenQualification,
}: {
    person: TrainingPerson;
    onOpenQualification: (qualification: QualificationRecord) => void;
}) => {
    const currency = person.qualifications.filter((qualification) => qualification.category === "currency");
    const activeRestrictions = person.restrictions.filter((restriction) => restriction.status === "active");

    return (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="space-y-5">
                <Panel title="Currency requirements" description="Open a requirement to inspect its due-date calculation and source evidence." flush>
                    {currency.length > 0 ? (
                        <DataTable
                            label={`Currency requirements for ${person.displayName}`}
                            rows={currency}
                            onRowClick={onOpenQualification}
                            columns={[
                                {
                                    id: "requirement",
                                    label: "Requirement",
                                    render: (qualification) => (
                                        <div>
                                            <p className="font-semibold text-primary">{qualification.title}</p>
                                            <p className="mt-0.5 font-mono text-xs text-quaternary">{qualification.requirementCode}</p>
                                        </div>
                                    ),
                                },
                                {
                                    id: "status",
                                    label: "Status",
                                    render: (qualification) => (
                                        <StatusBadge tone={qualificationTone(qualification.status)}>{sentenceCase(qualification.status)}</StatusBadge>
                                    ),
                                },
                                {
                                    id: "lastDone",
                                    label: "Last done",
                                    render: (qualification) => formatDate(qualification.lastCompletedDate) || "—",
                                },
                                {
                                    id: "baseMonth",
                                    label: "Base month",
                                    render: (qualification) =>
                                        qualification.baseMonth
                                            ? new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(2026, qualification.baseMonth - 1, 1))
                                            : "—",
                                },
                                { id: "due", label: "Next due", render: (qualification) => formatDate(qualification.nextDueDate) || "—" },
                                {
                                    id: "grace",
                                    label: "Grace date",
                                    render: (qualification) => formatDate(qualification.graceDate) || "—",
                                },
                                {
                                    id: "planned",
                                    label: "Next planned",
                                    render: (qualification) => formatDate(qualification.nextPlannedDate) || "—",
                                },
                                {
                                    id: "open",
                                    label: "",
                                    className: "w-12 text-right",
                                    render: () => <ChevronRight aria-hidden="true" className="ml-auto size-5 text-fg-quaternary" />,
                                },
                            ]}
                        />
                    ) : (
                        <EmptyState title="No currency requirements" description="No current currency rules are associated with this person." />
                    )}
                </Panel>

                <Panel title="Restrictions and limitations" description="Active restrictions are shown first.">
                    {person.restrictions.length > 0 ? (
                        <div className="space-y-3">
                            {[...person.restrictions]
                                .sort((left, right) => Number(right.status === "active") - Number(left.status === "active"))
                                .map((restriction) => (
                                    <article key={restriction.id} className="rounded-lg bg-secondary p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-primary">
                                                    {restriction.code} · {restriction.title}
                                                </p>
                                                <p className="mt-1 text-sm text-tertiary">{restriction.description}</p>
                                            </div>
                                            <StatusBadge tone={restriction.status === "active" ? "red" : "green"}>
                                                {sentenceCase(restriction.status)}
                                            </StatusBadge>
                                        </div>
                                        <p className="mt-3 text-xs text-quaternary">
                                            Effective {formatDate(restriction.effectiveDate)}
                                            {restriction.clearedDate ? ` · Cleared ${formatDate(restriction.clearedDate)}` : ""}
                                        </p>
                                    </article>
                                ))}
                        </div>
                    ) : (
                        <p className="text-sm text-tertiary">No restrictions or limitations are recorded for this person.</p>
                    )}
                    {activeRestrictions.length > 0 && (
                        <div className="mt-4 flex items-start gap-2 rounded-lg bg-utility-red-50 p-3 text-sm text-error-primary">
                            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                            {activeRestrictions.length} active {activeRestrictions.length === 1 ? "restriction requires" : "restrictions require"} review.
                        </div>
                    )}
                </Panel>
            </div>

            <Panel title="Certificates and credentials" description="Sensitive numbers are masked in this view." className="h-fit">
                {person.credentials.length > 0 ? (
                    <div className="space-y-3">
                        {person.credentials.map((credential) => (
                            <article key={credential.id} className="rounded-lg bg-secondary p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-fg-quaternary ring-1 ring-secondary">
                                        <Certificate01 aria-hidden="true" className="size-5" />
                                    </span>
                                    <StatusBadge tone={qualificationTone(credential.status)}>{sentenceCase(credential.status)}</StatusBadge>
                                </div>
                                <p className="mt-3 text-sm font-semibold text-primary">{credential.name}</p>
                                <p className="mt-0.5 font-mono text-xs text-quaternary">{maskCredential(credential.credentialNumber)}</p>
                                <dl className="mt-3 grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <dt className="text-quaternary">Issuer</dt>
                                        <dd className="mt-0.5 font-medium text-secondary">{credential.issuer}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-quaternary">Expires</dt>
                                        <dd className="mt-0.5 font-medium text-secondary">{formatDate(credential.expirationDate) || "No expiration"}</dd>
                                    </div>
                                </dl>
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState title="No credentials found" description="Certificates and credentials will appear here when available." />
                )}
            </Panel>
        </div>
    );
};

const TimelineTab = ({
    person,
    timeline,
    recordsById,
    qualificationsById,
    onOpenRecord,
    onOpenQualification,
}: {
    person: TrainingPerson;
    timeline: readonly TrainingTimelineEntry[];
    recordsById: ReadonlyMap<string, TrainingRecord>;
    qualificationsById: ReadonlyMap<string, QualificationRecord>;
    onOpenRecord: (record: TrainingRecord) => void;
    onOpenQualification: (qualification: QualificationRecord) => void;
}) => (
    <Panel title="Record timeline" description={`Training, qualification, credential, and restriction activity for ${person.displayName}.`}>
        {timeline.length > 0 ? (
            <ol className="relative space-y-0 before:absolute before:top-3 before:bottom-3 before:left-[11px] before:w-px before:bg-border-secondary">
                {timeline.map((entry) => {
                    const record = entry.recordId ? recordsById.get(entry.recordId) : undefined;
                    const qualification = entry.qualificationId ? qualificationsById.get(entry.qualificationId) : undefined;
                    const onOpen = record ? () => onOpenRecord(record) : qualification ? () => onOpenQualification(qualification) : undefined;

                    return (
                        <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                            <span className="relative z-10 mt-1.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary ring-1 ring-secondary">
                                <span
                                    aria-hidden="true"
                                    className={`size-2 rounded-full ${
                                        entry.tone === "success"
                                            ? "bg-utility-green-500"
                                            : entry.tone === "warning"
                                              ? "bg-utility-yellow-500"
                                              : entry.tone === "danger"
                                                ? "bg-utility-red-500"
                                                : "bg-fg-quaternary"
                                    }`}
                                />
                            </span>
                            <div className="min-w-0 flex-1 rounded-lg bg-secondary p-4">
                                <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold text-primary">{entry.title}</p>
                                            <StatusBadge tone={timelineTone(entry.tone)}>{sentenceCase(entry.kind)}</StatusBadge>
                                        </div>
                                        <p className="mt-1 text-sm text-tertiary">{entry.description}</p>
                                    </div>
                                    <time className="shrink-0 text-xs font-medium text-quaternary" dateTime={entry.date}>
                                        {formatDate(entry.date)}
                                    </time>
                                </div>
                                {onOpen && (
                                    <Button className="mt-3" color="link-color" size="sm" iconTrailing={ChevronRight} onClick={onOpen}>
                                        Open source
                                    </Button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        ) : (
            <EmptyState title="No timeline activity" description="Training and qualification changes will appear here in chronological order." />
        )}
    </Panel>
);

export const PersonProfile = ({
    person,
    records,
    timeline,
    initialTab = "overview",
    onBack,
    onOpenRecord,
    onOpenQualification,
    onExport,
}: PersonProfileProps) => {
    const [selectedTab, setSelectedTab] = useState<PersonProfileTab>(initialTab);
    const personRecords = useMemo(() => records.filter((record) => record.personId === person.id), [person.id, records]);
    const personTimeline = useMemo(
        () => timeline.filter((entry) => entry.personId === person.id).sort((left, right) => right.date.localeCompare(left.date)),
        [person.id, timeline],
    );
    const recordsById = useMemo(() => new Map(personRecords.map((record) => [record.id, record])), [personRecords]);
    const qualificationsById = useMemo(() => new Map(person.qualifications.map((qualification) => [qualification.id, qualification])), [person.qualifications]);

    return (
        <div className="space-y-5">
            <section className="overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary">
                <div className="flex flex-col gap-5 p-4 md:p-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                        {onBack && <Button color="secondary" size="sm" iconLeading={ArrowLeft} aria-label="Back to people" onClick={onBack} />}
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-solid text-lg font-semibold text-white">
                            {person.preferredName.charAt(0)}
                            {person.displayName.split(" ").at(-1)?.charAt(0)}
                        </span>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl font-semibold text-primary">{person.displayName}</h2>
                                <StatusBadge tone={person.employmentStatus === "active" ? "green" : "gray"}>
                                    {sentenceCase(person.employmentStatus)}
                                </StatusBadge>
                                <StatusBadge tone="gray">Synthetic</StatusBadge>
                            </div>
                            <p className="mt-1 text-sm text-tertiary">
                                Employee {person.employeeNumber} · {person.roleTitle}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-tertiary">
                                <span className="inline-flex items-center gap-1.5">
                                    <Briefcase01 aria-hidden="true" className="size-4 text-fg-quaternary" />
                                    {person.fleetCode} · {person.seatCode}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <MarkerPin01 aria-hidden="true" className="size-4 text-fg-quaternary" />
                                    {person.baseCode}
                                </span>
                                <StatusBadge tone={person.programType === "AQP" ? "blue" : "purple"}>
                                    {person.programType === "NO" ? "N&O" : person.programType}
                                </StatusBadge>
                                <StatusBadge tone={qualificationTone(person.qualificationState)}>{sentenceCase(person.qualificationState)}</StatusBadge>
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <div className="inline-flex items-center gap-1.5 text-xs text-quaternary">
                            <Clock aria-hidden="true" className="size-4" />
                            Record snapshot
                        </div>
                        {onExport && (
                            <Button color="secondary" size="sm" iconLeading={Download01} onClick={() => onExport(person)}>
                                Export jacket
                            </Button>
                        )}
                    </div>
                </div>
                <ModuleTabs tabs={tabs} selected={selectedTab} onSelect={(tab) => setSelectedTab(tab as PersonProfileTab)} />
            </section>

            {selectedTab === "qualifications" ? (
                <QualificationsTab person={person} onOpenQualification={onOpenQualification} />
            ) : selectedTab === "training" ? (
                <TrainingRecordsTab person={person} records={personRecords} onOpenRecord={onOpenRecord} />
            ) : selectedTab === "currency" ? (
                <CurrencyAndCredentialsTab person={person} onOpenQualification={onOpenQualification} />
            ) : selectedTab === "timeline" ? (
                <TimelineTab
                    person={person}
                    timeline={personTimeline}
                    recordsById={recordsById}
                    qualificationsById={qualificationsById}
                    onOpenRecord={onOpenRecord}
                    onOpenQualification={onOpenQualification}
                />
            ) : (
                <ProfileOverview person={person} records={personRecords} onOpenRecord={onOpenRecord} />
            )}
        </div>
    );
};
