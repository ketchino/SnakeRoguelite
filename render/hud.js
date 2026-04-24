/* ===== HUD ===== */

// Timer di run — tiene traccia del tempo effettivo di gioco (esclusa la pausa)
var _timerAccum = 0;  // millisecondi accumulati di gioco effettivo
var _timerLastActive = 0; // timestamp dell'ultimo momento attivo
var _timerWasPaused = true; // traccia se eravamo in pausa nel frame precedente

function timerOnStart() {
    _timerAccum = 0;
    _timerLastActive = Date.now();
    _timerWasPaused = false;
}

function getTimerElapsed() {
    return Math.floor(_timerAccum / 1000);
}

function updateTimer() {
    var timerEl = document.getElementById("run-timer");
    if (!timerEl) return;
    // Nascondi il timer quando non si sta giocando
    if (!running || mState === "slots" || mState === "dead") {
        timerEl.style.display = "none";
        return;
    }
    // Aggiorna accumulo: se il gioco è attivo (non in pausa), conta il tempo
    var nowActive = running && !paused;
    if (nowActive) {
        if (_timerWasPaused) {
            // Transizione da pausa a attivo — resetta il riferimento
            _timerLastActive = Date.now();
        }
        _timerAccum += Date.now() - _timerLastActive;
        _timerLastActive = Date.now();
    }
    _timerWasPaused = !nowActive;

    timerEl.style.display = "";
    var elapsed = getTimerElapsed();
    var mins = Math.floor(elapsed / 60);
    var secs = elapsed % 60;
    var hrs = Math.floor(mins / 60);
    if (hrs > 0) {
        timerEl.innerHTML = "<span class=\"timer-icon\">⏱️</span> <span class=\"timer-hrs\">" + hrs + "</span>:<span class=\"timer-mins\">" + (mins % 60 < 10 ? "0" : "") + (mins % 60) + "</span>:<span class=\"timer-secs\">" + (secs < 10 ? "0" : "") + secs + "</span>";
    } else {
        timerEl.innerHTML = "<span class=\"timer-icon\">⏱️</span> <span class=\"timer-mins\">" + mins + "</span><span class=\"timer-colon\">:</span><span class=\"timer-secs\">" + (secs < 10 ? "0" : "") + secs + "</span>";
    }
}

