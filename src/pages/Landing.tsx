// src/pages/Landing.tsx
import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'

// ---------- Scoped responsive CSS (lives with the component) ----------
const landingCSS = `
  .streak-container {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    padding-left: 32px;
    padding-right: 32px;
  }
  .hero { padding: 160px 0 96px; }
  .hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
    gap: 64px;
    align-items: center;
  }

  @media (max-width: 900px) {
    .hero { padding: 120px 0 72px; }
    .hero-grid { grid-template-columns: 1fr; gap: 48px; }
  }

  @media (max-width: 640px) {
    .streak-container { padding-left: 20px; padding-right: 20px; }
    .hero { padding: 104px 0 56px; }
    .hero-grid { gap: 36px; }
    .hero-ctas { flex-direction: column; align-items: stretch; gap: 10px !important; }
    .cta-full-sm { justify-content: center; width: 100%; }
    .streak-section { padding-top: 64px !important; padding-bottom: 64px !important; }
    .pricing { padding: 72px 0 !important; }
    .proof-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 20px !important; }
    .problem-row { grid-template-columns: 1fr !important; padding: 20px 22px !important; gap: 16px !important; }
    .problem-art { display: none !important; }
    .preview-card { padding: 16px !important; }
  }

  @media (max-width: 420px) {
    .streak-container { padding-left: 16px; padding-right: 16px; }
    .hero { padding: 96px 0 48px; }
    .hide-sm { display: none; }
  }
`

// ---------- Design Tokens ----------
const c = {
  bg: '#0A1424',
  surface: '#111E33',
  surfaceAlt: '#0D1929',
  border: '#1E2D45',
  ink: '#F5F7FA',
  inkSoft: '#B4BFD1',
  inkFaint: '#7E8CA5',
  accent: '#FF7A47',
  accentSoft: 'rgba(255,122,71,0.14)',
  accentBorder: 'rgba(255,122,71,0.25)',
  success: '#5FD68C',
  successSoft: 'rgba(95,214,140,0.12)',
  successBorder: 'rgba(95,214,140,0.25)',
  danger: '#FF8080',
}

// ---------- Motion presets ----------
const VIEWPORT = { once: true, margin: '-80px' } as const
const VIEWPORT_REPEAT = { once: false, margin: '-100px' } as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}
const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const wordWrap: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const wordInner: Variants = {
  hidden: { y: '110%' },
  show: { y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}
const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}
const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  show: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

// ---------- Static data ----------
const faqs = [
  { q: 'How does the accountability partner work?', a: "You get matched with another creator. Each day you both confirm each other's posts. If one doesn't post, the other gets notified. It's a mutual commitment." },
  { q: 'Is it really free?', a: "Yes, forever. No credit card required. If we ever add premium features, they'll be optional — the core system stays free." },
  { q: 'What if I miss a day?', a: 'You earn rest tokens every 14 days of consistency. Use them to protect your streak when life happens. Your streak stays intact.' },
  { q: 'Can I use it for any platform?', a: 'Absolutely. Streak works with any content platform — YouTube, Instagram, TikTok, LinkedIn, X, blogs, newsletters, you name it.' },
]

const problems = [
  { problem: '"I\'ll post tomorrow"', fix: 'Daily check-in with proof keeps you honest today.', art: 'clock' },
  { problem: '"I don\'t know what to post"', fix: 'AI generates tailored ideas in seconds.', art: 'spark' },
  { problem: '"Nobody holds me accountable"', fix: 'Your partner confirms every post. No slipping through.', art: 'people' },
  { problem: '"I keep losing my streak"', fix: 'Rest tokens protect your streak on hard days.', art: 'shield' },
]

const steps = [
  { step: '01', title: 'Set your commitment', desc: 'Choose your frequency — daily, 3x week, or custom. Define what a "post" means for you.' },
  { step: '02', title: 'Get a partner', desc: "We pair you with another creator. You confirm each other's posts. No faking it." },
  { step: '03', title: 'Track & improve', desc: 'Watch your streak grow. Get weekly summaries, celebrate milestones, stay consistent.' },
]

