// ============================================================
//  FINANCE SUMMARY SCREEN
// ============================================================
route('/finance', async (el) => {
  await refreshAll();
  renderFinance(el);
});
function renderFinance(el) {
  const totalDebt = STATE.workers.reduce((s, w) => s + STATE.getBalanceDue(w.id), 0);
  el.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" onclick="navigate('/admin-dashboard')">${ICONS.back}</button>
      <span class="top-bar-title">Farm Finance</span>
    </div>
    <div class="content">
      <div class="finance-header-card">
        <div class="label">Total Labor Debt</div>
        <div class="amount">₹ ${totalDebt.toFixed(2)}</div>
        <div class="sublabel">Amount you still owe to all workers</div>
      </div>
      <div class="section-title">Worker Balance Sheet</div>
      ${STATE.workers.length === 0 ? `<div class="empty-state"><div class="empty-icon">💰</div><p>No workers registered.</p></div>` :
        STATE.workers.map(w => {
          const earned = STATE.getTotalEarned(w.id);
          const paid = STATE.getTotalPaid(w.id);
          const balance = STATE.getBalanceDue(w.id);
          return `<div class="card mb-16">
            <div class="flex-between">
              <div>
                <div class="fw-bold">${w.name}</div>
                <div class="fs-sm text-gray">${w.role}</div>
              </div>
              <div style="font-size:18px;font-weight:900;color:${balance > 0 ? 'var(--red)' : 'var(--green-primary)'}">
                Due: ₹${Math.round(balance)}
              </div>
            </div>
            <div class="divider"></div>
            <div class="flex-between">
              <div>
                <div class="fs-sm">Total Earned: ₹${Math.round(earned)}</div>
                <div class="fs-sm text-gray">Total Paid: ₹${Math.round(paid)}</div>
              </div>
              <button class="btn btn-primary btn-sm" onclick="recordPay(${w.id},'${w.name}')">Record Pay</button>
            </div>
          </div>`;
        }).join('')}
    </div>`;
  window.recordPay = (wid, name) => {
    showModal(`Record Payment for ${name}`,
      `<div class="form-group"><label class="form-label">Amount Paid (₹)</label>
       <input class="form-input" id="payAmt" type="number" placeholder="Enter amount" min="1"/></div>`,
      async (overlay) => {
        const amt = parseFloat(overlay.querySelector('#payAmt').value);
        if (!amt || amt <= 0) return;
        await API.addPayment({ worker: wid, amount: amt });
        overlay.remove(); await refreshAll(); showToast('Payment Recorded! 💰'); renderFinance(el);
      });
  };
}

// ============================================================
//  REPORTS DASHBOARD
// ============================================================
route('/reports', async (el) => {
  if (!STATE.workers.length) await refreshAll();
  const totalDue = STATE.workers.reduce((s, w) => s + STATE.getBalanceDue(w.id), 0);
  el.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" onclick="navigate('/admin-dashboard')">${ICONS.back}</button>
      <span class="top-bar-title">Reports & Analytics</span>
    </div>
    <div class="content">
      <div class="section-title">Farm Performance</div>
      <div class="report-card" style="background:var(--green-light)" onclick="navigate('/attendance-dashboard')">
        <div style="flex:1">
          <div class="report-title">Attendance Summary</div>
          <div class="report-desc">Total registered workers: ${STATE.workers.length}<br>Track daily presence and trends.</div>
        </div>
        <div class="report-icon">${ICONS.fact_check.replace('viewBox','style="width:32px;height:32px;color:var(--green-primary)" viewBox')}</div>
      </div>
      <div class="report-card" style="background:var(--blue-light)" onclick="navigate('/finance')">
        <div style="flex:1">
          <div class="report-title">Wage Analytics</div>
          <div class="report-desc">Total farm debt: ₹${Math.round(totalDue)}<br>View pending salary and payment history.</div>
        </div>
        <div class="report-icon">${ICONS.payments.replace('viewBox','style="width:32px;height:32px;color:var(--blue)" viewBox')}</div>
      </div>
      <div class="card">
        <div style="display:flex;align-items:center;gap:16px">
          <div style="color:var(--green-primary)">${ICONS.share.replace('viewBox','style="width:24px;height:24px" viewBox')}</div>
          <div style="flex:1">
            <div class="fw-bold">Export Report</div>
            <div class="fs-sm text-gray">Copy full wage &amp; labor summary</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="exportReport()">Export</button>
        </div>
      </div>
    </div>`;
  window.exportReport = () => {
    const header = `SMART FARM REPORT - ${new Date().toLocaleString()}\n\n`;
    const tableHeader = 'Name | Phone | Role | Earned | Paid | Due\n';
    const divider = '-------------------------------------------\n';
    const rows = STATE.workers.map(w => {
      const earned = Math.round(STATE.getTotalEarned(w.id));
      const paid = Math.round(STATE.getTotalPaid(w.id));
      const due = Math.round(STATE.getBalanceDue(w.id));
      return `${w.name} | ${w.phone} | ${w.role} | ₹${earned} | ₹${paid} | ₹${due}`;
    }).join('\n');
    const full = header + tableHeader + divider + rows;
    navigator.clipboard.writeText(full).then(() => showToast('Report copied to clipboard! 📋')).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = full; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      showToast('Report copied! 📋');
    });
  };
});
