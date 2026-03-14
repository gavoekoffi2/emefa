"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Zap,
  MessageSquare,
  Shield,
  Globe,
  Users,
  Sparkles,
  CheckCircle,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGetStarted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    // Redirect to signup with email pre-filled
    router.push(`/auth/signup?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="w-8 h-8 text-blue-500" />
            EMEFA
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/auth/login")}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Connexion
            </button>
            <button
              onClick={() => router.push("/auth/signup")}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              S'inscrire
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-6">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
            <Zap className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300">
              Révolutionnez votre entreprise avec l'IA
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            Créez votre
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              {" "}
              Assistant IA Personnalisé
            </span>
            <br />
            en quelques minutes
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            EMEFA vous permet de créer des assistants IA intelligents connectés
            à vos données. Chat, voix, WhatsApp, Telegram — tout intégré.
            Révolutionnez votre workflow dès maintenant.
          </p>

          {/* CTA */}
          <form onSubmit={handleGetStarted} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none text-white placeholder-gray-500"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              {loading ? "Chargement..." : "Commencer"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Trust Badges */}
          <div className="flex justify-center gap-6 text-sm text-gray-400 pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Pas de carte crédit requise
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Gratuit les 30 premiers jours
            </div>
          </div>
        </div>

        {/* Decorative gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-500/10 to-transparent opacity-50" />
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Pourquoi EMEFA est révolutionnaire?
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 hover:border-blue-500 transition-colors">
              <MessageSquare className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Multi-canal</h3>
              <p className="text-gray-400">
                Accessible via WhatsApp, Telegram, Email, SMS, Voice. Un seul
                assistant, partout.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 hover:border-blue-500 transition-colors">
              <Zap className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Rapide & Efficace</h3>
              <p className="text-gray-400">
                Créez un assistant en 5 minutes. Zéro code, zéro infrastructure
                complexe.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 hover:border-blue-500 transition-colors">
              <Shield className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Sécurisé</h3>
              <p className="text-gray-400">
                OpenClaw runtime + chiffrement e2e. Vos données restent vôtres.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 hover:border-blue-500 transition-colors">
              <Globe className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Africain d'abord</h3>
              <p className="text-gray-400">
                Paystack, M-Pesa, Wave, Orange Money. Paiements africains
                intégrés.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 hover:border-blue-500 transition-colors">
              <Sparkles className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Skills Marketplace</h3>
              <p className="text-gray-400">
                Des centaines de compétences réutilisables. Créez, partagez,
                profitez.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 hover:border-blue-500 transition-colors">
              <Users className="w-12 h-12 text-blue-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Apprentissage Continu</h3>
              <p className="text-gray-400">
                Votre assistant apprend chaque jour de vos interactions et
                retours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Utilisé par les meilleurs
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Architectes */}
            <div className="bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border border-blue-700/30 rounded-lg p-8">
              <div className="text-4xl mb-4">🏗️</div>
              <h3 className="text-2xl font-bold mb-2">Architectes</h3>
              <p className="text-gray-400 mb-4">
                Automatisez les demandes de devis, suivez les projets, analysez
                les plans.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ Gestion de projets automatisée</li>
                <li>✓ Réponses rapides aux clients</li>
                <li>✓ Suivi des deadlines</li>
              </ul>
            </div>

            {/* Comptables */}
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-lg p-8">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-2xl font-bold mb-2">Comptables</h3>
              <p className="text-gray-400 mb-4">
                Automatisez les factures, les rapports, la réconciliation
                bancaire.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ Facturation automatique</li>
                <li>✓ Rapports financiers en temps réel</li>
                <li>✓ Traçabilité complète</li>
              </ul>
            </div>

            {/* E-commerce */}
            <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-700/30 rounded-lg p-8">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-2xl font-bold mb-2">E-commerce</h3>
              <p className="text-gray-400 mb-4">
                Support 24/7, gestion des commandes, recommandations
                personnalisées.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ Support client automatisé</li>
                <li>✓ Gestion des inventaires</li>
                <li>✓ Augmentation des ventes</li>
              </ul>
            </div>

            {/* Marketing */}
            <div className="bg-gradient-to-br from-pink-900/20 to-purple-900/20 border border-pink-700/30 rounded-lg p-8">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-2xl font-bold mb-2">Marketing</h3>
              <p className="text-gray-400 mb-4">
                Génération de contenu viral, prospection automatisée, analytics.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✓ Contenu généré automatiquement</li>
                <li>✓ Prospection à l'échelle</li>
                <li>✓ Engagement mesuré</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold">
            Prêt à révolutionner votre entreprise?
          </h2>
          <p className="text-xl text-gray-400">
            Rejoignez les entrepreneurs africains qui transforment leur
            business avec l'IA
          </p>
          <button
            onClick={() => router.push("/auth/signup")}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold text-lg inline-flex items-center gap-2 transition-colors"
          >
            Créer un compte gratuit
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-sm text-gray-500">
            30 jours gratuits • Pas de carte crédit • Annulation facile
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold">
            <Sparkles className="w-6 h-6 text-blue-500" />
            EMEFA
          </div>
          <p className="text-sm text-gray-500">
            © 2026 EMEFA. Tous droits réservés. Fait en Afrique, pour l'Afrique.
          </p>
        </div>
      </footer>
    </div>
  );
}