const features = [
  { tag: 'Core', title: 'Streak Tracking', desc: 'Track consistency your way. Post 3x a week or daily — the system adapts to your schedule.', art: 'flame' },
  { tag: 'Popular', title: 'Accountability Partner', desc: "Get matched with another creator. You both confirm each other's posts. No faking it.", art: 'link' },
  { tag: 'AI', title: 'AI Content Ideas', desc: 'Describe your niche, pick a platform. Get 5 ready-to-use ideas with hooks in seconds.', art: 'spark' },
  { tag: 'Accountability', title: 'Proof of Post', desc: 'Submit a link or screenshot when you check in. Eliminates fake streaks entirely.', art: 'shield' },
  { tag: 'Planning', title: 'Content Vault', desc: 'Capture ideas the moment they hit. Never lose a hook, concept, or title again.', art: 'vault' },
  { tag: 'Wellbeing', title: 'Rest Tokens', desc: 'Life happens. Earn rest tokens every 14 days of consistency and use them when you need a break.', art: 'gift' },
]

const testimonials = [
  { name: 'Gbohunmi', role: 'Designer', text: 'I needed a system that makes posting feel sustainable — not like a daily emergency. This is it.', hue: 18 },
  { name: 'Tolu', role: 'LinkedIn Creator', text: "My accountability partner keeps me honest. I've posted more in 30 days than all of last year.", hue: 200 },
  { name: 'Adaeze', role: 'YouTuber', text: 'The content vault alone changed how I work. Ideas go in immediately. Nothing gets lost.', hue: 280 },
]

const proof = [
  { num: '500+', label: 'Active creators' },
  { num: '10k+', label: 'Posts tracked' },
  { num: '47 days', label: 'Avg streak' },
  { num: '94%', label: 'Weekly retention' },
]

// ---------- Page ----------
export default function Landing() {
  return (
    <div style={s.page}>
      <style>{landingCSS}</style>
      <div style={s.bg} aria-hidden />
      <Nav />
      <Hero />
      <ProofBar />
      <Problem />
      <HowItWorks />
      <Features />
      <Testimonials />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  )
}

// ---------- Nav ----------
function Nav() {
  return (
    <header style={s.nav}>
      <Container style={s.navInner}>
        <Link to="/" style={s.brand}>
          <span style={s.brandMark}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0A1424" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
            </svg>
          </span>
          <span style={s.brandName}>Streak</span>
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link to="/login" style={s.navLink}>Sign in</Link>
          <Link to="/signup" style={s.navCta}>
            <span className="hide-sm">Get started</span>
            <ArrowRight size={14} />
          </Link>
        </nav>
      </Container>
    </header>
  )
}

