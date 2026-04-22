/* ===== HUD ===== */

function updateHUD() {
    if (!G) return;
    document.getElementById("hlv").textContent = "\u2B50 " + G.level;
    document.getElementById("hxp").textContent = "\u2728 " + G.xp + "/" + G.xpNeed;
    document.getElementById("hsc").textContent = "\uD83C\uDFC6 " + Math.floor(G.score);
    var maxHp = 4 + (G.hpMaxMod || 0);
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
    // Boss HP bar
    var bossBar = document.getElementById("boss-bar");
    if (bossBar && G.boss && !G.boss.defeated) {
        bossBar.style.display = "";
        var bossNameEl = document.getElementById("boss-name");
        bossNameEl.textContent = G.boss.icon + " " + G.boss.name;
        var hpPct = Math.max(0, G.boss.hp / G.boss.maxHp * 100);
        var bossHpEl = document.getElementById("boss-hp");
        bossHpEl.style.width = hpPct + "%";
        // Boss-specific color
        var bossDefCol = null;
        for (var bdci = 0; bdci < BOSS_DB.length; bdci++) { if (BOSS_DB[bdci].id === G.boss.id) { bossDefCol = BOSS_DB[bdci].color; break; } }
        if (bossDefCol) {
            bossNameEl.style.color = bossDefCol;
            bossNameEl.style.textShadow = "0 0 10px " + h2r(bossDefCol, 0.5);
            bossHpEl.style.background = "linear-gradient(90deg, " + bossDefCol + ", " + h2r(bossDefCol, 0.7) + ")";
            bossHpEl.style.boxShadow = "0 0 8px " + h2r(bossDefCol, 0.4);
        }
    } else if (bossBar) {
        bossBar.style.display = "none";
    }
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
    if (G.boss && !G.boss.defeated) {
        document.getElementById("zone-num").textContent = G.boss.icon + " BOSS";
        document.getElementById("zone-name").textContent = G.boss.name;
        document.getElementById("zone-progress").style.width = Math.max(0, G.boss.hp / G.boss.maxHp * 100) + "%";
        var bossDef3 = null;
        for (var bd3i = 0; bd3i < BOSS_DB.length; bd3i++) { if (BOSS_DB[bd3i].id === G.boss.id) { bossDef3 = BOSS_DB[bd3i]; break; } }
        var gcTxt = bossDef3 ? G.boss.goldenCollected + "/" + bossDef3.goldenToDamage + " " + (G.boss.collectName || "DORATE") : "";
        document.getElementById("zone-next-txt").textContent = gcTxt + " \u2764\uFE0F " + G.boss.hp + "/" + G.boss.maxHp;
    } else {
        var zi = G.zoneIndex < ZONES.length ? G.zoneIndex + 1 : "ONDA " + (G.endlessCycle + 1);
        document.getElementById("zone-num").textContent = "\uD83D\uDDFA\uFE0F ZONA " + zi;
        document.getElementById("zone-name").textContent = label;
        document.getElementById("zone-progress").style.width = (G.zoneFood / z.tgt) * 100 + "%";
        document.getElementById("zone-next-txt").textContent = G.endlessCycle > 0 ? "\uD83D\uDCA1 ONDA " + (G.endlessCycle + 1) : "\uD83C\uDFAF " + G.zoneFood + "/" + z.tgt;
    }
}
