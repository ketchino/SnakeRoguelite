/* ===== DEBUG MENU ===== */
var debugIsOpen = false;
var debugPanel = null;
var debugKeysDown = {};
var debugRelicTab = "comune"; // Tab selezionato per reliquie
var _debugPausedMusic = false; // Traccia se la musica è stata messa in pausa dal debug

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
        // Pausa assoluta: ferma tutto il game loop
        clearInterval(loop);
        if (running) paused = true;

        // Pausa la musica
        _debugPausedMusic = false;
        if (typeof currentOstAudio !== 'undefined' && currentOstAudio && !currentOstAudio.paused) {
            currentOstAudio.pause();
            _debugPausedMusic = true;
        }

        document.body.classList.add('debug-open');
        debugPanel.classList.add('open');
        renderDebugPanel();
    } else {
        closeDebug();
    }
}

function closeDebug() {
    debugIsOpen = false;
    document.body.classList.remove('debug-open');
    if (debugPanel) debugPanel.classList.remove('open');

    // Riprendi la musica se era in riproduzione
    if (_debugPausedMusic && typeof currentOstAudio !== 'undefined' && currentOstAudio && currentOstAudio.paused) {
        currentOstAudio.play().catch(function() {});
        _debugPausedMusic = false;
    }

    // Riprendi solo se il gioco è in uno stato giocabile
    if (running && mState !== "paused" && mState !== "dead" && mState !== "leveling" && mState !== "slots" && mState !== "secretshop" && mState !== "settings") {
        paused = false; scheduleLoop();
    }
}

