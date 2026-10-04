"""Decide whether a YouTube video is a relevant Hindustani *vocal* performance and of which raag(s).

classify(video) -> {"ok": bool, "why": reason, "raags": [ids], "form": str, "artists": [ids]}
Used by youtube_match.py (and later the build), never calls the network.
Rule of thumb from the brief: prefer no video over a wrong one.
"""
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

MIN_SECONDS, MAX_SECONDS = 4 * 60, 75 * 60
UNKNOWN_MIN_SECONDS = 10 * 60  # singer not recognised: short clips are mostly students' demos
MAX_RAAGS_PER_VIDEO = 2  # more than this in one title = compilation / ragamala

RAAG_WORDS = {"raag", "raga", "rag", "raagam", "ragam", "raaga", "raagu", "राग", "রাগ", "রাগ্"}
FORM_WORDS = {
    "khayal": r"khayal|khyal|khayaal|kheyal|bada khayal|chhota khayal|vilambit|drut|madhya ?laya|bandish|"
              r"tarana|ख्याल|खयाल|बंदिश|খেয়াল|খেয়াল|বন্দিশ",
    "dhrupad": r"dhrupad|dhamar|dhrupada|ध्रुपद|ধ্রুপদ|ধামার",
    "thumri": r"thumri|ठुमरी|ঠুমরি|ঠুংরি",
    "dadra": r"\bdadra\b|दादरा|দাদরা",
    "tappa": r"\btappa\b|टप्पा|টপ্পা",
}
VOCAL_WORDS = re.compile(r"\bvocal|gayan|gayaki|gaayan|\bsings?\b|singing|singer|गायन|কণ্ঠ|গায়ন|"
                         r"khayal|khyal|khayaal|kheyal|bandish|tarana|ख्याल|खयाल|बंदिश|খেয়াল|খেয়াল|বন্দিশ|"
                         r"dhrupad|dhamar|ध्रुपद|ধ্রুপদ|thumri|ठुमरी|ঠুমরি|ঠুংরি|\bdadra\b|\btappa\b", re.I)
INSTRUMENTS = re.compile(
    r"\bsitar|sarod|santoor|santur|\bflute|bansuri|shehnai|shehanai|violin|sarangi solo|\bveena|rudra ?veena|"
    r"\bbeen\b|guitar|\bpiano|keyboard|mandolin|saxophone|clarinet|jaltarang|tabla solo|pakhawaj solo|"
    r"harmonium solo|instrumental|surbahar|esraj|dilruba|\bgat\b|\bgath\b|jhala|\bjor\b|"
    r"\bon (the )?(sitar|sarod|flute|violin|santoor)", re.I)
HARD_INSTRUMENTAL = re.compile(r"\bgat\b|\bgath\b|jhala|\bjor\b|instrumental|\bsolo\b|"
                               r"\bon (the )?(sitar|sarod|flute|violin|santoor|veena|guitar|piano)", re.I)
INSTRUMENTALISTS = re.compile(
    r"ravi shankar|vilayat khan|hariprasad|chaurasia|shivkumar|shiv kumar sharma|amjad ali khan|ali akbar khan|"
    r"nikhil banerjee|bismillah|shahid parvez|budhaditya|rahul sharma|purbayan|niladri|anoushka|ronu majumdar|"
    r"n\.? ?rajam|kala ramnath|ram narayan|sultan khan|brij bhushan kabra|vishwa mohan|debashish bhattacharya|"
    r"tejendra|pannalal|annapurna devi|asad ali khan|bahauddin|shujaat|irshad khan|kushal das|partha bose|"
    r"rais khan|manilal nag|buddhadev das ?gupta|ayaan ali|amaan ali|zakir hussain|rakesh chaurasia|"
    r"pravin godkhindi|ustad imrat khan|nishat khan|shahid parvez|sabir khan|kamal sabri|dhruba ghosh|"
    r"rupak kulkarni|shashank subramanyam|anupama bhagwat|shubhendra rao|saskia rao|wajahat khan|"
    r"l\.? ?subramaniam|rajeev taranath|tarun bhattacharya|bhajan sopori|abhay sopori|satish vyas|kartick kumar", re.I)
