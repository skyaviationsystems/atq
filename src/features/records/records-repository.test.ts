import { describe, expect, it } from "vitest";
import { demoRecordsRepository, qualifications, recordPeople, trainingRecords } from "./demo-records-repository";

describe("demo records repository", () => {
    it("finds a person by partial name or employee number", () => {
        expect(demoRecordsRepository.searchPeople("avery").map((person) => person.displayName)).toContain("Avery Morgan");
        expect(demoRecordsRepository.searchPeople("ATQ-1001").map((person) => person.displayName)).toEqual(["Avery Morgan"]);
    });

    it("keeps a person profile, qualifications, records, and timeline scoped to one person", () => {
        const person = recordPeople[1];
        const profile = demoRecordsRepository.getPersonProfile(person.id);
        const records = demoRecordsRepository.searchRecords({ personId: person.id });
        const personQualifications = demoRecordsRepository.getQualifications(person.id);
        const timeline = demoRecordsRepository.getTimeline(person.id);

        expect(profile?.id).toBe(person.id);
        expect(records.length).toBeGreaterThan(0);
        expect(records.every((record) => record.personId === person.id)).toBe(true);
        expect(personQualifications.every((qualification) => qualification.personId === person.id)).toBe(true);
        expect(timeline.every((entry) => entry.personId === person.id)).toBe(true);
    });

    it("searches a stable task and curriculum across multiple people", () => {
        const b747Task = trainingRecords.find((record) => record.taskId === "TASK-B747-RTO-001");
        expect(b747Task).toBeDefined();

        const taskRecords = demoRecordsRepository.searchRecords({ taskId: b747Task?.taskId });
        const curriculumRecords = demoRecordsRepository.searchRecords({ curriculumCode: b747Task?.curriculumCode });

        expect(new Set(taskRecords.map((record) => record.personId)).size).toBeGreaterThan(1);
        expect(taskRecords.every((record) => record.taskId === "TASK-B747-RTO-001")).toBe(true);
        expect(new Set(curriculumRecords.map((record) => record.personId)).size).toBeGreaterThan(1);
        expect(curriculumRecords.every((record) => record.curriculumCode === b747Task?.curriculumCode)).toBe(true);
    });

    it("resolves every linked qualification source back to its exact record and form", () => {
        const linkedQualifications = qualifications.filter((qualification) => qualification.sourceRecordId || qualification.sourceFormId);
        expect(linkedQualifications.length).toBeGreaterThan(0);

        for (const qualification of linkedQualifications) {
            expect(qualification.sourceRecordId, `${qualification.id} is missing a source record ID`).toBeTruthy();
            const sourceRecord = demoRecordsRepository.getRecord(qualification.sourceRecordId!);
            expect(sourceRecord, `${qualification.id} has an unresolved source record`).toBeDefined();
            expect(sourceRecord?.personId).toBe(qualification.personId);
            expect(sourceRecord?.formId).toBe(qualification.sourceFormId);
        }
    });

    it("contains only explicitly synthetic contact data", () => {
        expect(recordPeople).toHaveLength(14);
        expect(trainingRecords).toHaveLength(28);
        expect(recordPeople.every((person) => person.synthetic && person.email.endsWith("@example.invalid"))).toBe(true);
        expect(trainingRecords.every((record) => record.synthetic)).toBe(true);
    });
});
