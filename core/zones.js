/* ===== ZONE & MENU CORE ===== */

function startSlot(s) {
    var raw = localStorage.getItem("snake_slot_" + s);
    G = null;
    if (raw) { try { G = JSON.parse(raw); } catch(e) { G = null; localStorage.removeItem("snake_slot_" + s); } }
    if (G && (typeof G.snake === "undefined" || typeof G.hp !== "number" || G.hp <= 0)) {
        G = null;
        localStorage.removeItem("snake_slot_" + s);
    }
    if (!G) {
        G = { snake: [{ x: 7, y: 7 }, { x: 6, y: 7 }], dir: { x: 1, y: 0 }, inputBuffer: [], foods: [], score: 0, hp: 4, level: 1, xp: 0, xpNeed: 5, xpm: 1, spd: 1, spf: 1, zoneIndex: 0, zoneFood: 0, relics: [], currentSlot: s, obstacles: [], enemies: [], traps: [], isSpawning: false, spawnLeft: 0, totalMeals: 0, stonksMeals: 0, endlessCycle: 0, runStart: Date.now() };
    }
    var D = { zoneIndex: 0, zoneFood: 0, inputBuffer: [], isSpawning: false, kunaiImmunity: 0, spawnLeft: 0, vortex: false, totalMeals: 0, stonksMeals: 0, stonks: false, lofi: false, nokia: false, nokiaSlow: 0, portal: false, slurp: false, slurpTick: 0, sonic: false, hulk: false, lag: false, cheese: false, endlessCycle: 0, obstacles: [], enemies: [], traps: [], foods: [], relics: [], sabbia: false, tronco: false, rosario: false, moneta: false, dado: false, pane: false, bigtop: false, pirla: false, nyan: false, gommu: false, arrow: false, arrowSpd: 1, trappola: false, nostalgia: false, nabbo: false, praise: false, guscio: false, unoReverse: false, linkShield: false, linkCD: 0, eruzione: false, praiseCnt: 0, eruzioneCnt: 0, kunai: false, kunaiCDMS: 0, bigtopTicks: 0, runStart: Date.now(), deathCause: "", pendingObs: [], regenTick: 0, boss: null, bossDefeated: [], piuma: false, invincible: 0, crack: null, hpMaxMod: 0, cuoreAntico: false, cuoreAnticoMeals: 0, sguardoVuoto: false, pelleMuta: false, pelleMutaTick: 0, ricordoSbiadito: false, ricordoUsed: false, ombraLunga: false, ombraTrail: [], fameEterna: false, secretBuffs: [], _debugGod: false, _debugNoClip: false, _debugSlowMo: false, occhiolupo: false, linguarospo: false, coronatiranno: false, coronaMeals: 0, scagliadraga: false, scagliaCD: 0, frammentovuoto: false, frammentoCD: 0, pelleprimordiale: false };
    for (var k in D) if (typeof G[k] === "undefined") G[k] = D[k];
    // Clamp zoneIndex to valid range and validate zone-related data
    if (typeof G.zoneIndex !== "number" || isNaN(G.zoneIndex) || G.zoneIndex < 0) G.zoneIndex = 0;
    if (typeof G.zoneFood !== "number" || isNaN(G.zoneFood) || G.zoneFood < 0) G.zoneFood = 0;
    G.obstacles = Array.isArray(G.obstacles) ? G.obstacles.map(function (o) { return { x: o.x, y: o.y, type: o.type || "normal" }; }) : [];
    G.traps = Array.isArray(G.traps) ? G.traps : [];
    G.enemies = Array.isArray(G.enemies) ? G.enemies : [];
    G.foods = Array.isArray(G.foods) ? G.foods : [];
    G.bossDefeated = Array.isArray(G.bossDefeated) ? G.bossDefeated : [];
    relicDelay = 0; cdTimer = 0; particles = []; floats = []; shakeI = 0; screenFlash = 0; gridPulse = 0;
    resetRB(); renderedRC = 0;
    G.relics.forEach(function (id) {
        var r = RELICS.find(function (p) { return p.id === id; }); if (!r) return;
        var d = document.createElement("div"); d.className = "relic-icon";
        var tip = document.createElement("div"); tip.className = "tip";
        var tipB = document.createElement("b"); tipB.className = rcClass(r.ra); tipB.textContent = r.name;
        var tipSpan = document.createElement("span"); tipSpan.style.color = "#888"; tipSpan.textContent = r.desc;
        tip.appendChild(tipB); tip.appendChild(document.createElement("br")); tip.appendChild(tipSpan);
        d.textContent = r.icon; d.appendChild(tip); RBAR.appendChild(d); renderedRC++;
    });
    initAudio();
    if (codexFab) codexFab.style.display = "none";
    if (codexPanel) { codexPanel.classList.remove('open'); document.body.classList.remove('codex-open'); codexIsOpen = false; }
    setTimeout(function() { try { sEat(); } catch(e){} }, 100); applyTheme(CZ(G)); hideOv(); running = true; paused = true; mState = "";
    stopMusic(); startMusic();
    setTimeout(function () { initZone(); }, 40);
}

