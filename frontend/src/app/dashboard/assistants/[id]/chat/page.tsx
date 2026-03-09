"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Bot, MessageSquare, Plus, RefreshCw, Send, User, History } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { chatApi } from "@/lib/api";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  sources?: { source_name: string; text: string; score: number }[];
}

interface Conversation {
  id: string;
  title?: string;
  created_at: string;
  message_count?: number;
}

export default function ChatPage() {
  const params = useParams();
  const assistantId = params.id as string;
  const { token, workspaceId } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [failedMessage, setFailedMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await chatApi.conversations(token, workspaceId || "", assistantId);
      setConversations(data as Conversation[]);
    } catch {
      // Silent fail — conversation list is non-critical
    }
  }, [token, workspaceId, assistantId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for a specific conversation
  const loadConversation = useCallback(async (convId: string) => {
    if (!token) return;
    try {
      const data = await chatApi.messages(token, workspaceId || "", assistantId, convId);
      setMessages(data as Message[]);
      setConversationId(convId);
      setShowHistory(false);
      inputRef.current?.focus();
    } catch {
      // Ignore
    }
  }, [token, workspaceId, assistantId]);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setShowHistory(false);
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async (userMsg: string) => {
    if (!token || loading) return;

    setFailedMessage(null);
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const resp = (await chatApi.send(token, workspaceId || "", assistantId, {
        message: userMsg,
        conversation_id: conversationId || undefined,
      })) as { conversation_id: string; message: string; sources?: Message["sources"]; tokens_used: number };

      if (!conversationId) {
        setConversationId(resp.conversation_id);
        // Refresh conversation list for new conversations
        loadConversations();
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: resp.message,
          sources: resp.sources,
        },
      ]);
    } catch {
      setFailedMessage(userMsg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Erreur de communication avec l'assistant." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [token, workspaceId, assistantId, conversationId, loading, loadConversations]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !token || loading) return;
    const userMsg = input.trim();
    setInput("");
    sendMessage(userMsg);
  }, [input, token, loading, sendMessage]);

  const handleRetry = useCallback(() => {
    if (!failedMessage) return;
    // Remove last two messages (failed user msg + error assistant msg)
    setMessages((prev) => prev.slice(0, -2));
    sendMessage(failedMessage);
  }, [failedMessage, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversation history sidebar */}
      {showHistory && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
            onClick={() => setShowHistory(false)}
          />
          <div className="fixed md:relative inset-y-0 left-0 z-40 w-72 bg-card border-r border-border flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold text-sm">Conversations</h3>
              <button
                onClick={startNewConversation}
                className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Nouvelle conversation"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-1">
              {conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Aucune conversation
                </p>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      conv.id === conversationId
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    <p className="truncate font-medium text-xs">
                      {conv.title || `Conversation du ${new Date(conv.created_at).toLocaleDateString("fr-FR")}`}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {new Date(conv.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-card/50">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Historique des conversations"
          >
            <History className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground">
            {conversationId ? "Conversation en cours" : "Nouvelle conversation"}
          </span>
          <button
            onClick={startNewConversation}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-secondary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-6" aria-label="Messages de la conversation">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <Bot className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Commencez la conversation</h2>
              <p className="text-muted-foreground">
                Envoyez un message pour discuter avec votre assistant
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={msg.id || i} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : ""}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs font-medium mb-1 opacity-70">Sources :</p>
                    {msg.sources.map((s, j) => (
                      <p key={j} className="text-xs opacity-60">
                        [{j + 1}] {s.source_name} (score: {(s.score * 100).toFixed(0)}%)
                      </p>
                    ))}
                  </div>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-5 py-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          {failedMessage && !loading && (
            <div className="flex justify-center">
              <button
                onClick={handleRetry}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Réessayer
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tapez votre message..."
              maxLength={2000}
              className="flex-1 px-5 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
              disabled={loading}
              aria-label="Saisir un message"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-5 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity"
              aria-label="Envoyer"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
