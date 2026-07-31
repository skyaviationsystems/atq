"use client";

import { useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowDown, ArrowUp, Check, Copy01, Edit05, Eye, FilePlus02, LayersThree01, Lock01, Plus, Settings01, Trash01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { TextArea } from "@/components/base/textarea/textarea";
import { cx } from "@/utils/cx";
import { initialDesignerSchema } from "./synthetic-data";
import type { FormDesignerField, FormDesignerSchema, FormFieldType } from "./types";

const MAX_SECTIONS = 8;
const MAX_FIELDS = 24;
const MAX_CHOICE_OPTIONS = 8;

const fieldTypes: Array<{
    type: FormFieldType;
    label: string;
    description: string;
    tone: string;
}> = [
    { type: "short-text", label: "Short text", description: "Single-line response", tone: "bg-utility-blue-50 text-utility-blue-700" },
    { type: "long-text", label: "Long text", description: "Evidence or narrative", tone: "bg-utility-indigo-50 text-utility-indigo-700" },
    { type: "choice", label: "Approved choice", description: "Bounded option list", tone: "bg-utility-purple-50 text-utility-purple-700" },
    { type: "rating-matrix", label: "Rating matrix", description: "Four dimensions · 1–5", tone: "bg-utility-orange-50 text-utility-orange-700" },
    { type: "event-set", label: "Event set", description: "Attempts and repeat cap", tone: "bg-utility-sky-50 text-utility-sky-700" },
    { type: "signature", label: "Attestation", description: "Identity-bound signature", tone: "bg-utility-green-50 text-utility-green-700" },
];

const fieldTypeById = Object.fromEntries(fieldTypes.map((fieldType) => [fieldType.type, fieldType])) as Record<FormFieldType, (typeof fieldTypes)[number]>;

const createField = (type: FormFieldType, id: string): FormDesignerField => ({
    id,
    type,
    label: fieldTypeById[type].label,
    helpText: fieldTypeById[type].description,
    required: type === "rating-matrix" || type === "event-set" || type === "signature",
    options: type === "choice" ? ["Option 1", "Option 2"] : undefined,
});

interface FieldPreviewProps {
    field: FormDesignerField;
}

const FieldPreview = ({ field }: FieldPreviewProps) => {
    if (field.type === "short-text") {
        return <div className="h-10 rounded-lg border border-secondary bg-secondary/30" />;
    }
    if (field.type === "long-text") {
        return <div className="h-20 rounded-lg border border-secondary bg-secondary/30" />;
    }
    if (field.type === "choice") {
        return (
            <div className="space-y-2">
                {(field.options ?? []).map((option) => (
                    <div key={option} className="flex items-center gap-2 text-sm text-secondary">
                        <span className="size-4 rounded-full border border-secondary bg-primary" />
                        {option}
                    </div>
                ))}
            </div>
        );
    }
    if (field.type === "rating-matrix") {
        return (
            <div className="grid grid-cols-[minmax(90px,1fr)_repeat(6,34px)] items-center gap-1 text-center text-[11px] text-tertiary">
                <span className="text-left">Dimension</span>
                {["1", "2", "3", "4", "5", "N/A"].map((rating) => (
                    <span key={rating}>{rating}</span>
                ))}
                {["Safety", "Technical", "Procedures", "Crew"].map((dimension) => (
                    <div key={dimension} className="contents">
                        <span className="truncate text-left text-secondary">{dimension}</span>
                        {[1, 2, 3, 4, 5, 6].map((rating) => (
                            <span key={rating} className="mx-auto size-5 rounded-full border border-secondary bg-primary" />
                        ))}
                    </div>
                ))}
            </div>
        );
    }
    if (field.type === "event-set") {
        return (
            <div className="flex items-center justify-between rounded-lg border border-secondary bg-secondary/30 px-3 py-3">
                <span className="text-xs font-medium text-secondary">Event set with versioned attempts</span>
                <span className="rounded-full bg-primary px-2 py-1 text-[11px] font-semibold text-tertiary ring-1 ring-secondary ring-inset">Cap 2</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-secondary px-3 py-3 text-xs text-tertiary">
            <Lock01 aria-hidden="true" className="size-4" />
            Attestation is applied only after final review.
        </div>
    );
};

const getValidationIssues = (schema: FormDesignerSchema) => {
    const allFields = schema.sections.flatMap((section) => section.fields);
    const issues: string[] = [];
    if (!schema.name.trim()) issues.push("Form name is required.");
    if (schema.sections.length === 0) issues.push("Add at least one section.");
    if (!allFields.some((field) => field.type === "rating-matrix" || field.type === "event-set")) {
        issues.push("Add at least one approved assessment control.");
    }
    if (!allFields.some((field) => field.type === "signature")) {
        issues.push("Add an attestation before publishing.");
    }
    if (allFields.some((field) => !field.label.trim())) issues.push("Every field needs a visible label.");
    const normalizedSectionNames = schema.sections.map((section) => section.title.trim().toLowerCase());
    if (new Set(normalizedSectionNames).size !== normalizedSectionNames.length) issues.push("Section titles must be unique.");
    return issues;
};

export interface SchemaFormDesignerProps {
    initialSchema?: FormDesignerSchema;
    className?: string;
    onSchemaChange?: (schema: FormDesignerSchema) => void;
    onPublish?: (schema: FormDesignerSchema) => void;
}

export const SchemaFormDesigner = ({ initialSchema = initialDesignerSchema, className, onSchemaChange, onPublish }: SchemaFormDesignerProps) => {
    const [schema, setSchema] = useState<FormDesignerSchema>(initialSchema);
    const [selectedSectionId, setSelectedSectionId] = useState(initialSchema.sections[0]?.id ?? "");
    const [selectedFieldId, setSelectedFieldId] = useState(initialSchema.sections[0]?.fields[0]?.id ?? "");
    const [mode, setMode] = useState<"build" | "preview">("build");
    const [showValidation, setShowValidation] = useState(false);
    const localIdCounter = useRef(0);

    const allFieldCount = schema.sections.reduce((count, section) => count + section.fields.length, 0);
    const selectedSection = schema.sections.find((section) => section.id === selectedSectionId);
    const selectedField = selectedSection?.fields.find((field) => field.id === selectedFieldId);
    const validationIssues = useMemo(() => getValidationIssues(schema), [schema]);

    const commitSchema = (nextSchema: FormDesignerSchema) => {
        setSchema(nextSchema);
        onSchemaChange?.(nextSchema);
    };

    const updateSection = (sectionId: string, update: (section: FormDesignerSchema["sections"][number]) => FormDesignerSchema["sections"][number]) => {
        commitSchema({
            ...schema,
            status: "draft",
            sections: schema.sections.map((section) => (section.id === sectionId ? update(section) : section)),
        });
    };

    const addField = (type: FormFieldType) => {
        if (!selectedSection || allFieldCount >= MAX_FIELDS) return;
        localIdCounter.current += 1;
        const field = createField(type, `field-${type}-local-${localIdCounter.current}`);
        updateSection(selectedSection.id, (section) => ({ ...section, fields: [...section.fields, field] }));
        setSelectedFieldId(field.id);
    };

    const moveField = (fieldId: string, direction: -1 | 1) => {
        if (!selectedSection) return;
        const index = selectedSection.fields.findIndex((field) => field.id === fieldId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= selectedSection.fields.length) return;
        const fields = [...selectedSection.fields];
        [fields[index], fields[nextIndex]] = [fields[nextIndex], fields[index]];
        updateSection(selectedSection.id, (section) => ({ ...section, fields }));
    };

    const duplicateField = (field: FormDesignerField) => {
        if (!selectedSection || allFieldCount >= MAX_FIELDS) return;
        localIdCounter.current += 1;
        const nextField = { ...field, id: `${field.id}-copy-${localIdCounter.current}`, label: `${field.label} copy` };
        const index = selectedSection.fields.findIndex((item) => item.id === field.id);
        const fields = [...selectedSection.fields];
        fields.splice(index + 1, 0, nextField);
        updateSection(selectedSection.id, (section) => ({ ...section, fields }));
        setSelectedFieldId(nextField.id);
    };

    const removeField = (fieldId: string) => {
        if (!selectedSection) return;
        const index = selectedSection.fields.findIndex((field) => field.id === fieldId);
        const remaining = selectedSection.fields.filter((field) => field.id !== fieldId);
        updateSection(selectedSection.id, (section) => ({ ...section, fields: remaining }));
        setSelectedFieldId(remaining[Math.min(index, remaining.length - 1)]?.id ?? "");
    };

    const addSection = () => {
        if (schema.sections.length >= MAX_SECTIONS) return;
        localIdCounter.current += 1;
        const section = {
            id: `section-local-${localIdCounter.current}`,
            title: `Section ${schema.sections.length + 1}`,
            description: "Describe the purpose of this section.",
            fields: [],
        };
        commitSchema({ ...schema, status: "draft", sections: [...schema.sections, section] });
        setSelectedSectionId(section.id);
        setSelectedFieldId("");
    };

    const publish = () => {
        setShowValidation(true);
        if (validationIssues.length > 0) return;
        const published = {
            ...schema,
            version: schema.version.startsWith("Draft") ? "v1.0" : schema.version,
            status: "published" as const,
        };
        commitSchema(published);
        onPublish?.(published);
    };

    return (
        <div className={cx("overflow-hidden rounded-xl border border-secondary bg-primary shadow-xs", className)}>
            <header className="flex flex-col gap-4 border-b border-secondary px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-utility-blue-50 px-2.5 py-1 text-xs font-semibold text-utility-blue-700 ring-1 ring-utility-blue-200 ring-inset">
                            {schema.program}
                        </span>
                        <span
                            className={cx(
                                "rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                                schema.status === "published"
                                    ? "bg-utility-green-50 text-utility-green-700 ring-utility-green-200"
                                    : "bg-utility-orange-50 text-utility-orange-700 ring-utility-orange-200",
                            )}
                        >
                            {schema.version}
                        </span>
                    </div>
                    <h1 className="mt-2 truncate text-lg font-semibold text-primary">{schema.name}</h1>
                    <p className="mt-1 text-sm text-tertiary">
                        Constrained, versioned schema · {schema.sections.length}/{MAX_SECTIONS} sections · {allFieldCount}/{MAX_FIELDS} fields
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex rounded-lg bg-secondary p-1">
                        <button
                            type="button"
                            onClick={() => setMode("build")}
                            aria-pressed={mode === "build"}
                            className={cx(
                                "flex min-h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-utility-blue-500",
                                mode === "build" ? "bg-primary text-primary shadow-xs" : "text-tertiary",
                            )}
                        >
                            <Edit05 aria-hidden="true" className="size-3.5" />
                            Build
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("preview")}
                            aria-pressed={mode === "preview"}
                            className={cx(
                                "flex min-h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-utility-blue-500",
                                mode === "preview" ? "bg-primary text-primary shadow-xs" : "text-tertiary",
                            )}
                        >
                            <Eye aria-hidden="true" className="size-3.5" />
                            Preview
                        </button>
                    </div>
                    <Button color="primary" size="sm" iconLeading={Check} onClick={publish}>
                        Validate & publish
                    </Button>
                </div>
            </header>

            {showValidation && (
                <div
                    className={cx(
                        "border-b px-4 py-3 sm:px-5",
                        validationIssues.length === 0
                            ? "border-utility-green-200 bg-utility-green-50 text-utility-green-700"
                            : "border-utility-orange-200 bg-utility-orange-50 text-utility-orange-700",
                    )}
                    role="status"
                >
                    <div className="flex items-start gap-2">
                        {validationIssues.length === 0 ? (
                            <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        ) : (
                            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                        )}
                        <div>
                            <p className="text-sm font-semibold">
                                {validationIssues.length === 0
                                    ? "Schema is valid and published."
                                    : `${validationIssues.length} publishing checks need attention.`}
                            </p>
                            {validationIssues.length > 0 && (
                                <ul className="mt-1 list-disc pl-4 text-xs">
                                    {validationIssues.map((issue) => (
                                        <li key={issue}>{issue}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {mode === "preview" ? (
                <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
                    <div className="mb-6 rounded-xl border border-utility-blue-200 bg-utility-blue-50 px-4 py-3 text-sm text-utility-blue-700">
                        Preview uses synthetic responses. Runtime permissions, event bindings, and signatures are applied when a published version is opened.
                    </div>
                    <div className="space-y-5">
                        {schema.sections.map((section, sectionIndex) => (
                            <section key={section.id} className="rounded-xl border border-secondary bg-primary shadow-xs">
                                <div className="border-b border-secondary px-5 py-4">
                                    <p className="text-xs font-semibold tracking-wide text-utility-blue-700 uppercase">Section {sectionIndex + 1}</p>
                                    <h2 className="mt-1 text-lg font-semibold text-primary">{section.title}</h2>
                                    {section.description && <p className="mt-1 text-sm text-tertiary">{section.description}</p>}
                                </div>
                                <div className="space-y-5 px-5 py-5">
                                    {section.fields.length === 0 && <p className="text-sm text-tertiary">No fields in this section.</p>}
                                    {section.fields.map((field) => (
                                        <div key={field.id}>
                                            <p className="text-sm font-semibold text-primary">
                                                {field.label}
                                                {field.required && <span className="ml-1 text-utility-red-600">*</span>}
                                            </p>
                                            {field.helpText && <p className="mt-0.5 text-xs text-tertiary">{field.helpText}</p>}
                                            <div className="mt-2">
                                                <FieldPreview field={field} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="grid min-h-[720px] lg:grid-cols-[220px_minmax(0,1fr)_280px]">
                    <aside className="border-b border-secondary bg-secondary/35 p-3 lg:border-r lg:border-b-0">
                        <div className="flex items-center justify-between px-2 py-2">
                            <div className="flex items-center gap-2">
                                <LayersThree01 aria-hidden="true" className="size-4 text-fg-quaternary" />
                                <h2 className="text-xs font-semibold tracking-wide text-tertiary uppercase">Sections</h2>
                            </div>
                            <button
                                type="button"
                                onClick={addSection}
                                disabled={schema.sections.length >= MAX_SECTIONS}
                                aria-label="Add section"
                                className="flex size-8 items-center justify-center rounded-lg text-utility-blue-700 transition outline-none hover:bg-utility-blue-50 focus-visible:ring-2 focus-visible:ring-utility-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <Plus aria-hidden="true" className="size-4" />
                            </button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                            {schema.sections.map((section, index) => (
                                <button
                                    key={section.id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedSectionId(section.id);
                                        setSelectedFieldId(section.fields[0]?.id ?? "");
                                    }}
                                    aria-pressed={selectedSectionId === section.id}
                                    className={cx(
                                        "flex min-w-44 items-center gap-2 rounded-lg px-3 py-2.5 text-left transition outline-none focus-visible:ring-2 focus-visible:ring-utility-blue-500 lg:w-full lg:min-w-0",
                                        selectedSectionId === section.id ? "bg-utility-blue-50 text-utility-blue-700" : "text-secondary hover:bg-primary_hover",
                                    )}
                                >
                                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold ring-1 ring-secondary ring-inset">
                                        {index + 1}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold">{section.title}</span>
                                        <span className="block text-xs text-tertiary">{section.fields.length} fields</span>
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-5 border-t border-secondary pt-4">
                            <div className="flex items-center gap-2 px-2">
                                <FilePlus02 aria-hidden="true" className="size-4 text-fg-quaternary" />
                                <h2 className="text-xs font-semibold tracking-wide text-tertiary uppercase">Approved fields</h2>
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-1">
                                {fieldTypes.map((fieldType) => (
                                    <button
                                        key={fieldType.type}
                                        type="button"
                                        onClick={() => addField(fieldType.type)}
                                        disabled={!selectedSection || allFieldCount >= MAX_FIELDS}
                                        className="flex min-h-14 items-center gap-2 rounded-lg border border-secondary bg-primary px-2.5 py-2 text-left shadow-xs transition outline-none hover:border-utility-blue-300 hover:bg-utility-blue-50 focus-visible:ring-2 focus-visible:ring-utility-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <span className={cx("flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-bold", fieldType.tone)}>
                                            +
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-xs font-semibold text-primary">{fieldType.label}</span>
                                            <span className="hidden truncate text-[11px] text-tertiary xl:block">{fieldType.description}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <main className="min-w-0 bg-secondary/15 p-3 sm:p-5">
                        {selectedSection ? (
                            <section>
                                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold tracking-wide text-utility-blue-700 uppercase">Editing section</p>
                                        <h2 className="mt-1 text-lg font-semibold text-primary">{selectedSection.title}</h2>
                                        <p className="mt-1 text-sm text-tertiary">{selectedSection.description}</p>
                                    </div>
                                    <Button
                                        color="secondary"
                                        size="sm"
                                        iconLeading={Plus}
                                        onClick={() => addField("short-text")}
                                        isDisabled={allFieldCount >= MAX_FIELDS}
                                    >
                                        Add field
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {selectedSection.fields.length === 0 && (
                                        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-secondary bg-primary px-6 text-center">
                                            <FilePlus02 aria-hidden="true" className="size-7 text-fg-quaternary" />
                                            <p className="mt-3 text-sm font-semibold text-primary">This section is empty</p>
                                            <p className="mt-1 max-w-sm text-sm text-tertiary">
                                                Choose an approved field type from the palette. Arbitrary scripts and custom markup are not supported.
                                            </p>
                                        </div>
                                    )}

                                    {selectedSection.fields.map((field, index) => {
                                        const meta = fieldTypeById[field.type];
                                        return (
                                            <article
                                                key={field.id}
                                                className={cx(
                                                    "rounded-xl border bg-primary shadow-xs transition",
                                                    selectedFieldId === field.id
                                                        ? "border-utility-blue-500 ring-1 ring-utility-blue-500"
                                                        : "border-secondary hover:border-utility-blue-300",
                                                )}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedFieldId(field.id)}
                                                    className="w-full px-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-utility-blue-500 focus-visible:ring-inset"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <span className={cx("rounded-md px-2 py-0.5 text-[11px] font-semibold", meta.tone)}>
                                                                    {meta.label}
                                                                </span>
                                                                {field.required && (
                                                                    <span className="text-[11px] font-semibold text-utility-red-700">Required</span>
                                                                )}
                                                            </div>
                                                            <h3 className="mt-2 text-sm font-semibold text-primary">{field.label || "Untitled field"}</h3>
                                                            {field.helpText && <p className="mt-1 text-xs text-tertiary">{field.helpText}</p>}
                                                        </div>
                                                        <span className="font-mono text-xs text-quaternary">{String(index + 1).padStart(2, "0")}</span>
                                                    </div>
                                                    <div className="pointer-events-none mt-3">
                                                        <FieldPreview field={field} />
                                                    </div>
                                                </button>

                                                <div className="flex items-center justify-end gap-1 border-t border-secondary px-2 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveField(field.id, -1)}
                                                        disabled={index === 0}
                                                        aria-label={`Move ${field.label} up`}
                                                        className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary outline-none hover:bg-primary_hover hover:text-primary focus-visible:ring-2 focus-visible:ring-utility-blue-500 disabled:opacity-30"
                                                    >
                                                        <ArrowUp aria-hidden="true" className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveField(field.id, 1)}
                                                        disabled={index === selectedSection.fields.length - 1}
                                                        aria-label={`Move ${field.label} down`}
                                                        className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary outline-none hover:bg-primary_hover hover:text-primary focus-visible:ring-2 focus-visible:ring-utility-blue-500 disabled:opacity-30"
                                                    >
                                                        <ArrowDown aria-hidden="true" className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => duplicateField(field)}
                                                        disabled={allFieldCount >= MAX_FIELDS}
                                                        aria-label={`Duplicate ${field.label}`}
                                                        className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary outline-none hover:bg-primary_hover hover:text-primary focus-visible:ring-2 focus-visible:ring-utility-blue-500 disabled:opacity-30"
                                                    >
                                                        <Copy01 aria-hidden="true" className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeField(field.id)}
                                                        aria-label={`Delete ${field.label}`}
                                                        className="flex size-8 items-center justify-center rounded-lg text-fg-quaternary outline-none hover:bg-utility-red-50 hover:text-utility-red-700 focus-visible:ring-2 focus-visible:ring-utility-red-500"
                                                    >
                                                        <Trash01 aria-hidden="true" className="size-4" />
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            </section>
                        ) : (
                            <div className="flex min-h-96 items-center justify-center text-sm text-tertiary">Add a section to begin.</div>
                        )}
                    </main>

                    <aside className="border-t border-secondary bg-primary p-4 lg:border-t-0 lg:border-l">
                        <div className="flex items-center gap-2">
                            <Settings01 aria-hidden="true" className="size-4 text-fg-quaternary" />
                            <h2 className="text-xs font-semibold tracking-wide text-tertiary uppercase">
                                {selectedField ? "Field settings" : "Section settings"}
                            </h2>
                        </div>

                        {selectedField && selectedSection ? (
                            <div className="mt-4 space-y-4">
                                <Input
                                    label="Field label"
                                    value={selectedField.label}
                                    onChange={(label) =>
                                        updateSection(selectedSection.id, (section) => ({
                                            ...section,
                                            fields: section.fields.map((field) => (field.id === selectedField.id ? { ...field, label } : field)),
                                        }))
                                    }
                                />
                                <TextArea
                                    label="Help text"
                                    value={selectedField.helpText ?? ""}
                                    onChange={(helpText) =>
                                        updateSection(selectedSection.id, (section) => ({
                                            ...section,
                                            fields: section.fields.map((field) => (field.id === selectedField.id ? { ...field, helpText } : field)),
                                        }))
                                    }
                                    rows={3}
                                />
                                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-secondary p-3">
                                    <input
                                        type="checkbox"
                                        className="mt-0.5 size-4 accent-utility-blue-600"
                                        checked={selectedField.required}
                                        onChange={(event) =>
                                            updateSection(selectedSection.id, (section) => ({
                                                ...section,
                                                fields: section.fields.map((field) =>
                                                    field.id === selectedField.id ? { ...field, required: event.target.checked } : field,
                                                ),
                                            }))
                                        }
                                    />
                                    <span>
                                        <span className="block text-sm font-semibold text-primary">Required response</span>
                                        <span className="mt-0.5 block text-xs text-tertiary">Blocks submission until complete.</span>
                                    </span>
                                </label>

                                {selectedField.type === "choice" && (
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-semibold text-primary">Options</p>
                                            <span className="text-xs text-tertiary">
                                                {selectedField.options?.length ?? 0}/{MAX_CHOICE_OPTIONS}
                                            </span>
                                        </div>
                                        <div className="mt-2 space-y-2">
                                            {(selectedField.options ?? []).map((option, optionIndex) => (
                                                <div key={`${selectedField.id}-${optionIndex}`} className="flex items-center gap-2">
                                                    <input
                                                        value={option}
                                                        aria-label={`Option ${optionIndex + 1}`}
                                                        onChange={(event) =>
                                                            updateSection(selectedSection.id, (section) => ({
                                                                ...section,
                                                                fields: section.fields.map((field) => {
                                                                    if (field.id !== selectedField.id) return field;
                                                                    const options = [...(field.options ?? [])];
                                                                    options[optionIndex] = event.target.value;
                                                                    return { ...field, options };
                                                                }),
                                                            }))
                                                        }
                                                        className="min-w-0 flex-1 rounded-lg bg-primary px-3 py-2 text-sm text-primary shadow-xs ring-1 ring-primary outline-none ring-inset focus:ring-2 focus:ring-utility-blue-500"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateSection(selectedSection.id, (section) => ({
                                                                ...section,
                                                                fields: section.fields.map((field) =>
                                                                    field.id === selectedField.id
                                                                        ? {
                                                                              ...field,
                                                                              options: (field.options ?? []).filter((_, index) => index !== optionIndex),
                                                                          }
                                                                        : field,
                                                                ),
                                                            }))
                                                        }
                                                        aria-label={`Delete option ${optionIndex + 1}`}
                                                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-quaternary outline-none hover:bg-utility-red-50 hover:text-utility-red-700 focus-visible:ring-2 focus-visible:ring-utility-red-500"
                                                    >
                                                        <Trash01 aria-hidden="true" className="size-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button
                                            color="secondary"
                                            size="sm"
                                            iconLeading={Plus}
                                            className="mt-2 w-full"
                                            isDisabled={(selectedField.options?.length ?? 0) >= MAX_CHOICE_OPTIONS}
                                            onClick={() =>
                                                updateSection(selectedSection.id, (section) => ({
                                                    ...section,
                                                    fields: section.fields.map((field) =>
                                                        field.id === selectedField.id
                                                            ? { ...field, options: [...(field.options ?? []), `Option ${(field.options?.length ?? 0) + 1}`] }
                                                            : field,
                                                    ),
                                                }))
                                            }
                                        >
                                            Add option
                                        </Button>
                                    </div>
                                )}

                                <div className="rounded-lg bg-secondary px-3 py-3">
                                    <p className="text-xs font-semibold text-secondary">Control boundary</p>
                                    <p className="mt-1 text-xs text-tertiary">
                                        Type and identifier are immutable after publishing. No custom code, formulas, or network calls are permitted.
                                    </p>
                                </div>
                            </div>
                        ) : selectedSection ? (
                            <div className="mt-4 space-y-4">
                                <Input
                                    label="Section title"
                                    value={selectedSection.title}
                                    onChange={(title) => updateSection(selectedSection.id, (section) => ({ ...section, title }))}
                                />
                                <TextArea
                                    label="Description"
                                    value={selectedSection.description ?? ""}
                                    onChange={(description) => updateSection(selectedSection.id, (section) => ({ ...section, description }))}
                                    rows={3}
                                />
                                <p className="text-xs text-tertiary">Select a field in the canvas to edit its properties.</p>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-tertiary">No section selected.</p>
                        )}
                    </aside>
                </div>
            )}
        </div>
    );
};
