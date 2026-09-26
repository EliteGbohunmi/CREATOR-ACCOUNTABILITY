// src/Landing.tsx
import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import { useState } from 'react'
import { ArrowRight, ChevronDown } from 'lucide-react'

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

// ---------- Motion presets (cheap: opacity + transform only) ----------
const VIEWPORT = { once: true, margin: '-80px' } as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}

// Word-mask reveal for the hero headline
const wordWrap: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
}
const wordInner: Variants = {
  hidden: { y: '110%' },
  show: { y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

// ---------- Static data ----------
const faqs = [
  { q: 'How does the accountability partner work?', a: "You get matched with another creator. Each day you both confirm each other's posts. If one doesn't post, the other gets notified. It's a mutual commitment." },
  { q: 'Is it really free?', a: "Yes, forever. No credit card required. If we ever add premium features, they'll be optional — the core system stays free." },
  { q: 'What if I miss a day?', a: 'You earn rest tokens every 14 days of consistency. Use them to protect your streak when life happens. Your streak stays intact.' },
  { q: 'Can I use it for any platform?', a: 'Absolutely. Streak works with any content platform — YouTube, Instagram, TikTok, LinkedIn, X, blogs, newsletters, you name it.' },
]

const problems = [
  { problem: '"I\'ll post tomorrow"', fix: 'Daily check-in with proof keeps you honest today.' },
  { problem: '"I don\'t know what to post"', fix: 'AI generates tailored ideas in seconds.' },
  { problem: '"Nobody holds me accountable"', fix: 'Your partner confirms every post. No slipping through.' },
  { problem: '"I keep losing my streak"', fix: 'Rest tokens protect your streak on hard days.' },
]

const steps = [
  { step: '01', title: 'Set your commitment', desc: 'Choose your frequency — daily, 3x week, or custom. Define what a "post" means for you.' },
  { step: '02', title: 'Get a partner', desc: "We pair you with another creator. You confirm each other's posts. No faking it." },
  { step: '03', title: 'Track & improve', desc: 'Watch your streak grow. Get weekly summaries, celebrate milestones, stay consistent.' },
]

const features = [
  { tag: 'Core', title: 'Streak Tracking', desc: 'Track consistency your way. Post 3x a week or daily — the system adapts to your schedule.' },
  { tag: 'Popular', title: 'Accountability Partner', desc: "Get matched with another creator. You both confirm each other's posts. No faking it." },
  { tag: 'AI', title: 'AI Content Ideas', desc: 'Describe your niche, pick a platform. Get 5 ready-to-use ideas with hooks in seconds.' },
  { tag: 'Accountability', title: 'Proof of Post', desc: 'Submit a link or screenshot when you check in. Eliminates fake streaks entirely.' },
  { tag: 'Planning', title: 'Content Vault', desc: 'Capture ideas the moment they hit. Never lose a hook, concept, or title again.' },
  { tag: 'Wellbeing', title: 'Rest Tokens', desc: 'Life happens. Earn rest tokens every 14 days of consistency and use them when you need a break.' },
]

const testimonials = [
  { name: 'Gbohunmi', role: 'Designer', text: 'I needed a system that makes posting feel sustainable — not like a daily emergency. This is it.' },
  { name: 'Tolu', role: 'LinkedIn Creator', text: "My accountability partner keeps me honest. I've posted more in 30 days than all of last year." },
  { name: 'Adaeze', role: 'YouTuber', text: 'The content vault alone changed how I work. Ideas go in immediately. Nothing gets lost.' },
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
            <span>Get started</span>
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
    <section style={s.hero}>
      <Container>
        <div style={s.heroGrid}>
          {/* Left — text with animations */}
          <div>
            <motion.div
              initial="hidden" animate="show" variants={stagger}
            >
              <motion.div variants={fadeUp} style={s.eyebrow}>
                <span style={s.eyebrowDot} />
                For creators serious about showing up
              </motion.div>

              {/* Word-by-word headline reveal */}
              <motion.h1
                variants={wordWrap}
                initial="hidden"
                animate="show"
                style={s.heroTitle}
              >
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

              <motion.div variants={fadeUp} style={s.heroCtas}>
                <Link to="/signup" style={s.btnPrimary}>
                  Start for free <ArrowRight size={16} />
                </Link>
                <Link to="/login" style={s.btnGhost}>
                  I already have an account
                </Link>
              </motion.div>

              <motion.p variants={fadeUp} style={s.heroNote}>
                Free to start · No credit card · No ads, ever
              </motion.p>
            </motion.div>
          </div>

          {/* Right — preview card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={s.previewCard}
          >
            <PreviewCard />
          </motion.div>
        </div>
      </Container>
    </section>
  )
}

// Word component — clips a single word and slides it up
function Word({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span style={s.wordMask}>
      <motion.span
        variants={wordInner}
        style={{ ...s.word, color: accent ? c.accent : c.ink }}
      >
        {children}
      </motion.span>
    </span>
  )
}

function PreviewCard() {
  return (
    <>
      <div style={s.previewTop}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={s.avatar}>S</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: c.ink }}>Sarah K.</div>
            <div style={{ color: c.inkSoft, fontSize: 12 }}>YouTube Creator</div>
          </div>
        </div>
        <div style={s.badgeSuccess}>Posted today</div>
      </div>

      <div style={s.streakRow}>
        <div>
          <div style={s.streakNum}>47</div>
          <div style={{ color: c.inkSoft, fontSize: 12 }}>day streak</div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={s.microLabel}>Best</div>
          <div style={{ fontWeight: 700, fontSize: 18, color: c.ink }}>47</div>
        </div>
      </div>

      <div style={s.streakBar}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ ...s.streakSeg, background: i < 5 ? c.accent : c.border }} />
        ))}
      </div>

      <div style={s.partnerRow}>
        <div style={{ color: c.inkSoft, fontSize: 12 }}>2 days to next milestone</div>
        <div style={s.partnerChip}>Partner confirmed</div>
      </div>
    </>
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
      <motion.div
        variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}
        style={s.grid4}
      >
        {problems.map((p, i) => (
          <motion.div key={i} variants={fadeUp} style={s.card}>
            <div style={s.problemText}>{p.problem}</div>
            <div style={s.problemFix}>{p.fix}</div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
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
          <motion.div key={i} variants={fadeUp} style={s.card}>
            <span style={s.stepNum}>{st.step}</span>
            <div style={s.cardTitle}>{st.title}</div>
            <div style={s.cardBody}>{st.desc}</div>
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
            <span style={s.featureTag}>{f.tag}</span>
            <div style={s.cardTitle}>{f.title}</div>
            <div style={s.cardBody}>{f.desc}</div>
          </motion.div>
        ))}
      </motion.div>
    </Section>
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
              <div style={s.personAvatar}>{t.name[0]}</div>
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
    <section style={s.pricing}>
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
              style={{
                ...s.faqItem,
                borderColor: isOpen ? c.accent : c.border,
              }}
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
              <div
                style={{
                  ...s.faqA,
                  maxHeight: isOpen ? 240 : 0,
                  opacity: isOpen ? 1 : 0,
                  marginTop: isOpen ? 8 : 0,
                }}
              >
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
function Container({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', width: '100%', ...style }}>
      {children}
    </div>
  )
}

function Section({ children, alt }: { children: React.ReactNode; alt?: boolean }) {
  return (
    <section style={{ ...s.section, background: alt ? c.surfaceAlt : 'transparent' }}>
      <Container>{children}</Container>
    </section>
  )
}

function SectionHeader({
  tag, title, body, align = 'left',
}: { tag: string; title: React.ReactNode; body?: string; align?: 'left' | 'center' }) {
  return (
    <motion.div
      variants={stagger} initial="hidden" whileInView="show" viewport={VIEWPORT}
      style={{
        textAlign: align,
        maxWidth: 640,
        margin: align === 'center' ? '0 auto 48px' : '0 0 48px',
      }}
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
    background: c.bg,
    minHeight: '100vh',
    color: c.ink,
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    overflowX: 'hidden',
    position: 'relative',
  },
  bg: {
    position: 'fixed', inset: 0, zIndex: 0,
    pointerEvents: 'none',
    background:
      'radial-gradient(circle 520px at 12% 8%, rgba(255,122,71,0.10), transparent 70%),' +
      'radial-gradient(circle 620px at 92% 42%, rgba(58,111,224,0.08), transparent 70%)',
  },

  // Nav
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
    background: 'rgba(10,20,36,0.9)',
    borderBottom: `1px solid ${c.border}`,
  },
  navInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 },
  brand: { display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' },
  brandMark: {
    width: 28, height: 28, borderRadius: 8,
    background: c.accent,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  brandName: {
    fontFamily: '"Space Grotesk", Inter, sans-serif',
    fontWeight: 700, fontSize: 17, color: c.ink, letterSpacing: '-0.01em',
  },
  navLink: { color: c.inkSoft, fontSize: 14, fontWeight: 500, padding: '8px 12px', textDecoration: 'none' },
  navCta: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: c.accent, color: c.bg,
    fontSize: 14, fontWeight: 700,
    padding: '9px 16px', borderRadius: 10, textDecoration: 'none',
  },

  // Hero
  hero: { padding: '160px 0 96px', position: 'relative', zIndex: 1 },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
    gap: 64,
    alignItems: 'center',
  },
  eyebrow: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    color: c.accent, fontSize: 13, fontWeight: 600,
    letterSpacing: '.04em', textTransform: 'uppercase',
    marginBottom: 24,
  },
  eyebrowDot: { width: 6, height: 6, borderRadius: '50%', background: c.accent, display: 'inline-block' },
  heroTitle: {
    fontFamily: '"Space Grotesk", Inter, sans-serif',
    fontWeight: 800,
    fontSize: 'clamp(44px, 6.5vw, 84px)',
    lineHeight: 1.02,
    letterSpacing: '-0.035em',
    color: c.ink,
    margin: '0 0 24px',
  },
  wordMask: {
    display: 'inline-block',
    overflow: 'hidden',
    verticalAlign: 'top',
    paddingBottom: '0.12em',
  },
  word: { display: 'inline-block' },
  heroSub: {
    color: c.inkSoft, fontSize: 17, lineHeight: 1.7,
    maxWidth: 520, margin: '0 0 36px',
  },
  heroCtas: { display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 },
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    background: c.accent, color: c.bg,
    padding: '14px 24px', borderRadius: 12,
    fontWeight: 700, fontSize: 15,
    textDecoration: 'none',
  },
  btnGhost: {
    display: 'inline-flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.04)', color: c.ink,
    padding: '14px 20px', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.12)',
    fontWeight: 500, fontSize: 15, textDecoration: 'none',
  },
  heroNote: { color: c.inkFaint, fontSize: 13, margin: 0 },

  // Preview card
  previewCard: {
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 20,
    padding: 24,
  },
  previewTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  avatar: {
    width: 40, height: 40, borderRadius: '50%',
    background: c.accentSoft, color: c.accent,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 15,
    border: `1px solid ${c.accentBorder}`,
  },
  badgeSuccess: {
    display: 'inline-flex', alignItems: 'center',
    background: c.successSoft, color: c.success,
    fontSize: 12, fontWeight: 600,
    padding: '5px 10px', borderRadius: 20,
    border: `1px solid ${c.successBorder}`,
  },
  streakRow: { display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 },
  streakNum: {
    fontFamily: '"Space Grotesk", Inter, sans-serif',
    fontWeight: 800, fontSize: 44, color: c.accent, lineHeight: 1,
  },
  microLabel: { color: c.inkFaint, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 },
  streakBar: { display: 'flex', gap: 4, marginBottom: 14 },
  streakSeg: { flex: 1, height: 4, borderRadius: 999 },
  partnerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  partnerChip: {
    display: 'inline-flex', alignItems: 'center',
    background: c.successSoft, color: c.success,
    fontSize: 12, fontWeight: 600,
    padding: '5px 10px', borderRadius: 20,
    border: `1px solid ${c.successBorder}`,
  },

  // Proof
  proofSection: {
    padding: '32px 0',
    borderTop: `1px solid ${c.border}`,
    borderBottom: `1px solid ${c.border}`,
    background: 'rgba(13,25,41,0.6)',
    position: 'relative', zIndex: 1,
  },
  proofGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  proofNum: {
    fontFamily: '"Space Grotesk", Inter, sans-serif',
    fontWeight: 800, fontSize: 24, color: c.accent, marginBottom: 4,
  },
  proofLabel: { color: c.inkSoft, fontSize: 13 },

  // Sections
  section: { padding: '96px 0', position: 'relative', zIndex: 1 },
  sectionTag: {
    display: 'inline-block', color: c.accent,
    fontSize: 12, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '.1em',
    marginBottom: 14,
  },
  h2: {
    fontFamily: '"Space Grotesk", Inter, sans-serif',
    fontWeight: 700,
    fontSize: 'clamp(28px, 3.5vw, 40px)',
    color: c.ink, lineHeight: 1.15,
    letterSpacing: '-0.02em', margin: '0 0 16px',
  },
  bodyText: { color: c.inkSoft, fontSize: 17, lineHeight: 1.7, maxWidth: 560, margin: 0 },

  // Cards
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 },
  card: {
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 16,
    padding: 28,
  },
  cardTitle: { fontWeight: 600, fontSize: 17, color: c.ink, marginBottom: 8 },
  cardBody: { color: c.inkSoft, fontSize: 15, lineHeight: 1.6 },

  problemText: {
    color: c.danger,
    fontSize: 17,
    fontWeight: 600,
    marginBottom: 10,
    fontFamily: '"Space Grotesk", Inter, sans-serif',
    letterSpacing: '-0.01em',
  },
  problemFix: { color: c.inkSoft, fontSize: 15, lineHeight: 1.6 },

  stepNum: {
    display: 'block',
    fontFamily: '"Space Grotesk", Inter, sans-serif',
    fontWeight: 800, fontSize: 15,
    color: c.accent, letterSpacing: '.06em',
    marginBottom: 20,
  },

  featureTag: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.06)', color: c.inkSoft,
    fontSize: 11, fontWeight: 600,
    padding: '4px 10px', borderRadius: 20,
    textTransform: 'uppercase', letterSpacing: '.05em',
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: 20,
  },

  // Testimonials
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

  // Pricing
  pricing: {
    padding: '112px 0',
    background: '#FAFAF7',
    color: '#0F2544',
    position: 'relative', zIndex: 1,
  },
  pricingTitle: {
    fontFamily: '"Space Grotesk", Inter, sans-serif',
    fontWeight: 700,
    fontSize: 'clamp(32px, 4.5vw, 48px)',
    color: '#0F2544',
    letterSpacing: '-0.025em',
    lineHeight: 1.1,
    margin: '0 0 16px',
  },
  pricingBody: {
    color: '#5A6B85',
    fontSize: 17, lineHeight: 1.7,
    maxWidth: 480, margin: '0 auto 40px',
  },
  pricingChecks: {
    display: 'flex', gap: 24, flexWrap: 'wrap',
    justifyContent: 'center',
    fontSize: 14, color: '#5A6B85',
    marginTop: 16, fontWeight: 500,
  },

  // FAQ
  faqItem: {
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 12,
    padding: '18px 22px',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease',
    outline: 'none',
  },
  faqHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  faqQ: { fontWeight: 600, fontSize: 15, color: c.ink },
  faqA: {
    overflow: 'hidden',
    transition: 'max-height 0.3s ease, opacity 0.3s ease, margin 0.3s ease',
    color: c.inkSoft,
    fontSize: 15,
    lineHeight: 1.65,
  },

  // Footer
  footer: {
    padding: '40px 0',
    borderTop: `1px solid ${c.border}`,
    background: c.bg,
    position: 'relative', zIndex: 1,
  },
  footerInner: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 },
  footerTag: { color: c.inkSoft, fontSize: 14, margin: '12px 0 0' },
  footerLink: { color: c.inkSoft, fontSize: 14, fontWeight: 500, textDecoration: 'none' },
}
