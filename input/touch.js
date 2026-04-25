/* ===== MOBILE TOUCH CONTROLS ===== */
var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
var mobileControlsVisible = false;

// ===== Mobile controls container (created dynamically) =====
var mobileOverlay = null;
var dpadBtns = {};
var actionBtn = null;
var pauseTouchBtn = null;

function createMobileControls() {
    if (mobileOverlay) return; // Already created

    mobileOverlay = document.createElement("div");
    mobileOverlay.id = "mobile-controls";
    mobileOverlay.style.display = "none"; // Hidden by default, shown only during gameplay

    // ---- D-PAD (left side) ----
    var dpadWrap = document.createElement("div");
    dpadWrap.className = "mc-dpad";

    var dirs = [
        { id: "up",    label: "▲", row: 1, col: 2 },
        { id: "left",  label: "◀", row: 2, col: 1 },
        { id: "center",label: "",   row: 2, col: 2 },
        { id: "right", label: "▶", row: 2, col: 3 },
        { id: "down",  label: "▼", row: 3, col: 2 }
    ];
    dirs.forEach(function(d) {
        var btn = document.createElement("div");
        btn.className = "mc-dpad-btn" + (d.id === "center" ? " mc-dpad-center" : "");
        btn.textContent = d.label;
        btn.style.gridRow = d.row;
        btn.style.gridColumn = d.col;
        if (d.id !== "center") {
            btn.setAttribute("data-dir", d.id);
            dpadBtns[d.id] = btn;
        }
        dpadWrap.appendChild(btn);
    });
    mobileOverlay.appendChild(dpadWrap);

    // ---- ACTION BUTTONS (right side) ----
    var actionWrap = document.createElement("div");
    actionWrap.className = "mc-actions";

    // Ability button (Kunai / Frammento)
    actionBtn = document.createElement("div");
    actionBtn.className = "mc-action-btn mc-ability-btn";
    actionBtn.innerHTML = "<span class='mc-btn-icon'>⚡</span><span class='mc-btn-label'>ABILITA</span>";
    actionWrap.appendChild(actionBtn);

    // Pause button
    pauseTouchBtn = document.createElement("div");
    pauseTouchBtn.className = "mc-action-btn mc-pause-btn";
    pauseTouchBtn.innerHTML = "<span class='mc-btn-icon'>⏸</span><span class='mc-btn-label'>PAUSA</span>";
    actionWrap.appendChild(pauseTouchBtn);

    mobileOverlay.appendChild(actionWrap);
    document.body.appendChild(mobileOverlay);

    // ===== TOUCH EVENT HANDLERS =====

    // D-Pad: direction input on touch
    var dpadDirMap = {
        up:    { dx: 0, dy: -1 },
        down:  { dx: 0, dy: 1 },
        left:  { dx: -1, dy: 0 },
        right: { dx: 1, dy: 0 }
    };

    Object.keys(dpadBtns).forEach(function(dir) {
        var btn = dpadBtns[dir];

        btn.addEventListener("touchstart", function(e) {
            e.preventDefault();
            e.stopPropagation();
            btn.classList.add("mc-active");
            var d = dpadDirMap[dir];
            if (running && !paused && G && relicDelay <= 0 && cdTimer <= 0) {
                queueInput(G, d.dx, d.dy, fx);
            }
            // Menu navigation with D-pad
            if (mState === "slots") {
                if (dir === "left") { slotDeleteFocused = false; slotDeleteConfirm = false; slotDeleteConfirmIdx = -1; mIdx = Math.max(0, Math.min(2, mIdx - 1)); renderSlots(); }
                if (dir === "right") { slotDeleteFocused = false; slotDeleteConfirm = false; slotDeleteConfirmIdx = -1; mIdx = Math.min(2, mIdx + 1); renderSlots(); }
                if (dir === "down") {
                    if (slotDeleteFocused) { slotDeleteFocused = false; slotDeleteConfirm = false; slotDeleteConfirmIdx = -1; mIdx = 3; }
                    else if (mIdx < 3 && !!localStorage.getItem("snake_slot_" + (mIdx + 1))) { slotDeleteFocused = true; }
                    else { mIdx = 3; }
                    renderSlots();
                }
                if (dir === "up") {
                    if (slotDeleteFocused) { slotDeleteFocused = false; slotDeleteConfirm = false; slotDeleteConfirmIdx = -1; }
                    else if (mIdx === 3) { mIdx = 1; }
                    renderSlots();
                }
            }
            if (mState === "difficulty") {
                if (dir === "up") { diffIdx = Math.max(0, diffIdx - 1); renderDifficultyScreen(); }
                if (dir === "down") { diffIdx = Math.min(DIFF_TOTAL - 1, diffIdx + 1); renderDifficultyScreen(); }
            }
            if (mState === "character") {
                if (dir === "left") _charNav(-1);
                if (dir === "right") _charNav(1);
            }
            if (mState === "leveling" && !relicInputLocked) {
                if (dir === "left") { mIdx = (mIdx + picks.length - 1) % picks.length; renderRelics(); }
                if (dir === "right") { mIdx = (mIdx + 1) % picks.length; renderRelics(); }
            }
            if (mState === "paused") {
                if (dir === "up") { mIdx = Math.max(0, mIdx - 1); OVC.querySelectorAll(".btn").forEach(function (b, i) { b.classList.toggle("selected", i === mIdx); }); }
                if (dir === "down") { mIdx = Math.min(2, mIdx + 1); OVC.querySelectorAll(".btn").forEach(function (b, i) { b.classList.toggle("selected", i === mIdx); }); }
            }
            if (mState === "settings") {
                if (dir === "up") { settingsIdx = Math.max(0, settingsIdx - 1); renderSettingsScreen(); }
                if (dir === "down") {
                    var ST = settingsTab === "audio" ? 2 : (settingsTab === "keyboard" ? KEYMAP_ACTIONS.length + 1 : Object.keys(gpButtonMap).length + 2);
                    settingsIdx = Math.min(ST - 1, settingsIdx + 1); renderSettingsScreen();
                }
                if (dir === "left" && settingsTab === "audio") {
                    if (settingsIdx === 0) { settingsState.sfxVol = Math.max(0, settingsState.sfxVol - 0.05); saveSettings(); renderSettingsScreen(); }
                    else if (settingsIdx === 1) { settingsState.musicVol = Math.max(0, settingsState.musicVol - 0.05); saveSettings(); applySettings(); renderSettingsScreen(); }
                }
                if (dir === "right" && settingsTab === "audio") {
                    if (settingsIdx === 0) { settingsState.sfxVol = Math.min(1, settingsState.sfxVol + 0.05); saveSettings(); renderSettingsScreen(); }
                    else if (settingsIdx === 1) { settingsState.musicVol = Math.min(1, settingsState.musicVol + 0.05); saveSettings(); applySettings(); renderSettingsScreen(); }
                }
            }
            if (mState === "secretshop") {
                var onRefuse = mIdx >= shopPicks.length;
                if (dir === "left") {
                    if (onRefuse) { mIdx = Math.max(0, (typeof shopBuffCol !== "undefined" ? shopBuffCol : 0)); }
                    else { mIdx = Math.max(0, mIdx - 1); shopBuffCol = mIdx; }
                    renderSecretShop();
                }
                if (dir === "right") {
                    if (onRefuse) { mIdx = Math.min(shopPicks.length - 1, (typeof shopBuffCol !== "undefined" ? shopBuffCol : shopPicks.length - 1)); }
                    else { mIdx = Math.min(shopPicks.length - 1, mIdx + 1); shopBuffCol = mIdx; }
                    renderSecretShop();
                }
                if (dir === "down" && !onRefuse) { shopBuffCol = mIdx; mIdx = shopPicks.length; renderSecretShop(); }
                if (dir === "up" && onRefuse) { mIdx = (typeof shopBuffCol !== "undefined" ? shopBuffCol : 0); renderSecretShop(); }
            }
        }, { passive: false });

        btn.addEventListener("touchend", function(e) {
            e.preventDefault();
            e.stopPropagation();
            btn.classList.remove("mc-active");
        }, { passive: false });

        btn.addEventListener("touchcancel", function(e) {
            btn.classList.remove("mc-active");
        });
    });

    // Ability button
    actionBtn.addEventListener("touchstart", function(e) {
        e.preventDefault();
        e.stopPropagation();
        actionBtn.classList.add("mc-active");
        if (running && !paused && G && relicDelay <= 0 && cdTimer <= 0) {
            // Priority: Kunai > Frammento del Vuoto
            if (G.kunai && G.kunaiCDMS <= 0) { useKunai(); return; }
            if (G.frammentovuoto && G.frammentoCD <= 0) { useFrammento(G, CZ(G), fx); return; }
        }
    }, { passive: false });

    actionBtn.addEventListener("touchend", function(e) {
        e.preventDefault();
        e.stopPropagation();
        actionBtn.classList.remove("mc-active");
    }, { passive: false });

    actionBtn.addEventListener("touchcancel", function() {
        actionBtn.classList.remove("mc-active");
    });

    // Pause button
    pauseTouchBtn.addEventListener("touchstart", function(e) {
        e.preventDefault();
        e.stopPropagation();
        pauseTouchBtn.classList.add("mc-active");
        if (mState === "slots" || mState === "dead" || mState === "codex" || mState === "difficulty" || mState === "character") return;
        if (mState === "leveling" || relicDelay > 0 || cdTimer > 0) return;
        if (running) { paused ? resumeGame() : pauseGame(); }
    }, { passive: false });

    pauseTouchBtn.addEventListener("touchend", function(e) {
        e.preventDefault();
        e.stopPropagation();
        pauseTouchBtn.classList.remove("mc-active");
    }, { passive: false });

    pauseTouchBtn.addEventListener("touchcancel", function() {
        pauseTouchBtn.classList.remove("mc-active");
    });
}

