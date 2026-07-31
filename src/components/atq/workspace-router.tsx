"use client";

import { useRouter } from "next/navigation";
import { ATQFormsWorkspace, type ATQWorkspaceSurface } from "@/features/forms";
import { InstructorWorkspace } from "@/features/instructor";
import { type ModuleId, ModuleWorkspace } from "@/features/modules";

interface WorkspaceRouterProps {
    moduleId: ModuleId;
    detail?: string[];
}

const moduleScreenViews: Partial<Record<ModuleId, Record<string, string>>> = {
    M0: {
        "0.1": "resolver",
        "0.2": "mats",
        "0.7": "overview",
    },
    M4: {
        "4.1": "people",
        "4.2": "person",
        "4.3": "matrix",
    },
    M5: {
        "5.1": "catalog",
        "5.5": "forecast",
        "5.10": "simulator",
    },
};

function resolveFormsSurface(initialView?: string): ATQWorkspaceSurface {
    if (!initialView) return "runtime";

    const screen = Number.parseFloat(initialView);
    if (screen >= 1.14 && screen <= 1.23) return "runtime";
    if (screen >= 1.3 && screen <= 1.34) return "queue";
    if (screen >= 1.1 && screen <= 1.13) return "designer";
    return "runtime";
}

function resolveRecordsRoute(detail?: string[]) {
    const [route, entityId] = detail ?? [];

    if (!route || route === "people") {
        return {
            initialView: entityId ? "person" : "people",
            initialEntityId: entityId,
        };
    }

    if (route === "explorer") {
        return { initialView: "records" };
    }

    if (route === "matrix") {
        return { initialView: "matrix" };
    }

    return {
        initialView: moduleScreenViews.M4?.[route] ?? route,
    };
}

export function WorkspaceRouter({ moduleId, detail }: WorkspaceRouterProps) {
    const router = useRouter();
    const initialView = detail?.[0];

    if (moduleId === "M1") {
        const surface = resolveFormsSurface(initialView);
        return <ATQFormsWorkspace key={surface} initialSurface={surface} className="-m-4 sm:-m-6" />;
    }

    if (moduleId === "M2") {
        return <InstructorWorkspace className="-m-4 sm:-m-6" onOpenForm={() => router.push("/forms/1.14")} />;
    }

    if (moduleId === "M4") {
        const recordsRoute = resolveRecordsRoute(detail);
        return <ModuleWorkspace key={detail?.join("/") ?? "records"} module={moduleId} {...recordsRoute} />;
    }

    const resolvedView = initialView ? (moduleScreenViews[moduleId]?.[initialView] ?? initialView) : undefined;
    return <ModuleWorkspace module={moduleId} initialView={resolvedView} />;
}
