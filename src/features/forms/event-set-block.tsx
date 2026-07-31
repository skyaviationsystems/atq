"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Clock, Plus, RefreshCw01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";
import { emptyAssessment } from "./synthetic-data";
import { TaskRatingMatrix } from "./task-rating-matrix";
import type { EventAttempt, EventSetDefinition } from "./types";

const outcomeStyles: Record<EventAttempt["outcome"], string> = {
    "in-progress": "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200",
    satisfactory: "bg-utility-green-50 text-utility-green-700 ring-utility-green-200",
    "repeat-required": "bg-utility-orange-50 text-utility-orange-700 ring-utility-orange-200",
};

const outcomeLabels: Record<EventAttempt["outcome"], string> = {
    "in-progress": "In progress",
    satisfactory: "Satisfactory",
    "repeat-required": "Repeat required",
};

export interface EventSetBlockProps {
    definition: EventSetDefinition;
    attempts: EventAttempt[];
    onAttemptsChange: (attempts: EventAttempt[]) => void;
    defaultExpanded?: boolean;
    className?: string;
}

export const EventSetBlock = ({ definition, attempts, onAttemptsChange, defaultExpanded = false, className }: EventSetBlockProps) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [selectedAttemptId, setSelectedAttemptId] = useState(attempts.at(-1)?.id ?? "");
    const repeatsUsed = Math.max(0, attempts.length - 1);
    const repeatLimitReached = repeatsUsed >= definition.repeatCap;
    const selectedAttempt = useMemo(() => attempts.find((attempt) => attempt.id === selectedAttemptId) ?? attempts.at(-1), [attempts, selectedAttemptId]);
    const isComplete = attempts.length > 0 && attempts.at(-1)?.outcome === "satisfactory";

    const addRepeat = () => {
        if (repeatLimitReached) return;
        const id = `attempt-${definition.id}-${Date.now()}`;
        const nextAttempt: EventAttempt = {
            id,
            number: attempts.length + 1,
            startedAt: "Just now",
            outcome: "in-progress",
            assessment: emptyAssessment(),
        };
        onAttemptsChange([...attempts, nextAttempt]);
        setSelectedAttemptId(id);
        setIsExpanded(true);
    };

    const updateAttempt = (nextAttempt: EventAttempt) => {
        onAttemptsChange(attempts.map((attempt) => (attempt.id === nextAttempt.id ? nextAttempt : attempt)));
    };

    return (
        <article className={cx("overflow-hidden rounded-xl border border-secondary bg-primary shadow-xs", className)}>
            <div className="flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-utility-blue-700">{definition.code}</span>
                        <span className="text-quaternary">·</span>
                        <span className="text-xs font-medium text-tertiary">{definition.phase}</span>
                        {definition.required && (
                            <span className="rounded-full bg-utility-red-50 px-2 py-0.5 text-xs font-medium text-utility-red-700 ring-1 ring-utility-red-200 ring-inset">
                                Required
                            </span>
                        )}
                    </div>
                    <h3 className="mt-1 text-md font-semibold text-primary">{definition.title}</h3>
                    <p className="mt-1 max-w-3xl text-sm text-tertiary">{definition.objective}</p>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <span
                        className={cx(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                            isComplete ? outcomeStyles.satisfactory : outcomeStyles["in-progress"],
                        )}
                    >
                        {isComplete ? <CheckCircle aria-hidden="true" className="size-3.5" /> : <Clock aria-hidden="true" className="size-3.5" />}
                        {isComplete ? "Complete" : "Assessment open"}
                    </span>
                    <Button color="secondary" size="sm" onClick={() => setIsExpanded((expanded) => !expanded)} aria-expanded={isExpanded}>
                        {isExpanded ? "Collapse" : "Open assessment"}
                    </Button>
                </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-secondary bg-secondary/30 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-2" aria-label="Assessment attempts">
                    {attempts.length === 0 && <span className="text-sm text-tertiary">No attempt recorded</span>}
                    {attempts.map((attempt) => (
                        <button
                            key={attempt.id}
                            type="button"
                            onClick={() => {
                                setSelectedAttemptId(attempt.id);
                                setIsExpanded(true);
                            }}
                            className={cx(
                                "inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold ring-1 transition outline-none ring-inset focus-visible:ring-2 focus-visible:ring-utility-blue-500",
                                selectedAttempt?.id === attempt.id
                                    ? "bg-utility-blue-600 text-white ring-utility-blue-600"
                                    : "bg-primary text-secondary ring-secondary hover:bg-primary_hover",
                            )}
                            aria-pressed={selectedAttempt?.id === attempt.id}
                        >
                            Attempt {attempt.number}
                            <span
                                className={cx(
                                    "size-2 rounded-full",
                                    attempt.outcome === "satisfactory"
                                        ? "bg-utility-green-400"
                                        : attempt.outcome === "repeat-required"
                                          ? "bg-utility-orange-400"
                                          : "bg-utility-blue-300",
                                )}
                            />
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-tertiary">
                        Repeats {repeatsUsed}/{definition.repeatCap}
                    </span>
                    <Button
                        color="secondary"
                        size="sm"
                        iconLeading={attempts.length === 0 ? Plus : RefreshCw01}
                        onClick={addRepeat}
                        isDisabled={repeatLimitReached}
                    >
                        {attempts.length === 0 ? "Start attempt" : "Add repeat"}
                    </Button>
                </div>
            </div>

            {repeatLimitReached && !isComplete && (
                <div
                    className="flex items-start gap-2 border-t border-utility-orange-200 bg-utility-orange-50 px-4 py-3 text-sm text-utility-orange-700 sm:px-5"
                    role="alert"
                >
                    <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                    <span>The approved repeat cap has been reached. A coordinator decision is required before another attempt.</span>
                </div>
            )}

            {isExpanded && selectedAttempt && (
                <div className="border-t border-secondary p-3 sm:p-5">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-primary">Attempt {selectedAttempt.number}</p>
                            <p className="text-xs text-tertiary">Started {selectedAttempt.startedAt}. Previous attempts remain part of the record.</p>
                        </div>
                        <div className="flex flex-wrap gap-2" role="group" aria-label={`Attempt ${selectedAttempt.number} outcome`}>
                            {(["in-progress", "repeat-required", "satisfactory"] as const).map((outcome) => (
                                <button
                                    key={outcome}
                                    type="button"
                                    aria-pressed={selectedAttempt.outcome === outcome}
                                    onClick={() =>
                                        updateAttempt({
                                            ...selectedAttempt,
                                            outcome,
                                            completedAt: outcome === "in-progress" ? undefined : "Just now",
                                        })
                                    }
                                    className={cx(
                                        "min-h-9 rounded-lg px-3 py-1.5 text-xs font-semibold ring-1 transition outline-none ring-inset focus-visible:ring-2 focus-visible:ring-utility-blue-500",
                                        selectedAttempt.outcome === outcome
                                            ? outcomeStyles[outcome]
                                            : "bg-primary text-secondary ring-secondary hover:bg-primary_hover",
                                    )}
                                >
                                    {outcomeLabels[outcome]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <TaskRatingMatrix
                        title={`Attempt ${selectedAttempt.number} · performance dimensions`}
                        value={selectedAttempt.assessment}
                        onChange={(assessment) => updateAttempt({ ...selectedAttempt, assessment })}
                    />
                </div>
            )}
        </article>
    );
};
