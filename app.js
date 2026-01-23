// ===================== CONFIG =====================
const STREAM_URLS = [
  "https://stevenomek.radiostream321.com/",
  "http://stevenomek.radiostream321.com/",
  "https://stevenomek.radio12345.com/",
  "http://stevenomek.radio12345.com/",
  "https://stevenomek.radiostream123.com/",
  "http://stevenomek.radiostream123.com/",
];

const MIXCLOUD_PROFILE = "Steve_Nomek";
const MIXCLOUD_MIXES = [
  // "https://www.mixcloud.com/Steve_Nomek/dein-set-1/",
  // "https://www.mixcloud.com/Steve_Nomek/dein-set-2/",
];

const CHECK_EVERY_MS = 20000;
const PROBE_TIMEOUT_MS = 6500;

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

function nowTime() {
  const d = new Date();
  return d.toLocaleString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function setPill(state, text) {
  el.pill.classList.remove("online", "offline", "loading");
  el.pill.classList.add(state);
  el.statusText.textContent = text;
}

function setMeta(text) {
  el.statusMeta.textContent = text || "";
}

function setStampLive() {
  el.radioStamp.textContent = "NOW LIVE";
  el.radioStamp.classList.remove("offline");
  el.radioStamp.classList.add("live");
}

function setStampOffline() {
  el.radioStamp.textContent = "OFFLINE";
  el.radioStamp.classList.remove("live");
  el.radioStamp.classList.add("offline");
}

function stopRadio() {
  try { el.radio.pause(); } catch {}
}

function mixcloudWidgetSrcFromFeed(feedUrlOrProfile) {
  let feedPath;
  if (feedUrlOrProfile.startsWith("http")) {
    const u = new URL(feedUrlOrProfile);
    feedPath = u.pathname;
  } else {
    feedPath = `/${feedUrlOrProfile}/`;
  }
  const enc = encodeURIComponent(feedPath);
  return `https://www.mixcloud.com/widget/iframe/?feed=${enc}&hide_cover=1&mini=1&light=0&autoplay=1`;
}

function pickRandomMix() {
  if (Array.isArray(MIXCLOUD_MIXES) && MIXCLOUD_MIXES.length > 0) {
    const idx = Math.floor(Math.random() * MIXCLOUD_MIXES.length);
    return { type: "mix", value: MIXCLOUD_MIXES[idx] };
  }
  return { type: "profile", value: MIXCLOUD_PROFILE };
}

function loadRandomMix() {
  const pick = pickRandomMix();
  el.mixFrame.src = mixcloudWidgetSrcFromFeed(pick.value);
  el.mixTitle.textContent = pick.type === "mix" ? "Random Set" : "Profile (Fallback)";
}

function probeOneUrl(url) {
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

    function cleanup() {
      clearTimeout(timer);
      a.removeEventListener("canplay", onCanPlay);
      a.removeEventListener("loadedmetadata", onLoadedMeta);
      a.removeEventListener("error", onError);
      a.removeEventListener("stalled", onStalled);
      try { a.src = ""; } catch {}
    }

    a.addEventListener("canplay", onCanPlay, { once: true });
    a.addEventListener("loadedmetadata", onLoadedMeta, { once: true });
    a.addEventListener("error", onError, { once: true });
    a.addEventListener("stalled", onStalled, { once: true });

    try { a.load(); } catch {}
  });
}

async function probeStream() {
  const urls = lastGoodStreamUrl
    ? [lastGoodStreamUrl, ...STREAM_URLS.filter(u => u !== lastGoodStreamUrl)]
    : STREAM_URLS.slice();

  for (const url of urls) {
    const res = await probeOneUrl(url);
    if (res.ok) return res;
  }
  return { ok: false, url: null, reason: "all_failed" };
}

function setRadioSource(url) {
  if (!url) return;
  el.radio.src = url;
  try { el.radio.load(); } catch {}
}

function applyLiveState(live) {
  isLive = live;

  if (live) {
    setPill("online", "LIVE • AUDIO OK");
    setMeta(lastGoodStreamUrl ? `Quelle: ${lastGoodStreamUrl}` : "Webradio verfügbar");
    setStampLive();
  } else {
    setPill("offline", "OFFLINE • NO AUDIO");
    setMeta("Stream liefert kein Audio (du kannst trotzdem klicken)");
    setStampOffline();
  }

  el.lastCheck.textContent = `Letzter Check: ${nowTime()}`;
  el.mode.textContent = "Mode: dual";
}

async function refresh() {
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

el.playRadio.addEventListener("click", async () => {
  el.radioState.textContent = "Verbinde…";
  try {
    if (!lastGoodStreamUrl) await refresh();
    await el.radio.play();
    el.radioState.textContent = "Spielt.";
    el.stopRadio.disabled = false;
  } catch (e) {
    console.log("[PLAY RADIO] blocked/error:", e);
    el.radioState.textContent = "Start blockiert / Stream nicht erreichbar.";
  }
});

el.stopRadio.addEventListener("click", () => {
  stopRadio();
  el.stopRadio.disabled = true;
});

el.radio.addEventListener("playing", () => {
  el.stopRadio.disabled = false;
  el.radioState.textContent = "Spielt.";
});

el.radio.addEventListener("pause", () => {
  el.radioState.textContent = "Pausiert.";
});

el.nextMix.addEventListener("click", () => {
  loadRandomMix();
});

document.getElementById("year").textContent = new Date().getFullYear();
loadRandomMix();
refresh();
setInterval(refresh, CHECK_EVERY_MS);