EXCLUDE = re.compile(
    r"learn|lesson|tutorial|\bclass(es)?\b|sikhe|sikhiye|सीखें|সিখুন|practice|riyaz|riyaaz|alankar|palta|"
    r"sargam geet|\baroha?\b|\bavaroha?\b|avroh|notation|swaralipi|swarlipi|explain|introduction to|how to|basics|beginner|"
    r"\bfilm|movie|bollywood|filmi|based on raa?g|song based|film song|cover|unplugged|remix|lofi|lo-fi|fusion|"
    r"karaoke|jukebox|juke box|non[- ]?stop|compilation|playlist|collection|medley|mashup|full album|"
    r"#shorts|\bshorts?\b|ringtone|status|meditation|relax|sleep|healing|study music|432 ?hz|8d|"
    r"bhajan|ghazal|qawwal|natya ?sangeet|abhang|kirtan|aarti|\bsufi|devotional|"
    r"carnatic|kriti|krithi|\bkirtana|thyagaraja|tyagaraja|dikshitar|annamacharya|purandara|thillana|varnam|"
    r"indian idol|sa ?re ?ga ?ma ?pa|little champs|audition|competition|reality show|"
    r"\btop \d+|best of|\bost\b|soundtrack|studios|from the (film|movie)|marathi movie|"
    r"\d+ (ragas|raags|bandishes)\b|part \d+ of",
    re.I)
ALBUM = re.compile(r"\(?\balbum\s*:[^)/|]*\)?|\bvol(ume)?\.? ?\d+", re.I)
CHANNEL_EXCLUDE = re.compile(r"class|academy|lesson|tutorial|school|shikkha|sikh|learn|riyaz|sargam zone|"
                             r"education|therapy|meditation|healing|raagaflow", re.I)
# names that are also ordinary words / people / places: need "raag" right next to them
AMBIGUOUS = {"shree", "desh", "durga", "bahar", "megh", "lalit", "jog", "mand", "nand", "gara", "pahadi", "kafi",
             "sohni", "kedar", "basant", "marwa", "purvi", "hameer", "bilawal", "multani", "kamod", "tilang", "pilu",
             "asavari", "hindol", "jogiya", "deshkar", "shankara", "puriya", "kalavati", "kirwani", "abhogi",
             "adana", "paraj", "durga", "todi", "khamaj", "bihag", "jaunpuri", "patdeep", "bhatiyar", "kalingda",
             "bairagi", "nat-bhairav", "gunakri", "bibhas", "ramkali", "nand"}


