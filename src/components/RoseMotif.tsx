/**
 * RoseMotif — Kitap kapağındaki gül dalı motifinin resim versiyonu.
 *
 * İki kullanım modu:
 *  • variant="watermark"  → Boş sayfalarda ortalanmış, kara-kalem görünümünde blur.
 *  • variant="ornament"   → Şiir sayfalarında sol-alt köşeye küçük, yansıtılmış süsleme.
 */

interface RoseMotifProps {
  variant: 'watermark' | 'ornament'
  /** Page side — used to mirror the ornament so it always faces inward */
  side?: 'left' | 'right'
}

export default function RoseMotif({ variant, side = 'left' }: RoseMotifProps) {
  if (variant === 'watermark') {
    return <WatermarkRose />
  }
  return <OrnamentRose side={side} />
}

/* ─── Watermark (blank pages) ──────────────────────────────────────── */

function WatermarkRose() {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
      aria-hidden
    >
      <img
        src="/images/rose_motif.png"
        alt=""
        draggable={false}
        style={{
          width: '55%',
          maxWidth: '260px',
          height: 'auto',
          opacity: 0.14,
          filter: 'grayscale(1) brightness(0.7) contrast(4) blur(0.3px)',
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  )
}

/* ─── Ornament (poem pages, bottom-left) ───────────────────────────── */

function OrnamentRose({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left'

  return (
    <div
      className="absolute bottom-2 -left-2 pointer-events-none select-none"
      aria-hidden
      style={{
        transform: isLeft
          ? 'scaleX(-1) rotate(-15deg)'   // yansıtılmış + sayfaya bakan açı
          : 'rotate(15deg)',               // sağ sayfalarda sayfaya bakan açı
        transformOrigin: 'bottom center',
      }}
    >
      <img
        src="/images/rose_motif.png"
        alt=""
        draggable={false}
        style={{
          width: '64px',
          height: 'auto',
          opacity: 0.22,
          filter: 'grayscale(1) brightness(0.7) contrast(4)',
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  )
}
