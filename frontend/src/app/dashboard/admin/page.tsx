"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Bot,
  Clock,
  MessageSquare,
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

export default function AdminPage() {
  const { token, workspaceId } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [s, l] = await Promise.all([
        adminApi.stats(token, workspaceId || ""),
        adminApi.auditLogs(token, workspaceId || ""),
      ]);
      setStats(s as Stats);
      setLogs(l as AuditLog[]);
    } catch (e) {
      console.error(e);
    }
  }, [token, workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  const statCards = stats
    ? [
        { label: "Assistants", value: stats.total_assistants, icon: <Bot className="w-5 h-5" /> },
        { label: "Conversations", value: stats.total_conversations, icon: <MessageSquare className="w-5 h-5" /> },
        { label: "Messages", value: stats.total_messages, icon: <BarChart3 className="w-5 h-5" /> },
        { label: "Tokens utilis\u00e9s", value: stats.total_tokens_used.toLocaleString(), icon: <Zap className="w-5 h-5" /> },
        { label: "Membres", value: stats.members_count, icon: <Users className="w-5 h-5" /> },
      ]
    : [];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2">Administration</h1>
      <p className="text-muted-foreground mb-8">
        Vue d&apos;ensemble de votre workspace et journal d&apos;audit
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {statCards.map((s, i) => (
          <div key={i} className="p-5 rounded-2xl border border-border bg-card">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              {s.icon}
              <span className="text-sm">{s.label}</span>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Audit Logs */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Journal d&apos;audit
        </h2>
        {logs.length === 0 ? (
          <p className="text-muted-foreground">Aucun \u00e9v\u00e9nement enregistr\u00e9</p>
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
                    {log.action} - {log.resource_type}
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
