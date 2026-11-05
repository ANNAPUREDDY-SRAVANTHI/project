// ============================================================
//  ADMIN DASHBOARD
// ============================================================
route('/admin-dashboard', async (el) => {
  if (!API.isLoggedIn()) { navigate('/login'); return; }
  STATE.currentUser = API.getUser(); STATE.currentRole = 'Admin';
  if (!STATE.workers.length) await refreshAll();
  renderAdminDashboard(el);
  // Auto-refresh every 15s
  if (STATE.pollInterval) clearInterval(STATE.pollInterval);
  STATE.pollInterval = setInterval(async () => {
    await refreshAll();
    renderAdminDashboard(el);
  }, 15000);
});

function renderAdminDashboard(el) {
  const todayMap = STATE.todayAttendance();
  const total = STATE.workers.length;
  const present = Object.values(todayMap).filter(v => v === 'Present').length;
  const pending = total - Object.keys(todayMap).length;
  el.innerHTML = `
    <div class="top-bar">
      <div class="top-bar-col">
        <span class="top-bar-title">Smart Farm Admin</span>
      </div>
      <button class="icon-btn danger" onclick="doLogout()" title="Logout">${ICONS.logout}</button>
    </div>
    <div class="content" style="padding-bottom:24px">
      <div class="section-title">Farm Overview</div>
      <div class="card-row">
        <div class="stat-card green">
          <div style="color:var(--green-primary)">${ICONS.people.replace('viewBox','style="width:28px;height:28px" viewBox')}</div>
          <div class="stat-value">${total}</div>
          <div class="stat-label">Workers</div>
        </div>
        <div class="stat-card blue">
          <div style="color:var(--blue)">${ICONS.check.replace('viewBox','style="width:28px;height:28px" viewBox')}</div>
          <div class="stat-value">${present}</div>
          <div class="stat-label">Present</div>
        </div>
        <div class="stat-card orange">
          <div style="color:var(--orange)">${ICONS.schedule.replace('viewBox','style="width:28px;height:28px" viewBox')}</div>
          <div class="stat-value">${pending}</div>
          <div class="stat-label">Pending</div>
        </div>
      </div>
      <div class="section-title">Management Actions</div>
      <button class="action-card" onclick="navigate('/worker-list')">
        <div class="action-icon-wrap">${ICONS.people}</div>
        <div class="action-text">
          <div class="action-title">Manage Workers</div>
          <div class="action-desc">Add, edit or remove labor</div>
        </div>
        <div class="action-chevron">${ICONS.chevron}</div>
      </button>
      <button class="action-card" onclick="navigate('/admin-tasks')">
        <div class="action-icon-wrap">${ICONS.assignment}</div>
        <div class="action-text">
          <div class="action-title">Task Assignment</div>
          <div class="action-desc">Assign daily work to labor</div>
        </div>
        <div class="action-chevron">${ICONS.chevron}</div>
      </button>
      <button class="action-card" onclick="navigate('/attendance-dashboard')">
        <div class="action-icon-wrap">${ICONS.qr}</div>
        <div class="action-text">
          <div class="action-title">Attendance</div>
          <div class="action-desc">Mark daily attendance</div>
        </div>
        <div class="action-chevron">${ICONS.chevron}</div>
      </button>
      <button class="action-card" onclick="navigate('/finance')">
        <div class="action-icon-wrap">${ICONS.payments}</div>
        <div class="action-text">
          <div class="action-title">Finance Summary</div>
          <div class="action-desc">Salary and wage reports</div>
        </div>
        <div class="action-chevron">${ICONS.chevron}</div>
      </button>
      <button class="action-card" onclick="navigate('/reports')">
        <div class="action-icon-wrap">${ICONS.bar_chart}</div>
        <div class="action-text">
          <div class="action-title">Reports</div>
          <div class="action-desc">Check farm analytics</div>
        </div>
        <div class="action-chevron">${ICONS.chevron}</div>
      </button>
    </div>`;
}

