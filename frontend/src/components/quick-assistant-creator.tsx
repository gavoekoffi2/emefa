"use client";

import React, { useState } from "react";
import { Wand2, ChevronRight } from "lucide-react";

interface AssistantTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  defaultPrompt: string;
}

const TEMPLATES: AssistantTemplate[] = [
  {
    id: "commerce",
    name: "Assistant E-commerce",
    description: "Gérez les questions des clients, les commandes et les retours",
    icon: "🛍️",
    category: "commerce",
    defaultPrompt:
      "Tu es un assistant e-commerce expert. Aide les clients avec leurs questions sur les produits, les commandes et les retours.",
  },
  {
    id: "comptable",
    name: "Assistant Comptable",
    description: "Automatisez la facturation et la gestion financière",
    icon: "📊",
    category: "finance",
    defaultPrompt:
      "Tu es un assistant comptable. Aide à la gestion des factures, des devis et des états financiers.",
  },
  {
    id: "support",
    name: "Assistant Support Client",
    description: "Répondez aux questions clients 24/7",
    icon: "💬",
    category: "support",
    defaultPrompt:
      "Tu es un agent de support client attentif et utile. Résous les problèmes rapidement et efficacement.",
  },
  {
    id: "realtor",
    name: "Assistant Immobilier",
    description: "Gestion de propriétés et d'annonces immobilières",
    icon: "🏠",
    category: "immobilier",
    defaultPrompt:
      "Tu es un agent immobilier professionnel. Aide les clients à trouver la propriété idéale.",
  },
  {
    id: "education",
    name: "Assistant Éducatif",
    description: "Tutoriel en ligne et support pédagogique",
    icon: "📚",
    category: "education",
    defaultPrompt:
      "Tu es un tuteur en ligne patient et pédagogue. Explique les concepts simplement et aide les étudiants.",
  },
  {
    id: "prospection",
    name: "Assistant Prospection",
    description: "Automatisez la recherche de leads et la prospection",
    icon: "🎯",
    category: "sales",
    defaultPrompt:
      "Tu es un expert en prospection commerciale. Identifie et engage les prospects potentiels.",
  },
];

interface QuickAssistantCreatorProps {
  onAssistantCreated?: (assistantData: {
    name: string;
    description: string;
    systemPrompt: string;
    templateId: string;
  }) => void;
}

export function QuickAssistantCreator({
  onAssistantCreated,
}: QuickAssistantCreatorProps) {
  const [step, setStep] = useState<"select" | "customize">("select");
  const [selectedTemplate, setSelectedTemplate] =
    useState<AssistantTemplate | null>(null);
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSelectTemplate = (template: AssistantTemplate) => {
    setSelectedTemplate(template);
    setCustomName(template.name);
    setCustomDescription(template.description);
    setStep("customize");
  };

  const handleCreate = async () => {
    if (!selectedTemplate || !customName.trim()) return;

    setIsCreating(true);

    try {
      if (onAssistantCreated) {
        onAssistantCreated({
          name: customName,
          description: customDescription,
          systemPrompt: selectedTemplate.defaultPrompt,
          templateId: selectedTemplate.id,
        });
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleBackToSelect = () => {
    setStep("select");
    setSelectedTemplate(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {step === "select" && (
        <div className="space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
              <Wand2 className="w-8 h-8 text-blue-500" />
              Créez votre Assistant en 30 secondes
            </h2>
            <p className="text-gray-400">
              Choisissez un template ou créez un assistant personnalisé
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelectTemplate(template)}
                className="group p-6 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 hover:bg-gray-750 transition-all text-left hover:scale-105"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{template.icon}</span>
                  <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
                </div>
                <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                <p className="text-sm text-gray-400">{template.description}</p>
              </button>
            ))}
          </div>

          {/* Or custom */}
          <div className="pt-6 border-t border-gray-700">
            <button className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 hover:border-gray-600 transition-all font-medium">
              ➕ Créer un assistant personnalisé
            </button>
          </div>
        </div>
      )}

      {step === "customize" && selectedTemplate && (
        <div className="space-y-6 bg-gray-800 rounded-lg p-8 border border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center text-4xl">
              {selectedTemplate.icon}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">
                {selectedTemplate.name}
              </h3>
              <p className="text-gray-400">{selectedTemplate.category}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom de l'assistant
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="ex: Support Client Premium"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Décrivez le rôle et les responsabilités..."
                rows={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            {/* System Prompt Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prompt Système
              </label>
              <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600 text-gray-300 text-sm max-h-32 overflow-y-auto">
                {selectedTemplate.defaultPrompt}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Vous pourrez l'éditer après la création
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              onClick={handleBackToSelect}
              className="flex-1 px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              ← Retour
            </button>
            <button
              onClick={handleCreate}
              disabled={!customName.trim() || isCreating}
              className="flex-1 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {isCreating ? "Création..." : "Créer l'assistant"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
