export type Brand<Value, Name extends string> = Value & { readonly __brand: Name };

export type UUID = Brand<string, "UUID">;
export type ISODate = Brand<string, "ISODate">;
export type ISODateTime = Brand<string, "ISODateTime">;

// Each entity ID is branded directly from string. Stacking a second brand on
// UUID would intersect two different __brand literals and collapse to `never`.
export type OrganizationId = Brand<string, "OrganizationId">;
export type UserId = Brand<string, "UserId">;
export type PersonId = Brand<string, "PersonId">;
export type FleetId = Brand<string, "FleetId">;
export type BaseId = Brand<string, "BaseId">;
export type SeatId = Brand<string, "SeatId">;
export type ProgramId = Brand<string, "ProgramId">;
export type CurriculumId = Brand<string, "CurriculumId">;
export type CurriculumVersionId = Brand<string, "CurriculumVersionId">;
export type TaskId = Brand<string, "TaskId">;
export type FormDefinitionVersionId = Brand<string, "FormDefinitionVersionId">;
export type EventId = Brand<string, "EventId">;
export type FormInstanceId = Brand<string, "FormInstanceId">;
export type RequirementId = Brand<string, "RequirementId">;

export interface BitemporalRevision {
    validFrom: ISODate;
    validTo?: ISODate;
    recordedAt: ISODateTime;
    supersededAt?: ISODateTime;
}

export type DataClassification = "public" | "internal" | "confidential" | "restricted";
export type ProgramType = "NO" | "AQP";
export type CurriculumTypeCode = "CQ" | "QUAL" | "INDOC" | (string & {});
export type SeatCode = "CA" | "FO" | "OBS" | (string & {});
export type EmploymentStatus = "active" | "leave" | "inactive" | "terminated" | "synthetic";

export interface Organization {
    id: OrganizationId;
    code: string;
    legalName: string;
    defaultTimeZone: string;
    classification: DataClassification;
}

export interface PersonSummary {
    id: PersonId;
    externalReference: string;
    displayName: string;
    employmentStatus: EmploymentStatus;
    fleetCode: string;
    seatCode: SeatCode;
    baseCode: string;
    isInstructor?: boolean;
    isEvaluator?: boolean;
    synthetic?: boolean;
}

export interface PositionRevision extends BitemporalRevision {
    id: UUID;
    personId: PersonId;
    fleetId: FleetId;
    fleetCode: string;
    seatId: SeatId;
    seatCode: SeatCode;
    baseId: BaseId;
    baseCode: string;
    status: "active" | "training" | "qualified" | "restricted" | "inactive";
    isInstructor: boolean;
    isEvaluator: boolean;
}

export interface ProgramSummary {
    id: ProgramId;
    code: string;
    type: ProgramType;
    displayName: string;
    lifecycleStatus: "proposed" | "approved" | "active" | "archived" | "withdrawn";
}

export type CurriculumLifecycleStatus = "draft" | "review" | "approved" | "published" | "archived" | "withdrawn";

export interface CurriculumVersionSummary extends BitemporalRevision {
    id: CurriculumVersionId;
    curriculumId: CurriculumId;
    code: string;
    title: string;
    versionLabel: string;
    programId: ProgramId;
    programType: ProgramType;
    fleetCode: string;
    curriculumType: CurriculumTypeCode;
    seatCodes: SeatCode[];
    lifecycleStatus: CurriculumLifecycleStatus;
    approvalStatus: "not_required" | "pending" | "accepted" | "approved" | "superseded";
    selectionPriority?: number;
    synthetic?: boolean;
}

export type CurriculumNodeType = "segment" | "module" | "lesson" | "lesson_element";

export interface CurriculumNode {
    id: UUID;
    curriculumVersionId: CurriculumVersionId;
    parentId?: UUID;
    stableCode: string;
    type: CurriculumNodeType;
    outlineNumber?: string;
    moduleCode?: string;
    title: string;
    sequence: number;
}

export interface TaskRevision extends BitemporalRevision {
    id: TaskId;
    visionTaskId: number;
    sourceSystem: "VISION" | "VISION-SYNTHETIC" | (string & {});
    type: "task" | "TPO" | "SPO" | "grading_item";
    outlineNumber?: string;
    title: string;
    criticality?: 1 | 2 | 3 | 4 | 5;
    currencyIntervalMonths?: number;
    synthetic?: boolean;
}

