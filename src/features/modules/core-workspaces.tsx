"use client";

import { useState } from "react";
import {
    AlertCircle,
    BookOpen01,
    Calendar,
    CalendarCheck01,
    Database01,
    Grid01,
    LayersThree01,
    Monitor01,
    Route,
    Target04,
    UserCheck01,
    Users01,
    UsersCheck,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
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
    RingMetric,
    SparkBars,
    StatusBadge,
    Toolbar,
    WorkspaceBody,
    WorkspaceHeader,
} from "./module-ui";

const people = [
    {
        id: "10482",
        person: "Crewmember 10482",
        fleetSeat: "B747 · Captain",
        base: "CVG",
        program: "AQP CQ",
        status: "Current",
        nextDue: "31 Oct 2026",
        completeness: "100%",
    },
    {
        id: "11807",
        person: "Crewmember 11807",
        fleetSeat: "B747 · First officer",
        base: "ANC",
        program: "AQP CQ",
        status: "At risk",
        nextDue: "31 Aug 2026",
        completeness: "96%",
    },
    {
        id: "09331",
        person: "Crewmember 09331",
        fleetSeat: "B777 · Captain",
        base: "CVG",
        program: "Traditional",
        status: "Current",
        nextDue: "30 Nov 2026",
        completeness: "100%",
    },
    {
        id: "12114",
        person: "Crewmember 12114",
        fleetSeat: "B767 · First officer",
        base: "MIA",
        program: "Traditional",
        status: "Restricted",
        nextDue: "15 Aug 2026",
        completeness: "89%",
    },
    {
        id: "08742",
        person: "Crewmember 08742",
        fleetSeat: "B747 · Captain",
        base: "ANC",
        program: "AQP CQ",
        status: "Current",
        nextDue: "31 Dec 2026",
        completeness: "100%",
    },
] as const;

const PopulationView = () => (
    <WorkspaceBody>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Users01} label="Training population" value="1,911" supporting="Active employees in scope" />
            <MetricCard icon={UserCheck01} label="Current" value="1,842" supporting="96.4% of population" tone="green" />
            <MetricCard icon={AlertCircle} label="At risk within 60 days" value="47" supporting="12 require a schedule change" tone="amber" />
            <MetricCard icon={LayersThree01} label="Incomplete jackets" value="22" supporting="7 have blocking evidence gaps" tone="red" />
        </div>
        <Toolbar searchLabel="Search training population" searchPlaceholder="Search ID, fleet, base, or saved view">
            <NativeSelect label="Program" defaultValue="All programs" options={["All programs", "AQP CQ", "Traditional"]} />
            <NativeSelect label="Qualification status" defaultValue="All statuses" options={["All statuses", "Current", "At risk", "Restricted", "Expired"]} />
        </Toolbar>
        <Panel
            title="Training population"
            description="Saved view: Active flightcrew · all fleets · qualification attention first"
            action={
                <Button size="sm" color="secondary">
                    Save view
                </Button>
            }
            flush
        >
            <DataTable
                label="Training population"
                rows={people}
                columns={[
                    {
                        id: "person",
                        label: "Crewmember",
                        render: (row) => (
                            <div>
                                <p className="font-semibold text-primary">{row.person}</p>
                                <p className="mt-0.5 font-mono text-xs text-quaternary">ID {row.id}</p>
                            </div>
                        ),
                    },
                    { id: "fleetSeat", label: "Fleet / seat", render: (row) => row.fleetSeat },
                    { id: "base", label: "Base", render: (row) => row.base },
                    {
                        id: "program",
                        label: "Program",
                        render: (row) => <StatusBadge tone={row.program === "AQP CQ" ? "blue" : "purple"}>{row.program}</StatusBadge>,
                    },
                    {
                        id: "status",
                        label: "Qualification",
                        render: (row) => (
                            <StatusBadge tone={row.status === "Current" ? "green" : row.status === "At risk" ? "amber" : "red"}>{row.status}</StatusBadge>
                        ),
                    },
                    { id: "nextDue", label: "Next due", render: (row) => row.nextDue },
                    { id: "completeness", label: "Jacket", render: (row) => row.completeness },
                    { id: "open", label: "", className: "text-right", render: () => <OpenLink>Jacket</OpenLink> },
                ]}
            />
        </Panel>
    </WorkspaceBody>
);

