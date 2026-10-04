"""Build the raag and artist catalogue: data/raags.json, data/artists.json, data/catalogue_report.md.

Raags  = data/raags_core.tsv (hand-curated facts, best-known first), cross-checked against English
         Wikipedia infoboxes, plus names (en/bn/hi) of the other Hindustani raga items on Wikidata.
Artists = English Wikipedia singer / khayal / thumri / gharana categories + data/artists_seed.txt,
          with dates, gender and Bengali/Hindi names from Wikidata and gharana from categories/infobox.
Only facts are taken (names, dates, categories, infobox fields); no prose is copied.

Usage: python3 scripts/build_catalogue.py
"""
import collections
import json
import re
import unicodedata
from pathlib import Path

import wiki

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
EN = "en.wikipedia.org"

THAATS = {"bilawal": "বিলাবল", "kalyan": "কল্যাণ", "khamaj": "খাম্বাজ", "bhairav": "ভৈরব", "purvi": "পূরবী",
          "marwa": "মারোয়া", "kafi": "কাফি", "asavari": "আশাবরী", "bhairavi": "ভৈরবী", "todi": "টোড়ি"}
PRAHARS = {1: "6–9", 2: "9–12", 3: "12–15", 4: "15–18", 5: "18–21", 6: "21–24", 7: "0–3", 8: "3–6"}
JATI = {5: "audav", 6: "shadav", 7: "sampurna"}

# gharana: canonical English -> Bengali, with spellings seen on Wikipedia
GHARANAS = {
    "Agra": ("আগ্রা", ["agra"]),
    "Gwalior": ("গোয়ালিয়র", ["gwalior"]),
    "Jaipur-Atrauli": ("জয়পুর-অত্রৌলি", ["jaipur-atrauli", "jaipur atrauli", "jaipur", "atrauli", "alladiya khan"]),
    "Kirana": ("কিরানা", ["kirana"]),
    "Patiala": ("পাতিয়ালা", ["patiala", "kasur"]),
    "Rampur-Sahaswan": ("রামপুর-সহসওয়ান", ["rampur-sahaswan", "rampur–sahaswan", "rampur sahaswan", "sahaswan"]),
    "Mewati": ("মেওয়াতি", ["mewati", "mewat"]),
    "Bhendibazaar": ("ভেন্ডিবাজার", ["bhendibazaar", "bhendi bazaar", "bhendi bazar", "bhendibazar"]),
    "Indore": ("ইন্দোর", ["indore"]),
    "Delhi": ("দিল্লি", ["delhi"]),
    "Benaras": ("বেনারস", ["benaras", "banaras", "benares", "varanasi"]),
    "Bishnupur": ("বিষ্ণুপুর", ["bishnupur"]),
    "Sham Chaurasia": ("শাম চৌরাসিয়া", ["sham chaurasia", "sham chaurasi"]),
    "Dagar (dhrupad)": ("ডাগর", ["dagar", "dagarvani", "dagar vani"]),
    "Darbhanga (dhrupad)": ("দ্বারভাঙ্গা", ["darbhanga"]),
    "Bettiah (dhrupad)": ("বেতিয়া", ["bettiah"]),
    "Qawwal Bachchon": ("কাওয়াল বাচ্চোঁ", ["qawwal bachchon", "qawwal bacchon"]),
    "Talwandi": ("তলবন্দী", ["talwandi"]),
}


# ---------------------------------------------------------------- helpers
def norm(name):
    """Spelling-tolerant key for raag names: Bhoopali ~ Bhupali, Yaman ~ Yeman, Kedara ~ Kedar."""
    s = re.sub(r"\(.*?\)", "", name.lower())
    s = re.sub(r"\b(raa?ga?m?|raag|rag|thaat)\b", "", s)
    for a, b in (("aa", "a"), ("ee", "i"), ("oo", "u"), ("w", "v"), ("sh", "s"), ("ph", "f"), ("kh", "k"),
                 ("bh", "b"), ("dh", "d"), ("th", "t"), ("ch", "c"), ("y", "i")):
        s = s.replace(a, b)
    s = re.sub(r"[^a-z]", "", s)
    return s[:-1] if len(s) > 4 and s.endswith("a") else s


def strip_prefix(label, words=("রাগ ", "राग ")):
    for w in words:
        if label and label.startswith(w):
            return label[len(w):]
    return label


