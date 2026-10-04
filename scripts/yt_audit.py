"""Audit of the YouTube matching (from cache only, no API calls): data/yt_audit.md

Every kept video per raag, plus every rejected candidate with its reason, so the filters can be checked
by hand. Usage: python3 scripts/yt_audit.py [--raags N]
"""
import argparse
import collections
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import youtube_match as ym  # noqa: E402

ROOT = Path(__file__).resolve().parent.parent


def mins(s):
    return f"{s // 60}:{s % 60:02d}"


def cell(t):
    return t.replace("|", "/").replace("\n", " ")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raags", type=int, default=30)
    a = ap.parse_args()
    raags = sorted(json.loads((ROOT / "data" / "raags.json").read_text(encoding="utf-8"))["raags"],
                   key=lambda r: r["rank"])[:a.raags]
    cached = ym.load_cached()
    matches, videos, decisions = ym.match_all(cached)
    names = {r["id"]: f"{r['en']} ({r['bn']})" for r in raags}
    md = ["# YouTube matching audit", "",
          f"{len(cached)} searches cached, {len(videos)} distinct candidate videos, "
          f"{sum(d['ok'] for d in decisions.values())} accepted by the filters.", "",
          "## Kept videos per raag (top 3 by views per form)", "",
          "| # | raag | form | video title | channel | length | views | artist found |", "|---|---|---|---|---|---|---|---|"]
    n = 0
    for r in raags:
        forms = matches.get(r["id"], {})
        if not forms:
            md.append(f"| | **{names[r['id']]}** | | *(nothing relevant found)* | | | | |")
        for form, vs in sorted(forms.items(), key=lambda kv: kv[0] != "khayal"):
            for v in vs:
                n += 1
                md.append(f"| {n} | **{names[r['id']]}** | {form} | [{cell(v['title'])}](https://youtu.be/{v['id']}) | "
                          f"{cell(v['channel'])} | {mins(v['seconds'])} | {v['views']:,} | {', '.join(v['artists'])} |")
    why = collections.Counter(d["why"].split(" '")[0].split(" (")[0] for d in decisions.values() if not d["ok"])
    md += ["", "## Rejected candidates by reason", "", " · ".join(f"{k}: {v}" for k, v in why.most_common()), "",
           "## Every rejected candidate", "", "| reason | title | channel | length |", "|---|---|---|---|"]
    for vid, d in sorted(decisions.items(), key=lambda kv: kv[1]["why"]):
        if not d["ok"]:
            v = videos[vid]
            md.append(f"| {cell(d['why'])} | {cell(v['title'])} | {cell(v['channel'])} | {mins(v['seconds'])} |")
    (ROOT / "data" / "yt_audit.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    print("\n".join(md[:n + 40]))


if __name__ == "__main__":
    main()