// ============================================================
//  WORKER LIST SCREEN
// ============================================================
route('/worker-list', async (el) => {
  if (!STATE.workers.length) await refreshAll();
  renderWorkerList(el, '');
});
function renderWorkerList(el, q) {
  const filtered = STATE.workers.filter(w =>
    w.name.toLowerCase().includes(q.toLowerCase()) || w.phone.includes(q));
  el.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" onclick="navigate('/admin-dashboard')">${ICONS.back}</button>
      <span class="top-bar-title">Worker Management</span>
    </div>
    <div class="content">
      <div class="search-input-wrap">
        <span class="search-icon">${ICONS.search}</span>
        <input class="form-input" id="workerSearch" placeholder="Search by name or phone..." value="${q}"
          oninput="renderWorkerList(el,'this.value')" autocomplete="off"/>
      </div>
      ${filtered.length === 0 ? `<div class="empty-state"><div class="empty-icon">👷</div><p>${STATE.workers.length === 0 ? 'No workers registered.' : 'No matches found.'}</p></div>` :
        filtered.map(w => {
          const earnings = STATE.getTotalEarned(w.id);
          return `<div class="worker-item" onclick="navigate('/worker-details/${w.id}')">
            <div class="avatar">${avatarLetter(w.name)}</div>
            <div style="flex:1">
              <div class="worker-name">${w.name}</div>
              <div class="worker-role">${w.role}</div>
            </div>
            <div class="worker-earnings">
              <div class="amount">₹${Math.round(earnings)}</div>
              <div class="label">Total Earned</div>
            </div>
          </div>`;
        }).join('')}
    </div>
    <button class="fab" onclick="navigate('/add-worker')" title="Add Worker">+</button>`;
  const inp = el.querySelector('#workerSearch');
  if(inp) inp.addEventListener('input', () => renderWorkerList(el, inp.value));
}

// ============================================================
//  WORKER DETAILS SCREEN
// ============================================================
route('/worker-details', async (el, id) => {
  if (!STATE.workers.length) await refreshAll();
  const wid = parseInt(id);
  const w = STATE.getWorkerById(wid);
  if (!w) { navigate('/worker-list'); return; }
  const earned = STATE.getTotalEarned(wid);
  const paid = STATE.getTotalPaid(wid);
  const due = STATE.getBalanceDue(wid);
  const days = STATE.getPresentDaysCount(wid);
  el.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" onclick="navigate('/worker-list')">${ICONS.back}</button>
      <span class="top-bar-title">Worker Details</span>
      <button class="icon-btn" onclick="navigate('/edit-worker/${wid}')" title="Edit">${ICONS.edit}</button>
      <button class="icon-btn danger" onclick="confirmDelete(${wid})" title="Delete">${ICONS.delete}</button>
    </div>
    <div class="content">
      <div class="profile-header">
        <div class="avatar large">${avatarLetter(w.name)}</div>
        <div style="font-size:22px;font-weight:800;color:var(--green-dark)">${w.name}</div>
        <div class="text-gray">Worker ID: #${w.id}</div>
      </div>
      <div class="card mb-16">
        <div class="fw-bold text-dark mb-16">Personal Info</div>
        <div class="profile-info-card">
          <div class="info-row"><span class="info-icon">${ICONS.phone}</span><div><div class="info-label">Phone</div><div class="info-value">${w.phone}</div></div></div>
          <div class="info-row"><span class="info-icon">${ICONS.home}</span><div><div class="info-label">Address</div><div class="info-value">${w.address}</div></div></div>
          <div class="info-row"><span class="info-icon">${ICONS.work}</span><div><div class="info-label">Role</div><div class="info-value">${w.role}</div></div></div>
          <div class="info-row"><span class="info-icon">${ICONS.payments}</span><div><div class="info-label">Daily Wage</div><div class="info-value">₹${w.daily_wage}</div></div></div>
          <div class="info-row"><span class="info-icon">${ICONS.calendar}</span><div><div class="info-label">Joining Date</div><div class="info-value">${w.join_date || 'N/A'}</div></div></div>
        </div>
      </div>
      <div class="card" style="background:var(--green-light)">
        <div class="flex-between">
          <div>
            <div class="fs-sm text-gray">Days Present</div>
            <div style="font-size:28px;font-weight:900;color:var(--green-dark)">${days} Days</div>
          </div>
          <div style="text-align:right">
            <div class="fs-sm text-gray">Balance Due</div>
            <div style="font-size:22px;font-weight:800;color:${due > 0 ? 'var(--red)' : 'var(--green-primary)'}">₹${Math.round(due)}</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="flex-between">
          <span class="fs-sm">Total Earned: ₹${Math.round(earned)}</span>
          <span class="fs-sm text-gray">Total Paid: ₹${Math.round(paid)}</span>
        </div>
      </div>
    </div>`;
  window.confirmDelete = (wid) => {
    const w2 = STATE.getWorkerById(wid);
    showModal(`Delete ${w2.name}?`, `<p class="text-gray">This action cannot be undone. All records for this worker will be removed.</p>`,
      async (overlay) => {
        await API.deleteWorker(wid);
        overlay.remove(); await refreshAll(); showToast('Worker deleted.'); navigate('/worker-list');
      }, 'Delete', 'btn-danger');
  };
});

