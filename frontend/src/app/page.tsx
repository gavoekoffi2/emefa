"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Globe,
  Lock,
  MessageSquare,
  Mic,
  Moon,
  Search,
  Shield,
  Sparkles,
  Sun,
  Users,
  Zap,
} from "lucide-react";

/* ══════════ Animation variants ══════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};
const fadeIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section ref={ref} id={id} initial="hidden" animate={isInView ? "visible" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.section>
  );
}

/* ══════════ Counter ══════════ */
function Counter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let s = 0;
    const step = target / 125;
    const t = setInterval(() => { s += step; if (s >= target) { setCount(target); clearInterval(t); } else setCount(Math.floor(s)); }, 16);
    return () => clearInterval(t);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString("fr-FR")}{suffix}</span>;
}

/* ══════════ Realistic Photo Avatar ══════════ */
function PhotoAvatar({ src, alt, size = 192, className = "", ring = true }: {
  src: string; alt: string; size?: number; className?: string; ring?: boolean;
}) {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      {ring && (
        <>
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 animate-gradient-rotate opacity-70 blur-[3px]" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 animate-gradient-rotate opacity-50" />
        </>
      )}
      <div className="relative w-full h-full rounded-full overflow-hidden border-[3px] border-background shadow-2xl">
        <img src={src} alt={alt} className="w-full h-full object-cover" loading="eager" />
        {/* Subtle overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/5" />
      </div>
    </div>
  );
}

/* ══════════ 3D Chat Bubble ══════════ */
function ChatBubble3D({ children, side = "left", delay = 0, className = "" }: {
  children: React.ReactNode; side?: "left" | "right"; delay?: number; className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.9, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`${side === "right" ? "ml-auto" : ""} ${className}`}
    >
      <div className={`
        relative px-5 py-3 rounded-2xl text-sm leading-relaxed max-w-[270px] backdrop-blur-sm
        ${side === "right"
          ? "bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-br-md shadow-xl shadow-purple-500/20"
          : "glass-strong rounded-bl-md shadow-xl shadow-black/10"
        }
      `}>
        {children}
      </div>
    </motion.div>
  );
}

/* ══════════ Hero 3D Scene ══════════ */
function HeroScene() {
  return (
    <div className="relative w-full max-w-lg mx-auto" style={{ minHeight: 500 }}>
      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-full blur-[100px] animate-pulse-glow" />

      {/* Orbiting particles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
        <div className="animate-orbit"><div className="w-3 h-3 rounded-full bg-purple-400/40 blur-[2px]" /></div>
        <div className="animate-orbit-reverse"><div className="w-2 h-2 rounded-full bg-fuchsia-400/30 blur-[1px]" /></div>
        <div className="animate-orbit-small" style={{ animationDelay: "3s" }}><div className="w-2 h-2 rounded-full bg-blue-400/30 blur-[1px]" /></div>
      </div>

      {/* Pulsing rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-64 h-64 rounded-full border border-purple-500/15 animate-ring-pulse" />
        <div className="w-64 h-64 rounded-full border border-purple-500/10 animate-ring-pulse" style={{ animationDelay: "0.8s" }} />
      </div>

      {/* Main avatar — real photo */}
      <div className="relative z-10 flex justify-center pt-8">
        <div className="animate-avatar-breathe">
          <PhotoAvatar src="/avatars/amara.jpg" alt="Amara — Assistante IA" size={200} />
        </div>
      </div>

      {/* Floating chat messages */}
      <div className="absolute top-0 right-0 md:right-4 z-20">
        <ChatBubble3D side="right" delay={0.6} className="animate-float-gentle">
          Quel est le statut de ma commande ?
        </ChatBubble3D>
      </div>

      <div className="absolute top-28 -left-4 md:left-0 z-20">
        <ChatBubble3D side="left" delay={1}>
          <p>Commande <strong className="text-purple-300">#4521</strong> expédiée hier à 14h30.</p>
          <p className="text-xs mt-1.5 opacity-70 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-400" />
            Vérifié en temps réel
          </p>
        </ChatBubble3D>
      </div>

      <div className="absolute bottom-20 -right-2 md:right-6 z-20">
        <ChatBubble3D side="right" delay={1.5} className="animate-float-delayed">
          Envoie un e-mail de suivi au client
        </ChatBubble3D>
      </div>

      <div className="absolute bottom-4 -left-2 md:left-2 z-20">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.9, duration: 0.5 }} className="animate-float-gentle" style={{ animationDelay: "2s" }}>
          <div className="glass-strong px-4 py-2.5 rounded-2xl rounded-bl-md text-sm flex items-center gap-2 shadow-xl max-w-[250px]">
            <Zap className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>E-mail envoyé avec succès</span>
          </div>
        </motion.div>
      </div>

      {/* Floating badges */}
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.2 }} className="absolute top-6 left-1/2 translate-x-12 z-30">
        <div className="glass-strong px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 animate-float" style={{ animationDelay: "1s" }}>
          <Mic className="w-3 h-3 text-green-400" /> Voix activée
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.5 }} className="absolute bottom-32 left-1/2 -translate-x-[150px] z-30">
        <div className="glass-strong px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 animate-float-delayed" style={{ animationDelay: "2s" }}>
          <Shield className="w-3 h-3 text-blue-400" /> Chiffré de bout en bout
        </div>
      </motion.div>
    </div>
  );
}