const history = [
    { id: "hist-1", title: "CQ simulator evaluation", meta: "22 Jul 2026 · Event 0842 · AQP CQ", detail: "Satisfactory · released after QC" },
    { id: "hist-2", title: "Ground recurrent module", meta: "18 Jul 2026 · Class 221 · AQP CQ", detail: "Complete · 4.0 credit hours" },
    { id: "hist-3", title: "Line operating experience", meta: "02 Jun 2026 · Operational record", detail: "Consolidation threshold met" },
] as const;

const RecordJacketView = () => (
    <WorkspaceBody>
        <Callout
            icon={UserCheck01}
            title="Crewmember 10482 · B747 Captain · CVG"
            tone="blue"
            action={
                <Button size="sm" color="secondary">
                    Export jacket
                </Button>
            }
        >
            Governing program: AQP Continuing Qualification · Current policy and curriculum binding verified.
        </Callout>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
            <div className="space-y-5">
                <Panel title="Qualification summary" description="Calculated at 30 Jul 2026 · 09:42 ET">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <MiniStat label="Overall status" value="Current" tone="success" />
                        <MiniStat label="Next due" value="31 Oct" />
                        <MiniStat label="Restrictions" value="None" />
                        <MiniStat label="Record complete" value="100%" tone="success" />
                    </div>
                </Panel>
                <Panel title="Event and form history" description="Released records with amendments shown inline." flush>
                    {history.map((item) => (
                        <QueueItem
                            key={item.id}
                            title={item.title}
                            meta={item.meta}
                            detail={item.detail}
                            badge={<StatusBadge tone="green">Released</StatusBadge>}
                        />
                    ))}
                </Panel>
            </div>
            <div className="space-y-5">
                <Panel title="Record completeness">
                    <RingMetric value={100} label="Evidence complete" sublabel="28 requirements · 74 supporting records" tone="green" />
                    <div className="mt-5 border-t border-secondary pt-4">
                        <CheckList
                            items={[
                                { label: "Identity and employment", complete: true },
                                { label: "Training and checking", complete: true },
                                { label: "Qualifications and limitations", complete: true },
                                { label: "Signatures and source lineage", complete: true },
                            ]}
                        />
                    </div>
                </Panel>
                <Panel title="Credential watch">
                    <ProgressBar label="Medical certificate" value={64} tone="green" />
                    <div className="mt-4">
                        <ProgressBar label="Passport / travel credential" value={37} tone="amber" />
                    </div>
                </Panel>
            </div>
        </div>
    </WorkspaceBody>
);

const requirements = [
    { id: "req-1", requirement: "Continuing qualification cycle", status: "Current", evidence: "CQ cycle 2", completed: "22 Jul 2026", due: "31 Oct 2026" },
    { id: "req-2", requirement: "Landing recency", status: "Current", evidence: "Ops feed", completed: "28 Jul 2026", due: "28 Oct 2026" },
    { id: "req-3", requirement: "Line check", status: "Current", evidence: "Form LC-04", completed: "09 Feb 2026", due: "28 Feb 2027" },
    { id: "req-4", requirement: "Hazardous materials recurrent", status: "At risk", evidence: "Course HM-22", completed: "14 Aug 2025", due: "31 Aug 2026" },
    { id: "req-5", requirement: "Special airport authorization", status: "Current", evidence: "Module SA-7", completed: "04 May 2026", due: "31 May 2027" },
] as const;

