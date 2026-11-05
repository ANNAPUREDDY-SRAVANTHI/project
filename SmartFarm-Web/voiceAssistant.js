// ============================================================
//  SmartFarm Web â€” Multilingual AI Voice Assistant
//  Supports: English (en-IN), Telugu (te-IN), Hindi (hi-IN)
//  Voice-to-Action: Attendance, Payments, Tasks, Balance Inquiries
// ============================================================

const VoiceAssistant = (() => {
  let recognition = null;
  let isListening = false;
  let currentLang = 'en-IN'; // 'en-IN', 'te-IN', 'hi-IN'
  let synth = window.speechSynthesis;

  const LANG_CONFIG = {
    'en-IN': { label: 'English', flag: 'ðŸ‡¬ðŸ‡§', hint: 'e.g. "Pay 500 to Kumar" or "Mark Meena present"' },
    'te-IN': { label: 'à°¤à±†à°²à±à°—à±', flag: 'ðŸ‡®ðŸ‡³', hint: 'à°‰à°¦à°¾: "à°•à±à°®à°¾à°°à± à°•à°¿ 500 à°ªà±‡à°®à±†à°‚à°Ÿà±" à°²à±‡à°¦à°¾ "à°®à±€à°¨à°¾ à°ªà±à°°à±†à°¸à±†à°‚à°Ÿà±"' },
    'hi-IN': { label: 'à¤¹à¤¿à¤‚à¤¦à¥€', flag: 'ðŸ‡®ðŸ‡³', hint: 'à¤‰à¤¦à¤¾: "à¤•à¥à¤®à¤¾à¤° à¤•à¥‹ 500 à¤°à¥à¤ªà¤¯à¥‡ à¤ªà¥‡à¤®à¥‡à¤‚à¤Ÿ" à¤¯à¤¾ "à¤®à¥€à¤¨à¤¾ à¤ªà¥à¤°à¥‡à¤œà¥‡à¤‚à¤Ÿ"' }
  };

  // Common Telugu/Hindi name phonetics to match worker English names
  const PHONETIC_MAP = {
    'à°•à±à°®à°¾à°°à±': 'kumar', 'à¤•à¥à¤®à¤¾à¤°': 'kumar',
    'à°®à±€à°¨à°¾': 'meena', 'à¤®à¥€à¤¨à¤¾': 'meena',
    'à°°à°®à±‡à°·à±': 'ramesh', 'à°°à°®à±‡à°¶à±': 'ramesh', 'à¤°à¤®à¥‡à¤¶': 'ramesh',
    'à°°à°¾à°œà±': 'raju', 'à¤°à¤¾à¤œà¥‚': 'raju',
    'à°¸à±à°¨à±€à°¤': 'sunita', 'à¤¸à¥à¤¨à¥€à¤¤à¤¾': 'sunita',
    'à°²à±€à°²': 'leela', 'à¤²à¥€à¤²à¤¾': 'leela',
    'à°•à±à°¸à±à°®': 'kusuma', 'à¤•à¥à¤¸à¥à¤®à¤¾': 'kusuma',
    'à°®à°¾à°¬à±à°¨à°¿': 'mabuni', 'à¤®à¤¾à¤¬à¥à¤¨à¥€': 'mabuni',
    'à°¸à°¬à±€à°¨à°¾': 'sabina', 'à¤¸à¤¬à¥€à¤¨à¤¾': 'sabina',
    'à°²à°¤': 'latha', 'à¤²à¤¤à¤¾': 'latha',
    'à°•à±ƒà°·à±à°£': 'krishna', 'à°•à±à°°à°¿à°·à±à°£': 'krishna', 'à¤•à¥ƒà¤·à¥à¤£à¤¾': 'krishna',
    'à°°à°¾à°®à°¨à±à°¨': 'ramana', 'à°°à°®à°£': 'ramana', 'à¤°à¤®à¤¾à¤¨à¤¾': 'ramana',
    'à°°à°¾à°®à±à°®à±‹à°¹à°¨à±': 'rammohan', 'à°°à°¾à°®à± à°®à±‹à°¹à°¨à±': 'rammohan', 'à¤°à¤¾à¤®à¤®à¥‹à¤¹à¤¨': 'rammohan'
  };

  function init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition is not supported in this browser.");
      return false;
    }
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListeningState(true);
      updateModalStatus("ðŸŽ™ï¸ Listening... Speak now!");
    };

    recognition.onspeechstart = () => {
      updateModalStatus("ðŸ—£ï¸ Hearing your voice...");
    };

    recognition.onspeechend = () => {
      updateModalStatus("â³ Processing speech...");
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      const text = (finalTranscript || interim).trim();
      const transcriptEl = document.getElementById('vaTranscript');
      if (transcriptEl && text) {
        transcriptEl.textContent = `"${text}"`;
        transcriptEl.style.color = '#1B5E20';
      }

      if (finalTranscript.trim()) {
        handleSpeechResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.warn("Speech Recognition Error:", event.error);
      if (event.error === 'no-speech') {
        updateModalStatus("ðŸ‘‚ No speech heard. Tap the mic to speak.");
      } else if (event.error === 'not-allowed') {
        updateModalStatus("ðŸ”’ Mic is blocked. In Chrome, click ðŸ”’ icon in address bar to Allow.");
      } else if (event.error === 'audio-capture') {
        updateModalStatus("âš ï¸ No microphone hardware found.");
      } else if (event.error === 'network') {
        updateModalStatus("âš ï¸ Network error contacting Google speech service.");
      } else {
        updateModalStatus(`â„¹ï¸ Tap mic to speak (${event.error})`);
      }
      setListeningState(false);
    };

    recognition.onend = () => {
      setListeningState(false);
    };

    return true;
  }

  function speak(text, lang = currentLang) {
    if (!synth) return;
    try {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.95;
      synth.speak(utterance);
    } catch (e) {
      console.error("TTS error:", e);
    }
  }

  // Demo workers used when backend is offline (STATE.workers is empty)
  const DEMO_WORKERS = [
    { id: 'demo-1', name: 'Ramesh',  role: 'General Labor',  daily_wage: 300, _isDemo: true },
    { id: 'demo-2', name: 'Kumar',   role: 'Irrigation',     daily_wage: 350, _isDemo: true },
    { id: 'demo-3', name: 'Meena',   role: 'Weeding',        daily_wage: 280, _isDemo: true },
    { id: 'demo-4', name: 'Leela',   role: 'Harvesting',     daily_wage: 320, _isDemo: true },
    { id: 'demo-5', name: 'Raju',    role: 'Spraying',       daily_wage: 310, _isDemo: true },
    { id: 'demo-6', name: 'Sunita',  role: 'Planting',       daily_wage: 290, _isDemo: true }
  ];

  function getWorkerList() {
    const live = (window.STATE && Array.isArray(STATE.workers) && STATE.workers.length > 0)
      ? STATE.workers : null;
    if (!live) {
      // Backend offline â€” seed STATE.workers with demo workers so screens render them
      STATE.workers = DEMO_WORKERS;
    }
    return STATE.workers;
  }

  // Find worker in STATE.workers by spoken name
  function findWorker(spokenText) {
    const textLower = spokenText.toLowerCase();
    const workers = getWorkerList();
    
    // Check direct English matches
    for (const w of workers) {
      const name = w.name.toLowerCase();
      if (textLower.includes(name)) return w;
    }

    // Check phonetic Telugu/Hindi mapping
    for (const [regional, eng] of Object.entries(PHONETIC_MAP)) {
      if (spokenText.includes(regional)) {
        const found = workers.find(w => w.name.toLowerCase().includes(eng));
        if (found) return found;
      }
    }

    // Fallback: check parts of names
    for (const w of workers) {
      const parts = w.name.toLowerCase().split(' ');
      for (const p of parts) {
        if (p.length > 2 && textLower.includes(p)) return w;
      }
    }

    return null;
  }

  // Extract number/amount
  function extractAmount(text) {
    // English/Telugu numerals extraction
    const teluguDigits = {'à±¦':'0','à±§':'1','à±¨':'2','à±©':'3','à±ª':'4','à±«':'5','à±¬':'6','à±­':'7','à±®':'8','à±¯':'9'};
    const hindiDigits = {'à¥¦':'0','à¥§':'1','à¥¨':'2','à¥©':'3','à¥ª':'4','à¥«':'5','à¥¬':'6','à¥­':'7','à¥®':'8','à¥¯':'9'};
    
    let normalized = text;
    for (let [k, v] of Object.entries(teluguDigits)) normalized = normalized.replaceAll(k, v);
    for (let [k, v] of Object.entries(hindiDigits)) normalized = normalized.replaceAll(k, v);

    const match = normalized.match(/\b\d+(\.\d+)?\b/);
    if (match) return parseFloat(match[0]);

    // Spoken number words
    const words = { 'hundred': 100, 'two hundred': 200, 'three hundred': 300, 'four hundred': 400, 'five hundred': 500, 'thousand': 1000,
                    'à°µà°‚à°¦': 100, 'à°°à±†à°‚à°¡à± à°µà°‚à°¦à°²à±': 200, 'à°à°¦à± à°µà°‚à°¦à°²à±': 500, 'à°µà±‡à°¯à°¿': 1000, 'à°µà±†à°¯à±à°¯à°¿': 1000,
                    'à¤¸à¥Œ': 100, 'à¤¦à¥‹ à¤¸à¥Œ': 200, 'à¤ªà¤¾à¤‚à¤š à¤¸à¥Œ': 500, 'à¤¹à¤œà¤¾à¤°': 1000 };
    for (let [w, num] of Object.entries(words)) {
      if (text.includes(w)) return num;
    }
    return null;
  }

  // Multilingual Intent Recognition Engine
  function parseIntent(transcript) {
    const text = transcript.toLowerCase();
    const worker = findWorker(transcript);

    // 0. LOGIN INTENT (Works directly on Login page)
    const isLogin = text.includes('login') || text.includes('à°²à°¾à°—à°¿à°¨à±') || text.includes('à¤²à¥‰à¤—à¤¿à¤¨') ||
                    (text.includes('admin') && !text.includes('kumar'));
    if (isLogin) {
      return {
        type: 'LOGIN',
        description: 'Voice Login: Log in as Admin'
      };
    }

    // 1. ATTENDANCE INTENT (Handles diverse conversational phrasing & colloquialisms)
    const absentKeywords = [
      'absent', 'not come', "didn't come", 'did not come', 'on leave', 'off today',
      'à°†à°¬à±à°¸à±†à°‚à°Ÿà±', 'à°°à°¾à°²à±‡à°¦à±', 'à°°à°¾à°²à°¾', 'à°°à°¾à°²à±‡', 'à°¸à±†à°²à°µà±', 'à°¡à±à°®à±à°®à°¾', 'à°—à±ˆà°°à±à°¹à°¾à°œà°°à±', 'à°²à±‡à°¡à±', 'à°²à±‡à°¦à±',
      'à¤…à¤¨à¥à¤ªà¤¸à¥à¤¥à¤¿à¤¤', 'à¤¨à¤¹à¥€à¤‚ à¤†à¤¯à¤¾', 'à¤¨à¤¹à¥€à¤‚ à¤†à¤ˆ', 'à¤›à¥à¤Ÿà¥à¤Ÿà¥€', 'à¤—à¤¾à¤¯à¤¬', 'à¤¨à¤¾à¤—à¤¾'
    ];
    const presentKeywords = [
      'present', 'came', 'attended', 'came today', 'at work', 'is here',
      'à°¹à°¾à°œà°°à±', 'à°ªà±à°°à±†à°¸à±†à°‚à°Ÿà±', 'à°µà°šà±à°šà°¾à°¡à±', 'à°µà°šà±à°šà°¿à°‚à°¦à°¿', 'à°µà°šà±à°šà°¾à°°à±', 'à°‰à°¨à±à°¨à°¾à°¡à±', 'à°‰à°‚à°¦à°¿', 'à°ªà°¨à°¿à°²à±‹ à°‰à°¨à±à°¨à°¾à°¡à±',
      'à¤‰à¤ªà¤¸à¥à¤¥à¤¿à¤¤', 'à¤¹à¤¾à¤œà¤¿à¤°à¥€', 'à¤†à¤¯à¤¾', 'à¤†à¤ˆ', 'à¤†à¤¯à¤¾ à¤¹à¥ˆ', 'à¤•à¤¾à¤® à¤ªà¤° à¤¹à¥ˆ', 'à¤ªà¥à¤°à¥‡à¤œà¥‡à¤‚à¤Ÿ'
    ];

    const isAbsentMatch = absentKeywords.some(k => text.includes(k) || transcript.includes(k));
    const isPresentMatch = presentKeywords.some(k => text.includes(k) || transcript.includes(k));

    if ((isAbsentMatch || isPresentMatch) && worker) {
      const status = isAbsentMatch ? 'Absent' : 'Present';
      return {
        type: 'ATTENDANCE',
        worker,
        status,
        description: `Mark ${worker.name} as ${status}`
      };
    }

    // 2. PAYMENT INTENT (Handles wages, advances, informal currency & slang like à°•à±‚à°²à°¿, à°ªà±ˆà°¸à°²à±, à¤®à¤œà¤¦à¥‚à¤°à¥€)
    const paymentKeywords = [
      'pay', 'payment', 'paid', 'gave', 'give', 'rupees', 'rs', 'salary', 'wage', 'advance', 'money',
      'à°ªà±‡à°®à±†à°‚à°Ÿà±', 'à°°à±‚à°ªà°¾à°¯à°²à±', 'à°°à±‚à°ªà°¾à°¯à°¿', 'à°ªà±ˆà°¸à°²à±', 'à°ªà±ˆà°¸à°²à±', 'à°¡à°¬à±à°¬à±à°²à±', 'à°¡à°¬à±à°¬à±', 'à°šà±†à°²à±à°²à°¿à°‚à°šà±', 'à°‡à°šà±à°šà°¾à°¨à±', 'à°‡à°µà±à°µà±', 'à°•à±‚à°²à°¿', 'à°œà±€à°¤à°‚', 'à°…à°¡à±à°µà°¾à°¨à±à°¸à±', 'à°°à°¾à°¸à±à°•à±‹', 'à°–à°¾à°¤à°¾',
      'à¤ªà¥‡à¤®à¥‡à¤‚à¤Ÿ', 'à¤°à¥à¤ªà¤¯à¥‡', 'à¤°à¥à¤ªà¤¯à¤¾', 'à¤ªà¥ˆà¤¸à¥‡', 'à¤µà¥‡à¤¤à¤¨', 'à¤®à¤œà¤¦à¥‚à¤°à¥€', 'à¤¦à¥‡ à¤¦à¤¿à¤', 'à¤¦à¤¿à¤¯à¤¾', 'à¤¦à¥‡à¤¨à¤¾', 'à¤à¤¡à¤µà¤¾à¤‚à¤¸', 'à¤–à¤¾à¤¤à¤¾'
    ];
    const isPayment = paymentKeywords.some(k => text.includes(k) || transcript.includes(k));
    const amount = extractAmount(transcript);
    if (isPayment && worker && amount) {
      return {
        type: 'PAYMENT',
        worker,
        amount,
        description: `Record â‚¹${amount} payment for ${worker.name}`
      };
    }

    // 3. BALANCE / DUES INQUIRY (Colloquial: "à°¬à°¾à°•à±€ à°Žà°‚à°¤?", "à°Žà°‚à°¤ à°‡à°µà±à°µà°¾à°²à°¿?", "à¤•à¤¿à¤¤à¤¨à¤¾ à¤¬à¤¾à¤•à¥€ à¤¹à¥ˆ?")
    const balanceKeywords = [
      'balance', 'due', 'dues', 'pending', 'earned', 'owed', 'how much left', 'how much owe', 'account',
      'à°¬à±à°¯à°¾à°²à±†à°¨à±à°¸à±', 'à°¬à°¾à°•à±€', 'à°Žà°‚à°¤ à°‰à°‚à°¦à°¿', 'à°Žà°‚à°¤ à°‡à°µà±à°µà°¾à°²à°¿', 'à°Žà°‚à°¤ à°°à°¾à°µà°¾à°²à°¿', 'à°®à°¿à°—à°¿à°²à°¿à°‚à°¦à°¿', 'à°²à±†à°•à±à°•', 'à°Žà°‚à°¤à±ˆà°‚à°¦à°¿', 'à°ªà±ˆà°¸à°²à± à°Žà°¨à±à°¨à°¿',
      'à¤¬à¥ˆà¤²à¥‡à¤‚à¤¸', 'à¤¬à¤¾à¤•à¥€', 'à¤¬à¤•à¤¾à¤¯à¤¾', 'à¤•à¤¿à¤¤à¤¨à¤¾ à¤¹à¥à¤†', 'à¤•à¤¿à¤¤à¤¨à¤¾ à¤¬à¤¾à¤•à¥€', 'à¤•à¤¿à¤¤à¤¨à¤¾ à¤¦à¥‡à¤¨à¤¾', 'à¤¹à¤¿à¤¸à¤¾à¤¬'
    ];
    const isBalance = balanceKeywords.some(k => text.includes(k) || transcript.includes(k));
    if (isBalance) {
      const allWorkers = getWorkerList();
      const targetWorker = worker || (allWorkers.length > 0 ? allWorkers[0] : null);
      if (targetWorker) {
        // Demo mode: STATE methods may not exist for demo workers
        const isDemo = targetWorker._isDemo || !(window.STATE && STATE.getBalanceDue);
        const due    = isDemo ? 0 : STATE.getBalanceDue(targetWorker.id);
        const earned = isDemo ? 0 : STATE.getTotalEarned(targetWorker.id);
        const paid   = isDemo ? 0 : STATE.getTotalPaid(targetWorker.id);
        const descText = isDemo
          ? `${targetWorker.name} â€” Demo Mode (start server for live data)`
          : `${targetWorker.name}'s balance due is â‚¹${Math.round(due)} (Earned: â‚¹${Math.round(earned)}, Paid: â‚¹${Math.round(paid)})`;
        return {
          type: 'BALANCE',
          worker: targetWorker,
          due, earned, paid,
          isDemo,
          description: descText
        };
      }
    }

    // 4. TASK ASSIGNMENT INTENT
    const taskKeywords = [
      'task', 'assign', 'work', 'duty', 'job',
      'à°ªà°¨à°¿', 'à°Ÿà°¾à°¸à±à°•à±', 'à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà±', 'à°šà±†à°¯à±à°¯à°®à°¨à±', 'à°šà±†à°¯à±à°¯à°¾à°²à°¿', 'à°‡à°µà±à°µà±',
      'à¤•à¤¾à¤®', 'à¤Ÿà¤¾à¤¸à¥à¤•', 'à¤¸à¥Œà¤‚à¤ªà¥‹', 'à¤œà¤¿à¤®à¥à¤®à¤¾'
    ];
    const isTask = taskKeywords.some(k => text.includes(k) || transcript.includes(k));
    if (isTask && worker) {
      let taskDesc = transcript
        .replace(new RegExp(worker.name, 'gi'), '')
        .replace(/assign task|add task|task for|give task|task|duty|work|à°ªà°¨à°¿|à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà±|à°•à°¾à°®à±|à¤•à¤¾à¤®|à¤¸à¥Œà¤‚à¤ªà¥‹/gi, '')
        .trim();
      if (!taskDesc || taskDesc.length < 3) taskDesc = "General Farm Work";
      return {
        type: 'TASK',
        worker,
        taskDesc,
        description: `Assign task "${taskDesc}" to ${worker.name}`
      };
    }

    // 5. NAVIGATION / GENERAL COMMANDS
    if (text.includes('worker') || text.includes('à°µà°°à±à°•à°°à±') || text.includes('à¤®à¤œà¤¦à¥‚à¤°')) {
      return { type: 'NAVIGATE', path: '/worker-list', description: 'Open Worker Management' };
    }
    if (text.includes('finance') || text.includes('à°«à±ˆà°¨à°¾à°¨à±à°¸à±') || text.includes('payment list')) {
      return { type: 'NAVIGATE', path: '/finance', description: 'Open Finance Summary' };
    }
    if (text.includes('dashboard') || text.includes('à°¹à±‹à°®à±') || text.includes('home')) {
      return { type: 'NAVIGATE', path: '/admin-dashboard', description: 'Go to Admin Dashboard' };
    }

    return { type: 'UNKNOWN', text: transcript, description: 'Could not recognize command.' };
  }

  // Execute Action
  async function executeAction(action) {
    if (!action) return;

    if (action.type === 'LOGIN') {
      const uField = document.getElementById('loginUsername');
      const pField = document.getElementById('loginPassword');
      if (uField && pField) {
        uField.value = 'admin';
        pField.value = 'admin123';
        const submitBtn = document.querySelector('.login-card button.btn-primary');
        if (submitBtn) submitBtn.click();
      } else {
        const res = await API.login('admin', 'admin123');
        if (res.ok) {
          API.saveUser('admin', 'Admin');
          navigate('/admin-dashboard');
        }
      }
      const feedback = currentLang === 'te-IN' 
        ? "à°…à°¡à±à°®à°¿à°¨à± à°—à°¾ à°²à°¾à°—à°¿à°¨à± à°…à°µà±à°¤à±à°¨à±à°¨à°¾à°°à±." 
        : (currentLang === 'hi-IN' ? "à¤à¤¡à¤®à¤¿à¤¨ à¤•à¥‡ à¤°à¥‚à¤ª à¤®à¥‡à¤‚ à¤²à¥‰à¤—à¤¿à¤¨ à¤¹à¥‹ à¤°à¤¹à¤¾ à¤¹à¥ˆ." : "Logging in as Admin.");
      speak(feedback);
      return;
    }

    if (action.type === 'ATTENDANCE') {
      const isDemo = action.worker._isDemo;
      if (isDemo) {
        const today = todayISO();
        // Replace any existing entry for same worker+date so it doesn't duplicate
        STATE.attendance = STATE.attendance.filter(r => !(r.worker === action.worker.id && r.date === today));
        STATE.attendance.push({ id: Date.now(), worker: action.worker.id, date: today, status: action.status });
        const statusLabel = action.status === 'Present' ? 'âœ… Present' : 'âŒ Absent';
        const feedback = currentLang === 'te-IN'
          ? `${action.worker.name} ${action.status === 'Present' ? 'à°ªà±à°°à±†à°¸à±†à°‚à°Ÿà±' : 'à°†à°¬à±à°¸à±†à°‚à°Ÿà±'} à°—à°¾ à°¨à°®à±‹à°¦à± à°…à°¯à°¿à°‚à°¦à°¿.`
          : (currentLang === 'hi-IN' ? `${action.worker.name} à¤•à¥‹ ${action.status === 'Present' ? 'à¤‰à¤ªà¤¸à¥à¤¥à¤¿à¤¤' : 'à¤…à¤¨à¥à¤ªà¤¸à¥à¤¥à¤¿à¤¤'} à¤¦à¤°à¥à¤œ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾.` : `${action.worker.name} marked as ${action.status}.`);
        speak(feedback);
        closeModal();
        showToast(`${action.worker.name} marked ${statusLabel} âœ…`);
        renderRoute();
      } else {
        try {
          const today = todayISO();
          const ok = await API.submitAttendance({ worker: action.worker.id, date: today, status: action.status });
          if (ok) {
            await refreshAll();
            const feedback = currentLang === 'te-IN'
              ? `${action.worker.name} à°•à°¿ à°¹à°¾à°œà°°à± ${action.status === 'Present' ? 'à°ªà±à°°à±†à°¸à±†à°‚à°Ÿà±' : 'à°†à°¬à±à°¸à±†à°‚à°Ÿà±'} à°—à°¾ à°¨à°®à±‹à°¦à± à°šà±‡à°¯à°¬à°¡à°¿à°‚à°¦à°¿.`
              : (currentLang === 'hi-IN' ? `${action.worker.name} à¤•à¥€ à¤¹à¤¾à¤œà¤¿à¤°à¥€ à¤¦à¤°à¥à¤œ à¤¹à¥‹ à¤—à¤ˆ à¤¹à¥ˆ.` : `Marked ${action.worker.name} as ${action.status}.`);
            speak(feedback);
            closeModal();
            showToast(`Attendance Marked: ${action.worker.name} (${action.status}) âœ…`);
            renderRoute();
          } else {
            showToast(`âš ï¸ Server error saving attendance. Is Django running?`);
          }
        } catch (e) {
          showToast(`âŒ Cannot reach server at 127.0.0.1:8000. Start Django backend!`);
          console.error('Attendance save error:', e);
        }
      }
    } else if (action.type === 'PAYMENT') {
      const isDemo = action.worker._isDemo;
      if (isDemo) {
        STATE.payments.push({ id: Date.now(), worker: action.worker.id, amount: action.amount, date: todayISO(), description: 'Voice Payment' });
        const feedback = currentLang === 'te-IN'
          ? `${action.worker.name} à°•à°¿ ${action.amount} à°°à±‚à°ªà°¾à°¯à°² à°šà±†à°²à±à°²à°¿à°‚à°ªà± à°¨à°®à±‹à°¦à± à°…à°¯à°¿à°‚à°¦à°¿.`
          : (currentLang === 'hi-IN' ? `${action.worker.name} à¤•à¥‹ ${action.amount} à¤°à¥à¤ªà¤¯à¥‡ à¤¦à¤°à¥à¤œ à¤•à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾.` : `â‚¹${action.amount} payment for ${action.worker.name} recorded.`);
        speak(feedback);
        closeModal();
        showToast(`â‚¹${action.amount} payment for ${action.worker.name} recorded âœ…`);
        renderRoute();
      } else {
        try {
          const ok = await API.addPayment({ worker: action.worker.id, amount: action.amount, description: 'Voice Payment' });
          if (ok) {
            await refreshAll();
            const feedback = currentLang === 'te-IN'
              ? `${action.worker.name} à°•à°¿ ${action.amount} à°°à±‚à°ªà°¾à°¯à°² à°šà±†à°²à±à°²à°¿à°‚à°ªà± à°¨à°®à±‹à°¦à± à°šà±‡à°¯à°¬à°¡à°¿à°‚à°¦à°¿.`
              : (currentLang === 'hi-IN' ? `${action.worker.name} à¤•à¥‹ ${action.amount} à°°à¥à¤ªà¤¯à¥‡ à¤•à¤¾ à¤­à¥à¤—à¤¤à¤¾à¤¨ à¤¦à¤°à¥à¤œ à¤¹à¥à¤†.` : `Recorded payment of â‚¹${action.amount} for ${action.worker.name}.`);
            speak(feedback);
            closeModal();
            showToast(`Payment of â‚¹${action.amount} recorded for ${action.worker.name}! ðŸ’°`);
            renderRoute();
          } else {
            showToast(`âš ï¸ Server error saving payment. Is Django running?`);
          }
        } catch (e) {
          showToast(`âŒ Cannot reach server at 127.0.0.1:8000. Start Django backend!`);
          console.error('Payment save error:', e);
        }
      }
    } else if (action.type === 'TASK') {
      const isDemo = action.worker._isDemo;
      if (isDemo) {
        STATE.tasks.push({ id: Date.now(), worker: action.worker.id, description: action.taskDesc || 'General Farm Work', is_completed: false, date: todayISO() });
        speak(currentLang === 'te-IN' ? `${action.worker.name} à°•à°¿ à°ªà°¨à°¿ à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°¬à°¡à°¿à°‚à°¦à°¿.` : `Task assigned to ${action.worker.name}.`);
        closeModal();
        showToast(`Task assigned to ${action.worker.name} âœ…`);
        renderRoute();
      } else {
        try {
          const ok = await API.addTask({ worker: action.worker.id, description: action.taskDesc });
          if (ok) {
            await refreshAll();
            const feedback = currentLang === 'te-IN'
              ? `${action.worker.name} à°•à°¿ à°ªà°¨à°¿ à°•à±‡à°Ÿà°¾à°¯à°¿à°‚à°šà°¬à°¡à°¿à°‚à°¦à°¿.`
              : (currentLang === 'hi-IN' ? `${action.worker.name} à¤•à¥‹ à¤•à¤¾à¤® à¤¦à¤¿à¤¯à¤¾ à¤—à¤¯à¤¾.` : `Task assigned to ${action.worker.name}.`);
            speak(feedback);
            closeModal();
            showToast(`Task assigned to ${action.worker.name}! ðŸ“‹`);
            renderRoute();
          } else {
            showToast(`âš ï¸ Server error saving task. Is Django running?`);
          }
        } catch (e) {
          showToast(`âŒ Cannot reach server at 127.0.0.1:8000. Start Django backend!`);
          console.error('Task save error:', e);
        }
      }
    } else if (action.type === 'BALANCE') {
      const feedback = action.isDemo
        ? (currentLang === 'te-IN' ? `à°¸à°°à±à°µà°°à± à°¨à°¡à°ªà°•à±à°‚à°¡à°¾ à°¬à±à°¯à°¾à°²à±†à°¨à±à°¸à± à°¡à±‡à°Ÿà°¾ à°…à°‚à°¦à±à°¬à°¾à°Ÿà±à°²à±‹ à°²à±‡à°¦à±.` : `Balance data needs the server to be running.`)
        : (currentLang === 'te-IN'
          ? `${action.worker.name} à°¬à±à°¯à°¾à°²à±†à°¨à±à°¸à± à°¬à°¾à°•à±€ ${Math.round(action.due)} à°°à±‚à°ªà°¾à°¯à°²à±.`
          : (currentLang === 'hi-IN' ? `${action.worker.name} à¤•à¤¾ à¤¬à¤¾à¤•à¥€ à¤¬à¥ˆà¤²à¥‡à¤‚à¤¸ ${Math.round(action.due)} à¤°à¥à¤ªà¤¯à¥‡ à¤¹à¥ˆ.` : `${action.worker.name}'s balance due is â‚¹${Math.round(action.due)}.`));
      speak(feedback);
    } else if (action.type === 'NAVIGATE') {
      navigate(action.path);
      speak(`Navigating to ${action.description}`);
    }
  }

  // Handle Speech Transcript Result — mirrors Android VoiceAssistantDialog behavior
  function handleSpeechResult(transcript) {
    const transcriptEl = document.getElementById('vaTranscript');
    const resultCardEl = document.getElementById('vaResultCard');
    const executeBtn   = document.getElementById('vaExecuteBtn');

    if (transcriptEl) { transcriptEl.textContent = `"${transcript}"`; transcriptEl.style.color = '#1B5E20'; }

    // Seed demo workers into STATE so screens can render them
    getWorkerList();

    const action = parseIntent(transcript);
    if (!resultCardEl) return;

    if (action.type === 'UNKNOWN') {
      resultCardEl.innerHTML = `
        <div style="color:var(--orange);font-weight:600;font-size:14px">⚠️ Command not recognized.</div>
        <div style="font-size:12px;color:var(--gray-text);margin-top:6px">
          Try: <b>"Mark Ramesh present"</b>, <b>"Pay 500 to Kumar"</b> or <b>"Meena absent"</b>
        </div>`;
      if (executeBtn) executeBtn.style.display = 'none';
      const errMsg = currentLang === 'te-IN' ? 'కమాండ్ అర్థం కాలేదు. మళ్ళీ చెప్పండి.' : (currentLang === 'hi-IN' ? 'कमांड समझ नहीं आई. फिर बोलिए.' : 'Command not recognized. Please try again.');
      speak(errMsg);
    } else {
      const badgeColor = action.type === 'ATTENDANCE' ? '#1565C0' : (action.type === 'PAYMENT' ? '#2E7D32' : '#E65100');
      resultCardEl.innerHTML = `
        <div style="font-size:11px;font-weight:700;color:${badgeColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">
          ⚡ Action Detected (${action.type})
        </div>
        <div style="font-size:15px;font-weight:700;color:#1B5E20;line-height:1.4">
          ${action.description}
        </div>`;

      // Speak confirmation (like Android auto-speak on detection)
      let confirmMsg = action.description + '. Tap Confirm and Save.';
      if (currentLang === 'te-IN') {
        if (action.type === 'ATTENDANCE') confirmMsg = `${action.worker?.name} కి హాజరు ${action.status === 'Present' ? 'ప్రెసెంట్' : 'ఆబ్సెంట్'} గా నమోదు అవుతుంది. కన్ఫర్మ్ చేయండి.`;
        else if (action.type === 'PAYMENT') confirmMsg = `${action.worker?.name} కి ${action.amount} రూపాయల చెల్లింపు. కన్ఫర్మ్ చేయండి.`;
        else if (action.type === 'TASK') confirmMsg = `${action.worker?.name} కి పని కేటాయిస్తున్నారు. కన్ఫర్మ్ చేయండి.`;
      } else if (currentLang === 'hi-IN') {
        if (action.type === 'ATTENDANCE') confirmMsg = `${action.worker?.name} की हाजिरी ${action.status === 'Present' ? 'उपस्थित' : 'अनुपस्थित'} दर्ज होगी। कन्फर्म करें।`;
        else if (action.type === 'PAYMENT') confirmMsg = `${action.worker?.name} को ${action.amount} रुपये का भुगतान। कन्फर्म करें।`;
        else if (action.type === 'TASK') confirmMsg = `${action.worker?.name} को काम दिया जाएगा। कन्फर्म करें।`;
      }
      speak(confirmMsg);

      // Show Confirm & Save button (like Android) — NO auto-execute
      if (executeBtn && action.type !== 'BALANCE' && action.type !== 'UNKNOWN') {
        const btnLabel = action.type === 'LOGIN' ? 'Login as Admin' : 'Confirm & Save';
        executeBtn.textContent = btnLabel;
        executeBtn.style.cssText = 'display:block;width:100%;padding:14px 0;border-radius:12px;background:#2E7D32;color:#fff;border:none;font-weight:700;font-size:15px;cursor:pointer;margin-bottom:4px;';
        executeBtn.disabled = false;
        const freshBtn = executeBtn.cloneNode(true);
        executeBtn.parentNode.replaceChild(freshBtn, executeBtn);
        freshBtn.onclick = async () => {
          freshBtn.textContent = 'Saving...';
          freshBtn.disabled = true;
          await executeAction(action);
        };
      } else if (executeBtn) {
        executeBtn.style.display = 'none';
      }
    }
  }

  function setListeningState(listening) {
    isListening = listening;
    const micBtn = document.getElementById('vaMicBtn');
    const statusText = document.getElementById('vaStatusText');
    if (micBtn) {
      micBtn.classList.toggle('listening', listening);
    }
    if (statusText) {
      statusText.textContent = listening 
        ? `Listening in ${LANG_CONFIG[currentLang].label}... Speak now!`
        : 'Tap microphone to speak';
    }
  }

  function updateModalStatus(msg) {
    const statusText = document.getElementById('vaStatusText');
    if (statusText) statusText.textContent = msg;
  }

  function toggleListening() {
    if (!recognition && !init()) {
      alert("Speech recognition is not supported in this browser. Please use Google Chrome or Edge.");
      return;
    }

    if (isListening) {
      if (recognition) {
        try { recognition.stop(); } catch(e){}
      }
      setListeningState(false);
      return;
    }

    try {
      recognition.lang = currentLang;
      recognition.start();
      setListeningState(true);
      const transcriptEl = document.getElementById('vaTranscript');
      if (transcriptEl) {
        transcriptEl.textContent = 'Listening... Speak now!';
        transcriptEl.style.color = '#2E7D32';
      }
      updateModalStatus("ðŸŽ™ï¸ Listening... Speak now!");
      const resultCardEl = document.getElementById('vaResultCard');
      if (resultCardEl) resultCardEl.innerHTML = `<div style="font-size:11px;color:var(--gray-text)">ðŸ’¡ ${LANG_CONFIG[currentLang].hint}</div>`;
      const executeBtn = document.getElementById('vaExecuteBtn');
      if (executeBtn) executeBtn.style.display = 'none';
    } catch (err) {
      console.warn("Recognition start catch:", err);
      if (err.name === 'InvalidStateError') {
        try { recognition.stop(); } catch(e){}
        setTimeout(() => {
          try {
            recognition.lang = currentLang;
            recognition.start();
            setListeningState(true);
          } catch(e){}
        }, 150);
      } else {
        setListeningState(false);
      }
    }
  }

  function openModal() {
    closeModal();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'voiceAssistantModal';
    overlay.innerHTML = `
      <div class="modal" style="max-width:390px;text-align:center;padding:24px 20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:22px">ðŸŽ™ï¸</span>
            <div style="font-weight:800;font-size:17px;color:var(--green-dark)">AI Voice Assistant</div>
          </div>
          <button id="vaCloseBtn" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--gray-text)">&times;</button>
        </div>

        <!-- Language Switcher -->
        <div style="display:flex;gap:6px;justify-content:center;margin-bottom:16px;">
          ${Object.entries(LANG_CONFIG).map(([code, cfg]) => `
            <button class="va-lang-btn ${code === currentLang ? 'active' : ''}" data-lang="${code}" style="padding:6px 12px;border-radius:20px;border:1.5px solid var(--green-primary);background:${code === currentLang ? 'var(--green-primary)' : 'transparent'};color:${code === currentLang ? '#fff' : 'var(--green-primary)'};font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;">
              <span>${cfg.flag}</span> <span>${cfg.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- Animated Mic Button -->
        <div style="position:relative;margin:16px auto 12px;width:80px;height:80px;display:flex;align-items:center;justify-content:center;">
          <button id="vaMicBtn" class="va-mic-circle" title="Click to Speak / Stop">
            <svg viewBox="0 0 24 24" fill="currentColor" style="width:36px;height:36px">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
        </div>

        <div id="vaStatusText" style="font-size:13px;font-weight:600;color:var(--green-primary);margin-bottom:12px;">
          Tap microphone above to speak
        </div>

        <!-- Live Transcript Display -->
        <div id="vaTranscript" style="min-height:42px;padding:10px 14px;background:#f5f8f5;border-radius:12px;font-size:14px;font-style:italic;color:#333;margin-bottom:12px;border:1.5px dashed #c8e6c9;display:flex;align-items:center;justify-content:center;word-break:break-word;">
          "Tap mic and speak a command..."
        </div>

        <!-- Result Action Preview -->
        <div id="vaResultCard" style="min-height:50px;padding:10px;background:#ffffff;border-radius:12px;border:1px solid #e0e0e0;margin-bottom:12px;text-align:left;">
          <div style="font-size:11px;color:var(--gray-text)">ðŸ’¡ ${LANG_CONFIG[currentLang].hint}</div>
        </div>

        <button id="vaExecuteBtn" class="btn btn-primary" style="display:none;width:100%;margin-bottom:12px;">
          Confirm Action
        </button>

        <!-- Fallback Manual Input (Type or Speak) -->
        <div style="border-top:1px solid #edf2ed;padding-top:10px;display:flex;gap:6px;align-items:center;">
          <input id="vaManualInput" type="text" placeholder="Or type voice command here..." style="flex:1;padding:8px 12px;border:1px solid #c8e6c9;border-radius:10px;font-size:12px;outline:none;background:#fafdfa;"/>
          <button id="vaManualSubmitBtn" class="btn btn-primary" style="padding:8px 14px;border-radius:10px;font-size:12px;white-space:nowrap;">Go</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // Event Listeners
    overlay.querySelector('#vaCloseBtn').onclick = closeModal;
    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    overlay.querySelector('#vaMicBtn').onclick = toggleListening;

    // Manual input submit
    const manualInp = overlay.querySelector('#vaManualInput');
    const manualBtn = overlay.querySelector('#vaManualSubmitBtn');
    const runManual = () => {
      const val = manualInp.value.trim();
      if (val) {
        const transcriptEl = document.getElementById('vaTranscript');
        if (transcriptEl) transcriptEl.textContent = `"${val}"`;
        handleSpeechResult(val);
      }
    };
    manualBtn.onclick = runManual;
    manualInp.onkeydown = (e) => { if (e.key === 'Enter') runManual(); };

    overlay.querySelectorAll('.va-lang-btn').forEach(btn => {
      btn.onclick = () => {
        currentLang = btn.getAttribute('data-lang');
        overlay.querySelectorAll('.va-lang-btn').forEach(b => {
          const isAct = b.getAttribute('data-lang') === currentLang;
          b.style.background = isAct ? 'var(--green-primary)' : 'transparent';
          b.style.color = isAct ? '#fff' : 'var(--green-primary)';
        });
        const resCard = document.getElementById('vaResultCard');
        if (resCard) resCard.innerHTML = `<div style="font-size:11px;color:var(--gray-text)">ðŸ’¡ ${LANG_CONFIG[currentLang].hint}</div>`;
        if (isListening) {
          recognition.stop();
          setTimeout(toggleListening, 200);
        }
      };
    });

    // Ready to listen on tap
    setListeningState(false);
  }

  function closeModal() {
    if (recognition && isListening) {
      try { recognition.stop(); } catch (e) {}
    }
    setListeningState(false);
    const existing = document.getElementById('voiceAssistantModal');
    if (existing) existing.remove();
  }

  // Inject Floating Mic Button on screens
  function renderFloatingButton() {
    if (document.getElementById('vaFloatingBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'vaFloatingBtn';
    btn.className = 'va-floating-btn';
    btn.setAttribute('title', 'AI Voice Assistant (à°¤à±†à°²à±à°—à± / Hindi / English)');
    btn.setAttribute('aria-label', 'AI Voice Assistant');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" style="width:28px;height:28px">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
      <span class="va-btn-pulse"></span>`;
    btn.onclick = openModal;
    document.body.appendChild(btn);
  }

  const exported = { init, openModal, closeModal, renderFloatingButton, parseIntent, executeAction };
  window.VoiceAssistant = exported;
  return exported;
})();

window.VoiceAssistant = VoiceAssistant;

// Auto-mount listener on route changes and document load
window.addEventListener('hashchange', () => {
  setTimeout(() => {
    const route = window.location.hash.replace('#', '') || '/splash';
    if (route !== '/splash' && window.VoiceAssistant) {
      window.VoiceAssistant.renderFloatingButton();
    }
  }, 100);
});

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const route = window.location.hash.replace('#', '') || '/splash';
    if (route !== '/splash' && window.VoiceAssistant) {
      window.VoiceAssistant.renderFloatingButton();
    }
  }, 200);
});

