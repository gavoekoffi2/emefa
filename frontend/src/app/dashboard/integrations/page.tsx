"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send, Check, AlertCircle, Loader } from "lucide-react";

interface Integration {
  id: string;
  provider: "whatsapp" | "telegram";
  status: "connected" | "disconnected" | "pending";
  connected_at?: string;
  phone_number?: string;
  bot_username?: string;
}

export default function IntegrationsPage() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<"whatsapp" | "telegram" | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [telegramBotToken, setTelegramBotToken] = useState("");

  useEffect(() => {
    loadIntegrations();
  }, []);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/integrations/status");
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data);
      }
    } catch (err) {
      console.error("Failed to load integrations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppConnect = async () => {
    try {
      const response = await fetch("/api/v1/integrations/whatsapp/qr", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qr_code);
        setActiveModal("whatsapp");
      }
    } catch (err) {
      console.error("Error generating QR code:", err);
    }
  };

  const handleTelegramConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/v1/integrations/telegram/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bot_token: telegramBotToken }),
      });

      if (response.ok) {
        setTelegramBotToken("");
        setActiveModal(null);
        loadIntegrations();
      }
    } catch (err) {
      console.error("Error connecting Telegram:", err);
    }
  };

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Déconnecter ${provider}?`)) return;

    try {
      await fetch(`/api/v1/integrations/${provider}/disconnect`, {
        method: "POST",
      });
      loadIntegrations();
    } catch (err) {
      console.error("Error disconnecting:", err);
    }
  };

  const whatsappIntegration = integrations.find((i) => i.provider === "whatsapp");
  const telegramIntegration = integrations.find((i) => i.provider === "telegram");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white mb-6 transition-colors"
          >
            ← Retour
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">Intégrations</h1>
          <p className="text-gray-400">
            Connectez WhatsApp et Telegram à votre compte EMEFA
          </p>
        </div>

        {/* WhatsApp Card */}
        <div
          className={`border rounded-lg p-8 transition-all ${
            whatsappIntegration?.status === "connected"
              ? "bg-green-900/10 border-green-700/50"
              : "bg-gray-800/50 border-gray-700"
          }`}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-lg flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">WhatsApp</h2>
                <p className="text-gray-400">
                  {whatsappIntegration?.status === "connected"
                    ? `Connecté - ${whatsappIntegration.phone_number}`
                    : "Connectez votre compte WhatsApp Business"}
                </p>
              </div>
            </div>

            {whatsappIntegration?.status === "connected" && (
              <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500 rounded-full">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-400">Connecté</span>
              </div>
            )}
          </div>

          {whatsappIntegration?.status === "connected" ? (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">Statut</p>
                <p className="text-white font-semibold">Actif et synchronisé</p>
                {whatsappIntegration.connected_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Connecté depuis:{" "}
                    {new Date(whatsappIntegration.connected_at).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDisconnect("whatsapp")}
                className="px-6 py-3 bg-red-600/10 border border-red-600 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors font-medium"
              >
                Déconnecter
              </button>
            </div>
          ) : (
            <button
              onClick={handleWhatsAppConnect}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Scannez le code QR
            </button>
          )}
        </div>

        {/* Telegram Card */}
        <div
          className={`border rounded-lg p-8 transition-all ${
            telegramIntegration?.status === "connected"
              ? "bg-blue-900/10 border-blue-700/50"
              : "bg-gray-800/50 border-gray-700"
          }`}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Send className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Telegram</h2>
                <p className="text-gray-400">
                  {telegramIntegration?.status === "connected"
                    ? `Connecté - @${telegramIntegration.bot_username}`
                    : "Connectez votre bot Telegram"}
                </p>
              </div>
            </div>

            {telegramIntegration?.status === "connected" && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500 rounded-full">
                <Check className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-blue-400">Connecté</span>
              </div>
            )}
          </div>

          {telegramIntegration?.status === "connected" ? (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <p className="text-gray-400 text-sm mb-2">Statut</p>
                <p className="text-white font-semibold">Actif et synchronisé</p>
                {telegramIntegration.connected_at && (
                  <p className="text-xs text-gray-500 mt-2">
                    Connecté depuis:{" "}
                    {new Date(telegramIntegration.connected_at).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDisconnect("telegram")}
                className="px-6 py-3 bg-red-600/10 border border-red-600 hover:bg-red-600/20 text-red-400 rounded-lg transition-colors font-medium"
              >
                Déconnecter
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveModal("telegram")}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-semibold flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              Entrez votre bot token
            </button>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-blue-900/10 border border-blue-700/30 rounded-lg p-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-2">Comment ça marche?</h3>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>
                  🟢 <strong>WhatsApp:</strong> Scannez le code QR avec votre téléphone
                  pour autoriser EMEFA
                </li>
                <li>
                  🔵 <strong>Telegram:</strong> Créez un bot Telegram et collez le token
                  pour la connexion
                </li>
                <li>
                  Une fois connecté, vos assistants IA pourront communiquer via ces canaux
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp QR Modal */}
      {activeModal === "whatsapp" && qrCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white text-center">
              Scanner avec WhatsApp
            </h2>

            {/* QR Code */}
            <div className="bg-white p-6 rounded-lg flex items-center justify-center">
              <img
                src={`data:image/svg+xml;base64,${btoa(qrCode)}`}
                alt="WhatsApp QR Code"
                className="w-full"
              />
            </div>

            <p className="text-center text-gray-400 text-sm">
              Ouvrez WhatsApp sur votre téléphone et scannez ce code QR
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setActiveModal(null);
                  setQrCode(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  loadIntegrations();
                  setActiveModal(null);
                  setQrCode(null);
                }}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
              >
                Vérifié ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Telegram Token Modal */}
      {activeModal === "telegram" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg max-w-md w-full p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Connecter Telegram</h2>

            <form onSubmit={handleTelegramConnect} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Bot Token
                </label>
                <input
                  type="password"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="123456789:ABCDEfghijklmnopqrstuvwxyz..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Obtenez votre token auprès de @BotFather sur Telegram
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModal(null);
                    setTelegramBotToken("");
                  }}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!telegramBotToken.trim()}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg transition-colors font-medium"
                >
                  Connecter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
