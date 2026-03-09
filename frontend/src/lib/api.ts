const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
  workspaceId?: string;
  skipAuth?: boolean;
}

// ── Token refresh logic ──────────────────────────────────────────────
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = typeof window !== "undefined" ? localStorage.getItem("emefa_refresh") : null;
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("emefa_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("emefa_refresh", data.refresh_token);
      }
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

async function getRefreshedToken(): Promise<string | null> {
  // Deduplicate concurrent refresh calls
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function clearAuthTokens() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("emefa_token");
    localStorage.removeItem("emefa_refresh");
    localStorage.removeItem("emefa_workspace_id");
    window.dispatchEvent(new CustomEvent("emefa:logout"));
  }
}

// ── Core fetch ───────────────────────────────────────────────────────
export async function api<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, workspaceId, skipAuth, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only set Content-Type for non-FormData bodies
  if (!(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (workspaceId) {
    headers["X-Workspace-ID"] = workspaceId;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      ...fetchOptions,
      headers,
    });
  } catch {
    throw new Error(
      "Impossible de contacter le serveur. Vérifiez que le backend est démarré sur " + API_URL
    );
  }

  // Auto-refresh on 401
  if (res.status === 401 && !skipAuth && token) {
    const newToken = await getRefreshedToken();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      try {
        res = await fetch(`${API_URL}/api/v1${path}`, {
          ...fetchOptions,
          headers,
        });
      } catch {
        throw new Error(
          "Impossible de contacter le serveur. Vérifiez que le backend est démarré sur " + API_URL
        );
      }
    }

    // If still 401 after refresh, force logout
    if (res.status === 401) {
      clearAuthTokens();
      throw new Error("Session expirée. Veuillez vous reconnecter.");
    }
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Erreur serveur (${res.status})`);
  }

  // Handle empty responses (204 No Content)
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; full_name: string; workspace_name?: string }) =>
    api("/auth/register", { method: "POST", body: JSON.stringify(data), skipAuth: true }),

  login: (data: { email: string; password: string }) =>
    api("/auth/login", { method: "POST", body: JSON.stringify(data), skipAuth: true }),

  refresh: (refresh_token: string) =>
    api("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token }), skipAuth: true }),

  me: (token: string) => api("/auth/me", { token }),
};

// ── Assistants ───────────────────────────────────────────────────────
export const assistantApi = {
  list: (token: string, workspaceId: string) =>
    api("/assistants", { token, workspaceId }),

  get: (token: string, workspaceId: string, id: string) =>
    api(`/assistants/${id}`, { token, workspaceId }),

  create: (token: string, workspaceId: string, data: Record<string, unknown>) =>
    api("/assistants", { method: "POST", token, workspaceId, body: JSON.stringify(data) }),

  update: (token: string, workspaceId: string, id: string, data: Record<string, unknown>) =>
    api(`/assistants/${id}`, { method: "PATCH", token, workspaceId, body: JSON.stringify(data) }),

  delete: (token: string, workspaceId: string, id: string) =>
    api(`/assistants/${id}`, { method: "DELETE", token, workspaceId }),
};

// ── Chat ─────────────────────────────────────────────────────────────
export const chatApi = {
  send: (token: string, workspaceId: string, assistantId: string, data: { message: string; conversation_id?: string }) =>
    api(`/assistants/${assistantId}/chat`, { method: "POST", token, workspaceId, body: JSON.stringify(data) }),

  conversations: (token: string, workspaceId: string, assistantId: string) =>
    api(`/assistants/${assistantId}/chat/conversations`, { token, workspaceId }),

  messages: (token: string, workspaceId: string, assistantId: string, conversationId: string) =>
    api(`/assistants/${assistantId}/chat/conversations/${conversationId}/messages`, { token, workspaceId }),
};

// ── Knowledge Base ───────────────────────────────────────────────────
export const kbApi = {
  list: (token: string, workspaceId: string, assistantId: string) =>
    api(`/assistants/${assistantId}/knowledge`, { token, workspaceId }),

  uploadFile: async (token: string, workspaceId: string, assistantId: string, name: string, file: File) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("file", file);
    const res = await fetch(`${API_URL}/api/v1/assistants/${assistantId}/knowledge/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Workspace-ID": workspaceId,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Upload échoué" }));
      throw new Error(error.detail || "Upload échoué");
    }
    return res.json();
  },

  addUrl: (token: string, workspaceId: string, assistantId: string, data: { name: string; url: string }) =>
    api(`/assistants/${assistantId}/knowledge/url`, { method: "POST", token, workspaceId, body: JSON.stringify(data) }),

  addText: (token: string, workspaceId: string, assistantId: string, data: { name: string; text: string }) =>
    api(`/assistants/${assistantId}/knowledge/text`, { method: "POST", token, workspaceId, body: JSON.stringify(data) }),

  delete: (token: string, workspaceId: string, assistantId: string, kbId: string) =>
    api(`/assistants/${assistantId}/knowledge/${kbId}`, { method: "DELETE", token, workspaceId }),
};

