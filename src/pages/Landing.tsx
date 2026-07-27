import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame, ArrowRight, CheckCircle2, Users, Shield, Zap, BarChart2, BookOpen } from 'lucide-react'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } }
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } }
}

export default function Landing() {
  return (
    <div style={s.page}>

      {/* Nav */}
      <motion.nav style={s.nav} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={s.navLogo}><Flame size={16} color="#F5A623" /></div>
          <span style={s.navBrand}>Streak</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link to="/login" style={s.navLink}>Sign in</Link>
          <Link to="/signup" style={s.navCta}>Get started <ArrowRight size={13} color="#0A0A0A" /></Link>
        </div>
      </motion.nav>

      {/* Hero */}
      <section style={s.hero}>
        <div style={s.glow} />
        <motion.div variants={stagger} initial="hidden" animate="show" style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 1.25rem', maxWidth: '600px', margin: '0 auto' }}>
          <motion.div variants={fadeUp} style={s.eyebrow}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F5A623', display: 'inline-block' }} />
            For creators who are serious about showing up
          </motion.div>
          <motion.h1 variants={fadeUp} style={s.heroTitle}>
            The last time<br /><span style={{ color: '#F5A623' }}>you start over.</span>
          </motion.h1>
          <motion.p variants={fadeUp} style={s.heroSub}>
            Most creators know what to post. The hard part is doing it consistently. Streak gives you the system, the accountability, and the tools to actually show up.
          </motion.p>
          <motion.div variants={fadeUp} style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" style={s.ctaPrimary}>Start for free <ArrowRight size={16} color="#0A0A0A" /></Link>
            <Link to="/login" style={s.ctaGhost}>Already have an account</Link>
          </motion.div>
          <motion.p variants={fadeUp} style={{ color: '#333', fontSize: '0.75rem', marginTop: '1.25rem' }}>
            Free to start · No credit card needed
          </motion.p>
        </motion.div>

        {/* Preview card */}
        <motion.div
          style={s.previewCard}
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6, ease: 'easeOut' as const }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={s.previewAvatar}>S</div>
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>Sarah K.</div>
                <div style={{ color: '#555', fontSize: '0.72rem' }}>YouTube Creator</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={14} color="#4CAF50" />
              <span style={{ color: '#4CAF50', fontSize: '0.75rem', fontWeight: '500' }}>Posted today</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: '#1A1400', borderRadius: '10px', padding: '0.6rem' }}>
              <Flame size={20} color="#F5A623" />
            </div>
            <div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '2.2rem', color: '#F5A623', lineHeight: 1 }}>47</div>
              <div style={{ color: '#555', fontSize: '0.72rem' }}>day streak</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ color: '#444', fontSize: '0.68rem' }}>Best</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1.1rem' }}>47</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.75rem' }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: '3px', borderRadius: '999px', background: i < 5 ? '#F5A623' : '#2A2A2A' }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#444', fontSize: '0.7rem' }}>2 days to next milestone</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#0D2010', border: '1px solid #4CAF5020', borderRadius: '20px', padding: '0.2rem 0.65rem' }}>
              <CheckCircle2 size={11} color="#4CAF50" />
              <span style={{ color: '#4CAF50', fontSize: '0.7rem' }}>Partner confirmed</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats bar */}
      <section style={s.statsBar}>
        {[
          { num: '500+', label: 'Active creators' },
          { num: '10k+', label: 'Posts tracked' },
          { num: '47 days', label: 'Avg streak' },
          { num: '94%', label: 'Weekly retention' },
        ].map((item, i) => (
          <div key={i} style={s.statItem}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '1.4rem', color: '#F5A623' }}>{item.num}</div>
            <div style={{ color: '#444', fontSize: '0.72rem' }}>{item.label}</div>
          </div>
        ))}
      </section>

      {/* Problem section */}
      <section style={s.section}>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <motion.div variants={fadeUp} style={s.tag}>The real problem</motion.div>
          <motion.h2 variants={fadeUp} style={s.h2}>You don't have a talent problem.<br />You have a system problem.</motion.h2>
          <motion.p variants={fadeUp} style={s.bodyText}>73% of creators experience burnout — not because they lack ideas, but because they lack structure. Without accountability, even the most motivated creator falls off.</motion.p>
        </motion.div>

        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} style={s.grid2}>
          {[
            { emoji: '😮‍💨', problem: '"I\'ll post tomorrow"', fix: 'Daily check-in with proof keeps you honest today.' },
            { emoji: '😶', problem: '"I don\'t know what to post"', fix: 'AI generates tailored ideas in seconds.' },
            { emoji: '😔', problem: '"Nobody holds me accountable"', fix: 'Your partner confirms every post. No slipping through.' },
            { emoji: '🔁', problem: '"I keep losing my streak"', fix: 'Rest tokens protect your streak on hard days.' },
          ].map((item, i) => (
            <motion.div key={i} variants={fadeUp} style={s.problemCard}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{item.emoji}</div>
              <div style={{ color: '#E53E3E', fontSize: '0.85rem', fontWeight: '500', marginBottom: '0.5rem' }}>{item.problem}</div>
              <div style={{ color: '#555', fontSize: '0.82rem', lineHeight: 1.5 }}>{item.fix}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section style={s.section}>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <motion.div variants={fadeUp} style={s.tag}>Features</motion.div>
          <motion.h2 variants={fadeUp} style={s.h2}>Built around how creators actually work</motion.h2>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} style={s.grid3}>
          {[
            { icon: <Flame size={18} color="#F5A623" />, title: 'Streak Tracking', desc: 'Track consistency your way. Post 3x a week or daily — the system adapts to your schedule.', tag: 'Core' },
            { icon: <Users size={18} color="#4CAF50" />, title: 'Accountability Partners', desc: 'Get matched with another creator. You both confirm each other\'s posts. No faking it.', tag: 'Popular' },
            { icon: <Zap size={18} color="#2196F3" />, title: 'AI Content Ideas', desc: 'Describe your niche, pick a platform. Get 5 ready-to-use ideas with hooks in seconds.', tag: 'AI' },
            { icon: <Shield size={18} color="#9C27B0" />, title: 'Proof of Post', desc: 'Submit a link or screenshot. Your partner confirms it. Eliminates fake streaks.', tag: 'Accountability' },
            { icon: <BookOpen size={18} color="#F5A623" />, title: 'Content Vault', desc: 'Capture ideas the moment they hit. Never lose a hook, concept, or title again.', tag: 'Planning' },
            { icon: <BarChart2 size={18} color="#FF5722" />, title: 'Analytics', desc: 'See your posting patterns, platform breakdown, and consistency score over 30 days.', tag: 'Insights' },
          ].map((f, i) => (
            <motion.div key={i} variants={fadeUp} style={s.featureCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={s.featureIcon}>{f.icon}</div>
                <span style={s.featureTag}>{f.tag}</span>
              </div>
              <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '0.4rem' }}>{f.title}</div>
              <div style={{ color: '#555', fontSize: '0.82rem', lineHeight: 1.6 }}>{f.desc}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How it works */}
      <section style={s.section}>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <motion.div variants={fadeUp} style={s.tag}>How it works</motion.div>
          <motion.h2 variants={fadeUp} style={s.h2}>Simple by design</motion.h2>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { step: '01', title: 'Set your posting schedule', desc: 'Tell us how often you want to post. Daily, 3x a week, whatever works for you.' },
            { step: '02', title: 'Find an accountability partner', desc: 'Search for another creator and send a partner request. They keep you honest.' },
            { step: '03', title: 'Check in with proof', desc: 'Post your content, submit a link or screenshot, your partner confirms it.' },
            { step: '04', title: 'Track your consistency', desc: 'Watch your streak grow, earn achievements, and see your progress on the heatmap.' },
          ].map((item, i) => (
            <motion.div key={i} variants={fadeUp} style={s.stepCard}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: '1.1rem', color: '#F5A623', flexShrink: 0, minWidth: '32px' }}>{item.step}</div>
              <div>
                <div style={{ fontWeight: '600', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{item.title}</div>
                <div style={{ color: '#555', fontSize: '0.82rem', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Testimonials */}
      <section style={s.section}>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <motion.div variants={fadeUp} style={s.tag}>Real creators</motion.div>
          <motion.h2 variants={fadeUp} style={s.h2}>What they're saying</motion.h2>
        </motion.div>
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} style={s.grid3}>
          {[
            { name: 'Gbohunmi', role: 'Designer', text: 'I needed a system that makes posting feel sustainable — not like a daily emergency. This is it.' },
            { name: 'Tolu', role: 'LinkedIn Creator', text: 'My accountability partner keeps me honest. I\'ve posted more in 30 days than all of last year.' },
            { name: 'Adaeze', role: 'YouTuber', text: 'The content vault alone changed how I work. Ideas go in immediately. Nothing gets lost.' },
          ].map((t, i) => (
            <motion.div key={i} variants={fadeUp} style={s.testimonialCard}>
              <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem' }}>
                {Array.from({ length: 5 }).map((_, j) => <span key={j} style={{ color: '#F5A623' }}>★</span>)}
              </div>
              <p style={{ color: '#888', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1.25rem' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={s.tAvatar}>{t.name[0]}</div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{t.name}</div>
                  <div style={{ color: '#555', fontSize: '0.75rem' }}>{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Final CTA */}
      <section style={s.finalCta}>
        <div style={s.glow} />
        <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }} style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 1.25rem' }}>
          <motion.div variants={fadeUp} style={s.tag}>Get started today</motion.div>
          <motion.h2 variants={fadeUp} style={{ ...s.h2, fontSize: 'clamp(1.8rem, 5vw, 2.5rem)' }}>
            Your next streak<br />starts right now.
          </motion.h2>
          <motion.p variants={fadeUp} style={{ ...s.bodyText, marginBottom: '2rem' }}>
            Join creators who stopped making excuses and started showing up.
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link to="/signup" style={s.ctaPrimary}>Create free account <ArrowRight size={16} color="#0A0A0A" /></Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer style={s.footer}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Flame size={15} color="#F5A623" />
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: '700', color: '#F0EDE8', fontSize: '0.9rem' }}>Streak</span>
        </div>
        <p style={{ color: '#333', fontSize: '0.75rem', marginBottom: '1rem' }}>Built for creators who are serious about consistency.</p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link to="/login" style={{ color: '#333', fontSize: '0.75rem', textDecoration: 'none' }}>Sign in</Link>
          <Link to="/signup" style={{ color: '#333', fontSize: '0.75rem', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </footer>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page: { background: '#0A0A0A', minHeight: '100vh', color: '#F0EDE8', fontFamily: 'Inter', overflowX: 'hidden' },
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1A1A1A' },
  navLogo: { background: '#1A1400', borderRadius: '8px', padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navBrand: { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1rem', color: '#F0EDE8' },
  navLink: { color: '#666', fontSize: '0.85rem', textDecoration: 'none', padding: '0.5rem 0.75rem' },
  navCta: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#F5A623', color: '#0A0A0A', fontSize: '0.82rem', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: '700' },
  hero: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '5rem', paddingBottom: '3rem', position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse 80% 60% at 50% 0%, #1A1000 0%, #0A0A0A 70%)' },
  glow: { position: 'absolute', top: '-20%', left: '20%', width: '60%', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, #F5A62308 0%, transparent 70%)', pointerEvents: 'none' },
  eyebrow: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#F5A623', fontSize: '0.75rem', fontWeight: '500', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.5rem' },
  heroTitle: { fontFamily: 'Space Grotesk', fontWeight: '800', fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', lineHeight: 1.05, marginBottom: '1.5rem', color: '#F0EDE8', letterSpacing: '-0.02em' },
  heroSub: { color: '#555', fontSize: '1rem', lineHeight: 1.75, marginBottom: '2.5rem' },
  ctaPrimary: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#F5A623', color: '#0A0A0A', textDecoration: 'none', padding: '0.9rem 1.75rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem' },
  ctaGhost: { display: 'inline-flex', alignItems: 'center', color: '#555', textDecoration: 'none', padding: '0.9rem 1.25rem', borderRadius: '12px', border: '1px solid #1E1E1E', fontSize: '0.9rem' },
  previewCard: { background: '#111111', border: '1px solid #1E1E1E', borderRadius: '20px', padding: '1.25rem', width: '90%', maxWidth: '340px', marginTop: '3rem', position: 'relative', zIndex: 1, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' },
  previewAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#1A1400', border: '1px solid #F5A62330', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5A623', fontWeight: '700', fontSize: '0.85rem' },
  statsBar: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: '1px solid #1A1A1A', borderBottom: '1px solid #1A1A1A', padding: '1.5rem' },
  statItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', textAlign: 'center', borderRight: '1px solid #1A1A1A', padding: '0 1rem' },
  section: { padding: '5rem 1.5rem' },
  tag: { display: 'inline-flex', color: '#F5A623', fontSize: '0.72rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' },
  h2: { fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', color: '#F0EDE8', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '1rem' },
  bodyText: { color: '#555', fontSize: '0.92rem', lineHeight: 1.75 },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' },
  problemCard: { background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '16px', padding: '1.5rem' },
  featureCard: { background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '16px', padding: '1.5rem' },
  featureIcon: { background: '#111111', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '0.6rem', display: 'inline-flex' },
  featureTag: { background: '#1A1A1A', color: '#444', fontSize: '0.68rem', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: '500' },
  stepCard: { display: 'flex', alignItems: 'flex-start', gap: '1rem', background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '16px', padding: '1.25rem' },
  testimonialCard: { background: '#0F0F0F', border: '1px solid #1A1A1A', borderRadius: '16px', padding: '1.5rem' },
  tAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#1A1400', border: '1px solid #F5A62320', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F5A623', fontWeight: '700', fontSize: '0.85rem', flexShrink: 0 },
  finalCta: { padding: '8rem 1.5rem', textAlign: 'center', position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse 80% 60% at 50% 100%, #1A1000 0%, #0A0A0A 70%)' },
  footer: { padding: '2rem 1.5rem', borderTop: '1px solid #1A1A1A', textAlign: 'center' }
}
