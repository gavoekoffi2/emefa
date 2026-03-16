"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTheme } from "next-themes";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  Globe,
  Lock,
  Menu,
  MessageSquare,
  Mic,
  Moon,
  Play,
  Search,
  Send,
  Shield,
  Sparkles,
  Star,
  Sun,
  Users,
  X,
  Zap,
} from "lucide-react";

/* ══════════ Dynamic 3D import (no SSR) ══════════ */
const HolographicAssistant = dynamic(
  () => import("@/components/HolographicAssistant"),
  { ssr: false, loading: () => <HolographicFallback /> }
);

function HolographicFallback() {
  return (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center">
      <div className="relative">
        <div className="w-48 h-48 rounded-full border border-violet-500/20 animate-ring-pulse" />
        <div className="absolute inset-8 rounded-full bg-gradient-to-br from-violet-600/20 to-fuchsia-500/20 blur-2xl animate-pulse-glow" />
        <div className="absolute inset-12 flex items-center justify-center">
          <Bot className="w-16 h-16 text-violet-400/40 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/* ══════════ Animation variants ══════════ */
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
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: "easeOut" } },
};

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

const slideFromLeft = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

const slideFromRight = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
};

/* ══════════ Section wrapper ══════════ */
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

/* ══════════ Animated counter ══════════ */
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let s = 0;
    const step = target / 60;
    const t = setInterval(() => {
      s += step;
      if (s >= target) { setCount(target); clearInterval(t); } else setCount(Math.floor(s));
    }, 16);
    return () => clearInterval(t);
  }, [inView, target]);
  return <span ref={ref}>{prefix}{count.toLocaleString("fr-FR")}{suffix}</span>;
}

