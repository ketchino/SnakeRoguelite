/* ===== MUSICA (HTML5 Audio + seamless loop watcher) ===== */

// --- OST file mapping ---
var ZONE_OST = [
    "osts/zones/midnight_token_toss.ogg",       // L'Albero di Mele
    "osts/zones/save_room_waltz.ogg",            // Il Bosco Oscuro
    "osts/zones/sunken_bog_gate.ogg",            // La Palude
    "osts/zones/march_to_the_sunken_keep.ogg",   // Il Regno d'Oro
    "osts/zones/scales_and_brimstone.ogg",       // Il Nido del Drago
    "osts/zones/gravity_failure_imminent.ogg",   // Le Rovine Cosmiche
    "osts/zones/between_the_stars.ogg"           // Il Vuoto Abissale
];
var MENU_OST = "osts/zones/champions_landing.ogg";
var PAUSE_OST = "osts/zones/when_the_world_stops.ogg";

// --- OST display names ---
var OST_NAMES = {
    menu:  "Champion's Landing",
    pause: "When the World Stops",
    zone0: "Midnight Token Toss",
    zone1: "Save Room Waltz",
    zone2: "Sunken Bog Gate",
    zone3: "March to the Sunken Keep",
    zone4: "Scales and Brimstone",
    zone5: "Gravity Failure Imminent",
    zone6: "Between the Stars"
};

// --- Audio state ---
var currentOstAudio = null;    // The currently playing <audio> element
var currentOstKey = null;      // Key: "menu", "pause", "zone0"..."zone6"
var ostFadeTimer = null;       // Fade interval timer
var savedZoneKey = null;       // Zone track to resume after pause menu
var ostLoopWatch = null;       // Interval ID for gapless loop watcher
var ostIsPlaying = false;      // True only when audio is actually producing sound
var ostRetryTimer = null;      // Timer ID for autoplay retry
var ostRetryCount = 0;         // How many times we've retried
var OST_MAX_RETRIES = 40;      // Max retries (~20 seconds at 500ms each)

// --- Get path for a key ---
function ostPath(key) {
    if (key === "menu") return MENU_OST;
    if (key === "pause") return PAUSE_OST;
    if (key.indexOf("zone") === 0) {
        var idx = parseInt(key.replace("zone", ""));
        if (!isNaN(idx) && idx >= 0 && idx < ZONE_OST.length) return ZONE_OST[idx];
    }
    return null;
}

// --- Update OST name display ---
function updateOstDisplay(key) {
    var el = document.getElementById("ost-ticker");
    if (!el) return;
    var name = OST_NAMES[key] || "";
    if (name) {
        el.textContent = "";
        var inner = document.createElement("span");
        inner.className = "ticker-inner";
        inner.textContent = "\uD83C\uDFB5 " + name;
        el.appendChild(inner);
        el.classList.add("visible");
    } else {
        el.textContent = "";
        el.classList.remove("visible");
    }
}

// --- Stop retry timer ---
function stopOstRetry() {
    if (ostRetryTimer) { clearTimeout(ostRetryTimer); ostRetryTimer = null; }
    ostRetryCount = 0;
}

// --- Hard stop: ferma immediatamente senza fade (per stopMusic) ---
function hardStopCurrent() {
    stopLoopWatch();
    stopOstRetry();
    if (ostFadeTimer) { clearInterval(ostFadeTimer); ostFadeTimer = null; }
    if (currentOstAudio) {
        currentOstAudio.pause();
        currentOstAudio.oncanplaythrough = null;
        currentOstAudio.onerror = null;
        currentOstAudio.removeAttribute("src");
        currentOstAudio.load();
        currentOstAudio = null;
    }
    currentOstKey = null;
    ostIsPlaying = false;
}

// --- Fade-out e stop ---
function fadeOutAndStop(callback) {
    stopLoopWatch();
    if (ostFadeTimer) { clearInterval(ostFadeTimer); ostFadeTimer = null; }
    var audio = currentOstAudio;
    if (!audio || audio.paused) {
        hardStopCurrent();
        if (callback) callback();
        return;
    }
    var startVol = audio.volume;
    var steps = 10;
    var stepTime = 30; // Fade molto veloce: 300ms totali
    var volStep = startVol / steps;
    var step = 0;
    ostFadeTimer = setInterval(function () {
        step++;
        if (step >= steps || !currentOstAudio) {
            clearInterval(ostFadeTimer);
            ostFadeTimer = null;
            hardStopCurrent();
            if (callback) callback();
            return;
        }
        audio.volume = Math.max(0, startVol - volStep * step);
    }, stepTime);
}

// --- Seamless loop: reset currentTime before the end ---
function startLoopWatch(audio) {
    stopLoopWatch();
    if (!audio || !audio.duration || !isFinite(audio.duration)) return;
    ostLoopWatch = setInterval(function () {
        if (!currentOstAudio || currentOstAudio.paused || !currentOstAudio.duration) return;
        var remaining = currentOstAudio.duration - currentOstAudio.currentTime;
        if (remaining < 0.25 && remaining > 0) {
            currentOstAudio.currentTime = 0;
        }
    }, 80);
}

function stopLoopWatch() {
    if (ostLoopWatch) { clearInterval(ostLoopWatch); ostLoopWatch = null; }
}

