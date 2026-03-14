"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  MessageSquare,
  Settings,
  LogOut,
  TrendingUp,
  Users,
  Zap,
  Trophy,
} from "lucide-react";

interface DashboardStats {
  total_assistants: number;
  total_conversations: number;
  total_messages: number;
  active_skills: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email: string; full_name: string } | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Fetch user info
      const userResponse = await fetch("/api/v1/auth/me");
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUser(userData);
      }

      // Fetch stats
      const statsResponse = await fetch("/api/v1/dashboard/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            {user && (
              <p className="text-sm text-gray-400">
                Bienvenue, {user.full_name}
              </p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/assistants/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Nouvel Assistant
            </Link>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
              <Link
                href="/dashboard/settings"
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <Settings className="w-5 h-5" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
                title="Déconnexion"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Quick Stats */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg h-32 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Assistants */}
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-700/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <MessageSquare className="w-8 h-8 text-blue-500" />
                <span className="text-xs bg-blue-500/10 text-blue-300 px-2 py-1 rounded-full">
                  +0%
                </span>
              </div>
              <p className="text-gray-400 text-sm">Assistants</p>
              <p className="text-3xl font-bold text-white">
                {stats.total_assistants}
              </p>
            </div>

            {/* Conversations */}
            <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <span className="text-xs bg-green-500/10 text-green-300 px-2 py-1 rounded-full">
                  +12%
                </span>
              </div>
              <p className="text-gray-400 text-sm">Conversations</p>
              <p className="text-3xl font-bold text-white">
                {stats.total_conversations}
              </p>
            </div>

            {/* Messages */}
            <div className="bg-gradient-to-br from-purple-900/20 to-violet-900/20 border border-purple-700/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Zap className="w-8 h-8 text-purple-500" />
                <span className="text-xs bg-purple-500/10 text-purple-300 px-2 py-1 rounded-full">
                  +8%
                </span>
              </div>
              <p className="text-gray-400 text-sm">Messages</p>
              <p className="text-3xl font-bold text-white">
                {stats.total_messages}
              </p>
            </div>

            {/* Skills */}
            <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border border-orange-700/30 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Trophy className="w-8 h-8 text-orange-500" />
                <span className="text-xs bg-orange-500/10 text-orange-300 px-2 py-1 rounded-full">
                  NEW
                </span>
              </div>
              <p className="text-gray-400 text-sm">Skills Actifs</p>
              <p className="text-3xl font-bold text-white">
                {stats.active_skills}
              </p>
            </div>
          </div>
        ) : null}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Create Assistant */}
          <Link
            href="/dashboard/assistants/new"
            className="bg-gradient-to-br from-blue-600/10 to-blue-500/10 border border-blue-600/30 hover:border-blue-500 rounded-lg p-8 transition-all hover:shadow-lg hover:shadow-blue-500/10"
          >
            <Plus className="w-8 h-8 text-blue-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Créer un Assistant
            </h3>
            <p className="text-gray-400 text-sm">
              Lancez un nouveau projet en 5 minutes
            </p>
          </Link>

          {/* View Assistants */}
          <Link
            href="/dashboard/assistants"
            className="bg-gradient-to-br from-green-600/10 to-green-500/10 border border-green-600/30 hover:border-green-500 rounded-lg p-8 transition-all hover:shadow-lg hover:shadow-green-500/10"
          >
            <Users className="w-8 h-8 text-green-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Mes Assistants
            </h3>
            <p className="text-gray-400 text-sm">
              Gérez et améliorez vos assistants
            </p>
          </Link>

          {/* Marketplace */}
          <Link
            href="/dashboard/marketplace"
            className="bg-gradient-to-br from-purple-600/10 to-purple-500/10 border border-purple-600/30 hover:border-purple-500 rounded-lg p-8 transition-all hover:shadow-lg hover:shadow-purple-500/10"
          >
            <Zap className="w-8 h-8 text-purple-500 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">
              Marketplace
            </h3>
            <p className="text-gray-400 text-sm">
              Découvrez et installez des skills
            </p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">
            Activité Récente
          </h2>
          <div className="text-center py-12 text-gray-400">
            <p>Aucune activité récente</p>
            <p className="text-sm mt-2">
              Créez votre premier assistant pour commencer
            </p>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-600/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Premiers Pas
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div>
              <div className="font-bold text-white mb-2">1️⃣ Créer</div>
              <p>Créez votre premier assistant avec un template</p>
            </div>
            <div>
              <div className="font-bold text-white mb-2">2️⃣ Personnaliser</div>
              <p>Ajoutez des skills et configurez les intégrations</p>
            </div>
            <div>
              <div className="font-bold text-white mb-2">3️⃣ Déployer</div>
              <p>Lancez votre assistant sur tous les canaux</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
