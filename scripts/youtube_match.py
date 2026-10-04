"""Find YouTube performances per raag (and later per artist + raag). Resumable and quota-aware.

Each search job = one search.list (100 units) + one videos.list (1 unit). Every job's candidates are
cached in cache/youtube/q/<job id>.json; cached jobs are skipped, so the script can be stopped and rerun
any day. Quota usage is tracked per Pacific-time day in cache/youtube/_quota.json; the script stops
before --budget (default 9800) or on a quotaExceeded error.

Matching (scripts/ytfilter.py) is applied to ALL cached candidates together, offline, so a video found by
any query counts for every raag it names; --refilter recomputes data/yt_matches.json with no API calls.

Jobs run in phase order, best-known first within each phase: 1 khayal per core raag, 2 artists,
3 dhrupad (raags, singers), 4 thumri/dadra/tappa, 5 deep fill (top artists x main raags).

Usage: python3 scripts/youtube_match.py [--phase N] [--raags N] [--limit N] [--budget 9800] [--refilter]
"""
import argparse
import collections
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import requests

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ytfilter  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "cache" / "youtube"
JOBS = OUT / "q"
QUOTA_FILE = OUT / "_quota.json"
MATCHES = ROOT / "data" / "yt_matches.json"
API = "https://www.googleapis.com/youtube/v3"
SEARCH_COST = 101
KEEP = 6  # videos kept per raag and form (artist pages get every accepted video)
FALLBACK_BELOW = 3  # a raag's fallback query runs when its main query yields fewer videos


def api_key():
    for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
        k, _, v = line.partition("=")
        if k.strip() == "YOUTUBE_API_KEY":
            return v.strip().strip('"').strip("'")
    sys.exit("YOUTUBE_API_KEY not found in .env")


class QuotaExceeded(Exception):
    pass


def call(endpoint, params):
    """GET without ever printing the URL (it contains the key)."""
    try:
        r = requests.get(f"{API}/{endpoint}", params=params, timeout=30)
    except requests.RequestException as e:
        raise RuntimeError(f"{endpoint}: network error {type(e).__name__}") from None
    if r.status_code == 200:
        return r.json()
    try:
        err = r.json()["error"]
        reason = err["errors"][0].get("reason", "")
        msg = err.get("message", "")
    except Exception:
        reason, msg = "", r.text[:200]
    if reason in ("quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"):
        raise QuotaExceeded(reason)
    raise RuntimeError(f"{endpoint}: HTTP {r.status_code} {reason} {msg}")


def pt_today():
    return datetime.now(ZoneInfo("America/Los_Angeles")).strftime("%Y-%m-%d")


def load_quota():
    q = json.loads(QUOTA_FILE.read_text()) if QUOTA_FILE.exists() else {}
    return q if q.get("date") == pt_today() else {"date": pt_today(), "used": 0}


def save_quota(q):
    QUOTA_FILE.write_text(json.dumps(q))


def iso_seconds(d):
    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", d or "")
    if not m:
        return 0
    dd, h, mi, s = (int(x or 0) for x in m.groups())
    return dd * 86400 + h * 3600 + mi * 60 + s


def search(q, key):
    s = call("search", {"part": "snippet", "q": q, "type": "video", "order": "relevance",
                        "maxResults": 15, "videoEmbeddable": "true", "key": key})
    ids = [it["id"]["videoId"] for it in s.get("items", [])]
    if not ids:
        return []
    v = call("videos", {"part": "snippet,contentDetails,statistics,status", "id": ",".join(ids), "key": key})
    out = []
    for it in v.get("items", []):
        sn, st, cd = it["snippet"], it.get("statistics", {}), it["contentDetails"]
        out.append({
            "id": it["id"], "title": sn["title"], "channel": sn["channelTitle"],
            "published": sn.get("publishedAt", "")[:10],
            "views": int(st.get("viewCount", 0)), "likes": int(st.get("likeCount", 0)),
            "seconds": iso_seconds(cd.get("duration")),
            "embeddable": it.get("status", {}).get("embeddable", False),
        })
    return out


# ---------------------------------------------------------------- jobs
THUMRI_RAAGS = ["khamaj", "pilu", "bhairavi", "kafi", "tilang", "desh", "jhinjhoti", "mand", "pahadi", "gara",
                "sindhu-bhairavi", "tilak-kamod", "kalingda", "jogiya"]
