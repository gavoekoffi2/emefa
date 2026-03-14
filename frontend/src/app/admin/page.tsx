"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Users,
  Key,
  Server,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  LogOut,
} from "lucide-react";

interface AdminStats {
  total_users: number;
  total_assistants: number;
  total_conversations: number;
  active_integrations: number;
  openclaw_version: string;
  platform_status: "healthy" | "degraded" | "down";
}

interface ApiKey {
  id: string;
  name: string;
  provider: string;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
}

type AdminTab = "overview" | "users" | "api-keys" | "openclaw" | "settings";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showNewApiKeyForm, setShowNewApiKeyForm] = useState(false);
  const [newApiKeyForm, setNewApiKeyForm] = useState({
    name: "",
    provider: "openrouter",
    api_key: "",
  });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      // Fetch admin stats
      const statsResponse = await fetch("/api/v1/admin/stats");
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      // Fetch API keys
      const keysResponse = await fetch("/api/v1/admin/api-keys");
      if (keysResponse.ok) {
        const keysData = await keysResponse.json();
        setApiKeys(keysData);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/v1/admin/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newApiKeyForm),
      });

      if (response.ok) {
        loadAdminData();
        setShowNewApiKeyForm(false);
        setNewApiKeyForm({ name: "", provider: "openrouter", api_key: "" });
      }
    } catch (err) {
      console.error("Error adding API key:", err);
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
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Panel de contrôle EMEFA</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="sticky top-16 z-30 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex gap-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-4 border-b-2 font-medium transition-colors ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Aperçu
            </span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`py-4 px-4 border-b-2 font-medium transition-colors ${
              activeTab === "users"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Utilisateurs
            </span>
          </button>

          <button
            onClick={() => setActiveTab("api-keys")}
            className={`py-4 px-4 border-b-2 font-medium transition-colors ${
              activeTab === "api-keys"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Clés API
            </span>
          </button>

          <button
            onClick={() => setActiveTab("openclaw")}
            className={`py-4 px-4 border-b-2 font-medium transition-colors ${
              activeTab === "openclaw"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              OpenClaw
            </span>
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`py-4 px-4 border-b-2 font-medium transition-colors ${
              activeTab === "settings"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Paramètres
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Status */}
            {stats && (
              <div className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border border-green-700/30 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-2">
                      Status de la Plateforme
                    </h2>
                    <p className="text-gray-400">
                      {stats.platform_status === "healthy"
                        ? "✓ Tous les systèmes fonctionnent normalement"
                        : stats.platform_status === "degraded"
                        ? "⚠ Certains services peuvent être ralentis"
                        : "✗ La plateforme est actuellement indisponible"}
                    </p>
                  </div>
                  {stats.platform_status === "healthy" && (
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  )}
                  {stats.platform_status === "degraded" && (
                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                  )}
                  {stats.platform_status === "down" && (
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  )}
                </div>
              </div>
            )}

            {/* Stats Grid */}
            {loading ? (
              <div className="grid grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg h-32 animate-pulse" />
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Total Utilisateurs</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.total_users}
                  </p>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Assistants</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.total_assistants}
                  </p>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Conversations</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.total_conversations}
                  </p>
                </div>

                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <p className="text-gray-400 text-sm mb-2">Intégrations Actives</p>
                  <p className="text-3xl font-bold text-white">
                    {stats.active_integrations}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === "api-keys" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">Gestion des Clés API</h2>
                <p className="text-gray-400">
                  Configurez les clés API globales pour les intégrations
                </p>
              </div>
              <button
                onClick={() => setShowNewApiKeyForm(!showNewApiKeyForm)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                + Nouvelle Clé
              </button>
            </div>

            {/* New API Key Form */}
            {showNewApiKeyForm && (
              <form
                onSubmit={handleAddApiKey}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={newApiKeyForm.name}
                    onChange={(e) =>
                      setNewApiKeyForm({ ...newApiKeyForm, name: e.target.value })
                    }
                    placeholder="Ex: OpenRouter Main"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Provider
                  </label>
                  <select
                    value={newApiKeyForm.provider}
                    onChange={(e) =>
                      setNewApiKeyForm({ ...newApiKeyForm, provider: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="openrouter">OpenRouter</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Clé API
                  </label>
                  <input
                    type="password"
                    value={newApiKeyForm.api_key}
                    onChange={(e) =>
                      setNewApiKeyForm({ ...newApiKeyForm, api_key: e.target.value })
                    }
                    placeholder="sk-..."
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Ajouter
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewApiKeyForm(false)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            {/* API Keys List */}
            <div className="space-y-3">
              {apiKeys.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  Aucune clé API configurée
                </p>
              ) : (
                apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <h3 className="font-semibold text-white">{key.name}</h3>
                      <p className="text-sm text-gray-400">{key.provider}</p>
                      {key.last_used_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Dernière utilisation:{" "}
                          {new Date(key.last_used_at).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          key.is_active
                            ? "bg-green-500/10 text-green-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {key.is_active ? "Actif" : "Inactif"}
                      </span>
                      <button className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-sm transition-colors">
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* OpenClaw Tab */}
        {activeTab === "openclaw" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Gestion OpenClaw
              </h2>
              <p className="text-gray-400">
                Gérez la version et les paramètres du runtime OpenClaw
              </p>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-700">
                <div>
                  <p className="text-gray-400 text-sm">Version Actuelle</p>
                  <p className="text-2xl font-bold text-white">v2026.3.13</p>
                </div>
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  Vérifier les mises à jour
                </button>
              </div>

              <div className="pt-4 space-y-3">
                <h3 className="font-semibold text-white">Mises à jour disponibles</h3>
                <p className="text-gray-400 text-sm">Vous avez la dernière version</p>
              </div>
            </div>

            {/* OpenClaw Settings */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-white mb-4">Paramètres OpenClaw</h3>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Modèle par défaut
                </label>
                <select className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none">
                  <option>openrouter/openrouter/hunter-alpha</option>
                  <option>openai/gpt-4</option>
                  <option>anthropic/claude-opus-4-6</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Timeout des requêtes (secondes)
                </label>
                <input
                  type="number"
                  defaultValue={30}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Sauvegarder les paramètres
              </button>
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab === "users" && (
          <div className="text-center py-12 text-gray-400">
            <p>Gestion des utilisateurs - À implémenter</p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="text-center py-12 text-gray-400">
            <p>Paramètres généraux - À implémenter</p>
          </div>
        )}
      </main>
    </div>
  );
}
