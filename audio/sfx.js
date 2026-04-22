/* ===== EFFETTI SONORI ===== */
var audioCtx = null;
var settingsState = { sfxVol: 1.0, musicVol: 1.0 };

function loadSettings() { try { var s = JSON.parse(localStorage.getItem("snake_settings")); if (s) { settingsState.sfxVol = s.sfxVol !== undefined ? s.sfxVol : 1.0; settingsState.musicVol = s.musicVol !== undefined ? s.musicVol : 1.0; } } catch(e) {} }
loadSettings();

function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); }

function tn(f, d, t, v) { if (!audioCtx) return; t = t || "square"; v = (v || 0.12) * settingsState.sfxVol; var o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = t; o.frequency.setValueAtTime(f, audioCtx.currentTime); g.gain.setValueAtTime(v, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + d); o.connect(g); g.connect(audioCtx.destination); o.start(); o.stop(audioCtx.currentTime + d); }

function sEat() { tn(1200, 0.05, "sine", 0.15); setTimeout(function () { tn(600, 0.08, "sine", 0.12); }, 40); }
function sTurn() { tn(220, 0.03, "triangle", 0.03); }
function sHit() { tn(300, 0.08, "square", 0.2); setTimeout(function () { tn(150, 0.15, "sawtooth", 0.15); }, 50); setTimeout(function () { tn(80, 0.3, "sine", 0.1); }, 120); }
function sLvl() { tn(523, 0.1, "square", 0.12); setTimeout(function () { tn(659, 0.1, "square", 0.12); }, 90); setTimeout(function () { tn(784, 0.18, "square", 0.16); }, 180); }
function sDie() { tn(400, 0.2, "sawtooth", 0.18); setTimeout(function () { tn(280, 0.2, "sawtooth", 0.18); }, 180); setTimeout(function () { tn(120, 0.5, "sawtooth", 0.15); }, 360); }
function sCD() { tn(440, 0.08, "sine", 0.12); }
function sGo() { tn(880, 0.18, "sine", 0.16); }
function sNokia() { tn(330, 0.12, "square", 0.14); setTimeout(function () { tn(440, 0.15, "square", 0.14); }, 80); }
function sHulk() { tn(90, 0.25, "sawtooth", 0.18); }
function sSonic() { tn(1200, 0.06, "sine", 0.12); setTimeout(function () { tn(1600, 0.08, "sine", 0.12); }, 40); }
function sBoom() { tn(80, 0.3, "sawtooth", 0.18); tn(60, 0.4, "sine", 0.12); }
function sFrag() { tn(500, 0.05, "triangle", 0.07); }
function sKunai() { tn(2000, 0.06, "sine", 0.12); setTimeout(function () { tn(3000, 0.08, "sine", 0.1); }, 30); }
function sLink() { tn(440, 0.1, "triangle", 0.1); tn(660, 0.1, "triangle", 0.1); }
function sTrap() { tn(800, 0.04, "square", 0.1); }
function sBossHit() { tn(600, 0.15, "sine", 0.18); setTimeout(function () { tn(800, 0.1, "sine", 0.15); }, 60); setTimeout(function () { tn(1000, 0.2, "sine", 0.12); }, 120); }
function sBossDmgPlayer() { tn(200, 0.12, "sawtooth", 0.2); setTimeout(function () { tn(350, 0.15, "square", 0.16); }, 40); setTimeout(function () { tn(150, 0.25, "sine", 0.12); }, 100); }
function sBossDeath() { tn(523, 0.15, "square", 0.15); setTimeout(function () { tn(659, 0.15, "square", 0.15); }, 120); setTimeout(function () { tn(784, 0.15, "square", 0.15); }, 240); setTimeout(function () { tn(1047, 0.4, "square", 0.2); }, 360); }

function saveSettings() { localStorage.setItem("snake_settings", JSON.stringify(settingsState)); }
function applySettings() {
    if (musicGainNode) musicGainNode.gain.value = 0.10 * settingsState.musicVol;
    // Aggiorna volume OST in tempo reale
    if (typeof applyOstVolume === "function") applyOstVolume();
}
