import { createContext, useEffect, useState } from "react";
import * as api from "../api/auth";
import { setLogoutCallback } from "../lib/authEvents";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const me = await api.getCurrentUser(token);
        setUser(me);
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (credentials) => {
    const data = await api.loginUser(credentials);
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);

    const me = await api.getCurrentUser(data.access_token);
    setUser(me);
  };

  const signup = async (payload) => {
    return api.signupUser(payload);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setToken(null);
  };

  useEffect(() => {
    setLogoutCallback(logout);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
