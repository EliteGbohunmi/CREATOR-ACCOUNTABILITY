import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Plus, Loader, ArrowLeft, RefreshCw, Copy, Check, AlertCircle } from 'lucide-react'

const PLATFORMS = ['Instagram', 'X (Twitter)', 'TikTok', 'YouTube', 'LinkedIn', 'Threads', 'Blog', 'Facebook']

const FORMAT_TYPES: Record<string, 'carousel' | 'video' | 'tweet' | 'linkedin' | 'thread' | 'blog' | 'written'> = {
  'Carousel': 'carousel',
  'Reel': 'video',
  'Short': 'video',
  'Video': 'video',
  'TikTok': 'video',
  'YouTube Short': 'video',
  'YouTube': 'video',
  'Thread': 'thread',
  'Tweet': 'tweet',
  'LinkedIn Post': 'linkedin',
  'LinkedIn Article': 'linkedin',
  'Article': 'blog',
  'Blog': 'blog',
  'Threads Post': 'written',
  'Post': 'written',
  'Story': 'written',
}

function getFormatType(format: string): string {
  for (const [key, val] of Object.entries(FORMAT_TYPES)) {
    if (format.toLowerCase().includes(key.toLowerCase())) return val
  }
  return 'written'
}

interface Props {
  pillars: any[]
  onIdeaAdded: () => void
  selectedDate: string
}

export default function AIContentIdeas({ pillars, onIdeaAdded, selectedDate }: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [dayContext, setDayContext] = useState('')
  const [platform, setPlatform] = useState('')
  const [pillarId, setPillarId] = useState('')
  const [niche, setNiche] = useState('')
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdea, setSelectedIdea] = useState<any | null>(null)
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [generatingDetails, setGeneratingDetails] = useState(false)
  const [tone, setTone] = useState('')
  const [rewriting, setRewriting] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const isStoryValid = (text: string) => text.trim().length >= 20

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const callBackendAI = async (prompt: string, maxTokens = 1500) => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/ai/generate`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens })
      }
    )
    const data = await res.json()
    if (data.error) throw new Error(data.error)
    let text = data.result || ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch {
      // If parsing fails, try to extract JSON from the text
      const match = text.match(/\{.*\}/s)
      if (match) return JSON.parse(match[0])
      // If it's an array, try to extract array
      const arrayMatch = text.match(/\[.*\]/s)
      if (arrayMatch) return JSON.parse(arrayMatch[0])
      throw new Error('Could not parse AI response as JSON')
    }
  }

  const generateIdeas = async () => {
    if (!isStoryValid(dayContext)) return
    setLoading(true)
    setIdeas([])
    setSelectedIdea(null)
    setGeneratedContent(null)

    const pillarName = pillars.find(p => p.id === pillarId)?.name || ''

    const prompt = `A creator just experienced this: "${dayContext.trim()}"

Generate 5 SPECIFIC content ideas directly inspired by this exact story.
${platform ? `Preferred platform: ${platform}` : ''}
${pillarName ? `Content theme: ${pillarName}` : ''}
${niche ? `Niche: ${niche}` : ''}

RULES:
- Each idea must reference actual specific details from the story
- Each idea must have a DIFFERENT format from this list: Reel, Carousel, Thread, LinkedIn Post, Blog Article, TikTok, YouTube Short, Threads Post, Tweet
- The hook must be specific and compelling — drawn directly from the story
- Vary the formats across the 5 ideas

