import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { WorkspaceRouter } from "@/components/atq/workspace-router";
import { moduleRegistry } from "@/features/modules/module-registry";

interface ModulePageProps {
    params: Promise<{
        module: string;
        detail?: string[];
    }>;
}

export async function generateMetadata({ params }: ModulePageProps): Promise<Metadata> {
    const { module: slug } = await params;
    const moduleDefinition = moduleRegistry.find((item) => item.slug === slug);

    return {
        title: moduleDefinition?.shortTitle ?? "Workspace",
        description: moduleDefinition?.description,
    };
}

export function generateStaticParams() {
    return moduleRegistry.map((module) => ({
        module: module.slug,
        detail: [],
    }));
}

export default async function ModulePage({ params }: ModulePageProps) {
    const { module: slug, detail } = await params;
    const moduleDefinition = moduleRegistry.find((item) => item.slug === slug);

    if (!moduleDefinition) notFound();

    return <WorkspaceRouter moduleId={moduleDefinition.id} detail={detail} />;
}
