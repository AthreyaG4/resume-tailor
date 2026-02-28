import { createContext, useEffect, useState } from "react";
import * as api from "../api/resume";
import { useAuth } from "../hooks/useAuth";

export const ResumeContext = createContext(null);

export function ResumeProvider({ children }) {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { token } = useAuth();

  async function fetchResume() {
    try {
      const response = await api.getResume(token);
      setResume(response);
    } catch (err) {
      if (err.status !== 404) setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    fetchResume();
  }, [token]);

  useEffect(() => {
    if (!resume || resume.status !== "parsing") return;

    const pollResume = async () => {
      const res = await api.getResume(token);
      setResume(res);
    };

    pollResume();
    const interval = setInterval(pollResume, 1000);

    return () => clearInterval(interval);
  }, [resume?.status, token]);

  async function parseResume(resumeFile) {
    try {
      await api.parseResume(token, resumeFile);
      await fetchResume();
    } catch (err) {
      setError(err);
      throw err;
    }
  }

  async function saveResume(data) {
    try {
      const response = await api.saveResume(token, data);
      setResume(response);
    } catch (err) {
      setError(err);
      throw err;
    }
  }

  async function deleteResume() {
    try {
      await api.deleteResume(token);
      setResume(null);
      setError(null);
    } catch (err) {
      setError(err);
      throw err;
    }
  }

  return (
    <ResumeContext.Provider
      value={{
        resume,
        loading,
        error,
        parseResume,
        saveResume,
        deleteResume,
        fetchResume,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}