const QualificationMatrixView = () => (
    <WorkspaceBody>
        <Toolbar searchLabel="Search qualification requirements" searchPlaceholder="Search requirement or evidence">
            <NativeSelect
                label="Requirement state"
                defaultValue="All requirements"
                options={["All requirements", "Current", "At risk", "Expired", "Not held"]}
            />
        </Toolbar>
        <Panel title="Crewmember 10482 · qualification matrix" description="Requirement status is a rebuildable projection from released outcome events." flush>
            <DataTable
                label="Qualification matrix"
                rows={requirements}
                columns={[
                    { id: "requirement", label: "Requirement", render: (row) => <span className="font-semibold text-primary">{row.requirement}</span> },
                    {
                        id: "status",
                        label: "Status",
                        render: (row) => <StatusBadge tone={row.status === "Current" ? "green" : "amber"}>{row.status}</StatusBadge>,
                    },
                    { id: "evidence", label: "Evidence", render: (row) => row.evidence },
                    { id: "completed", label: "Satisfied", render: (row) => row.completed },
                    { id: "due", label: "Due", render: (row) => row.due },
                    { id: "audit", label: "", className: "text-right", render: () => <OpenLink>Explain</OpenLink> },
                ]}
            />
        </Panel>
        <Callout icon={Database01} title="Every status is explainable">
            Open “Explain” to see the rule version, evidence events, calendar-month convention, and exact calculation path that produced the status.
        </Callout>
    </WorkspaceBody>
);

const recordsTabs = [
    { id: "population", label: "Training population" },
    { id: "jacket", label: "Record jacket" },
    { id: "matrix", label: "Qualification matrix" },
] as const;

/** @deprecated Replaced by the interactive records feature in `src/features/records`. */
export const LegacyRecordsWorkspacePreview = ({ initialView = "population" }: ModuleViewProps) => {
    const [view, setView] = useState(recordsTabs.some((tab) => tab.id === initialView) ? initialView : "population");
    return (
        <div className="min-h-full">
            <WorkspaceHeader
                eyebrow="M4 · Training records"
                title="Training population and record jackets"
                description="Person-centric evidence, qualification status, completeness, history, and portable record exports."
                status={<StatusBadge tone="green">Data current 09:42 ET</StatusBadge>}
                actions={
                    <Button size="sm" color="secondary">
                        Saved views
                    </Button>
                }
            />
            <ModuleTabs tabs={recordsTabs} selected={view} onSelect={setView} />
            {view === "jacket" ? <RecordJacketView /> : view === "matrix" ? <QualificationMatrixView /> : <PopulationView />}
        </div>
    );
};

const forecastMonths = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"];
const forecastValues = [132, 98, 174, 121, 83, 149];
const riskRows = [
    { id: "r-01", cohort: "B747 Captains · CVG", requirement: "CQ cycle completion", due: "31 Aug 2026", people: "12", scheduled: "8", risk: "High" },
    { id: "r-02", cohort: "B767 First officers · MIA", requirement: "Line check", due: "30 Sep 2026", people: "7", scheduled: "6", risk: "Medium" },
    { id: "r-03", cohort: "B777 I/E population", requirement: "Standardization", due: "31 Oct 2026", people: "5", scheduled: "5", risk: "Low" },
] as const;

const ForecastView = () => (
    <WorkspaceBody>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={CalendarCheck01} label="Due in next 90 days" value="404" supporting="Across 17 requirement types" />
            <MetricCard icon={AlertCircle} label="Unscheduled" value="28" supporting="12 inside 30-day warning" tone="amber" />
            <MetricCard icon={UsersCheck} label="Projected current" value="98.1%" supporting="At 31 Oct 2026" tone="green" />
            <MetricCard icon={Route} label="Restoration plans open" value="6" supporting="2 await authority approval" tone="purple" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
            <Panel title="Expiration forecast" description="Due volume by calendar month · all active programs">
                <SparkBars values={forecastValues} labels={forecastMonths} height={180} />
            </Panel>
            <Panel title="Capacity coverage" description="Available seats against forecast demand">
                <div className="space-y-4">
                    <ProgressBar label="August" value={91} tone="amber" />
                    <ProgressBar label="September" value={100} tone="green" />
                    <ProgressBar label="October" value={87} tone="amber" />
                    <ProgressBar label="November" value={100} tone="green" />
                    <ProgressBar label="December" value={96} />
                </div>
            </Panel>
        </div>
        <Panel title="At-risk cohorts" description="Forecasted qualification risk after confirmed schedule coverage." flush>
            <DataTable
                label="At-risk cohorts"
                rows={riskRows}
                columns={[
                    { id: "cohort", label: "Cohort", render: (row) => <span className="font-semibold text-primary">{row.cohort}</span> },
                    { id: "requirement", label: "Requirement", render: (row) => row.requirement },
                    { id: "due", label: "Due", render: (row) => row.due },
                    { id: "people", label: "People", render: (row) => row.people },
                    { id: "scheduled", label: "Scheduled", render: (row) => row.scheduled },
                    {
                        id: "risk",
                        label: "Risk",
                        render: (row) => <StatusBadge tone={row.risk === "High" ? "red" : row.risk === "Medium" ? "amber" : "green"}>{row.risk}</StatusBadge>,
                    },
                ]}
            />
        </Panel>
    </WorkspaceBody>
);

