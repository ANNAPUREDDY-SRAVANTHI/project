// ============================================================
//  ATTENDANCE DASHBOARD
// ============================================================
route('/attendance-dashboard', async (el) => {
  await refreshAll();
  const todayMap = STATE.todayAttendance();
  const total = STATE.workers.length;
  const present = Object.values(todayMap).filter(v => v === 'Present').length;
  const absent = Object.values(todayMap).filter(v => v === 'Absent').length;
  el.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" onclick="navigate('/admin-dashboard')">${ICONS.back}</button>
      <span class="top-bar-title">Attendance</span>
    </div>
    <div class="content">
      <div class="section-title">Today: ${todayDisplay()}</div>
      <div class="card-row">
        <div class="stat-card green">
          <div class="stat-value">${present}</div>
          <div class="stat-label">Present Today</div>
        </div>
        <div class="stat-card" style="background:#fdeaea;flex:1">
          <div class="stat-value" style="color:var(--red)">${absent}</div>
          <div class="stat-label">Absent Today</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-value">${total - present - absent}</div>
          <div class="stat-label">Unmarked</div>
        </div>
      </div>
      <button class="action-card" onclick="navigate('/mark-attendance')">
        <div class="action-icon-wrap">${ICONS.fact_check}</div>
        <div class="action-text">
          <div class="action-title">Mark Attendance</div>
          <div class="action-desc">Record today's farm duty</div>
        </div>
        <div class="action-chevron">${ICONS.chevron}</div>
      </button>
      <button class="action-card" onclick="navigate('/attendance-history')">
        <div class="action-icon-wrap">${ICONS.calendar}</div>
        <div class="action-text">
          <div class="action-title">Attendance History</div>
          <div class="action-desc">View past records grouped by date</div>
        </div>
        <div class="action-chevron">${ICONS.chevron}</div>
      </button>
    </div>`;
});

// ============================================================
//  MARK ATTENDANCE SCREEN
// ============================================================
route('/mark-attendance', async (el) => {
  if (!STATE.workers.length) await refreshAll();
  const selection = {};
  renderMarkAttendance(el, selection);
});
function renderMarkAttendance(el, selection) {
  el.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" onclick="navigate('/attendance-dashboard')">${ICONS.back}</button>
      <span class="top-bar-title" style="color:var(--green-dark)">Mark Attendance</span>
    </div>
    <div class="content" style="padding-bottom:80px">
      <div class="fw-bold mb-8">Today's Farm Duty: ${todayDisplay()}</div>
      <div class="fs-sm text-gray mb-16">Select P for Present or A for Absent for each worker</div>
      ${STATE.workers.length === 0 ? `<div class="empty-state"><div class="empty-icon">👷</div><p>No workers registered.</p></div>` :
        STATE.workers.map(w => `
          <div class="card mb-16">
            <div style="display:flex;align-items:center;gap:12px">
              <div style="flex:1">
                <div class="fw-bold">${w.name}</div>
                <div class="fs-sm text-gray">Role: ${w.role}</div>
              </div>
              <div class="att-row">
                <button class="att-btn present ${selection[w.id] === 'Present' ? 'selected' : ''}"
                  id="p_${w.id}" onclick="selectAtt(${w.id},'Present')">P</button>
                <button class="att-btn absent ${selection[w.id] === 'Absent' ? 'selected' : ''}"
                  id="a_${w.id}" onclick="selectAtt(${w.id},'Absent')">A</button>
              </div>
            </div>
          </div>`).join('')}
      <button class="btn btn-primary" id="submitAttBtn" onclick="submitAtt()" ${Object.keys(selection).length === 0 ? 'disabled' : ''}>
        Submit Today's Attendance
      </button>
    </div>`;
  window.selectAtt = (id, status) => {
    selection[id] = status;
    el.querySelector(`#p_${id}`).classList.toggle('selected', status === 'Present');
    el.querySelector(`#a_${id}`).classList.toggle('selected', status === 'Absent');
    el.querySelector('#submitAttBtn').disabled = Object.keys(selection).length === 0;
  };
  window.submitAtt = async () => {
    const today = todayISO();
    const promises = Object.entries(selection).map(([wid, status]) =>
      API.submitAttendance({ worker: parseInt(wid), date: today, status }));
    await Promise.all(promises);
    await refreshAll(); showToast('Attendance Submitted! ✅'); navigate('/attendance-dashboard');
  };
}

// ============================================================
//  ATTENDANCE HISTORY SCREEN
// ============================================================
route('/attendance-history', async (el) => {
  if (!STATE.attendance.length) await refreshAll();
  renderAttHistory(el, '');
});
function renderAttHistory(el, q) {
  const filtered = STATE.attendance.filter(r => {
    const w = STATE.getWorkerById(r.worker);
    return (w?.name || '').toLowerCase().includes(q.toLowerCase());
  });
  const grouped = {};
  filtered.forEach(r => { if (!grouped[r.date]) grouped[r.date] = []; grouped[r.date].push(r); });
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  el.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" onclick="navigate('/attendance-dashboard')">${ICONS.back}</button>
      <span class="top-bar-title" style="color:var(--green-dark)">Attendance History</span>
    </div>
    <div class="content">
      <div class="search-input-wrap">
        <span class="search-icon">${ICONS.search}</span>
        <input class="form-input" id="attSearch" placeholder="Search by worker name..." value="${q}" autocomplete="off"/>
      </div>
      ${STATE.attendance.length === 0 ? `<div class="empty-state"><div class="empty-icon">📋</div><p>No attendance records found.</p></div>` :
        sortedDates.map(date => `
          <div class="date-header">${date}</div>
          ${grouped[date].map(r => {
            const w = STATE.getWorkerById(r.worker);
            const isPresent = r.status === 'Present';
            return `<div style="background:#fff;border-radius:16px;padding:16px;margin-bottom:10px;display:flex;align-items:center;gap:16px;box-shadow:var(--card-shadow)">
              <div class="avatar medium">${avatarLetter(w?.name)}</div>
              <div style="flex:1">
                <div class="fw-bold">${w?.name || 'Unknown'}</div>
                <div class="fs-sm text-gray">${w?.role || ''}</div>
              </div>
              <span class="chip ${isPresent ? 'chip-present' : 'chip-absent'}">${r.status}</span>
            </div>`;
          }).join('')}`).join('')}
    </div>`;
  const inp = el.querySelector('#attSearch');
  if(inp) inp.addEventListener('input', () => renderAttHistory(el, inp.value));
}
