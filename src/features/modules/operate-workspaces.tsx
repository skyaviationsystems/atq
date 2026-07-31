"use client";

import { useMemo, useState } from "react";
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    ClipboardCheck,
    Cloud01,
    Database01,
    FileCheck02,
    Inbox01,
    Monitor01,
    RefreshCw01,
    Route,
    UploadCloud02,
    UserCheck01,
    Users01,
    Wifi,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { demoAqpResolutionInput, demoProgramCatalog } from "@/lib/data";
import { type CurriculumTypeCode, type ISODate, type SeatCode, resolveProgram } from "@/lib/domain";
import type { ModuleViewProps } from "./module-types";
import {
    Callout,
    CheckList,
    DataTable,
    MetricCard,
    MiniStat,
    ModuleTabs,
    NativeSelect,
    OpenLink,
    Panel,
    ProgressBar,
    QueueItem,
    SparkBars,
    StatusBadge,
    Toolbar,
    WorkspaceBody,
    WorkspaceHeader,
} from "./module-ui";

const operationsTabs = [
    { id: "overview", label: "Operational picture" },
    { id: "resolver", label: "Program resolver" },
    { id: "mats", label: "MATS transition", count: 3 },
] as const;

const queueRows = [
    { id: "q-01", work: "Signed record awaiting QC", area: "Forms", age: "22 min", priority: "High", owner: "Records team" },
    { id: "q-02", work: "Program could not be resolved", area: "Resolution", age: "41 min", priority: "Critical", owner: "Program admin" },
    { id: "q-03", work: "Device restriction affects event", area: "Scheduling", age: "1 hr", priority: "High", owner: "Training ops" },
    { id: "q-04", work: "Qualification evidence incomplete", area: "Records", age: "3 hr", priority: "Normal", owner: "QC desk" },
] as const;

const curriculumTypeByReason: Record<string, CurriculumTypeCode> = {
    "Continuing qualification": "CQ",
    "Initial qualification": "QUAL",
    Requalification: "CQ",
    "Special tracking exit": "CQ",
};

const eventTypeByReason: Record<string, string> = {
    "Continuing qualification": "CQ_EVALUATION",
    "Initial qualification": "QUALIFICATION_EVENT",
    Requalification: "CQ_EVALUATION",
    "Special tracking exit": "CQ_EVALUATION",
};

const reasonCodeByReason: Record<string, string> = {
    "Continuing qualification": "ROUTINE",
    "Initial qualification": "ROUTINE",
    Requalification: "REQUALIFICATION",
    "Special tracking exit": "SPECIAL_TRACKING_EXIT",
};

function compactDecisionId(canonicalKey: string) {
    let hash = 2166136261;
    for (const character of canonicalKey) {
        hash ^= character.codePointAt(0) ?? 0;
        hash = Math.imul(hash, 16777619);
    }
    return `RES-${(hash >>> 0).toString(16).padStart(8, "0").toUpperCase()}`;
}

const OperationalPicture = () => (
    <WorkspaceBody>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Calendar} label="Training events today" value="42" supporting="7 locations · 5 device types" trend="8% vs. plan" />
            <MetricCard icon={Inbox01} label="Actions requiring attention" value="11" supporting="3 are time-sensitive" tone="amber" />
            <MetricCard icon={UserCheck01} label="Qualified population" value="96.4%" supporting="1,842 of 1,911 in scope" tone="green" />
            <MetricCard icon={Wifi} label="Integration delivery" value="99.8%" supporting="Last 24 hours · 8 endpoints" tone="blue" />
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.75fr)]">
            <Panel
                title="Priority work queue"
                description="Cross-module actions ordered by operational impact and time remaining."
                action={
                    <Button color="secondary" size="sm">
                        Open work queue
                    </Button>
                }
                flush
            >
                <DataTable
                    label="Priority work queue"
                    rows={queueRows}
                    columns={[
                        {
                            id: "work",
                            label: "Work item",
                            render: (row) => (
                                <div>
                                    <p className="font-semibold text-primary">{row.work}</p>
                                    <p className="mt-0.5 text-xs text-quaternary">{row.area}</p>
                                </div>
                            ),
                        },
                        { id: "age", label: "Age", render: (row) => row.age },
                        {
                            id: "priority",
                            label: "Priority",
                            render: (row) => (
                                <StatusBadge tone={row.priority === "Critical" ? "red" : row.priority === "High" ? "amber" : "gray"}>
                                    {row.priority}
                                </StatusBadge>
                            ),
                        },
                        { id: "owner", label: "Owner", render: (row) => row.owner },
                        { id: "open", label: "", className: "text-right", render: () => <OpenLink>Open</OpenLink> },
                    ]}
                />
            </Panel>

            <div className="space-y-5">
                <Panel title="Today by program" description="Resolved event assignments">
                    <div className="space-y-4">
                        <ProgressBar label="AQP recurrent" value={68} />
                        <ProgressBar label="Traditional qualification" value={21} tone="purple" />
                        <ProgressBar label="Instructor / evaluator" value={11} tone="green" />
                    </div>
                </Panel>
                <Panel title="Seven-day event load" description="Planned event starts">
                    <SparkBars values={[37, 44, 41, 53, 47, 31, 18]} labels={["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"]} />
                </Panel>
            </div>
        </div>

        <Callout
            icon={AlertCircle}
            title="Three records need a governing-program decision"
            tone="amber"
            action={
                <Button color="secondary" size="sm">
                    Resolve now
                </Button>
            }
        >
            Forms and qualification calculations are paused for these records. No downstream status has been changed.
        </Callout>
    </WorkspaceBody>
);

