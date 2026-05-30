import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import Navbar from '../components/Navbar';
import HeroCards from '../components/HeroCards';
import {
  Search, BarChart2, Bot, Activity, FileSearch, Globe2,
  Plug2, TrendingUp, Lock, Zap, Star,
  MousePointerClick, Eye, CheckCircle2, ChevronDown, Sparkles,
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

/* ── Monochrome tokens ──────────────────────────────────────────────────── */
const D = {
  bg:     '#000000',
  bgAlt:  '#0a0a0a',
  card:   '#141414',
  border: '#262626',
  bHov:   '#404040',
  text:   '#ffffff',
  sub:    '#a0a0a0',
  muted:  '#555555',
  dim:    '#333333',
};

const ParticleField = lazy(() => import('../components/ParticleField'));
const FloatingOrb   = lazy(() => import('../components/FloatingOrb'));

/* ── Data ───────────────────────────────────────────────────────────────── */
const FEATURES = [
  { Icon: Search,     color: '#3b82f6', title: 'Keyword Research',           desc: 'Identifies the exact search terms your customers use that you can realistically rank for.' },
  { Icon: BarChart2,  color: '#8b5cf6', title: 'Search Console Integration',  desc: 'See exactly what Google sees — clicks, impressions, and position history pulled live.' },
  { Icon: Bot,        color: '#a855f7', title: 'AI Diagnosis',                desc: "Claude explains what's broken and gives you a prioritized, step-by-step fix plan." },
  { Icon: Activity,   color: '#f59e0b', title: 'Indexing Diagnostics',         desc: "Pinpoint exactly why Google won't index your page — 7 automated checks." },
  { Icon: FileSearch, color: '#22c55e', title: 'On-Page Analyzer',             desc: 'Score content, meta tags, keyword density. Hit Rank Math 100/100 every time.' },
  { Icon: Globe2,     color: '#0ea5e9', title: 'Multi-language Content',       desc: 'Publish SEO-optimized content in 50+ languages to capture global search traffic.' },
];

const STATS = [
  { Icon: FileSearch,        color: '#8b5cf6', end: 2.3,  suffix: 'M+', label: 'Pages Analyzed',        decimals: 1 },
  { Icon: CheckCircle2,      color: '#22c55e', end: 94,   suffix: '%',  label: 'Accuracy Rate',           decimals: 0 },
  { Icon: Eye,               color: '#3b82f6', end: 1.6,  suffix: 'B',  label: 'Impressions Generated',   decimals: 1 },
  { Icon: MousePointerClick, color: '#f59e0b', end: 30,   suffix: 'M+', label: 'Clicks Driven',           decimals: 0 },
];

const STEPS = [
  { Icon: Plug2,      color: '#6366f1', num: 1, title: 'Connect Google', desc: 'Link Search Console and Analytics in one click — no developer needed.' },
  { Icon: Activity,   color: '#0ea5e9', num: 2, title: 'Run Analysis',    desc: 'We audit every page and surface every SEO issue, indexing gap, and opportunity.' },
  { Icon: TrendingUp, color: '#22c55e', num: 3, title: 'Fix & Rank',      desc: 'Follow the AI-generated fix plan and watch your rankings climb week over week.' },
];

const INTEGRATIONS = [
  { name: 'WordPress', letter: 'W',  color: '#4a90d9' },
  { name: 'Shopify',   letter: 'S',  color: '#5cb85c' },
  { name: 'Webflow',   letter: 'Wf', color: '#5b6ef5' },
  { name: 'Wix',       letter: 'Wx', color: '#facc15' },
  { name: 'Ghost',     letter: 'G',  color: '#8899aa' },
  { name: 'HubSpot',   letter: 'H',  color: '#ff7a59' },
  { name: 'Notion',    letter: 'N',  color: '#c8c8c8' },
  { name: 'Next.js',   letter: '▲',  color: '#ffffff' },
];

const TESTIMONIALS = [
  { name: 'Marcus T.',  role: 'SaaS Founder',       loc: 'Austin, TX',   init: 'MT', quote: 'RankLens completely changed how I think about content. Within 6 weeks our organic traffic tripled. The AI diagnosis is frighteningly accurate.' },
  { name: 'Priya S.',   role: 'E-commerce Owner',   loc: 'London, UK',   init: 'PS', quote: 'I was spending $4,000/month on an SEO agency with mediocre results. RankLens costs a fraction — 8x more impressions in 2 months.' },
  { name: 'James R.',   role: 'Marketing Director',  loc: 'New York, NY', init: 'JR', quote: 'The indexing checker alone is worth it. We had 40+ pages not indexed and had no idea why. Fixed them all in a weekend.' },
  { name: 'Layla M.',   role: 'Startup Founder',    loc: 'Dubai, UAE',   init: 'LM', quote: 'From position 32 to position 4 in 3 months. Automated content generation and live scoring made it completely effortless.' },
  { name: 'Dmitri V.',  role: 'Agency Owner',        loc: 'Berlin, DE',   init: 'DV', quote: "I use RankLens for all 12 of my clients. The Search Console integration saves hours every week. My clients think I'm a genius." },
];

const FAQ = [
  { q: 'How does RankLens generate SEO content?',            a: "RankLens uses Claude AI to write long-form blog posts tailored to your focus keyword, target audience, and tone. Content is structured to pass Rank Math's 100/100 checklist — keyword density, heading structure, internal links, and meta tags — all automatically." },
  { q: 'Will the AI-generated content actually rank?',        a: 'Yes, when properly structured. RankLens targets keyword density around 1%, ensures your focus keyword appears in the title, first paragraph, at least one H2/H3, and the URL slug. Content exceeds 2,500 words and includes internal + external links.' },
  { q: 'Do I need any SEO expertise?',                       a: "None at all. RankLens handles all technical SEO work — from structuring your article to diagnosing why pages aren't indexed. Just fill in your keyword, topic, and audience." },
  { q: 'How is this different from other AI writing tools?',  a: "Other tools write content. RankLens writes SEO-optimized content with a live score, indexing checker, Search Console integration, and AI diagnosis built in. It's a full SEO intelligence platform." },
  { q: 'Is there a free plan?',                              a: 'Yes. Start free with the Gemini-powered engine — no API key required. For premium models (Claude Sonnet, GPT-4o, DeepSeek) via OpenRouter, add your own API key.' },
];

/* ── Social SVGs ────────────────────────────────────────────────────────── */
const XSvg = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const LinkedinSvg = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);
const FacebookSvg = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

