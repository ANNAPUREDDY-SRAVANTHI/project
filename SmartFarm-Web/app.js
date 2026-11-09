// ============================================================
//  SmartFarm Web — App Core (Router + State Store)
//  Mirrors: WorkerViewModel.kt + AppNavigation.kt
// ============================================================

// ── SVG Icon helpers ──────────────────────────────────────────
const ICONS = {
  farm: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3L2 12h3v8h6v-5h2v5h6v-8h3L12 3z"/></svg>`,
  people: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
  schedule: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/></svg>`,
  assignment: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>`,
  qr: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13 3h-2v-2h2v2zm0-4h-2v-2h2v2zm2 4h-2v-2h2v2zm0-4h-2v-2h2v2zm-4-2h-2v2h2v-2zm0 4h-2v2h2v-2z"/></svg>`,
  payments: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>`,
  bar_chart: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z"/></svg>`,
  back: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>`,
  add: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>`,
  notif: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>`,
  notif_off: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 18.69L7.84 6.14 5.27 3.49 4 4.76l2.8 2.8v.01c-.52.99-.8 2.16-.8 3.42V16l-2 2v1h13.73l2 2L21 19.72l-1-1.03zM12 22c1.11 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-7.32V11c0-3.08-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.15.03-.29.08-.43.13L18 12.68z"/></svg>`,
  fact_check: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/><path d="M11.41 9.17L9.5 7.26 8.09 8.67l3.32 3.32 5.5-5.5-1.42-1.41z"/></svg>`,
  person: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>`,
  home: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
  work: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.35A3.65 3.65 0 0 0 14.35 1a3.65 3.65 0 0 0-3.65 3.65c0 .47.11.91.18 1.35H9V4H7v2H4C2.9 6 2 6.9 2 8v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7.65-3c.91 0 1.65.74 1.65 1.65 0 .54-.27 1-.67 1.29V6h-2V5.94a1.65 1.65 0 0 1-.63-1.29c0-.91.74-1.65 1.65-1.65z"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>`,
  share: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>`,
  delete: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`,
  eye_off: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`,
  trending: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>`,
  sparkle: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/></svg>`,
  psychology: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12c0 2.85 1.2 5.42 3.12 7.24L4 21h4v-1.12C8.63 19.95 9.3 20 10 20h2v2h2v-2h1c2.76 0 5-2.24 5-5 0-1.85-.99-3.46-2.47-4.34C17.82 9.77 18 8.91 18 8c0-3.31-2.69-6-6-6zm0 2c2.21 0 4 1.79 4 4 0 .73-.2 1.41-.55 2H13v2h2.5c1.38 0 2.5 1.12 2.5 2.5S16.88 17 15.5 17H12v-2h-2v2H8.5c-.83 0-1.54-.42-1.94-1.06L8 14h2v-2H6.27C6.09 11.39 6 10.71 6 10c0-3.31 2.69-6 6-6z"/></svg>`,
};

// ── State Store (mirrors WorkerViewModel) ─────────────────────
const STATE = {
  workers: [],
  attendance: [],
  payments: [],
  tasks: [],
  notifications: [],
  currentUser: '',
  currentRole: 'Admin',
  pollInterval: null,

  // Derived
  todayAttendance() {
    const today = new Date().toISOString().split('T')[0];
    const map = {};
    this.attendance.filter(r => r.date === today).forEach(r => { map[r.worker] = r.status; });
    return map;
  },
  getPresentDaysCount(id) { return this.attendance.filter(r => String(r.worker) === String(id) && r.status === 'Present').length; },
  getTotalEarned(id) {
    const w = this.workers.find(w => String(w.id) === String(id));
    return (w ? parseFloat(w.daily_wage || 0) : 0) * this.getPresentDaysCount(id);
  },
  getTotalPaid(id) { return this.payments.filter(p => String(p.worker) === String(id)).reduce((s, p) => s + parseFloat(p.amount || 0), 0); },
  getBalanceDue(id) { return this.getTotalEarned(id) - this.getTotalPaid(id); },
  getWorkerById(id) { return this.workers.find(w => String(w.id) === String(id)); },
};

// ── Refresh All Data ──────────────────────────────────────────
async function refreshAll() {
  try {
    const [workers, attendance, payments, tasks, notifications] = await Promise.all([
      API.getWorkers(), API.getAllAttendance(),
      API.getAllPayments(), API.getTasks(), API.getNotifications()
    ]);
    if (Array.isArray(workers) && workers.length > 0) STATE.workers = workers;
    if (Array.isArray(attendance)) STATE.attendance = attendance;
    if (Array.isArray(payments) && (payments.length > 0 || STATE.payments.length === 0)) STATE.payments = payments;
    if (Array.isArray(tasks) && (tasks.length > 0 || STATE.tasks.length === 0)) STATE.tasks = tasks;
    if (Array.isArray(notifications)) STATE.notifications = notifications;
  } catch (err) {
    console.warn('refreshAll network issue, keeping in-memory state:', err);
  }
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

// ── Modal ─────────────────────────────────────────────────────
function showModal(title, bodyHTML, onConfirm, confirmText = 'Confirm', confirmClass = 'btn-primary') {
  document.querySelectorAll('.modal-overlay').forEach(m => m.remove());
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-title">${title}</div>
      <div class="modal-body">${bodyHTML}</div>
      <div class="modal-actions">
        <button class="btn btn-outline" id="modalCancel">Cancel</button>
        <button class="btn ${confirmClass}" id="modalConfirm" style="flex:1">${confirmText}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.querySelector('#modalCancel').onclick = () => overlay.remove();
  overlay.querySelector('#modalConfirm').onclick = () => { onConfirm(overlay); };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  return overlay;
}

// ── Router ─────────────────────────────────────────────────────
const ROUTES = {};
function route(path, fn) { ROUTES[path] = fn; }
function navigate(path) {
  const current = window.location.hash.replace('#', '');
  const target = path.replace('#', '');
  if (current === target) {
    renderRoute();
  } else {
    window.location.hash = target;
  }
}
function getRoute() { return window.location.hash.replace('#', '') || '/splash'; }

async function renderRoute() {
  const hash = getRoute();
  const parts = hash.split('/').filter(Boolean);
  const base = '/' + parts[0];
  const param = parts[1] || null;
  const handler = ROUTES[base] || ROUTES['/login'];
  const app = document.getElementById('app');
  app.innerHTML = '';
  const screen = document.createElement('div');
  screen.className = 'screen';
  app.appendChild(screen);
  await handler(screen, param);

  // Multilingual Voice Assistant floating trigger accessible across all screens
  const va = window.VoiceAssistant || (typeof VoiceAssistant !== 'undefined' ? VoiceAssistant : null);
  if (va && base !== '/splash') {
    va.renderFloatingButton();
  } else if (base === '/splash') {
    const existing = document.getElementById('vaFloatingBtn');
    if (existing) existing.remove();
  }
}

window.addEventListener('hashchange', renderRoute);

// ── Avatar Helper ─────────────────────────────────────────────
function avatarLetter(name) { return (name || '?').charAt(0).toUpperCase(); }

// ── Date helpers ──────────────────────────────────────────────
function todayISO() { return new Date().toISOString().split('T')[0]; }
function todayDisplay() {
  return new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}