const ProgramResolver = () => {
    const [fleet, setFleet] = useState("B747");
    const [reason, setReason] = useState("Continuing qualification");
    const [effectiveDate, setEffectiveDate] = useState("2026-08-04");
    const [seat, setSeat] = useState<SeatCode>("CA");
    const [copied, setCopied] = useState(false);

    const resolution = useMemo(() => {
        const curriculumType = curriculumTypeByReason[reason] ?? "CQ";
        const eventDate = effectiveDate as ISODate;
        const decision = resolveProgram(
            {
                ...demoAqpResolutionInput,
                fleetCode: fleet,
                seatCode: seat,
                curriculumType,
                eventDate,
                eventType: eventTypeByReason[reason] ?? "CQ_EVALUATION",
                reasonCode: reasonCodeByReason[reason] ?? "ROUTINE",
                ...(curriculumType === "QUAL" ? { curriculumStartDate: eventDate } : { cqCycleStartDate: eventDate }),
            },
            demoProgramCatalog,
        );

        return {
            decision,
            program: decision.program?.displayName ?? "No governing program",
            version: decision.curriculumTitle ?? decision.errors[0] ?? decision.warnings[0] ?? "No effective curriculum or form was selected.",
            confidence: decision.status === "resolved" ? "Deterministic match" : decision.status === "needs_review" ? "Needs policy review" : "Unresolved",
            tone: decision.status === "resolved" ? ("green" as const) : decision.status === "needs_review" ? ("amber" as const) : ("red" as const),
            decisionId: compactDecisionId(decision.canonicalDecisionKey),
        };
    }, [effectiveDate, fleet, reason, seat]);

    const copyResolutionLink = async () => {
        await navigator.clipboard.writeText(`${window.location.origin}/operations/0.1#${resolution.decisionId}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <WorkspaceBody>
            <Callout icon={Route} title="Live domain-engine demonstration" tone="blue">
                This screen executes the tested ATQ resolver against a synthetic, versioned B747 catalog. The decision trace is real; persistence to the
                Supabase resolution log remains disabled until a project and approved source data are connected.
            </Callout>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]">
                <Panel title="Resolve governing program" description="All required decision inputs are evaluated against the effective policy version.">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium text-secondary">Fleet</span>
                            <select
                                value={fleet}
                                onChange={(event) => setFleet(event.target.value)}
                                className="h-10 w-full rounded-lg bg-primary px-3 text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden focus:ring-2 focus:ring-brand"
                            >
                                <option>B747</option>
                                <option>B777</option>
                                <option>B767</option>
                            </select>
                        </label>
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium text-secondary">Training reason</span>
                            <select
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                className="h-10 w-full rounded-lg bg-primary px-3 text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden focus:ring-2 focus:ring-brand"
                            >
                                <option>Continuing qualification</option>
                                <option>Initial qualification</option>
                                <option>Requalification</option>
                                <option>Special tracking exit</option>
                            </select>
                        </label>
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium text-secondary">Event effective date</span>
                            <input
                                type="date"
                                value={effectiveDate}
                                onChange={(event) => setEffectiveDate(event.target.value)}
                                className="h-10 w-full rounded-lg bg-primary px-3 text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden focus:ring-2 focus:ring-brand"
                            />
                        </label>
                        <label className="space-y-1.5">
                            <span className="text-sm font-medium text-secondary">Seat / role</span>
                            <select
                                value={seat}
                                onChange={(event) => setSeat(event.target.value as SeatCode)}
                                className="h-10 w-full rounded-lg bg-primary px-3 text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden focus:ring-2 focus:ring-brand"
                            >
                                <option value="CA">Captain</option>
                                <option value="FO">First officer</option>
                                <option value="OBS">Instructor / evaluator</option>
                            </select>
                        </label>
                        <label className="space-y-1.5 sm:col-span-2">
                            <span className="text-sm font-medium text-secondary">Event context</span>
                            <select className="h-10 w-full rounded-lg bg-primary px-3 text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden focus:ring-2 focus:ring-brand">
                                <option>Scheduled recurrent footprint event</option>
                                <option>Make-up / recovery event</option>
                                <option>Out-of-order event with approval</option>
                            </select>
                        </label>
                    </div>
                    <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-secondary pt-4">
                        <Button color="secondary" size="sm" onClick={() => void copyResolutionLink()}>
                            {copied ? "Link copied" : "Copy resolution link"}
                        </Button>
                        <Button size="sm" iconLeading={Route} isDisabled>
                            Bind to event
                        </Button>
                    </div>
                </Panel>

                <div className="space-y-5">
                    <Panel title="Resolution" description="Calculated from policy inputs above.">
                        <div className="rounded-xl bg-secondary p-4 ring-1 ring-secondary">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <StatusBadge tone={resolution.tone}>{resolution.confidence}</StatusBadge>
                                    <h3 className="mt-3 text-lg font-semibold text-primary">{resolution.program}</h3>
                                    <p className="mt-1 text-sm text-tertiary">{resolution.version}</p>
                                </div>
                                <span
                                    className={
                                        resolution.decision.status === "resolved"
                                            ? "flex size-10 items-center justify-center rounded-lg bg-utility-green-50 text-utility-green-700 ring-1 ring-utility-green-200"
                                            : "flex size-10 items-center justify-center rounded-lg bg-utility-orange-50 text-utility-orange-700 ring-1 ring-utility-orange-200"
                                    }
                                >
                                    {resolution.decision.status === "resolved" ? (
                                        <CheckCircle aria-hidden="true" className="size-5" />
                                    ) : (
                                        <AlertCircle aria-hidden="true" className="size-5" />
                                    )}
                                </span>
                            </div>
                            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-secondary pt-4">
                                <div>
                                    <dt className="text-xs font-medium text-quaternary">Policy effective</dt>
                                    <dd className="mt-1 text-sm font-semibold text-secondary">{resolution.decision.governingDate ?? "Not resolved"}</dd>
                                </div>
                                <div>
                                    <dt className="text-xs font-medium text-quaternary">Decision ID</dt>
                                    <dd className="mt-1 font-mono text-xs font-semibold text-secondary">{resolution.decisionId}</dd>
                                </div>
                            </dl>
                        </div>
                    </Panel>
                    <Panel title="Decision evidence">
                        <CheckList
                            items={resolution.decision.reasoning.slice(-4).map((step) => ({
                                label: step.code.replaceAll("_", " "),
                                supporting: step.message,
                                complete: resolution.decision.errors.length === 0,
                            }))}
                        />
                    </Panel>
                </div>
            </div>
        </WorkspaceBody>
    );
};

const matsRows = [
    { id: "m-747", fleet: "B747", state: "Active transition", cohort: "412", resolved: "98.7%", exceptions: "3", milestone: "CQ cycle 2" },
    { id: "m-777", fleet: "B777", state: "Readiness", cohort: "536", resolved: "100%", exceptions: "0", milestone: "Validation" },
    { id: "m-767", fleet: "B767", state: "Traditional", cohort: "684", resolved: "100%", exceptions: "0", milestone: "Not scheduled" },
] as const;

const MatsConsole = () => (
    <WorkspaceBody>
        <Callout icon={Route} title="Transition decisions are effective-dated and reversible only by a new policy version">
            Every resolution stores its input facts, rule version, output, and decision evidence so historical records remain reproducible.
        </Callout>
        <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard icon={Users01} label="Population in transition" value="412" supporting="B747 active cohort" />
            <MetricCard icon={CheckCircle} label="Automatically resolved" value="98.7%" supporting="Last 30 days" tone="green" />
            <MetricCard icon={AlertCircle} label="Open exceptions" value="3" supporting="Oldest: 41 minutes" tone="amber" />
        </div>
        <Panel
            title="Fleet transition control"
            description="Current state, eligible cohort, and unresolved decision volume."
            action={
                <Button size="sm" color="secondary">
                    Policy history
                </Button>
            }
            flush
        >
            <DataTable
                label="Fleet transition control"
                rows={matsRows}
                columns={[
                    { id: "fleet", label: "Fleet", render: (row) => <span className="font-semibold text-primary">{row.fleet}</span> },
                    {
                        id: "state",
                        label: "State",
                        render: (row) => (
                            <StatusBadge tone={row.state === "Active transition" ? "blue" : row.state === "Readiness" ? "purple" : "gray"}>
                                {row.state}
                            </StatusBadge>
                        ),
                    },
                    { id: "cohort", label: "People in scope", render: (row) => row.cohort },
                    { id: "resolved", label: "Resolution rate", render: (row) => row.resolved },
                    {
                        id: "exceptions",
                        label: "Exceptions",
                        render: (row) => <span className={row.exceptions !== "0" ? "font-semibold text-error-primary" : ""}>{row.exceptions}</span>,
                    },
                    { id: "milestone", label: "Next milestone", render: (row) => row.milestone },
                ]}
            />
        </Panel>
    </WorkspaceBody>
);

export const OperationsWorkspace = ({ initialView = "overview" }: ModuleViewProps) => {
    const [view, setView] = useState(operationsTabs.some((tab) => tab.id === initialView) ? initialView : "overview");

    return (
        <div className="min-h-full">
            <WorkspaceHeader
                eyebrow="M0 · Operations"
                title="Training operations control center"
                description="One operating picture for today’s training, program decisions, qualification risk, and system delivery."
                status={<StatusBadge tone="blue">Synthetic preview</StatusBadge>}
                actions={
                    <>
                        <Button color="secondary" size="sm" iconLeading={RefreshCw01}>
                            Refresh
                        </Button>
                        <Button size="sm" iconLeading={UploadCloud02}>
                            Create event
                        </Button>
                    </>
                }
            />
            <ModuleTabs tabs={operationsTabs} selected={view} onSelect={setView} />
            {view === "resolver" ? <ProgramResolver /> : view === "mats" ? <MatsConsole /> : <OperationalPicture />}
        </div>
    );
};

const formRows = [
    { id: "frm-1842", record: "CQ evaluation · Event 0842", state: "QC review", program: "AQP CQ", age: "18 min", issue: "None" },
    {
        id: "frm-1841",
        record: "Qualification check · Event 0839",
        state: "Awaiting signature",
        program: "Traditional",
        age: "37 min",
        issue: "Student acknowledgement",
    },
    { id: "frm-1836", record: "Ground training completion · Class 221", state: "Returned", program: "Traditional", age: "2 hr", issue: "Completion date" },
    { id: "frm-1829", record: "CQ evaluation · Event 0821", state: "Sync hold", program: "AQP CQ", age: "4 hr", issue: "Duplicate draft preserved" },
] as const;

export const FormsOperationsWorkspace = () => (
    <div className="min-h-full">
        <WorkspaceHeader
            eyebrow="M1 · Forms engine"
            title="Forms operations"
            description="Monitor governed definitions, in-flight records, signatures, quality control, and offline synchronization."
            status={<StatusBadge tone="blue">Synthetic runtime</StatusBadge>}
            actions={
                <>
                    <Button color="secondary" size="sm">
                        Form library
                    </Button>
                    <Button size="sm" iconLeading={ClipboardCheck}>
                        New definition
                    </Button>
                </>
            }
        />
        <WorkspaceBody>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={ClipboardCheck} label="Published definitions" value="38" supporting="12 programs · 4 fleets" />
                <MetricCard icon={FileCheck02} label="Submitted today" value="186" supporting="94% first-pass QC" trend="6.2%" tone="green" />
                <MetricCard icon={UserCheck01} label="Awaiting signature" value="7" supporting="Oldest: 37 minutes" tone="amber" />
                <MetricCard icon={Cloud01} label="Offline drafts" value="14" supporting="13 devices · all within SLA" tone="purple" />
            </div>
            <Toolbar searchLabel="Search forms" searchPlaceholder="Search form, event, or record ID">
                <NativeSelect
                    label="Lifecycle state"
                    defaultValue="All states"
                    options={["All states", "Draft", "Awaiting signature", "QC review", "Returned", "Released"]}
                />
            </Toolbar>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.7fr)]">
                <Panel title="Active record pipeline" description="All high-attention records across lifecycle states." flush>
                    <DataTable
                        label="Active record pipeline"
                        rows={formRows}
                        columns={[
                            {
                                id: "record",
                                label: "Record",
                                render: (row) => (
                                    <div>
                                        <p className="font-semibold text-primary">{row.record}</p>
                                        <p className="mt-0.5 text-xs text-quaternary">{row.program}</p>
                                    </div>
                                ),
                            },
                            {
                                id: "state",
                                label: "State",
                                render: (row) => (
                                    <StatusBadge
                                        tone={row.state === "Returned" || row.state === "Sync hold" ? "amber" : row.state === "QC review" ? "blue" : "purple"}
                                    >
                                        {row.state}
                                    </StatusBadge>
                                ),
                            },
                            { id: "age", label: "Age", render: (row) => row.age },
                            { id: "issue", label: "Attention", render: (row) => row.issue },
                            { id: "open", label: "", className: "text-right", render: () => <OpenLink>Review</OpenLink> },
                        ]}
                    />
                </Panel>
                <div className="space-y-5">
                    <Panel title="Lifecycle health">
                        <div className="grid grid-cols-2 gap-3">
                            <MiniStat label="Draft" value="31" />
                            <MiniStat label="Signature" value="7" tone="warning" />
                            <MiniStat label="QC review" value="12" />
                            <MiniStat label="Released" value="186" tone="success" />
                        </div>
                    </Panel>
                    <Panel title="Definition governance">
                        <CheckList
                            items={[
                                { label: "Published versions bound", supporting: "38 of 38 have curriculum and reason bindings", complete: true },
                                { label: "Print layouts validated", supporting: "2 revisions need comparison approval", complete: false },
                                { label: "Signature language current", supporting: "Policy set verified 24 Jul 2026", complete: true },
                                { label: "Offline schema compatible", supporting: "All active devices can render current versions", complete: true },
                            ]}
                        />
                    </Panel>
                </div>
            </div>
        </WorkspaceBody>
    </div>
);

const instructorEvents = [
    { id: "evt-4401", time: "08:00–12:00", title: "CQ simulator · Event set C", location: "SIM 4", crew: "Crew 118", state: "Ready offline" },
    { id: "evt-4404", time: "13:30–17:30", title: "CQ simulator · Event set D", location: "SIM 2", crew: "Crew 203", state: "Pack update" },
    { id: "evt-4419", time: "Tomorrow · 07:00", title: "Qualification check", location: "SIM 1", crew: "Crew 087", state: "Scheduled" },
] as const;

export const InstructorWorkspace = () => (
    <div className="min-h-full">
        <WorkspaceHeader
            eyebrow="M2 · Instructor"
            title="My training day"
            description="Events, offline readiness, open records, and qualification status in one focused workspace."
            status={<StatusBadge tone="green">Device ready</StatusBadge>}
            actions={
                <Button size="sm" iconLeading={Cloud01}>
                    Refresh offline pack
                </Button>
            }
        />
        <WorkspaceBody>
            <div className="grid gap-4 sm:grid-cols-3">
                <MetricCard icon={Calendar} label="Events today" value="2" supporting="First event in 48 minutes" />
                <MetricCard icon={ClipboardCheck} label="Open records" value="3" supporting="1 due before next event" tone="amber" />
                <MetricCard icon={UserCheck01} label="Current authorizations" value="8 / 8" supporting="Next review in 54 days" tone="green" />
            </div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
                <Panel
                    title="My events"
                    description="Times shown in Eastern Time (UTC−04:00)."
                    action={
                        <Button color="secondary" size="sm">
                            Calendar view
                        </Button>
                    }
                    flush
                >
                    {instructorEvents.map((event) => (
                        <QueueItem
                            key={event.id}
                            title={event.title}
                            meta={`${event.time} · ${event.location} · ${event.crew}`}
                            badge={
                                <StatusBadge tone={event.state === "Ready offline" ? "green" : event.state === "Pack update" ? "amber" : "gray"}>
                                    {event.state}
                                </StatusBadge>
                            }
                        />
                    ))}
                </Panel>
                <div className="space-y-5">
                    <Panel title="Offline pack" description="Last verified 07:06 ET">
                        <CheckList
                            items={[
                                { label: "Event rosters", supporting: "3 events · version current", complete: true },
                                { label: "Form definitions", supporting: "6 governed definitions", complete: true },
                                { label: "Reference materials", supporting: "1 updated guide ready to download", complete: false },
                                { label: "Queued sync", supporting: "No records waiting", complete: true },
                            ]}
                        />
                    </Panel>
                    <Callout icon={Monitor01} title="SIM 4 operating limitation" tone="amber">
                        Motion unavailable. Event content remains permitted; acknowledge during pre-event brief.
                    </Callout>
                </div>
            </div>
            <Panel title="Qualification and standardization">
                <div className="grid gap-5 md:grid-cols-3">
                    <ProgressBar label="AQP evaluator authorization" value={100} tone="green" />
                    <ProgressBar label="Standardization cycle" value={72} />
                    <ProgressBar label="Line observation cycle" value={48} tone="purple" />
                </div>
            </Panel>
        </WorkspaceBody>
    </div>
);

const batchRows = [
    { id: "bat-204", source: "Vendor completion file", records: "84", matched: "82", issues: "2", state: "Review" },
    { id: "bat-201", source: "Roster completion · Class 221", records: "24", matched: "24", issues: "0", state: "Ready" },
    { id: "bat-198", source: "Legacy jacket scan index", records: "146", matched: "139", issues: "7", state: "Reconciling" },
    { id: "bat-194", source: "AIMS transition export", records: "1,204", matched: "1,204", issues: "0", state: "Released" },
] as const;

export const BatchEntryWorkspace = () => (
    <div className="min-h-full">
        <WorkspaceHeader
            eyebrow="M3 · Data entry"
            title="Batch and reconciliation desk"
            description="High-volume entry and imports with source provenance, duplicate protection, preview, and controlled release."
            status={<StatusBadge tone="blue">3 active batches</StatusBadge>}
            actions={
                <>
                    <Button color="secondary" size="sm" iconLeading={Database01}>
                        Rapid entry
                    </Button>
                    <Button size="sm" iconLeading={UploadCloud02}>
                        New import
                    </Button>
                </>
            }
        />
        <WorkspaceBody>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Database01} label="Records processed today" value="1,458" supporting="Across 6 controlled batches" trend="14%" />
                <MetricCard icon={CheckCircle} label="Auto-match rate" value="97.8%" supporting="Identity + event + curriculum" tone="green" />
                <MetricCard icon={AlertCircle} label="Reconciliation issues" value="9" supporting="No records released with conflicts" tone="amber" />
                <MetricCard icon={RefreshCw01} label="Potential duplicates" value="3" supporting="Preserved for human review" tone="purple" />
            </div>
            <Toolbar searchLabel="Search batches" searchPlaceholder="Search batch, source, or record">
                <NativeSelect label="Batch state" defaultValue="All active" options={["All active", "Review", "Ready", "Reconciling", "Released"]} />
            </Toolbar>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,0.7fr)]">
                <Panel title="Import and batch activity" description="Release is available only after all blocking differences are resolved." flush>
                    <DataTable
                        label="Import and batch activity"
                        rows={batchRows}
                        columns={[
                            { id: "source", label: "Source", render: (row) => <span className="font-semibold text-primary">{row.source}</span> },
                            { id: "records", label: "Records", render: (row) => row.records },
                            { id: "matched", label: "Matched", render: (row) => row.matched },
                            {
                                id: "issues",
                                label: "Issues",
                                render: (row) => (
                                    <span className={row.issues !== "0" ? "font-semibold text-error-primary" : "text-success-primary"}>{row.issues}</span>
                                ),
                            },
                            {
                                id: "state",
                                label: "State",
                                render: (row) => (
                                    <StatusBadge tone={row.state === "Ready" || row.state === "Released" ? "green" : row.state === "Review" ? "amber" : "blue"}>
                                        {row.state}
                                    </StatusBadge>
                                ),
                            },
                        ]}
                    />
                </Panel>
                <div className="space-y-5">
                    <Panel title="Selected batch controls">
                        <CheckList
                            items={[
                                { label: "Source checksum recorded", supporting: "File cannot change silently", complete: true },
                                { label: "Schema and code mapping", supporting: "Version 2026.07 validated", complete: true },
                                { label: "Identity reconciliation", supporting: "2 unmatched rows remain", complete: false },
                                { label: "Release approval", supporting: "Available after blockers clear", complete: false },
                            ]}
                        />
                    </Panel>
                    <Callout icon={FileCheck02} title="Every correction becomes an amendment" tone="blue">
                        Original source values remain visible. Bulk changes share a batch ID while preserving an event for each affected record.
                    </Callout>
                </div>
            </div>
        </WorkspaceBody>
    </div>
);