// ── LiveKit ──────────────────────────────────────────────────────────
export const livekitApi = {
  getToken: (token: string, workspaceId: string, assistantId: string) =>
    api("/livekit/token", { method: "POST", token, workspaceId, body: JSON.stringify({ assistant_id: assistantId }) }),
};

// ── Admin ────────────────────────────────────────────────────────────
export const adminApi = {
  stats: (token: string, workspaceId: string) =>
    api("/admin/stats", { token, workspaceId }),

  auditLogs: (token: string, workspaceId: string, limit = 50) =>
    api(`/admin/audit?limit=${limit}`, { token, workspaceId }),
};

// ── User Profile ────────────────────────────────────────────────────
export const profileApi = {
  update: (token: string, data: { full_name?: string; avatar_url?: string }) =>
    api("/auth/me", { method: "PATCH", token, body: JSON.stringify(data) }),

  changePassword: (token: string, data: { current_password: string; new_password: string }) =>
    api("/auth/me/change-password", { method: "POST", token, body: JSON.stringify(data) }),
};

// ── Templates ───────────────────────────────────────────────────────
export const templateApi = {
  list: (token: string, workspaceId: string, category?: string) =>
    api(`/templates${category ? `?category=${category}` : ""}`, { token, workspaceId }),

  get: (token: string, workspaceId: string, id: string) =>
    api(`/templates/${id}`, { token, workspaceId }),

  exportJson: (token: string, workspaceId: string, id: string) =>
    api(`/templates/${id}/export`, { token, workspaceId }),

  createAssistant: (token: string, workspaceId: string, templateId: string, data: Record<string, unknown>) =>
    api(`/templates/${templateId}/create-assistant`, { method: "POST", token, workspaceId, body: JSON.stringify(data) }),
};

