"use client";

import React, { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chat-interface";
import { useParams } from "next/navigation";
import { Settings, Share2, Info, Plus } from "lucide-react";

interface Assistant {
  id: string;
  name: string;
  description: string;
  avatar_emoji?: string;
  status: "active" | "inactive";
}

export default function ChatNewPage() {
  const params = useParams();
  const assistantId = params?.id as string;
  
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    fetchAssistant();
  }, [assistantId]);

  const fetchAssistant = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/assistants/${assistantId}`);
      const data = await response.json();
      setAssistant(data);
    } catch (error) {
      console.error("Error fetching assistant:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    try {
      const response = await fetch(`/api/v1/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assistant_id: assistantId,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      console.log("Response:", data);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!assistant) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Assistant non trouvé</p>
          <a
            href="/dashboard"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retour au Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Right Sidebar - Info Panel */}
      {showSidebar && (
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-700 p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-2xl">
                {assistant.avatar_emoji || "🤖"}
              </div>
              <div className="flex-1">
                <h2 className="text-white font-semibold">{assistant.name}</h2>
                <span
                  className={`inline-block text-xs px-2 py-1 rounded-full ${
                    assistant.status === "active"
                      ? "bg-green-900/50 text-green-300"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {assistant.status === "active" ? "En ligne" : "Hors ligne"}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400">{assistant.description}</p>
          </div>

          {/* Actions */}
          <div className="border-b border-gray-700 p-4 space-y-3">
            <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
              <Settings className="w-4 h-4" />
              Paramètres
            </button>
            <button className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4" />
              Partager
            </button>
          </div>

          {/* Info Section */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Informations
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-400">ID</p>
                  <p className="text-white font-mono text-xs break-all">
                    {assistantId}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400">Statut</p>
                  <p className="text-white capitalize">{assistant.status}</p>
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Skills Actifs
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-gray-700/50 rounded-lg text-sm text-gray-300">
                  Aucun skill installé
                </div>
                <button className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors text-sm">
                  + Ajouter un skill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatInterface
          assistantName={assistant.name}
          assistantAvatar={assistant.avatar_emoji || "🤖"}
          onSendMessage={handleSendMessage}
        />
      </div>
    </div>
  );
}
