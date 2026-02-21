"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bot, MessageSquare, Mic, Plus, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { assistantApi } from "@/lib/api";

interface Assistant {
  id: string;
  name: string;
  objective: string;
  status: string;
  tone: string;
  language: string;
  web_chat_enabled: boolean;
  voice_enabled: boolean;
  telegram_enabled: boolean;
  whatsapp_enabled: boolean;
  total_tokens_used: number;
}

export default function DashboardPage() {
  const { token, workspaceId } = useAuth();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", objective: "", tone: "professional", language: "fr" });

  const loadAssistants = useCallback(async () => {
    if (!token) return;
    try {
      const data = await assistantApi.list(token, workspaceId || "");
      setAssistants(data as Assistant[]);
    } catch (e) {
      console.error(e);
    }
  }, [token, workspaceId]);

  useEffect(() => {
    loadAssistants();
  }, [loadAssistants]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    try {
      await assistantApi.create(token, workspaceId || "", form);
      setShowCreate(false);
      setForm({ name: "", objective: "", tone: "professional", language: "fr" });
      loadAssistants();
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mes Assistants</h1>
          <p className="text-muted-foreground mt-1">
            Cr\u00e9ez et g\u00e9rez vos assistants IA personnalis\u00e9s
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          Nouvel assistant
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">Cr\u00e9er un assistant</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nom</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Mon Assistant Commercial"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Objectif</label>
                <textarea
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
                  placeholder="D\u00e9crivez ce que votre assistant doit faire..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Ton</label>
                  <select
                    value={form.tone}
                    onChange={(e) => setForm({ ...form, tone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  >
                    <option value="professional">Professionnel</option>
                    <option value="friendly">Amical</option>
                    <option value="formal">Formel</option>
                    <option value="casual">D\u00e9contract\u00e9</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Langue</label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  >
                    <option value="fr">Fran\u00e7ais</option>
                    <option value="en">English</option>
                    <option value="es">Espa\u00f1ol</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-3 rounded-lg border border-border hover:bg-secondary transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Cr\u00e9ation..." : "Cr\u00e9er"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assistants Grid */}
      {assistants.length === 0 ? (
        <div className="text-center py-20">
          <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aucun assistant</h2>
          <p className="text-muted-foreground mb-6">
            Cr\u00e9ez votre premier assistant IA pour commencer
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            Cr\u00e9er un assistant
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistants.map((a) => (
            <Link
              key={a.id}
              href={`/dashboard/assistants/${a.id}`}
              className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Bot className="w-7 h-7" />
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    a.status === "active"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}
                >
                  {a.status === "active" ? "Actif" : "Brouillon"}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                {a.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{a.objective}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {a.web_chat_enabled && (
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" /> Chat
                  </span>
                )}
                {a.voice_enabled && (
                  <span className="flex items-center gap-1">
                    <Mic className="w-3 h-3" /> Voix
                  </span>
                )}
                {a.telegram_enabled && (
                  <span className="flex items-center gap-1">
                    <Send className="w-3 h-3" /> Telegram
                  </span>
                )}
                <span className="ml-auto">{a.total_tokens_used.toLocaleString()} tokens</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
