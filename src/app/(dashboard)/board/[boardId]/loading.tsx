import { Skeleton } from '@/components/ui/skeleton'

export default function BoardLoading() {
  return (
    <main className="flex flex-col min-h-[calc(100dvh-56px)] animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
      <div className="flex flex-col p-4 flex-1">
        <div className="flex gap-4 flex-1 min-h-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-64 shrink-0"
              style={{ height: `${200 + i * 60}px` }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
