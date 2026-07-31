"use client";

import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, FilterLines, SearchLg, TrendUp01 } from "@untitledui/icons";
import type { IconComponentType } from "@/components/base/badges/badge-types";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

export type StatusTone = "gray" | "blue" | "green" | "amber" | "red" | "purple";

const toneStyles: Record<StatusTone, { badge: string; dot: string; icon: string; soft: string }> = {
    gray: {
        badge: "bg-secondary text-secondary ring-secondary",
        dot: "bg-fg-quaternary",
        icon: "bg-secondary text-fg-secondary ring-secondary",
        soft: "bg-secondary",
    },
    blue: {
        badge: "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200",
        dot: "bg-utility-blue-500",
        icon: "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200",
        soft: "bg-utility-blue-50",
    },
    green: {
        badge: "bg-utility-green-50 text-utility-green-700 ring-utility-green-200",
        dot: "bg-utility-green-500",
        icon: "bg-utility-green-50 text-utility-green-700 ring-utility-green-200",
        soft: "bg-utility-green-50",
    },
    amber: {
        badge: "bg-utility-yellow-50 text-utility-yellow-700 ring-utility-yellow-200",
        dot: "bg-utility-yellow-500",
        icon: "bg-utility-yellow-50 text-utility-yellow-700 ring-utility-yellow-200",
        soft: "bg-utility-yellow-50",
    },
    red: {
        badge: "bg-utility-red-50 text-utility-red-700 ring-utility-red-200",
        dot: "bg-utility-red-500",
        icon: "bg-utility-red-50 text-utility-red-700 ring-utility-red-200",
        soft: "bg-utility-red-50",
    },
    purple: {
        badge: "bg-utility-purple-50 text-utility-purple-700 ring-utility-purple-200",
        dot: "bg-utility-purple-500",
        icon: "bg-utility-purple-50 text-utility-purple-700 ring-utility-purple-200",
        soft: "bg-utility-purple-50",
    },
};

export const StatusBadge = ({ children, tone = "gray", withDot = true }: { children: ReactNode; tone?: StatusTone; withDot?: boolean }) => (
    <span className={cx("inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", toneStyles[tone].badge)}>
        {withDot && <span aria-hidden="true" className={cx("size-1.5 rounded-full", toneStyles[tone].dot)} />}
        {children}
    </span>
);

export const WorkspaceHeader = ({
    eyebrow,
    title,
    description,
    status,
    actions,
}: {
    eyebrow: string;
    title: string;
    description: string;
    status?: ReactNode;
    actions?: ReactNode;
}) => (
    <header className="flex flex-col gap-5 border-b border-secondary bg-primary px-4 py-5 md:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tracking-[0.12em] text-brand-secondary uppercase">{eyebrow}</span>
                {status}
            </div>
            <h1 className="text-display-xs font-semibold tracking-tight text-primary">{title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-tertiary">{description}</p>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
);

export const WorkspaceBody = ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cx("space-y-5 bg-secondary px-4 py-5 md:px-6", className)}>{children}</div>
);

export const ModuleTabs = ({
    tabs,
    selected,
    onSelect,
}: {
    tabs: readonly { id: string; label: string; count?: number }[];
    selected: string;
    onSelect: (id: string) => void;
}) => (
    <div className="overflow-x-auto border-b border-secondary bg-primary px-4 md:px-6">
        <div role="tablist" aria-label="Workspace views" className="flex min-w-max gap-5">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={selected === tab.id}
                    onClick={() => onSelect(tab.id)}
                    className={cx(
                        "flex items-center gap-2 border-b-2 py-3 text-sm font-semibold outline-focus-ring transition duration-100 ease-linear focus-visible:outline-2",
                        selected === tab.id ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary",
                    )}
                >
                    {tab.label}
                    {typeof tab.count === "number" && (
                        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs font-medium text-tertiary">{tab.count}</span>
                    )}
                </button>
            ))}
        </div>
    </div>
);

export const IconTile = ({ icon: Icon, tone = "blue" }: { icon: IconComponentType; tone?: StatusTone }) => (
    <span className={cx("flex size-10 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset", toneStyles[tone].icon)}>
        <Icon aria-hidden="true" className="size-5" />
    </span>
);

export const MetricCard = ({
    label,
    value,
    supporting,
    trend,
    icon,
    tone = "blue",
}: {
    label: string;
    value: string;
    supporting?: string;
    trend?: string;
    icon: IconComponentType;
    tone?: StatusTone;
}) => (
    <article className="min-w-0 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary md:p-5">
        <div className="flex items-start justify-between gap-3">
            <IconTile icon={icon} tone={tone} />
            {trend && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-primary">
                    <TrendUp01 aria-hidden="true" className="size-3.5" />
                    {trend}
                </span>
            )}
        </div>
        <p className="mt-4 text-sm font-medium text-tertiary">{label}</p>
        <p className="mt-1 text-display-xs font-semibold tracking-tight text-primary">{value}</p>
        {supporting && <p className="mt-1 text-xs text-quaternary">{supporting}</p>}
    </article>
);

