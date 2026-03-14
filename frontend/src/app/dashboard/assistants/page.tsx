"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, MessageSquare, Settings, Trash2, Copy, ExternalLink } from "lucide-react";

interface Assistant {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive";
  created_at: string;
  message_count?: number;
  last_used_at?: string;
  skills_count?: number;
}

export default function AssistantsPage() {
  const router = useRouter();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/assistants");
      const data = await response.json();
      setAssistants(data || []);
    } catch (err) {
      setError("Erreur lors du chargement des assistants");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet assistant?")) return;

    try {
      await fetch(`/api/v1/assistants/${id}`, {
        method: "DELETE",
      });
      setAssistants((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      alert("Erreur lors de la suppression");
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/v1/assistants/${id}/duplicate`, {
        method: "POST",
      });
      const data = await response.json();
      setAssistants((prev) => [...prev, data]);
    } catch (err) {
      console.error("Duplicate error:", err);
      alert("Erreur lors de la duplication");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Mes Assistants</h1>
            <p className="text-gray-400">
              Créez et gérez vos assistants IA personnalisés
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/assistants/new")}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Nouvel Assistant
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && assistants.length === 0 && (
          <div className="text-center py-20 bg-gray-800 rounded-lg border border-gray-700">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Aucun assistant créé
            </h2>
            <p className="text-gray-400 mb-6">
              Créez votre premier assistant pour commencer
            </p>
            <button
              onClick={() => router.push("/dashboard/assistants/new")}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              Créer un assistant
            </button>
          </div>
        )}

        {/* Assistants Grid */}
        {!loading && assistants.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assistants.map((assistant) => (
              <div
                key={assistant.id}
                className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/10"
              >
                {/* Card Header */}
                <div className="p-6 space-y-4 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate">
                        {assistant.name}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                        {assistant.description || "Sans description"}
                      </p>
                    </div>
                    <div
                      className={`flex-shrink-0 w-3 h-3 rounded-full ${
                        assistant.status === "active"
                          ? "bg-green-500"
                          : "bg-gray-500"
                      }`}
                    />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-400 py-3 border-y border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500">Messages</p>
                      <p className="text-white font-semibold">
                        {assistant.message_count || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Skills</p>
                      <p className="text-white font-semibold">
                        {assistant.skills_count || 0}
                      </p>
                    </div>
                  </div>

                  {/* Last Used */}
                  {assistant.last_used_at && (
                    <p className="text-xs text-gray-500">
                      Utilisé:{" "}
                      {new Date(assistant.last_used_at).toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-700 flex gap-2">
                  <Link
                    href={`/dashboard/assistants/${assistant.id}/chat`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Chat
                  </Link>

                  <button
                    onClick={() => handleDuplicate(assistant.id)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Dupliquer"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <Link
                    href={`/dashboard/assistants/${assistant.id}/skills`}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Skills"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => handleDelete(assistant.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
