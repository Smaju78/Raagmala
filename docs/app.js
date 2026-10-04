/* Raagmala: hash-routed static app over raagmala.json. No build step. Bilingual: বাংলা (default) / English. */
"use strict";

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const enc = encodeURIComponent;
const view = $("#view");

let META = {}, RAAGS = [], EXTRA = [], ARTISTS = [], VIDEOS = new Map();
const RAAG = new Map(), ARTIST = new Map();

/* ---------------- language ---------------- */
const LANG_KEY = "raagmala.lang";
let L = (() => { try { return localStorage.getItem(LANG_KEY) || "bn"; } catch { return "bn"; } })();
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const num = (n) => L === "bn" ? String(n).replace(/\d/g, (d) => BN_DIGITS[d]) : String(n);

// UI strings. A function receives named values; numbers are already localised.
const STR = {
  en: {
    brandSub: "Raagmala · Hindustani vocal", navListen: "Listen", navBrowse: "Browse", navJukebox: "Jukebox",
    loading: "Loading raags…", switchTo: "বাংলা", switchLabel: "বাংলায় দেখুন",
    footer1: 'Raag and artist facts from <a href="https://www.wikidata.org" target="_blank" rel="noopener">Wikidata</a> and <a href="https://en.wikipedia.org/wiki/List_of_ragas_in_Hindustani_classical_music" target="_blank" rel="noopener">Wikipedia</a>, checked by hand. Performances play from YouTube. Personal, non-commercial project.',
    footer2: 'This site uses YouTube API Services: <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener">YouTube Terms of Service</a> · <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a> · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a>',
    searchPh: "Search a raag or an artist (Yaman, ইমন, Bhimsen…)", searchAria: "Search raags and artists",
    found: (o) => `${o.r} raag${o.rn === 1 ? "" : "s"} · ${o.a} artist${o.an === 1 ? "" : "s"}`, artists: "Artists",
    listenNow: "Listen now",
    stats: (o) => `${o.a} of ${o.b} raags have performances · ${o.c} performances · more are added every day`,
    nowBig: (o) => `Now · ${o.en}`, nowSmall: (o) => `${o.bn} · ${o.time}`,
    nowRaags: "Raags for this time:", nowNone: "No raags with performances for this time yet.",
    playNow: (o) => `▶ Play raags of this hour${o.n ? ` (${o.n})` : ""}`,
    seasonText: (o) => `It's ${o.s} — season raags:`, playSeason: (o) => `▶ Play ${o.s} raags`,
    nPerf: (o) => `${o.n} performance${o.nn === 1 ? "" : "s"}`, soon: "coming soon",
    throughDay: "Raags through the day", all: "All", allN: (o) => `All ${o.n}`,
    wellKnown: "Well-known raags", greatVoices: "Great voices", allArtists: "All artists", explore: "Explore",
    b_raags: "Well-known raags", b_prahar: "Time of day", b_thaat: "Thaat", b_form: "Form", b_mood: "Mood",
    b_season: "Season", b_artists: "Artists", b_gharana: "Gharana", b_az: "All raags A–Z", browseBy: "Browse by",
    hintRaags: (o) => `The ${o.n} raags most often sung, best-known first. Their performances are fetched first.`,
    hintAz: (o) => `${o.n} raags. ${o.m} rarer ones have only their names here (from Wikidata; some English spellings are automatic transliterations).`,
    hintArtists: "Vocalists, best-known first. Gharana and dates from Wikipedia and Wikidata.",
    anyTime: "Any time", anyTimeLight: "Any time / light raags", noThaat: "No Bhatkhande thaat",
    nRaags: (o) => `${o.n} raag${o.nn === 1 ? "" : "s"}`, nArtists: (o) => `${o.n} artist${o.nn === 1 ? "" : "s"}`,
    playJb: (o) => `▶ Play in jukebox${o.n ? ` (${o.n})` : ""}`, playGharana: (o) => `▶ Play ${o.g} gharana`,
    nameOnly: "name only", nothingHere: "Nothing here yet.", showMore: (o) => `Show ${o.a} more of ${o.b}`,
    raagsCrumb: "Raags", raagNotFound: "Raag not found.", backListen: "Back to Listen",
    extraNote: (o) => `Only the name of this rarer raag is known here so far (from Wikidata${o.auto ? "; the English spelling is an automatic transliteration" : ""}). Performances are searched for the main raags first.`,
    f_thaat: "Thaat", f_time: "Time", f_season: "Season", f_jati: "Jati", f_vadi: "Vadi · Samvadi", f_aroha: "Aroha",
    f_avaroha: "Avaroha", f_mood: "Mood", f_related: "Related", f_dates: "Dates", f_gharana: "Gharana", f_forms: "Forms",
    f_voice: "Voice", f_raagsHere: "Raags here", also: "also",
    playRaag: (o) => `▶ Play ${o.r} in jukebox`,
    notationNote: (o) => `Notation: komal swaras underlined (ঋ জ্ঞ দ ণ), tivra Ma with a mark (হ্মা); a dot above or below = upper or lower octave. Facts checked against ${o.src}.`,
    stdRefs: "standard references", wikipedia: "Wikipedia",
    performances: "Performances", raagNotFetched: "Performances of this raag haven't been fetched yet. They are added every day, best-known raags first.",
    noneFound: "No matching vocal performance was found on YouTube yet.",
    artistNotFound: "Artist not found.", allArtistsLink: "All artists",
    artistNotFetched: "Performances by this artist haven't been fetched yet. They are added every day, best-known artists first.",
    moreOnWiki: (o) => `More on ${o.link}.`,
    views: (o) => `${o.v} views`, like: "♡ Like", liked: "♥ Liked",
    jati: { sampurna: "sampurna", shadav: "shadav", audav: "audav" }, voice: { male: "Male", female: "Female" },
    raag: "Raag", playAria: (o) => `Play ${o.t}`,
    // jukebox
    jbEmpty: "Press Play for a shuffle of performances that match your filters.",
    jbNone: "No performances match these filters yet. Remove a filter or clear them all.",
    clearFilters: "Clear filters", nothingPlaying: "Nothing playing yet.", play: "▶ Play", pause: "❚❚ Pause", resume: "▶ Resume",
    likeBtn: "♥ Like", likedBtn: "♥ Liked", never: "Never play", likeTitle: "Liked performances come up 4× as often",
    neverTitle: "Never play this performance in the jukebox", prevAria: "Previous performance", nextAria: "Next performance",
    upNext: "Up next:", toPlay: (o) => `${o.n} performance${o.nn === 1 ? "" : "s"} to play`, allPerf: "All performances",
    clearAll: "Clear all", editFilters: "Edit filters", done: "Done",
    lgTime: "Time of day", followClock: "Follow the clock (raags of the current prahar)", lgForm: "Form", lgMood: "Mood",
    lgThaat: "Thaat", lgSeason: "Season", lgRAG: "Raag, artist, gharana", anyRaag: "Any raag", anyArtist: "Any artist",
    anyGharana: "Any gharana", onlyLiked: "Only liked performances", chipNow: (o) => `Now: ${o.p}`,
    chipRaag: (o) => `Raag ${o.r}`, chipGharana: (o) => `${o.g} gharana`, likedOnly: "Liked only", removeFilter: (o) => `Remove filter ${o.l}`,
    prefsSum: (o) => `Your liked performances (${o.a}) and hidden ones (${o.b})`, prefsLiked: "Liked: these come up 4× as often",
    prefsNone: "None yet. Press ♥ Like while a performance plays.", prefsNever: "Never play", none: "None",
    prefsNote: "Saved in this browser only.", remove: "Remove", miniPause: "Pause", miniPlay: "Play", miniLike: "Like",
    loadError: (o) => `Couldn't load raagmala.json (${o.e}). Serve this folder over HTTP, e.g. <code>python3 -m http.server</code> inside <code>docs/</code>.`,
  },
  bn: {
    brandSub: "Raagmala · হিন্দুস্তানি কণ্ঠসংগীত", navListen: "শুনুন", navBrowse: "তালিকা", navJukebox: "জুকবক্স",
    loading: "রাগ আসছে…", switchTo: "English", switchLabel: "View in English",
    footer1: 'রাগ ও শিল্পীর তথ্য <a href="https://www.wikidata.org" target="_blank" rel="noopener">উইকিডেটা</a> ও <a href="https://en.wikipedia.org/wiki/List_of_ragas_in_Hindustani_classical_music" target="_blank" rel="noopener">উইকিপিডিয়া</a> থেকে, হাতে মিলিয়ে দেখা। পরিবেশনা বাজে ইউটিউব থেকে। ব্যক্তিগত, অবাণিজ্যিক প্রকল্প।',
    footer2: 'এই সাইট YouTube API Services ব্যবহার করে: <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener">ইউটিউবের শর্তাবলি</a> · <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">গুগলের গোপনীয়তা নীতি</a> · <a href="privacy.html">গোপনীয়তা</a> · <a href="terms.html">শর্তাবলি</a>',
    searchPh: "রাগ বা শিল্পী খুঁজুন (ইমন, Yaman, ভীমসেন…)", searchAria: "রাগ ও শিল্পী খুঁজুন",
    found: (o) => `${o.r}টি রাগ · ${o.a} জন শিল্পী`, artists: "শিল্পী",
    listenNow: "এখন শুনুন",
    stats: (o) => `${o.b}টি রাগের মধ্যে ${o.a}টির পরিবেশনা আছে · মোট ${o.c}টি পরিবেশনা · প্রতিদিন আরও যোগ হচ্ছে`,
    nowBig: (o) => `এখন ${o.bn}`, nowSmall: (o) => `${o.en} · ${o.time}`,
    nowRaags: "এই সময়ের রাগ:", nowNone: "এই সময়ের রাগের পরিবেশনা এখনও আসেনি।",
    playNow: (o) => `▶ এই প্রহরের রাগ শুনুন${o.n ? ` (${o.n})` : ""}`,
    seasonText: (o) => `এখন ${o.s} — ঋতুর রাগ:`, playSeason: (o) => `▶ ${o.s}র রাগ শুনুন`,
    nPerf: (o) => `${o.n}টি পরিবেশনা`, soon: "শীঘ্রই আসছে",
    throughDay: "সারাদিনের রাগ", all: "সব", allN: (o) => `সব ${o.n}টি`,
    wellKnown: "পরিচিত রাগ", greatVoices: "মহান কণ্ঠ", allArtists: "সব শিল্পী", explore: "আরও দেখুন",
    b_raags: "পরিচিত রাগ", b_prahar: "সময় (প্রহর)", b_thaat: "ঠাট", b_form: "গায়নশৈলী", b_mood: "রস",
    b_season: "ঋতু", b_artists: "শিল্পী", b_gharana: "ঘরানা", b_az: "সব রাগ (অ–হ)", browseBy: "যেভাবে দেখবেন",
    hintRaags: (o) => `সবচেয়ে বেশি গাওয়া ${o.n}টি রাগ, পরিচিত রাগ আগে। এদের পরিবেশনা আগে খোঁজা হয়।`,
    hintAz: (o) => `${o.n}টি রাগ। এর মধ্যে ${o.m}টি বিরল রাগের শুধু নাম আছে (উইকিডেটা থেকে; কিছু ইংরেজি বানান স্বয়ংক্রিয় প্রতিবর্ণীকরণ)।`,
    hintArtists: "কণ্ঠশিল্পী, পরিচিতরা আগে। ঘরানা ও সাল উইকিপিডিয়া ও উইকিডেটা থেকে।",
    anyTime: "যেকোনো সময়", anyTimeLight: "যেকোনো সময় / লঘু রাগ", noThaat: "ভাতখণ্ডের ঠাট নেই",
    nRaags: (o) => `${o.n}টি রাগ`, nArtists: (o) => `${o.n} জন শিল্পী`,
    playJb: (o) => `▶ জুকবক্সে শুনুন${o.n ? ` (${o.n})` : ""}`, playGharana: (o) => `▶ ${o.g} ঘরানা শুনুন`,
    nameOnly: "শুধু নাম", nothingHere: "এখনও কিছু নেই।", showMore: (o) => `আরও ${o.a}টি দেখান (বাকি ${o.b})`,
    raagsCrumb: "রাগ", raagNotFound: "রাগটি পাওয়া গেল না।", backListen: "শুনুন পাতায় ফিরুন",
    extraNote: (o) => `এই বিরল রাগের এখানে আপাতত শুধু নামটুকু আছে (উইকিডেটা থেকে${o.auto ? "; ইংরেজি বানান স্বয়ংক্রিয় প্রতিবর্ণীকরণ" : ""})। পরিবেশনা আগে প্রধান রাগগুলোর জন্য খোঁজা হচ্ছে।`,
    f_thaat: "ঠাট", f_time: "সময়", f_season: "ঋতু", f_jati: "জাতি", f_vadi: "বাদী · সম্বাদী", f_aroha: "আরোহ",
    f_avaroha: "অবরোহ", f_mood: "রস", f_related: "সম্পর্কিত রাগ", f_dates: "সময়কাল", f_gharana: "ঘরানা", f_forms: "গায়নশৈলী",
    f_voice: "কণ্ঠ", f_raagsHere: "এখানে যে রাগ", also: "অন্য নাম",
    playRaag: (o) => `▶ জুকবক্সে রাগ ${o.r} শুনুন`,
    notationNote: (o) => `স্বরলিপি: কোমল স্বর রোমান হরফে দাগাঙ্কিত, বাংলায় ঋ জ্ঞ দ ণ; তীব্র মা চিহ্নিত (হ্মা); উপরে বা নিচে বিন্দু = তার বা মন্দ্র সপ্তক। তথ্য ${o.src}-র সঙ্গে মিলিয়ে দেখা।`,
    stdRefs: "প্রচলিত সূত্র", wikipedia: "উইকিপিডিয়া",
    performances: "পরিবেশনা", raagNotFetched: "এই রাগের পরিবেশনা এখনও খোঁজা হয়নি। প্রতিদিন যোগ হচ্ছে, পরিচিত রাগ আগে।",
    noneFound: "ইউটিউবে মেলে এমন কণ্ঠসংগীত পরিবেশনা এখনও পাওয়া যায়নি।",
    artistNotFound: "শিল্পী পাওয়া গেল না।", allArtistsLink: "সব শিল্পী",
    artistNotFetched: "এই শিল্পীর পরিবেশনা এখনও খোঁজা হয়নি। প্রতিদিন যোগ হচ্ছে, পরিচিত শিল্পী আগে।",
    moreOnWiki: (o) => `${o.link}য় আরও পড়ুন।`,
    views: (o) => `${o.v} বার দেখা`, like: "♡ পছন্দ", liked: "♥ পছন্দের",
    jati: { sampurna: "সম্পূর্ণ", shadav: "ষাড়ব", audav: "ঔড়ব" }, voice: { male: "পুরুষ", female: "নারী" },
    raag: "রাগ", playAria: (o) => `বাজান: ${o.t}`,
    jbEmpty: "ফিল্টারের সঙ্গে মেলে এমন পরিবেশনা এলোমেলোভাবে শুনতে ▶ বাজান চাপুন।",
    jbNone: "এই ফিল্টারে এখনও কোনো পরিবেশনা নেই। একটি ফিল্টার সরান বা সব মুছে দিন।",
    clearFilters: "ফিল্টার মুছুন", nothingPlaying: "এখনও কিছু বাজছে না।", play: "▶ বাজান", pause: "❚❚ থামান", resume: "▶ আবার চালান",
    likeBtn: "♥ পছন্দ", likedBtn: "♥ পছন্দের", never: "আর বাজাবে না", likeTitle: "পছন্দের পরিবেশনা ৪ গুণ বেশি বাজে",
    neverTitle: "জুকবক্সে এই পরিবেশনা আর বাজাবে না", prevAria: "আগের পরিবেশনা", nextAria: "পরের পরিবেশনা",
    upNext: "এরপর:", toPlay: (o) => `${o.n}টি পরিবেশনা বাজবে`, allPerf: "সব পরিবেশনা",
    clearAll: "সব মুছুন", editFilters: "ফিল্টার বদলান", done: "হয়ে গেছে",
    lgTime: "সময়", followClock: "ঘড়ি মেনে চলুক (এখনকার প্রহরের রাগ)", lgForm: "গায়নশৈলী", lgMood: "রস",
    lgThaat: "ঠাট", lgSeason: "ঋতু", lgRAG: "রাগ, শিল্পী, ঘরানা", anyRaag: "যেকোনো রাগ", anyArtist: "যেকোনো শিল্পী",
    anyGharana: "যেকোনো ঘরানা", onlyLiked: "শুধু পছন্দের পরিবেশনা", chipNow: (o) => `এখন: ${o.p}`,
    chipRaag: (o) => `রাগ ${o.r}`, chipGharana: (o) => `${o.g} ঘরানা`, likedOnly: "শুধু পছন্দের", removeFilter: (o) => `ফিল্টার সরান: ${o.l}`,
    prefsSum: (o) => `আপনার পছন্দের (${o.a}) ও লুকোনো (${o.b}) পরিবেশনা`, prefsLiked: "পছন্দের: এগুলো ৪ গুণ বেশি বাজে",
    prefsNone: "এখনও নেই। কিছু বাজার সময় ♥ পছন্দ চাপুন।", prefsNever: "আর বাজাবে না", none: "নেই",
    prefsNote: "শুধু এই ব্রাউজারে রাখা থাকে।", remove: "সরান", miniPause: "থামান", miniPlay: "বাজান", miniLike: "পছন্দ",
    loadError: (o) => `raagmala.json আনা গেল না (${o.e})। ফোল্ডারটি HTTP দিয়ে চালান, যেমন <code>docs/</code>-এর ভেতরে <code>python3 -m http.server</code>।`,
  },
};
// t(key, values): numbers in values are shown in the current script; "nn" etc. keep the raw number for plurals.
function t(key, o = {}) {
  const s = STR[L][key] ?? STR.en[key] ?? key;
  if (typeof s !== "function") return s;
  const v = { ...o };
  for (const k of Object.keys(o)) if (typeof o[k] === "number") { v[k] = num(o[k]); v[k + "n"] = o[k]; }
  return s(v);
}