function updateHUD() {
    if (!G) return;
    document.getElementById("hlv").textContent = "\u2B50 " + G.level;
    document.getElementById("hxp").textContent = "\u2728 " + G.xp + "/" + G.xpNeed;
    document.getElementById("hsc").textContent = "\uD83C\uDFC6 " + Math.floor(G.score);
    var maxHp = Math.max(1, 4 + (G.hpMaxMod || 0));
    document.getElementById("hhp").textContent = "\u2764\uFE0F " + G.hp + "/" + maxHp;
    var ls = document.getElementById("link-s"), lst = document.getElementById("link-st");
    if (G.link || G.linkCD > 0) {
        ls.style.display = "";
        lst.textContent = G.linkShield ? "\uD83D\uDEE1\uFE0F ATTIVO" : "\uD83D\uDD17 " + Math.ceil(G.linkCD / 1000) + "s";
        ls.className = G.linkShield ? "stat" : "stat off";
    } else ls.style.display = "none";
    var ks = document.getElementById("kunai-s"), kst = document.getElementById("kunai-st");
    if (G.kunai) {
        ks.style.display = "";
        kst.textContent = G.kunaiCDMS <= 0 ? "\u26A1 PRONTO" : "\u26A1 " + Math.ceil(G.kunaiCDMS / 1000) + "s";
        ks.className = G.kunaiCDMS <= 0 ? "stat" : "stat off";
    } else ks.style.display = "none";
    // Frammento del Vuoto indicator
    var fs = document.getElementById("frammento-s"), fst = document.getElementById("frammento-st");
    if (G.frammentovuoto && !G.kunai) {
        if (fs) {
            fs.style.display = "";
            fst.textContent = G.frammentoCD <= 0 ? "\uD83D\uDD2E PRONTO" : "\uD83D\uDD2E " + Math.ceil(G.frammentoCD / 1000) + "s";
            fs.className = G.frammentoCD <= 0 ? "stat" : "stat off";
        }
    } else {
        if (fs) fs.style.display = "none";
    }
    // Boss HP bar (rimossa barra inferiore ridondante — le info sono già nella zone-bar)
    while (renderedRC < G.relics.length) {
        var id = G.relics[renderedRC];
        var r = RELICS.find(function (p) { return p.id === id; });
        if (!r) { renderedRC++; continue; }
        var d = document.createElement("div"); d.className = "relic-icon pop";
        var tip = document.createElement("div"); tip.className = "tip";
        var tipB = document.createElement("b"); tipB.className = rcClass(r.ra); tipB.textContent = r.name;
        var tipSpan = document.createElement("span"); tipSpan.style.color = "#888"; tipSpan.textContent = r.desc;
        tip.appendChild(tipB); tip.appendChild(document.createElement("br")); tip.appendChild(tipSpan);
        d.textContent = r.icon; d.appendChild(tip); RBAR.appendChild(d);
        (function (el) { setTimeout(function () { el.classList.remove("pop"); }, 400); })(d);
        renderedRC++;
    }
    // Mostra maledizioni (secret buffs) nella relic bar con stile viola
    if (G.secretBuffs && G.secretBuffs.length) {
        var sbOffset = "_curse_";
        if (!window._renderedCurses) window._renderedCurses = [];
        // Aggiungi solo le maledizioni non ancora renderizzate
        G.secretBuffs.forEach(function(id) {
            if (window._renderedCurses.indexOf(id) !== -1) return;
            var b = SECRET_BUFFS.find(function (p) { return p.id === id; });
            if (!b) return;
            window._renderedCurses.push(id);
            var d = document.createElement("div"); d.className = "relic-icon pop curse-icon";
            d.setAttribute("data-curse-id", id);
            var tip = document.createElement("div"); tip.className = "tip";
            var tipB = document.createElement("b"); tipB.style.color = "#c084fc"; tipB.textContent = b.name;
            var tipSpan = document.createElement("span"); tipSpan.style.color = "#7c3aed"; tipSpan.textContent = b.desc;
            tip.appendChild(tipB); tip.appendChild(document.createElement("br")); tip.appendChild(tipSpan);
            d.textContent = b.icon; d.appendChild(tip); RBAR.appendChild(d);
            (function (el) { setTimeout(function () { el.classList.remove("pop"); }, 400); })(d);
        });
    }
}
function updateZB() {
    if (!G) return;
    var z = CZ(G), label = z.name;
    if (G.endlessCycle > 0) label += " (" + z.c + "x" + z.r + ")";
    var zoneProgEl = document.getElementById("zone-progress");
    var zoneNameEl = document.getElementById("zone-name");
    if (G.boss && !G.boss.defeated) {
        document.getElementById("zone-num").textContent = G.boss.icon + " BOSS";
        zoneNameEl.textContent = G.boss.name;
        zoneProgEl.style.width = Math.max(0, G.boss.hp / G.boss.maxHp * 100) + "%";
        var bossDef3 = null;
        for (var bd3i = 0; bd3i < BOSS_DB.length; bd3i++) { if (BOSS_DB[bd3i].id === G.boss.id) { bossDef3 = BOSS_DB[bd3i]; break; } }
        var gcTxt = bossDef3 ? G.boss.goldenCollected + "/" + bossDef3.goldenToDamage + " " + (G.boss.collectName || "DORATE") : "";
        document.getElementById("zone-next-txt").textContent = gcTxt + " \u2764\uFE0F " + G.boss.hp + "/" + G.boss.maxHp;
        // Applica colore specifico del boss alla zona-bar
        if (bossDef3 && bossDef3.color) {
            var bc = bossDef3.color;
            zoneNameEl.style.color = bc;
            zoneNameEl.style.textShadow = "0 0 10px " + h2r(bc, 0.5);
            zoneProgEl.style.background = "linear-gradient(90deg, " + bc + ", " + h2r(bc, 0.7) + ")";
            zoneProgEl.style.boxShadow = "0 0 8px " + h2r(bc, 0.4);
        }
    } else {
        var zi = G.zoneIndex < ZONES.length ? G.zoneIndex + 1 : "ONDA " + (G.endlessCycle + 1);
        var diffTag = G.difficulty === "peaceful" ? " \u2728" : G.difficulty === "hardcore" ? " \uD83D\uDD25" : "";
        document.getElementById("zone-num").textContent = "\uD83D\uDDFA\uFE0F ZONA " + zi + diffTag;
        zoneNameEl.textContent = label;
        zoneNameEl.style.color = "";
        zoneNameEl.style.textShadow = "";
        zoneProgEl.style.width = (G.zoneFood / z.tgt) * 100 + "%";
        zoneProgEl.style.background = "";
        zoneProgEl.style.boxShadow = "";
        document.getElementById("zone-next-txt").textContent = G.endlessCycle > 0 ? "\uD83D\uDCA1 ONDA " + (G.endlessCycle + 1) : "\uD83C\uDFAF " + G.zoneFood + "/" + z.tgt;
    }
}