DADRA_RAAGS = ["bhairavi", "khamaj", "pilu", "kafi", "desh", "pahadi"]
TAPPA_RAAGS = ["khamaj", "kafi", "bhairavi", "desh", "jhinjhoti", "pilu"]
DEEP_ARTISTS, DEEP_RAAGS = 30, 15


def build_jobs(raags, artists):
    """Every search job, in run order. Ids are stable, so finished jobs are recognised from the cache."""
    by_id = {r["id"]: r for r in raags}
    jobs = []
    for r in raags:  # phase 1
        jobs.append({"id": f"raag-{r['id']}-khayal", "phase": 1, "raag": r["id"], "q": f"Raag {r['en']} khayal vocal",
                     "fallback": {"id": f"raag-{r['id']}-khayal-2", "q": f"{r['en']} raag vocal concert"}})
    for i, a in enumerate(artists):  # phase 2
        jobs.append({"id": f"artist-{a['id']}", "phase": 2, "artist": a["id"], "q": f"{a['en']} raag"})
        if i < 100:
            jobs.append({"id": f"artist-{a['id']}-2", "phase": 2, "artist": a["id"], "q": f"{a['en']} khayal live"})
    for r in raags[:40]:  # phase 3
        jobs.append({"id": f"raag-{r['id']}-dhrupad", "phase": 3, "raag": r["id"], "q": f"Raag {r['en']} dhrupad"})
    for a in artists:
        if "dhrupad" in a["forms"] and (any("dhrupad" in g for g in a["gharana"])
                                        or re.search(r"dagar|gundecha|mallick|bhawalkar|tiwari", a["id"])):
            jobs.append({"id": f"artist-{a['id']}-dhrupad", "phase": 3, "artist": a["id"], "q": f"{a['en']} dhrupad"})
    for form, ids in (("thumri", THUMRI_RAAGS), ("dadra", DADRA_RAAGS), ("tappa", TAPPA_RAAGS)):  # phase 4
        for rid in ids:
            if rid in by_id:
                jobs.append({"id": f"raag-{rid}-{form}", "phase": 4, "raag": rid, "q": f"{by_id[rid]['en']} {form}"})
    for a in [a for a in artists if "thumri" in a["forms"]][:40]:
        jobs.append({"id": f"artist-{a['id']}-thumri", "phase": 4, "artist": a["id"], "q": f"{a['en']} thumri"})
    for a in artists[:DEEP_ARTISTS]:  # phase 5
        for r in raags[:DEEP_RAAGS]:
            jobs.append({"id": f"deep-{a['id']}-{r['id']}", "phase": 5, "artist": a["id"], "raag": r["id"],
                         "q": f"{a['en']} raag {r['en']}"})
    return jobs


def load_cached():
    out = {}
    for p in sorted(JOBS.glob("*.json")):
        out[p.stem] = json.loads(p.read_text(encoding="utf-8"))
    return out


def run_job(job, key, quota):
    res = {"q": job["q"], "fetched": datetime.now(timezone.utc).isoformat(timespec="seconds"),
           "candidates": search(job["q"], key)}
    quota["used"] += SEARCH_COST
    save_quota(quota)
    (JOBS / f"{job['id']}.json").write_text(json.dumps(res, ensure_ascii=False, indent=1), encoding="utf-8")
    return res


# ---------------------------------------------------------------- matching
FIELDS = ("id", "title", "channel", "views", "likes", "seconds", "published")


def match_all(cached):
    """All cached candidates -> ({raag: {form: [top videos]}}, {artist: [videos]}), plus every decision."""
    videos = {}
    for job_id, res in cached.items():
        for c in res["candidates"]:
            videos.setdefault(c["id"], {**c, "jobs": []})["jobs"].append(job_id)
    by_raag = collections.defaultdict(lambda: collections.defaultdict(list))
    by_artist = collections.defaultdict(list)
    decisions = {}
    for vid, v in videos.items():
        d = ytfilter.classify(v)
        decisions[vid] = d
        if d["ok"]:
            rec = {**{k: v.get(k) for k in FIELDS}, "artists": d["artists"], "raags": d["raags"], "form": d["form"]}
            for rid in d["raags"]:
                by_raag[rid][d["form"]].append(rec)
            for aid in d["artists"]:
                by_artist[aid].append(rec)

    def dedupe(vs, n=None):
        vs = sorted(vs, key=lambda x: -x["views"])
        kept, seen = [], set()
        for x in vs:  # skip re-uploads of the same recording
            tkey = (re.sub(r"\W+", "", x["title"].lower())[:40], x["channel"])
            if tkey not in seen:
                seen.add(tkey)
                kept.append(x)
        return kept[:n] if n else kept

    raags = {rid: {form: dedupe(vs, KEEP) for form, vs in forms.items()} for rid, forms in by_raag.items()}
    artists = {aid: dedupe(vs) for aid, vs in by_artist.items()}
    return (raags, artists), videos, decisions


