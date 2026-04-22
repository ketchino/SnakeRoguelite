/* ===== DEBUG MENU ===== */
var debugIsOpen = false;
var debugPanel = null;
var debugKeysDown = {};

function initDebugPanel() {
    if (debugPanel) return;
    debugPanel = document.createElement("div");
    debugPanel.id = "debug-panel";
    debugPanel.onclick = function(e) { e.stopPropagation(); };
    document.body.appendChild(debugPanel);
}

function toggleDebug() {
    initDebugPanel();
    debugIsOpen = !debugIsOpen;
    if (debugIsOpen) {
        if (running && !paused) { paused = true; clearInterval(loop); }
        document.body.classList.add('debug-open');
        debugPanel.classList.add('open');
        renderDebugPanel();
    } else {
        document.body.classList.remove('debug-open');
        debugPanel.classList.remove('open');
        if (running && mState !== "paused" && mState !== "dead" && mState !== "leveling" && mState !== "slots" && mState !== "secretshop") {
            paused = false; scheduleLoop();
        }
    }
}

function closeDebug() {
    debugIsOpen = false;
    document.body.classList.remove('debug-open');
    if (debugPanel) debugPanel.classList.remove('open');
    if (running && mState !== "paused" && mState !== "dead" && mState !== "leveling" && mState !== "slots" && mState !== "secretshop") {
        paused = false; scheduleLoop();
    }
}

