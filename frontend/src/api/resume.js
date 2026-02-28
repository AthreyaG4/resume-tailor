import fetchAPI from "./fetchInstance";

export async function getResume(token) {
  try {
    const response = await fetchAPI("/resume", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (err) {
    throw err;
  }
}

export async function parseResume(token, resume) {
  try {
    const formData = new FormData();
    formData.append("resume", resume);

    const response = await fetchAPI("/resume/parse", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    return response.json();
  } catch (err) {
    throw err;
  }
}

export async function getStatus(token, taskId) {
  try {
    const response = await fetchAPI(`/resume/parse-status/${taskId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    return data;
  } catch (err) {
    throw err;
  }
}

export async function saveResume(token, updated_resume) {
  try {
    const response = await fetchAPI("/resume/save", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updated_resume),
    });
    const data = response.json();
    return data;
  } catch (err) {
    throw err;
  }
}

export async function deleteResume(token) {
  try {
    const response = await fetchAPI(`/resume`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response;
  } catch (err) {
    throw err;
  }
}