const ruleRows = [
    {
        id: "rule-01",
        requirement: "AQP CQ cycle",
        basis: "Calendar month",
        population: "B747 AQP",
        version: "v4.2",
        effective: "01 Jan 2026",
        state: "Published",
    },
    {
        id: "rule-02",
        requirement: "Landing recency",
        basis: "Rolling interval",
        population: "All flightcrew",
        version: "v3.8",
        effective: "18 Jul 2026",
        state: "Published",
    },
    {
        id: "rule-03",
        requirement: "Special tracking exit",
        basis: "Bounded window",
        population: "Enrolled",
        version: "v2.1",
        effective: "Draft",
        state: "Review",
    },
    {
        id: "rule-04",
        requirement: "Instructor standardization",
        basis: "Calendar month",
        population: "I/E roster",
        version: "v5.0",
        effective: "01 Aug 2026",
        state: "Approved",
    },
] as const;

const RulesCatalogView = () => (
    <WorkspaceBody>
        <Toolbar searchLabel="Search requirement rules" searchPlaceholder="Search requirement, population, or citation">
            <NativeSelect label="Rule state" defaultValue="All states" options={["All states", "Draft", "Review", "Approved", "Published", "Retired"]} />
        </Toolbar>
        <Panel
            title="Requirement catalog"
            description="Versioned, effective-dated rules with deterministic tests and governing citations."
            action={<Button size="sm">New requirement</Button>}
            flush
        >
            <DataTable
                label="Requirement catalog"
                rows={ruleRows}
                columns={[
                    { id: "requirement", label: "Requirement", render: (row) => <span className="font-semibold text-primary">{row.requirement}</span> },
                    { id: "basis", label: "Time basis", render: (row) => row.basis },
                    { id: "population", label: "Population", render: (row) => row.population },
                    { id: "version", label: "Version", render: (row) => <span className="font-mono text-xs">{row.version}</span> },
                    { id: "effective", label: "Effective", render: (row) => row.effective },
                    {
                        id: "state",
                        label: "State",
                        render: (row) => (
                            <StatusBadge tone={row.state === "Published" ? "green" : row.state === "Approved" ? "blue" : "amber"}>{row.state}</StatusBadge>
                        ),
                    },
                ]}
            />
        </Panel>
        <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Rule quality gates">
                <CheckList
                    items={[
                        { label: "Boundary-date scenarios", supporting: "2,418 deterministic tests passing", complete: true },
                        { label: "Historical rebuild comparison", supporting: "No unexplained projection changes", complete: true },
                        { label: "Regulatory citations", supporting: "1 draft citation awaits approval", complete: false },
                        { label: "Downstream impact analysis", supporting: "Scheduling and reports evaluated", complete: true },
                    ]}
                />
            </Panel>
            <Panel title="Rule audit coverage">
                <RingMetric value={99} label="Explainable outcomes" sublabel="One migrated legacy status lacks complete source evidence" tone="green" />
            </Panel>
        </div>
    </WorkspaceBody>
);

