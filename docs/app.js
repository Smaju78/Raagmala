/* রাগমালা Raagmala: hash-routed static app over raagmala.json. No build step. Bilingual: বাংলা (default) / English.
   Visual design "C · চিত্র Chitra" (ragamala miniatures: lacquer, gold, parchment); the home hero takes its tint from the prahar. */
"use strict";

const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const enc = encodeURIComponent;
const view = $("#view");

let META = {}, RAAGS = [], EXTRA = [], ARTISTS = [], VIDEOS = new Map();
const RAAG = new Map(), ARTIST = new Map();

/* ---------------- language ---------------- */
const LANG_KEY = "raagmala.lang";
let L = (() => { try { const l = localStorage.getItem(LANG_KEY); return l === "bn" ? "bn" : "en"; } catch { return "en"; } })();
const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const num = (n) => L === "bn" ? String(n).replace(/\d/g, (d) => BN_DIGITS[d]) : String(n);

// UI strings. A function receives named values; numbers are already localised.
const STR = {
  en: {
    brandSub: "Raagmala · Hindustani vocal", navListen: "Listen", navBrowse: "Search", navJukebox: "Jukebox", navMine: "Mine",
    loading: "Loading raags…", switchTo: "বাংলা", switchLabel: "বাংলায় দেখুন",
    footer1: 'Raag and artist facts from <a href="https://www.wikidata.org" target="_blank" rel="noopener">Wikidata</a> and <a href="https://en.wikipedia.org/wiki/List_of_ragas_in_Hindustani_classical_music" target="_blank" rel="noopener">Wikipedia</a>, checked by hand. Performances play from YouTube. Personal, non-commercial project.',
    footer2: 'This site uses YouTube API Services: <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener">YouTube Terms of Service</a> · <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Google Privacy Policy</a> · <a href="privacy.html">Privacy</a> · <a href="terms.html">Terms</a>',
    privacy: "Privacy", terms: "Terms",
    searchPh: "Search a raag or an artist (Yaman, ইমন, Bhimsen…)", searchAria: "Search raags and artists",
    found: (o) => `${o.r} raag${o.rn === 1 ? "" : "s"} · ${o.a} artist${o.an === 1 ? "" : "s"}`, artists: "Artists", raagsHead: "Raags",
    noResults: "Nothing found", tryOther: "Try another spelling, in Bengali or English.",
    listenNow: "Listen now",
    stats: (o) => `${o.a} of ${o.b} raags have performances · ${o.c} performances · more are added every day`,
    nowHour: "This prahar", nowBig: (o) => `Now · ${o.en}`, nowSmall: (o) => `${o.bn} · ${o.time}`,
    nowRaags: "Raags for this time:", nowNone: "No raags with performances for this time yet.",
    heroHint: "The raags of this hour, one after another, in a shuffled playlist.",
    playNow: (o) => `Play raags of this hour${o.n ? ` (${o.n})` : ""}`, allOfHour: "All raags of this hour",
    seasonText: (o) => `It's ${o.s} — season raags:`, playSeason: (o) => `Play ${o.s} raags`,
    nPerf: (o) => `${o.n} performance${o.nn === 1 ? "" : "s"}`, soon: "coming soon",
    throughDay: "Raags through the day", all: "All", allN: (o) => `All ${o.n}`, more: "More",
    wellKnown: "Well-known raags", greatVoices: "Great voices", allArtists: "All artists", explore: "Explore", moods: "Moods",
    continueRow: "Continue listening", continueHint: "What you played recently and what you liked.",
    b_raags: "Well-known raags", b_prahar: "Time of day", b_thaat: "Thaat", b_form: "Form", b_mood: "Mood",
    b_season: "Season", b_artists: "Artists", b_gharana: "Gharana", b_az: "All raags A–Z", browseBy: "Browse by",
    hintRaags: (o) => `The ${o.n} raags most often sung, best-known first. Their performances are fetched first.`,
    hintAz: (o) => `${o.n} raags. ${o.m} rarer ones have only their names here (from Wikidata; some English spellings are automatic transliterations).`,
    hintArtists: "Vocalists, best-known first. Gharana and dates from Wikipedia and Wikidata.",
    anyTime: "Any time", anyTimeLight: "Any time / light raags", noThaat: "No Bhatkhande thaat",
    nRaags: (o) => `${o.n} raag${o.nn === 1 ? "" : "s"}`, nArtists: (o) => `${o.n} artist${o.nn === 1 ? "" : "s"}`,
    playJb: (o) => `Play in jukebox${o.n ? ` (${o.n})` : ""}`, playGharana: (o) => `Play ${o.g} gharana`,
    nameOnly: "name only", nothingHere: "Nothing here yet.", showMore: (o) => `Show ${o.a} more of ${o.b}`,
    raagsCrumb: "Raags", raagNotFound: "Raag not found.", backListen: "Back to Listen", back: "Back",
    extraNote: (o) => `Only the name of this rarer raag is known here so far (from Wikidata${o.auto ? "; the English spelling is an automatic transliteration" : ""}). Performances are searched for the main raags first.`,
    f_thaat: "Thaat", f_time: "Time", f_season: "Season", f_jati: "Jati", f_vadi: "Vadi · Samvadi", f_aroha: "Aroha",
    f_avaroha: "Avaroha", f_mood: "Mood", f_related: "Related", f_dates: "Dates", f_gharana: "Gharana", f_forms: "Forms",
    f_voice: "Voice", f_raagsHere: "Raags here", also: "also",
    playRaag: (o) => `Play ${o.r} in jukebox`, playRaagShort: "Play this raag", playArtistShort: "Play this artist",
    notationNote: (o) => `Notation: komal swaras underlined (ঋ জ্ঞ দ ণ), tivra Ma with a mark (হ্মা); a dot above or below = upper or lower octave. Facts checked against ${o.src}.`,
    swaraMap: "Swara wheel: the raag's notes joined; the vadi is the large gold dot, the samvadi the ring.",
    stdRefs: "standard references", wikipedia: "Wikipedia",
    performances: "Performances", raagNotFetched: "Performances of this raag haven't been fetched yet. They are added every day, best-known raags first.",
    noneFound: "No matching vocal performance was found on YouTube yet.",
    artistNotFound: "Artist not found.", allArtistsLink: "All artists",
    artistNotFetched: "Performances by this artist haven't been fetched yet. They are added every day, best-known artists first.",
    moreOnWiki: (o) => `More on ${o.link}.`,
    views: (o) => `${o.v} views`, like: "♡ Like", liked: "♥ Liked",
    jati: { sampurna: "sampurna", shadav: "shadav", audav: "audav" }, voice: { male: "Male", female: "Female" },
    raag: "Raag", artist: "Artist", playAria: (o) => `Play ${o.t}`, playInline: (o) => `Play ${o.t} here`,
    // jukebox
    jbEmpty: "Press Play for a shuffle of performances that match your filters.",
    jbNone: "No performances match these filters yet. Remove a filter or clear them all.",
    clearFilters: "Clear filters", nothingPlaying: "Nothing playing yet.", play: "Play", pause: "Pause", resume: "Resume",
    likeBtn: "♥ Like", likedBtn: "♥ Liked", likeBtnAria: "Like this performance", never: "Never play", likeTitle: "Liked performances come up 4× as often",
    neverTitle: "Never play this performance in the jukebox", prevAria: "Previous performance", nextAria: "Next performance",
    upNext: "Up next:", toPlay: (o) => `${o.n} performance${o.nn === 1 ? "" : "s"} to play`, allPerf: "All performances",
    clearAll: "Clear all", editFilters: "Edit filters", done: "Done", filters: "Filters", playlistHead: "Playlist",
    lgTime: "Time of day", followClock: "Follow the clock (raags of the current prahar)", lgForm: "Form", lgMood: "Mood",
    lgThaat: "Thaat", lgSeason: "Season", lgRAG: "Raag, artist, gharana", anyRaag: "Any raag", anyArtist: "Any artist",
    anyGharana: "Any gharana", onlyLiked: "Only liked performances", chipNow: (o) => `Now: ${o.p}`,
    chipRaag: (o) => `Raag ${o.r}`, chipGharana: (o) => `${o.g} gharana`, likedOnly: "Liked only", removeFilter: (o) => `Remove filter ${o.l}`,
    prefsNote: "Saved in this browser only.", remove: "Remove", miniPause: "Pause", miniPlay: "Play", miniLike: "Like", nowPlaying: "Now playing",
    seekAria: "Position in the performance", openJb: "Open the jukebox",
    signIn: "Sign in with Google", signOut: "Sign out", account: "Your account", notSignedIn: "Not signed in",
    syncNote: "Your likes, settings and where you left off are kept in your account, so they follow you to your other devices.",
    syncedAt: (o) => `Saved to your account at ${o.time}`, deleteData: "Delete my saved data",
    deleteConfirm: "Delete everything saved in your account (likes, settings, resume point) and sign out? This browser keeps its own copy.",
    syncError: (o) => `Couldn't reach your account (${o.msg}). Everything is still saved in this browser.`,
    mineTitle: "Mine", mineLiked: (o) => `Liked performances (${o.n})`,
    mineNoLikes: "Nothing liked yet. Press ♥ Like (or ♡ next to a performance) on performances you love; they collect here.",
    signInShort: "Sign in", playOne: "Play", unlike: "Unlike", allowAgain: "Allow again", playAllLikes: "Play all my likes",
    mineHidden: (o) => `Never play (${o.n})`, mineHiddenHint: "The jukebox skips these.",
    mineSignIn: "Sign in to keep your likes on all your devices.", mineSynced: "Kept in your account, so they're on all your devices.",
    f_source: "Name", guessedNote: "taken from the video titles (not yet checked)",
    findArtist: "Type to find an artist (Rashid, রশিদ…)", findRaag: "Type to find a raag (Yaman, ইমন…)",
    resumeTitle: "Welcome back", resumeYes: "Continue", resumeNo: "No, go to the home page",
    resumePlaying: (o) => `Continue where you left off? You were listening to ${o.what}, at ${o.at}.`,
    resumePage: (o) => `Continue where you left off? You were on ${o.what}.`,
    playlist: (o) => `Playlist (${o.n})`, reshuffle: "Reshuffle",
    premiumMenu: "Watch without ads (if you have YouTube Premium)",
    premiumAskTitle: "Watch without ads?",
    premiumAskText: "If you have a YouTube Premium account, you can watch without ads: Raagmala then uses the standard YouTube player, which recognises your Premium membership. You need to be signed in to youtube.com in the same browser. You can change this any time in the account menu.",
    premiumAskYes: "Yes, I have YouTube Premium", premiumAskNo: "No",
    premiumNote: "Off by default: the privacy-enhanced player can't see your YouTube sign-in. With this on, YouTube can set its cookies when you play. If ads still appear, your browser is blocking YouTube's cookies inside other sites.",
    loadError: (o) => `The raag data couldn't be loaded (${o.e}). Check your connection and try again.`, retry: "Try again",
    themeToggle: "Switch between the dark and the light look",
    toastLiked: "Added to your likes", toastUnliked: "Removed from your likes", toastNever: "This performance won't play again",
    toastAllow: "This performance can play again",
  },
  bn: {
    brandSub: "Raagmala · হিন্দুস্তানি কণ্ঠসংগীত", navListen: "শুনুন", navBrowse: "খুঁজুন", navJukebox: "জুকবক্স", navMine: "আমার",
    loading: "রাগ আসছে…", switchTo: "English", switchLabel: "View in English",
    footer1: 'রাগ ও শিল্পীর তথ্য <a href="https://www.wikidata.org" target="_blank" rel="noopener">উইকিডেটা</a> ও <a href="https://en.wikipedia.org/wiki/List_of_ragas_in_Hindustani_classical_music" target="_blank" rel="noopener">উইকিপিডিয়া</a> থেকে, হাতে মিলিয়ে দেখা। পরিবেশনা বাজে ইউটিউব থেকে। ব্যক্তিগত, অবাণিজ্যিক প্রকল্প।',
    footer2: 'এই সাইট YouTube API Services ব্যবহার করে: <a href="https://www.youtube.com/t/terms" target="_blank" rel="noopener">ইউটিউবের শর্তাবলি</a> · <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">গুগলের গোপনীয়তা নীতি</a> · <a href="privacy.html">গোপনীয়তা</a> · <a href="terms.html">শর্তাবলি</a>',
    privacy: "গোপনীয়তা", terms: "শর্তাবলি",
    searchPh: "রাগ বা শিল্পী খুঁজুন (ইমন, Yaman, ভীমসেন…)", searchAria: "রাগ ও শিল্পী খুঁজুন",
    found: (o) => `${o.r}টি রাগ · ${o.a} জন শিল্পী`, artists: "শিল্পী", raagsHead: "রাগ",
    noResults: "কিছু পাওয়া যায়নি", tryOther: "অন্য বানানে, বাংলা বা ইংরেজিতে খুঁজে দেখুন।",
    listenNow: "এখন শুনুন",
    stats: (o) => `${o.b}টি রাগের মধ্যে ${o.a}টির পরিবেশনা আছে · মোট ${o.c}টি পরিবেশনা · প্রতিদিন আরও যোগ হচ্ছে`,
    nowHour: "এই প্রহরে", nowBig: (o) => `এখন ${o.bn}`, nowSmall: (o) => `${o.en} · ${o.time}`,
    nowRaags: "এই সময়ের রাগ:", nowNone: "এই সময়ের রাগের পরিবেশনা এখনও আসেনি।",
    heroHint: "এই প্রহরের রাগগুলো একে একে, এলোমেলো প্লেলিস্টে বাজবে।",
    playNow: (o) => `এই প্রহরের রাগ শুনুন${o.n ? ` (${o.n})` : ""}`, allOfHour: "এই প্রহরের সব রাগ",
    seasonText: (o) => `এখন ${o.s} — ঋতুর রাগ:`, playSeason: (o) => `${o.s}র রাগ শুনুন`,
    nPerf: (o) => `${o.n}টি পরিবেশনা`, soon: "শীঘ্রই আসছে",
    throughDay: "সারাদিনের রাগ", all: "সব", allN: (o) => `সব ${o.n}টি`, more: "আরও",
    wellKnown: "পরিচিত রাগ", greatVoices: "মহান কণ্ঠ", allArtists: "সব শিল্পী", explore: "আরও দেখুন", moods: "রস",
    continueRow: "আবার শুনুন", continueHint: "সম্প্রতি যা বাজিয়েছেন আর যা পছন্দ করেছেন।",
    b_raags: "পরিচিত রাগ", b_prahar: "সময় (প্রহর)", b_thaat: "ঠাট", b_form: "গায়নশৈলী", b_mood: "রস",
    b_season: "ঋতু", b_artists: "শিল্পী", b_gharana: "ঘরানা", b_az: "সব রাগ (অ–হ)", browseBy: "যেভাবে দেখবেন",
    hintRaags: (o) => `সবচেয়ে বেশি গাওয়া ${o.n}টি রাগ, পরিচিত রাগ আগে। এদের পরিবেশনা আগে খোঁজা হয়।`,
    hintAz: (o) => `${o.n}টি রাগ। এর মধ্যে ${o.m}টি বিরল রাগের শুধু নাম আছে (উইকিডেটা থেকে; কিছু ইংরেজি বানান স্বয়ংক্রিয় প্রতিবর্ণীকরণ)।`,
    hintArtists: "কণ্ঠশিল্পী, পরিচিতরা আগে। ঘরানা ও সাল উইকিপিডিয়া ও উইকিডেটা থেকে।",
    anyTime: "যেকোনো সময়", anyTimeLight: "যেকোনো সময় / লঘু রাগ", noThaat: "ভাতখণ্ডের ঠাট নেই",
    nRaags: (o) => `${o.n}টি রাগ`, nArtists: (o) => `${o.n} জন শিল্পী`,
    playJb: (o) => `জুকবক্সে শুনুন${o.n ? ` (${o.n})` : ""}`, playGharana: (o) => `${o.g} ঘরানা শুনুন`,
    nameOnly: "শুধু নাম", nothingHere: "এখনও কিছু নেই।", showMore: (o) => `আরও ${o.a}টি দেখান (বাকি ${o.b})`,
    raagsCrumb: "রাগ", raagNotFound: "রাগটি পাওয়া গেল না।", backListen: "শুনুন পাতায় ফিরুন", back: "ফিরুন",
    extraNote: (o) => `এই বিরল রাগের এখানে আপাতত শুধু নামটুকু আছে (উইকিডেটা থেকে${o.auto ? "; ইংরেজি বানান স্বয়ংক্রিয় প্রতিবর্ণীকরণ" : ""})। পরিবেশনা আগে প্রধান রাগগুলোর জন্য খোঁজা হচ্ছে।`,
    f_thaat: "ঠাট", f_time: "সময়", f_season: "ঋতু", f_jati: "জাতি", f_vadi: "বাদী · সম্বাদী", f_aroha: "আরোহ",
    f_avaroha: "অবরোহ", f_mood: "রস", f_related: "সম্পর্কিত রাগ", f_dates: "সময়কাল", f_gharana: "ঘরানা", f_forms: "গায়নশৈলী",
    f_voice: "কণ্ঠ", f_raagsHere: "এখানে যে রাগ", also: "অন্য নাম",
    playRaag: (o) => `জুকবক্সে রাগ ${o.r} শুনুন`, playRaagShort: "এই রাগ শুনুন", playArtistShort: "এই শিল্পীকে শুনুন",
    notationNote: (o) => `স্বরলিপি: কোমল স্বর রোমান হরফে দাগাঙ্কিত, বাংলায় ঋ জ্ঞ দ ণ; তীব্র মা চিহ্নিত (হ্মা); উপরে বা নিচে বিন্দু = তার বা মন্দ্র সপ্তক। তথ্য ${o.src}-র সঙ্গে মিলিয়ে দেখা।`,
    swaraMap: "স্বরচক্র: রাগের স্বরগুলো রেখায় যুক্ত; বাদী বড় সোনালি বিন্দু, সম্বাদী বৃত্ত।",
    stdRefs: "প্রচলিত সূত্র", wikipedia: "উইকিপিডিয়া",
    performances: "পরিবেশনা", raagNotFetched: "এই রাগের পরিবেশনা এখনও খোঁজা হয়নি। প্রতিদিন যোগ হচ্ছে, পরিচিত রাগ আগে।",
    noneFound: "ইউটিউবে মেলে এমন কণ্ঠসংগীত পরিবেশনা এখনও পাওয়া যায়নি।",
    artistNotFound: "শিল্পী পাওয়া গেল না।", allArtistsLink: "সব শিল্পী",
    artistNotFetched: "এই শিল্পীর পরিবেশনা এখনও খোঁজা হয়নি। প্রতিদিন যোগ হচ্ছে, পরিচিত শিল্পী আগে।",
    moreOnWiki: (o) => `${o.link}য় আরও পড়ুন।`,
    views: (o) => `${o.v} বার দেখা`, like: "♡ পছন্দ", liked: "♥ পছন্দের",
    jati: { sampurna: "সম্পূর্ণ", shadav: "ষাড়ব", audav: "ঔড়ব" }, voice: { male: "পুরুষ", female: "নারী" },
    raag: "রাগ", artist: "শিল্পী", playAria: (o) => `বাজান: ${o.t}`, playInline: (o) => `এখানেই বাজান: ${o.t}`,
    jbEmpty: "ফিল্টারের সঙ্গে মেলে এমন পরিবেশনা এলোমেলোভাবে শুনতে ▶ বাজান চাপুন।",
    jbNone: "এই ফিল্টারে এখনও কোনো পরিবেশনা নেই। একটি ফিল্টার সরান বা সব মুছে দিন।",
    clearFilters: "ফিল্টার মুছুন", nothingPlaying: "এখনও কিছু বাজছে না।", play: "বাজান", pause: "থামান", resume: "আবার চালান",
    likeBtn: "♥ পছন্দ", likedBtn: "♥ পছন্দের", likeBtnAria: "এই পরিবেশনা পছন্দ করুন", never: "আর বাজাবে না", likeTitle: "পছন্দের পরিবেশনা ৪ গুণ বেশি বাজে",
    neverTitle: "জুকবক্সে এই পরিবেশনা আর বাজাবে না", prevAria: "আগের পরিবেশনা", nextAria: "পরের পরিবেশনা",
    upNext: "এরপর:", toPlay: (o) => `${o.n}টি পরিবেশনা বাজবে`, allPerf: "সব পরিবেশনা",
    clearAll: "সব মুছুন", editFilters: "ফিল্টার বদলান", done: "হয়ে গেছে", filters: "ছাঁকনি", playlistHead: "প্লেলিস্ট",
    lgTime: "সময়", followClock: "ঘড়ি মেনে চলুক (এখনকার প্রহরের রাগ)", lgForm: "গায়নশৈলী", lgMood: "রস",
    lgThaat: "ঠাট", lgSeason: "ঋতু", lgRAG: "রাগ, শিল্পী, ঘরানা", anyRaag: "যেকোনো রাগ", anyArtist: "যেকোনো শিল্পী",
    anyGharana: "যেকোনো ঘরানা", onlyLiked: "শুধু পছন্দের পরিবেশনা", chipNow: (o) => `এখন: ${o.p}`,
    chipRaag: (o) => `রাগ ${o.r}`, chipGharana: (o) => `${o.g} ঘরানা`, likedOnly: "শুধু পছন্দের", removeFilter: (o) => `ফিল্টার সরান: ${o.l}`,
    prefsNote: "শুধু এই ব্রাউজারে রাখা থাকে।", remove: "সরান", miniPause: "থামান", miniPlay: "বাজান", miniLike: "পছন্দ", nowPlaying: "বাজছে",
    seekAria: "পরিবেশনার কোন জায়গায় আছেন", openJb: "জুকবক্স খুলুন",
    signIn: "Google দিয়ে সাইন ইন", signOut: "সাইন আউট", account: "আপনার অ্যাকাউন্ট", notSignedIn: "সাইন ইন করা নেই",
    syncNote: "আপনার পছন্দ, সেটিংস আর যেখানে থেমেছিলেন সব আপনার অ্যাকাউন্টে থাকে, তাই অন্য যন্ত্রেও পাবেন।",
    syncedAt: (o) => `অ্যাকাউন্টে রাখা হয়েছে ${o.time}-এ`, deleteData: "অ্যাকাউন্টে রাখা তথ্য মুছুন",
    deleteConfirm: "অ্যাকাউন্টে রাখা সব কিছু (পছন্দ, সেটিংস, থামার জায়গা) মুছে সাইন আউট করবেন? এই ব্রাউজারে নিজস্ব কপি থেকে যাবে।",
    syncError: (o) => `অ্যাকাউন্টের সঙ্গে যোগাযোগ করা গেল না (${o.msg})। সব কিছু এই ব্রাউজারে রাখা আছে।`,
    mineTitle: "আমার পাতা", mineLiked: (o) => `পছন্দের পরিবেশনা (${o.n})`,
    mineNoLikes: "এখনও কিছু পছন্দ করেননি। ভালো লাগা পরিবেশনায় ♥ পছন্দ (বা পরিবেশনার পাশে ♡) চাপুন; সব এখানে জমা হবে।",
    signInShort: "সাইন ইন", playOne: "বাজান", unlike: "পছন্দ সরান", allowAgain: "আবার বাজাতে দিন", playAllLikes: "আমার সব পছন্দ বাজান",
    mineHidden: (o) => `আর বাজাবে না (${o.n})`, mineHiddenHint: "জুকবক্স এগুলো বাদ দেয়।",
    mineSignIn: "সব যন্ত্রে পছন্দগুলো পেতে সাইন ইন করুন।", mineSynced: "আপনার অ্যাকাউন্টে রাখা, তাই সব যন্ত্রে পাবেন।",
    f_source: "নাম", guessedNote: "ভিডিওর শিরোনাম থেকে নেওয়া (এখনও যাচাই হয়নি)",
    findArtist: "শিল্পীর নাম লিখে খুঁজুন (রশিদ, Rashid…)", findRaag: "রাগের নাম লিখে খুঁজুন (ইমন, Yaman…)",
    resumeTitle: "আবার স্বাগত", resumeYes: "যেখানে ছিলাম সেখান থেকে", resumeNo: "না, প্রথম পাতায় যাই",
    resumePlaying: (o) => `যেখানে থেমেছিলেন সেখান থেকে শুরু করবেন? আপনি শুনছিলেন ${o.what}, ${o.at}-এ।`,
    resumePage: (o) => `যেখানে ছিলেন সেখান থেকে শুরু করবেন? আপনি ছিলেন ${o.what} পাতায়।`,
    playlist: (o) => `প্লেলিস্ট (${o.n})`, reshuffle: "আবার এলোমেলো করুন",
    premiumMenu: "বিজ্ঞাপন ছাড়া দেখুন (ইউটিউব প্রিমিয়াম থাকলে)",
    premiumAskTitle: "বিজ্ঞাপন ছাড়া দেখবেন?",
    premiumAskText: "আপনার ইউটিউব প্রিমিয়াম অ্যাকাউন্ট থাকলে বিজ্ঞাপন ছাড়া দেখতে পারেন: রাগমালা তখন সাধারণ ইউটিউব প্লেয়ার ব্যবহার করে, যা আপনার প্রিমিয়াম সদস্যপদ চেনে। এর জন্য একই ব্রাউজারে youtube.com-এ সাইন ইন থাকতে হবে। পরে অ্যাকাউন্ট মেনু থেকে যখন খুশি বদলাতে পারবেন।",
    premiumAskYes: "হ্যাঁ, ইউটিউব প্রিমিয়াম আছে", premiumAskNo: "না",
    premiumNote: "সাধারণত বন্ধ থাকে: গোপনীয়তা-বর্ধিত প্লেয়ার আপনার ইউটিউব সাইন-ইন দেখতে পায় না। এটি চালু করলে বাজানোর সময় ইউটিউব তাদের কুকি রাখতে পারে। তবুও বিজ্ঞাপন দেখালে বুঝবেন আপনার ব্রাউজার অন্য সাইটের ভেতরে ইউটিউবের কুকি আটকাচ্ছে।",
    loadError: (o) => `রাগের তথ্য আনা গেল না (${o.e})। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।`, retry: "আবার চেষ্টা করুন",
    themeToggle: "গাঢ় ও হালকা রূপের মধ্যে বদলান",
    toastLiked: "পছন্দে রাখা হল", toastUnliked: "পছন্দ থেকে সরানো হল", toastNever: "এই পরিবেশনা আর বাজবে না",
    toastAllow: "এই পরিবেশনা আবার বাজতে পারবে",
  },
};
// t(key, values): numbers in values are shown in the current script; "nn" etc. keep the raw number for plurals.
function t(key, o = {}) {
  const s = STR[L][key] ?? STR.en[key] ?? key;
  if (typeof s !== "function") return s;
  const v = { ...o };
  for (const k of Object.keys(o)) if (typeof o[k] === "number") { v[k] = num(o[k]); v[k + "n"] = o[k]; }
  return s(v);
}

