"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bot,
  Database,
  MessageSquare,
  Mic,
  Settings,
  Send,
  FileText,
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
  const { token, workspaceId } = useAuth();
  const [assistant, setAssistant] = useState<Assistant | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await assistantApi.get(token, workspaceId || "", id);
      setAssistant(data as Assistant);
    } catch (e) {
      console.error(e);
    }
  }, [token, workspaceId, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!assistant) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse">Chargement...</div>
      </div>
    );
  }

  const tabs = [
    { href: `/dashboard/assistants/${id}/chat`, icon: <MessageSquare className="w-4 h-4" />, label: "Chat" },
    { href: `/dashboard/assistants/${id}/knowledge`, icon: <Database className="w-4 h-4" />, label: "Base de connaissances" },
    { href: `/dashboard/assistants/${id}/voice`, icon: <Mic className="w-4 h-4" />, label: "Appel vocal" },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start gap-6 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
          <Bot className="w-10 h-10" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{assistant.name}</h1>
          <p className="text-muted-foreground mt-1">{assistant.objective}</p>
          <div className="flex items-center gap-4 mt-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                assistant.status === "active"
                  ? "bg-green-500/10 text-green-500"
                  : "bg-yellow-500/10 text-yellow-500"
              }`}
            >
              {assistant.status}
            </span>
            <span className="text-sm text-muted-foreground">
              Ton: {assistant.tone} | Langue: {assistant.language}
            </span>
            <span className="text-sm text-muted-foreground">
              {assistant.total_tokens_used.toLocaleString()} tokens utilis\u00e9s
            </span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-2 mb-8 border-b border-border pb-4">
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

      {/* System Prompt Preview */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            System Prompt (g\u00e9n\u00e9r\u00e9 automatiquement)
          </h3>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap bg-background p-4 rounded-lg max-h-64 overflow-auto">
            {assistant.system_prompt || "Non g\u00e9n\u00e9r\u00e9"}
          </pre>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Canaux actifs
          </h3>
          <div className="space-y-3">
            {[
              { label: "Chat web", enabled: assistant.web_chat_enabled, icon: <MessageSquare className="w-4 h-4" /> },
              { label: "Voix (LiveKit)", enabled: assistant.voice_enabled, icon: <Mic className="w-4 h-4" /> },
              { label: "Telegram", enabled: assistant.telegram_enabled, icon: <Send className="w-4 h-4" /> },
              { label: "WhatsApp", enabled: assistant.whatsapp_enabled, icon: <Send className="w-4 h-4" /> },
            ].map((ch) => (
              <div key={ch.label} className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${ch.enabled ? "bg-green-500" : "bg-gray-500"}`} />
                <span className="flex items-center gap-2 text-sm">
                  {ch.icon}
                  {ch.label}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {ch.enabled ? "Activ\u00e9" : "D\u00e9sactiv\u00e9"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