export const Panel = ({
    title,
    description,
    action,
    children,
    className,
    flush = false,
}: {
    title: string;
    description?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    flush?: boolean;
}) => (
    <section className={cx("overflow-hidden rounded-xl bg-primary shadow-xs ring-1 ring-secondary", className)}>
        <div className="flex flex-col gap-3 border-b border-secondary px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5">
            <div className="min-w-0">
                <h2 className="text-md font-semibold text-primary">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-tertiary">{description}</p>}
            </div>
            {action}
        </div>
        <div className={cx(!flush && "p-4 md:p-5")}>{children}</div>
    </section>
);

export interface TableColumn<Row extends { id: string }> {
    id: string;
    label: string;
    className?: string;
    render: (row: Row) => ReactNode;
}

export const DataTable = <Row extends { id: string }>({
    label,
    rows,
    columns,
    onRowClick,
}: {
    label: string;
    rows: readonly Row[];
    columns: readonly TableColumn<Row>[];
    onRowClick?: (row: Row) => void;
}) => (
    <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-separate border-spacing-0" aria-label={label}>
            <thead>
                <tr className="bg-secondary">
                    {columns.map((column) => (
                        <th
                            key={column.id}
                            scope="col"
                            className={cx("border-b border-secondary px-4 py-2.5 text-left text-xs font-semibold text-quaternary", column.className)}
                        >
                            {column.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((row) => (
                    <tr
                        key={row.id}
                        tabIndex={onRowClick ? 0 : undefined}
                        onClick={() => onRowClick?.(row)}
                        onKeyDown={(event) => {
                            if (onRowClick && (event.key === "Enter" || event.key === " ")) {
                                event.preventDefault();
                                onRowClick(row);
                            }
                        }}
                        className={cx(
                            "group outline-focus-ring [&:not(:last-child)>td]:border-b [&:not(:last-child)>td]:border-secondary",
                            onRowClick && "cursor-pointer hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2",
                        )}
                    >
                        {columns.map((column) => (
                            <td key={column.id} className={cx("px-4 py-3 text-sm text-tertiary", column.className)}>
                                {column.render(row)}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

export const Toolbar = ({ searchLabel, searchPlaceholder, children }: { searchLabel: string; searchPlaceholder: string; children?: ReactNode }) => (
    <div className="flex flex-col gap-3 rounded-xl bg-primary p-3 shadow-xs ring-1 ring-secondary sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block min-w-0 flex-1 sm:max-w-sm">
            <span className="sr-only">{searchLabel}</span>
            <SearchLg aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-quaternary" />
            <input
                type="search"
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-lg bg-primary py-2 pr-3 pl-9 text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden placeholder:text-placeholder focus:ring-2 focus:ring-brand"
            />
        </label>
        <div className="flex flex-wrap items-center gap-2">
            {children}
            <Button color="secondary" size="sm" iconLeading={FilterLines}>
                Filters
            </Button>
        </div>
    </div>
);

export const NativeSelect = ({ label, defaultValue, options }: { label: string; defaultValue?: string; options: readonly string[] }) => (
    <label className="relative">
        <span className="sr-only">{label}</span>
        <select
            aria-label={label}
            defaultValue={defaultValue}
            className="h-10 appearance-none rounded-lg bg-primary py-2 pr-9 pl-3 text-sm font-medium text-secondary shadow-xs ring-1 ring-primary outline-hidden focus:ring-2 focus:ring-brand"
        >
            {options.map((option) => (
                <option key={option}>{option}</option>
            ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-quaternary" />
    </label>
);

export const ProgressBar = ({ value, label, tone = "blue", showValue = true }: { value: number; label: string; tone?: StatusTone; showValue?: boolean }) => {
    const fills: Record<StatusTone, string> = {
        gray: "bg-fg-quaternary",
        blue: "bg-utility-blue-600",
        green: "bg-utility-green-600",
        amber: "bg-utility-yellow-500",
        red: "bg-utility-red-600",
        purple: "bg-utility-purple-600",
    };

    return (
        <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-secondary">{label}</span>
                {showValue && <span className="text-xs font-semibold text-quaternary">{value}%</span>}
            </div>
            <div
                role="progressbar"
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={value}
                className="h-2 overflow-hidden rounded-full bg-quaternary"
            >
                <div className={cx("h-full rounded-full", fills[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
            </div>
        </div>
    );
};

export const SparkBars = ({
    values,
    labels,
    tone = "blue",
    height = 128,
}: {
    values: readonly number[];
    labels?: readonly string[];
    tone?: StatusTone;
    height?: number;
}) => {
    const max = Math.max(...values, 1);
    const fills: Record<StatusTone, string> = {
        gray: "bg-fg-quaternary",
        blue: "bg-utility-blue-500",
        green: "bg-utility-green-500",
        amber: "bg-utility-yellow-500",
        red: "bg-utility-red-500",
        purple: "bg-utility-purple-500",
    };

    return (
        <div className="flex items-end gap-2" style={{ height }}>
            {values.map((value, index) => (
                <div key={`${labels?.[index] ?? "bar"}-${index}`} className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2">
                    <div className="flex flex-1 items-end rounded-md bg-secondary">
                        <div
                            className={cx("w-full rounded-md transition-[height] duration-300", fills[tone])}
                            style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
                            title={`${labels?.[index] ?? `Period ${index + 1}`}: ${value}`}
                        />
                    </div>
                    {labels?.[index] && <span className="truncate text-center text-[11px] font-medium text-quaternary">{labels[index]}</span>}
                </div>
            ))}
        </div>
    );
};

export const RingMetric = ({ value, label, sublabel, tone = "blue" }: { value: number; label: string; sublabel?: string; tone?: StatusTone }) => {
    const colors: Record<StatusTone, string> = {
        gray: "#667085",
        blue: "#2e90fa",
        green: "#12b76a",
        amber: "#f79009",
        red: "#f04438",
        purple: "#9e77ed",
    };

    return (
        <div className="flex items-center gap-4">
            <div
                role="img"
                aria-label={`${label}: ${value}%`}
                className="grid size-20 shrink-0 place-items-center rounded-full"
                style={{ background: `conic-gradient(${colors[tone]} ${value * 3.6}deg, #eaecf0 0deg)` }}
            >
                <div className="grid size-15 place-items-center rounded-full bg-primary">
                    <span className="text-lg font-semibold text-primary">{value}%</span>
                </div>
            </div>
            <div>
                <p className="text-sm font-semibold text-primary">{label}</p>
                {sublabel && <p className="mt-0.5 text-xs text-tertiary">{sublabel}</p>}
            </div>
        </div>
    );
};

export const Callout = ({
    icon: Icon,
    title,
    children,
    tone = "blue",
    action,
}: {
    icon: IconComponentType;
    title: string;
    children: ReactNode;
    tone?: StatusTone;
    action?: ReactNode;
}) => (
    <div className={cx("flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-start", toneStyles[tone].soft)}>
        <IconTile icon={Icon} tone={tone} />
        <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary">{title}</p>
            <div className="mt-1 text-sm text-tertiary">{children}</div>
        </div>
        {action}
    </div>
);

export const QueueItem = ({ title, meta, badge, detail, onOpen }: { title: string; meta: string; badge?: ReactNode; detail?: string; onOpen?: () => void }) => (
    <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-3 border-b border-secondary px-4 py-3 text-left outline-focus-ring transition duration-100 ease-linear last:border-b-0 hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2"
    >
        <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-semibold text-primary">{title}</span>
                {badge}
            </span>
            <span className="mt-0.5 block text-xs text-tertiary">{meta}</span>
            {detail && <span className="mt-1 block text-xs text-quaternary">{detail}</span>}
        </span>
        <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-fg-quaternary transition-transform group-hover:translate-x-0.5" />
    </button>
);

export const MiniStat = ({ label, value, tone }: { label: string; value: string; tone?: "default" | "success" | "warning" | "error" }) => (
    <div className="rounded-lg bg-secondary p-3">
        <p className="text-xs font-medium text-quaternary">{label}</p>
        <p
            className={cx(
                "mt-1 text-lg font-semibold",
                tone === "success"
                    ? "text-success-primary"
                    : tone === "warning"
                      ? "text-warning-primary"
                      : tone === "error"
                        ? "text-error-primary"
                        : "text-primary",
            )}
        >
            {value}
        </p>
    </div>
);

export const CheckList = ({ items }: { items: readonly { label: string; supporting?: string; complete: boolean }[] }) => (
    <ul className="space-y-3">
        {items.map((item) => (
            <li key={item.label} className="flex items-start gap-3">
                <span
                    className={cx(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ring-1 ring-inset",
                        item.complete ? "bg-utility-green-50 text-utility-green-700 ring-utility-green-200" : "bg-secondary text-fg-quaternary ring-secondary",
                    )}
                >
                    {item.complete ? <Check aria-hidden="true" className="size-3 stroke-[3px]" /> : <span className="size-1.5 rounded-full bg-fg-quaternary" />}
                </span>
                <span>
                    <span className="block text-sm font-medium text-secondary">{item.label}</span>
                    {item.supporting && <span className="mt-0.5 block text-xs text-quaternary">{item.supporting}</span>}
                </span>
            </li>
        ))}
    </ul>
);

export const OpenLink = ({ children }: { children: ReactNode }) => (
    <button
        type="button"
        className="inline-flex items-center gap-1 text-sm font-semibold text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover"
    >
        {children}
        <ArrowUpRight aria-hidden="true" className="size-4" />
    </button>
);
