"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Check, CheckCircle, Clock, FileSearch02, FilterLines, RefreshCw01, SearchLg, ShieldTick, WifiOff, XCircle } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { NativeSelect } from "@/components/base/select/select-native";
import { TextArea } from "@/components/base/textarea/textarea";
import { cx } from "@/utils/cx";
import { syntheticQueueRecords } from "./synthetic-data";
import type { FormQueueRecord, FormQueueStatus } from "./types";

const statusMeta: Record<
    FormQueueStatus,
    {
        label: string;
        className: string;
        icon: typeof CheckCircle;
    }
> = {
    draft: {
        label: "Draft",
        className: "bg-secondary text-secondary ring-secondary",
        icon: Clock,
    },
    "awaiting-signature": {
        label: "Awaiting signature",
        className: "bg-utility-orange-50 text-utility-orange-700 ring-utility-orange-200",
        icon: Clock,
    },
    submitted: {
        label: "Ready for QC",
        className: "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200",
        icon: FileSearch02,
    },
    "qc-returned": {
        label: "Returned",
        className: "bg-utility-red-50 text-utility-red-700 ring-utility-red-200",
        icon: XCircle,
    },
    "qc-approved": {
        label: "QC approved",
        className: "bg-utility-green-50 text-utility-green-700 ring-utility-green-200",
        icon: CheckCircle,
    },
    "sync-conflict": {
        label: "Sync conflict",
        className: "bg-utility-purple-50 text-utility-purple-700 ring-utility-purple-200",
        icon: RefreshCw01,
    },
};

const filterOptions = [
    { label: "All states", value: "all" },
    { label: "Ready for QC", value: "submitted" },
    { label: "Returned", value: "qc-returned" },
    { label: "Approved", value: "qc-approved" },
    { label: "Awaiting signature", value: "awaiting-signature" },
    { label: "Sync conflict", value: "sync-conflict" },
];

const checklistItems = [
    { id: "identity", label: "Identity and event binding", detail: "Participant, instructor, event, program, and effective version agree." },
    { id: "completion", label: "Required assessment evidence", detail: "Ratings, comments, attempts, and overall outcome are complete." },
    { id: "attestation", label: "Attestations and timestamps", detail: "Required signatures are present and bound to this record version." },
] as const;

export interface FormQueueQCViewProps {
    initialRecords?: FormQueueRecord[];
    className?: string;
    onRecordChange?: (record: FormQueueRecord) => void;
}