function debugAction(action) {
    // Permetti alcune azioni anche fuori dalla partita
    if (!G || !running) {
        // Azioni permesse fuori dal gioco
        if (action === "unlockcodex") {
            var codex = [];
            if (typeof ZONE_CODEX !== 'undefined') ZONE_CODEX.forEach(function(z, i) { codex.push("zone_" + i); });
            if (typeof CODEX_DB !== 'undefined') CODEX_DB.forEach(function(d) { codex.push(d.id); });
            if (typeof BOSS_CODEX !== 'undefined') BOSS_CODEX.forEach(function(b) {
                var bd = BOSS_DB.find(function(bb) { return bb.name === b.name; });
                if (bd) codex.push("boss_" + bd.id);
            });
            RELICS.forEach(function(r) { codex.push("rel_" + r.id); });
            if (typeof SECRET_CODEX !== 'undefined') SECRET_CODEX.forEach(function(sc) { codex.push(sc.id); });
            if (typeof SECRET_BUFFS !== 'undefined') SECRET_BUFFS.forEach(function(sb) { codex.push("secret_" + sb.id); });
            if (typeof saveCodex === 'function') saveCodex(codex);
            renderDebugPanel();
            return;
        }
        return;
    }
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
            G.hpMaxMod = (G.hpMaxMod || 0) + 1;
            addF(G.snake[0].x, G.snake[0].y, "+1 HP (MAX)", "#f87171");
            break;
        case "remhp":
            if (G.hp > 1) { G.hp--; G.hpMaxMod = (G.hpMaxMod || 0) - 1; addF(G.snake[0].x, G.snake[0].y, "-1 HP (MAX)", "#888"); }
            break;
        case "addseg1":
            var last1 = G.snake[G.snake.length - 1]; G.snake.push({ x: last1.x, y: last1.y });
            addF(G.snake[0].x, G.snake[0].y, "+1 SEG", "#5eead4");
            break;
        case "addseg5":
            for (var si = 0; si < 5; si++) { var last5 = G.snake[G.snake.length - 1]; G.snake.push({ x: last5.x, y: last5.y }); }
            addF(G.snake[0].x, G.snake[0].y, "+5 SEG", "#5eead4");
            break;
        case "addseg10":
            for (var si10 = 0; si10 < 10; si10++) { var last10 = G.snake[G.snake.length - 1]; G.snake.push({ x: last10.x, y: last10.y }); }
            addF(G.snake[0].x, G.snake[0].y, "+10 SEG", "#5eead4");
            break;
        case "remseg1":
            var minL1 = mL(G);
            if (G.snake.length > minL1) { G.snake.pop(); addF(G.snake[0].x, G.snake[0].y, "-1 SEG", "#f87171"); }
            else addF(G.snake[0].x, G.snake[0].y, "MINIMO!", "#888");
            break;
        case "remseg5":
            var minL5 = mL(G);
            var rem5 = Math.min(5, G.snake.length - minL5);
            for (var ri = 0; ri < rem5; ri++) G.snake.pop();
            addF(G.snake[0].x, G.snake[0].y, "-" + rem5 + " SEG", "#f87171");
            break;
        case "remseg10":
            var minL10 = mL(G);
            var rem10 = Math.min(10, G.snake.length - minL10);
            for (var ri10 = 0; ri10 < rem10; ri10++) G.snake.pop();
            addF(G.snake[0].x, G.snake[0].y, "-" + rem10 + " SEG", "#f87171");
            break;
        case "addxp":
            G.xp = G.xpNeed;
            addF(G.snake[0].x, G.snake[0].y, "LEVEL UP!", "#fbbf24");
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
            addF(G.snake[0].x, G.snake[0].y, "ZONA +", "#c084fc");
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
            G.crack = null;
            G.zoneIndex = Math.max(1, G.zoneIndex);
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
                if (r.bossRelic) return;
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

// Aggiungi una reliquia specifica scelta dal debug
function debugAddRelic(relicId) {
    if (!G || !running) return;
    var r = RELICS.find(function(p) { return p.id === relicId; });
    if (!r) return;
    if (r.noStack && G.relics.indexOf(r.id) !== -1) {
        r.fn(G);
    } else if (G.relics.indexOf(r.id) === -1) {
        G.relics.push(r.id);
        r.fn(G);
    } else {
        // Già posseduta e stackabile: applica di nuovo
        r.fn(G);
    }
    // Aggiungi alla barra reliquie
    resetRB(); renderedRC = 0;
    G.relics.forEach(function(id) {
        var rr = RELICS.find(function(p) { return p.id === id; }); if (!rr) return;
        var d = document.createElement("div"); d.className = "relic-icon";
        var tip = document.createElement("div"); tip.className = "tip";
        var tipB = document.createElement("b"); tipB.className = rcClass(rr.ra); tipB.textContent = rr.name;
        var tipSpan = document.createElement("span"); tipSpan.style.color = "#888"; tipSpan.textContent = rr.desc;
        tip.appendChild(tipB); tip.appendChild(document.createElement("br")); tip.appendChild(tipSpan);
        d.textContent = rr.icon; d.appendChild(tip); RBAR.appendChild(d); renderedRC++;
    });
    addF(G.snake[0].x, G.snake[0].y, r.icon + " " + r.name, "#fbbf24");
    discover("rel_" + r.id);
    save();
    updateHUD();
    renderDebugPanel();
}

function debugSetRelicTab(tab) {
    debugRelicTab = tab;
    renderDebugPanel();
}

function renderDebugPanel() {
    if (!debugPanel) return;
    var inGame = G && running;
    var header = '\
        <div class="debug-header">\
            <h2><span class="debug-close-btn" onclick="closeDebug()">&#10005;</span>\
            \uD83D\uDD27 DEBUG</h2>\
            <div class="debug-sub">Q+M PER CHIUDERE &bull; SOLO TEST</div>\
        </div>';

    if (!inGame) {
        // Costruisci la lista reliquie anche fuori dal gioco (per consultazione)
        var rarityOrder = ["comune", "raro", "epico", "leggendaria", "mitico"];
        var rarityLabels = { "comune": "\uD83D\uDFE2 COMUNE", "raro": "\uD83D\uDD35 RARO", "epico": "\uD83D\uDFE3 EPICO", "leggendaria": "\uD83D\uDFE1 LEGGENDARIA", "mitico": "\uD83D\uDD34 MITICO" };
        var relicListHtml = '';
        if (debugRelicTab) {
            var filtered = RELICS.filter(function(r) { return r.ra === debugRelicTab; });
            filtered.forEach(function(r) {
                var bossTag = r.bossRelic ? ' \uD83D\uDC51' : '';
                relicListHtml += '<div class="debug-relic-item" onclick="return false;">\
                    <span class="dri-icon">' + r.icon + '</span>\
                    <div class="dri-info"><span class="dri-name ' + rcClass(r.ra) + '">' + r.name + bossTag + '</span><span class="dri-desc">' + r.desc + '</span></div>\
                </div>';
            });
            if (!filtered.length) relicListHtml = '<div style="padding:8px;color:#555;font-size:11px;text-align:center;">Nessuna reliquia in questa categoria</div>';
        }

        debugPanel.innerHTML = header + '\
            <div class="debug-content">\
                <div class="debug-section">\
                    <div class="debug-section-title">\uD83C\uDFAF FUORI PARTITA</div>\
                    <div style="padding:6px 0;font-size:11px;color:#666;font-family:var(--fd);letter-spacing:1px;">\
                        Inizia una partita per usare tutti i cheat\
                    </div>\
                </div>\
                <div class="debug-section">\
                    <div class="debug-section-title">\uD83D\uDCDA UTILITÀ</div>\
                    ' + debugActionBtn("unlockcodex", "\uD83D\uDCDA", "SBLOCCA CODEX", "Scopri tutto il codex") + '\
                </div>\
                <div class="debug-section">\
                    <div class="debug-section-title">\uD83D\uDEE1\uFE0F RELIQUIE (CONSULTAZIONE)</div>\
                    <div style="padding:4px 0;font-size:10px;color:#555;font-family:var(--fd);letter-spacing:1px;">\
                        Lista completa delle reliquie disponibili\
                    </div>\
                    <div class="debug-relic-tabs">\
                        ' + rarityOrder.map(function(ra) {
                            return '<div class="debug-relic-tab' + (debugRelicTab === ra ? ' active' : '') + '" onclick="debugSetRelicTab(\'' + ra + '\')">' + rarityLabels[ra] + '</div>';
                        }).join('') + '\
                    </div>\
                    <div class="debug-relic-list">\
                        ' + relicListHtml + '\
                    </div>\
                </div>\
            </div>\
            <div class="debug-footer">DEBUG MENU &bull; NON PER IL GIOCO FINALE</div>';
        return;
    }

    var maxHp = 4 + (G.hpMaxMod || 0);
    var minLen = mL(G);
    var z = CZ(G);

    // Costruisci la lista reliquie per il tab selezionato
    var rarityOrder = ["comune", "raro", "epico", "leggendaria", "mitico"];
    var rarityLabels = { "comune": "\uD83D\uDFE2 COMUNE", "raro": "\uD83D\uDD35 RARO", "epico": "\uD83D\uDFE3 EPICO", "leggendaria": "\uD83D\uDFE1 LEGGENDARIA", "mitico": "\uD83D\uDD34 MITICO" };
    var relicListHtml = '';
    if (debugRelicTab) {
        var filtered = RELICS.filter(function(r) { return r.ra === debugRelicTab; });
        filtered.forEach(function(r) {
            var owned = G.relics.indexOf(r.id) !== -1;
            var bossTag = r.bossRelic ? ' \uD83D\uDC51' : '';
            relicListHtml += '<div class="debug-relic-item' + (owned ? ' owned' : '') + '" onclick="debugAddRelic(\'' + r.id + '\')">\
                <span class="dri-icon">' + r.icon + '</span>\
                <div class="dri-info"><span class="dri-name ' + rcClass(r.ra) + '">' + r.name + bossTag + (owned ? ' \u2705' : '') + '</span><span class="dri-desc">' + r.desc + '</span></div>\
            </div>';
        });
        if (!filtered.length) relicListHtml = '<div style="padding:8px;color:#555;font-size:11px;text-align:center;">Nessuna reliquia in questa categoria</div>';
    }

    debugPanel.innerHTML = header + '\
        <div class="debug-content">\
            <div class="debug-section">\
                <div class="debug-section-title">\uD83C\uDFAF STATO GIOCO</div>\
                <div style="padding:6px 0;font-size:11px;color:#666;font-family:var(--fd);letter-spacing:1px;">\
                    Zona: ' + (G.zoneIndex + 1) + '/' + ZONES.length + ' &bull; Lv: ' + G.level + ' &bull; HP: ' + G.hp + '/' + maxHp + ' &bull; Seg: ' + G.snake.length + '/' + minLen + '\
                </div>\
            </div>\
            <div class="debug-section">\
                <div class="debug-section-title">\u26A1 TOGGLE</div>\
                ' + debugToggleBtn("god", "\uD83D\uDEE1\uFE0F", "GOD MODE", "Invincibilità infinita", G._debugGod) + '\
                ' + debugToggleBtn("noclip", "\uD83D\uDC7B", "NO CLIP", "Attraversa ostacoli e muri", G._debugNoClip) + '\
                ' + debugToggleBtn("slowmo", "\uD83D\uDC0C", "SLOW MO", "Velocità dimezzata", G._debugSlowMo) + '\
            </div>\
            <div class="debug-section">\
                <div class="debug-section-title">\u2764\uFE0F VITE & HP</div>\
                ' + debugActionBtn("addhp", "\u2764\uFE0F", "+1 CUORE MAX", "Aumenta HP e cap massimo") + '\
                ' + debugActionBtn("remhp", "\uD83D\uDC94", "-1 CUORE MAX", "Riduce HP e cap massimo") + '\
            </div>\
            <div class="debug-section">\
                <div class="debug-section-title">\uD83D\uDC0D SEGMENTI</div>\
                <div style="padding:4px 0 6px;font-size:10px;color:#555;font-family:var(--fd);letter-spacing:1px;">\
                    Minimo attuale: ' + minLen + ' seg &bull; Attuali: ' + G.snake.length + '\
                </div>\
                ' + debugActionBtn("addseg1", "\u2795", "+1 SEGMENTO", "Aggiunge un segmento alla coda") + '\
                ' + debugActionBtn("addseg5", "\u2795", "+5 SEGMENTI", "Aggiunge cinque segmenti alla coda") + '\
                ' + debugActionBtn("addseg10", "\u2795", "+10 SEGMENTI", "Aggiunge dieci segmenti alla coda") + '\
                ' + debugActionBtn("remseg1", "\u2796", "-1 SEGMENTO", "Rimuove un segmento dalla coda") + '\
                ' + debugActionBtn("remseg5", "\u2796", "-5 SEGMENTI", "Rimuove cinque segmenti dalla coda") + '\
                ' + debugActionBtn("remseg10", "\u2796", "-10 SEGMENTI", "Rimuove dieci segmenti dalla coda") + '\
            </div>\
            <div class="debug-section">\
                <div class="debug-section-title">\u2B50 PROGRESSIONE</div>\
                ' + debugActionBtn("addxp", "\u2B50", "LEVEL UP", "Sale di livello subito") + '\
                ' + debugActionBtn("addmele", "\uD83C\uDF4E", "+5 MELE", "Aggiunge 5 mele/punti") + '\
            </div>\
            <div class="debug-section">\
                <div class="debug-section-title">\uD83D\uDDFA\uFE0F ZONA</div>\
                ' + debugActionBtn("nextzone", "\u27A1\uFE0F", "ZONA SUCCESSIVA", "Salta alla prossima zona") + '\
                ' + debugActionBtn("spawnboss", "\uD83E\uDD85", "SPAWN BOSS", "Evoca il boss della zona") + '\
                ' + debugActionBtn("spawncrack", "\uD83D\uDD57\uFE0F", "SPAWN CREPA", "Genera crepa shop segreto") + '\
                ' + debugActionBtn("killboss", "\uD83D\uDC80", "KILL BOSS", "Uccidi il boss attivo") + '\
            </div>\
            <div class="debug-section">\
                <div class="debug-section-title">\uD83D\uDCA5 AZIONI</div>\
                ' + debugActionBtn("killenemies", "\uD83D\uDC7E", "KILL NEMICI", "Rimuove tutti i nemici") + '\
                ' + debugActionBtn("clearobs", "\uD83E\uDDF9", "PULISCI MURI", "Rimuove tutti gli ostacoli") + '\
                ' + debugActionBtn("giveallrelics", "\uD83D\uDEE1\uFE0F", "TUTTE RELIQUIE", "Ottieni tutte le reliquie") + '\
                ' + debugActionBtn("unlockcodex", "\uD83D\uDCDA", "SBLOCCA CODEX", "Scopri tutto il codex") + '\
                ' + debugActionBtn("suicide", "\u2620\uFE0F", "SUICIDIO", "Game over immediato") + '\
            </div>\
            <div class="debug-section">\
                <div class="debug-section-title">\uD83D\uDEE1\uFE0F SELEZIONA RELIQUIA</div>\
                <div style="padding:4px 0 6px;font-size:10px;color:#555;font-family:var(--fd);letter-spacing:1px;">\
                    Clicca per aggiungere la reliquia scelta\
                </div>\
                <div class="debug-relic-tabs">\
                    ' + rarityOrder.map(function(ra) {
                        return '<div class="debug-relic-tab' + (debugRelicTab === ra ? ' active' : '') + '" onclick="debugSetRelicTab(\'' + ra + '\')">' + rarityLabels[ra] + '</div>';
                    }).join('') + '\
                </div>\
                <div class="debug-relic-list">\
                    ' + relicListHtml + '\
                </div>\
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
