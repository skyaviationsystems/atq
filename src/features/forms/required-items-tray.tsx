"use client";

import { AlertCircle, Check, ChevronRight, List, Target04 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import type { RuntimeSection } from "./types";

export interface RequiredItem {
    id: string;
    sectionId: string;
    label: string;
    detail: string;
}

export interface SectionNavigatorProps {
    sections: RuntimeSection[];
    activeSectionId?: string;
    onSelectSection?: (sectionId: string) => void;
    orientation?: "vertical" | "horizontal";
    className?: string;
}

const statusLabel: Record<RuntimeSection["status"], string> = {
    complete: "Complete",
    "in-progress": "In progress",
    "not-started": "Not started",
    attention: "Needs attention",
};

export const SectionNavigator = ({ sections, activeSectionId, onSelectSection, orientation = "vertical", className }: SectionNavigatorProps) => {
    return (
        <nav aria-label="Form sections" className={className}>
            <ol className={cx(orientation === "horizontal" ? "flex min-w-max gap-2" : "space-y-1")}>
                {sections.map((section, index) => {
                    const isActive = section.id === activeSectionId;
                    const isComplete = section.status === "complete";

                    return (
                        <li key={section.id}>
                            <button
                                type="button"
                                onClick={() => onSelectSection?.(section.id)}
                                aria-current={isActive ? "step" : undefined}
                                className={cx(
                                    "group flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-utility-blue-500",
                                    orientation === "horizontal" && "min-w-44",
                                    isActive ? "bg-utility-blue-50 text-utility-blue-700" : "text-secondary hover:bg-primary_hover hover:text-primary",
                                )}
                            >
                                <span
                                    className={cx(
                                        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ring-inset",
                                        isComplete
                                            ? "bg-utility-green-50 text-utility-green-700 ring-utility-green-200"
                                            : isActive
                                              ? "bg-utility-blue-600 text-white ring-utility-blue-600"
                                              : section.status === "attention"
                                                ? "bg-utility-red-50 text-utility-red-700 ring-utility-red-200"
                                                : "bg-primary text-tertiary ring-secondary",
                                    )}
                                >
                                    {isComplete ? <Check aria-hidden="true" className="size-4" /> : index + 1}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold">{section.label}</span>
                                    <span className="block text-xs text-tertiary">
                                        {section.completedCount}/{section.requiredCount} · {statusLabel[section.status]}
                                    </span>
                                </span>
                                {orientation === "vertical" && (
                                    <ChevronRight
                                        aria-hidden="true"
                                        className={cx(
                                            "size-4 shrink-0 text-fg-quaternary transition group-hover:translate-x-0.5",
                                            isActive && "text-utility-blue-600",
                                        )}
                                    />
                                )}
                            </button>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export interface RequiredItemsTrayProps extends SectionNavigatorProps {
    missingItems: RequiredItem[];
}

export const RequiredItemsTray = ({ sections, activeSectionId, onSelectSection, missingItems, className }: RequiredItemsTrayProps) => {
    const totalRequired = sections.reduce((sum, section) => sum + section.requiredCount, 0);
    const totalCompleted = sections.reduce((sum, section) => sum + Math.min(section.completedCount, section.requiredCount), 0);
    const percentage = totalRequired === 0 ? 100 : Math.round((totalCompleted / totalRequired) * 100);

    return (
        <aside className={cx("rounded-xl border border-secondary bg-primary shadow-xs", className)} aria-label="Form completion">
            <div className="border-b border-secondary px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Target04 aria-hidden="true" className="size-5 text-utility-blue-600" />
                        <h2 className="text-sm font-semibold text-primary">Completion</h2>
                    </div>
                    <span className="text-sm font-semibold text-primary">{percentage}%</span>
                </div>
                <div
                    className="mt-3 h-2 overflow-hidden rounded-full bg-secondary"
                    role="progressbar"
                    aria-label="Required form items complete"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percentage}
                >
                    <div className="h-full rounded-full bg-utility-blue-600 transition-[width]" style={{ width: `${percentage}%` }} />
                </div>
                <p className="mt-2 text-xs text-tertiary">
                    {totalCompleted} of {totalRequired} required items complete
                </p>
            </div>

            <div className="border-b border-secondary px-2 py-3">
                <div className="mb-2 flex items-center gap-2 px-2">
                    <List aria-hidden="true" className="size-4 text-fg-quaternary" />
                    <p className="text-xs font-semibold tracking-wide text-tertiary uppercase">Sections</p>
                </div>
                <SectionNavigator sections={sections} activeSectionId={activeSectionId} onSelectSection={onSelectSection} />
            </div>

            <div className="px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold tracking-wide text-tertiary uppercase">Required next</p>
                    <span
                        className={cx(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            missingItems.length === 0 ? "bg-utility-green-50 text-utility-green-700" : "bg-utility-red-50 text-utility-red-700",
                        )}
                    >
                        {missingItems.length}
                    </span>
                </div>

                {missingItems.length === 0 ? (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-utility-green-50 px-3 py-3 text-sm text-utility-green-700">
                        <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        <span>All required items are complete.</span>
                    </div>
                ) : (
                    <ul className="mt-2 space-y-1">
                        {missingItems.slice(0, 4).map((item) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    onClick={() => onSelectSection?.(item.sectionId)}
                                    className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition outline-none hover:bg-utility-red-50 focus-visible:ring-2 focus-visible:ring-utility-blue-500"
                                >
                                    <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-utility-red-600" />
                                    <span>
                                        <span className="block text-xs font-semibold text-secondary">{item.label}</span>
                                        <span className="mt-0.5 block text-xs text-tertiary">{item.detail}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                        {missingItems.length > 4 && (
                            <li className="px-2 pt-1 text-xs font-medium text-tertiary">+{missingItems.length - 4} more required items</li>
                        )}
                    </ul>
                )}
            </div>
        </aside>
    );
};
