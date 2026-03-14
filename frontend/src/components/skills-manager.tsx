"use client";

import React, { useState, useEffect } from "react";
import { Trash2, Settings, AlertCircle, Plus } from "lucide-react";

interface InstalledSkill {
  id: string;
  skill_id: string;
  name: string;
  description: string;
  is_active: boolean;
  usage_count: number;
  configuration?: Record<string, any>;
}

interface SkillsManagerProps {
  assistantId: string;
  onSkillsChange?: () => void;
}

export function SkillsManager({ assistantId, onSkillsChange }: SkillsManagerProps) {
  const [installedSkills, setInstalledSkills] = useState<InstalledSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<InstalledSkill | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/skills/assistant/${assistantId}?active_only=false`
      );
      const data = await response.json();
      setInstalledSkills(data || []);
    } catch (err) {
      setError("Erreur lors du chargement des skills");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSkill = async (skillId: string, currentState: boolean) => {
    try {
      // TODO: Implement toggle API
      setInstalledSkills((prev) =>
        prev.map((s) =>
          s.skill_id === skillId ? { ...s, is_active: !currentState } : s
        )
      );
    } catch (err) {
      console.error("Toggle error:", err);
      setError("Erreur lors de la mise à jour du skill");
    }
  };

  const handleUninstallSkill = async (skillId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir désinstaller ce skill?")) return;

    try {
      await fetch(`/api/v1/skills/${skillId}/uninstall/${assistantId}`, {
        method: "DELETE",
      });

      setInstalledSkills((prev) => prev.filter((s) => s.skill_id !== skillId));
      if (onSkillsChange) onSkillsChange();
    } catch (err) {
      console.error("Uninstall error:", err);
      setError("Erreur lors de la désinstallation");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-800 rounded-lg h-20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {installedSkills.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-gray-400 mb-4">Aucun skill installé</p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto">
            <Plus className="w-4 h-4" />
            Installer un skill
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {installedSkills.map((skill) => (
            <div
              key={skill.skill_id}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold">{skill.name}</h4>
                  <p className="text-gray-400 text-sm mt-1">{skill.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    Utilisé {skill.usage_count} fois
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggleSkill(skill.skill_id, skill.is_active)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      skill.is_active
                        ? "bg-green-900/30 text-green-400"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {skill.is_active ? "Actif" : "Inactif"}
                  </button>

                  {/* Configure */}
                  <button
                    onClick={() => {
                      setSelectedSkill(skill);
                      setShowConfigModal(true);
                    }}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Configurer"
                  >
                    <Settings className="w-4 h-4" />
                  </button>

                  {/* Uninstall */}
                  <button
                    onClick={() => handleUninstallSkill(skill.skill_id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                    title="Désinstaller"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && selectedSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-white mb-4">
              Configurer {selectedSkill.name}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Paramètres de configuration (JSON)
            </p>
            <textarea
              defaultValue={JSON.stringify(
                selectedSkill.configuration || {},
                null,
                2
              )}
              rows={8}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
