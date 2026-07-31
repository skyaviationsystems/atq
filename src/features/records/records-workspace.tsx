"use client";

import { useCallback, useMemo, useState } from "react";
import { Database01 } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import type { ModuleViewProps } from "@/features/modules/module-types";
import { Callout, ModuleTabs, StatusBadge, WorkspaceBody, WorkspaceHeader } from "@/features/modules/module-ui";
import { demoRecordsRepository, recordPeople, trainingRecords } from "./demo-records-repository";
import { PeopleDirectory } from "./people-directory";
import { PersonProfile } from "./person-profile";
import { QualificationMatrix } from "./qualification-matrix";
import { RecordDetailDrawer } from "./record-detail-drawer";
import { type RecordSearchRow, RecordsExplorer } from "./records-explorer";
import type { QualificationRecord, TrainingPerson, TrainingRecord } from "./types";

type RecordsView = "people" | "person" | "records" | "matrix";

const workspaceTabs = [
    { id: "people", label: "People", count: recordPeople.length },
    { id: "records", label: "All training records", count: trainingRecords.length },
    { id: "matrix", label: "Qualification matrix" },
] as const;

const titleCase = (value: string) =>
    value
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

const toSearchRow = (record: TrainingRecord): RecordSearchRow => ({
    id: record.id,
    personId: record.personId,
    personName: record.personName,
    employeeNumber: record.employeeNumber,
    fleet: record.fleetCode,
    seat: record.seatCode,
    base: record.baseCode,
    program: record.programType === "NO" ? "N&O" : record.programType,
    completedAt: record.eventDate,
    eventId: record.eventId,
    eventType: record.eventType,
    curriculumTitle: record.curriculumTitle,
    curriculumVersion: record.curriculumVersion,
    moduleCode: record.moduleCode,
    taskId: record.taskId,
    taskTitle: record.taskTitle,
    formId: record.formId,
    formName: record.formName,
    formState: titleCase(record.formState),
    outcome: titleCase(record.outcome),
    instructor: record.instructorName,
    device: `${record.deviceCode} · ${record.deviceType}`,
    qualificationEffect: record.qualificationEffect.explanation,
});

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;

const downloadCsv = (filename: string, rows: readonly (readonly unknown[])[]) => {
    const content = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
};

const normalizeView = (initialView?: string): RecordsView => {
    if (initialView === "record" || initialView === "explorer") return "records";
    if (initialView === "jacket") return "person";
    if (initialView === "population") return "people";
    if (initialView === "person" || initialView === "records" || initialView === "matrix") return initialView;
    return "people";
};

