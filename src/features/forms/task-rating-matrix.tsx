"use client";

import { Check, MessageTextCircle02 } from "@untitledui/icons";
import { TextArea } from "@/components/base/textarea/textarea";
import { cx } from "@/utils/cx";
import type { RatingDimension, RatingValue, TaskRatingValue } from "./types";

const dimensions: Array<{
    id: RatingDimension;
    label: string;
    shortLabel: string;
    description: string;
}> = [
    {
        id: "safety",
        label: "Safety margin",
        shortLabel: "Safety",
        description: "Recognizes risk and protects safe operating margins.",
    },
    {
        id: "technical",
        label: "Technical execution",
        shortLabel: "Technical",
        description: "Applies systems knowledge and aircraft handling accurately.",
    },
    {
        id: "procedures",
        label: "Procedural discipline",
        shortLabel: "Procedures",
        description: "Uses approved procedures in the correct sequence and context.",
    },
    {
        id: "crew",
        label: "Crew effectiveness",
        shortLabel: "Crew",
        description: "Communicates, coordinates, and manages workload effectively.",
    },
];

const ratingOptions: Array<{
    value: Exclude<RatingValue, null>;
    label: string;
    compactLabel: string;
    anchor: string;
}> = [
    { value: 1, label: "1 · Critical", compactLabel: "1", anchor: "Unsafe or ineffective; instructor intervention required." },
    { value: 2, label: "2 · Below standard", compactLabel: "2", anchor: "Material deviation that was not corrected in time." },
    { value: 3, label: "3 · Standard", compactLabel: "3", anchor: "Meets the approved performance standard." },
    { value: 4, label: "4 · Strong", compactLabel: "4", anchor: "Consistently effective with positive margin." },
    { value: 5, label: "5 · Exemplary", compactLabel: "5", anchor: "Highly effective and anticipatory throughout." },
    { value: "na", label: "Not observed", compactLabel: "N/A", anchor: "Dimension was not observable in this task." },
];

const selectedStyles: Record<Exclude<RatingValue, null>, string> = {
    1: "border-utility-red-600 bg-utility-red-600 text-white shadow-sm",
    2: "border-utility-orange-600 bg-utility-orange-600 text-white shadow-sm",
    3: "border-utility-yellow-500 bg-utility-yellow-500 text-gray-950 shadow-sm",
    4: "border-utility-blue-600 bg-utility-blue-600 text-white shadow-sm",
    5: "border-utility-green-600 bg-utility-green-600 text-white shadow-sm",
    na: "border-utility-neutral-600 bg-utility-neutral-600 text-white shadow-sm",
};

const emptyRating: Record<RatingDimension, RatingValue> = {
    safety: null,
    technical: null,
    procedures: null,
    crew: null,
};

export interface TaskRatingMatrixProps {
    value?: TaskRatingValue;
    onChange?: (value: TaskRatingValue) => void;
    title?: string;
    description?: string;
    commentLabel?: string;
    isReadOnly?: boolean;
    className?: string;
}

