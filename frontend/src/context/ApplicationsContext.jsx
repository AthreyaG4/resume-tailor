import { createContext, useEffect, useState } from "react";
import * as api from "../api/applications";
import { useAuth } from "../hooks/useAuth";

export const ApplicationsContext = createContext(null);

export function ApplicationsProvider({ children }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { token } = useAuth();

  async function fetchApplications() {
    try {
      setLoading(true);
      const response = await api.getApplications(token);
      setApplications(response);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) return;
    fetchApplications();
  }, [token]);

  async function createApplication(job_id) {
    try {
      const response = await api.createApplication(token, job_id);
      await fetchApplications();
      return response.application_id;
    } catch (err) {
      setError(err);
    }
  }

  async function sendApplicationFeedback(feedback, application_id) {
    try {
      await api.sendApplicationFeedback(token, feedback, application_id);
    } catch (err) {
      setError(err);
    }
  }

  async function updateApplicationStatus(application_id, status) {
    try {
      await api.updateApplicationStatus(token, application_id, status);
      setApplications((prev) =>
        prev.map((app) =>
          app.id === application_id ? { ...app, status } : app,
        ),
      );
    } catch (err) {
      setError(err);
    }
  }

  async function deleteApplication(application_id) {
    try {
      await api.deleteApplication(token, application_id);
      setApplications((prev) =>
        prev.filter((app) => app.id !== application_id),
      );
    } catch (err) {
      setError(err);
    }
  }

  return (
    <ApplicationsContext.Provider
      value={{
        applications,
        loading,
        error,
        fetchApplications,
        createApplication,
        sendApplicationFeedback,
        updateApplicationStatus,
        deleteApplication,
      }}
    >
      {children}
    </ApplicationsContext.Provider>
  );
}
