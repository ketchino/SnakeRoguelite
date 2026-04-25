/* ===== GAMEPAD ===== */
var gpPrevButtons = {};
var gpPrevAxes = {};
var gpPrevDpad = {};
var gpDeadzone = 0.5;
var gpInputCooldown = 0;

// Load saved deadzone
(function() {
    try {
        var savedDz = parseFloat(localStorage.getItem("snake_gp_deadzone"));
        if (!isNaN(savedDz) && savedDz >= 0.1 && savedDz <= 0.8) gpDeadzone = savedDz;
    } catch(e) {}
})();

function pollGamepad() {
    if (gpInputCooldown > 0) gpInputCooldown--;
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (var gi = 0; gi < gamepads.length; gi++) {
        var gp = gamepads[gi];
        if (!gp) continue;

        // Detect controller type for button mapping
        var gpId = (gp.id || "").toLowerCase();
        var isPlayStation = gpId.indexOf("playstation") !== -1 || gpId.indexOf("dualshock") !== -1 || gpId.indexOf("dualsense") !== -1 || gpId.indexOf("054c") !== -1;

        // D-pad as buttons: default 12=Up, 13=Down, 14=Left, 15=Right (customizable)
        var gpMapping = loadGpMapping();
        var dpadUpIdx = gpMapping.dpad_up !== undefined ? gpMapping.dpad_up : 12;
        var dpadDownIdx = gpMapping.dpad_down !== undefined ? gpMapping.dpad_down : 13;
        var dpadLeftIdx = gpMapping.dpad_left !== undefined ? gpMapping.dpad_left : 14;
        var dpadRightIdx = gpMapping.dpad_right !== undefined ? gpMapping.dpad_right : 15;
        var dpadBtnMap = [
            [dpadUpIdx, "arrowup"], [dpadDownIdx, "arrowdown"],
            [dpadLeftIdx, "arrowleft"], [dpadRightIdx, "arrowright"]
        ];
        var dpadPressed = { up: false, down: false, left: false, right: false };

        for (var dbi = 0; dbi < dpadBtnMap.length; dbi++) {
            var bi = dpadBtnMap[dbi][0];
            var dirName = dpadBtnMap[dbi][1];
            var pressed = gp.buttons.length > bi && gp.buttons[bi] && gp.buttons[bi].pressed;
            var key = "gp_" + gi + "_" + bi;
            if (pressed && !gpPrevButtons[key] && gpInputCooldown <= 0) {
                simulateKey(dirName);
                gpInputCooldown = 1;
            }
            gpPrevButtons[key] = pressed;
            if (pressed) {
                if (dirName === "arrowup") dpadPressed.up = true;
                if (dirName === "arrowdown") dpadPressed.down = true;
                if (dirName === "arrowleft") dpadPressed.left = true;
                if (dirName === "arrowright") dpadPressed.right = true;
            }
        }

        // D-pad as hat-switch axes (DualShock/DualSense on some browsers)
        // Common mappings: axes[6]/axes[7] or axes[8]/axes[9]
        var dpadAxisPairs = [[6, 7], [8, 9]];
        for (var dai = 0; dai < dpadAxisPairs.length; dai++) {
            var axH = dpadAxisPairs[dai][0];
            var axV = dpadAxisPairs[dai][1];
            if (gp.axes.length <= Math.max(axH, axV)) continue;
            var dX = gp.axes[axH] || 0;
            var dY = gp.axes[axV] || 0;
            var dk = "gp_" + gi + "_dpad_" + dai;
            var prevD = gpPrevDpad[dk] || { x: 0, y: 0 };
            // Only fire if NOT already registered via button D-pad (avoid duplicates)
            if (gpInputCooldown <= 0) {
                if (dX < -0.5 && prevD.x >= -0.5 && !dpadPressed.left) { simulateKey("arrowleft"); gpInputCooldown = 1; }
                else if (dX > 0.5 && prevD.x <= 0.5 && !dpadPressed.right) { simulateKey("arrowright"); gpInputCooldown = 1; }
                if (dY < -0.5 && prevD.y >= -0.5 && !dpadPressed.up) { simulateKey("arrowup"); gpInputCooldown = 1; }
                else if (dY > 0.5 && prevD.y <= 0.5 && !dpadPressed.down) { simulateKey("arrowdown"); gpInputCooldown = 1; }
            }
            if (dX < -0.5) dpadPressed.left = true;
            if (dX > 0.5) dpadPressed.right = true;
            if (dY < -0.5) dpadPressed.up = true;
            if (dY > 0.5) dpadPressed.down = true;
            gpPrevDpad[dk] = { x: dX, y: dY };
        }

        // Left analog stick (only if D-pad is NOT active in that direction)
        var axisX = gp.axes[0] || 0;
        var axisY = gp.axes[1] || 0;
        var gpKey = "gp_" + gi + "_axis";

        if (gpInputCooldown <= 0) {
            if (axisX < -gpDeadzone && (!gpPrevAxes[gpKey] || gpPrevAxes[gpKey].x >= -gpDeadzone) && !dpadPressed.left) {
                simulateKey("arrowleft"); gpInputCooldown = 1;
            } else if (axisX > gpDeadzone && (!gpPrevAxes[gpKey] || gpPrevAxes[gpKey].x <= gpDeadzone) && !dpadPressed.right) {
                simulateKey("arrowright"); gpInputCooldown = 1;
            }
            if (axisY < -gpDeadzone && (!gpPrevAxes[gpKey] || gpPrevAxes[gpKey].y >= -gpDeadzone) && !dpadPressed.up) {
                simulateKey("arrowup"); gpInputCooldown = 1;
            } else if (axisY > gpDeadzone && (!gpPrevAxes[gpKey] || gpPrevAxes[gpKey].y <= gpDeadzone) && !dpadPressed.down) {
                simulateKey("arrowdown"); gpInputCooldown = 1;
            }
        }
        gpPrevAxes[gpKey] = { x: axisX, y: axisY };

        // Confirm/Cancel/Codex buttons
        // gpMapping already loaded above for D-PAD
        var confirmBtnIdx = gpMapping.confirm !== undefined ? gpMapping.confirm : 0;
        var cancelBtnIdx = gpMapping.cancel !== undefined ? gpMapping.cancel : 1;
        var abilityBtnIdx = gpMapping.ability !== undefined ? gpMapping.ability : 2;
        var codexBtnIdx = gpMapping.codex !== undefined ? gpMapping.codex : 3;
        var pauseBtnIdx = gpMapping.pause !== undefined ? gpMapping.pause : 9;

        // If controller mapping is listening, capture any button press or D-PAD axis
        if (typeof gpMappingListening !== 'undefined' && gpMappingListening && typeof gpMappingAction !== 'undefined' && gpMappingAction) {
            var captured = false;
            for (var mbi = 0; mbi < gp.buttons.length; mbi++) {
                if (gp.buttons[mbi] && gp.buttons[mbi].pressed) {
                    var mbKey = "gp_" + gi + "_map_" + mbi;
                    if (!gpPrevButtons[mbKey]) {
                        var mapping = loadGpMapping();
                        mapping[gpMappingAction] = mbi;
                        saveGpMapping(mapping);
                        gpMappingListening = false;
                        gpMappingAction = null;
                        captured = true;
                        if (typeof renderSettingsScreen === "function") renderSettingsScreen();
                    }
                    gpPrevButtons[mbKey] = true;
                } else {
                    var mbKey2 = "gp_" + gi + "_map_" + mbi;
                    gpPrevButtons[mbKey2] = false;
                }
            }
            // Also capture D-PAD axis movement for DualSense (axes 6-7 or 8-9)
            if (!captured && gpMappingAction && gpMappingAction.indexOf("dpad_") === 0) {
                var dpadAxisPairs = [[6, 7], [8, 9]];
                for (var pai = 0; pai < dpadAxisPairs.length; pai++) {
                    var axH = dpadAxisPairs[pai][0];
                    var axV = dpadAxisPairs[pai][1];
                    if (gp.axes.length <= Math.max(axH, axV)) continue;
                    var aX = gp.axes[axH] || 0;
                    var aY = gp.axes[axV] || 0;
                    var pKey = "gp_" + gi + "_dpadmap_" + pai;
                    var prevA = gpPrevDpad[pKey] || { x: 0, y: 0 };
                    // Map axis direction to D-PAD button index
                    var dpadBtnIdx = null;
                    if (aX < -0.5 && prevA.x >= -0.5) dpadBtnIdx = 14; // Left
                    else if (aX > 0.5 && prevA.x <= 0.5) dpadBtnIdx = 15; // Right
                    if (aY < -0.5 && prevA.y >= -0.5) dpadBtnIdx = 12; // Up
                    else if (aY > 0.5 && prevA.y <= 0.5) dpadBtnIdx = 13; // Down
                    if (dpadBtnIdx !== null) {
                        var mapping2 = loadGpMapping();
                        mapping2[gpMappingAction] = dpadBtnIdx;
                        saveGpMapping(mapping2);
                        gpMappingListening = false;
                        gpMappingAction = null;
                        if (typeof renderSettingsScreen === "function") renderSettingsScreen();
                    }
                    gpPrevDpad[pKey] = { x: aX, y: aY };
                }
            }
            // Continue with normal D-pad navigation
        }

        var confirmBtn = gp.buttons.length > confirmBtnIdx && gp.buttons[confirmBtnIdx] && gp.buttons[confirmBtnIdx].pressed;
        var cancelBtn = gp.buttons.length > cancelBtnIdx && gp.buttons[cancelBtnIdx] && gp.buttons[cancelBtnIdx].pressed;
        var xBtn = gp.buttons.length > abilityBtnIdx && gp.buttons[abilityBtnIdx] && gp.buttons[abilityBtnIdx].pressed;
        var yBtn = gp.buttons.length > codexBtnIdx && gp.buttons[codexBtnIdx] && gp.buttons[codexBtnIdx].pressed;
        var confirmKey = "gp_" + gi + "_confirm";
        var cancelKey = "gp_" + gi + "_cancel";
        var xKey = "gp_" + gi + "_xbtn";
        var yKey = "gp_" + gi + "_ybtn";

        if (confirmBtn && !gpPrevButtons[confirmKey]) simulateKey("enter");
        if (cancelBtn && !gpPrevButtons[cancelKey]) simulateKey("back");
        if (xBtn && !gpPrevButtons[xKey]) simulateKey("kunai");
        if (yBtn && !gpPrevButtons[yKey]) simulateKey("codex");
        gpPrevButtons[confirmKey] = confirmBtn;
        gpPrevButtons[cancelKey] = cancelBtn;
        gpPrevButtons[xKey] = xBtn;
        gpPrevButtons[yKey] = yBtn;

        // Start/Options = pause
        var startBtn = gp.buttons.length > pauseBtnIdx && gp.buttons[pauseBtnIdx] && gp.buttons[pauseBtnIdx].pressed;
        var startKey = "gp_" + gi + "_pause";
        if (startBtn && !gpPrevButtons[startKey]) simulateKey("escape");
        gpPrevButtons[startKey] = startBtn;
    }
    requestAnimationFrame(pollGamepad);
}

