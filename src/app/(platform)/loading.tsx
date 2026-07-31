export default function LoadingWorkspace() {
    return (
        <div className="animate-pulse space-y-5" role="status" aria-label="Loading workspace">
            <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-7 w-64 rounded bg-gray-200" />
                    <div className="h-4 w-96 max-w-[70vw] rounded bg-gray-100" />
                </div>
                <div className="h-10 w-32 rounded-lg bg-gray-200" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="h-32 rounded-xl border border-gray-200 bg-white p-4">
                        <div className="h-4 w-24 rounded bg-gray-100" />
                        <div className="mt-5 h-8 w-16 rounded bg-gray-200" />
                    </div>
                ))}
            </div>
            <div className="h-96 rounded-xl border border-gray-200 bg-white p-5">
                <div className="h-5 w-48 rounded bg-gray-200" />
                <div className="mt-5 space-y-3">
                    {Array.from({ length: 6 }, (_, index) => (
                        <div key={index} className="h-10 rounded bg-gray-100" />
                    ))}
                </div>
            </div>
            <span className="sr-only">Loading ATQ workspace</span>
        </div>
    );
}
