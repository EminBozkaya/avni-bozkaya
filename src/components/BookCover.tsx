import { motion } from 'framer-motion'

interface BookCoverProps {
  onOpen: () => void
}

export default function BookCover({ onOpen }: BookCoverProps) {
  return (
    <div 
      className="fixed inset-0 w-full h-full cursor-pointer overflow-hidden bg-black"
      onClick={onOpen}
    >
      <motion.div
        className="relative w-full h-full"
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      >
        <img
          src="/images/guldali_kitap_kapak_resmi_son.png"
          alt="Güldalı - Avni Bozkaya"
          className="w-full h-full object-cover select-none pointer-events-none"
          draggable={false}
        />

        {/* Click hint */}
        <motion.div
          className="absolute bottom-12 left-0 right-0 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        >
          <p className="px-4 py-2 bg-black/30 backdrop-blur-sm text-white/90 rounded-full font-body text-sm tracking-wider">
            kitabı açmak için tıklayınız
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
