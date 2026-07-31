import type {
    FacetOption,
    PeopleFacetOptions,
    PeopleQuery,
    QualificationRecord,
    RecordFacetOptions,
    RecordsRepository,
    TaskFacetOption,
    TrainingPerson,
    TrainingRecord,
    TrainingRecordQuery,
    TrainingTimelineEntry,
} from "./types";

export interface RecordsRepositorySource {
    people: readonly TrainingPerson[];
    records: readonly TrainingRecord[];
    qualifications: readonly QualificationRecord[];
}

const normalize = (value: string | number | undefined) =>
    value
        ?.toString()
        .trim()
        .toLocaleLowerCase()
        .replaceAll("&", "and")
        .replaceAll(/[\s_-]+/g, " ") ?? "";

const includesSearchTerms = (haystack: readonly (string | number | undefined)[], query: string) => {
    const searchable = normalize(haystack.filter((value) => value !== undefined).join(" "));
    return normalize(query)
        .split(" ")
        .filter(Boolean)
        .every((term) => searchable.includes(term));
};

const equals = (left: string | number | undefined, right: string | number | undefined) => {
    if (right === undefined || right === "") return true;
    return normalize(left) === normalize(right);
};

const readableLabel = (value: string) =>
    value
        .split(/[-_]/)
        .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
        .join(" ");

const buildFacet = <Item>(
    items: readonly Item[],
    valueFor: (item: Item) => string,
    labelFor: (value: string, item: Item) => string = (value) => readableLabel(value),
): FacetOption[] => {
    const entries = new Map<string, { label: string; count: number }>();

    for (const item of items) {
        const value = valueFor(item);
        if (!value) continue;
        const current = entries.get(value);
        entries.set(value, {
            label: current?.label ?? labelFor(value, item),
            count: (current?.count ?? 0) + 1,
        });
    }

    return [...entries.entries()].map(([value, entry]) => ({ value, ...entry })).sort((a, b) => a.label.localeCompare(b.label));
};

export const buildPeopleFacets = (people: readonly TrainingPerson[]): PeopleFacetOptions => ({
    employmentStatuses: buildFacet(people, (person) => person.employmentStatus),
    populations: buildFacet(people, (person) => person.population),
    fleets: buildFacet(
        people,
        (person) => person.fleetCode,
        (value) => value,
    ),
    seats: buildFacet(
        people,
        (person) => person.seatCode,
        (value) => value,
    ),
    bases: buildFacet(
        people,
        (person) => person.baseCode,
        (value) => value,
    ),
    roles: buildFacet(
        people,
        (person) => person.roleTitle,
        (value) => value,
    ),
    programs: buildFacet(
        people,
        (person) => person.programType,
        (_value, person) => person.programName,
    ),
    qualificationStates: buildFacet(people, (person) => person.qualificationState),
});