def infobox(text, name):
    """Fields of the first {{Infobox <name> ...}} as {key: plain text value}."""
    i = text.lower().find("{{infobox " + name)
    if i < 0:
        return {}
    depth, j = 0, i
    while j < len(text) - 1:
        if text[j:j + 2] == "{{":
            depth += 1; j += 2; continue
        if text[j:j + 2] == "}}":
            depth -= 1; j += 2
            if depth == 0:
                break
            continue
        j += 1
    body = text[i + 2:j - 2]
    fields, depth, cur = {}, 0, ""
    parts = []
    for ch_i, ch in enumerate(body):  # split on top-level pipes
        if body[ch_i:ch_i + 2] in ("{{", "[["):
            depth += 1
        elif body[ch_i:ch_i + 2] in ("}}", "]]"):
            depth -= 1
        if ch == "|" and depth == 0:
            parts.append(cur); cur = ""
        else:
            cur += ch
    parts.append(cur)
    for p in parts[1:]:
        if "=" in p:
            k, v = p.split("=", 1)
            fields[k.strip().lower()] = plain(v)
    return fields


def lead_text(text):
    """Plain text of the article body after the top templates/infobox (for the first sentences only)."""
    depth, i = 0, 0
    while i < len(text):  # skip leading templates, files and blank lines
        if text.startswith("{{", i):
            depth += 1; i += 2; continue
        if text.startswith("}}", i):
            depth -= 1; i += 2; continue
        if depth == 0 and text[i] not in " \n" and not text.startswith("[[File:", i) \
                and not text.startswith("[[Image:", i):
            break
        i += 1
    return plain(re.sub(r"\[\[(File|Image):[^\n]*\n", "", text[i:i + 6000]))


def plain(v):
    v = re.sub(r"<ref[^>]*/>|<ref.*?</ref>|<!--.*?-->", "", v, flags=re.S)
    v = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", v)
    v = re.sub(r"\{\{(?:ubl|unbulleted list|plainlist|hlist|flatlist)\s*\|", "", v, flags=re.I)
    v = re.sub(r"<br\s*/?>", "; ", v)
    v = re.sub(r"[{}']|\s+", " ", v)
    return v.strip(" |;")


DEV_C = dict(zip("कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह",
                 "k kh g gh n ch chh j jh n t th d dh n t th d dh n p ph b bh m y r l v sh sh s h".split()))
DEV_V = dict(zip("अआइईउऊऋएऐओऔ", "a a i i u u ri e ai o au".split()))
DEV_M = dict(zip("ािीुूृेैोौ", "a i i u u ri e ai o au".split()))


def roman(dev):
    """Plain romanisation of a Hindi raag name (schwa dropped at word end): 'श्याम कानाड़ा' -> 'Shyam Kanara'."""
    words = []
    for w in dev.replace("़", "").split():
        out, i = "", 0
        while i < len(w):
            ch = w[i]
            if ch in DEV_C:
                out += DEV_C[ch]
                nxt = w[i + 1] if i + 1 < len(w) else ""
                if nxt in DEV_M:
                    out += DEV_M[nxt]; i += 1
                elif nxt == "्":  # virama
                    i += 1
                elif i + 1 < len(w):
                    out += "a"
            elif ch in DEV_V:
                out += DEV_V[ch]
            elif ch in "ंँ":
                out += "n"
            elif ch == "ः":
                out += "h"
            i += 1
        words.append(out.capitalize())
    return " ".join(words) or None


# ---------------------------------------------------------------- raags
def load_core():
    cols = "id en bn aliases thaat prahar season vadi samvadi aroha avaroha related wiki".split()
    rows = []
    for line in (DATA / "raags_core.tsv").read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        f = line.split("|")
        assert len(f) == len(cols), f"bad column count: {line}"
        r = dict(zip(cols, (x.strip() for x in f)))
        r["aliases"] = [a for a in r["aliases"].split(";") if a]
        r["related"] = [a for a in r["related"].split(";") if a]
        r["prahar"] = [int(x) for x in r["prahar"].split(",") if x]
        rows.append(r)
    return rows


def jati(aroha, avaroha):
    def n(s):  # distinct swaras, komal/tivra/octave ignored
        return len({re.sub(r"[.']", "", t).upper() for t in s.split()})
    if not aroha or not avaroha:
        return ""
    a, b = n(aroha), n(avaroha)
    return f"{JATI.get(a, a)}-{JATI.get(b, b)}"


