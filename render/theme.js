/* ===== TEMA & LAYOUT ===== */

function applyTheme(z) {
    document.documentElement.style.setProperty("--accent", z.ui);
    document.body.style.background = z.bg;
    CONT.style.borderColor = z.bdr;
    CONT.style.boxShadow = "0 0 50px " + h2r(z.ui, 0.08) + ",0 0 100px " + h2r(z.ui, 0.03) + ",inset 0 0 30px rgba(0,0,0,.3)";
    G.portal ? CONT.classList.add("portal-active") : CONT.classList.remove("portal-active");
}
function resetTheme() {
    document.documentElement.style.setProperty("--accent", "#1D9E75");
    document.body.style.background = "#08080c";
    CONT.style.borderColor = "rgba(255,255,255,.07)";
    CONT.style.boxShadow = "0 0 60px rgba(0,0,0,.6),inset 0 0 40px rgba(0,0,0,.3)";
    CONT.classList.remove("portal-active");
}
function setMS(w, h) { CONT.style.width = w + "px"; CONT.style.height = h + "px"; CONT.style.transform = ""; }
function unsetMS() { CONT.style.width = ""; CONT.style.height = ""; fitC(); }
function fitC() {
    if (!running && mState !== "paused" && mState !== "dead") return;
    var mw = window.innerWidth - 110, mh = window.innerHeight - 90;
    var s = Math.min(1, mw / C.width, mh / C.height);
    CONT.style.transform = "scale(" + s + ")"; CONT.style.transformOrigin = "center center";
}
function showBanner(zoneNum, zoneName, cb) {
    bannerOn = true;
    BANNER_NUM.textContent = zoneNum;
    BANNER_NAME.textContent = zoneName;
    ZB.style.opacity = "1";
    setTimeout(function () { ZB.style.opacity = "0"; bannerOn = false; if (cb) cb(); }, 1800);
}
function showOv() { OV.style.display = "flex"; SIDE_PANEL.style.opacity = "0.15"; }
function hideOv() { OV.style.display = "none"; SIDE_PANEL.style.opacity = "1"; }
function resetRB() { RBAR.textContent = ""; renderedRC = 0; window._renderedCurses = []; }
