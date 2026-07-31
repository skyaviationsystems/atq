"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Download01, SearchLg, Users01, XClose } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { DataTable, Panel, StatusBadge, type StatusTone } from "@/features/modules/module-ui";
import type { TrainingPerson } from "./types";

export interface PeopleDirectoryProps {
    people: readonly TrainingPerson[];
    onOpenPerson: (person: TrainingPerson) => void;
    onExport?: (people: readonly TrainingPerson[]) => void;
}

interface DirectoryFilters {
    fleet: string;
    seat: string;
    base: string;
    program: string;
    status: string;
}

const allFilters: DirectoryFilters = {
    fleet: "all",
    seat: "all",
    base: "all",
    program: "all",
    status: "all",
};

const qualificationTone = (status: string): StatusTone => {
    const normalized = status.toLowerCase();

    if (normalized.includes("current") || normalized.includes("qualified")) return "green";
    if (normalized.includes("risk") || normalized.includes("grace") || normalized.includes("due")) return "amber";
    if (normalized.includes("restrict") || normalized.includes("expire") || normalized.includes("not held")) return "red";
    return "gray";
};

const programTone = (program: string): StatusTone => {
    const normalized = program.toLowerCase();
    if (normalized.includes("aqp")) return "blue";
    if (normalized.includes("n&o") || normalized.includes("traditional")) return "purple";
    return "gray";
};

const uniqueValues = (values: readonly string[]) =>
    [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));

const sentenceCase = (value: string) =>
    value
        .split("-")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");

