"use client";

import {
    BarChart01,
    Calendar,
    CheckCircle,
    Clock,
    FileShield02,
    Flag01,
    GraduationHat01,
    Lock01,
    Shield01,
    ShieldTick,
    Target04,
    UserCheck01,
    Users01,
    UsersCheck,
} from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import {
    Callout,
    CheckList,
    DataTable,
    MetricCard,
    MiniStat,
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

const samplingRows = [
    { id: "reg-na", region: "North America", target: "42%", actual: "44%", checks: "11", variance: "+2 pts", state: "On plan" },
    { id: "reg-eu", region: "Europe", target: "21%", actual: "20%", checks: "5", variance: "−1 pt", state: "On plan" },
    { id: "reg-apac", region: "Asia Pacific", target: "19%", actual: "16%", checks: "4", variance: "−3 pts", state: "Watch" },
    { id: "reg-mea", region: "Middle East / Africa", target: "12%", actual: "12%", checks: "3", variance: "0 pts", state: "On plan" },
    { id: "reg-latam", region: "Latin America", target: "6%", actual: "8%", checks: "2", variance: "+2 pts", state: "On plan" },
] as const;

const protectedAssignments = [
    { id: "nn-001", window: "Aug · Week 1", region: "North America", fleet: "B747", evaluator: "Assigned", access: "2 authorized", state: "Ready" },
    { id: "nn-002", window: "Aug · Week 2", region: "Asia Pacific", fleet: "B777", evaluator: "Pending", access: "1 authorized", state: "Staffing" },
    { id: "nn-003", window: "Aug · Week 4", region: "Europe", fleet: "B767", evaluator: "Assigned", access: "2 authorized", state: "Ready" },
] as const;

export const NoNoticeWorkspace = () => (
    <div className="min-h-full">
        <WorkspaceHeader
            eyebrow="M8 · No-notice"
            title="No-notice program control"
            description="Track annual execution and representative sampling while protecting assignment details behind need-to-know access."
            status={<StatusBadge tone="purple">Restricted workspace</StatusBadge>}
            actions={
                <Button size="sm" iconLeading={Lock01}>
                    Protected schedule
                </Button>
            }
        />
        <WorkspaceBody>
            <Callout icon={Shield01} title="Protected operating data" tone="purple">
                Assignment identities and exact operating details are revealed only to authorized program personnel. All views and exports are logged.
            </Callout>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Target04} label="Annual target" value="36" supporting="Approved program year 2026" />
                <MetricCard icon={CheckCircle} label="Completed" value="25" supporting="69% of annual target" tone="green" />
                <MetricCard icon={Calendar} label="Protected assignments" value="7" supporting="Next 90 days · need-to-know" tone="purple" />
                <MetricCard icon={Flag01} label="Sampling gaps" value="1" supporting="Asia Pacific below plan" tone="amber" />
            </div>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
                <Panel title="Annual execution" description="Completed checks by month against cumulative plan">
                    <SparkBars values={[2, 3, 4, 3, 4, 5, 4]} labels={["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"]} tone="purple" height={170} />
                    <div className="mt-5">
                        <ProgressBar label="Annual target progress" value={69} tone="purple" />
                    </div>
                </Panel>
                <Panel title="Program controls">
                    <CheckList
                        items={[
                            { label: "Annual target approved", supporting: "Authority record and effective dates present", complete: true },
                            { label: "Geographic sample on plan", supporting: "One region needs additional coverage", complete: false },
                            { label: "Base-month tracking current", supporting: "25 of 25 completed records reconciled", complete: true },
                            { label: "Publication-audit model", supporting: "Synthetic next review: 18 Aug 2026", complete: true },
                        ]}
                    />
                </Panel>
            </div>
            <Panel title="Geographic sampling" description="Distribution uses completed evaluations; target percentages are approved planning goals." flush>
                <DataTable
                    label="Geographic sampling distribution"
                    rows={samplingRows}
                    columns={[
                        { id: "region", label: "Region", render: (row) => <span className="font-semibold text-primary">{row.region}</span> },
                        { id: "target", label: "Target", render: (row) => row.target },
                        { id: "actual", label: "Actual", render: (row) => row.actual },
                        { id: "checks", label: "Completed", render: (row) => row.checks },
                        { id: "variance", label: "Variance", render: (row) => row.variance },
                        {
                            id: "state",
                            label: "State",
                            render: (row) => <StatusBadge tone={row.state === "Watch" ? "amber" : "green"}>{row.state}</StatusBadge>,
                        },
                    ]}
                />
            </Panel>
            <Panel
                title="Protected assignment windows"
                description="Exact dates, routes, crew identities, and evaluator names are intentionally masked in this overview."
                flush
            >
                <DataTable
                    label="Protected assignment windows"
                    rows={protectedAssignments}
                    columns={[
                        { id: "window", label: "Window", render: (row) => <span className="font-semibold text-primary">{row.window}</span> },
                        { id: "region", label: "Region", render: (row) => row.region },
                        { id: "fleet", label: "Fleet", render: (row) => row.fleet },
                        { id: "evaluator", label: "Evaluator", render: (row) => row.evaluator },
                        { id: "access", label: "Access", render: (row) => row.access },
                        {
                            id: "state",
                            label: "State",
                            render: (row) => <StatusBadge tone={row.state === "Ready" ? "green" : "amber"}>{row.state}</StatusBadge>,
                        },
                    ]}
                />
            </Panel>
        </WorkspaceBody>
    </div>
);

