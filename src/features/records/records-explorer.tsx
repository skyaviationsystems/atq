"use client";

import { useMemo, useState } from "react";
import { Download01, FilterLines, SearchLg, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Panel, StatusBadge, type StatusTone } from "@/features/modules/module-ui";

export interface RecordSearchRow {
    id: string;
    personId: string;
    personName: string;
    employeeNumber: string;
    fleet: string;
    seat: string;
    base: string;
    program: string;
    completedAt: string;
    eventId: string;
    eventType: string;
    curriculumTitle: string;
    curriculumVersion: string;
    moduleCode: string;
    taskId: string;
    taskTitle: string;
    formId: string;
    formName: string;
    formState: string;
    outcome: string;
    instructor: string;
    device: string;
    qualificationEffect: string;
}

interface RecordsExplorerProps {
    records: readonly RecordSearchRow[];
    onOpenPerson: (personId: string) => void;
    onOpenRecord: (recordId: string) => void;
    onExport: (records: readonly RecordSearchRow[]) => void;
}

const selectClassName =
    "h-10 rounded-lg bg-primary px-3 text-sm font-medium text-secondary shadow-xs ring-1 ring-primary outline-hidden focus:ring-2 focus:ring-brand";

const inputClassName =
    "h-10 rounded-lg bg-primary px-3 text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden placeholder:text-placeholder focus:ring-2 focus:ring-brand";

const uniqueValues = (records: readonly RecordSearchRow[], read: (record: RecordSearchRow) => string) =>
    [...new Set(records.map(read).filter(Boolean))].sort((a, b) => a.localeCompare(b));

const outcomeTone = (outcome: string): StatusTone => {
    if (["Satisfactory", "Complete", "Passed"].includes(outcome)) return "green";
    if (["Unsatisfactory", "Incomplete", "Failed"].includes(outcome)) return "red";
    return "amber";
};

const formTone = (state: string): StatusTone => {
    if (state === "Signed") return "green";
    if (state === "Amended") return "purple";
    if (state === "Void") return "red";
    return "blue";
};

const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));