/* ---------------- preferences (localStorage, this browser only) ---------------- */
const PREF_KEY = "raagmala.prefs.v1";
const EMPTY_FILTERS = { now: false, prahars: [], thaats: [], forms: [], moods: [], seasons: [], raag: "", artist: "", gharana: "", likedOnly: false };
const ARR = { prahars: "prahars", thaats: "thaats", forms: "forms", moods: "moods", seasons: "seasons" };
const freshFilters = () => ({ ...EMPTY_FILTERS, prahars: [], thaats: [], forms: [], moods: [], seasons: [] });
const prefs = loadPrefs();
function loadPrefs() {
  const empty = { likes: [], never: [], recent: [], filters: freshFilters() };
  try {
    const p = JSON.parse(localStorage.getItem(PREF_KEY) || "null");
    return p ? { ...empty, ...p, filters: { ...freshFilters(), ...(p.filters || {}) } } : empty;
  } catch { return empty; }
}
function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ } }
const isLiked = (id) => prefs.likes.includes(id);
const isNever = (id) => prefs.never.includes(id);
function toggle(list, id, on) {
  prefs[list] = prefs[list].filter((x) => x !== id);
  if (on) {
    prefs[list].push(id);
    const other = list === "likes" ? "never" : "likes"; // liked and never-play are exclusive
    prefs[other] = prefs[other].filter((x) => x !== id);
  }
  savePrefs();
}

