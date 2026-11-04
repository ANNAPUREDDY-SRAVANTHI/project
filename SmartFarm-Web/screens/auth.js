// ============================================================
//  SPLASH SCREEN
// ============================================================
route('/splash', async (el) => {
  el.innerHTML = `
    <div class="splash">
      <div class="splash-logo">🌾</div>
      <div class="splash-title">Smart Farm</div>
      <div class="splash-sub">Farm Management Portal</div>
      <div class="spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff;margin-top:16px"></div>
    </div>`;
  await new Promise(r => setTimeout(r, 1800));
  navigate(API.isLoggedIn() ? (API.getRole() === 'Admin' ? '/admin-dashboard' : '/worker-dashboard') : '/login');
});

// ============================================================
//  LOGIN SCREEN
// ============================================================
route('/login', (el) => {
  let role = 'Admin';
  el.innerHTML = `
    <div class="login-screen">
      <div class="login-header"><div class="icon">🌾</div><h1>Smart Farm</h1></div>
      <div class="login-card">
        <div class="role-toggle">
          <button class="role-btn active" id="btnAdmin" onclick="setRole('Admin')">Admin</button>
          <button class="role-btn" id="btnWorker" onclick="setRole('Worker')">Worker</button>
        </div>
        <div class="form-group">
          <label class="form-label">Username</label>
          <input class="form-input" id="loginUser" placeholder="Enter username" autocomplete="username"/>
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <div class="input-wrap">
            <input class="form-input" type="password" id="loginPass" placeholder="Enter password" autocomplete="current-password"/>
            <button class="input-icon-btn" onclick="togglePwd('loginPass',this)" type="button">${ICONS.eye}</button>
          </div>
        </div>
        <div id="loginErr" style="color:var(--red);font-size:13px;margin-bottom:8px;display:none">Invalid credentials. Please try again.</div>
        <button class="btn btn-primary" id="loginBtn" onclick="doLogin()">Login</button>
        <button class="btn btn-text mt-8" onclick="navigate('/forgot-password')">Forgot Password?</button>
      </div>
      <div style="margin-top:20px;font-size:14px;color:var(--gray-text)">
        Don't have an account? <a href="#/register" style="color:var(--green-dark);font-weight:700">Register Now</a>
      </div>
    </div>`;
  window.setRole = (r) => {
    role = r;
    el.querySelector('#btnAdmin').classList.toggle('active', r === 'Admin');
    el.querySelector('#btnWorker').classList.toggle('active', r === 'Worker');
    el.querySelector('#loginUser').value = '';
    el.querySelector('#loginPass').value = '';
    el.querySelector('#loginErr').style.display = 'none';
  };
  window.togglePwd = (id, btn) => {
    const inp = el.querySelector('#' + id);
    const isText = inp.type === 'text';
    inp.type = isText ? 'password' : 'text';
    btn.innerHTML = isText ? ICONS.eye : ICONS.eye_off;
  };
  window.doLogin = async () => {
    const user = el.querySelector('#loginUser').value.trim();
    const pass = el.querySelector('#loginPass').value;
    const btn = el.querySelector('#loginBtn');
    const errEl = el.querySelector('#loginErr');
    if (!user || !pass) return;
    btn.textContent = 'Logging in...'; btn.disabled = true;
    let res; try { res = await API.login(user, pass); } catch (e) { console.error(e); btn.textContent = 'Login'; btn.disabled = false; errEl.textContent = 'Network error: Cannot reach server.'; errEl.style.display = 'block'; return; }
    btn.textContent = 'Login'; btn.disabled = false;
    if (res.ok) {
      API.saveUser(user, role);
      STATE.currentUser = user; STATE.currentRole = role;
      await refreshAll();
      navigate(role === 'Admin' ? '/admin-dashboard' : '/worker-dashboard');
    } else {
      errEl.textContent = 'Invalid credentials. Please try again.';
      errEl.style.display = 'block';
    }
  };
  el.querySelector('#loginPass').addEventListener('keydown', e => { if (e.key === 'Enter') window.doLogin(); });
});

// ============================================================
//  REGISTER SCREEN
// ============================================================
route('/register', (el) => {
  let regRole = 'Admin';
  el.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" onclick="history.back()">${ICONS.back}</button>
      <span class="top-bar-title">Create Account</span>
    </div>
    <div class="content">
      <div class="role-toggle" style="margin-bottom:16px">
        <button class="role-btn active" id="btnRegAdmin" type="button" onclick="setRegRole('Admin')">Admin</button>
        <button class="role-btn" id="btnRegWorker" type="button" onclick="setRegRole('Worker')">Worker</button>
      </div>
      <div class="form-group"><label class="form-label">Username</label><input class="form-input" id="regUser" placeholder="Choose a username"/></div>
      
      <div class="form-group"><label class="form-label">Password</label><input class="form-input" id="regPass" type="password" placeholder="Create password"/></div>
      <div class="form-group"><label class="form-label">Confirm Password</label><input class="form-input" id="regPass2" type="password" placeholder="Repeat password"/></div>
      <div id="regErr" style="color:var(--red);font-size:13px;margin-bottom:12px;display:none">Passwords do not match.</div>
      <button class="btn btn-primary" onclick="doRegister()">Register</button>
    </div>`;
  window.setRegRole = (r) => {
    regRole = r;
    el.querySelector('#btnRegAdmin').classList.toggle('active', r === 'Admin');
    el.querySelector('#btnRegWorker').classList.toggle('active', r === 'Worker');
  };
  window.doRegister = async () => {
    const user = el.querySelector('#regUser').value.trim();
    const pass = el.querySelector('#regPass').value;
    const pass2 = el.querySelector('#regPass2').value;
    const err = el.querySelector('#regErr');
    if (pass !== pass2) { err.textContent = 'Passwords do not match.'; err.style.display = 'block'; return; }
    if (!user || !pass) return;
    const res = await API.register({ username: user, password: pass, role: regRole });
    if (res.ok) { showToast('Account created! Please log in.'); navigate('/login'); }
    else { 
        let errorMsg = 'Registration failed. Username may already exist.';
        try {
            const parsed = JSON.parse(res.error);
            if (parsed.username) errorMsg = parsed.username[0];
            else if (parsed.error) errorMsg = parsed.error;
            else errorMsg = res.error;
        } catch(e) {
            if (res.error) errorMsg = res.error.substring(0, 50);
        }
        err.textContent = errorMsg; 
        err.style.display = 'block'; 
    }
  };
});

// ============================================================
//  FORGOT PASSWORD SCREEN
// ============================================================
route('/forgot-password', (el) => {
  el.innerHTML = `
    <div class="top-bar">
      <button class="icon-btn" onclick="navigate('/login')">${ICONS.back}</button>
      <span class="top-bar-title">Reset Password</span>
    </div>
    <div class="content">
      <p class="text-gray mb-16">Enter your username and new password to reset your account credentials.</p>
      <div class="form-group"><label class="form-label">Username</label><input class="form-input" id="fpUser" placeholder="Enter username"/></div>
      <div class="form-group"><label class="form-label">New Password</label><input class="form-input" id="fpPass" type="password" placeholder="New password"/></div>
      <button class="btn btn-primary" onclick="doFP()">Update Password</button>
    </div>`;
  window.doFP = async () => {
    const u = el.querySelector('#fpUser').value.trim();
    const p = el.querySelector('#fpPass').value;
    if (!u || !p) return;
    await API.forgotPassword(u, p);
    showToast('Password Updated! ✅'); navigate('/login');
  };
});