/* ---------------- icons ---------------- */
const I = {
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  heartF: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></svg>',
  ban: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
};

/* ---------------- preferences (localStorage; synced to the account when signed in) ---------------- */
const PREF_KEY = "raagmala.prefs.v1";
const SESSION_KEY = "raagmala.session.v1"; // resume point: page, performance, position, playlist
const THEME_KEY = "raagmala.theme";
let lastPage = "#/";
let holdSession = true; // the saved resume point is kept untouched until the visitor has answered the resume prompt
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
function savePrefs() {
  prefs.updatedAt = Date.now();
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ }
  SYNC.changed("prefs");
}

/* ---------------- account sync hooks (optional Google sign-in, see sync.js) ----------------
   sync.js (an ES module) fills these in when firebase-config.js has a Firebase config; without it they
   stay no-ops and everything is kept in this browser only. */
const SYNC = window.raagmalaSync = {
  changed: () => {},       // called after every local change; sync.js uploads (debounced)
  signIn: null,            // set by sync.js: the account button appears only then
  user: null,
};
// Resolves when the sign-in state is known (so the resume prompt can use the account's latest resume point).
SYNC.ready = new Promise((res) => { SYNC.resolveReady = res; setTimeout(res, 4000); });
const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; } };
SYNC.snapshot = () => ({
  prefs: { likes: prefs.likes, never: prefs.never, filters: prefs.filters, ytFull: !!prefs.ytFull, premiumAsked: !!prefs.premiumAsked, recent: prefs.recent.slice(-150) },
  prefsAt: prefs.updatedAt || 0, lang: L, session: readSession(),
});
// Merge what the account holds into this browser. The first time a browser is linked to an account, likes and
// never-play lists from both are kept; after that the newer side wins. The newer resume point always wins.
SYNC.apply = (r, firstLink) => {
  if (!r) return;
  const rp = r.prefs || {};
  if (firstLink) {
    prefs.likes = [...new Set([...(rp.likes || []), ...prefs.likes])];
    prefs.never = [...new Set([...(rp.never || []), ...prefs.never])].filter((id) => !prefs.likes.includes(id));
  }
  if (rp.premiumAsked) prefs.premiumAsked = true; // asked once per account, on any device
  if ((r.prefsAt || 0) > (prefs.updatedAt || 0)) {
    if (!firstLink) { prefs.likes = rp.likes || []; prefs.never = rp.never || []; }
    Object.assign(prefs.filters, freshFilters(), rp.filters || {});
    prefs.ytFull = !!rp.ytFull;
    if (rp.recent) prefs.recent = rp.recent;
    prefs.updatedAt = r.prefsAt;
    if (r.lang && r.lang !== L) setLang(r.lang, false);
  }
  try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ }
  const ls = readSession();
  if (r.session && (!ls || (r.session.at || 0) > (ls.at || 0))) {
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(r.session)); } catch { /* storage unavailable */ }
  }
  if (VIDEOS.size) jb.refresh();
};
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
  if (location.hash.startsWith("#/mine") && VIDEOS.size) setTimeout(renderMine); // keep the Mine page current
}

