"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Database,
  FileText,
  Globe,
  Plus,
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
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await kbApi.list(token, workspaceId || "", assistantId);
      setKbs(data as KnowledgeBase[]);
    } catch (e) {
      console.error(e);
    }
  }, [token, workspaceId, assistantId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setLoading(true);

    try {
      if (mode === "file" && fileRef.current?.files?.[0]) {
        await kbApi.uploadFile(token, workspaceId || "", assistantId, name, fileRef.current.files[0]);
      } else if (mode === "url") {
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
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (kbId: string) => {
    if (!token) return;
    try {
      await kbApi.delete(token, workspaceId || "", assistantId, kbId);
      load();
    } catch (e) {
      console.error(e);
    }
  };

  const statusColors: Record<string, string> = {
    ready: "bg-green-500/10 text-green-500",
    processing: "bg-blue-500/10 text-blue-500",
    pending: "bg-yellow-500/10 text-yellow-500",
    error: "bg-red-500/10 text-red-500",
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold">Base de connaissances</h2>
          <p className="text-muted-foreground">
            Ajoutez des sources pour enrichir les r\u00e9ponses de votre assistant
          </p>
        </div>
      </div>

      {/* Add source buttons */}
      <div className="flex gap-3 mb-8">
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
            <label className="block text-sm font-medium mb-1.5">Nom de la source</label>
            <input
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
              <label className="block text-sm font-medium mb-1.5">Fichier (PDF, DOC, TXT)</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                required
              />
            </div>
          )}
          {mode === "url" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">URL</label>
              <input
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
              <label className="block text-sm font-medium mb-1.5">Texte</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
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
                <p className="font-medium truncate">{kb.name}</p>
                <p className="text-xs text-muted-foreground">
                  {kb.source_type} | {kb.chunk_count} chunks
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[kb.status] || ""}`}>
                {kb.status}
              </span>
              <button
                onClick={() => handleDelete(kb.id)}
                className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
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
