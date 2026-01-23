// ===================== CONFIG =====================
// Stream host/port (from your provider)
//const STREAM_HOST = "uk3freenew.listen2myradio.com";
//const STREAM_PORT = "34451";

// We probe these URLs to detect whether the stream is actually delivering audio.
const STREAM_URLS = [
  "https://stevenomek.radiostream321.com/",
  "http://stevenomek.radiostream321.com/",
];

];

// Mixcloud profile (fallback) + random sets list.
// For TRUE random sets from *your* uploads, paste your mix URLs into MIXCLOUD_MIXES.
// Example:
//   "https://www.mixcloud.com/Steve_Nomek/your-set-name/"
const MIXCLOUD_PROFILE = "Steve_Nomek";
const MIXCLOUD_MIXES = [
  // TODO: Paste your Mix URLs here for real random playback:
  // "https://www.mixcloud.com/Steve_Nomek/xxxx/",
];

const CHECK_EVERY_MS = 20000;
const PROBE_TIMEOUT_MS = 4500;

// ===================== ELEMENTS =====================
const el = {
  pill: document.getElementById("statusPill"),
  statusText: document.getElementById("statusText"),
  statusMeta: document.getElementById("statusMeta"),
  headline: document.getElementById("headline"),
  hint: document.getElementById("hint"),
  lastCheck: document.getElementById("lastCheck"),
  mode: document.getElementById("mode"),

  smartPlay: document.getElementById("smartPlay"),
  playLabel: document.getElementById("playLabel"),
  stopBtn: document.getElementById("stopBtn"),
  nextMix: document.getElementById("nextMix"),

  radioCard: document.getElementById("radioCard"),
  liveBadge: document.getElementById("liveBadge"),
  radio: document.getElementById("radio"),
  radioState: document.getElementById("radioState"),
  radioOverlay: document.getElementById("radioOverlay"),

  mixFrame: document.getElementById("mixFrame"),
  mixTitle: document.getElementById("mixTitle"),
};

// ===================== STATE =====================
let isLive = false;
let lastGoodStreamUrl = null;
let userStarted = false;
let currentMode = "auto";

function nowTime() {
  const d = new Date();
  return d.toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function setPill(state, text) {
  el.pill.classList.remove("online", "offline", "loading");
  el.pill.classList.add(state);
  el.statusText.textContent = text;
}
function setMeta(text){ el.statusMeta.textContent = text || ""; }
function setModeLabel(text){ el.mode.textContent = `Mode: ${text}`; }

function setRadioEnabled(enabled){
  el.radioOverlay.hidden = enabled;
  el.radio.disabled = !enabled;

  el.radioCard.classList.toggle("live", enabled);
  el.radioCard.classList.toggle("offline", !enabled);
  el.liveBadge.hidden = !enabled;
}

function stopRadio(){
  try { el.radio.pause(); } catch {}
}
function stopEverything(){
  stopRadio();
  el.stopBtn.disabled = true;
}

// ===================== MIXCLOUD =====================
function mixcloudWidgetSrcFromFeed(feedUrlOrProfile){
  let feedPath;
  if (feedUrlOrProfile.startsWith("http")) {
    const u = new URL(feedUrlOrProfile);
    feedPath = u.pathname; // e.g. /Steve_Nomek/my-set/
  } else {
    feedPath = `/${feedUrlOrProfile}/`;
  }
  const enc = encodeURIComponent(feedPath);
  return `https://www.mixcloud.com/widget/iframe/?feed=${enc}&hide_cover=1&mini=1&light=0&autoplay=1`;
}

function pickRandomMix(){
  if (Array.isArray(MIXCLOUD_MIXES) && MIXCLOUD_MIXES.length > 0) {
    const idx = Math.floor(Math.random() * MIXCLOUD_MIXES.length);
    return { type: "mix", value: MIXCLOUD_MIXES[idx] };
  }
  return { type: "profile", value: MIXCLOUD_PROFILE };
}

function loadRandomMix(){
  const pick = pickRandomMix();
  el.mixFrame.src = mixcloudWidgetSrcFromFeed(pick.value);
  el.mixTitle.textContent = pick.type === "mix" ? "Random Set" : "Profile (Fallback)";
}

// ===================== STREAM AUDIO PROBE =====================
// Detect "online" by testing if an <audio> element becomes playable from the stream URL.
// This avoids CORS/JSON and matches your requirement: check whether audio is sent.
function probeOneUrl(url){
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "auto";
    a.muted = true;
    a.src = url;

    let done = false;
    const finish = (ok, reason) => {
      if (done) return;
      done = true;
      cleanup();
      resolve({ ok, url, reason });
    };

    const timer = setTimeout(() => finish(false, "timeout"), PROBE_TIMEOUT_MS);

    const onCanPlay = () => finish(true, "canplay");
    const onLoadedMeta = () => finish(true, "loadedmetadata");
    const onError = () => finish(false, "error");
    const onStalled = () => finish(false, "stalled");

    function cleanup(){
      clearTimeout(timer);
      a.removeEventListener("canplay", onCanPlay);
      a.removeEventListener("loadedmetadata", onLoadedMeta);
      a.removeEventListener("error", onError);
      a.removeEventListener("stalled", onStalled);
      try { a.src = ""; } catch {}
    }

    a.addEventListener("canplay", onCanPlay, { once:true });
    a.addEventListener("loadedmetadata", onLoadedMeta, { once:true });
    a.addEventListener("error", onError, { once:true });
    a.addEventListener("stalled", onStalled, { once:true });

    try { a.load(); } catch {}
  });
}

