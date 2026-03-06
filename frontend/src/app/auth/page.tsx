"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bot, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, token, loading: authLoading, login, register } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && token && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, token, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (password.length < 8) {
          setError("Le mot de passe doit contenir au moins 8 caractères");
          setLoading(false);
          return;
        }
        await register(email, password, fullName, workspaceName || undefined);
      }
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Bot className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">EMEFA</h1>
          <p className="text-muted-foreground mt-1">
            {isLogin ? "Connectez-vous à votre espace" : "Créez votre compte"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-8 rounded-2xl border border-border bg-card">
          {!isLogin && (
            <>
              <div>
                <label htmlFor="auth-fullname" className="block text-sm font-medium mb-1.5">Nom complet</label>
                <input
                  id="auth-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="Kofi Mensah"
                  required
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="auth-workspace" className="block text-sm font-medium mb-1.5">Nom du workspace</label>
                <input
                  id="auth-workspace"
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                  placeholder="Mon Entreprise"
                  autoComplete="organization"
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium mb-1.5">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              placeholder="vous@exemple.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="auth-password" className="block text-sm font-medium mb-1.5">Mot de passe</label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 pr-11 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
                minLength={8}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {!isLogin && password.length > 0 && password.length < 8 && (
              <p className="text-xs text-yellow-500 mt-1.5">8 caractères minimum</p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Chargement..." : isLogin ? "Se connecter" : "Créer un compte"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="text-primary hover:underline font-medium"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
