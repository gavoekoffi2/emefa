const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
  workspaceId?: string;
}

export async function api<T = unknown>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, workspaceId, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (workspaceId) {
    headers["X-Workspace-ID"] = workspaceId;
  }

  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || "API Error");
  }

  return res.json();
}

// Auth
export const authApi = {
  register: (data: { email: string; password: string; full_name: string; workspace_name?: string }) =>
    api("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    api("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  refresh: (refresh_token: string) =>
    api("/auth/refresh", { method: "POST", body: JSON.stringify({ refresh_token }) }),

  me: (token: string) => api("/auth/me", { token }),
};

// Assistants
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

// Chat
export const chatApi = {
  send: (token: string, workspaceId: string, assistantId: string, data: { message: string; conversation_id?: string }) =>
    api(`/assistants/${assistantId}/chat`, { method: "POST", token, workspaceId, body: JSON.stringify(data) }),

  conversations: (token: string, workspaceId: string, assistantId: string) =>
    api(`/assistants/${assistantId}/chat/conversations`, { token, workspaceId }),

  messages: (token: string, workspaceId: string, assistantId: string, conversationId: string) =>
    api(`/assistants/${assistantId}/chat/conversations/${conversationId}/messages`, { token, workspaceId }),
};

// Knowledge Base
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
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },

  addUrl: (token: string, workspaceId: string, assistantId: string, data: { name: string; url: string }) =>
    api(`/assistants/${assistantId}/knowledge/url`, { method: "POST", token, workspaceId, body: JSON.stringify(data) }),

  addText: (token: string, workspaceId: string, assistantId: string, data: { name: string; text: string }) =>
    api(`/assistants/${assistantId}/knowledge/text`, { method: "POST", token, workspaceId, body: JSON.stringify(data) }),

  delete: (token: string, workspaceId: string, assistantId: string, kbId: string) =>
    api(`/assistants/${assistantId}/knowledge/${kbId}`, { method: "DELETE", token, workspaceId }),
};

// LiveKit
export const livekitApi = {
  getToken: (token: string, workspaceId: string, assistantId: string) =>
    api("/livekit/token", { method: "POST", token, workspaceId, body: JSON.stringify({ assistant_id: assistantId }) }),
};

// Admin
export const adminApi = {
  stats: (token: string, workspaceId: string) =>
    api("/admin/stats", { token, workspaceId }),

  auditLogs: (token: string, workspaceId: string, limit = 50) =>
    api(`/admin/audit?limit=${limit}`, { token, workspaceId }),
};