def write_matches(cached, jobs):
    (raags, artists), videos, decisions = match_all(cached)
    done = [j for j in jobs if j["id"] in cached]
    data = {"updated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            # what has been searched, so the site can tell "searched, nothing found" from "not searched yet"
            "searched": {"raags": sorted({f"{j['raag']}:{j['id'].rsplit('-', 1)[-1]}" for j in done
                                          if j["id"].startswith("raag-")}),
                         "artists": sorted({j["artist"] for j in done if j["id"].startswith("artist-")})},
            "raags": raags, "artists": artists}
    MATCHES.write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    return raags, artists


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--phase", type=int, default=0, help="only jobs of this phase (0 = all, in order)")
    ap.add_argument("--raags", type=int, default=0, help="only the N best-known core raags (0 = all)")
    ap.add_argument("--limit", type=int, default=0, help="max jobs this run (0 = no limit)")
    ap.add_argument("--budget", type=int, default=9800, help="max units to use per PT day")
    ap.add_argument("--refilter", action="store_true", help="recompute matches from cache; no API calls")
    a = ap.parse_args()

    raags = sorted(json.loads((ROOT / "data" / "raags.json").read_text(encoding="utf-8"))["raags"],
                   key=lambda r: r["rank"])
    artists = sorted(json.loads((ROOT / "data" / "artists.json").read_text(encoding="utf-8"))["artists"],
                     key=lambda r: r["rank"])
    JOBS.mkdir(parents=True, exist_ok=True)
    all_jobs = build_jobs(raags, artists)
    cached = load_cached()

    if a.refilter:
        r, ar = write_matches(cached, all_jobs)
        print(f"refiltered {len(cached)} cached searches -> {len(r)} raags, {len(ar)} artists with videos")
        return

    top = {r["id"] for r in raags[:a.raags]}
    jobs = [j for j in all_jobs if (not a.phase or j["phase"] == a.phase)
            and (not a.raags or "raag" not in j or j["raag"] in top)]
    todo = [j for j in jobs if j["id"] not in cached]
    print(f"{len(jobs) - len(todo)} searches cached, {len(todo)} to do "
          f"(by phase: {dict(collections.Counter(j['phase'] for j in todo))})", flush=True)
    key, quota, done, fails = api_key(), load_quota(), 0, 0
    for j in todo:
        if a.limit and done >= a.limit:
            break
        if quota["used"] + 2 * SEARCH_COST > a.budget:  # room for a possible fallback
            print(f"Stopping: daily budget reached ({quota['used']} units used today PT).")
            break
        try:
            cached[j["id"]] = run_job(j, key, quota)
            if "fallback" in j and j["fallback"]["id"] not in cached:
                (m, _), _, _ = match_all({j["id"]: cached[j["id"]]})
                if sum(len(v) for v in m.get(j["raag"], {}).values()) < FALLBACK_BELOW:
                    cached[j["fallback"]["id"]] = run_job(j["fallback"], key, quota)
        except QuotaExceeded as e:
            print(f"Stopping: YouTube says {e}.")
            quota["used"] = a.budget
            save_quota(quota)
            break
        except RuntimeError as e:
            fails += 1
            print(f"  error on {j['id']}: {e}")
            if fails >= 3:
                print("Stopping after 3 errors.")
                break
            continue
        done += 1
        if done % 20 == 0:
            print(f"  {done} searches, {quota['used']} units today", flush=True)
    r, ar = write_matches(cached, all_jobs)
    left = len([j for j in all_jobs if j["id"] not in cached])
    print(f"Done this run: {done}. Jobs left (all phases): {left}. Units used today (PT): {quota['used']}. "
          f"Raags with videos: {len(r)}; artists with videos: {len(ar)}.")


if __name__ == "__main__":
    main()