function initZone() {
    var z = CZ(G); 
    discover("zone_" + G.zoneIndex);
    G.zoneCrackUsed = false; // Reset: può spawnare una crepa nella nuova zona
    
    C.width = z.c * CS; C.height = z.r * CS;
    unsetMS(); applyTheme(z);
    // If boss is active, skip normal spawning
    if (G.boss && !G.boss.defeated) {
        G.traps = []; G.pendingObs = []; G.regenTick = 0;
        var sLen = Math.max(mL(G), G.snake.length);
        var sx = Math.floor(z.c / 2), sy = Math.floor(z.r / 2);
        G._targetSpawnLen = sLen;
        G.snake = [{ x: sx, y: sy }];
        G.inputBuffer = [];
        initAmb(); updateHUD(); updateZB();
        ZONE_BAR.style.display = "";
        paused = true; clearInterval(loop);
        G.preZoneSpawn = true;
        // Cambia OST per la zona del boss
        if (typeof onZoneMusicChange === "function") onZoneMusicChange(G.zoneIndex);
        showBanner(G.boss.icon + " BOSS", G.boss.name, function () {
            setTimeout(function () { cdTimer = 3; }, 0);
        });
        return;
    }
    G.obstacles = []; G.enemies = []; G.traps = [];
    G.pendingObs = []; G.regenTick = 0;
    spawnObs(G, CZ(G), z.obs, "normal"); spawnObs(G, CZ(G), z.frag, "fragile"); spawnObs(G, CZ(G), z.expl, "explosive");
    for (var i = 0; i < z.patr; i++) spawnEn(G, CZ(G), "patrol");
    for (var i = 0; i < z.hunt; i++) spawnEn(G, CZ(G), "hunter");
    // Always respawn food fresh - saved food positions may be out of zone grid bounds
    G.foods = [];
    var f = spawnFood(G, CZ(G)); if (f) G.foods = [f];
    if (G.bigtop) G.bigtopTicks = 5;
    var sLen = Math.max(mL(G), G.snake.length);
    var sx = Math.floor(z.c / 2), sy = Math.floor(z.r / 2);
    G._targetSpawnLen = sLen;
    G.snake = [{ x: sx, y: sy }];
    G.inputBuffer = [];
    initAmb(); updateHUD(); updateZB();
    ZONE_BAR.style.display = "";
    var zi = G.zoneIndex < ZONES.length ? G.zoneIndex + 1 : "ONDA " + (G.endlessCycle + 1);
    var zNum = "\uD83D\uDDFA\uFE0F ZONA " + zi;
    var zName = G.zoneIndex < ZONES.length ? z.name : "IL VUOTO ABISSALE";
    paused = true; clearInterval(loop);
    G.preZoneSpawn = true;
    // Cambia OST per la nuova zona
    if (typeof onZoneMusicChange === "function") onZoneMusicChange(G.zoneIndex);
    showBanner(zNum, zName, function () {
        setTimeout(function () { cdTimer = 3; }, 0);
    });
}

function levelUp() {
    paused = true; clearInterval(loop); mState = "leveling";
    if (codexFab) codexFab.style.display = "none";
    setMS(640, 500);
    G.xp -= G.xpNeed; G.level++; G.xpNeed = Math.floor(G.xpNeed * 1.6);
    picks = [];
    var pool = RELICS.filter(function(r) {
        if (r.w <= 0) return false;
        if (r.bossRelic) {
            // Boss relic: include nella pool solo se il boss è già stato sconfitto in una run precedente
            var bossId = null;
            var bossMap = {piuma:"corvo",occhiolupo:"lupo",linguarospo:"rospo",coronatiranno:"tiranno",scagliadraga:"draga",frammentovuoto:"vuoto",pelleprimordiale:"primordiale"};
            bossId = bossMap[r.id];
            if (!bossId) return false;
            // Deve essere stato sconfitto E aver già ricevuto la reliquia (bossRelicsAwarded)
            return G.bossDefeated && G.bossDefeated.indexOf(bossId) !== -1 &&
                   G.bossRelicsAwarded && G.bossRelicsAwarded.indexOf(bossId) !== -1;
        }
        return true;
    });
    var pickCount = Math.min(3, pool.length);
    for (var i = 0; i < pickCount && pool.length; i++) {
        var tw = pool.reduce(function (a, b) { return a + b.w; }, 0);
        var r = Math.random() * tw, s = 0;
        for (var j = 0; j < pool.length; j++) { s += pool[j].w; if (r <= s) { picks.push(pool.splice(j, 1)[0]); break; } }
    }
    mIdx = Math.min(1, picks.length - 1);
    relicInputLocked = true;
    sLvl(); renderRelics(); showOv();
    setTimeout(function() { 
        relicInputLocked = false; 
        var pickDiv = document.querySelector('.relic-pick');
        if(pickDiv) pickDiv.classList.remove('locked');
    }, 1000);
}
function renderRelics() {
    OVC.textContent = "";
    var h2 = document.createElement("h2"); h2.style.cssText = "font-family:var(--fd);color:var(--accent);font-size:24px;letter-spacing:3px"; h2.textContent = "\u2B50 LIVELLO " + G.level; OVC.appendChild(h2);
    var sub = document.createElement("p"); sub.className = "sub"; sub.textContent = "\uD83D\uDEE1\uFE0F Scegli un potenziamento"; OVC.appendChild(sub);
    var pickDiv = document.createElement("div"); 
    pickDiv.className = "relic-pick" + (relicInputLocked ? " locked" : "");
    picks.forEach(function (r, i) {
        var btn = document.createElement("div"); btn.className = "btn relic-btn" + (i === mIdx ? " selected" : "");
        var iconB = document.createElement("b"); iconB.textContent = r.icon;
        var nameSpan = document.createElement("span"); nameSpan.className = "rn " + rcClass(r.ra); nameSpan.textContent = r.name;
        var raDiv = document.createElement("div"); raDiv.className = "rl " + rcClass(r.ra); raDiv.textContent = r.ra.toUpperCase();
        var descSmall = document.createElement("small"); descSmall.textContent = r.desc;
        btn.appendChild(iconB); btn.appendChild(nameSpan); btn.appendChild(raDiv); btn.appendChild(descSmall);
        btn.onclick = function () { applyRelic(r); }; pickDiv.appendChild(btn);
    });
    OVC.appendChild(pickDiv);
}
function applyRelic(r) {
    if (relicInputLocked) return;
    discover("rel_" + r.id);
    if (r.noStack && G.relics.indexOf(r.id) !== -1) {
        r.fn(G);
    } else {
        G.relics.push(r.id);
        r.fn(G);
    }
    save(); hideOv(); unsetMS(); mState = ""; paused = true; relicDelay = 900; if (codexFab) codexFab.style.display = "block";
}

