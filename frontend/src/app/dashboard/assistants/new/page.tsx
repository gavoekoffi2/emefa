"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Sparkles } from "lucide-react";

interface AssistantTemplate {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: string;
  default_tone: string;
  default_language: string;
  suggested_skills: string[];
}

const templates: AssistantTemplate[] = [
  {
    id: "architect",
    name: "Assistant Architecte",
    description:
      "Spécialisé pour les architectes et designers. Gère les projets, les plans et la collaboration.",
    emoji: "🏗️",
    category: "Architecture",
    default_tone: "professionnel",
    default_language: "fr",
    suggested_skills: ["google-sheets", "email-automation", "web-research"],
  },
  {
    id: "accountant",
    name: "Assistant Comptable",
    description:
      "Automatise les tâches comptables, les factures et les rapports financiers.",
    emoji: "📊",
    category: "Finance",
    default_tone: "formel",
    default_language: "fr",
    suggested_skills: [
      "payment-processing",
      "google-sheets",
      "email-automation",
    ],
  },
  {
    id: "sales",
    name: "Assistant Commercial",
    description: "Gère la prospection, le suivi des ventes et la relation client.",
    emoji: "💼",
    category: "Ventes",
    default_tone: "amical",
    default_language: "fr",
    suggested_skills: [
      "prospection",
      "whatsapp-integration",
      "email-automation",
    ],
  },
  {
    id: "content-creator",
    name: "Assistant Créateur de Contenu",
    description:
      "Crée du contenu pour les réseaux sociaux, vidéos et articles.",
    emoji: "🎬",
    category: "Marketing",
    default_tone: "créatif",
    default_language: "fr",
    suggested_skills: ["content-generation", "web-research", "email-automation"],
  },
  {
    id: "customer-support",
    name: "Assistant Support Client",
    description: "Gère les tickets support, FAQ et assistance 24/7.",
    emoji: "🎧",
    category: "Support",
    default_tone: "sympathique",
    default_language: "fr",
    suggested_skills: [
      "faq-knowledge-base",
      "whatsapp-integration",
      "telegram-integration",
    ],
  },
  {
    id: "ecommerce",
    name: "Assistant E-commerce",
    description:
      "Gère les commandes, les produits et la relation avec les clients.",
    emoji: "🛒",
    category: "E-commerce",
    default_tone: "commercial",
    default_language: "fr",
    suggested_skills: [
      "payment-processing",
      "whatsapp-integration",
      "sms-automation",
    ],
  },
];

export default function NewAssistantPage() {
  const router = useRouter();
  const [step, setStep] = useState<"template" | "config">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<AssistantTemplate | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    tone: "professionnel",
    language: "fr",
  });

  const handleTemplateSelect = (template: AssistantTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      tone: template.default_tone,
      language: template.default_language,
    });
    setStep("config");
  };

  const handleCreateFromScratch = () => {
    setSelectedTemplate(null);
    setStep("config");
  };

  const handleCreateAssistant = async () => {
    try {
      const response = await fetch("/api/v1/assistants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          tone: formData.tone,
          language: formData.language,
          template_id: selectedTemplate?.id || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/assistants/${data.id}`);
      } else {
        alert("Erreur lors de la création de l'assistant");
      }
    } catch (error) {
      console.error("Creation error:", error);
      alert("Erreur lors de la création de l'assistant");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">
            Créer un nouvel assistant
          </h1>
          <p className="text-gray-400">
            Choisissez un template ou créez un assistant personnalisé
          </p>
        </div>

        {/* Template Selection */}
        {step === "template" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-lg p-6 text-left transition-all hover:shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="text-4xl mb-3">{template.emoji}</div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4">
                    {template.description}
                  </p>
                  <span className="inline-block px-3 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full">
                    {template.category}
                  </span>
                </button>
              ))}
            </div>

            {/* Create from Scratch */}
            <button
              onClick={handleCreateFromScratch}
              className="w-full bg-gray-800 border-2 border-dashed border-gray-700 hover:border-gray-600 rounded-lg p-8 text-center transition-colors"
            >
              <Plus className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">
                Créer de zéro
              </h3>
              <p className="text-gray-400">Créez votre assistant personnalisé</p>
            </button>
          </>
        )}

        {/* Configuration Form */}
        {step === "config" && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nom de l'assistant
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ex: Assistant Commercial"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Décrivez le rôle de votre assistant..."
                rows={4}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Ton de la conversation
                </label>
                <select
                  value={formData.tone}
                  onChange={(e) =>
                    setFormData({ ...formData, tone: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="professionnel">Professionnel</option>
                  <option value="amical">Amical</option>
                  <option value="formel">Formel</option>
                  <option value="créatif">Créatif</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Langue
                </label>
                <select
                  value={formData.language}
                  onChange={(e) =>
                    setFormData({ ...formData, language: e.target.value })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                  <option value="es">Espagnol</option>
                </select>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setStep("template")}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Retour
              </button>
              <button
                onClick={handleCreateAssistant}
                disabled={!formData.name.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium"
              >
                <Sparkles className="w-5 h-5" />
                Créer l'assistant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
