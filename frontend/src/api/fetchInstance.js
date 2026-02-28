import { handleUnauthorized } from "../lib/authEvents";

export const API_BASE_URL = "http://localhost:5000/api";

async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const { headers, ...restOptions } = options;

  const defaultOptions = {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };

  try {
    const response = await fetch(url, defaultOptions);

    if (response.status === 401) {
      handleUnauthorized();
      throw new Error("Unauthorized");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw error;
    }

    return response;
  } catch (error) {
    throw error;
  }
}

export default fetchAPI;
