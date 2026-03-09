"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bot, Building2, MessageSquare, Mic, Plus, RefreshCw, Send, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { assistantApi, templateApi } from "@/lib/api";

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
  const [error, setError] = useState("");
  const [createError, setCreateError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; category: string; description: string; icon: string }>>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateCreating, setTemplateCreating] = useState(false);

  const loadAssistants = useCallback(async () => {
    if (!token) return;
    try {
      setError("");
      const data = await assistantApi.list(token, workspaceId || "");
      setAssistants(data as Assistant[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les assistants");
    } finally {
      setInitialLoading(false);
    }
  }, [token, workspaceId]);

  const loadTemplates = useCallback(async () => {
    if (!token) return;
    try {
      const data = await templateApi.list(token, workspaceId || "");
      setTemplates(data as Array<{ id: string; name: string; category: string; description: string; icon: string }>);
    } catch {
      // Templates may not be available
    }
  }, [token, workspaceId]);

  useEffect(() => {
    loadAssistants();
    loadTemplates();
  }, [loadAssistants, loadTemplates]);

  const handleCreateFromTemplate = async (templateId: string) => {
    if (!token) return;
    setTemplateCreating(true);
    setCreateError("");
    try {
      await templateApi.createAssistant(token, workspaceId || "", templateId, {
        template_id: templateId,
        name: "Mon Assistant Architecte",
        language: "fr",
      });
      setShowTemplates(false);
      loadAssistants();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Impossible de créer depuis le template");
    } finally {
      setTemplateCreating(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setCreating(true);
    setCreateError("");
    try {
      await assistantApi.create(token, workspaceId || "", form);
      setShowCreate(false);
      setForm({ name: "", objective: "", tone: "professional", language: "fr" });
      loadAssistants();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Impossible de créer l'assistant");
    } finally {
      setCreating(false);
    }
  };

  const statusLabel: Record<string, string> = {
    active: "Actif",
    draft: "Brouillon",
    inactive: "Inactif",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Mes Assistants</h1>
          <p className="text-muted-foreground mt-1">
            Créez et gérez vos assistants IA personnalisés
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadAssistants}
            className="p-2.5 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {templates.length > 0 && (
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center gap-2 px-5 py-3 border border-primary/30 text-primary rounded-xl font-semibold hover:bg-primary/5 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              <span className="hidden sm:inline">Depuis un template</span>
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Nouvel assistant</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={loadAssistants} className="ml-auto underline text-xs">Réessayer</button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Créer un assistant"
        >
          <div className="bg-card rounded-2xl border border-border p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6">Créer un assistant</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="create-name" className="block text-sm font-medium mb-1.5">Nom</label>
                <input
                  id="create-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Mon Assistant Commercial"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="create-objective" className="block text-sm font-medium mb-1.5">Objectif</label>
                <textarea
                  id="create-objective"
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none min-h-[100px]"
                  placeholder="Décrivez ce que votre assistant doit faire..."
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="create-tone" className="block text-sm font-medium mb-1.5">Ton</label>
                  <select
                    id="create-tone"
                    value={form.tone}
                    onChange={(e) => setForm({ ...form, tone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  >
                    <option value="professional">Professionnel</option>
                    <option value="friendly">Amical</option>
                    <option value="formal">Formel</option>
                    <option value="casual">Décontracté</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="create-lang" className="block text-sm font-medium mb-1.5">Langue</label>
                  <select
                    id="create-lang"
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  >
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                  </select>
                </div>
              </div>
              {createError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  {createError}
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setCreateError(""); }}
                  className="flex-1 py-3 rounded-lg border border-border hover:bg-secondary transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {creating ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {initialLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-border bg-card animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-muted" />
                <div className="w-16 h-6 rounded-full bg-muted" />
              </div>
              <div className="h-5 w-40 bg-muted rounded mb-2" />
              <div className="h-4 w-full bg-muted rounded mb-1" />
              <div className="h-4 w-2/3 bg-muted rounded mb-4" />
              <div className="h-3 w-24 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : assistants.length === 0 ? (
        <div className="text-center py-20">
          <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aucun assistant</h2>
          <p className="text-muted-foreground mb-6">
            Créez votre premier assistant IA pour commencer
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            Créer un assistant
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
                  {statusLabel[a.status] || a.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                {a.name}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{a.objective}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
                <span className="ml-auto">{a.total_tokens_used.toLocaleString("fr-FR")} tokens</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplates && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowTemplates(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Choisir un template"
        >
          <div className="bg-card rounded-2xl border border-border p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-2">Créer depuis un template</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Choisissez un template préconfigué pour démarrer rapidement.
            </p>
            <div className="space-y-3">
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleCreateFromTemplate(t.id)}
                  disabled={templateCreating}
                  className="w-full p-4 rounded-xl border border-border hover:border-primary/50 transition-all text-left flex items-start gap-4 disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    {t.category === "architect" ? <Building2 className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{t.description}</p>
                  </div>
                </button>
              ))}
            </div>
            {createError && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {createError}
              </div>
            )}
            <button
              onClick={() => setShowTemplates(false)}
              className="w-full mt-4 py-3 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