export function RecordsWorkspace({ initialView, initialEntityId }: ModuleViewProps) {
    const router = useRouter();
    const initialResolvedView = normalizeView(initialView);
    const [view, setView] = useState<RecordsView>(initialResolvedView);
    const [selectedPersonId, setSelectedPersonId] = useState<string | undefined>(
        initialResolvedView === "person" ? (initialEntityId ?? recordPeople[0]?.id) : undefined,
    );
    const [selectedRecordId, setSelectedRecordId] = useState<string>();
    const [selectedQualification, setSelectedQualification] = useState<QualificationRecord>();

    const allRecords = useMemo(() => demoRecordsRepository.searchRecords(), []);
    const searchRows = useMemo(() => allRecords.map(toSearchRow), [allRecords]);
    const selectedPerson = selectedPersonId ? demoRecordsRepository.getPersonProfile(selectedPersonId) : undefined;
    const selectedRecord = selectedRecordId ? demoRecordsRepository.getRecord(selectedRecordId) : undefined;
    const selectedQualificationPerson = selectedQualification ? demoRecordsRepository.getPersonProfile(selectedQualification.personId) : undefined;
    const selectedQualificationRecord = selectedQualification?.sourceRecordId
        ? demoRecordsRepository.getRecord(selectedQualification.sourceRecordId)
        : undefined;

    const openPeople = useCallback(() => {
        setView("people");
        setSelectedPersonId(undefined);
        router.push("/records/people");
    }, [router]);

    const openPerson = useCallback(
        (personOrId: TrainingPerson | string) => {
            const personId = typeof personOrId === "string" ? personOrId : personOrId.id;
            setSelectedPersonId(personId);
            setView("person");
            router.push(`/records/people/${encodeURIComponent(personId)}`);
        },
        [router],
    );

    const openWorkspaceView = useCallback(
        (nextView: string) => {
            const resolved = normalizeView(nextView);
            setView(resolved);
            setSelectedRecordId(undefined);
            setSelectedQualification(undefined);
            if (resolved === "people") {
                setSelectedPersonId(undefined);
                router.push("/records/people");
            } else if (resolved === "records") {
                router.push("/records/explorer");
            } else if (resolved === "matrix") {
                router.push("/records/matrix");
            }
        },
        [router],
    );

    const closeDetails = useCallback(() => {
        setSelectedRecordId(undefined);
        setSelectedQualification(undefined);
    }, []);

    const exportPeople = (people: readonly TrainingPerson[]) =>
        downloadCsv("atq-training-population.csv", [
            ["Employee number", "Name", "Role", "Fleet", "Seat", "Base", "Program", "Qualification state", "Next due", "Record completeness"],
            ...people.map((person) => [
                person.employeeNumber,
                person.displayName,
                person.roleTitle,
                person.fleetCode,
                person.seatCode,
                person.baseCode,
                person.programType === "NO" ? "N&O" : person.programType,
                titleCase(person.qualificationState),
                person.nextDueDate ?? "",
                `${person.recordCompleteness}%`,
            ]),
        ]);

    const exportRecordRows = (records: readonly RecordSearchRow[]) =>
        downloadCsv("atq-training-records.csv", [
            [
                "Employee number",
                "Person",
                "Fleet",
                "Seat",
                "Base",
                "Completed",
                "Task ID",
                "Task",
                "Curriculum",
                "Version",
                "Module",
                "Event ID",
                "Event type",
                "Form ID",
                "Form state",
                "Outcome",
                "Instructor",
                "Device",
                "Qualification effect",
            ],
            ...records.map((record) => [
                record.employeeNumber,
                record.personName,
                record.fleet,
                record.seat,
                record.base,
                record.completedAt,
                record.taskId,
                record.taskTitle,
                record.curriculumTitle,
                record.curriculumVersion,
                record.moduleCode,
                record.eventId,
                record.eventType,
                record.formId,
                record.formState,
                record.outcome,
                record.instructor,
                record.device,
                record.qualificationEffect,
            ]),
        ]);

    const exportJacket = (person: TrainingPerson) => {
        const personRecords = demoRecordsRepository.searchRecords({ personId: person.id });
        downloadCsv(`atq-record-jacket-${person.employeeNumber}.csv`, [
            ["ATQ synthetic record jacket"],
            ["Employee number", person.employeeNumber],
            ["Name", person.displayName],
            ["Role", person.roleTitle],
            ["Fleet / seat / base", `${person.fleetCode} / ${person.seatCode} / ${person.baseCode}`],
            ["Program", person.programType === "NO" ? "N&O" : person.programType],
            ["Qualification state", titleCase(person.qualificationState)],
            ["Record completeness", `${person.recordCompleteness}%`],
            [],
            ["Qualifications"],
            ["Requirement", "Title", "Status", "Last completed", "Next due", "Source form"],
            ...person.qualifications.map((qualification) => [
                qualification.requirementCode,
                qualification.title,
                titleCase(qualification.status),
                qualification.lastCompletedDate ?? "",
                qualification.nextDueDate ?? qualification.expirationDate ?? "",
                qualification.sourceFormId ?? "",
            ]),
            [],
            ["Training records"],
            ["Completed", "Task ID", "Task", "Curriculum", "Event ID", "Form ID", "Outcome"],
            ...personRecords.map((record) => [
                record.eventDate,
                record.taskId,
                record.taskTitle,
                `${record.curriculumCode} ${record.curriculumVersion}`,
                record.eventId,
                record.formId,
                titleCase(record.outcome),
            ]),
        ]);
    };

    const exportMatrix = (people: readonly TrainingPerson[]) => {
        const requirementCodes = [
            ...new Set(recordPeople.flatMap((person) => person.qualifications.map((qualification) => qualification.requirementCode))),
        ].sort();
        downloadCsv("atq-qualification-matrix.csv", [
            ["Employee number", "Person", "Fleet", "Seat", "Base", ...requirementCodes],
            ...people.map((person) => [
                person.employeeNumber,
                person.displayName,
                person.fleetCode,
                person.seatCode,
                person.baseCode,
                ...requirementCodes.map((code) =>
                    titleCase(person.qualifications.find((qualification) => qualification.requirementCode === code)?.status ?? "not-held"),
                ),
            ]),
        ]);
    };

    const topTab = view === "person" ? "people" : view;

    return (
        <div className="min-h-full">
            <WorkspaceHeader
                eyebrow="M4 · Records"
                title="Records and qualifications"
                description="Search a person into one complete record jacket, or search training evidence across everyone by task, curriculum, event, or form."
                status={<StatusBadge tone="blue">Synthetic POC data</StatusBadge>}
            />
            <ModuleTabs tabs={workspaceTabs} selected={topTab} onSelect={openWorkspaceView} />
            <WorkspaceBody>
                <Callout icon={Database01} title="One linked records model" tone="blue">
                    Every result in this proof of concept resolves through person → task → curriculum → event → source form → qualification effect. The
                    repository boundary is ready for Supabase now and a later AWS adapter.
                </Callout>

                {view === "person" ? (
                    selectedPerson ? (
                        <PersonProfile
                            person={selectedPerson}
                            records={demoRecordsRepository.searchRecords({ personId: selectedPerson.id })}
                            timeline={demoRecordsRepository.getTimeline(selectedPerson.id)}
                            onBack={openPeople}
                            onOpenRecord={(record) => setSelectedRecordId(record.id)}
                            onOpenQualification={(qualification) => setSelectedQualification(qualification)}
                            onExport={exportJacket}
                        />
                    ) : (
                        <section className="rounded-xl bg-primary px-6 py-14 text-center shadow-xs ring-1 ring-secondary">
                            <h2 className="font-semibold text-primary">Person not found</h2>
                            <p className="mt-1 text-sm text-tertiary">This profile ID is not present in the synthetic proof-of-concept dataset.</p>
                            <button type="button" onClick={openPeople} className="mt-4 text-sm font-semibold text-brand-secondary hover:underline">
                                Return to people search
                            </button>
                        </section>
                    )
                ) : view === "records" ? (
                    <RecordsExplorer
                        records={searchRows}
                        onOpenPerson={openPerson}
                        onOpenRecord={(recordId) => setSelectedRecordId(recordId)}
                        onExport={exportRecordRows}
                    />
                ) : view === "matrix" ? (
                    <QualificationMatrix
                        people={recordPeople}
                        onOpenPerson={openPerson}
                        onOpenQualification={(personId, qualificationId) => {
                            const qualification = demoRecordsRepository.getQualifications(personId).find((candidate) => candidate.id === qualificationId);
                            setSelectedQualification(qualification);
                        }}
                        onExport={exportMatrix}
                    />
                ) : (
                    <PeopleDirectory people={recordPeople} onOpenPerson={openPerson} onExport={exportPeople} />
                )}
            </WorkspaceBody>

            <RecordDetailDrawer
                record={selectedRecord ?? selectedQualificationRecord}
                qualification={selectedQualification}
                person={selectedQualificationPerson ?? selectedPerson}
                onClose={closeDetails}
                onOpenPerson={openPerson}
            />
        </div>
    );
}
