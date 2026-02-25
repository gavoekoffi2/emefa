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

async function fetchUserProfile(token: string, savedWsId: string | null): Promise<Omit<AuthState, "loading">> {
  const user = (await authApi.me(token)) as User;
  const wsId = extractWorkspaceId(user, savedWsId);
  return { user, token, workspaceId: wsId };
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
      fetchUserProfile(token, workspaceId)
        .then((profile) => {
          setState({ ...profile, loading: false });
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

    const profile = await fetchUserProfile(tokens.access_token, null);
    setState({ ...profile, loading: false });
    return profile.user;
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

      // Fetch user profile — if this fails, still store the token
      // so the dashboard can retry on mount
      try {
        const profile = await fetchUserProfile(tokens.access_token, null);
        setState({ ...profile, loading: false });
        return profile.user;
      } catch {
        // Token is already in localStorage, dashboard will fetch profile on mount
        setState((s) => ({ ...s, token: tokens.access_token, loading: false }));
        return null;
      }
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
