# রাগমালা Raagmala: project brief

A personal static website of **Hindustani classical vocal music**, organised by **raag** and by
**artist**, with the best YouTube performances and a jukebox that can play raags suited to the time
of day. Sister project of আনন্দধারা Anandadhara (Rabindrasangeet,
https://smaju78.github.io/Anandadhara/), whose working code is in `reference/` to adapt, not rewrite.

## Scope and order
1. **Khayal first** (bada khayal and chhota khayal).
2. Then **dhrupad** (and dhamar), **thumri**, **dadra**, **tappa**, in that order.
Vocal only: exclude instrumental recordings (sitar, sarod, flute, santoor…).

## Data model
- **Raag**: name (Devanagari, Bengali and romanised spellings), thaat, jati, aroha/avaroha, vadi/samvadi,
  time (prahar), season if any, rasa/mood, related raags, well-known bandishes (titles only).
- **Artist**: name (with spellings), gharana, era (dates), voice, notable raags.
- **Performance** (what the jukebox plays): raag, artist, form (khayal/dhrupad/thumri/…), the YouTube
  video (id, title, channel, views, likes, duration).
- **Moods**: a fixed list for the user to approve (e.g. based on rasa: shringar, karuna, shanta, veer,
  bhakti), as in Anandadhara.

## Sources (prefer open data; check licences before republishing anything)
- **Wikidata** (CC0) and **Wikipedia** lists of Hindustani raags, artists and gharanas (facts only;
  don't copy prose).
- Raag facts (thaat, time, aroha/avaroha) are facts, but sites like tanarang/raag-hindustani describe
  them in their own words: use them only to cross-check, not to copy.
- Be polite: batch API calls, small delays, cache locally (Wikimedia rate-limits single-page requests).

## YouTube matching (see reference/scripts/youtube_match.py)
- Queries per raag and form, e.g. `"Raag Yaman khayal vocal"`, and per artist + raag
  (`"Kishori Amonkar Raag Bhoop"`). order=relevance, maxResults 15, then `videos.list`; rank by views.
- **Durations: allow long recitals** (up to ~75 min): khayal performances are often 20–60 minutes.
  Anandadhara's 12-minute cap does not apply.
- Relevance: the raag name must appear (normalise spellings: Yaman/Yeman/Iman, Bhairavi/Bhairvi,
  Malkauns/Malkosh, Darbari/Darbari Kanada…); for artist pages, the artist name too.
- Exclude: instrumentals, tutorials/lessons ("learn raag", "alankar"), riyaz/practice, film songs
  "based on raag X", fusion, jukebox compilations, shorts.
- Artist recognition: a list of major vocalists (Bhimsen Joshi, Kishori Amonkar, Kumar Gandharva,
  Jasraj, Mallikarjun Mansur, Amir Khan, Bade Ghulam Ali Khan, Gangubai Hangal, Kesarbai Kerkar,
  Rashid Khan, Ajoy Chakrabarty, Kaushiki Chakraborty, Ulhas Kashalkar, Veena Sahasrabuddhe, Shruti
  Sadolikar, Parveen Sultana; dhrupad: Dagar family, Gundecha Brothers; thumri: Girija Devi, Shobha
  Gurtu, Siddheshwari Devi, Begum Akhtar…) plus YouTube "- Topic" artist channels.
- Order the run: best-known raags and artists first.

## Site
Same shell as Anandadhara (reference/site): a Listen home that suggests raags for **the current
prahar** (time of day) with one-tap play, browse by raag / thaat / prahar / form / artist / gharana /
mood, raag pages (facts + performances), artist pages, spelling-tolerant search, jukebox with filters
(time of day, raag, thaat, form, artist, gharana), mini-player, likes and never-play, Privacy and Terms
pages, plain HTML/CSS/JS with no build step, served from `docs/` on GitHub Pages. The user reads
Bengali; show raag names in Bengali and romanised (Devanagari optional).

## Constraints
- **YouTube API key in `.env` as `YOUTUBE_API_KEY`**. Never print it or commit it. This site gets its
  **own Google Cloud project and key** (one project per site is allowed; using several keys or projects
  to multiply quota for one site is not, and risks suspension of all projects).
- Free quota is 10,000 units/day (search.list = 100). The YouTube script must be resumable: cache per
  query, skip done ones, stop before the quota, continue next run. Daily Windows scheduled task as in
  `reference/scripts/run_youtube_daily.cmd`; **set it to run on battery** (Windows' default silently
  skips runs on battery).
- Keep stored YouTube statistics fresh (refresh at least every 30 days, as in refresh_stats.py).
- Python scripts for data (Python lives in WSL: `wsl -e bash -lc "..."`), one data JSON, static site.
- GitHub: user Smaju78; a new public repo for this site (user creates it), Pages from `/docs`.

## How to work with the user
- Show a 2–3 line plan first and wait for OK.
- Stop at each checkpoint and show results:
  1. Raag and artist catalogue built (counts by thaat / prahar / gharana, 10 sample rows each).
  2. YouTube matching tested on 30 raags (table raag → 3 video titles; audit every kept video).
  3. Proposed mood list + raags tagged, for review.
  4. Full run plan (days of quota).
  5. Site built and running locally.
- If a step fails twice, stop and ask. If unsure, say so. Be concise.
- The user cares most that **only relevant videos** are kept: prefer no video over a wrong one.

## Lessons from Anandadhara worth keeping
- Verify matches between sources (names that look alike pair crosswise); audit a sample by hand.
- Separate "searched, nothing found" from "not searched yet" in the data.
- Put the player first in the jukebox; show live counts on filters; a home page that starts listening
  in one tap; a mini-player that keeps playing while browsing.
- Fetch the best-known items first so the site is useful early.
