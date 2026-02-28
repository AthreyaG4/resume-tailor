import fetchAPI from "./fetchInstance";

export async function getApplications(token) {
  const response = await fetchAPI("/applications", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
}

export async function getApplication(token, application_id) {
  const response = await fetchAPI(`/applications/${application_id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.json();
}

export async function createApplication(token, job_id) {
  const response = await fetchAPI("/applications", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      job_id,
    }),
  });

  return response.json();
}

export async function sendApplicationFeedback(token, feedback, application_id) {
  const response = await fetchAPI(`/applications/${application_id}/continue`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(feedback),
  });

  return response.json();
}

export async function updateApplicationStatus(token, application_id, status) {
  const response = await fetchAPI(`/applications/${application_id}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  return response.json();
}

export async function deleteApplication(token, application_id) {
  await fetchAPI(`/applications/${application_id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
