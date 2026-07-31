"use client";

import { useMemo, useState } from "react";
import { Download01, SearchLg } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Panel, StatusBadge, type StatusTone } from "@/features/modules/module-ui";
import { cx } from "@/utils/cx";
import type { QualificationRecord, TrainingPerson } from "./types";

interface QualificationMatrixProps {
    people: readonly TrainingPerson[];
    onOpenPerson: (personId: string) => void;
    onOpenQualification: (personId: string, qualificationId: string) => void;
    onExport: (people: readonly TrainingPerson[]) => void;
}

const statusLabel = (status: QualificationRecord["status"]) =>
    status
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

const statusTone = (status: QualificationRecord["status"]): StatusTone => {
    if (status === "current") return "green";
    if (status === "expiring" || status === "in-progress") return "amber";
    if (status === "expired" || status === "suspended") return "red";
    return "gray";
};

const cellStyle = (status?: QualificationRecord["status"]) => {
    if (status === "current") return "bg-utility-green-50 text-utility-green-800 ring-utility-green-200";
    if (status === "expiring" || status === "in-progress") return "bg-utility-yellow-50 text-utility-yellow-800 ring-utility-yellow-200";
    if (status === "expired" || status === "suspended") return "bg-utility-red-50 text-utility-red-800 ring-utility-red-200";
    return "bg-secondary text-quaternary ring-secondary";
};