function debugAction(action) {
    if (!G || !running) return;
    // Ensure debug flags exist on G
    if (typeof G._debugGod === 'undefined') G._debugGod = false;
    if (typeof G._debugNoClip === 'undefined') G._debugNoClip = false;
    if (typeof G._debugSlowMo === 'undefined') G._debugSlowMo = false;
    switch (action) {
        case "god":
            G._debugGod = !G._debugGod;
            if (G._debugGod) { G.invincible = 999999; addF(G.snake[0].x, G.snake[0].y, "GOD MODE ON", "#ef4444"); }
            else { G.invincible = 0; addF(G.snake[0].x, G.snake[0].y, "GOD MODE OFF", "#888"); }
            break;
        case "noclip":
            G._debugNoClip = !G._debugNoClip;
            if (G._debugNoClip) addF(G.snake[0].x, G.snake[0].y, "NO CLIP ON", "#ef4444");
            else addF(G.snake[0].x, G.snake[0].y, "NO CLIP OFF", "#888");
            break;
        case "slowmo":
            G._debugSlowMo = !G._debugSlowMo;
            if (G._debugSlowMo) { G.spd *= 2; addF(G.snake[0].x, G.snake[0].y, "SLOW MO ON", "#ef4444"); }
            else { G.spd /= 2; addF(G.snake[0].x, G.snake[0].y, "SLOW MO OFF", "#888"); }
            scheduleLoop();
            break;
        case "addhp":
            G.hp++;
            addF(G.snake[0].x, G.snake[0].y, "+1 HP", "#f87171");
            break;
        case "addseg":
            for (var si = 0; si < 5; si++) { var last = G.snake[G.snake.length - 1]; G.snake.push({ x: last.x, y: last.y }); }
            addF(G.snake[0].x, G.snake[0].y, "+5 SEG", "#5eead4");
            break;
        case "addxp":
            G.xp = G.xpNeed;
            addF(G.snake[0].x, G.snake[0].y, "LEVEL UP!", "#fbbf24");
            // Trigger level up
            closeDebug();
            levelUp();
            return;
        case "addmele":
            G.score += 5; G.totalMeals += 5; G.zoneFood += 5;
            addF(G.snake[0].x, G.snake[0].y, "+5 MELE", "#fbbf24");
            updateZB();
            break;
        case "nextzone":
            G.zoneIndex++;
            G.zoneFood = 0;
            addF(G.snake[0].x, G.snake[0].y, "ZONA +" , "#c084fc");
            save();
            closeDebug();
            initZone();
            return;
        case "spawnboss":
            if (!G.boss || G.boss.defeated) {
                var bd = getBossForZone(G.zoneIndex);
                if (bd) {
                    closeDebug();
                    fx.onBossStart(bd);
                    return;
                } else {
                    addF(G.snake[0].x, G.snake[0].y, "NO BOSS QUI", "#888");
                }
            } else {
                addF(G.snake[0].x, G.snake[0].y, "BOSS GIA' ATTIVO", "#888");
            }
            break;
        case "spawncrack":
            var z = CZ(G);
            G.crack = null; // Reset
            G.zoneIndex = Math.max(1, G.zoneIndex); // Must be >= zone 1
            trySpawnCrack(G, z);
            if (G.crack) { addF(G.crack.x, G.crack.y, "CREPA!", "#fbbf24"); }
            else { addF(G.snake[0].x, G.snake[0].y, "NO SPAWN", "#888"); }
            break;
        case "killenemies":
            G.enemies.forEach(function(en) { spawnEP(en.x, en.y, "#a855f7"); });
            G.score += G.enemies.length * 3;
            G.enemies = [];
            addF(G.snake[0].x, G.snake[0].y, "NEMICI KILL", "#a855f7");
            break;
        case "clearobs":
            G.obstacles.forEach(function(o) { spawnDP(o.x, o.y); });
            G.obstacles = [];
            G.pendingObs = [];
            addF(G.snake[0].x, G.snake[0].y, "MURI PULITI", "#60a5fa");
            break;
        case "unlockcodex":
            var codex = [];
            ZONE_CODEX.forEach(function(z, i) { codex.push("zone_" + i); });
            CODEX_DB.forEach(function(d) { codex.push(d.id); });
            BOSS_CODEX.forEach(function(b) {
                var bd = BOSS_DB.find(function(bb) { return bb.name === b.name; });
                if (bd) codex.push("boss_" + bd.id);
            });
            RELICS.forEach(function(r) { codex.push("rel_" + r.id); });
            if (typeof SECRET_CODEX !== 'undefined') SECRET_CODEX.forEach(function(sc) { codex.push(sc.id); });
            if (typeof SECRET_BUFFS !== 'undefined') SECRET_BUFFS.forEach(function(sb) { codex.push("secret_" + sb.id); });
            saveCodex(codex);
            addF(G.snake[0].x, G.snake[0].y, "CODEX SBLOCCATO", "#fbbf24");
            break;
        case "killboss":
            if (G.boss && !G.boss.defeated) {
                G.boss.hp = 0; G.boss.defeated = true;
                fx.onBossDefeated();
                addF(G.snake[0].x, G.snake[0].y, "BOSS KILL!", "#ef4444");
            } else {
                addF(G.snake[0].x, G.snake[0].y, "NESSUN BOSS", "#888");
            }
            break;
        case "giveallrelics":
            var count = 0;
            RELICS.forEach(function(r) {
                if (r.bossRelic) return; // Skip boss relics
                if (r.noStack && G.relics.indexOf(r.id) !== -1) { r.fn(G); }
                else if (G.relics.indexOf(r.id) === -1) { G.relics.push(r.id); r.fn(G); count++; }
            });
            resetRB(); renderedRC = 0;
            G.relics.forEach(function(id) {
                var r = RELICS.find(function(p) { return p.id === id; }); if (!r) return;
                var d = document.createElement("div"); d.className = "relic-icon";
                var tip = document.createElement("div"); tip.className = "tip";
                var tipB = document.createElement("b"); tipB.className = rcClass(r.ra); tipB.textContent = r.name;
                var tipSpan = document.createElement("span"); tipSpan.style.color = "#888"; tipSpan.textContent = r.desc;
                tip.appendChild(tipB); tip.appendChild(document.createElement("br")); tip.appendChild(tipSpan);
                d.textContent = r.icon; d.appendChild(tip); RBAR.appendChild(d); renderedRC++;
            });
            addF(G.snake[0].x, G.snake[0].y, "+" + count + " RELIQUIE", "#fbbf24");
            updateHUD();
            break;
        case "suicide":
            G.hp = 0;
            G.deathCause = "Debug";
            closeDebug();
            showGameOver();
            return;
    }
    save();
    updateHUD();
    renderDebugPanel();
}

