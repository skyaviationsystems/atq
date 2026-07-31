export { AdministrationWorkspace, AnalyticsWorkspace, ComplianceWorkspace } from "./governance-workspaces";
export { RecordsWorkspace } from "../records";
export { CurriculumWorkspace, QualificationRulesWorkspace, SchedulingWorkspace } from "./core-workspaces";
export { InstructorManagementWorkspace, NoNoticeWorkspace, SpecialTrackingWorkspace } from "./assurance-workspaces";
export { BatchEntryWorkspace, FormsOperationsWorkspace, InstructorWorkspace, OperationsWorkspace } from "./operate-workspaces";
export { defaultModuleId, getModuleDefinition, isModuleId, moduleById, moduleRegistry, modulesByGroup } from "./module-registry";
export { getModuleWorkspace, ModuleWorkspace, moduleComponentRegistry, resolveModuleId } from "./module-workspace";
export type { ModuleComponent, ModuleDefinition, ModuleGroup, ModuleId, ModuleRoute, ModuleViewProps } from "./module-types";
export type { ModuleWorkspaceProps } from "./module-workspace";
