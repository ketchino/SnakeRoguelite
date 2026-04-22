/* ===== STATO GLOBALE ===== */
var G = {}, running = false, paused = false, loop = null, mState = "slots", mIdx = 0, picks = [];
var particles = [], floats = [], ambients = [], screenFlash = 0, flashClr = "white", bannerOn = false;
var shakeX = 0, shakeY = 0, shakeI = 0, relicDelay = 0, cdTimer = 0;
var lastTime = performance.now(), gridPulse = 0, renderedRC = 0;
var codexFab = null, codexPanel = null, codexIsOpen = false, activeTab = 'zone';
var discoveryQueue = [], relicInputLocked = false;
