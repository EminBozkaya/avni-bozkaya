import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BookCover from './components/BookCover'
import BookSpread from './components/BookSpread'
import { playBookOpenSound } from './utils/sound'
import { findPoemBySlug, poemSlugs } from './utils/slug'

function parseHash(): { poemId: number | null } {
  const hash = window.location.hash
  const match = hash.match(/^#\/siir\/(.+)$/)
  if (match) {
    const found = findPoemBySlug(match[1])
    if (found) return { poemId: found.id }
  }
  return { poemId: null }
}

function App() {
  const [isBookOpen, setIsBookOpen] = useState(() => parseHash().poemId !== null)
  const [initialPoemId, setInitialPoemId] = useState<number | null>(() => parseHash().poemId)

  const handleOpen = () => {
    playBookOpenSound()
    setIsBookOpen(true)
  }

  const handleClose = () => {
    setIsBookOpen(false)
    setInitialPoemId(null)
    history.replaceState(null, '', window.location.pathname)
  }

  const handlePoemNavigate = useCallback((poemId: number) => {
    const entry = poemSlugs.find((p) => p.id === poemId)
    if (entry) {
      history.replaceState(null, '', `#/siir/${entry.slug}`)
    }
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      const { poemId } = parseHash()
      if (poemId !== null) {
        setInitialPoemId(poemId)
        setIsBookOpen(true)
      }
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

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
            <BookSpread
              onClose={handleClose}
              initialPoemId={initialPoemId}
              onPoemNavigate={handlePoemNavigate}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