/* ===== RARITY ORDER (rarest first) ===== */
var RA_ORDER = { "mitico": 0, "leggendaria": 1, "epico": 2, "raro": 3, "comune": 4 };

function renderRelList() {
    var wrap = document.createElement("div"); wrap.className = "rel-list";
    if (!G.relics.length && !(G.secretBuffs && G.secretBuffs.length)) {
        var empty = document.createElement("div"); empty.style.cssText = "color:#555;font-size:12px"; empty.textContent = "\uD83D\uDEE1\uFE0F Nessuna reliquia"; wrap.appendChild(empty);
    } else {
        // Raggruppa reliquie per id (per conteggio e somma stats)
        var rCount = {};
        G.relics.forEach(function(id) { rCount[id] = (rCount[id] || 0) + 1; });
        // Ordina per rarità (raro → comune)
        var sortedIds = Object.keys(rCount).sort(function(a, b) {
            var ra = RELICS.find(function(p) { return p.id === a; });
            var rb = RELICS.find(function(p) { return p.id === b; });
            var oa = ra ? (RA_ORDER[ra.ra] !== undefined ? RA_ORDER[ra.ra] : 9) : 9;
            var ob = rb ? (RA_ORDER[rb.ra] !== undefined ? RA_ORDER[rb.ra] : 9) : 9;
            return oa - ob;
        });
        sortedIds.forEach(function(id) {
            var r = RELICS.find(function(p) { return p.id === id; }); if (!r) return;
            var count = rCount[id];
            var row = document.createElement("div"); row.className = "rel-row";
            var icon = document.createElement("span"); icon.className = "rri"; icon.textContent = r.icon;
            var inner = document.createElement("div");
            var nameSpan = document.createElement("span"); nameSpan.className = "rrn " + rcClass(r.ra); nameSpan.textContent = r.name;
            var descSpan = document.createElement("span"); descSpan.className = "rrd"; descSpan.textContent = r.desc;
            inner.appendChild(nameSpan); inner.appendChild(descSpan); row.appendChild(icon); row.appendChild(inner);
            if (count > 1) {
                var cnt = document.createElement("span"); cnt.className = "rr-count"; cnt.textContent = "x" + count; row.appendChild(cnt);
            }
            wrap.appendChild(row);
        });
        // Aggiungi maledizioni (secret buffs) con stile viola
        if (G.secretBuffs && G.secretBuffs.length) {
            G.secretBuffs.forEach(function(id) {
                var b = SECRET_BUFFS.find(function(p) { return p.id === id; }); if (!b) return;
                var row = document.createElement("div"); row.className = "rel-row curse-row";
                var icon = document.createElement("span"); icon.className = "rri"; icon.textContent = b.icon;
                var inner = document.createElement("div");
                var nameSpan = document.createElement("span"); nameSpan.className = "rrn"; nameSpan.textContent = b.name;
                var descSpan = document.createElement("span"); descSpan.className = "rrd"; descSpan.textContent = b.desc;
                inner.appendChild(nameSpan); inner.appendChild(descSpan); row.appendChild(icon); row.appendChild(inner);
                wrap.appendChild(row);
            });
        }
    }
    return wrap;
}