export type FormLifecycleState =
    | "draft"
    | "offline_draft"
    | "ready_for_signature"
    | "partially_signed"
    | "submitted"
    | "qc_review"
    | "qc_returned"
    | "approved"
    | "amended"
    | "voided"
    | "stale_version_quarantine"
    | "sync_conflict"
    | "processing_failure"
    | "reconciliation_hold";

export type SyncStatus = "server" | "local_only" | "pending_upload" | "synced" | "conflict" | "failed";

export interface FormBindingCandidate extends BitemporalRevision {
    id: UUID;
    formDefinitionVersionId: FormDefinitionVersionId;
    formTitle: string;
    programType: ProgramType;
    fleetCode?: string;
    seatCode?: SeatCode;
    curriculumType: CurriculumTypeCode;
    curriculumId?: CurriculumId;
    reasonCode?: string;
    eventType: string;
    priority: number;
}

export interface TrainingEventSummary {
    id: EventId;
    title: string;
    eventType: string;
    reasonCode: string;
    programType: ProgramType;
    curriculumVersionId: CurriculumVersionId;
    fleetCode: string;
    locationCode: string;
    startsAt: ISODateTime;
    endsAt: ISODateTime;
    status: "planned" | "assigned" | "ready" | "in_progress" | "completed" | "cancelled" | "no_show" | "reconciliation_hold";
    instructorName: string;
    studentNames: string[];
    formState?: FormLifecycleState;
    syncStatus?: SyncStatus;
    synthetic?: boolean;
}

export interface FormInstanceSummary {
    id: FormInstanceId;
    eventId: EventId;
    formTitle: string;
    subjectName: string;
    programType: ProgramType;
    state: FormLifecycleState;
    syncStatus: SyncStatus;
    dueAt?: ISODateTime;
    submittedAt?: ISODateTime;
    synthetic?: boolean;
}

export interface TaskGrade {
    taskId: TaskId;
    visionTaskId: number;
    attempt: number;
    attemptKind: "first_look" | "initial" | "repeat" | "remediation" | "recheck";
    technicalProficiency?: number;
    proceduralCompliance?: number;
    situationalAwareness?: number;
    crewResourceManagement?: number;
    overallGrade?: string;
    satisfactory?: boolean;
    narrative?: string;
}

export type QualificationStatus = "not_held" | "in_progress" | "current" | "expiring" | "expired" | "suspended" | "revoked" | "unknown";

export interface QualificationSummary {
    personId: PersonId;
    requirementId: RequirementId;
    requirementCode: string;
    title: string;
    status: QualificationStatus;
    effectiveAt?: ISODateTime;
    expiresAt?: ISODateTime;
    baseMonth?: number;
    evidenceWatermark: ISODateTime;
    synthetic?: boolean;
}

export interface DashboardMetric {
    label: string;
    value: number;
    trend?: number;
    helperText: string;
    tone: "neutral" | "success" | "warning" | "danger" | "brand";
}

export interface DashboardAlert {
    id: string;
    title: string;
    description: string;
    severity: "info" | "warning" | "critical";
    count?: number;
    href?: string;
}

export interface DashboardData {
    asOf: ISODateTime;
    metrics: DashboardMetric[];
    upcomingEvents: TrainingEventSummary[];
    openForms: FormInstanceSummary[];
    alerts: DashboardAlert[];
    transitionMix: Array<{
        programType: ProgramType;
        count: number;
        percentage: number;
    }>;
    synthetic: true;
}

export interface OutboxEnvelope<Payload extends object = Record<string, unknown>> {
    id: UUID;
    organizationId: OrganizationId;
    aggregateType: string;
    aggregateId: UUID;
    eventType: `${string}.v${number}`;
    idempotencyKey: UUID;
    occurredAt: ISODateTime;
    payload: Payload;
    headers: {
        correlationId?: string;
        causationId?: string;
        schemaVersion: number;
    };
}

export interface AuditEvidence {
    id: UUID;
    organizationId: OrganizationId;
    sequenceNumber: number;
    action: string;
    entityType: string;
    entityId?: string;
    occurredAt: ISODateTime;
    actorDisplayName?: string;
    previousHash?: string;
    eventHash: string;
}