function renderDebugPanel() {
    if (!debugPanel) return;
    if (!G || !running) {
        debugPanel.innerHTML = '\
            <div class="debug-header">\
                <h2><span class="debug-close-btn" onclick="closeDebug()">&#10005;</span>\
                🔧 DEBUG</h2>\
                <div class="debug-sub">Q+M PER CHIUDERE &bull; SOLO TEST</div>\
            </div>\
            <div class="debug-content">\
                <div style="padding:40px 20px;text-align:center;color:#555;font-family:var(--fd);font-size:13px;letter-spacing:1px;">\
                    Inizia una partita per usare i cheat\
                </div>\
            </div>\
            <div class="debug-footer">DEBUG MENU &bull; NON PER IL GIOCO FINALE</div>';
        return;
    }
    var z = CZ(G);
    debugPanel.innerHTML = '\
        <div class="debug-header">\
            <h2><span class="debug-close-btn" onclick="closeDebug()">&#10005;</span>\
            🔧 DEBUG</h2>\
            <div class="debug-sub">Q+M PER CHIUDERE &bull; SOLO TEST</div>\
        </div>\
        <div class="debug-content">\
            <div class="debug-section">\
                <div class="debug-section-title">🎯 STATO GIOCO</div>\
                <div style="padding:6px 0;font-size:11px;color:#666;font-family:var(--fd);letter-spacing:1px;">\
                    Zona: ' + (G.zoneIndex + 1) + '/' + ZONES.length + ' &bull; Lv: ' + G.level + ' &bull; HP: ' + G.hp + ' &bull; Seg: ' + G.snake.length + '\
                </div>\
            </div>\
            <div class="debug-section">\
                <div class="debug-section-title">⚡ TOGGLE</div>\
                ' + debugToggleBtn("god", "🛡️", "GOD MODE", "Invincibilità infinita", G._debugGod) + '\
                ' + debugToggleBtn("noclip", "👻", "NO CLIP", "Attraversa ostacoli e muri", G._debugNoClip) + '\
                ' + debugToggleBtn("slowmo", "🐌", "SLOW MO", "Velocità dimezzata", G._debugSlowMo) + '\
            </div>\
            <div class="debug-section">\
                <div class="debug-section-title">❤️ STATISTICHE</div>\
                ' + debugActionBtn("addhp", "❤️", "+1 CUORE", "Aggiunge un cuore") + '\
                ' + debugActionBtn("addseg", "🐍", "+5 SEGMENTI", "Allunga il serpente") + '\
                ' + debugActionBtn("addxp", "⭐", "LEVEL UP", "Sale di livello subito") + '\
                ' + debugActionBtn("addmele", "🍎", "+5 MELE", "Aggiunge 5 mele/punti") + '\
            </div>\
            <div class="debug-section">\
                <div class="debug-section-title">🗺️ ZONA</div>\
                ' + debugActionBtn("nextzone", "➡️", "ZONA SUCCESSIVA", "Salta alla prossima zona") + '\
                ' + debugActionBtn("spawnboss", "🦅", "SPAWN BOSS", "Evoca il boss della zona") + '\
                ' + debugActionBtn("spawncrack", "🕳️", "SPAWN CREPA", "Genera crepa shop segreto") + '\
                ' + debugActionBtn("killboss", "💀", "KILL BOSS", "Uccidi il boss attivo") + '\
            </div>\
            <div class="debug-section">\
                <div class="debug-section-title">💥 AZIONI</div>\
                ' + debugActionBtn("killenemies", "👾", "KILL NEMICI", "Rimuove tutti i nemici") + '\
                ' + debugActionBtn("clearobs", "🧹", "PULISCI MURI", "Rimuove tutti gli ostacoli") + '\
                ' + debugActionBtn("giveallrelics", "🛡️", "TUTTE RELIQUIE", "Ottieni tutte le reliquie") + '\
                ' + debugActionBtn("unlockcodex", "📚", "SBLOCCA CODEX", "Scopri tutto il codex") + '\
                ' + debugActionBtn("suicide", "☠️", "SUICIDIO", "Game over immediato") + '\
            </div>\
        </div>\
        <div class="debug-footer">DEBUG MENU &bull; NON PER IL GIOCO FINALE</div>';
}

function debugToggleBtn(action, icon, name, desc, active) {
    return '<div class="debug-btn' + (active ? ' active' : '') + '" onclick="debugAction(\'' + action + '\')">\
        <span class="db-icon">' + icon + '</span>\
        <div class="db-info"><span class="db-name">' + name + (active ? ' ON' : '') + '</span><span class="db-desc">' + desc + '</span></div>\
    </div>';
}

function debugActionBtn(action, icon, name, desc) {
    return '<div class="debug-btn" onclick="debugAction(\'' + action + '\')">\
        <span class="db-icon">' + icon + '</span>\
        <div class="db-info"><span class="db-name">' + name + '</span><span class="db-desc">' + desc + '</span></div>\
    </div>';
}
