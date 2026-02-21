"use client";

import { useCallback, useEffect, useState } from "react";
import { authApi } from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  avatar_url?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  workspaceId: string | null;
  loading: boolean;
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
        .then((user) => {
          setState({ user: user as User, token, workspaceId, loading: false });
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
    setState({ user, token: tokens.access_token, workspaceId: null, loading: false });
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
      setState({ user, token: tokens.access_token, workspaceId: null, loading: false });
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
