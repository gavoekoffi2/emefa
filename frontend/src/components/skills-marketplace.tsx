"use client";

import React, { useState, useEffect } from "react";
import { Search, Star, Download, Shield } from "lucide-react";

interface Skill {
  id: string;
  title: string;
  short_description: string;
  categories: string[];
  downloads: number;
  rating: number;
  is_verified: boolean;
  is_featured: boolean;
  is_free: boolean;
}

interface SkillsMarketplaceProps {
  onInstall?: (skillId: string) => void;
}

export function SkillsMarketplace({ onInstall }: SkillsMarketplaceProps) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filteredSkills, setFilteredSkills] = useState<Skill[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    "integration",
    "automation",
    "communication",
    "payment",
    "knowledge",
    "analytics",
  ];

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/skills/marketplace");
      const data = await response.json();
      setSkills(data.items || []);
      setFilteredSkills(data.items || []);
    } catch (err) {
      setError("Erreur lors du chargement des skills");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = skills;

    // Filtrer par recherche
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (skill) =>
          skill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          skill.short_description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtrer par catégorie
    if (selectedCategory) {
      filtered = filtered.filter((skill) =>
        skill.categories.includes(selectedCategory)
      );
    }

    setFilteredSkills(filtered);
  }, [searchQuery, selectedCategory, skills]);

  const handleInstall = (skillId: string) => {
    if (onInstall) {
      onInstall(skillId);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-white">Marketplace de Skills</h1>
        <p className="text-gray-400">
          Découvrez et installez des compétences pour booster votre assistant
        </p>
      </div>

      {/* Search & Filter */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-3 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher des skills (WhatsApp, Gmail, etc.)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Tous
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg h-80 animate-pulse" />
          ))}
        </div>
      )}

      {/* Skills Grid */}
      {!loading && (
        <>
          {filteredSkills.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">
                Aucun skill trouvé. Essayez une autre recherche.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSkills.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onInstall={() => handleInstall(skill.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface SkillCardProps {
  skill: Skill;
  onInstall: () => void;
}

function SkillCard({ skill, onInstall }: SkillCardProps) {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-colors flex flex-col h-full">
      {/* Card Header */}
      <div className="p-6 space-y-4 flex-1">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{skill.title}</h3>
            <p className="text-gray-400 text-sm mt-1">
              {skill.short_description}
            </p>
          </div>
          {skill.is_verified && (
            <Shield className="w-5 h-5 text-blue-500 flex-shrink-0" />
          )}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {skill.categories.map((cat) => (
            <span
              key={cat}
              className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full"
            >
              {cat}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4" />
            <span>{skill.downloads}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span>{skill.rating}/5</span>
          </div>
          {skill.is_featured && (
            <span className="px-2 py-1 bg-yellow-900/30 text-yellow-300 text-xs rounded-full">
              ⭐ En avant
            </span>
          )}
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-4 border-t border-gray-700">
        <button
          onClick={onInstall}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
            skill.is_free
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-700 text-gray-300 hover:bg-gray-600"
          }`}
        >
          {skill.is_free ? "Installer" : "En savoir plus"}
        </button>
      </div>
    </div>
  );
}
