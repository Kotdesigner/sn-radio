// ===================== CONFIG =====================
// Deine Daten aus dem Screenshot
const STREAM_CHECK_URL = "http://78.129.150.207:34451/index.html";
const RADIO_PAGE_URL = "http://stevenomek.radiostream321.com"; // Dein offizieller Link

const MIXCLOUD_PROFILE = "Steve_Nomek";
const CHECK_EVERY_MS = 30000;

// ===================== ELEMENTS =====================
const el = {
  pill: document.getElementById("statusPill"),
  statusText: document.getElementById("statusText"),
  lastCheck: document.getElementById("lastCheck"),
  radioState: document.getElementById("radioState"),
  radioStamp: document.getElementById("radioStamp"),
  playRadio: document.getElementById("playRadio"), // Wir nutzen diesen Button als Link
  mixFrame: document.getElementById("mixFrame")
};

// ===================== LOGIK =====================

// Prüft, ob der Shoutcast-Server antwortet
async function checkStreamStatus() {
  try {
    // Wir nutzen einen Proxy-Dienst, um die CORS-Sperre beim Check zu umgehen
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(STREAM_CHECK_URL)}`);
    const data = await response.json();
    // Wenn im HTML des Shoutcast-Panels "Stream is up" steht
    return data.contents.includes("Stream is up");
  } catch (e) {
    return false;
  }
}

async function refresh() {
  const isLive = await checkStreamStatus();
  
  if (isLive) {
    el.pill.className = "pill online";
    el.statusText.textContent = "LIVE • ON AIR";
    el.radioStamp.className = "stamp live";
    el.radioStamp.textContent = "NOW LIVE";
    el.radioState.textContent = "Bereit zum Hören";
    el.playRadio.textContent = "▶ ZUM RADIO-STREAM";
  } else {
    el.pill.className = "pill offline";
    el.statusText.textContent = "OFFLINE • NO AUDIO";
    el.radioStamp.className = "stamp offline";
    el.radioStamp.textContent = "OFFLINE";
    el.radioState.textContent = "Mixcloud aktiv";
    el.playRadio.textContent = "RADIOPAGE (OFFLINE)";
  }
  
  el.lastCheck.textContent = `Check: ${new Date().toLocaleTimeString()}`;
}

// Da der Browser den Stream blockiert, öffnen wir die offizielle Seite in einem neuen Tab
el.playRadio.onclick = () => {
  window.open(RADIO_PAGE_URL, '_blank');
};

// Mixcloud Initialisierung
function loadMix() {
  el.mixFrame.src = `https://www.mixcloud.com/widget/iframe/?feed=%2F${MIXCLOUD_PROFILE}%2F&hide_cover=1&mini=1&light=0`;
}

// Start
document.getElementById("year").textContent = new Date().getFullYear();
loadMix();
refresh();
setInterval(refresh, CHECK_EVERY_MS);