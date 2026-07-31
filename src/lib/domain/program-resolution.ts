import type {
    BitemporalRevision,
    CurriculumTypeCode,
    CurriculumVersionId,
    CurriculumVersionSummary,
    FormBindingCandidate,
    FormDefinitionVersionId,
    ISODate,
    ISODateTime,
    PersonId,
    ProgramId,
    ProgramSummary,
    ProgramType,
    SeatCode,
    UUID,
} from "./types";

export const PROGRAM_RESOLVER_VERSION = "atq-program-resolver/1.0.0";

export interface ProgramOverrideCandidate extends BitemporalRevision {
    id: UUID;
    personId: PersonId;
    programId: ProgramId;
    programType: ProgramType;
    curriculumType: CurriculumTypeCode;
    fleetCode?: string;
    seatCode?: SeatCode;
    authorityReference: string;
    reason: string;
    approvedBy: string;
}

export interface TransitionCandidate extends BitemporalRevision {
    id: UUID;
    populationCode: string;
    targetProgramId: ProgramId;
    targetProgramType: ProgramType;
    fleetCode: string;
    seatCode?: SeatCode;
    curriculumType: CurriculumTypeCode;
    transitionDate?: ISODate;
    implementationStatus: "estimated" | "planned" | "approved" | "implemented" | "paused" | "withdrawn";
    authorityReference?: string;
}

export interface ProgramResolverCatalog {
    programs: ProgramSummary[];
    overrides: ProgramOverrideCandidate[];
    transitions: TransitionCandidate[];
    curricula: CurriculumVersionSummary[];
    formBindings: FormBindingCandidate[];
}

export interface ProgramResolutionInput {
    personId: PersonId;
    fleetCode: string;
    seatCode: SeatCode;
    curriculumType: CurriculumTypeCode;
    eventDate: ISODate;
    eventType: string;
    reasonCode: string;
    asKnownAt: ISODateTime;
    curriculumStartDate?: ISODate;
    cqCycleStartDate?: ISODate;
    lastProficiencyCheckDate?: ISODate;
    baseMonth?: number;
    aqpEligibleFrom?: ISODate;
}

export type ResolutionStepCode = "input" | "override" | "transition" | "governing_date" | "cq_eligibility" | "program" | "curriculum" | "form";

export interface ResolutionStep {
    code: ResolutionStepCode;
    message: string;
    evidenceIds?: string[];
}

