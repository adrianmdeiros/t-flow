import Image from 'next/image'
import type { Card } from '@/types'

interface CardOverlayProps {
  card: Card
}

export function CardOverlay({ card }: CardOverlayProps) {
  const imageUrl = card.imageUrl
    ? `https://utynojjnhvtntijjjjzh.supabase.co/storage/v1/object/public/card-images/${card.imageUrl}`
    : null

  return (
    <div className="w-56 rounded-md border border-[--border] bg-[--card] shadow-lg rotate-2 opacity-90 pointer-events-none">
      {imageUrl && (
        <div className="relative w-full h-32">
          <Image
            src={imageUrl}
            alt={card.title ?? 'Card image'}
            fill
            className="object-cover rounded-t-md"
          />
        </div>
      )}
      <div className="p-3">
        {card.title && (
          <p className="text-sm text-[--card-foreground]">{card.title}</p>
        )}
        {!card.title && !imageUrl && (
          <p className="text-sm text-[--muted] italic">Card vazio</p>
        )}
      </div>
    </div>
  )
}