/* ---------------- theme (lacquer dark / parchment light) ---------------- */
function setTheme(th, save = true) {
  document.documentElement.dataset.theme = th;
  const meta = $('meta[name="theme-color"]'); if (meta) meta.content = th === "light" ? "#f3eadb" : "#17121b";
  if (save) { try { localStorage.setItem(THEME_KEY, th); } catch { /* ignore */ } }
}
$$(".theme-toggle").forEach((b) => b.onclick = () => setTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light"));

/* ---------------- toast ---------------- */
let toastT;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg; el.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 2200);
}

/* ---------------- helpers ---------------- */
// Privacy-enhanced player by default; the standard player (which knows your YouTube sign-in, so Premium
// members get no ads) only when the visitor turns that on in the account menu.
const ytHost = () => prefs.ytFull ? "https://www.youtube.com" : "https://www.youtube-nocookie.com";
const thumb = (id, q = "mq") => `https://i.ytimg.com/vi/${esc(id)}/${q}default.jpg`;
function fmtViews(n) {
  if (L === "bn") {
    const f = (x) => num(x >= 10 ? Math.round(x) : Math.round(x * 10) / 10);
    return n >= 1e7 ? `${f(n / 1e7)} কোটি` : n >= 1e5 ? `${f(n / 1e5)} লাখ` : n >= 1e3 ? `${f(n / 1e3)} হাজার` : num(n);
  }
  return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(n);
}
const fmtTime = (sec) => { sec = Math.max(0, Math.floor(sec || 0)); return num(sec >= 3600 ? `${Math.floor(sec / 3600)}:${String(Math.floor(sec / 60) % 60).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`
  : `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`); };
