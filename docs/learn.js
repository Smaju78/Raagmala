/* রাগমালা Raagmala · শিক্ষা Learn: a riyaz room for the voice.
   Checkpoint 1, the tools: your Sa, a tanpura drone (synthesised with Web Audio, no recordings), a swara meter
   (microphone pitch, measured against the tanpura's just intonation, never recorded or sent) and a practice log
   kept with the other preferences (so it syncs when signed in). Uses the globals of app.js. */
const learn = (() => {
  Object.assign(STR.en, {
    learnTitle: "Riyaz room", learnIntro: "Set your Sa, start the tanpura and sing against the swara meter. Your practice time is logged by itself.",
    courseHead: "The course", c1: "Riyaz tools: Sa, tanpura, swara meter", c2: "Placement check: where your voice is today", c3: "Raag Bhupali, unit 1",
    youAreHere: "you are here", comingNext: "coming next",
    saHead: "Your Sa", saHint: "The pitch you sing Sa on, named as on a harmonium: White 1 = C, Black 1 = C#… Men often sing Sa at C#–D, women at G#–A#.",
    saPick: "Pick your Sa to start.", white: "White", black: "Black",
    findSa: "Find it by singing", findSaRun: "Sing a relaxed “aa” on the note you'd start a song on…",
    findSaGot: (o) => `That sounds like ${o.n}.`, findSaNone: "Couldn't hear a steady note. Try again a little louder, close to the microphone.",
    useIt: "Use it", cancel: "Cancel",
    tanHead: "Tanpura", tanPlay: "Start tanpura", tanStop: "Stop tanpura", tanFirst: "First string",
    firstP: "Pa · most raags", firstm: "Ma · raags without Pa", firstN: "Ni · without Pa and Ma",
    tempo: "Speed", slow: "Slow", med: "Medium", fast: "Fast", volume: "Volume",
    tanHint: "Made in your browser. With headphones the swara meter hears only you.",
    meterHead: "Swara meter", micOn: "Start listening", micOff: "Stop listening",
    micHint: "Uses the microphone only while it's on; nothing is recorded or sent anywhere. Notes are measured against the tanpura's natural (just) tuning; 100 cents = one semitone.",
    micDenied: "The microphone is blocked. Allow it for this site from the browser's address bar, then try again.",
    micNone: "No microphone was found.", singNow: "Sing a note…",
    low: "low", high: "high", inTune: "in tune", mandra: "lower octave", madhya: "middle octave", taar: "upper octave",
    komal: "komal", tivra: "tivra", cents: (o) => `${o.c} cents`,
    steady: (o) => `Steady within ±${o.c} cents`, wavering: (o) => `Wavering, ±${o.c} cents`,
    logHead: "Practice log", logToday: (o) => `${o.m} of ${o.g} minutes today`,
    logStreak: (o) => `${o.n}-day streak`, logNoStreak: "Start a streak today",
    logHint: "Counted while the tanpura or the swara meter is on.", logSynced: "Kept with your account.",
    logLocal: "Kept in this browser; sign in to keep it on every device.", last14: "Last 14 days",
    dayMin: (o) => `${o.d}: ${o.m} min`,
  });
  Object.assign(STR.bn, {
    learnTitle: "রেওয়াজ ঘর", learnIntro: "নিজের সা ঠিক করুন, তানপুরা চালান, আর স্বর-মিটার দেখে গান। অনুশীলনের সময় নিজে থেকেই লেখা হয়।",
    courseHead: "পাঠক্রম", c1: "রেওয়াজের সরঞ্জাম: সা, তানপুরা, স্বর-মিটার", c2: "যাচাই: আপনার গলা এখন কোথায়", c3: "রাগ ভূপালি, প্রথম পাঠ",
    youAreHere: "এখন এখানে", comingNext: "এর পরে",
    saHead: "আপনার সা", saHint: "যে সুরে আপনি সা ধরেন, হারমোনিয়ামের নামে: সাদা ১ = C, কালো ১ = C#… পুরুষেরা সাধারণত C#–D-তে, মহিলারা G#–A#-তে সা ধরেন।",
    saPick: "শুরু করতে আপনার সা বেছে নিন।", white: "সাদা", black: "কালো",
    findSa: "গেয়ে খুঁজে নিন", findSaRun: "যে সুরে গান ধরেন, সেই সুরে আরাম করে “আ” গান…",
    findSaGot: (o) => `মনে হচ্ছে ${o.n}।`, findSaNone: "স্থির কোনো সুর শোনা গেল না। মাইক্রোফোনের কাছে আর একটু জোরে আবার চেষ্টা করুন।",
    useIt: "এটাই রাখুন", cancel: "বাতিল",
    tanHead: "তানপুরা", tanPlay: "তানপুরা চালান", tanStop: "তানপুরা থামান", tanFirst: "প্রথম তার",
    firstP: "পা · বেশির ভাগ রাগ", firstm: "মা · পা-বর্জিত রাগ", firstN: "না · পা ও মা-বর্জিত",
    tempo: "লয়", slow: "ধীর", med: "মধ্য", fast: "দ্রুত", volume: "আওয়াজ",
    tanHint: "আপনার ব্রাউজারেই তৈরি সুর। হেডফোন পরলে স্বর-মিটার শুধু আপনার গলা শোনে।",
    meterHead: "স্বর-মিটার", micOn: "শোনা শুরু করুন", micOff: "শোনা বন্ধ করুন",
    micHint: "চালু থাকলেই শুধু মাইক্রোফোন ব্যবহার হয়; কিছু রেকর্ড হয় না, কোথাও পাঠানো হয় না। স্বর মাপা হয় তানপুরার স্বাভাবিক সুরের সাপেক্ষে; ১০০ সেন্ট = এক পর্দা।",
    micDenied: "মাইক্রোফোন বন্ধ করা আছে। ব্রাউজারের ঠিকানার ঘর থেকে এই সাইটকে অনুমতি দিয়ে আবার চেষ্টা করুন।",
    micNone: "কোনো মাইক্রোফোন পাওয়া গেল না।", singNow: "একটি স্বর গান…",
    low: "নিচু", high: "উঁচু", inTune: "সুরে", mandra: "মন্দ্র সপ্তক", madhya: "মধ্য সপ্তক", taar: "তার সপ্তক",
    komal: "কোমল", tivra: "তীব্র", cents: (o) => `${o.c} সেন্ট`,
    steady: (o) => `স্থির, ±${o.c} সেন্টের মধ্যে`, wavering: (o) => `কাঁপছে, ±${o.c} সেন্ট`,
    logHead: "অনুশীলনের খাতা", logToday: (o) => `আজ ${o.g} মিনিটের মধ্যে ${o.m} মিনিট`,
    logStreak: (o) => `টানা ${o.n} দিন`, logNoStreak: "আজ থেকে টানা অনুশীলন শুরু করুন",
    logHint: "তানপুরা বা স্বর-মিটার চালু থাকলে সময় গোনা হয়।", logSynced: "আপনার অ্যাকাউন্টে রাখা থাকে।",
    logLocal: "এই ব্রাউজারে রাখা থাকে; সব ডিভাইসে পেতে সাইন ইন করুন।", last14: "শেষ ১৪ দিন",
    dayMin: (o) => `${o.d}: ${o.m} মিনিট`,
  });

  /* ---------------- settings and log (prefs.learn) ---------------- */
  const GOAL = 30; // minutes a day
  const P = () => {
    const d = { sa: null, first: "P", tempo: 1, vol: 0.6, log: {} };
    prefs.learn = { ...d, ...(prefs.learn || {}) };
    return prefs.learn;
  };
  const SA = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  const HARM = [[0, 1], [1, 1], [0, 2], [1, 2], [0, 3], [0, 4], [1, 3], [0, 5], [1, 4], [0, 6], [1, 5], [0, 7]]; // [black?, number]
  const harmName = (i) => `${t(HARM[i][0] ? "black" : "white")} ${num(HARM[i][1])}`;
  const saHz = (i) => 220 * 2 ** ((i - 9) / 12); // the octave from C3 (131 Hz) to B3 (247 Hz)
  // Just intonation of the twelve swaras in cents above Sa (S r R g G m M P d D n N)
  const JUST = [0, 112, 204, 316, 386, 498, 590, 702, 814, 884, 996, 1088];
  const FIRST = { P: 3 / 4, m: 2 / 3, N: 15 / 16 }; // first string, in the lower octave
  const UNIT = [1.25, 1.0, 0.8]; // seconds between plucks: slow, medium, fast
  const SW_EN = { S: "Sa", r: "Re", R: "Re", g: "Ga", G: "Ga", m: "Ma", M: "Ma", P: "Pa", d: "Dha", D: "Dha", n: "Ni", N: "Ni" };
  const swName = (n) => (L === "bn" ? SW_BN[n] : SW_EN[n]);
  const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  /* ---------------- audio ---------------- */
  let ctx = null, master = null;
  function audio() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = P().vol;
      // a little room: a short generated reverb under the dry sound
      const conv = ctx.createConvolver(), wet = ctx.createGain(), len = Math.floor(ctx.sampleRate * 2.2);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3; }
      conv.buffer = ir; wet.gain.value = 0.18;
      master.connect(ctx.destination); master.connect(conv); conv.connect(wet); wet.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  // One tanpura pluck: harmonics with a travelling brightness (the jawari's buzz sweeping up through the partials).
  const pluckCache = new Map();
  function pluck(f) {
    const key = f.toFixed(2);
    if (pluckCache.has(key)) return pluckCache.get(key);
    const sr = 22050, dur = 6, N = sr * dur, out = new Float32Array(N), env = new Float32Array(N);
    for (let n = 0; n < N; n++) { const tt = n / sr; env[n] = (1 - Math.exp(-tt / 0.006)) * Math.exp(-tt / 3.2); }
    const K = Math.min(36, Math.floor(5000 / f));
    for (let k = 1; k <= K; k++) {
      const w = 2 * Math.PI * k * f / sr, c2 = 2 * Math.cos(w), ph = Math.random() * 2 * Math.PI;
      let s1 = Math.sin(ph), s0 = Math.sin(ph - w);
      const base = (k === 1 ? 0.7 : 1) / k ** 0.65, ck = 0.1 + 0.075 * k;
      let amp = 0;
      for (let n = 0; n < N; n++) {
        if ((n & 31) === 0) { const tt = n / sr; amp = base * (k <= 2 ? 1 : 0.18 + 0.82 * Math.exp(-(((tt - ck) / 0.5) ** 2))); }
        const s = c2 * s1 - s0; s0 = s1; s1 = s;
        out[n] += amp * env[n] * s;
      }
    }
    let peak = 0; for (let n = 0; n < N; n++) peak = Math.max(peak, Math.abs(out[n]));
    for (let n = 0; n < N; n++) out[n] *= 0.45 / peak;
    const buf = ctx.createBuffer(1, N, sr);
    buf.copyToChannel ? buf.copyToChannel(out, 0) : buf.getChannelData(0).set(out);
    pluckCache.set(key, buf);
    return buf;
  }

  const tan = { on: false, bus: null, timer: null, next: 0, i: 0 };
  function tanStart() {
    const p = P();
    if (p.sa == null) return;
    audio();
    try { jb.pause(); } catch { /* jukebox not ready */ }
    tan.bus = ctx.createGain(); tan.bus.connect(master);
    tan.on = true; tan.i = 0; tan.next = ctx.currentTime + 0.1;
    const tick = () => {
      const q = P(), sa = saHz(q.sa), u = UNIT[q.tempo] || 1;
      const strings = [sa * (FIRST[q.first] || 0.75), sa, sa, sa / 2], gaps = [1, 1, 1, 1.6];
      while (tan.next < ctx.currentTime + 0.35) {
        const src = ctx.createBufferSource(), g = ctx.createGain();
        src.buffer = pluck(strings[tan.i]);
        g.gain.value = 0.85 + Math.random() * 0.2;
        src.connect(g); g.connect(tan.bus);
        const at = tan.next + (Math.random() - 0.5) * 0.03;
        src.start(at); src.stop(at + 6);
        tan.next += gaps[tan.i] * u;
        tan.i = (tan.i + 1) % 4;
      }
    };
    tick();
    tan.timer = setInterval(tick, 100);
    activity();
  }
  function tanStop() {
    if (!tan.on) return;
    tan.on = false;
    clearInterval(tan.timer);
    const bus = tan.bus;
    bus.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
    setTimeout(() => bus.disconnect(), 1500);
    activity();
  }

  /* ---------------- pitch (YIN) ---------------- */
  function detect(x, sr) {
    let rms = 0; for (let i = 0; i < x.length; i++) rms += x[i] * x[i];
    rms = Math.sqrt(rms / x.length);
    if (rms < 0.01) return null;
    const W = x.length >> 1, tMin = Math.floor(sr / 1000), tMax = Math.min(W - 1, Math.floor(sr / 60));
    const d = new Float32Array(tMax + 1);
    for (let tau = 1; tau <= tMax; tau++) { let s = 0; for (let j = 0; j < W; j++) { const v = x[j] - x[j + tau]; s += v * v; } d[tau] = s; }
    let run = 0; d[0] = 1;
    for (let tau = 1; tau <= tMax; tau++) { run += d[tau]; d[tau] = run ? d[tau] * tau / run : 1; }
    let tau = -1;
    for (let k = tMin; k < tMax; k++) if (d[k] < 0.15) { while (k + 1 < tMax && d[k + 1] < d[k]) k++; tau = k; break; }
    if (tau < 0) return null;
    const a = d[tau - 1], b = d[tau], c = d[tau + 1], den = a + c - 2 * b;
    const ref = den ? tau + (a - c) / (2 * den) : tau;
    return sr / ref;
  }
  // cents above Sa -> nearest swara of the just scale
  function swaraOf(cents) {
    let oct = Math.floor(cents / 1200), r = cents - oct * 1200, best = 0, dev = r;
    for (let i = 1; i <= 12; i++) { const j = i === 12 ? 1200 : JUST[i]; if (Math.abs(r - j) < Math.abs(dev)) { best = i; dev = r - j; } }
    if (best === 12) { best = 0; oct++; }
    return { n: NOTES[best], i: best, oct, dev };
  }

  /* ---------------- swara meter ---------------- */
  const mic = { on: false, stream: null, src: null, an: null, raf: 0, buf: null, hist: [], trace: [], err: "", last: 0 };
  async function micStart() {
    mic.err = "";
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { mic.err = "micNone"; return paintMeter(); }
    audio();
    try {
      mic.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false } });
    } catch (e) {
      mic.err = e && e.name === "NotFoundError" ? "micNone" : "micDenied";
      return paintMeter();
    }
    try { jb.pause(); } catch { /* jukebox not ready */ }
    attach(ctx.createMediaStreamSource(mic.stream));
  }
  // Listen to any audio node (the microphone, or a test oscillator).
  function attach(node) {
    audio();
    mic.src = node;
    mic.an = ctx.createAnalyser(); mic.an.fftSize = 2048;
    node.connect(mic.an);
    mic.buf = new Float32Array(mic.an.fftSize);
    mic.on = true; mic.hist = []; mic.trace = [];
    activity();
    const loop = (ts) => {
      if (!mic.on) return;
      mic.raf = requestAnimationFrame(loop);
      if (ts - mic.last < 33) return; // ~30 readings a second
      mic.last = ts;
      mic.an.getFloatTimeDomainData(mic.buf);
      const f = detect(mic.buf, ctx.sampleRate), now = performance.now() / 1000, p = P();
      let c = null;
      if (f && p.sa != null) {
        mic.hist.push(1200 * Math.log2(f / saHz(p.sa)));
        if (mic.hist.length > 5) mic.hist.shift();
        c = [...mic.hist].sort((a, b) => a - b)[mic.hist.length >> 1]; // median of the last few: no single-frame jumps
      } else mic.hist = [];
      mic.trace.push({ t: now, c });
      while (mic.trace.length && mic.trace[0].t < now - 12) mic.trace.shift();
      if (findSa.on) findSa.take(f);
      paintMeter();
    };
    mic.raf = requestAnimationFrame(loop);
    paintMeter();
  }
  function micStop() {
    if (!mic.on && !mic.stream) return;
    mic.on = false;
    cancelAnimationFrame(mic.raf);
    try { mic.src && mic.src.disconnect(); } catch { /* already */ }
    if (mic.stream) mic.stream.getTracks().forEach((tr) => tr.stop());
    mic.stream = null; mic.src = null;
    findSa.on = false;
    activity();
  }

  // "Find it by singing": three seconds of a comfortable note -> the nearest semitone, folded into C3–B3
  const findSa = {
    on: false, pts: [], until: 0, result: null,
    async start() {
      this.result = null; this.pts = []; this.on = true; this.until = performance.now() + 3500;
      this.ownMic = !mic.on; // the microphone was turned on just for this: turn it off again afterwards
      if (!mic.on) await micStart();
      if (!mic.on) { this.on = false; }
      paintSa();
    },
    take(f) {
      if (f) this.pts.push(f);
      if (performance.now() < this.until) return;
      this.on = false;
      if (this.pts.length < 25) this.result = -1;
      else {
        const m = this.pts.sort((a, b) => a - b)[this.pts.length >> 1];
        this.result = ((Math.round(12 * Math.log2(m / 261.63)) % 12) + 12) % 12;
      }
      if (this.ownMic) setTimeout(micStop);
      paintSa();
    },
  };

  /* ---------------- practice time ---------------- */
  let pending = 0, clock = 0;
  function activity() {
    const busy = tan.on || mic.on;
    if (busy && !clock) clock = setInterval(() => { pending++; if (pending >= 30) flush(); else paintLogToday(); }, 1000);
    if (!busy && clock) { clearInterval(clock); clock = 0; flush(); }
    paintButtons();
  }
  function flush() {
    if (!pending) return;
    const p = P(), d = today();
    p.log[d] = (p.log[d] || 0) + pending;
    pending = 0;
    const cut = today(new Date(Date.now() - 400 * 864e5));
    for (const k of Object.keys(p.log)) if (k < cut) delete p.log[k];
    savePrefs();
    paintLog();
  }
  addEventListener("pagehide", flush);
  const minutesOn = (d) => Math.floor(((P().log[d] || 0) + (d === today() ? pending : 0)) / 60);
  function streak() {
    let n = 0, d = new Date();
    if (minutesOn(today(d)) < 5) d = new Date(d.getTime() - 864e5); // today not done yet: count up to yesterday
    while (minutesOn(today(d)) >= 5) { n++; d = new Date(d.getTime() - 864e5); }
    return n;
  }

  /* ---------------- page ---------------- */
  const shown = () => document.body.dataset.screen === "learn" && $("#learn");
  function render() {
    const p = P();
    view.innerHTML = `<div class="pagehead"><div class="orn">${t("navLearn")}</div><h1 style="margin-top:12px">${t("learnTitle")}</h1><p class="lede">${t("learnIntro")}</p></div>
    <div id="learn" class="learn">
      <section class="lcard course" aria-labelledby="h-course"><h2 id="h-course">${t("courseHead")}</h2>
        <ol class="steps">
          <li class="cur"><b>${t("c1")}</b><small>${t("youAreHere")}</small></li>
          <li><b>${t("c2")}</b><small>${t("comingNext")}</small></li>
          <li><b>${t("c3")}</b><small>${t("comingNext")}</small></li>
        </ol></section>
      <section class="lcard" aria-labelledby="h-sa"><h2 id="h-sa">${t("saHead")}</h2>
        <div class="sa-grid" role="radiogroup" aria-labelledby="h-sa">${SA.map((n, i) => `<button type="button" role="radio" class="sa${HARM[i][0] ? " blk" : ""}" data-sa="${i}" aria-checked="${p.sa === i}"><b>${n}</b><small>${harmName(i)}</small></button>`).join("")}</div>
        <p class="hint" id="sa-now"></p>
        <div class="find" id="find-sa"></div>
        <p class="hint">${t("saHint")}</p>
      </section>
      <section class="lcard" aria-labelledby="h-tan"><h2 id="h-tan">${t("tanHead")}</h2>
        <button class="btn" type="button" id="tan-btn"></button>
        <div class="opt"><span class="lbl" id="l-first">${t("tanFirst")}</span><div class="chips wrap" role="radiogroup" aria-labelledby="l-first">
          ${["P", "m", "N"].map((k) => `<button type="button" role="radio" class="chip sm" data-first="${k}" aria-checked="${p.first === k}">${t("first" + k)}</button>`).join("")}</div></div>
        <div class="opt"><span class="lbl" id="l-tempo">${t("tempo")}</span><div class="chips wrap" role="radiogroup" aria-labelledby="l-tempo">
          ${["slow", "med", "fast"].map((k, i) => `<button type="button" role="radio" class="chip sm" data-tempo="${i}" aria-checked="${p.tempo === i}">${t(k)}</button>`).join("")}</div></div>
        <label class="opt"><span class="lbl">${t("volume")}</span><input type="range" id="tan-vol" min="0" max="1" step="0.05" value="${p.vol}"></label>
        <p class="hint">${t("tanHint")}</p>
      </section>
      <section class="lcard wide" aria-labelledby="h-meter"><h2 id="h-meter">${t("meterHead")}</h2>
        <div class="meter">
          <div class="read" aria-live="off"><div class="msw" id="m-sw">–</div><div class="oc" id="m-oc"></div>
            <div class="dev"><div class="scale"><i class="mid"></i><i id="m-needle"></i></div><div class="lab"><span>${t("low")}</span><span id="m-cents"></span><span>${t("high")}</span></div></div>
            <div class="hint" id="m-steady"></div></div>
          <canvas id="m-trace" height="240" aria-hidden="true"></canvas>
        </div>
        <div class="mrow"><button class="btn sm" type="button" id="mic-btn"></button><p class="hint" id="mic-err" role="alert"></p></div>
        <p class="hint">${t("micHint")}</p>
      </section>
      <section class="lcard wide" aria-labelledby="h-log"><h2 id="h-log">${t("logHead")}</h2>
        <div class="logtop"><div><b id="log-today"></b><div class="bar"><i id="log-bar"></i></div></div><span class="streak" id="log-streak"></span></div>
        <div class="ldays" id="log-days" aria-label="${esc(t("last14"))}"></div>
        <p class="hint">${t("logHint")} ${SYNC.user ? t("logSynced") : t("logLocal")}</p>
      </section>
    </div>`;
    $$("[data-sa]", view).forEach((b) => b.onclick = () => setSa(+b.dataset.sa));
    $$("[data-first]", view).forEach((b) => b.onclick = () => { P().first = b.dataset.first; savePrefs(); radio("first", b.dataset.first); });
    $$("[data-tempo]", view).forEach((b) => b.onclick = () => { P().tempo = +b.dataset.tempo; savePrefs(); radio("tempo", b.dataset.tempo); });
    $("#tan-vol").oninput = (e) => { P().vol = +e.target.value; if (master) master.gain.setTargetAtTime(P().vol, ctx.currentTime, 0.05); };
    $("#tan-vol").onchange = () => savePrefs();
    $("#tan-btn").onclick = () => (tan.on ? tanStop() : tanStart());
    $("#mic-btn").onclick = () => (mic.on ? micStop() : micStart());
    paintSa(); paintButtons(); paintMeter(); paintLog();
    addEventListener("resize", paintMeter);
  }
  function radio(kind, v) { $$(`[data-${kind}]`, view).forEach((b) => b.setAttribute("aria-checked", String(b.dataset[kind] === String(v)))); }
  function setSa(i) {
    const was = tan.on;
    if (was) tanStop();
    P().sa = i; savePrefs();
    radio("sa", i);
    findSa.result = null;
    paintSa(); paintButtons();
    if (was) setTimeout(tanStart, 250);
  }
  function paintSa() {
    if (!shown()) return;
    const p = P(), now = $("#sa-now"), f = $("#find-sa");
    now.textContent = p.sa == null ? t("saPick") : `${swName("S")} = ${SA[p.sa]} · ${harmName(p.sa)} · ${num(Math.round(saHz(p.sa)))} Hz`;
    if (findSa.on) f.innerHTML = `<p class="listening"><i></i>${t("findSaRun")}</p>`;
    else if (findSa.result === -1) f.innerHTML = `<p class="hint">${t("findSaNone")}</p><button class="btn ghost xs" type="button" id="fs-go">${t("findSa")}</button>`;
    else if (findSa.result != null) f.innerHTML = `<p><b>${t("findSaGot", { n: `${SA[findSa.result]} (${harmName(findSa.result)})` })}</b></p>
      <button class="btn xs" type="button" id="fs-use">${t("useIt")}</button> <button class="btn ghost xs" type="button" id="fs-no">${t("cancel")}</button>`;
    else f.innerHTML = `<button class="btn ghost xs" type="button" id="fs-go">${t("findSa")}</button>`;
    const go = $("#fs-go"), use = $("#fs-use"), no = $("#fs-no");
    if (go) go.onclick = () => findSa.start();
    if (use) use.onclick = () => setSa(findSa.result);
    if (no) no.onclick = () => { findSa.result = null; paintSa(); };
  }
  function paintButtons() {
    if (!shown()) return;
    const noSa = P().sa == null, tb = $("#tan-btn"), mb = $("#mic-btn");
    tb.innerHTML = `${tan.on ? I.pause : I.play} ${t(tan.on ? "tanStop" : "tanPlay")}`;
    tb.disabled = noSa; tb.setAttribute("aria-pressed", String(tan.on));
    mb.textContent = t(mic.on ? "micOff" : "micOn");
    mb.disabled = noSa && !mic.on; mb.setAttribute("aria-pressed", String(mic.on));
  }
  function paintMeter() {
    if (!shown()) return;
    $("#mic-err").textContent = mic.err ? t(mic.err) : "";
    const last = mic.trace.length ? mic.trace[mic.trace.length - 1].c : null;
    const sw = $("#m-sw"), oc = $("#m-oc"), needle = $("#m-needle"), cents = $("#m-cents"), st = $("#m-steady");
    if (last == null) {
      sw.innerHTML = "–"; sw.className = "msw";
      oc.textContent = mic.on ? t("singNow") : ""; cents.textContent = ""; needle.style.opacity = "0"; st.textContent = "";
    } else {
      const s = swaraOf(last), k = "rgdn".includes(s.n) ? "komal" : s.n === "M" ? "tivra" : "";
      const ok = Math.abs(s.dev) <= 10;
      sw.innerHTML = `<span class="${k ? "k" : ""}">${esc(swName(s.n))}</span>`;
      sw.className = "msw" + (ok ? " ok" : "");
      oc.textContent = [k && t(k), t(s.oct < 0 ? "mandra" : s.oct > 0 ? "taar" : "madhya")].filter(Boolean).join(" · ");
      const dv = Math.round(s.dev);
      cents.textContent = ok ? t("inTune") : t("cents", { c: (dv > 0 ? "+" : "−") + num(Math.abs(dv)) });
      needle.style.opacity = "1";
      needle.style.left = `${50 + Math.max(-50, Math.min(50, s.dev))}%`;
      needle.className = ok ? "ok" : "";
      // steadiness: the last two seconds, if they were all sung on this one swara
      const now = mic.trace[mic.trace.length - 1].t, win = mic.trace.filter((x) => x.t > now - 2);
      const same = win.length > 40 && win.every((x) => x.c != null && swaraOf(x.c).n === s.n && swaraOf(x.c).oct === s.oct);
      if (same) {
        const m = win.reduce((a, x) => a + x.c, 0) / win.length, sd = Math.sqrt(win.reduce((a, x) => a + (x.c - m) ** 2, 0) / win.length);
        st.textContent = t(sd <= 12 ? "steady" : "wavering", { c: Math.max(1, Math.round(sd)) });
      } else st.textContent = "";
    }
    drawTrace();
  }
  function drawTrace() {
    const cv = $("#m-trace");
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1, w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    const g = cv.getContext("2d"), cs = getComputedStyle(document.documentElement);
    const col = (v) => cs.getPropertyValue(v).trim();
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    const lo = -720, hi = 1460, y = (c) => h - 8 - (c - lo) / (hi - lo) * (h - 16), labW = 34;
    g.font = `600 11px ${L === "bn" ? "'Noto Serif Bengali'" : "'Hind Siliguri'"}, sans-serif`;
    g.textBaseline = "middle";
    for (let o = -1; o <= 1; o++) {
      JUST.forEach((j, i) => {
        const c = o * 1200 + j;
        if (c < lo || c > hi) return;
        const n = NOTES[i], shuddha = !"rgdnM".includes(n);
        g.strokeStyle = n === "S" ? col("--gold") : col("--line" + (shuddha ? "2" : ""));
        g.lineWidth = n === "S" ? 1.4 : 1;
        g.setLineDash(shuddha ? [] : [2, 4]);
        g.beginPath(); g.moveTo(labW, y(c)); g.lineTo(w, y(c)); g.stroke();
        if (!shuddha) return;
        // label, with the octave dot drawn below (mandra) or above (taar) as in the notation
        g.fillStyle = n === "S" ? col("--gold") : col("--fg3");
        g.fillText(swName(n), 4, y(c));
        if (o) { const tw = g.measureText(swName(n)).width; g.beginPath(); g.arc(4 + tw / 2, y(c) + (o < 0 ? 8 : -8), 1.6, 0, 2 * Math.PI); g.fill(); }
      });
    }
    g.setLineDash([]);
    if (!mic.trace.length) return;
    const now = mic.trace[mic.trace.length - 1].t, x = (tt) => labW + (w - labW) * (1 - (now - tt) / 12);
    g.strokeStyle = col("--verm"); g.lineWidth = 2.2; g.lineJoin = "round";
    g.beginPath();
    let pen = false;
    for (const p of mic.trace) {
      if (p.c == null || p.c < lo || p.c > hi) { pen = false; continue; }
      if (pen) g.lineTo(x(p.t), y(p.c)); else { g.moveTo(x(p.t), y(p.c)); pen = true; }
    }
    g.stroke();
  }
  function paintLogToday() {
    if (!shown()) return;
    const m = minutesOn(today()), n = streak();
    $("#log-today").textContent = t("logToday", { m, g: GOAL });
    $("#log-bar").style.width = `${Math.min(100, m / GOAL * 100)}%`;
    $("#log-streak").textContent = n ? t("logStreak", { n }) : t("logNoStreak");
  }
  function paintLog() {
    if (!shown()) return;
    paintLogToday();
    const loc = L === "bn" ? "bn-IN" : "en-IN", days = [];
    for (let i = 13; i >= 0; i--) days.push(new Date(Date.now() - i * 864e5));
    $("#log-days").innerHTML = days.map((d) => {
      const m = minutesOn(today(d)), lab = t("dayMin", { d: d.toLocaleDateString(loc, { weekday: "short", day: "numeric", month: "short" }), m });
      return `<div class="lday${today(d) === today() ? " now" : ""}" title="${esc(lab)}" aria-label="${esc(lab)}" role="img"><i style="height:${Math.min(80, m / 60 * 80)}%"></i><small>${esc(d.toLocaleDateString(loc, { weekday: "narrow" }))}</small></div>`;
    }).join("");
  }

  return {
    render,
    leave() { tanStop(); micStop(); flush(); removeEventListener("resize", paintMeter); },
    test: { attach, detect, swaraOf, audio: () => audio(), tan, mic, findSa }, // for checking the meter without a microphone
  };
})();
function renderLearn() { learn.render(); }