export const buildRecordFacets = (records: readonly TrainingRecord[]): RecordFacetOptions => {
    const taskCounts = new Map<string, { record: TrainingRecord; count: number }>();
    for (const record of records) {
        const current = taskCounts.get(record.taskId);
        taskCounts.set(record.taskId, { record, count: (current?.count ?? 0) + 1 });
    }

    const tasks: TaskFacetOption[] = [...taskCounts.values()]
        .map(({ record, count }) => ({
            value: record.taskId,
            label: `${record.taskId} · VISION ${record.visionTaskId} — ${record.taskTitle}`,
            count,
            visionTaskId: record.visionTaskId,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

    const dates = records.map((record) => record.eventDate).sort();

    return {
        tasks,
        curricula: buildFacet(
            records,
            (record) => record.curriculumCode,
            (_value, record) => `${record.curriculumCode} — ${record.curriculumTitle} (${record.curriculumVersion})`,
        ),
        modules: buildFacet(
            records,
            (record) => record.moduleCode,
            (_value, record) => `${record.moduleCode} — ${record.moduleTitle}`,
        ),
        eventTypes: buildFacet(records, (record) => record.eventType),
        forms: buildFacet(
            records,
            (record) => record.formName,
            (value) => value,
        ),
        formStates: buildFacet(records, (record) => record.formState),
        outcomes: buildFacet(records, (record) => record.outcome),
        fleets: buildFacet(
            records,
            (record) => record.fleetCode,
            (value) => value,
        ),
        seats: buildFacet(
            records,
            (record) => record.seatCode,
            (value) => value,
        ),
        bases: buildFacet(
            records,
            (record) => record.baseCode,
            (value) => value,
        ),
        programs: buildFacet(
            records,
            (record) => record.programType,
            (_value, record) => record.programCode,
        ),
        instructors: buildFacet(
            records,
            (record) => record.instructorId,
            (_value, record) => record.instructorName,
        ),
        devices: buildFacet(
            records,
            (record) => record.deviceCode,
            (_value, record) => `${record.deviceCode} — ${record.deviceType}`,
        ),
        qualificationEffects: buildFacet(records, (record) => record.qualificationEffect.type),
        dateRange: {
            min: dates.at(0) ?? "",
            max: dates.at(-1) ?? "",
        },
    };
};

const personMatches = (person: TrainingPerson, query: PeopleQuery) => {
    if (
        query.query &&
        !includesSearchTerms(
            [
                person.displayName,
                person.preferredName,
                person.employeeNumber,
                person.email,
                person.roleTitle,
                person.department,
                person.population,
                person.fleetCode,
                person.seatCode,
                person.baseCode,
                person.programCode,
                person.programName,
                ...person.qualifications.flatMap((qualification) => [qualification.requirementCode, qualification.title]),
            ],
            query.query,
        )
    ) {
        return false;
    }

    return (
        equals(person.employmentStatus, query.employmentStatus) &&
        equals(person.population, query.population) &&
        equals(person.fleetCode, query.fleetCode) &&
        equals(person.seatCode, query.seatCode) &&
        equals(person.baseCode, query.baseCode) &&
        equals(person.roleTitle, query.roleTitle) &&
        equals(person.programType, query.programType) &&
        equals(person.qualificationState, query.qualificationState) &&
        (query.isInstructor === undefined || person.isInstructor === query.isInstructor) &&
        (query.isEvaluator === undefined || person.isEvaluator === query.isEvaluator)
    );
};

const recordMatches = (record: TrainingRecord, query: TrainingRecordQuery) => {
    if (
        query.query &&
        !includesSearchTerms(
            [
                record.recordNumber,
                record.personName,
                record.employeeNumber,
                record.taskId,
                record.visionTaskId,
                record.taskTitle,
                record.outlineNumber,
                record.curriculumCode,
                record.curriculumTitle,
                record.curriculumVersion,
                record.moduleCode,
                record.moduleTitle,
                record.eventId,
                record.eventType,
                record.formId,
                record.formName,
                record.instructorName,
                record.deviceCode,
                record.deviceType,
                record.qualificationEffect.requirementCode,
                record.qualificationEffect.qualificationTitle,
            ],
            query.query,
        )
    ) {
        return false;
    }

    return (
        equals(record.personId, query.personId) &&
        equals(record.taskId, query.taskId) &&
        equals(record.visionTaskId, query.visionTaskId) &&
        equals(record.curriculumCode, query.curriculumCode) &&
        equals(record.moduleCode, query.moduleCode) &&
        equals(record.eventType, query.eventType) &&
        equals(record.formName, query.formName) &&
        equals(record.formState, query.formState) &&
        equals(record.outcome, query.outcome) &&
        equals(record.fleetCode, query.fleetCode) &&
        equals(record.seatCode, query.seatCode) &&
        equals(record.baseCode, query.baseCode) &&
        equals(record.programType, query.programType) &&
        equals(record.instructorId, query.instructorId) &&
        equals(record.deviceCode, query.deviceCode) &&
        equals(record.qualificationEffect.type, query.qualificationEffect) &&
        (!query.fromDate || record.eventDate >= query.fromDate) &&
        (!query.toDate || record.eventDate <= query.toDate)
    );
};

export const createRecordsRepository = ({ people, records, qualifications }: RecordsRepositorySource): RecordsRepository => {
    const peopleFacets = buildPeopleFacets(people);
    const recordFacets = buildRecordFacets(records);

    return {
        listPeople: (query = {}) =>
            people
                .filter((person) => personMatches(person, query))
                .slice()
                .sort((a, b) => a.displayName.localeCompare(b.displayName)),
        searchPeople: (query, filters = {}) =>
            people
                .filter((person) => personMatches(person, { ...filters, query }))
                .slice()
                .sort((a, b) => a.displayName.localeCompare(b.displayName)),
        getPersonProfile: (personId) => people.find((person) => person.id === personId),
        searchRecords: (query = {}) =>
            records
                .filter((record) => recordMatches(record, query))
                .slice()
                .sort((a, b) => b.eventDate.localeCompare(a.eventDate) || a.recordNumber.localeCompare(b.recordNumber)),
        getRecord: (recordId) => records.find((record) => record.id === recordId || record.recordNumber === recordId),
        getQualifications: (personId) =>
            qualifications
                .filter((qualification) => qualification.personId === personId)
                .slice()
                .sort((a, b) => a.title.localeCompare(b.title)),
        getTimeline: (personId) => buildPersonTimeline(personId, people, records, qualifications),
        getPeopleFacets: () => peopleFacets,
        getRecordFacets: () => recordFacets,
    };
};

export const buildPersonTimeline = (
    personId: string,
    people: readonly TrainingPerson[],
    records: readonly TrainingRecord[],
    qualifications: readonly QualificationRecord[],
): TrainingTimelineEntry[] => {
    const person = people.find((candidate) => candidate.id === personId);
    if (!person) return [];

    const recordEntries: TrainingTimelineEntry[] = records
        .filter((record) => record.personId === personId)
        .map((record) => ({
            id: `timeline-${record.id}`,
            personId,
            date: record.eventDate,
            kind: "training",
            title: `${record.eventType}: ${record.taskTitle}`,
            description: `${record.outcome} · ${record.curriculumCode} ${record.curriculumVersion} · ${record.formName}`,
            tone: record.outcome === "satisfactory" || record.outcome === "credited" ? "success" : record.outcome === "unsatisfactory" ? "danger" : "warning",
            recordId: record.id,
            formId: record.formId,
        }));

    const qualificationEntries: TrainingTimelineEntry[] = qualifications
        .filter((qualification) => qualification.personId === personId)
        .flatMap((qualification) =>
            qualification.history.map((change) => ({
                id: `timeline-${qualification.id}-${change.id}`,
                personId,
                date: change.effectiveDate,
                kind: "qualification" as const,
                title: `${qualification.title} ${change.action}`,
                description: change.note,
                tone:
                    change.action === "expired" || change.action === "suspended"
                        ? ("danger" as const)
                        : change.action === "corrected"
                          ? ("neutral" as const)
                          : ("success" as const),
                recordId: change.sourceRecordId,
                qualificationId: qualification.id,
            })),
        );

    const credentialEntries: TrainingTimelineEntry[] = person.credentials.map((credential) => ({
        id: `timeline-${credential.id}`,
        personId,
        date: credential.issuedDate,
        kind: "credential",
        title: `${credential.name} recorded`,
        description: `${credential.issuer} · ${credential.status}`,
        tone: credential.status === "expired" ? "danger" : credential.status === "expiring" ? "warning" : "success",
    }));

    const restrictionEntries: TrainingTimelineEntry[] = person.restrictions.map((restriction) => ({
        id: `timeline-${restriction.id}`,
        personId,
        date: restriction.effectiveDate,
        kind: "restriction",
        title: restriction.title,
        description: restriction.description,
        tone: restriction.status === "active" ? "danger" : "neutral",
        recordId: restriction.sourceRecordId,
    }));

    return [...recordEntries, ...qualificationEntries, ...credentialEntries, ...restrictionEntries].sort(
        (a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id),
    );
};
