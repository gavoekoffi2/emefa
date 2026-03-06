"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Bot,
  Clock,
  Lock,
  MessageSquare,
  RefreshCw,
  Shield,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { adminApi } from "@/lib/api";

interface Stats {
  total_assistants: number;
  total_conversations: number;
  total_messages: number;
  total_tokens_used: number;
  members_count: number;
}

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: "Création",
  update: "Mise à jour",
  delete: "Suppression",
  login: "Connexion",
  logout: "Déconnexion",
  register: "Inscription",
};

export default function AdminPage() {
  const { token, workspaceId, workspaceRole } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  const isAdmin = workspaceRole === "owner" || workspaceRole === "admin";

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError("");
      setLoadingData(true);
      const [s, l] = await Promise.all([
        adminApi.stats(token, workspaceId || ""),
        adminApi.auditLogs(token, workspaceId || ""),
      ]);
      setStats(s as Stats);
      setLogs(l as AuditLog[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible de charger les données admin");
    } finally {
      setLoadingData(false);
    }
  }, [token, workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  // Access denied state
  if (!isAdmin && !loadingData) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Accès restreint</h2>
        <p className="text-muted-foreground text-center max-w-sm mb-6">
          Seuls les administrateurs et propriétaires du workspace peuvent accéder à cette page.
        </p>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90"
        >
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const statCards = stats
    ? [
        { label: "Assistants", value: stats.total_assistants, icon: <Bot className="w-5 h-5" /> },
        { label: "Conversations", value: stats.total_conversations, icon: <MessageSquare className="w-5 h-5" /> },
        { label: "Messages", value: stats.total_messages.toLocaleString("fr-FR"), icon: <BarChart3 className="w-5 h-5" /> },
        { label: "Tokens utilisés", value: stats.total_tokens_used.toLocaleString("fr-FR"), icon: <Zap className="w-5 h-5" /> },
        { label: "Membres", value: stats.members_count, icon: <Users className="w-5 h-5" /> },
      ]
    : [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Administration</h1>
          <p className="text-muted-foreground mt-1">
            Vue d&apos;ensemble de votre workspace et journal d&apos;audit
          </p>
        </div>
        <button
          onClick={load}
          className="p-2.5 rounded-lg hover:bg-secondary transition-colors"
          aria-label="Rafraîchir les données"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm">
          {error}
          <button onClick={load} className="ml-2 underline">Réessayer</button>
        </div>
      )}

      {/* Stats */}
      {loadingData && !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-5 rounded-2xl border border-border bg-card animate-pulse">
              <div className="h-4 w-20 bg-muted rounded mb-3" />
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
          {statCards.map((s) => (
            <div key={s.label} className="p-5 rounded-2xl border border-border bg-card">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                {s.icon}
                <span className="text-sm">{s.label}</span>
              </div>
              <p className="text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Audit Logs */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Journal d&apos;audit
        </h2>
        {logs.length === 0 && !loadingData ? (
          <div className="text-center py-12 border border-dashed border-border rounded-2xl">
            <Clock className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucun événement enregistré</p>
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card"
              >
                <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {ACTION_LABELS[log.action] || log.action} — {log.resource_type}
                    {log.resource_id && (
                      <span className="text-muted-foreground font-normal"> ({log.resource_id.slice(0, 8)}...)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("fr-FR")}
                    {log.ip_address && ` | IP: ${log.ip_address}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
