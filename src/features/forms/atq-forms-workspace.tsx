"use client";

import { useState } from "react";
import { ClipboardCheck, Edit05, FileSearch02, GraduationHat01 } from "@untitledui/icons";
import { cx } from "@/utils/cx";
import { InstructorWorkspace } from "../instructor/instructor-workspace";
import { B747AQPCQFormRuntime } from "./b747-aqp-cq-runtime";
import { FormQueueQCView } from "./form-queue-qc-view";
import { SchemaFormDesigner } from "./schema-form-designer";

export type ATQWorkspaceSurface = "instructor" | "runtime" | "designer" | "queue";

const surfaces: Array<{
    id: ATQWorkspaceSurface;
    label: string;
    description: string;
    icon: typeof GraduationHat01;
}> = [
    { id: "instructor", label: "Instructor", description: "Events and offline packs", icon: GraduationHat01 },
    { id: "runtime", label: "Form runtime", description: "Live B747 AQP CQ record", icon: ClipboardCheck },
    { id: "designer", label: "Designer", description: "Bounded form schema", icon: Edit05 },
    { id: "queue", label: "QC queue", description: "Records review", icon: FileSearch02 },
];

export interface ATQFormsWorkspaceProps {
    initialSurface?: ATQWorkspaceSurface;
    className?: string;
}

export const ATQFormsWorkspace = ({ initialSurface = "instructor", className }: ATQFormsWorkspaceProps) => {
    const [surface, setSurface] = useState<ATQWorkspaceSurface>(initialSurface);

    return (
        <div className={cx("min-h-screen bg-secondary", className)}>
            <div className="relative z-50 border-b border-[#235985] bg-[#002f59] px-3 py-2 text-white shadow-sm sm:px-5">
                <div className="mx-auto flex max-w-[1600px] items-center gap-3">
                    <div className="hidden shrink-0 items-center gap-3 lg:flex">
                        <span className="flex size-9 items-center justify-center rounded-lg bg-white/12 text-sm font-bold tracking-tight">ATQ</span>
                        <div>
                            <p className="text-xs font-semibold text-white">Workflow preview</p>
                            <p className="text-[11px] text-white/60">Synthetic proof-of-concept data</p>
                        </div>
                    </div>
                    <div className="hidden h-8 w-px bg-white/15 lg:block" />
                    <nav className="min-w-0 flex-1 overflow-x-auto" aria-label="ATQ workflow surfaces">
                        <div className="flex min-w-max items-center gap-1">
                            {surfaces.map((item) => {
                                const Icon = item.icon;
                                const selected = surface === item.id;
                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => setSurface(item.id)}
                                        className={cx(
                                            "flex min-h-11 items-center gap-2 rounded-lg px-3 py-1.5 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-white",
                                            selected ? "bg-white text-[#003b70] shadow-xs" : "text-white/75 hover:bg-white/10 hover:text-white",
                                        )}
                                    >
                                        <Icon aria-hidden="true" className="size-4 shrink-0" />
                                        <span>
                                            <span className="block text-xs font-semibold">{item.label}</span>
                                            <span className={cx("hidden text-[10px] sm:block", selected ? "text-[#4b6f8d]" : "text-white/55")}>
                                                {item.description}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </nav>
                </div>
            </div>

            {surface === "runtime" && <B747AQPCQFormRuntime onExit={() => setSurface("instructor")} />}
            {surface === "instructor" && <InstructorWorkspace onOpenForm={() => setSurface("runtime")} />}
            {surface === "designer" && (
                <main className="mx-auto max-w-[1600px] px-3 py-5 sm:px-5">
                    <SchemaFormDesigner />
                </main>
            )}
            {surface === "queue" && (
                <main className="mx-auto max-w-[1600px] px-3 py-5 sm:px-5">
                    <FormQueueQCView />
                </main>
            )}
        </div>
    );
};
