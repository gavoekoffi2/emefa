"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SkillsManager } from "@/components/skills-manager";
import { SkillsMarketplace } from "@/components/skills-marketplace";
import { ShoppingCart, Settings } from "lucide-react";

export default function AssistantSkillsPage() {
  const params = useParams();
  const assistantId = params.id as string;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"installed" | "marketplace">("installed");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mb-6 transition-colors"
          >
            ← Retour
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Skills & Compétences</h1>
          <p className="text-gray-400">
            Gérez et installez des skills pour booster votre assistant
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("installed")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "installed"
                ? "text-blue-500 border-blue-500"
                : "text-gray-400 border-transparent hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Installés
            </span>
          </button>
          <button
            onClick={() => setActiveTab("marketplace")}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === "marketplace"
                ? "text-blue-500 border-blue-500"
                : "text-gray-400 border-transparent hover:text-white"
            }`}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Marketplace
            </span>
          </button>
        </div>

        {/* Content */}
        <div>
          {activeTab === "installed" && (
            <SkillsManager
              assistantId={assistantId}
              onSkillsChange={() => {
                // Optionally refresh data
              }}
            />
          )}

          {activeTab === "marketplace" && (
            <SkillsMarketplace
              onInstall={(skillId) => {
                // Handle installation
                setActiveTab("installed");
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
