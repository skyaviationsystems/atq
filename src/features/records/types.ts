export type TrainingProgramType = "AQP" | "NO";
export type PersonEmploymentStatus = "active" | "leave" | "inactive";
export type TrainingPopulation = "pilot" | "flight-attendant" | "ground-instructor";
export type PersonQualificationState = "current" | "expiring" | "in-progress" | "expired" | "suspended";
export type QualificationStatus = "current" | "expiring" | "in-progress" | "expired" | "suspended" | "not-held";
export type CredentialStatus = "current" | "expiring" | "expired";
export type RestrictionStatus = "active" | "cleared";
export type TrainingOutcome = "satisfactory" | "unsatisfactory" | "incomplete" | "credited";
export type TrainingFormState = "approved" | "submitted" | "qc-review" | "qc-returned" | "voided";
export type QualificationEffectType = "granted" | "renewed" | "extended" | "restricted" | "no-change";
export type TimelineEntryKind = "training" | "qualification" | "credential" | "restriction";
export type TimelineEntryTone = "success" | "warning" | "danger" | "neutral";

/**
 * Synthetic profile used by the records proof of concept. It deliberately
 * stores only the fields needed to exercise the product experience.
 */
export interface TrainingPerson {
    id: string;
    employeeNumber: string;
    displayName: string;
    preferredName: string;
    email: `${string}@example.invalid`;
    phone: string;
    employmentStatus: PersonEmploymentStatus;
    population: TrainingPopulation;
    roleTitle: string;
    department: string;
    fleetCode: string;
    seatCode: string;
    baseCode: string;
    hireDate: string;
    isInstructor: boolean;
    isEvaluator: boolean;
    isCheckPilot: boolean;
    programType: TrainingProgramType;
    programCode: string;
    programName: string;
    qualificationState: PersonQualificationState;
    nextDueDate?: string;
    recordCompleteness: number;
    qualifications: readonly QualificationRecord[];
    credentials: readonly CredentialRecord[];
    restrictions: readonly RestrictionRecord[];
    trainingRecordIds: readonly string[];
    synthetic: true;
}

export interface QualificationChange {
    id: string;
    effectiveDate: string;
    action: "granted" | "renewed" | "expired" | "suspended" | "restored" | "corrected";
    fromStatus?: QualificationStatus;
    toStatus: QualificationStatus;
    sourceRecordId?: string;
    note: string;
}

export interface QualificationRecord {
    id: string;
    personId: string;
    requirementCode: string;
    title: string;
    category: "airman" | "fleet" | "currency" | "instructor" | "evaluator" | "cabin" | "ground";
    status: QualificationStatus;
    programType: TrainingProgramType;
    fleetCode?: string;
    seatCode?: string;
    lastCompletedDate?: string;
    effectiveDate?: string;
    expirationDate?: string;
    nextDueDate?: string;
    graceDate?: string;
    nextPlannedDate?: string;
    baseMonth?: number;
    sourceRecordId?: string;
    sourceFormId?: string;
    sourceFormName?: string;
    calculationSummary: string;
    history: readonly QualificationChange[];
    synthetic: true;
}

export interface CredentialRecord {
    id: string;
    personId: string;
    type: "certificate" | "medical" | "passport" | "authorization";
    name: string;
    credentialNumber: string;
    issuer: string;
    issuedDate: string;
    expirationDate?: string;
    status: CredentialStatus;
    synthetic: true;
}

export interface RestrictionRecord {
    id: string;
    personId: string;
    code: string;
    title: string;
    description: string;
    status: RestrictionStatus;
    effectiveDate: string;
    clearedDate?: string;
    sourceRecordId?: string;
    synthetic: true;
}

export interface QualificationEffect {
    type: QualificationEffectType;
    qualificationId?: string;
    requirementCode?: string;
    qualificationTitle?: string;
    effectiveDate?: string;
    expirationDate?: string;
    explanation: string;
}

/**
 * A denormalized record projection so a table can search and render a complete
 * row without issuing secondary lookups. Entity IDs remain stable and link the
 * record back to the person profile, curriculum, event, form, and qualification.
 */
