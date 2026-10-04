"""Refresh stored YouTube data so nothing is kept longer than 30 days without a refresh
(YouTube API Services Developer Policies).

- Re-fetches every accepted video (see ytfilter.classify) with videos.list (50 ids per call, 1 unit each):
  updates title, channel, duration, views and likes; drops videos that are deleted or no longer embeddable.
- In searches fetched more than 30 days ago, deletes the rejected candidates (only accepted, refreshed
  videos are kept; the file stays as a "searched" marker so the search is not repeated).
- Records the run in cache/youtube/_refresh.json; with --if-older N it does nothing if the last refresh
  was less than N days ago (so it can be called from the daily task). Then rebuilds data/yt_matches.json.

Usage: python3 scripts/refresh_stats.py [--if-older 28]
"""
import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import ytfilter  # noqa: E402
from youtube_match import (JOBS, OUT, QuotaExceeded, api_key, call, iso_seconds, load_quota,  # noqa: E402
                           save_quota)

STAMP = OUT / "_refresh.json"
KEEP_CANDIDATES_DAYS = 30


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--if-older", type=int, default=0, help="skip unless the last refresh is at least N days old")
    a = ap.parse_args()
    now = datetime.now(timezone.utc)
    if STAMP.exists():
        last = datetime.fromisoformat(json.loads(STAMP.read_text())["last"])
    else:  # never refreshed: due once the oldest search is N days old
        stamps = [json.loads(p.read_text(encoding="utf-8"))["fetched"] for p in JOBS.glob("*.json")]
        last = datetime.fromisoformat(min(stamps)) if stamps else now
    if a.if_older and now - last < timedelta(days=a.if_older):
        print(f"Refresh not due (last: {last.date()}).")
        return

    files = sorted(JOBS.glob("*.json"))
    data = {p: json.loads(p.read_text(encoding="utf-8")) for p in files}
    ok = {c["id"] for r in data.values() for c in r["candidates"] if ytfilter.classify(c)["ok"]}
    ids = sorted(ok)
    print(f"Refreshing {len(ids)} accepted videos from {len(files)} searches ({-(-len(ids) // 50)} units).",
          flush=True)

    key, quota, fresh = api_key(), load_quota(), {}
    try:
        for i in range(0, len(ids), 50):
            res = call("videos", {"part": "snippet,contentDetails,statistics,status",
                                  "id": ",".join(ids[i:i + 50]), "key": key})
            quota["used"] += 1
            for it in res.get("items", []):
                sn, st = it["snippet"], it.get("statistics", {})
                fresh[it["id"]] = {
                    "title": sn["title"], "channel": sn["channelTitle"],
                    "views": int(st.get("viewCount", 0)), "likes": int(st.get("likeCount", 0)),
                    "seconds": iso_seconds(it["contentDetails"].get("duration")),
                    "embeddable": it.get("status", {}).get("embeddable", False),
                }
    except QuotaExceeded as e:
        save_quota(quota)
        sys.exit(f"Stopped: YouTube says {e}. Nothing was changed; run again tomorrow.")
    save_quota(quota)

    removed = pruned = 0
    cutoff = now - timedelta(days=KEEP_CANDIDATES_DAYS)
    for p, r in data.items():
        old = datetime.fromisoformat(r["fetched"]) < cutoff
        kept = []
        for c in r["candidates"]:
            if c["id"] in ok:
                f = fresh.get(c["id"])
                if f and f["embeddable"]:
                    kept.append({**c, **f})
                else:
                    removed += 1
            elif not old:
                kept.append(c)
            else:
                pruned += 1
        r["candidates"] = kept
        r["refreshed"] = now.isoformat(timespec="seconds")
        p.write_text(json.dumps(r, ensure_ascii=False, indent=1), encoding="utf-8")
    STAMP.write_text(json.dumps({"last": now.isoformat(timespec="seconds")}))
    print(f"Done: {len(fresh)} videos refreshed, {removed} removed (deleted or not embeddable), "
          f"{pruned} old rejected candidates deleted.")


if __name__ == "__main__":
    main()