export function RecordsExplorer({ records, onOpenPerson, onOpenRecord, onExport }: RecordsExplorerProps) {
    const [query, setQuery] = useState("");
    const [task, setTask] = useState("All tasks");
    const [curriculum, setCurriculum] = useState("All curricula");
    const [eventType, setEventType] = useState("All event types");
    const [outcome, setOutcome] = useState("All outcomes");
    const [program, setProgram] = useState("All programs");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const facets = useMemo(
        () => ({
            tasks: uniqueValues(records, (record) => `${record.taskId} · ${record.taskTitle}`),
            curricula: uniqueValues(records, (record) => `${record.curriculumTitle} · ${record.curriculumVersion}`),
            eventTypes: uniqueValues(records, (record) => record.eventType),
            outcomes: uniqueValues(records, (record) => record.outcome),
            programs: uniqueValues(records, (record) => record.program),
        }),
        [records],
    );

    const filteredRecords = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return records.filter((record) => {
            const searchText = [
                record.personName,
                record.employeeNumber,
                record.fleet,
                record.seat,
                record.base,
                record.program,
                record.eventId,
                record.eventType,
                record.curriculumTitle,
                record.curriculumVersion,
                record.moduleCode,
                record.taskId,
                record.taskTitle,
                record.formId,
                record.formName,
                record.formState,
                record.outcome,
                record.instructor,
                record.device,
                record.qualificationEffect,
            ]
                .join(" ")
                .toLowerCase();

            return (
                (!normalizedQuery || searchText.includes(normalizedQuery)) &&
                (task === "All tasks" || `${record.taskId} · ${record.taskTitle}` === task) &&
                (curriculum === "All curricula" || `${record.curriculumTitle} · ${record.curriculumVersion}` === curriculum) &&
                (eventType === "All event types" || record.eventType === eventType) &&
                (outcome === "All outcomes" || record.outcome === outcome) &&
                (program === "All programs" || record.program === program) &&
                (!dateFrom || record.completedAt.slice(0, 10) >= dateFrom) &&
                (!dateTo || record.completedAt.slice(0, 10) <= dateTo)
            );
        });
    }, [curriculum, dateFrom, dateTo, eventType, outcome, program, query, records, task]);

    const activeFilterCount =
        [query, dateFrom, dateTo].filter(Boolean).length +
        [task !== "All tasks", curriculum !== "All curricula", eventType !== "All event types", outcome !== "All outcomes", program !== "All programs"].filter(
            Boolean,
        ).length;

    const clearFilters = () => {
        setQuery("");
        setTask("All tasks");
        setCurriculum("All curricula");
        setEventType("All event types");
        setOutcome("All outcomes");
        setProgram("All programs");
        setDateFrom("");
        setDateTo("");
    };

    const peopleCount = new Set(filteredRecords.map((record) => record.personId)).size;
    const taskCount = new Set(filteredRecords.map((record) => record.taskId)).size;

    return (
        <div className="space-y-5">
            <section aria-labelledby="record-search-heading" className="rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 id="record-search-heading" className="text-lg font-semibold text-primary">
                            Search every training record
                        </h2>
                        <p className="mt-1 text-sm text-tertiary">
                            Find records across the population by person, task or Vision ID, curriculum, event, form, instructor, or device.
                        </p>
                    </div>
                    <Button
                        size="sm"
                        color="secondary"
                        iconLeading={Download01}
                        isDisabled={filteredRecords.length === 0}
                        onPress={() => onExport(filteredRecords)}
                    >
                        Export {filteredRecords.length} rows
                    </Button>
                </div>

                <label className="relative mt-5 block">
                    <span className="sr-only">Search all training records</span>
                    <SearchLg aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-fg-quaternary" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Try a person, employee number, task ID, curriculum, event ID, or form ID"
                        className="h-11 w-full rounded-lg bg-primary pr-4 pl-11 text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                    />
                </label>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <label className="grid gap-1.5 text-xs font-semibold text-secondary">
                        Task / Vision ID
                        <select aria-label="Task or Vision ID" value={task} onChange={(event) => setTask(event.target.value)} className={selectClassName}>
                            <option>All tasks</option>
                            {facets.tasks.map((value) => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold text-secondary">
                        Curriculum / version
                        <select
                            aria-label="Curriculum and version"
                            value={curriculum}
                            onChange={(event) => setCurriculum(event.target.value)}
                            className={selectClassName}
                        >
                            <option>All curricula</option>
                            {facets.curricula.map((value) => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold text-secondary">
                        Event type
                        <select aria-label="Event type" value={eventType} onChange={(event) => setEventType(event.target.value)} className={selectClassName}>
                            <option>All event types</option>
                            {facets.eventTypes.map((value) => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold text-secondary">
                        Outcome
                        <select aria-label="Outcome" value={outcome} onChange={(event) => setOutcome(event.target.value)} className={selectClassName}>
                            <option>All outcomes</option>
                            {facets.outcomes.map((value) => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold text-secondary">
                        Program
                        <select aria-label="Program" value={program} onChange={(event) => setProgram(event.target.value)} className={selectClassName}>
                            <option>All programs</option>
                            {facets.programs.map((value) => (
                                <option key={value}>{value}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <label className="grid gap-1.5 text-xs font-semibold text-secondary">
                        Completed from
                        <input
                            aria-label="Completed from"
                            type="date"
                            value={dateFrom}
                            max={dateTo || undefined}
                            onChange={(event) => setDateFrom(event.target.value)}
                            className={inputClassName}
                        />
                    </label>
                    <label className="grid gap-1.5 text-xs font-semibold text-secondary">
                        Completed through
                        <input
                            aria-label="Completed through"
                            type="date"
                            value={dateTo}
                            min={dateFrom || undefined}
                            onChange={(event) => setDateTo(event.target.value)}
                            className={inputClassName}
                        />
                    </label>
                    {activeFilterCount > 0 && (
                        <Button size="sm" color="tertiary" iconLeading={XClose} onPress={clearFilters}>
                            Clear {activeFilterCount} {activeFilterCount === 1 ? "filter" : "filters"}
                        </Button>
                    )}
                </div>
            </section>

            <div className="grid gap-3 sm:grid-cols-3">
                {[
                    { label: "Matching records", value: filteredRecords.length.toLocaleString() },
                    { label: "People represented", value: peopleCount.toLocaleString() },
                    { label: "Tasks represented", value: taskCount.toLocaleString() },
                ].map((metric) => (
                    <div key={metric.label} className="rounded-xl bg-primary px-4 py-3 shadow-xs ring-1 ring-secondary">
                        <p className="text-xs font-medium text-quaternary">{metric.label}</p>
                        <p className="mt-1 text-xl font-semibold text-primary">{metric.value}</p>
                    </div>
                ))}
            </div>

            <Panel
                title="Training records"
                description={`${filteredRecords.length} of ${records.length} synthetic records · dates shown in UTC`}
                action={
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-tertiary">
                        <FilterLines aria-hidden="true" className="size-4" />
                        {activeFilterCount ? `${activeFilterCount} active` : "All records"}
                    </span>
                }
                flush
            >
                {filteredRecords.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1120px] border-separate border-spacing-0" aria-label="All training records">
                            <thead>
                                <tr className="bg-secondary">
                                    {["Person", "Completed", "Task / Vision ID", "Curriculum", "Event", "Form", "Outcome", ""].map((label) => (
                                        <th
                                            key={label || "actions"}
                                            scope="col"
                                            className="border-b border-secondary px-4 py-2.5 text-left text-xs font-semibold text-quaternary"
                                        >
                                            {label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRecords.map((record) => (
                                    <tr
                                        key={record.id}
                                        className="hover:bg-secondary [&:not(:last-child)>td]:border-b [&:not(:last-child)>td]:border-secondary"
                                    >
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => onOpenPerson(record.personId)}
                                                className="text-left outline-focus-ring focus-visible:outline-2"
                                            >
                                                <span className="block text-sm font-semibold text-brand-secondary hover:underline">{record.personName}</span>
                                                <span className="mt-0.5 block font-mono text-xs text-quaternary">
                                                    {record.employeeNumber} · {record.fleet}/{record.seat} · {record.base}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 text-sm whitespace-nowrap text-tertiary">{formatDate(record.completedAt)}</td>
                                        <td className="px-4 py-3">
                                            <span className="block font-mono text-xs font-semibold text-brand-secondary">{record.taskId}</span>
                                            <span className="mt-0.5 block max-w-52 text-sm text-secondary">{record.taskTitle}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="block max-w-48 text-sm font-medium text-secondary">{record.curriculumTitle}</span>
                                            <span className="mt-0.5 block text-xs text-quaternary">
                                                {record.curriculumVersion} · {record.moduleCode}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="block font-mono text-xs font-semibold text-secondary">{record.eventId}</span>
                                            <span className="mt-0.5 block text-xs text-quaternary">{record.eventType}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="block font-mono text-xs font-semibold text-secondary">{record.formId}</span>
                                            <span className="mt-1 block">
                                                <StatusBadge tone={formTone(record.formState)}>{record.formState}</StatusBadge>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge tone={outcomeTone(record.outcome)}>{record.outcome}</StatusBadge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button size="xs" color="secondary" onPress={() => onOpenRecord(record.id)}>
                                                View record
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 py-14 text-center">
                        <SearchLg aria-hidden="true" className="mx-auto size-8 text-fg-quaternary" />
                        <p className="mt-3 font-semibold text-primary">No records match these filters</p>
                        <p className="mt-1 text-sm text-tertiary">Clear the filters or search a different task, curriculum, person, event, or form.</p>
                        <Button size="sm" color="secondary" className="mt-4" onPress={clearFilters}>
                            Reset record search
                        </Button>
                    </div>
                )}
            </Panel>
        </div>
    );
}