function pauseGame() {
    if (mState === "slots" || mState === "dead" || mState === "codex" || mState === "settings") return;
    if (mState === "leveling" || relicDelay > 0 || cdTimer > 0) return;
    if (!running) return;
    paused = true; clearInterval(loop); mState = "paused"; mIdx = 0;
    setMS(640, 500); OVC.textContent = "";
    if (codexFab) codexFab.style.display = "block";
    if (typeof playPauseMusic === "function") playPauseMusic();

    // Layout a due colonne: reliquie a sinistra, bottoni a destra
    var layout = document.createElement("div"); layout.className = "pause-layout";

    // --- COLONNA SINISTRA: Lista reliquie ---
    var relicsSide = document.createElement("div"); relicsSide.className = "pause-relics-side";
    var relTitle = document.createElement("h2");
    relTitle.style.cssText = "font-family:var(--fd);color:var(--accent);font-size:18px;letter-spacing:3px;margin-bottom:4px";
    relTitle.textContent = "\uD83D\uDEE1\uFE0F RELIQUIE";
    relicsSide.appendChild(relTitle);

    var totalRelics = G.relics.length;
    var totalCurses = (G.secretBuffs || []).length;
    var rCount = {};
    G.relics.forEach(function(id) { rCount[id] = (rCount[id] || 0) + 1; });

    // Sottotitolo conteggio
    var relSub = document.createElement("div"); relSub.className = "prp-sub"; relSub.style.cssText = "margin-bottom:10px";
    relSub.textContent = totalRelics + " reliquie" + (totalCurses > 0 ? " \u2022 " + totalCurses + " maledizioni" : "");
    relicsSide.appendChild(relSub);

    // Stat chips \u2014 somma totale effetti
    var stats = [];
    var bonusHp = 0, bonusSpd = 0, bonusXpm = 0, bonusSpf = 0;
    Object.keys(rCount).forEach(function(id) {
        var r = RELICS.find(function(p) { return p.id === id; });
        if (!r) return;
        var c = rCount[id];
        if (id === "shield") bonusHp += c;
        if (id === "speed") bonusSpd += c;
        if (id === "apple") bonusXpm += c;
        if (id === "greed") bonusSpf += c;
        if (id === "god") { bonusHp += 2 * c; bonusXpm += c; }
        if (id === "omni") { bonusHp += 3 * c; bonusSpf += 2 * c; bonusXpm += c; }
        if (id === "occhiolupo") bonusHp += c;
    });
    if (bonusHp > 0) stats.push("HP +" + bonusHp);
    if (bonusSpf > 0) stats.push("Mele +" + bonusSpf);
    if (bonusXpm > 0) stats.push("XP x" + (1 + bonusXpm * 0.5));
    if (bonusSpd > 0) stats.push("Velocita +" + (bonusSpd * 15) + "%");

    if (stats.length) {
        var statsDiv = document.createElement("div"); statsDiv.className = "prp-stats";
        stats.forEach(function(s) {
            var chip = document.createElement("div"); chip.className = "prp-stat-chip";
            var parts = s.split(" ");
            chip.textContent = parts[0] + " ";
            var b = document.createElement("b"); b.textContent = parts.slice(1).join(" ");
            chip.appendChild(b);
            statsDiv.appendChild(chip);
        });
        relicsSide.appendChild(statsDiv);
    }

    // Reliquie ordinate per rarit\u00e0 con titoli di sezione
    if (totalRelics > 0) {
        var sortedIds = Object.keys(rCount).sort(function(a, b) {
            var ra = RELICS.find(function(p) { return p.id === a; });
            var rb = RELICS.find(function(p) { return p.id === b; });
            var oa = ra ? (RA_ORDER[ra.ra] !== undefined ? RA_ORDER[ra.ra] : 9) : 9;
            var ob = rb ? (RA_ORDER[rb.ra] !== undefined ? RA_ORDER[rb.ra] : 9) : 9;
            return oa - ob;
        });
        var currentRa = "";
        sortedIds.forEach(function(id) {
            var r = RELICS.find(function(p) { return p.id === id; }); if (!r) return;
            if (r.ra !== currentRa) {
                currentRa = r.ra;
                var secTitle = document.createElement("div"); secTitle.className = "prp-section-title";
                var raLabels = { mitico: "MITICO", leggendaria: "LEGGENDARIA", epico: "EPICO", raro: "RARO", comune: "COMUNE" };
                secTitle.textContent = raLabels[currentRa] || currentRa.toUpperCase();
                relicsSide.appendChild(secTitle);
            }
            var count = rCount[id];
            var row = document.createElement("div"); row.className = "rel-row";
            var icon = document.createElement("span"); icon.className = "rri"; icon.textContent = r.icon;
            var inner = document.createElement("div");
            var nameSpan = document.createElement("span"); nameSpan.className = "rrn " + rcClass(r.ra); nameSpan.textContent = r.name;
            var descSpan = document.createElement("span"); descSpan.className = "rrd"; descSpan.textContent = r.desc;
            inner.appendChild(nameSpan); inner.appendChild(descSpan); row.appendChild(icon); row.appendChild(inner);
            if (count > 1) {
                var cnt = document.createElement("span"); cnt.className = "rr-count"; cnt.textContent = "x" + count; row.appendChild(cnt);
            }
            relicsSide.appendChild(row);
        });
    }

    // Sezione Maledizioni
    if (totalCurses > 0) {
        var curseTitle = document.createElement("div"); curseTitle.className = "prp-section-title curse-title";
        curseTitle.textContent = "MALEDIZIONI";
        relicsSide.appendChild(curseTitle);
        G.secretBuffs.forEach(function(id) {
            var b = SECRET_BUFFS.find(function(p) { return p.id === id; }); if (!b) return;
            var row = document.createElement("div"); row.className = "rel-row curse-row";
            var icon = document.createElement("span"); icon.className = "rri"; icon.textContent = b.icon;
            var inner = document.createElement("div");
            var nameSpan = document.createElement("span"); nameSpan.className = "rrn"; nameSpan.textContent = b.name;
            var descSpan = document.createElement("span"); descSpan.className = "rrd"; descSpan.textContent = b.desc;
            inner.appendChild(nameSpan); inner.appendChild(descSpan); row.appendChild(icon); row.appendChild(inner);
            relicsSide.appendChild(row);
        });
    }

    if (totalRelics === 0 && totalCurses === 0) {
        var empty = document.createElement("div"); empty.style.cssText = "color:#555;font-size:12px;text-align:center;margin-top:20px";
        empty.textContent = "Nessuna reliquia o maledizione";
        relicsSide.appendChild(empty);
    }

    // --- COLONNA DESTRA: Bottoni pausa ---
    var btnsSide = document.createElement("div"); btnsSide.className = "pause-btns-side";
    var h2 = document.createElement("h2");
    h2.style.cssText = "font-family:var(--fd);color:var(--accent);font-size:24px;letter-spacing:4px";
    h2.textContent = "\u23F8\uFE0F PAUSA";
    btnsSide.appendChild(h2);
    var resumeBtn = document.createElement("div"); resumeBtn.className = "btn slot-btn selected"; resumeBtn.style.marginTop = "12px"; resumeBtn.textContent = "\u25B6\uFE0F RIPRENDI"; resumeBtn.onclick = resumeGame; btnsSide.appendChild(resumeBtn);
    var settBtn = document.createElement("div"); settBtn.className = "btn slot-btn"; settBtn.style.cssText = "margin-top:8px;opacity:.7"; settBtn.textContent = "\u2699\uFE0F IMPOSTAZIONI"; settBtn.onclick = function () { showSettings(); }; btnsSide.appendChild(settBtn);
    var abandonBtn = document.createElement("div"); abandonBtn.className = "btn slot-btn"; abandonBtn.style.cssText = "margin-top:8px;opacity:.5"; abandonBtn.textContent = "\uD83D\uDEAA TORNA AL MEN\u00D9"; abandonBtn.onclick = abandonRun; btnsSide.appendChild(abandonBtn);

    layout.appendChild(relicsSide);
    layout.appendChild(btnsSide);
    OVC.appendChild(layout);
    showOv();
}
function resumeGame() {
    closePauseRelicPanel();
    if (codexPanel) { codexPanel.classList.remove('open'); document.body.classList.remove('codex-open'); codexIsOpen = false; }
    hideOv(); unsetMS(); mState = ""; paused = true; cdTimer = 3; clearInterval(loop);
    // Riprendi la musica della zona dopo la pausa
    if (typeof resumeZoneMusic === "function") resumeZoneMusic();
    else if (musicGainNode) startMusic();
}
function abandonRun() {
    if (codexPanel) { codexPanel.classList.remove('open'); document.body.classList.remove('codex-open'); codexIsOpen = false; }
    closePauseRelicPanel();
     showSlotMenu(); }