/* ══════════ Interactive chat demo ══════════ */
function LiveChatDemo() {
  const [step, setStep] = useState(0);
  const messages = [
    { side: "user" as const, text: "Bonjour Amara, quel est le statut de ma commande #4521 ?" },
    { side: "bot" as const, text: "Bonjour ! Votre commande #4521 a été expédiée hier. Elle arrivera demain avant 14h. Souhaitez-vous un e-mail de suivi ?" },
    { side: "user" as const, text: "Oui, envoie le suivi par e-mail s'il te plaît" },
    { side: "bot" as const, text: "C'est fait ! L'e-mail de suivi vient d'être envoyé à votre adresse. Autre chose que je puisse faire pour vous ?" },
  ];

  useEffect(() => {
    if (step >= messages.length) return;
    const timer = setTimeout(() => setStep((s) => s + 1), step === 0 ? 1500 : 2000);
    return () => clearTimeout(timer);
  }, [step, messages.length]);

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="glass-strong rounded-3xl overflow-hidden shadow-2xl shadow-violet-500/10">
        {/* Chat header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-background" />
          </div>
          <div>
            <p className="font-semibold text-sm">Amara</p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              En ligne
            </p>
          </div>
          <div className="ml-auto flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
            <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
            <div className="w-2 h-2 rounded-full bg-muted-foreground/20" />
          </div>
        </div>

        {/* Messages */}
        <div className="px-4 py-5 space-y-3 min-h-[260px]">
          <AnimatePresence>
            {messages.slice(0, step).map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`flex ${msg.side === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed max-w-[85%] ${
                    msg.side === "user"
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-br-md"
                      : "bg-white/[0.06] border border-white/[0.08] rounded-bl-md"
                  }`}
                >
                  {msg.text}
                  {msg.side === "bot" && i === 3 && (
                    <p className="text-[11px] mt-1.5 text-emerald-400/80 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Action exécutée
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {step < messages.length && step > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-1 pl-2"
            >
              <div className="w-2 h-2 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-violet-400/50 animate-bounce" style={{ animationDelay: "300ms" }} />
            </motion.div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/5">
          <div className="flex items-center gap-2 bg-white/[0.04] rounded-xl px-4 py-2.5">
            <span className="text-xs text-muted-foreground flex-1">Écrivez un message...</span>
            <div className="flex gap-2">
              <Mic className="w-4 h-4 text-muted-foreground/50" />
              <Send className="w-4 h-4 text-violet-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════ Assistants data ══════════ */
const ASSISTANTS = [
  { name: "Amara", role: "Service client", photo: "/avatars/amara.jpg", gradient: "from-amber-500 to-orange-500", desc: "Gère les demandes clients avec empathie et précision, 24h/24" },
  { name: "Fatou", role: "Gestion RH", photo: "/avatars/fatou.jpg", gradient: "from-emerald-500 to-teal-500", desc: "Automatise le recrutement et la gestion des talents" },
  { name: "Awa", role: "Assistante commerciale", photo: "/avatars/awa.jpg", gradient: "from-violet-500 to-purple-600", desc: "Qualifie vos prospects et accélère les conversions" },
  { name: "Nana", role: "Support technique", photo: "/avatars/nana.jpg", gradient: "from-blue-500 to-cyan-500", desc: "Résout les problèmes techniques en temps réel" },
  { name: "Aisha", role: "Assistante juridique", photo: "/avatars/aisha.jpg", gradient: "from-rose-500 to-pink-500", desc: "Analyse les documents et clarifie le cadre légal" },
];

/* ══════════ Features data ══════════ */
const FEATURES = [
  { icon: <MessageSquare className="w-6 h-6" />, title: "Chat intelligent", desc: "Conversations contextuelles avec mémoire persistante et recherche sémantique dans votre base de connaissances.", color: "violet", iconBg: "bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20" },
  { icon: <Mic className="w-6 h-6" />, title: "Voix en temps réel", desc: "Échangez par la voix grâce au WebRTC. Transcription et synthèse vocale naturelle incluses.", color: "blue", iconBg: "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20" },
  { icon: <Globe className="w-6 h-6" />, title: "Multicanal natif", desc: "Chat web, Telegram, WhatsApp — votre assistant est présent partout où sont vos clients.", color: "emerald", iconBg: "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20" },
  { icon: <Brain className="w-6 h-6" />, title: "Base de connaissances", desc: "Importez PDF, URL ou textes. Recherche hybride vectorielle pour des réponses toujours justes.", color: "amber", iconBg: "bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20" },
  { icon: <Zap className="w-6 h-6" />, title: "Actions autonomes", desc: "Envoi d'e-mails, intégration CRM, réservation — votre assistant agit en toute autonomie.", color: "rose", iconBg: "bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20" },
  { icon: <Lock className="w-6 h-6" />, title: "Sécurité entreprise", desc: "Chiffrement AES-256, isolation multi-tenant, audit complet et anti-injection de prompts.", color: "indigo", iconBg: "bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20" },
];

/* ══════════ Pricing plans ══════════ */
const PLANS = [
  {
    name: "Starter",
    price: "0",
    period: "Gratuit pour toujours",
    desc: "Idéal pour découvrir la plateforme",
    features: ["1 assistant IA", "500 messages/mois", "Chat web uniquement", "Base de connaissances (5 docs)", "Communauté"],
    cta: "Commencer gratuitement",
    popular: false,
    gradient: "from-gray-500 to-gray-600",
  },
  {
    name: "Pro",
    price: "29",
    period: "/mois",
    desc: "Pour les équipes ambitieuses",
    features: ["5 assistants IA", "10 000 messages/mois", "Chat + Voix + Telegram", "Base de connaissances illimitée", "Actions automatisées", "Support prioritaire"],
    cta: "Essai gratuit 14 jours",
    popular: true,
    gradient: "from-violet-600 to-fuchsia-500",
  },
  {
    name: "Enterprise",
    price: "Sur mesure",
    period: "",
    desc: "Pour les grandes organisations",
    features: ["Assistants illimités", "Messages illimités", "Tous les canaux", "API dédiée", "SLA garanti 99,9%", "Support dédié 24/7", "Déploiement on-premise"],
    cta: "Contacter l'équipe",
    popular: false,
    gradient: "from-amber-500 to-orange-500",
  },
];

/* ══════════════════════════════════════════ */
/* ══════════ MAIN PAGE ════════════════════ */
/* ══════════════════════════════════════════ */
export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(scrollYProgress, [0, 0.03], [0, 1]);
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => setMounted(true), []);

  const navLinks = [
    ["Fonctionnalités", "#features"],
    ["Assistants", "#assistants"],
    ["Sécurité", "#security"],
    ["Tarifs", "#pricing"],
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden">
      {/* Background textures */}
      <div className="fixed inset-0 grid-pattern pointer-events-none" />
      <div className="fixed inset-0 noise-texture pointer-events-none opacity-40" />

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
            {navLinks.map(([label, href]) => (
              <a key={href} href={href} className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2.5 rounded-xl hover:bg-white/5 transition-all"
                aria-label="Changer de thème"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <Link href="/auth" className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Connexion
            </Link>
            <Link href="/auth" className="group px-5 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-violet-500/25 transition-all hidden sm:flex items-center gap-1.5 btn-shine">
              Commencer <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl hover:bg-white/5 transition-all md:hidden"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-6 py-4 space-y-2">
                {navLinks.map(([label, href]) => (
                  <a key={href} href={href} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm hover:bg-white/5 transition-all">
                    {label}
                  </a>
                ))}
                <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-sm bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-center font-semibold mt-3">
                  Commencer gratuitement
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ━━━ HERO ━━━ */}
      <section className="relative pt-28 pb-8 md:pt-36 md:pb-20 overflow-hidden">
        {/* Gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] animate-morph bg-gradient-to-br from-violet-600/12 via-purple-500/6 to-fuchsia-500/12 blur-[150px]" />
          <div className="absolute top-10 right-[5%] w-96 h-96 rounded-full bg-blue-600/5 blur-[100px] animate-float-delayed" />
          <div className="absolute bottom-16 left-[5%] w-80 h-80 rounded-full bg-amber-500/5 blur-[80px] animate-float-slow" />
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-violet-400/25 animate-particle"
              style={{
                top: `${10 + i * 11}%`,
                left: `${8 + i * 12}%`,
                animationDelay: `${i * 0.9}s`,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left — Copy */}
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div
                variants={fadeUp}
                custom={0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm mb-6 animate-border-glow"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-muted-foreground">
                  Plateforme IA de nouvelle génération
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-5xl md:text-6xl lg:text-[4.2rem] font-extrabold leading-[1.08] tracking-tight mb-7"
              >
                L&apos;intelligence artificielle
                <br />
                qui{" "}
                <span className="text-gradient">travaille</span>
                <br />
                pour vous
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-lg md:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed"
              >
                Créez des assistantes IA personnalisées connectées à vos données, déployables sur chat, voix, Telegram et WhatsApp
                — en quelques minutes, sans code.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  href="/auth"
                  className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-2xl text-lg font-semibold hover:shadow-2xl hover:shadow-violet-500/25 hover:-translate-y-0.5 transition-all btn-shine"
                >
                  <Zap className="w-5 h-5" />
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-lg font-medium glass hover:bg-white/5 hover:-translate-y-0.5 transition-all"
                >
                  <Play className="w-4 h-4" /> Voir la démo
                </a>
              </motion.div>

              {/* Social proof strip */}
              <motion.div variants={fadeUp} custom={4} className="flex items-center gap-6 pt-8 border-t border-border/30">
                <div className="flex -space-x-2">
                  {ASSISTANTS.slice(0, 4).map((a) => (
                    <div key={a.name} className="w-9 h-9 rounded-full border-2 border-background overflow-hidden shadow-lg">
                      <img src={a.photo} alt={a.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  <div className="w-9 h-9 rounded-full border-2 border-background bg-violet-500/20 flex items-center justify-center text-[10px] font-bold text-violet-400 shadow-lg">
                    +500
                  </div>
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Adopté par <strong className="text-foreground">500+ entreprises</strong> en Afrique
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Right — 3D Holographic Assistant */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
            >
              <div className="relative h-[560px]">
                {/* Glow backdrop */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/8 via-purple-500/5 to-fuchsia-500/8 rounded-[40px] blur-[60px]" />

                {/* 3D Canvas */}
                <HolographicAssistant className="relative z-10" />

                {/* Floating badges */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5 }}
                  className="absolute top-16 -left-4 z-20"
                >
                  <div className="glass-strong px-4 py-2.5 rounded-2xl text-sm flex items-center gap-2 shadow-xl animate-float" style={{ animationDelay: "1s" }}>
                    <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <Mic className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">Voix activée</p>
                      <p className="text-[10px] text-muted-foreground">WebRTC temps réel</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.8 }}
                  className="absolute top-8 -right-4 z-20"
                >
                  <div className="glass-strong px-4 py-2.5 rounded-2xl text-sm flex items-center gap-2 shadow-xl animate-float-delayed" style={{ animationDelay: "2s" }}>
                    <div className="w-8 h-8 rounded-full bg-violet-500/15 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">Chiffré AES-256</p>
                      <p className="text-[10px] text-muted-foreground">Données sécurisées</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.1 }}
                  className="absolute bottom-20 -right-2 z-20"
                >
                  <div className="glass-strong px-4 py-2.5 rounded-2xl text-sm flex items-center gap-2 shadow-xl animate-float-gentle" style={{ animationDelay: "3s" }}>
                    <div className="w-8 h-8 rounded-full bg-blue-500/15 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">4 canaux</p>
                      <p className="text-[10px] text-muted-foreground">Web, Voix, Telegram, WhatsApp</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.4 }}
                  className="absolute bottom-16 -left-6 z-20"
                >
                  <div className="glass-strong px-4 py-2.5 rounded-2xl text-sm flex items-center gap-2 shadow-xl animate-float" style={{ animationDelay: "4s" }}>
                    <div className="w-8 h-8 rounded-full bg-amber-500/15 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-medium text-xs">&lt;200ms</p>
                      <p className="text-[10px] text-muted-foreground">Temps de réponse</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ━━━ TRUST BAR ━━━ */}
      <Section className="py-14 border-y border-border/20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.p variants={fadeUp} custom={0} className="text-center text-[11px] text-muted-foreground uppercase tracking-[0.3em] mb-10 font-medium">
            Technologies de confiance qui propulsent EMEFA
          </motion.p>
          <motion.div variants={fadeUp} custom={1} className="flex flex-wrap items-center justify-center gap-x-16 gap-y-6">
            {[
              { name: "LiveKit", sub: "WebRTC" },
              { name: "PostgreSQL", sub: "Database" },
              { name: "Qdrant", sub: "Vector Search" },
              { name: "OpenAI", sub: "LLM Provider" },
              { name: "Redis", sub: "Cache" },
            ].map((t) => (
              <div key={t.name} className="text-center opacity-40 hover:opacity-70 transition-opacity">
                <p className="text-sm font-bold tracking-wider">{t.name}</p>
                <p className="text-[10px] text-muted-foreground">{t.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ━━━ LIVE DEMO SECTION ━━━ */}
      <Section id="demo" className="py-28 md:py-36 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — Chat demo */}
            <motion.div variants={slideFromLeft}>
              <LiveChatDemo />
            </motion.div>

            {/* Right — Copy */}
            <div>
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">
                <MessageSquare className="w-3.5 h-3.5" /> Démo en direct
              </motion.div>
              <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-extrabold mb-6">
                Voyez votre assistante{" "}
                <span className="text-gradient">en action</span>
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Amara ne se contente pas de répondre — elle comprend le contexte, exécute des actions et apprend de chaque interaction. Tout en temps réel.
              </motion.p>

              <div className="space-y-4">
                {[
                  { icon: <Brain className="w-5 h-5" />, title: "Compréhension contextuelle", desc: "Mémoire persistante et accès à votre base de connaissances" },
                  { icon: <Zap className="w-5 h-5" />, title: "Actions automatiques", desc: "Envoi d'e-mails, mise à jour CRM, réservations — sans intervention humaine" },
                  { icon: <CheckCircle2 className="w-5 h-5" />, title: "Vérification en temps réel", desc: "Chaque réponse est vérifiée contre vos données sources" },
                ].map((item, i) => (
                  <motion.div key={item.title} variants={fadeUp} custom={i + 3} className="flex gap-4 items-start group">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/8 flex items-center justify-center text-violet-400 flex-shrink-0 group-hover:bg-violet-500/15 transition-all">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-0.5">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
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
              Une plateforme complète pour créer, entraîner et déployer vos assistants IA — de la conception au multicanal.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="group relative p-8 rounded-3xl glass-card overflow-hidden"
              >
                <div className={`w-14 h-14 rounded-2xl ${f.iconBg} flex items-center justify-center mb-6 transition-all duration-300`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-[15px]">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ ASSISTANTS SHOWCASE ━━━ */}
      <Section id="assistants" className="py-28 md:py-36 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.015] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">
              <Users className="w-3.5 h-3.5" /> Assistantes prêtes à l&apos;emploi
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-extrabold mb-5">
              Des assistantes <span className="text-gradient">à votre image</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Chaque assistante est unique, intelligente et prête à représenter votre marque avec excellence.
              100% personnalisable.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            {ASSISTANTS.map((a, i) => (
              <motion.div key={a.name} variants={scaleIn} custom={i} className="group text-center">
                <div className="relative mx-auto w-40 h-40 mb-6">
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${a.gradient} opacity-0 group-hover:opacity-20 blur-3xl transition-all duration-700`} />
                  <div className={`absolute -inset-1 rounded-full bg-gradient-to-r ${a.gradient} opacity-0 group-hover:opacity-60 blur-[3px] transition-all duration-500`} />
                  <div className="relative w-full h-full rounded-full overflow-hidden border-[3px] border-border/50 group-hover:border-transparent transition-all duration-500 shadow-xl group-hover:shadow-2xl">
                    <img src={a.photo} alt={a.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute bottom-3 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-y-2 group-hover:translate-y-0">
                      <span className="text-white text-xs font-medium px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm">
                        {a.role}
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-[3px] border-background shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                </div>
                <h3 className="font-bold text-lg">{a.name}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed px-2">{a.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div variants={fadeUp} custom={6} className="text-center mt-16">
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl glass hover:bg-white/5 transition-all text-sm font-medium group"
            >
              Créer mon assistante personnalisée
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
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
                <motion.div
                  animate={{ rotateY: [0, 6, -6, 0], rotateX: [0, 4, -4, 0] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                  className="preserve-3d"
                >
                  <div className="relative w-80 h-80 mx-auto">
                    <div className="absolute inset-0 rounded-full border border-violet-500/10 animate-ring-pulse" />
                    <div className="absolute inset-5 rounded-full border border-violet-500/8 animate-ring-pulse" style={{ animationDelay: "1s" }} />
                    <div className="absolute inset-12 rounded-3xl glass-strong glow-primary flex items-center justify-center">
                      <svg viewBox="0 0 80 80" width="90" height="90" fill="none">
                        <defs>
                          <linearGradient id="sg" x1="0" y1="0" x2="80" y2="80">
                            <stop offset="0%" stopColor="#7C3AED" />
                            <stop offset="100%" stopColor="#D946EF" />
                          </linearGradient>
                        </defs>
                        <path d="M40 8 L68 22 L68 42 C68 58 54 70 40 74 C26 70 12 58 12 42 L12 22 Z" fill="url(#sg)" opacity="0.15" />
                        <path d="M40 8 L68 22 L68 42 C68 58 54 70 40 74 C26 70 12 58 12 42 L12 22 Z" stroke="url(#sg)" strokeWidth="2" fill="none" />
                        <path d="M30 40 L37 47 L52 32" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="absolute top-2 right-6 glass-strong w-12 h-12 rounded-2xl flex items-center justify-center animate-float shadow-lg" style={{ animationDelay: "0.5s" }}>
                      <Lock className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="absolute bottom-6 left-2 glass-strong w-12 h-12 rounded-2xl flex items-center justify-center animate-float-delayed shadow-lg">
                      <Shield className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="absolute bottom-2 right-2 glass-strong w-12 h-12 rounded-2xl flex items-center justify-center animate-float-gentle shadow-lg" style={{ animationDelay: "1.5s" }}>
                      <Search className="w-5 h-5 text-violet-400" />
                    </div>
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
                Chaque couche de la plateforme est conçue avec la sécurité comme priorité absolue. Vos données restent les vôtres — toujours.
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
                    <div className="w-10 h-10 rounded-xl bg-violet-500/8 flex items-center justify-center text-violet-400 flex-shrink-0 mt-0.5 group-hover:bg-violet-500/15 transition-all duration-300">
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

      {/* ━━━ HOW IT WORKS ━━━ */}
      <Section id="how-it-works" className="py-28 md:py-36">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Processus simplifié
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-extrabold mb-5">
              Opérationnelle en <span className="text-gradient">3 étapes</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              De l&apos;idée au déploiement multicanal, en quelques minutes seulement. Sans code, sans complexité.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
            <div className="hidden md:block absolute top-24 left-[33%] right-[33%] h-px bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-violet-500/30" />

            {[
              {
                step: "01",
                title: "Configurez",
                desc: "Définissez le nom, l'objectif, le ton et la langue. Notre IA génère automatiquement le prompt système optimal.",
                icon: <Bot className="w-7 h-7" />,
                color: "from-violet-500 to-purple-600",
              },
              {
                step: "02",
                title: "Enrichissez",
                desc: "Importez vos documents, URL et textes. L'IA indexe et vectorise le contenu pour des réponses ultra-précises.",
                icon: <Brain className="w-7 h-7" />,
                color: "from-fuchsia-500 to-rose-500",
              },
              {
                step: "03",
                title: "Déployez",
                desc: "Activez les canaux — chat web, voix, Telegram, WhatsApp — et votre assistante est immédiatement live.",
                icon: <Sparkles className="w-7 h-7" />,
                color: "from-amber-500 to-orange-500",
              },
            ].map((s, i) => (
              <motion.div key={s.step} variants={fadeUp} custom={i} className="relative text-center group">
                <div className="relative inline-flex flex-col items-center">
                  <div className="w-40 h-40 rounded-full glass-card flex items-center justify-center mb-8 relative overflow-hidden">
                    <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-5 group-hover:opacity-15 transition-opacity duration-500`} />
                    <div className="text-foreground">{s.icon}</div>
                    <span className={`absolute -top-1 -right-1 w-9 h-9 rounded-full bg-gradient-to-r ${s.color} text-white text-xs font-bold flex items-center justify-center shadow-lg`}>
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs text-[15px]">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ PRICING ━━━ */}
      <Section id="pricing" className="py-28 md:py-36 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.015] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Tarifs
            </motion.div>
            <motion.h2 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-extrabold mb-5">
              Choisissez votre <span className="text-gradient">plan</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Commencez gratuitement, évoluez quand vous êtes prêt. Pas de surprise, pas d&apos;engagement.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan, i) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                custom={i}
                className={`relative p-8 rounded-3xl ${
                  plan.popular
                    ? "glass-strong glow-primary-strong border-violet-500/30"
                    : "glass-card"
                } overflow-hidden`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-bl-2xl">
                    Populaire
                  </div>
                )}

                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{plan.desc}</p>

                <div className="mb-8">
                  {plan.price === "Sur mesure" ? (
                    <p className="text-3xl font-extrabold">{plan.price}</p>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      <span className="text-lg text-muted-foreground">€{plan.period}</span>
                    </div>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth"
                  className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/25 btn-shine"
                      : "glass hover:bg-white/5"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      {/* ━━━ TESTIMONIALS ━━━ */}
      <Section className="py-28 md:py-36 relative">
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
              {
                name: "Kofi Mensah",
                role: "CEO, TechAfrica",
                text: "EMEFA a transformé notre service client. Nos temps de réponse sont passés de 2h à moins de 30 secondes. Le ROI a été immédiat.",
                stars: 5,
              },
              {
                name: "Adama Diallo",
                role: "DRH, FinCorp Dakar",
                text: "L'assistante RH gère désormais 80% des questions récurrentes de nos 200 employés. Un gain de temps et de productivité incroyable.",
                stars: 5,
              },
              {
                name: "Chinwe Okafor",
                role: "Fondatrice, LegalTech Lagos",
                text: "La recherche sémantique dans notre base juridique est bluffante. L'IA retrouve les articles pertinents en millisecondes avec une précision remarquable.",
                stars: 5,
              },
            ].map((t, i) => (
              <motion.div key={t.name} variants={fadeUp} custom={i} className="p-8 rounded-3xl glass-card">
                <div className="flex gap-1 mb-5">
                  {[...Array(t.stars)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-foreground mb-6 leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-5 border-t border-border/30">
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
            <motion.p variants={fadeUp} custom={1} className="text-lg text-muted-foreground max-w-xl mx-auto">
              Des résultats concrets pour des entreprises ambitieuses.
            </motion.p>
          </div>
          <motion.div variants={fadeUp} custom={2} className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { value: 500, suffix: "+", label: "Assistants déployés", icon: <Bot className="w-5 h-5" /> },
              { value: 2000000, suffix: "+", label: "Messages traités", icon: <MessageSquare className="w-5 h-5" /> },
              { value: 99, suffix: ",9%", label: "Disponibilité", icon: <Zap className="w-5 h-5" /> },
              { value: 4, suffix: " canaux", label: "De communication", icon: <Globe className="w-5 h-5" /> },
            ].map((s) => (
              <div key={s.label} className="text-center p-8 rounded-3xl glass-card">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 mx-auto mb-4">
                  {s.icon}
                </div>
                <p className="text-3xl md:text-4xl font-extrabold text-gradient mb-2">
                  <Counter target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </Section>

      {/* ━━━ FINAL CTA ━━━ */}
      <Section className="py-28 md:py-36">
        <div className="max-w-4xl mx-auto px-6 text-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/8 via-fuchsia-500/8 to-violet-500/8 rounded-[40px] blur-3xl" />
          <motion.div
            variants={fadeUp}
            custom={0}
            className="relative glass-strong rounded-[32px] p-14 md:p-20 glow-primary-strong overflow-hidden"
          >
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
                  className="w-14 h-14 rounded-full border-[3px] border-background overflow-hidden shadow-xl hover:scale-110 hover:z-10 transition-transform"
                >
                  <img src={a.photo} alt={a.name} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>

            <h2 className="relative text-4xl md:text-5xl font-extrabold mb-6">
              Prêt à transformer votre
              <br />
              <span className="text-gradient">entreprise avec l&apos;IA ?</span>
            </h2>
            <p className="relative text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
              Rejoignez des centaines d&apos;entreprises africaines qui utilisent EMEFA pour automatiser, personnaliser et scaler leurs opérations.
            </p>
            <div className="relative flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth"
                className="group inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white rounded-2xl text-lg font-semibold hover:shadow-2xl hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all btn-shine"
              >
                <Zap className="w-5 h-5" />
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-5 rounded-2xl text-lg font-medium glass hover:bg-white/5 transition-all"
              >
                Voir les tarifs
              </a>
            </div>
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
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Plateforme africaine de création d&apos;assistants IA professionnels de nouvelle génération.
              </p>
              <div className="flex gap-3">
                {["X", "Li", "Gh"].map((s) => (
                  <div key={s} className="w-8 h-8 rounded-lg glass flex items-center justify-center text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-white/5 cursor-pointer transition-all">
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm">Produit</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
                <li><a href="#security" className="hover:text-foreground transition-colors">Sécurité</a></li>
                <li><a href="#how-it-works" className="hover:text-foreground transition-colors">Comment ça marche</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Tarifs</a></li>
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
              <h4 className="font-semibold mb-4 text-sm">Ressources</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Documentation API</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Guide de démarrage</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Blog</span></li>
                <li><span className="hover:text-foreground transition-colors cursor-pointer">Support</span></li>
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