const trackingCases = [
    {
        id: "ST-2407",
        person: "Crewmember 12114",
        fleetSeat: "B767 · First officer",
        enrolled: "12 Jun 2026",
        window: "11 Aug–09 Oct",
        next: "Exit event set A",
        state: "Window open",
    },
    {
        id: "ST-2411",
        person: "Crewmember 11654",
        fleetSeat: "B777 · First officer",
        enrolled: "02 Jul 2026",
        window: "31 Aug–29 Oct",
        next: "Remediation plan",
        state: "Pre-window",
    },
    {
        id: "ST-2398",
        person: "Crewmember 08742",
        fleetSeat: "B747 · Captain",
        enrolled: "14 May 2026",
        window: "13 Jul–10 Sep",
        next: "TRB review",
        state: "Review hold",
    },
    {
        id: "ST-2389",
        person: "Crewmember 10482",
        fleetSeat: "B747 · Captain",
        enrolled: "28 Apr 2026",
        window: "27 Jun–25 Aug",
        next: "Exit event set B",
        state: "Scheduled",
    },
] as const;

const trbItems = [
    {
        id: "trb-14",
        title: "Case TRB-014 · evidence complete",
        meta: "Review 04 Aug 2026 · 10:00 ET",
        detail: "5 reviewers · 12 governed artifacts",
        state: "Ready",
    },
    {
        id: "trb-15",
        title: "Case TRB-015 · response requested",
        meta: "Review 11 Aug 2026 · 14:00 ET",
        detail: "One remediation artifact outstanding",
        state: "Attention",
    },
] as const;