export const FormQueueQCView = ({ initialRecords = syntheticQueueRecords, className, onRecordChange }: FormQueueQCViewProps) => {
    const [records, setRecords] = useState(initialRecords);
    const [selectedId, setSelectedId] = useState(initialRecords.find((record) => record.status === "submitted")?.id ?? initialRecords[0]?.id ?? "");
    const [statusFilter, setStatusFilter] = useState("all");
    const [query, setQuery] = useState("");
    const [qcChecks, setQcChecks] = useState<Record<string, boolean>>({});
    const [returnReason, setReturnReason] = useState("");
    const [actionMessage, setActionMessage] = useState("");

    const selectedRecord = records.find((record) => record.id === selectedId);
    const filteredRecords = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return records.filter((record) => {
            const matchesStatus = statusFilter === "all" || record.status === statusFilter;
            const matchesQuery =
                !normalizedQuery ||
                [record.id, record.eventCode, record.participant, record.instructor, record.program].some((value) =>
                    value.toLowerCase().includes(normalizedQuery),
                );
            return matchesStatus && matchesQuery;
        });
    }, [query, records, statusFilter]);

    const updateSelectedRecord = (update: Partial<FormQueueRecord>) => {
        if (!selectedRecord) return;
        const nextRecord = { ...selectedRecord, ...update };
        setRecords((current) => current.map((record) => (record.id === selectedRecord.id ? nextRecord : record)));
        onRecordChange?.(nextRecord);
    };

    const approveRecord = () => {
        if (!selectedRecord || !checklistItems.every((item) => qcChecks[item.id])) return;
        updateSelectedRecord({ status: "qc-approved" });
        setActionMessage("Record approved. The immutable QC decision was appended to the audit history.");
    };

    const returnRecord = () => {
        if (!selectedRecord || !returnReason.trim()) return;
        updateSelectedRecord({ status: "qc-returned", flags: [...selectedRecord.flags, "QC correction requested"] });
        setActionMessage("Record returned to the instructor with a correction request. The submitted version remains preserved.");
    };

    const resetReviewState = (recordId: string) => {
        setSelectedId(recordId);
        setQcChecks({});
        setReturnReason("");
        setActionMessage("");
    };

    const counts = {
        ready: records.filter((record) => record.status === "submitted").length,
        returned: records.filter((record) => record.status === "qc-returned").length,
        approved: records.filter((record) => record.status === "qc-approved").length,
        exception: records.filter((record) => record.status === "sync-conflict").length,
    };

    return (
        <section className={cx("min-h-[760px] overflow-hidden rounded-xl border border-secondary bg-primary shadow-xs", className)}>
            <header className="border-b border-secondary px-4 py-5 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="text-xs font-semibold tracking-wide text-utility-blue-700 uppercase">Records quality control</p>
                        <h1 className="mt-1 text-xl font-semibold text-primary">Form queue</h1>
                        <p className="mt-1 text-sm text-tertiary">Review submitted evidence, return corrections, and preserve every decision.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                            ["Ready", counts.ready, "text-utility-blue-700"],
                            ["Returned", counts.returned, "text-utility-red-700"],
                            ["Approved", counts.approved, "text-utility-green-700"],
                            ["Exceptions", counts.exception, "text-utility-purple-700"],
                        ].map(([label, value, tone]) => (
                            <div key={label} className="min-w-24 rounded-lg border border-secondary bg-secondary/35 px-3 py-2">
                                <p className={cx("text-lg font-semibold", tone as string)}>{value}</p>
                                <p className="text-xs text-tertiary">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <div className="grid xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
                <div className="min-w-0 border-b border-secondary xl:border-r xl:border-b-0">
                    <div className="grid gap-3 border-b border-secondary bg-secondary/25 p-4 sm:grid-cols-[minmax(0,1fr)_210px]">
                        <Input
                            aria-label="Search form queue"
                            placeholder="Search record, event, or participant"
                            icon={SearchLg}
                            value={query}
                            onChange={setQuery}
                        />
                        <NativeSelect
                            aria-label="Filter by form state"
                            options={filterOptions}
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[820px] border-collapse text-left">
                            <thead className="border-b border-secondary bg-secondary/20">
                                <tr className="text-xs font-semibold tracking-wide text-tertiary uppercase">
                                    <th scope="col" className="px-4 py-3">
                                        Record
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        Participant
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        State
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        Completion
                                    </th>
                                    <th scope="col" className="px-4 py-3">
                                        Sync
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-secondary">
                                {filteredRecords.map((record) => {
                                    const meta = statusMeta[record.status];
                                    const StatusIcon = meta.icon;
                                    const selected = selectedId === record.id;

                                    return (
                                        <tr
                                            key={record.id}
                                            className={cx("cursor-pointer transition", selected ? "bg-utility-blue-50/70" : "hover:bg-primary_hover")}
                                            onClick={() => resetReviewState(record.id)}
                                        >
                                            <td className="px-4 py-4">
                                                <button
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        resetReviewState(record.id);
                                                    }}
                                                    className="text-left outline-none focus-visible:ring-2 focus-visible:ring-utility-blue-500"
                                                >
                                                    <span className="block font-mono text-xs font-semibold text-utility-blue-700">{record.id}</span>
                                                    <span className="mt-1 block text-xs text-tertiary">
                                                        {record.eventCode} · {record.sessionDate}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className="block text-sm font-semibold text-primary">{record.participant}</span>
                                                <span className="mt-1 block text-xs text-tertiary">{record.instructor}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span
                                                    className={cx(
                                                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                                                        meta.className,
                                                    )}
                                                >
                                                    <StatusIcon aria-hidden="true" className="size-3.5" />
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                                                        <div
                                                            className={cx(
                                                                "h-full rounded-full",
                                                                record.completeness === 100 ? "bg-utility-green-600" : "bg-utility-orange-500",
                                                            )}
                                                            style={{ width: `${record.completeness}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs font-semibold text-secondary">{record.completeness}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                {record.syncState === "synced" ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-utility-green-700">
                                                        <Check aria-hidden="true" className="size-3.5" />
                                                        Synced
                                                    </span>
                                                ) : record.syncState === "pending" ? (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-utility-orange-700">
                                                        <Clock aria-hidden="true" className="size-3.5" />
                                                        Pending
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-utility-purple-700">
                                                        <WifiOff aria-hidden="true" className="size-3.5" />
                                                        Conflict
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredRecords.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <FilterLines aria-hidden="true" className="mx-auto size-6 text-fg-quaternary" />
                                            <p className="mt-3 text-sm font-semibold text-primary">No matching records</p>
                                            <p className="mt-1 text-sm text-tertiary">Adjust the search or state filter.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <aside className="min-w-0 bg-secondary/15" aria-label="Selected record quality-control review">
                    {selectedRecord ? (
                        <>
                            <div className="border-b border-secondary bg-primary px-4 py-4 sm:px-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-mono text-xs font-semibold text-utility-blue-700">{selectedRecord.id}</p>
                                        <h2 className="mt-1 text-lg font-semibold text-primary">{selectedRecord.participant}</h2>
                                        <p className="mt-1 text-xs text-tertiary">
                                            {selectedRecord.eventCode} · {selectedRecord.program}
                                        </p>
                                    </div>
                                    <span
                                        className={cx(
                                            "rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                                            statusMeta[selectedRecord.status].className,
                                        )}
                                    >
                                        {statusMeta[selectedRecord.status].label}
                                    </span>
                                </div>

                                <dl className="mt-4 grid grid-cols-2 gap-3 rounded-lg bg-secondary/40 p-3">
                                    <div>
                                        <dt className="text-xs text-tertiary">Instructor</dt>
                                        <dd className="mt-0.5 text-sm font-semibold text-primary">{selectedRecord.instructor}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-tertiary">Submitted</dt>
                                        <dd className="mt-0.5 text-sm font-semibold text-primary">{selectedRecord.submittedAt ?? "Not submitted"}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div className="space-y-5 p-4 sm:p-5">
                                {selectedRecord.status === "sync-conflict" && (
                                    <div className="flex items-start gap-3 rounded-xl border border-utility-purple-200 bg-utility-purple-50 p-3 text-utility-purple-700">
                                        <RefreshCw01 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                                        <div>
                                            <p className="text-sm font-semibold">Reconciliation hold</p>
                                            <p className="mt-1 text-xs">
                                                Two device versions are preserved. Resolve the conflict before quality-control review.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-2">
                                        <ShieldTick aria-hidden="true" className="size-4 text-utility-blue-600" />
                                        <h3 className="text-sm font-semibold text-primary">QC checklist</h3>
                                    </div>
                                    <div className="mt-3 space-y-2">
                                        {checklistItems.map((item) => (
                                            <label
                                                key={item.id}
                                                className={cx(
                                                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition",
                                                    qcChecks[item.id]
                                                        ? "border-utility-green-300 bg-utility-green-50"
                                                        : "border-secondary bg-primary hover:bg-primary_hover",
                                                )}
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="mt-0.5 size-4 accent-utility-blue-600"
                                                    checked={qcChecks[item.id] ?? false}
                                                    onChange={(event) => setQcChecks((current) => ({ ...current, [item.id]: event.target.checked }))}
                                                    disabled={selectedRecord.status === "sync-conflict"}
                                                />
                                                <span>
                                                    <span className="block text-sm font-semibold text-primary">{item.label}</span>
                                                    <span className="mt-0.5 block text-xs text-tertiary">{item.detail}</span>
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {selectedRecord.flags.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-semibold text-primary">Record flags</h3>
                                        <ul className="mt-2 space-y-2">
                                            {selectedRecord.flags.map((flag) => (
                                                <li
                                                    key={flag}
                                                    className="flex items-center gap-2 rounded-lg bg-utility-orange-50 px-3 py-2 text-xs font-medium text-utility-orange-700"
                                                >
                                                    <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
                                                    {flag}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <TextArea
                                    label="Correction request"
                                    value={returnReason}
                                    onChange={setReturnReason}
                                    rows={3}
                                    placeholder="Identify the exact field or evidence that needs correction…"
                                    hint="The submitted version remains preserved when a correction is requested."
                                />

                                {actionMessage && (
                                    <div
                                        className="flex items-start gap-2 rounded-lg bg-utility-green-50 p-3 text-xs font-medium text-utility-green-700"
                                        role="status"
                                    >
                                        <CheckCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                                        {actionMessage}
                                    </div>
                                )}

                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                                    <Button
                                        color="secondary-destructive"
                                        size="sm"
                                        iconLeading={XCircle}
                                        isDisabled={!returnReason.trim() || selectedRecord.status === "sync-conflict"}
                                        onClick={returnRecord}
                                    >
                                        Return correction
                                    </Button>
                                    <Button
                                        color="primary"
                                        size="sm"
                                        iconLeading={CheckCircle}
                                        isDisabled={!checklistItems.every((item) => qcChecks[item.id]) || selectedRecord.status === "sync-conflict"}
                                        onClick={approveRecord}
                                    >
                                        Approve record
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex min-h-96 flex-col items-center justify-center px-6 text-center">
                            <FileSearch02 aria-hidden="true" className="size-7 text-fg-quaternary" />
                            <p className="mt-3 text-sm font-semibold text-primary">Select a record</p>
                            <p className="mt-1 text-sm text-tertiary">Choose a queue item to begin review.</p>
                        </div>
                    )}
                </aside>
            </div>
        </section>
    );
};
