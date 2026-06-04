import { useState, useEffect, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import BookCover from './components/BookCover'
import BookSpread from './components/BookSpread'
import { playBookOpenSound } from './utils/sound'
import { findPoemBySlug, poemSlugs } from './utils/slug'

function parseLocation(): { poemId: number | null } {
  // Önce temiz URL: /siir/<slug>
  const pathMatch = window.location.pathname.match(/^\/siir\/([^/]+)\/?$/)
  if (pathMatch) {
    const found = findPoemBySlug(decodeURIComponent(pathMatch[1]))
    if (found) return { poemId: found.id }
  }
  // Geriye dönük uyumluluk: #/siir/<slug>
  const hashMatch = window.location.hash.match(/^#\/siir\/(.+)$/)
  if (hashMatch) {
    const found = findPoemBySlug(decodeURIComponent(hashMatch[1]))
    if (found) return { poemId: found.id }
  }
  return { poemId: null }
}

function App() {
  const [isBookOpen, setIsBookOpen] = useState(() => parseLocation().poemId !== null)
  const [initialPoemId, setInitialPoemId] = useState<number | null>(() => parseLocation().poemId)

  // Eski hash URL'i ile gelen ziyaretçileri temiz URL'e yönlendir (replaceState — geçmişi kirletmez).
  useEffect(() => {
    const hashMatch = window.location.hash.match(/^#\/siir\/(.+)$/)
    if (hashMatch) {
      const found = findPoemBySlug(decodeURIComponent(hashMatch[1]))
      if (found) {
        const entry = poemSlugs.find((p) => p.id === found.id)
        if (entry) {
          history.replaceState(null, '', `/siir/${entry.slug}/`)
        }
      }
    }
  }, [])

  const handleOpen = () => {
    playBookOpenSound()
    setIsBookOpen(true)
  }

  const handleClose = () => {
    setIsBookOpen(false)
    setInitialPoemId(null)
    history.replaceState(null, '', '/')
  }

  const handlePoemNavigate = useCallback((poemId: number) => {
    const entry = poemSlugs.find((p) => p.id === poemId)
    if (entry) {
      history.replaceState(null, '', `/siir/${entry.slug}/`)
    }
  }, [])

  useEffect(() => {
    const onLocationChange = () => {
      const { poemId } = parseLocation()
      if (poemId !== null) {
        setInitialPoemId(poemId)
        setIsBookOpen(true)
      }
    }
    window.addEventListener('hashchange', onLocationChange)
    window.addEventListener('popstate', onLocationChange)
    return () => {
      window.removeEventListener('hashchange', onLocationChange)
      window.removeEventListener('popstate', onLocationChange)
    }
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