/* ---------------- helpers ---------------- */
function fmtViews(n) {
  if (L === "bn") {
    const f = (x) => num(x >= 10 ? Math.round(x) : Math.round(x * 10) / 10);
    return n >= 1e7 ? `${f(n / 1e7)} কোটি` : n >= 1e5 ? `${f(n / 1e5)} লাখ` : n >= 1e3 ? `${f(n / 1e3)} হাজার` : num(n);
  }
  return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(n);
}
const fmtTime = (sec) => num(sec >= 3600 ? `${Math.floor(sec / 3600)}:${String(Math.floor(sec / 60) % 60).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`
  : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`);
const norm = (s) => (s || "").normalize("NFC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();
const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : "";
const rVids = (r) => r.videos ? Object.values(r.videos).flat() : [];
const hasRec = (r) => rVids(r).length > 0;
const nPerf = (n) => t("nPerf", { n });

// Names: the current language first, the other after it (raag names always appear in both scripts).
const rMain = (r) => (L === "bn" ? r.bn || r.en : r.en || r.bn);
const rOther = (r) => (L === "bn" ? (r.bn ? r.en : "") : r.bn || "");
const rBoth = (r) => [rMain(r), rOther(r)].filter(Boolean).join(" · ");
const aMain = (a) => (L === "bn" ? a.bn || a.en : a.en);
const aOther = (a) => (L === "bn" ? (a.bn ? a.en : "") : a.bn || "");
const pair = (bn, en) => (L === "bn" ? [bn, en] : [en, bn]).filter(Boolean).join(" ");

function currentPrahar(d = new Date()) {
  const h = d.getHours();
  for (const [k, p] of Object.entries(META.prahars)) if (h >= p.from && h < p.to) return +k;
  return 1;
}
function currentSeason(d = new Date()) {
  const m = d.getMonth() + 1;
  for (const [k, s] of Object.entries(META.seasons)) if (s.months.includes(m)) return k;
  return "";
}
const hours = (p) => L === "bn" ? `${num(p.from)}–${num(p.to)}টা` : `${p.from}–${p.to}h`;
const praharLabel = (k, short = false) => {
  const p = META.prahars[k];
  if (!p) return t("anyTime");
  return short ? `${L === "bn" ? p.bn : p.en} · ${hours(p)}` : `${pair(p.bn, p.en)} · ${hours(p)}`;
};
const thaatLabel = (k) => pair(META.thaats[k], cap(k));
const formLabel = (k) => pair(META.forms[k], cap(k));
const moodLabel = (k) => META.moods[k] ? pair(META.moods[k].bn, META.moods[k].en) : k;
const moodDesc = (k) => META.moods[k] ? (L === "bn" ? META.moods[k].descBn : META.moods[k].desc) : "";
const seasonLabel = (k) => META.seasons[k] ? pair(META.seasons[k].bn, META.seasons[k].en) : k;
const seasonWord = (k) => META.seasons[k] ? (L === "bn" ? META.seasons[k].bn : META.seasons[k].en.toLowerCase()) : k;
const gharanaLabel = (g) => L === "bn" ? (META.gharanas[g] || g) : `${g} ${META.gharanas[g] || ""}`.trim();
const gharanaShort = (g) => L === "bn" ? (META.gharanas[g] || g) : g;
const jatiLabel = (j) => j.split("-").map((x) => STR[L].jati[x] || x).join(" – ");

/* ---------------- notation ----------------
   Data: S r R g G m M P d D n N (lower case = komal; m shuddh Ma, M tivra Ma); 'S upper octave, .N lower.
   Shown romanised (komal underlined, tivra Ma with a vertical mark) and in Bengali akarmatrik letters. */
const SW_ROMAN = { S: "S", r: "R", R: "R", g: "G", G: "G", m: "M", M: "M", P: "P", d: "D", D: "D", n: "N", N: "N" };
const SW_BN = { S: "সা", r: "ঋ", R: "রে", g: "জ্ঞ", G: "গা", m: "মা", M: "হ্মা", P: "পা", d: "দ", D: "ধা", n: "ণ", N: "না" };
function notation(seq, script) {
  if (!seq) return "";
  return seq.split(/\s+/).map((tok) => {
    const up = tok.includes("'"), lo = tok.startsWith("."), s = tok.replace(/['.]/g, "");
    if (!SW_ROMAN[s]) return esc(tok);
    let x = script === "bn" ? SW_BN[s] : SW_ROMAN[s];
    if (script !== "bn" && "rgdn".includes(s)) x = `<u>${x}</u>`;
    if (script !== "bn" && s === "M") x = `${x}&#x030D;`;
    return `<span class="sw${up ? " up" : ""}${lo ? " lo" : ""}">${x}</span>`;
  }).join(" ");
}
// Bengali line first in Bengali mode.
const notationBoth = (seq) => {
  const en = `<span class="notation">${notation(seq, "en")}</span>`, bn = `<span class="notation bn">${notation(seq, "bn")}</span>`;
  return L === "bn" ? `${bn}<br>${en}` : `${en}<br>${bn}`;
};

/* ---------------- spelling-tolerant search (as in Anandadhara) ---------------- */
const BN_SKEL = {};
[["কখ", "k"], ["গঘ", "g"], ["ঙঞণনং", "n"], ["চছ", "c"], ["জঝয", "j"], ["টঠতথৎ", "t"], ["ডঢদধ", "d"],
 ["রৃঋ", "r"], ["পফ", "p"], ["বভ", "b"], ["ম", "m"], ["ল", "l"], ["শষস", "s"], ["হ", ""]]
  .forEach(([chars, v]) => [...chars].forEach((c) => { BN_SKEL[c] = v; }));
const LAT_DIGRAPHS = [["chh", "c"], ["ch", "c"], ["sh", "s"], ["kh", "k"], ["gh", "g"], ["th", "t"], ["dh", "d"],
  ["ph", "p"], ["bh", "b"], ["jh", "j"], ["ng", "n"], ["w", "b"], ["v", "b"], ["f", "p"], ["z", "j"], ["q", "k"],
  ["x", "ks"], ["y", ""]];
const dedupe = (s) => s.replace(/(.)\1+/g, "$1");
function skelBn(s) {
  s = (s || "").normalize("NFC").replace(/য়|য়/g, "").replace(/ড়|ঢ়|ড়|ঢ়/g, "র");
  return dedupe([...s].map((c) => BN_SKEL[c] || "").join(""));
}
function skelEn(s) {
  s = (s || "").toLowerCase().replace(/[^a-z]/g, "");
  for (const [a, b] of LAT_DIGRAPHS) s = s.split(a).join(b);
  return dedupe(s.replace(/[aeiouh]/g, ""));
}
const isBengali = (s) => /[ঀ-৿]/.test(s);
function indexItem(x, names) {
  x._title = norm(names.filter(Boolean).join(" "));
  x._skels = names.filter(Boolean).map((n) => (isBengali(n) ? skelBn(n) : skelEn(n))).filter(Boolean);
}
function search(items, q) {
  const nq = norm(q);
  if (!nq) return [];
  const qs = isBengali(q) ? skelBn(q) : skelEn(q);
  const fuzzy = qs.length >= 3;
  const a = [], b = [], c = [], d = [];
  for (const x of items) {
    if (x._title.split(" ").some((w) => w.startsWith(nq)) || x._title.startsWith(nq)) a.push(x);
    else if (x._title.includes(nq)) b.push(x);
    else if (fuzzy && x._skels.some((k) => k.startsWith(qs))) c.push(x);
    else if (fuzzy && qs.length >= 4 && x._skels.some((k) => k.includes(qs))) d.push(x);
  }
  return a.concat(b, c, d);
}

