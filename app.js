
const STREAM_URL = "https://uk3freenew.listen2myradio.com/live.mp3?typeportmount=s1_34451_stream_353288829";
const MIXCLOUD_PROFILE = "Steve_Nomek";

const radio = document.getElementById("radio");
const stamp = document.getElementById("radioStamp");
const mix = document.getElementById("mixcloud");

radio.src = STREAM_URL;
mix.src = `https://www.mixcloud.com/widget/iframe/?feed=/${MIXCLOUD_PROFILE}/&hide_cover=1&mini=1&light=0`;

radio.addEventListener("playing", () => {
  stamp.textContent = "NOW LIVE";
  stamp.classList.remove("offline");
  stamp.classList.add("live");
});

radio.addEventListener("error", () => {
  stamp.textContent = "OFFLINE";
  stamp.classList.remove("live");
  stamp.classList.add("offline");
});

document.getElementById("playRadio").onclick = () => {
  radio.play().catch(()=>{});
};
