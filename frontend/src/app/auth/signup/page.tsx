"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, User, Building2, CheckCircle, AlertCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<"account" | "workspace" | "verify">("account");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: searchParams.get("email") || "",
    password: "",
    confirmPassword: "",
    fullName: "",
    workspaceName: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email.trim()) {
      setError("Email requis");
      return;
    }
    if (!validateEmail(formData.email)) {
      setError("Email invalide");
      return;
    }
    if (!formData.password) {
      setError("Mot de passe requis");
      return;
    }
    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (!formData.fullName.trim()) {
      setError("Nom complet requis");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName,
          workspace_name: formData.workspaceName || `${formData.fullName}'s Workspace`,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setStep("workspace");
        // Auto-redirect after 2 seconds
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.detail || "Erreur lors de l'inscription");
      }
    } catch (err) {
      setError("Erreur de connexion. Veuillez réessayer.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>

          <h1 className="text-3xl font-bold text-white mb-2">
            Créer un compte
          </h1>
          <p className="text-gray-400">
            Rejoignez EMEFA et révolutionnez votre business
          </p>
        </div>

        {/* Success State */}
        {success && (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-6 space-y-4 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <div>
              <h2 className="text-lg font-bold text-white mb-2">
                Bienvenue sur EMEFA! 🎉
              </h2>
              <p className="text-gray-400 text-sm">
                Votre compte a été créé avec succès. Redirection en cours...
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleCreateAccount} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nom complet
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Claude Gavoe"
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="vous@exemple.com"
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 8 caractères"
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirmer votre mot de passe"
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Workspace Name (Optional) */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Nom de votre espace de travail <span className="text-gray-500">(optionnel)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="workspaceName"
                  value={formData.workspaceName}
                  onChange={handleInputChange}
                  placeholder="Mon Entreprise"
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                id="terms"
                defaultChecked
                className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700"
              />
              <label htmlFor="terms" className="text-gray-400">
                J'accepte les{" "}
                <a href="#" className="text-blue-500 hover:underline">
                  conditions d'utilisation
                </a>{" "}
                et la{" "}
                <a href="#" className="text-blue-500 hover:underline">
                  politique de confidentialité
                </a>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? "Création en cours..." : "Créer mon compte"}
            </button>

            {/* Login Link */}
            <p className="text-center text-gray-400 text-sm">
              Vous avez déjà un compte?{" "}
              <Link href="/auth/login" className="text-blue-500 hover:underline">
                Connectez-vous
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
