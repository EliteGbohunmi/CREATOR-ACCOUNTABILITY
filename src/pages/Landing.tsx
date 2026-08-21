import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, useState } from 'react'
import {
  Flame, ArrowRight, CheckCircle2, Users, Shield, Zap, Clock,
  Sparkles, Target, BookOpen, Award, Gift, HelpCircle, ChevronDown,
  BarChart, Calendar, HeartHandshake
} from 'lucide-react'

// ----- Styles -----
const colors = {
  ink: '#0B1526',
  royal: '#2654B6',
  royalDeep: '#16357F',
  royalLight: '#3A6FE0',
  pearl: '#FBFCF8',
  muted: '#5A6B85',
  faint: '#9AA7BE',
  accent: '#F5A623',
  accentGlow: 'rgba(245,166,35,0.25)',
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

export default function Landing() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    { q: 'How does the accountability partner work?', a: 'You get matched with another creator. Each day, you both confirm each other\'s posts. If one doesn\'t post, the other gets notified. It’s a mutual commitment.' },
    { q: 'Is it really free?', a: 'Yes, forever. No credit card required. If we ever add premium features, they’ll be optional – the core system stays free.' },
    { q: 'What if I miss a day?', a: 'You earn rest tokens every 14 days of consistency. Use them to protect your streak when life happens. Your streak stays intact.' },
    { q: 'Can I use it for any platform?', a: 'Absolutely. Streak works with any content platform – YouTube, Instagram, TikTok, LinkedIn, X, blogs, newsletters, you name it.' },
  ]

  return (
    <div style={styles.page}>

      {/* Film grain overlay */}
      <div style={styles.grain} />

      {/* Nav */}
      <motion.nav
        style={styles.nav}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={styles.navLogo}>
            <Flame size={16} color={colors.accent} />
          </div>
          <span style={styles.navBrand}>Streak</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/login" style={styles.navLink}>Sign in</Link>
          <Link to="/signup" style={styles.navCta}>
            Get started
            <ArrowRight size={13} color="#0A0A0A" />
          </Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section ref={heroRef} style={styles.hero}>
        <div style={styles.meshBg} />

        <motion.div style={{ y: heroY, opacity: heroOpacity, position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 1.5rem' }}>
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp} style={styles.eyebrow}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.accent, display: 'inline-block' }} />
              For creators who are serious about showing up
            </motion.div>

            <motion.h1 variants={fadeUp} style={styles.heroTitle}>
              The last time<br />
              you start over.
            </motion.h1>

            <motion.p variants={fadeUp} style={styles.heroSub}>
              Most creators know what to post. The hard part is doing it consistently.
              <br />
              Streak gives you the system, the accountability, and the tools to actually show up.
            </motion.p>

            <motion.div variants={fadeUp} style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/signup" style={styles.ctaPrimary}>
                Start for free
                <ArrowRight size={16} color="#0A0A0A" />
              </Link>
              <Link to="/login" style={styles.ctaGhost}>
                Already have an account
              </Link>
            </motion.div>

            <motion.p variants={fadeUp} style={{ color: colors.muted, fontSize: '0.8rem', marginTop: '1.25rem' }}>
              Free to start · No credit card needed · No ads, ever
            </motion.p>
          </motion.div>
        </motion.div>

        {/* Preview Card */}
        <motion.div
          style={styles.previewCard}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={styles.previewAvatar}>S</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sarah K.</div>
                <div style={{ color: colors.muted, fontSize: '0.72rem' }}>YouTube Creator</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={14} color="#4CAF50" />
              <span style={{ color: '#4CAF50', fontSize: '0.75rem', fontWeight: '500' }}>Posted today</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: '#1A1400', borderRadius: '10px', padding: '0.6rem' }}>
                <Flame size={20} color={colors.accent} />
              </div>
              <div>
                <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '2.2rem', color: colors.accent, lineHeight: 1 }}>47</div>
                <div style={{ color: colors.muted, fontSize: '0.72rem' }}>day streak</div>
              </div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ color: colors.muted, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Best</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.1rem' }}>47</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: '3px', borderRadius: '999px', background: i < 5 ? colors.accent : '#2A2A2A' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem' }}>
            <div style={{ color: colors.muted, fontSize: '0.7rem' }}>2 days to next milestone</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#0D2010', border: '1px solid #4CAF5020', borderRadius: '20px', padding: '0.2rem 0.65rem' }}>
              <CheckCircle2 size={11} color="#4CAF50" />
              <span style={{ color: '#4CAF50', fontSize: '0.7rem' }}>Partner confirmed</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Social Proof Bar */}
      <motion.section
        style={styles.proofBar}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {[
          { num: '500+', label: 'Active creators' },
          { num: '10k+', label: 'Posts tracked' },
          { num: '47 days', label: 'Avg streak' },
          { num: '94%', label: 'Weekly retention' },
        ].map((s, i) => (
          <div key={i} style={styles.proofItem}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '1.4rem', color: colors.accent }}>{s.num}</div>
            <div style={{ color: colors.muted, fontSize: '0.72rem' }}>{s.label}</div>
          </div>
        ))}
      </motion.section>

      {/* Problem Section */}
      <section style={styles.problemSection}>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center' }}
        >
          <motion.div variants={fadeUp} style={styles.sectionTag}>The real problem</motion.div>
          <motion.h2 variants={fadeUp} style={styles.h2}>
            You don't have a talent problem.<br />You have a system problem.
          </motion.h2>
          <motion.p variants={fadeUp} style={styles.bodyText}>
            73% of creators experience burnout not because they lack ideas, but because they lack structure. Without accountability, even the most motivated creator falls off.
          </motion.p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          style={styles.problemGrid}
        >
          {[
            { icon: <Clock size={20} color="#E53E3E" />, problem: '"I\'ll post tomorrow"', fix: 'Daily check‑in with proof keeps you honest today.' },
            { icon: <Sparkles size={20} color="#E53E3E" />, problem: '"I don\'t know what to post"', fix: 'AI generates tailored ideas in seconds.' },
            { icon: <Users size={20} color="#E53E3E" />, problem: '"Nobody holds me accountable"', fix: 'Your partner confirms every post. No slipping through.' },
            { icon: <Shield size={20} color="#E53E3E" />, problem: '"I keep losing my streak"', fix: 'Rest tokens protect your streak on hard days.' },
          ].map((item, i) => (
            <motion.div key={i} variants={fadeUp} style={styles.problemCard}>
              <div style={{ marginBottom: '0.75rem' }}>{item.icon}</div>
              <div style={{ color: '#E53E3E', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem' }}>{item.problem}</div>
              <div style={{ color: colors.muted, fontSize: '0.82rem', lineHeight: 1.5 }}>{item.fix}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section style={styles.section}>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <motion.div variants={fadeUp} style={styles.sectionTag}>Simple system</motion.div>
          <motion.h2 variants={fadeUp} style={styles.h2}>How it works</motion.h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          style={styles.stepsGrid}
        >
          {[
            { step: '01', icon: <Target size={24} color={colors.accent} />, title: 'Set your commitment', desc: 'Choose your frequency – daily, 3x week, or custom. Define what a "post" means for you.' },
            { step: '02', icon: <Users size={24} color={colors.accent} />, title: 'Get a partner', desc: 'We pair you with another creator. You confirm each other\'s posts. No faking it.' },
            { step: '03', icon: <BarChart size={24} color={colors.accent} />, title: 'Track & improve', desc: 'Watch your streak grow. Get weekly summaries, celebrate milestones, and stay consistent.' },
          ].map((s, i) => (
            <motion.div key={i} variants={fadeUp} style={styles.stepCard}>
              <div style={styles.stepNumber}>{s.step}</div>
              <div style={{ marginBottom: '0.75rem' }}>{s.icon}</div>
              <div style={{ fontWeight: '700', fontSize: '1rem', marginBottom: '0.4rem' }}>{s.title}</div>
              <div style={{ color: colors.muted, fontSize: '0.85rem', lineHeight: 1.6 }}>{s.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section style={styles.section}>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
          style={{ textAlign: 'center', marginBottom: '3rem' }}
        >
          <motion.div variants={fadeUp} style={styles.sectionTag}>Everything you need</motion.div>
          <motion.h2 variants={fadeUp} style={styles.h2}>Built for consistency</motion.h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          style={styles.featuresGrid}
        >
          {[
            { icon: <Flame size={18} color={colors.accent} />, title: 'Streak Tracking', desc: 'Track consistency your way. Post 3x a week or daily — the system adapts to your schedule.', tag: 'Core' },
            { icon: <Users size={18} color="#4CAF50" />, title: 'Accountability Partners', desc: 'Get matched with another creator. You both confirm each other\'s posts. No faking it.', tag: 'Popular' },
            { icon: <Zap size={18} color="#2196F3" />, title: 'AI Content Ideas', desc: 'Describe your niche, pick a platform. Get 5 ready-to-use ideas with hooks in seconds.', tag: 'AI' },
            { icon: <Shield size={18} color="#9C27B0" />, title: 'Proof of Post', desc: 'Submit a link or screenshot when you check in. Eliminates fake streaks entirely.', tag: 'Accountability' },
            { icon: <BookOpen size={18} color={colors.accent} />, title: 'Content Vault', desc: 'Capture ideas the moment they hit. Never lose a hook, concept, or title again.', tag: 'Planning' },
            { icon: <Gift size={18} color="#FF6B35" />, title: 'Rest Tokens', desc: 'Life happens. Earn rest tokens every 14 days of consistency and use them when you need a break.', tag: 'Wellbeing' },
          ].map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              style={styles.featureCard}
              whileHover={{ borderColor: 'rgba(245,166,35,0.3)', transform: 'translateY(-2px)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={styles.featureIconWrap}>{f.icon}</div>
                <span style={styles.featureTag}>{f.tag}</span>
              </div>
              <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.4rem' }}>{f.title}</div>
              <div style={{ color: colors.muted, fontSize: '0.82rem', lineHeight: 1.6 }}>{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Testimonials */}
      <section style={styles.section}>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={styles.sectionTag}>Real creators</div>
            <h2 style={styles.h2}>What they're saying</h2>
          </motion.div>

          <motion.div variants={stagger} style={styles.testimonialsGrid}>
            {[
              { name: 'Gbohunmi', role: 'Designer', text: 'I needed a system that makes posting feel sustainable — not like a daily emergency. This is it.' },
              { name: 'Tolu', role: 'LinkedIn Creator', text: 'My accountability partner keeps me honest. I\'ve posted more in 30 days than all of last year.' },
              { name: 'Adaeze', role: 'YouTuber', text: 'The content vault alone changed how I work. Ideas go in immediately. Nothing gets lost.' },
            ].map((t, i) => (
              <motion.div key={i} variants={fadeUp} style={styles.testimonialCard}>
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <span key={j} style={{ color: colors.accent, fontSize: '0.8rem' }}>★</span>
                  ))}
                </div>
                <p style={{ color: colors.muted, fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={styles.testimonialAvatar}>{t.name[0]}</div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{t.name}</div>
                    <div style={{ color: colors.muted, fontSize: '0.75rem' }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Pricing / CTA */}
      <section style={styles.pricingSection}>
        <div style={styles.meshBg} />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 1.5rem' }}
        >
          <motion.div variants={fadeUp} style={styles.sectionTag}>Start now – it's free</motion.div>
          <motion.h2 variants={fadeUp} style={{ ...styles.h2, fontSize: 'clamp(1.8rem, 5vw, 2.8rem)' }}>
            No credit card. No catch.
          </motion.h2>
          <motion.p variants={fadeUp} style={{ ...styles.bodyText, marginBottom: '2rem', maxWidth: '480px', margin: '0 auto 2rem' }}>
            Join thousands of creators who are already building unstoppable momentum.
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Link to="/signup" style={styles.ctaPrimary}>
              Create free account
              <ArrowRight size={16} color="#0A0A0A" />
            </Link>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: colors.muted }}>
              <span>✓ Free forever</span>
              <span>✓ No ads</span>
              <span>✓ Premium upgrades later (optional)</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section style={styles.section}>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={stagger}
          style={{ maxWidth: '680px', margin: '0 auto' }}
        >
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={styles.sectionTag}>Questions?</div>
            <h2 style={styles.h2}>Frequently asked</h2>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                variants={fadeUp}
                style={styles.faqItem}
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
              >
                <div style={styles.faqHeader}>
                  <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    color={colors.muted}
                    style={{
                      transform: openFaq === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </div>
                <div
                  style={{
                    ...styles.faqAnswer,
                    maxHeight: openFaq === idx ? '200px' : '0',
                    opacity: openFaq === idx ? 1 : 0,
                    marginTop: openFaq === idx ? '0.5rem' : '0',
                  }}
                >
                  {faq.a}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Flame size={15} color={colors.accent} />
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: colors.pearl, fontSize: '0.9rem' }}>Streak</span>
        </div>
        <p style={{ color: colors.muted, fontSize: '0.75rem', marginBottom: '1rem' }}>
          Built for creators who are serious about consistency.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link to="/login" style={{ color: colors.muted, fontSize: '0.75rem', textDecoration: 'none' }}>Sign in</Link>
          <Link to="/signup" style={{ color: colors.muted, fontSize: '0.75rem', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </footer>
    </div>
  )
}

// ---- Styles ----
const styles: Record<string, React.CSSProperties> = {
  page: {
    background: '#0B1526',
    minHeight: '100vh',
    color: '#FBFCF8',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    overflowX: 'hidden',
    position: 'relative',
  },
  grain: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    opacity: 0.06,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
    backgroundSize: '256px 256px',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 1.5rem',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'rgba(11, 21, 38, 0.85)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(38, 84, 182, 0.2)',
  },
  navLogo: {
    background: '#1A1400',
    borderRadius: '8px',
    padding: '0.4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBrand: {
    fontFamily: 'Space Grotesk',
    fontWeight: '700',
    fontSize: '1rem',
    color: '#FBFCF8',
  },
  navLink: {
    color: '#9AA7BE',
    fontSize: '0.85rem',
    textDecoration: 'none',
    padding: '0.5rem 0.75rem',
    transition: 'color 0.2s',
  },
  navCta: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    background: '#2654B6',
    color: '#FBFCF8',
    fontSize: '0.82rem',
    textDecoration: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: '700',
    transition: 'background 0.2s',
  },
  hero: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '5rem',
    paddingBottom: '2rem',
    position: 'relative',
    overflow: 'hidden',
  },
  meshBg: {
    position: 'absolute',
    inset: 0,
    background: `radial-gradient(ellipse 80% 60% at 50% 20%, rgba(38,84,182,0.15) 0%, transparent 70%),
                 radial-gradient(ellipse 60% 40% at 80% 80%, rgba(245,166,35,0.08) 0%, transparent 60%)`,
    pointerEvents: 'none',
  },
  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#F5A623',
    fontSize: '0.75rem',
    fontWeight: '500',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: '1.5rem',
  },
  heroTitle: {
    fontFamily: 'Space Grotesk',
    fontWeight: '800',
    fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
    lineHeight: 1.05,
    marginBottom: '1.5rem',
    color: '#FBFCF8',
    letterSpacing: '-0.02em',
    textWrap: 'balance',
  },
  heroSub: {
    color: '#9AA7BE',
    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
    lineHeight: 1.75,
    marginBottom: '2.5rem',
    maxWidth: '500px',
    margin: '0 0 2.5rem',
  },
  ctaPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: '#2654B6',
    color: '#FBFCF8',
    textDecoration: 'none',
    padding: '0.9rem 1.75rem',
    borderRadius: '12px',
    fontWeight: '700',
    fontSize: '0.95rem',
    letterSpacing: '-0.01em',
    transition: 'background 0.2s, transform 0.1s',
    boxShadow: '0 4px 14px rgba(38,84,182,0.3)',
  },
  ctaGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    color: '#9AA7BE',
    textDecoration: 'none',
    padding: '0.9rem 1.25rem',
    borderRadius: '12px',
    border: '1px solid rgba(38,84,182,0.3)',
    fontSize: '0.9rem',
    transition: 'border-color 0.2s',
  },
  previewCard: {
    background: 'rgba(18, 30, 50, 0.8)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(38,84,182,0.3)',
    borderRadius: '20px',
    padding: '1.25rem',
    width: '90%',
    maxWidth: '340px',
    marginTop: '3rem',
    position: 'relative',
    zIndex: 1,
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  },
  previewAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#1A1400',
    border: '1px solid rgba(245,166,35,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#F5A623',
    fontWeight: '700',
    fontSize: '0.85rem',
  },
  proofBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    borderTop: '1px solid rgba(38,84,182,0.15)',
    borderBottom: '1px solid rgba(38,84,182,0.15)',
    padding: '1.5rem',
  },
  proofItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.2rem',
    textAlign: 'center',
    borderRight: '1px solid rgba(38,84,182,0.1)',
    padding: '0 1rem',
  },
  problemSection: {
    padding: '6rem 1.25rem',
  },
  problemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem',
    marginTop: '3rem',
  },
  problemCard: {
    background: 'rgba(18, 30, 50, 0.6)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(38,84,182,0.15)',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  section: {
    padding: '6rem 1.25rem',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '2rem',
  },
  stepCard: {
    background: 'rgba(18, 30, 50, 0.6)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(38,84,182,0.15)',
    borderRadius: '16px',
    padding: '1.5rem',
    textAlign: 'center',
    position: 'relative',
  },
  stepNumber: {
    position: 'absolute',
    top: '-0.75rem',
    right: '1rem',
    background: '#2654B6',
    color: '#FBFCF8',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '0.2rem 0.6rem',
    borderRadius: '20px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem',
  },
  featureCard: {
    background: 'rgba(18, 30, 50, 0.6)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(38,84,182,0.15)',
    borderRadius: '16px',
    padding: '1.5rem',
    transition: 'all 0.2s ease',
  },
  featureIconWrap: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '10px',
    padding: '0.6rem',
    display: 'inline-flex',
  },
  featureTag: {
    background: 'rgba(255,255,255,0.04)',
    color: '#9AA7BE',
    fontSize: '0.68rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '20px',
    fontWeight: '500',
  },
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '1rem',
  },
  testimonialCard: {
    background: 'rgba(18, 30, 50, 0.6)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(38,84,182,0.15)',
    borderRadius: '16px',
    padding: '1.5rem',
  },
  testimonialAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#1A1400',
    border: '1px solid rgba(245,166,35,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#F5A623',
    fontWeight: '700',
    fontSize: '0.85rem',
    flexShrink: 0,
  },
  pricingSection: {
    padding: '8rem 1.5rem',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(38,84,182,0.15) 0%, #0B1526 70%)',
  },
  faqItem: {
    background: 'rgba(18, 30, 50, 0.6)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(38,84,182,0.15)',
    borderRadius: '12px',
    padding: '1rem 1.25rem',
    cursor: 'pointer',
    transition: 'border-color 0.2s',
  },
  faqHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqAnswer: {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease',
    color: '#9AA7BE',
    fontSize: '0.9rem',
    lineHeight: 1.6,
  },
  footer: {
    padding: '2rem 1.5rem',
    borderTop: '1px solid rgba(38,84,182,0.15)',
    textAlign: 'center',
  },
  sectionTag: {
    display: 'inline-flex',
    color: '#F5A623',
    fontSize: '0.72rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: '1rem',
  },
  h2: {
    fontFamily: 'Space Grotesk',
    fontWeight: '700',
    fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
    color: '#FBFCF8',
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
    marginBottom: '1rem',
    textWrap: 'balance',
  },
  bodyText: {
    color: '#9AA7BE',
    fontSize: '0.92rem',
    lineHeight: 1.75,
    maxWidth: '480px',
    margin: '0 0 1rem',
  },
}
