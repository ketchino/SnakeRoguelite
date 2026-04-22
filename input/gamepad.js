/* ===== GAMEPAD ===== */
var gpPrevButtons = {};
var gpPrevAxes = {};
var gpPrevDpad = {};
var gpDeadzone = 0.5;
var gpInputCooldown = 0;

function pollGamepad() {
    if (gpInputCooldown > 0) gpInputCooldown--;
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (var gi = 0; gi < gamepads.length; gi++) {
        var gp = gamepads[gi];
        if (!gp) continue;

        // Detect controller type for button mapping
        var gpId = (gp.id || "").toLowerCase();
        var isPlayStation = gpId.indexOf("playstation") !== -1 || gpId.indexOf("dualshock") !== -1 || gpId.indexOf("dualsense") !== -1 || gpId.indexOf("054c") !== -1;

        // D-pad as buttons: 12=Up, 13=Down, 14=Left, 15=Right
        var dpadBtnMap = [
            [12, "arrowup"], [13, "arrowdown"],
            [14, "arrowleft"], [15, "arrowright"]
        ];
        var dpadPressed = { up: false, down: false, left: false, right: false };

        for (var dbi = 0; dbi < dpadBtnMap.length; dbi++) {
            var bi = dpadBtnMap[dbi][0];
            var dirName = dpadBtnMap[dbi][1];
            var pressed = gp.buttons.length > bi && gp.buttons[bi] && gp.buttons[bi].pressed;
            var key = "gp_" + gi + "_" + bi;
            if (pressed && !gpPrevButtons[key] && gpInputCooldown <= 0) {
                simulateKey(dirName);
                gpInputCooldown = 2;
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
                if (dX < -0.5 && prevD.x >= -0.5 && !dpadPressed.left) { simulateKey("arrowleft"); gpInputCooldown = 2; }
                else if (dX > 0.5 && prevD.x <= 0.5 && !dpadPressed.right) { simulateKey("arrowright"); gpInputCooldown = 2; }
                if (dY < -0.5 && prevD.y >= -0.5 && !dpadPressed.up) { simulateKey("arrowup"); gpInputCooldown = 2; }
                else if (dY > 0.5 && prevD.y <= 0.5 && !dpadPressed.down) { simulateKey("arrowdown"); gpInputCooldown = 2; }
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
                simulateKey("arrowleft"); gpInputCooldown = 2;
            } else if (axisX > gpDeadzone && (!gpPrevAxes[gpKey] || gpPrevAxes[gpKey].x <= gpDeadzone) && !dpadPressed.right) {
                simulateKey("arrowright"); gpInputCooldown = 2;
            }
            if (axisY < -gpDeadzone && (!gpPrevAxes[gpKey] || gpPrevAxes[gpKey].y >= -gpDeadzone) && !dpadPressed.up) {
                simulateKey("arrowup"); gpInputCooldown = 2;
            } else if (axisY > gpDeadzone && (!gpPrevAxes[gpKey] || gpPrevAxes[gpKey].y <= gpDeadzone) && !dpadPressed.down) {
                simulateKey("arrowdown"); gpInputCooldown = 2;
            }
        }
        gpPrevAxes[gpKey] = { x: axisX, y: axisY };

        // Confirm/Cancel/Codex buttons
        // Xbox: A(0)=confirm, B(1)=cancel, Y(3)=codex
        // PlayStation: Cross(0)=confirm, Circle(1)=cancel, Triangle(3)=codex
        // Both: X/Square(2)=kunai ability in-game
        var confirmBtn = gp.buttons.length > 0 && gp.buttons[0] && gp.buttons[0].pressed;
        var cancelBtn = gp.buttons.length > 1 && gp.buttons[1] && gp.buttons[1].pressed;
        var xBtn = gp.buttons.length > 2 && gp.buttons[2] && gp.buttons[2].pressed;
        var yBtn = gp.buttons.length > 3 && gp.buttons[3] && gp.buttons[3].pressed;
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
        var startBtn = gp.buttons.length > 9 && gp.buttons[9] && gp.buttons[9].pressed;
        var startKey = "gp_" + gi + "_9";
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
    // Settings: escape/back goes back
    if (mState === "settings") {
        if (k === "escape" || k === "back" || k === "enter") { exitSettings(); return; }
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
        if (running && !paused && relicDelay <= 0 && cdTimer <= 0) { pauseGame(); return; }
    }
    // "codex" key: Y/Triangle — opens codex from slots or pause
    if (k === "codex") {
        if (mState === "slots" || mState === "paused") { toggleCodex(); return; }
    }
    if (mState === "slots") {
        if (k === "arrowup") { mIdx = Math.max(0, mIdx - 1); if (mIdx > 3) mIdx = 3; renderSlots(); }
        if (k === "arrowdown") { mIdx = Math.min(3, mIdx + 1); renderSlots(); }
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