export function QualificationMatrix({ people, onOpenPerson, onOpenQualification, onExport }: QualificationMatrixProps) {
    const [query, setQuery] = useState("");
    const [program, setProgram] = useState("All programs");
    const [fleet, setFleet] = useState("All fleets");
    const [status, setStatus] = useState("All states");

    const requirements = useMemo(() => {
        const byCode = new Map<string, { code: string; title: string }>();
        people.forEach((person) =>
            person.qualifications.forEach((qualification) => {
                byCode.set(qualification.requirementCode, {
                    code: qualification.requirementCode,
                    title: qualification.title,
                });
            }),
        );
        return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
    }, [people]);

    const programOptions = useMemo(() => [...new Set(people.map((person) => person.programType))].sort(), [people]);
    const fleetOptions = useMemo(() => [...new Set(people.map((person) => person.fleetCode))].sort(), [people]);

    const filteredPeople = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return people.filter((person) => {
            const matchesQuery =
                !normalizedQuery ||
                [person.displayName, person.employeeNumber, person.roleTitle, person.fleetCode, person.seatCode, person.baseCode]
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedQuery);
            const matchesStatus = status === "All states" || person.qualifications.some((qualification) => qualification.status === status);
            return (
                matchesQuery &&
                matchesStatus &&
                (program === "All programs" || person.programType === program) &&
                (fleet === "All fleets" || person.fleetCode === fleet)
            );
        });
    }, [fleet, people, program, query, status]);

    return (
        <div className="space-y-5">
            <section className="rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary md:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-primary">Population qualification matrix</h2>
                        <p className="mt-1 text-sm text-tertiary">
                            People × requirements. Select any cell to inspect its rule, due-date calculation, and source record.
                        </p>
                    </div>
                    <Button size="sm" color="secondary" iconLeading={Download01} onPress={() => onExport(filteredPeople)}>
                        Export matrix
                    </Button>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-[minmax(240px,1fr)_auto_auto_auto]">
                    <label className="relative block">
                        <span className="sr-only">Search people in qualification matrix</span>
                        <SearchLg aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-quaternary" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search name, employee number, fleet, seat, or base"
                            className="h-10 w-full rounded-lg bg-primary pr-3 pl-9 text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                        />
                    </label>
                    <select
                        aria-label="Matrix program"
                        value={program}
                        onChange={(event) => setProgram(event.target.value)}
                        className="h-10 rounded-lg bg-primary px-3 text-sm font-medium text-secondary shadow-xs ring-1 ring-primary outline-hidden focus:ring-2 focus:ring-brand"
                    >
                        <option>All programs</option>
                        {programOptions.map((option) => (
                            <option key={option}>{option}</option>
                        ))}
                    </select>
                    <select
                        aria-label="Matrix fleet"
                        value={fleet}
                        onChange={(event) => setFleet(event.target.value)}
                        className="h-10 rounded-lg bg-primary px-3 text-sm font-medium text-secondary shadow-xs ring-1 ring-primary outline-hidden focus:ring-2 focus:ring-brand"
                    >
                        <option>All fleets</option>
                        {fleetOptions.map((option) => (
                            <option key={option}>{option}</option>
                        ))}
                    </select>
                    <select
                        aria-label="Matrix qualification state"
                        value={status}
                        onChange={(event) => setStatus(event.target.value)}
                        className="h-10 rounded-lg bg-primary px-3 text-sm font-medium text-secondary shadow-xs ring-1 ring-primary outline-hidden focus:ring-2 focus:ring-brand"
                    >
                        <option>All states</option>
                        {(["current", "expiring", "in-progress", "expired", "suspended", "not-held"] as const).map((option) => (
                            <option key={option} value={option}>
                                {statusLabel(option)}
                            </option>
                        ))}
                    </select>
                </div>
            </section>

            <Panel
                title="Qualification coverage"
                description={`${filteredPeople.length} people · ${requirements.length} requirements · calculated Jul 30, 2026 at 09:42 ET`}
                action={
                    <div className="flex flex-wrap gap-2">
                        {(["current", "expiring", "expired", "not-held"] as const).map((item) => (
                            <StatusBadge key={item} tone={statusTone(item)}>
                                {statusLabel(item)}
                            </StatusBadge>
                        ))}
                    </div>
                }
                flush
            >
                {filteredPeople.length > 0 ? (
                    <div className="max-h-[620px] overflow-auto">
                        <table className="min-w-max border-separate border-spacing-0" aria-label="Population qualification matrix">
                            <thead>
                                <tr className="bg-secondary">
                                    <th
                                        scope="col"
                                        className="sticky top-0 left-0 z-30 min-w-64 border-r border-b border-secondary bg-secondary px-4 py-3 text-left text-xs font-semibold text-quaternary"
                                    >
                                        Person
                                    </th>
                                    {requirements.map((requirement) => (
                                        <th
                                            key={requirement.code}
                                            scope="col"
                                            title={requirement.title}
                                            className="sticky top-0 z-20 w-40 min-w-40 border-b border-secondary bg-secondary px-3 py-3 text-left"
                                        >
                                            <span className="block font-mono text-[11px] font-semibold text-brand-secondary">{requirement.code}</span>
                                            <span className="mt-0.5 line-clamp-2 block text-xs font-medium text-secondary">{requirement.title}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPeople.map((person) => (
                                    <tr key={person.id} className="[&:not(:last-child)>*]:border-b [&:not(:last-child)>*]:border-secondary">
                                        <th
                                            scope="row"
                                            className="sticky left-0 z-10 border-r border-secondary bg-primary px-4 py-3 text-left group-hover:bg-secondary"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => onOpenPerson(person.id)}
                                                className="text-left outline-focus-ring focus-visible:outline-2"
                                            >
                                                <span className="block text-sm font-semibold text-brand-secondary hover:underline">{person.displayName}</span>
                                                <span className="mt-0.5 block font-mono text-xs font-normal text-quaternary">
                                                    {person.employeeNumber} · {person.fleetCode}/{person.seatCode} · {person.baseCode}
                                                </span>
                                            </button>
                                        </th>
                                        {requirements.map((requirement) => {
                                            const qualification = person.qualifications.find((item) => item.requirementCode === requirement.code);
                                            return (
                                                <td key={requirement.code} className="px-3 py-2.5">
                                                    <button
                                                        type="button"
                                                        disabled={!qualification}
                                                        onClick={() => qualification && onOpenQualification(person.id, qualification.id)}
                                                        title={
                                                            qualification
                                                                ? `${requirement.title}: ${statusLabel(qualification.status)}`
                                                                : `${requirement.title}: Not held`
                                                        }
                                                        className={cx(
                                                            "flex min-h-14 w-full flex-col items-start justify-center rounded-lg px-2.5 py-2 text-left ring-1 outline-focus-ring ring-inset focus-visible:outline-2 disabled:cursor-default",
                                                            cellStyle(qualification?.status),
                                                            qualification && "hover:brightness-[0.98]",
                                                        )}
                                                    >
                                                        <span className="text-xs font-semibold">
                                                            {qualification ? statusLabel(qualification.status) : "Not held"}
                                                        </span>
                                                        <span className="mt-0.5 text-[11px] opacity-80">
                                                            {qualification?.nextDueDate ? `Due ${qualification.nextDueDate}` : "No due date"}
                                                        </span>
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 py-14 text-center">
                        <SearchLg aria-hidden="true" className="mx-auto size-8 text-fg-quaternary" />
                        <p className="mt-3 font-semibold text-primary">No people match this matrix view</p>
                        <p className="mt-1 text-sm text-tertiary">Change the search, program, fleet, or qualification-state filter.</p>
                    </div>
                )}
            </Panel>
        </div>
    );
}