const norm = (s) => (s || "").normalize("NFC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, " ").trim();
const cap = (s) => s ? s[0].toUpperCase() + s.slice(1) : "";
const rVids = (r) => r.videos ? Object.values(r.videos).flat() : [];
const hasRec = (r) => rVids(r).length > 0;
const nPerf = (n) => t("nPerf", { n });
const seg = (typeof Intl !== "undefined" && Intl.Segmenter) ? new Intl.Segmenter("bn", { granularity: "grapheme" }) : null;
const glyph = (s) => { s = s || "?"; return seg ? ([...seg.segment(s)][0]?.segment || s[0]) : s[0]; };

// Names: the current language first, the other after it (raag names always appear in both scripts).
const rMain = (r) => (L === "bn" ? r.bn || r.en : r.en || r.bn);
const rOther = (r) => (L === "bn" ? (r.bn ? r.en : "") : r.bn || "");
const rBoth = (r) => [rMain(r), rOther(r)].filter(Boolean).join(" · ");
const aMain = (a) => (L === "bn" ? a.bn || a.en : a.en);
const aOther = (a) => (L === "bn" ? (a.bn ? a.en : "") : a.bn || "");
const pair = (bn, en) => (L === "bn" ? [bn, en] : [en, bn]).filter(Boolean).join(" ");

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
const hours = (p) => L === "bn" ? `${num(p.from)}–${num(p.to)}টা` : `${p.from}–${p.to}h`;
const praharLabel = (k, short = false) => {
  const p = META.prahars[k];
  if (!p) return t("anyTime");
  return short ? `${L === "bn" ? p.bn : p.en} · ${hours(p)}` : `${pair(p.bn, p.en)} · ${hours(p)}`;
};
const praharName = (k) => META.prahars[k] ? (L === "bn" ? META.prahars[k].bn : META.prahars[k].en) : t("anyTime");
const thaatLabel = (k) => pair(META.thaats[k], cap(k));
const thaatName = (k) => k ? (L === "bn" ? META.thaats[k] || k : cap(k)) : "";
const formLabel = (k) => pair(META.forms[k], cap(k));
const formName = (k) => L === "bn" ? (META.forms[k] || k) : cap(k);
const moodLabel = (k) => META.moods[k] ? pair(META.moods[k].bn, META.moods[k].en) : k;
const moodName = (k) => META.moods[k] ? (L === "bn" ? META.moods[k].bn : META.moods[k].en) : k;
const moodDesc = (k) => META.moods[k] ? (L === "bn" ? META.moods[k].descBn : META.moods[k].desc) : "";
const seasonLabel = (k) => META.seasons[k] ? pair(META.seasons[k].bn, META.seasons[k].en) : k;
const seasonWord = (k) => META.seasons[k] ? (L === "bn" ? META.seasons[k].bn : META.seasons[k].en.toLowerCase()) : k;
const gharanaLabel = (g) => L === "bn" ? (META.gharanas[g] || g) : `${g} ${META.gharanas[g] || ""}`.trim();
const gharanaShort = (g) => L === "bn" ? (META.gharanas[g] || g) : g;
const jatiLabel = (j) => j.split("-").map((x) => STR[L].jati[x] || x).join(" – ");

/* ---------------- palettes (ragamala miniatures) ----------------
   Per thaat: [deep, light, ink]; per prahar: [deep, light]; per mood; per season. */
const PAL = { bilawal: ["#1d3a5f", "#5f93b8", "#f4efe4"], kalyan: ["#26245e", "#7d6fb5", "#f6f0e4"], khamaj: ["#6f3418", "#d0894a", "#fff4e3"],
  bhairav: ["#7e1a1a", "#d8603a", "#fff1e0"], purvi: ["#521c48", "#b05a84", "#fdeef2"], marwa: ["#7f430f", "#dba34a", "#fff6e0"],
  kafi: ["#1c4a39", "#6fa37a", "#eff8ec"], asavari: ["#283569", "#6f82bf", "#eef1fb"], bhairavi: ["#5f1a35", "#c2557a", "#fdeef3"],
  todi: ["#352659", "#8a73b9", "#f3eefb"], _: ["#3b3024", "#9c8458", "#f7f1e3"] };
const PRCOL = { 1: ["#8e2a1a", "#e2904a"], 2: ["#1e4f78", "#7fb6d6"], 3: ["#8a6a10", "#e6c04b"], 4: ["#7a3d14", "#d98a4e"],
  5: ["#5a1f52", "#b85f8d"], 6: ["#242b68", "#6b74b8"], 7: ["#161a3c", "#4a4f84"], 8: ["#4b2c6b", "#9a7bc2"] };
// The page's tint follows the clock: warm at dawn, bright at midday, dusk rose, deep indigo at night.
const SKY = { 1: ["#f3a373", "#b8431a"], 2: ["#8ac3e5", "#1b6b9c"], 3: ["#f7c640", "#8f5e00"], 4: ["#ec9553", "#ad4312"],
  5: ["#c0557d", "#5e3a8c"], 6: ["#5d6ab0", "#2c3675"], 7: ["#3f4576", "#15183a"], 8: ["#7a62a6", "#4a3570"] };
const MOODCOL = { shanta: ["#1e4a63", "#5e8ea8"], bhakti: ["#7a4e0e", "#c9933a"], shringar: ["#7a1f45", "#c0557d"], karuna: ["#2f3272", "#6b6fb0"],
  gambhir: ["#3a2f26", "#6b5a47"], ullas: ["#1c5a3d", "#5aa273"] };
const SEASONCOL = { varsha: ["#1e3f5e", "#4f8fb0"], basant: ["#8a4a12", "#e0a84a"] };
const pal = (r) => PAL[r.thaat] || PAL._;
function applySky(p) {
  const k = SKY[p] || SKY[5], root = document.documentElement;
  root.style.setProperty("--sky1", k[0]); root.style.setProperty("--sky2", k[1]);
}

/* ---------------- notation ----------------
   Data: S r R g G m M P d D n N (lower case = komal; m shuddh Ma, M tivra Ma); 'S upper octave, .N lower.
   Shown romanised (komal underlined, tivra Ma with a vertical mark) and in Bengali akarmatrik letters. */
const NOTES = ["S", "r", "R", "g", "G", "m", "M", "P", "d", "D", "n", "N"];
const SW_ROMAN = { S: "S", r: "R", R: "R", g: "G", G: "G", m: "M", M: "M", P: "P", d: "D", D: "D", n: "N", N: "N" };
const SW_BN = { S: "সা", r: "ঋ", R: "রে", g: "জ্ঞ", G: "গা", m: "মা", M: "হ্মা", P: "পা", d: "দ", D: "ধা", n: "ণ", N: "না" };
function notation(seq, script) {
  if (!seq) return "";
  return seq.split(/\s+/).map((tok) => {
    const up = tok.includes("'"), lo = tok.startsWith("."), s = tok.replace(/['.]/g, "");
    if (!SW_ROMAN[s]) return esc(tok);
    let x = script === "bn" ? SW_BN[s] : SW_ROMAN[s];
    if (script !== "bn" && "rgdn".includes(s)) x = `<u>${x}</u>`;
    if (script !== "bn" && s === "M") x = `${x}&#x030D;`;
    return `<span class="sw${up ? " up" : ""}${lo ? " lo" : ""}">${x}</span>`;
  }).join(" ");
}
// Both scripts, swara by swara in aligned columns (no mid-sequence wrap; scrolls as a last resort). Current language on top.
function notaBoth(seq) {
  const cols = (seq || "").split(/\s+/).filter(Boolean).map((tok) => {
    const b = `<span class="nb">${notation(tok, "bn")}</span>`, e = `<span class="ne">${notation(tok, "en")}</span>`;
    return `<span class="nc">${L === "bn" ? b + e : e + b}</span>`;
  }).join("");
  return `<div class="ng">${cols}</div>`;
}
const vadiBoth = (r) => {
  const a = (s) => `${notation(r.vadi, s)} · ${notation(r.samvadi, s)}`;
  return L === "bn" ? `<span class="notation">${a("bn")}</span><small class="notation en">${a("en")}</small>` : `<span class="notation en" style="color:inherit;font-size:1.1rem">${a("en")}</span><small class="notation" style="font-size:1rem">${a("bn")}</small>`;
};

/* swara mandala: 12 note positions, the raag's notes joined, vadi/samvadi marked; optional note labels */
function mandala(r, cls = "mand", labels = false) {
  const used = new Set([...(r.aroha || "").split(/\s+/), ...(r.avaroha || "").split(/\s+/)].map((x) => x.replace(/['.]/g, "")).filter((x) => NOTES.includes(x)));
  const c = 50, R0 = 37, pos = (i, rad = R0) => { const a = -Math.PI / 2 + i * Math.PI / 6; return [c + rad * Math.cos(a), c + rad * Math.sin(a)]; };
  const pts = NOTES.map((n, i) => used.has(n) ? pos(i) : null).filter(Boolean);
  const dots = NOTES.map((n, i) => {
    const [x, y] = pos(i).map((v) => v.toFixed(1));
    if (r.vadi === n) return `<circle cx="${x}" cy="${y}" r="5.5" fill="#e8c260" stroke="rgba(0,0,0,.25)" stroke-width=".6"/>`;
    if (r.samvadi === n) return `<circle cx="${x}" cy="${y}" r="4.2" fill="none" stroke="#e8c260" stroke-width="1.6"/>`;
    return used.has(n) ? `<circle cx="${x}" cy="${y}" r="2.6" fill="currentColor"/>` : `<circle cx="${x}" cy="${y}" r="1" fill="currentColor" opacity=".35"/>`;
  }).join("");
  // labels: the raag's own notes, just outside the wheel, in the UI language; vadi/samvadi in gold
  const lab = labels ? NOTES.map((n, i) => {
    if (!used.has(n)) return "";
    const [x, y] = pos(i, 51).map((v) => v.toFixed(1));
    const gold = r.vadi === n || r.samvadi === n;
    const txt = L === "bn" ? esc(SW_BN[n]) : ("rgdn".includes(n) ? `<tspan text-decoration="underline">${n.toUpperCase()}</tspan>` : n === "M" ? "M&#x030D;" : n);
    return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${L === "bn" ? 9.5 : 8.5}" font-family="${L === "bn" ? "Noto Serif Bengali,serif" : "Hind Siliguri,sans-serif"}" font-weight="${gold ? 700 : 600}" fill="${gold ? "#e8c260" : "currentColor"}">${txt}</text>`;
  }).join("") : "";
  return `<svg class="${cls}${labels ? " lab" : ""}" viewBox="${labels ? "-14 -14 128 128" : "0 0 100 100"}" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-opacity=".3" stroke-width=".6"/><circle cx="50" cy="50" r="37" fill="none" stroke="currentColor" stroke-opacity=".18" stroke-width=".6" stroke-dasharray="1 3"/>${pts.length > 2 ? `<polygon points="${pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="currentColor" fill-opacity=".08" stroke="currentColor" stroke-opacity=".55" stroke-width=".7" stroke-linejoin="round"/>` : ""}${dots}${lab}<text x="50" y="56" text-anchor="middle" font-size="17" font-family="Noto Serif Bengali,serif" font-weight="600" fill="currentColor">${esc(glyph(r.bn || r.en))}</text></svg>`;
}
// The framed portrait of a raag. Names-only raags get a plain frame without a mandala.
function paint(r, opts = {}) {
  const n = rMain(r), len = [...n].length, cls = len > 9 ? "xl" : len > 5 ? "l" : "";
  if (r.facts === false) return `<div class="paint plain"><div class="glyph" aria-hidden="true">${esc(glyph(r.bn || r.en))}</div><div class="nm ${cls}">${esc(n)}<small>${esc(t("nameOnly"))}</small></div></div>`;
  const [p1, p2, ink] = pal(r), pr = META.prahars[(r.prahar || [])[0]];
  return `<div class="paint" style="--p1:${p1};--p2:${p2};--pink:${ink}">${opts.ribbon ? `<span class="rib">${esc(opts.ribbon)}</span>` : ""}<div class="arch"></div><div class="scrim"></div>${mandala(r, "mand", !!opts.labels)}<div class="nm ${cls}">${esc(n)}<small>${esc(thaatName(r.thaat))}${pr ? `${r.thaat ? " · " : ""}${esc(L === "bn" ? pr.bn : pr.en)}` : ""}</small></div></div>`;
}

/* ---------------- spelling-tolerant search ---------------- */
const BN_SKEL = {};
[["কখ", "k"], ["গঘ", "g"], ["ঙঞণনং", "n"], ["চছ", "c"], ["জঝয", "j"], ["টঠতথৎ", "t"], ["ডঢদধ", "d"],
 ["রৃঋ", "r"], ["পফ", "p"], ["বভ", "b"], ["ম", "m"], ["ল", "l"], ["শষস", "s"], ["হ", ""]]
  .forEach(([chars, v]) => [...chars].forEach((c) => { BN_SKEL[c] = v; }));
const LAT_DIGRAPHS = [["chh", "c"], ["ch", "c"], ["sh", "s"], ["kh", "k"], ["gh", "g"], ["th", "t"], ["dh", "d"],
  ["ph", "p"], ["bh", "b"], ["jh", "j"], ["ng", "n"], ["w", "b"], ["v", "b"], ["f", "p"], ["z", "j"], ["q", "k"],
  ["x", "ks"], ["y", ""]];
const dedupe = (s) => s.replace(/(.)\1+/g, "$1");
function skelBn(s) {
  s = (s || "").normalize("NFC").replace(/য়|য়/g, "").replace(/ড়|ঢ়|ড়|ঢ়/g, "র");
  return dedupe([...s].map((c) => BN_SKEL[c] || "").join(""));
}
function skelEn(s) {
  s = (s || "").toLowerCase().replace(/[^a-z]/g, "");
  for (const [a, b] of LAT_DIGRAPHS) s = s.split(a).join(b);
  return dedupe(s.replace(/[aeiouh]/g, ""));
}
const isBengali = (s) => /[ঀ-৿]/.test(s);
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

/* ---------------- building blocks ---------------- */
function raagCard(r, { big = false, ribbon = "" } = {}) {
  const n = rVids(r).length;
  const sub = r.facts === false ? t("nameOnly") : [rOther(r), n ? nPerf(n) : t("soon")].filter(Boolean).join(" · ");
  return `<div class="card${big ? " big" : ""}">
    <a href="#/raag/${enc(r.id)}" aria-label="${esc(L === "bn" ? `রাগ ${rMain(r)}` : `Raag ${rMain(r)}`)}">${paint(r, { ribbon, labels: big })}<b>${esc(rMain(r))}</b><span class="sub">${esc(sub)}</span></a>
    ${n ? `<button class="play" type="button" data-play-raag="${esc(r.id)}" aria-label="${esc(t("playRaag", { r: rMain(r) }))}">${I.play}</button>` : ""}
  </div>`;
}
function artistCard(a) {
  const n = (a.videos || []).length, th = n ? a.videos[0] : null;
  const sub = [(a.gharana || []).map(gharanaShort).join(", ") || aOther(a), n ? nPerf(n) : ""].filter(Boolean).join(" · ");
  return `<div class="card who">
    <a href="#/artist/${enc(a.id)}"><div class="pt">${th ? `<img src="${thumb(th, "hq")}" alt="" loading="lazy">` : `<div class="init" aria-hidden="true">${esc(glyph(aMain(a)))}</div>`}</div><b>${esc(aMain(a))}</b><span class="sub">${esc(sub)}</span></a>
    ${n ? `<button class="play" type="button" data-play-artist="${esc(a.id)}" aria-label="${esc(t("playArtistShort"))}: ${esc(aMain(a))}">${I.play}</button>` : ""}
  </div>`;
}
function perfCard(id) {
  const v = VIDEOS.get(id); if (!v) return "";
  const r = RAAG.get((v.raags || [])[0]), arts = (v.artists || []).map((x) => ARTIST.get(x)).filter(Boolean);
  return `<div class="card wide"><button type="button" data-play-id="${esc(id)}" aria-label="${esc(t("playAria", { t: v.t }))}">
    <span class="fr"><img src="${thumb(id)}" alt="" loading="lazy"><span class="pv"><i>${I.play}</i></span></span>
    <b>${esc(r ? `${t("raag")} ${rMain(r)}` : v.t)}</b><span class="sub">${esc(arts.length ? arts.map(aMain).join(", ") : v.ch)} · ${fmtTime(v.sec)}</span></button></div>`;
}
function moodCard(m) {
  const d = META.moods[m], [c1, c2] = MOODCOL[m] || ["#3a2f26", "#6b5a47"], n = jb.countFor({ moods: [m] });
  return `<button class="mood" type="button" style="--m1:${c1};--m2:${c2}" data-play="mood:${esc(m)}"${n ? "" : " disabled"}>
    <b>${esc(L === "bn" ? d.bn : d.en)} <small style="font-family:var(--sans);font-weight:500;opacity:.9">${esc(L === "bn" ? d.en : d.bn)}</small></b>
    <small>${esc(moodDesc(m))}<span class="n">${n ? `▶ ${nPerf(n)}` : t("soon")}</span></small></button>`;
}
const row = (title, items, { more = "", sub = "", hint = "", id = "" } = {}) => `<section class="sec"${id ? ` aria-labelledby="${id}"` : ""}>
  <div class="sec-h"><h2${id ? ` id="${id}"` : ""}>${title}${sub ? `<small>${sub}</small>` : ""}</h2>${more ? `<a class="more" href="${more}">${t("more")} →</a>` : ""}${hint ? `<span class="hint">${hint}</span>` : ""}</div>
  <div class="row">${items.join("")}</div></section>`;

// A compact row for long lists (A–Z, names-only raags).
function raagRow(r) {
  const n = rVids(r).length;
  const sub = [rOther(r), r.thaat && thaatName(r.thaat), (r.prahar || []).length ? r.prahar.map((p) => hours(META.prahars[p])).join(", ") : null].filter(Boolean).join(" · ");
  return `<a class="rowi${n ? "" : " dim"}" href="#/raag/${enc(r.id)}"><b>${esc(rMain(r))}</b><span class="sub">${esc(sub)}</span>
    <span class="meta${n ? " rec" : ""}">${n ? `▶ ${nPerf(n)}` : r.facts === false ? t("nameOnly") : ""}</span></a>`;
}
// Grid/list with a "show more" button; recorded items first unless told otherwise.
function listOf(items, item, { limit = 24, step = 48, recFirst = true, has = (x) => (x.videos || []).length, cls = "grid" } = {}) {
  const wrap = document.createElement("div");
  let shown = limit;
  const draw = () => {
    const all = recFirst ? items.filter(has).concat(items.filter((x) => !has(x))) : items;
    const vis = all.slice(0, shown);
    wrap.innerHTML = `<div class="${cls}">${vis.map(item).join("") || `<div class="empty"><div class="ic">❖</div><b>${t("nothingHere")}</b></div>`}</div>` +
      (all.length > shown ? `<p class="more-row"><button class="btn ghost sm" type="button">${t("showMore", { a: Math.min(step, all.length - shown), b: all.length - shown })}</button></p>` : "");
    const b = $(".more-row button", wrap);
    if (b) b.onclick = () => { shown += step; draw(); wirePlays(wrap); };
  };
  draw();
  return wrap;
}
const raagGrid = (list, o = {}) => listOf(list, (r) => raagCard(r), { has: hasRec, ...o });
const raagRows = (list, o = {}) => listOf(list, raagRow, { has: hasRec, cls: "rows", limit: 120, step: 300, ...o });
const artistGrid = (list, o = {}) => listOf(list, artistCard, o);

// Play buttons on cards and tiles: "Play X" starts X at once in the jukebox.
function wirePlays(root) {
  $$("[data-play-raag]", root).forEach((b) => b.onclick = () => playFiltered("raag", b.dataset.playRaag));
  $$("[data-play-artist]", root).forEach((b) => b.onclick = () => playFiltered("artist", b.dataset.playArtist));
  $$("[data-play]", root).forEach((b) => b.onclick = () => { const [kind, value] = b.dataset.play.split(":"); playFiltered(kind, value); });
  $$("[data-play-id]", root).forEach((b) => b.onclick = () => { jb.playId(b.dataset.playId); location.hash = "#/jukebox"; });
}

// One performance on a raag or artist page: plays inline (YouTube embed) and can be liked.
function perfRow(id, { showRaag = true, showArtist = true } = {}) {
  const v = VIDEOS.get(id);
  if (!v) return "";
  const raags = (v.raags || []).map((r) => RAAG.get(r)).filter(Boolean);
  const arts = (v.artists || []).map((a) => ARTIST.get(a)).filter(Boolean);
  const links = [
    showRaag && raags.map((r) => `<a href="#/raag/${enc(r.id)}">${esc(rBoth(r))}</a>`).join(", "),
    showArtist && arts.map((a) => `<a href="#/artist/${enc(a.id)}">${esc(aMain(a))}</a>`).join(", "),
    v.form && v.form !== "khayal" ? esc(formLabel(v.form)) : "",
  ].filter(Boolean).join(" · ");
  return `<div class="perf-wrap"><div class="perf" data-perf="${esc(id)}">
    <button class="pthumb" type="button" data-vid="${esc(id)}" aria-label="${esc(t("playInline", { t: v.t }))}"><img src="${thumb(id)}" alt="" loading="lazy"><span class="pv"><i>${I.play}</i></span></button>
    <div class="pmeta">${links ? `<b>${links}</b>` : ""}<span>${esc(v.t)}</span><small>${esc(v.ch)} · ${t("views", { v: fmtViews(v.views) })} · ${fmtTime(v.sec)}</small></div>
    <div class="pbtns">
      <button class="icon-btn" type="button" data-like="${esc(id)}" aria-pressed="${isLiked(id)}" aria-label="${esc(t("likeBtnAria"))}" title="${esc(t("likeTitle"))}">${isLiked(id) ? I.heartF : I.heart}</button>
    </div></div></div>`;
}
function wirePerfs(root) {
  $$("[data-vid]", root).forEach((b) => b.onclick = () => {
    jb.pause();
    $$(".inline-frame", root).forEach((f) => f.remove());
    $$(".perf.on", root).forEach((p) => p.classList.remove("on"));
    const wrap = b.closest(".perf-wrap"), f = document.createElement("iframe");
    f.src = `${ytHost()}/embed/${b.dataset.vid}?autoplay=1&rel=0&hl=${L}`;
    f.allow = "autoplay; encrypted-media; picture-in-picture"; f.allowFullscreen = true; f.title = "YouTube video";
    const box = document.createElement("div"); box.className = "inline-frame"; box.append(f);
    wrap.append(box); $(".perf", wrap).classList.add("on");
  });
  $$("[data-like]", root).forEach((b) => b.onclick = () => {
    const id = b.dataset.like, on = !isLiked(id);
    toggle("likes", id, on); jb.prefsChanged();
    b.setAttribute("aria-pressed", String(on)); b.innerHTML = on ? I.heartF : I.heart;
    toast(on ? t("toastLiked") : t("toastUnliked"));
  });
}

/* ---------------- views ---------------- */
const BROWSE = ["raags", "prahar", "thaat", "form", "mood", "season", "artists", "gharana", "az"];
const GROUP_RAAGS = {
  prahar: (v) => v === "any" ? RAAGS.filter((r) => !(r.prahar || []).length) : RAAGS.filter((r) => (r.prahar || []).includes(+v)),
  thaat: (v) => v === "none" ? RAAGS.filter((r) => !r.thaat) : RAAGS.filter((r) => r.thaat === v),
  form: (v) => RAAGS.filter((r) => r.videos && (r.videos[v] || []).length),
  mood: (v) => RAAGS.filter((r) => (r.moods || []).includes(v)),
  season: (v) => RAAGS.filter((r) => r.season === v),
};
const searchBox = (id, value, ph) => `<label class="search">${I.search}<input id="${id}" type="search" placeholder="${esc(ph)}" value="${esc(value)}" autocomplete="off" aria-label="${esc(ph)}"></label>`;

function renderHome() {
  const p = currentPrahar(), pr = META.prahars[p], season = currentSeason();
  applySky(p);
  const nowRaags = RAAGS.filter((r) => (r.prahar || []).includes(p) && hasRec(r));
  const nowPerf = jb.countFor({ now: true });
  const seasonN = season ? jb.countFor({ seasons: [season] }) : 0;
  const topRaags = RAAGS.filter(hasRec).slice(0, 16);
  const topArtists = ARTISTS.filter((a) => (a.videos || []).length && !a.extra).slice(0, 16);
  const cur = jb.current();
  const curRaag = cur ? (cur.raags || [])[0] : "";
  const recent = [...prefs.recent].reverse().concat([...prefs.likes].reverse()).filter((id, i, a) => VIDEOS.has(id) && a.indexOf(id) === i).slice(0, 12);
  const raagLinks = (rs) => rs.map((r) => `<a href="#/raag/${enc(r.id)}">${esc(rMain(r))}</a>`).join(" · ");
  const dayline = Object.entries(META.prahars).sort((a, b) => ((a[1].from + 18) % 24) - ((b[1].from + 18) % 24)).map(([k, x]) => {
    const n = GROUP_RAAGS.prahar(k).filter(hasRec).length;
    return `<a class="day${+k === p ? " cur" : ""}" href="#/list/prahar/${k}" style="--t1:${PRCOL[k][0]};--t2:${PRCOL[k][1]}"><i aria-hidden="true"></i><b>${esc(L === "bn" ? x.bn : x.en)}</b><small>${hours(x)} · ${t("nRaags", { n })}</small></a>`;
  }).join("");
  view.innerHTML = `
    <section class="hero" aria-labelledby="h-now">
      <div class="orb" aria-hidden="true"></div>
      <div class="orn">${t("nowHour")} · ${hours(pr)}</div>
      <div class="kick"><b id="h-now">${esc(L === "bn" ? pr.bn : pr.en)}</b><span>${esc(L === "bn" ? pr.en : pr.bn)} · ${t("nRaags", { n: nowRaags.length })}</span></div>
      <p>${nowRaags.length ? `${t("nowRaags")} ${raagLinks(nowRaags.slice(0, 8))}${nowRaags.length > 8 ? " …" : ""}` : t("nowNone")}</p>
      <div class="acts"><button class="btn" type="button" data-play="now:1"${nowPerf ? "" : " disabled"}>${I.play} ${t("playNow", { n: nowPerf })}</button>
        <a class="btn ghost" href="#/list/prahar/${p}">${t("allOfHour")}</a></div>
      ${nowRaags.length ? `<div class="row">${nowRaags.slice(0, 10).map((r) => raagCard(r, { big: true, ribbon: curRaag === r.id ? t("nowPlaying") : "" })).join("")}</div>` : ""}
    </section>
    ${season ? `<section class="season-tile" style="--t1:${SEASONCOL[season][0]};--t2:${SEASONCOL[season][1]}" aria-labelledby="h-season">
      <div><b id="h-season">${esc(META.seasons[season].bn)} · ${esc(META.seasons[season].en)}</b>
        <p>${t("seasonText", { s: seasonWord(season) })} ${raagLinks(GROUP_RAAGS.season(season).filter(hasRec))}</p></div>
      <button class="btn" type="button" data-play="season:${season}"${seasonN ? "" : " disabled"}>${I.play} ${t("playSeason", { s: seasonWord(season) })}</button>
    </section>` : ""}
    ${row(t("moods"), Object.keys(META.moods).map(moodCard), { more: "#/browse/mood", id: "h-moods" })}
    <section class="sec" aria-labelledby="h-day">
      <div class="sec-h"><h2 id="h-day">${t("throughDay")}</h2><a class="more" href="#/browse/prahar">${t("all")} →</a></div>
      <div class="dayline">${dayline}</div>
    </section>
    ${row(t("wellKnown"), topRaags.map((r) => raagCard(r)), { more: "#/browse/raags", sub: t("allN", { n: RAAGS.length }), id: "h-pop" })}
    ${row(t("greatVoices"), topArtists.map(artistCard), { more: "#/browse/artists", id: "h-art" })}
    ${recent.length ? row(t("continueRow"), recent.map(perfCard), { more: "#/mine", sub: t("continueHint"), id: "h-cont" }) : ""}
    <section class="sec" aria-labelledby="h-explore">
      <div class="sec-h"><h2 id="h-explore">${t("explore")}</h2></div>
      <div class="chips wrap">${BROWSE.map((k) => `<a class="chip" href="#/browse/${k}">${t("b_" + k)}</a>`).join("")}</div>
      <p class="stats">${t("stats", { a: RAAGS.filter(hasRec).length, b: RAAGS.length, c: VIDEOS.size })}</p>
    </section>`;
  wirePlays(view);
}

function groups(kind) {
  if (kind === "prahar") return Object.keys(META.prahars).map((k) => [k, praharName(k), hours(META.prahars[k]), PRCOL[k]]).concat([["any", t("anyTimeLight"), "", null]]);
  if (kind === "thaat") return Object.keys(META.thaats).map((k) => [k, thaatName(k), L === "bn" ? cap(k) : META.thaats[k], PAL[k]]).concat([["none", t("noThaat"), "", null]]);
  if (kind === "form") return Object.keys(META.forms).map((k) => [k, formName(k), L === "bn" ? cap(k) : META.forms[k], null]);
  if (kind === "mood") return Object.keys(META.moods).map((k) => [k, moodName(k), moodDesc(k), MOODCOL[k]]);
  if (kind === "season") return Object.keys(META.seasons).map((k) => [k, L === "bn" ? META.seasons[k].bn : META.seasons[k].en, L === "bn" ? META.seasons[k].en : META.seasons[k].bn, SEASONCOL[k]]);
  return [];
}
const tile = (href, label, sub, col, extra = "", cur = false) => `<a class="tile${col ? "" : " neutral"}${cur ? " cur" : ""}" href="${href}"${col ? ` style="--t1:${col[0]};--t2:${col[1]}"` : ""}>${esc(label)}<small>${[esc(sub), extra].filter(Boolean).join(" · ")}</small></a>`;

function renderBrowse(kind) {
  if (!BROWSE.includes(kind)) kind = "raags";
  const q0 = sessionGet("q");
  view.innerHTML = `${kind === "artists" ? "" : searchBox("q", q0, t("searchPh"))}
    <nav class="chips" aria-label="${esc(t("browseBy"))}">${BROWSE.map((k) => `<a class="chip" href="#/browse/${k}"${k === kind ? ' aria-current="page"' : ""}>${t("b_" + k)}</a>`).join("")}</nav>
    <div id="browse-body"></div>`;
  const input = $("#q"), body = $("#browse-body");
  if (!input) { renderKind(body, kind); return; }
  const draw = () => {
    sessionSet("q", input.value);
    if (norm(input.value)) return renderSearch(body, input.value);
    renderKind(body, kind);
  };
  input.addEventListener("input", draw);
  draw();
}
function renderSearch(body, q) {
  const rs = search(RAAGS.concat(EXTRA), q), as = search(ARTISTS, q);
  if (!rs.length && !as.length) { body.innerHTML = `<div class="empty"><div class="ic">⌕</div><b>${t("noResults")}</b><p>${t("tryOther")}</p></div>`; return; }
  body.innerHTML = `<div class="sec" style="margin-top:14px"><div class="sec-h"><h2>${t("found", { r: rs.length, a: as.length })}</h2></div></div>`;
  if (rs.length) { body.insertAdjacentHTML("beforeend", `<div class="formh">${t("raagsHead")}<small>${num(rs.length)}</small></div>`); body.append(raagGrid(rs, { limit: 18, step: 36, recFirst: false })); }
  if (as.length) { body.insertAdjacentHTML("beforeend", `<div class="formh">${t("artists")}<small>${num(as.length)}</small></div>`); body.append(artistGrid(as, { limit: 18, step: 36, recFirst: false })); }
  wirePlays(body);
}
function renderKind(body, kind) {
  body.innerHTML = "";
  if (kind === "raags") {
    body.insertAdjacentHTML("beforeend", `<p class="hint" style="margin:8px 0 14px">${t("hintRaags", { n: RAAGS.length })}</p>`);
    body.append(raagGrid(RAAGS, { recFirst: false, limit: 30, step: 60 }));
  } else if (kind === "az") {
    const all = RAAGS.concat(EXTRA).slice().sort((a, b) => L === "bn" ? (a.bn || a.en).localeCompare(b.bn || b.en, "bn") : a.en.localeCompare(b.en));
    body.insertAdjacentHTML("beforeend", `<p class="hint" style="margin:8px 0 14px">${t("hintAz", { n: all.length, m: EXTRA.length })}</p>`);
    body.append(raagRows(all, { recFirst: false, limit: 150, step: 300 }));
  } else if (kind === "artists") {
    const all = ARTISTS.filter((a) => !a.extra || (a.videos || []).length);
    const a0 = sessionGet("artistQ");
    body.insertAdjacentHTML("beforeend", `<p class="hint" style="margin:8px 0 10px">${t("hintArtists")}</p>
      <label class="search sm">${I.search}<input id="artist-q" type="search" value="${esc(a0)}" autocomplete="off" placeholder="${esc(t("findArtist"))}" aria-label="${esc(t("findArtist"))}"></label>
      <p class="hint" id="artist-n" style="margin:0 0 10px"></p><div id="artist-list"></div>`);
    const input = $("#artist-q");
    const draw = () => {
      const q = input.value;
      sessionSet("artistQ", q);
      const list = norm(q) ? search(all, q) : all;
      $("#artist-n").textContent = norm(q) ? t("nArtists", { n: list.length }) : "";
      $("#artist-list").replaceChildren(artistGrid(list, { recFirst: !norm(q), limit: 36, step: 72 }));
      wirePlays($("#artist-list"));
    };
    input.addEventListener("input", draw);
    draw();
  } else if (kind === "gharana") {
    const m = new Map();
    for (const a of ARTISTS) for (const g of a.gharana || []) m.set(g, (m.get(g) || 0) + 1);
    body.insertAdjacentHTML("beforeend", `<div class="tile-grid" style="margin-top:14px">${[...m.entries()].sort((a, b) => b[1] - a[1]).map(([g, n]) =>
      tile(`#/list/gharana/${enc(g)}`, gharanaShort(g), L === "bn" ? g : META.gharanas[g] || "", null, t("nArtists", { n }))).join("")}</div>`);
  } else {
    const p = currentPrahar();
    body.insertAdjacentHTML("beforeend", `<div class="tile-grid" style="margin-top:14px">${groups(kind).map(([v, label, sub, col]) => {
      const rs = GROUP_RAAGS[kind](v), rec = rs.filter(hasRec).length;
      return tile(`#/list/${kind}/${enc(v)}`, label, sub, col, `${t("nRaags", { n: rs.length })}${rec ? ` · ▶ ${num(rec)}` : ""}`, kind === "prahar" && +v === p);
    }).join("")}</div>`);
  }
  wirePlays(body);
}

function renderList(kind, value) {
  if (kind === "gharana") {
    const list = ARTISTS.filter((a) => (a.gharana || []).includes(value));
    const n = jb.countFor({ gharana: value });
    view.innerHTML = `<a class="back" href="#/browse/gharana">${I.back} ${t("b_gharana")}</a>
      <div class="pagehead"><div class="orn">${t("b_gharana")}</div><h1 style="margin-top:12px">${esc(gharanaLabel(value))}</h1><p>${t("nArtists", { n: list.length })}</p>
      ${n ? `<div class="acts"><button class="btn sm" type="button" id="play-list">${I.play} ${t("playGharana", { g: gharanaShort(value) })} <span class="n">(${num(n)})</span></button></div>` : ""}</div>`;
    view.append(artistGrid(list, { limit: 36 }));
    if (n) $("#play-list").onclick = () => playFiltered("gharana", value);
    wirePlays(view);
    return;
  }
  if (!GROUP_RAAGS[kind]) return renderBrowse("raags");
  const list = GROUP_RAAGS[kind](value);
  const label = kind === "prahar" ? (value === "any" ? t("anyTimeLight") : praharLabel(value)) : kind === "thaat" ? (value === "none" ? t("noThaat") : thaatLabel(value))
    : kind === "form" ? formLabel(value) : kind === "mood" ? moodLabel(value) : seasonLabel(value);
  const filt = kind === "prahar" ? (value === "any" ? null : { prahars: [+value] }) : kind === "thaat" ? (value === "none" ? null : { thaats: [value] })
    : kind === "form" ? { forms: [value] } : kind === "mood" ? { moods: [value] } : { seasons: [value] };
  const n = filt ? jb.countFor(filt) : 0;
  view.innerHTML = `<a class="back" href="#/browse/${kind}">${I.back} ${t("b_" + kind)}</a>
    <div class="pagehead"><div class="orn">${t("b_" + kind)}</div><h1 style="margin-top:12px">${esc(label)}</h1>
    <p>${t("nRaags", { n: list.length })}${kind === "mood" ? ` · ${esc(moodDesc(value))}` : ""}</p>
    ${n ? `<div class="acts"><button class="btn sm" type="button" id="play-list">${I.play} ${t("playJb", { n })}</button></div>` : ""}</div>`;
  view.append(raagGrid(list, { limit: 30 }));
  if (n) $("#play-list").onclick = () => { jb.setFilters(filt); location.hash = "#/jukebox"; jb.start(true); };
  wirePlays(view);
}

function renderRaag(id) {
  const r = RAAG.get(id);
  if (!r) { view.innerHTML = `<div class="empty"><div class="ic">❖</div><b>${t("raagNotFound")}</b><p><a class="textlink" href="#/">${t("backListen")}</a></p></div>`; return; }
  const chip = (kind, v, label) => `<a class="chip sm" href="#/list/${kind}/${enc(v)}">${esc(label)}</a>`;
  const title = L === "bn" ? `রাগ ${r.bn || r.en}` : `Raag ${r.en}`;
  const other = L === "bn" ? (r.bn ? `Raag ${r.en}` : "") : (r.bn ? `রাগ ${r.bn}` : "");
  const aliases = (r.aliases || []).filter((a) => a !== r.en).slice(0, 6);
  const alt = `<div class="alt">${esc(other)}${r.hi ? `<span class="hi" lang="hi">${esc(r.hi)}</span>` : ""}${aliases.length || r.bnAlt ? `<span class="al">${t("also")}: ${esc([...aliases, r.bnAlt].filter(Boolean).join(" · "))}</span>` : ""}</div>`;
  if (r.facts === false) {
    view.innerHTML = `<a class="back" href="#/browse/az">${I.back} ${t("b_az")}</a>
      <div class="dhead raagh">${paint(r)}<div><div class="kick">${t("raag")} · ${t("nameOnly")}</div><h1>${esc(title)}</h1>${alt}</div></div>
      <p class="novideo" style="margin-top:22px">${t("extraNote", { auto: r.auto })}</p>`;
    return;
  }
  const facts = [
    [r.thaat && `<div><dt>${t("f_thaat")}</dt><dd>${chip("thaat", r.thaat, thaatLabel(r.thaat))}</dd></div>`],
    [`<div><dt>${t("f_time")}</dt><dd><div class="tags">${(r.prahar || []).length ? r.prahar.map((p) => chip("prahar", p, praharLabel(p))).join("") : chip("prahar", "any", t("anyTime"))}</div></dd></div>`],
    [r.season && `<div><dt>${t("f_season")}</dt><dd>${chip("season", r.season, seasonLabel(r.season))}</dd></div>`],
    [r.jati && `<div><dt>${t("f_jati")}</dt><dd>${esc(jatiLabel(r.jati))}<small>${esc(r.jati.split("-").map((x) => cap(STR[L === "bn" ? "en" : "bn"].jati[x] || x)).join(" – "))}</small></dd></div>`],
    [(r.vadi || r.samvadi) && `<div><dt>${t("f_vadi")}</dt><dd>${vadiBoth(r)}</dd></div>`],
    [r.aroha && `<div class="span"><dt>${t("f_aroha")}</dt><dd>${notaBoth(r.aroha)}</dd></div>`],
    [r.avaroha && `<div class="span"><dt>${t("f_avaroha")}</dt><dd>${notaBoth(r.avaroha)}</dd></div>`],
    [(r.moods || []).length && `<div class="span"><dt>${t("f_mood")}</dt><dd><div class="tags">${r.moods.map((m) => chip("mood", m, moodLabel(m))).join("")}</div></dd></div>`],
    [(r.related || []).length && `<div class="span"><dt>${t("f_related")}</dt><dd><div class="tags">${r.related.map((x) => RAAG.get(x)).filter(Boolean).map((x) => `<a class="chip sm" href="#/raag/${enc(x.id)}">${esc(rBoth(x))}</a>`).join("")}</div></dd></div>`],
  ].map(([v]) => v).filter(Boolean);
  const forms = r.videos ? Object.keys(META.forms).filter((f) => (r.videos[f] || []).length) : [];
  const vids = r.videos == null ? `<p class="novideo">${t("raagNotFetched")}</p>`
    : !forms.length ? `<p class="novideo">${t("noneFound")}</p>`
    : forms.map((f) => `<div class="formh">${esc(formName(f))}<small>${num(r.videos[f].length)}</small></div><div class="list">${r.videos[f].map((v) => perfRow(v, { showRaag: false })).join("")}</div>`).join("");
  const n = jb.countFor({ raag: r.id });
  const src = r.wiki ? `<a href="https://en.wikipedia.org/wiki/${enc(r.wiki.replace(/ /g, "_"))}" target="_blank" rel="noopener">${t("wikipedia")}</a>` : t("stdRefs");
  view.innerHTML = `<a class="back" href="#/browse/raags">${I.back} ${t("raagsCrumb")}</a>
    <div class="dhead raagh">${paint(r, { labels: true })}
      <div><div class="kick">${t("raag")}${r.thaat ? ` · <a href="#/list/thaat/${enc(r.thaat)}">${esc(thaatName(r.thaat))} ${t("f_thaat")}</a>` : ""}</div><h1>${esc(title)}</h1>${alt}</div></div>
    <div class="dacts">
      <button class="btn" type="button" id="play-raag"${n ? "" : " disabled"}>${I.play} ${t("playRaag", { r: rMain(r) })}</button>
      <span class="hint">${nPerf(rVids(r).length)}</span>
    </div>
    <dl class="cat">${facts.join("")}</dl>
    <p class="src">${t("swaraMap")} ${t("notationNote", { src })}</p>
    <section aria-label="${esc(t("performances"))}">${vids}</section>`;
  $("#play-raag").onclick = () => playFiltered("raag", r.id);
  wirePerfs(view);
}

function renderArtist(id) {
  const a = ARTIST.get(id);
  if (!a) { view.innerHTML = `<div class="empty"><div class="ic">❖</div><b>${t("artistNotFound")}</b><p><a class="textlink" href="#/browse/artists">${t("allArtistsLink")}</a></p></div>`; return; }
  const facts = [
    (a.born || a.died) && `<div><dt>${t("f_dates")}</dt><dd>${num(`${a.born || "?"} – ${a.died || ""}`)}</dd></div>`,
    (a.gharana || []).length && `<div><dt>${t("f_gharana")}</dt><dd><div class="tags">${a.gharana.map((g) => `<a class="chip sm" href="#/list/gharana/${enc(g)}">${esc(gharanaLabel(g))}</a>`).join("")}</div></dd></div>`,
    (a.forms || []).length && `<div><dt>${t("f_forms")}</dt><dd>${a.forms.map(formLabel).map(esc).join(", ")}</dd></div>`,
    a.voice && `<div><dt>${t("f_voice")}</dt><dd>${esc(STR[L].voice[a.voice] || a.voice)}</dd></div>`,
    a.guessed && `<div class="span"><dt>${t("f_source")}</dt><dd>${t("guessedNote")}</dd></div>`,
  ].filter(Boolean);
  const byRaag = new Map();
  for (const v of (a.videos || []).map((x) => VIDEOS.get(x)).filter(Boolean)) for (const r of v.raags || []) byRaag.set(r, (byRaag.get(r) || 0) + 1);
  const raags = [...byRaag.entries()].sort((x, y) => y[1] - x[1]).map(([r]) => RAAG.get(r)).filter(Boolean);
  if (raags.length) facts.push(`<div class="span"><dt>${t("f_raagsHere")}</dt><dd><div class="tags">${raags.map((r) => `<a class="chip sm" href="#/raag/${enc(r.id)}">${esc(rBoth(r))}</a>`).join("")}</div></dd></div>`);
  const vids = (a.videos || []).length ? `<div class="formh">${t("performances")}<small>${num(a.videos.length)}</small></div><div class="list">${a.videos.map((v) => perfRow(v, { showArtist: false })).join("")}</div>`
    : `<p class="novideo">${a.searched ? t("noneFound") : t("artistNotFetched")}</p>`;
  const n = jb.countFor({ artist: a.id });
  const th = (a.videos || [])[0];
  view.innerHTML = `<a class="back" href="#/browse/artists">${I.back} ${t("b_artists")}</a>
    <div class="dhead"><div class="card who"><div class="pt">${th ? `<img src="${thumb(th, "hq")}" alt="">` : `<div class="init" aria-hidden="true">${esc(glyph(aMain(a)))}</div>`}</div></div>
      <div><div class="kick">${t("artist")}</div><h1>${esc(aMain(a))}</h1>
      <div class="alt">${esc(aOther(a))}${a.hi ? `<span class="hi" lang="hi">${esc(a.hi)}</span>` : ""}</div></div></div>
    <div class="dacts"><button class="btn" type="button" id="play-artist"${n ? "" : " disabled"}>${I.play} ${t("playJb", { n })}</button><span class="hint">${nPerf((a.videos || []).length)}</span></div>
    ${facts.length ? `<dl class="cat">${facts.join("")}</dl>` : ""}
    ${a.wiki ? `<p class="src">${t("moreOnWiki", { link: `<a href="https://en.wikipedia.org/wiki/${enc(a.wiki.replace(/ /g, "_"))}" target="_blank" rel="noopener">${t("wikipedia")}</a>` })}</p>` : ""}
    <section aria-label="${esc(t("performances"))}">${vids}</section>`;
  $("#play-artist").onclick = () => playFiltered("artist", a.id);
  wirePerfs(view);
}

/* ---------------- Mine: liked and hidden performances ---------------- */
function mineRow(id, kind) {
  const v = VIDEOS.get(id);
  if (!v) return "";
  const raags = (v.raags || []).map((r) => RAAG.get(r)).filter(Boolean);
  const arts = (v.artists || []).map((a) => ARTIST.get(a)).filter(Boolean);
  const links = [raags.map((r) => `<a href="#/raag/${enc(r.id)}">${esc(t("raag"))} ${esc(rMain(r))}</a>`).join(", "),
    arts.map((a) => `<a href="#/artist/${enc(a.id)}">${esc(aMain(a))}</a>`).join(", ")].filter(Boolean).join(" · ");
  return `<div class="perf mine">
    <button class="pthumb" type="button" data-play-id="${esc(id)}" aria-label="${esc(t("playAria", { t: v.t }))}"><img src="${thumb(id)}" alt="" loading="lazy"><span class="pv"><i>${I.play}</i></span></button>
    <div class="pmeta">${links ? `<b>${links}</b>` : ""}<span>${esc(v.t)}</span><small>${esc(v.ch)} · ${fmtTime(v.sec)}</small></div>
    <div class="pbtns">
      <button class="btn xs" type="button" data-play-id="${esc(id)}">${I.play} ${t("playOne")}</button>
      <button class="btn ghost xs" type="button" data-un="${kind}" data-id="${esc(id)}">${kind === "likes" ? t("unlike") : t("allowAgain")}</button>
    </div></div>`;
}
function renderMine() {
  const likes = prefs.likes.filter((id) => VIDEOS.has(id)).slice().reverse(); // newest first
  const never = prefs.never.filter((id) => VIDEOS.has(id)).slice().reverse();
  const u = SYNC.user;
  const acct = SYNC.signIn && !u
    ? `<div class="acct"><span class="avatar" aria-hidden="true">?</span><div><b>${t("notSignedIn")}</b><small>${t("mineSignIn")}</small></div><button class="btn sm" type="button" id="mine-in">${t("signIn")}</button></div>`
    : u ? `<div class="acct">${u.photo ? `<img class="avatar" src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="avatar" aria-hidden="true">${esc((u.name || u.email || "?").trim()[0].toUpperCase())}</span>`}<div><b>${esc(u.name || u.email || "")}</b><small>${t("mineSynced")}</small></div></div>`
    : `<p class="hint" style="margin:8px 0 16px">${t("prefsNote")}</p>`;
  view.innerHTML = `<div class="pagehead"><div class="orn">${t("navMine")}</div><h1 style="margin-top:12px">${t("mineTitle")}</h1></div>
    ${acct}
    <section class="sec" style="margin-top:10px" aria-labelledby="h-likes">
      <div class="sec-h"><h2 id="h-likes">${t("mineLiked", { n: likes.length })}</h2>
        ${likes.length ? `<button class="btn sm play-all" type="button" id="mine-play-all">${I.play} ${t("playAllLikes")}</button>` : ""}</div>
      ${likes.length ? `<div class="list">${likes.map((id) => mineRow(id, "likes")).join("")}</div>` : `<div class="empty"><div class="ic">♥</div><p>${t("mineNoLikes")}</p></div>`}
    </section>
    ${never.length ? `<section class="sec" aria-labelledby="h-never"><div class="sec-h"><h2 id="h-never">${t("mineHidden", { n: never.length })}</h2><span class="hint">${t("mineHiddenHint")}</span></div>
      <div class="list">${never.map((id) => mineRow(id, "never")).join("")}</div></section>` : ""}`;
  $$("[data-play-id]", view).forEach((b) => b.onclick = () => { jb.playId(b.dataset.playId); location.hash = "#/jukebox"; });
  $$("[data-un]", view).forEach((b) => b.onclick = () => { toggle(b.dataset.un, b.dataset.id, false); jb.prefsChanged(); toast(b.dataset.un === "likes" ? t("toastUnliked") : t("toastAllow")); renderMine(); });
  const all = $("#mine-play-all");
  if (all) all.onclick = () => { jb.setFilters({ likedOnly: true }); location.hash = "#/jukebox"; jb.start(true); };
  const si = $("#mine-in");
  if (si) si.onclick = () => SYNC.signIn();
}

function sessionGet(k) { try { return sessionStorage.getItem("raagmala." + k) || ""; } catch { return ""; } }
function sessionSet(k, v) { try { sessionStorage.setItem("raagmala." + k, v); } catch { /* ignore */ } }

/* ---------------- jukebox (plays performances) ---------------- */
const jb = (() => {
  const F = prefs.filters;
  const findQ = { raag: "", artist: "" }; // text in the jukebox find boxes (not saved)
  let player = null, apiLoading = null, current = null, errors = 0, queue = [], qShown = 60, seeking = false;
  const history = [];

  function matches(v, f) {
    return !isNever(v.id)
      && (!f.likedOnly || isLiked(v.id))
      && (!f.now || v._prahar.includes(currentPrahar()))
      && (!f.prahars.length || v._prahar.some((p) => f.prahars.includes(p)))
      && (!f.thaats.length || v._thaat.some((x) => f.thaats.includes(x)))
      && (!f.forms.length || f.forms.includes(v.form || "khayal"))
      && (!f.moods.length || v._moods.some((m) => f.moods.includes(m)))
      && (!f.seasons.length || v._season.some((s) => f.seasons.includes(s)))
      && (!f.raag || (v.raags || []).includes(f.raag))
      && (!f.artist || (v.artists || []).includes(f.artist))
      && (!f.gharana || v._gharana.includes(f.gharana));
  }
  const pool = (f = F) => [...VIDEOS.values()].filter((v) => matches(v, f));

  /* The playlist: a weighted shuffle of every performance that matches the filters.
     Liked ones tend to come early (4x weight), recently played ones go to the end,
     and the same raag twice in a row is avoided where possible. */
  function buildQueue() {
    const recent = new Set(prefs.recent.slice(-150));
    const p = pool().filter((v) => !current || v.id !== current.id);
    const q = p.map((v) => [Math.pow(Math.random(), 1 / (isLiked(v.id) ? 4 : 1)) - (recent.has(v.id) ? 1 : 0), v])
      .sort((a, b) => b[0] - a[0]).map(([, v]) => v);
    const share = (a, b) => !!a && !!b && (a.raags || []).some((r) => (b.raags || []).includes(r));
    for (let i = 0; i < q.length; i++) {
      if (!share(i ? q[i - 1] : current, q[i])) continue;
      const j = q.findIndex((v, k) => k > i && !share(i ? q[i - 1] : current, v));
      if (j > 0) [q[i], q[j]] = [q[j], q[i]];
    }
    queue = q;
    qShown = 60;
  }
  const label = (v) => {
    const r = RAAG.get((v.raags || [])[0]), a = ARTIST.get((v.artists || [])[0]);
    return `${r ? `${t("raag")} ${rMain(r)}` : v.t}${a ? ` · ${aMain(a)}` : ""}`;
  };
  const artistsOf = (v) => { const as = (v.artists || []).map((x) => ARTIST.get(x)).filter(Boolean); return as.length ? as.map(aMain).join(", ") : v.ch; };
  function qRow(v, i, cur) {
    const r = RAAG.get((v.raags || [])[0]);
    return `<button class="item${cur ? " on" : ""}${isLiked(v.id) ? " liked" : ""}" type="button" data-qid="${esc(v.id)}"${cur ? ' aria-current="true"' : ""}>
      <span class="n">${cur ? "▶" : num(i)}</span><img src="${thumb(v.id)}" alt="" loading="lazy">
      <span class="qm"><b>${esc(r ? `${t("raag")} ${rMain(r)}` : v.t)}</b><span>${esc(artistsOf(v))} · ${esc(v.t)}</span></span>
      <span class="dur">${fmtTime(v.sec)}</span></button>`;
  }
  function renderQueue() {
    queue = queue.filter((v) => matches(v, F));
    $("#jb-next").textContent = queue.length && current ? `${t("upNext")} ${label(queue[0])}` : "";
    const el = $("#jb-queue");
    if (!current && !queue.length) { el.innerHTML = ""; return; }
    const more = queue.length - qShown;
    el.innerHTML = `<div class="q-head"><span></span>
        <button class="btn ghost xs" type="button" id="q-shuffle">${I.shuffle} ${t("reshuffle")}</button></div>
      <div class="list">${current ? qRow(current, 0, true) : ""}${queue.slice(0, qShown).map((v, i) => qRow(v, i + 1, false)).join("")}</div>
      ${more > 0 ? `<p class="more-row"><button class="btn ghost sm" type="button" id="q-more">${t("showMore", { a: Math.min(100, more), b: more })}</button></p>` : ""}`;
    $$("[data-qid]", el).forEach((b) => b.onclick = () => playId(b.dataset.qid));
    $("#q-shuffle").onclick = () => { buildQueue(); renderQueue(); };
    const m = $("#q-more"); if (m) m.onclick = () => { qShown += 100; renderQueue(); };
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

  // play = false only cues the performance at startAt (after a page refresh browsers block sound until a click).
  async function playItem(v, startAt = 0, play = true) {
    current = v;
    pendingStart = Math.floor(startAt);
    if (!startAt) { prefs.recent.push(v.id); prefs.recent = prefs.recent.slice(-300); savePrefs(); }
    showNow(); renderQueue(); saveSession(); setProgress(pendingStart, v.sec);
    await loadApi();
    $("#jb-empty").hidden = true;
    const start = Math.floor(startAt);
    if (!player) {
      player = new YT.Player("yt-player", {
        videoId: v.id, host: ytHost(),
        playerVars: { autoplay: play ? 1 : 0, rel: 0, playsinline: 1, hl: L, start },
        events: {
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.ENDED) next();
            if (e.data === YT.PlayerState.PLAYING) errors = 0;
            updateButtons(); saveSession(); tick();
          },
          onError: () => { if (++errors < 5) next(); }, // unembeddable or removed video: move on
        },
      });
    } else if (play) player.loadVideoById({ videoId: v.id, startSeconds: start });
    else player.cueVideoById({ videoId: v.id, startSeconds: start });
    updateButtons();
  }

  /* Resume point: what was playing, where, the playlist and the page. */
  // Until a cued performance has really started, its position is where it was cued.
  let pendingStart = 0;
  const position = () => {
    try {
      const st = player && player.getPlayerState ? player.getPlayerState() : -1;
      if (st === -1 || st === 5) return pendingStart; // unstarted / cued
      return player.getCurrentTime();
    } catch { return pendingStart; }
  };
  const duration = () => { try { const d = player && player.getDuration ? player.getDuration() : 0; return d || (current ? current.sec : 0); } catch { return current ? current.sec : 0; } };
  function saveSession() {
    if (!VIDEOS.size || holdSession) return;
    const s = { at: Date.now(), route: lastPage, vid: current ? current.id : "", t: current ? Math.floor(position()) : 0,
      queue: queue.slice(0, 200).map((v) => v.id), history: history.slice(-30).map((v) => v.id) };
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
    SYNC.changed("session");
  }
  // Continue a saved session: playlist and history come back, the performance starts where it stopped.
  function resume(s, play = true) {
    const get = (ids) => (ids || []).map((id) => VIDEOS.get(id)).filter(Boolean);
    queue = get(s.queue).filter((v) => matches(v, F));
    history.splice(0, history.length, ...get(s.history));
    const v = s.vid && VIDEOS.get(s.vid);
    if (v) playItem(v, play ? Math.max(0, (s.t || 0) - 3) : s.t || 0, play); else renderQueue();
  }

  function next() {
    queue = queue.filter((v) => matches(v, F));
    if (!queue.length) buildQueue();
    const v = queue.shift();
    if (!v) { showEmpty(); return; }
    if (current) history.push(current);
    playItem(v);
  }
  function prev() {
    const v = history.pop();
    if (!v) return;
    if (current) queue.unshift(current); // the one we leave comes up next again
    current = null;
    playItem(v);
  }
  // Play a chosen item from the playlist; the list then continues after it.
  function playId(id) {
    const v = VIDEOS.get(id);
    if (!v || (current && current.id === id)) { if (player) player.playVideo(); return; }
    const i = queue.findIndex((x) => x.id === id);
    if (i >= 0) queue = queue.slice(i + 1).concat(queue.slice(0, i));
    if (current) history.push(current);
    playItem(v);
  }
  // Switch between the privacy-enhanced player and the standard one (YouTube Premium) without losing the place.
  function resetPlayer() {
    if (!player) return;
    const t0 = player.getCurrentTime ? player.getCurrentTime() : 0;
    try { player.destroy(); } catch { /* already gone */ }
    player = null;
    if (!$("#yt-player")) { const d = document.createElement("div"); d.id = "yt-player"; $(".jb-player").prepend(d); }
    if (current) playItem(current, t0);
  }
  // start(): resume what is playing; start(true): jump to the first item of the (new) playlist.
  function start(fresh = false) {
    if (!fresh && current && player) { player.playVideo(); return; }
    next();
  }

  function showEmpty() {
    const n = pool().length;
    $("#jb-empty").hidden = !!current && n > 0;
    $("#jb-empty-msg").textContent = n ? t("jbEmpty") : t("jbNone");
    $("#jb-empty-clear").hidden = n > 0;
    $("#jb-empty-clear").textContent = t("clearFilters");
    $("#jb-empty-play").hidden = !n;
    $("#jb-empty-play").innerHTML = `${I.play} ${t("play")}`;
    updateButtons();
  }

  function showNow() {
    const el = $("#jb-now"), paintEl = $("#jb-paint");
    document.title = L === "bn" ? "রাগমালা · হিন্দুস্তানি কণ্ঠসংগীত" : "Raagmala · রাগমালা";
    if (!current) { el.innerHTML = `<p class="hint" style="margin-top:14px">${t("nothingPlaying")}</p>`; $("#jb-notes").innerHTML = ""; paintEl.innerHTML = ""; return; }
    const v = current, raags = (v.raags || []).map((x) => RAAG.get(x)).filter(Boolean), arts = (v.artists || []).map((x) => ARTIST.get(x)).filter(Boolean);
    const r = raags[0];
    document.title = `♪ ${label(v)} · ${L === "bn" ? "রাগমালা" : "Raagmala"}`;
    el.innerHTML = `<div class="title"><div>
        <h1>${raags.map((x) => `<a href="#/raag/${enc(x.id)}">${esc(t("raag"))} ${esc(rMain(x))}</a>`).join(" · ") || esc(v.t)}
          ${r ? `<small>${esc([rOther(r), r.thaat && thaatLabel(r.thaat), ...(r.prahar || []).map((p) => praharLabel(p, true))].filter(Boolean).join(" · "))}</small>` : ""}</h1>
        <div class="artist">${arts.length ? arts.map((a) => `<a href="#/artist/${enc(a.id)}">${esc(aMain(a))}</a>${aOther(a) ? ` <span>${esc(aOther(a))}</span>` : ""}`).join(", ") : esc(v.ch)}${v.form && v.form !== "khayal" ? ` · ${esc(formLabel(v.form))}` : ""}</div>
        <p class="vt">${esc(v.t)} — ${esc(v.ch)} · ${t("views", { v: fmtViews(v.views) })} · ${fmtTime(v.sec)}</p>
        ${r && (r.moods || []).length ? `<div class="tags">${r.moods.map((m) => `<a class="chip sm" href="#/list/mood/${enc(m)}">${esc(moodLabel(m))}</a>`).join("")}</div>` : ""}
      </div></div>`;
    $("#jb-notes").innerHTML = r && r.aroha ? `<div class="nota">${mandala(r, "mand", true)}<div>
      <span class="lab">${t("f_aroha")}</span>${notaBoth(r.aroha)}
      <span class="lab" style="margin-top:8px">${t("f_avaroha")}</span>${notaBoth(r.avaroha)}
      <p class="hint" style="margin-top:8px">${t("swaraMap")}</p></div></div>` : "";
    paintEl.innerHTML = r && r.facts !== false ? `<a href="#/raag/${enc(r.id)}" aria-label="${esc(t("raag"))} ${esc(rMain(r))}">${paint(r)}</a>` : "";
  }

  const playing = () => !!(player && player.getPlayerState && player.getPlayerState() === 1);
  function updateButtons() {
    const on = !!current, n = pool().length, isPlaying = playing();
    $("#jb-skip").disabled = !on || !n; $("#jb-like").disabled = !on; $("#jb-never").disabled = !on;
    $("#jb-prev").disabled = !history.length;
    $("#jb-play").disabled = !on && !n;
    $("#jb-seek").disabled = !on;
    const liked = on && isLiked(current.id);
    $("#jb-like").setAttribute("aria-pressed", String(liked));
    $("#jb-like").innerHTML = liked ? I.heartF : I.heart;
    $("#jb-play").dataset.playing = String(isPlaying);
    $("#jb-play").setAttribute("aria-label", !on ? t("play") : isPlaying ? t("pause") : t("resume"));
    updateMini();
  }
  function updateMini() {
    const show = !!current && location.hash.indexOf("#/jukebox") !== 0;
    $("#mini").hidden = !show;
    document.body.classList.toggle("has-mini", show);
    if (!current) return;
    const r = RAAG.get((current.raags || [])[0]), isPlaying = playing();
    $("#mini-main").textContent = r ? `${t("raag")} ${rMain(r)}` : current.t;
    $("#mini-sub").textContent = `${artistsOf(current)} · ${current.t}`;
    $("#mini-thumb").src = thumb(current.id);
    $("#mini-title").setAttribute("aria-label", `${t("openJb")}: ${label(current)}`);
    const mp = $("#mini-play");
    mp.dataset.playing = String(isPlaying);
    $(".playi", mp).hidden = isPlaying; $(".pause", mp).hidden = !isPlaying;
    mp.setAttribute("aria-label", isPlaying ? t("miniPause") : t("miniPlay"));
    $("#mini-like").setAttribute("aria-pressed", String(isLiked(current.id)));
    $("#mini-like").innerHTML = isLiked(current.id) ? I.heartF : I.heart;
    $("#mini-prev").disabled = !history.length;
  }
  /* progress: the seek bar on Now Playing and the thin bar / timer of the mini player */
  function setProgress(c, d) {
    const pct = d ? Math.min(100, Math.max(0, c / d * 100)) : 0;
    if (!seeking) $("#jb-seek").value = String(Math.round(pct * 10));
    $("#jb-cur").textContent = fmtTime(c); $("#jb-dur").textContent = d ? fmtTime(d) : "–:––";
    $("#mini-bar").style.width = `${pct}%`; $("#mini-prog").style.width = `${pct}%`;
    $("#mini-cur").textContent = fmtTime(c); $("#mini-dur").textContent = d ? fmtTime(d) : "–:––";
  }
  function tick() { if (!current) return; setProgress(position(), duration()); }

  /* filters */
  function countWith(key, value) {
    const f = { ...F, [key]: ARR[key] ? [value] : value };
    return pool(f).length;
  }
  function pills(key, values, labelFn = (v) => v) {
    return `<div class="opts">${values.map((v) => `<label><input type="checkbox" name="${key}" value="${esc(v)}"${F[key].map(String).includes(String(v)) ? " checked" : ""}><span class="chip sm">${esc(labelFn(v))} <span class="n" data-count></span></span></label>`).join("")}</div>`;
  }
  function renderFilters() {
    $("#jb-filters").innerHTML = `
      <div class="grp"><h4>${t("lgTime")}</h4>
        <label class="toggle"><input type="checkbox" id="jb-now-f"${F.now ? " checked" : ""}> ${t("followClock")}</label>
        ${pills("prahars", Object.keys(META.prahars), (k) => praharLabel(k, true))}</div>
      <div class="grp"><h4>${t("lgForm")}</h4>${pills("forms", Object.keys(META.forms), formLabel)}</div>
      <div class="grp"><h4>${t("lgMood")}</h4>${pills("moods", Object.keys(META.moods), moodLabel)}</div>
      <div class="grp"><h4>${t("lgThaat")}</h4>${pills("thaats", Object.keys(META.thaats), thaatLabel)}</div>
      <div class="grp"><h4>${t("lgSeason")}</h4>${pills("seasons", Object.keys(META.seasons), seasonLabel)}</div>
      <div class="grp"><h4>${t("lgRAG")}</h4>
        <label class="flab" for="jb-raag-q">${t("raag")}</label>
        <input class="mini-search" type="search" id="jb-raag-q" autocomplete="off" placeholder="${esc(t("findRaag"))}" value="${esc(findQ.raag)}">
        <select class="sel" id="jb-raag" aria-label="${esc(t("raag"))}"></select>
        <label class="flab" for="jb-artist-q">${t("b_artists")}</label>
        <input class="mini-search" type="search" id="jb-artist-q" autocomplete="off" placeholder="${esc(t("findArtist"))}" value="${esc(findQ.artist)}">
        <select class="sel" id="jb-artist" aria-label="${esc(t("b_artists"))}"></select>
        <label class="flab" for="jb-gharana">${t("b_gharana")}</label><select class="sel" id="jb-gharana"></select>
        <label class="toggle"><input type="checkbox" id="jb-liked"${F.likedOnly ? " checked" : ""}> ${t("onlyLiked")}</label>
      </div>`;
    // Typing in a find box narrows its dropdown; a single match is chosen at once.
    for (const key of ["raag", "artist"]) {
      $(`#jb-${key}-q`).oninput = (e) => {
        findQ[key] = e.target.value;
        const ids = updateSelects();
        if (norm(findQ[key]) && ids[key].length === 1 && F[key] !== ids[key][0]) { F[key] = ids[key][0]; filtersChanged(); }
      };
    }
    $("#jb-filters").onchange = (e) => {
      const el = e.target;
      if (el.classList.contains("mini-search")) return;
      if (ARR[el.name]) F[el.name] = $$(`input[name="${el.name}"]:checked`, $("#jb-filters")).map((x) => el.name === "prahars" ? +x.value : x.value);
      else if (el.id === "jb-raag") F.raag = el.value;
      else if (el.id === "jb-artist") F.artist = el.value;
      else if (el.id === "jb-gharana") F.gharana = el.value;
      else if (el.id === "jb-liked") F.likedOnly = el.checked;
      else if (el.id === "jb-now-f") F.now = el.checked;
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
      inp.nextElementSibling.querySelector("[data-count]").textContent = num(n);
    });
    updateSelects();
    $("#jb-liked").checked = F.likedOnly;
    $("#jb-now-f").checked = F.now;
    renderFilterBar();
  }
  // Raag / artist / gharana dropdowns: only options that would play something, narrowed by the find boxes.
  // Returns the matching ids per dropdown.
  function updateSelects() {
    const out = {};
    const opts = (sel, key, items, anyLabel) => {
      const rows = items.map(([v, l]) => [v, l, countWith(key, v)]).filter(([v, , n]) => n || v === F[key]);
      out[key] = rows.map(([v]) => v);
      sel.innerHTML = `<option value="">${anyLabel}</option>` +
        rows.map(([v, l, n]) => `<option value="${esc(v)}"${v === F[key] ? " selected" : ""}>${esc(l)} (${num(n)})</option>`).join("");
    };
    const byName = (a, b) => a[1].localeCompare(b[1], L);
    const narrow = (items, key) => norm(findQ[key]) ? search(items, findQ[key]).concat(items.filter((x) => x.id === F[key])) : items;
    const raags = [...new Set(narrow(RAAGS.filter(hasRec), "raag"))];
    const arts = [...new Set(narrow(ARTISTS.filter((a) => (a.videos || []).length), "artist"))];
    opts($("#jb-raag"), "raag", raags.map((r) => [r.id, rBoth(r)]).sort(byName), t("anyRaag"));
    opts($("#jb-artist"), "artist", arts.map((a) => [a.id, aMain(a) + (aOther(a) ? ` · ${aOther(a)}` : "")]).sort(byName), t("anyArtist"));
    opts($("#jb-gharana"), "gharana", Object.keys(META.gharanas).map((g) => [g, gharanaLabel(g)]), t("anyGharana"));
    return out;
  }
  function renderFilterBar() {
    const n = pool().length;
    $("#jb-count").textContent = t("toPlay", { n });
    $("#sheet-count").textContent = t("toPlay", { n });
    const chips = [
      ...(F.now ? [["now", "", t("chipNow", { p: praharLabel(currentPrahar(), true) })]] : []),
      ...F.prahars.map((v) => ["prahars", v, praharLabel(v, true)]), ...F.forms.map((v) => ["forms", v, formLabel(v)]),
      ...F.moods.map((v) => ["moods", v, moodLabel(v)]), ...F.thaats.map((v) => ["thaats", v, thaatLabel(v)]),
      ...F.seasons.map((v) => ["seasons", v, seasonLabel(v)]),
      ...(F.raag ? [["raag", F.raag, t("chipRaag", { r: RAAG.get(F.raag) ? rMain(RAAG.get(F.raag)) : F.raag })]] : []),
      ...(F.artist ? [["artist", F.artist, ARTIST.get(F.artist) ? aMain(ARTIST.get(F.artist)) : F.artist]] : []),
      ...(F.gharana ? [["gharana", F.gharana, t("chipGharana", { g: gharanaShort(F.gharana) })]] : []),
      ...(F.likedOnly ? [["likedOnly", "", t("likedOnly")]] : []),
    ];
    $("#jb-active").innerHTML = chips.length
      ? chips.map(([k, v, l]) => `<button class="chip on" type="button" data-k="${k}" data-v="${esc(v)}" aria-label="${esc(t("removeFilter", { l }))}">${esc(l)}</button>`).join("") +
        `<button class="chip" type="button" id="jb-clear">${t("clearAll")}</button>`
      : `<span class="hint">${t("allPerf")}</span>`;
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
    savePrefs(); updateCounts(); buildQueue(); renderQueue();
    if (!current) showEmpty(); else updateButtons();
  }
  function clearFilters() { setFilters({}); }
  // Replace all filters with the given ones (unspecified ones are cleared).
  function setFilters(f) {
    Object.assign(F, freshFilters(), f);
    filtersChanged();
  }
  const countFor = (f) => pool({ ...freshFilters(), ...f }).length;

  // Likes or never-play changed anywhere: counts, buttons and the playlist follow.
  function prefsChanged() {
    if (VIDEOS.size) { updateCounts(); updateButtons(); renderQueue(); }
  }

  function togglePlay() { if (!current || !player) return next(); playing() ? player.pauseVideo() : player.playVideo(); }
  function likeCurrent() {
    if (!current) return;
    const on = !isLiked(current.id);
    toggle("likes", current.id, on); prefsChanged();
    toast(on ? t("toastLiked") : t("toastUnliked"));
  }
  /* the filter sheet */
  let sheetOpener = null;
  function toggleFilters(open) {
    const sh = $("#sheet");
    sh.classList.toggle("on", open); $("#sheet-bg").classList.toggle("on", open);
    sh.setAttribute("aria-hidden", String(!open));
    $("#jb-edit").setAttribute("aria-expanded", String(open));
    if (open) { sheetOpener = document.activeElement; setTimeout(() => { const f = $("#sheet input, #sheet button"); if (f) f.focus(); }, 60); }
    else if (sheetOpener && sheetOpener.focus) { sheetOpener.focus(); sheetOpener = null; }
  }

  // Re-draw everything that has words in it (after a language switch).
  function relabel() {
    renderFilters(); showNow(); showEmpty(); renderQueue(); updateButtons(); tick();
  }

  function init() {
    renderFilters(); showEmpty(); buildQueue(); renderQueue();
    $("#jb-play").onclick = togglePlay;
    $("#jb-empty-play").onclick = () => start();
    $("#jb-skip").onclick = next;
    $("#jb-prev").onclick = prev;
    $("#jb-like").onclick = likeCurrent;
    $("#jb-never").onclick = () => { if (!current) return; toggle("never", current.id, true); prefsChanged(); toast(t("toastNever")); next(); };
    $("#jb-empty-clear").onclick = clearFilters;
    $("#jb-edit").onclick = () => toggleFilters(!$("#sheet").classList.contains("on"));
    $("#sheet-close").onclick = () => toggleFilters(false);
    $("#sheet-done").onclick = () => toggleFilters(false);
    $("#sheet-bg").onclick = () => toggleFilters(false);
    $("#sheet-clear").onclick = clearFilters;
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && $("#sheet").classList.contains("on")) toggleFilters(false); });
    $("#mini-play").onclick = togglePlay;
    $("#mini-skip").onclick = next;
    $("#mini-prev").onclick = prev;
    $("#mini-like").onclick = likeCurrent;
    const seek = $("#jb-seek");
    seek.oninput = () => { seeking = true; $("#jb-cur").textContent = fmtTime(duration() * seek.value / 1000); };
    seek.onchange = () => { seeking = false; if (player && player.seekTo) player.seekTo(duration() * seek.value / 1000, true); tick(); };
    // "follow the clock": refresh the label and counts when the prahar changes
    setInterval(() => { if (F.now) updateCounts(); }, 5 * 60 * 1000);
    setInterval(() => { if (current) saveSession(); }, 15000);
    setInterval(tick, 1000);
    window.addEventListener("pagehide", saveSession);
    document.addEventListener("visibilitychange", () => { if (document.hidden) saveSession(); });
  }

  // YouTube Premium: the standard player (sees the YouTube sign-in) instead of the privacy-enhanced one.
  function setPremium(on, save = true) {
    if (!!prefs.ytFull === on) return;
    prefs.ytFull = on;
    if (save) savePrefs(); else { try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* ignore */ } }
    resetPlayer();
  }
  // Prefs changed from outside (account sync): redraw filters, lists and the playlist.
  function refresh() { renderFilters(); buildQueue(); renderQueue(); updateButtons(); }

  return { init, refresh, setPremium, playId, start, setFilters, countFor, prefsChanged, updateMini, relabel, saveSession, resume, preload: loadApi, label,
    current: () => current, pause: () => { try { player && player.pauseVideo(); } catch { /* not ready */ } } };
})();