// --- Core: play an OST key ---
function playOst(key) {
    // Se la stessa traccia sta gia' suonando realmente, non fare nulla
    if (key === currentOstKey && ostIsPlaying) return;

    // Se stiamo andando in pausa, salva la zona corrente
    if (key === "pause") savedZoneKey = currentOstKey;

    // IMPORTANTE: ferma subito la traccia corrente (hard stop) e poi avvia la nuova
    // Questo garantisce che audio.play() venga chiamato nello stesso stack della gesture utente
    hardStopCurrent();
    beginOst(key);
}

// --- Inizia a suonare una traccia (chiamato dopo hard stop) ---
function beginOst(key) {
    if (typeof initAudio === "function") initAudio();

    var path = ostPath(key);
    if (!path) return;

    stopOstRetry();

    var audio = new Audio();
    audio.preload = "auto";
    audio.src = path;
    audio.volume = 0; // Parte da 0 per fade-in

    currentOstAudio = audio;
    currentOstKey = key;
    ostIsPlaying = false;
    ostRetryCount = 0;
    updateOstDisplay(key);

    var targetVol = (typeof MUSIC_MASTER !== "undefined" ? MUSIC_MASTER : 1) * settingsState.musicVol;

    // Gestione errori
    audio.onerror = function () {
        if (currentOstKey === key) {
            hardStopCurrent();
            updateOstDisplay(null);
        }
    };

    // Quando pronto, avvia il loop watcher
    audio.oncanplaythrough = function () {
        if (ostIsPlaying) startLoopWatch(audio);
    };

    // Se l'audio finisce (non dovrebbe col loop watcher, ma per sicurezza)
    audio.onended = function () {
        if (currentOstKey === key) {
            audio.currentTime = 0;
            audio.play().catch(function () {});
        }
    };

    // Funzione di retry: continua a provare finché non riesce
    function tryPlayOst() {
        if (currentOstKey !== key || ostIsPlaying) return; // Track cambiata o già in riproduzione
        audio.play().then(function () {
            ostIsPlaying = true;
            fadeInOst(targetVol);
            startLoopWatch(audio);
            ostRetryCount = 0;
        }).catch(function () {
            // Autoplay bloccato - ritenta fra 500ms
            ostRetryCount++;
            if (ostRetryCount < OST_MAX_RETRIES) {
                ostRetryTimer = setTimeout(tryPlayOst, 500);
            }
        });
    }

    tryPlayOst();
}

// --- Fade in ---
function fadeInOst(targetVol, duration) {
    duration = duration || 500;
    if (ostFadeTimer) clearInterval(ostFadeTimer);
    var audio = currentOstAudio;
    if (!audio) return;
    var startVol = audio.volume;
    var steps = 12;
    var stepTime = duration / steps;
    var volStep = (targetVol - startVol) / steps;
    var step = 0;
    ostFadeTimer = setInterval(function () {
        step++;
        if (step >= steps || !currentOstAudio) {
            clearInterval(ostFadeTimer);
            ostFadeTimer = null;
            if (currentOstAudio) currentOstAudio.volume = targetVol;
            return;
        }
        audio.volume = Math.max(0, Math.min(1, startVol + volStep * step));
    }, stepTime);
}

// --- Stop music completely (immediato, per transizioni di stato) ---
function stopOst() {
    savedZoneKey = null;
    hardStopCurrent();
    updateOstDisplay(null);
}

// --- Public API ---

function startMusic() {
    var key = "zone" + Math.min(G.zoneIndex, ZONE_OST.length - 1);
    playOst(key);
}

function stopMusic() {
    stopOst();
}

function playMenuMusic() {
    playOst("menu");
}

function playPauseMusic() {
    playOst("pause");
}

function resumeZoneMusic() {
    if (savedZoneKey) {
        playOst(savedZoneKey);
        savedZoneKey = null;
    } else {
        startMusic();
    }
}

function onZoneMusicChange(zoneIndex) {
    var key = "zone" + Math.min(zoneIndex, ZONE_OST.length - 1);
    playOst(key);
}

// --- Aggiorna volume in tempo reale ---
function applyOstVolume() {
    if (currentOstAudio && !ostFadeTimer) {
        currentOstAudio.volume = (typeof MUSIC_MASTER !== "undefined" ? MUSIC_MASTER : 1) * settingsState.musicVol;
    }
}

// --- Autoplay unlock: ad ogni input utente, sblocca audio bloccato ---
var ostUnlocked = false;

function ostInteractionHandler() {
    if (typeof initAudio === "function") initAudio();
    if (typeof audioCtx !== "undefined" && audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    // Se la musica sta già suonando, non fare nulla
    if (ostIsPlaying && currentOstAudio && !currentOstAudio.paused) return;

    // Forza il play immediato di qualsiasi traccia in pausa
    if (currentOstAudio && currentOstAudio.paused && currentOstKey && !ostIsPlaying) {
        stopOstRetry();
        currentOstAudio.play().then(function () {
            ostIsPlaying = true;
            ostUnlocked = true;
            fadeInOst((typeof MUSIC_MASTER !== "undefined" ? MUSIC_MASTER : 1) * settingsState.musicVol);
            startLoopWatch(currentOstAudio);
        }).catch(function () {});
    }
    // Se siamo nel menu e non suona nulla, forza l'avvio della OST
    else if ((typeof mState !== "undefined" && mState === "slots") || currentOstKey === "menu") {
        stopOstRetry();
        playOst("menu");
        ostUnlocked = true;
    }
}

document.addEventListener("click", ostInteractionHandler);
document.addEventListener("touchstart", ostInteractionHandler);
document.addEventListener("keydown", ostInteractionHandler);

// --- Compatibility ---
var musicLoop = null;
var musicGainNode = null;