/* ===== PAUSE RELIC PANEL ===== */
var prpIsOpen = false;

function openPauseRelicPanel() {
    var panel = document.getElementById("pause-relic-panel");
    var content = document.getElementById("prp-content");
    var sub = document.getElementById("prp-sub");
    if (!panel || !G) return;

    prpIsOpen = true;
    content.textContent = "";

    // Statistiche riepilogo
    var totalRelics = G.relics.length;
    var totalCurses = (G.secretBuffs || []).length;
    sub.textContent = totalRelics + " reliquie" + (totalCurses > 0 ? " • " + totalCurses + " maledizioni" : "");

    // Stat chips — somma totale effetti
    var stats = [];
    var rCount = {};
    G.relics.forEach(function(id) { rCount[id] = (rCount[id] || 0) + 1; });
    // Calcola somma stats dalle reliquie stackabili
    var bonusHp = 0, bonusSpd = 0, bonusXpm = 0, bonusSpf = 0;
    Object.keys(rCount).forEach(function(id) {
        var r = RELICS.find(function(p) { return p.id === id; });
        if (!r) return;
        var c = rCount[id];
        // Mappa effetti per reliquie note (semplificato per le stackabili)
        if (id === "shield") bonusHp += c;
        if (id === "speed") bonusSpd += c;
        if (id === "apple") bonusXpm += c;
        if (id === "greed") bonusSpf += c;
        if (id === "god") { bonusHp += 2 * c; bonusXpm += c; }
        if (id === "omni") { bonusHp += 3 * c; bonusSpf += 2 * c; bonusXpm += c; }
        if (id === "occhiolupo") bonusHp += c;
    });
    if (bonusHp > 0) stats.push("HP +" + bonusHp);
    if (bonusSpf > 0) stats.push("Mele +" + bonusSpf);
    if (bonusXpm > 0) stats.push("XP x" + (1 + bonusXpm * 0.5));
    if (bonusSpd > 0) stats.push("Velocita +" + (bonusSpd * 15) + "%");

    if (stats.length) {
        var statsDiv = document.createElement("div"); statsDiv.className = "prp-stats";
        stats.forEach(function(s) {
            var chip = document.createElement("div"); chip.className = "prp-stat-chip";
            var parts = s.split(" ");
            chip.textContent = parts[0] + " ";
            var b = document.createElement("b"); b.textContent = parts.slice(1).join(" ");
            chip.appendChild(b);
            statsDiv.appendChild(chip);
        });
        content.appendChild(statsDiv);
    }

    // Sezione Reliquie (ordinata per rarità)
    if (totalRelics > 0) {
        var sortedIds = Object.keys(rCount).sort(function(a, b) {
            var ra = RELICS.find(function(p) { return p.id === a; });
            var rb = RELICS.find(function(p) { return p.id === b; });
            var oa = ra ? (RA_ORDER[ra.ra] !== undefined ? RA_ORDER[ra.ra] : 9) : 9;
            var ob = rb ? (RA_ORDER[rb.ra] !== undefined ? RA_ORDER[rb.ra] : 9) : 9;
            return oa - ob;
        });

        // Raggruppa per rarità
        var currentRa = "";
        sortedIds.forEach(function(id) {
            var r = RELICS.find(function(p) { return p.id === id; }); if (!r) return;
            if (r.ra !== currentRa) {
                currentRa = r.ra;
                var secTitle = document.createElement("div"); secTitle.className = "prp-section-title";
                var raLabels = { mitico: "MITICO", leggendaria: "LEGGENDARIA", epico: "EPICO", raro: "RARO", comune: "COMUNE" };
                secTitle.textContent = raLabels[currentRa] || currentRa.toUpperCase();
                content.appendChild(secTitle);
            }
            var count = rCount[id];
            var row = document.createElement("div"); row.className = "rel-row";
            var icon = document.createElement("span"); icon.className = "rri"; icon.textContent = r.icon;
            var inner = document.createElement("div");
            var nameSpan = document.createElement("span"); nameSpan.className = "rrn " + rcClass(r.ra); nameSpan.textContent = r.name;
            var descSpan = document.createElement("span"); descSpan.className = "rrd"; descSpan.textContent = r.desc;
            inner.appendChild(nameSpan); inner.appendChild(descSpan); row.appendChild(icon); row.appendChild(inner);
            if (count > 1) {
                var cnt = document.createElement("span"); cnt.className = "rr-count"; cnt.textContent = "x" + count; row.appendChild(cnt);
            }
            content.appendChild(row);
        });
    }

    // Sezione Maledizioni
    if (totalCurses > 0) {
        var curseTitle = document.createElement("div"); curseTitle.className = "prp-section-title curse-title";
        curseTitle.textContent = "MALEDIZIONI";
        content.appendChild(curseTitle);
        G.secretBuffs.forEach(function(id) {
            var b = SECRET_BUFFS.find(function(p) { return p.id === id; }); if (!b) return;
            var row = document.createElement("div"); row.className = "rel-row curse-row";
            var icon = document.createElement("span"); icon.className = "rri"; icon.textContent = b.icon;
            var inner = document.createElement("div");
            var nameSpan = document.createElement("span"); nameSpan.className = "rrn"; nameSpan.textContent = b.name;
            var descSpan = document.createElement("span"); descSpan.className = "rrd"; descSpan.textContent = b.desc;
            inner.appendChild(nameSpan); inner.appendChild(descSpan); row.appendChild(icon); row.appendChild(inner);
            content.appendChild(row);
        });
    }

    if (totalRelics === 0 && totalCurses === 0) {
        var empty = document.createElement("div"); empty.style.cssText = "color:#555;font-size:12px;text-align:center;margin-top:20px";
        empty.textContent = "Nessuna reliquia o maledizione";
        content.appendChild(empty);
    }

    panel.classList.add("open");
}

