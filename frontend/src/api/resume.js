import fetchAPI from "./fetchInstance";

export async function getResume(token) {
  const response = await fetchAPI("/resume", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function parseResume(token, resume) {
  const formData = new FormData();
  formData.append("resume", resume);
  const response = await fetchAPI("/resume/parse", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    isFormData: true,
  });
  return response.json();
}

export async function getStatus(token, resumeId) {
  const response = await fetchAPI(`/resume/parse-status/${resumeId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function saveResume(token, updated_resume) {
  const response = await fetchAPI("/resume/save", {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(updated_resume),
  });
  return response.json();
}

export async function deleteResume(token) {
  await fetchAPI("/resume", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