/* ---------------- lists ---------------- */
function raagRow(r) {
  const n = rVids(r).length;
  const sub = [rOther(r), r.thaat && thaatLabel(r.thaat).split(" ")[0],
    (r.prahar || []).length ? r.prahar.map((p) => hours(META.prahars[p])).join(", ") : null].filter(Boolean).join(" · ");
  return `<li class="${n ? "" : "no-rec"}"><a href="#/raag/${enc(r.id)}">
    <span class="t-bn">${esc(rMain(r))}</span>
    <span class="meta">${n ? `<span class="rec">▶ ${nPerf(n)}</span>` : r.facts === false ? `<span>${t("nameOnly")}</span>` : ""}</span>
    <span class="t-en">${esc(sub)}</span>
  </a></li>`;
}
function artistRow(a) {
  const n = (a.videos || []).length;
  const sub = [aOther(a), a.born || a.died ? num(`${a.born || "?"}–${a.died || ""}`) : "", (a.gharana || []).map(gharanaShort).join(", ")]
    .filter(Boolean).join(" · ");
  return `<li class="${n ? "" : "no-rec"}"><a href="#/artist/${enc(a.id)}">
    <span class="t-bn">${esc(aMain(a))}</span>
    <span class="meta">${n ? `<span class="rec">▶ ${nPerf(n)}</span>` : ""}</span>
    <span class="t-en">${esc(sub)}</span>
  </a></li>`;
}
function listOf(items, row, { limit = 120, recFirst = true, has = (x) => (x.videos || []).length } = {}) {
  const wrap = document.createElement("div");
  let shown = limit;
  const draw = () => {
    const all = recFirst ? items.filter(has).concat(items.filter((x) => !has(x))) : items;
    const vis = all.slice(0, shown);
    wrap.innerHTML = `<ul class="songs">${vis.map(row).join("") || `<li class="divider">${t("nothingHere")}</li>`}</ul>` +
      (all.length > shown ? `<p class="more"><button class="btn small" type="button">${t("showMore", { a: Math.min(300, all.length - shown), b: all.length - shown })}</button></p>` : "");
    const b = $(".more button", wrap);
    if (b) b.onclick = () => { shown += 300; draw(); };
  };
  draw();
  return wrap;
}
const raagList = (list, o = {}) => listOf(list, raagRow, { has: hasRec, ...o });
const artistList = (list, o = {}) => listOf(list, artistRow, o);

