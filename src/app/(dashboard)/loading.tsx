import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <main className="px-3 sm:px-6 py-6 sm:py-8 max-w-6xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </main>
  )
}