const formatDate = (value?: string) => {
    if (!value) return undefined;
    const date = new Date(value.length === 10 ? `${value}T12:00:00` : value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short", year: "numeric" }).format(date);
};

const FilterSelect = ({ label, value, values, onChange }: { label: string; value: string; values: readonly string[]; onChange: (value: string) => void }) => (
    <label className="space-y-1.5">
        <span className="block text-xs font-semibold text-secondary">{label}</span>
        <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-10 w-full rounded-lg bg-primary px-3 text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden focus:ring-2 focus:ring-brand"
        >
            <option value="all">All {label.toLowerCase()}</option>
            {values.map((item) => (
                <option key={item} value={item}>
                    {item}
                </option>
            ))}
        </select>
    </label>
);

export const PeopleDirectory = ({ people, onOpenPerson, onExport }: PeopleDirectoryProps) => {
    const [query, setQuery] = useState("");
    const [filters, setFilters] = useState<DirectoryFilters>(allFilters);

    const options = useMemo(
        () => ({
            fleets: uniqueValues(people.map((person) => person.fleetCode)),
            seats: uniqueValues(people.map((person) => person.seatCode)),
            bases: uniqueValues(people.map((person) => person.baseCode)),
            programs: uniqueValues(people.map((person) => person.programType)),
            statuses: uniqueValues(people.map((person) => person.qualificationState)),
        }),
        [people],
    );

    const filteredPeople = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();

        return people
            .filter((person) => {
                const matchesQuery =
                    !normalizedQuery ||
                    person.displayName.toLowerCase().includes(normalizedQuery) ||
                    person.employeeNumber.toLowerCase().includes(normalizedQuery);
                const matchesFleet = filters.fleet === "all" || person.fleetCode === filters.fleet;
                const matchesSeat = filters.seat === "all" || person.seatCode === filters.seat;
                const matchesBase = filters.base === "all" || person.baseCode === filters.base;
                const matchesProgram = filters.program === "all" || person.programType === filters.program;
                const matchesStatus = filters.status === "all" || person.qualificationState === filters.status;

                return matchesQuery && matchesFleet && matchesSeat && matchesBase && matchesProgram && matchesStatus;
            })
            .sort((left, right) => left.displayName.localeCompare(right.displayName));
    }, [filters, people, query]);

    const hasActiveFilters = query.trim().length > 0 || Object.values(filters).some((value) => value !== "all");
    const clearFilters = () => {
        setQuery("");
        setFilters(allFilters);
    };
    const setFilter = (filter: keyof DirectoryFilters, value: string) => setFilters((current) => ({ ...current, [filter]: value }));

    return (
        <div className="space-y-5">
            <Panel title="Find a person" description="Search by name or employee number, then narrow the training population.">
                <div className="space-y-4">
                    <label className="relative block">
                        <span className="sr-only">Search by name or employee number</span>
                        <SearchLg aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-fg-quaternary" />
                        <input
                            type="search"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search a name or employee number"
                            className="h-11 w-full rounded-lg bg-primary py-2 pr-10 pl-10 text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden placeholder:text-placeholder focus:ring-2 focus:ring-brand"
                        />
                        {query && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                onClick={() => setQuery("")}
                                className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-fg-quaternary outline-focus-ring hover:bg-secondary hover:text-fg-tertiary focus-visible:outline-2"
                            >
                                <XClose aria-hidden="true" className="size-4" />
                            </button>
                        )}
                    </label>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        <FilterSelect label="Fleet" value={filters.fleet} values={options.fleets} onChange={(value) => setFilter("fleet", value)} />
                        <FilterSelect label="Seat" value={filters.seat} values={options.seats} onChange={(value) => setFilter("seat", value)} />
                        <FilterSelect label="Base" value={filters.base} values={options.bases} onChange={(value) => setFilter("base", value)} />
                        <FilterSelect label="Program" value={filters.program} values={options.programs} onChange={(value) => setFilter("program", value)} />
                        <FilterSelect label="Status" value={filters.status} values={options.statuses} onChange={(value) => setFilter("status", value)} />
                    </div>
                </div>
            </Panel>

            <Panel
                title="Training population"
                description={`${filteredPeople.length.toLocaleString()} ${filteredPeople.length === 1 ? "person" : "people"} shown`}
                action={
                    <div className="flex items-center gap-2">
                        {hasActiveFilters && (
                            <Button color="tertiary" size="sm" iconLeading={XClose} onClick={clearFilters}>
                                Clear
                            </Button>
                        )}
                        {onExport && (
                            <Button
                                color="secondary"
                                size="sm"
                                iconLeading={Download01}
                                isDisabled={filteredPeople.length === 0}
                                onClick={() => onExport(filteredPeople)}
                            >
                                Export results
                            </Button>
                        )}
                    </div>
                }
                flush
            >
                {filteredPeople.length > 0 ? (
                    <DataTable
                        label="Filtered training population"
                        rows={filteredPeople}
                        onRowClick={onOpenPerson}
                        columns={[
                            {
                                id: "person",
                                label: "Person",
                                render: (person) => (
                                    <div>
                                        <p className="font-semibold text-primary">{person.displayName}</p>
                                        <p className="mt-0.5 text-xs text-quaternary">
                                            <span className="font-mono">Employee {person.employeeNumber}</span> · {sentenceCase(person.employmentStatus)}
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                id: "position",
                                label: "Position",
                                render: (person) => (
                                    <div>
                                        <p className="font-medium text-secondary">
                                            {person.fleetCode} · {person.seatCode}
                                        </p>
                                        <p className="mt-0.5 text-xs text-quaternary">
                                            {person.roleTitle} · {person.baseCode}
                                        </p>
                                    </div>
                                ),
                            },
                            {
                                id: "program",
                                label: "Program",
                                render: (person) => (
                                    <div className="flex flex-wrap gap-1.5">
                                        <StatusBadge tone={programTone(person.programType)}>
                                            {person.programType === "NO" ? "N&O" : person.programType}
                                        </StatusBadge>
                                    </div>
                                ),
                            },
                            {
                                id: "qualification",
                                label: "Qualification",
                                render: (person) => (
                                    <StatusBadge tone={qualificationTone(person.qualificationState)}>{sentenceCase(person.qualificationState)}</StatusBadge>
                                ),
                            },
                            {
                                id: "nextDue",
                                label: "Next due",
                                render: (person) => formatDate(person.nextDueDate) || <span className="text-quaternary">Not scheduled</span>,
                            },
                            {
                                id: "completeness",
                                label: "Jacket",
                                render: (person) => (
                                    <span
                                        className={
                                            person.recordCompleteness < 100 ? "font-semibold text-warning-primary" : "font-semibold text-success-primary"
                                        }
                                    >
                                        {person.recordCompleteness}%
                                    </span>
                                ),
                            },
                            {
                                id: "open",
                                label: "",
                                className: "w-12 text-right",
                                render: () => <ChevronRight aria-hidden="true" className="ml-auto size-5 text-fg-quaternary" />,
                            },
                        ]}
                    />
                ) : (
                    <div className="flex flex-col items-center px-5 py-12 text-center">
                        <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-fg-quaternary">
                            <Users01 aria-hidden="true" className="size-6" />
                        </span>
                        <h3 className="mt-4 text-sm font-semibold text-primary">No people match these filters</h3>
                        <p className="mt-1 max-w-md text-sm text-tertiary">Try another name or employee number, or clear one of the filters.</p>
                        <Button className="mt-4" color="secondary" size="sm" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    </div>
                )}
            </Panel>
        </div>
    );
};