/* ══════════ Assistants data ══════════ */
const ASSISTANTS = [
  { name: "Amara", role: "Service client", photo: "/avatars/amara.jpg", gradient: "from-amber-500 to-orange-500" },
  { name: "Sophie", role: "Assistante commerciale", photo: "/avatars/sophie.jpg", gradient: "from-pink-500 to-rose-500" },
  { name: "Mei", role: "Support technique", photo: "/avatars/mei.jpg", gradient: "from-blue-500 to-cyan-500" },
  { name: "Fatou", role: "Gestion RH", photo: "/avatars/fatou.jpg", gradient: "from-emerald-500 to-teal-500" },
  { name: "Elena", role: "Assistante juridique", photo: "/avatars/elena.jpg", gradient: "from-violet-500 to-purple-500" },
];

/* ═══════════════════════════════════════ */
/* ══════════ MAIN PAGE ══════════════════ */
/* ═══════════════════════════════════════ */
export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 grid-pattern pointer-events-none" />

      {/* ━━━ HEADER ━━━ */}
      <motion.header
        style={{ backgroundColor: `hsl(var(--background) / ${headerBg})` }}
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b border-transparent"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">EMEFA</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[["Fonctionnalités", "#features"], ["Assistants", "#assistants"], ["Sécurité", "#security"], ["Comment ça marche", "#how-it-works"]].map(([l, h]) => (
              <a key={h} href={h} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l}</a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {mounted && (
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2.5 rounded-xl glass hover:bg-white/10 transition-all" aria-label="Thème">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <Link href="/auth" className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Connexion</Link>
            <Link href="/auth" className="group px-6 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2">
              Commencer <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ━━━ HERO ━━━ */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* BG effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] animate-morph bg-gradient-to-br from-purple-500/12 via-violet-500/6 to-fuchsia-500/12 blur-[100px]" />
          <div className="absolute top-16 right-[10%] w-80 h-80 rounded-full bg-blue-500/6 blur-[80px] animate-float-delayed" />
          <div className="absolute bottom-20 left-[8%] w-72 h-72 rounded-full bg-fuchsia-500/6 blur-[80px] animate-float-slow" />
          {[...Array(8)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 rounded-full bg-purple-400/25 animate-particle" style={{ top: `${12 + i * 11}%`, left: `${8 + i * 12}%`, animationDelay: `${i * 0.9}s` }} />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — Copy */}
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-purple-300 mb-6">
                <Sparkles className="w-4 h-4" />
                Intelligence artificielle de nouvelle génération
              </motion.div>

              <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-6xl lg:text-[4.2rem] font-bold leading-[1.06] tracking-tight mb-6">
                Créez votre<br />
                <span className="text-gradient">assistante IA</span><br />
                à votre image
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed">
                Déployez des assistants intelligents connectés à vos données, accessibles par chat, voix, Telegram et WhatsApp — en quelques minutes seulement.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-2xl text-lg font-semibold hover:shadow-xl hover:shadow-purple-500/25 transition-all glow-primary">
                  <Zap className="w-5 h-5" />
                  Créer mon assistante
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#assistants" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-lg font-medium glass hover:bg-white/10 transition-all">
                  Découvrir <ChevronRight className="w-5 h-5" />
                </a>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="flex items-center gap-6 mt-10 pt-8 border-t border-border/50">
                {[["500+", "Assistants déployés"], ["99,9%", "Disponibilité"], ["<200ms", "Temps de réponse"]].map(([v, l]) => (
                  <div key={l}><p className="text-2xl font-bold">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right — 3D Scene */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block perspective"
            >
              <HeroScene />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━ TRUST BAR ━━━ */}
      <Section className="py-14 border-y border-border/40">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.p variants={fadeUp} custom={0} className="text-xs text-muted-foreground uppercase tracking-[0.2em] mb-8">Infrastructure de confiance</motion.p>
          <motion.div variants={fadeUp} custom={1} className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-40">
            {["LiveKit WebRTC", "PostgreSQL", "Recherche vectorielle", "Sandbox sécurisé", "Compatible OpenAI"].map((t) => (
              <span key={t} className="text-sm md:text-base font-semibold tracking-wide whitespace-nowrap">{t}</span>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ━━━ ASSISTANTS SHOWCASE ━━━ */}
      <Section id="assistants" className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-3">Vos assistants</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold mb-4">
              Une assistante à <span className="text-gradient">votre image</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Créez des assistants qui reflètent votre marque. Chaque assistant est unique, intelligent et prêt à agir pour vous.
            </motion.p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {ASSISTANTS.map((a, i) => (
              <motion.div key={a.name} variants={fadeUp} custom={i} className="group text-center">
                <div className="relative mx-auto w-40 h-40 mb-5">
                  {/* Hover glow */}
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${a.gradient} opacity-0 group-hover:opacity-25 blur-2xl transition-all duration-700`} />
                  {/* Ring on hover */}
                  <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${a.gradient} opacity-0 group-hover:opacity-70 blur-[2px] transition-all duration-500`} />
                  {/* Photo */}
                  <div className="relative w-full h-full rounded-full overflow-hidden border-[3px] border-border group-hover:border-transparent transition-colors duration-500 shadow-xl">
                    <img src={a.photo} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  </div>
                  {/* Online dot */}
                  <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-[3px] border-background shadow-lg" />
                </div>
                <h3 className="font-bold text-base">{a.name}</h3>
                <p className="text-sm text-muted-foreground">{a.role}</p>
              </motion.div>
            ))}
          </div>

          <motion.p variants={fadeUp} custom={6} className="text-center mt-12 text-muted-foreground">
            Et des centaines d&apos;autres possibilités — chaque assistant est <strong className="text-foreground">entièrement personnalisable</strong>.
          </motion.p>
        </div>
      </Section>

      {/* ━━━ FEATURES ━━━ */}
      <Section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-3">Fonctionnalités</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold mb-4">Tout ce dont vous avez <span className="text-gradient">besoin</span></motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto">Une plateforme complète pour créer, déployer et gérer vos assistants IA professionnels.</motion.p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: <MessageSquare className="w-6 h-6" />, title: "Chat intelligent", desc: "Conversations contextuelles avec mémoire persistante. Votre assistant exploite votre base de connaissances pour des réponses précises et sourcées.", color: "from-purple-500 to-violet-600" },
              { icon: <Mic className="w-6 h-6" />, title: "Voix en temps réel", desc: "Échangez directement par la voix grâce au WebRTC. Transcription automatique et résumé de chaque conversation inclus.", color: "from-blue-500 to-cyan-500" },
              { icon: <Globe className="w-6 h-6" />, title: "Déploiement multicanal", desc: "Chat web, Telegram, WhatsApp — votre assistant est disponible là où se trouvent vos clients et collaborateurs.", color: "from-emerald-500 to-teal-500" },
              { icon: <Brain className="w-6 h-6" />, title: "Base de connaissances", desc: "Importez vos PDF, URL ou textes. Recherche hybride vectorielle et sémantique pour des réponses toujours pertinentes.", color: "from-amber-500 to-orange-500" },
              { icon: <Zap className="w-6 h-6" />, title: "Actions automatisées", desc: "Envoi d'e-mails, mise à jour du CRM, gestion de calendrier — votre assistant agit pour vous en toute autonomie.", color: "from-pink-500 to-rose-500" },
              { icon: <Lock className="w-6 h-6" />, title: "Sécurité de niveau entreprise", desc: "Chiffrement de bout en bout, isolation des données, journal d'audit complet et protection contre les injections.", color: "from-indigo-500 to-purple-500" },
            ].map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i} className="group relative p-8 rounded-3xl glass card-hover overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-5 shadow-lg`}>{f.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ SECURITY ━━━ */}
      <Section id="security" className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Shield visual */}
            <motion.div variants={fadeIn} className="flex justify-center perspective">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-[100px] animate-pulse-glow" />
                <motion.div animate={{ rotateY: [0, 8, -8, 0], rotateX: [0, 5, -5, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="preserve-3d">
                  <div className="relative w-72 h-72 mx-auto">
                    <div className="absolute inset-0 rounded-full border-2 border-purple-500/15 animate-ring-pulse" />
                    <div className="absolute inset-4 rounded-full border border-purple-500/10 animate-ring-pulse" style={{ animationDelay: "1s" }} />
                    <div className="absolute inset-10 rounded-3xl glass-strong glow-primary flex items-center justify-center">
                      <svg viewBox="0 0 80 80" width="80" height="80" fill="none">
                        <defs><linearGradient id="sg" x1="0" y1="0" x2="80" y2="80"><stop offset="0%" stopColor="#A855F7" /><stop offset="100%" stopColor="#D946EF" /></linearGradient></defs>
                        <path d="M40 8 L68 22 L68 42 C68 58 54 70 40 74 C26 70 12 58 12 42 L12 22 Z" fill="url(#sg)" opacity="0.2" />
                        <path d="M40 8 L68 22 L68 42 C68 58 54 70 40 74 C26 70 12 58 12 42 L12 22 Z" stroke="url(#sg)" strokeWidth="2" fill="none" />
                        <path d="M30 40 L37 47 L52 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="absolute top-3 right-8 glass-strong w-11 h-11 rounded-xl flex items-center justify-center animate-float" style={{ animationDelay: "0.5s" }}><Lock className="w-5 h-5 text-blue-400" /></div>
                    <div className="absolute bottom-8 left-3 glass-strong w-11 h-11 rounded-xl flex items-center justify-center animate-float-delayed"><Shield className="w-5 h-5 text-green-400" /></div>
                    <div className="absolute bottom-3 right-3 glass-strong w-11 h-11 rounded-xl flex items-center justify-center animate-float-gentle" style={{ animationDelay: "1.5s" }}><Search className="w-5 h-5 text-purple-400" /></div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right — Copy */}
            <div>
              <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-3">Sécurité</motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold mb-6">Protégé par <span className="text-gradient">design</span></motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Chaque couche de la plateforme a été conçue avec la sécurité comme priorité absolue. Vos données restent les vôtres — toujours.
              </motion.p>
              <div className="space-y-5">
                {[
                  { icon: <Lock className="w-5 h-5" />, title: "Chiffrement AES-256-GCM", desc: "Toutes vos données sont chiffrées au repos et en transit. Aucune télémétrie, aucun partage avec des tiers." },
                  { icon: <Shield className="w-5 h-5" />, title: "Exécution en bac à sable", desc: "Chaque outil et action s'exécute dans un environnement isolé avec des permissions strictement contrôlées." },
                  { icon: <CheckCircle2 className="w-5 h-5" />, title: "Protection anti-injection", desc: "Détection et blocage automatique des tentatives d'injection de prompts malveillants en temps réel." },
                  { icon: <Users className="w-5 h-5" />, title: "Isolation multi-tenant", desc: "Chaque espace de travail est entièrement cloisonné — données, sessions et configurations sont séparées." },
                  { icon: <Search className="w-5 h-5" />, title: "Journal d'audit complet", desc: "Chaque action est tracée avec horodatage, adresse IP et identifiant utilisateur pour une traçabilité totale." },
                ].map((item, i) => (
                  <motion.div key={item.title} variants={fadeUp} custom={i + 3} className="flex gap-4 items-start group">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5 group-hover:bg-purple-500/20 transition-colors">{item.icon}</div>
                    <div><h4 className="font-semibold mb-1">{item.title}</h4><p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <Section id="how-it-works" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-3">Comment ça marche</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold mb-4">Prêt en <span className="text-gradient">3 étapes</span></motion.h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { step: "01", title: "Configurez", desc: "Définissez le nom, l'objectif, le ton et la langue de votre assistant. Le prompt système est généré automatiquement.", icon: <Bot className="w-8 h-8" /> },
              { step: "02", title: "Enrichissez", desc: "Importez vos documents, URL et textes. L'IA indexe et vectorise le contenu pour une recherche ultra-rapide.", icon: <Brain className="w-8 h-8" /> },
              { step: "03", title: "Déployez", desc: "Activez les canaux souhaités — chat, voix, Telegram, WhatsApp — et votre assistant est opérationnel.", icon: <Sparkles className="w-8 h-8" /> },
            ].map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} custom={i} className="relative text-center">
                {i < 2 && <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-purple-500/30 to-transparent" />}
                <div className="relative inline-flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full glass-strong flex items-center justify-center mb-6 relative glow-primary">
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10" />
                    {s.icon}
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-xs font-bold flex items-center justify-center shadow-lg">{s.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ STATS ━━━ */}
      <Section className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="text-4xl md:text-5xl font-bold mb-4">La plateforme en <span className="text-gradient">chiffres</span></motion.h2>
          </div>
          <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: 500, suffix: "+", label: "Assistants déployés" },
              { value: 2000000, suffix: "+", label: "Messages traités" },
              { value: 99, suffix: ",9%", label: "Disponibilité" },
              { value: 4, suffix: " canaux", label: "De communication" },
            ].map((s) => (
              <div key={s.label} className="text-center p-6 rounded-3xl glass card-hover">
                <p className="text-3xl md:text-4xl font-bold text-gradient mb-2"><Counter target={s.value} suffix={s.suffix} /></p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ━━━ CTA ━━━ */}
      <Section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-purple-500/10 rounded-[40px] blur-3xl" />
          <motion.div variants={fadeUp} custom={0} className="relative glass-strong rounded-[32px] p-12 md:p-20 glow-primary-strong">
            {/* Mini avatar row */}
            <div className="flex justify-center -space-x-3 mb-8">
              {ASSISTANTS.map((a) => (
                <div key={a.name} className="w-14 h-14 rounded-full border-[3px] border-background overflow-hidden shadow-lg">
                  <img src={a.photo} alt={a.name} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <h2 className="text-4xl md:text-5xl font-bold mb-6">Prêt à créer votre <span className="text-gradient">assistante IA</span> ?</h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Rejoignez des centaines d&apos;entreprises qui utilisent EMEFA pour automatiser leur service client, leurs ventes et leurs opérations.
            </p>
            <Link href="/auth" className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-2xl text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all">
              <Zap className="w-5 h-5" /> Commencer gratuitement <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </Section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-border/40 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center"><Bot className="w-5 h-5 text-white" /></div>
                <span className="text-lg font-bold text-gradient">EMEFA</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">Plateforme de création d&apos;assistants IA professionnels de nouvelle génération.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Produit</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#security" className="hover:text-foreground transition-colors">Sécurité</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Comment ça marche</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Canaux</h4>
              <ul className="space-y-2 text-sm text-muted-foreground"><li>Chat web</li><li>Voix en temps réel</li><li>Telegram</li><li>WhatsApp</li></ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Avantages</h4>
              <ul className="space-y-2 text-sm text-muted-foreground"><li>Chiffrement de bout en bout</li><li>Recherche vectorielle hybride</li><li>Multi-tenant isolé</li><li>API compatible OpenAI</li></ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} EMEFA. Tous droits réservés.</p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Mentions légales</a>
              <a href="#" className="hover:text-foreground transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-foreground transition-colors">CGU</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
