"""Combine raags, artists, moods and YouTube matches into docs/raagmala.json (the one file the site loads).

Usage: python3 scripts/build_data.py
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA, SITE = ROOT / "data", ROOT / "docs"

THAAT_BN = {"bilawal": "বিলাবল", "kalyan": "কল্যাণ", "khamaj": "খাম্বাজ", "bhairav": "ভৈরব", "purvi": "পূরবী",
            "marwa": "মারোয়া", "kafi": "কাফি", "asavari": "আশাবরী", "bhairavi": "ভৈরবী", "todi": "টোড়ি"}
PRAHARS = {  # start hour, end hour, Bengali, English
    1: (6, 9, "প্রভাত", "Morning"), 2: (9, 12, "পূর্বাহ্ণ", "Late morning"), 3: (12, 15, "মধ্যাহ্ন", "Midday"),
    4: (15, 18, "অপরাহ্ণ", "Afternoon"), 5: (18, 21, "সন্ধ্যা", "Evening"), 6: (21, 24, "রাত্রি", "Night"),
    7: (0, 3, "মধ্যরাত", "Midnight"), 8: (3, 6, "শেষ রাত", "Before dawn")}
FORMS = {"khayal": "খেয়াল", "dhrupad": "ধ্রুপদ", "thumri": "ঠুমরি", "dadra": "দাদরা", "tappa": "টপ্পা"}
SEASONS = {"varsha": ("বর্ষা", "Monsoon", [6, 7, 8, 9]), "basant": ("বসন্ত", "Spring", [2, 3, 4])}
GHARANA_BN = {"Agra": "আগ্রা", "Gwalior": "গোয়ালিয়র", "Jaipur-Atrauli": "জয়পুর-অত্রৌলি", "Kirana": "কিরানা",
              "Patiala": "পাতিয়ালা", "Rampur-Sahaswan": "রামপুর-সহসওয়ান", "Mewati": "মেওয়াতি",
              "Bhendibazaar": "ভেন্ডিবাজার", "Indore": "ইন্দোর", "Delhi": "দিল্লি", "Benaras": "বেনারস",
              "Bishnupur": "বিষ্ণুপুর", "Sham Chaurasia": "শাম চৌরাসিয়া", "Dagar (dhrupad)": "ডাগর",
              "Darbhanga (dhrupad)": "দ্বারভাঙ্গা", "Bettiah (dhrupad)": "বেতিয়া", "Qawwal Bachchon": "কাওয়াল বাচ্চোঁ",
              "Talwandi": "তলবন্দী"}


def drop_empty(d, keep=()):
    return {k: v for k, v in d.items() if k in keep or v not in (None, "", [], {}, False)}


def main():
    rj = json.loads((DATA / "raags.json").read_text(encoding="utf-8"))
    artists = json.loads((DATA / "artists.json").read_text(encoding="utf-8"))["artists"]
    moods = json.loads((DATA / "moods.json").read_text(encoding="utf-8"))
    yt = json.loads((DATA / "yt_matches.json").read_text(encoding="utf-8"))
    searched = set(yt["searched"]["raags"])

    # performances table: every video kept for a raag page or an artist page
    videos = {}

    def add(v):
        videos.setdefault(v["id"], drop_empty({
            "t": v["title"], "ch": v["channel"], "views": v["views"], "sec": v["seconds"],
            "form": v["form"], "raags": v["raags"], "artists": v["artists"]}))
        return v["id"]

    out_raags = []
    for r in rj["raags"]:
        forms = yt["raags"].get(r["id"], {})
        vids = {f: [add(v) for v in vs] for f, vs in forms.items()}
        out_raags.append(drop_empty({
            "id": r["id"], "rank": r["rank"], "en": r["en"], "bn": r["bn"], "hi": r.get("hi"),
            "aliases": [a for a in r.get("aliases", []) if a.lower() != r["en"].lower()], "bnAlt": r.get("bnAlt"),
            "thaat": r.get("thaat"), "prahar": r.get("prahar"), "season": r.get("season"), "jati": r.get("jati"),
            "vadi": r.get("vadi"), "samvadi": r.get("samvadi"), "aroha": r.get("aroha"), "avaroha": r.get("avaroha"),
            "related": r.get("related"), "moods": moods["raags"].get(r["id"], []), "wiki": r.get("wiki"),
            # null = not searched yet; {} = searched, nothing relevant found
            "videos": vids if f"{r['id']}:khayal" in searched else None,
        }, keep=("videos",)))
    extra = [drop_empty({"id": e["id"], "en": e["en"], "bn": e.get("bn"), "hi": e.get("hi"), "auto": e.get("enAuto")})
             for e in rj["extra"]]

    known = {a["id"] for a in artists}
    out_artists = []
    for a in artists:
        vids = [add(v) for v in yt["artists"].get(a["id"], [])]
        out_artists.append(drop_empty({
            "id": a["id"], "rank": a["rank"], "en": a["en"], "bn": a.get("bn"), "hi": a.get("hi"),
            "born": a.get("born"), "died": a.get("died"), "voice": a.get("voice"), "gharana": a.get("gharana"),
            "forms": a.get("forms"), "wiki": a.get("wiki"), "videos": vids,
            "searched": a["id"] in yt["searched"]["artists"]}))
    # singers in videos but not in the Wikipedia-based list: from data/vocalists_extra.txt, or named from the
    # video title (marked "guessed" so the site can say so)
    extra_names = {}
    for l in (DATA / "vocalists_extra.txt").read_text(encoding="utf-8").splitlines():
        l = l.strip()
        if l and not l.startswith("#") and "=" not in l:
            extra_names[re.sub(r"[^a-z0-9]+", "-", l.lower()).strip("-")] = l
    guessed = yt.get("guessed", {})
    for aid, vs in yt["artists"].items():
        if aid not in known:
            name = extra_names.get(aid) or guessed.get(aid) or re.sub(r"-", " ", aid).title()
            out_artists.append(drop_empty({"id": aid, "rank": 9999, "en": name, "videos": [add(v) for v in vs],
                                           "extra": True, "guessed": aid in guessed and aid not in extra_names}))

    meta = {
        "moods": moods["moods"], "thaats": THAAT_BN, "forms": FORMS, "gharanas": GHARANA_BN,
        "prahars": {k: {"from": a, "to": b, "bn": bn, "en": en} for k, (a, b, bn, en) in PRAHARS.items()},
        "seasons": {k: {"bn": bn, "en": en, "months": m} for k, (bn, en, m) in SEASONS.items()},
        "updated": yt["updated"],
    }
    SITE.mkdir(exist_ok=True)
    data = {"meta": meta, "raags": out_raags, "extra": extra, "artists": out_artists, "videos": videos}
    (SITE / "raagmala.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    n_rec = sum(1 for r in out_raags if r.get("videos"))
    print(f"docs/raagmala.json: {len(out_raags)} raags ({n_rec} with performances), {len(extra)} other raag names, "
          f"{len(out_artists)} artists ({sum(1 for a in out_artists if a.get('videos'))} with performances), "
          f"{len(videos)} performances, {(SITE / 'raagmala.json').stat().st_size // 1024} KB.")


if __name__ == "__main__":
    main()