// ---------- Hero ----------
function Hero() {
  return (
    <section className="hero" style={s.hero}>
      <Container>
        <div className="hero-grid" style={s.heroGrid}>
          <div>
            <motion.div initial="hidden" animate="show" variants={stagger}>
              <motion.div variants={fadeUp} style={s.eyebrow}>
                <span style={s.eyebrowDot} />
                For creators serious about showing up
              </motion.div>

              <motion.h1 variants={wordWrap} initial="hidden" animate="show" style={s.heroTitle}>
                <Word> The </Word>
                <Word> last </Word>
                <Word> time </Word>
                <br />
                <Word> you </Word>
                <Word accent> start </Word>
                <Word accent> over </Word>
                <Word> . </Word>
              </motion.h1>

              <motion.p variants={fadeUp} style={s.heroSub}>
                Most creators know what to post. The hard part is doing it consistently.
                Streak gives you the system, the accountability, and the tools to actually show up.
              </motion.p>

              <motion.div variants={fadeUp} className="hero-ctas" style={s.heroCtas}>
                <Link to="/signup" className="cta-full-sm" style={s.btnPrimary}>
                  Start for free <ArrowRight size={16} />
                </Link>
                <Link to="/login" className="cta-full-sm" style={s.btnGhost}>
                  I already have an account
                </Link>
              </motion.div>

              <motion.p variants={fadeUp} style={s.heroNote}>
                Free to start · No credit card · No ads, ever
              </motion.p>
            </motion.div>
          </div>

          <motion.div
            className="preview-card"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={s.previewCard}
          >
            <HeroIllustration />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

function Word({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span style={s.wordMask}>
      <motion.span variants={wordInner} style={{ ...s.word, color: accent ? c.accent : c.ink }}>
        {children}
      </motion.span>
    </span>
  )
}

// ---------- Hero illustration ----------
function HeroIllustration() {
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox="0 0 400 340" width="100%" height="auto" style={{ display: 'block', borderRadius: 12 }}>
        <defs>
          <linearGradient id="flameGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF9A6B" />
            <stop offset="100%" stopColor="#FF6B35" />
          </linearGradient>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF7A47" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF7A47" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5FD68C" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#5FD68C" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        <text x="0" y="18" fill={c.inkSoft} fontSize="10" fontWeight="600" letterSpacing="1.2">TODAY</text>
        <text x="0" y="44" fill={c.ink} fontSize="22" fontFamily="Space Grotesk, Inter" fontWeight="700">Day 47</text>

        <g transform="translate(240, 8)">
          <circle cx="55" cy="55" r="55" fill={c.accentSoft} stroke="url(#flameGrad)" strokeWidth="1.5" />
          <g transform="translate(35, 30) scale(1.6)">
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
              fill="none" stroke="url(#flameGrad)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
        </g>

        <g transform="translate(0, 90)">
          {[40, 55, 30, 70, 60, 85, 45].map((h, i) => (
            <rect
              key={i}
              x={i * 56 + 4}
              y={80 - h}
              width="44"
              height={h}
              rx="4"
              fill={i === 5 ? 'url(#flameGrad)' : 'url(#barGrad)'}
              opacity={i === 5 ? 1 : 0.55}
            />
          ))}
          <line x1="0" y1="86" x2="400" y2="86" stroke={c.border} strokeWidth="1" />
        </g>

        <path
          d="M 26 160 L 82 148 L 138 168 L 194 132 L 250 140 L 306 118 L 362 150"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <g transform="translate(0, 210)">
          <rect x="0" y="0" width="180" height="48" rx="12" fill={c.successSoft} stroke={c.successBorder} />
          <circle cx="24" cy="24" r="12" fill={c.success} opacity="0.25" />
          <path d="M18 24 L22 28 L30 20" fill="none" stroke={c.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <text x="46" y="20" fill={c.success} fontSize="11" fontWeight="700" letterSpacing="0.5">PARTNER CONFIRMED</text>
          <text x="46" y="36" fill={c.inkSoft} fontSize="10">Today at 9:14 AM</text>
        </g>

        <g transform="translate(200, 210)">
          <rect x="0" y="0" width="200" height="48" rx="12" fill={c.accentSoft} stroke={c.accentBorder} />
          <circle cx="24" cy="24" r="12" fill={c.accent} opacity="0.25" />
          <text x="24" y="28" fill={c.accent} fontSize="13" fontWeight="700" textAnchor="middle">2</text>
          <text x="46" y="20" fill={c.accent} fontSize="11" fontWeight="700" letterSpacing="0.5">REST TOKENS</text>
          <text x="46" y="36" fill={c.inkSoft} fontSize="10">Next in 12 days</text>
        </g>

        <g transform="translate(0, 285)">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <g key={i} transform={`translate(${i * 56 + 26}, 0)`}>
              <circle cx="0" cy="8" r="10" fill={i < 5 ? c.accent : c.border} opacity={i < 5 ? 0.9 : 1} />
              {i < 5 && (
                <path d="M -4 8 L -1 11 L 5 5" fill="none" stroke="#0A1424" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              )}
              <text x="0" y="32" fill={c.inkFaint} fontSize="10" textAnchor="middle">{d}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}

// ---------- Proof bar ----------
function ProofBar() {
  return (
    <section style={s.proofSection}>
      <Container>
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="proof-grid"
          style={s.proofGrid}
        >
          {proof.map((p, i) => (
            <motion.div key={i} variants={fadeUp} style={{ textAlign: 'center' }}>
              <div style={s.proofNum}>{p.num}</div>
              <div style={s.proofLabel}>{p.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}

// ---------- Problem ----------
function Problem() {
  return (
    <Section>
      <SectionHeader
        tag="The real problem"
        title={<>You don't have a talent problem.<br />You have a system problem.</>}
        body="73% of creators experience burnout not because they lack ideas, but because they lack structure. Without accountability, even the most motivated creator falls off."
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {problems.map((p, i) => (
          <motion.div
            key={i}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT_REPEAT}
            variants={i % 2 === 0 ? slideInLeft : slideInRight}
            className="problem-row"
            style={s.problemRow}
          >
            <div>
              <div style={s.problemText}>{p.problem}</div>
              <div style={s.problemFix}>{p.fix}</div>
            </div>
            <div className="problem-art" style={s.problemArt}>
              <ProblemArt kind={p.art} />
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}

function ProblemArt({ kind }: { kind: string }) {
  const stroke = c.danger
  const strokeSoft = 'rgba(255,128,128,0.35)'
  return (
    <svg viewBox="0 0 120 80" width="120" height="80">
      <defs>
        <linearGradient id={`art-${kind}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="120" height="80" rx="12" fill={`url(#art-${kind})`} />

      {kind === 'clock' && (
        <g transform="translate(60, 40)">
          <circle r="22" fill="none" stroke={stroke} strokeWidth="2" />
          <circle r="22" fill="none" stroke={strokeSoft} strokeWidth="6" />
          <line x1="0" y1="0" x2="0" y2="-12" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="0" y1="0" x2="10" y2="4" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}
      {kind === 'spark' && (
        <g transform="translate(60, 40)">
          <path d="M 0 -22 L 4 -6 L 20 0 L 4 6 L 0 22 L -4 6 L -20 0 L -4 -6 Z" fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <circle r="3" fill={stroke} />
        </g>
      )}
      {kind === 'people' && (
        <g transform="translate(60, 40)">
          <circle cx="-12" cy="-6" r="8" fill="none" stroke={stroke} strokeWidth="2" />
          <path d="M -24 14 C -24 4 -20 0 -12 0 C -4 0 0 4 0 14" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <circle cx="14" cy="-6" r="8" fill="none" stroke={stroke} strokeWidth="2" opacity="0.5" />
          <path d="M 2 14 C 2 4 6 0 14 0 C 22 0 26 4 26 14" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </g>
      )}
      {kind === 'shield' && (
        <g transform="translate(60, 40)">
          <path d="M 0 -22 C 8 -22 16 -18 20 -14 L 20 6 C 20 16 12 22 0 26 C -12 22 -20 16 -20 6 L -20 -14 C -16 -18 -8 -22 0 -22 Z" fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" />
          <path d="M -6 2 L -2 6 L 8 -4" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  )
}

// ---------- How it works ----------
function HowItWorks() {
  return (
    <Section alt>
      <SectionHeader tag="Simple system" title="How it works" align="center" />
      <motion.div
        variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}
        style={s.grid3}
      >
        {steps.map((st, i) => (
          <motion.div key={i} variants={fadeUp} style={s.stepCard}>
            <span style={s.ghostNumber} aria-hidden>{st.step}</span>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={s.stepLabel}>{st.step}</div>
              <div style={s.cardTitle}>{st.title}</div>
              <div style={s.cardBody}>{st.desc}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  )
}

// ---------- Features ----------
function Features() {
  return (
    <Section>
      <SectionHeader tag="Everything you need" title="Built for consistency" align="center" />
      <motion.div
        variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}
        style={s.grid3}
      >
        {features.map((f, i) => (
          <motion.div key={i} variants={fadeUp} style={s.card}>
            <FeatureArt kind={f.art} />
            <span style={s.featureTag}>{f.tag}</span>
            <div style={s.cardTitle}>{f.title}</div>
            <div style={s.cardBody}>{f.desc}</div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  )
}

function FeatureArt({ kind }: { kind: string }) {
  const stroke = c.accent
  const soft = 'rgba(255,122,71,0.18)'
  return (
    <svg viewBox="0 0 80 40" width="80" height="40" style={{ marginBottom: 16 }}>
      {kind === 'flame' && (
        <>
          <path d="M 12 32 C 12 24 20 22 20 14 C 20 8 26 4 32 4 C 30 12 40 16 40 26 C 40 32 34 36 26 36 C 18 36 12 36 12 32 Z" fill={soft} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="46" cy="26" r="3" fill={stroke} opacity="0.5" />
          <circle cx="56" cy="26" r="3" fill={stroke} opacity="0.35" />
          <circle cx="66" cy="26" r="3" fill={stroke} opacity="0.2" />
        </>
      )}
      {kind === 'link' && (
        <>
          <circle cx="20" cy="20" r="10" fill={soft} stroke={stroke} strokeWidth="1.5" />
          <circle cx="52" cy="20" r="10" fill={soft} stroke={stroke} strokeWidth="1.5" />
          <path d="M 26 20 L 46 20" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
          <path d="M 32 14 L 40 14" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <path d="M 32 26 L 40 26" stroke={stroke} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </>
      )}
      {kind === 'spark' && (
        <>
          <path d="M 24 4 L 26 16 L 38 20 L 26 24 L 24 36 L 22 24 L 10 20 L 22 16 Z" fill={soft} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="52" cy="12" r="2" fill={stroke} opacity="0.6" />
          <circle cx="62" cy="28" r="2" fill={stroke} opacity="0.4" />
          <circle cx="48" cy="34" r="2" fill={stroke} opacity="0.3" />
        </>
      )}
      {kind === 'shield' && (
        <>
          <path d="M 24 6 C 30 6 38 9 40 12 L 40 22 C 40 30 34 34 24 38 C 14 34 8 30 8 22 L 8 12 C 10 9 18 6 24 6 Z" fill={soft} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M 20 22 L 23 25 L 30 18" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {kind === 'vault' && (
        <>
          <rect x="10" y="8" width="36" height="26" rx="4" fill={soft} stroke={stroke} strokeWidth="1.5" />
          <circle cx="28" cy="21" r="6" fill="none" stroke={stroke} strokeWidth="1.5" />
          <circle cx="28" cy="21" r="2" fill={stroke} />
          <line x1="28" y1="21" x2="28" y2="15" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="56" cy="14" r="2" fill={stroke} opacity="0.5" />
          <circle cx="64" cy="21" r="2" fill={stroke} opacity="0.35" />
          <circle cx="56" cy="28" r="2" fill={stroke} opacity="0.2" />
        </>
      )}
      {kind === 'gift' && (
        <>
          <rect x="12" y="14" width="32" height="22" rx="3" fill={soft} stroke={stroke} strokeWidth="1.5" />
          <line x1="28" y1="14" x2="28" y2="36" stroke={stroke} strokeWidth="1.5" />
          <path d="M 20 14 C 20 8 28 8 28 14" fill="none" stroke={stroke} strokeWidth="1.5" />
          <path d="M 36 14 C 36 8 28 8 28 14" fill="none" stroke={stroke} strokeWidth="1.5" />
          <circle cx="54" cy="20" r="2" fill={stroke} opacity="0.5" />
          <circle cx="62" cy="28" r="2" fill={stroke} opacity="0.3" />
        </>
      )}
    </svg>
  )
}

// ---------- Testimonials ----------
function Testimonials() {
  return (
    <Section alt>
      <SectionHeader tag="Real creators" title="What they're saying" align="center" />
      <motion.div
        variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}
        style={s.grid3}
      >
        {testimonials.map((t, i) => (
          <motion.div key={i} variants={fadeUp} style={s.card}>
            <div style={s.stars}>★★★★★</div>
            <p style={s.quote}>"{t.text}"</p>
            <div style={s.person}>
              <div style={{ ...s.personAvatar, background: `hsl(${t.hue} 70% 55% / 0.18)`, color: `hsl(${t.hue} 80% 70%)`, borderColor: `hsl(${t.hue} 80% 60% / 0.35)` }}>
                {t.name[0]}
              </div>
              <div>
                <div style={s.personName}>{t.name}</div>
                <div style={s.personRole}>{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  )
}

// ---------- Pricing ----------
function Pricing() {
  return (
    <section className="pricing" style={s.pricing}>
      <Container>
        <motion.div
          variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}
          style={{ textAlign: 'center' }}
        >
          <motion.div variants={fadeUp} style={{ ...s.sectionTag, color: '#FF6B35' }}>Start now — it's free</motion.div>
          <motion.h2 variants={fadeUp} style={s.pricingTitle}>No credit card. No catch.</motion.h2>
          <motion.p variants={fadeUp} style={s.pricingBody}>
            Join thousands of creators building unstoppable momentum.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link to="/signup" style={{ ...s.btnPrimary, background: '#FF6B35', color: '#fff' }}>
              Create free account <ArrowRight size={16} />
            </Link>
          </motion.div>
          <motion.div variants={fadeUp} style={s.pricingChecks}>
            <span>✓ Free forever</span>
            <span>✓ No ads</span>
            <span>✓ Optional upgrades</span>
          </motion.div>
        </motion.div>
      </Container>
    </section>
  )
}

// ---------- FAQ ----------
function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <Section>
      <SectionHeader tag="Questions?" title="Frequently asked" align="center" />
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {faqs.map((f, i) => {
          const isOpen = open === i
          return (
            <div
              key={i}
              style={{ ...s.faqItem, borderColor: isOpen ? c.accent : c.border }}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setOpen(isOpen ? null : i)
                }
              }}
            >
              <div style={s.faqHeader}>
                <span style={s.faqQ}>{f.q}</span>
                <ChevronDown
                  size={18}
                  color={isOpen ? c.accent : c.inkSoft}
                  style={{
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease, color 0.2s ease',
                    flexShrink: 0,
                  }}
                />
              </div>
              <div style={{ ...s.faqA, maxHeight: isOpen ? 240 : 0, opacity: isOpen ? 1 : 0, marginTop: isOpen ? 8 : 0 }}>
                {f.a}
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

// ---------- Footer ----------
function Footer() {
  return (
    <footer style={s.footer}>
      <Container>
        <div style={s.footerInner}>
          <div>
            <Link to="/" style={s.brand}>
              <span style={s.brandMark}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A1424" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
                </svg>
              </span>
              <span style={s.brandName}>Streak</span>
            </Link>
            <p style={s.footerTag}>Built for creators who are serious about consistency.</p>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <Link to="/login" style={s.footerLink}>Sign in</Link>
            <Link to="/signup" style={s.footerLink}>Sign up</Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}

// ---------- Shared ----------
function Container({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={`streak-container ${className ?? ''}`} style={style}>
      {children}
    </div>
  )
}

function Section({ children, alt }: { children: React.ReactNode; alt?: boolean }) {
  return (
    <section className="streak-section" style={{ ...s.section, background: alt ? c.surfaceAlt : 'transparent' }}>
      <Container>{children}</Container>
    </section>
  )
}

function SectionHeader({ tag, title, body, align = 'left' }: { tag: string; title: React.ReactNode; body?: string; align?: 'left' | 'center' }) {
  return (
    <motion.div
      variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}
      style={{ textAlign: align, maxWidth: 640, margin: align === 'center' ? '0 auto 48px' : '0 0 48px' }}
    >
      <motion.div variants={fadeUp} style={s.sectionTag}>{tag}</motion.div>
      <motion.h2 variants={fadeUp} style={s.h2}>{title}</motion.h2>
      {body && <motion.p variants={fadeUp} style={s.bodyText}>{body}</motion.p>}
    </motion.div>
  )
}

// ---------- Styles ----------
const s: Record<string, React.CSSProperties> = {
  page: {
    background: c.bg, minHeight: '100vh', color: c.ink,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    overflowX: 'hidden', position: 'relative',
  },
  bg: {
    position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
    background:
      'radial-gradient(circle 520px at 12% 8%, rgba(255,122,71,0.10), transparent 70%),' +
      'radial-gradient(circle 620px at 92% 42%, rgba(58,111,224,0.08), transparent 70%)',
  },
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: 'rgba(10,20,36,0.9)', borderBottom: `1px solid ${c.border}`,
  },
  navInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 },
  brand: { display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' },
  brandMark: { width: 28, height: 28, borderRadius: 8, background: c.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: '"Space Grotesk", Inter, sans-serif', fontWeight: 700, fontSize: 17, color: c.ink, letterSpacing: '-0.01em' },
  navLink: { color: c.inkSoft, fontSize: 14, fontWeight: 500, padding: '8px 12px', textDecoration: 'none' },
  navCta: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: c.accent, color: c.bg, fontSize: 14, fontWeight: 700,
    padding: '9px 16px', borderRadius: 10, textDecoration: 'none',
  },

  hero: { position: 'relative', zIndex: 1 },
  heroGrid: { alignItems: 'center' },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    color: c.accent, fontSize: 13, fontWeight: 600,
    letterSpacing: '.04em', textTransform: 'uppercase', marginBottom: 24,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: '50%', background: c.accent, display: 'inline-block' },
  heroTitle: {
    fontFamily: '"Space Grotesk", Inter, sans-serif', fontWeight: 800,
    fontSize: 'clamp(34px, 8vw, 84px)', lineHeight: 1.05,
    letterSpacing: '-0.035em', color: c.ink, margin: '0 0 24px',
  },
  wordMask: { display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.12em' },
  word: { display: 'inline-block' },
  heroSub: { color: c.inkSoft, fontSize: 17, lineHeight: 1.7, maxWidth: 520, margin: '0 0 36px' },
  heroCtas: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: c.accent, color: c.bg, padding: '14px 24px', borderRadius: 12,
    fontWeight: 700, fontSize: 15, textDecoration: 'none',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.04)', color: c.ink,
    padding: '14px 20px', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.12)',
    fontWeight: 500, fontSize: 15, textDecoration: 'none',
  },
  heroNote: { color: c.inkFaint, fontSize: 13, margin: 0 },

  previewCard: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: 20, padding: 24 },

  proofSection: {
    padding: '32px 0', borderTop: `1px solid ${c.border}`, borderBottom: `1px solid ${c.border}`,
    background: 'rgba(13,25,41,0.6)', position: 'relative', zIndex: 1,
  },
  proofGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  proofNum: { fontFamily: '"Space Grotesk", Inter, sans-serif', fontWeight: 800, fontSize: 24, color: c.accent, marginBottom: 4 },
  proofLabel: { color: c.inkSoft, fontSize: 13 },

  section: { padding: '96px 0', position: 'relative', zIndex: 1 },
  sectionTag: { display: 'inline-block', color: c.accent, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 14 },
  h2: {
    fontFamily: '"Space Grotesk", Inter, sans-serif', fontWeight: 700,
    fontSize: 'clamp(24px, 3.5vw, 40px)', color: c.ink, lineHeight: 1.15,
    letterSpacing: '-0.02em', margin: '0 0 16px',
  },
  bodyText: { color: c.inkSoft, fontSize: 17, lineHeight: 1.7, maxWidth: 560, margin: 0 },

  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 },

  problemRow: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: 24,
    alignItems: 'center',
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 16,
    padding: '24px 28px',
  },
  problemArt: { display: 'flex', alignItems: 'center' },
  problemText: {
    color: c.danger, fontSize: 19, fontWeight: 600, marginBottom: 8,
    fontFamily: '"Space Grotesk", Inter, sans-serif', letterSpacing: '-0.01em',
  },
  problemFix: { color: c.inkSoft, fontSize: 15, lineHeight: 1.6 },

  card: { background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 28 },
  cardTitle: { fontWeight: 600, fontSize: 17, color: c.ink, marginBottom: 8 },
  cardBody: { color: c.inkSoft, fontSize: 15, lineHeight: 1.6 },

  stepCard: {
    position: 'relative',
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 16,
    padding: 28,
    overflow: 'hidden',
  },
  ghostNumber: {
    position: 'absolute',
    top: -28,
    right: 8,
    fontFamily: '"Space Grotesk", Inter, sans-serif',
    fontWeight: 800,
    fontSize: 140,
    lineHeight: 1,
    color: c.ink,
    opacity: 0.05,
    letterSpacing: '-0.06em',
    pointerEvents: 'none',
    userSelect: 'none',
  },
  stepLabel: {
    fontFamily: '"Space Grotesk", Inter, sans-serif',
    fontWeight: 800, fontSize: 14, color: c.accent,
    letterSpacing: '.1em', marginBottom: 16,
  },

  featureTag: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.06)', color: c.inkSoft,
    fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
    textTransform: 'uppercase', letterSpacing: '.05em',
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: 16,
  },

  stars: { color: c.accent, fontSize: 14, letterSpacing: 2, marginBottom: 14 },
  quote: { color: c.ink, fontSize: 15, lineHeight: 1.65, margin: '0 0 20px' },
  person: { display: 'flex', alignItems: 'center', gap: 12 },
  personAvatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: c.accentSoft, color: c.accent,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 15, flexShrink: 0,
    border: `1px solid ${c.accentBorder}`,
  },
  personName: { fontWeight: 600, fontSize: 14, color: c.ink },
  personRole: { color: c.inkSoft, fontSize: 12 },

  pricing: { background: '#FAFAF7', color: '#0F2544', position: 'relative', zIndex: 1 },
  pricingTitle: {
    fontFamily: '"Space Grotesk", Inter, sans-serif', fontWeight: 700,
    fontSize: 'clamp(26px, 4.5vw, 48px)', color: '#0F2544',
    letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0 0 16px',
  },
  pricingBody: { color: '#5A6B85', fontSize: 17, lineHeight: 1.7, maxWidth: 480, margin: '0 auto 40px' },
  pricingChecks: { display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', fontSize: 14, color: '#5A6B85', marginTop: 16, fontWeight: 500 },

  faqItem: {
    background: c.surface, border: `1px solid ${c.border}`, borderRadius: 12,
    padding: '18px 22px', cursor: 'pointer', transition: 'border-color 0.15s ease', outline: 'none',
  },
  faqHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  faqQ: { fontWeight: 600, fontSize: 15, color: c.ink },
  faqA: {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease',
    color: c.inkSoft, fontSize: 15, lineHeight: 1.65,
  },

  footer: { padding: '40px 0', borderTop: `1px solid ${c.border}`, background: c.bg, position: 'relative', zIndex: 1 },
  footerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 },
  footerTag: { color: c.inkSoft, fontSize: 14, margin: '12px 0 0' },
  footerLink: { color: c.inkSoft, fontSize: 14, fontWeight: 500, textDecoration: 'none' },
}