/* ── 3D card ────────────────────────────────────────────────────────────── */
function Card3D({ children, style, className }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const base = style?.boxShadow || '0 4px 24px rgba(0,0,0,.7)';
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const y = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      gsap.to(el, {
        rotateY: x * 12, rotateX: -y * 8,
        transformPerspective: 900, scale: 1.02,
        boxShadow: `0 0 32px rgba(255,255,255,.05), ${-x*16}px ${y*12}px 40px rgba(0,0,0,.8), 0 0 0 1px #404040`,
        duration: .2, ease: 'power2.out',
      });
    };
    const onLeave = () => gsap.to(el, {
      rotateY: 0, rotateX: 0, scale: 1,
      boxShadow: base,
      duration: .5, ease: 'power3.out',
    });
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);
  return (
    <div ref={ref} className={className} style={{ willChange: 'transform', cursor: 'default', ...style }}>
      {children}
    </div>
  );
}

/* ── FAQ item ───────────────────────────────────────────────────────────── */
function FaqItem({ q, a, open, onToggle }) {
  return (
    <div style={{ borderBottom: `1px solid ${D.border}`, paddingLeft: open ? 14 : 0, borderLeft: open ? `2px solid ${D.text}` : '2px solid transparent', transition: 'padding .2s, border-color .2s' }}>
      <button onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 20 }}>
        <span style={{ fontSize: 14.5, fontWeight: open ? 600 : 500, color: open ? D.text : D.sub, transition: 'color .2s', lineHeight: 1.45 }}>{q}</span>
        <ChevronDown size={16} style={{ color: open ? D.text : D.muted, flexShrink: 0, transition: 'transform .3s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
      <div style={{ maxHeight: open ? 400 : 0, overflow: 'hidden', transition: 'max-height .38s cubic-bezier(.2,.8,.2,1)', opacity: open ? 1 : 0 }}>
        <p style={{ fontSize: 13.5, color: D.sub, lineHeight: 1.8, paddingBottom: 20, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────────── */
export default function Landing() {
  const heroRef = useRef(null);
  const [testI,   setTestI]   = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const { ref: statsRef, inView: statsInView } = useInView({ threshold: 0.3, triggerOnce: true });

  useEffect(() => {
    const id = setInterval(() => setTestI(i => (i + 1) % TESTIMONIALS.length), 4200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.hero-badge', { opacity: 0, y: -16, duration: .5,  ease: 'power2.out' });
      gsap.from('.hero-word',  { opacity: 0, y: 36,  duration: .6,  stagger: .07, ease: 'power2.out', delay: .15 });
      gsap.from('.hero-sub',   { opacity: 0,          duration: .55,               delay: .5 });
      gsap.from('.hero-cta',   { opacity: 0, y: 14,  duration: .5,  ease: 'power2.out', delay: .75 });
      gsap.from('.hero-trust', { opacity: 0,          duration: .45,               delay: 1.0 });
      gsap.from('.hero-orb',   { opacity: 0, scale: .82, duration: 1, ease: 'power2.out', delay: .35 });

      const scrollAnim = (sel, trig, from, to) =>
        ScrollTrigger.create({ trigger: trig, start: 'top 82%', once: true,
          onEnter: () => gsap.fromTo(sel, from, { ...to, clearProps: 'rotateX,rotateY,transformPerspective' }) });

      scrollAnim('.stat-item',    '.stats-bar',
        { opacity: 0, y: 36,  rotateX: 18, transformPerspective: 800 },
        { opacity: 1, y: 0,   rotateX: 0,  transformPerspective: 800, duration: .65, stagger: .12, ease: 'power3.out' });

      scrollAnim('.feature-card', '.features-section',
        { opacity: 0, y: 56,  rotateX: 22, transformPerspective: 1000 },
        { opacity: 1, y: 0,   rotateX: 0,  transformPerspective: 1000, duration: .7,  stagger: .09, ease: 'power3.out' });

      scrollAnim('.step-item',    '.steps-section',
        { opacity: 0, x: -44, rotateY: -14, transformPerspective: 800 },
        { opacity: 1, x: 0,   rotateY: 0,   transformPerspective: 800, duration: .7,  stagger: .15, ease: 'power3.out' });

      scrollAnim('.integ-item',   '.integ-section',
        { opacity: 0, y: 24, scale: .88 },
        { opacity: 1, y: 0,  scale: 1,   duration: .5, stagger: .05, ease: 'back.out(1.4)' });

      scrollAnim('.test-card',    '.test-section',
        { opacity: 0, y: 36,  rotateX: 12, transformPerspective: 900 },
        { opacity: 1, y: 0,   rotateX: 0,  transformPerspective: 900, duration: .6,  stagger: .1,  ease: 'power2.out' });

      scrollAnim('.faq-item',     '.faq-section',
        { opacity: 0, x: -28 },
        { opacity: 1, x: 0,   duration: .5, stagger: .07, ease: 'power2.out' });

      scrollAnim('.cta-content',  '.cta-section',
        { opacity: 0, y: 44, scale: .97 },
        { opacity: 1, y: 0,  scale: 1,   duration: .75, ease: 'power3.out' });

    }, heroRef);
    return () => { ctx.revert(); ScrollTrigger.getAll().forEach(t => t.kill()); };
  }, []);

  return (
    <div ref={heroRef} style={{ background: D.bg, color: D.text, fontFamily: "'Inter',system-ui,sans-serif", overflowX: 'hidden' }}>
      <style>{`
        .hero-word { display: inline-block; margin-right: .22em; }
        a:focus-visible, button:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
      `}</style>

      <Navbar />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: `radial-gradient(ellipse 80% 55% at 50% -5%, rgba(255,255,255,0.06) 0%, transparent 65%), ${D.bg}` }}>
        <Suspense fallback={null}><ParticleField /></Suspense>
        <HeroCards />

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', maxWidth: 1160, width: '100%', padding: '0 32px', gap: 40, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px', minWidth: 300 }}>
            <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: '7px 16px', marginBottom: 28 }}>
              <Sparkles size={11} style={{ color: D.text }} />
              <span style={{ fontSize: 12, color: D.sub, fontWeight: 500 }}>AI-Powered SEO Intelligence Platform</span>
            </div>

            <h1 style={{ fontSize: 'clamp(38px,5.5vw,66px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.04, margin: '0 0 22px', color: D.text }}>
              {'Rank #1 on Google.'.split(' ').map((w, i) => <span key={i} className="hero-word">{w}</span>)}
              <br />
              {["We'll", 'show', 'you', 'how.'].map((w, i) => <span key={i} className="hero-word" style={{ color: D.dim }}>{w}</span>)}
            </h1>

            <p className="hero-sub" style={{ fontSize: 16, color: D.sub, maxWidth: 460, lineHeight: 1.75, marginBottom: 34 }}>
              Connect Google tools. Get AI explanations. Fix what's broken — and generate 100/100 SEO content automatically, every day.
            </p>

            <div className="hero-cta" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
              <Link to="/dashboard" style={{ background: D.text, color: D.bg, textDecoration: 'none', fontWeight: 700, fontSize: 14.5, padding: '13px 30px', borderRadius: 10, letterSpacing: '-0.01em' }}>
                Get Started Free
              </Link>
              <Link to="/dashboard" style={{ background: 'none', color: D.sub, textDecoration: 'none', fontWeight: 500, fontSize: 14.5, padding: '13px 28px', border: `1px solid ${D.border}`, borderRadius: 10 }}>
                View Dashboard →
              </Link>
            </div>

            <div className="hero-trust" style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
              {[[Lock, 'No credit card'], [Zap, 'Setup in 2 min'], [Bot, 'AI-powered']].map(([Icon, label]) => (
                <span key={label} style={{ fontSize: 12, color: D.muted, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon size={12} style={{ color: D.muted }} />{label}
                </span>
              ))}
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={11} fill={D.sub} style={{ color: D.sub }} />)}
                <span style={{ fontSize: 12, color: D.muted, marginLeft: 5 }}>4.9/5</span>
              </span>
            </div>
          </div>

          <div className="hero-orb" style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: -50, background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
            <Suspense fallback={<div style={{ width: 380, height: 380 }} />}>
              <FloatingOrb size={380} />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────── */}
      <section className="stats-bar" ref={statsRef}
        style={{ background: D.bgAlt, borderTop: `1px solid ${D.border}`, borderBottom: `1px solid ${D.border}`, padding: '64px 24px' }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <p style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 44 }}>
            Trusted by 1,000+ businesses worldwide
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 0 }}>
            {STATS.map(({ Icon, color, end, suffix, label, decimals }, i) => (
              <div key={label} className="stat-item"
                style={{ textAlign: 'center', padding: '0 24px', borderRight: i < 3 ? `1px solid ${D.border}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 14px ${color}20` }}>
                    <Icon size={17} style={{ color }} />
                  </div>
                </div>
                <div style={{ fontSize: 40, fontWeight: 700, color: D.text, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 7 }}>
                  {statsInView ? <CountUp start={0} end={end} duration={2.2} decimals={decimals} suffix={suffix} /> : `0${suffix}`}
                </div>
                <div style={{ fontSize: 12.5, color: D.muted }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────── */}
      <section className="features-section"
        style={{ padding: '100px 24px', background: D.bg, borderBottom: `1px solid ${D.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: '6px 16px', marginBottom: 20 }}>
              <Sparkles size={11} style={{ color: D.text }} />
              <span style={{ fontSize: 12, color: D.sub, fontWeight: 500 }}>100% of SEO work fully automated</span>
            </div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-0.035em', margin: '0 0 14px', color: D.text }}>Everything you need to rank</h2>
            <p style={{ fontSize: 15, color: D.sub }}>Connect, analyze, and fix — all in one place</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(310px,1fr))', gap: 1, border: `1px solid ${D.border}`, borderRadius: 18, overflow: 'hidden' }}>
            {FEATURES.map(({ Icon, color, title, desc }, idx) => (
              <Card3D key={title} className="feature-card"
                style={{
                  background: D.card,
                  border: 'none',
                  borderRight: idx % 3 !== 2 ? `1px solid ${D.border}` : 'none',
                  borderBottom: idx < 3 ? `1px solid ${D.border}` : 'none',
                  padding: '32px 28px',
                  boxShadow: 'none',
                }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: `${color}18`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: `0 0 18px ${color}22` }}>
                  <Icon size={21} style={{ color }} />
                </div>
                <h3 style={{ fontSize: 15.5, fontWeight: 600, color: D.text, marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>
                <p style={{ fontSize: 13.5, color: D.sub, lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section className="steps-section" style={{ padding: '100px 24px', background: D.bgAlt }}>
        <div style={{ maxWidth: 980, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 68 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 14 }}>How it works</p>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 700, letterSpacing: '-0.035em', margin: 0, color: D.text }}>Up and running in minutes</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, position: 'relative' }}>
            <svg style={{ position: 'absolute', top: 34, left: 'calc(16.66% + 8px)', width: 'calc(66.66% - 16px)', height: 2, overflow: 'visible', pointerEvents: 'none', zIndex: 0 }} preserveAspectRatio="none">
              <line x1="0" y1="1" x2="100%" y2="1" stroke={D.border} strokeWidth="1.5" strokeDasharray="6 5" />
            </svg>

            {STEPS.map((step) => (
              <Card3D key={step.title} className="step-item"
                style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 18, padding: '36px 26px 30px', textAlign: 'center', boxShadow: '0 4px 28px rgba(0,0,0,.6)', position: 'relative', overflow: 'hidden', zIndex: 1 }}>
                {/* colored top-right corner radial */}
                <div style={{ position: 'absolute', top: 0, right: 0, width: 110, height: 110, background: `radial-gradient(circle at top right, ${step.color}22 0%, transparent 65%)`, pointerEvents: 'none' }} />

                <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 26 }}>
                  <div style={{ width: 62, height: 62, borderRadius: '50%', background: `${step.color}18`, border: `1.5px solid ${step.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 22px ${step.color}25` }}>
                    <step.Icon size={26} style={{ color: step.color }} />
                  </div>
                  <div style={{ position: 'absolute', top: -7, right: -7, width: 20, height: 20, borderRadius: '50%', background: D.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: D.bg, border: `2px solid ${D.bgAlt}`, zIndex: 2 }}>
                    {step.num}
                  </div>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: D.text, marginBottom: 10, letterSpacing: '-0.02em' }}>{step.title}</h3>
                <p style={{ fontSize: 13.5, color: D.sub, lineHeight: 1.7, margin: 0 }}>{step.desc}</p>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEGRATIONS ─────────────────────────────────────────────── */}
      <section className="integ-section" style={{ padding: '96px 24px', background: D.bg, borderTop: `1px solid ${D.border}` }}>
        <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,38px)', fontWeight: 700, letterSpacing: '-0.035em', margin: '0 0 12px', color: D.text }}>Works with your website</h2>
          <p style={{ fontSize: 14.5, color: D.sub, marginBottom: 52 }}>Publish directly to any platform — no complex setup required.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(165px,1fr))', gap: 12 }}>
            {INTEGRATIONS.map(({ name, letter, color }) => (
              <Card3D key={name} className="integ-item"
                style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 2px 16px rgba(0,0,0,.5)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: `${color}18`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color, flexShrink: 0, fontFamily: 'monospace', boxShadow: `0 0 10px ${color}18` }}>
                  {letter}
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 500, color: D.sub }}>{name}</span>
              </Card3D>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────── */}
      <section className="test-section" style={{ padding: '96px 24px', background: D.bgAlt, borderTop: `1px solid ${D.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 58 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 14 }}>Customer Stories</p>
            <h2 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 700, letterSpacing: '-0.035em', margin: '0 0 10px', color: D.text }}>Used by those who grow fast</h2>
            <p style={{ fontSize: 14.5, color: D.sub }}>1,000+ customers use RankLens to dominate their niche</p>
          </div>

          {TESTIMONIALS[testI] && (
            <Card3D style={{ background: D.card, border: `1px solid ${D.border}`, borderLeft: `3px solid ${D.text}`, borderRadius: 18, padding: '36px 40px', marginBottom: 16, position: 'relative', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,.6)' }}>
              <div style={{ position: 'absolute', top: 18, right: 28, fontSize: 80, color: D.text, opacity: .05, lineHeight: 1, fontFamily: 'Georgia,serif', pointerEvents: 'none', userSelect: 'none' }}>"</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: D.text, flexShrink: 0 }}>
                  {TESTIMONIALS[testI].init}
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 600, color: D.text }}>{TESTIMONIALS[testI].name}</div>
                  <div style={{ fontSize: 12, color: D.muted }}>{TESTIMONIALS[testI].role} · {TESTIMONIALS[testI].loc}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} fill={D.sub} style={{ color: D.sub }} />)}
                </div>
              </div>
              <p style={{ fontSize: 16, color: D.sub, lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>{TESTIMONIALS[testI].quote}</p>
            </Card3D>
          )}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {TESTIMONIALS.map((t, i) => (
              <button key={t.name} className="test-card" onClick={() => setTestI(i)}
                style={{ flex: '1 1 0', background: testI === i ? D.card : D.bg, border: `1px solid ${testI === i ? 'rgba(255,255,255,0.3)' : D.border}`, borderTop: testI === i ? `2px solid ${D.text}` : `2px solid transparent`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'all .2s' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: D.text, flexShrink: 0 }}>
                    {t.init}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: testI === i ? D.text : D.muted }}>{t.name}</div>
                </div>
                <div style={{ fontSize: 11, color: D.muted }}>{t.role}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="faq-section" style={{ padding: '96px 24px', background: D.bg }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 54 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '.14em', marginBottom: 14 }}>FAQs</p>
            <h2 style={{ fontSize: 'clamp(26px,4vw,42px)', fontWeight: 700, letterSpacing: '-0.035em', margin: 0, color: D.text }}>Frequently asked questions</h2>
          </div>
          {FAQ.map((item, i) => (
            <div key={i} className="faq-item">
              <FaqItem q={item.q} a={item.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? null : i)} />
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="cta-section" style={{ padding: '130px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: D.bgAlt, borderTop: `1px solid ${D.border}` }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div className="cta-content" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: '6px 16px', marginBottom: 26 }}>
            <Sparkles size={11} style={{ color: D.text }} />
            <span style={{ fontSize: 12, color: D.sub, fontWeight: 500 }}>Free forever plan · No credit card needed</span>
          </div>
          <h2 style={{ fontSize: 'clamp(38px,6vw,70px)', fontWeight: 700, letterSpacing: '-0.045em', margin: '0 0 20px', lineHeight: 1.0, color: D.text }}>Ready to rank #1?</h2>
          <p style={{ fontSize: 17, color: D.sub, maxWidth: 440, margin: '0 auto 44px', lineHeight: 1.7 }}>Join 1,000+ businesses already growing with RankLens.</p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 30 }}>
            <Link to="/dashboard" style={{ background: D.text, color: D.bg, textDecoration: 'none', fontWeight: 700, fontSize: 16, padding: '15px 38px', borderRadius: 11, display: 'inline-block', letterSpacing: '-0.01em' }}>
              Get Started Free →
            </Link>
            <Link to="/analyze" style={{ background: 'none', color: D.sub, textDecoration: 'none', fontWeight: 500, fontSize: 16, padding: '15px 36px', border: `1px solid ${D.border}`, borderRadius: 11, display: 'inline-block' }}>
              Open Analyzer
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 26, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[[Lock, 'No credit card'], [Zap, '2-minute setup'], [Bot, 'AI-powered'], [Star, '4.9/5 rated']].map(([Icon, label]) => (
              <span key={label} style={{ fontSize: 13, color: D.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={13} style={{ color: D.muted }} />{label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ borderTop: `1px solid ${D.border}`, background: '#000', padding: '60px 32px 36px' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 44, marginBottom: 52 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
                <div style={{ width: 30, height: 30, background: D.text, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14, color: D.bg, fontWeight: 900 }}>R</span>
                </div>
                <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em', color: D.text }}>RankLens</span>
              </div>
              <p style={{ fontSize: 13.5, color: D.muted, lineHeight: 1.75, maxWidth: 260, marginBottom: 22 }}>AI-powered SEO intelligence platform. Connect Google, analyze your site, and generate content that ranks.</p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[[XSvg, '#'], [LinkedinSvg, '#'], [FacebookSvg, '#']].map(([Icon, href], idx) => (
                  <a key={idx} href={href}
                    style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${D.border}`, background: D.card, display: 'flex', alignItems: 'center', justifyContent: 'center', color: D.muted, textDecoration: 'none', transition: 'border-color .15s, color .15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = D.bHov; e.currentTarget.style.color = D.text; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.muted; }}>
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
            {[
              { heading: 'Product',      links: ['Blog Writer', 'Indexing Checker', 'Dashboard', 'Analytics', 'Pricing', 'Changelog'] },
              { heading: 'Integrations', links: ['WordPress', 'Shopify', 'Webflow', 'Wix', 'Ghost', 'HubSpot', 'Next.js'] },
              { heading: 'Company',      links: ['About Us', 'Blog', 'Careers', 'Privacy Policy', 'Terms of Service', 'Contact'] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <div style={{ fontSize: 11, fontWeight: 700, color: D.muted, textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 18 }}>{heading}</div>
                {links.map(l => (
                  <Link key={l} to="/analyze"
                    style={{ display: 'block', fontSize: 13.5, color: D.muted, textDecoration: 'none', marginBottom: 10, transition: 'color .15s' }}
                    onMouseEnter={e => e.target.style.color = D.text}
                    onMouseLeave={e => e.target.style.color = D.muted}>{l}
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: `1px solid ${D.border}`, paddingTop: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <span style={{ fontSize: 12.5, color: D.muted }}>© 2026 RankLens, Inc. All rights reserved.</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: D.card, border: `1px solid ${D.border}`, borderRadius: 20, padding: '5px 13px' }}>
                {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={D.sub} style={{ color: D.sub }} />)}
                <span style={{ fontSize: 12, color: D.text, fontWeight: 600, marginLeft: 5 }}>4.9</span>
                <span style={{ fontSize: 11, color: D.muted, marginLeft: 4 }}>Trustpilot</span>
              </div>
              <span style={{ fontSize: 12.5, color: D.muted }}>Made with ♥ for SEO teams everywhere</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
