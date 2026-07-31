export const ratingDimensions = ["safety", "technical", "procedures", "crew"] as const;

export type RatingDimension = (typeof ratingDimensions)[number];
export type RatingValue = 1 | 2 | 3 | 4 | 5 | "na" | null;

export interface TaskRatingValue {
    ratings: Record<RatingDimension, RatingValue>;
    comments: string;
}

export interface EventAttempt {
    id: string;
    number: number;
    startedAt: string;
    completedAt?: string;
    outcome: "in-progress" | "satisfactory" | "repeat-required";
    assessment: TaskRatingValue;
}

export interface EventSetDefinition {
    id: string;
    code: string;
    title: string;
    phase: string;
    objective: string;
    repeatCap: number;
    required: boolean;
}

export type RuntimeSectionStatus = "complete" | "in-progress" | "not-started" | "attention";

export interface RuntimeSection {
    id: string;
    label: string;
    shortLabel: string;
    requiredCount: number;
    completedCount: number;
    status: RuntimeSectionStatus;
}

export type FormFieldType = "short-text" | "long-text" | "choice" | "rating-matrix" | "event-set" | "signature";

export interface FormDesignerField {
    id: string;
    type: FormFieldType;
    label: string;
    helpText?: string;
    required: boolean;
    options?: string[];
}

export interface FormDesignerSection {
    id: string;
    title: string;
    description?: string;
    fields: FormDesignerField[];
}

export interface FormDesignerSchema {
    id: string;
    name: string;
    program: string;
    version: string;
    status: "draft" | "published";
    sections: FormDesignerSection[];
}

export type FormQueueStatus = "draft" | "awaiting-signature" | "submitted" | "qc-returned" | "qc-approved" | "sync-conflict";

export interface FormQueueRecord {
    id: string;
    eventCode: string;
    program: string;
    participant: string;
    instructor: string;
    sessionDate: string;
    submittedAt?: string;
    status: FormQueueStatus;
    completeness: number;
    syncState: "synced" | "pending" | "conflict";
    flags: string[];
}

export interface InstructorEvent {
    id: string;
    eventCode: string;
    title: string;
    program: string;
    version: string;
    dateLabel: string;
    timeLabel: string;
    location: string;
    participantCount: number;
    formCount: number;
    openFormCount: number;
    offlineState: "ready" | "update-available" | "not-downloaded";
    brief: {
        objective: string;
        emphasisItems: string[];
        resources: string[];
        note: string;
    };
}