// ============================================================
//  ADD WORKER SCREEN
// ============================================================
route('/add-worker', (el) => {
  el.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" onclick="navigate('/worker-list')">${ICONS.back}</button>
      <span class="top-bar-title" style="color:var(--green-dark)">Add New Worker</span>
    </div>
    <div class="content">
      <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="wName" placeholder="Full name"/></div>
      <div class="form-group"><label class="form-label">Phone Number</label><input class="form-input" id="wPhone" type="tel" placeholder="Phone number"/></div>
      <div class="form-group"><label class="form-label">Daily Wage (₹)</label><input class="form-input" id="wWage" type="number" placeholder="Daily wage"/></div>
      <div class="form-group"><label class="form-label">Role</label><input class="form-input" id="wRole" placeholder="e.g. General Labor"/></div>
      <div class="form-group"><label class="form-label">Address</label><textarea class="form-input" id="wAddr" rows="3" placeholder="Home address"></textarea></div>
      <button class="btn btn-primary" onclick="saveWorker()">Save Worker</button>
    </div>`;
  window.saveWorker = async () => {
    const name = el.querySelector('#wName').value.trim();
    const wage = parseFloat(el.querySelector('#wWage').value);
    if (!name || isNaN(wage)) { showToast('Name and wage are required.'); return; }
    const w = { name, phone: el.querySelector('#wPhone').value, daily_wage: wage, role: el.querySelector('#wRole').value, address: el.querySelector('#wAddr').value };
    const res = await API.addWorker(w); if (res.ok) { await refreshAll(); showToast("Worker Saved! ✅"); navigate("/worker-list"); } else { showToast("Error: " + res.error); }
  };
});

// ============================================================
//  EDIT WORKER SCREEN
// ============================================================
route('/edit-worker', async (el, id) => {
  if (!STATE.workers.length) await refreshAll();
  const wid = parseInt(id);
  const w = STATE.getWorkerById(wid);
  if (!w) { navigate('/worker-list'); return; }
  el.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" onclick="navigate('/worker-details/${wid}')">${ICONS.back}</button>
      <span class="top-bar-title" style="color:var(--green-dark)">Edit Worker</span>
    </div>
    <div class="content">
      <div class="form-group"><label class="form-label">Full Name</label><input class="form-input" id="wName" value="${w.name}"/></div>
      <div class="form-group"><label class="form-label">Phone Number</label><input class="form-input" id="wPhone" type="tel" value="${w.phone}"/></div>
      <div class="form-group"><label class="form-label">Daily Wage (₹)</label><input class="form-input" id="wWage" type="number" value="${w.daily_wage}"/></div>
      <div class="form-group"><label class="form-label">Role</label><input class="form-input" id="wRole" value="${w.role}"/></div>
      <div class="form-group"><label class="form-label">Address</label><textarea class="form-input" id="wAddr" rows="3">${w.address}</textarea></div>
      <button class="btn btn-primary" onclick="updateWorker()">Update Worker</button>
    </div>`;
  window.updateWorker = async () => {
    const updated = { ...w, name: el.querySelector('#wName').value.trim(), phone: el.querySelector('#wPhone').value, daily_wage: parseFloat(el.querySelector('#wWage').value), role: el.querySelector('#wRole').value, address: el.querySelector('#wAddr').value };
    const ok = await API.updateWorker(wid, updated);
    if (ok) { await refreshAll(); showToast('Worker Updated! ✅'); navigate(`/worker-details/${wid}`); }
    else showToast('Error updating worker.');
  };
});

// ============================================================
//  ADMIN TASKS SCREEN
// ============================================================
route('/admin-tasks', async (el) => {
  await refreshAll();
  renderAdminTasks(el);
});
function renderAdminTasks(el) {
  el.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" onclick="navigate('/admin-dashboard')">${ICONS.back}</button>
      <span class="top-bar-title">Daily Assignments</span>
    </div>
    <div class="content">
      <div class="section-title">Assign Work to Labor</div>
      ${STATE.workers.length === 0 ? `<div class="empty-state"><div class="empty-icon">👷</div><p>No workers registered yet.</p></div>` :
        STATE.workers.map(w => {
          const latestTask = [...STATE.tasks].filter(t => String(t.worker) === String(w.id)).pop();
          const isCompleted = latestTask?.is_completed;
          const taskDesc = latestTask?.description || 'No active task';
          return `<div class="task-card">
            <div class="task-info" style="flex:1">
              <div class="fw-bold">${w.name}</div>
              <div class="task-desc ${isCompleted ? 'task-completed' : 'text-gray'}">
                ${isCompleted ? `✅ Completed: ` : ''}${taskDesc}
              </div>
            </div>
            <button class="btn btn-primary btn-sm" onclick="assignTask(${w.id},'${w.name}')">
              ${latestTask ? (isCompleted ? 'New' : 'Update') : 'Assign'}
            </button>
          </div>`;
        }).join('')}
    </div>`;
  window.assignTask = (workerId, workerName) => {
    showModal(`Assign Work to ${workerName}`, `
      <div class="form-group"><label class="form-label">Instructions</label>
      <input class="form-input" id="taskInput" placeholder="e.g. Clean the barn"/></div>`,
      async (overlay) => {
        const desc = overlay.querySelector('#taskInput').value.trim();
        if (!desc) return;
        await API.addTask({ worker: workerId, description: desc });
        overlay.remove(); await refreshAll(); showToast('Task Assigned! ✅'); renderAdminTasks(el);
      });
  };
}

