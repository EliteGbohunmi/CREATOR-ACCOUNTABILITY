import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X, Flame, CheckCircle2, Users, CalendarDays, Trophy, Bot } from 'lucide-react'

const STEPS = [
  {
    icon: <Flame size={28} color="#F5A623" />,
    title: 'Welcome to Streak',
    desc: 'This is your accountability hub. Every feature here is built to help you show up consistently as a creator.',
    highlight: null
  },
  {
    icon: <CheckCircle2 size={28} color="#F5A623" />,
    title: 'Check in after you post',
    desc: 'After posting, tap "I Posted Today" and submit a link or screenshot as proof. Your accountability partner confirms it before your streak counts.',
    highlight: 'checkin'
  },
  {
    icon: <Bot size={28} color="#F5A623" />,
    title: 'Your AI Coach',
    desc: 'See that robot button at the bottom right? Tap it and tell your coach how your day went — it will suggest content ideas, help with hooks, and keep you motivated.',
    highlight: 'ai'
  },
  {
    icon: <CalendarDays size={28} color="#F5A623" />,
    title: 'Plan your content',
    desc: 'Go to the Planner to schedule what you\'ll post this week. The AI Ideas button generates 5 content ideas tailored to your niche in seconds.',
    highlight: 'planner'
  },
  {
    icon: <Trophy size={28} color="#F5A623" />,
    title: 'Join a challenge',
    desc: 'Challenges keep you accountable to a group. You can see who checked in and who missed — social pressure that actually works.',
    highlight: 'challenges'
  },
  {
    icon: <Users size={28} color="#F5A623" />,
    title: 'Find a partner',
    desc: 'An accountability partner is the most powerful feature here. They confirm your posts and you confirm theirs. Go to Partners to send your first request.',
    highlight: 'partners'
  },
]

export default function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  const next = () => {
    if (isLast) {
      localStorage.setItem('onboarding_complete', 'true')
      onComplete()
    } else {
      setStep(s => s + 1)
    }
  }

  const skip = () => {
    localStorage.setItem('onboarding_complete', 'true')
    onComplete()
  }

  return (
    <>
      {/* Overlay */}
      <div style={styles.overlay} />

      {/* Modal */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          style={styles.modal}
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.97 }}
          transition={{ duration: 0.25 }}
        >
          {/* Skip */}
          <button style={styles.skipBtn} onClick={skip}>
            <X size={16} color="#555" />
          </button>

          {/* Progress dots */}
          <div style={styles.dots}>
            {STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.dot,
                  background: i === step ? '#F5A623' : i < step ? '#F5A62360' : '#2A2A2A',
                  width: i === step ? '20px' : '6px'
                }}
              />
            ))}
          </div>

          {/* Icon */}
          <div style={styles.iconWrap}>
            {current.icon}
          </div>

          {/* Content */}
          <h2 style={styles.title}>{current.title}</h2>
          <p style={styles.desc}>{current.desc}</p>

          {/* Step counter */}
          <p style={styles.counter}>{step + 1} of {STEPS.length}</p>

          {/* Button */}
          <button style={styles.btn} onClick={next}>
            {isLast ? 'Start your streak' : 'Next'}
            <ArrowRight size={16} color="#0A0A0A" />
          </button>
        </motion.div>
      </AnimatePresence>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.85)',
    zIndex: 500, backdropFilter: 'blur(4px)'
  },
  modal: {
    position: 'fixed', bottom: '1.5rem',
    left: '1rem', right: '1rem',
    background: '#111111',
    border: '1px solid #1E1E1E',
    borderRadius: '20px',
    padding: '1.75rem 1.5rem',
    zIndex: 501,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', textAlign: 'center',
    boxShadow: '0 24px 60px rgba(0,0,0,0.6)'
  },
  skipBtn: {
    position: 'absolute', top: '1rem', right: '1rem',
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '0.25rem'
  },
  dots: {
    display: 'flex', gap: '0.35rem', marginBottom: '1.5rem',
    alignItems: 'center'
  },
  dot: {
    height: '6px', borderRadius: '999px',
    transition: 'all 0.3s ease'
  },
  iconWrap: {
    background: '#1A1400', borderRadius: '16px',
    padding: '1rem', marginBottom: '1.25rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  title: {
    fontFamily: 'Space Grotesk', fontWeight: '700',
    fontSize: '1.2rem', color: '#F0EDE8',
    marginBottom: '0.75rem', lineHeight: 1.3
  },
  desc: {
    color: '#666', fontSize: '0.88rem',
    lineHeight: 1.7, marginBottom: '0.5rem'
  },
  counter: {
    color: '#333', fontSize: '0.72rem',
    marginBottom: '1.25rem'
  },
  btn: {
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    background: '#F5A623', color: '#0A0A0A',
    border: 'none', borderRadius: '12px',
    padding: '0.85rem 2rem', fontWeight: '700',
    fontSize: '0.95rem', cursor: 'pointer', width: '100%',
    justifyContent: 'center'
  }
}
