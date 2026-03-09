"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle,
  Box,
  Building2,
  Check,
  ChevronRight,
  Download,
  FileImage,
  FileText,
  FolderOpen,
  Image,
  Laptop,
  Loader2,
  Monitor,
  Plus,
  RefreshCw,
  Send,
  Upload,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { architectApi, bridgeApi, chatApi } from "@/lib/api";

// ── Types ───────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  description?: string;
  brief?: string;
  status: string;
  checklist_answers?: Record<string, string>;
  references?: Array<{
    name: string;
    type: string;
    filename: string;
    content_type: string;
    size_bytes: number;
  }>;
  current_step: number;
  action_plan?: {
    steps: Array<{
      step: number;
      title: string;
      description: string;
      status: string;
    }>;
    total_steps: number;
  };
  outputs?: Array<{
    type: string;
    filename: string;
    s3_key?: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface BridgeDevice {
  id: string;
  device_name: string;
  device_os: string;
  blender_version?: string;
  status: string;
  permissions?: Record<string, boolean>;
  last_heartbeat?: string;
  connection_method: string;
}

interface BridgeAction {
  id: string;
  action_type: string;
  status: string;
  parameters?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error_message?: string;
  requires_approval: boolean;
  approved_by_user?: boolean;
  created_at: string;
}

// ── Checklist Questions ─────────────────────────────────────────────

const CHECKLIST_QUESTIONS = [
  { id: "dimensions", question: "Dimensions approximatives (L × l × H) ?", required: true },
  { id: "style", question: "Style architectural ?", required: true },
  { id: "constraints", question: "Contraintes particulières ?", required: false },
  { id: "materials", question: "Matériaux principaux ?", required: true },
  { id: "usage", question: "Fonction du bâtiment ?", required: true },
];

export default function ArchitectPage() {
  const params = useParams();
  const assistantId = params.id as string;
  const { token, workspaceId } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<"brief" | "references" | "result">("brief");
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [devices, setDevices] = useState<BridgeDevice[]>([]);
  const [actions, setActions] = useState<BridgeAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Brief form
  const [projectName, setProjectName] = useState("");
  const [brief, setBrief] = useState("");
  const [checklist, setChecklist] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);

  // Bridge
  const [showBridgeSetup, setShowBridgeSetup] = useState(false);
  const [bridgeForm, setBridgeForm] = useState({ device_name: "", device_os: "windows", blender_path: "" });
  const [bridgeToken, setBridgeToken] = useState<{ device_id: string; device_token: string; websocket_url: string } | null>(null);
  const [registering, setRegistering] = useState(false);

  // Chat
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // ── Load Data ───────────────────────────────────────────────────

  const loadProjects = useCallback(async () => {
    if (!token) return;
    try {
      const data = await architectApi.listProjects(token, workspaceId || "", assistantId);
      setProjects(data as Project[]);
      if ((data as Project[]).length > 0 && !currentProject) {
        setCurrentProject((data as Project[])[0]);
      }
    } catch {
      // Projects may not exist yet
    }
  }, [token, workspaceId, assistantId, currentProject]);

  const loadDevices = useCallback(async () => {
    if (!token) return;
    try {
      const data = await bridgeApi.listDevices(token, workspaceId || "", assistantId);
      setDevices(data as BridgeDevice[]);
    } catch {
      // No devices yet
    }
  }, [token, workspaceId, assistantId]);

  const loadActions = useCallback(async () => {
    if (!token || !currentProject) return;
    try {
      const data = await bridgeApi.listActions(token, workspaceId || "", { assistant_id: assistantId });
      setActions(data as BridgeAction[]);
    } catch {
      // No actions yet
    }
  }, [token, workspaceId, assistantId, currentProject]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadProjects(), loadDevices()]);
      setLoading(false);
    };
    load();
  }, [loadProjects, loadDevices]);

  useEffect(() => {
    if (currentProject) loadActions();
  }, [currentProject, loadActions]);

  // Refresh device status every 10s
  useEffect(() => {
    const interval = setInterval(loadDevices, 10000);
    return () => clearInterval(interval);
  }, [loadDevices]);

  // ── Create Project ────────────────────────────────────────────────

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !projectName) return;
    setCreating(true);
    setError("");
    try {
      const project = await architectApi.createProject(token, workspaceId || "", {
        assistant_id: assistantId,
        name: projectName,
        brief,
      }) as Project;

      // Save checklist answers
      if (Object.keys(checklist).length > 0) {
        await architectApi.updateProject(token, workspaceId || "", project.id, {
          checklist_answers: checklist,
        });
      }

      setCurrentProject(project);
      await loadProjects();
      setProjectName("");
      setBrief("");
      setChecklist({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la création");
    } finally {
      setCreating(false);
    }
  };

  // ── Reference Upload ──────────────────────────────────────────────

  const handleUploadRef = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !currentProject) return;
    try {
      const refType = file.type.startsWith("image/") ? "image" : "plan";
      await architectApi.addReference(token, workspaceId || "", currentProject.id, file.name, refType, file);
      const updated = await architectApi.getProject(token, workspaceId || "", currentProject.id) as Project;
      setCurrentProject(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload échoué");
    }
  };

  // ── Generate Plan ─────────────────────────────────────────────────

  const handleGeneratePlan = async () => {
    if (!token || !currentProject) return;
    try {
      const plan = await architectApi.generatePlan(token, workspaceId || "", currentProject.id);
      const updated = await architectApi.getProject(token, workspaceId || "", currentProject.id) as Project;
      setCurrentProject(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la génération du plan");
    }
  };

  // ── Bridge Registration ───────────────────────────────────────────

  const handleRegisterBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setRegistering(true);
    try {
      const result = await bridgeApi.registerDevice(token, workspaceId || "", {
        assistant_id: assistantId,
        device_name: bridgeForm.device_name,
        device_os: bridgeForm.device_os,
        blender_path: bridgeForm.blender_path || undefined,
      }) as { device_id: string; device_token: string; websocket_url: string };
      setBridgeToken(result);
      await loadDevices();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setRegistering(false);
    }
  };

  // ── Chat with Architect Assistant ─────────────────────────────────

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !chatMessage.trim()) return;
    setChatLoading(true);
    setChatHistory((prev) => [...prev, { role: "user", content: chatMessage }]);
    const msg = chatMessage;
    setChatMessage("");
    try {
      const result = await chatApi.send(token, workspaceId || "", assistantId, {
        message: msg,
        conversation_id: conversationId || undefined,
      }) as { conversation_id: string; message: string };
      setConversationId(result.conversation_id);
      setChatHistory((prev) => [...prev, { role: "assistant", content: result.message }]);
    } catch (e) {
      setChatHistory((prev) => [...prev, { role: "assistant", content: "Erreur: " + (e instanceof Error ? e.message : "inconnu") }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Execute Action in Blender ─────────────────────────────────────

  const handleExecuteStep = async (step: { step: number; title: string; actions: string[] }) => {
    if (!token || devices.length === 0) return;
    const connectedDevice = devices.find((d) => d.status === "connected");
    if (!connectedDevice) {
      setError("Aucun appareil connecté. Connectez le Desktop Bridge.");
      return;
    }

    for (const actionType of step.actions) {
      try {
        await bridgeApi.createAction(token, workspaceId || "", {
          device_id: connectedDevice.id,
          action_type: actionType,
          parameters: {},
          requires_approval: true,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur lors de l'exécution");
      }
    }
    await loadActions();
  };

  // ── Approve Action ────────────────────────────────────────────────

  const handleApproveAction = async (actionId: string, approved: boolean) => {
    if (!token) return;
    try {
      await bridgeApi.approveAction(token, workspaceId || "", actionId, approved);
      await loadActions();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  };

  // ── Bridge Status Indicator ───────────────────────────────────────

  const connectedDevice = devices.find((d) => d.status === "connected");
  const hasDevices = devices.length > 0;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Assistant Architecte</h1>
            <p className="text-muted-foreground text-sm">Transformez vos idées en maquettes 3D</p>
          </div>
        </div>

        {/* Bridge Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBridgeSetup(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              connectedDevice
                ? "bg-green-500/10 text-green-600 border border-green-500/20"
                : hasDevices
                ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                : "bg-muted text-muted-foreground border border-border hover:border-primary/50"
            }`}
          >
            {connectedDevice ? (
              <>
                <Wifi className="w-4 h-4" />
                <Monitor className="w-4 h-4" />
                Connecté
              </>
            ) : hasDevices ? (
              <>
                <WifiOff className="w-4 h-4" />
                Hors ligne
              </>
            ) : (
              <>
                <Laptop className="w-4 h-4" />
                Connecter Blender
              </>
            )}
          </button>
          <button onClick={loadProjects} className="p-2.5 rounded-lg hover:bg-secondary transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError("")} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Project Selector */}
      {projects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => setCurrentProject(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                currentProject?.id === p.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border hover:border-primary/50"
              }`}
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={() => setCurrentProject(null)}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-dashed border-border hover:border-primary/50 flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Nouveau
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        {[
          { key: "brief" as const, label: "Brief", icon: <FileText className="w-4 h-4" /> },
          { key: "references" as const, label: "Références", icon: <Image className="w-4 h-4" /> },
          { key: "result" as const, label: "Résultat", icon: <Box className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Brief Tab ──────────────────────────────────────── */}
          {activeTab === "brief" && !currentProject && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4">Nouveau projet architectural</h2>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nom du projet</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Maison individuelle – Lot 42"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Brief du projet</label>
                  <textarea
                    value={brief}
                    onChange={(e) => setBrief(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
                    placeholder="Décrivez votre projet : type de bâtiment, contexte, ambiance souhaitée..."
                  />
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    Checklist de questions
                  </h3>
                  {CHECKLIST_QUESTIONS.map((q) => (
                    <div key={q.id} className="mb-3">
                      <label className="block text-sm mb-1">
                        {q.question}
                        {q.required && <span className="text-destructive ml-1">*</span>}
                      </label>
                      <input
                        type="text"
                        value={checklist[q.id] || ""}
                        onChange={(e) => setChecklist({ ...checklist, [q.id]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none text-sm"
                        required={q.required}
                      />
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Créer le projet
                </button>
              </form>
            </div>
          )}

          {activeTab === "brief" && currentProject && (
            <div className="space-y-6">
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">{currentProject.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    currentProject.status === "exported" ? "bg-green-500/10 text-green-500" :
                    currentProject.status === "saved" ? "bg-blue-500/10 text-blue-500" :
                    "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {currentProject.status === "exported" ? "Exporté" :
                     currentProject.status === "saved" ? "Sauvegardé" : "Brouillon"}
                  </span>
                </div>
                {currentProject.brief && (
                  <p className="text-sm text-muted-foreground mb-4">{currentProject.brief}</p>
                )}
                {currentProject.checklist_answers && (
                  <div className="space-y-2">
                    {Object.entries(currentProject.checklist_answers).map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-sm">
                        <span className="font-medium capitalize min-w-[100px]">{key}:</span>
                        <span className="text-muted-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Plan */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Plan d&apos;action</h3>
                  {!currentProject.action_plan && (
                    <button
                      onClick={handleGeneratePlan}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                    >
                      Générer le plan
                    </button>
                  )}
                </div>
                {currentProject.action_plan?.steps ? (
                  <div className="space-y-3">
                    {currentProject.action_plan.steps.map((step) => (
                      <div
                        key={step.step}
                        className={`flex items-start gap-3 p-3 rounded-xl border ${
                          step.status === "completed"
                            ? "border-green-500/20 bg-green-500/5"
                            : step.step === currentProject.current_step + 1
                            ? "border-primary/30 bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          step.status === "completed"
                            ? "bg-green-500 text-white"
                            : step.step === currentProject.current_step + 1
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {step.status === "completed" ? <Check className="w-4 h-4" /> : step.step}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{step.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                        </div>
                        {step.status !== "completed" && connectedDevice && (
                          <button
                            onClick={() => handleExecuteStep(step as unknown as { step: number; title: string; actions: string[] })}
                            className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium hover:bg-primary/20 flex items-center gap-1"
                          >
                            <ChevronRight className="w-3 h-3" />
                            Exécuter
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun plan généré. Remplissez le brief et la checklist, puis générez le plan.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── References Tab ─────────────────────────────────── */}
          {activeTab === "references" && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Références visuelles</h2>
                {currentProject && (
                  <label className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 cursor-pointer flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Ajouter
                    <input
                      type="file"
                      className="hidden"
                      accept="image/png,image/jpeg,image/svg+xml,application/pdf"
                      onChange={handleUploadRef}
                    />
                  </label>
                )}
              </div>

              {!currentProject ? (
                <p className="text-sm text-muted-foreground">Créez d&apos;abord un projet pour ajouter des références.</p>
              ) : !currentProject.references?.length ? (
                <div className="text-center py-12">
                  <FileImage className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">Aucune référence ajoutée</p>
                  <p className="text-xs text-muted-foreground">
                    Uploadez des plans (PDF, PNG), des photos d&apos;inspiration ou des croquis.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {currentProject.references.map((ref, i) => (
                    <div key={i} className="p-3 rounded-xl border border-border bg-background">
                      <div className="w-full h-24 rounded-lg bg-muted flex items-center justify-center mb-2">
                        {ref.content_type?.startsWith("image/") ? (
                          <Image className="w-8 h-8 text-muted-foreground" />
                        ) : (
                          <FileText className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">{ref.name}</p>
                      <p className="text-xs text-muted-foreground">{ref.type} · {(ref.size_bytes / 1024).toFixed(0)} KB</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Result Tab ─────────────────────────────────────── */}
          {activeTab === "result" && (
            <div className="space-y-6">
              {/* Actions Timeline */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">Timeline des actions</h2>
                {actions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune action exécutée. Générez un plan et exécutez les étapes via le Bridge.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {actions.map((action) => (
                      <div key={action.id} className="flex items-start gap-3 p-3 rounded-xl border border-border">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          action.status === "completed" ? "bg-green-500" :
                          action.status === "failed" ? "bg-destructive" :
                          action.status === "pending" ? "bg-yellow-500" :
                          "bg-blue-500"
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{action.action_type}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              action.status === "completed" ? "bg-green-500/10 text-green-500" :
                              action.status === "failed" ? "bg-destructive/10 text-destructive" :
                              action.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                              "bg-blue-500/10 text-blue-500"
                            }`}>
                              {action.status}
                            </span>
                          </div>
                          {action.error_message && (
                            <p className="text-xs text-destructive mt-1">{action.error_message}</p>
                          )}
                          {action.requires_approval && action.approved_by_user === null && action.status === "pending" && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleApproveAction(action.id, true)}
                                className="px-3 py-1 bg-green-500/10 text-green-600 rounded text-xs font-medium hover:bg-green-500/20"
                              >
                                Approuver
                              </button>
                              <button
                                onClick={() => handleApproveAction(action.id, false)}
                                className="px-3 py-1 bg-destructive/10 text-destructive rounded text-xs font-medium hover:bg-destructive/20"
                              >
                                Rejeter
                              </button>
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {new Date(action.created_at).toLocaleTimeString("fr-FR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Output Files */}
              <div className="bg-card rounded-2xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4">Fichiers exportés</h2>
                {!currentProject?.outputs?.length ? (
                  <div className="text-center py-8">
                    <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Aucun fichier exporté</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentProject.outputs.map((output, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                        <Download className="w-4 h-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{output.filename}</p>
                          <p className="text-xs text-muted-foreground">{output.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Chat + Bridge (1/3) */}
        <div className="space-y-6">
          {/* Chat with Assistant */}
          <div className="bg-card rounded-2xl border border-border p-4 flex flex-col" style={{ height: "500px" }}>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Discussion avec l&apos;assistant
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 mb-3">
              {chatHistory.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">
                  Posez des questions sur votre projet ou demandez des modifications.
                </p>
              )}
              {chatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground ml-8"
                      : "bg-muted mr-8"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {chatLoading && (
                <div className="bg-muted p-3 rounded-xl mr-8">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary outline-none"
                placeholder="Ex: Change le toit en zinc..."
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatMessage.trim()}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Bridge Devices */}
          <div className="bg-card rounded-2xl border border-border p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Desktop Bridge
            </h3>
            {devices.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-3">Aucun appareil connecté</p>
                <button
                  onClick={() => setShowBridgeSetup(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90"
                >
                  Connecter mon PC
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {devices.map((device) => (
                  <div key={device.id} className="flex items-center gap-2 p-2 rounded-lg border border-border">
                    <div className={`w-2 h-2 rounded-full ${
                      device.status === "connected" ? "bg-green-500" :
                      device.status === "pending" ? "bg-yellow-500" :
                      "bg-muted-foreground"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{device.device_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {device.device_os} · Blender {device.blender_version || "?"}
                      </p>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      device.status === "connected" ? "bg-green-500/10 text-green-500" :
                      device.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {device.status === "connected" ? "En ligne" :
                       device.status === "pending" ? "En attente" : "Hors ligne"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bridge Setup Modal */}
      {showBridgeSetup && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setShowBridgeSetup(false); setBridgeToken(null); } }}
        >
          <div className="bg-card rounded-2xl border border-border p-8 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-2">Connecter votre PC (Blender Bridge)</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Le Desktop Bridge connecte votre Blender local au cloud EMEFA via WebSocket chiffré.
            </p>

            {!bridgeToken ? (
              <form onSubmit={handleRegisterBridge} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nom de l&apos;appareil</label>
                  <input
                    type="text"
                    value={bridgeForm.device_name}
                    onChange={(e) => setBridgeForm({ ...bridgeForm, device_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Mon PC Bureau"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Système d&apos;exploitation</label>
                  <select
                    value={bridgeForm.device_os}
                    onChange={(e) => setBridgeForm({ ...bridgeForm, device_os: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background"
                  >
                    <option value="windows">Windows</option>
                    <option value="linux">Linux</option>
                    <option value="macos">macOS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Chemin Blender (optionnel)</label>
                  <input
                    type="text"
                    value={bridgeForm.blender_path}
                    onChange={(e) => setBridgeForm({ ...bridgeForm, blender_path: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-input bg-background focus:ring-2 focus:ring-primary outline-none"
                    placeholder="C:\Program Files\Blender Foundation\Blender 4.0\blender.exe"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBridgeSetup(false)}
                    className="flex-1 py-3 rounded-lg border border-border hover:bg-secondary transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={registering}
                    className="flex-1 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {registering ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <p className="text-sm font-medium text-green-600 mb-2">Appareil enregistré !</p>
                  <p className="text-xs text-muted-foreground">
                    Lancez le Desktop Bridge sur votre PC avec la commande ci-dessous :
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-muted font-mono text-xs overflow-x-auto">
                  <p className="text-muted-foreground mb-1"># 1. Installez les dépendances</p>
                  <p>pip install websockets httpx</p>
                  <br />
                  <p className="text-muted-foreground mb-1"># 2. Lancez le bridge</p>
                  <p>python emefa_bridge.py \</p>
                  <p className="pl-4">--server ws://localhost:8000 \</p>
                  <p className="pl-4">--device-id {bridgeToken.device_id} \</p>
                  <p className="pl-4">--token {bridgeToken.device_token}</p>
                </div>

                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-600">
                    Conservez le token en lieu sûr. Il ne sera plus affiché.
                  </p>
                </div>

                <button
                  onClick={() => { setShowBridgeSetup(false); setBridgeToken(null); }}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