Return ONLY a JSON array:
[
  {
    "title": "specific post title",
    "format": "Reel/Carousel/Thread/LinkedIn Post/Blog Article/TikTok/Tweet/Threads Post/YouTube Short",
    "hook": "one compelling opening sentence from the story",
    "platform": "Instagram/LinkedIn/X (Twitter)/TikTok/YouTube/Threads/Blog"
  }
]`

    try {
      const parsed = await callBackendAI(prompt, 1000)
      setIdeas(Array.isArray(parsed) ? parsed : [])
    } catch {
      setIdeas([
        { title: 'What today taught me', format: 'Reel', hook: 'I did not expect this to change everything.', platform: 'Instagram' },
        { title: 'Lessons from the trenches', format: 'Carousel', hook: 'Swipe to see what nobody tells you.', platform: 'Instagram' },
        { title: 'My honest take', format: 'Thread', hook: 'I need to be real about what happened.', platform: 'X (Twitter)' },
        { title: 'The full story', format: 'LinkedIn Post', hook: 'This experience changed how I work.', platform: 'LinkedIn' },
        { title: 'A day that shifted things', format: 'Blog Article', hook: 'Some days teach you more than years.', platform: 'Blog' },
      ])
    }
    setLoading(false)
  }

  const generateContent = async (idea: any) => {
    setGeneratingDetails(true)
    setGeneratedContent(null)
    const story = dayContext.trim()
    const pillarName = pillars.find(p => p.id === pillarId)?.name || ''
    const formatType = getFormatType(idea.format)

    let prompt = ''

    if (formatType === 'carousel') {
      prompt = `You are a professional content writer. The creator shared this EXACT story: "${story}"

Write a ${idea.format} for ${idea.platform || 'Instagram'} titled "${idea.title}".

A Carousel post needs SLIDE-BY-SLIDE content. Create 6 slides:
- Slide 1: Hook slide — title or opening statement (max 10 words, punchy)
- Slides 2-5: Content slides — each slide has a short heading (5 words max) and 2-3 sentences of content drawn DIRECTLY from the story
- Slide 6: CTA slide — call to action (save, share, follow, comment)

STRICT RULES:
- Reference specific details from the story, but REWRITE them in new words — never copy sentences directly from the story
- No placeholders like [add your story] 
- Hook: "${idea.hook}"
- ${pillarName ? `Theme: ${pillarName}` : ''}

Return ONLY this JSON:
{
  "slides": [
    {"slide": 1, "heading": "...", "text": "..."},
    {"slide": 2, "heading": "...", "text": "..."},
    {"slide": 3, "heading": "...", "text": "..."},
    {"slide": 4, "heading": "...", "text": "..."},
    {"slide": 5, "heading": "...", "text": "..."},
    {"slide": 6, "heading": "...", "text": "..."}
  ]
}`

    } else if (formatType === 'thread') {
      prompt = `You are a professional content writer. The creator shared this EXACT story: "${story}"

Write a Twitter/X Thread titled "${idea.title}".

Create a thread of 5-7 tweets:
- Tweet 1: Hook tweet — opens with "${idea.hook}" — must grab attention, max 280 chars
- Tweets 2-6: Story tweets — each continues the narrative with SPECIFIC details from the story, max 280 chars each
- Last tweet: CTA tweet — ask a question or prompt engagement, max 280 chars

STRICT RULES:
- Each tweet must be under 280 characters
- Use specific details from the story — no generic statements
- Number each tweet (1/, 2/, etc.)
- ${pillarName ? `Theme: ${pillarName}` : ''}

Return ONLY this JSON:
{"tweets": ["tweet 1 text", "tweet 2 text", "tweet 3 text", "tweet 4 text", "tweet 5 text"]}`

    } else if (formatType === 'tweet') {
      prompt = `You are a professional content writer. The creator shared this EXACT story: "${story}"

Write ONE tweet for X (Twitter) titled "${idea.title}".

STRICT RULES:
- MUST be under 280 characters — count carefully
- Open with this hook: "${idea.hook}"
- Reference a specific detail from the story, but write it in fresh wording — do not copy the sentence as-is
- Conversational and authentic — not like AI wrote it
- No hashtags unless they add value
- ${pillarName ? `Theme: ${pillarName}` : ''}

Return ONLY this JSON:
{"tweet": "the complete tweet text under 280 characters"}`

    } else if (formatType === 'linkedin') {
      prompt = `You are a professional content writer. The creator shared this EXACT story: "${story}"

