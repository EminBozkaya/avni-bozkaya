import { motion } from 'framer-motion'

interface BookCoverProps {
  onOpen: () => void
}

export default function BookCover({ onOpen }: BookCoverProps) {
  return (
    <div
      className="fixed inset-0 w-full h-full cursor-pointer overflow-hidden bg-stone-950 flex items-center justify-center"
      onClick={onOpen}
      role="button"
      aria-label="İnteraktif şiir kitabını okumak için tıklayın"
    >
      {/* Mobile: full-screen cover image */}
      <motion.img
        src="/images/guldali_giris_resmi_mobile.png"
        alt="Güldalı Şiir Kitabı - Avni Bozkaya - Pasinler Erzurum Şairi ve Matematik Öğretmeni"
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none sm:hidden"
        draggable={false}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Tablet & Desktop: full-screen cover image */}
      <motion.img
        src="/images/guldali_giris_resmi.png"
        alt="Güldalı Şiir Kitabı - Avni Bozkaya - Pasinler Hasankale Erzurum Şairi, Dadaş, Matematik Öğretmeni"
        className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none hidden sm:block"
        draggable={false}
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {/* Alt kısımda yumuşak koyu gradient — yazının her zaman okunmasını sağlar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 sm:h-48 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(20,8,10,0.82) 0%, rgba(20,8,10,0.45) 45%, rgba(20,8,10,0) 100%)',
        }}
        aria-hidden="true"
      />

      {/* Ana CTA: pulse + sonar halkalar + zıplayan icon */}
      <motion.div
        className="absolute bottom-8 sm:bottom-12 left-0 right-0 flex flex-col items-center pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.9, ease: 'easeOut' }}
      >
        {/* Zıplayan kitap-açma ikonu */}
        <motion.div
          className="mb-2.5 sm:mb-3 text-rose-100"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="sm:w-6 sm:h-6 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </motion.div>

        {/* CTA butonu — pulse + sonar */}
        <div className="relative">
          {/* Sonar halkaları — buton arkasında dalga dalga açılan halkalar */}
          {[0, 1].map((i) => (
            <motion.span
              key={i}
              className="absolute inset-0 rounded-full border-2 border-rose-200/45"
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: [1, 1.55], opacity: [0, 0.55, 0] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: 'easeOut',
                delay: i * 1.1,
                times: [0, 0.35, 1],
              }}
              aria-hidden="true"
            />
          ))}

          {/* Asıl buton — pulse animasyonu — gül kırmızısı */}
          <motion.div
            className="relative px-5 py-2 sm:px-6 sm:py-2.5 rounded-full shadow-2xl border border-rose-200/35"
            style={{
              background:
                'linear-gradient(135deg, #6B1320 0%, #9F1A3E 45%, #C42455 100%)',
            }}
            animate={{ scale: [1, 1.035, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="flex flex-col items-center leading-tight">
              <span className="text-rose-100/85 text-[9px] sm:text-[10px] font-body tracking-[0.18em] uppercase">
                İnteraktif Şiir Kitabı
              </span>
              <span className="text-white font-display text-sm sm:text-base font-semibold tracking-wide drop-shadow-sm mt-0.5">
                Okumak için tıklayın
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