const SimulatorView = () => (
    <WorkspaceBody>
        <Callout icon={Route} title="Safe simulation workspace" tone="purple">
            Inputs use production-shaped synthetic data. Simulations never change qualifications, schedules, notifications, or records.
        </Callout>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)]">
            <Panel title="Scenario inputs" description="Compare a proposed rule version against the currently published version.">
                <div className="grid gap-4 sm:grid-cols-2">
                    <NativeSelect label="Population" defaultValue="B747 AQP CQ" options={["B747 AQP CQ", "B777 traditional", "All instructors"]} />
                    <NativeSelect label="Proposed rule" defaultValue="CQ cycle v4.3 draft" options={["CQ cycle v4.3 draft", "Landing recency v3.9 draft"]} />
                    <label className="space-y-1.5">
                        <span className="text-sm font-medium text-secondary">As-of date</span>
                        <input
                            type="date"
                            defaultValue="2026-10-31"
                            className="h-10 w-full rounded-lg bg-primary px-3 text-sm shadow-xs ring-1 ring-primary outline-hidden focus:ring-2 focus:ring-brand"
                        />
                    </label>
                    <NativeSelect
                        label="Event assumption"
                        defaultValue="Confirmed schedule only"
                        options={["Confirmed schedule only", "Include proposed capacity", "No future events"]}
                    />
                </div>
                <div className="mt-5 flex justify-end">
                    <Button size="sm">Run simulation</Button>
                </div>
            </Panel>
            <Panel title="Projected difference">
                <div className="grid grid-cols-2 gap-3">
                    <MiniStat label="Status changes" value="14" tone="warning" />
                    <MiniStat label="Earlier expirations" value="6" tone="error" />
                    <MiniStat label="Later expirations" value="8" tone="success" />
                    <MiniStat label="No change" value="398" />
                </div>
            </Panel>
        </div>
    </WorkspaceBody>
);

const rulesTabs = [
    { id: "forecast", label: "Expiration forecast" },
    { id: "catalog", label: "Requirement catalog" },
    { id: "simulator", label: "What-if simulator" },
] as const;

export const QualificationRulesWorkspace = ({ initialView = "forecast" }: ModuleViewProps) => {
    const [view, setView] = useState(rulesTabs.some((tab) => tab.id === initialView) ? initialView : "forecast");
    return (
        <div className="min-h-full">
            <WorkspaceHeader
                eyebrow="M5 · Rules engine"
                title="Qualification and currency control"
                description="Govern effective-dated requirements, forecast expiration risk, and explain every qualification outcome."
                status={<StatusBadge tone="green">2,418 tests passing</StatusBadge>}
                actions={
                    <Button size="sm" color="secondary">
                        Rule audit
                    </Button>
                }
            />
            <ModuleTabs tabs={rulesTabs} selected={view} onSelect={setView} />
            {view === "catalog" ? <RulesCatalogView /> : view === "simulator" ? <SimulatorView /> : <ForecastView />}
        </div>
    );
};

const allocationRows = [
    { id: "cy-1", task: "Flightpath management", family: "Technical", cycle1: "Train", cycle2: "Evaluate", cycle3: "Sample", coverage: "100%" },
    { id: "cy-2", task: "Abnormal procedure management", family: "Technical", cycle1: "Evaluate", cycle2: "Train", cycle3: "Evaluate", coverage: "100%" },
    { id: "cy-3", task: "Leadership and teamwork", family: "CRM/TEM", cycle1: "Observe", cycle2: "Evaluate", cycle3: "Observe", coverage: "100%" },
    { id: "cy-4", task: "Automation awareness", family: "Knowledge", cycle1: "Train", cycle2: "Sample", cycle3: "Evaluate", coverage: "83%" },
    { id: "cy-5", task: "Threat and error management", family: "CRM/TEM", cycle1: "Evaluate", cycle2: "Evaluate", cycle3: "Evaluate", coverage: "100%" },
] as const;