export interface ProgramResolutionResult {
    status: "resolved" | "needs_review" | "unresolved";
    resolverVersion: typeof PROGRAM_RESOLVER_VERSION;
    source?: "override" | "transition" | "pre_transition";
    program?: ProgramSummary;
    curriculumVersionId?: CurriculumVersionId;
    curriculumTitle?: string;
    formDefinitionVersionId?: FormDefinitionVersionId;
    formTitle?: string;
    governingDate?: ISODate;
    reasoning: ResolutionStep[];
    warnings: string[];
    errors: string[];
    canonicalDecisionKey: string;
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string | undefined): value is ISODate {
    if (!value || !ISO_DATE_PATTERN.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function dateIsWithin(date: ISODate, revision: Pick<BitemporalRevision, "validFrom" | "validTo">): boolean {
    return revision.validFrom <= date && (!revision.validTo || date < revision.validTo);
}

function knownAt(asKnownAt: ISODateTime, revision: Pick<BitemporalRevision, "recordedAt" | "supersededAt">): boolean {
    return revision.recordedAt <= asKnownAt && (!revision.supersededAt || asKnownAt < revision.supersededAt);
}

function canonicalPart(value: string | number | undefined): string {
    return value === undefined ? "-" : String(value).replaceAll("|", "%7C");
}

function buildDecisionKey(input: ProgramResolutionInput, result: Omit<ProgramResolutionResult, "canonicalDecisionKey">): string {
    return [
        PROGRAM_RESOLVER_VERSION,
        input.personId,
        input.fleetCode,
        input.seatCode,
        input.curriculumType,
        input.eventDate,
        input.eventType,
        input.reasonCode,
        input.asKnownAt,
        result.status,
        result.source,
        result.program?.id,
        result.curriculumVersionId,
        result.formDefinitionVersionId,
    ]
        .map(canonicalPart)
        .join("|");
}

function finalize(input: ProgramResolutionInput, partial: Omit<ProgramResolutionResult, "canonicalDecisionKey" | "resolverVersion">): ProgramResolutionResult {
    const result = {
        ...partial,
        resolverVersion: PROGRAM_RESOLVER_VERSION,
    } satisfies Omit<ProgramResolutionResult, "canonicalDecisionKey">;

    return {
        ...result,
        canonicalDecisionKey: buildDecisionKey(input, result),
    };
}

function selectProgram(catalog: ProgramResolverCatalog, type: ProgramType): ProgramSummary | undefined {
    const matches = catalog.programs.filter((program) => program.type === type && program.lifecycleStatus !== "withdrawn");
    if (matches.length !== 1) return undefined;
    return matches[0];
}

function chooseCurriculum(
    catalog: ProgramResolverCatalog,
    input: ProgramResolutionInput,
    program: ProgramSummary,
    governingDate: ISODate,
): { value?: CurriculumVersionSummary; error?: string } {
    const candidates = catalog.curricula
        .filter(
            (curriculum) =>
                curriculum.programType === program.type &&
                curriculum.fleetCode === input.fleetCode &&
                curriculum.curriculumType === input.curriculumType &&
                (curriculum.seatCodes.length === 0 || curriculum.seatCodes.includes(input.seatCode)) &&
                ["approved", "published"].includes(curriculum.lifecycleStatus) &&
                dateIsWithin(governingDate, curriculum) &&
                knownAt(input.asKnownAt, curriculum),
        )
        .sort(
            (left, right) =>
                (left.selectionPriority ?? 100) - (right.selectionPriority ?? 100) ||
                right.validFrom.localeCompare(left.validFrom) ||
                left.id.localeCompare(right.id),
        );

    if (candidates.length === 0) {
        return {
            error: `No approved or published ${program.type} ${input.fleetCode} ${input.curriculumType} curriculum was effective on ${governingDate}.`,
        };
    }

    const bestPriority = candidates[0].selectionPriority ?? 100;
    const equallyPreferred = candidates.filter((candidate) => (candidate.selectionPriority ?? 100) === bestPriority);
    if (equallyPreferred.length > 1) {
        return {
            error: `Multiple equally preferred curricula match; configuration must be reconciled (${equallyPreferred
                .map((candidate) => candidate.versionLabel)
                .join(", ")}).`,
        };
    }

    return { value: candidates[0] };
}

function chooseForm(
    catalog: ProgramResolverCatalog,
    input: ProgramResolutionInput,
    program: ProgramSummary,
    curriculum: CurriculumVersionSummary,
    governingDate: ISODate,
): { value?: FormBindingCandidate; error?: string } {
    const candidates = catalog.formBindings
        .filter(
            (binding) =>
                binding.programType === program.type &&
                (!binding.fleetCode || binding.fleetCode === input.fleetCode) &&
                (!binding.seatCode || binding.seatCode === input.seatCode) &&
                binding.curriculumType === input.curriculumType &&
                (!binding.curriculumId || binding.curriculumId === curriculum.curriculumId) &&
                (!binding.reasonCode || binding.reasonCode === input.reasonCode) &&
                binding.eventType === input.eventType &&
                dateIsWithin(governingDate, binding) &&
                knownAt(input.asKnownAt, binding),
        )
        .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));

    if (candidates.length === 0) {
        return { error: "No effective form binding matches the program, curriculum, event type, and reason." };
    }

    const topPriority = candidates[0].priority;
    const equallyPreferred = candidates.filter((candidate) => candidate.priority === topPriority);
    if (equallyPreferred.length > 1) {
        return { error: "Multiple form bindings have the same winning priority." };
    }

    return { value: candidates[0] };
}

function determineGoverningDate(input: ProgramResolutionInput, reasoning: ResolutionStep[], warnings: string[], errors: string[]): ISODate | undefined {
    if (input.curriculumType === "QUAL" || input.curriculumType === "INDOC") {
        if (!input.curriculumStartDate) {
            errors.push(`${input.curriculumType} requires curriculumStartDate; eventDate is not a safe substitute.`);
            return undefined;
        }
        reasoning.push({
            code: "governing_date",
            message: `${input.curriculumType} is governed by class start ${input.curriculumStartDate}.`,
        });
        return input.curriculumStartDate;
    }

    if (input.curriculumType === "CQ") {
        const governingDate = input.cqCycleStartDate ?? input.curriculumStartDate ?? input.eventDate;
        if (!input.cqCycleStartDate && !input.curriculumStartDate) {
            warnings.push("CQ cycle start was unavailable; event date was used and the resolution requires review.");
        }
        reasoning.push({
            code: "governing_date",
            message: `CQ is governed by recurrent-cycle commencement ${governingDate}.`,
        });
        return governingDate;
    }

    reasoning.push({
        code: "governing_date",
        message: `${input.curriculumType} is governed by event date ${input.eventDate}.`,
    });
    return input.eventDate;
}

