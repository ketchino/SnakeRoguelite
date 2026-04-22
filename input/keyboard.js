/* ===== TASTIERA ===== */
document.addEventListener("keydown", function (e) {
    var k = e.key.toLowerCase();

    // Debug: Q+M combo detection
    debugKeysDown[k] = true;
    if (debugKeysDown['q'] && debugKeysDown['m']) {
        e.preventDefault();
        delete debugKeysDown['q'];
        delete debugKeysDown['m'];
        toggleDebug();
        return;
    }
    // Close debug on ESC
    if (debugIsOpen && k === "escape") {
        closeDebug();
        return;
    }
    // Block all other input while debug is open
    if (debugIsOpen) return;

    if (running && !paused && relicDelay <= 0 && cdTimer <= 0) {
        if (k === " ") {
            e.preventDefault();
            // Priority: Kunai > Frammento del Vuoto
            if (G.kunai && G.kunaiCDMS <= 0) { useKunai(); return; }
            if (G.frammentovuoto && G.frammentoCD <= 0) { useFrammento(G, CZ(G), fx); return; }
            return;
        }
        var map = { arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
        if (map[k]) { e.preventDefault(); queueInput(G, map[k][0], map[k][1], fx); }
    }
    // Codex open: ESC or C closes it, block other inputs
    if (codexIsOpen) {
        if (k === "escape" || k === "c") { toggleCodex(); return; }
        return; // Blocca altri input mentre il codex è aperto
    }
    // Settings: ESC/Space/Enter/Backspace goes back
    if (mState === "settings") {
        if (k === " " || k === "enter" || k === "escape" || k === "backspace") { e.preventDefault(); exitSettings(); return; }
        return;
    }
    // Secret shop navigation
    if (mState === "secretshop") {
        if (k === "a" || k === "arrowleft") { mIdx = Math.max(0, mIdx - 1); renderSecretShop(); }
        if (k === "d" || k === "arrowright") { mIdx = Math.min(shopPicks.length, mIdx + 1); renderSecretShop(); }
        if (k === " " || k === "enter") {
            e.preventDefault();
            if (mIdx < shopPicks.length) {
                var buff = shopPicks[mIdx];
                if (canAffordBuff(G, buff)) {
                    applySecretBuff(G, buff);
                    if (!G.secretBuffs) G.secretBuffs = [];
                    G.secretBuffs.push(buff.id);
                    closeSecretShop(true);
                } else {
                    shopSnakeShake = 8;
                    sHit();
                    renderSecretShop();
                }
            } else {
                closeSecretShop(false);
            }
        }
        if (k === "escape") { closeSecretShop(false); }
        return;
    }
    // Pause toggle — only when game is actually running
    if (k === "p" || k === "escape") {
        if (mState === "slots" || mState === "dead" || mState === "codex") return; // Block in menus
        if (mState === "leveling" || relicDelay > 0 || cdTimer > 0) return;
        if (paused && mState !== "paused") return;
        if (running) { paused ? resumeGame() : pauseGame(); }
    }
    if (mState === "slots") {
        // A/Left, D/Right: navigate between the 3 garden slots (0-2)
        // W/Up: go up from settings to last garden slot
        // S/Down: go down to settings (index 3) from any garden slot
        if (k === "a" || k === "arrowleft") { mIdx = Math.max(0, Math.min(2, mIdx - 1)); renderSlots(); }
        if (k === "d" || k === "arrowright") { mIdx = Math.min(2, mIdx + 1); renderSlots(); }
        if (k === "s" || k === "arrowdown") { mIdx = 3; renderSlots(); }
        if (k === "w" || k === "arrowup") { if (mIdx === 3) { mIdx = 1; } renderSlots(); }
        if (k === " " || k === "enter") { e.preventDefault(); handleSlotConfirm(); }
    } else if (mState === "leveling") {
        if (relicInputLocked) return;
        if (k === "a" || k === "arrowleft") { mIdx = (mIdx + picks.length - 1) % picks.length; renderRelics(); }
        if (k === "d" || k === "arrowright") { mIdx = (mIdx + 1) % picks.length; renderRelics(); }
        if (k === " " || k === "enter") { e.preventDefault(); if (picks[mIdx]) applyRelic(picks[mIdx]); }
    } else if (mState === "paused") {
        if (k === "w" || k === "arrowup") { mIdx = Math.max(0, mIdx - 1); OVC.querySelectorAll(".pause-btns-side .btn").forEach(function (b, i) { b.classList.toggle("selected", i === mIdx); }); }
        if (k === "s" || k === "arrowdown") { mIdx = Math.min(2, mIdx + 1); OVC.querySelectorAll(".pause-btns-side .btn").forEach(function (b, i) { b.classList.toggle("selected", i === mIdx); }); }
        if (k === " " || k === "enter") { e.preventDefault(); handlePauseConfirm(); }
    } else if (mState === "dead" && (k === " " || k === "enter")) {
        e.preventDefault(); showSlotMenu();
    }
});

document.addEventListener("keyup", function (e) {
    var k = e.key.toLowerCase();
    delete debugKeysDown[k];
});
