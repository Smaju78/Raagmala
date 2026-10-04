"""Polite, cached access to Wikidata SPARQL and the Wikipedia API (shared by the catalogue scripts).

Every response is cached under cache/wiki/ (keyed by a hash of the request), so reruns cost nothing.
429s are honoured via Retry-After; real network hits are followed by a small delay.
"""
import hashlib
import json
import time
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "cache" / "wiki"
UA = "RaagmalaPersonalSite/0.1 (personal non-commercial site; https://github.com/Smaju78)"
S = requests.Session()
S.headers["User-Agent"] = UA
DELAY = 1.5


def _cached(kind, key, do):
    path = CACHE / kind / (hashlib.sha1(key.encode()).hexdigest()[:16] + ".json")
    if path.exists():
        return json.loads(path.read_text(encoding="utf-8"))
    for attempt in range(6):
        try:
            r = do()
            if r.status_code == 429 or r.status_code >= 500:
                wait = int(r.headers.get("Retry-After", 0) or 0) or 30 * (attempt + 1)
                print(f"  HTTP {r.status_code}, sleeping {wait}s", flush=True)
                time.sleep(wait + 2)
                continue
            r.raise_for_status()
            data = r.json()
            break
        except (requests.RequestException, ValueError) as e:
            print(f"  retry {attempt + 1}: {e}", flush=True)
            time.sleep(10 * (attempt + 1))
    else:
        raise RuntimeError(f"giving up on {kind} request")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    time.sleep(DELAY)
    return data


def sparql(query):
    """Rows of a Wikidata SPARQL query as dicts of plain strings (entity URIs shortened to Q-ids)."""
    data = _cached("sparql", query, lambda: S.post(
        "https://query.wikidata.org/sparql", data={"query": query, "format": "json"}, timeout=120))
    rows = []
    for b in data["results"]["bindings"]:
        rows.append({k: v["value"].replace("http://www.wikidata.org/entity/", "") for k, v in b.items()})
    return rows


def api(site, **params):
    """One MediaWiki API call (GET, json, formatversion 2), cached."""
    params = {"format": "json", "formatversion": 2, **params}
    key = site + json.dumps(params, sort_keys=True)
    return _cached(site.split(".")[0], key, lambda: S.post(f"https://{site}/w/api.php", data=params, timeout=60))


def category_members(site, cat, ns=0):
    out, cont = [], {}
    while True:
        d = api(site, action="query", list="categorymembers", cmtitle=cat, cmlimit=500, cmnamespace=ns, **cont)
        out += [m["title"] for m in d["query"]["categorymembers"]]
        if "continue" not in d:
            return out
        cont = {"cmcontinue": d["continue"]["cmcontinue"]}


def pages(site, titles, props="revisions|pageprops|categories"):
    """Wikitext, wikibase item and (non-hidden) categories for titles, 50 per request; follows redirects.
    Returns {requested title: page dict}."""
    out = {}
    titles = list(dict.fromkeys(titles))
    for i in range(0, len(titles), 50):
        chunk = titles[i:i + 50]
        base = dict(action="query", titles="|".join(chunk), prop=props, rvprop="content", rvslots="main",
                    ppprop="wikibase_item", cllimit="max", clshow="!hidden", redirects=1)
        d = api(site, **base)
        q = d["query"]
        extra_cats = {}
        while "continue" in d:  # long category lists spill over; content comes in the first response
            d = api(site, **base, **{k: v for k, v in d["continue"].items() if k != "continue"},
                    **({"continue": d["continue"]["continue"]} if "continue" in d["continue"] else {}))
            for p in d["query"]["pages"]:
                extra_cats.setdefault(p["title"], []).extend(p.get("categories", []))
        for p in q["pages"]:
            p.setdefault("categories", []).extend(extra_cats.get(p["title"], []))
        alias = {}
        for kind in ("normalized", "redirects"):
            for n in q.get(kind, []):
                alias[n["from"]] = n["to"]
        by_title = {p["title"]: p for p in q["pages"]}
        for t in chunk:
            tt = t
            while tt in alias:
                tt = alias[tt]
            p = by_title.get(tt)
            if p and not p.get("missing"):
                out[t] = {
                    "title": p["title"],
                    "qid": p.get("pageprops", {}).get("wikibase_item"),
                    "text": (p.get("revisions") or [{}])[0].get("slots", {}).get("main", {}).get("content", ""),
                    "cats": [c["title"].split(":", 1)[1] for c in p.get("categories", [])],
                }
    return out
