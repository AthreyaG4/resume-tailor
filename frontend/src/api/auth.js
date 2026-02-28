import fetchAPI from "./fetchInstance";

export async function loginUser({ email, password }) {
  const formData = new URLSearchParams();
  formData.append("username", email);
  formData.append("password", password);

  try {
    const response = await fetchAPI("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
      credentials: "include",
    });

    const data = await response.json();
    return data; // Access token
  } catch (err) {
    throw new Error(err.message || "Login failed");
  }
}

export async function signupUser(payload) {
  try {
    const response = await fetchAPI("/users/", {
      method: "POST",
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await response.json();
    return data;
  } catch (err) {
    throw err;
  }
}

export async function getCurrentUser(token) {
  try {
    const response = await fetchAPI("/users/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const data = await response.json();
    return data; // User details
  } catch (err) {
    throw new Error(err.message || "Failed to get user");
  }
}