function closePauseRelicPanel() {
    var panel = document.getElementById("pause-relic-panel");
    if (panel) panel.classList.remove("open");
    prpIsOpen = false;
}

function showGameOver() {
    running = false; mState = "dead"; clearInterval(loop); sDie(); stopMusic(); stopOst();
    if (codexFab) codexFab.style.display = "none";
    if (codexPanel) { codexPanel.classList.remove('open'); document.body.classList.remove('codex-open'); codexIsOpen = false; }
    if (G.currentSlot) { localStorage.removeItem("snake_slot_" + G.currentSlot); G.currentSlot = null; }
    setMS(C.width || 360, C.height || 400);
    var zN = G.endlessCycle > 0 ? "IL VUOTO ETERNO \u2014 Onda " + (G.endlessCycle + 1) : ZONES[Math.min(G.zoneIndex, 6)].name;
    OVC.textContent = "";
    var title = document.createElement("h2"); title.style.cssText = "font-family:var(--fd);color:#f87171;font-size:26px;letter-spacing:4px"; title.textContent = "\u2620\uFE0F GAME OVER"; OVC.appendChild(title);
    var elapsed = G.runStart ? Math.floor((Date.now() - G.runStart) / 1000) : 0;
    var mins = Math.floor(elapsed / 60), secs = elapsed % 60;
    var timeStr = mins > 0 ? mins + "m " + secs + "s" : secs + "s";
    var causeMap = { "Nemico": "\uD83D\uDC7E Nemico", "Esplosione": "\uD83D\uDCA5 Esplosione", "Autocollisione": "\uD83E\uDDF1 Autocollisione", "Fuori mappa": "\uD83D\uDD32 Fuori mappa", "Ostacolo": "\uD83E\uDDF1 Ostacolo", "Boss": "\uD83D\uDCA5 Boss", "Mela Avvelenata": "\uD83D\uDFE3 Mela Avvelenata" };
    var causeStr = causeMap[G.deathCause] || "\u2764\uFE0F " + (G.deathCause || "Sconosciuto");
    [["\u2B50 Livello", G.level], ["\uD83D\uDDFA\uFE0F Zona", zN], ["\uD83C\uDF4E Mele", G.totalMeals], ["\uD83C\uDFC6 Punti", Math.floor(G.score)], ["\uD83D\uDEE1\uFE0F Reliquie", G.relics.length], ["\u23F1\uFE0F Tempo", timeStr], ["\u2620\uFE0F Causa", causeStr]].forEach(function (pair) {
        var d = document.createElement("div"); d.className = "ds"; d.textContent = pair[0] + " "; var b = document.createElement("b"); b.textContent = pair[1]; d.appendChild(b); OVC.appendChild(d);
    });
    var btn = document.createElement("div"); btn.className = "btn slot-btn selected"; btn.style.cssText = "margin-top:16px"; btn.textContent = "\uD83C\uDFE0 MENU"; btn.onclick = showSlotMenu; OVC.appendChild(btn);
    showOv();
}