export const SpecialTrackingWorkspace = () => (
    <div className="min-h-full">
        <WorkspaceHeader
            eyebrow="M9 · Special tracking"
            title="Special tracking, remediation, and TRB"
            description="Manage sensitive enrollment, bounded exit windows, remediation evidence, and review-board decisions."
            status={<StatusBadge tone="purple">Sensitive records</StatusBadge>}
            actions={
                <>
                    <Button color="secondary" size="sm">
                        Window calendar
                    </Button>
                    <Button size="sm" iconLeading={ShieldTick}>
                        New enrollment
                    </Button>
                </>
            }
        />
        <WorkspaceBody>
            <Callout icon={Lock01} title="Case-scoped access model" tone="purple">
                Only assigned roles can view case narratives or evidence. Population views expose the minimum data needed for safe operations.
            </Callout>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={Users01} label="Active enrollments" value="18" supporting="Across 3 fleets" />
                <MetricCard icon={Clock} label="Windows open" value="7" supporting="2 close inside 30 days" tone="amber" />
                <MetricCard icon={Calendar} label="Exit events scheduled" value="5" supporting="71% of open-window cases" tone="green" />
                <MetricCard icon={FileShield02} label="TRB cases open" value="2" supporting="1 needs additional evidence" tone="purple" />
            </div>
            <Toolbar searchLabel="Search special tracking cases" searchPlaceholder="Search case ID or crewmember">
                <NativeSelect
                    label="Window state"
                    defaultValue="All active"
                    options={["All active", "Pre-window", "Window open", "Scheduled", "Review hold"]}
                />
            </Toolbar>
            <Panel title="Special tracking population" description="Window start and end recalculate only from approved intervening events." flush>
                <DataTable
                    label="Special tracking population"
                    rows={trackingCases}
                    columns={[
                        {
                            id: "case",
                            label: "Case",
                            render: (row) => (
                                <div>
                                    <p className="font-semibold text-primary">{row.id}</p>
                                    <p className="mt-0.5 text-xs text-quaternary">{row.person}</p>
                                </div>
                            ),
                        },
                        { id: "fleet", label: "Fleet / seat", render: (row) => row.fleetSeat },
                        { id: "enrolled", label: "Enrolled", render: (row) => row.enrolled },
                        { id: "window", label: "Eligible window", render: (row) => <span className="font-medium text-secondary">{row.window}</span> },
                        { id: "next", label: "Next action", render: (row) => row.next },
                        {
                            id: "state",
                            label: "State",
                            render: (row) => (
                                <StatusBadge
                                    tone={
                                        row.state === "Window open"
                                            ? "amber"
                                            : row.state === "Scheduled"
                                              ? "green"
                                              : row.state === "Review hold"
                                                ? "red"
                                                : "blue"
                                    }
                                >
                                    {row.state}
                                </StatusBadge>
                            ),
                        },
                        { id: "open", label: "", className: "text-right", render: () => <OpenLink>Case</OpenLink> },
                    ]}
                />
            </Panel>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(300px,0.9fr)]">
                <Panel title="TRB docket" description="Upcoming review-board case files" flush>
                    {trbItems.map((item) => (
                        <QueueItem
                            key={item.id}
                            title={item.title}
                            meta={item.meta}
                            detail={item.detail}
                            badge={<StatusBadge tone={item.state === "Ready" ? "green" : "amber"}>{item.state}</StatusBadge>}
                        />
                    ))}
                </Panel>
                <Panel title="Program window health">
                    <div className="grid grid-cols-2 gap-3">
                        <MiniStat label="Within window" value="7" tone="success" />
                        <MiniStat label="Pre-window" value="6" />
                        <MiniStat label="Schedule risk" value="2" tone="warning" />
                        <MiniStat label="Past hard stop" value="0" tone="success" />
                    </div>
                </Panel>
            </div>
        </WorkspaceBody>
    </div>
);

const instructorRows = [
    {
        id: "ie-041",
        instructor: "Instructor 041",
        base: "CVG",
        fleet: "B747",
        roles: "Instructor · Evaluator",
        authorization: "Current",
        calibration: "Aligned",
        workload: "74%",
    },
    {
        id: "ie-112",
        instructor: "Instructor 112",
        base: "ANC",
        fleet: "B747",
        roles: "Instructor",
        authorization: "Current",
        calibration: "Review",
        workload: "88%",
    },
    {
        id: "ie-078",
        instructor: "Instructor 078",
        base: "MIA",
        fleet: "B767",
        roles: "Instructor · Evaluator",
        authorization: "At risk",
        calibration: "Aligned",
        workload: "61%",
    },
    {
        id: "ie-096",
        instructor: "Instructor 096",
        base: "CVG",
        fleet: "B777",
        roles: "Evaluator",
        authorization: "Current",
        calibration: "Aligned",
        workload: "92%",
    },
    {
        id: "ie-133",
        instructor: "Instructor 133",
        base: "CVG",
        fleet: "B777",
        roles: "Instructor",
        authorization: "Current",
        calibration: "Due",
        workload: "55%",
    },
] as const;

