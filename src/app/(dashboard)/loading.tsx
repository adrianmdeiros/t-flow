import { Spinner } from '@/components/ui/spinner'

export default function DashboardLoading() {
  return (
    <main className="px-6 py-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-40 rounded bg-[--accent] animate-pulse" />
        <div className="h-9 w-28 rounded-md bg-[--accent] animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg border border-[--border] bg-[--card] animate-pulse"
          />
        ))}
      </div>
      <div className="flex justify-center mt-12">
        <Spinner size="lg" />
      </div>
    </main>
  )
}