# ---------------------------------------------------------------- normalisation
def deaccent(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()


def tok_norm(t):
    """Spelling-tolerant form of one romanised word (Bhoopali ~ Bhupali, Yaman ~ Iman, Kedara ~ Kedar)."""
    s = re.sub(r"[^a-z]", "", deaccent(t.lower()))
    for a, b in (("aa", "a"), ("ee", "i"), ("oo", "u"), ("w", "v"), ("sh", "s"), ("ph", "f"), ("kh", "k"),
                 ("bh", "b"), ("dh", "d"), ("th", "t"), ("ch", "c"), ("gh", "g"), ("y", "i"), ("z", "j")):
        s = s.replace(a, b)
    return s[:-1] if len(s) > 4 and s.endswith("a") else s


def tokens(title):
    """Title -> list of normalised tokens (romanised words normalised; Bengali/Devanagari words kept as-is)."""
    out = []
    for w in re.split(r"[\s|,.:;!?/\\()\[\]{}\-–—_'\"“”‘’#+&@*~]+", unicodedata.normalize("NFC", title)):
        if not w:
            continue
        if re.search(r"[a-zA-Z]", w):
            # split camel case / glued words like "RaagYaman"
            for part in re.findall(r"[A-Z]?[a-z]+|[A-Z]+(?![a-z])", deaccent(w)) or [w]:
                n = tok_norm(part)
                if n:
                    out.append(n)
        else:
            out.append(w)
    return out


def skel(name):
    """Consonant skeleton of a person's name, per word: Chakrabarty ~ Chakraborty, Mansur ~ Mansoor."""
    out = []
    for w in re.findall(r"[a-z]+", deaccent(name.lower())):
        w = tok_norm(w)
        w = re.sub(r"(.)\1+", r"\1", w)
        w = w[0] + re.sub(r"[aeiou]", "", w[1:])
        out.append(w)
    return out


HONORIFICS = {"pandit", "pt", "ustad", "vidushi", "begum", "smt", "shri", "sri", "dr", "pt."}


# ---------------------------------------------------------------- lexicons
def _load():
    rj = json.loads((DATA / "raags.json").read_text(encoding="utf-8"))
    names = []  # (token tuple, raag id, is_core)
    for r in rj["raags"] + rj["extra"]:
        core = r.get("facts", False)
        variants = {r["en"]} | set(r.get("aliases") or [])
        for v in variants:
            t = tuple(tokens(v))
            if t:
                names.append((t, r["id"], core))
                if len(t) > 1:
                    names.append((("".join(t),), r["id"], core))  # glued: "Yamankalyan"
        for v in (r.get("bn"), r.get("bnAlt"), r.get("hi")):
            if v:
                t = tuple(unicodedata.normalize("NFC", v).split())
                names.append((t, r["id"], core))
    names.sort(key=lambda n: -sum(len(x) for x in n[0]))  # longest first
    aj = json.loads((DATA / "artists.json").read_text(encoding="utf-8"))["artists"]
    # data/vocalists_extra.txt: vocalists without an English Wikipedia page ("Name"), and other spellings of
    # known artists ("Spelling = artist-id", e.g. "Kaivalyakumar = kaivalya-kumar-gurav").
    extra = DATA / "vocalists_extra.txt"
    aliases = []
    if extra.exists():
        known = {a["en"] for a in aj}
        for l in extra.read_text(encoding="utf-8").splitlines():
            l = l.strip()
            if not l or l.startswith("#"):
                continue
            if "=" in l:
                name, aid = (x.strip() for x in l.split("=", 1))
                aliases.append({"id": aid, "en": name})
            elif l not in known:
                aj.append({"id": re.sub(r"[^a-z0-9]+", "-", l.lower()).strip("-"), "en": l, "extra": True})
    honor = {skel(h)[0] for h in HONORIFICS}
    artists = []
    for a in aj + aliases:
        sk = [w for w in skel(a["en"]) if w not in ("and", "nd")]
        while len(sk) > 1 and sk[0] in honor:  # a leading title only: "Pt. X"; but Devaki *Pandit* keeps her surname
            sk = sk[1:]
        if sk:
            artists.append((sk, a["id"], a))
            if len(sk) >= 3:  # "Ashwini Bhide Deshpande" is often just "Ashwini Bhide"
                artists.append((sk[:2], a["id"], a))
    bn_artists = [(unicodedata.normalize("NFC", a["bn"]), a["id"]) for a in aj if a.get("bn") and len(a["bn"]) >= 5]
    return names, artists, bn_artists


NAMES, ARTISTS, BN_ARTISTS = _load()
CORE_IDS = {r_id for _, r_id, core in NAMES if core}


RAAG_TOKENS = {tok_norm(w) for w in RAAG_WORDS if tok_norm(w)} | {w for w in RAAG_WORDS if not re.search("[a-z]", w)}


def find_raags(title):
    """Raag ids named in the title, longest name first; each title token can belong to one raag only."""
    toks = tokens(title)
    used = [False] * len(toks)
    found = []
    for name, rid, core in NAMES:
        n = len(name)
        for i in range(len(toks) - n + 1):
            if tuple(toks[i:i + n]) == name and not any(used[i:i + n]):
                prev = toks[i - 1] if i else ""
                nxt = toks[i + n] if i + n < len(toks) else ""
                # a raag word right before/after, or a multi-word name (distinctive on its own)
                marked = prev in RAAG_TOKENS or nxt in RAAG_TOKENS or n > 1
                for k in range(i, i + n):
                    used[k] = True
                found.append({"id": rid, "core": core, "marked": marked, "span": (i, i + n)})
    out, seen = [], set()
    for f in sorted(found, key=lambda f: f["span"]):
        if f["id"] not in seen:
            seen.add(f["id"])
            out.append(f)
    return out


def combined(raags):
    """Two raag names written next to each other ("Lalit Bhatiyar", "Basant Bahar") name a third, combined raag."""
    return any(a["span"][1] == b["span"][0] for a, b in zip(raags, raags[1:]))


def find_artists(text):
    text = re.sub(r"[’']s\b", "", text)  # "Parveen Sultana's"
    toks = [w for w in skel(text) if w not in ("and", "nd")]
    hit, spans = [], []
    for sk, aid, _ in sorted(ARTISTS, key=lambda a: -len(a[0])):  # longest names first
        n = len(sk)
        if n == 1 and len(sk[0]) < 4:
            continue  # one short word ("Rao") is too ambiguous
        for i in range(len(toks) - n + 1):
            if toks[i:i + n] == sk and aid not in hit:
                if any(a <= i and i + n <= b for a, b in spans):
                    continue  # inside a longer name: "Armaan Rashid Khan" is not Rashid Khan
                hit.append(aid)
                spans.append((i, i + n))
                break
    nfc = unicodedata.normalize("NFC", text)
    hit += [aid for bn, aid in BN_ARTISTS if bn in nfc and aid not in hit]
    return hit


# ---------------------------------------------------------------- singer names read from titles
# Used only when no known singer is recognised. A name-shaped part of the title (or a "- Topic" channel)
# is accepted only with a strong signal, because bandish lyrics are often written in Title Case too.
NOT_NAME = re.compile(
    r"\b(raa?ga?m?|raag|rag|khayal|khyal|kheyal|vocal|vocals|music|musical|india|indian|festival|live|concert|"
    r"recital|records?|official|topic|foundation|sangeet|sammelan|trust|conference|archives?|audio|video|"
    r"hindustani|classical|bandish|thumri|dhrupad|dhamar|dadra|tappa|taal|tal|teentaal|tintal|ektaal|ektal|"
    r"jhaptaal|jhamptaal|rupak|vilambit|drut|madhya|madhyalaya|madhyalay|laya|part|album|series|edition|presents?|"
    r"channel|tv|radio|studio|club|society|sabha|utsav|mahotsav|baithak|darbar|saptak|episode|chota|chhota|bada|"
    r"alap|aalap|tarana|gharana|kirana|gwalior|patiala|agra|jaipur|benaras|banaras|mewati|rampur|lane|dover|"
    r"bazm|khas|events?|academy|guruji|gurukul|productions?|entertainment|network|digital|world|heritage|"
    r"legends?|rare|evening|morning|night|the|of|in|by|from|with|at|for|new|full|hd|lyrics?|song|songs|"
    r"bhajan|mix|series|vol|volume|remastered|original|quality|pseudo|forum|memorial|tribute)\b", re.I)
LYRIC_WORDS = set("""mori more moray mora mero mera mere meri balam piya piyaa sang ke ka ki ab aaye aayo aaj aayi kaise
ri re na nahi naahi nahin tum tore tori toh jaa ja jao sakhi saiyan saiyaan sajan sajna kanha kanhaiya shyam hari ram
mohe mose mohan man mann jiya nain naina bin kaun kar karat karu ho se mein main laage lage lagi bole baje bajao
ghar kal din rain jaago jago pyare ghan garajat barsat badra badariya sawan payal payaliya jhankar jhanakar langar
langarwa kankariya naiya nayya paar eri aali daiya hamare chalo dekho gori gagri neer bharu nanadiya batiya ye yeh
kahe kaahe preetam pritam jhuki aayi damini damake dar mohan murat bansuri dhun more hamari raadhe radhe krishna
jamuna gokul brij hori holi phagun basant ritu bahar kesariya bairi birha sooni suni sun suno""".split())
HONOR_RE = re.compile(r"^(?:(?:pt|pandit|pundit|ustad|ustaad|vidushi|vid|smt|shrimati|shri|sri|dr|begum|late|"
                      r"guru|maestro|padma\s*(?:shri|bhushan|vibhushan)|padmashri|padmabhushan)\.?\s+)+", re.I)
SURNAME_END = re.compile(r"(kar|jee|rjee|wala|wale|dey|sen|das|ghosh|bose|basu|roy|nath|pande|pandey|sharma|"
                         r"verma|mishra|shukla|tiwari|tripathi|joshi|rao|bhat|bhatt|iyer|kumar|singh|khan|hussain|"
                         r"ali|devi|bai|begum|kulkarni|deshpande|patil|gurav|sathe|kamat|chakraborty|chakrabarty|"
                         r"bhattacharya|bhattacharjee|mukherjee|banerjee|chatterjee|ganguly|gupta|mitra|majumdar|"
                         r"mazumdar|sarkar|dutta|datta|paul|pal|saha|biswas|mondal|pathak|sahu|jha|thakur|"
                         r"agarwal|desai|mehta|shah|vyas|mallick|dagar|gundecha|mansur|mansoor|rathod|naik|nayak|"
                         r"hegde|bhide|kale|pawar|more|jadhav|apte|gokhale|phadke|bapat|karve|ranade|pethe|"
                         r"kashyap|raghavan|prasad|sinha|srivastava|saxena|chaurasia|tagore|bhowmick|kaikini)$", re.I)


def _name_shape(seg):
    """'Pt. Harish Tiwari' -> ('Harish Tiwari', had_title) if it looks like a person's name, else (None, False)."""
    seg = seg.strip(" .:;-–—\"'“”‘’!")
    titled = bool(HONOR_RE.match(seg))
    seg = HONOR_RE.sub("", seg)
    seg = re.sub(r"\s+(sings?|singing)$", "", seg, flags=re.I)
    words = [w.capitalize() if w.isupper() and len(w) > 2 else w for w in seg.split()]
    if not 2 <= len(words) <= 4:
        return None, False
    if not all(re.fullmatch(r"[A-Z][a-z]+\.?|[A-Z]\.", w) for w in words):
        return None, False
    if sum(len(w.rstrip(".")) > 1 for w in words) < 2:
        return None, False
    name = " ".join(words)
    if NOT_NAME.search(name) or any(w.lower().rstrip(".") in LYRIC_WORDS for w in words) or find_raags(name):
        return None, False
    return name, titled


def guess_singer(title, channel):
    topic = re.fullmatch(r"(.+?)\s*-\s*Topic", channel or "")
    ch_words = {w.lower() for w in re.findall(r"[A-Za-z]{4,}", channel or "")} - {"music", "official", "topic", "records"}
    parts = []
    m = re.search(r"\bby\s+((?:[A-Z][\w.]*\s*){2,5})", title)
    if m:
        parts.append((m.group(1), True))
    m = re.match(r"\s*((?:[A-Z][\w.]*\s+){1,5})sings\b", title)
    if m:
        parts.append((m.group(1), True))
    for seg in re.split(r"\s*[|/•~·:,()\[\]]\s*|\s+[-–—]\s+|\s+(?:ll|II|I|&|and)\s+", title):
        parts.append((seg, False))
        # "Ustad Fateh Ali Khan Raga Des Khayal": also try the words before the first raag/form word
        head = re.split(NOT_NAME, seg, maxsplit=1)[0]
        if head.strip() and head.strip() != seg.strip():
            parts.append((head, False))
    if topic:
        parts.append((topic.group(1), True))
    names = []
    for seg, strong in parts:
        name, titled = _name_shape(seg)
        if not name:
            continue
        last = name.split()[-1].rstrip(".")
        sure = strong or titled or bool(SURNAME_END.search(last)) or any(w.lower() in ch_words for w in name.split())
        names.append((name, sure))
    # singers' names usually come before teachers' and composers' names, so take the first name-like part,
    # provided at least one candidate has a strong signal
    return names[0][0] if any(s for _, s in names) else None


def classify(v):
    title, channel = v["title"], v.get("channel", "")
    res = {"ok": False, "why": "", "raags": [], "form": None, "artists": []}
    if not v.get("embeddable", True):
        res["why"] = "not embeddable"; return res
    if not MIN_SECONDS <= v.get("seconds", 0) <= MAX_SECONDS:
        res["why"] = f"duration {v.get('seconds', 0) // 60} min"; return res
    plain_title = ALBUM.sub(" ", title)  # "(Album: The Best Of ...)", "Vol. 2" name a release, not a compilation
    m = EXCLUDE.search(plain_title)
    if m:
        res["why"] = f"excluded word '{m.group(0)}'"; return res
    m = CHANNEL_EXCLUDE.search(channel)
    if m:
        res["why"] = f"teaching/other channel '{m.group(0)}'"; return res
    raags = find_raags(title)
    if not raags:
        res["why"] = "no raag name in title"; return res
    if len(raags) > MAX_RAAGS_PER_VIDEO:
        res["why"] = f"{len(raags)} raags in title"; return res
    if combined(raags):
        res["why"] = "combined raag (" + " ".join(r["id"] for r in raags) + ")"; return res
    form_hit = any(re.search(p, title, re.I) for p in FORM_WORDS.values())
    artists = find_artists(title + " " + re.sub(r"\s*-\s*Topic$", "", channel))
    keep = []
    for r in raags:
        if not r["core"]:
            continue  # named raag without facts (or a longer, different raag): not assigned
        if r["id"] in AMBIGUOUS and not r["marked"]:
            continue
        if not (r["marked"] or form_hit or artists):
            continue
        keep.append(r["id"])
    if not keep:
        res["why"] = "raag name not clearly a raag (" + ",".join(r["id"] for r in raags) + ")"; return res
    res["raags"], res["artists"] = keep, artists
    hay = title + " " + channel
    if INSTRUMENTALISTS.search(hay):
        res["why"] = f"instrumentalist '{INSTRUMENTALISTS.search(hay).group(0)}'"; return res
    hard = HARD_INSTRUMENTAL.search(title)
    if hard:
        res["why"] = f"instrumental '{hard.group(0)}'"; return res
    vocal_word = VOCAL_WORDS.search(title)
    if INSTRUMENTS.search(title) and not vocal_word and not res["artists"]:
        res["why"] = f"instrument '{INSTRUMENTS.search(title).group(0)}'"; return res
    if not vocal_word and not res["artists"]:
        res["why"] = "no evidence it is vocal"; return res
    if not res["artists"] and v.get("seconds", 0) < UNKNOWN_MIN_SECONDS:
        res["why"] = "short clip by an unrecognised singer"; return res
    if not res["artists"]:  # every kept performance must be credited to a singer
        name = guess_singer(title, channel)
        if not name:
            res["why"] = "no singer identified"; return res
        res["artists"] = [re.sub(r"[^a-z0-9]+", "-", deaccent(name).lower()).strip("-")]
        res["guessed"] = name
    res["form"] = next((f for f in ("dhrupad", "thumri", "dadra", "tappa") if re.search(FORM_WORDS[f], title, re.I)),
                       "khayal")
    res["ok"] = True
    return res