const CurriculumAllocationView = () => (
    <WorkspaceBody>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Target04} label="Vision task identities" value="418" supporting="Stable IDs · 22 revised this cycle" />
            <MetricCard icon={Grid01} label="Tasks fully allocated" value="404" supporting="96.7% of required coverage" tone="green" />
            <MetricCard icon={AlertCircle} label="Allocation gaps" value="14" supporting="6 block publication" tone="amber" />
            <MetricCard icon={BookOpen01} label="Mapped objectives" value="98.2%" supporting="Objective → lesson → evaluation" tone="purple" />
        </div>
        <Toolbar searchLabel="Search CQ task allocations" searchPlaceholder="Search task ID, family, or event">
            <NativeSelect label="Cycle" defaultValue="2026–2028 CQ cycle" options={["2026–2028 CQ cycle", "2023–2025 archived"]} />
            <NativeSelect label="Coverage state" defaultValue="All tasks" options={["All tasks", "Complete", "Gap", "Overallocated"]} />
        </Toolbar>
        <Panel
            title="CQ task allocation"
            description="B747 AQP · 2026–2028 recurrent cycle · draft revision 3"
            action={<Button size="sm">Open allocation workbench</Button>}
            flush
        >
            <DataTable
                label="CQ task allocation"
                rows={allocationRows}
                columns={[
                    {
                        id: "task",
                        label: "Task",
                        render: (row) => (
                            <div>
                                <p className="font-semibold text-primary">{row.task}</p>
                                <p className="mt-0.5 text-xs text-quaternary">{row.family}</p>
                            </div>
                        ),
                    },
                    { id: "cycle1", label: "Cycle 1", render: (row) => <StatusBadge tone="blue">{row.cycle1}</StatusBadge> },
                    { id: "cycle2", label: "Cycle 2", render: (row) => <StatusBadge tone="purple">{row.cycle2}</StatusBadge> },
                    { id: "cycle3", label: "Cycle 3", render: (row) => <StatusBadge tone="gray">{row.cycle3}</StatusBadge> },
                    {
                        id: "coverage",
                        label: "Coverage",
                        render: (row) => (
                            <span className={row.coverage === "100%" ? "font-semibold text-success-primary" : "font-semibold text-warning-primary"}>
                                {row.coverage}
                            </span>
                        ),
                    },
                    { id: "edit", label: "", className: "text-right", render: () => <OpenLink>Trace</OpenLink> },
                ]}
            />
        </Panel>
        <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Publication readiness">
                <div className="space-y-4">
                    <ProgressBar label="Task allocation" value={97} tone="green" />
                    <ProgressBar label="Objective mapping" value={98} tone="green" />
                    <ProgressBar label="Scenario coverage" value={91} tone="amber" />
                    <ProgressBar label="Regulatory traceability" value={100} tone="green" />
                </div>
            </Panel>
            <Panel title="Version governance">
                <CheckList
                    items={[
                        { label: "Vision identity sync", supporting: "No missing or duplicate external task IDs", complete: true },
                        { label: "Allocation gap review", supporting: "6 publication-blocking gaps remain", complete: false },
                        { label: "Change impact analysis", supporting: "Forms, rules, guides, and reports evaluated", complete: true },
                        { label: "Approval routing", supporting: "Starts after gap review", complete: false },
                    ]}
                />
            </Panel>
        </div>
    </WorkspaceBody>
);

export const CurriculumWorkspace = () => (
    <div className="min-h-full">
        <WorkspaceHeader
            eyebrow="M6 · Curriculum"
            title="Curriculum and CQ task allocation"
            description="Design governed program structures while preserving stable task identity, coverage, traceability, and approval evidence."
            status={<StatusBadge tone="amber">Draft revision 3</StatusBadge>}
            actions={
                <>
                    <Button color="secondary" size="sm">
                        Compare versions
                    </Button>
                    <Button size="sm">Review gaps</Button>
                </>
            }
        />
        <CurriculumAllocationView />
    </div>
);

const deviceSlots = [
    { id: "slot-1", time: "08:00", sim1: "B777 · CQ", sim2: "B747 · CQ", sim3: "Maintenance", sim4: "B747 · CQ" },
    { id: "slot-2", time: "13:30", sim1: "B767 · Check", sim2: "B747 · CQ", sim3: "B777 · CQ", sim4: "Available" },
    { id: "slot-3", time: "19:00", sim1: "Available", sim2: "B747 · Recovery", sim3: "B777 · CQ", sim4: "Maintenance" },
] as const;

const crewPairs = [
    { id: "pair-118", crew: "Crew 118", captain: "ID 10482", firstOfficer: "ID 11807", event: "CQ · Event set C", exposure: "Balanced", conflicts: "0" },
    { id: "pair-203", crew: "Crew 203", captain: "ID 08742", firstOfficer: "ID 12114", event: "CQ · Event set D", exposure: "Review", conflicts: "1" },
    {
        id: "pair-087",
        crew: "Crew 087",
        captain: "ID 09331",
        firstOfficer: "ID 11654",
        event: "Qualification check",
        exposure: "Not applicable",
        conflicts: "0",
    },
] as const;