function perfFigure(id, { showRaag = true, showArtist = true } = {}) {
  const v = VIDEOS.get(id);
  if (!v) return "";
  const raags = (v.raags || []).map((r) => RAAG.get(r)).filter(Boolean);
  const arts = (v.artists || []).map((a) => ARTIST.get(a)).filter(Boolean);
  const links = [
    showRaag && raags.map((r) => `<a href="#/raag/${enc(r.id)}">${esc(rBoth(r))}</a>`).join(", "),
    showArtist && arts.map((a) => `<a href="#/artist/${enc(a.id)}">${esc(aMain(a))}</a>`).join(", "),
    v.form && v.form !== "khayal" ? formLabel(v.form) : "",
  ].filter(Boolean).join(" · ");
  return `<figure class="video">
    <div class="frame"><img src="https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg" alt="" loading="lazy">
      <button class="play" type="button" data-vid="${esc(id)}" aria-label="${esc(t("playAria", { t: v.t }))}"><span>▶</span></button></div>
    <figcaption>${links ? `<span class="perf-links">${links}</span>` : ""}${esc(v.t)}<small>${esc(v.ch)} · ${t("views", { v: fmtViews(v.views) })} · ${fmtTime(v.sec)}
      <button class="linkbtn" type="button" data-like="${esc(id)}" aria-pressed="${isLiked(id)}">${isLiked(id) ? t("liked") : t("like")}</button></small></figcaption>
  </figure>`;
}
function wirePerfs(root) {
  $$("[data-vid]", root).forEach((b) => b.onclick = () => {
    jb.pause();
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.vid}?autoplay=1&rel=0&hl=${L}`;
    f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true; f.title = "YouTube video";
    b.parentElement.replaceChildren(f);
  });
  $$("[data-like]", root).forEach((b) => b.onclick = () => {
    const id = b.dataset.like, on = !isLiked(id);
    toggle("likes", id, on); jb.prefsChanged();
    b.setAttribute("aria-pressed", String(on)); b.textContent = on ? t("liked") : t("like");
  });
}

/* ---------------- views ---------------- */
const BROWSE = ["raags", "prahar", "thaat", "form", "mood", "season", "artists", "gharana", "az"];
const GROUP_RAAGS = {
  prahar: (v) => v === "any" ? RAAGS.filter((r) => !(r.prahar || []).length) : RAAGS.filter((r) => (r.prahar || []).includes(+v)),
  thaat: (v) => v === "none" ? RAAGS.filter((r) => !r.thaat) : RAAGS.filter((r) => r.thaat === v),
  form: (v) => RAAGS.filter((r) => r.videos && (r.videos[v] || []).length),
  mood: (v) => RAAGS.filter((r) => (r.moods || []).includes(v)),
  season: (v) => RAAGS.filter((r) => r.season === v),
};

function renderHome() {
  const q = sessionGet("q");
  view.innerHTML = `
    <div class="search-row">
      <input id="q" class="search" type="search" placeholder="${esc(t("searchPh"))}" value="${esc(q)}" autocomplete="off" aria-label="${esc(t("searchAria"))}">
    </div>
    <div id="home-body"></div>`;
  const input = $("#q"), body = $("#home-body");
  const run = () => {
    sessionSet("q", input.value);
    if (norm(input.value)) {
      const rs = search(RAAGS.concat(EXTRA), input.value), as = search(ARTISTS, input.value);
      body.innerHTML = `<div class="section-head"><h2>${t("found", { r: rs.length, a: as.length })}</h2></div>`;
      if (rs.length) body.append(raagList(rs, { limit: 30, recFirst: false }));
      if (as.length) { body.insertAdjacentHTML("beforeend", `<h3 class="sub-h">${t("artists")}</h3>`); body.append(artistList(as, { limit: 30, recFirst: false })); }
    } else renderListen(body);
  };
  input.addEventListener("input", run);
  run();
}

function renderListen(body) {
  const p = currentPrahar(), pr = META.prahars[p], season = currentSeason();
  const nowRaags = RAAGS.filter((r) => (r.prahar || []).includes(p) && hasRec(r));
  const nowPerf = jb.countFor({ now: true });
  const seasonN = season ? jb.countFor({ seasons: [season] }) : 0;
  const topRaags = RAAGS.filter(hasRec).slice(0, 12);
  const topArtists = ARTISTS.filter((a) => (a.videos || []).length && !a.extra).slice(0, 12);
  const raagLinks = (rs) => rs.map((r) => `<a href="#/raag/${enc(r.id)}">${esc(rMain(r))}</a>`).join(" · ");
  body.innerHTML = `
    <section class="section" aria-labelledby="h-listen">
      <div class="section-head"><h2 id="h-listen">${t("listenNow")}</h2>
        <span class="hint">${t("stats", { a: RAAGS.filter(hasRec).length, b: RAAGS.length, c: VIDEOS.size })}</span></div>
      <div class="season-tile now-tile">
        <div><span class="bn">${esc(t("nowBig", { bn: pr.bn, en: pr.en }))}</span> <strong>${esc(t("nowSmall", { bn: pr.bn, en: pr.en, time: hours(pr) }))}</strong>
          <p>${nowRaags.length ? `${t("nowRaags")} ${raagLinks(nowRaags.slice(0, 8))}${nowRaags.length > 8 ? " …" : ""}` : t("nowNone")}</p></div>
        <button class="btn" type="button" data-play="now:1"${nowPerf ? "" : " disabled"}>${t("playNow", { n: nowPerf })}</button>
      </div>
      ${season ? `<div class="season-tile alt">
        <div><span class="bn">${esc(META.seasons[season].bn)}</span> <strong>${esc(META.seasons[season].en)}</strong>
          <p>${t("seasonText", { s: seasonWord(season) })} ${raagLinks(GROUP_RAAGS.season(season).filter(hasRec))}</p></div>
        <button class="btn" type="button" data-play="season:${season}"${seasonN ? "" : " disabled"}>${t("playSeason", { s: seasonWord(season) })}</button>
      </div>` : ""}
      <div class="tiles">${Object.entries(META.moods).map(([m, d]) => {
        const n = jb.countFor({ moods: [m] });
        return `<button class="tile" type="button" data-play="mood:${esc(m)}"${n ? "" : " disabled"}>
          <strong>${L === "bn" ? `${esc(d.bn)} <span class="en-small">${esc(d.en)}</span>` : `<span class="bn">${esc(d.bn)}</span> ${esc(d.en)}`}</strong>
          <span>${esc(moodDesc(m))}</span><span class="n">${n ? `▶ ${nPerf(n)}` : t("soon")}</span></button>`;
      }).join("")}</div>
    </section>
    <section class="section" aria-labelledby="h-day">
      <div class="section-head"><h2 id="h-day">${t("throughDay")}</h2><a href="#/browse/prahar">${t("all")}</a></div>
      <div class="dayline">${Object.entries(META.prahars).sort((a, b) => ((a[1].from + 18) % 24) - ((b[1].from + 18) % 24)).map(([k, x]) => {
        const n = GROUP_RAAGS.prahar(k).filter(hasRec).length;
        return `<a class="day${+k === p ? " cur" : ""}" href="#/list/prahar/${k}"><span class="bn">${esc(L === "bn" ? x.bn : x.en)}</span><small>${hours(x)} · ${num(n)}</small></a>`;
      }).join("")}</div>
    </section>
    <section class="section" aria-labelledby="h-pop">
      <div class="section-head"><h2 id="h-pop">${t("wellKnown")}</h2><a href="#/browse/raags">${t("allN", { n: RAAGS.length })}</a></div>
      <div id="pop-list"></div>
    </section>
    <section class="section" aria-labelledby="h-art">
      <div class="section-head"><h2 id="h-art">${t("greatVoices")}</h2><a href="#/browse/artists">${t("allArtists")}</a></div>
      <div id="art-list"></div>
    </section>
    <section class="section" aria-labelledby="h-explore">
      <div class="section-head"><h2 id="h-explore">${t("explore")}</h2></div>
      <p class="tabs">${BROWSE.map((k) => `<a class="tab" href="#/browse/${k}">${t("b_" + k)}</a>`).join("")}</p>
    </section>`;
  $("#pop-list", body).append(raagList(topRaags, { limit: 12 }));
  $("#art-list", body).append(artistList(topArtists, { limit: 12 }));
  $$("[data-play]", body).forEach((b) => b.onclick = () => {
    const [kind, value] = b.dataset.play.split(":");
    playFiltered(kind, value);
  });
}

function groups(kind) {
  if (kind === "prahar") return Object.keys(META.prahars).map((k) => [k, esc(praharLabel(k))]).concat([["any", esc(t("anyTimeLight"))]]);
  if (kind === "thaat") return Object.keys(META.thaats).map((k) => [k, esc(thaatLabel(k))]).concat([["none", esc(t("noThaat"))]]);
  if (kind === "form") return Object.keys(META.forms).map((k) => [k, esc(formLabel(k))]);
  if (kind === "mood") return Object.keys(META.moods).map((k) => [k, `${esc(moodLabel(k))} <small>${esc(moodDesc(k))}</small>`]);
  if (kind === "season") return Object.keys(META.seasons).map((k) => [k, esc(seasonLabel(k))]);
  return [];
}

function renderBrowse(kind) {
  if (!BROWSE.includes(kind)) kind = "raags";
  const tabs = BROWSE.map((k) => `<a class="tab" href="#/browse/${k}"${k === kind ? ' aria-current="page"' : ""}>${t("b_" + k)}</a>`).join("");
  view.innerHTML = `<nav class="tabs" aria-label="${esc(t("browseBy"))}">${tabs}</nav>`;
  if (kind === "raags") {
    view.insertAdjacentHTML("beforeend", `<p class="hint">${t("hintRaags", { n: RAAGS.length })}</p>`);
    view.append(raagList(RAAGS, { recFirst: false }));
  } else if (kind === "az") {
    const all = RAAGS.concat(EXTRA).slice().sort((a, b) => L === "bn" ? (a.bn || a.en).localeCompare(b.bn || b.en, "bn") : a.en.localeCompare(b.en));
    view.insertAdjacentHTML("beforeend", `<p class="hint">${t("hintAz", { n: all.length, m: EXTRA.length })}</p>`);
    view.append(raagList(all, { recFirst: false, limit: 300 }));
  } else if (kind === "artists") {
    view.insertAdjacentHTML("beforeend", `<p class="hint">${t("hintArtists")}</p>`);
    view.append(artistList(ARTISTS.filter((a) => !a.extra || (a.videos || []).length)));
  } else if (kind === "gharana") {
    const m = new Map();
    for (const a of ARTISTS) for (const g of a.gharana || []) m.set(g, (m.get(g) || 0) + 1);
    view.insertAdjacentHTML("beforeend", `<div class="groups">${[...m.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) =>
      `<a class="group" href="#/list/gharana/${enc(g)}"><span>${esc(gharanaLabel(g))}</span><span class="n">${num(n)}</span></a>`).join("")}</div>`);
  } else {
    view.insertAdjacentHTML("beforeend", `<div class="groups">${groups(kind).map(([v, label]) => {
      const rs = GROUP_RAAGS[kind](v), rec = rs.filter(hasRec).length;
      return `<a class="group" href="#/list/${kind}/${enc(v)}"><span>${label}</span><span class="n">${num(rs.length)}${rec ? ` · ▶${num(rec)}` : ""}</span></a>`;
    }).join("")}</div>`);
  }
}

function renderList(kind, value) {
  if (kind === "gharana") {
    const list = ARTISTS.filter((a) => (a.gharana || []).includes(value));
    const n = jb.countFor({ gharana: value });
    view.innerHTML = `<p class="crumb"><a href="#/browse/gharana">${t("b_gharana")}</a></p>
      <div class="list-head"><h1>${esc(gharanaLabel(value))}</h1><span class="n">${t("nArtists", { n: list.length })}</span>
      ${n ? `<button class="btn small primary" type="button" id="play-list">${t("playGharana", { g: gharanaShort(value) })}</button>` : ""}</div>`;
    view.append(artistList(list));
    if (n) $("#play-list").onclick = () => playFiltered("gharana", value);
    return;
  }
  if (!GROUP_RAAGS[kind]) return renderBrowse("raags");
  const list = GROUP_RAAGS[kind](value);
  const label = kind === "prahar" ? (value === "any" ? t("anyTimeLight") : praharLabel(value)) : kind === "thaat" ? (value === "none" ? t("noThaat") : thaatLabel(value))
    : kind === "form" ? formLabel(value) : kind === "mood" ? moodLabel(value) : seasonLabel(value);
  const filt = kind === "prahar" ? (value === "any" ? null : { prahars: [+value] }) : kind === "thaat" ? (value === "none" ? null : { thaats: [value] })
    : kind === "form" ? { forms: [value] } : kind === "mood" ? { moods: [value] } : { seasons: [value] };
  const n = filt ? jb.countFor(filt) : 0;
  view.innerHTML = `<p class="crumb"><a href="#/browse/${kind}">${t("b_" + kind)}</a></p>
    <div class="list-head"><h1>${esc(label)}</h1><span class="n">${t("nRaags", { n: list.length })}</span>
    ${kind === "mood" ? `<span class="hint">${esc(moodDesc(value))}</span>` : ""}
    ${n ? `<button class="btn small primary" type="button" id="play-list">${t("playJb", { n })}</button>` : ""}</div>`;
  view.append(raagList(list));
  if (n) $("#play-list").onclick = () => { jb.setFilters(filt); location.hash = "#/jukebox"; jb.start(); };
}

function renderRaag(id) {
  const r = RAAG.get(id);
  if (!r) { view.innerHTML = `<p>${t("raagNotFound")} <a href="#/">${t("backListen")}</a></p>`; return; }
  const chip = (kind, v, label) => `<a class="chip" href="#/list/${kind}/${enc(v)}">${esc(label)}</a>`;
  const title = L === "bn" ? `রাগ ${r.bn || r.en}` : `Raag ${r.en}`;
  const subtitle = [L === "bn" ? (r.bn ? `Raag ${r.en}` : "") : (r.bn ? `রাগ ${r.bn}` : ""), r.hi ? `<span lang="hi">${esc(r.hi)}</span>` : ""]
    .filter(Boolean).map((x) => x.startsWith("<") ? x : esc(x)).join(" · ");
  if (r.facts === false) {
    view.innerHTML = `<article class="song"><div><h1>${esc(title)}</h1><p class="sub-en">${subtitle}</p>
      <p class="novideo">${t("extraNote", { auto: r.auto })}</p></div></article>`;
    return;
  }
  const facts = [
    ["f_thaat", r.thaat && chip("thaat", r.thaat, thaatLabel(r.thaat))],
    ["f_time", (r.prahar || []).length ? r.prahar.map((p) => chip("prahar", p, praharLabel(p))).join(" ") : chip("prahar", "any", t("anyTime"))],
    ["f_season", r.season && chip("season", r.season, seasonLabel(r.season))],
    ["f_jati", r.jati && esc(jatiLabel(r.jati))],
    ["f_vadi", (r.vadi || r.samvadi) && (L === "bn"
      ? `<span class="bn">${notation(r.vadi, "bn")} · ${notation(r.samvadi, "bn")}</span> <span class="hint">${notation(r.vadi, "en")} · ${notation(r.samvadi, "en")}</span>`
      : `${notation(r.vadi, "en")} · ${notation(r.samvadi, "en")} <span class="bn hint">${notation(r.vadi, "bn")} · ${notation(r.samvadi, "bn")}</span>`)],
    ["f_aroha", r.aroha && notationBoth(r.aroha)],
    ["f_avaroha", r.avaroha && notationBoth(r.avaroha)],
    ["f_mood", (r.moods || []).length && `<span class="chips">${r.moods.map((m) => chip("mood", m, moodLabel(m))).join("")}</span>`],
    ["f_related", (r.related || []).length && `<span class="chips">${r.related.map((x) => RAAG.get(x)).filter(Boolean).map((x) => `<a class="chip" href="#/raag/${enc(x.id)}">${esc(rBoth(x))}</a>`).join("")}</span>`],
  ].filter(([, v]) => v);
  const forms = r.videos ? Object.keys(META.forms).filter((f) => (r.videos[f] || []).length) : [];
  const vids = r.videos == null ? `<p class="novideo">${t("raagNotFetched")}</p>`
    : !forms.length ? `<p class="novideo">${t("noneFound")}</p>`
    : forms.map((f) => `${forms.length > 1 || f !== "khayal" ? `<h3 class="form-h">${esc(formLabel(f))}</h3>` : ""}${r.videos[f].map((v) => perfFigure(v, { showRaag: false })).join("")}`).join("");
  const n = jb.countFor({ raag: r.id });
  const aliases = (r.aliases || []).filter((a) => a !== r.en).slice(0, 6);
  const src = r.wiki ? `<a href="https://en.wikipedia.org/wiki/${enc(r.wiki.replace(/ /g, "_"))}" target="_blank" rel="noopener">${t("wikipedia")}</a>` : t("stdRefs");
  view.innerHTML = `<article class="song">
    <div>
      <p class="crumb"><a href="#/browse/raags">${t("raagsCrumb")}</a>${r.thaat ? ` › <a href="#/list/thaat/${enc(r.thaat)}">${esc(thaatLabel(r.thaat))}</a>` : ""}</p>
      <h1>${esc(title)}</h1>
      <p class="sub-en">${subtitle}${aliases.length ? `<br><small>${t("also")}: ${esc(aliases.join(", "))}${r.bnAlt ? ` · ${esc(r.bnAlt)}` : ""}</small>` : ""}</p>
      <div class="song-actions">
        <button class="btn small primary" type="button" id="play-raag"${n ? "" : " disabled"}>${t("playRaag", { r: rMain(r) })}</button>
      </div>
      <dl class="facts">${facts.map(([k, v]) => `<dt>${t(k)}</dt><dd>${v}</dd>`).join("")}</dl>
      <p class="src">${t("notationNote", { src })}</p>
    </div>
    <section class="videos" aria-label="${esc(t("performances"))}"><h2>${t("performances")}</h2>${vids}</section>
  </article>`;
  $("#play-raag").onclick = () => playFiltered("raag", r.id);
  wirePerfs(view);
}

function renderArtist(id) {
  const a = ARTIST.get(id);
  if (!a) { view.innerHTML = `<p>${t("artistNotFound")} <a href="#/browse/artists">${t("allArtistsLink")}</a></p>`; return; }
  const facts = [
    ["f_dates", (a.born || a.died) && num(`${a.born || "?"} – ${a.died || ""}`)],
    ["f_gharana", (a.gharana || []).length && `<span class="chips">${a.gharana.map((g) => `<a class="chip" href="#/list/gharana/${enc(g)}">${esc(gharanaLabel(g))}</a>`).join("")}</span>`],
    ["f_forms", (a.forms || []).length && a.forms.map(formLabel).map(esc).join(", ")],
    ["f_voice", a.voice && (STR[L].voice[a.voice] || a.voice)],
  ].filter(([, v]) => v);
  const byRaag = new Map();
  for (const v of (a.videos || []).map((x) => VIDEOS.get(x)).filter(Boolean)) for (const r of v.raags || []) byRaag.set(r, (byRaag.get(r) || 0) + 1);
  const raags = [...byRaag.entries()].sort((x, y) => y[1] - x[1]).map(([r]) => RAAG.get(r)).filter(Boolean);
  const vids = (a.videos || []).length ? a.videos.map((v) => perfFigure(v, { showArtist: false })).join("")
    : `<p class="novideo">${a.searched ? t("noneFound") : t("artistNotFetched")}</p>`;
  const n = jb.countFor({ artist: a.id });
  const other = [aOther(a), a.hi ? `<span lang="hi">${esc(a.hi)}</span>` : ""].filter(Boolean).map((x) => x.startsWith("<") ? x : esc(x)).join(" · ");
  view.innerHTML = `<article class="song">
    <div>
      <p class="crumb"><a href="#/browse/artists">${t("b_artists")}</a></p>
      <h1>${esc(aMain(a))}</h1>
      <p class="sub-en">${other}</p>
      <div class="song-actions"><button class="btn small primary" type="button" id="play-artist"${n ? "" : " disabled"}>${t("playJb", { n })}</button></div>
      <dl class="facts">${facts.map(([k, v]) => `<dt>${t(k)}</dt><dd>${v}</dd>`).join("")}
        ${raags.length ? `<dt>${t("f_raagsHere")}</dt><dd><span class="chips">${raags.map((r) => `<a class="chip" href="#/raag/${enc(r.id)}">${esc(rBoth(r))}</a>`).join("")}</span></dd>` : ""}</dl>
      ${a.wiki ? `<p class="src">${t("moreOnWiki", { link: `<a href="https://en.wikipedia.org/wiki/${enc(a.wiki.replace(/ /g, "_"))}" target="_blank" rel="noopener">${t("wikipedia")}</a>` })}</p>` : ""}
    </div>
    <section class="videos" aria-label="${esc(t("performances"))}"><h2>${t("performances")}</h2>${vids}</section>
  </article>`;
  $("#play-artist").onclick = () => playFiltered("artist", a.id);
  wirePerfs(view);
}

function sessionGet(k) { try { return sessionStorage.getItem("raagmala." + k) || ""; } catch { return ""; } }
function sessionSet(k, v) { try { sessionStorage.setItem("raagmala." + k, v); } catch { /* ignore */ } }

/* ---------------- jukebox (plays performances) ---------------- */
const jb = (() => {
  const F = prefs.filters;
  let player = null, apiLoading = null, current = null, upNext = null, errors = 0;
  const history = [];

  function matches(v, f) {
    return !isNever(v.id)
      && (!f.likedOnly || isLiked(v.id))
      && (!f.now || v._prahar.includes(currentPrahar()))
      && (!f.prahars.length || v._prahar.some((p) => f.prahars.includes(p)))
      && (!f.thaats.length || v._thaat.some((x) => f.thaats.includes(x)))
      && (!f.forms.length || f.forms.includes(v.form || "khayal"))
      && (!f.moods.length || v._moods.some((m) => f.moods.includes(m)))
      && (!f.seasons.length || v._season.some((s) => f.seasons.includes(s)))
      && (!f.raag || (v.raags || []).includes(f.raag))
      && (!f.artist || (v.artists || []).includes(f.artist))
      && (!f.gharana || v._gharana.includes(f.gharana));
  }
  const pool = (f = F) => [...VIDEOS.values()].filter((v) => matches(v, f));

  // Liked performances are 4x as likely; recently played ones sit out; the same raag twice in a row is avoided.
  function pick(exclude = []) {
    const p = pool();
    if (!p.length) return null;
    const avoid = new Set(prefs.recent.slice(-Math.min(60, Math.floor(p.length / 2))).concat(exclude));
    const lastRaags = new Set(current ? current.raags || [] : []);
    let list = p.filter((v) => !avoid.has(v.id) && !(v.raags || []).some((r) => lastRaags.has(r)));
    if (!list.length) list = p.filter((v) => !avoid.has(v.id));
    if (!list.length) list = p.filter((v) => !exclude.includes(v.id));
    if (!list.length) list = p;
    const w = list.map((v) => (isLiked(v.id) ? 4 : 1));
    let r = Math.random() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) if ((r -= w[i]) <= 0) return list[i];
    return list[list.length - 1];
  }
  const label = (v) => {
    const r = RAAG.get((v.raags || [])[0]), a = ARTIST.get((v.artists || [])[0]);
    return `${r ? `${t("raag")} ${rMain(r)}` : v.t}${a ? ` · ${aMain(a)}` : ""}`;
  };
  function planNext() {
    upNext = pick(current ? [current.id] : []);
    $("#jb-next").innerHTML = upNext && current ? `${t("upNext")} ${esc(label(upNext))}` : "";
  }

  function loadApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (apiLoading) return apiLoading;
    apiLoading = new Promise((res) => {
      window.onYouTubeIframeAPIReady = res;
      const sc = document.createElement("script");
      sc.src = "https://www.youtube.com/iframe_api";
      document.head.append(sc);
    });
    return apiLoading;
  }

  async function playItem(v) {
    current = v;
    prefs.recent.push(v.id); prefs.recent = prefs.recent.slice(-300); savePrefs();
    showNow(); planNext();
    await loadApi();
    $("#jb-empty").hidden = true;
    if (!player) {
      player = new YT.Player("yt-player", {
        videoId: v.id, host: "https://www.youtube-nocookie.com",
        playerVars: { autoplay: 1, rel: 0, playsinline: 1, hl: L },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) next();
            if (e.data === YT.PlayerState.PLAYING) errors = 0;
            updateButtons();
          },
          onError: () => { if (++errors < 5) next(); }, // unembeddable or removed video: move on
        },
      });
    } else player.loadVideoById(v.id);
    updateButtons();
  }

  function next() {
    if (upNext && !matches(upNext, F)) upNext = null;
    const v = upNext || pick();
    if (!v) { showEmpty(); return; }
    if (current) history.push(current);
    playItem(v);
  }
  function prev() {
    const v = history.pop();
    if (!v) return;
    const back = current;
    current = null;
    playItem(v);
    if (back) { upNext = back; $("#jb-next").innerHTML = `${t("upNext")} ${esc(label(back))}`; }
  }
  function start() {
    if (current && player) { player.playVideo(); return; }
    next();
  }

  function showEmpty() {
    const n = pool().length;
    $("#jb-empty").hidden = !!current && n > 0;
    $("#jb-empty-msg").textContent = n ? t("jbEmpty") : t("jbNone");
    $("#jb-empty-clear").hidden = n > 0;
    $("#jb-empty-clear").textContent = t("clearFilters");
    updateButtons();
  }

  function showNow() {
    const el = $("#jb-now");
    if (!current) { el.innerHTML = `<p class="hint">${t("nothingPlaying")}</p>`; $("#jb-notes").innerHTML = ""; return; }
    const v = current, raags = (v.raags || []).map((x) => RAAG.get(x)).filter(Boolean), arts = (v.artists || []).map((x) => ARTIST.get(x)).filter(Boolean);
    const r = raags[0];
    el.innerHTML = `<h2>${raags.map((x) => `<a href="#/raag/${enc(x.id)}">${esc(t("raag"))} ${esc(rMain(x))}</a>`).join(" · ") || esc(v.t)}</h2>
      ${r ? `<p>${esc([rOther(r), r.thaat && thaatLabel(r.thaat), ...(r.prahar || []).map((p) => praharLabel(p, true))].filter(Boolean).join(" · "))}</p>` : ""}
      ${arts.length ? `<p class="artist-line">${arts.map((a) => `<a href="#/artist/${enc(a.id)}">${esc(aMain(a))}</a>${aOther(a) ? ` <span class="other">${esc(aOther(a))}</span>` : ""}`).join(", ")}${v.form && v.form !== "khayal" ? ` · ${esc(formLabel(v.form))}` : ""}</p>` : ""}
      ${r ? `<p class="chips">${(r.moods || []).map((m) => `<span class="chip">${esc(moodLabel(m))}</span>`).join("")}</p>` : ""}
      <p class="hint">${esc(v.t)} — ${esc(v.ch)} · ${fmtTime(v.sec)}</p>`;
    $("#jb-notes").innerHTML = r && r.aroha ? `<dl class="facts small">
      <dt>${t("f_aroha")}</dt><dd>${notationBoth(r.aroha)}</dd>
      <dt>${t("f_avaroha")}</dt><dd>${notationBoth(r.avaroha)}</dd></dl>` : "";
  }

  const playing = () => !!(player && player.getPlayerState && player.getPlayerState() === 1);
  function updateButtons() {
    const on = !!current, n = pool().length;
    $("#jb-skip").disabled = !on || !n; $("#jb-like").disabled = !on; $("#jb-never").disabled = !on;
    $("#jb-prev").disabled = !history.length;
    $("#jb-play").disabled = !on && !n;
    const liked = on && isLiked(current.id);
    $("#jb-like").setAttribute("aria-pressed", String(liked));
    $("#jb-like").textContent = liked ? t("likedBtn") : t("likeBtn");
    $("#jb-play").textContent = !on ? t("play") : playing() ? t("pause") : t("resume");
    updateMini();
  }
  function updateMini() {
    const show = !!current && location.hash.indexOf("#/jukebox") !== 0;
    $("#mini").hidden = !show;
    document.body.classList.toggle("has-mini", show);
    if (!current) return;
    $("#mini-title").textContent = label(current);
    $("#mini-play").textContent = playing() ? "❚❚" : "▶";
    $("#mini-play").setAttribute("aria-label", playing() ? t("miniPause") : t("miniPlay"));
    $("#mini-like").setAttribute("aria-pressed", String(isLiked(current.id)));
  }

  /* filters */
  function countWith(key, value) {
    const f = { ...F, [key]: ARR[key] ? [value] : value };
    return pool(f).length;
  }
  function pills(key, values, labelFn = (v) => v) {
    return `<div class="pillset">${values.map((v) => `<label><input type="checkbox" name="${key}" value="${esc(v)}"${F[key].map(String).includes(String(v)) ? " checked" : ""}><span>${esc(labelFn(v))} <small data-count></small></span></label>`).join("")}</div>`;
  }
  function renderFilters() {
    $("#jb-filters").innerHTML = `
      <fieldset><legend>${t("lgTime")}</legend>
        <label class="toggle"><input type="checkbox" id="jb-now-f"${F.now ? " checked" : ""}> ${t("followClock")}</label>
        ${pills("prahars", Object.keys(META.prahars), (k) => praharLabel(k, true))}</fieldset>
      <fieldset><legend>${t("lgForm")}</legend>${pills("forms", Object.keys(META.forms), formLabel)}</fieldset>
      <fieldset><legend>${t("lgMood")}</legend>${pills("moods", Object.keys(META.moods), moodLabel)}</fieldset>
      <fieldset><legend>${t("lgThaat")}</legend>${pills("thaats", Object.keys(META.thaats), thaatLabel)}</fieldset>
      <fieldset><legend>${t("lgSeason")}</legend>${pills("seasons", Object.keys(META.seasons), seasonLabel)}</fieldset>
      <fieldset><legend>${t("lgRAG")}</legend>
        <label class="hint" for="jb-raag">${t("raag")}</label><select id="jb-raag"></select>
        <label class="hint" for="jb-artist">${t("b_artists")}</label><select id="jb-artist"></select>
        <label class="hint" for="jb-gharana">${t("b_gharana")}</label><select id="jb-gharana"></select>
        <label class="toggle"><input type="checkbox" id="jb-liked"${F.likedOnly ? " checked" : ""}> ${t("onlyLiked")}</label>
      </fieldset>`;
    $("#jb-filters").onchange = (e) => {
      const el = e.target;
      if (ARR[el.name]) F[el.name] = $$(`input[name="${el.name}"]:checked`, $("#jb-filters")).map((x) => el.name === "prahars" ? +x.value : x.value);
      else if (el.id === "jb-raag") F.raag = el.value;
      else if (el.id === "jb-artist") F.artist = el.value;
      else if (el.id === "jb-gharana") F.gharana = el.value;
      else if (el.id === "jb-liked") F.likedOnly = el.checked;
      else if (el.id === "jb-now-f") F.now = el.checked;
      filtersChanged();
    };
    updateCounts();
  }
  // Each option shows how many performances you'd get by choosing it (other filters unchanged).
  function updateCounts() {
    $$("#jb-filters input[name]").forEach((inp) => {
      const val = inp.name === "prahars" ? +inp.value : inp.value;
      const n = countWith(inp.name, val);
      inp.checked = F[inp.name].includes(val);
      inp.disabled = !n && !inp.checked;
      inp.nextElementSibling.querySelector("[data-count]").textContent = num(n);
    });
    const opts = (sel, key, items, anyLabel) => {
      const rows = items.map(([v, l]) => [v, l, countWith(key, v)]).filter(([v, , n]) => n || v === F[key]);
      sel.innerHTML = `<option value="">${anyLabel}</option>` +
        rows.map(([v, l, n]) => `<option value="${esc(v)}"${v === F[key] ? " selected" : ""}>${esc(l)} (${num(n)})</option>`).join("");
    };
    const byName = (a, b) => a[1].localeCompare(b[1], L);
    opts($("#jb-raag"), "raag", RAAGS.filter(hasRec).map((r) => [r.id, rBoth(r)]).sort(byName), t("anyRaag"));
    opts($("#jb-artist"), "artist", ARTISTS.filter((a) => (a.videos || []).length).map((a) => [a.id, aMain(a)]).sort(byName), t("anyArtist"));
    opts($("#jb-gharana"), "gharana", Object.keys(META.gharanas).map((g) => [g, gharanaLabel(g)]), t("anyGharana"));
    $("#jb-liked").checked = F.likedOnly;
    $("#jb-now-f").checked = F.now;
    renderFilterBar();
  }
  function renderFilterBar() {
    const n = pool().length;
    $("#jb-count").textContent = t("toPlay", { n });
    const chips = [
      ...(F.now ? [["now", "", t("chipNow", { p: praharLabel(currentPrahar(), true) })]] : []),
      ...F.prahars.map((v) => ["prahars", v, praharLabel(v, true)]), ...F.forms.map((v) => ["forms", v, formLabel(v)]),
      ...F.moods.map((v) => ["moods", v, moodLabel(v)]), ...F.thaats.map((v) => ["thaats", v, thaatLabel(v)]),
      ...F.seasons.map((v) => ["seasons", v, seasonLabel(v)]),
      ...(F.raag ? [["raag", F.raag, t("chipRaag", { r: RAAG.get(F.raag) ? rMain(RAAG.get(F.raag)) : F.raag })]] : []),
      ...(F.artist ? [["artist", F.artist, ARTIST.get(F.artist) ? aMain(ARTIST.get(F.artist)) : F.artist]] : []),
      ...(F.gharana ? [["gharana", F.gharana, t("chipGharana", { g: gharanaShort(F.gharana) })]] : []),
      ...(F.likedOnly ? [["likedOnly", "", t("likedOnly")]] : []),
    ];
    $("#jb-active").innerHTML = chips.length
      ? chips.map(([k, v, l]) => `<button class="chip" type="button" data-k="${k}" data-v="${esc(v)}" aria-label="${esc(t("removeFilter", { l }))}">${esc(l)}</button>`).join("") +
        `<button class="btn small" type="button" id="jb-clear">${t("clearAll")}</button>`
      : `<span class="hint">${t("allPerf")}</span>`;
    $$("#jb-active [data-k]").forEach((b) => b.onclick = () => {
      const k = b.dataset.k;
      if (ARR[k]) F[k] = F[k].filter((x) => String(x) !== b.dataset.v);
      else if (k === "likedOnly" || k === "now") F[k] = false;
      else F[k] = "";
      filtersChanged();
    });
    const c = $("#jb-clear"); if (c) c.onclick = clearFilters;
  }
  function filtersChanged() {
    savePrefs(); updateCounts(); planNext();
    if (!current) showEmpty(); else updateButtons();
  }
  function clearFilters() { setFilters({}); }
  // Replace all filters with the given ones (unspecified ones are cleared).
  function setFilters(f) {
    Object.assign(F, freshFilters(), f);
    filtersChanged();
  }
  const countFor = (f) => pool({ ...freshFilters(), ...f }).length;

  function prefsChanged() {
    const row = (id, list) => {
      const v = VIDEOS.get(id); if (!v) return "";
      return `<li><span>${esc(label(v))} <small class="hint">${esc(v.t)}</small></span><button class="btn small" type="button" data-un="${list}" data-id="${esc(id)}">${t("remove")}</button></li>`;
    };
    $("#jb-prefs").innerHTML = `<summary>${t("prefsSum", { a: prefs.likes.length, b: prefs.never.length })}</summary>
      <h3 class="hint">${t("prefsLiked")}</h3><ul>${prefs.likes.map((id) => row(id, "likes")).join("") || `<li class="hint">${t("prefsNone")}</li>`}</ul>
      <h3 class="hint">${t("prefsNever")}</h3><ul>${prefs.never.map((id) => row(id, "never")).join("") || `<li class="hint">${t("none")}</li>`}</ul>
      <p class="hint">${t("prefsNote")}</p>`;
    $$("#jb-prefs [data-un]").forEach((b) => b.onclick = () => { toggle(b.dataset.un, b.dataset.id, false); prefsChanged(); });
    if (VIDEOS.size) { updateCounts(); updateButtons(); }
  }

  function togglePlay() { if (!current || !player) return next(); playing() ? player.pauseVideo() : player.playVideo(); }
  function likeCurrent() { if (!current) return; toggle("likes", current.id, !isLiked(current.id)); prefsChanged(); }
  function toggleFilters(open) {
    $("#jb-filters").hidden = !open;
    $("#jb-edit").setAttribute("aria-expanded", String(open));
    $("#jb-edit").textContent = open ? t("done") : t("editFilters");
  }

  // Re-draw everything that has words in it (after a language switch).
  function relabel() {
    renderFilters(); prefsChanged(); showNow(); showEmpty();
    toggleFilters(!$("#jb-filters").hidden);
    if (upNext && current) $("#jb-next").innerHTML = `${t("upNext")} ${esc(label(upNext))}`;
  }

  function init() {
    renderFilters(); prefsChanged(); showEmpty();
    $("#jb-play").onclick = togglePlay;
    $("#jb-skip").onclick = next;
    $("#jb-prev").onclick = prev;
    $("#jb-like").onclick = likeCurrent;
    $("#jb-never").onclick = () => { toggle("never", current.id, true); prefsChanged(); next(); };
    $("#jb-empty-clear").onclick = clearFilters;
    $("#jb-edit").onclick = () => toggleFilters($("#jb-filters").hidden);
    $("#mini-play").onclick = togglePlay;
    $("#mini-skip").onclick = next;
    $("#mini-like").onclick = likeCurrent;
    // "follow the clock": refresh the label and counts when the prahar changes
    setInterval(() => { if (F.now) updateCounts(); }, 5 * 60 * 1000);
  }

  return { init, start, setFilters, countFor, prefsChanged, updateMini, relabel, pause: () => { try { player && player.pauseVideo(); } catch { /* not ready */ } } };
})();

function playFiltered(kind, value) {
  const f = kind === "now" ? { now: true } : kind === "mood" ? { moods: [value] } : kind === "season" ? { seasons: [value] }
    : kind === "raag" ? { raag: value } : kind === "artist" ? { artist: value } : kind === "gharana" ? { gharana: value } : {};
  jb.setFilters(f);
  location.hash = "#/jukebox";
  jb.start();
}

/* ---------------- static page text + language switch ---------------- */
function applyStaticText() {
  document.documentElement.lang = L;
  document.title = L === "bn" ? "রাগমালা · হিন্দুস্তানি কণ্ঠসংগীত" : "Raagmala · রাগমালা";
  $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  $$("[data-i18n-title]").forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  const sw = $("#lang-switch");
  sw.textContent = t("switchTo");
  sw.setAttribute("aria-label", t("switchLabel"));
  sw.lang = L === "bn" ? "en" : "bn";
}
$("#lang-switch").onclick = () => {
  L = L === "bn" ? "en" : "bn";
  try { localStorage.setItem(LANG_KEY, L); } catch { /* storage unavailable */ }
  applyStaticText();
  if (VIDEOS.size) { jb.relabel(); route(); }
};
applyStaticText();

/* ---------------- router ---------------- */
function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  const page = parts[0] || "home";
  const isJb = page === "jukebox";
  $("#jukebox").classList.toggle("offstage", !isJb);
  $("#jukebox").setAttribute("aria-hidden", String(!isJb));
  view.hidden = isJb;
  $$("[data-nav]").forEach((a) => a.removeAttribute("aria-current"));
  const nav = { home: "home", raag: "browse", artist: "browse", browse: "browse", list: "browse", jukebox: "jukebox" }[page];
  const navEl = $(`[data-nav="${nav}"]`); if (navEl) navEl.setAttribute("aria-current", "page");
  jb.updateMini();
  if (isJb) { window.scrollTo(0, 0); return; }
  if (page === "raag") renderRaag(parts[1]);
  else if (page === "artist") renderArtist(parts[1]);
  else if (page === "browse") renderBrowse(parts[1]);
  else if (page === "list") renderList(parts[1], parts.slice(2).join("/"));
  else renderHome();
  if (page !== "home") { window.scrollTo(0, 0); view.focus({ preventScroll: true }); }
}

fetch("raagmala.json").then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => {
  META = d.meta; RAAGS = d.raags; EXTRA = d.extra.map((e) => ({ ...e, facts: false })); ARTISTS = d.artists;
  for (const r of RAAGS) { r.facts = true; RAAG.set(r.id, r); indexItem(r, [r.bn, r.en, r.hi, r.bnAlt, ...(r.aliases || [])]); }
  for (const e of EXTRA) { if (!RAAG.has(e.id)) RAAG.set(e.id, e); indexItem(e, [e.bn, e.en, e.hi]); }
  for (const a of ARTISTS) { ARTIST.set(a.id, a); indexItem(a, [a.bn, a.en, a.hi]); }
  for (const [id, v] of Object.entries(d.videos)) {
    v.id = id;
    const rs = (v.raags || []).map((x) => RAAG.get(x)).filter(Boolean);
    v._prahar = [...new Set(rs.flatMap((r) => r.prahar || []))];
    v._thaat = [...new Set(rs.map((r) => r.thaat).filter(Boolean))];
    v._moods = [...new Set(rs.flatMap((r) => r.moods || []))];
    v._season = [...new Set(rs.map((r) => r.season).filter(Boolean))];
    v._gharana = [...new Set((v.artists || []).flatMap((a) => (ARTIST.get(a) || {}).gharana || []))];
    VIDEOS.set(id, v);
  }
  jb.init();
  window.addEventListener("hashchange", route);
  route();
}).catch((e) => {
  view.innerHTML = `<p>${t("loadError", { e: esc(e.message) })}</p>`;
  console.error(e);
});
