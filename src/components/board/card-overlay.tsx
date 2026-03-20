import Image from 'next/image'
import { Card } from '@/components/ui/card'
import type { Card as CardType } from '@/types'

const OVERLAY_WIDTH: Record<string, string> = {
  small: 'w-48',
  medium: 'w-56',
  large: 'w-56',
}

const IMAGE_HEIGHT: Record<string, string> = {
  small: 'h-24',
  medium: 'h-28',
  large: 'h-32',
}

interface CardOverlayProps {
  card: CardType
}

export function CardOverlay({ card }: CardOverlayProps) {
  const imageUrl = card.imageUrl
    ? `https://utynojjnhvtntijjjjzh.supabase.co/storage/v1/object/public/card-images/${card.imageUrl}`
    : null

  const widthClass = OVERLAY_WIDTH[card.imageSize] ?? 'w-56'
  const heightClass = IMAGE_HEIGHT[card.imageSize] ?? 'h-32'

  return (
    <Card className={`${widthClass} rotate-2 opacity-90 pointer-events-none shadow-lg`}>
      {imageUrl && (
        <div className={`relative w-full ${heightClass}`}>
          <Image
            src={imageUrl}
            alt={card.title ?? 'Card image'}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-3">
        {card.title && (
          <p className="text-sm text-card-foreground">{card.title}</p>
        )}
        {!card.title && !imageUrl && (
          <p className="text-sm text-muted-foreground italic">Card vazio</p>
        )}
      </div>
    </Card>
  )
}
