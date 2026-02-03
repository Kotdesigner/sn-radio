// ===================== CONFIG =====================
const RADIO_PAGE_URL = "https://stevenomek.radiostream321.com/";
// Check-URL nutzt einen Proxy, um die Status-Seite deines Shoutcast-Servers auszulesen
const CHECK_URL = "https://api.allorigins.win/get?url=" + encodeURIComponent("http://78.129.150.207:34451/index.html");

const el = {
  pill: document.getElementById("statusPill"),
  statusText: document.getElementById("statusText"),
  lastCheck: document.getElementById("lastCheck"),
  radioState: document.getElementById("radioState"),
  radioStamp: document.getElementById("radioStamp"),
  playRadio: document.getElementById("playRadio"),
  mixFrame: document.getElementById("mixFrame"),
  nextMix: document.getElementById("nextMix")
};

// ===================== LOGIK =====================

async function checkStatus() {
  try {
    const response = await fetch(CHECK_URL);
    const data = await response.json();
    // Wir suchen im Text der Statusseite nach "Stream is up"
    const isLive = data.contents.includes("Stream is up");
    updateUI(isLive);
  } catch (e) {
    updateUI(false);
  }
}

function updateUI(isLive) {
  el.pill.className = `pill ${isLive ? 'online' : 'offline'}`;
  el.statusText.textContent = isLive ? "LIVE • ON AIR" : "OFFLINE";
  el.radioStamp.className = `stamp ${isLive ? 'live' : 'offline'}`;
  el.radioStamp.textContent = isLive ? "NOW LIVE" : "OFFLINE";
  el.radioState.textContent = isLive ? "Sendezeit aktiv" : "Hör in meine Mixes rein";
  el.lastCheck.textContent = `Check: ${new Date().toLocaleTimeString()}`;
}

// POPUP LOGIK
el.playRadio.onclick = () => {
  const width = 450;
  const height = 650;
  const left = (screen.width / 2) - (width / 2);
  const top = (screen.height / 2) - (height / 2);
  
  window.open(
    RADIO_PAGE_URL, 
    "SteveNomekPlayer", 
    `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
  );
  
  el.radioState.textContent = "Player wird geladen...";
};

// Mixcloud
function loadMix() {
  el.mixFrame.src = "https://www.mixcloud.com/widget/iframe/?feed=%2FSteve_Nomek%2F&hide_cover=1&mini=1&light=0";
}

el.nextMix.onclick = loadMix;
document.getElementById("year").textContent = new Date().getFullYear();
loadMix();
checkStatus();
setInterval(checkStatus, 60000);