"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Database,
  FileText,
  Globe,
  RefreshCw,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { kbApi } from "@/lib/api";

interface KnowledgeBase {
  id: string;
  name: string;
  source_type: string;
  status: string;
  chunk_count: number;
  error_message?: string;
}

export default function KnowledgePage() {
  const params = useParams();
  const assistantId = params.id as string;
  const { token, workspaceId } = useAuth();
  const [kbs, setKbs] = useState<KnowledgeBase[]>([]);
  const [mode, setMode] = useState<"file" | "url" | "text" | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError("");
      const data = await kbApi.list(token, workspaceId || "", assistantId);
      setKbs(data as KnowledgeBase[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les sources");
    } finally {
      setInitialLoading(false);
    }
  }, [token, workspaceId, assistantId]);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh processing items
  useEffect(() => {
    const hasProcessing = kbs.some((kb) => kb.status === "processing" || kb.status === "pending");
    if (!hasProcessing) return;
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [kbs, load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);
    setError("");

    try {
      if (mode === "file" && fileRef.current?.files?.[0]) {
        const file = fileRef.current.files[0];
        if (file.size > 10 * 1024 * 1024) {
          setError("Le fichier ne doit pas dépasser 10 Mo");
          setLoading(false);
          return;
        }
        await kbApi.uploadFile(token, workspaceId || "", assistantId, name, file);
      } else if (mode === "url") {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          setError("L'URL doit commencer par http:// ou https://");
          setLoading(false);
          return;
        }
        await kbApi.addUrl(token, workspaceId || "", assistantId, { name, url });
      } else if (mode === "text") {
        await kbApi.addText(token, workspaceId || "", assistantId, { name, text });
      }
      setMode(null);
      setName("");
      setUrl("");
      setText("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'ajout de la source");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (kbId: string) => {
    if (!token) return;
    setError("");
    setDeleting(true);
    try {
      await kbApi.delete(token, workspaceId || "", assistantId, kbId);
      setDeleteConfirm(null);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  const statusColors: Record<string, string> = {
    ready: "bg-green-500/10 text-green-500",
    processing: "bg-blue-500/10 text-blue-500",
    pending: "bg-yellow-500/10 text-yellow-500",
    error: "bg-red-500/10 text-red-500",
  };

  const statusLabels: Record<string, string> = {
    ready: "Prêt",
    processing: "Traitement...",
    pending: "En attente",
    error: "Erreur",
  };

  if (initialLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-muted rounded-lg" />
          <div className="h-4 w-96 bg-muted rounded" />
          <div className="flex gap-3 mt-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-12 w-36 bg-muted rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Base de connaissances</h2>
          <p className="text-muted-foreground">
            Ajoutez des sources pour enrichir les réponses de votre assistant
          </p>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Rafraîchir"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Add source buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={() => setMode("file")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:border-primary/50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Upload fichier
        </button>
        <button
          onClick={() => setMode("url")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:border-primary/50 transition-colors"
        >
          <Globe className="w-4 h-4" />
          URL de site
        </button>
        <button
          onClick={() => setMode("text")}
          className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border hover:border-primary/50 transition-colors"
        >
          <Type className="w-4 h-4" />
          Coller du texte
        </button>
      </div>

      {/* Add form */}
      {mode && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-border bg-card mb-8 space-y-4">
          <h3 className="font-semibold">
            {mode === "file" ? "Upload un fichier" : mode === "url" ? "Ajouter une URL" : "Coller du texte"}
          </h3>
          <div>
            <label htmlFor="kb-name" className="block text-sm font-medium mb-1.5">Nom de la source</label>
            <input
              id="kb-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
              placeholder="Documentation produit"
              required
            />
          </div>
          {mode === "file" && (
            <div>
              <label htmlFor="kb-file" className="block text-sm font-medium mb-1.5">Fichier (PDF, DOC, TXT — max 10 Mo)</label>
              <input
                id="kb-file"
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.csv,.md"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary"
                required
              />
            </div>
          )}
          {mode === "url" && (
            <div>
              <label htmlFor="kb-url" className="block text-sm font-medium mb-1.5">URL</label>
              <input
                id="kb-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                placeholder="https://example.com"
                required
              />
            </div>
          )}
          {mode === "text" && (
            <div>
              <label htmlFor="kb-text" className="block text-sm font-medium mb-1.5">Texte</label>
              <textarea
                id="kb-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={50000}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none min-h-[150px]"
                placeholder="Collez votre texte ici..."
                required
              />
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMode(null)}
              className="px-5 py-2.5 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Traitement..." : "Ajouter"}
            </button>
          </div>
        </form>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <h3 className="font-semibold text-lg">Supprimer cette source ?</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Cette action est irréversible. Tous les chunks indexés seront supprimés.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg border border-border hover:bg-secondary transition-colors"
                disabled={deleting}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Knowledge bases list */}
      {kbs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <Database className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Aucune source de connaissances. Ajoutez-en une ci-dessus.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {kbs.map((kb) => (
            <div key={kb.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {kb.source_type === "file" ? (
                  <FileText className="w-5 h-5" />
                ) : kb.source_type === "url" ? (
                  <Globe className="w-5 h-5" />
                ) : (
                  <Type className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {kb.name}
                  {kb.source_type === "file" && <span className="ml-2 text-xs text-muted-foreground font-normal">[{kb.source_type}]</span>}
                  {kb.source_type === "url" && <span className="ml-2 text-xs text-muted-foreground font-normal">[URL]</span>}
                  {kb.source_type === "text" && <span className="ml-2 text-xs text-muted-foreground font-normal">[Texte]</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {kb.source_type} | {kb.chunk_count} chunks
                  {kb.error_message && (
                    <span className="text-destructive ml-2">— {kb.error_message}</span>
                  )}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[kb.status] || ""}`}>
                {statusLabels[kb.status] || kb.status}
              </span>
              <button
                onClick={() => setDeleteConfirm(kb.id)}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                aria-label={`Supprimer ${kb.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
