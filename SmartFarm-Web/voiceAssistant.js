// ============================================================
//  SmartFarm Web — Multilingual AI Voice Assistant
//  Exact Web Port of Android VoiceAssistantDialog.kt
//  Supports: English (en-IN), Telugu (te-IN), Hindi (hi-IN)
// ============================================================

const VoiceAssistant = (() => {
  let recognition = null;
  let isListening = false;
  let selectedLang = 'en-IN'; // 'en-IN', 'te-IN', 'hi-IN'
  let spokenText = '';
  let parsedAction = null;
  let isExecuting = false;

  // Language Configurations — Mirrors Android VoiceAssistantDialog.kt lines 193-196
  const LANGS = [
    { code: 'en-IN', label: '\uD83C\uDDEC\uD83C\uDDE7 English', prompt: 'Tap microphone to speak' },
    { code: 'te-IN', label: '\uD83C\uDDEE\uD83C\uDDF3 \u0C24\u0C46\u0C32\u0C41\u0C17\u0C41', prompt: '\u0C2E\u0C48\u0C15\u0C4D \u0C28\u0C4A\u0C15\u0C4D\u0C15\u0C3F \u0C24\u0C46\u0C32\u0C41\u0C17\u0C41\u0C32\u0C4B \u0C2E\u0C3E\u0C1F\u0C4D\u0C32\u0C3E\u0C21\u0C02\u0C21\u0C3F' },
    { code: 'hi-IN', label: '\uD83C\uDDEE\uD83C\uDDF3 \u0939\u093F\u0902\u0926\u0940', prompt: '\u092E\u093E\u0907\u0915 \u0926\u092C\u093E\u090F\u0902 \u0914\u0930 \u0939\u093F\u0902\u0926\u0940 \u092E\u0947\u0902 \u092C\u094B\u0932\u0947\u0902' }
  ];

  // Helper Hint text — Mirrors Android VoiceAssistantDialog.kt lines 319-323
  function getHelperHint(lang) {
    if (lang === 'te-IN') {
      return '\uD83D\uDCA1 \u0C09\u0C26\u0C3E\u0C39\u0C30\u0C23\u0C32\u0C41:\n\u2022 \u0C15\u0C41\u0C2E\u0C3E\u0C30\u0C4D \u0C15\u0C3F 500 \u0C2A\u0C47\u0C2E\u0C46\u0C02\u0C1F\u0C4D\n\u2022 \u0C30\u0C2E\u0C47\u0C37\u0C4D \u0C2A\u0C4D\u0C30\u0C46\u0C38\u0C46\u0C02\u0C1F\u0C4D / \u0C06\u0C2C\u0C4D\u0C38\u0C46\u0C02\u0C1F\u0C4D\n\u2022 \u0C15\u0C41\u0C2E\u0C3E\u0C30\u0C4D \u0C2C\u0C4D\u0C2F\u0C3E\u0C32\u0C46\u0C28\u0C4D\u0C38\u0C4D \u0C0E\u0C02\u0C24?';
    } else if (lang === 'hi-IN') {
      return '\uD83D\uDCA1 \u0909\u0926\u093E\u0939\u0930\u0923:\n\u2022 \u0915\u0941\u092E\u093E\u0930 \u0915\u094B 500 \u0930\u0941\u092A\u092F\u0947 \u092A\u0947\u092E\u0947\u0902\u091F\n\u2022 \u0930\u092E\u0947\u0936 \u092A\u094D\u0930\u0947\u091C\u0947\u0902\u091F / \u0905\u0928\u0941\u092A\u0938\u094D\u0925\u093F\u0924\n\u2022 \u0915\u0941\u092E\u093E\u0930 \u0915\u093E \u092C\u0948\u0932\u0947\u0902\u0938 \u0915\u093F\u0924\u0928\u093E \u0939\u0948?';
    }
    return '\uD83D\uDCA1 Examples:\n\u2022 Pay 500 to Kumar\n\u2022 Mark Ramesh present\n\u2022 Assign task Weeding to Meena';
  }

  // Phonetic map — Mirrors Android VoiceAssistantDialog.kt lines 339-350
  const PHONETIC_MAP = {
    '\u0C15\u0C41\u0C2E\u0C3E\u0C30\u0C4D': 'kumar', '\u0915\u0941\u092E\u093E\u0930': 'kumar',
    '\u0C2E\u0C40\u0C28\u0C3E': 'meena', '\u092E\u0940\u0928\u093E': 'meena',
    '\u0C15\u0C41\u0C38\u0C41\u0C2E': 'kusuma', '\u0915\u0941\u0938\u0941\u092E\u093E': 'kusuma',
    '\u0C2E\u0C3E\u0C2C\u0C41\u0C28\u0C3F': 'mabuni', '\u092E\u093E\u092C\u0941\u0928\u0940': 'mabuni',
    '\u0C32\u0C40\u0C32': 'leela', '\u0932\u0940\u0932\u093E': 'leela',
    '\u0C38\u0C2C\u0C40\u0C28\u0C3E': 'sabina', '\u0938\u092C\u0940\u0928\u093E': 'sabina',
    '\u0C32\u0C24': 'latha', '\u0932\u0924\u093E': 'latha',
    '\u0C15\u0C43\u0C37\u0C4D\u0C23': 'krishna', '\u0C15\u0C4D\u0C30\u0C3F\u0C37\u0C4D\u0C23': 'krishna', '\u0915\u0943\u0937\u094D\u0923\u093E': 'krishna',
    '\u0C30\u0C2E\u0C23': 'ramana', '\u0930\u092E\u093E\u0928\u093E': 'ramana',
    '\u0C30\u0C3E\u0C2E\u0C4D\u0C2E\u0C4B\u0C39\u0C28\u0C4D': 'rammohan', '\u0930\u093E\u092E\u092E\u094B\u0939\u0928': 'rammohan'
  };

  // Live worker helper
  function getWorkerList() {
    return (window.STATE && Array.isArray(STATE.workers) && STATE.workers.length > 0)
      ? STATE.workers
      : [
          { id: 1, name: 'Kumar', role: 'Driver', daily_wage: 350 },
          { id: 2, name: 'Meena', role: 'Harvester', daily_wage: 280 },
          { id: 3, name: 'Kusuma', role: 'Field Worker', daily_wage: 300 }
        ];
  }

  // Text to Speech — Mirrors Android VoiceAssistantDialog.kt lines 75-85
  function speakFeedback(text, langCode) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = langCode || selectedLang;
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn('TTS error:', e);
    }
  }

  // Multilingual Intent Parsing Logic — Mirrors Android VoiceAssistantDialog.kt lines 335-477
  function parseMultilingualIntent(spoken, workers, viewModel) {
    const text = spoken.toLowerCase();

    // Find worker
    let matchedWorker = workers.find(w => text.includes(w.name.toLowerCase())) || null;
    if (!matchedWorker) {
      for (const [regional, eng] of Object.entries(PHONETIC_MAP)) {
        if (spoken.includes(regional)) {
          matchedWorker = workers.find(w => w.name.toLowerCase().includes(eng)) || null;
          if (matchedWorker) break;
        }
      }
    }

    // Extract Amount (Regex & Digits) — Mirrors Android lines 364-372
    const amountRegex = /\b\d+(\.\d+)?\b/;
    const match = spoken.match(amountRegex);
    let extractedAmount = match ? parseFloat(match[0]) : 0.0;
    if (extractedAmount === 0.0) {
      const wordNums = {
        'hundred': 100.0, 'two hundred': 200.0, 'five hundred': 500.0, 'thousand': 1000.0,
        '\u0C35\u0C02\u0C26': 100.0, '\u0C30\u0C46\u0C02\u0C21\u0C41 \u0C35\u0C02\u0C26\u0C32\u0C41': 200.0, '\u0C10\u0C26\u0C41 \u0C35\u0C02\u0C26\u0C32\u0C41': 500.0, '\u0C35\u0C47\u0C2F\u0C3F': 1000.0, '\u0C35\u0C46\u0C2F\u0C4D\u0C2F\u0C3F': 1000.0,
        '\u0938\u094C': 100.0, '\u0926\u094B \u0938\u094C': 200.0, '\u092A\u093E\u0902\u091A \u0938\u094C': 500.0, '\u0939\u091C\u093E\u0930': 1000.0
      };
      for (const [k, v] of Object.entries(wordNums)) {
        if (spoken.includes(k)) {
          extractedAmount = v;
          break;
        }
      }
    }

    // 0. LOGIN — Mirrors Android lines 374-382
    const isLogin = text.includes('login') || text.includes('\u0C32\u0C3E\u0C17\u0C3F\u0C28\u0C4D') || text.includes('\u0932\u0949\u0917\u093F\u0928') ||
                    (text.includes('admin') && !text.includes('kumar'));
    if (isLogin) {
      return {
        type: 'LOGIN',
        displayMessage: 'Voice Command: Login as Admin'
      };
    }

    // 1. ATTENDANCE — Mirrors Android lines 384-406
    const absentKeywords = [
      'absent', 'not come', "didn't come", 'leave', 'off',
      '\u0C06\u0C2C\u0C4D\u0C38\u0C46\u0C02\u0C1F\u0C4D', '\u0C30\u0C3E\u0C32\u0C47\u0C26\u0C41', '\u0C30\u0C3E\u0C32\u0C3E', '\u0C30\u0C3E\u0C32\u0C47', '\u0C38\u0C46\u0C32\u0C35\u0C41', '\u0C21\u0C41\u0C2E\u0C4D\u0C2E\u0C3E', '\u0C17\u0C48\u0C30\u0C4D\u0C39\u0C3E\u0C1C\u0C30\u0C41', '\u0C32\u0C47\u0C21\u0C41', '\u0C32\u0C47\u0C26\u0C41',
      '\u0905\u0928\u0941\u092A\u0938\u094D\u0925\u093F\u0924', '\u0928\u0939\u0940\u0902 \u0906\u092F\u093E', '\u0928\u0939\u0940\u0902 \u0906\u0908', '\u091B\u0941\u091F\u094D\u091F\u0940', '\u0917\u093E\u092F\u092C', '\u0928\u093E\u0917\u093E'
    ];
    const presentKeywords = [
      'present', 'came', 'attended', 'at work',
      '\u0C39\u0C3E\u0C1C\u0C30\u0C41', '\u0C2A\u0C4D\u0C30\u0C46\u0C38\u0C46\u0C02\u0C1F\u0C4D', '\u0C35\u0C1a\u0C4D\u0C1a\u0C3E\u0C21\u0C41', '\u0C35\u0C1a\u0C4D\u0C1a\u0C3F\u0C02\u0C26\u0C3F', '\u0C35\u0C1a\u0C4D\u0C1a\u0C3E\u0C30\u0C41', '\u0C09\u0C28\u0C4D\u0C28\u0C3E\u0C21\u0C41', '\u0C09\u0C02\u0C26\u0C3F', '\u0C2A\u0C28\u0C3F\u0C32\u0C4B \u0C09\u0C28\u0C4D\u0C28\u0C3E\u0C21\u0C41',
      '\u0909\u092A\u0938\u094D\u0925\u093F\u0924', '\u0939\u093E\u091C\u093F\u0930\u0940', '\u0906\u092F\u093E', '\u0906\u0908', '\u0906\u092F\u093E \u0939\u0948', '\u0915\u093E\u092E \u092A\u0930', '\u092A\u094D\u0930\u0947\u091C\u0947\u0902\u091F'
    ];

    const isAbsentMatch = absentKeywords.some(k => text.includes(k) || spoken.includes(k));
    const isPresentMatch = presentKeywords.some(k => text.includes(k) || spoken.includes(k));

    if (isAbsentMatch || isPresentMatch) {
      const target = matchedWorker || (workers.length > 0 ? workers[0] : null);
      if (target) {
        const status = isAbsentMatch ? 'Absent' : 'Present';
        return {
          type: 'ATTENDANCE',
          worker: target,
          status: status,
          displayMessage: `Mark ${target.name} as ${status}`
        };
      }
    }

    // 2. PAYMENT — Mirrors Android lines 408-422
    const paymentKeywords = [
      'pay', 'payment', 'paid', 'gave', 'give', 'rupees', 'rs', 'salary', 'wage', 'advance',
      '\u0C2A\u0C47\u0C2E\u0C46\u0C02\u0C1F\u0C4D', '\u0C30\u0C42\u0C2A\u0C3E\u0C2F\u0C32\u0C41', '\u0C30\u0C42\u0C2A\u0C3E\u0C2F\u0C3F', '\u0C2A\u0C48\u0C38\u0C32\u0C41', '\u0C21\u0C2C\u0C4D\u0C2C\u0C41\u0C32\u0C41', '\u0C21\u0C2C\u0C4D\u0C2C\u0C41', '\u0C1a\u0C46\u0C32\u0C4D\u0C32\u0C3F\u0C02\u0C1a\u0C41', '\u0C07\u0C1a\u0C4D\u0C1a\u0C3E\u0C28\u0C41', '\u0C07\u0C35\u0C4D\u0C35\u0C41', '\u0C15\u0C42\u0C32\u0C3F', '\u0C1C\u0C40\u0C24\u0C02', '\u0C05\u0C21\u0C4D\u0C35\u0C3E\u0C28\u0C4D\u0C38\u0C4D', '\u0C30\u0C3E\u0C38\u0C41\u0C15\u0C4B', '\u0C16\u0C3E\u0C24\u0C3E',
      '\u092A\u0947\u092E\u0947\u0902\u091F', '\u0930\u0941\u092A\u092F\u0947', '\u0930\u0941\u092A\u092F\u093E', '\u092A\u0948\u0938\u0947', '\u0935\u0947\u0924\u0928', '\u092E\u091C\u0926\u0942\u0930\u0940', '\u0926\u0947 \u0926\u093F\u090F', '\u0926\u093F\u092F\u093E', '\u0926\u0947\u0928\u093E', '\u090F\u0921\u0935\u093E\u0902\u0938', '\u0916\u093E\u0924\u093E'
    ];
    const isPayment = paymentKeywords.some(k => text.includes(k) || spoken.includes(k));
    if (isPayment && extractedAmount > 0) {
      const target = matchedWorker || (workers.length > 0 ? workers[0] : null);
      if (target) {
        return {
          type: 'PAYMENT',
          worker: target,
          amount: extractedAmount,
          displayMessage: `Record payment of \u20B9${Math.round(extractedAmount)} for ${target.name}`
        };
      }
    }

    // 3. TASK — Mirrors Android lines 424-450
    const taskKeywords = [
      'task', 'assign', 'work', 'duty',
      '\u0C2A\u0C28\u0C3F', '\u0C1F\u0C3E\u0C38\u0C4D\u0C15\u0C4D', '\u0C15\u0C47\u0C1F\u0C3E\u0C2F\u0C3F\u0C02\u0C1a\u0C41', '\u0C1a\u0C46\u0C2F\u0C4D\u0C2F\u0C2E\u0C28\u0C41', '\u0C1a\u0C46\u0C2F\u0C4D\u0C2F\u0C3E\u0C32\u0C3F', '\u0C07\u0C35\u0C4D\u0C35\u0C41',
      '\u0915\u093E\u092E', '\u091F\u093E\u0938\u094D\u0915', '\u0938\u094C\u0902\u092A\u094B'
    ];
    const isTask = taskKeywords.some(k => text.includes(k) || spoken.includes(k));
    if (isTask) {
      const target = matchedWorker || (workers.length > 0 ? workers[0] : null);
      if (target) {
        let taskClean = spoken
          .replace(new RegExp(target.name, 'gi'), '');
        for (const reg of Object.keys(PHONETIC_MAP)) {
          taskClean = taskClean.replace(new RegExp(reg, 'g'), '');
        }
        taskClean = taskClean
          .replace(/assign task/gi, '')
          .replace(/add task/gi, '')
          .replace(/give task/gi, '')
          .replace(/any of my worker/gi, '')
          .replace(/any worker/gi, '')
          .replace(/worker/gi, '')
          .replace(/task/gi, '')
          .replace(/assign/gi, '')
          .replace(/work/gi, '')
          .replace(/duty/gi, '')
          .replace(/\u0C2A\u0C28\u0C3F/g, '')
          .replace(/\u0C15\u0C47\u0C1F\u0C3E\u0C2F\u0C3F\u0C02\u0C1a\u0C41/g, '')
          .replace(/\u0C1a\u0C46\u0C2F\u0C4D\u0C2F\u0C3E\u0C32\u0C3F/g, '')
          .replace(/\u0C07\u0C35\u0C4D\u0C35\u0C41/g, '')
          .replace(/\u0915\u093E\u092E/g, '')
          .replace(/\u0938\u094C\u0902\u092A\u094B/g, '')
          .replace(/^\s*(to|for|\u0C15\u0C3F|\u0C15\u0C4B|\u0915\u0947 \u0932\u093F\u090F)\s+/i, '')
          .replace(/\s*(to|for|\u0C15\u0C3F|\u0C15\u0C4B|\u0915\u0947 \u0932\u093F\u090F)\s*$/i, '')
          .trim();
        const finalTask = taskClean.length > 2 ? taskClean : 'General Farm Work';
        return {
          type: 'TASK',
          worker: target,
          taskDescription: finalTask,
          displayMessage: `Assign task '${finalTask}' to ${target.name}`
        };
      }
    }

    // 4. BALANCE INQUIRY — Mirrors Android lines 452-471
    const balanceKeywords = [
      'balance', 'due', 'pending', 'earned', 'owed',
      '\u0C2C\u0C4D\u0C2F\u0C3E\u0C32\u0C46\u0C28\u0C4D\u0C38\u0C4D', '\u0C2C\u0C3E\u0C15\u0C40', '\u0C0E\u0C02\u0C24 \u0C09\u0C02\u0C26\u0C3F', '\u0C0E\u0C02\u0C24 \u0C07\u0C35\u0C4D\u0C35\u0C3E\u0C32\u0C3F', '\u0C0E\u0C02\u0C24 \u0C30\u0C3E\u0C35\u0C3E\u0C32\u0C3F', '\u0C2E\u0C3F\u0C17\u0C3F\u0C32\u0C3F\u0C02\u0C26\u0C3F', '\u0C32\u0C46\u0C15\u0C4D\u0C15',
      '\u092C\u0948\u0932\u0947\u0902\u0938', '\u092C\u093E\u0915\u0940', '\u092C\u0915\u093E\u092F\u093E', '\u0915\u093F\u0924\u0928\u093E \u092C\u093E\u0915\u0940', '\u0915\u093F\u0924\u0928\u093E \u0926\u0947\u0928\u093E', '\u0939\u093F\u0938\u093E\u092C'
    ];
    const isBalance = balanceKeywords.some(k => text.includes(k) || spoken.includes(k));
    if (isBalance) {
      const target = matchedWorker || (workers.length > 0 ? workers[0] : null);
      if (target) {
        const due = window.STATE && STATE.getBalanceDue ? STATE.getBalanceDue(target.id) : 0;
        const earned = window.STATE && STATE.getTotalEarned ? STATE.getTotalEarned(target.id) : 0;
        const paid = window.STATE && STATE.getTotalPaid ? STATE.getTotalPaid(target.id) : 0;
        return {
          type: 'BALANCE',
          worker: target,
          displayMessage: `${target.name}'s balance due is \u20B9${Math.round(due)} (Earned: \u20B9${Math.round(earned)}, Paid: \u20B9${Math.round(paid)})`
        };
      }
    }

    // UNKNOWN — Mirrors Android line 474
    return {
      type: 'UNKNOWN',
      displayMessage: "Try saying 'Pay 500 to Kumar' or '\u0C30\u0C2E\u0C47\u0C37\u0C4D \u0C2A\u0C4D\u0C30\u0C46\u0C38\u0C46\u0C02\u0C1F\u0C4D'"
    };
  }

  // Execute Action — Exact Web Port of Android executeAndroidVoiceAction lines 479-505
  async function executeAndroidVoiceAction(action, onDone) {
    if (!action) {
      if (onDone) onDone();
      return;
    }

    const wid = action.worker ? (parseInt(action.worker.id) || action.worker.id) : null;
    const today = typeof todayISO === 'function' ? todayISO() : new Date().toISOString().split('T')[0];

    try {
      if (action.type === 'ATTENDANCE' && wid) {
        await API.submitAttendance({ worker: wid, date: today, status: action.status });
        await refreshAll();
        showToast('Attendance Submitted! \u2705');
      } else if (action.type === 'PAYMENT' && wid) {
        const amt = parseFloat(action.amount) || 0;
        await API.addPayment({ worker: wid, amount: amt });
        await refreshAll();
        showToast('Payment Recorded! \uD83D\uDCB0');
      } else if (action.type === 'TASK' && wid) {
        const desc = action.taskDescription || 'General Farm Work';
        await API.addTask({ worker: wid, description: desc });
        await refreshAll();
        showToast('Task Assigned! \uD83D\uDCCB');
      } else if (action.type === 'LOGIN') {
        const res = await API.login('admin', 'admin123');
        if (res.ok) {
          API.saveUser('admin', 'Admin');
          showToast('Logging in as Admin... \u2705');
          closeModal();
          navigate('/admin-dashboard');
          return;
        }
      }
    } catch (err) {
      console.error('executeAndroidVoiceAction catch:', err);
    }

    if (onDone) onDone();
  }

  // Handle Speech Recognition Result — Mirrors Android lines 91-125
  function handleSpokenResult(spoken) {
    if (!spoken || !spoken.trim()) return;
    spokenText = spoken.trim();

    const workers = getWorkerList();
    parsedAction = parseMultilingualIntent(spokenText, workers, window.STATE);

    // Speak audio feedback — Mirrors Android lines 100-123
    if (parsedAction.type !== 'UNKNOWN') {
      let audioMsg = parsedAction.displayMessage;
      if (selectedLang === 'te-IN') {
        if (parsedAction.type === 'ATTENDANCE') audioMsg = `${parsedAction.worker?.name || '\u0C35\u0C30\u0C4D\u0C15\u0C30\u0C4D'} \u0C15\u0C3F \u0C39\u0C3E\u0C1C\u0C30\u0C41 \u0C28\u0C2E\u0C4B\u0C26\u0C41 \u0C1a\u0C47\u0C2F\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F.`;
        else if (parsedAction.type === 'PAYMENT') audioMsg = `${parsedAction.worker?.name || '\u0C35\u0C30\u0C4D\u0C15\u0C30\u0C4D'} \u0C15\u0C3F ${Math.round(parsedAction.amount)} \u0C30\u0C42\u0C2A\u0C3E\u0C2F\u0C32 \u0C1a\u0C46\u0C32\u0C4D\u0C32\u0C3F\u0C02\u0C2A\u0C41 \u0C30\u0C3F\u0C15\u0C3E\u0C30\u0C4D\u0C21\u0C4D \u0C05\u0C2F\u0C3F\u0C02\u0C26\u0C3F.`;
        else if (parsedAction.type === 'TASK') audioMsg = `${parsedAction.worker?.name || '\u0C35\u0C30\u0C4D\u0C15\u0C30\u0C4D'} \u0C15\u0C3F \u0C1F\u0C3E\u0C38\u0C4D\u0C15\u0C4D \u0C15\u0C47\u0C1F\u0C3E\u0C2F\u0C3F\u0C02\u0C1a\u0C2C\u0C21\u0C3F\u0C02\u0C26\u0C3F.`;
        else if (parsedAction.type === 'BALANCE') audioMsg = parsedAction.displayMessage;
        else if (parsedAction.type === 'LOGIN') audioMsg = '\u0C05\u0C21\u0C4D\u0C2E\u0C3F\u0C28\u0C4D \u0C17\u0C3E \u0C32\u0C3E\u0C17\u0C3F\u0C28\u0C4D \u0C05\u0C35\u0C41\u0C24\u0C41\u0C28\u0C4D\u0C28\u0C3E\u0C30\u0C41.';
      } else if (selectedLang === 'hi-IN') {
        if (parsedAction.type === 'ATTENDANCE') audioMsg = `${parsedAction.worker?.name || '\u092E\u091C\u0926\u0942\u0930'} \u0915\u0940 \u0939\u093E\u091C\u093F\u0930\u0940 \u0926\u0930\u094D\u091C \u0915\u0930 \u0926\u0940 \u0917\u0908 \u0939\u0948.`;
        else if (parsedAction.type === 'PAYMENT') audioMsg = `${parsedAction.worker?.name || '\u092E\u091C\u0926\u0942\u0930'} \u0915\u094B ${Math.round(parsedAction.amount)} \u0930\u0941\u092A\u092F\u0947 \u0915\u093E \u0921\u0941\u0917\u0924\u093E\u0928 \u0926\u0930\u094D\u091C \u0939\u0941\u0906.`;
        else if (parsedAction.type === 'TASK') audioMsg = `${parsedAction.worker?.name || '\u092E\u091C\u0926\u0942\u0930'} \u0915\u094B \u0915\u093E\u092E \u0938\u094C\u0902\u092A\u093E \u0917\u092F\u093E.`;
        else if (parsedAction.type === 'BALANCE') audioMsg = parsedAction.displayMessage;
        else if (parsedAction.type === 'LOGIN') audioMsg = '\u090F\u0921\u092E\u093F\u0928 \u0915\u0947 \u0930\u0942\u092A \u092E\u0947\u0902 \u0932\u0949\u0917\u093F\u0928 \u0915\u093F\u092F\u093E \u091C\u093E \u0930\u0939\u093E \u0939\u0948.';
      }
      speakFeedback(audioMsg, selectedLang);
    } else {
      const errMsg = selectedLang === 'te-IN'
        ? '\u0C15\u0C2E\u0C3E\u0C02\u0C21\u0C4D \u0C05\u0C30\u0C4D\u0C25\u0C02 \u0C15\u0C3E\u0C32\u0C47\u0C26\u0C41. \u0C2E\u0C33\u0C4D\u0C33\u0C40 \u0C1a\u0C46\u0C2A\u0C4D\u0C2A\u0C02\u0C21\u0C3F.'
        : 'Command not recognized. Please try again.';
      speakFeedback(errMsg, selectedLang);
    }

    renderModalContent();
  }

  // Speech Recognition Engine initialization
  function initSpeechEngine() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return false;

    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (e) => {
      let finalTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript;
      }
      if (finalTranscript.trim()) {
        handleSpokenResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (e) => {
      console.warn('Speech error:', e.error);
      isListening = false;
      updateMicUI(false);
    };

    recognition.onend = () => {
      isListening = false;
      updateMicUI(false);
    };

    return true;
  }

  function startListening() {
    if (!recognition) {
      if (!initSpeechEngine()) {
        alert('Speech recognition is not supported in this browser. Please use Chrome or type your command below.');
        return;
      }
    }

    try {
      recognition.lang = selectedLang;
      recognition.start();
      isListening = true;
      updateMicUI(true);
    } catch (err) {
      if (err.name === 'InvalidStateError') {
        try { recognition.stop(); } catch(e){}
        setTimeout(() => {
          try {
            recognition.lang = selectedLang;
            recognition.start();
            isListening = true;
            updateMicUI(true);
          } catch(e){}
        }, 150);
      } else {
        isListening = false;
        updateMicUI(false);
      }
    }
  }

  function stopListening() {
    if (recognition && isListening) {
      try { recognition.stop(); } catch(e){}
    }
    isListening = false;
    updateMicUI(false);
  }

  function updateMicUI(listening) {
    const micBtn = document.getElementById('vaMicBtn');
    if (micBtn) {
      micBtn.style.transform = listening ? 'scale(1.08)' : 'scale(1)';
      micBtn.style.boxShadow = listening
        ? '0 0 0 10px rgba(46,125,50,0.25), 0 6px 16px rgba(46,125,50,0.5)'
        : '0 4px 12px rgba(46,125,50,0.35)';
    }
    const statusText = document.getElementById('vaStatusText');
    if (statusText) {
      const cfg = LANGS.find(l => l.code === selectedLang) || LANGS[0];
      statusText.textContent = listening ? 'Listening... Speak now!' : cfg.prompt;
      statusText.style.color = listening ? '#1B5E20' : '#2E7D32';
    }
  }

  // Render Dialog Content — Exact replica of Android VoiceAssistantDialog.kt UI
  function renderModalContent() {
    const modalEl = document.getElementById('vaModalCard');
    if (!modalEl) return;

    const currentLangCfg = LANGS.find(l => l.code === selectedLang) || LANGS[0];

    modalEl.innerHTML = `
      <!-- Header (Android Lines 165-185) -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:36px;height:36px;border-radius:50%;background:#E8F5E9;display:flex;align-items:center;justify-content:center;">
            <svg viewBox="0 0 24 24" fill="#2E7D32" style="width:20px;height:20px;">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </div>
          <span style="font-size:18px;font-weight:700;color:#1B5E20;">AI Voice Assistant</span>
        </div>
        <button id="vaCloseBtn" style="background:none;border:none;font-size:24px;cursor:pointer;color:#888;padding:4px 8px;line-height:1;">&times;</button>
      </div>

      <!-- Language Selector Chips (Android Lines 188-214) -->
      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;">
        ${LANGS.map(l => {
          const isSel = selectedLang === l.code;
          return `
            <button class="va-lang-chip" data-code="${l.code}" style="padding:6px 14px;border-radius:16px;border:none;background:${isSel ? '#2E7D32' : '#F1F8E9'};color:${isSel ? '#fff' : '#2E7D32'};font-size:12px;font-weight:700;cursor:pointer;transition:all 0.15s ease;">
              ${l.label}
            </button>
          `;
        }).join('')}
      </div>

      <!-- Big Mic Tap Button (Android Lines 217-228) -->
      <div style="margin:8px auto 10px;display:flex;justify-content:center;">
        <button id="vaMicBtn" style="width:76px;height:76px;border-radius:50%;background:#2E7D32;border:none;box-shadow:0 4px 12px rgba(46,125,50,0.35);cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;transition:all 0.2s ease;">
          <svg viewBox="0 0 24 24" fill="currentColor" style="width:38px;height:38px;">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
      </div>

      <!-- Prompt Text (Android Lines 230-239) -->
      <div id="vaStatusText" style="font-size:13px;font-weight:600;color:#2E7D32;margin-bottom:14px;">
        ${currentLangCfg.prompt}
      </div>

      <!-- Spoken Transcript Card (Android Lines 242-258) -->
      ${spokenText ? `
        <div style="background:#F9FBF9;border:1px solid #C8E6C9;border-radius:12px;padding:12px;margin-bottom:12px;font-size:14px;color:#333;text-align:center;">
          "${spokenText}"
        </div>
      ` : ''}

      <!-- Action Result Preview Card (Android Lines 261-285) -->
      ${parsedAction ? `
        <div style="background:${parsedAction.type === 'UNKNOWN' ? '#FFF3E0' : '#E8F5E9'};border:1px solid ${parsedAction.type === 'UNKNOWN' ? '#FFB74D' : '#81C784'};border-radius:12px;padding:12px;margin-bottom:14px;text-align:left;">
          <div style="font-size:11px;font-weight:700;color:${parsedAction.type === 'UNKNOWN' ? '#E65100' : '#1B5E20'};margin-bottom:4px;">
            ${parsedAction.type === 'UNKNOWN' ? '⚠️ Command Not Recognized' : '⚡ Action Detected (' + parsedAction.type + ')'}
          </div>
          <div style="font-size:14px;font-weight:700;color:#000;">
            ${parsedAction.displayMessage}
          </div>
        </div>

        <!-- Action Execution Button (Android Lines 288-315) -->
        ${(parsedAction.type !== 'UNKNOWN' && parsedAction.type !== 'BALANCE') ? `
          <button id="vaConfirmBtn" style="width:100%;height:48px;padding:13px 0;border-radius:12px;background:#2E7D32;color:#fff;border:none;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:14px;box-shadow:0 2px 8px rgba(46,125,50,0.3);transition:background 0.2s ease;">
            ${isExecuting ? 'Saving...' : (parsedAction.type === 'LOGIN' ? 'Login as Admin' : 'Confirm & Save')}
          </button>
        ` : ''}
      ` : ''}

      <!-- Helper Hint Card (Android Lines 318-328) -->
      <div style="font-size:11px;color:#666;text-align:left;white-space:pre-line;line-height:1.5;background:#fbfbfb;border-radius:10px;padding:10px;border:1px solid #eee;margin-bottom:12px;">
${getHelperHint(selectedLang)}
      </div>

      <!-- Fallback Manual Input -->
      <div style="border-top:1px solid #edf2ed;padding-top:10px;display:flex;gap:6px;align-items:center;">
        <input id="vaManualInput" type="text" placeholder="Or type voice command here..." style="flex:1;padding:8px 12px;border:1px solid #c8e6c9;border-radius:10px;font-size:12px;outline:none;background:#fafdfa;"/>
        <button id="vaManualSubmitBtn" style="padding:8px 14px;border-radius:10px;font-size:12px;background:#2E7D32;color:#fff;border:none;font-weight:700;cursor:pointer;">Go</button>
      </div>
    `;

    // Hook listeners
    modalEl.querySelector('#vaCloseBtn').onclick = closeModal;

    modalEl.querySelectorAll('.va-lang-chip').forEach(btn => {
      btn.onclick = () => {
        selectedLang = btn.getAttribute('data-code');
        renderModalContent();
        if (isListening) {
          stopListening();
          setTimeout(startListening, 200);
        }
      };
    });

    const micBtn = modalEl.querySelector('#vaMicBtn');
    if (micBtn) {
      micBtn.onclick = () => {
        if (isListening) stopListening();
        else startListening();
      };
    }

    const confirmBtn = modalEl.querySelector('#vaConfirmBtn');
    if (confirmBtn) {
      confirmBtn.onclick = async () => {
        if (isExecuting) return;
        isExecuting = true;
        confirmBtn.textContent = 'Saving...';
        confirmBtn.disabled = true;

        await executeAndroidVoiceAction(parsedAction, () => {
          isExecuting = false;
          closeModal();
          // Navigate to appropriate screen so user sees update immediately
          if (parsedAction.type === 'ATTENDANCE') navigate('/attendance-dashboard');
          else if (parsedAction.type === 'PAYMENT') navigate('/finance');
          else if (parsedAction.type === 'TASK') navigate('/admin-tasks');
          else renderRoute();
        });
      };
    }

    const manualInput = modalEl.querySelector('#vaManualInput');
    const manualBtn = modalEl.querySelector('#vaManualSubmitBtn');
    const runManual = () => {
      const val = manualInput.value.trim();
      if (val) handleSpokenResult(val);
    };
    if (manualBtn) manualBtn.onclick = runManual;
    if (manualInput) manualInput.onkeydown = (e) => { if (e.key === 'Enter') runManual(); };
  }

  function openModal() {
    closeModal();
    spokenText = '';
    parsedAction = null;
    isExecuting = false;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'voiceAssistantModal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;';

    const card = document.createElement('div');
    card.id = 'vaModalCard';
    card.style.cssText = 'background:#fff;border-radius:24px;max-width:390px;width:100%;padding:20px;box-shadow:0 8px 30px rgba(0,0,0,0.25);text-align:center;box-sizing:border-box;';

    overlay.appendChild(card);
    document.body.appendChild(overlay);

    overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

    renderModalContent();
  }

  function closeModal() {
    stopListening();
    const existing = document.getElementById('voiceAssistantModal');
    if (existing) existing.remove();
  }

  // Floating Mic Button — Accessible across all screens
  function renderFloatingButton() {
    if (document.getElementById('vaFloatingBtn')) return;
    const btn = document.createElement('button');
    btn.id = 'vaFloatingBtn';
    btn.className = 'va-floating-btn';
    btn.setAttribute('title', 'AI Voice Assistant (English / \u0C24\u0C46\u0C32\u0C41\u0C17\u0C41 / \u0939\u093F\u0902\u0926\u0940)');
    btn.setAttribute('aria-label', 'AI Voice Assistant');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor" style="width:28px;height:28px">
        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5-3c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
      </svg>
      <span class="va-btn-pulse"></span>`;
    btn.onclick = openModal;
    document.body.appendChild(btn);
  }

  function init() {
    initSpeechEngine();
  }

  const exported = {
    init,
    openModal,
    closeModal,
    renderFloatingButton,
    parseMultilingualIntent,
    executeAndroidVoiceAction
  };

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