function showMobileControls() {
    if (!isTouchDevice || !mobileOverlay) return;
    mobileOverlay.style.display = "flex";
    mobileControlsVisible = true;
    // Update ability button label based on current relics
    updateMobileAbilityLabel();
}

function hideMobileControls() {
    if (!mobileOverlay) return;
    mobileOverlay.style.display = "none";
    mobileControlsVisible = false;
}

function updateMobileAbilityLabel() {
    if (!actionBtn || !G) return;
    if (G.kunai && G.kunaiCDMS <= 0) {
        actionBtn.querySelector('.mc-btn-icon').textContent = '🗡️';
        actionBtn.querySelector('.mc-btn-label').textContent = 'KUNAI';
        actionBtn.style.opacity = '1';
    } else if (G.frammentovuoto && G.frammentoCD <= 0) {
        actionBtn.querySelector('.mc-btn-icon').textContent = '🌀';
        actionBtn.querySelector('.mc-btn-label').textContent = 'VUOTO';
        actionBtn.style.opacity = '1';
    } else if ((G.kunai && G.kunaiCDMS > 0) || (G.frammentovuoto && G.frammentoCD > 0)) {
        actionBtn.querySelector('.mc-btn-icon').textContent = '⏳';
        actionBtn.querySelector('.mc-btn-label').textContent = 'CD';
        actionBtn.style.opacity = '0.4';
    } else {
        actionBtn.querySelector('.mc-btn-icon').textContent = '⚡';
        actionBtn.querySelector('.mc-btn-label').textContent = 'ABILITA';
        actionBtn.style.opacity = '0.3';
    }
}