function playFiltered(kind, value) {
  const f = kind === "now" ? { now: true } : kind === "mood" ? { moods: [value] } : kind === "season" ? { seasons: [value] }
    : kind === "raag" ? { raag: value } : kind === "artist" ? { artist: value } : kind === "gharana" ? { gharana: value } : {};
  jb.setFilters(f);
  location.hash = "#/jukebox";
  jb.start(true);
}

/* ---------------- static page text + language switch ---------------- */
function applyStaticText() {
  document.documentElement.lang = L;
  document.title = L === "bn" ? "রাগমালা · হিন্দুস্তানি কণ্ঠসংগীত" : "Raagmala · রাগমালা";
  $$("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $$("[data-i18n-html]").forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
  $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAria)); });
  $$("[data-i18n-title]").forEach((el) => { el.title = t(el.dataset.i18nTitle); });
  $$(".lang-switch").forEach((sw) => { sw.textContent = t("switchTo"); sw.setAttribute("aria-label", t("switchLabel")); sw.lang = L === "bn" ? "en" : "bn"; });
}
function setLang(l, save = true) {
  L = l;
  try { localStorage.setItem(LANG_KEY, L); } catch { /* storage unavailable */ }
  applyStaticText();
  if (VIDEOS.size) { jb.relabel(); route(); renderAccount(); }
  if (save) savePrefs(); // so the account (if signed in) keeps the language too
}
$$(".lang-switch").forEach((b) => b.onclick = () => setLang(L === "bn" ? "en" : "bn"));
applyStaticText();