/**
 * Deterministically resolves the governing program and record artifacts.
 *
 * The function is pure: callers must persist the complete input, returned trace,
 * catalog watermark/as-known timestamp, and a cryptographic hash of
 * canonicalDecisionKey in app.program_resolution_log.
 */
export function resolveProgram(input: ProgramResolutionInput, catalog: ProgramResolverCatalog): ProgramResolutionResult {
    const reasoning: ResolutionStep[] = [
        {
            code: "input",
            message: `${input.fleetCode} ${input.seatCode} ${input.curriculumType} on ${input.eventDate}; reason ${input.reasonCode}.`,
        },
    ];
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!isValidDate(input.eventDate)) errors.push("eventDate must be a valid ISO calendar date.");
    if (input.curriculumStartDate && !isValidDate(input.curriculumStartDate)) {
        errors.push("curriculumStartDate must be a valid ISO calendar date.");
    }
    if (input.cqCycleStartDate && !isValidDate(input.cqCycleStartDate)) {
        errors.push("cqCycleStartDate must be a valid ISO calendar date.");
    }
    if (input.lastProficiencyCheckDate && !isValidDate(input.lastProficiencyCheckDate)) {
        errors.push("lastProficiencyCheckDate must be a valid ISO calendar date.");
    }
    if (input.aqpEligibleFrom && !isValidDate(input.aqpEligibleFrom)) {
        errors.push("aqpEligibleFrom must be a valid ISO calendar date.");
    }
    if (input.baseMonth !== undefined && (!Number.isInteger(input.baseMonth) || input.baseMonth < 1 || input.baseMonth > 12)) {
        errors.push("baseMonth must be an integer from 1 through 12.");
    }

    if (errors.length > 0) {
        return finalize(input, { status: "unresolved", reasoning, warnings, errors });
    }

    const governingDate = determineGoverningDate(input, reasoning, warnings, errors);
    if (!governingDate) {
        return finalize(input, { status: "unresolved", reasoning, warnings, errors });
    }

    const activeOverrides = catalog.overrides
        .filter(
            (override) =>
                override.personId === input.personId &&
                override.curriculumType === input.curriculumType &&
                (!override.fleetCode || override.fleetCode === input.fleetCode) &&
                (!override.seatCode || override.seatCode === input.seatCode) &&
                dateIsWithin(governingDate, override) &&
                knownAt(input.asKnownAt, override),
        )
        .map((override) => ({
            value: override,
            specificity: Number(Boolean(override.fleetCode)) + Number(Boolean(override.seatCode)),
        }))
        .sort(
            (left, right) =>
                right.specificity - left.specificity ||
                right.value.recordedAt.localeCompare(left.value.recordedAt) ||
                left.value.id.localeCompare(right.value.id),
        );

    let selectedType: ProgramType;
    let source: ProgramResolutionResult["source"];

    if (activeOverrides.length > 0) {
        const winningSpecificity = activeOverrides[0].specificity;
        const winners = activeOverrides.filter((candidate) => candidate.specificity === winningSpecificity);
        const distinctPrograms = new Set(winners.map((candidate) => candidate.value.programId));
        if (distinctPrograms.size > 1) {
            errors.push("Conflicting equally specific individual program overrides are active.");
            return finalize(input, { status: "unresolved", governingDate, reasoning, warnings, errors });
        }

        const selected = winners[0].value;
        if (!selected.authorityReference || !selected.reason || !selected.approvedBy) {
            errors.push("The winning individual override lacks required approval evidence.");
            return finalize(input, { status: "unresolved", governingDate, reasoning, warnings, errors });
        }

        selectedType = selected.programType;
        source = "override";
        reasoning.push({
            code: "override",
            message: `${selectedType} selected by individual override: ${selected.reason} Authority: ${selected.authorityReference}.`,
            evidenceIds: [selected.id],
        });
    } else {
        const transitions = catalog.transitions
            .filter(
                (transition) =>
                    transition.fleetCode === input.fleetCode &&
                    transition.curriculumType === input.curriculumType &&
                    (!transition.seatCode || transition.seatCode === input.seatCode) &&
                    dateIsWithin(governingDate, transition) &&
                    knownAt(input.asKnownAt, transition),
            )
            .sort(
                (left, right) =>
                    Number(Boolean(right.seatCode)) - Number(Boolean(left.seatCode)) ||
                    right.recordedAt.localeCompare(left.recordedAt) ||
                    left.id.localeCompare(right.id),
            );

        const implemented = transitions.filter((transition) => transition.implementationStatus === "implemented" && transition.transitionDate);

        if (implemented.length === 0) {
            selectedType = "NO";
            source = "pre_transition";
            reasoning.push({
                code: "transition",
                message: `No implemented transition governed ${input.fleetCode} ${input.curriculumType} as known at ${input.asKnownAt}; N&O remains governing.`,
            });
        } else {
            const topSpecificity = Number(Boolean(implemented[0].seatCode));
            const winners = implemented.filter((transition) => Number(Boolean(transition.seatCode)) === topSpecificity);
            const distinctRules = new Set(winners.map((transition) => `${transition.transitionDate}:${transition.targetProgramId}`));
            if (distinctRules.size > 1) {
                errors.push("Conflicting implemented transition rules match this population.");
                return finalize(input, { status: "unresolved", governingDate, reasoning, warnings, errors });
            }

            const transition = winners[0];
            reasoning.push({
                code: "transition",
                message: `${transition.populationCode} transitioned on ${transition.transitionDate}; status ${transition.implementationStatus}.`,
                evidenceIds: [transition.id],
            });

            if (governingDate < transition.transitionDate!) {
                selectedType = "NO";
                source = "pre_transition";
                reasoning.push({
                    code: "program",
                    message: `${governingDate} precedes the transition; N&O governs this activity.`,
                });
            } else if (input.aqpEligibleFrom && governingDate < input.aqpEligibleFrom) {
                selectedType = "NO";
                source = "pre_transition";
                reasoning.push({
                    code: "cq_eligibility",
                    message: `Individual AQP entry eligibility begins ${input.aqpEligibleFrom}; N&O governs until then.`,
                });
            } else {
                selectedType = transition.targetProgramType;
                source = "transition";
                const baseMonthDetail = input.baseMonth ? ` Base month ${input.baseMonth}.` : "";
                const pcDetail = input.lastProficiencyCheckDate ? ` Last proficiency check ${input.lastProficiencyCheckDate}.` : "";
                reasoning.push({
                    code: "cq_eligibility",
                    message: `The activity commenced on or after transition and individual eligibility does not defer entry.${baseMonthDetail}${pcDetail}`,
                });
            }
        }
    }

    const program = selectProgram(catalog, selectedType);
    if (!program) {
        errors.push(`Catalog must contain exactly one usable ${selectedType} program.`);
        return finalize(input, { status: "unresolved", source, governingDate, reasoning, warnings, errors });
    }

    reasoning.push({
        code: "program",
        message: `${program.displayName} is the governing program.`,
    });

    const curriculumSelection = chooseCurriculum(catalog, input, program, governingDate);
    if (!curriculumSelection.value) {
        errors.push(curriculumSelection.error!);
        return finalize(input, {
            status: "unresolved",
            source,
            program,
            governingDate,
            reasoning,
            warnings,
            errors,
        });
    }

    const curriculum = curriculumSelection.value;
    reasoning.push({
        code: "curriculum",
        message: `${curriculum.title} ${curriculum.versionLabel} was effective on ${governingDate}.`,
        evidenceIds: [curriculum.id],
    });

    const formSelection = chooseForm(catalog, input, program, curriculum, governingDate);
    if (!formSelection.value) {
        warnings.push(formSelection.error!);
        return finalize(input, {
            status: "needs_review",
            source,
            program,
            curriculumVersionId: curriculum.id,
            curriculumTitle: curriculum.title,
            governingDate,
            reasoning,
            warnings,
            errors,
        });
    }

    reasoning.push({
        code: "form",
        message: `${formSelection.value.formTitle} selected for event ${input.eventType} and reason ${input.reasonCode}.`,
        evidenceIds: [formSelection.value.id],
    });

    return finalize(input, {
        status: warnings.length > 0 ? "needs_review" : "resolved",
        source,
        program,
        curriculumVersionId: curriculum.id,
        curriculumTitle: curriculum.title,
        formDefinitionVersionId: formSelection.value.formDefinitionVersionId,
        formTitle: formSelection.value.formTitle,
        governingDate,
        reasoning,
        warnings,
        errors,
    });
}
