/* ===== SALVATAGGIO & CODEX PERSISTENCE ===== */
function loadCodex() {
    try {
        return JSON.parse(localStorage.getItem("snake_codex")) || [];
    } catch(e) { return []; }
}

function saveCodex(codex) {
    localStorage.setItem("snake_codex", JSON.stringify(codex));
}

function discover(id) {
    var codex = loadCodex();
    if (codex.indexOf(id) === -1) {
        codex.push(id);
        saveCodex(codex);
        return true;
    }
    return false;
}

function save() { if (G.currentSlot && G.hp > 0 && running) localStorage.setItem("snake_slot_" + G.currentSlot, JSON.stringify(G)); }

/* ===== BOSS RELIC UNLOCKS (persistent across runs) ===== */
function loadBossUnlocks() {
    try {
        return JSON.parse(localStorage.getItem("snake_boss_unlocks")) || [];
    } catch(e) { return []; }
}

function saveBossUnlock(bossId) {
    var unlocks = loadBossUnlocks();
    if (unlocks.indexOf(bossId) === -1) {
        unlocks.push(bossId);
        localStorage.setItem("snake_boss_unlocks", JSON.stringify(unlocks));
    }
}