function useKunai() {
    if (!G.kunai || G.kunaiCDMS > 0 || !running || paused || G.isSpawning || G.snake.length < 2) return;
    var tail = G.snake[G.snake.length - 1]; 
    var tempX = G.snake[0].x, tempY = G.snake[0].y;
    G.snake[0].x = tail.x; 
    G.snake[0].y = tail.y;
    tail.x = tempX;
    tail.y = tempY;
    G.kunaiImmunity = Date.now() + 1500;
    G.kunaiCDMS = 15000; 
    sKunai(); 
    spawnEP(G.snake[0].x, G.snake[0].y, CZ(G).ui); 
    addF(G.snake[0].x, G.snake[0].y, "TELEPORT!", CZ(G).ui);
}

function renderCodexScreen() {
    mState = "codex"; mIdx = 0;
    var discovered = loadCodex();
    
    // Allarga l'overlay per far stare la griglia orizzontale
    setMS(650, 500); 
    
    function draw() {
        OVC.textContent = "";
        var h2 = document.createElement("h2"); 
        h2.style.cssText = "font-family:var(--fd);color:var(--accent);font-size:22px;letter-spacing:4px; margin-bottom:15px;"; 
        h2.textContent = "\uD83D\uDCDA CODEX & BESTIARIO"; 
        OVC.appendChild(h2);
        
        // CONTENITORE GRIGIA
        var wrap = document.createElement("div"); 
        wrap.className = "codex-grid"; 

        // SEZIONE ZONE
        ZONE_CODEX.forEach(function(z, i) {
            var isDiscovered = discovered.indexOf("zone_" + i) !== -1;
            var row = document.createElement("div"); row.className = "codex-cell";
            row.innerHTML = "<span class='rri'>" + (isDiscovered ? z.icon : "❓") + "</span><div><span class='rrn' style='color:" + (isDiscovered ? "var(--text)" : "#444") + "'>" + (isDiscovered ? z.name : "ZONA " + (i+1)) + "</span><span class='rrd'>" + (isDiscovered ? z.desc : "Non ancora esplorata.") + "</span></div>";
            wrap.appendChild(row);
        });

        // SEZIONE OSTACOLI E NEMICI
        CODEX_DB.forEach(function(db) {
            var isDiscovered = discovered.indexOf(db.id) !== -1;
            var row = document.createElement("div"); row.className = "codex-cell";
            row.innerHTML = "<span class='rri'>" + (isDiscovered ? db.icon : "❓") + "</span><div><span class='rrn' style='color:" + (isDiscovered ? db.color : "#444") + "'>" + (isDiscovered ? db.name : "???") + "</span><span class='rrd'>" + (isDiscovered ? db.desc : "Entità non identificata.") + "</span></div>";
            wrap.appendChild(row);
        });
        
        OVC.appendChild(wrap);

        var backBtn = document.createElement("div"); 
        backBtn.className = "btn slot-btn selected"; 
        backBtn.style.marginTop = "15px"; 
        backBtn.style.width = "200px";
        backBtn.textContent = "\u2190 INDIETRO"; 
        backBtn.onclick = function() { 
            if (running && G.hp > 0) {
                mState = "paused"; pauseGame(); // Torna alla pausa se sei in gioco
            } else {
                mState = "slots"; showSlotMenu(); // Torna al menu se sei fuori
            }
        }; 
        OVC.appendChild(backBtn);
    }
    draw();
}

function showSlotMenu() {
    running = false; paused = false; mState = "slots"; mIdx = 0;
    clearInterval(loop); resetTheme(); resetRB(); setMS(640, 500);
    ZONE_BAR.style.display = "none";
    var bb = document.getElementById("boss-bar"); if (bb) bb.style.display = "none";
    initCodexUI(); codexFab.style.display = "block";
    if (codexPanel) { codexPanel.classList.remove('open'); document.body.classList.remove('codex-open'); codexIsOpen = false; }
    renderSlots(); showOv();
    // Suona OST del menu principale — playOst già ferma la traccia corrente internamente
    if (typeof playMenuMusic === "function") playMenuMusic();
}
function renderSlots() {
    OVC.textContent = "";
    var h1 = document.createElement("h1"); h1.style.cssText = "font-family:var(--fd);color:var(--accent);font-size:26px;letter-spacing:5px;margin-bottom:8px"; h1.textContent = "\uD83D\uDC0D SNAKE ROGUELITE"; OVC.appendChild(h1);
    var sub = document.createElement("p"); sub.className = "sub"; sub.textContent = "\uD83C\uDFAE v7.1 \u2014 \uD83D\uDDFA\uFE0F 7 zone \u2022 \uD83D\uDEE1\uFE0F 43 reliquie \u2022 \uD83C\uDFB5 OST"; OVC.appendChild(sub);
    // Slots container: horizontal layout
    var slotsWrap = document.createElement("div"); slotsWrap.className = "slots-grid";
    [1, 2, 3].forEach(function (s, i) {
        var d = null;
        try { d = JSON.parse(localStorage.getItem("snake_slot_" + s)); } catch(e) { localStorage.removeItem("snake_slot_" + s); }
        // Wrapper per slider di eliminazione
        var wrapper = document.createElement("div"); wrapper.className = "slot-wrapper";
        // Slider elimina salvataggio — scivola fuori da dietro lo slot (solo se selezionato con dati)
        if (d && i === mIdx) {
            var delSlider = document.createElement("div");
            delSlider.className = "slot-delete-slider";
            delSlider.textContent = "\uD83D\uDDD1\uFE0F Elimina salvataggio";
            delSlider.onclick = function(e) {
                e.stopPropagation();
                localStorage.removeItem("snake_slot_" + s);
                renderSlots();
            };
            wrapper.appendChild(delSlider);
            // Anima lo slider: aggiungi 'visible' dopo un frame per far scattare la transizione CSS
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    delSlider.classList.add("visible");
                });
            });
        }
        var btn = document.createElement("div"); btn.className = "btn slot-btn-h" + (i === mIdx ? " selected" : "");
        var zName = "?"; if (d && typeof ZONES !== "undefined") zName = ZONES[Math.min(d.zoneIndex, 6)].name;
        var info = d ? "\u2B50 Lv " + d.level + " \u2022 \uD83C\uDF4E " + d.score + " Mele \u2022 \uD83D\uDDFA\uFE0F " + zName + (d.endlessCycle > 0 ? " Onda " + (d.endlessCycle + 1) : "") + " \u2022 \uD83D\uDEE1\uFE0F " + (d.relics ? d.relics.length : 0) + " rel" : "\uD83C\uDF3F Terreno Incolto";
        var bold = document.createElement("b"); bold.textContent = "\uD83C\uDF3F GIARDINO " + s;
        var small = document.createElement("small"); small.textContent = info;
        btn.appendChild(bold); btn.appendChild(small);
        btn.onclick = function () { startSlot(s); };
        wrapper.appendChild(btn);
        slotsWrap.appendChild(wrapper);
    });
    OVC.appendChild(slotsWrap);
    // Settings button (index 3)
    var settBtn = document.createElement("div"); settBtn.className = "btn slot-btn" + (mIdx === 3 ? " selected" : "");
    settBtn.style.cssText = "opacity:.7;margin-top:4px";
    var sBold = document.createElement("b"); sBold.textContent = "\u2699\uFE0F IMPOSTAZIONI";
    var sSmall = document.createElement("small"); sSmall.textContent = "Volume e altro";
    settBtn.appendChild(sBold); settBtn.appendChild(sSmall);
    settBtn.onclick = function () { showSettings(); }; OVC.appendChild(settBtn);
}