const SchedulingBoard = () => (
    <WorkspaceBody>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard icon={Calendar} label="Events this week" value="286" supporting="93% staffed and paired" />
            <MetricCard icon={Monitor01} label="Device utilization" value="87%" supporting="12 available recovery slots" tone="green" />
            <MetricCard icon={UsersCheck} label="Instructor coverage" value="95%" supporting="8 open assignments" tone="amber" />
            <MetricCard icon={AlertCircle} label="Hard conflicts" value="4" supporting="All before 48-hour threshold" tone="red" />
        </div>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
            <Panel
                title="Device board · Thu 30 Jul"
                description="Eastern Time (UTC−04:00) · restrictions included"
                action={
                    <Button size="sm" color="secondary">
                        Week view
                    </Button>
                }
                flush
            >
                <DataTable
                    label="Device schedule"
                    rows={deviceSlots}
                    columns={[
                        { id: "time", label: "Start", render: (row) => <span className="font-semibold text-primary">{row.time}</span> },
                        { id: "sim1", label: "SIM 1", render: (row) => row.sim1 },
                        { id: "sim2", label: "SIM 2", render: (row) => row.sim2 },
                        {
                            id: "sim3",
                            label: "SIM 3",
                            render: (row) => <span className={row.sim3 === "Maintenance" ? "text-warning-primary" : ""}>{row.sim3}</span>,
                        },
                        {
                            id: "sim4",
                            label: "SIM 4",
                            render: (row) => <span className={row.sim4 === "Maintenance" ? "text-warning-primary" : ""}>{row.sim4}</span>,
                        },
                    ]}
                />
            </Panel>
            <Panel title="Conflict panel" description="Ordered by event start">
                <QueueItem
                    title="Crew 203 seat compatibility"
                    meta="Today · 13:30 · SIM 2"
                    badge={<StatusBadge tone="red">Hard conflict</StatusBadge>}
                    detail="First officer authorization does not cover assigned event variant."
                />
                <QueueItem
                    title="SIM 3 maintenance overrun"
                    meta="Today · 19:00 · B777 CQ"
                    badge={<StatusBadge tone="amber">At risk</StatusBadge>}
                    detail="Updated return-to-service estimate is 18:35."
                />
                <QueueItem title="Instructor duty limit" meta="Tomorrow · 07:00 · SIM 1" badge={<StatusBadge tone="amber">Review</StatusBadge>} />
            </Panel>
        </div>
        <Panel title="Crew pairing board" description="Compatibility, qualification, and scenario exposure are validated together." flush>
            <DataTable
                label="Crew pairing board"
                rows={crewPairs}
                columns={[
                    { id: "crew", label: "Crew", render: (row) => <span className="font-semibold text-primary">{row.crew}</span> },
                    { id: "captain", label: "Captain", render: (row) => row.captain },
                    { id: "firstOfficer", label: "First officer", render: (row) => row.firstOfficer },
                    { id: "event", label: "Event", render: (row) => row.event },
                    {
                        id: "exposure",
                        label: "Exposure",
                        render: (row) => (
                            <StatusBadge tone={row.exposure === "Balanced" ? "green" : row.exposure === "Review" ? "amber" : "gray"}>
                                {row.exposure}
                            </StatusBadge>
                        ),
                    },
                    {
                        id: "conflicts",
                        label: "Conflicts",
                        render: (row) => (
                            <span className={row.conflicts === "0" ? "text-success-primary" : "font-semibold text-error-primary"}>{row.conflicts}</span>
                        ),
                    },
                ]}
            />
        </Panel>
    </WorkspaceBody>
);

export const SchedulingWorkspace = () => (
    <div className="min-h-full">
        <WorkspaceHeader
            eyebrow="M7 · Scheduling"
            title="Training schedule and crew pairing"
            description="Coordinate demand, device capacity, instructor authorization, crew compatibility, and task exposure."
            status={<StatusBadge tone="amber">4 hard conflicts</StatusBadge>}
            actions={
                <>
                    <Button color="secondary" size="sm">
                        Capacity model
                    </Button>
                    <Button size="sm" iconLeading={CalendarCheck01}>
                        Build class
                    </Button>
                </>
            }
        />
        <SchedulingBoard />
    </div>
);
