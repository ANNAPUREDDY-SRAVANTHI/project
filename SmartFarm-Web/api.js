// ============================================================
//  SmartFarm Web — API Layer
//  Mirrors: ApiService.kt + RetrofitClient.kt
// ============================================================
const API = (() => {
  const BASE_URL = "http://127.0.0.1:8000/";

  function getToken() { return localStorage.getItem("sf_token") || ""; }
  function saveToken(t) { localStorage.setItem("sf_token", t); }
  function clearToken() { localStorage.removeItem("sf_token"); localStorage.removeItem("sf_user"); localStorage.removeItem("sf_role"); }
  function saveUser(user, role) { localStorage.setItem("sf_user", user); localStorage.setItem("sf_role", role); }
  function getUser() { return localStorage.getItem("sf_user") || ""; }
  function getRole() { return localStorage.getItem("sf_role") || "Admin"; }
  function isLoggedIn() { return !!getToken(); }

  async function http(method, path, body = null) {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers["Authorization"] = "Token " + token;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(BASE_URL + path, opts);
    return res;
  }

  async function login(username, password) {
    const res = await http("POST", "api-token-auth/", { username, password });
    if (res.ok) { const data = await res.json(); saveToken(data.token); return { ok: true, data: data }; }
    return { ok: false };
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
  async function submitAttendance(rec) { const r = await http("POST","api/attendance/",rec); return r.ok; }

  async function getAllPayments() { try { const r = await http("GET","api/payments/"); return r.ok ? await r.json() : []; } catch { return []; } }
  async function addPayment(rec) { const r = await http("POST","api/payments/",rec); return r.ok; }

  async function getTasks() { try { const r = await http("GET","api/tasks/"); return r.ok ? await r.json() : []; } catch { return []; } }
  async function addTask(rec) { const r = await http("POST","api/tasks/",rec); return r.ok; }
  async function updateTask(id, data) { const r = await http("PATCH",`api/tasks/${id}/`,data); return r.ok; }

  async function getNotifications() { try { const r = await http("GET","api/notifications/"); return r.ok ? await r.json() : []; } catch { return []; } }

  return { getToken, saveToken, clearToken, saveUser, getUser, getRole, isLoggedIn,
    login, register, forgotPassword, getWorkers, addWorker, updateWorker, deleteWorker,
    getAllAttendance, submitAttendance, getAllPayments, addPayment, getTasks, addTask, updateTask, getNotifications };
})();

