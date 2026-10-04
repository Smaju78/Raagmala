/* Raagmala: hash-routed static app over raagmala.json. No build step. */
"use strict";

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const enc = encodeURIComponent;
const view = $("#view");

let META = {}, RAAGS = [], EXTRA = [], ARTISTS = [], VIDEOS = new Map();
const RAAG = new Map(), ARTIST = new Map();

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
const fmtViews = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(n);
const fmtTime = (sec) => sec >= 3600 ? `${Math.floor(sec / 3600)}:${String(Math.floor(sec / 60) % 60).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`
  : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
const norm = (t) => (t || "").normalize("NFC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();
const plural = (n, w, ws = w + "s") => `${n} ${n === 1 ? w : ws}`;
const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : "";
const rVids = (r) => r.videos ? Object.values(r.videos).flat() : [];
const hasRec = (r) => rVids(r).length > 0;
const aName = (a) => a ? (a.bn ? `${a.en} <span class="bn">${esc(a.bn)}</span>` : esc(a.en)) : "";

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
const praharLabel = (k, short = false) => {
  const p = META.prahars[k];
  if (!p) return "Any time";
  const t = `${p.from}–${p.to === 24 ? 24 : p.to}h`;
  return short ? `${p.bn} · ${t}` : `${p.bn} ${p.en} · ${t}`;
};
const thaatLabel = (t) => `${cap(t)} ${META.thaats[t] || ""}`;
const formLabel = (f) => `${cap(f)} ${META.forms[f] || ""}`;
const moodLabel = (m) => META.moods[m] ? `${META.moods[m].en} ${META.moods[m].bn}` : m;
const seasonLabel = (s) => META.seasons[s] ? `${META.seasons[s].en} ${META.seasons[s].bn}` : s;
const gharanaLabel = (g) => `${g} ${META.gharanas[g] || ""}`;

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
    const komal = "rgdn".includes(s), tivra = s === "M";
    let t = script === "bn" ? SW_BN[s] : SW_ROMAN[s];
    if (script !== "bn" && komal) t = `<u>${t}</u>`;
    if (script !== "bn" && tivra) t = `${t}&#x030D;`;
    return `<span class="sw${up ? " up" : ""}${lo ? " lo" : ""}">${t}</span>`;
  }).join(" ");
}

/* ---------------- spelling-tolerant search (as in Anandadhara) ---------------- */
const BN_SKEL = {};
[["কখ", "k"], ["গঘ", "g"], ["ঙঞণনং", "n"], ["চছ", "c"], ["জঝয", "j"], ["টঠতথৎ", "t"], ["ডঢদধ", "d"],
 ["রৃঋ", "r"], ["পফ", "p"], ["বভ", "b"], ["ম", "m"], ["ল", "l"], ["শষস", "s"], ["হ", ""]]
  .forEach(([chars, v]) => [...chars].forEach((c) => { BN_SKEL[c] = v; }));
const LAT_DIGRAPHS = [["chh", "c"], ["ch", "c"], ["sh", "s"], ["kh", "k"], ["gh", "g"], ["th", "t"], ["dh", "d"],
  ["ph", "p"], ["bh", "b"], ["jh", "j"], ["ng", "n"], ["w", "b"], ["v", "b"], ["f", "p"], ["z", "j"], ["q", "k"],
  ["x", "ks"], ["y", ""]];
