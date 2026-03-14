"use client";

import React, { useState } from "react";
import { SkillsMarketplace } from "@/components/skills-marketplace";
import { useRouter } from "next/navigation";

export default function MarketplacePage() {
  const router = useRouter();
  const [selectedAssistantId, setSelectedAssistantId] = useState<string | null>(null);

  const handleInstallSkill = async (skillId: string) => {
    if (!selectedAssistantId) {
      // Show modal to select assistant
      alert("Veuillez sélectionner un assistant");
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/skills/${skillId}/install/${selectedAssistantId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        alert("Skill installé avec succès!");
      } else {
        alert("Erreur lors de l'installation du skill");
      }
    } catch (error) {
      console.error("Installation error:", error);
      alert("Erreur lors de l'installation du skill");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950">
      {/* Navigation Bar */}
      <div className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Marketplace</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
          >
            ← Retour
          </button>
        </div>
      </div>

      {/* Main Content */}
      <SkillsMarketplace onInstall={handleInstallSkill} />
    </div>
  );
}
