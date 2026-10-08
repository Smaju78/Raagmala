@echo off
rem Daily YouTube run (scheduled task "Raagmala YouTube daily"):
rem   1. monthly stats refresh when due, resumable matching, rebuild site data (in WSL)
rem   2. commit and push the site data (so GitHub Pages shows the new recordings) and the matching records
rem Output is appended to cache\youtube_daily.log
cd /d "%~dp0.."
if not exist cache mkdir cache
echo ==== %DATE% %TIME% ==== >> cache\youtube_daily.log
wsl -e bash -lc "cd '/mnt/c/Git Projects/raagmala' && python3 scripts/refresh_stats.py --if-older 28 && python3 scripts/youtube_match.py && if [ -f scripts/build_data.py ]; then python3 scripts/build_data.py; fi" >> cache\youtube_daily.log 2>&1
if errorlevel 1 (
  echo Data step failed; nothing published. >> cache\youtube_daily.log
  exit /b 1
)
if not exist .git (
  echo No git repository yet; data updated locally only. >> cache\youtube_daily.log
  exit /b 0
)
rem the site data, plus the matcher's records (accepted and rejected videos, singers named from titles)
git add docs data/yt_matches.json data/singers_guessed.md >> cache\youtube_daily.log 2>&1
git diff --cached --quiet
if errorlevel 1 git commit -q -m "Daily recordings update" >> cache\youtube_daily.log 2>&1
rem push also retries any commit left unpushed by an earlier failed run
git push -q origin main >> cache\youtube_daily.log 2>&1
if errorlevel 1 (echo Push failed: check the GitHub sign-in for Smaju78. >> cache\youtube_daily.log) else (echo Published. >> cache\youtube_daily.log)