Write a complete LinkedIn post titled "${idea.title}".

Structure (300-500 words):
- Line 1 (Hook): "${idea.hook}" — make it stop the scroll
- Blank line
- Paragraph 1: Set the scene — what happened? Use specific details from the story
- Paragraph 2: What went wrong or what was the challenge? Specific details
- Paragraph 3: What changed or what was learned? Specific details  
- Paragraph 4: The key insight or lesson — make it valuable
- Blank line
- Final line: Call to action — ask a question or prompt comments

STRICT RULES:
- Use SPECIFIC details from the story — names, numbers, feelings, outcomes
- Use line breaks between paragraphs
- Professional but personal and human
- No clichés like "I'm excited to share" or "In today's fast-paced world"
- ${pillarName ? `Theme: ${pillarName}` : ''}

Return ONLY this JSON:
{"post": "full LinkedIn post text here with line breaks"}`

    } else if (formatType === 'blog') {
      prompt = `You are a professional content writer. The creator shared this EXACT story: "${story}"

Write a complete blog article titled "${idea.title}".

Structure (600-800 words):
- Introduction (2-3 paragraphs): Open with "${idea.hook}", then set the scene using specific story details
- Section 1 (with heading): The main event — what happened, using specific details
- Section 2 (with heading): The challenge or turning point  
- Section 3 (with heading): What changed and what was learned
- Conclusion (1-2 paragraphs): Key takeaway and call to action

