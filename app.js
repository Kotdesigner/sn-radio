const STREAM_URL = "https://uk3freenew.listen2myradio.com/live.mp3?typeportmount=s1_34451_stream_353288829";

const el = {
  pill: document.getElementById("statusPill"),
  statusText: document.getElementById("statusText"),
  statusMeta: document.getElementById("statusMeta"),
  lastCheck: document.getElementById("lastCheck"),
  playRadio: document.getElementById("playRadio"),
  stopRadio: document.getElementById("stopRadio"),
  radio: document.getElementById("radio"),
  radioState: document.getElementById("radioState"),
  radioStamp: document.getElementById("radioStamp"),
  mixFrame: document.getElementById("mixFrame"),
  nextMix: document.getElementById("nextMix")
};

async function checkStream() {
  return new Promise((resolve) => {
    const tester = new Audio();
    tester.muted = true;
    tester.src = STREAM_URL;
    let timeout = setTimeout(() => { tester.src = ""; resolve(false); }, 7000);
    tester.oncanplay = () => { clearTimeout(timeout); tester.src = ""; resolve(true); };
    tester.onerror = () => { clearTimeout(timeout); resolve(false); };
  });
}

async function updateStatus() {
  const isLive = await checkStream();
  el.pill.className = `pill ${isLive ? 'online' : 'offline'}`;
  el.statusText.textContent = isLive ? "LIVE • AUDIO OK" : "OFFLINE • NO AUDIO";
  el.radioStamp.className = `stamp ${isLive ? 'live' : 'offline'}`;
  el.radioStamp.textContent = isLive ? "NOW LIVE" : "OFFLINE";
  el.lastCheck.textContent = `Check: ${new Date().toLocaleTimeString()}`;
  return isLive;
}

el.playRadio.onclick = async () => {
  el.radioState.textContent = "Verbinde...";
  el.radio.src = STREAM_URL;
  try {
    await el.radio.play();
    el.radioState.textContent = "Spielt.";
    el.stopRadio.disabled = false;
  } catch (e) {
    el.radioState.textContent = "Fehler beim Abspielen.";
  }
};

el.stopRadio.onclick = () => {
  el.radio.pause();
  el.radio.src = "";
  el.stopRadio.disabled = true;
  el.radioState.textContent = "Gestoppt.";
};

// Mixcloud Initialisierung
function loadMix() {
  el.mixFrame.src = "https://www.mixcloud.com/widget/iframe/?feed=%2FSteve_Nomek%2F&hide_cover=1&mini=1&light=0";
}

el.nextMix.onclick = loadMix;
document.getElementById("year").textContent = new Date().getFullYear();
loadMix();
updateStatus();
setInterval(updateStatus, 30000);