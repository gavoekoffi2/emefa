"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [userData, setUserData] = useState<UserData | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/auth/me");
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setFormData({
          full_name: data.full_name,
          email: data.email,
        });
      }
    } catch (err) {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    setSaveLoading(true);
    try {
      const response = await fetch("/api/v1/auth/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Erreur lors de la mise à jour");
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setSaveLoading(true);
    try {
      const response = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setPasswordForm({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError("Erreur lors du changement de mot de passe");
      }
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div className="bg-gray-800 rounded-lg h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mb-6 transition-colors"
          >
            ← Retour
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Paramètres</h1>
          <p className="text-gray-400">Gérez votre profil et vos préférences</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 flex gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-green-400 text-sm">Modifications enregistrées</p>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <User className="w-6 h-6" />
            Profil
          </h2>

          <form onSubmit={handleProfileUpdate} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nom complet
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed opacity-50"
              />
              <p className="text-xs text-gray-500 mt-2">
                L'email ne peut pas être changé
              </p>
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saveLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Lock className="w-6 h-6" />
            Sécurité
          </h2>

          <form onSubmit={handlePasswordChange} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Mot de passe actuel
              </label>
              <input
                type="password"
                value={passwordForm.current_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    current_password: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={passwordForm.new_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    new_password: e.target.value,
                  })
                }
                placeholder="Minimum 8 caractères"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirm_password: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saveLoading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <Lock className="w-4 h-4" />
              {saveLoading ? "Mise à jour..." : "Changer le mot de passe"}
            </button>
          </form>
        </div>

        {/* API Keys Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 space-y-6">
          <h2 className="text-2xl font-bold text-white">Clés API</h2>
          <p className="text-gray-400">
            Gérez vos clés API pour les intégrations externes
          </p>
          <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors">
            Générer une nouvelle clé
          </button>
        </div>
      </div>
    </div>
  );
}