function simulateKey(key) {
    var k = key.toLowerCase();
    // Codex open: escape/c/back/codex closes it
    if (codexIsOpen) {
        if (k === "escape" || k === "back" || k === "codex") { toggleCodex(); return; }
        return;
    }
    // Settings: navigate + adjust
    if (mState === "settings") {
        // Controller mapping listening
        if (gpMappingListening && gpMappingAction) {
            return; // Will be handled in pollGamepad button detection
        }
        var SETTINGS_TOTAL = settingsTab === "audio" ? 2 : (settingsTab === "keyboard" ? KEYMAP_ACTIONS.length + 1 : Object.keys(gpButtonMap).length + 2);
        if (k === "arrowup") { settingsIdx = Math.max(0, settingsIdx - 1); renderSettingsScreen(); }
        if (k === "arrowdown") { settingsIdx = Math.min(SETTINGS_TOTAL - 1, settingsIdx + 1); renderSettingsScreen(); }
        if (settingsTab === "audio") {
            if (k === "arrowleft") {
                if (settingsIdx === 0) { settingsState.sfxVol = Math.max(0, settingsState.sfxVol - 0.05); saveSettings(); renderSettingsScreen(); }
                else if (settingsIdx === 1) { settingsState.musicVol = Math.max(0, settingsState.musicVol - 0.05); saveSettings(); applySettings(); renderSettingsScreen(); }
            }
            if (k === "arrowright") {
                if (settingsIdx === 0) { settingsState.sfxVol = Math.min(1, settingsState.sfxVol + 0.05); saveSettings(); renderSettingsScreen(); }
                else if (settingsIdx === 1) { settingsState.musicVol = Math.min(1, settingsState.musicVol + 0.05); saveSettings(); applySettings(); renderSettingsScreen(); }
            }
        } else if (settingsTab === "keyboard") {
            if (k === "enter") {
                if (settingsIdx < KEYMAP_ACTIONS.length) {
                    keymapListening = true; keymapListeningAction = KEYMAP_ACTIONS[settingsIdx].id;
                    renderSettingsScreen();
                } else { resetKeymap(); renderSettingsScreen(); }
            }
        } else if (settingsTab === "controller") {
            if (k === "enter") {
                var gpActionIds = Object.keys(gpButtonMap);
                if (settingsIdx < gpActionIds.length) {
                    gpMappingListening = true; gpMappingAction = gpActionIds[settingsIdx];
                    renderSettingsScreen();
                } else if (settingsIdx === gpActionIds.length) {
                    localStorage.removeItem("snake_gp_mapping"); renderSettingsScreen();
                }
            }
        }
        if (k === "enter" && settingsTab === "audio") { exitSettings(); }
        if (k === "escape" || k === "back") { exitSettings(); }
        return;
    }
    // Setup screen navigation — difficulty + character combined
    // setupFocus: 0=difficoltà, 1=personaggio, 2=Indietro, 3=INIZIA PARTITA
    if (mState === "setup") {
        if (k === "arrowup") {
            if (setupFocus >= 2) setupFocus = 1;
            else setupFocus = Math.max(0, setupFocus - 1);
            renderSetupScreen();
        }
        if (k === "arrowdown") {
            if (setupFocus <= 1) setupFocus = 3;
            renderSetupScreen();
        }
        if (setupFocus === 0) {
            if (k === "arrowleft") { diffIdx = (diffIdx - 1 + DIFFICULTIES.length) % DIFFICULTIES.length; renderSetupScreen(); }
            if (k === "arrowright") { diffIdx = (diffIdx + 1) % DIFFICULTIES.length; renderSetupScreen(); }
        } else if (setupFocus === 1) {
            if (k === "arrowleft") { _charNav(-1); }
            if (k === "arrowright") { _charNav(1); }
        } else if (setupFocus === 2 || setupFocus === 3) {
            if (k === "arrowleft") { setupFocus = 2; renderSetupScreen(); }
            if (k === "arrowright") { setupFocus = 3; renderSetupScreen(); }
        }
        if (k === "enter") {
            if (setupFocus === 3) { confirmSetup(); }
            else if (setupFocus === 2) { mState = "slots"; showSlotMenu(); }
            else if (setupFocus === 0) { selectedDifficulty = DIFFICULTIES[diffIdx].id; renderSetupScreen(); }
        }
        if (k === "escape" || k === "back") { mState = "slots"; showSlotMenu(); }
        return;
    }
    // Secret shop navigation — PRIORITÀ ALTA, prima del game input
    // Layout 2D: A/D = sinistra/destra tra buff, S/W = scendi/sali tra riga buff e RIFIUTA
    if (mState === "secretshop") {
        var onRefuse = mIdx >= shopPicks.length;
        if (k === "arrowleft") {
            if (onRefuse) { mIdx = Math.max(0, (typeof shopBuffCol !== "undefined" ? shopBuffCol : 0)); }
            else { mIdx = Math.max(0, mIdx - 1); shopBuffCol = mIdx; }
            renderSecretShop();
        }
        if (k === "arrowright") {
            if (onRefuse) { mIdx = Math.min(shopPicks.length - 1, (typeof shopBuffCol !== "undefined" ? shopBuffCol : shopPicks.length - 1)); }
            else { mIdx = Math.min(shopPicks.length - 1, mIdx + 1); shopBuffCol = mIdx; }
            renderSecretShop();
        }
        if (k === "arrowdown") {
            if (!onRefuse) { shopBuffCol = mIdx; mIdx = shopPicks.length; }
            renderSecretShop();
        }
        if (k === "arrowup") {
            if (onRefuse) { mIdx = (typeof shopBuffCol !== "undefined" ? shopBuffCol : 0); }
            renderSecretShop();
        }
        if (k === "enter") {
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
        if (k === "escape" || k === "back") { closeSecretShop(false); }
        return;
    }
    if (running && !paused && relicDelay <= 0 && cdTimer <= 0) {
        if (k === "kunai" || k === " ") { useKunai(); return; }
        var map = { arrowup: [0, -1], arrowdown: [0, 1], arrowleft: [-1, 0], arrowright: [1, 0] };
        if (map[k]) { queueInput(G, map[k][0], map[k][1], fx); }
    }
    if (k === "escape") {
        if (mState === "slots" || mState === "dead" || mState === "codex") return;
        if (mState === "leveling" || relicDelay > 0 || cdTimer > 0) return;
        if (paused && mState !== "paused") return;
        if (running) { paused ? resumeGame() : pauseGame(); }
    }
    // "back" key: Circle/B — goes back in menus, pause in-game
    if (k === "back") {
        if (mState === "slots") return;
        if (mState === "leveling") return;
        if (mState === "paused") { resumeGame(); return; }
        if (mState === "setup") { mState = "slots"; showSlotMenu(); return; }
        if (mState === "settings") { exitSettings(); return; }
        if (mState === "secretshop") { closeSecretShop(false); return; }
        if (running && !paused && relicDelay <= 0 && cdTimer <= 0) { pauseGame(); return; }
    }
    // "codex" key: Y/Triangle — opens codex from slots or pause
    if (k === "codex") {
        if (mState === "slots" || mState === "paused") { toggleCodex(); return; }
    }
    if (mState === "slots") {
        var hasSaveData = mIdx < 3 && !!localStorage.getItem("snake_slot_" + (mIdx + 1));
        if (k === "arrowup") {
            if (slotDeleteFocused) { slotDeleteFocused = false; slotDeleteConfirm = false; slotDeleteConfirmIdx = -1; }
            else { mIdx = Math.max(0, mIdx - 1); if (mIdx > 3) mIdx = 3; }
            renderSlots();
        }
        if (k === "arrowdown") {
            if (slotDeleteFocused) { slotDeleteFocused = false; slotDeleteConfirm = false; slotDeleteConfirmIdx = -1; mIdx = 3; }
            else if (hasSaveData) { slotDeleteFocused = true; }
            else { mIdx = Math.min(3, mIdx + 1); }
            renderSlots();
        }
        if (k === "arrowleft") { slotDeleteFocused = false; slotDeleteConfirm = false; slotDeleteConfirmIdx = -1; mIdx = Math.max(0, Math.min(2, mIdx - 1)); renderSlots(); }
        if (k === "arrowright") { slotDeleteFocused = false; slotDeleteConfirm = false; slotDeleteConfirmIdx = -1; mIdx = Math.min(2, mIdx + 1); renderSlots(); }
        if (k === "enter") { handleSlotConfirm(); }
    } else if (mState === "leveling") {
        if (relicInputLocked) return;
        if (k === "arrowleft") { mIdx = (mIdx + picks.length - 1) % picks.length; renderRelics(); }
        if (k === "arrowright") { mIdx = (mIdx + 1) % picks.length; renderRelics(); }
        if (k === "enter") { if (picks[mIdx]) applyRelic(picks[mIdx]); }
    } else if (mState === "paused") {
        if (k === "arrowup") { mIdx = Math.max(0, mIdx - 1); OVC.querySelectorAll(".btn").forEach(function (b, i) { b.classList.toggle("selected", i === mIdx); }); }
        if (k === "arrowdown") { mIdx = Math.min(2, mIdx + 1); OVC.querySelectorAll(".btn").forEach(function (b, i) { b.classList.toggle("selected", i === mIdx); }); }
        if (k === "enter") { handlePauseConfirm(); }
    } else if (mState === "dead" && (k === "enter" || k === "back")) {
        showSlotMenu();
    }
}

// Start gamepad polling
requestAnimationFrame(pollGamepad);
