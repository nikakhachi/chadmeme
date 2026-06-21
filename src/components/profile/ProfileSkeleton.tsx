/** Loading placeholder for the profile page, mirroring its layout. */
export function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse p-4 lg:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div className="size-14 rounded-full bg-panel" />
        <div className="space-y-2">
          <div className="h-6 w-40 rounded bg-panel" />
          <div className="h-4 w-28 rounded bg-panel" />
        </div>
      </div>

      {/* Net worth card */}
      <div className="mb-6 rounded-xl border border-line bg-panel p-5">
        <div className="mb-2 h-4 w-20 rounded bg-elevated" />
        <div className="mb-2 h-9 w-56 rounded bg-elevated" />
        <div className="h-4 w-64 rounded bg-elevated" />
        <div className="mt-4 h-56 rounded-lg bg-elevated" />
      </div>

      {/* Two columns */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <SectionSkeleton rows={3} />
          <SectionSkeleton rows={4} />
        </div>
        <div className="h-44 rounded-xl border border-line bg-panel" />
      </div>
    </div>
  );
}

function SectionSkeleton({ rows }: { rows: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-panel">
      <div className="border-b border-line px-4 py-3">
        <div className="h-4 w-24 rounded bg-elevated" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 rounded bg-elevated" />
        ))}
      </div>
    </div>
  );
}