const calibrationBands = [
    { id: "band-1", label: "Within expected band", value: "41", percent: 82, tone: "green" as const },
    { id: "band-2", label: "Coaching review", value: "6", percent: 12, tone: "amber" as const },
    { id: "band-3", label: "Standardization required", value: "3", percent: 6, tone: "red" as const },
] as const;

export const InstructorManagementWorkspace = () => (
    <div className="min-h-full">
        <WorkspaceHeader
            eyebrow="M10 · I/E management"
            title="Instructor and evaluator readiness"
            description="Keep qualifications, event authorizations, calibration, observation, completion performance, and workload in view."
            status={<StatusBadge tone="green">94% ready</StatusBadge>}
            actions={
                <>
                    <Button color="secondary" size="sm">
                        Authorization matrix
                    </Button>
                    <Button size="sm" iconLeading={GraduationHat01}>
                        Assign standardization
                    </Button>
                </>
            }
        />
        <WorkspaceBody>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard icon={UsersCheck} label="Active I/E population" value="143" supporting="5 fleets · 4 bases" />
                <MetricCard icon={UserCheck01} label="Fully authorized" value="134" supporting="93.7% of active roster" tone="green" />
                <MetricCard icon={Target04} label="Calibration attention" value="9" supporting="3 need standardization" tone="amber" />
                <MetricCard icon={BarChart01} label="Median workload" value="76%" supporting="Next 28 days" tone="purple" />
            </div>
            <Toolbar searchLabel="Search instructor roster" searchPlaceholder="Search instructor, fleet, base, or authorization">
                <NativeSelect label="Fleet" defaultValue="All fleets" options={["All fleets", "B747", "B777", "B767"]} />
                <NativeSelect label="Readiness" defaultValue="All readiness" options={["All readiness", "Current", "At risk", "Expired"]} />
            </Toolbar>
            <Panel title="Instructor / evaluator roster" description="Authorization reflects the exact event types each person may conduct." flush>
                <DataTable
                    label="Instructor and evaluator roster"
                    rows={instructorRows}
                    columns={[
                        {
                            id: "instructor",
                            label: "Instructor / evaluator",
                            render: (row) => <span className="font-semibold text-primary">{row.instructor}</span>,
                        },
                        { id: "base", label: "Base", render: (row) => row.base },
                        { id: "fleet", label: "Fleet", render: (row) => row.fleet },
                        { id: "roles", label: "Roles", render: (row) => row.roles },
                        {
                            id: "authorization",
                            label: "Authorization",
                            render: (row) => <StatusBadge tone={row.authorization === "Current" ? "green" : "amber"}>{row.authorization}</StatusBadge>,
                        },
                        {
                            id: "calibration",
                            label: "Calibration",
                            render: (row) => (
                                <StatusBadge tone={row.calibration === "Aligned" ? "green" : row.calibration === "Review" ? "amber" : "red"}>
                                    {row.calibration}
                                </StatusBadge>
                            ),
                        },
                        { id: "workload", label: "Workload", render: (row) => row.workload },
                    ]}
                />
            </Panel>
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
                <Panel title="Calibration distribution" description="Statistical signals initiate review; they do not make personnel decisions.">
                    <div className="space-y-4">
                        {calibrationBands.map((band) => (
                            <div key={band.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
                                <ProgressBar label={band.label} value={band.percent} tone={band.tone} />
                                <span className="pb-0.5 text-sm font-semibold text-primary">{band.value}</span>
                            </div>
                        ))}
                    </div>
                </Panel>
                <Panel title="Readiness gates">
                    <CheckList
                        items={[
                            { label: "Qualification currency", supporting: "3 authorizations enter warning inside 30 days", complete: false },
                            { label: "Standardization participation", supporting: "136 of 143 current", complete: false },
                            { label: "Line observation cycle", supporting: "All hard-stop dates covered", complete: true },
                            { label: "Form completion performance", supporting: "Median completion 18 minutes", complete: true },
                        ]}
                    />
                </Panel>
            </div>
            <Callout icon={ShieldTick} title="Fair-use calibration guardrail">
                Rating distributions are normalized for event type and cohort. No single metric may be used as a standalone performance conclusion.
            </Callout>
        </WorkspaceBody>
    </div>
);
