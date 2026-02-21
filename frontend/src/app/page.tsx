"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Bot, MessageSquare, Mic, Shield, Zap, Globe } from "lucide-react";

export default function HomePage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              EMEFA
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {theme === "dark" ? "\u2600\ufe0f" : "\ud83c\udf19"}
            </button>
            <Link
              href="/auth"
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Commencer
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          Votre assistant IA,{" "}
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            sur mesure
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          EMEFA vous permet de cr\u00e9er des assistants IA intelligents, connect\u00e9s \u00e0 vos donn\u00e9es,
          disponibles par chat, voix, Telegram et WhatsApp.
        </p>
        <Link
          href="/auth"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl text-lg font-semibold hover:opacity-90 transition-opacity"
        >
          <Zap className="w-5 h-5" />
          Cr\u00e9er mon assistant
        </Link>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-3 gap-8">
        {[
          {
            icon: <MessageSquare className="w-8 h-8" />,
            title: "Chat intelligent",
            desc: "Conversez avec votre assistant par texte. Il se souvient de tout et utilise votre base de connaissances.",
          },
          {
            icon: <Mic className="w-8 h-8" />,
            title: "Voix temps r\u00e9el",
            desc: "Parlez directement \u00e0 votre assistant gr\u00e2ce \u00e0 LiveKit. Transcription et r\u00e9sum\u00e9 inclus.",
          },
          {
            icon: <Globe className="w-8 h-8" />,
            title: "Multi-canal",
            desc: "Web, Telegram, WhatsApp. Votre assistant est disponible o\u00f9 vos utilisateurs se trouvent.",
          },
          {
            icon: <Shield className="w-8 h-8" />,
            title: "S\u00e9curit\u00e9 renforc\u00e9e",
            desc: "Donn\u00e9es chiffr\u00e9es, isolation multi-tenant, audit complet, protection anti-injection.",
          },
          {
            icon: <Bot className="w-8 h-8" />,
            title: "Actions automatis\u00e9es",
            desc: "Email, calendrier, CRM, Google Sheets. Votre assistant agit pour vous, en toute s\u00e9curit\u00e9.",
          },
          {
            icon: <Zap className="w-8 h-8" />,
            title: "Moteur IronClaw",
            desc: "Propuls\u00e9 par IronClaw, un runtime agent Rust s\u00e9curis\u00e9 avec sandbox WASM.",
          },
        ].map((f, i) => (
          <div key={i} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              {f.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
            <p className="text-muted-foreground">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-muted-foreground">
        <p>EMEFA - Plateforme d&apos;Assistants IA</p>
      </footer>
    </div>
  );
}
