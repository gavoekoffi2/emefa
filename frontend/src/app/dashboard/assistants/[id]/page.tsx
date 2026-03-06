"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bot,
  Check,
  Database,
  Edit3,
  FileText,
  MessageSquare,
  Mic,
  Send,
  Settings,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { assistantApi } from "@/lib/api";

interface Assistant {
  id: string;
  name: string;
  objective: string;
  tone: string;
  language: string;
  status: string;
  system_prompt: string | null;
  web_chat_enabled: boolean;
  voice_enabled: boolean;
  telegram_enabled: boolean;
  whatsapp_enabled: boolean;
  whatsapp_qr_enabled: boolean;
  total_tokens_used: number;
  enabled_actions: Record<string, boolean> | null;
}

export default function AssistantDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { token, workspaceId } = useAuth();
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [error, setError] = useState("");

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", objective: "", tone: "", language: "" });
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Channel toggles
  const [togglingChannel, setTogglingChannel] = useState<string | null>(null);

  // Delete state
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError("");
      const data = await assistantApi.get(token, workspaceId || "", id);
      setAssistant(data as Assistant);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger l'assistant");
    }
  }, [token, workspaceId, id]);

  useEffect(() => {
    load();
  }, [load]);

  const startEditing = () => {
    if (!assistant) return;
    setEditForm({
      name: assistant.name,
      objective: assistant.objective,
      tone: assistant.tone,
      language: assistant.language,
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!token || !assistant) return;
    setSaving(true);
    try {
      await assistantApi.update(token, workspaceId || "", id, editForm);
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const toggleChannel = async (channel: string, currentValue: boolean) => {
    if (!token || !assistant) return;
    setTogglingChannel(channel);
    try {
      await assistantApi.update(token, workspaceId || "", id, { [channel]: !currentValue });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la mise à jour");
    } finally {
      setTogglingChannel(null);
    }
  };

  const handleDelete = async () => {
    if (!token) return;
    setDeleting(true);
    try {
      await assistantApi.delete(token, workspaceId || "", id);
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression");
      setDeleting(false);
    }
  };

  if (error && !assistant) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-destructive mb-4">{error}</p>
        <button onClick={load} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
          Réessayer
        </button>
      </div>
    );
  }

  if (!assistant) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { href: `/dashboard/assistants/${id}/chat`, icon: <MessageSquare className="w-4 h-4" />, label: "Chat" },
    { href: `/dashboard/assistants/${id}/knowledge`, icon: <Database className="w-4 h-4" />, label: "Base de connaissances" },
    { href: `/dashboard/assistants/${id}/voice`, icon: <Mic className="w-4 h-4" />, label: "Appel vocal" },
  ];

  const channels = [
    { key: "web_chat_enabled", label: "Chat web", enabled: assistant.web_chat_enabled, icon: <MessageSquare className="w-4 h-4" /> },
    { key: "voice_enabled", label: "Voix (LiveKit)", enabled: assistant.voice_enabled, icon: <Mic className="w-4 h-4" /> },
    { key: "telegram_enabled", label: "Telegram", enabled: assistant.telegram_enabled, icon: <Send className="w-4 h-4" /> },
    { key: "whatsapp_enabled", label: "WhatsApp", enabled: assistant.whatsapp_enabled, icon: <Send className="w-4 h-4" /> },
  ];

  const statusLabel: Record<string, string> = {
    active: "Actif",
    draft: "Brouillon",
    inactive: "Inactif",
  };

  return (
    <div className="p-8">
      {error && assistant && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <Bot className="w-10 h-10" />
        </div>
        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-3">
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="text-2xl font-bold bg-background border border-input rounded-lg px-3 py-1.5 w-full focus:ring-2 focus:ring-primary outline-none"
              />
              <textarea
                value={editForm.objective}
                onChange={(e) => setEditForm({ ...editForm, objective: e.target.value })}
                className="text-sm bg-background border border-input rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-primary outline-none min-h-[60px]"
              />
              <div className="flex gap-3">
                <select
                  value={editForm.tone}
                  onChange={(e) => setEditForm({ ...editForm, tone: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="professional">Professionnel</option>
                  <option value="friendly">Amical</option>
                  <option value="formal">Formel</option>
                  <option value="casual">Décontracté</option>
                </select>
                <select
                  value={editForm.language}
                  onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                  className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {saving ? "Sauvegarde..." : "Sauvegarder"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{assistant.name}</h1>
                {saveSuccess && (
                  <span className="text-green-500 text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" /> Sauvegardé
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1">{assistant.objective}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    assistant.status === "active"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}
                >
                  {statusLabel[assistant.status] || assistant.status}
                </span>
                <span className="text-sm text-muted-foreground">
                  Ton: {assistant.tone} | Langue: {assistant.language}
                </span>
                <span className="text-sm text-muted-foreground">
                  {assistant.total_tokens_used.toLocaleString()} tokens utilisés
                </span>
              </div>
            </>
          )}
        </div>
        {!editing && (
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={startEditing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-sm"
              aria-label="Modifier l'assistant"
            >
              <Edit3 className="w-4 h-4" />
              Modifier
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
              aria-label="Supprimer l'assistant"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg">Supprimer cet assistant ?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Cette action est irréversible. Toutes les conversations, la base de connaissances et les configurations seront supprimées.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDelete(false)}
                className="flex-1 py-2.5 rounded-lg border border-border hover:bg-secondary transition-colors"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg hover:bg-secondary transition-colors text-sm font-medium"
          >
            {tab.icon}
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* System Prompt */}
        <div className="p-6 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            System Prompt (généré automatiquement)
          </h3>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-background p-4 rounded-lg max-h-64 overflow-auto">
            {assistant.system_prompt || "Non généré — envoyez un premier message pour le générer."}
          </pre>
        </div>

        {/* Channels with toggles */}
        <div className="p-6 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Canaux actifs
          </h3>
          <div className="space-y-3">
            {channels.map((ch) => (
              <div key={ch.key} className="flex items-center gap-3">
                <span className="flex items-center gap-2 text-sm flex-1">
                  {ch.icon}
                  {ch.label}
                </span>
                <button
                  onClick={() => toggleChannel(ch.key, ch.enabled)}
                  disabled={togglingChannel === ch.key}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    ch.enabled ? "bg-green-500" : "bg-muted"
                  } ${togglingChannel === ch.key ? "opacity-50" : ""}`}
                  role="switch"
                  aria-checked={ch.enabled}
                  aria-label={`${ch.label} ${ch.enabled ? "activé" : "désactivé"}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      ch.enabled ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