// Handle confirm in slot menu (3 slots + settings = 4 items, indices 0-3)
function handleSlotConfirm() {
    if (mIdx < 3) { startSlot(mIdx + 1); }
    else if (mIdx === 3) { showSettings(); }
}

// Handle confirm in pause menu (3 items: Riprendi, Impostazioni, Abbandona)
function handlePauseConfirm() {
    if (mIdx === 0) { resumeGame(); }
    else if (mIdx === 1) { showSettings(); }
    else if (mIdx === 2) { abandonRun(); }
}

function showSettings() {
    settingsPrevState = mState;
    mState = "settings"; mIdx = 0;
    OVC.textContent = "";
    var h2 = document.createElement("h2"); h2.style.cssText = "font-family:var(--fd);color:var(--accent);font-size:22px;letter-spacing:4px;margin-bottom:15px"; h2.textContent = "\u2699\uFE0F IMPOSTAZIONI"; OVC.appendChild(h2);

    // SFX Volume
    var sfxRow = document.createElement("div"); sfxRow.className = "setting-row";
    var sfxLabel = document.createElement("span"); sfxLabel.className = "setting-label"; sfxLabel.textContent = "\uD83D\uDD0A Effetti Sonori";
    var sfxSlider = document.createElement("input"); sfxSlider.type = "range"; sfxSlider.min = "0"; sfxSlider.max = "100"; sfxSlider.value = Math.round(settingsState.sfxVol * 100);
    sfxSlider.className = "setting-slider";
    sfxSlider.oninput = function() { settingsState.sfxVol = parseInt(this.value) / 100; saveSettings(); };
    var sfxVal = document.createElement("span"); sfxVal.className = "setting-val"; sfxVal.textContent = Math.round(settingsState.sfxVol * 100) + "%";
    sfxSlider.oninput = function() { settingsState.sfxVol = parseInt(this.value) / 100; sfxVal.textContent = Math.round(settingsState.sfxVol * 100) + "%"; saveSettings(); };
    sfxRow.appendChild(sfxLabel); sfxRow.appendChild(sfxSlider); sfxRow.appendChild(sfxVal); OVC.appendChild(sfxRow);

    // Music Volume
    var musRow = document.createElement("div"); musRow.className = "setting-row";
    var musLabel = document.createElement("span"); musLabel.className = "setting-label"; musLabel.textContent = "\uD83C\uDFB5 Musica";
    var musSlider = document.createElement("input"); musSlider.type = "range"; musSlider.min = "0"; musSlider.max = "100"; musSlider.value = Math.round(settingsState.musicVol * 100);
    musSlider.className = "setting-slider";
    var musVal = document.createElement("span"); musVal.className = "setting-val"; musVal.textContent = Math.round(settingsState.musicVol * 100) + "%";
    musSlider.oninput = function() { settingsState.musicVol = parseInt(this.value) / 100; musVal.textContent = Math.round(settingsState.musicVol * 100) + "%"; saveSettings(); applySettings(); };
    musRow.appendChild(musLabel); musRow.appendChild(musSlider); musRow.appendChild(musVal); OVC.appendChild(musRow);

    // Back button
    var backBtn = document.createElement("div"); backBtn.className = "btn slot-btn selected"; backBtn.style.cssText = "margin-top:18px;width:200px";
    backBtn.textContent = "\u2190 INDIETRO"; backBtn.onclick = function() { exitSettings(); }; OVC.appendChild(backBtn);
}

function exitSettings() {
    if (settingsPrevState === "paused") { mState = "paused"; pauseGame(); }
    else { mState = "slots"; showSlotMenu(); }
}
