"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { AlertTriangle, Mic, MicOff, Phone, PhoneOff, Volume2 } from "lucide-react";
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
  const [error, setError] = useState("");
  const [duration, setDuration] = useState(0);
  const roomRef = useRef<import("livekit-client").Room | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Call timer
  useEffect(() => {
    if (callState === "connected") {
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setDuration(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const startCall = useCallback(async () => {
    if (!token) return;
    setCallState("connecting");
    setError("");

    try {
      const data = (await livekitApi.getToken(token, workspaceId || "", assistantId)) as {
        token: string;
        room_name: string;
        livekit_url: string;
      };
      setLivekitData(data);

      // Connect to LiveKit room
      const { Room, RoomEvent } = await import("livekit-client");
      const room = new Room();
      roomRef.current = room;

      room.on(RoomEvent.Disconnected, () => {
        setCallState("idle");
        setLivekitData(null);
        setMuted(false);
        roomRef.current = null;
      });

      await room.connect(data.livekit_url, data.token);
      await room.localParticipant.setMicrophoneEnabled(true);
      setCallState("connected");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Impossible de démarrer l'appel";
      setError(msg);
      setCallState("idle");
      roomRef.current = null;
    }
  }, [token, workspaceId, assistantId]);

  const endCall = useCallback(async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    setCallState("idle");
    setLivekitData(null);
    setMuted(false);
  }, []);

  const toggleMute = useCallback(async () => {
    if (roomRef.current?.localParticipant) {
      const newMuted = !muted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!newMuted);
      setMuted(newMuted);
    }
  }, [muted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
        roomRef.current = null;
      }
    };
  }, []);

  return (
    <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
      <h2 className="text-2xl font-bold mb-2">Appel vocal</h2>
      <p className="text-muted-foreground mb-12">
        Parlez directement à votre assistant via LiveKit WebRTC
      </p>

      {error && (
        <div className="mb-8 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2 max-w-md">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Call circle */}
      <div className="relative mb-8">
        {callState === "connected" && (
          <div className="absolute -inset-4 rounded-full bg-green-500/10 animate-ping" style={{ animationDuration: "2s" }} />
        )}
        <div
          className={`w-40 h-40 rounded-full flex items-center justify-center transition-all relative ${
            callState === "connected"
              ? "bg-green-500/20 ring-4 ring-green-500/30"
              : callState === "connecting"
              ? "bg-yellow-500/20 ring-4 ring-yellow-500/30 animate-pulse"
              : "bg-primary/10 ring-4 ring-primary/20"
          }`}
        >
          {callState === "connected" ? (
            muted ? (
              <MicOff className="w-16 h-16 text-red-400" />
            ) : (
              <Volume2 className="w-16 h-16 text-green-500" />
            )
          ) : callState === "connecting" ? (
            <Phone className="w-16 h-16 text-yellow-500 animate-bounce" />
          ) : (
            <Mic className="w-16 h-16 text-primary" />
          )}
        </div>
      </div>

      {/* Status */}
      <p className="text-lg font-medium mb-2">
        {callState === "idle" && "Prêt à appeler"}
        {callState === "connecting" && "Connexion en cours..."}
        {callState === "connected" && (muted ? "Micro coupé" : "Appel en cours")}
      </p>

      {callState === "connected" && (
        <p className="text-sm text-muted-foreground mb-8 font-mono">{formatDuration(duration)}</p>
      )}
      {callState !== "connected" && <div className="mb-8" />}

      {/* Controls */}
      <div className="flex gap-4">
        {callState === "idle" ? (
          <button
            onClick={startCall}
            className="flex items-center gap-3 px-8 py-4 bg-green-500 text-white rounded-2xl font-semibold hover:bg-green-600 transition-colors"
          >
            <Phone className="w-5 h-5" />
            Démarrer l&apos;appel
          </button>
        ) : (
          <>
            <button
              onClick={toggleMute}
              className={`p-4 rounded-2xl transition-colors ${
                muted ? "bg-red-500/20 text-red-500" : "bg-secondary text-foreground"
              }`}
              aria-label={muted ? "Réactiver le micro" : "Couper le micro"}
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

      {/* Room info */}
      {livekitData && callState === "connected" && (
        <div className="mt-8 p-4 rounded-xl bg-card border border-border text-sm max-w-md text-center">
          <p className="text-muted-foreground">
            Room: <span className="font-mono">{livekitData.room_name}</span>
          </p>
        </div>
      )}
    </div>
  );
}
