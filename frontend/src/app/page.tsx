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
  Globe,
  Lock,
  MessageSquare,
  Mic,
  Moon,
  Shield,
  Sparkles,
  Sun,
  Zap,
} from "lucide-react";

/* ───────────── Animations helpers ───────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  }),
};
const fadeIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};
const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ───────────── 3D Floating Orb (pure CSS) ───────────── */
function FloatingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Main orb */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] animate-morph animate-float bg-gradient-to-br from-purple-500/20 via-violet-500/10 to-fuchsia-500/20 blur-3xl" />
      {/* Orbiting particles */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 perspective">
        <div className="relative w-0 h-0">
          <div className="absolute animate-orbit">
            <div className="w-3 h-3 rounded-full bg-purple-400/60 blur-[1px]" />
          </div>
          <div className="absolute animate-orbit-reverse">
            <div className="w-2 h-2 rounded-full bg-fuchsia-400/50 blur-[1px]" />
          </div>
        </div>
      </div>
      {/* Side orbs */}
      <div className="absolute top-20 right-[15%] w-72 h-72 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl animate-float-delayed" />
      <div className="absolute bottom-32 left-[10%] w-64 h-64 rounded-full bg-gradient-to-r from-fuchsia-500/10 to-pink-500/10 blur-3xl animate-float-slow" />
      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-purple-400/40 animate-particle"
          style={{
            top: `${15 + i * 14}%`,
            left: `${10 + i * 15}%`,
            animationDelay: `${i * 1.2}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ───────────── 3D Rotating Cube ───────────── */
function RotatingCube() {
  return (
    <div className="perspective">
      <div className="w-32 h-32 relative preserve-3d animate-spin-slow mx-auto">
        {[
          "translate-z-16 bg-gradient-to-br from-purple-500/30 to-violet-600/30",
          "-translate-z-16 bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20",
          "rotate-y-90 translate-z-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20",
          "-rotate-y-90 translate-z-16 bg-gradient-to-br from-violet-500/25 to-pink-500/25",
          "rotate-x-90 translate-z-16 bg-gradient-to-br from-purple-400/20 to-indigo-500/20",
          "-rotate-x-90 translate-z-16 bg-gradient-to-br from-pink-500/20 to-purple-500/20",
        ].map((cls, i) => (
          <div
            key={i}
            className={`absolute inset-0 rounded-2xl border border-white/10 backdrop-blur-sm ${cls}`}
            style={{
              transform: [
                "",
                "translateZ(-64px)",
                "rotateY(90deg) translateZ(64px)",
                "rotateY(-90deg) translateZ(64px)",
                "rotateX(90deg) translateZ(64px)",
                "rotateX(-90deg) translateZ(64px)",
              ][i],
            }}
          />
        ))}
        {/* Bot icon centered inside cube */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ transform: "translateZ(32px)" }}>
          <Bot className="w-12 h-12 text-purple-400/80" />
        </div>
      </div>
    </div>
  );
}

/* ───────────── Stat counter animation ───────────── */
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString("fr-FR")}{suffix}</span>;
}

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Grid pattern */}
      <div className="fixed inset-0 grid-pattern pointer-events-none" />

      {/* ━━━ HEADER ━━━ */}
      <motion.header
        style={{ backgroundColor: `hsl(var(--background) / ${headerBg})` }}
        className="fixed top-0 inset-x-0 z-50 backdrop-blur-xl border-b border-transparent transition-colors"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-shadow">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">EMEFA</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Fonctionnalités
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Comment ça marche
            </a>
            <a href="#security" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Sécurité
            </a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Chiffres
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2.5 rounded-xl glass hover:bg-white/10 transition-all"
                aria-label="Changer le thème"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <Link
              href="/auth"
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
            >
              Connexion
            </Link>
            <Link
              href="/auth"
              className="group px-6 py-2.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
            >
              Commencer gratuitement
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ━━━ HERO ━━━ */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        <FloatingOrbs />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Copy */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-purple-300 mb-6">
                <Sparkles className="w-4 h-4" />
                Propulsé par le moteur IronClaw
              </motion.div>

              <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight mb-6">
                Créez votre
                <br />
                <span className="text-gradient">assistant IA</span>
                <br />
                sur mesure
              </motion.h1>

              <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed">
                Déployez des assistants intelligents connectés à vos données, accessibles par chat, voix, Telegram et WhatsApp — en quelques minutes.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/auth"
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-2xl text-lg font-semibold hover:shadow-xl hover:shadow-purple-500/25 transition-all glow-primary"
                >
                  <Zap className="w-5 h-5" />
                  Créer mon assistant
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-lg font-medium glass hover:bg-white/10 transition-all"
                >
                  Voir la démo
                </a>
              </motion.div>

              {/* Social proof */}
              <motion.div variants={fadeUp} custom={4} className="flex items-center gap-6 mt-10 pt-8 border-t border-border/50">
                <div>
                  <p className="text-2xl font-bold">500+</p>
                  <p className="text-xs text-muted-foreground">Assistants créés</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-2xl font-bold">99,9%</p>
                  <p className="text-xs text-muted-foreground">Disponibilité</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="text-2xl font-bold">&lt;200ms</p>
                  <p className="text-xs text-muted-foreground">Temps de réponse</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right — 3D Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
            >
              <div className="relative">
                {/* Glow behind */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-fuchsia-500/20 rounded-3xl blur-3xl animate-pulse-glow" />

                {/* Main card */}
                <div className="relative glass-strong rounded-3xl p-8 glow-primary">
                  {/* Mock chat interface */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Assistant EMEFA</p>
                        <p className="text-xs text-green-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                          En ligne
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="space-y-3">
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm max-w-[80%]">
                          Quel est le statut de la commande #4521 ?
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="glass px-4 py-2.5 rounded-2xl rounded-bl-md text-sm max-w-[80%]">
                          <p>La commande <strong>#4521</strong> a été expédiée hier à 14h30. Numéro de suivi : <span className="text-purple-400">TR-8847-FR</span>.</p>
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-400" />
                            Source : CRM + Base de données
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm max-w-[80%]">
                          Envoie un email de suivi au client
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="glass px-4 py-2.5 rounded-2xl rounded-bl-md text-sm max-w-[80%]">
                          <p className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            Email de suivi envoyé à client@example.com
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Input mock */}
                    <div className="flex gap-2 pt-2">
                      <div className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-muted-foreground">
                        Tapez votre message...
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Floating badges */}
                  <div className="absolute -top-4 -right-4 glass-strong px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 animate-float">
                    <Mic className="w-3 h-3 text-green-400" />
                    Voix activée
                  </div>
                  <div className="absolute -bottom-3 -left-3 glass-strong px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 animate-float-delayed">
                    <Shield className="w-3 h-3 text-blue-400" />
                    Chiffré AES-256
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━ LOGOS / TRUST BAR ━━━ */}
      <Section className="py-16 border-y border-border/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.p variants={fadeUp} custom={0} className="text-sm text-muted-foreground uppercase tracking-widest mb-8">
            Technologies de confiance
          </motion.p>
          <motion.div variants={fadeUp} custom={1} className="flex flex-wrap items-center justify-center gap-10 md:gap-16 opacity-50">
            {["IronClaw Runtime", "LiveKit WebRTC", "PostgreSQL + pgvector", "WASM Sandbox", "Ollama / OpenAI"].map((t) => (
              <span key={t} className="text-sm md:text-base font-semibold tracking-wide whitespace-nowrap">{t}</span>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ━━━ FEATURES ━━━ */}
      <Section id="features" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-3">
              Fonctionnalités
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold mb-4">
              Tout ce dont vous avez <span className="text-gradient">besoin</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une plateforme complète pour créer, déployer et gérer vos assistants IA professionnels.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: "Chat intelligent",
                desc: "Conversations contextuelles avec mémoire persistante. Votre assistant exploite votre base de connaissances pour des réponses précises.",
                color: "from-purple-500 to-violet-600",
              },
              {
                icon: <Mic className="w-6 h-6" />,
                title: "Voix en temps réel",
                desc: "Échangez par la voix grâce à LiveKit WebRTC. Transcription automatique et résumé de conversation inclus.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: <Globe className="w-6 h-6" />,
                title: "Déploiement multicanal",
                desc: "Chat web, Telegram, WhatsApp — votre assistant est accessible là où se trouvent vos utilisateurs.",
                color: "from-emerald-500 to-teal-500",
              },
              {
                icon: <Brain className="w-6 h-6" />,
                title: "Base de connaissances",
                desc: "Importez vos fichiers PDF, URL ou textes. Recherche hybride vectorielle et sémantique pour des réponses pertinentes.",
                color: "from-amber-500 to-orange-500",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "Actions automatisées",
                desc: "Envoi d'e-mails, mise à jour du CRM, gestion de calendrier — votre assistant agit pour vous en toute sécurité.",
                color: "from-pink-500 to-rose-500",
              },
              {
                icon: <Lock className="w-6 h-6" />,
                title: "Sécurité de niveau entreprise",
                desc: "Chiffrement AES-256, isolation multi-tenant, journal d'audit complet et protection contre les injections.",
                color: "from-indigo-500 to-purple-500",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="group relative p-8 rounded-3xl glass card-hover overflow-hidden"
              >
                {/* Gradient accent on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-5 shadow-lg`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ HOW IT WORKS ━━━ */}
      <Section id="how-it-works" className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.03] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-3">
              Comment ça marche
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold mb-4">
              En 3 étapes <span className="text-gradient">simples</span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "01",
                title: "Configurez votre assistant",
                desc: "Définissez le nom, l'objectif, le ton et la langue. Le prompt système est généré automatiquement.",
                icon: <Bot className="w-8 h-8" />,
              },
              {
                step: "02",
                title: "Enrichissez sa mémoire",
                desc: "Importez vos documents, URL et textes. L'IA indexe et vectorise le contenu pour une recherche ultra-rapide.",
                icon: <Brain className="w-8 h-8" />,
              },
              {
                step: "03",
                title: "Déployez et conversez",
                desc: "Activez les canaux souhaités — chat, voix, Telegram, WhatsApp — et commencez à interagir.",
                icon: <Sparkles className="w-8 h-8" />,
              },
            ].map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} custom={i} className="relative text-center">
                {/* Connecting line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-purple-500/40 to-transparent" />
                )}

                <div className="relative inline-flex flex-col items-center">
                  {/* Step number ring */}
                  <div className="w-32 h-32 rounded-full glass-strong flex items-center justify-center mb-6 relative glow-primary">
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10" />
                    {s.icon}
                    <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-xs font-bold flex items-center justify-center">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ SECURITY SPOTLIGHT ━━━ */}
      <Section id="security" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* 3D Cube visual */}
            <motion.div variants={fadeIn} className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-[100px] animate-pulse-glow" />
                <RotatingCube />
                <p className="text-center mt-8 text-sm text-muted-foreground">
                  Moteur IronClaw — Runtime Rust sécurisé
                </p>
              </div>
            </motion.div>

            {/* Copy */}
            <div>
              <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-purple-400 uppercase tracking-widest mb-3">
                Sécurité
              </motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-bold mb-6">
                Protégé par <span className="text-gradient">design</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-10 leading-relaxed">
                Chaque couche de la plateforme a été conçue avec la sécurité comme priorité absolue. Vos données restent les vôtres.
              </motion.p>

              <div className="space-y-5">
                {[
                  { icon: <Shield className="w-5 h-5" />, title: "Sandbox WASM", desc: "Les outils s'exécutent dans un bac à sable WebAssembly avec permissions granulaires." },
                  { icon: <Lock className="w-5 h-5" />, title: "Chiffrement AES-256-GCM", desc: "Toutes les données au repos sont chiffrées. Zéro télémétrie, zéro partage." },
                  { icon: <CheckCircle2 className="w-5 h-5" />, title: "Détection d'injections", desc: "Protection active contre les tentatives d'injection de prompts malveillants." },
                  { icon: <Globe className="w-5 h-5" />, title: "Isolation multi-tenant", desc: "Chaque espace de travail est entièrement isolé au niveau des données et des sessions." },
                ].map((item, i) => (
                  <motion.div key={item.title} variants={fadeUp} custom={i + 3} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 flex-shrink-0 mt-0.5">
                      {item.icon}
                    </div>
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

      {/* ━━━ STATS ━━━ */}
      <Section id="stats" className="py-24 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.03] to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <motion.h2 variants={fadeUp} custom={0} className="text-4xl md:text-5xl font-bold mb-4">
              La plateforme en <span className="text-gradient">chiffres</span>
            </motion.h2>
          </div>

          <motion.div variants={fadeUp} custom={1} className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: 500, suffix: "+", label: "Assistants déployés" },
              { value: 2000000, suffix: "+", label: "Messages traités" },
              { value: 99, suffix: ",9%", label: "Disponibilité" },
              { value: 4, suffix: " canaux", label: "De communication" },
            ].map((s) => (
              <div key={s.label} className="text-center p-6 rounded-3xl glass card-hover">
                <p className="text-3xl md:text-4xl font-bold text-gradient mb-2">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </p>
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
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à créer votre <span className="text-gradient">assistant IA</span> ?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Rejoignez des centaines d&apos;entreprises qui utilisent EMEFA pour automatiser leur service client, leurs ventes et leurs opérations.
            </p>
            <Link
              href="/auth"
              className="group inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white rounded-2xl text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/30 transition-all"
            >
              <Zap className="w-5 h-5" />
              Commencer gratuitement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </Section>

      {/* ━━━ FOOTER ━━━ */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gradient">EMEFA</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Plateforme de création d&apos;assistants IA professionnels, propulsée par IronClaw.
              </p>
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
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Chat web</li>
                <li>Voix (LiveKit)</li>
                <li>Telegram</li>
                <li>WhatsApp</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Technique</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>IronClaw Runtime</li>
                <li>WASM Sandbox</li>
                <li>Recherche hybride</li>
                <li>API OpenAI-compatible</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} EMEFA. Tous droits réservés.
            </p>
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
