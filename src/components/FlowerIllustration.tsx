import { motion } from 'framer-motion'

export default function FlowerIllustration() {
  return (
    <motion.svg
      width="120"
      height="200"
      viewBox="0 0 120 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, delay: 0.3 }}
    >
      {/* Stem */}
      <motion.path
        d="M60 195 C60 195, 58 140, 62 100 C66 60, 55 45, 60 30"
        stroke="#2c1810"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      />

      {/* Left leaf */}
      <motion.path
        d="M59 130 C45 120, 30 125, 28 115 C26 105, 40 108, 58 118"
        fill="#2c1810"
        opacity={0.15}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.15 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      />

      {/* Flower petals - tulip/rose style */}
      <motion.ellipse
        cx="48"
        cy="28"
        rx="14"
        ry="22"
        fill="#c44536"
        transform="rotate(-15, 48, 28)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 1.5 }}
      />
      <motion.ellipse
        cx="72"
        cy="28"
        rx="14"
        ry="22"
        fill="#c44536"
        transform="rotate(15, 72, 28)"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 1.6 }}
      />
      <motion.ellipse
        cx="60"
        cy="22"
        rx="12"
        ry="20"
        fill="#d4564a"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, delay: 1.7 }}
      />

      {/* Seed / center dot */}
      <motion.ellipse
        cx="60"
        cy="48"
        rx="5"
        ry="6"
        fill="#2c1810"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 1.9 }}
      />
    </motion.svg>
  )
}