// ── Bridge ──────────────────────────────────────────────────────────
export const bridgeApi = {
  registerDevice: (token: string, workspaceId: string, data: Record<string, unknown>) =>
    api("/bridge/devices", { method: "POST", token, workspaceId, body: JSON.stringify(data) }),

  listDevices: (token: string, workspaceId: string, assistantId?: string) =>
    api(`/bridge/devices${assistantId ? `?assistant_id=${assistantId}` : ""}`, { token, workspaceId }),

  getDevice: (token: string, workspaceId: string, deviceId: string) =>
    api(`/bridge/devices/${deviceId}`, { token, workspaceId }),

  deviceStatus: (token: string, workspaceId: string, deviceId: string) =>
    api(`/bridge/devices/${deviceId}/status`, { token, workspaceId }),

  updatePermissions: (token: string, workspaceId: string, deviceId: string, permissions: Record<string, boolean>) =>
    api(`/bridge/devices/${deviceId}/permissions`, { method: "PATCH", token, workspaceId, body: JSON.stringify({ permissions }) }),

  revokeDevice: (token: string, workspaceId: string, deviceId: string) =>
    api(`/bridge/devices/${deviceId}`, { method: "DELETE", token, workspaceId }),

  listCommands: (token: string, workspaceId: string) =>
    api("/bridge/commands", { token, workspaceId }),

  createAction: (token: string, workspaceId: string, data: Record<string, unknown>) =>
    api("/bridge/actions", { method: "POST", token, workspaceId, body: JSON.stringify(data) }),

  approveAction: (token: string, workspaceId: string, actionId: string, approved: boolean) =>
    api(`/bridge/actions/${actionId}/approve`, { method: "POST", token, workspaceId, body: JSON.stringify({ approved }) }),

  listActions: (token: string, workspaceId: string, params?: Record<string, string>) => {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return api(`/bridge/actions${query}`, { token, workspaceId });
  },
};

// ── Architect Projects ──────────────────────────────────────────────
export const architectApi = {
  createProject: (token: string, workspaceId: string, data: Record<string, unknown>) =>
    api("/architect/projects", { method: "POST", token, workspaceId, body: JSON.stringify(data) }),

  listProjects: (token: string, workspaceId: string, assistantId?: string) =>
    api(`/architect/projects${assistantId ? `?assistant_id=${assistantId}` : ""}`, { token, workspaceId }),

  getProject: (token: string, workspaceId: string, projectId: string) =>
    api(`/architect/projects/${projectId}`, { token, workspaceId }),

  updateProject: (token: string, workspaceId: string, projectId: string, data: Record<string, unknown>) =>
    api(`/architect/projects/${projectId}`, { method: "PATCH", token, workspaceId, body: JSON.stringify(data) }),

  addReference: async (token: string, workspaceId: string, projectId: string, name: string, refType: string, file: File) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("ref_type", refType);
    formData.append("file", file);
    const res = await fetch(`${API_URL}/api/v1/architect/projects/${projectId}/references`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Workspace-ID": workspaceId,
      },
      body: formData,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: "Upload échoué" }));
      throw new Error(error.detail || "Upload échoué");
    }
    return res.json();
  },

  generatePlan: (token: string, workspaceId: string, projectId: string) =>
    api(`/architect/projects/${projectId}/generate-plan`, { method: "POST", token, workspaceId }),

  listVersions: (token: string, workspaceId: string, projectId: string) =>
    api(`/architect/projects/${projectId}/versions`, { token, workspaceId }),

  createVersion: (token: string, workspaceId: string, projectId: string, data?: Record<string, unknown>) =>
    api(`/architect/projects/${projectId}/versions`, { method: "POST", token, workspaceId, body: data ? JSON.stringify(data) : undefined }),
};

// ── Workspace ───────────────────────────────────────────────────────
export const workspaceApi = {
  get: (token: string, workspaceId: string) =>
    api("/workspace", { token, workspaceId }),

  update: (token: string, workspaceId: string, data: { name?: string }) =>
    api("/workspace", { method: "PATCH", token, workspaceId, body: JSON.stringify(data) }),

  listMembers: (token: string, workspaceId: string) =>
    api("/workspace/members", { token, workspaceId }),

  inviteMember: (token: string, workspaceId: string, data: { email: string; role?: string }) =>
    api("/workspace/members", { method: "POST", token, workspaceId, body: JSON.stringify(data) }),

  updateMemberRole: (token: string, workspaceId: string, memberId: string, data: { role: string }) =>
    api(`/workspace/members/${memberId}`, { method: "PATCH", token, workspaceId, body: JSON.stringify(data) }),

  removeMember: (token: string, workspaceId: string, memberId: string) =>
    api(`/workspace/members/${memberId}`, { method: "DELETE", token, workspaceId }),
};
