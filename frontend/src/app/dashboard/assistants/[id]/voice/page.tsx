"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { livekitApi } from "@/lib/api";

export default function VoicePage() {
  const params = useParams();
  const assistantId = params.id as string;
  const { token, workspaceId } = useAuth();
  const [callState, setCallState] = useState<"idle" | "connecting" | "connected">("idle");
  const [livekitData, setLivekitData] = useState<{
    token: string;
    room_name: string;
    livekit_url: string;
  } | null>(null);
  const [muted, setMuted] = useState(false);

  const startCall = useCallback(async () => {
    if (!token) return;
    setCallState("connecting");

    try {
      const data = await livekitApi.getToken(token, workspaceId || "", assistantId) as {
        token: string;
        room_name: string;
        livekit_url: string;
      };
      setLivekitData(data);
      setCallState("connected");
    } catch (e) {
      console.error(e);
      setCallState("idle");
    }
  }, [token, workspaceId, assistantId]);

  const endCall = useCallback(() => {
    setCallState("idle");
    setLivekitData(null);
    setMuted(false);
  }, []);

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-2">Appel vocal</h2>
      <p className="text-muted-foreground mb-12">
        Parlez directement \u00e0 votre assistant via LiveKit
      </p>

      {/* Call circle */}
      <div className="relative mb-12">
        <div
          className={`w-40 h-40 rounded-full flex items-center justify-center transition-all ${
            callState === "connected"
              ? "bg-green-500/20 ring-4 ring-green-500/30"
              : callState === "connecting"
              ? "bg-yellow-500/20 ring-4 ring-yellow-500/30 animate-pulse"
              : "bg-primary/10 ring-4 ring-primary/20"
          }`}
        >
          {callState === "connected" ? (
            <Mic className="w-16 h-16 text-green-500" />
          ) : callState === "connecting" ? (
            <Phone className="w-16 h-16 text-yellow-500 animate-bounce" />
          ) : (
            <Mic className="w-16 h-16 text-primary" />
          )}
        </div>
      </div>

      {/* Status */}
      <p className="text-lg font-medium mb-8">
        {callState === "idle" && "Pr\u00eat \u00e0 appeler"}
        {callState === "connecting" && "Connexion en cours..."}
        {callState === "connected" && "Appel en cours"}
      </p>

      {/* Controls */}
      <div className="flex gap-4">
        {callState === "idle" ? (
          <button
            onClick={startCall}
            className="flex items-center gap-3 px-8 py-4 bg-green-500 text-white rounded-2xl font-semibold hover:bg-green-600 transition-colors"
          >
            <Phone className="w-5 h-5" />
            D\u00e9marrer l&apos;appel
          </button>
        ) : (
          <>
            <button
              onClick={() => setMuted(!muted)}
              className={`p-4 rounded-2xl transition-colors ${
                muted ? "bg-red-500/20 text-red-500" : "bg-secondary text-foreground"
              }`}
            >
              {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <button
              onClick={endCall}
              className="flex items-center gap-3 px-8 py-4 bg-red-500 text-white rounded-2xl font-semibold hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-5 h-5" />
              Raccrocher
            </button>
          </>
        )}
      </div>

      {/* LiveKit info */}
      {livekitData && (
        <div className="mt-8 p-4 rounded-xl bg-card border border-border text-sm">
          <p className="text-muted-foreground">
            Room: {livekitData.room_name} | URL: {livekitData.livekit_url}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Token LiveKit g\u00e9n\u00e9r\u00e9. Int\u00e9grez @livekit/components-react pour l&apos;audio complet.
          </p>
        </div>
      )}
    </div>
  );
}