/* ---------------- account (Google sign-in via sync.js) ---------------- */
function renderAccount() {
  const el = $("#account");
  if (!el) return;
  if (!SYNC.signIn) { el.hidden = true; return; }
  el.hidden = false;
  const u = SYNC.user;
  if (!u) {
    el.innerHTML = `<button class="pill signin" type="button" id="acct-in" aria-label="${esc(t("signIn"))}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg><span class="lbl-short">${t("signInShort")}</span><span class="lbl-long">${t("signIn")}</span></button>`;
    $("#acct-in").onclick = () => SYNC.signIn();
    return;
  }
  const initial = (u.name || u.email || "?").trim()[0].toUpperCase();
  el.innerHTML = `<details class="acct-menu"><summary class="acct-btn" aria-label="${esc(t("account"))}">
      ${u.photo ? `<img class="avatar" src="${esc(u.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="avatar">${esc(initial)}</span>`}</summary>
    <div class="acct-pop">
      <p><strong>${esc(u.name || "")}</strong><br><small class="hint">${esc(u.email || "")}</small></p>
      <p class="hint">${t("syncNote")}</p>
      <label class="toggle"><input type="checkbox" id="acct-premium"${prefs.ytFull ? " checked" : ""}> ${t("premiumMenu")}</label>
      <p class="hint">${t("premiumNote")}</p>
      ${SYNC.lastSync ? `<p class="hint">${t("syncedAt", { time: num(new Date(SYNC.lastSync).toLocaleTimeString(L === "bn" ? "bn-IN" : "en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })) })}</p>` : ""}
      <button class="btn ghost sm" type="button" id="acct-out">${t("signOut")}</button>
      <button class="btn danger sm" type="button" id="acct-del">${t("deleteData")}</button>
    </div></details>`;
  $("#acct-premium").onchange = (e) => jb.setPremium(e.target.checked);
  $("#acct-out").onclick = () => SYNC.signOut();
  $("#acct-del").onclick = () => { if (confirm(t("deleteConfirm"))) SYNC.deleteData(); };
  // the menu closes on an outside click
  const d = $("details", el);
  document.addEventListener("click", (e) => { if (d.open && !d.contains(e.target)) d.open = false; });
}
SYNC.userChanged = () => {
  renderAccount();
  if (location.hash.startsWith("#/mine")) renderMine();
  if (!SYNC.user) { if (prefs.ytFull) jb.setPremium(false, false); return; } // signed out: back to the privacy-enhanced player
  if (SYNC.initDone) askPremium(); // signing in during a visit; at page load the start-up sequence asks
};

// Asked once per account, right after the first Google sign-in (the answer can be changed in the account menu).
function askPremium() {
  if (!SYNC.user || prefs.premiumAsked) return Promise.resolve();
  const dlg = $("#ask");
  if (!dlg || typeof dlg.showModal !== "function" || dlg.open) return Promise.resolve();
  return new Promise((done) => {
    $("#ask-title").textContent = t("premiumAskTitle");
    $("#ask-text").textContent = t("premiumAskText");
    $("#ask-yes").textContent = t("premiumAskYes");
    $("#ask-no").textContent = t("premiumAskNo");
    const answer = (on) => {
      dlg.close();
      prefs.premiumAsked = true;
      if (on) jb.setPremium(true); else savePrefs();
      renderAccount();
      done();
    };
    $("#ask-yes").onclick = () => answer(true);
    $("#ask-no").onclick = () => answer(false);
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); answer(false); }, { once: true });
    dlg.showModal();
  });
}
SYNC.onError = (e) => {
  console.warn("Raagmala sync:", e);
  if (e && /popup-closed|cancelled-popup/.test(e.code || "")) return;
  toast(t("syncError", { msg: (e && (e.code || e.message)) || "" }));
};

/* ---------------- resume where you left off ---------------- */
function loadSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (!s || Date.now() - s.at > 30 * 864e5) return null; // older than 30 days: start fresh
    const page = s.route && s.route !== "#/" && s.route !== "#" ? s.route : "";
    return (s.vid && VIDEOS.has(s.vid)) || page ? s : null;
  } catch { return null; }
}
function pageName(hash) {
  const [kind, id] = hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  if (kind === "raag" && RAAG.get(id)) return `${t("raag")} ${rMain(RAAG.get(id))}`;
  if (kind === "artist" && ARTIST.get(id)) return aMain(ARTIST.get(id));
  if (kind === "jukebox") return t("navJukebox");
  if (kind === "mine") return t("navMine");
  if (kind === "browse" || kind === "list") return t("navBrowse");
  return "";
}
function askResume(s) {
  const dlg = $("#resume"), v = s.vid && VIDEOS.get(s.vid);
  if (!dlg || typeof dlg.showModal !== "function" || dlg.open) { holdSession = false; return; }
  if (v) jb.preload(); // so playback can start straight from the click on "Continue"
  $("#resume-title").textContent = t("resumeTitle");
  $("#resume-text").innerHTML = v
    ? t("resumePlaying", { what: `<strong>${esc(jb.label(v))}</strong>`, at: fmtTime(s.t || 0) })
    : t("resumePage", { what: `<strong>${esc(pageName(s.route) || s.route)}</strong>` });
  $("#resume-yes").textContent = t("resumeYes");
  $("#resume-no").textContent = t("resumeNo");
  $("#resume-yes").onclick = () => {
    dlg.close();
    holdSession = false;
    if (s.route && s.route !== location.hash) location.hash = s.route;
    jb.resume(s);
  };
  $("#resume-no").onclick = () => {
    dlg.close();
    holdSession = false;
    try { localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    jb.saveSession();
    if (location.hash !== "#/") location.hash = "#/";
  };
  dlg.addEventListener("cancel", () => $("#resume-no").onclick(), { once: true }); // Esc = No
  dlg.showModal();
}

/* ---------------- router ---------------- */
function route() {
  const parts = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  const page = parts[0] || "home";
  const isJb = page === "jukebox";
  const screen = { home: "home", raag: "raag", artist: "artist", browse: "browse", list: "browse", jukebox: "jukebox", mine: "mine" }[page] || "home";
  document.body.dataset.screen = screen;
  $("#jb-screen").classList.toggle("offstage", !isJb);
  $("#jb-screen").setAttribute("aria-hidden", String(!isJb));
  view.hidden = isJb;
  $$("[data-nav]").forEach((a) => a.removeAttribute("aria-current"));
  const nav = { home: "home", raag: "browse", artist: "browse", browse: "browse", list: "browse", jukebox: "jukebox", mine: "mine" }[page];
  $$(`[data-nav="${nav}"]`).forEach((a) => a.setAttribute("aria-current", "page"));
  jb.updateMini();
  lastPage = location.hash || "#/";
  jb.saveSession();
  window.scrollTo(0, 0);
  if (isJb) return;
  if (page === "raag") renderRaag(parts[1]);
  else if (page === "artist") renderArtist(parts[1]);
  else if (page === "mine") renderMine();
  else if (page === "browse") renderBrowse(parts[1]);
  else if (page === "list") renderList(parts[1], parts.slice(2).join("/"));
  else renderHome();
  view.style.animation = "none"; void view.offsetWidth; view.style.animation = "";
  if (page !== "home") view.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}
// The desktop search bar opens the Search page with the field focused.
$$("[data-focus-search]").forEach((a) => a.addEventListener("click", () => setTimeout(() => { const q = $("#q"); if (q) q.focus(); }, 50)));
// A "#/..." address never names an element, but start every visit at the top anyway.
addEventListener("load", () => setTimeout(() => window.scrollTo(0, 0), 0));

/* ---------------- data ---------------- */
function load() {
  view.innerHTML = `<div class="loading"><div class="seal" aria-hidden="true">রা</div><p>${t("loading")}</p></div>`;
  fetch("raagmala.json", { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((d) => {
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
    applySky(currentPrahar());
    // Follow the clock while the site stays open: new tint (and a fresh home hero) when the prahar changes.
    let shownPrahar = currentPrahar();
    setInterval(() => {
      const p = currentPrahar();
      if (p === shownPrahar) return;
      shownPrahar = p;
      applySky(p);
      if ((location.hash || "#/") === "#/") route();
    }, 60000);
    jb.init();
    const startHash = location.hash;
    window.addEventListener("hashchange", route);
    route();
    renderAccount();
    // Coming back to the home page: offer to continue where the last visit stopped (on any device, when signed in).
    // A shared link opens directly.
    SYNC.ready.then(askPremium).then(() => {
      SYNC.initDone = true;
      const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
      const reload = !!nav && nav.type === "reload";
      const home = !startHash || startHash === "#/" || startHash === "#";
      const session = loadSession();
      if (reload && session && session.vid) {
        // Page refresh: quietly restore the playlist and cue the performance where it was (same page via the URL).
        holdSession = false;
        jb.resume(session, false);
      } else if (!reload && home && session && (location.hash || "#/") === (startHash || "#/")) askResume(session);
      else holdSession = false;
    });
  }).catch((e) => {
    view.innerHTML = `<div class="empty"><div class="ic">❖</div><b>${t("loadError", { e: esc(e.message) })}</b><p><button class="btn sm" type="button" id="retry">${t("retry")}</button></p></div>`;
    $("#retry").onclick = load;
    console.error(e);
  });
}
load();
