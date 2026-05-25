import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BookCover from './components/BookCover'
import BookSpread from './components/BookSpread'
import { playBookOpenSound } from './utils/sound'

function App() {
  const [isBookOpen, setIsBookOpen] = useState(false)

  const handleOpen = () => {
    playBookOpenSound()
    setIsBookOpen(true)
  }

  const handleClose = () => {
    setIsBookOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-cream-dark">
      <AnimatePresence mode="wait">
        {!isBookOpen ? (
          <motion.div
            key="cover"
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
          >
            <BookCover onOpen={handleOpen} />
          </motion.div>
        ) : (
          <motion.div
            key="book"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BookSpread onClose={handleClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