const dedupe = (t) => t.replace(/(.)\1+/g, "$1");
function skelBn(t) {
  t = (t || "").normalize("NFC").replace(/য়|য়/g, "").replace(/ড়|ঢ়|ড়|ঢ়/g, "র");
  return dedupe([...t].map((c) => BN_SKEL[c] || "").join(""));
}
function skelEn(t) {
  t = (t || "").toLowerCase().replace(/[^a-z]/g, "");
  for (const [a, b] of LAT_DIGRAPHS) t = t.split(a).join(b);
  return dedupe(t.replace(/[aeiouh]/g, ""));
}
const isBengali = (t) => /[ঀ-৿]/.test(t);
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
  const sub = [r.en, r.thaat && cap(r.thaat), r.prahar && r.prahar.length ? r.prahar.map((p) => praharLabel(p, true).split(" · ")[1]).join(", ") : null]
    .filter(Boolean).join(" · ");
  return `<li class="${n ? "" : "no-rec"}"><a href="#/raag/${enc(r.id)}">
    <span class="t-bn">${esc(r.bn || r.en)}</span>
    <span class="meta">${n ? `<span class="rec">▶ ${plural(n, "performance")}</span>` : r.facts === false ? `<span>name only</span>` : ""}</span>
    <span class="t-en">${esc(sub)}</span>
  </a></li>`;
}
function artistRow(a) {
  const n = (a.videos || []).length;
  const sub = [a.born || a.died ? `${a.born || "?"}–${a.died || ""}` : "", (a.gharana || []).join(", ")].filter(Boolean).join(" · ");
  return `<li class="${n ? "" : "no-rec"}"><a href="#/artist/${enc(a.id)}">
    <span class="t-bn">${esc(a.bn || a.en)}</span>
    <span class="meta">${n ? `<span class="rec">▶ ${plural(n, "performance")}</span>` : ""}</span>
    <span class="t-en">${esc([a.bn ? a.en : "", sub].filter(Boolean).join(" · "))}</span>
  </a></li>`;
}
function listOf(items, row, { limit = 120, recFirst = true, has = (x) => (x.videos || []).length } = {}) {
  const wrap = document.createElement("div");
  let shown = limit;
  const draw = () => {
    const all = recFirst ? items.filter(has).concat(items.filter((x) => !has(x))) : items;
    const vis = all.slice(0, shown);
    wrap.innerHTML = `<ul class="songs">${vis.map(row).join("") || `<li class="divider">Nothing here yet.</li>`}</ul>` +
      (all.length > shown ? `<p class="more"><button class="btn small" type="button">Show ${Math.min(300, all.length - shown)} more of ${all.length - shown}</button></p>` : "");
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
    showRaag && raags.map((r) => `<a href="#/raag/${enc(r.id)}">${esc(r.bn)} ${esc(r.en)}</a>`).join(", "),
    showArtist && arts.map((a) => `<a href="#/artist/${enc(a.id)}">${esc(a.en)}</a>`).join(", "),
    v.form && v.form !== "khayal" ? cap(v.form) : "",
  ].filter(Boolean).join(" · ");
  return `<figure class="video">
    <div class="frame"><img src="https://i.ytimg.com/vi/${esc(id)}/hqdefault.jpg" alt="" loading="lazy">
      <button class="play" type="button" data-vid="${esc(id)}" aria-label="Play ${esc(v.t)}"><span>▶</span></button></div>
    <figcaption>${links ? `<span class="perf-links">${links}</span>` : ""}${esc(v.t)}<small>${esc(v.ch)} · ${fmtViews(v.views)} views · ${fmtTime(v.sec)}
      <button class="linkbtn" type="button" data-like="${esc(id)}" aria-pressed="${isLiked(id)}">${isLiked(id) ? "♥ Liked" : "♡ Like"}</button></small></figcaption>
  </figure>`;
}
function wirePerfs(root, rerender) {
  $$("[data-vid]", root).forEach((b) => b.onclick = () => {
    jb.pause();
    const f = document.createElement("iframe");
    f.src = `https://www.youtube-nocookie.com/embed/${b.dataset.vid}?autoplay=1&rel=0`;
    f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true; f.title = "YouTube video";
    b.parentElement.replaceChildren(f);
  });
  $$("[data-like]", root).forEach((b) => b.onclick = () => {
    const id = b.dataset.like, on = !isLiked(id);
    toggle("likes", id, on); jb.prefsChanged();
    b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "♥ Liked" : "♡ Like";
    if (rerender) rerender();
  });
}

