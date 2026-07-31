import type { ComponentType } from "react";
import type { IconComponentType } from "@/components/base/badges/badge-types";

export type ModuleId = "M0" | "M1" | "M2" | "M3" | "M4" | "M5" | "M6" | "M7" | "M8" | "M9" | "M10" | "M11" | "M12" | "M13";

export type ModuleGroup = "Operate" | "Build" | "Assure" | "Configure";

export interface ModuleRoute {
    code: string;
    label: string;
    description: string;
}

export interface ModuleDefinition {
    id: ModuleId;
    slug: string;
    title: string;
    shortTitle: string;
    description: string;
    group: ModuleGroup;
    icon: IconComponentType;
    routes: readonly ModuleRoute[];
}

export interface ModuleViewProps {
    initialView?: string;
    onNavigate?: (moduleId: ModuleId, view?: string) => void;
}

export type ModuleComponent = ComponentType<ModuleViewProps>;
