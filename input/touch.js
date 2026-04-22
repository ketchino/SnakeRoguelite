/* ===== TOUCH ===== */
var tSX = 0, tSY = 0, tST = 0, lastTap = 0;
document.addEventListener("touchstart", function (e) { var t = e.touches[0]; tSX = t.clientX; tSY = t.clientY; tST = Date.now(); }, { passive: true });
document.addEventListener("touchmove", function (e) { e.preventDefault(); }, { passive: false });
document.addEventListener("touchend", function (e) {
    var t = e.changedTouches[0], dx = t.clientX - tSX, dy = t.clientY - tSY, tdt = Date.now() - tST, now = Date.now();
    if (now - lastTap < 300 && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
        lastTap = 0;
        if (mState === "leveling" || relicDelay > 0 || cdTimer > 0) return;
        paused ? resumeGame() : pauseGame();
        return;
    }
    lastTap = now;
    if (tdt > 350 || (Math.abs(dx) < 15 && Math.abs(dy) < 15)) return;
    if (Math.abs(dx) > Math.abs(dy)) queueInput(G, dx > 0 ? 1 : -1, 0, fx);
    else queueInput(G, 0, dy > 0 ? 1 : -1, fx);
}, { passive: true });