/* ---------------- views ---------------- */
const BROWSE = {
  raags: { label: "Well-known raags" },
  prahar: { label: "Time of day" },
  thaat: { label: "Thaat" },
  form: { label: "Form" },
  mood: { label: "Mood" },
  season: { label: "Season" },
  artists: { label: "Artists" },
  gharana: { label: "Gharana" },
  az: { label: "All raags A–Z" },
};
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
      <input id="q" class="search" type="search" placeholder="খুঁজুন · Search a raag or an artist (Yaman, ইমন, Bhimsen…)" value="${esc(q)}" autocomplete="off" aria-label="Search raags and artists">
    </div>
    <div id="home-body"></div>`;
  const input = $("#q"), body = $("#home-body");
  const run = () => {
    sessionSet("q", input.value);
    if (norm(input.value)) {
      const rs = search(RAAGS.concat(EXTRA), input.value), as = search(ARTISTS, input.value);
      body.innerHTML = `<div class="section-head"><h2>${plural(rs.length, "raag")} · ${plural(as.length, "artist")}</h2></div>`;
      if (rs.length) body.append(raagList(rs, { limit: 30, recFirst: false }));
      if (as.length) { body.insertAdjacentHTML("beforeend", `<h3 class="sub-h">Artists</h3>`); body.append(artistList(as, { limit: 30, recFirst: false })); }
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
  const totalPerf = VIDEOS.size, withRec = RAAGS.filter(hasRec).length;
  const topRaags = RAAGS.filter(hasRec).slice(0, 12);
  const topArtists = ARTISTS.filter((a) => (a.videos || []).length && !a.extra).slice(0, 12);
  body.innerHTML = `
    <section class="section" aria-labelledby="h-listen">
      <div class="section-head"><h2 id="h-listen">Listen now</h2>
        <span class="hint">${withRec} of ${RAAGS.length} raags have performances · ${totalPerf} performances · more are added every day</span></div>
      <div class="season-tile now-tile">
        <div><span class="bn">এখন ${esc(pr.bn)}</span> <strong>${esc(pr.en)} · ${pr.from}–${pr.to}h</strong>
          <p>${nowRaags.length ? `Raags for this time: ${nowRaags.slice(0, 8).map((r) => `<a href="#/raag/${enc(r.id)}">${esc(r.bn)}</a>`).join(" · ")}${nowRaags.length > 8 ? " …" : ""}`
            : "No raags with performances for this time yet."}</p></div>
        <button class="btn" type="button" data-play="now:1"${nowPerf ? "" : " disabled"}>▶ Play raags of this hour${nowPerf ? ` (${nowPerf})` : ""}</button>
      </div>
      ${season ? `<div class="season-tile alt">
        <div><span class="bn">${esc(META.seasons[season].bn)}</span> <strong>${esc(META.seasons[season].en)}</strong>
          <p>It's ${esc(META.seasons[season].en.toLowerCase())} — season raags: ${GROUP_RAAGS.season(season).filter(hasRec).map((r) => `<a href="#/raag/${enc(r.id)}">${esc(r.bn)}</a>`).join(" · ")}</p></div>
        <button class="btn" type="button" data-play="season:${season}"${seasonN ? "" : " disabled"}>▶ Play ${esc(META.seasons[season].en.toLowerCase())} raags</button>
      </div>` : ""}
      <div class="tiles">${Object.entries(META.moods).map(([m, d]) => {
        const n = jb.countFor({ moods: [m] });
        return `<button class="tile" type="button" data-play="mood:${esc(m)}"${n ? "" : " disabled"}>
          <strong><span class="bn">${esc(d.bn)}</span> ${esc(d.en)}</strong><span>${esc(d.desc)}</span><span class="n">${n ? `▶ ${plural(n, "performance")}` : "coming soon"}</span></button>`;
      }).join("")}</div>
    </section>
    <section class="section" aria-labelledby="h-day">
      <div class="section-head"><h2 id="h-day">Raags through the day</h2><a href="#/browse/prahar">All</a></div>
      <div class="dayline">${Object.entries(META.prahars).sort((a, b) => ((a[1].from + 18) % 24) - ((b[1].from + 18) % 24)).map(([k, x]) => {
        const n = GROUP_RAAGS.prahar(k).filter(hasRec).length;
        return `<a class="day${+k === p ? " cur" : ""}" href="#/list/prahar/${k}"><span class="bn">${esc(x.bn)}</span><small>${x.from}–${x.to}h · ${n}</small></a>`;
      }).join("")}</div>
    </section>
    <section class="section" aria-labelledby="h-pop">
      <div class="section-head"><h2 id="h-pop">Well-known raags</h2><a href="#/browse/raags">All ${RAAGS.length}</a></div>
      <div id="pop-list"></div>
    </section>
    <section class="section" aria-labelledby="h-art">
      <div class="section-head"><h2 id="h-art">Great voices</h2><a href="#/browse/artists">All artists</a></div>
      <div id="art-list"></div>
    </section>
    <section class="section" aria-labelledby="h-explore">
      <div class="section-head"><h2 id="h-explore">Explore</h2></div>
      <p class="tabs">${Object.entries(BROWSE).map(([k, v]) => `<a class="tab" href="#/browse/${k}">${v.label}</a>`).join("")}</p>
    </section>`;
  $("#pop-list", body).append(raagList(topRaags, { limit: 12 }));
  $("#art-list", body).append(artistList(topArtists, { limit: 12 }));
  $$("[data-play]", body).forEach((b) => b.onclick = () => {
    const [kind, value] = b.dataset.play.split(":");
    playFiltered(kind, value);
  });
}

function groups(kind) {
  if (kind === "prahar") return Object.keys(META.prahars).map((k) => [k, praharLabel(k)]).concat([["any", "Any time / light raags"]]);
  if (kind === "thaat") return Object.keys(META.thaats).map((k) => [k, thaatLabel(k)]).concat([["none", "No Bhatkhande thaat"]]);
  if (kind === "form") return Object.keys(META.forms).map((k) => [k, formLabel(k)]);
  if (kind === "mood") return Object.keys(META.moods).map((k) => [k, `${moodLabel(k)} <small>${esc(META.moods[k].desc)}</small>`]);
  if (kind === "season") return Object.keys(META.seasons).map((k) => [k, seasonLabel(k)]);
  return [];
}

function renderBrowse(kind) {
  if (!BROWSE[kind]) kind = "raags";
  const tabs = Object.entries(BROWSE).map(([k, v]) =>
    `<a class="tab" href="#/browse/${k}"${k === kind ? ' aria-current="page"' : ""}>${v.label}</a>`).join("");
  view.innerHTML = `<nav class="tabs" aria-label="Browse by">${tabs}</nav>`;
  if (kind === "raags") {
    view.insertAdjacentHTML("beforeend", `<p class="hint">The ${RAAGS.length} raags most often sung, best-known first. Their performances are fetched first.</p>`);
    view.append(raagList(RAAGS, { recFirst: false }));
  } else if (kind === "az") {
    const all = RAAGS.concat(EXTRA).slice().sort((a, b) => a.en.localeCompare(b.en));
    view.insertAdjacentHTML("beforeend", `<p class="hint">${all.length} raags. ${EXTRA.length} rarer ones have only their names here (from Wikidata${EXTRA.some((e) => e.auto) ? "; some English spellings are automatic transliterations" : ""}).</p>`);
    view.append(raagList(all, { recFirst: false, limit: 300 }));
  } else if (kind === "artists") {
    view.insertAdjacentHTML("beforeend", `<p class="hint">Vocalists, best-known first. Gharana and dates from Wikipedia and Wikidata.</p>`);
    view.append(artistList(ARTISTS.filter((a) => !a.extra || (a.videos || []).length)));
  } else if (kind === "gharana") {
    const m = new Map();
    for (const a of ARTISTS) for (const g of a.gharana || []) m.set(g, (m.get(g) || 0) + 1);
    view.insertAdjacentHTML("beforeend", `<div class="groups">${[...m.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) =>
      `<a class="group" href="#/list/gharana/${enc(g)}"><span>${esc(gharanaLabel(g))}</span><span class="n">${n}</span></a>`).join("")}</div>`);
  } else {
    view.insertAdjacentHTML("beforeend", `<div class="groups">${groups(kind).map(([v, label]) => {
      const rs = GROUP_RAAGS[kind](v), rec = rs.filter(hasRec).length;
      return `<a class="group" href="#/list/${kind}/${enc(v)}"><span>${label.includes("<small>") ? label : esc(label)}</span><span class="n" title="${rec} with performances">${rs.length}${rec ? ` · ▶${rec}` : ""}</span></a>`;
    }).join("")}</div>`);
  }
}

function renderList(kind, value) {
  if (kind === "gharana") {
    const list = ARTISTS.filter((a) => (a.gharana || []).includes(value));
    const n = jb.countFor({ gharana: value });
    view.innerHTML = `<p class="crumb"><a href="#/browse/gharana">Gharana</a></p>
      <div class="list-head"><h1>${esc(gharanaLabel(value))}</h1><span class="n">${plural(list.length, "artist")}</span>
      ${n ? `<button class="btn small primary" type="button" id="play-list">▶ Play ${esc(value)} gharana</button>` : ""}</div>`;
    view.append(artistList(list));
    if (n) $("#play-list").onclick = () => playFiltered("gharana", value);
    return;
  }
  if (!GROUP_RAAGS[kind]) return renderBrowse("raags");
  const list = GROUP_RAAGS[kind](value);
  const label = kind === "prahar" ? praharLabel(value) : kind === "thaat" ? (value === "none" ? "No thaat" : thaatLabel(value))
    : kind === "form" ? formLabel(value) : kind === "mood" ? moodLabel(value) : seasonLabel(value);
  const filt = kind === "prahar" ? (value === "any" ? null : { prahars: [+value] }) : kind === "thaat" ? (value === "none" ? null : { thaats: [value] })
    : kind === "form" ? { forms: [value] } : kind === "mood" ? { moods: [value] } : { seasons: [value] };
  const n = filt ? jb.countFor(filt) : 0;
  view.innerHTML = `<p class="crumb"><a href="#/browse/${kind}">${BROWSE[kind].label}</a></p>
    <div class="list-head"><h1>${esc(label)}</h1><span class="n">${plural(list.length, "raag")}</span>
    ${kind === "mood" ? `<span class="hint">${esc(META.moods[value].desc)}</span>` : ""}
    ${n ? `<button class="btn small primary" type="button" id="play-list">▶ Play in jukebox (${n})</button>` : ""}</div>`;
  view.append(raagList(list));
  if (n) $("#play-list").onclick = () => { jb.setFilters(filt); location.hash = "#/jukebox"; jb.start(); };
}

function renderRaag(id) {
  const r = RAAG.get(id);
  if (!r) { view.innerHTML = `<p>Raag not found. <a href="#/">Back to Listen</a></p>`; return; }
  const chip = (kind, v, label) => `<a class="chip" href="#/list/${kind}/${enc(v)}">${esc(label)}</a>`;
  if (r.facts === false) {
    view.innerHTML = `<article class="song"><div><h1>${esc(r.bn || r.en)}</h1>
      <p class="sub-en">${esc(r.en)}${r.hi ? ` · <span lang="hi">${esc(r.hi)}</span>` : ""}</p>
      <p class="novideo">Only the name of this rarer raag is known here so far (from Wikidata${r.auto ? "; the English spelling is an automatic transliteration" : ""}). Performances are searched for the main raags first.</p></div></article>`;
    return;
  }
  const facts = [
    ["Thaat", r.thaat && chip("thaat", r.thaat, thaatLabel(r.thaat))],
    ["Time", (r.prahar || []).length ? r.prahar.map((p) => chip("prahar", p, praharLabel(p))).join(" ") : chip("prahar", "any", "Any time")],
    ["Season", r.season && chip("season", r.season, seasonLabel(r.season))],
    ["Jati", r.jati && esc(r.jati.replace("-", " – "))],
    ["Vadi · Samvadi", (r.vadi || r.samvadi) && `${notation(r.vadi, "en") || "?"} · ${notation(r.samvadi, "en") || "?"}
      <span class="bn hint">${notation(r.vadi, "bn")} · ${notation(r.samvadi, "bn")}</span>`],
    ["Aroha", r.aroha && `<span class="notation">${notation(r.aroha, "en")}</span><br><span class="notation bn">${notation(r.aroha, "bn")}</span>`],
    ["Avaroha", r.avaroha && `<span class="notation">${notation(r.avaroha, "en")}</span><br><span class="notation bn">${notation(r.avaroha, "bn")}</span>`],
    ["Mood", (r.moods || []).length && `<span class="chips">${r.moods.map((m) => chip("mood", m, moodLabel(m))).join("")}</span>`],
    ["Related", (r.related || []).length && `<span class="chips">${r.related.map((x) => RAAG.get(x)).filter(Boolean).map((x) => `<a class="chip" href="#/raag/${enc(x.id)}">${esc(x.bn)} ${esc(x.en)}</a>`).join("")}</span>`],
  ].filter(([, v]) => v);
  const forms = r.videos ? Object.keys(META.forms).filter((f) => (r.videos[f] || []).length) : [];
  const vids = r.videos == null
    ? `<p class="novideo">Performances of this raag haven't been fetched yet. They are added every day, best-known raags first.</p>`
    : !forms.length ? `<p class="novideo">No matching vocal performance was found on YouTube yet.</p>`
    : forms.map((f) => `${forms.length > 1 || f !== "khayal" ? `<h3 class="form-h">${esc(formLabel(f))}</h3>` : ""}${r.videos[f].map((v) => perfFigure(v, { showRaag: false })).join("")}`).join("");
  const n = jb.countFor({ raag: r.id });
  const aliases = (r.aliases || []).filter((a) => a !== r.en).slice(0, 6);
  view.innerHTML = `<article class="song">
    <div>
      <p class="crumb"><a href="#/browse/raags">Raags</a>${r.thaat ? ` › <a href="#/list/thaat/${enc(r.thaat)}">${esc(thaatLabel(r.thaat))}</a>` : ""}</p>
      <h1>রাগ ${esc(r.bn)}</h1>
      <p class="sub-en">Raag ${esc(r.en)}${r.hi ? ` · <span lang="hi">${esc(r.hi)}</span>` : ""}${aliases.length ? `<br><small>also ${esc(aliases.join(", "))}${r.bnAlt ? ` · ${esc(r.bnAlt)}` : ""}</small>` : ""}</p>
      <div class="song-actions">
        <button class="btn small primary" type="button" id="play-raag"${n ? "" : " disabled"}>▶ Play ${esc(r.en)} in jukebox</button>
      </div>
      <dl class="facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>
      <p class="src">Notation: komal swaras underlined (ঋ জ্ঞ দ ণ), tivra Ma with a mark (হ্মা); a dot above or below = upper or lower octave.
      Facts checked against ${r.wiki ? `<a href="https://en.wikipedia.org/wiki/${enc(r.wiki.replace(/ /g, "_"))}" target="_blank" rel="noopener">Wikipedia</a>` : "standard references"}.</p>
    </div>
    <section class="videos" aria-label="Performances"><h2>Performances</h2>${vids}</section>
  </article>`;
  $("#play-raag").onclick = () => playFiltered("raag", r.id);
  wirePerfs(view);
}

