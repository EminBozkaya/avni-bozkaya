import { motion } from 'framer-motion'

interface BookCoverProps {
  onOpen: () => void
}

export default function BookCover({ onOpen }: BookCoverProps) {
  return (
    <div
      className="fixed inset-0 w-full h-full cursor-pointer overflow-hidden bg-stone-950 flex items-center justify-center"
      onClick={onOpen}
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

      {/* Click hint */}
      <motion.div
        className="absolute bottom-6 sm:bottom-10 left-0 right-0 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      >
        <p className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white/80 rounded-full font-body text-xs sm:text-sm tracking-wider">
          kitabı açmak için tıklayınız
        </p>
      </motion.div>
    </div>
  )
}
