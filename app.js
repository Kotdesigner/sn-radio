// ===================== CONFIG =====================
const STREAM_URLS = [
  "https://uk3freenew.listen2myradio.com/live.mp3?typeportmount=s1_34451_stream_353288829",
  "https://stevenomek.radiostream321.com/",
  "http://stevenomek.radiostream321.com/"
];

const MIXCLOUD_PROFILE = "Steve_Nomek";
const MIXCLOUD_MIXES = []; 

const CHECK_EVERY_MS = 20000;
const PROBE_TIMEOUT_MS = 6500;

// ===================== ELEMENTS =====================
const el = {
  pill: document.getElementById("statusPill"),
  statusText: document.getElementById("statusText"),
  statusMeta: document.getElementById("statusMeta"),
  lastCheck: document.getElementById("lastCheck"),
  mode: document.getElementById("mode"),
  playRadio: document.getElementById("playRadio"),
  stopRadio: document.getElementById("stopRadio"),
  nextMix: document.getElementById("nextMix"),
  radio: document.getElementById("radio"),
  radioState: document.getElementById("radioState"),
  radioStamp: document.getElementById("radioStamp"),
  mixFrame: document.getElementById("mixFrame"),
  mixTitle: document.getElementById("mixTitle"),
};

let isLive = false;
let lastGoodStreamUrl = null;

// ===================== HELPERS =====================
function nowTime() {
  return new Date().toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function setPill(state, text) {
  el.pill.className = `pill ${state}`;
  el.statusText.textContent = text;
}

function applyLiveState(live) {
  isLive = live;
  if (live) {
    setPill("online", "LIVE • AUDIO OK");
    el.statusMeta.textContent = "Webradio verfügbar";
    el.radioStamp.textContent = "NOW LIVE";
    el.radioStamp.className = "stamp live";
  } else {
    setPill("offline", "OFFLINE • NO AUDIO");
    el.statusMeta.textContent = "Stream offline - Mixcloud übernimmt";
    el.radioStamp.textContent = "OFFLINE";
    el.radioStamp.className = "stamp offline";
  }
  el.lastCheck.textContent = `Letzter Check: ${nowTime()}`;
}

// ===================== AUDIO PROBE & RECONNECT =====================
async function probeOneUrl(url) {
  return new Promise((resolve) => {
    const a = new Audio();
    a.muted = true;
    a.src = url;
    
    let timer = setTimeout(() => { cleanup(); resolve({ ok: false }); }, PROBE_TIMEOUT_MS);
    
    const onDone = (ok) => {
      clearTimeout(timer);
      cleanup();
      resolve({ ok, url });
    };

    function cleanup() {
      a.removeEventListener("canplay", () => onDone(true));
      a.removeEventListener("error", () => onDone(false));
      a.src = "";
    }

    a.addEventListener("canplay", () => onDone(true), { once: true });
    a.addEventListener("error", () => onDone(false), { once: true });
  });
}

async function refresh() {
  setPill("loading", "Prüfe Stream...");
  for (const url of STREAM_URLS) {
    const res = await probeOneUrl(url);
    if (res.ok) {
      lastGoodStreamUrl = res.url;
      if (el.radio.paused) el.radio.src = res.url; 
      applyLiveState(true);
      return;
    }
  }
  applyLiveState(false);
}

function attemptReconnect() {
  if (!el.radio.paused && isLive) {
    console.log("Stream hakt. Versuche Reconnect...");
    el.radioState.textContent = "Reconnect...";
    const currentUrl = lastGoodStreamUrl || STREAM_URLS[0];
    el.radio.src = currentUrl + (currentUrl.includes('?') ? '&' : '?') + "cb=" + Date.now();
    el.radio.load();
    el.radio.play().catch(e => console.log("Replay failed", e));
  }
}

// ===================== MIXCLOUD =====================
function loadRandomMix() {
  const pick = MIXCLOUD_MIXES.length > 0 
    ? MIXCLOUD_MIXES[Math.floor(Math.random() * MIXCLOUD_MIXES.length)] 
    : `/${MIXCLOUD_PROFILE}/`;
  
  const enc = encodeURIComponent(pick.startsWith("http") ? new URL(pick).pathname : pick);
  el.mixFrame.src = `https://www.mixcloud.com/widget/iframe/?feed=${enc}&hide_cover=1&mini=1&light=0&autoplay=1`;
}

// ===================== EVENTS =====================
el.playRadio.addEventListener("click", async () => {
  el.radioState.textContent = "Verbinde...";
  try {
    if (!el.radio.src || el.radio.src === window.location.href) {
        el.radio.src = lastGoodStreamUrl || STREAM_URLS[0];
    }
    await el.radio.play();
  } catch (e) {
    el.radioState.textContent = "Start blockiert.";
  }
});

el.stopRadio.addEventListener("click", () => {
  el.radio.pause();
  el.radio.src = ""; 
  el.stopRadio.disabled = true;
  el.radioState.textContent = "Gestoppt.";
});

el.radio.addEventListener("playing", () => { 
    el.stopRadio.disabled = false; 
    el.radioState.textContent = "Spielt.";
});

el.radio.addEventListener("stalled", attemptReconnect);
el.radio.addEventListener("error", attemptReconnect);
el.nextMix.addEventListener("click", loadRandomMix);

// Init
document.getElementById("year").textContent = new Date().getFullYear();
loadRandomMix();
refresh();
setInterval(refresh, CHECK_EVERY_MS);