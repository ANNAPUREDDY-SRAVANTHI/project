// ============================================================
//  SmartFarm Web — API Layer
//  Mirrors: ApiService.kt + RetrofitClient.kt
// ============================================================
const API = (() => {
  const BASE_URL = (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost')
    ? (window.location.protocol + "//" + window.location.hostname + ":8000/")
    : "http://127.0.0.1:8000/";

  function getToken() { return localStorage.getItem("sf_token") || ""; }
  function saveToken(t) { localStorage.setItem("sf_token", t); }
  function clearToken() { localStorage.removeItem("sf_token"); localStorage.removeItem("sf_user"); localStorage.removeItem("sf_role"); }
  function saveUser(user, role) { localStorage.setItem("sf_user", user); localStorage.setItem("sf_role", role); }
  function getUser() { return localStorage.getItem("sf_user") || ""; }
  function getRole() { return localStorage.getItem("sf_role") || "Admin"; }
  function isLoggedIn() { return !!getToken(); }

  async function login(username, password) {
    const headers = { "Content-Type": "application/json" };
    try {
      const res = await fetch(BASE_URL + "api-token-auth/", {
        method: "POST",
        headers,
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        saveToken(data.token);
        saveUser(username, "Admin");
        return { ok: true, data };
      }
    } catch (e) {
      console.warn("Login fetch error:", e);
    }
    return { ok: false };
  }

  async function http(method, path, body = null) {
    let token = getToken();
    // Auto-authenticate with admin if token is missing
    if (!token && path !== "api-token-auth/" && path !== "api/register/") {
      const auth = await login("admin", "admin123");
      if (auth.ok) token = getToken();
    }

    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = "Token " + token;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(BASE_URL + path, opts);
      if (res.status === 401 && path !== "api-token-auth/") {
        // Re-authenticate if token expired
        const auth = await login("admin", "admin123");
        if (auth.ok) {
          headers["Authorization"] = "Token " + getToken();
          res = await fetch(BASE_URL + path, opts);
        }
      }
    } catch (e) {
      console.warn("HTTP fetch error on " + path + ":", e);
      return { ok: false, status: 500, json: async () => [], text: async () => e.message };
    }
    return res;
  }
  async function register(data) { 
    try {
      const res = await http("POST", "api/register/", data); 
      if (res.ok) return { ok: true }; 
      const err = await res.text();
      return { ok: false, error: err };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
  async function forgotPassword(username, password) { await http("POST", "api/forgot-password/", { username, password }); }

  async function getWorkers() { try { const r = await http("GET","api/workers/"); return r.ok ? await r.json() : []; } catch { return []; } }
  async function addWorker(w) { const r = await http("POST","api/workers/",w); if(r.ok) return {ok: true}; const err = await r.text(); return {ok: false, error: err}; }
  async function updateWorker(id, w) { const r = await http("PUT",`api/workers/${id}/`,w); return r.ok; }
  async function deleteWorker(id) { const r = await http("DELETE",`api/workers/${id}/`); return r.ok; }

  async function getAllAttendance() { try { const r = await http("GET","api/attendance/"); return r.ok ? await r.json() : []; } catch { return []; } }
  async function submitAttendance(rec) {
    try {
      let existing = (window.STATE && Array.isArray(STATE.attendance))
        ? STATE.attendance.find(r => String(r.worker) === String(rec.worker) && r.date === rec.date)
        : null;
      if (existing && existing.id) {
        const r = await http("PUT", `api/attendance/${existing.id}/`, rec);
        if (r.ok) return true;
      }
      const r = await http("POST", "api/attendance/", rec);
      if (r.ok) return true;
      const fresh = await getAllAttendance();
      if (Array.isArray(fresh) && fresh.length > 0) {
        if (window.STATE) STATE.attendance = fresh;
        const match = fresh.find(r => String(r.worker) === String(rec.worker) && r.date === rec.date);
        if (match && match.id) {
          const r2 = await http("PUT", `api/attendance/${match.id}/`, rec);
          return r2.ok;
        }
      }
      return false;
    } catch { return false; }
  }

  async function getAllPayments() { try { const r = await http("GET","api/payments/"); return r.ok ? await r.json() : []; } catch { return []; } }
  async function addPayment(rec) { try { const r = await http("POST","api/payments/",rec); return r.ok; } catch { return false; } }

  async function getTasks() { try { const r = await http("GET","api/tasks/"); return r.ok ? await r.json() : []; } catch { return []; } }
  async function addTask(rec) { try { const r = await http("POST","api/tasks/",rec); return r.ok; } catch { return false; } }
  async function updateTask(id, data) { try { const r = await http("PATCH",`api/tasks/${id}/`,data); return r.ok; } catch { return false; } }

  async function getNotifications() { try { const r = await http("GET","api/notifications/"); return r.ok ? await r.json() : []; } catch { return []; } }

  return { getToken, saveToken, clearToken, saveUser, getUser, getRole, isLoggedIn,
    login, register, forgotPassword, getWorkers, addWorker, updateWorker, deleteWorker,
    getAllAttendance, submitAttendance, getAllPayments, addPayment, getTasks, addTask, updateTask, getNotifications };
})();

