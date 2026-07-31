"use client";

import { ArrowLeft, HomeLine } from "@untitledui/icons";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";

export default function NotFound() {
    const router = useRouter();

    return (
        <main className="flex min-h-dvh items-center bg-[#f7f9fc] px-4 py-16">
            <section className="mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-10">
                <span className="text-sm font-semibold text-blue-700">404 · Workspace not found</span>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">That ATQ route is not registered.</h1>
                <p className="mt-3 text-base leading-7 text-gray-600">
                    The link may point to an older screen identifier or a workspace that is not enabled for this environment.
                </p>
                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
                    <Button color="secondary" size="lg" iconLeading={ArrowLeft} onClick={() => router.back()}>
                        Go back
                    </Button>
                    <Button size="lg" iconLeading={HomeLine} onClick={() => router.push("/operations")}>
                        Open operations
                    </Button>
                </div>
            </section>
        </main>
    );
}