export interface TrainingRecord {
    id: string;
    recordNumber: string;
    personId: string;
    personName: string;
    employeeNumber: string;
    population: TrainingPopulation;
    fleetCode: string;
    seatCode: string;
    baseCode: string;
    taskId: string;
    visionTaskId: number;
    taskTitle: string;
    outlineNumber: string;
    curriculumId: string;
    curriculumCode: string;
    curriculumTitle: string;
    curriculumVersion: string;
    moduleCode: string;
    moduleTitle: string;
    eventId: string;
    eventType: string;
    eventDate: string;
    eventLocation: string;
    formId: string;
    formName: string;
    formState: TrainingFormState;
    outcome: TrainingOutcome;
    instructorId: string;
    instructorName: string;
    deviceCode: string;
    deviceType: string;
    programType: TrainingProgramType;
    programCode: string;
    attempt: number;
    score?: number;
    remarks?: string;
    qualificationEffect: QualificationEffect;
    synthetic: true;
}

export interface TrainingTimelineEntry {
    id: string;
    personId: string;
    date: string;
    kind: TimelineEntryKind;
    title: string;
    description: string;
    tone: TimelineEntryTone;
    recordId?: string;
    qualificationId?: string;
    formId?: string;
}

export interface PeopleQuery {
    query?: string;
    employmentStatus?: PersonEmploymentStatus;
    population?: TrainingPopulation;
    fleetCode?: string;
    seatCode?: string;
    baseCode?: string;
    roleTitle?: string;
    programType?: TrainingProgramType;
    qualificationState?: PersonQualificationState;
    isInstructor?: boolean;
    isEvaluator?: boolean;
}

export interface TrainingRecordQuery {
    query?: string;
    personId?: string;
    taskId?: string;
    visionTaskId?: number;
    curriculumCode?: string;
    moduleCode?: string;
    eventType?: string;
    formName?: string;
    formState?: TrainingFormState;
    outcome?: TrainingOutcome;
    fleetCode?: string;
    seatCode?: string;
    baseCode?: string;
    programType?: TrainingProgramType;
    instructorId?: string;
    deviceCode?: string;
    qualificationEffect?: QualificationEffectType;
    fromDate?: string;
    toDate?: string;
}

export interface FacetOption {
    value: string;
    label: string;
    count: number;
}

export interface TaskFacetOption extends FacetOption {
    visionTaskId: number;
}

export interface PeopleFacetOptions {
    employmentStatuses: readonly FacetOption[];
    populations: readonly FacetOption[];
    fleets: readonly FacetOption[];
    seats: readonly FacetOption[];
    bases: readonly FacetOption[];
    roles: readonly FacetOption[];
    programs: readonly FacetOption[];
    qualificationStates: readonly FacetOption[];
}

export interface RecordFacetOptions {
    tasks: readonly TaskFacetOption[];
    curricula: readonly FacetOption[];
    modules: readonly FacetOption[];
    eventTypes: readonly FacetOption[];
    forms: readonly FacetOption[];
    formStates: readonly FacetOption[];
    outcomes: readonly FacetOption[];
    fleets: readonly FacetOption[];
    seats: readonly FacetOption[];
    bases: readonly FacetOption[];
    programs: readonly FacetOption[];
    instructors: readonly FacetOption[];
    devices: readonly FacetOption[];
    qualificationEffects: readonly FacetOption[];
    dateRange: {
        min: string;
        max: string;
    };
}

export interface RecordsRepository {
    listPeople(query?: PeopleQuery): readonly TrainingPerson[];
    searchPeople(query: string, filters?: Omit<PeopleQuery, "query">): readonly TrainingPerson[];
    getPersonProfile(personId: string): TrainingPerson | undefined;
    searchRecords(query?: TrainingRecordQuery): readonly TrainingRecord[];
    getRecord(recordId: string): TrainingRecord | undefined;
    getQualifications(personId: string): readonly QualificationRecord[];
    getTimeline(personId: string): readonly TrainingTimelineEntry[];
    getPeopleFacets(): PeopleFacetOptions;
    getRecordFacets(): RecordFacetOptions;
}
