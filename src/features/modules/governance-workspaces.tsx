"use client";

import { useState } from "react";
import {
    AlertCircle,
    BarChartSquare02,
    CheckCircle,
    CloudLightning,
    Database01,
    Download01,
    FileCheck02,
    FileSearch02,
    FileShield02,
    FolderCheck,
    LineChartUp02,
    Link01,
    Lock01,
    RefreshCw01,
    Settings01,
    ShieldTick,
    Sliders04,
    UploadCloud02,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import {
    Callout,
    CheckList,
    DataTable,
    MetricCard,
    MiniStat,
    OpenLink,
    Panel,
    ProgressBar,
    QueueItem,
    RingMetric,
    SparkBars,
    StatusBadge,
    WorkspaceBody,
    WorkspaceHeader,
} from "./module-ui";

const reportRows = [
    {
        id: "rep-2026-07",
        report: "Monthly AQP performance package",
        period: "July 2026",
        freshness: "Through 29 Jul · 23:59 ET",
        validation: "12 / 12 passed",
        state: "Ready",
    },
    { id: "rep-2026-q2", report: "Quarterly analysis pack", period: "Q2 2026", freshness: "Released 15 Jul 2026", validation: "Approved", state: "Released" },
    {
        id: "rep-exc-daily",
        report: "Daily exception report",
        period: "30 Jul 2026",
        freshness: "Generated 05:05 ET",
        validation: "3 exceptions",
        state: "Delivered",
    },
    {
        id: "rep-stakeholder",
        report: "Annual stakeholder meeting pack",
        period: "Program year 2026",
        freshness: "Data through Q2",
        validation: "4 sections open",
        state: "Building",
    },
] as const;

const taskRows = [
    { id: "T-104", task: "Flightpath management", attempts: "1,248", satisfactory: "96.8%", repeat: "2.4%", trend: "+0.8 pts", signal: "Stable" },
    { id: "T-217", task: "Abnormal procedure management", attempts: "992", satisfactory: "91.2%", repeat: "6.1%", trend: "−2.7 pts", signal: "Review" },
    { id: "T-311", task: "Leadership and teamwork", attempts: "1,116", satisfactory: "97.4%", repeat: "1.3%", trend: "+1.1 pts", signal: "Improving" },
    { id: "T-408", task: "Automation awareness", attempts: "874", satisfactory: "93.8%", repeat: "4.8%", trend: "−0.6 pts", signal: "Watch" },
] as const;

export const AnalyticsWorkspace = () => (
    <div className="min-h-full">
        <WorkspaceHeader
            eyebrow="M11 · Analytics"
            title="Performance analytics and reporting"
            description="Validated operational reporting, task-level signals, comparative analysis, and a governed path into continuous improvement."
            status={<StatusBadge tone="green">Warehouse current</StatusBadge>}
            actions={
                <>
                    <Button color="secondary" size="sm" iconLeading={Download01}>
                        Export data
                    </Button>
                    <Button size="sm" iconLeading={FileCheck02}>
                        Build report
                    </Button>
                </>
            }
        />
        <WorkspaceBody>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Database01} label="Validated records" value="18,642" supporting="Current reporting period" />
                <MetricCard
                    icon={LineChartUp02}
                    label="Satisfactory outcomes"
                    value="95.1%"
                    supporting="Up 0.7 points vs. prior period"
                    trend="0.7 pts"
                    tone="green"
                />
                <MetricCard icon={AlertCircle} label="Signals under review" value="6" supporting="2 cross the action threshold" tone="amber" />
                <MetricCard icon={FileCheck02} label="Recurring reports" value="9 / 9" supporting="Generated on schedule" tone="purple" />
            </div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
                <Panel title="Outcome trend" description="Trailing 12 months · all AQP evaluation events">
                    <SparkBars
                        values={[93.8, 94.2, 94.1, 94.6, 94.4, 94.9, 95.2, 95.0, 94.8, 95.4, 95.3, 95.1]}
                        labels={["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]}
                        tone="green"
                        height={190}
                    />
                </Panel>
                <Panel title="Reporting dataset health">
                    <RingMetric value={99} label="Records reconciled" sublabel="18 source differences retained in review queue" tone="green" />
                    <div className="mt-5 space-y-4 border-t border-secondary pt-4">
                        <ProgressBar label="Required fields" value={100} tone="green" />
                        <ProgressBar label="Source lineage" value={99} tone="green" />
                        <ProgressBar label="Program binding" value={100} tone="green" />
                    </div>
                </Panel>
            </div>
            <Panel title="Regulatory and recurring reports" description="Each package is reproducible from a frozen data manifest and report version." flush>
                <DataTable
                    label="Regulatory and recurring reports"
                    rows={reportRows}
                    columns={[
                        { id: "report", label: "Report", render: (row) => <span className="font-semibold text-primary">{row.report}</span> },
                        { id: "period", label: "Period", render: (row) => row.period },
                        { id: "freshness", label: "Data freshness", render: (row) => row.freshness },
                        { id: "validation", label: "Validation", render: (row) => row.validation },
                        {
                            id: "state",
                            label: "State",
                            render: (row) => (
                                <StatusBadge tone={row.state === "Building" ? "amber" : row.state === "Ready" ? "blue" : "green"}>{row.state}</StatusBadge>
                            ),
                        },
                        { id: "open", label: "", className: "text-right", render: () => <OpenLink>Open</OpenLink> },
                    ]}
                />
            </Panel>
            <Panel title="Task performance explorer" description="Signals are descriptive and require governed review before program action." flush>
                <DataTable
                    label="Task performance explorer"
                    rows={taskRows}
                    columns={[
                        {
                            id: "task",
                            label: "Task",
                            render: (row) => (
                                <div>
                                    <p className="font-semibold text-primary">{row.task}</p>
                                    <p className="mt-0.5 font-mono text-xs text-quaternary">{row.id}</p>
                                </div>
                            ),
                        },
                        { id: "attempts", label: "Attempts", render: (row) => row.attempts },
                        { id: "satisfactory", label: "Satisfactory", render: (row) => row.satisfactory },
                        { id: "repeat", label: "Repeat", render: (row) => row.repeat },
                        { id: "trend", label: "Trend", render: (row) => row.trend },
                        {
                            id: "signal",
                            label: "Signal",
                            render: (row) => (
                                <StatusBadge
                                    tone={row.signal === "Review" ? "red" : row.signal === "Watch" ? "amber" : row.signal === "Improving" ? "green" : "gray"}
                                >
                                    {row.signal}
                                </StatusBadge>
                            ),
                        },
                    ]}
                />
            </Panel>
            <Callout
                icon={BarChartSquare02}
                title="Six signals are in governed review"
                tone="amber"
                action={
                    <Button color="secondary" size="sm">
                        Improvement queue
                    </Button>
                }
            >
                Owners must document cohort context, potential confounders, and proposed action before a curriculum change can begin.
            </Callout>
        </WorkspaceBody>
    </div>
);

const controlRows = [
    {
        id: "ctl-01",
        control: "Electronic signature evidence",
        owner: "Records governance",
        cadence: "Continuous",
        last: "30 Jul 2026",
        exceptions: "0",
        state: "Effective",
    },
    {
        id: "ctl-02",
        control: "Qualification projection rebuild",
        owner: "Data assurance",
        cadence: "Daily",
        last: "30 Jul 2026",
        exceptions: "0",
        state: "Effective",
    },
    { id: "ctl-03", control: "Quarterly records sample", owner: "Compliance", cadence: "Quarterly", last: "15 Jul 2026", exceptions: "3", state: "Attention" },
    {
        id: "ctl-04",
        control: "Independent restore test",
        owner: "Platform operations",
        cadence: "Monthly",
        last: "08 Jul 2026",
        exceptions: "0",
        state: "Effective",
    },
    { id: "ctl-05", control: "External portal access review", owner: "Security", cadence: "Monthly", last: "27 Jul 2026", exceptions: "1", state: "Review" },
] as const;

const auditRows = [
    {
        id: "AUD-9F2A",
        time: "30 Jul · 09:41:18 ET",
        actor: "Records QC role",
        action: "Released signed record",
        object: "Record FRM-1842",
        integrity: "Verified",
    },
    {
        id: "AUD-9F29",
        time: "30 Jul · 09:38:02 ET",
        actor: "Integration worker",
        action: "Reconciled event outcome",
        object: "Event 0842",
        integrity: "Verified",
    },
    {
        id: "AUD-9F28",
        time: "30 Jul · 09:31:44 ET",
        actor: "Compliance reviewer",
        action: "Added sample finding",
        object: "Audit Q3-2026",
        integrity: "Verified",
    },
    {
        id: "AUD-9F27",
        time: "30 Jul · 09:22:10 ET",
        actor: "Program admin",
        action: "Approved policy version",
        object: "MATS rule v4.2",
        integrity: "Verified",
    },
] as const;

export const ComplianceWorkspace = () => (
    <div className="min-h-full">
        <WorkspaceHeader
            eyebrow="M12 · Compliance"
            title="Compliance and audit center"
            description="Current control posture, governed samples, inspection evidence, retention, external access, and immutable activity history."
            status={<StatusBadge tone="green">No critical exceptions</StatusBadge>}
            actions={
                <>
                    <Button color="secondary" size="sm" iconLeading={FileSearch02}>
                        Start inspection session
                    </Button>
                    <Button size="sm" iconLeading={FolderCheck}>
                        Build audit binder
                    </Button>
                </>
            }
        />
        <WorkspaceBody>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={ShieldTick} label="Controls effective" value="47 / 49" supporting="2 require documented review" tone="green" />
                <MetricCard icon={AlertCircle} label="Open exceptions" value="4" supporting="Oldest open 12 days" tone="amber" />
                <MetricCard icon={FileCheck02} label="Quarterly sample" value="72%" supporting="18 of 25 records complete" />
                <MetricCard icon={Lock01} label="External sessions" value="2" supporting="Both expire within 48 hours" tone="purple" />
            </div>
            <Panel title="Control posture" description="Evidence freshness and exceptions are evaluated against each control’s approved cadence." flush>
                <DataTable
                    label="Compliance control posture"
                    rows={controlRows}
                    columns={[
                        { id: "control", label: "Control", render: (row) => <span className="font-semibold text-primary">{row.control}</span> },
                        { id: "owner", label: "Owner", render: (row) => row.owner },
                        { id: "cadence", label: "Cadence", render: (row) => row.cadence },
                        { id: "last", label: "Last evidence", render: (row) => row.last },
                        {
                            id: "exceptions",
                            label: "Exceptions",
                            render: (row) => (
                                <span className={row.exceptions === "0" ? "text-success-primary" : "font-semibold text-error-primary"}>{row.exceptions}</span>
                            ),
                        },
                        {
                            id: "state",
                            label: "Assessment",
                            render: (row) => (
                                <StatusBadge tone={row.state === "Effective" ? "green" : row.state === "Attention" ? "amber" : "purple"}>
                                    {row.state}
                                </StatusBadge>
                            ),
                        },
                    ]}
                />
            </Panel>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
                <Panel title="Quarterly records sample" description="Q3 2026 · stratified by program, fleet, base, and outcome">
                    <div className="grid gap-5 sm:grid-cols-2">
                        <RingMetric value={72} label="Sample complete" sublabel="18 reviewed · 7 remaining" />
                        <div className="grid grid-cols-2 gap-3">
                            <MiniStat label="No finding" value="15" tone="success" />
                            <MiniStat label="Observation" value="2" tone="warning" />
                            <MiniStat label="Finding" value="1" tone="error" />
                            <MiniStat label="Remaining" value="7" />
                        </div>
                    </div>
                </Panel>
                <Panel title="External access">
                    <QueueItem
                        title="FAA inspection session"
                        meta="Read-only · expires 31 Jul 18:00 ET"
                        badge={<StatusBadge tone="green">Active</StatusBadge>}
                        detail="Curriculum, records sample, and reporting binder only"
                    />
                    <QueueItem
                        title="DoD audit profile"
                        meta="Read-only · expires 01 Aug 12:00 ET"
                        badge={<StatusBadge tone="green">Active</StatusBadge>}
                        detail="Access manifest reviewed 29 Jul"
                    />
                </Panel>
            </div>
            <Panel
                title="Immutable audit trail"
                description="Append-only activity with independently retained integrity evidence."
                action={
                    <Button size="sm" color="secondary">
                        Verify chain
                    </Button>
                }
                flush
            >
                <DataTable
                    label="Immutable audit trail"
                    rows={auditRows}
                    columns={[
                        { id: "time", label: "Time", render: (row) => <span className="whitespace-nowrap">{row.time}</span> },
                        { id: "actor", label: "Actor", render: (row) => row.actor },
                        { id: "action", label: "Action", render: (row) => <span className="font-semibold text-primary">{row.action}</span> },
                        { id: "object", label: "Object", render: (row) => row.object },
                        { id: "integrity", label: "Integrity", render: (row) => <StatusBadge tone="green">{row.integrity}</StatusBadge> },
                        { id: "open", label: "", className: "text-right", render: () => <OpenLink>Evidence</OpenLink> },
                    ]}
                />
            </Panel>
            <Callout icon={FileShield02} title="Audit binder exports are self-verifying">
                Each export includes a manifest, record and attachment hashes, report versions, generation time, access scope, and an independent verification
                receipt.
            </Callout>
        </WorkspaceBody>
    </div>
);

const integrationRows = [
    {
        id: "int-hris",
        system: "HR identity feed",
        role: "People and employment context",
        direction: "Inbound",
        last: "2 min ago",
        latency: "42 sec",
        errors: "0",
        state: "Healthy",
    },
    {
        id: "int-vision",
        system: "Curriculum task registry",
        role: "Task identity and revisions",
        direction: "Inbound",
        last: "8 min ago",
        latency: "1 min",
        errors: "0",
        state: "Healthy",
    },
    {
        id: "int-crew",
        system: "Crew operations",
        role: "Schedules, recency, and status",
        direction: "Bidirectional",
        last: "4 min ago",
        latency: "3 min",
        errors: "3",
        state: "Degraded",
    },
    {
        id: "int-legacy",
        system: "Legacy training records",
        role: "Transition source and reconciliation",
        direction: "Inbound",
        last: "19 min ago",
        latency: "12 min",
        errors: "1",
        state: "Review",
    },
    {
        id: "int-prd",
        system: "Regulatory records service",
        role: "Authorized reporting exchange",
        direction: "Bidirectional",
        last: "1 hr ago",
        latency: "6 min",
        errors: "0",
        state: "Healthy",
    },
] as const;

const configRows = [
    {
        id: "cfg-401",
        time: "30 Jul · 08:52 ET",
        actor: "Program admin role",
        area: "Feature rollout",
        change: "Enabled M4 record jacket for B747 pilot group",
        approval: "CHG-2026-401",
    },
    {
        id: "cfg-398",
        time: "29 Jul · 16:14 ET",
        actor: "Integration admin role",
        area: "Crew operations",
        change: "Raised retry ceiling from 5 to 8",
        approval: "CHG-2026-398",
    },
    {
        id: "cfg-392",
        time: "29 Jul · 11:03 ET",
        actor: "Security admin role",
        area: "External access",
        change: "Reduced default inspection session to 48 hours",
        approval: "CHG-2026-392",
    },
] as const;

const FeatureSwitch = ({ label, description, defaultEnabled }: { label: string; description: string; defaultEnabled: boolean }) => {
    const [enabled, setEnabled] = useState(defaultEnabled);
    return (
        <div className="flex items-start gap-4 border-b border-secondary py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-primary">{label}</p>
                <p className="mt-0.5 text-xs text-tertiary">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={enabled}
                aria-label={`${label}: ${enabled ? "enabled" : "disabled"}`}
                onClick={() => setEnabled((current) => !current)}
                className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full outline-focus-ring transition-colors focus-visible:outline-2 ${
                    enabled ? "bg-brand-solid" : "bg-quaternary"
                }`}
            >
                <span
                    aria-hidden="true"
                    className={`absolute top-0.5 size-5 rounded-full bg-primary shadow-xs transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`}
                />
            </button>
        </div>
    );
};

export const AdministrationWorkspace = () => (
    <div className="min-h-full">
        <WorkspaceHeader
            eyebrow="M13 · Administration"
            title="Platform administration and integrations"
            description="Control configuration, access, workflow, rollout, integration delivery, migration, backup, and data portability."
            status={<StatusBadge tone="amber">Synthetic integration model</StatusBadge>}
            actions={
                <>
                    <Button color="secondary" size="sm" iconLeading={Settings01}>
                        System settings
                    </Button>
                    <Button size="sm" iconLeading={RefreshCw01}>
                        Run health checks
                    </Button>
                </>
            }
        />
        <WorkspaceBody>
            <Callout icon={AlertCircle} title="No live source-system telemetry is connected" tone="amber">
                The values below are an illustrative operating scenario for design review. Production health, delivery, backup, and restore claims must come
                from verified telemetry and retained test evidence.
            </Callout>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Link01} label="Modeled systems" value="8" supporting="Illustrative ownership contracts" />
                <MetricCard icon={CheckCircle} label="Modeled delivery" value="99.8%" supporting="Synthetic 24-hour scenario" tone="green" />
                <MetricCard icon={AlertCircle} label="Modeled retry queue" value="4" supporting="Synthetic oldest retry: 7 min" tone="amber" />
                <MetricCard icon={Database01} label="Restore-test target" value="30 days" supporting="Evidence not yet generated" tone="purple" />
            </div>
            <Callout icon={CloudLightning} title="Portable by design">
                Domain services use PostgreSQL migrations, provider-neutral identities, storage and queue adapters, transactional outbox events, and exportable
                audit evidence.
            </Callout>
            <Panel
                title="Integration health scenario"
                description="Synthetic rows demonstrate the intended idempotent, replayable delivery and reconciliation model."
                action={
                    <Button size="sm" color="secondary">
                        Ownership matrix
                    </Button>
                }
                flush
            >
                <DataTable
                    label="Synthetic integration health"
                    rows={integrationRows}
                    columns={[
                        {
                            id: "system",
                            label: "Integration",
                            render: (row) => (
                                <div>
                                    <p className="font-semibold text-primary">{row.system}</p>
                                    <p className="mt-0.5 text-xs text-quaternary">{row.role}</p>
                                </div>
                            ),
                        },
                        { id: "direction", label: "Direction", render: (row) => row.direction },
                        { id: "last", label: "Last success", render: (row) => row.last },
                        { id: "latency", label: "Latency", render: (row) => row.latency },
                        {
                            id: "errors",
                            label: "Errors",
                            render: (row) => (
                                <span className={row.errors === "0" ? "text-success-primary" : "font-semibold text-error-primary"}>{row.errors}</span>
                            ),
                        },
                        {
                            id: "state",
                            label: "State",
                            render: (row) => (
                                <StatusBadge tone={row.state === "Healthy" ? "green" : row.state === "Degraded" ? "amber" : "purple"}>{row.state}</StatusBadge>
                            ),
                        },
                        { id: "open", label: "", className: "text-right", render: () => <OpenLink>Inspect</OpenLink> },
                    ]}
                />
            </Panel>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
                <Panel title="Phased feature rollout" description="Synthetic pilot cohorts · changes are not persisted in this preview">
                    <FeatureSwitch label="B747 record jackets" description="Pilot group · 25 records users" defaultEnabled />
                    <FeatureSwitch label="B747 qualification forecast" description="Training operations and records roles" defaultEnabled />
                    <FeatureSwitch label="Instructor offline pack" description="Six-device controlled field test" defaultEnabled />
                    <FeatureSwitch label="B777 curriculum workspace" description="Program authoring sandbox only" defaultEnabled={false} />
                </Panel>
                <Panel title="Backup and portability targets">
                    <CheckList
                        items={[
                            { label: "Database point-in-time recovery", supporting: "Target defined; execution evidence required", complete: false },
                            { label: "Object parity and hash scan", supporting: "Design includes attachments and signed exports", complete: false },
                            { label: "Independent retained export", supporting: "Archive workflow modeled; provider not connected", complete: false },
                            { label: "Cross-provider restore exercise", supporting: "Required before production approval", complete: false },
                        ]}
                    />
                    <div className="mt-5 flex gap-2 border-t border-secondary pt-4">
                        <Button color="secondary" size="sm" iconLeading={Download01}>
                            Export manifest
                        </Button>
                        <Button color="secondary" size="sm" iconLeading={UploadCloud02}>
                            Restore evidence
                        </Button>
                    </div>
                </Panel>
            </div>
            <Panel title="Configuration audit" description="Configuration changes are diffed, approved, and retained as high-risk audit events." flush>
                <DataTable
                    label="Configuration audit"
                    rows={configRows}
                    columns={[
                        { id: "time", label: "Time", render: (row) => <span className="whitespace-nowrap">{row.time}</span> },
                        { id: "actor", label: "Actor", render: (row) => row.actor },
                        { id: "area", label: "Area", render: (row) => <StatusBadge tone="blue">{row.area}</StatusBadge> },
                        { id: "change", label: "Change", render: (row) => <span className="font-medium text-secondary">{row.change}</span> },
                        { id: "approval", label: "Change record", render: (row) => <span className="font-mono text-xs">{row.approval}</span> },
                    ]}
                />
            </Panel>
            <div className="grid gap-5 sm:grid-cols-3">
                <Panel title="Access model">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-utility-purple-50 text-utility-purple-700 ring-1 ring-utility-purple-200">
                            <Lock01 aria-hidden="true" className="size-5" />
                        </span>
                        <div>
                            <p className="text-lg font-semibold text-primary">36 roles</p>
                            <p className="text-xs text-tertiary">Scoped by fleet, base, program, and object</p>
                        </div>
                    </div>
                </Panel>
                <Panel title="Workflow model">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-utility-blue-50 text-utility-blue-700 ring-1 ring-utility-blue-200">
                            <Sliders04 aria-hidden="true" className="size-5" />
                        </span>
                        <div>
                            <p className="text-lg font-semibold text-primary">14 flows</p>
                            <p className="text-xs text-tertiary">All active versions have approvers</p>
                        </div>
                    </div>
                </Panel>
                <Panel title="Migration control">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-lg bg-utility-green-50 text-utility-green-700 ring-1 ring-utility-green-200">
                            <ShieldTick aria-hidden="true" className="size-5" />
                        </span>
                        <div>
                            <p className="text-lg font-semibold text-primary">99.3%</p>
                            <p className="text-xs text-tertiary">Legacy records reconciled with provenance</p>
                        </div>
                    </div>
                </Panel>
            </div>
        </WorkspaceBody>
    </div>
);
