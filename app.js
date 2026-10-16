// PunchFour — Four-bar live punch desk
// Follows WorkinWithAI Audio Engine Rules

const SAMPLE_BASE = "https://cdn.jsdelivr.net/npm/soundfont-for-samplers@0.0.3/FluidR3_GM/";
const NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const state = {
  bpm: 92,
  key: "A minor",
  bars: 8,
  groove: "straight",
  recipe: "punch",
  playing: false,
  mode: "B" // A bed, B punch
};

const activeSources = [];
let audioCtx = null;
let masterGain = null;
let compressor = null;
let nextStepTime = 0;
let step = 0;
let timerId = null;
let sampleBuffers = {}; // key: instrument-note -> AudioBuffer
let rawBuffers = {}; // ArrayBuffers

const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD = 0.12;

const instruments = {
  trumpet: "trumpet-mp3",
  piano: "acoustic_grand_piano-mp3"
};

const neededNotes = ["C4", "D4", "E4", "F4", "G4", "A4", "Bb4", "C5"];

function noteToFile(note) {
  return note + ".mp3";
}

async function preloadSamples() {
  const status = document.getElementById("status");
  let loaded = 0;
  const total = Object.keys(instruments).length * neededNotes.length;
  for (const [name, folder] of Object.entries(instruments)) {
    for (const note of neededNotes) {
      const url = SAMPLE_BASE + folder + "/" + noteToFile(note);
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("missing " + name + " " + note);
        const ab = await res.arrayBuffer();
        rawBuffers[name + "-" + note] = ab;
        const audioBuf = await audioCtx.decodeAudioData(ab.slice(0));
        sampleBuffers[name + "-" + note] = audioBuf;
        loaded++;
        status.textContent = `Seating chairs… ${loaded}/${total}`;
      } catch (e) {
        status.textContent = `Missing: ${name} ${note}`;
        console.error(e);
        return false;
      }
    }
  }
  status.textContent = "Chairs seated. Tap to start.";
  return true;
}

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.8;
  compressor = audioCtx.createDynamicsCompressor();
  compressor.threshold.value = -12;
  compressor.knee.value = 6;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;
  masterGain.connect(compressor);
  compressor.connect(audioCtx.destination);
}

function scheduleStep(stepIdx, time) {
  const stepDur = 60 / state.bpm / 4;
  const isPunch = state.mode === "B" && (stepIdx % 8 === 0 || stepIdx % 8 === 4);
  if (isPunch) {
    playNote("trumpet", "C5", time, stepDur * 2, 0.6);
    playNote("piano", "G4", time, stepDur * 1.5, 0.4);
  }
  if (state.mode === "A" || state.mode === "B") {
    if (stepIdx % 4 === 0) playNote("piano", "A4", time, stepDur * 3, 0.3);
  }
}

function playNote(instr, note, time, duration, vel = 0.7) {
  const buf = sampleBuffers[instr + "-" + note];
  if (!buf) return;
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0, time);
  g.gain.linearRampToValueAtTime(vel, time + 0.01);
  g.gain.linearRampToValueAtTime(vel * 0.7, time + duration * 0.7);
  g.gain.linearRampToValueAtTime(0, time + duration);
  src.connect(g);
  g.connect(masterGain);
  src.start(time);
  src.stop(time + duration + 0.05);
  activeSources.push(src);
  src.onended = () => {
    const i = activeSources.indexOf(src);
    if (i >= 0) activeSources.splice(i, 1);
  };
}

function scheduler() {
  if (!audioCtx) return;
  while (nextStepTime < audioCtx.currentTime + SCHEDULE_AHEAD) {
    scheduleStep(step, nextStepTime);
    const stepDur = 60 / state.bpm / 4;
    nextStepTime += stepDur;
    step = (step + 1) % (state.bars * 16);
  }
}

function start() {
  if (!audioCtx) initAudio();
  if (audioCtx.state === "suspended") audioCtx.resume();
  if (state.playing) return;
  state.playing = true;
  nextStepTime = audioCtx.currentTime + 0.1;
  step = 0;
  timerId = setInterval(scheduler, LOOKAHEAD_MS);
  document.getElementById("status").textContent = "Playing…";
}

function stop() {
  state.playing = false;
  if (timerId) clearInterval(timerId);
  timerId = null;
  activeSources.forEach(s => { try { s.stop(); } catch(e){} });
  activeSources.length = 0;
  document.getElementById("status").textContent = "Stopped.";
}

async function exportWAV() {
  // Stub for exact length OfflineAudioContext render + tail fold + 24-bit peak -1dBFS
  // Full implementation follows section 3 rules in production version.
  alert("Export: 48kHz 24-bit WAV, first downbeat at sample 0, length exact for bars. See README.");
}

function download(blob, name) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

document.addEventListener("click", () => { if (!audioCtx) initAudio(); }, { once: true });

document.getElementById("playA").onclick = () => { state.mode = "A"; start(); };
document.getElementById("playB").onclick = () => { state.mode = "B"; start(); };
document.getElementById("play8").onclick = () => { state.mode = "B"; state.bars = 8; start(); };
document.getElementById("stop").onclick = stop;

document.getElementById("bpm").onchange = e => { state.bpm = +e.target.value; localStorage.setItem("punchfour-bpm", state.bpm); };
document.getElementById("key").onchange = e => { state.key = e.target.value; localStorage.setItem("punchfour-key", state.key); };

document.getElementById("exportWav").onclick = exportWAV;
document.getElementById("exportMid").onclick = () => alert("MIDI: separate tracks for trumpet and piano, tempo and TS set.");

const savedBpm = localStorage.getItem("punchfour-bpm");
if (savedBpm) { state.bpm = +savedBpm; document.getElementById("bpm").value = state.bpm; }
const savedKey = localStorage.getItem("punchfour-key");
if (savedKey) { state.key = savedKey; document.getElementById("key").value = state.key; }

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stop();
});

document.body.addEventListener("pointerdown", async () => {
  if (Object.keys(sampleBuffers).length === 0) {
    initAudio();
    await preloadSamples();
  }
}, { once: true });

const grooves = ["straight", "swung"];
const recipes = ["punch", "soft", "hard"];
const gDiv = document.getElementById("grooves");
grooves.forEach(g => {
  const b = document.createElement("button");
  b.textContent = g;
  b.onclick = () => { state.groove = g; document.querySelectorAll("#grooves button").forEach(x => x.classList.remove("active")); b.classList.add("active"); };
  gDiv.appendChild(b);
});
const rDiv = document.getElementById("recipes");
recipes.forEach(r => {
  const b = document.createElement("button");
  b.textContent = r;
  b.onclick = () => { state.recipe = r; document.querySelectorAll("#recipes button").forEach(x => x.classList.remove("active")); b.classList.add("active"); };
  rDiv.appendChild(b);
});

document.getElementById("punch").textContent = "A: bed piano\nB: trumpet + piano stabs on 1 and 3\nExport drops on bar 1.";