function renderArtist(id) {
  const a = ARTIST.get(id);
  if (!a) { view.innerHTML = `<p>Artist not found. <a href="#/browse/artists">All artists</a></p>`; return; }
  const facts = [
    ["Dates", (a.born || a.died) && `${a.born || "?"} – ${a.died || ""}`],
    ["Gharana", (a.gharana || []).length && `<span class="chips">${a.gharana.map((g) => `<a class="chip" href="#/list/gharana/${enc(g)}">${esc(gharanaLabel(g))}</a>`).join("")}</span>`],
    ["Forms", (a.forms || []).length && a.forms.map(formLabel).map(esc).join(", ")],
    ["Voice", a.voice && cap(a.voice)],
  ].filter(([, v]) => v);
  // raags this artist sings here, most performances first
  const byRaag = new Map();
  for (const v of (a.videos || []).map((x) => VIDEOS.get(x)).filter(Boolean)) for (const r of v.raags || []) byRaag.set(r, (byRaag.get(r) || 0) + 1);
  const raags = [...byRaag.entries()].sort((x, y) => y[1] - x[1]).map(([r]) => RAAG.get(r)).filter(Boolean);
  const vids = (a.videos || []).length ? a.videos.map((v) => perfFigure(v, { showArtist: false })).join("")
    : a.searched ? `<p class="novideo">No matching vocal performance was found on YouTube yet.</p>`
    : `<p class="novideo">Performances by this artist haven't been fetched yet. They are added every day, best-known artists first.</p>`;
  const n = jb.countFor({ artist: a.id });
  view.innerHTML = `<article class="song">
    <div>
      <p class="crumb"><a href="#/browse/artists">Artists</a></p>
      <h1>${esc(a.bn || a.en)}</h1>
      <p class="sub-en">${a.bn ? esc(a.en) : ""}${a.hi ? ` · <span lang="hi">${esc(a.hi)}</span>` : ""}</p>
      <div class="song-actions"><button class="btn small primary" type="button" id="play-artist"${n ? "" : " disabled"}>▶ Play in jukebox${n ? ` (${n})` : ""}</button></div>
      <dl class="facts">${facts.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}
        ${raags.length ? `<dt>Raags here</dt><dd><span class="chips">${raags.map((r) => `<a class="chip" href="#/raag/${enc(r.id)}">${esc(r.bn)} ${esc(r.en)}</a>`).join("")}</span></dd>` : ""}</dl>
      ${a.wiki ? `<p class="src">More on <a href="https://en.wikipedia.org/wiki/${enc(a.wiki.replace(/ /g, "_"))}" target="_blank" rel="noopener">Wikipedia</a>.</p>` : ""}
    </div>
    <section class="videos" aria-label="Performances"><h2>Performances</h2>${vids}</section>
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
      && (!f.thaats.length || v._thaat.some((t) => f.thaats.includes(t)))
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
    return `${r ? `রাগ ${r.bn}` : v.t}${a ? ` · ${a.en}` : ""}`;
  };
  function planNext() {
    upNext = pick(current ? [current.id] : []);
    $("#jb-next").innerHTML = upNext && current ? `Up next: ${esc(label(upNext))}` : "";
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
        playerVars: { autoplay: 1, rel: 0, playsinline: 1 },
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
    if (back) { upNext = back; $("#jb-next").innerHTML = `Up next: ${esc(label(back))}`; }
  }
  function start() {
    if (current && player) { player.playVideo(); return; }
    next();
  }

  function showEmpty() {
    const n = pool().length;
    $("#jb-empty").hidden = !!current && n > 0;
    $("#jb-empty-msg").textContent = n ? "Press Play for a shuffle of performances that match your filters."
      : "No performances match these filters yet. Remove a filter or clear them all.";
    $("#jb-empty-clear").hidden = n > 0;
    updateButtons();
  }

  function showNow() {
    const el = $("#jb-now");
    if (!current) { el.innerHTML = `<p class="hint">Nothing playing yet.</p>`; $("#jb-notes").innerHTML = ""; return; }
    const v = current, raags = (v.raags || []).map((x) => RAAG.get(x)).filter(Boolean), arts = (v.artists || []).map((x) => ARTIST.get(x)).filter(Boolean);
    const r = raags[0];
    el.innerHTML = `<h2>${raags.map((x) => `<a href="#/raag/${enc(x.id)}">রাগ ${esc(x.bn)}</a>`).join(" · ") || esc(v.t)}</h2>
      ${r ? `<p>Raag ${esc(r.en)}${r.thaat ? ` · ${esc(thaatLabel(r.thaat))}` : ""}${(r.prahar || []).length ? ` · ${r.prahar.map((p) => esc(praharLabel(p, true))).join(", ")}` : ""}</p>` : ""}
      ${arts.length ? `<p class="artist-line">${arts.map((a) => `<a href="#/artist/${enc(a.id)}">${aName(a)}</a>`).join(", ")}${v.form && v.form !== "khayal" ? ` · ${esc(cap(v.form))}` : ""}</p>` : ""}
      ${r ? `<p class="chips">${(r.moods || []).map((m) => `<span class="chip">${esc(moodLabel(m))}</span>`).join("")}</p>` : ""}
      <p class="hint">${esc(v.t)} — ${esc(v.ch)} · ${fmtTime(v.sec)}</p>`;
    $("#jb-notes").innerHTML = r && r.aroha ? `<dl class="facts small">
      <dt>Aroha</dt><dd><span class="notation">${notation(r.aroha, "en")}</span><br><span class="notation bn">${notation(r.aroha, "bn")}</span></dd>
      <dt>Avaroha</dt><dd><span class="notation">${notation(r.avaroha, "en")}</span><br><span class="notation bn">${notation(r.avaroha, "bn")}</span></dd></dl>` : "";
  }

  const playing = () => !!(player && player.getPlayerState && player.getPlayerState() === 1);
  function updateButtons() {
    const on = !!current, n = pool().length;
    $("#jb-skip").disabled = !on || !n; $("#jb-like").disabled = !on; $("#jb-never").disabled = !on;
    $("#jb-prev").disabled = !history.length;
    $("#jb-play").disabled = !on && !n;
    const liked = on && isLiked(current.id);
    $("#jb-like").setAttribute("aria-pressed", String(liked));
    $("#jb-like").textContent = liked ? "♥ Liked" : "♥ Like";
    $("#jb-play").textContent = !on ? "▶ Play" : playing() ? "❚❚ Pause" : "▶ Resume";
    updateMini();
  }
  function updateMini() {
    const show = !!current && location.hash.indexOf("#/jukebox") !== 0;
    $("#mini").hidden = !show;
    document.body.classList.toggle("has-mini", show);
    if (!current) return;
    $("#mini-title").textContent = label(current);
    $("#mini-play").textContent = playing() ? "❚❚" : "▶";
    $("#mini-play").setAttribute("aria-label", playing() ? "Pause" : "Play");
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
      <fieldset><legend>Time of day</legend>
        <label class="toggle"><input type="checkbox" id="jb-now-f"${F.now ? " checked" : ""}> Follow the clock (raags of the current prahar)</label>
        ${pills("prahars", Object.keys(META.prahars), (k) => praharLabel(k, true))}</fieldset>
      <fieldset><legend>Form</legend>${pills("forms", Object.keys(META.forms), formLabel)}</fieldset>
      <fieldset><legend>Mood</legend>${pills("moods", Object.keys(META.moods), moodLabel)}</fieldset>
      <fieldset><legend>Thaat</legend>${pills("thaats", Object.keys(META.thaats), thaatLabel)}</fieldset>
      <fieldset><legend>Season</legend>${pills("seasons", Object.keys(META.seasons), seasonLabel)}</fieldset>
      <fieldset><legend>Raag, artist, gharana</legend>
        <label class="hint" for="jb-raag">Raag</label><select id="jb-raag"></select>
        <label class="hint" for="jb-artist">Artist</label><select id="jb-artist"></select>
        <label class="hint" for="jb-gharana">Gharana</label><select id="jb-gharana"></select>
        <label class="toggle"><input type="checkbox" id="jb-liked"${F.likedOnly ? " checked" : ""}> Only liked performances</label>
      </fieldset>`;
    $("#jb-filters").onchange = (e) => {
      const t = e.target;
      if (ARR[t.name]) F[t.name] = $$(`input[name="${t.name}"]:checked`, $("#jb-filters")).map((x) => t.name === "prahars" ? +x.value : x.value);
      else if (t.id === "jb-raag") F.raag = t.value;
      else if (t.id === "jb-artist") F.artist = t.value;
      else if (t.id === "jb-gharana") F.gharana = t.value;
      else if (t.id === "jb-liked") F.likedOnly = t.checked;
      else if (t.id === "jb-now-f") F.now = t.checked;
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
      inp.nextElementSibling.querySelector("[data-count]").textContent = n;
    });
    const opts = (sel, key, items, anyLabel) => {
      const rows = items.map(([v, l]) => [v, l, countWith(key, v)]).filter(([v, , n]) => n || v === F[key]);
      sel.innerHTML = `<option value="">${anyLabel}</option>` +
        rows.map(([v, l, n]) => `<option value="${esc(v)}"${v === F[key] ? " selected" : ""}>${esc(l)} (${n})</option>`).join("");
    };
    opts($("#jb-raag"), "raag", RAAGS.filter(hasRec).map((r) => [r.id, `${r.en} ${r.bn}`]).sort((a, b) => a[1].localeCompare(b[1])), "Any raag");
    opts($("#jb-artist"), "artist", ARTISTS.filter((a) => (a.videos || []).length).map((a) => [a.id, a.en]).sort((a, b) => a[1].localeCompare(b[1])), "Any artist");
    opts($("#jb-gharana"), "gharana", Object.keys(META.gharanas).map((g) => [g, gharanaLabel(g)]), "Any gharana");
    $("#jb-liked").checked = F.likedOnly;
    $("#jb-now-f").checked = F.now;
    renderFilterBar();
  }
  function renderFilterBar() {
    const n = pool().length;
    $("#jb-count").textContent = `${plural(n, "performance")} to play`;
    const chips = [
      ...(F.now ? [["now", "", `Now: ${praharLabel(currentPrahar(), true)}`]] : []),
      ...F.prahars.map((v) => ["prahars", v, praharLabel(v, true)]), ...F.forms.map((v) => ["forms", v, formLabel(v)]),
      ...F.moods.map((v) => ["moods", v, moodLabel(v)]), ...F.thaats.map((v) => ["thaats", v, thaatLabel(v)]),
      ...F.seasons.map((v) => ["seasons", v, seasonLabel(v)]),
      ...(F.raag ? [["raag", F.raag, `Raag ${(RAAG.get(F.raag) || {}).en || F.raag}`]] : []),
      ...(F.artist ? [["artist", F.artist, (ARTIST.get(F.artist) || {}).en || F.artist]] : []),
      ...(F.gharana ? [["gharana", F.gharana, `${F.gharana} gharana`]] : []),
      ...(F.likedOnly ? [["likedOnly", "", "Liked only"]] : []),
    ];
    $("#jb-active").innerHTML = chips.length
      ? chips.map(([k, v, l]) => `<button class="chip" type="button" data-k="${k}" data-v="${esc(v)}" aria-label="Remove filter ${esc(l)}">${esc(l)}</button>`).join("") +
        `<button class="btn small" type="button" id="jb-clear">Clear all</button>`
      : `<span class="hint">All performances</span>`;
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
      return `<li><span>${esc(label(v))} <small class="hint">${esc(v.t)}</small></span><button class="btn small" type="button" data-un="${list}" data-id="${esc(id)}">Remove</button></li>`;
    };
    $("#jb-prefs").innerHTML = `<summary>Your liked performances (${prefs.likes.length}) and hidden ones (${prefs.never.length})</summary>
      <h3 class="hint">Liked: these come up 4× as often</h3><ul>${prefs.likes.map((id) => row(id, "likes")).join("") || "<li class='hint'>None yet. Press ♥ Like while a performance plays.</li>"}</ul>
      <h3 class="hint">Never play</h3><ul>${prefs.never.map((id) => row(id, "never")).join("") || "<li class='hint'>None</li>"}</ul>
      <p class="hint">Saved in this browser only.</p>`;
    $$("#jb-prefs [data-un]").forEach((b) => b.onclick = () => { toggle(b.dataset.un, b.dataset.id, false); prefsChanged(); });
    if (VIDEOS.size) { updateCounts(); updateButtons(); }
  }

  function togglePlay() { if (!current || !player) return next(); playing() ? player.pauseVideo() : player.playVideo(); }
  function likeCurrent() { if (!current) return; toggle("likes", current.id, !isLiked(current.id)); prefsChanged(); }

  function init() {
    renderFilters(); prefsChanged(); showEmpty();
    $("#jb-play").onclick = togglePlay;
    $("#jb-skip").onclick = next;
    $("#jb-prev").onclick = prev;
    $("#jb-like").onclick = likeCurrent;
    $("#jb-never").onclick = () => { toggle("never", current.id, true); prefsChanged(); next(); };
    $("#jb-empty-clear").onclick = clearFilters;
    $("#jb-edit").onclick = () => {
      const open = $("#jb-filters").hidden;
      $("#jb-filters").hidden = !open;
      $("#jb-edit").setAttribute("aria-expanded", String(open));
      $("#jb-edit").textContent = open ? "Done" : "Edit filters";
    };
    $("#mini-play").onclick = togglePlay;
    $("#mini-skip").onclick = next;
    $("#mini-like").onclick = likeCurrent;
    // "follow the clock": refresh the label and counts when the prahar changes
    setInterval(() => { if (F.now) updateCounts(); }, 5 * 60 * 1000);
  }

  return { init, start, setFilters, countFor, prefsChanged, updateMini, pause: () => { try { player && player.pauseVideo(); } catch { /* not ready */ } } };
})();

function playFiltered(kind, value) {
  const f = kind === "now" ? { now: true } : kind === "mood" ? { moods: [value] } : kind === "season" ? { seasons: [value] }
    : kind === "raag" ? { raag: value } : kind === "artist" ? { artist: value } : kind === "gharana" ? { gharana: value } : {};
  jb.setFilters(f);
  location.hash = "#/jukebox";
  jb.start();
}

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
  view.innerHTML = `<p>Couldn't load raagmala.json (${esc(e.message)}). Serve this folder over HTTP, e.g. <code>python3 -m http.server</code> inside <code>docs/</code>.</p>`;
  console.error(e);
});
