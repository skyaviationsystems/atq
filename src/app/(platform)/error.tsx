"use client";

import { AlertTriangle, RefreshCcw01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <section className="flex min-h-[55vh] items-center justify-center">
            <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-red-50 text-red-700">
                    <AlertTriangle className="size-6" />
                </span>
                <h1 className="mt-4 text-xl font-semibold text-gray-900">This workspace could not be loaded</h1>
                <p className="mt-2 text-sm leading-6 text-gray-600">
                    Your draft remains on this device. Retry the workspace; if the issue continues, open the integration health console.
                </p>
                <Button className="mt-5" size="md" color="primary" iconLeading={RefreshCcw01} onClick={reset}>
                    Try again
                </Button>
            </div>
        </section>
    );
}