// ===== CHARACTER CAROUSEL SWIPE =====
var charSwipeStartX = 0;
var charSwipeStartY = 0;

document.addEventListener("touchstart", function(e) {
    // Character carousel swipe detection
    if (mState === "character") {
        var t = e.touches[0];
        charSwipeStartX = t.clientX;
        charSwipeStartY = t.clientY;
    }
}, { passive: true });

document.addEventListener("touchend", function(e) {
    if (mState !== "character") return;
    var t = e.changedTouches[0];
    var dx = t.clientX - charSwipeStartX;
    var dy = t.clientY - charSwipeStartY;
    // Only handle horizontal swipes on the carousel area
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0) _charNav(-1);
        else _charNav(1);
    }
}, { passive: true });

// ===== PREVENT DEFAULT TOUCH BEHAVIORS ON GAME AREA =====
// Prevent page scrolling, zooming, pull-to-refresh etc. on the game canvas
(function() {
    var gc = document.getElementById("game-container");
    if (gc) {
        gc.addEventListener("touchmove", function(e) {
            e.preventDefault();
        }, { passive: false });
    }
})();

// ===== AUTO-INIT ON TOUCH DEVICES =====
if (isTouchDevice) {
    createMobileControls();
    // Hide the old "DOPPIO TAP = PAUSA" hint — we have a proper pause button now
    var oldHint = document.getElementById("touch-hint");
    if (oldHint) oldHint.style.display = "none";
}