STRICT RULES:
- Use SPECIFIC details from the story throughout
- Use markdown headings (## Heading)
- Write in first person
- Conversational but thoughtful tone
- ${pillarName ? `Theme: ${pillarName}` : ''}

Return ONLY this JSON:
{"article": "full blog article text with markdown formatting"}`

    } else if (formatType === 'video') {
      prompt = `You are a professional content writer. The creator shared this EXACT story: "${story}"

Write a ${idea.format} script for ${idea.platform || 'social media'} titled "${idea.title}".

Write:
1. CAPTION: 2-3 sentences for the post caption. Specific details from story. Ready to post.
2. HOOK (first 3 seconds): "${idea.hook}" — adapt it to be spoken naturally on camera
3. SCRIPT: 5-7 talking points. Each point is a complete sentence with SPECIFIC story details. Written as if spoken naturally.
4. OUTRO: 1-2 sentences to close and include a call to action

STRICT RULES:
- Reference specific details from the story, but rewrite them as if speaking naturally — never copy sentences directly from the story
- Write as if the creator is speaking — conversational and natural
- ${pillarName ? `Theme: ${pillarName}` : ''}

Return ONLY this JSON:
{"caption": "...", "hook": "...", "script": "...", "outro": "..."}`

    } else {
      // Generic written (Threads, general posts)
      prompt = `You are a professional content writer. The creator shared this EXACT story: "${story}"

Write a complete ${idea.format} for ${idea.platform || 'social media'} titled "${idea.title}".

Open with: "${idea.hook}"
Length: 200-400 characters for Threads, 150-300 words for other platforms.

STRICT RULES:
- Use SPECIFIC details from the story
- No placeholders
- Conversational and authentic
- ${pillarName ? `Theme: ${pillarName}` : ''}

Return ONLY this JSON:
{"post": "full post text here"}`
    }

    try {
      const parsed = await callBackendAI(prompt, 2000)
      setGeneratedContent({ ...parsed, formatType, idea })
    } catch {
      setGeneratedContent({ error: true, formatType, idea })
    }
    setGeneratingDetails(false)
  }

  const rewriteContent = async () => {
    if (!generatedContent || !tone.trim()) return
    setRewriting(true)
    const story = dayContext.trim()
    const formatType = generatedContent.formatType

    const currentContent = formatType === 'carousel'
      ? JSON.stringify(generatedContent.slides)
      : formatType === 'thread' ? generatedContent.tweets?.join('\n')
      : formatType === 'tweet' ? generatedContent.tweet
      : formatType === 'linkedin' ? generatedContent.post
      : formatType === 'blog' ? generatedContent.article
      : formatType === 'video' ? `Caption: ${generatedContent.caption}\nScript: ${generatedContent.script}`
      : generatedContent.post

    const prompt = `Original story: "${story}"

Current content:
${currentContent}

Rewrite this content in a "${tone}" tone. Keep all specific story details. Make it more engaging and authentic.

Return the same JSON structure as the original.`

    try {
      const parsed = await callBackendAI(prompt, 2000)
      setGeneratedContent((prev: any) => ({ ...prev, ...parsed }))
    } catch {
      // keep existing
    }
    setRewriting(false)
  }

  const addToPlanner = async () => {
    if (!selectedIdea) return
    setAdding(true)
    const today = selectedDate || new Date().toISOString().split('T')[0]
    await supabase.from('tasks').insert({
      user_id: user!.id,
      title: selectedIdea.title,
      platform: selectedIdea.platform || platform || '',
      format: selectedIdea.format,
      date: today,
      completed: false,
      pillar_id: pillarId || null,
    })
    onIdeaAdded()
    setAdding(false)
    setSelectedIdea(null)
    setGeneratedContent(null)
    setOpen(false)
  }

  const reset = () => {
    setOpen(false)
    setSelectedIdea(null)
    setGeneratedContent(null)
    setIdeas([])
  }

  const renderContent = () => {
    if (!generatedContent) return null
    const { formatType } = generatedContent

    if (generatedContent.error) {
      return <div style={{ color: '#E53E3E', fontSize: '0.85rem', padding: '1rem', background: '#1A0000', borderRadius: '10px' }}>Failed to generate content. Try again.</div>
    }

    if (formatType === 'carousel') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={styles.label}>Carousel Slides</label>
          {(generatedContent.slides || []).map((slide: any, i: number) => (
            <div key={i} style={styles.slideCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span style={{ color: '#F5A623', fontSize: '0.75rem', fontWeight: '700' }}>SLIDE {slide.slide}</span>
                <button style={styles.copyBtn} onClick={() => copyText(`${slide.heading}\n\n${slide.text}`, `slide${i}`)}>
                  {copied === `slide${i}` ? <Check size={11} color="#4CAF50" /> : <Copy size={11} color="#888" />}
                </button>
              </div>
              <div style={{ fontWeight: '600', fontSize: '0.88rem', marginBottom: '0.35rem', color: '#F0EDE8' }}>{slide.heading}</div>
              <div style={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.5 }}>{slide.text}</div>
            </div>
          ))}
          <button style={styles.copyAllBtn} onClick={() => copyText((generatedContent.slides || []).map((s: any) => `SLIDE ${s.slide}:\n${s.heading}\n\n${s.text}`).join('\n\n---\n\n'), 'all')}>
            {copied === 'all' ? '✓ Copied all slides' : 'Copy all slides'}
          </button>
        </div>
      )
    }

    if (formatType === 'thread') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <label style={styles.label}>Thread Tweets</label>
          {(generatedContent.tweets || []).map((tweet: string, i: number) => (
            <div key={i} style={styles.tweetCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <span style={{ color: '#555', fontSize: '0.72rem' }}>{i + 1}/{generatedContent.tweets.length}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: tweet.length > 280 ? '#E53E3E' : '#555', fontSize: '0.68rem' }}>{tweet.length}/280</span>
                  <button style={styles.copyBtn} onClick={() => copyText(tweet, `tweet${i}`)}>
                    {copied === `tweet${i}` ? <Check size={11} color="#4CAF50" /> : <Copy size={11} color="#888" />}
                  </button>
                </div>
              </div>
              <div style={{ color: '#F0EDE8', fontSize: '0.88rem', lineHeight: 1.5 }}>{tweet}</div>
            </div>
          ))}
          <button style={styles.copyAllBtn} onClick={() => copyText((generatedContent.tweets || []).join('\n\n'), 'alltweets')}>
            {copied === 'alltweets' ? '✓ Copied all tweets' : 'Copy full thread'}
          </button>
        </div>
      )
    }

    if (formatType === 'tweet') {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={styles.label}>Tweet</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: (generatedContent.tweet || '').length > 280 ? '#E53E3E' : '#555', fontSize: '0.72rem' }}>
                {(generatedContent.tweet || '').length}/280
              </span>
              <button style={styles.copyBtn} onClick={() => copyText(generatedContent.tweet || '', 'tweet')}>
                {copied === 'tweet' ? <Check size={11} color="#4CAF50" /> : <Copy size={11} color="#888" />}
                {copied === 'tweet' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
          <div style={styles.contentBox}>{generatedContent.tweet}</div>
          {(generatedContent.tweet || '').length > 280 && (
            <div style={{ color: '#E53E3E', fontSize: '0.72rem', marginTop: '0.3rem' }}>Over 280 characters — try rewriting</div>
          )}
        </div>
      )
    }

    if (formatType === 'linkedin') {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={styles.label}>LinkedIn Post</label>
            <button style={styles.copyBtn} onClick={() => copyText(generatedContent.post || '', 'linkedin')}>
              {copied === 'linkedin' ? <Check size={11} color="#4CAF50" /> : <Copy size={11} color="#888" />}
              {copied === 'linkedin' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div style={{ ...styles.contentBox, whiteSpace: 'pre-wrap' as const }}>{generatedContent.post}</div>
        </div>
      )
    }

    if (formatType === 'blog') {
      return (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={styles.label}>Blog Article</label>
            <button style={styles.copyBtn} onClick={() => copyText(generatedContent.article || '', 'blog')}>
              {copied === 'blog' ? <Check size={11} color="#4CAF50" /> : <Copy size={11} color="#888" />}
              {copied === 'blog' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div style={{ ...styles.contentBox, whiteSpace: 'pre-wrap' as const }}>{generatedContent.article}</div>
        </div>
      )
    }

    if (formatType === 'video') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <label style={styles.label}>Caption</label>
              <button style={styles.copyBtn} onClick={() => copyText(generatedContent.caption || '', 'cap')}>
                {copied === 'cap' ? <Check size={11} color="#4CAF50" /> : <Copy size={11} color="#888" />}
              </button>
            </div>
            <div style={styles.contentBox}>{generatedContent.caption}</div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <label style={styles.label}>Hook (first 3 seconds)</label>
            </div>
            <div style={{ ...styles.contentBox, borderColor: '#F5A62330', color: '#F5A623' }}>{generatedContent.hook}</div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
              <label style={styles.label}>Script</label>
              <button style={styles.copyBtn} onClick={() => copyText(generatedContent.script || '', 'script')}>
                {copied === 'script' ? <Check size={11} color="#4CAF50" /> : <Copy size={11} color="#888" />}
              </button>
            </div>
            <div style={{ ...styles.contentBox, whiteSpace: 'pre-wrap' as const }}>{generatedContent.script}</div>
          </div>
          {generatedContent.outro && (
            <div>
              <label style={styles.label}>Outro</label>
              <div style={styles.contentBox}>{generatedContent.outro}</div>
            </div>
          )}
          <button style={styles.copyAllBtn} onClick={() => copyText(`CAPTION:\n${generatedContent.caption}\n\nHOOK:\n${generatedContent.hook}\n\nSCRIPT:\n${generatedContent.script}\n\nOUTRO:\n${generatedContent.outro}`, 'allvideo')}>
            {copied === 'allvideo' ? '✓ Copied everything' : 'Copy everything'}
          </button>
        </div>
      )
    }

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
          <label style={styles.label}>Post</label>
          <button style={styles.copyBtn} onClick={() => copyText(generatedContent.post || '', 'post')}>
            {copied === 'post' ? <Check size={11} color="#4CAF50" /> : <Copy size={11} color="#888" />}
            {copied === 'post' ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div style={{ ...styles.contentBox, whiteSpace: 'pre-wrap' as const }}>{generatedContent.post}</div>
      </div>
    )
  }

  return (
    <>
      <button style={styles.triggerBtn} onClick={() => setOpen(true)}>
        <Sparkles size={15} color="#F5A623" />
        AI Ideas
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div style={styles.overlay} onClick={reset} />
            <motion.div
              style={styles.drawer}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {selectedIdea && (
                    <button style={styles.backBtn} onClick={() => { setSelectedIdea(null); setGeneratedContent(null) }}>
                      <ArrowLeft size={16} color="#888" />
                    </button>
                  )}
                  <div>
                    <div style={{ fontFamily: 'Space Grotesk', fontWeight: '700', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sparkles size={16} color="#F5A623" />
                      {selectedIdea ? selectedIdea.title : 'AI Content Ideas'}
                    </div>
                    {selectedIdea && (
                      <div style={{ color: '#555', fontSize: '0.75rem', marginTop: '0.1rem' }}>
                        {selectedIdea.format} · {selectedIdea.platform || platform || 'Any platform'}
                      </div>
                    )}
                  </div>
                </div>
                <button style={styles.closeBtn} onClick={reset}>
                  <X size={18} color="#555" />
                </button>
              </div>

              {/* Step 1 — Story input and filters */}
              {!selectedIdea && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div>
                    <label style={styles.label}>What happened today or recently?</label>
                    <textarea
                      style={{ ...styles.input, minHeight: '90px', resize: 'vertical' as const, marginTop: '0.3rem' }}
                      placeholder="Be specific — e.g. 'I launched my first product today and got 3 sales from strangers. I was terrified but hit publish anyway...'"
                      value={dayContext}
                      onChange={e => setDayContext(e.target.value)}
                    />
                    {dayContext.trim().length > 0 && !isStoryValid(dayContext) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.3rem' }}>
                        <AlertCircle size={12} color="#E53E3E" />
                        <span style={{ color: '#E53E3E', fontSize: '0.72rem' }}>Write more detail for better ideas</span>
                      </div>
                    )}
                    {isStoryValid(dayContext) && (
                      <span style={{ color: '#4CAF50', fontSize: '0.72rem' }}>✓ Ready to generate</span>
                    )}
                  </div>

                  <div>
                    <label style={styles.label}>Platform (optional)</label>
                    <select style={{ ...styles.input, marginTop: '0.3rem' }} value={platform} onChange={e => setPlatform(e.target.value)}>
                      <option value="">Any platform</option>
                      {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {pillars.length > 0 && (
                    <div>
                      <label style={styles.label}>Content pillar (optional)</label>
                      <select style={{ ...styles.input, marginTop: '0.3rem' }} value={pillarId} onChange={e => setPillarId(e.target.value)}>
                        <option value="">Any pillar</option>
                        {pillars.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={styles.label}>Your niche (optional)</label>
                    <input
                      style={{ ...styles.input, marginTop: '0.3rem' }}
                      placeholder="e.g. fitness, tech, parenting, design..."
                      value={niche}
                      onChange={e => setNiche(e.target.value)}
                    />
                  </div>

                  <button
                    style={{ ...styles.generateBtn, opacity: isStoryValid(dayContext) ? 1 : 0.5 }}
                    onClick={generateIdeas}
                    disabled={loading || !isStoryValid(dayContext)}
                  >
                    {loading
                      ? <><Loader size={16} color="#0A0A0A" style={{ animation: 'spin 1s linear infinite' }} />Generating...</>
                      : <><Sparkles size={16} color="#0A0A0A" />Generate 5 Ideas</>
                    }
                  </button>

                  {ideas.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      <p style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Tap to generate full content
                      </p>
                      {ideas.map((idea, i) => (
                        <motion.div
                          key={i}
                          style={styles.ideaCard}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          onClick={() => { setSelectedIdea(idea); generateContent(idea) }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '0.88rem', marginBottom: '0.25rem' }}>{idea.title}</div>
                            <div style={{ color: '#666', fontSize: '0.78rem', marginBottom: '0.4rem', lineHeight: 1.4 }}>"{idea.hook}"</div>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                              <span style={styles.formatTag}>{idea.format}</span>
                              {idea.platform && <span style={styles.platformTag}>{idea.platform}</span>}
                            </div>
                          </div>
                          <Plus size={16} color="#F5A623" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step 2 — Generated content */}
              {selectedIdea && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {generatingDetails ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem', justifyContent: 'center' }}>
                      <Loader size={20} color="#F5A623" style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ color: '#555' }}>Writing your {selectedIdea.format}...</span>
                    </div>
                  ) : (
                    <>
                      {renderContent()}

                      {/* Rewrite tone */}
                      <div>
                        <label style={styles.label}>Rewrite in a different tone</label>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                          <input
                            style={{ ...styles.input, flex: 1 }}
                            placeholder="e.g. funny, bold, emotional, professional..."
                            value={tone}
                            onChange={e => setTone(e.target.value)}
                          />
                          <button style={styles.rewriteBtn} onClick={rewriteContent} disabled={rewriting || !tone.trim()}>
                            {rewriting
                              ? <Loader size={14} color="#0A0A0A" style={{ animation: 'spin 1s linear infinite' }} />
                              : <RefreshCw size={14} color="#0A0A0A" />
                            }
                          </button>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={styles.addBtn} onClick={addToPlanner} disabled={adding}>
                          {adding ? 'Adding...' : <><Plus size={15} color="#0A0A0A" />Add to Planner</>}
                        </button>
                        <button style={styles.regenerateBtn} onClick={() => generateContent(selectedIdea)} title="Regenerate">
                          <RefreshCw size={14} color="#888" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

const styles: Record<string, React.CSSProperties> = {
  triggerBtn: { display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#1A1400', color: '#F5A623', border: '1px solid #F5A62330', borderRadius: '10px', padding: '0.65rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300 },
  drawer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111111', borderTop: '1px solid #1E1E1E', borderRadius: '20px 20px 0 0', padding: '1.5rem', zIndex: 301, maxHeight: '90vh', overflowY: 'auto' },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', display: 'flex' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem' },
  label: { color: '#555', fontSize: '0.72rem', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  input: { background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '8px', padding: '0.75rem 1rem', color: '#F0EDE8', fontSize: '0.92rem', outline: 'none', width: '100%', boxSizing: 'border-box' as const, fontFamily: 'Inter' },
  generateBtn: { background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '10px', padding: '0.85rem', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' },
  ideaCard: { background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '1rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' },
  formatTag: { background: '#1A1A2A', color: '#888', padding: '0.15rem 0.55rem', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '500' },
  platformTag: { background: '#1A1400', color: '#F5A623', padding: '0.15rem 0.55rem', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '500' },
  contentBox: { background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '8px', padding: '0.85rem 1rem', color: '#F0EDE8', fontSize: '0.88rem', lineHeight: 1.6 },
  slideCard: { background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '0.85rem 1rem' },
  tweetCard: { background: '#0A0A0A', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '0.85rem 1rem' },
  copyBtn: { display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: '1px solid #1E1E1E', borderRadius: '6px', padding: '0.25rem 0.6rem', color: '#888', cursor: 'pointer', fontSize: '0.72rem' },
  copyAllBtn: { background: '#1A1400', color: '#F5A623', border: '1px solid #F5A62330', borderRadius: '8px', padding: '0.65rem', fontWeight: '500', cursor: 'pointer', fontSize: '0.82rem', textAlign: 'center' as const },
  rewriteBtn: { background: '#F5A623', border: 'none', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  addBtn: { flex: 1, background: '#F5A623', color: '#0A0A0A', border: 'none', borderRadius: '10px', padding: '0.85rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.9rem' },
  regenerateBtn: { background: '#1A1A1A', border: '1px solid #1E1E1E', borderRadius: '10px', padding: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center' },
}
