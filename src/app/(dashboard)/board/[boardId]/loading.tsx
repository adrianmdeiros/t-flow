import { Spinner } from '@/components/ui/spinner'

export default function BoardLoading() {
  return (
    <main className="flex flex-col min-h-[calc(100vh-56px)]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[--border]">
        <div className="flex items-center gap-4">
          <div className="h-5 w-20 rounded bg-[--accent] animate-pulse" />
          <div className="h-6 w-48 rounded bg-[--accent] animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col p-4 flex-1">
        <div className="flex gap-4 flex-1 min-h-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="w-64 shrink-0 rounded-lg border border-[--border] bg-[--accent] animate-pulse"
              style={{ height: `${200 + i * 60}px` }}
            />
          ))}
        </div>
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      </div>
    </main>
  )
}
