"use client";

import { AlertCircle } from "@untitledui/icons";
import { RecordsWorkspace } from "@/features/records";
import { InstructorManagementWorkspace, NoNoticeWorkspace, SpecialTrackingWorkspace } from "./assurance-workspaces";
import { CurriculumWorkspace, QualificationRulesWorkspace, SchedulingWorkspace } from "./core-workspaces";
import { AdministrationWorkspace, AnalyticsWorkspace, ComplianceWorkspace } from "./governance-workspaces";
import { defaultModuleId, isModuleId, moduleById, moduleRegistry } from "./module-registry";
import type { ModuleComponent, ModuleId, ModuleViewProps } from "./module-types";
import { Callout, WorkspaceBody, WorkspaceHeader } from "./module-ui";
import { BatchEntryWorkspace, FormsOperationsWorkspace, InstructorWorkspace, OperationsWorkspace } from "./operate-workspaces";

export const moduleComponentRegistry: Record<ModuleId, ModuleComponent> = {
    M0: OperationsWorkspace,
    M1: FormsOperationsWorkspace,
    M2: InstructorWorkspace,
    M3: BatchEntryWorkspace,
    M4: RecordsWorkspace,
    M5: QualificationRulesWorkspace,
    M6: CurriculumWorkspace,
    M7: SchedulingWorkspace,
    M8: NoNoticeWorkspace,
    M9: SpecialTrackingWorkspace,
    M10: InstructorManagementWorkspace,
    M11: AnalyticsWorkspace,
    M12: ComplianceWorkspace,
    M13: AdministrationWorkspace,
};

export interface ModuleWorkspaceProps extends ModuleViewProps {
    module?: ModuleId | string;
}

export const resolveModuleId = (module: string | undefined): ModuleId | undefined => {
    if (!module) {
        return defaultModuleId;
    }
    if (isModuleId(module)) {
        return module;
    }
    return moduleRegistry.find((definition) => definition.slug === module)?.id;
};

export const ModuleWorkspace = ({ module, initialView, initialEntityId, onNavigate }: ModuleWorkspaceProps) => {
    const moduleId = resolveModuleId(module);

    if (!moduleId) {
        return (
            <div className="min-h-full">
                <WorkspaceHeader
                    eyebrow="ATQ workspace"
                    title="Module not found"
                    description="The requested workspace is not registered in this application."
                />
                <WorkspaceBody>
                    <Callout icon={AlertCircle} title="Unknown module" tone="amber">
                        Use a registered module ID (M0–M13) or one of the module slugs exposed by the registry.
                    </Callout>
                </WorkspaceBody>
            </div>
        );
    }

    const Component = moduleComponentRegistry[moduleId];
    return <Component initialView={initialView} initialEntityId={initialEntityId} onNavigate={onNavigate} />;
};

export const getModuleWorkspace = (moduleId: ModuleId) => ({
    definition: moduleById[moduleId],
    Component: moduleComponentRegistry[moduleId],
});
