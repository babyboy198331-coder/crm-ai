const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorBody;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { error: res.statusText };
    }
    throw new Error(
      typeof errorBody.error === "string" ? errorBody.error : JSON.stringify(errorBody.error)
    );
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  signup: (data) => request("/api/auth/signup", { method: "POST", body: data, auth: false }),
  login: (data) => request("/api/auth/login", { method: "POST", body: data, auth: false }),

  listCustomers: () => request("/api/customers"),
  getCustomer: (id) => request(`/api/customers/${id}`),
  createCustomer: (data) => request("/api/customers", { method: "POST", body: data }),
  updateCustomer: (id, data) => request(`/api/customers/${id}`, { method: "PUT", body: data }),
  deleteCustomer: (id) => request(`/api/customers/${id}`, { method: "DELETE" }),

  uploadFile: async (customerId, file) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/api/files/${customerId}`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    return res.json();
  },
  listFiles: (customerId) => request(`/api/files/${customerId}`),
  downloadFileUrl: (id) => `${API_URL}/api/files/download/${id}`,

  generateMeetingSummary: (data) => request("/api/ai/meeting-summary", { method: "POST", body: data }),
  generateFollowUpEmail: (data) => request("/api/ai/follow-up-email", { method: "POST", body: data }),
  chat: (data) => request("/api/ai/chat", { method: "POST", body: data }),
  chatHistory: (customerId) => request(`/api/ai/chat/${customerId}`),

  analyticsOverview: () => request("/api/analytics/overview"),
};

export { API_URL, getToken };
