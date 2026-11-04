// ============================================================
//  SmartFarm Web — Multilingual AI Voice Assistant
//  Supports: English (en-IN), Telugu (te-IN), Hindi (hi-IN)
//  Voice-to-Action: Attendance, Payments, Tasks, Balance Inquiries
// ============================================================

const VoiceAssistant = (() => {
  let recognition = null;
  let isListening = false;
  let currentLang = 'en-IN'; // 'en-IN', 'te-IN', 'hi-IN'
  let synth = window.speechSynthesis;

  const LANG_CONFIG = {
    'en-IN': { label: 'English', flag: '🇬🇧', hint: 'e.g. "Pay 500 to Kumar" or "Mark Meena present"' },
    'te-IN': { label: 'తెలుగు', flag: '🇮🇳', hint: 'ఉదా: "కుమార్ కి 500 పేమెంట్" లేదా "మీనా ప్రెసెంట్"' },
    'hi-IN': { label: 'हिंदी', flag: '🇮🇳', hint: 'उदा: "कुमार को 500 रुपये पेमेंट" या "मीना प्रेजेंट"' }
  };

  // Common Telugu/Hindi name phonetics to match worker English names
  const PHONETIC_MAP = {
    'కుమార్': 'kumar', 'कुमार': 'kumar',
    'మీనా': 'meena', 'मीना': 'meena',
    'రమేష్': 'ramesh', 'రమేశ్': 'ramesh', 'रमेश': 'ramesh',
    'రాజు': 'raju', 'राजू': 'raju',
    'సునీత': 'sunita', 'सुनीता': 'sunita',
    'లీల': 'leela', 'लीला': 'leela',
    'కుసుమ': 'kusuma', 'कुसुमा': 'kusuma',
    'మాబుని': 'mabuni', 'माबुनी': 'mabuni',
    'సబీనా': 'sabina', 'सबीना': 'sabina',
    'లత': 'latha', 'लता': 'latha',
    'కృష్ణ': 'krishna', 'క్రిష్ణ': 'krishna', 'कृष्णा': 'krishna',
    'రామన్న': 'ramana', 'రమణ': 'ramana', 'रमाना': 'ramana',
    'రామ్మోహన్': 'rammohan', 'రామ్ మోహన్': 'rammohan', 'राममोहन': 'rammohan'
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
      updateModalStatus("🎙️ Listening... Speak now!");
    };

    recognition.onspeechstart = () => {
      updateModalStatus("🗣️ Hearing your voice...");
    };

    recognition.onspeechend = () => {
      updateModalStatus("⏳ Processing speech...");
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
        updateModalStatus("👂 No speech heard. Tap the mic to speak.");
      } else if (event.error === 'not-allowed') {
        updateModalStatus("🔒 Mic is blocked. In Chrome, click 🔒 icon in address bar to Allow.");
      } else if (event.error === 'audio-capture') {
        updateModalStatus("⚠️ No microphone hardware found.");
      } else if (event.error === 'network') {
        updateModalStatus("⚠️ Network error contacting Google speech service.");
      } else {
        updateModalStatus(`ℹ️ Tap mic to speak (${event.error})`);
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
    return live || DEMO_WORKERS;
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
    const teluguDigits = {'౦':'0','౧':'1','౨':'2','౩':'3','౪':'4','౫':'5','౬':'6','౭':'7','౮':'8','౯':'9'};
    const hindiDigits = {'०':'0','१':'1','२':'2','३':'3','४':'4','५':'5','६':'6','७':'7','८':'8','९':'9'};
    
    let normalized = text;
    for (let [k, v] of Object.entries(teluguDigits)) normalized = normalized.replaceAll(k, v);
    for (let [k, v] of Object.entries(hindiDigits)) normalized = normalized.replaceAll(k, v);

    const match = normalized.match(/\b\d+(\.\d+)?\b/);
    if (match) return parseFloat(match[0]);

    // Spoken number words
    const words = { 'hundred': 100, 'two hundred': 200, 'three hundred': 300, 'four hundred': 400, 'five hundred': 500, 'thousand': 1000,
                    'వంద': 100, 'రెండు వందలు': 200, 'ఐదు వందలు': 500, 'వేయి': 1000, 'వెయ్యి': 1000,
                    'सौ': 100, 'दो सौ': 200, 'पांच सौ': 500, 'हजार': 1000 };
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
    const isLogin = text.includes('login') || text.includes('లాగిన్') || text.includes('लॉगिन') ||
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
      'ఆబ్సెంట్', 'రాలేదు', 'రాలా', 'రాలే', 'సెలవు', 'డుమ్మా', 'గైర్హాజరు', 'లేడు', 'లేదు',
      'अनुपस्थित', 'नहीं आया', 'नहीं आई', 'छुट्टी', 'गायब', 'नागा'
    ];
    const presentKeywords = [
      'present', 'came', 'attended', 'came today', 'at work', 'is here',
      'హాజరు', 'ప్రెసెంట్', 'వచ్చాడు', 'వచ్చింది', 'వచ్చారు', 'ఉన్నాడు', 'ఉంది', 'పనిలో ఉన్నాడు',
      'उपस्थित', 'हाजिरी', 'आया', 'आई', 'आया है', 'काम पर है', 'प्रेजेंट'
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

    // 2. PAYMENT INTENT (Handles wages, advances, informal currency & slang like కూలి, పైసలు, मजदूरी)
    const paymentKeywords = [
      'pay', 'payment', 'paid', 'gave', 'give', 'rupees', 'rs', 'salary', 'wage', 'advance', 'money',
      'పేమెంట్', 'రూపాయలు', 'రూపాయి', 'పైసలు', 'పైసల్', 'డబ్బులు', 'డబ్బు', 'చెల్లించు', 'ఇచ్చాను', 'ఇవ్వు', 'కూలి', 'జీతం', 'అడ్వాన్స్', 'రాసుకో', 'ఖాతా',
      'पेमेंट', 'रुपये', 'रुपया', 'पैसे', 'वेतन', 'मजदूरी', 'दे दिए', 'दिया', 'देना', 'एडवांस', 'खाता'
    ];
    const isPayment = paymentKeywords.some(k => text.includes(k) || transcript.includes(k));
    const amount = extractAmount(transcript);
    if (isPayment && worker && amount) {
      return {
        type: 'PAYMENT',
        worker,
        amount,
        description: `Record ₹${amount} payment for ${worker.name}`
      };
    }

    // 3. BALANCE / DUES INQUIRY (Colloquial: "బాకీ ఎంత?", "ఎంత ఇవ్వాలి?", "कितना बाकी है?")
    const balanceKeywords = [
      'balance', 'due', 'dues', 'pending', 'earned', 'owed', 'how much left', 'how much owe', 'account',
      'బ్యాలెన్స్', 'బాకీ', 'ఎంత ఉంది', 'ఎంత ఇవ్వాలి', 'ఎంత రావాలి', 'మిగిలింది', 'లెక్క', 'ఎంతైంది', 'పైసలు ఎన్ని',
      'बैलेंस', 'बाकी', 'बकाया', 'कितना हुआ', 'कितना बाकी', 'कितना देना', 'हिसाब'
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
          ? `${targetWorker.name} — Demo Mode (start server for live data)`
          : `${targetWorker.name}'s balance due is ₹${Math.round(due)} (Earned: ₹${Math.round(earned)}, Paid: ₹${Math.round(paid)})`;
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
      'పని', 'టాస్క్', 'కేటాయించు', 'చెయ్యమను', 'చెయ్యాలి', 'ఇవ్వు',
      'काम', 'टास्क', 'सौंपो', 'जिम्मा'
    ];
    const isTask = taskKeywords.some(k => text.includes(k) || transcript.includes(k));
    if (isTask && worker) {
      let taskDesc = transcript
        .replace(new RegExp(worker.name, 'gi'), '')
        .replace(/assign task|add task|task for|give task|task|duty|work|పని|కేటాయించు|కామ్|काम|सौंपो/gi, '')
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
    if (text.includes('worker') || text.includes('వర్కర్') || text.includes('मजदूर')) {
      return { type: 'NAVIGATE', path: '/worker-list', description: 'Open Worker Management' };
    }
    if (text.includes('finance') || text.includes('ఫైనాన్స్') || text.includes('payment list')) {
      return { type: 'NAVIGATE', path: '/finance', description: 'Open Finance Summary' };
    }
    if (text.includes('dashboard') || text.includes('హోమ్') || text.includes('home')) {
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
        ? "అడ్మిన్ గా లాగిన్ అవుతున్నారు." 
        : (currentLang === 'hi-IN' ? "एडमिन के रूप में लॉगिन हो रहा है." : "Logging in as Admin.");
      speak(feedback);
      return;
    }

    if (action.type === 'ATTENDANCE') {
      const isDemo = action.worker._isDemo;
      if (isDemo) {
        const statusLabel = action.status === 'Present' ? '✅ Present' : '❌ Absent';
        showToast(`[Demo] ${action.worker.name} marked ${statusLabel} — start server to save`);
        const feedback = currentLang === 'te-IN'
          ? `డెమో మోడ్: ${action.worker.name} ${action.status === 'Present' ? 'ప్రెసెంట్' : 'ఆబ్సెంట్'} గా గుర్తించబడింది.`
          : (currentLang === 'hi-IN' ? `डेमो मोड: ${action.worker.name} को ${action.status === 'Present' ? 'उपस्थित' : 'अनुपस्थित'} दर्ज किया गया.` : `Demo: ${action.worker.name} marked as ${action.status}.`);
        speak(feedback);
      } else {
        const today = todayISO();
        await API.submitAttendance({ worker: action.worker.id, date: today, status: action.status });
        await refreshAll();
        showToast(`Attendance Marked: ${action.worker.name} (${action.status}) ✅`);
        const feedback = currentLang === 'te-IN'
          ? `${action.worker.name} కి హాజరు ${action.status === 'Present' ? 'ప్రెసెంట్' : 'ఆబ్సెంట్'} గా నమోదు చేయబడింది.`
          : (currentLang === 'hi-IN' ? `${action.worker.name} की हाजिरी दर्ज हो गई है.` : `Marked ${action.worker.name} as ${action.status}.`);
        speak(feedback);
      }
    } else if (action.type === 'PAYMENT') {
      const isDemo = action.worker._isDemo;
      if (isDemo) {
        showToast(`[Demo] ₹${action.amount} payment for ${action.worker.name} — start server to save`);
        const feedback = currentLang === 'te-IN'
          ? `డెమో మోడ్: ${action.worker.name} కి ${action.amount} రూపాయల చెల్లింపు గుర్తించబడింది.`
          : (currentLang === 'hi-IN' ? `डेमो मोड: ${action.worker.name} को ${action.amount} रुपये दर्ज किया गया.` : `Demo: ₹${action.amount} payment for ${action.worker.name} recognized.`);
        speak(feedback);
      } else {
        await API.addPayment({ worker: action.worker.id, amount: action.amount, description: 'Voice Payment' });
        await refreshAll();
        showToast(`Payment of ₹${action.amount} recorded for ${action.worker.name}! 💰`);
        const feedback = currentLang === 'te-IN'
          ? `${action.worker.name} కి ${action.amount} రూపాయల చెల్లింపు నమోదు చేయబడింది.`
          : (currentLang === 'hi-IN' ? `${action.worker.name} को ${action.amount} रुपये का भुगतान दर्ज हुआ.` : `Recorded payment of ₹${action.amount} for ${action.worker.name}.`);
        speak(feedback);
      }
    } else if (action.type === 'TASK') {
      const isDemo = action.worker._isDemo;
      if (isDemo) {
        showToast(`[Demo] Task assigned to ${action.worker.name} — start server to save`);
        speak(currentLang === 'te-IN' ? `డెమో మోడ్: ${action.worker.name} కి పని గుర్తించబడింది.` : `Demo: Task for ${action.worker.name} recognized.`);
      } else {
        await API.addTask({ worker: action.worker.id, description: action.taskDesc });
        await refreshAll();
        showToast(`Task assigned to ${action.worker.name}! 📋`);
        const feedback = currentLang === 'te-IN'
          ? `${action.worker.name} కి పని కేటాయించబడింది.`
          : (currentLang === 'hi-IN' ? `${action.worker.name} को काम दिया गया.` : `Task assigned to ${action.worker.name}.`);
        speak(feedback);
      }
    } else if (action.type === 'BALANCE') {
      const feedback = action.isDemo
        ? (currentLang === 'te-IN' ? `సర్వర్ నడపకుండా బ్యాలెన్స్ డేటా అందుబాటులో లేదు.` : `Balance data needs the server to be running.`)
        : (currentLang === 'te-IN'
          ? `${action.worker.name} బ్యాలెన్స్ బాకీ ${Math.round(action.due)} రూపాయలు.`
          : (currentLang === 'hi-IN' ? `${action.worker.name} का बाकी बैलेंस ${Math.round(action.due)} रुपये है.` : `${action.worker.name}'s balance due is ₹${Math.round(action.due)}.`));
      speak(feedback);
    } else if (action.type === 'NAVIGATE') {
      navigate(action.path);
      speak(`Navigating to ${action.description}`);
    }
  }

  // Handle Speech Transcript Result
  function handleSpeechResult(transcript) {
    const transcriptEl = document.getElementById('vaTranscript');
    const resultCardEl = document.getElementById('vaResultCard');
    const executeBtn = document.getElementById('vaExecuteBtn');

    if (transcriptEl) transcriptEl.textContent = `"${transcript}"`;

    const action = parseIntent(transcript);

    if (resultCardEl) {
      if (action.type === 'UNKNOWN') {
        resultCardEl.innerHTML = `
          <div style="color:var(--orange);font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px">
            ⚠️ <span>Command not recognized.</span>
          </div>
          <div style="font-size:12px;color:var(--gray-text);margin-top:4px">
            Try: <b>"Mark Ramesh present"</b>, <b>"Pay 500 to Kumar"</b> or <b>"Meena absent"</b>
          </div>`;
        if (executeBtn) executeBtn.style.display = 'none';
        speak(currentLang === 'te-IN' ? "కమాండ్ అర్థం కాలేదు, దయచేసి మళ్ళీ చెప్పండి." : "Could not understand command. Please try again.");
      } else {
        const isDemo = action.worker && action.worker._isDemo;
        const badgeColor = action.type === 'ATTENDANCE' ? 'var(--blue)' : (action.type === 'PAYMENT' ? 'var(--green-primary)' : 'var(--orange)');
        resultCardEl.innerHTML = `
          <div style="font-size:11px;font-weight:700;color:${badgeColor};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px">
            ⚡ Detected Action (${action.type})
          </div>
          <div style="font-size:15px;font-weight:700;color:var(--green-dark)">
            ${action.description}
          </div>
          ${isDemo ? `<div style="font-size:11px;color:#e65100;margin-top:4px">⚠️ Demo mode — start Django server to save real data</div>` : ''}`;
        if (executeBtn) {
          executeBtn.style.display = 'block';
          executeBtn.onclick = async () => {
            executeBtn.textContent = 'Executing...';
            executeBtn.disabled = true;
            await executeAction(action);
            closeModal();
          };
        }
        // Auto-execute after 1.5s if it's high confidence
        setTimeout(async () => {
          if (document.getElementById('voiceAssistantModal')) {
            await executeAction(action);
            closeModal();
          }
        }, 1800);
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
      updateModalStatus("🎙️ Listening... Speak now!");
      const resultCardEl = document.getElementById('vaResultCard');
      if (resultCardEl) resultCardEl.innerHTML = `<div style="font-size:11px;color:var(--gray-text)">💡 ${LANG_CONFIG[currentLang].hint}</div>`;
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
            <span style="font-size:22px">🎙️</span>
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
          <div style="font-size:11px;color:var(--gray-text)">💡 ${LANG_CONFIG[currentLang].hint}</div>
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
        if (resCard) resCard.innerHTML = `<div style="font-size:11px;color:var(--gray-text)">💡 ${LANG_CONFIG[currentLang].hint}</div>`;
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
    btn.setAttribute('title', 'AI Voice Assistant (తెలుగు / Hindi / English)');
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

