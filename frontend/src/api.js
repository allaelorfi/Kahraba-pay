const BASE = "/api";

async function request(path, options = {}) {
  const token = localStorage.getItem("kp_token");
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  let res;
  try {
    res = await fetch(BASE + path, { ...options, headers });
  } catch {
    throw new Error("تعذر الاتصال بالخادم. تأكد من تشغيل الخادم ثم حاول مرة أخرى.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "حدث خطأ غير متوقع.");
  }
  return data;
}

export const api = {
  login: (phone, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ phone, password }) }),
  signup: (name, phone, password) =>
    request("/auth/signup", { method: "POST", body: JSON.stringify({ name, phone, password }) }),

  linkAccount: (payload) =>
    request("/onboarding/link-account", { method: "POST", body: JSON.stringify(payload) }),
  saveNotificationPrefs: (prefs) =>
    request("/onboarding/notification-prefs", { method: "PUT", body: JSON.stringify(prefs) }),

  getUser: () => request("/user"),
  getAccounts: () => request("/accounts"),
  addAccount: (payload) => request("/accounts", { method: "POST", body: JSON.stringify(payload) }),

  getBalance: (accountId) => request(`/balance/${accountId}`),
  charge: (accountId, amount) =>
    request("/charge", { method: "POST", body: JSON.stringify({ accountId, amount }) }),

  getConsumption: (accountId) => request(`/consumption/${accountId}`),
  getTransactions: (accountId) => request(`/transactions/${accountId}`),

  getNotifications: () => request("/notifications"),
  saveNotificationSettings: (settings) =>
    request("/notifications/settings", { method: "PUT", body: JSON.stringify(settings) }),

  getInvoice: (accountId) => request(`/invoice/${accountId}`),
  payInvoice: (accountId) => request(`/invoice/${accountId}/pay`, { method: "POST" }),

  getFaq: () => request("/support/faq"),
  openTicket: (subject, message) =>
    request("/support/ticket", { method: "POST", body: JSON.stringify({ subject, message }) })
};
