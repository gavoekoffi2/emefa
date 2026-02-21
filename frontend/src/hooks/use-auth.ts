"use client";

import { useCallback, useEffect, useState } from "react";
import { authApi } from "@/lib/api";

interface WorkspaceInfo {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  avatar_url?: string;
  workspaces?: WorkspaceInfo[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  workspaceId: string | null;
  loading: boolean;
}

function extractWorkspaceId(user: User, savedId: string | null): string | null {
  // If saved workspace is valid for this user, use it
  if (savedId && user.workspaces?.some((w) => w.id === savedId)) {
    return savedId;
  }
  // Otherwise use first workspace
  const first = user.workspaces?.[0];
  if (first) {
    localStorage.setItem("emefa_workspace_id", first.id);
    return first.id;
  }
  return null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    workspaceId: null,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("emefa_token");
    const workspaceId = localStorage.getItem("emefa_workspace_id");
    if (token) {
      authApi
        .me(token)
        .then((data) => {
          const user = data as User;
          const wsId = extractWorkspaceId(user, workspaceId);
          setState({ user, token, workspaceId: wsId, loading: false });
        })
        .catch(() => {
          localStorage.removeItem("emefa_token");
          setState({ user: null, token: null, workspaceId: null, loading: false });
        });
    } else {
      setState((s) => ({ ...s, loading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = (await authApi.login({ email, password })) as {
      access_token: string;
      refresh_token: string;
    };
    localStorage.setItem("emefa_token", tokens.access_token);
    localStorage.setItem("emefa_refresh", tokens.refresh_token);

    const user = (await authApi.me(tokens.access_token)) as User;
    const wsId = extractWorkspaceId(user, null);
    setState({ user, token: tokens.access_token, workspaceId: wsId, loading: false });
    return user;
  }, []);

  const register = useCallback(
    async (email: string, password: string, full_name: string, workspace_name?: string) => {
      const tokens = (await authApi.register({
        email,
        password,
        full_name,
        workspace_name,
      })) as { access_token: string; refresh_token: string };
      localStorage.setItem("emefa_token", tokens.access_token);
      localStorage.setItem("emefa_refresh", tokens.refresh_token);

      const user = (await authApi.me(tokens.access_token)) as User;
      const wsId = extractWorkspaceId(user, null);
      setState({ user, token: tokens.access_token, workspaceId: wsId, loading: false });
      return user;
    },
    []
  );

  const logout = useCallback(() => {
    localStorage.removeItem("emefa_token");
    localStorage.removeItem("emefa_refresh");
    localStorage.removeItem("emefa_workspace_id");
    setState({ user: null, token: null, workspaceId: null, loading: false });
  }, []);

  const setWorkspace = useCallback((id: string) => {
    localStorage.setItem("emefa_workspace_id", id);
    setState((s) => ({ ...s, workspaceId: id }));
  }, []);

  return { ...state, login, register, logout, setWorkspace };
}
