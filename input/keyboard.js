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

    // Menu states that should intercept ALL keys before game input
    // Codex open: ESC or C closes it, block other inputs
    if (codexIsOpen) {
        if (k === "escape" || k === "c") { toggleCodex(); return; }
        return; // Blocca altri input mentre il codex è aperto
    }
    // Settings navigation — WASD + frecce per volumi
    // settingsIdx: 0=SFX, 1=Musica, 2=Indietro
    if (mState === "settings") {
        // Key remapping: se stiamo ascoltando un nuovo tasto
        if (keymapListening && keymapListeningAction) {
            // Premi un tasto per rimappare
            if (k === "escape") {
                keymapListening = false; keymapListeningAction = null;
                renderSettingsScreen(); return;
            }
            // Non permettere escape o某些 tasti speciali
            if (k !== "tab" && k !== "capslock" && k !== "numlock" && k !== "scrolllock") {
                keymap[keymapListeningAction] = k;
                saveKeymap();
                keymapListening = false; keymapListeningAction = null;
                renderSettingsScreen();
            }
            return;
        }
        var SETTINGS_TOTAL = settingsTab === "audio" ? 2 : (settingsTab === "keyboard" ? KEYMAP_ACTIONS.length + 1 : Object.keys(gpButtonMap).length + 2);
        if (k === "w" || k === "arrowup") { e.preventDefault(); settingsIdx = Math.max(0, settingsIdx - 1); renderSettingsScreen(); }
        if (k === "s" || k === "arrowdown") { e.preventDefault(); settingsIdx = Math.min(SETTINGS_TOTAL - 1, settingsIdx + 1); renderSettingsScreen(); }
        if (settingsTab === "audio") {
            if (k === "arrowleft" || k === "a") {
                e.preventDefault();
                if (settingsIdx === 0) { settingsState.sfxVol = Math.max(0, settingsState.sfxVol - 0.05); saveSettings(); renderSettingsScreen(); }
                else if (settingsIdx === 1) { settingsState.musicVol = Math.max(0, settingsState.musicVol - 0.05); saveSettings(); applySettings(); renderSettingsScreen(); }
            }
            if (k === "arrowright" || k === "d") {
                e.preventDefault();
                if (settingsIdx === 0) { settingsState.sfxVol = Math.min(1, settingsState.sfxVol + 0.05); saveSettings(); renderSettingsScreen(); }
                else if (settingsIdx === 1) { settingsState.musicVol = Math.min(1, settingsState.musicVol + 0.05); saveSettings(); applySettings(); renderSettingsScreen(); }
            }
            if (k === " " || k === "enter") { e.preventDefault(); exitSettings(); }
        } else if (settingsTab === "keyboard") {
            if (k === " " || k === "enter") {
                e.preventDefault();
                if (settingsIdx < KEYMAP_ACTIONS.length) {
                    // Inizia ascolto per rimappare
                    keymapListening = true;
                    keymapListeningAction = KEYMAP_ACTIONS[settingsIdx].id;
                    renderSettingsScreen();
                } else {
                    // Reset
                    resetKeymap(); renderSettingsScreen();
                }
            }
        } else if (settingsTab === "controller") {
            if (k === " " || k === "enter") {
                e.preventDefault();
                var gpActionIds = Object.keys(gpButtonMap);
                if (settingsIdx < gpActionIds.length) {
                    gpMappingListening = true;
                    gpMappingAction = gpActionIds[settingsIdx];
                    renderSettingsScreen();
                } else if (settingsIdx === gpActionIds.length) {
                    localStorage.removeItem("snake_gp_mapping"); renderSettingsScreen();
                }
            }
        }
        if (k === "escape" || k === "backspace") { e.preventDefault(); exitSettings(); }
        return;
    }
    // Difficulty selection navigation — PRIORITÀ ALTA, prima del game input
    // diffIdx: 0=Peaceful, 1=Default, 2=Hardcore, 3=Indietro
    if (mState === "difficulty") {
        if (k === "w" || k === "arrowup") { e.preventDefault(); diffIdx = Math.max(0, diffIdx - 1); renderDifficultyScreen(); }
        if (k === "s" || k === "arrowdown") { e.preventDefault(); diffIdx = Math.min(DIFF_TOTAL - 1, diffIdx + 1); renderDifficultyScreen(); }
        if (k === " " || k === "enter") { e.preventDefault(); confirmDifficulty(); }
        if (k === "escape" || k === "backspace") { e.preventDefault(); mState = "slots"; showSlotMenu(); }
        return;
    }
    // Character selection navigation — carousel orizzontale con wrap-around
    if (mState === "character") {
        if (k === "a" || k === "arrowleft") { e.preventDefault(); charIdx = (charIdx - 1 + CHARACTERS.length) % CHARACTERS.length; renderCharacterScreen(); }
        if (k === "d" || k === "arrowright") { e.preventDefault(); charIdx = (charIdx + 1) % CHARACTERS.length; renderCharacterScreen(); }
        if (k === " " || k === "enter") { e.preventDefault(); confirmCharacter(); }
        if (k === "escape" || k === "backspace") { e.preventDefault(); mState = "difficulty"; showDifficultyScreen(pendingSlot); }
        return;
    }
    // Secret shop navigation — PRIORITÀ ALTA, prima del game input
    // Layout: [Buff0] [Buff1]  ← riga buff (A/D)
    //         [RIFIUTA]         ← riga rifiuta (S scende, W sale)
    // shopBuffCol tiene traccia dell'ultimo buff selezionato per tornare su
    if (mState === "secretshop") {
        var onRefuse = mIdx >= shopPicks.length;
        if (k === "a" || k === "arrowleft") {
            e.preventDefault();
            if (onRefuse) { mIdx = Math.max(0, (typeof shopBuffCol !== "undefined" ? shopBuffCol : 0)); }
            else { mIdx = Math.max(0, mIdx - 1); shopBuffCol = mIdx; }
            renderSecretShop();
        }
        if (k === "d" || k === "arrowright") {
            e.preventDefault();
            if (onRefuse) { mIdx = Math.min(shopPicks.length - 1, (typeof shopBuffCol !== "undefined" ? shopBuffCol : shopPicks.length - 1)); }
            else { mIdx = Math.min(shopPicks.length - 1, mIdx + 1); shopBuffCol = mIdx; }
            renderSecretShop();
        }
        if (k === "s" || k === "arrowdown") {
            e.preventDefault();
            if (!onRefuse) { shopBuffCol = mIdx; mIdx = shopPicks.length; }
            renderSecretShop();
        }
        if (k === "w" || k === "arrowup") {
            e.preventDefault();
            if (onRefuse) { mIdx = (typeof shopBuffCol !== "undefined" ? shopBuffCol : 0); }
            renderSecretShop();
        }
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
    // Game input — solo se non siamo in un menu
    if (running && !paused && relicDelay <= 0 && cdTimer <= 0) {
        if (isKeyMapped(k, "ability")) {
            e.preventDefault();
            // Priority: Kunai > Frammento del Vuoto
            if (G.kunai && G.kunaiCDMS <= 0) { useKunai(); return; }
            if (G.frammentovuoto && G.frammentoCD <= 0) { useFrammento(G, CZ(G), fx); return; }
            return;
        }
        var dir = getMovementDir(k);
        if (dir) { e.preventDefault(); queueInput(G, dir[0], dir[1], fx); }
    }
    // Pause toggle — only when game is actually running
    if (isKeyMapped(k, "pause")) {
        if (mState === "slots" || mState === "dead" || mState === "codex") return; // Block in menus
        if (mState === "leveling" || relicDelay > 0 || cdTimer > 0) return;
        if (paused && mState !== "paused") return;
        if (running) { paused ? resumeGame() : pauseGame(); }
    }
    // Codex toggle
    if (isKeyMapped(k, "codex")) {
        if (mState === "slots" || mState === "paused") { e.preventDefault(); toggleCodex(); return; }
    }
    if (mState === "slots") {
        // A/Left, D/Right: navigate between the 3 garden slots (0-2)
        // W/Up: go up from delete/settings to slot
        // S/Down: go down to delete slider (if slot has data) or settings (index 3)
        var hasSaveData = mIdx < 3 && !!localStorage.getItem("snake_slot_" + (mIdx + 1));
        if (k === "a" || k === "arrowleft") { slotDeleteFocused = false; slotDeleteConfirm = false; mIdx = Math.max(0, Math.min(2, mIdx - 1)); renderSlots(); }
        if (k === "d" || k === "arrowright") { slotDeleteFocused = false; slotDeleteConfirm = false; mIdx = Math.min(2, mIdx + 1); renderSlots(); }
        if (k === "s" || k === "arrowdown") {
            if (slotDeleteFocused) { slotDeleteFocused = false; slotDeleteConfirm = false; mIdx = 3; }
            else if (hasSaveData) { slotDeleteFocused = true; }
            else { mIdx = 3; }
            renderSlots();
        }
        if (k === "w" || k === "arrowup") {
            if (slotDeleteFocused) { slotDeleteFocused = false; slotDeleteConfirm = false; }
            else if (mIdx === 3) { mIdx = 1; }
            renderSlots();
        }
        if (k === " " || k === "enter") { e.preventDefault(); handleSlotConfirm(); }
    } else if (mState === "leveling") {
        if (relicInputLocked) return;
        if (k === "a" || k === "arrowleft") { mIdx = (mIdx + picks.length - 1) % picks.length; renderRelics(); }
        if (k === "d" || k === "arrowright") { mIdx = (mIdx + 1) % picks.length; renderRelics(); }
        if (k === " " || k === "enter") { e.preventDefault(); if (picks[mIdx]) applyRelic(picks[mIdx]); }
    } else if (mState === "paused") {
        if (k === "w" || k === "arrowup") { mIdx = Math.max(0, mIdx - 1); OVC.querySelectorAll(".btn").forEach(function (b, i) { b.classList.toggle("selected", i === mIdx); }); }
        if (k === "s" || k === "arrowdown") { mIdx = Math.min(2, mIdx + 1); OVC.querySelectorAll(".btn").forEach(function (b, i) { b.classList.toggle("selected", i === mIdx); }); }
        if (k === " " || k === "enter") { e.preventDefault(); handlePauseConfirm(); }
    } else if (mState === "dead" && (k === " " || k === "enter")) {
        e.preventDefault(); showSlotMenu();
    }
});

document.addEventListener("keyup", function (e) {
    var k = e.key.toLowerCase();
    delete debugKeysDown[k];
});
