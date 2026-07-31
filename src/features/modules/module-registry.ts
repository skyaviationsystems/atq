import {
    BarChartSquare02,
    Calendar,
    ClipboardCheck,
    Database01,
    FileShield02,
    GraduationHat01,
    Grid01,
    LayersThree01,
    Lock01,
    Route,
    Settings01,
    ShieldTick,
    UsersCheck,
} from "@untitledui/icons";
import type { ModuleDefinition, ModuleGroup, ModuleId } from "./module-types";

export const moduleRegistry = [
    {
        id: "M0",
        slug: "operations",
        title: "Operations & Program Resolution",
        shortTitle: "Operations",
        description: "Daily operating picture, governing-program resolution, MATS transition controls, work queues, and notifications.",
        group: "Operate",
        icon: Grid01,
        routes: [
            { code: "0.1", label: "Program resolver", description: "Resolve the governing program before a training decision is made." },
            { code: "0.2", label: "MATS console", description: "Monitor fleet transition status, exceptions, and controlled withdrawals." },
            { code: "0.7", label: "Work queue", description: "Prioritized actions across forms, records, scheduling, and compliance." },
        ],
    },
    {
        id: "M1",
        slug: "forms",
        title: "Forms Engine",
        shortTitle: "Forms",
        description: "Versioned form authoring, high-volume runtime, signatures, quality control, and lifecycle governance.",
        group: "Build",
        icon: ClipboardCheck,
        routes: [
            { code: "1.1", label: "Form library", description: "Governed inventory of operational forms and versions." },
            { code: "1.14", label: "Form runtime", description: "Fast, resilient entry for instructor and records workflows." },
            { code: "1.32", label: "QC review", description: "Review, return, amend, and release completed records." },
        ],
    },
    {
        id: "M2",
        slug: "instructor",
        title: "Instructor Workspace",
        shortTitle: "Instructor",
        description: "Events, offline readiness, open records, qualifications, feedback, and standardization notices.",
        group: "Operate",
        icon: GraduationHat01,
        routes: [
            { code: "2.1", label: "My events", description: "Today and upcoming assigned training events." },
            { code: "2.2", label: "Offline pack", description: "Device-ready event data and reference materials." },
            { code: "2.7", label: "My qualifications", description: "Authorization and currency status by event type." },
        ],
    },
    {
        id: "M3",
        slug: "batch-entry",
        title: "Back-office Data Entry",
        shortTitle: "Batch entry",
        description: "Rapid transcription, roster completion, imports, reconciliation, corrections, and provenance controls.",
        group: "Operate",
        icon: Database01,
        routes: [
            { code: "3.1", label: "Rapid entry", description: "Keyboard-first entry for high-volume source records." },
            { code: "3.6", label: "Import reconciliation", description: "Resolve data differences with source lineage intact." },
            { code: "3.8", label: "Bulk correction", description: "Preview and approve controlled multi-record amendments." },
        ],
    },
    {
        id: "M4",
        slug: "records",
        title: "Training Records",
        shortTitle: "Records",
        description: "Training population, record jackets, qualification matrices, timelines, completeness, and exports.",
        group: "Operate",
        icon: LayersThree01,
        routes: [
            { code: "4.1", label: "Training population", description: "Searchable population grid with saved operating views." },
            { code: "4.2", label: "Record jacket", description: "Complete person-centric training and qualification record." },
            { code: "4.3", label: "Qualification matrix", description: "Requirement-by-requirement status and supporting evidence." },
        ],
    },
    {
        id: "M5",
        slug: "qualification-rules",
        title: "Qualification & Currency Rules",
        shortTitle: "Rules",
        description: "Versioned requirement rules, expiration forecasts, risk queues, restoration paths, and simulations.",
        group: "Build",
        icon: Route,
        routes: [
            { code: "5.1", label: "Requirement catalog", description: "All qualification and currency requirements with citations." },
            { code: "5.5", label: "Expiration forecast", description: "Forward-looking due volume for capacity planning." },
            { code: "5.10", label: "What-if simulator", description: "Safely test rule and event scenarios without changing records." },
        ],
    },
    {
        id: "M6",
        slug: "curriculum",
        title: "Curriculum & Program Design",
        shortTitle: "Curriculum",
        description: "Curriculum structures, task allocation, qualification standards, scenarios, traceability, and approvals.",
        group: "Build",
        icon: GraduationHat01,
        routes: [
            { code: "6.2", label: "Curriculum builder", description: "Versioned program, curriculum, module, lesson, and event structure." },
            { code: "6.13", label: "CQ task allocation", description: "Allocate task exposure across the recurrent cycle." },
            { code: "6.20", label: "Regulatory traceability", description: "Trace objectives and evidence to governing requirements." },
        ],
    },
    {
        id: "M7",
        slug: "scheduling",
        title: "Scheduling & Crew Pairing",
        shortTitle: "Scheduling",
        description: "Demand, capacity, calendars, device slots, instructors, crew compatibility, and conflict handling.",
        group: "Operate",
        icon: Calendar,
        routes: [
            { code: "7.3", label: "Training calendar", description: "Coordinated event, instructor, device, and capacity schedule." },
            { code: "7.4", label: "Device board", description: "Device availability, restrictions, and maintenance conflicts." },
            { code: "7.7", label: "Crew pairing", description: "Build compatible crews while preserving exposure requirements." },
        ],
    },
    {
        id: "M8",
        slug: "no-notice",
        title: "No-Notice Program",
        shortTitle: "No-notice",
        description: "Annual counts, sampling coverage, protected scheduling, individual evaluation, and publication audits.",
        group: "Assure",
        icon: Lock01,
        routes: [
            { code: "8.1", label: "Annual count", description: "Monitor required activity against approved annual targets." },
            { code: "8.2", label: "Sampling distribution", description: "Validate geographic and operational representativeness." },
            { code: "8.3", label: "Protected scheduling", description: "Need-to-know assignment and access-controlled execution." },
        ],
    },
    {
        id: "M9",
        slug: "special-tracking",
        title: "Special Tracking & TRB",
        shortTitle: "Special tracking",
        description: "Enrollment, bounded windows, remediation, exit events, review-board case files, and decisions.",
        group: "Assure",
        icon: ShieldTick,
        routes: [
            { code: "9.2", label: "Enrollment record", description: "Controlled enrollment with reason and authority." },
            { code: "9.3", label: "Window tracker", description: "Track eligible start, due, and hard-stop dates." },
            { code: "9.11", label: "TRB case file", description: "Complete, access-controlled review-board evidence package." },
        ],
    },
    {
        id: "M10",
        slug: "instructor-management",
        title: "Instructor & Evaluator Management",
        shortTitle: "I/E management",
        description: "Roster, qualifications, authorization, observation, calibration, workload, and device feedback.",
        group: "Assure",
        icon: UsersCheck,
        routes: [
            { code: "10.1", label: "I/E roster", description: "Current instructor and evaluator population and status." },
            { code: "10.3", label: "Authorization matrix", description: "Event- and role-specific operating authority." },
            { code: "10.5", label: "Calibration", description: "Standardization participation and rating alignment." },
        ],
    },
    {
        id: "M11",
        slug: "analytics",
        title: "Data, Analytics & FAA Reporting",
        shortTitle: "Analytics",
        description: "Performance data, recurring regulatory packages, trends, comparisons, and continuous improvement.",
        group: "Assure",
        icon: BarChartSquare02,
        routes: [
            { code: "11.2", label: "Monthly reporting", description: "Validated, reproducible monthly regulatory report package." },
            { code: "11.6", label: "Task performance", description: "Explore outcomes by task, objective, event, and cohort." },
            { code: "11.11", label: "Improvement queue", description: "Turn detected signals into owned corrective actions." },
        ],
    },
    {
        id: "M12",
        slug: "compliance",
        title: "Compliance, Audit & External Access",
        shortTitle: "Compliance",
        description: "Control health, audit sampling, evidence binders, inspection sessions, retention, and immutable history.",
        group: "Assure",
        icon: FileShield02,
        routes: [
            { code: "12.1", label: "Compliance dashboard", description: "Current control posture and material exceptions." },
            { code: "12.6", label: "Audit binder", description: "Reproducible evidence packages with manifests and hashes." },
            { code: "12.13", label: "Audit trail", description: "Immutable, searchable history of every material action." },
        ],
    },
    {
        id: "M13",
        slug: "administration",
        title: "Administration & Integrations",
        shortTitle: "Administration",
        description: "Configuration, access, workflows, feature rollout, integrations, migration, backup, and portability.",
        group: "Configure",
        icon: Settings01,
        routes: [
            { code: "13.3", label: "Roles & permissions", description: "Fine-grained access by role, fleet, base, and program." },
            { code: "13.12", label: "Integration console", description: "Health, error queues, replay, and reconciliation by system." },
            { code: "13.14", label: "Data portability", description: "Validated exports, independent backups, and restore evidence." },
        ],
    },
] as const satisfies readonly ModuleDefinition[];

export const moduleById = Object.fromEntries(moduleRegistry.map((module) => [module.id, module])) as unknown as Record<ModuleId, ModuleDefinition>;

export const modulesByGroup = moduleRegistry.reduce(
    (groups, module) => {
        groups[module.group].push(module);
        return groups;
    },
    {
        Operate: [],
        Build: [],
        Assure: [],
        Configure: [],
    } as Record<ModuleGroup, ModuleDefinition[]>,
);

export const getModuleDefinition = (id: ModuleId) => moduleById[id];

export const isModuleId = (value: string): value is ModuleId => Object.prototype.hasOwnProperty.call(moduleById, value);

export const defaultModuleId: ModuleId = "M0";