async function probeStream(){
  const urls = lastGoodStreamUrl
    ? [lastGoodStreamUrl, ...STREAM_URLS.filter(u => u !== lastGoodStreamUrl)]
    : STREAM_URLS.slice();

  for (const url of urls) {
    const res = await probeOneUrl(url);
    if (res.ok) return res;
  }
  return { ok:false, url:null, reason:"all_failed" };
}

function setRadioSource(url){
  if (!url) return;
  el.radio.src = url;
  try { el.radio.load(); } catch {}
}

// ===================== APPLY STATE =====================
function applyLiveState(live){
  isLive = live;

  if (live) {
    setPill("online", "LIVE • AUDIO OK");
    setMeta("Webradio aktiv");
    el.headline.textContent = "Du bist live.";
    el.hint.textContent = "Webradio ist aktiv. Wenn der Stream stoppt, schaltet es auf Mixcloud Random Set.";
    el.playLabel.textContent = "PLAY LIVE";
    setRadioEnabled(true);
    el.nextMix.disabled = true;
  } else {
    setPill("offline", "OFFLINE • NO AUDIO");
    setMeta("Mixcloud übernimmt");
    el.headline.textContent = "Offline Mode.";
    el.hint.textContent = "Kein Audio vom Stream. Mixcloud Random Set übernimmt.";
    el.playLabel.textContent = "PLAY MIX";
    setRadioEnabled(false);
    el.nextMix.disabled = false;
    if (!el.mixFrame.src) loadRandomMix();
  }

  el.lastCheck.textContent = `Letzter Check: ${nowTime()}`;
}

// ===================== LOOP =====================
async function refresh(){
  setPill("loading", "Prüfe Stream-Audio…");
  setMeta("");

  const res = await probeStream();

  if (res.ok) {
    lastGoodStreamUrl = res.url;
    setRadioSource(lastGoodStreamUrl);
    applyLiveState(true);
  } else {
    applyLiveState(false);
  }
}

// ===================== USER ACTIONS =====================
el.smartPlay.addEventListener("click", async () => {
  userStarted = true;

  if (isLive) {
    currentMode = "radio";
    setModeLabel("radio");
    el.radioState.textContent = "Verbinde…";
    try {
      await el.radio.play();
      el.radioState.textContent = "Spielt.";
      el.stopBtn.disabled = false;
    } catch {
      el.radioState.textContent = "Start blockiert (Browser).";
      currentMode = "mixcloud";
      setModeLabel("mixcloud (fallback)");
      loadRandomMix();
    }
  } else {
    currentMode = "mixcloud";
    setModeLabel("mixcloud");
    loadRandomMix();
    el.stopBtn.disabled = false;
  }
});

el.stopBtn.addEventListener("click", () => {
  stopEverything();
});

el.nextMix.addEventListener("click", () => {
  loadRandomMix();
  currentMode = "mixcloud";
  setModeLabel("mixcloud • random");
});

el.radio.addEventListener("playing", () => {
  el.stopBtn.disabled = false;
  el.radioState.textContent = "Spielt.";
});
el.radio.addEventListener("pause", () => {
  el.radioState.textContent = "Pausiert.";
});

// ===================== INIT =====================
document.getElementById("year").textContent = new Date().getFullYear();
loadRandomMix();
refresh();
setInterval(refresh, CHECK_EVERY_MS);