export const TaskRatingMatrix = ({
    value = { ratings: emptyRating, comments: "" },
    onChange,
    title = "Task rating matrix",
    description = "Rate each dimension independently. Select an anchor label below the scale for its full definition.",
    commentLabel = "Assessment comments",
    isReadOnly = false,
    className,
}: TaskRatingMatrixProps) => {
    const updateRating = (dimension: RatingDimension, rating: Exclude<RatingValue, null>) => {
        if (isReadOnly) return;
        onChange?.({
            ...value,
            ratings: {
                ...value.ratings,
                [dimension]: rating,
            },
        });
    };

    const hasLowRating = Object.values(value.ratings).some((rating) => rating === 1 || rating === 2);
    const completedDimensions = Object.values(value.ratings).filter((rating) => rating !== null).length;

    return (
        <section className={cx("overflow-hidden rounded-xl border border-secondary bg-primary shadow-xs", className)} aria-labelledby="task-rating-title">
            <div className="flex flex-col gap-3 border-b border-secondary px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
                <div>
                    <h3 id="task-rating-title" className="text-md font-semibold text-primary">
                        {title}
                    </h3>
                    <p className="mt-1 max-w-3xl text-sm text-tertiary">{description}</p>
                </div>
                <span
                    className={cx(
                        "w-max rounded-full px-2.5 py-1 text-xs font-semibold",
                        completedDimensions === dimensions.length
                            ? "bg-utility-green-50 text-utility-green-700 ring-1 ring-utility-green-200 ring-inset"
                            : "bg-secondary text-secondary ring-1 ring-secondary ring-inset",
                    )}
                >
                    {completedDimensions}/{dimensions.length} rated
                </span>
            </div>

            <div className="divide-y divide-secondary">
                {dimensions.map((dimension) => (
                    <fieldset
                        key={dimension.id}
                        className="grid gap-4 px-4 py-4 lg:grid-cols-[minmax(190px,0.8fr)_minmax(500px,1.6fr)] lg:items-center lg:px-5"
                    >
                        <legend className="sr-only">{dimension.label}</legend>
                        <div>
                            <p className="text-sm font-semibold text-primary">{dimension.label}</p>
                            <p className="mt-1 text-xs text-tertiary">{dimension.description}</p>
                        </div>

                        <div className="grid grid-cols-6 gap-1.5 sm:gap-2" role="group" aria-label={`${dimension.label} rating`}>
                            {ratingOptions.map((option) => {
                                const selected = value.ratings[dimension.id] === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        aria-label={`${dimension.label}: ${option.label}. ${option.anchor}`}
                                        aria-pressed={selected}
                                        disabled={isReadOnly}
                                        title={`${option.label}: ${option.anchor}`}
                                        onClick={() => updateRating(dimension.id, option.value)}
                                        className={cx(
                                            "relative flex min-h-11 min-w-0 items-center justify-center rounded-lg border px-1 text-sm font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-utility-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed",
                                            selected
                                                ? selectedStyles[option.value]
                                                : "border-secondary bg-primary text-secondary shadow-xs hover:border-utility-blue-300 hover:bg-utility-blue-50 hover:text-utility-blue-700",
                                        )}
                                    >
                                        {selected && <Check aria-hidden="true" className="absolute top-1 right-1 size-3" />}
                                        <span>{option.compactLabel}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </fieldset>
                ))}
            </div>

            <details className="border-t border-secondary bg-secondary/40 px-4 py-3 sm:px-5">
                <summary className="cursor-pointer text-sm font-semibold text-secondary outline-none focus-visible:ring-2 focus-visible:ring-utility-blue-500">
                    Rating anchors and definitions
                </summary>
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {ratingOptions.map((option) => (
                        <div key={option.value} className="rounded-lg border border-secondary bg-primary px-3 py-2">
                            <p className="text-xs font-semibold text-primary">{option.label}</p>
                            <p className="mt-0.5 text-xs text-tertiary">{option.anchor}</p>
                        </div>
                    ))}
                </div>
            </details>

            <div className="border-t border-secondary px-4 py-4 sm:px-5">
                <TextArea
                    label={commentLabel}
                    value={value.comments}
                    onChange={(comments) => onChange?.({ ...value, comments })}
                    isDisabled={isReadOnly}
                    isRequired={hasLowRating}
                    rows={3}
                    placeholder="Record concise, observable evidence for the ratings…"
                    hint={hasLowRating ? "A comment is required for ratings 1 or 2." : "Use observable behaviors; avoid unsupported conclusions."}
                />
                {hasLowRating && !value.comments.trim() && (
                    <div className="mt-2 flex items-center gap-2 text-xs font-medium text-utility-red-700" role="alert">
                        <MessageTextCircle02 aria-hidden="true" className="size-4 shrink-0" />
                        Add evidence before this assessment can be completed.
                    </div>
                )}
            </div>
        </section>
    );
};