def wiki_thaat(box, text):
    t = box.get("thaat", "") or box.get("thaat (parent scale)", "")
    if not t:  # lead sentence: "belonging to the [[Kalyan (thaat)|Kalyan]] thaat"
        m = re.search(r"\[\[(\w+) \(thaat\)", text[:6000])
        t = m.group(1) if m else ""
    first = norm(deaccent(t).split()[0]) if t.strip() else ""
    for k in THAATS:
        if norm(k) == first or norm(k) == first.replace("tat", ""):
            return k
    return t.lower() or None


def deaccent(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()


def wiki_prahar(box):
    """Rough prahar(s) from a free-text infobox time; None if not stated or not understood."""
    t = " ".join(v for k, v in box.items() if k.startswith("time")).lower()
    t = re.sub(r"sfn.*", "", t)
    if not t:
        return None
    night = bool(re.search(r"night|evening|p\.?m", t)) and not re.search(r"morning|\bday\b", t)
    m = re.search(r"\b(12|3|4|6|9)\s*(?:[ap]\.?m\.?)?\s*(?:[–-]|to)\s*(3|6|8|9|12)\b", t)
    if m:  # explicit hours, e.g. Bor & Rao's "Late night, 12–3"
        a = int(m.group(1))
        suffix = re.match(r"\s*([ap])\.?m", t[m.end(1):])
        if suffix:
            night = suffix.group(1) == "p" if a != 12 else suffix.group(1) == "a"
        if a in (3, 4) and "morning" in t:
            return [8]
        return [({6: 5, 9: 6, 12: 7, 3: 8, 4: 8} if night else {6: 1, 9: 2, 12: 3, 3: 4, 4: 8})[a]]
    rules = [(r"midnight|late night|third (prahar|quarter|part) of the night", [7]),
             (r"after midnight|last (prahar|quarter|part) of the night", [7, 8]),
             (r"early morning|dawn|sunrise|first prahar of the day|morning twilight", [8, 1]),
             (r"late morning|second prahar of the day", [2]),
             (r"\bmorning\b", [1, 2]),
             (r"afternoon|midday|noon", [3, 4]),
             (r"sunset|dusk|evening twilight|late afternoon", [4, 5]),
             (r"(first|1st) (part|prahar|quarter) of the night|early night|\bevening\b", [5]),
             (r"(second|2nd) (part|prahar|quarter) of the night", [6]),
             (r"\bnight\b", [5, 6, 7]),
             (r"any time|anytime", [])]
    for pat, val in rules:
        if re.search(pat, t):
            return val
    return None


def swara(v):
    v = (v or "").strip().lower()
    m = re.match(r"(komal |tivra |shuddh )?(sa|re|ri|ga|ma|pa|dha|da|ni|[srgmpdn])\b", v)
    if not m:
        return None
    return {"sa": "s", "re": "r", "ri": "r", "ga": "g", "ma": "m", "pa": "p", "dha": "d", "da": "d",
            "ni": "n"}.get(m.group(2), m.group(2))


def build_raags(report):
    core = load_core()
    ids = {r["id"] for r in core}
    for r in core:
        bad = [x for x in r["related"] if x not in ids]
        if bad:
            report.append(f"- {r['id']}: unknown related ids {bad}")
            r["related"] = [x for x in r["related"] if x in ids]

    wd = wiki.sparql("""
SELECT ?r ?en ?bn ?hi ?enwiki (COUNT(DISTINCT ?sl) AS ?nsl) WHERE {
  ?r wdt:P31 wd:Q216926 ; wdt:P366 wd:Q1770695 .
  OPTIONAL { ?r rdfs:label ?en FILTER(LANG(?en)="en") }
  OPTIONAL { ?r rdfs:label ?bn FILTER(LANG(?bn)="bn") }
  OPTIONAL { ?r rdfs:label ?hi FILTER(LANG(?hi)="hi") }
  OPTIONAL { ?enwiki schema:about ?r ; schema:isPartOf <https://en.wikipedia.org/> }
  OPTIONAL { ?sl schema:about ?r }
} GROUP BY ?r ?en ?bn ?hi ?enwiki""")
    by_qid = {w["r"]: w for w in wd}
    by_key = collections.defaultdict(list)
    for w in wd:
        if w.get("en"):
            by_key[norm(w["en"])].append(w)

    cat = [t for t in wiki.category_members(EN, "Category:Hindustani ragas")]
    pg = wiki.pages(EN, [r["wiki"] for r in core if r["wiki"]] + cat)

    extra_q = sorted({p["qid"] for p in pg.values() if p.get("qid") and p["qid"] not in by_qid})
    if extra_q:
        for row in wiki.sparql("SELECT ?r ?en ?bn ?hi WHERE { VALUES ?r { %s } "
                               "OPTIONAL { ?r rdfs:label ?en FILTER(LANG(?en)='en') } "
                               "OPTIONAL { ?r rdfs:label ?bn FILTER(LANG(?bn)='bn') } "
                               "OPTIONAL { ?r rdfs:label ?hi FILTER(LANG(?hi)='hi') } }"
                               % " ".join("wd:" + q for q in extra_q)):
            by_qid.setdefault(row["r"], {**row, "nsl": "0"})
    used_qids, out, n_cmp, conflicts = set(), [], 0, []
    for rank, r in enumerate(core, 1):
        p = pg.get(r["wiki"]) if r["wiki"] else None
        if r["wiki"] and not p:
            report.append(f"- {r['id']}: Wikipedia page '{r['wiki']}' not found")
        w = by_qid.get(p["qid"]) if p and p.get("qid") else None
        if not w:  # name match against Wikidata labels
            for key in [norm(r["en"])] + [norm(a) for a in r["aliases"]]:
                cands = [c for c in by_key.get(key, []) if c["r"] not in used_qids]
                if len(cands) == 1:
                    w = cands[0]
                    break
        if w:
            used_qids.add(w["r"])
        rec = {"id": r["id"], "rank": rank, "en": r["en"], "bn": r["bn"],
               "hi": strip_prefix((w or {}).get("hi")) or None, "aliases": r["aliases"],
               "thaat": r["thaat"] or None, "prahar": r["prahar"], "season": r["season"] or None,
               "jati": jati(r["aroha"], r["avaroha"]) or None, "vadi": r["vadi"] or None,
               "samvadi": r["samvadi"] or None, "aroha": r["aroha"] or None, "avaroha": r["avaroha"] or None,
               "related": r["related"], "wikidata": (w or {}).get("r"), "wiki": p["title"] if p else None,
               "facts": True}
        # ---- cross-check against Wikipedia (infobox) and Wikidata (Bengali label)
        if p:
            box = infobox(p["text"], "raga")
            n_cmp += 1
            wt = wiki_thaat(box, p["text"])
            if wt and r["thaat"] and wt != r["thaat"]:
                conflicts.append((r["id"], "thaat", r["thaat"], wt))
            if wt and not r["thaat"] and wt in THAATS:
                rec["thaat"] = wt
                conflicts.append((r["id"], "thaat (filled from Wikipedia)", "", wt))
            wp = wiki_prahar(box)
            if wp and r["prahar"] and not set(wp) & set(r["prahar"]):
                conflicts.append((r["id"], "time", ",".join(map(str, r["prahar"])),
                                  next(v for k, v in box.items() if k.startswith("time"))))
            for f in ("vadi", "samvadi"):
                theirs = swara(box.get(f) or box.get("samavadi" if f == "samvadi" else f))
                if theirs and r[f] and theirs != r[f].lower():
                    conflicts.append((r["id"], f, r[f], box.get(f) or box.get("samavadi")))
        wbn = strip_prefix((w or {}).get("bn"))
        if wbn and wbn.replace(" ", "") != r["bn"].replace(" ", ""):
            rec["bnAlt"] = wbn  # Wikidata's Bengali spelling, kept as a search alias
        out.append(rec)

    # ---- the other Hindustani raga items on Wikidata: names only (most have no English label, so the
    # romanised name is derived from the Hindi label and marked "auto")
    nospace = lambda x: (x or "").replace(" ", "").replace("-", "")
    seen = {norm(r["en"]) for r in core} | {norm(a) for r in core for a in r["aliases"]}
    seen_bn = {nospace(r["bn"]) for r in out} | {nospace(r.get("bnAlt")) for r in out}
    extra = []
    for w in sorted(wd, key=lambda w: (-int(w["nsl"]), w.get("en") or "")):
        bn, hi = strip_prefix(w.get("bn")), strip_prefix(w.get("hi"))
        en = re.sub(r"^Raga |\s*\((raga|raag)\)$", "", w["en"]) if w.get("en") else None
        auto = not en
        if auto:
            en = roman(hi) if hi else None
        if w["r"] in used_qids or not en or norm(en) in seen or (bn and nospace(bn) in seen_bn):
            continue
        seen.add(norm(en))
        seen_bn.add(nospace(bn))
        extra.append({"id": re.sub(r"[^a-z0-9]+", "-", en.lower()).strip("-"), "rank": None, "en": en,
                      "enAuto": auto or None, "bn": bn, "hi": hi, "wikidata": w["r"], "facts": False})
    for i, e in enumerate(extra):
        e["rank"] = len(out) + i + 1
    return out, extra, conflicts, n_cmp


# ---------------------------------------------------------------- artists
def build_artists(report):
    seed = [l.strip() for l in (DATA / "artists_seed.txt").read_text(encoding="utf-8").splitlines()
            if l.strip() and not l.startswith("#")]
    exclude = {l.strip() for l in (DATA / "artists_exclude.txt").read_text(encoding="utf-8").splitlines()
               if l.strip() and not l.startswith("#")}
    cats = ["Category:Hindustani singers", "Category:20th-century Khyal singers", "Category:Khyal singers",
            "Category:Thumri"] + wiki.category_members(EN, "Category:Vocal gharanas", ns=14)
    found = collections.OrderedDict((t, "seed") for t in seed)
    for c in cats:
        for t in wiki.category_members(EN, c):
            found.setdefault(t, c.split(":", 1)[1])
    pg = wiki.pages(EN, list(found))
    missing = [t for t in seed if t not in pg]
    if missing:
        report.append(f"- seed artists without an English Wikipedia page: {missing}")

    qids = sorted({p["qid"] for p in pg.values() if p.get("qid")})
    wd = {}
    for i in range(0, len(qids), 150):
        vals = " ".join("wd:" + q for q in qids[i:i + 150])
        for row in wiki.sparql(f"""
SELECT ?p ?bn ?hi ?born ?died ?sex ?human (COUNT(DISTINCT ?sl) AS ?nsl) WHERE {{
  VALUES ?p {{ {vals} }}
  OPTIONAL {{ ?p rdfs:label ?bn FILTER(LANG(?bn)="bn") }}
  OPTIONAL {{ ?p rdfs:label ?hi FILTER(LANG(?hi)="hi") }}
  OPTIONAL {{ ?p wdt:P569 ?born }} OPTIONAL {{ ?p wdt:P570 ?died }}
  OPTIONAL {{ ?p wdt:P21 ?sex }}
  OPTIONAL {{ ?p wdt:P31 ?human FILTER(?human = wd:Q5) }}
  OPTIONAL {{ ?sl schema:about ?p }}
}} GROUP BY ?p ?bn ?hi ?born ?died ?sex ?human"""):
            wd.setdefault(row["p"], row)  # first row wins when a property has several values

    out, seen = [], set()
    seed_titles = {pg[t]["title"] for t in seed if t in pg}
    for t, src in found.items():
        p = pg.get(t)
        if not p or p["title"] in seen:
            continue
        w = wd.get(p.get("qid"), {})
        is_seed = p["title"] in seed_titles
        cats_l = " ".join(p["cats"]).lower()
        lead = p["text"][:5000].lower()
        if not is_seed:
            if not w.get("human") or p["title"] in exclude:
                continue
            if re.search(r"playback singers|film singers|ghazal|qawwal|pop singers|film score|"
                         r"(sarangi|sitar|sarod|santoor|flute|shehnai|violin|veena) players",
                         cats_l + " " + p["title"].lower()) \
                    and "khyal singers" not in cats_l:
                continue
            died = (w.get("died") or "")[:4]
            if died and int(died) < 1902:  # before the first Indian gramophone recordings
                continue
            if not re.search(r"singer|vocalist|khyal", cats_l):
                continue
            if not re.search(r"khayal|khyal|dhrupad|dhamar|thumri|gharana", lead + cats_l):
                continue
        seen.add(p["title"])
        box = infobox(p["text"], "musical artist") or infobox(p["text"], "person")
        intro = lead_text(p["text"])[:700]
        gh = []
        for hay in (intro, " ".join(box.values()), " ".join(p["cats"])):
            for name, (_, keys) in GHARANAS.items():
                if any(re.search(re.escape(k) + r"[\s-]+gharana", hay, re.I) for k in keys) or                         (name.startswith("Dagar") and re.search(r"\bdagar\b", p["title"], re.I)):
                    gh.append(name)
            if gh:
                break
        intro_l = lead_text(p["text"])[:1500].lower()
        forms = [f for f, pat in (("khayal", r"khayal|khyal"), ("dhrupad", r"dhrupad|dhamar"),
                                  ("thumri", r"thumri"), ("dadra", r"dadra"), ("tappa", r"tappa"))
                 if re.search(pat, intro_l + " " + cats_l + " " + " ".join(box.values()).lower())]
        born = (w.get("born") or "")[:4] or None
        died = (w.get("died") or "")[:4] or None
        out.append({"id": re.sub(r"[^a-z0-9]+", "-", re.sub(r"\s*\(.*?\)", "", p["title"]).lower()).strip("-"),
                    "en": re.sub(r"\s*\(.*?\)", "", p["title"]), "bn": w.get("bn"), "hi": w.get("hi"),
                    "born": born, "died": died,
                    "voice": {"Q6581097": "male", "Q6581072": "female"}.get(w.get("sex")),
                    "gharana": gh, "forms": forms, "seed": is_seed,
                    "fame": int(w.get("nsl", 0)), "wiki": p["title"], "wikidata": p.get("qid")})
    seed_rank = {t: i for i, t in enumerate(seed)}
    resolved = {pg[t]["title"]: seed_rank[t] for t in seed if t in pg}
    out.sort(key=lambda a: (0, resolved[a["wiki"]]) if a["seed"] else (1, -a["fame"]))
    for i, a in enumerate(out, 1):
        a["rank"] = i
    return out


# ---------------------------------------------------------------- report
def sample_table(rows, cols):
    lines = ["| " + " | ".join(cols) + " |", "|" + "---|" * len(cols)]
    for r in rows:
        lines.append("| " + " | ".join("" if r.get(c) in (None, []) else
                                        (", ".join(map(str, r[c])) if isinstance(r[c], list) else str(r[c]))
                                        for c in cols) + " |")
    return "\n".join(lines)


def main():
    notes = []
    raags, extra, conflicts, n_cmp = build_raags(notes)
    artists = build_artists(notes)
    (DATA / "raags.json").write_text(json.dumps({"raags": raags, "extra": extra}, ensure_ascii=False, indent=1),
                                     encoding="utf-8")
    (DATA / "artists.json").write_text(json.dumps({"artists": artists}, ensure_ascii=False, indent=1),
                                       encoding="utf-8")

    by_thaat = collections.Counter(r["thaat"] or "(none)" for r in raags)
    by_prahar = collections.Counter(p for r in raags for p in (r["prahar"] or ["any"]))
    by_gh = collections.Counter(g for a in artists for g in (a["gharana"] or ["(unknown)"]))
    by_form = collections.Counter(f for a in artists for f in (a["forms"] or ["(unknown)"]))
    md = ["# Catalogue report (checkpoint 1)", "",
          f"Core raags (full facts): **{len(raags)}**; other Hindustani raags on Wikidata (names only): "
          f"**{len(extra)}**; artists: **{len(artists)}**.", "",
          "## Raags by thaat", "", " · ".join(f"{k} {v}" for k, v in by_thaat.most_common()), "",
          "## Raags by prahar", "",
          " · ".join((f"{k} ({PRAHARS[k]}h) {by_prahar[k]}" if k in PRAHARS else f"any time {by_prahar[k]}") for k in sorted(by_prahar, key=str)), "",
          "## Artists by gharana", "", " · ".join(f"{k} {v}" for k, v in by_gh.most_common()), "",
          "## Artists by form (from Wikipedia text)", "", " · ".join(f"{k} {v}" for k, v in by_form.most_common()), "",
          f"## Cross-check against Wikipedia infoboxes ({n_cmp} raags had a page)", ""]
    md += [f"- **{i}** {f}: mine `{a}` vs Wikipedia `{b}`" for i, f, a, b in conflicts] or ["- no disagreements"]
    md += ["", "## Notes", ""] + (notes or ["- none"])
    md += ["", "## 10 sample raags", "",
           sample_table(raags[:10], ["rank", "en", "bn", "hi", "thaat", "prahar", "jati", "vadi", "samvadi", "aroha",
                                     "avaroha"]),
           "", "## 10 sample extra raags (names only)", "",
           sample_table(extra[:10], ["rank", "en", "bn", "hi", "wikidata"]),
           "", "## 10 sample artists", "",
           sample_table(artists[:10], ["rank", "en", "bn", "born", "died", "voice", "gharana", "forms", "fame"])]
    (DATA / "catalogue_report.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print("\n".join(md))


if __name__ == "__main__":
    main()
