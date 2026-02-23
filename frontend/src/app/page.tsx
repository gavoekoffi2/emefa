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
  Play,
  Search,
  Shield,
  Sparkles,
  Star,
  Sun,
  Users,
  Zap,
} from "lucide-react";

/* ══════════ Animation variants ══════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  }),
};
const fadeIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: "easeOut" } },
};
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };
const slideFromLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};
const slideFromRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
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
    const step = target / 80;
    const t = setInterval(() => { s += step; if (s >= target) { setCount(target); clearInterval(t); } else setCount(Math.floor(s)); }, 16);
    return () => clearInterval(t);
  }, [inView, target]);
  return <span ref={ref}>{count.toLocaleString("fr-FR")}{suffix}</span>;
}

/* ══════════ Premium Photo Avatar ══════════ */
function PhotoAvatar({ src, alt, size = 192, className = "", ring = true, glow = false }: {
  src: string; alt: string; size?: number; className?: string; ring?: boolean; glow?: boolean;
}) {
  return (
    <div className={`relative group ${className}`} style={{ width: size, height: size }}>
      {glow && (
        <div className="absolute -inset-8 rounded-full bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 blur-[40px] animate-pulse-glow" />
      )}
      {ring && (
        <>
          <div className="absolute -inset-[3px] rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 animate-gradient-rotate opacity-60 blur-[2px]" />
          <div className="absolute -inset-[2px] rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 animate-gradient-rotate opacity-40" />
        </>
      )}
      <div className="relative w-full h-full rounded-full overflow-hidden border-[3px] border-background shadow-2xl">
        <img src={src} alt={alt} className="w-full h-full object-cover" loading="eager" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-white/5" />
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
      initial={{ opacity: 0, y: 20, scale: 0.92, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className={`${side === "right" ? "ml-auto" : ""} ${className}`}
    >
      <div className={`
        relative px-5 py-3.5 rounded-2xl text-sm leading-relaxed max-w-[260px]
        ${side === "right"
          ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-br-md shadow-xl shadow-violet-500/25"
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
    <div className="relative w-full max-w-lg mx-auto" style={{ minHeight: 520 }}>
      {/* Deep glow layers */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-gradient-to-r from-violet-600/15 via-purple-500/10 to-fuchsia-500/15 rounded-full blur-[120px] animate-pulse-glow" />
      <div className="absolute top-1/3 left-1/3 w-60 h-60 bg-amber-500/8 rounded-full blur-[80px] animate-float-slow" />

      {/* Orbiting particles */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
        <div className="animate-orbit"><div className="w-2.5 h-2.5 rounded-full bg-violet-400/40 blur-[1px]" /></div>
        <div className="animate-orbit-reverse"><div className="w-2 h-2 rounded-full bg-fuchsia-400/30 blur-[1px]" /></div>
        <div className="animate-orbit-small" style={{ animationDelay: "3s" }}><div className="w-1.5 h-1.5 rounded-full bg-amber-400/35 blur-[1px]" /></div>
      </div>

      {/* Pulsing rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="w-72 h-72 rounded-full border border-violet-500/10 animate-ring-pulse" />
        <div className="w-72 h-72 rounded-full border border-violet-500/8 animate-ring-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* Main avatar */}
      <div className="relative z-10 flex justify-center pt-6">
        <div className="animate-avatar-breathe">
          <PhotoAvatar src="/avatars/amara.jpg" alt="Amara — Assistante IA EMEFA" size={210} glow />
        </div>
      </div>

      {/* Floating chat messages */}
      <div className="absolute top-2 right-0 md:right-2 z-20">
        <ChatBubble3D side="right" delay={0.6} className="animate-float-gentle">
          Quel est le statut de ma commande ?
        </ChatBubble3D>
      </div>

      <div className="absolute top-32 -left-6 md:-left-2 z-20">
        <ChatBubble3D side="left" delay={1}>
          <p>Commande <strong className="text-violet-300">#4521</strong> expédiée hier.</p>
          <p className="text-xs mt-1.5 opacity-70 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Vérifié en temps réel
          </p>
        </ChatBubble3D>
      </div>

      <div className="absolute bottom-24 -right-4 md:right-4 z-20">
        <ChatBubble3D side="right" delay={1.5} className="animate-float-delayed">
          Envoie un e-mail de suivi
        </ChatBubble3D>
      </div>

      <div className="absolute bottom-4 -left-4 md:left-0 z-20">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.9, duration: 0.5 }} className="animate-float-gentle" style={{ animationDelay: "2s" }}>
          <div className="glass-strong px-4 py-2.5 rounded-2xl rounded-bl-md text-sm flex items-center gap-2 shadow-xl max-w-[240px]">
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="w-3 h-3 text-emerald-400" /></div>
            <span>E-mail envoyé avec succès</span>
          </div>
        </motion.div>
      </div>

      {/* Floating badges */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.2 }} className="absolute top-4 left-1/2 translate-x-14 z-30">
        <div className="glass-strong px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 animate-float" style={{ animationDelay: "1s" }}>
          <Mic className="w-3 h-3 text-emerald-400" /> Voix activée
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5 }} className="absolute bottom-36 left-1/2 -translate-x-[160px] z-30">
        <div className="glass-strong px-3 py-1.5 rounded-full text-[11px] font-medium flex items-center gap-1.5 animate-float-delayed" style={{ animationDelay: "2s" }}>
          <Shield className="w-3 h-3 text-violet-400" /> Chiffré AES-256
        </div>
      </motion.div>
    </div>
  );
}

/* ══════════ Assistants data — All African ══════════ */
const ASSISTANTS = [
  { name: "Amara", role: "Service client", photo: "/avatars/amara.jpg", gradient: "from-amber-500 to-orange-500", desc: "Gère vos demandes clients avec empathie et précision" },
  { name: "Fatou", role: "Gestion RH", photo: "/avatars/fatou.jpg", gradient: "from-emerald-500 to-teal-500", desc: "Automatise le recrutement et la gestion des équipes" },
  { name: "Awa", role: "Assistante commerciale", photo: "/avatars/awa.jpg", gradient: "from-violet-500 to-purple-600", desc: "Qualifie vos prospects et booste vos conversions" },
  { name: "Nana", role: "Support technique", photo: "/avatars/nana.jpg", gradient: "from-blue-500 to-cyan-500", desc: "Résout les problèmes techniques en temps réel" },
  { name: "Aisha", role: "Assistante juridique", photo: "/avatars/aisha.jpg", gradient: "from-rose-500 to-pink-500", desc: "Analyse vos documents et clarifie le cadre légal" },
];

/* ═══════════════════════════════════════ */
/* ══════════ MAIN PAGE ══════════════════ */
/* ═══════════════════════════════════════ */
export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(scrollYProgress, [0, 0.03], [0, 1]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      <div className="fixed inset-0 grid-pattern pointer-events-none" />
      <div className="fixed inset-0 noise-texture pointer-events-none opacity-50" />

      {/* ━━━ HEADER ━━━ */}
      <motion.header
        style={{ backgroundColor: `hsl(var(--background) / ${headerBg})` }}
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-2xl border-b border-transparent"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25 group-hover:shadow-violet-500/40 transition-all group-hover:scale-105">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">EMEFA</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[["Fonctionnalités", "#features"], ["Assistants", "#assistants"], ["Sécurité", "#security"], ["Comment ça marche", "#how-it-works"]].map(([l, h]) => (
              <a key={h} href={h} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">{l}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {mounted && (
              <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="p-2.5 rounded-xl hover:bg-white/5 transition-all" aria-label="Thème">
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <Link href="/auth" className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">Connexion</Link>
            <Link href="/auth" className="group px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center gap-1.5 btn-shine">
              Commencer <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ━━━ HERO ━━━ */}
      <section className="relative pt-28 pb-16 md:pt-40 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] animate-morph bg-gradient-to-br from-violet-600/10 via-purple-500/5 to-fuchsia-500/10 blur-[120px]" />
          <div className="absolute top-10 right-[8%] w-96 h-96 rounded-full bg-blue-600/5 blur-[100px] animate-float-delayed" />
          <div className="absolute bottom-16 left-[5%] w-80 h-80 rounded-full bg-amber-500/5 blur-[80px] animate-float-slow" />
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 rounded-full bg-violet-400/20 animate-particle" style={{ top: `${15 + i * 13}%`, left: `${10 + i * 14}%`, animationDelay: `${i * 1.1}s` }} />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm mb-6 animate-border-glow">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-muted-foreground">Intelligence artificielle de nouvelle génération</span>
              </motion.div>

              <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight mb-7">
                Créez votre{" "}
                <span className="text-gradient">assistante IA</span>
                <br />
                à votre image
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
                Déployez des assistants intelligents connectés à vos données, accessibles par chat, voix, Telegram et WhatsApp — en quelques minutes.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth" className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-2xl text-lg font-semibold hover:shadow-2xl hover:shadow-violet-500/25 transition-all btn-shine">
                  <Zap className="w-5 h-5" />
                  Créer mon assistante
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a href="#assistants" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-lg font-medium glass hover:bg-white/5 transition-all">
                  <Play className="w-4 h-4" /> Découvrir
                </a>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="flex items-center gap-8 mt-12 pt-8 border-t border-border/30">
                {[["500+", "Assistants"], ["99,9%", "Disponibilité"], ["<200ms", "Latence"]].map(([v, l]) => (
                  <div key={l}>
                    <p className="text-2xl font-bold text-gradient">{v}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{l}</p>
                  </div>
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
      <Section className="py-12 border-y border-border/30">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.p variants={fadeUp} custom={0} className="text-[11px] text-muted-foreground uppercase tracking-[0.25em] mb-8 font-medium">Technologies de confiance</motion.p>
          <motion.div variants={fadeUp} custom={1} className="flex flex-wrap items-center justify-center gap-x-14 gap-y-4 opacity-35">
            {["LiveKit WebRTC", "PostgreSQL", "Recherche Vectorielle", "Sandbox Sécurisé", "API OpenAI"].map((t) => (
              <span key={t} className="text-sm font-semibold tracking-wider whitespace-nowrap">{t}</span>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ━━━ ASSISTANTS SHOWCASE ━━━ */}
      <Section id="assistants" className="py-28 md:py-36 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.015] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">
              <Users className="w-3.5 h-3.5" /> Vos assistants
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-extrabold mb-5">
              Des assistantes <span className="text-gradient">à votre image</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Chaque assistante est unique, intelligente et prête à représenter votre marque avec excellence.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {ASSISTANTS.map((a, i) => (
              <motion.div key={a.name} variants={fadeUp} custom={i} className="group text-center">
                <div className="relative mx-auto w-44 h-44 mb-6">
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${a.gradient} opacity-0 group-hover:opacity-20 blur-3xl transition-all duration-700`} />
                  <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${a.gradient} opacity-0 group-hover:opacity-60 blur-[3px] transition-all duration-500`} />
                  <div className="relative w-full h-full rounded-full overflow-hidden border-[3px] border-border/50 group-hover:border-transparent transition-all duration-500 shadow-xl group-hover:shadow-2xl">
                    <img src={a.photo} alt={a.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-3 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <span className="text-white text-xs font-medium px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">{a.role}</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-[3px] border-background shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <h3 className="font-bold text-lg">{a.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.p variants={fadeUp} custom={6} className="text-center mt-16 text-muted-foreground text-lg">
            Et des centaines d&apos;autres possibilités — chaque assistante est{" "}
            <strong className="text-foreground">100% personnalisable</strong>.
          </motion.p>
        </div>
      </Section>

      {/* ━━━ FEATURES ━━━ */}
      <Section id="features" className="py-28 md:py-36">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">
              <Zap className="w-3.5 h-3.5" /> Fonctionnalités
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-extrabold mb-5">
              Tout ce dont vous avez <span className="text-gradient">besoin</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Une plateforme complète pour créer, déployer et gérer vos assistants IA professionnels.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: <MessageSquare className="w-6 h-6" />, title: "Chat intelligent", desc: "Conversations contextuelles avec mémoire persistante et recherche dans votre base de connaissances.", color: "from-violet-500 to-purple-600", iconBg: "bg-violet-500/10 text-violet-400" },
              { icon: <Mic className="w-6 h-6" />, title: "Voix en temps réel", desc: "Échangez par la voix grâce au WebRTC. Transcription et résumé automatiques inclus.", color: "from-blue-500 to-cyan-500", iconBg: "bg-blue-500/10 text-blue-400" },
              { icon: <Globe className="w-6 h-6" />, title: "Déploiement multicanal", desc: "Chat web, Telegram, WhatsApp — votre assistant est disponible partout où sont vos clients.", color: "from-emerald-500 to-teal-500", iconBg: "bg-emerald-500/10 text-emerald-400" },
              { icon: <Brain className="w-6 h-6" />, title: "Base de connaissances", desc: "Importez PDF, URL ou textes. Recherche hybride vectorielle pour des réponses toujours pertinentes.", color: "from-amber-500 to-orange-500", iconBg: "bg-amber-500/10 text-amber-400" },
              { icon: <Zap className="w-6 h-6" />, title: "Actions automatisées", desc: "Envoi d'e-mails, CRM, calendrier — votre assistant agit pour vous en toute autonomie.", color: "from-rose-500 to-pink-500", iconBg: "bg-rose-500/10 text-rose-400" },
              { icon: <Lock className="w-6 h-6" />, title: "Sécurité entreprise", desc: "Chiffrement bout en bout, isolation des données, audit complet et anti-injection.", color: "from-indigo-500 to-violet-500", iconBg: "bg-indigo-500/10 text-indigo-400" },
            ].map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} custom={i} className="group relative p-8 rounded-3xl glass-card overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700`} />
                <div className={`w-14 h-14 rounded-2xl ${f.iconBg} flex items-center justify-center mb-6`}>{f.icon}</div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-[15px]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ SECURITY ━━━ */}
      <Section id="security" className="py-28 md:py-36 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.015] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left — Shield visual */}
            <motion.div variants={fadeIn} className="flex justify-center perspective order-2 lg:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-violet-500/8 rounded-full blur-[120px] animate-pulse-glow" />
                <motion.div animate={{ rotateY: [0, 6, -6, 0], rotateX: [0, 4, -4, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} className="preserve-3d">
                  <div className="relative w-80 h-80 mx-auto">
                    <div className="absolute inset-0 rounded-full border border-violet-500/10 animate-ring-pulse" />
                    <div className="absolute inset-5 rounded-full border border-violet-500/8 animate-ring-pulse" style={{ animationDelay: "1s" }} />
                    <div className="absolute inset-12 rounded-3xl glass-strong glow-primary flex items-center justify-center">
                      <svg viewBox="0 0 80 80" width="90" height="90" fill="none">
                        <defs><linearGradient id="sg" x1="0" y1="0" x2="80" y2="80"><stop offset="0%" stopColor="#7C3AED" /><stop offset="100%" stopColor="#D946EF" /></linearGradient></defs>
                        <path d="M40 8 L68 22 L68 42 C68 58 54 70 40 74 C26 70 12 58 12 42 L12 22 Z" fill="url(#sg)" opacity="0.15" />
                        <path d="M40 8 L68 22 L68 42 C68 58 54 70 40 74 C26 70 12 58 12 42 L12 22 Z" stroke="url(#sg)" strokeWidth="2" fill="none" />
                        <path d="M30 40 L37 47 L52 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="absolute top-2 right-6 glass-strong w-12 h-12 rounded-2xl flex items-center justify-center animate-float shadow-lg" style={{ animationDelay: "0.5s" }}><Lock className="w-5 h-5 text-blue-400" /></div>
                    <div className="absolute bottom-6 left-2 glass-strong w-12 h-12 rounded-2xl flex items-center justify-center animate-float-delayed shadow-lg"><Shield className="w-5 h-5 text-emerald-400" /></div>
                    <div className="absolute bottom-2 right-2 glass-strong w-12 h-12 rounded-2xl flex items-center justify-center animate-float-gentle shadow-lg" style={{ animationDelay: "1.5s" }}><Search className="w-5 h-5 text-violet-400" /></div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right — Copy */}
            <div className="order-1 lg:order-2">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">
                <Shield className="w-3.5 h-3.5" /> Sécurité
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-extrabold mb-6">
                Protégé par <span className="text-gradient">design</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Chaque couche de la plateforme est conçue avec la sécurité comme priorité. Vos données restent les vôtres — toujours.
              </motion.p>
              <div className="space-y-5">
                {[
                  { icon: <Lock className="w-5 h-5" />, title: "Chiffrement AES-256-GCM", desc: "Données chiffrées au repos et en transit. Aucune télémétrie, aucun partage tiers." },
                  { icon: <Shield className="w-5 h-5" />, title: "Exécution en bac à sable", desc: "Chaque outil s'exécute dans un environnement isolé avec des permissions strictes." },
                  { icon: <CheckCircle2 className="w-5 h-5" />, title: "Protection anti-injection", desc: "Blocage automatique des tentatives d'injection de prompts malveillants." },
                  { icon: <Users className="w-5 h-5" />, title: "Isolation multi-tenant", desc: "Chaque workspace est cloisonné — données, sessions et configurations séparées." },
                  { icon: <Search className="w-5 h-5" />, title: "Journal d'audit complet", desc: "Chaque action tracée avec horodatage, IP et identifiant pour une traçabilité totale." },
                ].map((item, i) => (
                  <motion.div key={item.title} variants={fadeUp} custom={i + 3} className="flex gap-4 items-start group">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/8 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5 group-hover:bg-violet-500/15 transition-all duration-300">{item.icon}</div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <Section id="how-it-works" className="py-28 md:py-36">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Processus
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-extrabold mb-5">
              Prête en <span className="text-gradient">3 étapes</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              De l&apos;idée au déploiement, en quelques minutes seulement.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
            {/* Connecting lines */}
            <div className="hidden md:block absolute top-20 left-[33%] right-[33%] h-px bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-violet-500/30" />

            {[
              { step: "01", title: "Configurez", desc: "Définissez le nom, l'objectif, le ton et la langue. Le prompt système est généré automatiquement par notre IA.", icon: <Bot className="w-7 h-7" />, color: "from-violet-500 to-purple-600" },
              { step: "02", title: "Enrichissez", desc: "Importez documents, URL et textes. L'IA indexe et vectorise le contenu pour une recherche ultra-rapide.", icon: <Brain className="w-7 h-7" />, color: "from-fuchsia-500 to-rose-500" },
              { step: "03", title: "Déployez", desc: "Activez les canaux — chat, voix, Telegram, WhatsApp — et votre assistante est immédiatement opérationnelle.", icon: <Sparkles className="w-7 h-7" />, color: "from-amber-500 to-orange-500" },
            ].map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} custom={i} className="relative text-center group">
                <div className="relative inline-flex flex-col items-center">
                  <div className={`w-40 h-40 rounded-full glass-card flex items-center justify-center mb-8 relative overflow-hidden`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`} />
                    <div className="text-foreground">{s.icon}</div>
                    <span className={`absolute -top-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-r ${s.color} text-white text-xs font-bold flex items-center justify-center shadow-lg`}>{s.step}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs text-[15px]">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ TESTIMONIALS / SOCIAL PROOF ━━━ */}
      <Section className="py-28 md:py-36 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.015] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">
              <Star className="w-3.5 h-3.5" /> Témoignages
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-extrabold mb-5">
              Ils nous font <span className="text-gradient">confiance</span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Kofi Mensah", role: "CEO, TechAfrica", text: "EMEFA a transformé notre service client. Nos temps de réponse sont passés de 2h à moins de 30 secondes.", stars: 5 },
              { name: "Adama Diallo", role: "DRH, FinCorp Dakar", text: "L'assistante RH gère désormais 80% des questions récurrentes de nos 200 employés. Un gain de temps incroyable.", stars: 5 },
              { name: "Chinwe Okafor", role: "Fondatrice, LegalTech Lagos", text: "La recherche dans notre base juridique est bluffante. L'IA retrouve les articles pertinents en millisecondes.", stars: 5 },
            ].map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i} className="p-8 rounded-3xl glass-card">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ STATS ━━━ */}
      <Section className="py-28 md:py-36">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="text-4xl md:text-6xl font-extrabold mb-5">
              La plateforme en <span className="text-gradient">chiffres</span>
            </motion.h2>
          </div>
          <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { value: 500, suffix: "+", label: "Assistants déployés" },
              { value: 2000000, suffix: "+", label: "Messages traités" },
              { value: 99, suffix: ",9%", label: "Disponibilité" },
              { value: 4, suffix: " canaux", label: "De communication" },
            ].map((s) => (
              <div key={s.label} className="text-center p-8 rounded-3xl glass-card">
                <p className="text-3xl md:text-4xl font-extrabold text-gradient mb-2">
                  <Counter target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ━━━ CTA ━━━ */}
      <Section className="py-28 md:py-36">
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/8 via-fuchsia-500/8 to-violet-500/8 rounded-[40px] blur-3xl" />
          <motion.div variants={fadeUp} custom={0} className="relative glass-strong rounded-[32px] p-14 md:p-20 glow-primary-strong overflow-hidden">
            <div className="absolute inset-0 noise-texture opacity-30 pointer-events-none" />

            {/* Mini avatar row */}
            <div className="relative flex justify-center -space-x-3 mb-10">
              {ASSISTANTS.map((a, i) => (
                <motion.div
                  key={a.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="w-16 h-16 rounded-full border-[3px] border-background overflow-hidden shadow-xl"
                >
                  <img src={a.photo} alt={a.name} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>

            <h2 className="relative text-4xl md:text-5xl font-extrabold mb-6">
              Prête à créer votre <span className="text-gradient">assistante IA</span> ?
            </h2>
            <p className="relative text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Rejoignez des centaines d&apos;entreprises africaines qui utilisent EMEFA pour transformer leurs opérations.
            </p>
            <Link href="/auth" className="relative group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-2xl text-lg font-semibold hover:shadow-2xl hover:shadow-violet-500/30 transition-all btn-shine">
              <Zap className="w-5 h-5" /> Commencer gratuitement <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </Section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-border/30 py-14">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gradient">EMEFA</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Plateforme africaine de création d&apos;assistants IA professionnels de nouvelle génération.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Produit</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#security" className="hover:text-foreground transition-colors">Sécurité</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Comment ça marche</a></li>
                <li><a href="#assistants" className="hover:text-foreground transition-colors">Assistants</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Canaux</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>Chat web</li>
                <li>Voix en temps réel</li>
                <li>Telegram</li>
                <li>WhatsApp</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Avantages</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li>Chiffrement bout en bout</li>
                <li>Recherche vectorielle hybride</li>
                <li>Isolation multi-tenant</li>
                <li>API compatible OpenAI</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
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
