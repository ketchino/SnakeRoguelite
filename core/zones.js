/* ===== ZONE & MENU CORE ===== */
var slotDeleteFocused = false;
var slotDeleteConfirm = false; // Conferma eliminazione salvataggio

/* ===== HOVER→SELECTION HELPER ===== */
// Sposta la classe .selected sull'elemento hoverato, rimuovendola dai fratelli
function _hoverSelect(el, idx, idxVar) {
    var parent = el.parentElement;
    if (!parent) return;
    var siblings = parent.children;
    for (var si = 0; si < siblings.length; si++) {
        var btns = siblings[si].querySelectorAll('.btn');
        if (btns.length === 0 && siblings[si].classList.contains('btn')) btns = [siblings[si]];
        btns.forEach(function(b) { b.classList.remove('selected'); });
        if (siblings[si].classList.contains('btn')) siblings[si].classList.remove('selected');
    }
    el.classList.add('selected');
}

/* ===== DIFFICULTY DEFINITIONS ===== */
var DIFFICULTIES = [
    { id: "peaceful", name: "PEACEFUL", icon: "\u2728", color: "#4ade80", cssClass: "diff-peaceful", nameClass: "peaceful", desc: "Nessun boss o nemico. Esplora in tranquillita." },
    { id: "default", name: "DEFAULT", icon: "\u2694\uFE0F", color: "var(--accent)", cssClass: "diff-default", nameClass: "default-diff", desc: "L'esperienza classica. Nemici e boss normali." },
    { id: "hardcore", name: "HARDCORE", icon: "\uD83D\uDD25", color: "#f87171", cssClass: "diff-hardcore", nameClass: "hardcore", desc: "Piu nemici, -2 HP iniziali, velocita +20%." }
];
var diffIdx = 1; // Default selected difficulty index

/* ===== CHARACTER DEFINITIONS ===== */
var CHARACTERS = [
    {
        id: "snek",
        name: "SNEK",
        icon: "\uD83D\uDC0D",
        color: "#5eead4",
        desc: "Un serpente classico, agile e determinato. Nessuna abilita speciale, ma tanta voglia di crescere.",
        lore: "Il primo abitante del Giardino. Semplice, ma pieno di sorprese.",
        stats: { hp: 4, speed: 1.0, xpMult: 1.0, scoreMult: 1.0 },
        statLabels: { hp: "HP", speed: "Velocita", xpMult: "XP Mult", scoreMult: "Mele Mult" }
    },
    {
        id: "alfonso",
        name: "ALFONSO",
        icon: "\uD83D\uDC0D",
        color: "#f87171",
        desc: "Un serpente robusto e resistente. Piu cuori e il formaggio di Skyrim fin dall'inizio.",
        lore: "Alfonso non ha mai perso una cena. Il suo segreto? Un formaggio che cura ogni ferita.",
        stats: { hp: 6, speed: 0.8, xpMult: 1.0, scoreMult: 1.0 },
        statLabels: { hp: "HP", speed: "Velocita", xpMult: "XP Mult", scoreMult: "Mele Mult" }
    },
    {
        id: "wrym",
        name: "WRYM",
        icon: "\uD83D\uDC32",
        color: "#94a3b8",
        desc: "Un drago-serpente antico. I suoi alleati combattono al posto suo, ma la sua crescita e bloccata.",
        lore: "Wrym non ha bisogno di crescere. I suoi servitori obbediscono al suo occhio cremisi.",
        stats: { hp: 3, speed: 1.1, xpMult: 1.2, scoreMult: 1.0 },
        statLabels: { hp: "HP", speed: "Velocita", xpMult: "XP Mult", scoreMult: "Mele Mult" }
    },
    {
        id: "frenk",
        name: "FRENK",
        icon: "\uD83D\uDC7B",
        color: "#e2e8f0",
        desc: "Un fantasma con un solo battito. Portal Gun, crepa gratis, attraversa il proprio corpo e colpisce forte in mischia.",
        lore: "Frenk e gia morto una volta. Non ha piu nulla da perdere, tranne quell'ultimo battito.",
        stats: { hp: 1, speed: 1.3, xpMult: 1.8, scoreMult: 1.5, melee: 1.5 },
        statLabels: { hp: "HP", speed: "Velocita", xpMult: "XP Mult", scoreMult: "Mele Mult", melee: "Mischia" },
        gif: "frenk-ghost.gif"
    }
];
var charIdx = 0; // Character selection index
var CHAR_TOTAL = 1; // Total characters + 1 (indietro)

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
    var D = { zoneIndex: 0, zoneFood: 0, inputBuffer: [], isSpawning: false, kunaiImmunity: 0, spawnLeft: 0, vortex: false, totalMeals: 0, stonksMeals: 0, stonks: false, lofi: false, nokia: false, nokiaSlow: 0, portal: false, slurp: false, slurpTick: 0, sonic: false, hulk: false, lag: false, cheese: false, endlessCycle: 0, obstacles: [], enemies: [], traps: [], foods: [], relics: [], sabbia: false, tronco: false, rosario: false, moneta: false, dado: false, pane: false, bigtop: false, pirla: false, nyan: false, gommu: false, arrow: false, arrowSpd: 1, trappola: false, nostalgia: false, nabbo: false, praise: false, guscio: false, unoReverse: false, linkShield: false, linkCD: 0, eruzione: false, praiseCnt: 0, eruzioneCnt: 0, kunai: false, kunaiCDMS: 0, bigtopTicks: 0, runStart: Date.now(), deathCause: "", pendingObs: [], regenTick: 0, boss: null, bossDefeated: [], piuma: false, invincible: 0, crack: null, hpMaxMod: 0, cuoreAntico: false, cuoreAnticoMeals: 0, sguardoVuoto: false, pelleMuta: false, pelleMutaTick: 0, ricordoSbiadito: false, ricordoUsed: false, ombraLunga: false, ombraTrail: [], fameEterna: false, secretBuffs: [], _debugGod: false, _debugNoClip: false, _debugSlowMo: false, occhiolupo: false, linguarospo: false, coronatiranno: false, coronaMeals: 0, scagliadraga: false, scagliaCD: 0, frammentovuoto: false, frammentoCD: 0, pelleprimordiale: false, difficulty: "default", charId: "snek", maxSegments: 0, hpLocked: false, crackFree: false, meleeMod: 1, ghostBody: false };
    for (var k in D) if (typeof G[k] === "undefined") G[k] = D[k];
    // Apply difficulty: if starting a new game (not loading), use selected difficulty
    if (!raw) {
        G.difficulty = selectedDifficulty;
    }
    // Apply difficulty modifiers
    applyDifficultyModifiers(G);
    // Apply character modifiers (only on new game)
    if (!raw) {
        applyCharacterModifiers(G);
    }
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
    setTimeout(function() { try { sEat(); } catch(e){} }, 100); applyTheme(CZ(G)); hideOv();
    // Nascondi menu-screen fullscreen quando si inizia a giocare
    var ms = document.getElementById("menu-screen"); if (ms) ms.classList.remove("visible");
    running = true; paused = true; mState = "";
    if (typeof timerOnStart === "function") timerOnStart();
    if (typeof showMobileControls === "function") showMobileControls();
    stopMusic(); startMusic();
    setTimeout(function () { initZone(); }, 40);
}

function applyDifficultyModifiers(G) {
    if (G.difficulty === "hardcore") {
        // Hardcore: -2 HP iniziali, velocita +20%
        G.hpMaxMod = (G.hpMaxMod || 0) - 2;
        // Ensure hp doesn't go below 1
        var maxHp = Math.max(1, 4 + (G.hpMaxMod || 0));
        if (G.hp > maxHp) G.hp = maxHp;
        G.spd = 0.8; // 20% faster (lower interval = faster)
    } else if (G.difficulty === "peaceful") {
        // Peaceful: no modifications needed here, handled in initZone
        G.spd = 1;
    } else {
        G.spd = 1;
    }
}

function applyCharacterModifiers(G) {
    var ch = CHARACTERS.find(function(c) { return c.id === selectedCharacter; });
    if (!ch) return;
    G.charId = ch.id;

    // Velocita base dal personaggio
    G.spd = ch.stats.speed;

    // === ALFONSO: HP6 + cheese di default ===
    if (ch.id === "alfonso") {
        G.hpMaxMod = (G.hpMaxMod || 0) + 2; // 4 base + 2 = 6
        G.hp = 4 + (G.hpMaxMod || 0);
        G.cheese = true;
        if (G.relics.indexOf("cheese") === -1) G.relics.push("cheese");
    }

    // === WRYM: max 7 segmenti + nabbo + eruzione ===
    if (ch.id === "wrym") {
        G.hpMaxMod = (G.hpMaxMod || 0) - 1; // 4 base - 1 = 3
        G.hp = 4 + (G.hpMaxMod || 0);
        G.maxSegments = 7;
        G.nabbo = true;
        G.eruzione = true;
        if (G.relics.indexOf("nabbo") === -1) G.relics.push("nabbo");
        if (G.relics.indexOf("eruzione") === -1) G.relics.push("eruzione");
    }

    // === FRENK: HP1 fisso + portal gun + crepa gratis + 1.5x melee + ghost body ===
    if (ch.id === "frenk") {
        G.hpMaxMod = -3; // 4 base - 3 = 1
        G.hp = 1;
        G.hpLocked = true;
        G.crackFree = true;
        G.portal = true;
        G.meleeMod = 1.5; // Contatti coi nemici costano meno segmenti
        G.ghostBody = true; // Passa attraverso il proprio corpo
        if (G.relics.indexOf("portal") === -1) G.relics.push("portal");
    }
}

/* ===== DIFFICULTY SELECTION SCREEN ===== */
function showDifficultyScreen(s) {
    pendingSlot = s;
    mState = "difficulty";
    diffIdx = 1; // Default selected = Default
    if (codexFab) codexFab.style.display = "block";
    _renderDiffUI();
}

function confirmDifficulty() {
    if (diffIdx >= DIFFICULTIES.length) {
        // Indietro selezionato
        mState = "slots"; showSlotMenu(); return;
    }
    selectedDifficulty = DIFFICULTIES[diffIdx].id;
    // Vai alla selezione del personaggio
    showCharacterScreen();
}

// diffIdx: 0=Peaceful, 1=Default, 2=Hardcore, 3=Indietro
var DIFF_TOTAL = 4; // 3 difficoltà + 1 indietro

function _renderDiffUI() {
    var MC = document.getElementById("menu-content");
    MC.textContent = "";
    var h1 = document.createElement("h1"); h1.textContent = "\uD83C\uDFAE SELEZIONA DIFFICOLTA"; MC.appendChild(h1);
    var sub = document.createElement("p"); sub.className = "sub"; sub.textContent = "\uD83C\uDF3F GIARDINO #" + pendingSlot; MC.appendChild(sub);

    var diffGrid = document.createElement("div"); diffGrid.className = "diff-grid";

    DIFFICULTIES.forEach(function(diff, i) {
        var btn = document.createElement("div");
        btn.className = "btn diff-btn " + diff.cssClass + (i === diffIdx ? " selected" : "");
        var icon = document.createElement("span"); icon.className = "diff-icon"; icon.textContent = diff.icon;
        var name = document.createElement("span"); name.className = "diff-name " + diff.nameClass; name.textContent = diff.name;
        var desc = document.createElement("span"); desc.className = "diff-desc"; desc.textContent = diff.desc;
        btn.appendChild(icon); btn.appendChild(name); btn.appendChild(desc);
        btn.onclick = function() { diffIdx = i; selectedDifficulty = diff.id; confirmDifficulty(); };
        btn.onmouseenter = function() { diffIdx = i; _renderDiffUI(); };
        diffGrid.appendChild(btn);
    });

    MC.appendChild(diffGrid);

    var backBtn = document.createElement("div"); backBtn.className = "btn slot-btn" + (diffIdx === 3 ? " selected" : ""); backBtn.style.cssText = "margin-top:14px;width:200px";
    if (diffIdx !== 3) backBtn.style.opacity = ".6";
    backBtn.textContent = "\u2190 INDIETRO"; backBtn.onclick = function() { mState = "slots"; showSlotMenu(); };
    backBtn.onmouseenter = function() { diffIdx = 3; _renderDiffUI(); };
    MC.appendChild(backBtn);
}

function renderDifficultyScreen() {
    _renderDiffUI();
}

function initZone() {
    var z = CZ(G); 
    discover("zone_" + G.zoneIndex);
    G.zoneCrackUsed = false; // Reset: può spawnare una crepa nella nuova zona
    
    C.width = z.c * CS; C.height = z.r * CS;
    unsetMS(); applyTheme(z);
    // If boss is active, skip normal spawning
    if (G.boss && !G.boss.defeated) {
        // Peaceful: boss shouldn't exist, but safety check
        if (G.difficulty === "peaceful") {
            G.boss = null;
            // Advance zone instead
            if (G.zoneIndex < ZONES.length - 1) { G.zoneIndex++; } else { G.endlessCycle++; }
            G.zoneFood = 0;
            initZone();
            return;
        }
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

    // Difficulty-based enemy spawning
    if (G.difficulty === "peaceful") {
        // Peaceful: no enemies spawn
    } else if (G.difficulty === "hardcore") {
        // Hardcore: 50% more enemies
        var hPatr = Math.ceil(z.patr * 1.5);
        var hHunt = Math.ceil(z.hunt * 1.5);
        for (var i = 0; i < hPatr; i++) spawnEn(G, CZ(G), "patrol");
        for (var i = 0; i < hHunt; i++) spawnEn(G, CZ(G), "hunter");
    } else {
        // Default: normal spawning
        for (var i = 0; i < z.patr; i++) spawnEn(G, CZ(G), "patrol");
        for (var i = 0; i < z.hunt; i++) spawnEn(G, CZ(G), "hunter");
    }

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
    // Add difficulty indicator to zone banner
    if (G.difficulty === "peaceful") zNum += " \u2728";
    else if (G.difficulty === "hardcore") zNum += " \uD83D\uDD25";
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
    if (typeof hideMobileControls === "function") hideMobileControls();
    setMS(640, 500);
    G.xp -= G.xpNeed; G.level++; G.xpNeed = Math.floor(G.xpNeed * 1.6);
    picks = [];
    var pool = RELICS.filter(function(r) {
        if (r.w <= 0) return false;
        if (r.bossRelic) {
            // Boss relic: include nella pool se il boss è stato sbloccato
            // (persistente tra le run tramite localStorage)
            var bossId = null;
            var bossMap = {piuma:"corvo",occhiolupo:"lupo",linguarospo:"rospo",coronatiranno:"tiranno",scagliadraga:"draga",frammentovuoto:"vuoto",pelleprimordiale:"primordiale"};
            bossId = bossMap[r.id];
            if (!bossId) return false;
            // Se il giocatore ha già questa reliquia nella run corrente, non proporla di nuovo
            if (G.relics.indexOf(r.id) !== -1) return false;
            // Controlla sia gli unlock persistenti (localStorage) che quelli della run corrente
            var persistentUnlocks = loadBossUnlocks();
            return persistentUnlocks.indexOf(bossId) !== -1 ||
                   (G.bossRelicsAwarded && G.bossRelicsAwarded.indexOf(bossId) !== -1);
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
        btn.onclick = function () { applyRelic(r); };
        btn.onmouseenter = function() { mIdx = i; var bs = pickDiv.querySelectorAll('.relic-btn'); bs.forEach(function(b,bi) { if(bi===i) b.classList.add('selected'); else b.classList.remove('selected'); }); };
        pickDiv.appendChild(btn);
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
    if (typeof showMobileControls === "function") showMobileControls();
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
    if (mState === "slots" || mState === "dead" || mState === "codex" || mState === "settings" || mState === "difficulty" || mState === "character") return;
    if (mState === "leveling" || relicDelay > 0 || cdTimer > 0) return;
    if (!running) return;
    paused = true; clearInterval(loop); mState = "paused"; mIdx = 0;
    setMS(C.width || 360, C.height || 400); OVC.textContent = "";
    if (codexFab) codexFab.style.display = "block";
    if (typeof playPauseMusic === "function") playPauseMusic();
    if (typeof hideMobileControls === "function") hideMobileControls();
    var h2 = document.createElement("h2"); h2.style.cssText = "font-family:var(--fd);color:var(--accent);font-size:24px;letter-spacing:4px"; h2.textContent = "\u23F8\uFE0F PAUSA"; OVC.appendChild(h2);
    var resumeBtn = document.createElement("div"); resumeBtn.className = "btn slot-btn selected"; resumeBtn.style.marginTop = "12px"; resumeBtn.textContent = "\u25B6\uFE0F RIPRENDI"; resumeBtn.onclick = resumeGame; resumeBtn.onmouseenter = function() { mIdx = 0; var bs = OVC.querySelectorAll('.slot-btn'); bs.forEach(function(b,bi) { if(bi===0) b.classList.add('selected'); else b.classList.remove('selected'); }); }; OVC.appendChild(resumeBtn);
    var settBtn = document.createElement("div"); settBtn.className = "btn slot-btn"; settBtn.style.cssText = "margin-top:8px;opacity:.7"; settBtn.textContent = "\u2699\uFE0F IMPOSTAZIONI"; settBtn.onclick = function () { hideOv(); closePauseRelicPanel(); showSettings(); }; settBtn.onmouseenter = function() { mIdx = 1; var bs = OVC.querySelectorAll('.slot-btn'); bs.forEach(function(b,bi) { if(bi===1) b.classList.add('selected'); else b.classList.remove('selected'); }); }; OVC.appendChild(settBtn);
    var abandonBtn = document.createElement("div"); abandonBtn.className = "btn slot-btn"; abandonBtn.style.cssText = "margin-top:8px;opacity:.5"; abandonBtn.textContent = "\uD83D\uDEAA TORNA AL MEN\u00D9"; abandonBtn.onclick = abandonRun; abandonBtn.onmouseenter = function() { mIdx = 2; var bs = OVC.querySelectorAll('.slot-btn'); bs.forEach(function(b,bi) { if(bi===2) b.classList.add('selected'); else b.classList.remove('selected'); }); }; OVC.appendChild(abandonBtn);
    showOv();
    // Apri automaticamente il pannello reliquie a sinistra
    openPauseRelicPanel();
}
function resumeGame() {
    closePauseRelicPanel();
    if (codexPanel) { codexPanel.classList.remove('open'); document.body.classList.remove('codex-open'); codexIsOpen = false; }
    hideOv(); unsetMS(); mState = ""; paused = true; cdTimer = 3; clearInterval(loop);
    if (typeof showMobileControls === "function") showMobileControls();
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
    sub.textContent = totalRelics + " reliquie" + (totalCurses > 0 ? " \u2022 " + totalCurses + " maledizioni" : "");

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
    if (typeof hideMobileControls === "function") hideMobileControls();
    closePauseRelicPanel();
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
    var diffLabel = G.difficulty === "peaceful" ? "\u2728 Peaceful" : G.difficulty === "hardcore" ? "\uD83D\uDD25 Hardcore" : "\u2694\uFE0F Default";
    [["\u2B50 Livello", G.level], ["\uD83D\uDDFA\uFE0F Zona", zN], ["\uD83C\uDF4E Mele", G.totalMeals], ["\uD83C\uDFC6 Punti", Math.floor(G.score)], ["\uD83D\uDEE1\uFE0F Reliquie", G.relics.length], ["\u23F1\uFE0F Tempo", timeStr], ["\u2620\uFE0F Causa", causeStr], ["\uD83C\uDFAE Difficolta", diffLabel]].forEach(function (pair) {
        var d = document.createElement("div"); d.className = "ds"; d.textContent = pair[0] + " "; var b = document.createElement("b"); b.textContent = pair[1]; d.appendChild(b); OVC.appendChild(d);
    });
    var btn = document.createElement("div"); btn.className = "btn slot-btn selected"; btn.style.cssText = "margin-top:16px"; btn.textContent = "\uD83C\uDFE0 MENU"; btn.onclick = showSlotMenu; OVC.appendChild(btn);
    showOv();
}

function useKunai() {
    if (!G.kunai || G.kunaiCDMS > 0 || !running || paused || G.isSpawning || G.snake.length < 2) return;
    var z = CZ(G);
    var tail = G.snake[G.snake.length - 1];
    var destX = tail.x, destY = tail.y;

    // Check if destination is safe (no obstacles, no boss cells, not on own body)
    var blocked = G.obstacles.some(function(o) { return o.x === destX && o.y === destY; });
    if (G.boss && !G.boss.defeated) {
        var bc = bossCells(G.boss);
        blocked = blocked || bc.some(function(c) { return c.x === destX && c.y === destY; });
    }
    // Check if tail position is on the snake's body (can happen if snake is coiled)
    for (var sbi = 1; sbi < G.snake.length - 1; sbi++) {
        if (G.snake[sbi].x === destX && G.snake[sbi].y === destY) { blocked = true; break; }
    }
    if (blocked) {
        // Try to find a safe cell adjacent to the tail
        var dirs = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
        var safeDir = null;
        for (var di = 0; di < dirs.length; di++) {
            var sx = destX + dirs[di].x, sy = destY + dirs[di].y;
            if (sx < 0 || sx >= z.c || sy < 0 || sy >= z.r) continue;
            var sBlocked = G.obstacles.some(function(o) { return o.x === sx && o.y === sy; });
            if (!sBlocked) {
                // Also check if this adjacent cell is on the snake body
                var sOnBody = false;
                for (var sbj = 1; sbj < G.snake.length; sbj++) {
                    if (G.snake[sbj].x === sx && G.snake[sbj].y === sy) { sOnBody = true; break; }
                }
                if (!sOnBody) { safeDir = {x: sx, y: sy}; break; }
            }
        }
        if (safeDir) { destX = safeDir.x; destY = safeDir.y; }
        else { addF(G.snake[0].x, G.snake[0].y, "BLOCCATO!", "#ef4444"); return; }
    }

    var tempX = G.snake[0].x, tempY = G.snake[0].y;
    G.snake[0].x = destX;
    G.snake[0].y = destY;
    tail.x = tempX;
    tail.y = tempY;

    // Kill enemies at destination (like spawn invincibility)
    for (var ei = G.enemies.length - 1; ei >= 0; ei--) {
        if (G.enemies[ei].x === destX && G.enemies[ei].y === destY) {
            var killedEn = G.enemies[ei];
            if (killedEn.isBossGuard && G.boss && !G.boss.defeated) {
                if (!G.foods.some(function(f) { return f.x === destX && f.y === destY; })) {
                    G.foods.push({ x: destX, y: destY, type: G.boss.collectType });
                }
            }
            G.enemies.splice(ei, 1);
            spawnEP(destX, destY, "#60a5fa");
            G.score += 2;
        }
    }

    // Grant brief invincibility (not just autocollision immunity)
    G.kunaiImmunity = Date.now() + 1500;
    G.invincible = Math.max(G.invincible || 0, 3); // ~0.5s invincibility after teleport
    G.kunaiCDMS = 15000;
    sKunai();
    spawnEP(G.snake[0].x, G.snake[0].y, z.ui);
    addF(G.snake[0].x, G.snake[0].y, "TELEPORT!", z.ui);
    if (typeof onScreenFlash === 'undefined') {
        screenFlash = 6; flashClr = "rgba(96,165,250,.2)";
    } else {
        screenFlash = 6; flashClr = "rgba(96,165,250,.2)";
    }
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
            row.innerHTML = "<span class='rri'>" + (isDiscovered ? z.icon : "\u2753") + "</span><div><span class='rrn' style='color:" + (isDiscovered ? "var(--text)" : "#444") + "'>" + (isDiscovered ? z.name : "ZONA " + (i+1)) + "</span><span class='rrd'>" + (isDiscovered ? z.desc : "Non ancora esplorata.") + "</span></div>";
            wrap.appendChild(row);
        });

        // SEZIONE OSTACOLI E NEMICI
        CODEX_DB.forEach(function(db) {
            var isDiscovered = discovered.indexOf(db.id) !== -1;
            var row = document.createElement("div"); row.className = "codex-cell";
            row.innerHTML = "<span class='rri'>" + (isDiscovered ? db.icon : "\u2753") + "</span><div><span class='rrn' style='color:" + (isDiscovered ? db.color : "#444") + "'>" + (isDiscovered ? db.name : "???") + "</span><span class='rrd'>" + (isDiscovered ? db.desc : "Entita non identificata.") + "</span></div>";
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
    running = false; paused = false; mState = "slots"; mIdx = 0; slotDeleteFocused = false; slotDeleteConfirm = false;
    clearInterval(loop); resetTheme(); resetRB();
    if (typeof hideMobileControls === "function") hideMobileControls();
    ZONE_BAR.style.display = "none";
    closePauseRelicPanel();
    hideOv();
    initCodexUI(); codexFab.style.display = "block";
    if (codexPanel) { codexPanel.classList.remove('open'); document.body.classList.remove('codex-open'); codexIsOpen = false; }
    renderSlots();
    // Mostra menu-screen fullscreen
    var ms = document.getElementById("menu-screen"); if (ms) ms.classList.add("visible");
    // Suona OST del menu principale — playOst già ferma la traccia corrente internamente
    if (typeof playMenuMusic === "function") playMenuMusic();
}
function renderSlots() {
    var MC = document.getElementById("menu-content");
    MC.textContent = "";
    var h1 = document.createElement("h1"); h1.textContent = "\uD83D\uDC0D SNAKE ROGUELITE"; MC.appendChild(h1);
    // Slots container: horizontal layout
    var slotsWrap = document.createElement("div"); slotsWrap.className = "slots-grid";
    [1, 2, 3].forEach(function (s, i) {
        var d = null;
        try { d = JSON.parse(localStorage.getItem("snake_slot_" + s)); } catch(e) { localStorage.removeItem("snake_slot_" + s); }
        var wrapper = document.createElement("div"); wrapper.className = "slot-wrapper";
        // Bottone dello slot (sempre prima nel DOM)
        var isSlotSel = i === mIdx && !slotDeleteFocused;
        var btn = document.createElement("div"); btn.className = "btn slot-btn-h" + (i === mIdx ? " selected" : "");
        if (slotDeleteFocused && i === mIdx) btn.classList.remove("selected");
        var zName = "?"; if (d && typeof ZONES !== "undefined") zName = ZONES[Math.min(d.zoneIndex, 6)].name;
        var diffTag = d && d.difficulty ? (d.difficulty === "peaceful" ? " \u2728" : d.difficulty === "hardcore" ? " \uD83D\uDD25" : "") : "";
        var info = d ? "\u2B50 Lv " + d.level + " \u2022 \uD83C\uDF4E " + d.score + " Mele \u2022 \uD83D\uDDFA\uFE0F " + zName + (d.endlessCycle > 0 ? " Onda " + (d.endlessCycle + 1) : "") + diffTag + " \u2022 \uD83D\uDEE1\uFE0F " + (d.relics ? d.relics.length : 0) + " rel" : "\uD83C\uDF3F Terreno Incolto";
        var bold = document.createElement("b"); bold.textContent = "\uD83C\uDF3F GIARDINO #" + s;
        var small = document.createElement("small"); small.textContent = info;
        btn.appendChild(bold); btn.appendChild(small);
        btn.onclick = function () {
            slotDeleteFocused = false;
            var existingData = null;
            try { existingData = JSON.parse(localStorage.getItem("snake_slot_" + s)); } catch(e) {}
            // If slot has a valid save, go directly into the game
            if (existingData && typeof existingData.snake !== "undefined" && typeof existingData.hp === "number" && existingData.hp > 0) {
                startSlot(s);
            } else {
                showDifficultyScreen(s);
            }
        };
        btn.onmouseenter = function() { mIdx = i; slotDeleteFocused = false; slotDeleteConfirm = false; renderSlots(); };
        wrapper.appendChild(btn);
        // Slider elimina salvataggio — sotto il bottone (solo se selezionato con dati)
        if (d && i === mIdx) {
            var delSlider = document.createElement("div");
            var isConfirming = slotDeleteFocused && slotDeleteConfirm && i === mIdx;
            delSlider.className = "slot-delete-slider" + (slotDeleteFocused ? " focused" : "") + (isConfirming ? " confirming" : "");
            delSlider.textContent = isConfirming ? "\u26A0\uFE0F Sei sicuro? Premi di nuovo" : "\uD83D\uDDD1\uFE0F Elimina salvataggio";
            delSlider.onclick = function(e) {
                e.stopPropagation();
                if (!slotDeleteConfirm) {
                    slotDeleteConfirm = true;
                    renderSlots();
                } else {
                    localStorage.removeItem("snake_slot_" + s);
                    slotDeleteFocused = false;
                    slotDeleteConfirm = false;
                    renderSlots();
                }
            };
            wrapper.appendChild(delSlider);
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    delSlider.classList.add("visible");
                });
            });
        }
        slotsWrap.appendChild(wrapper);
    });
    MC.appendChild(slotsWrap);
    // Settings button (index 3)
    var settBtn = document.createElement("div"); settBtn.className = "btn slot-btn" + (mIdx === 3 ? " selected" : "");
    settBtn.style.cssText = "opacity:.7;margin-top:4px";
    var sBold = document.createElement("b"); sBold.textContent = "\u2699\uFE0F IMPOSTAZIONI";
    var sSmall = document.createElement("small"); sSmall.textContent = "Volume e altro";
    settBtn.appendChild(sBold); settBtn.appendChild(sSmall);
    settBtn.onclick = function () { showSettings(); };
    settBtn.onmouseenter = function() { mIdx = 3; renderSlots(); };
    MC.appendChild(settBtn);
}

// Handle confirm in slot menu (3 slots + settings = 4 items, indices 0-3)
function handleSlotConfirm() {
    if (slotDeleteFocused && mIdx < 3) {
        if (!slotDeleteConfirm) {
            // Prima pressione: mostra conferma
            slotDeleteConfirm = true;
            renderSlots();
        } else {
            // Seconda pressione: elimina davvero
            localStorage.removeItem("snake_slot_" + (mIdx + 1));
            slotDeleteFocused = false;
            slotDeleteConfirm = false;
            renderSlots();
        }
    } else if (mIdx < 3) {
        var s = mIdx + 1;
        var existingData = null;
        try { existingData = JSON.parse(localStorage.getItem("snake_slot_" + s)); } catch(e) {}
        if (existingData && typeof existingData.snake !== "undefined" && typeof existingData.hp === "number" && existingData.hp > 0) {
            startSlot(s);
        } else {
            showDifficultyScreen(s);
        }
    }
    else if (mIdx === 3) { showSettings(); }
}

// Handle confirm in pause menu (3 items: Riprendi, Impostazioni, Abbandona)
function handlePauseConfirm() {
    if (mIdx === 0) { resumeGame(); }
    else if (mIdx === 1) { showSettings(); }
    else if (mIdx === 2) { abandonRun(); }
}

/* ===== CHARACTER SELECTION SCREEN ===== */
function showCharacterScreen() {
    mState = "character"; charIdx = 0;
    if (codexFab) codexFab.style.display = "block";
    _renderCharUI();
}

function confirmCharacter() {
    selectedCharacter = CHARACTERS[charIdx].id;
    startSlot(pendingSlot);
}

/* ===== Carousel navigation helper (no full re-render) ===== */
function _charNavTo(idx) {
    charIdx = idx;
    var container = document.getElementById("char-scroll-container");
    if (!container) return;
    var cards = container.querySelectorAll(".char-card");
    cards.forEach(function(c, i) {
        if (i === charIdx) c.classList.add("selected");
        else c.classList.remove("selected");
    });
    var target = cards[charIdx];
    if (target) {
        var scrollPos = target.offsetLeft - (container.offsetWidth / 2) + (target.offsetWidth / 2);
        container.scrollTo({ left: scrollPos, behavior: "smooth" });
    }
}
function _charNav(dir) {
    _charNavTo((charIdx + dir + CHARACTERS.length) % CHARACTERS.length);
}

function _renderCharUI() {
    var MC = document.getElementById("menu-content");
    MC.textContent = "";
    var h1 = document.createElement("h1"); h1.textContent = "\uD83C\uDFAE SELEZIONA PERSONAGGIO"; MC.appendChild(h1);
    var sub = document.createElement("p"); sub.className = "sub"; sub.textContent = "\uD83C\uDF3F GIARDINO #" + pendingSlot; MC.appendChild(sub);

    // Carousel wrapper con frecce laterali
    var carouselWrap = document.createElement("div"); carouselWrap.className = "char-carousel-wrap";

    // Freccia sinistra
    var arrowL = document.createElement("div"); arrowL.className = "char-nav-arrow char-nav-left"; arrowL.textContent = "\u25C0";
    arrowL.onclick = function() { _charNav(-1); };
    carouselWrap.appendChild(arrowL);

    // Container scrollabile
    var charContainer = document.createElement("div"); charContainer.className = "char-container";
    charContainer.id = "char-scroll-container";

    CHARACTERS.forEach(function(ch, i) {
        var card = document.createElement("div");
        card.className = "char-card" + (i === charIdx ? " selected" : "");
        card.setAttribute("data-char-index", i);

        // Sfondo GIF animata (se disponibile) in trasparenza dietro la card
        if (ch.gif) {
            var bgImg = document.createElement("img"); bgImg.src = ch.gif;
            bgImg.className = "char-card-bg";
            bgImg.draggable = false;
            card.appendChild(bgImg);
        }

        // Preview: canvas per tutti i personaggi
        var previewWrap = document.createElement("div"); previewWrap.className = "char-preview";
        var canvas = document.createElement("canvas"); canvas.width = 120; canvas.height = 120; canvas.className = "char-canvas";
        previewWrap.appendChild(canvas);
        _drawSnakePreview(canvas, ch);

        var info = document.createElement("div"); info.className = "char-info";
        var nameEl = document.createElement("div"); nameEl.className = "char-name"; nameEl.style.color = ch.color; nameEl.textContent = ch.icon + " " + ch.name;
        info.appendChild(nameEl);
        var descEl = document.createElement("div"); descEl.className = "char-desc"; descEl.textContent = ch.desc;
        info.appendChild(descEl);
        // Stats
        var statsWrap = document.createElement("div"); statsWrap.className = "char-stats";
        var statKeys = Object.keys(ch.stats);
        statKeys.forEach(function(sk) {
            var statRow = document.createElement("div"); statRow.className = "char-stat";
            var statLabel = document.createElement("span"); statLabel.className = "char-stat-label"; statLabel.textContent = ch.statLabels[sk];
            var statBar = document.createElement("div"); statBar.className = "char-stat-bar";
            var statFill = document.createElement("div"); statFill.className = "char-stat-fill";
            var norm = 0.5;
            if (sk === "hp") norm = ch.stats[sk] / 8;
            else if (sk === "speed") norm = ch.stats[sk] / 1.5;
            else if (sk === "xpMult") norm = ch.stats[sk] / 2;
            else if (sk === "scoreMult") norm = ch.stats[sk] / 2;
            else if (sk === "melee") norm = ch.stats[sk] / 2;
            norm = Math.min(1, Math.max(0.1, norm));
            statFill.style.width = (norm * 100) + "%";
            statFill.style.background = ch.color;
            statBar.appendChild(statFill);
            var statVal = document.createElement("span"); statVal.className = "char-stat-val";
            if (sk === "hp") statVal.textContent = ch.stats[sk];
            else if (sk === "speed") statVal.textContent = ch.stats[sk].toFixed(1) + "x";
            else if (sk === "xpMult") statVal.textContent = ch.stats[sk].toFixed(1) + "x";
            else if (sk === "scoreMult") statVal.textContent = ch.stats[sk].toFixed(1) + "x";
            else if (sk === "melee") statVal.textContent = ch.stats[sk].toFixed(1) + "x";
            statRow.appendChild(statLabel); statRow.appendChild(statBar); statRow.appendChild(statVal);
            statsWrap.appendChild(statRow);
        });
        info.appendChild(statsWrap);
        // Lore
        var loreEl = document.createElement("div"); loreEl.className = "char-lore"; loreEl.textContent = ch.lore;
        info.appendChild(loreEl);

        card.appendChild(previewWrap); card.appendChild(info);
        card.onclick = function() { charIdx = i; confirmCharacter(); };
        card.onmouseenter = function() { _charNavTo(i); };

        charContainer.appendChild(card);
    });

    carouselWrap.appendChild(charContainer);

    // Freccia destra
    var arrowR = document.createElement("div"); arrowR.className = "char-nav-arrow char-nav-right"; arrowR.textContent = "\u25B6";
    arrowR.onclick = function() { _charNav(1); };
    carouselWrap.appendChild(arrowR);

    MC.appendChild(carouselWrap);

    // Pulsante INDIETRO (stile uguale al menù difficoltà)
    var backBtn = document.createElement("div"); backBtn.className = "btn slot-btn"; backBtn.style.cssText = "margin-top:14px;width:200px;opacity:.6";
    backBtn.textContent = "\u2190 INDIETRO"; backBtn.onclick = function() { mState = "difficulty"; showDifficultyScreen(pendingSlot); };
    MC.appendChild(backBtn);

    // Centra la card selezionata senza scroll-snap (scroll programmatico)
    requestAnimationFrame(function() {
        var selCard = charContainer.querySelector(".char-card.selected");
        if (selCard) {
            var scrollPos = selCard.offsetLeft - (charContainer.offsetWidth / 2) + (selCard.offsetWidth / 2);
            charContainer.scrollLeft = scrollPos;
        }
    });
}

function renderCharacterScreen() {
    _renderCharUI();
}

function _drawSnakePreview(canvas, ch) {
    var ctx = canvas.getContext("2d");
    var w = canvas.width, h = canvas.height;
    var cs = 22; // cell size for preview
    // Dark background
    ctx.fillStyle = "#0a0a12";
    ctx.fillRect(0, 0, w, h);
    // Subtle grid
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    for (var gx = 0; gx < w; gx += cs) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, h); ctx.stroke(); }
    for (var gy = 0; gy < h; gy += cs) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(w, gy); ctx.stroke(); }
    // Draw snake body (S shape) - 5 body segments + head
    var segments = [
        {x: 3, y: 4}, // head
        {x: 2, y: 4},
        {x: 1, y: 4},
        {x: 1, y: 3},
        {x: 2, y: 3},
        {x: 3, y: 3}
    ];
    var hcRgb = hRGB(ch.color);
    // Body (tail to head, skip index 0 which is head)
    for (var i = segments.length - 1; i >= 1; i--) {
        var s = segments[i];
        var t = i / (segments.length - 1);
        var alpha = Math.max(0.15, 0.55 - t * 0.42);
        ctx.fillStyle = "rgba(" + hcRgb.r + "," + hcRgb.g + "," + hcRgb.b + "," + alpha + ")";
        ctx.beginPath(); ctx.roundRect(s.x * cs + 1, s.y * cs + 1, cs - 2, cs - 2, 4); ctx.fill();
    }
    // Head
    var hd = segments[0];
    ctx.save(); ctx.shadowColor = ch.color; ctx.shadowBlur = 10;
    ctx.fillStyle = ch.color;
    ctx.beginPath(); ctx.roundRect(hd.x * cs + 1, hd.y * cs + 1, cs - 2, cs - 2, 5); ctx.fill();
    ctx.restore();
    // Eye — character-specific
    var cx = hd.x * cs + cs / 2 + 3.5, cy = hd.y * cs + cs / 2;
    if (ch.id === "wrym") {
        // WRYM: red glowing eye
        ctx.save(); ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 8;
        ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx + 0.5, cy, 1.2, 0, Math.PI * 2); ctx.fill();
    } else if (ch.id === "alfonso") {
        // ALFONSO: warm eye + cheese decoration
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(cx + 1.2, cy, 1.5, 0, Math.PI * 2); ctx.fill();
        // Cheese icon near the snake
        ctx.save(); ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 6;
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath(); ctx.arc(4.2 * cs, 2.2 * cs, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.fillStyle = "#92400e"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("🧀", 4.2 * cs, 2.2 * cs + 3);
    } else {
        // Default eye (SNEK, etc.)
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(cx + 1.2, cy, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    // Decorative: small apple (not for Alfonso who has cheese)
    if (ch.id !== "alfonso") {
        ctx.save(); ctx.shadowColor = "#4ade80"; ctx.shadowBlur = 6;
        ctx.fillStyle = "#4ade80";
        ctx.beginPath(); ctx.arc(4.2 * cs, 2.2 * cs, 5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(4.2 * cs, 2.2 * cs - 5); ctx.lineTo(4.2 * cs + 1, 2.2 * cs - 8); ctx.stroke();
    }
    // WRYM: max segments indicator
    if (ch.id === "wrym") {
        ctx.fillStyle = "rgba(239,68,68,0.7)"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("MAX 7", w / 2, h - 8);
    }
}

function showSettings() {
    settingsPrevState = mState;
    mState = "settings"; settingsIdx = 0;
    settingsTab = "audio"; // Default tab
    renderSettingsScreen();
}

var settingsTab = "audio"; // "audio", "keyboard", "controller"
var settingsPrevState = "slots";

function renderSettingsScreen() {
    var MC = document.getElementById("menu-content");
    MC.textContent = "";
    // Mostra menu-screen se non visibile (es. impostazioni dalla pausa)
    var ms = document.getElementById("menu-screen"); if (ms) ms.classList.add("visible");
    var h2 = document.createElement("h2"); h2.textContent = "\u2699\uFE0F IMPOSTAZIONI"; MC.appendChild(h2);

    // Tabs
    var tabsDiv = document.createElement("div"); tabsDiv.className = "settings-tabs";
    var tabs = [
        { id: "audio", icon: "\uD83D\uDD0A", label: "AUDIO" },
        { id: "keyboard", icon: "\u2328\uFE0F", label: "TASTIERA" },
        { id: "controller", icon: "\uD83C\uDFAE", label: "CONTROLLER" }
    ];
    tabs.forEach(function(tab) {
        var tabEl = document.createElement("div");
        tabEl.className = "settings-tab" + (settingsTab === tab.id ? " active" : "");
        tabEl.textContent = tab.icon + " " + tab.label;
        tabEl.onclick = function() { settingsTab = tab.id; settingsIdx = 0; renderSettingsScreen(); };
        tabsDiv.appendChild(tabEl);
    });
    MC.appendChild(tabsDiv);

    // Content area
    var contentDiv = document.createElement("div"); contentDiv.className = "settings-content";

    if (settingsTab === "audio") {
        renderAudioSettings(contentDiv);
    } else if (settingsTab === "keyboard") {
        renderKeyboardSettings(contentDiv);
    } else if (settingsTab === "controller") {
        renderControllerSettings(contentDiv);
    }

    MC.appendChild(contentDiv);

    // Back button
    var backBtn = document.createElement("div"); backBtn.className = "btn slot-btn"; backBtn.style.cssText = "margin-top:18px;width:200px";
    backBtn.textContent = "\u2190 INDIETRO"; backBtn.onclick = function() { exitSettings(); }; MC.appendChild(backBtn);
}

function renderAudioSettings(container) {
    // SFX Volume
    var sfxRow = document.createElement("div"); sfxRow.className = "setting-row" + (settingsIdx === 0 ? " selected" : "");
    var sfxLabel = document.createElement("span"); sfxLabel.className = "setting-label"; sfxLabel.textContent = "\uD83D\uDD0A Effetti Sonori";
    var sfxSlider = document.createElement("input"); sfxSlider.type = "range"; sfxSlider.min = "0"; sfxSlider.max = "100"; sfxSlider.value = Math.round(settingsState.sfxVol * 100);
    sfxSlider.className = "setting-slider";
    var sfxVal = document.createElement("span"); sfxVal.className = "setting-val"; sfxVal.textContent = Math.round(settingsState.sfxVol * 100) + "%";
    sfxSlider.oninput = function() { settingsState.sfxVol = parseInt(this.value) / 100; sfxVal.textContent = Math.round(settingsState.sfxVol * 100) + "%"; saveSettings(); };
    sfxRow.appendChild(sfxLabel); sfxRow.appendChild(sfxSlider); sfxRow.appendChild(sfxVal); container.appendChild(sfxRow);

    // Music Volume
    var musRow = document.createElement("div"); musRow.className = "setting-row" + (settingsIdx === 1 ? " selected" : "");
    var musLabel = document.createElement("span"); musLabel.className = "setting-label"; musLabel.textContent = "\uD83C\uDFB5 Musica";
    var musSlider = document.createElement("input"); musSlider.type = "range"; musSlider.min = "0"; musSlider.max = "100"; musSlider.value = Math.round(settingsState.musicVol * 100);
    musSlider.className = "setting-slider";
    var musVal = document.createElement("span"); musVal.className = "setting-val"; musVal.textContent = Math.round(settingsState.musicVol * 100) + "%";
    musSlider.oninput = function() { settingsState.musicVol = parseInt(this.value) / 100; musVal.textContent = Math.round(settingsState.musicVol * 100) + "%"; saveSettings(); applySettings(); };
    musRow.appendChild(musLabel); musRow.appendChild(musSlider); musRow.appendChild(musVal); container.appendChild(musRow);
}

function renderKeyboardSettings(container) {
    var hint = document.createElement("div"); hint.className = "settings-hint";
    hint.textContent = "Clicca un tasto per rimapparne l'azione, poi premi il nuovo tasto.";
    container.appendChild(hint);

    KEYMAP_ACTIONS.forEach(function(action, i) {
        var row = document.createElement("div");
        row.className = "setting-row keymap-row" + (settingsIdx === i ? " selected" : "");

        var label = document.createElement("span"); label.className = "setting-label"; label.textContent = action.label;
        var desc = document.createElement("span"); desc.className = "keymap-desc"; desc.textContent = action.desc;

        var keyBtn = document.createElement("div"); keyBtn.className = "keymap-key-btn";
        if (keymapListening && keymapListeningAction === action.id) {
            keyBtn.textContent = "...";
            keyBtn.classList.add("listening");
        } else {
            keyBtn.textContent = formatKeyName(getKeyForAction(action.id));
        }
        keyBtn.onclick = function(e) {
            e.stopPropagation();
            keymapListening = true;
            keymapListeningAction = action.id;
            renderSettingsScreen();
        };

        row.appendChild(label); row.appendChild(desc); row.appendChild(keyBtn);
        container.appendChild(row);
    });

    // Reset button
    var resetRow = document.createElement("div"); resetRow.className = "setting-row keymap-row" + (settingsIdx === KEYMAP_ACTIONS.length ? " selected" : "");
    var resetLabel = document.createElement("span"); resetLabel.className = "setting-label"; resetLabel.textContent = "RIPRISTINA";
    var resetDesc = document.createElement("span"); resetDesc.className = "keymap-desc"; resetDesc.textContent = "Torna ai tasti predefiniti";
    resetRow.appendChild(resetLabel); resetRow.appendChild(resetDesc);
    resetRow.onclick = function() { resetKeymap(); renderSettingsScreen(); };
    resetRow.style.cursor = "pointer";
    container.appendChild(resetRow);
}

// Controller mapping state
var gpButtonMap = {
    confirm: { label: "CONFERMA", desc: "Seleziona / Conferma", defaultBtn: "A / Cross (0)" },
    cancel: { label: "ANNULLA", desc: "Indietro / Annulla", defaultBtn: "B / Circle (1)" },
    ability: { label: "ABILITA", desc: "Usa abilita speciale", defaultBtn: "X / Square (2)" },
    codex: { label: "CODEX", desc: "Apri codex", defaultBtn: "Y / Triangle (3)" },
    pause: { label: "PAUSA", desc: "Pausa gioco", defaultBtn: "Start (9)" }
};

// Controller mapping save/load
function loadGpMapping() {
    try { return JSON.parse(localStorage.getItem("snake_gp_mapping")) || {}; } catch(e) { return {}; }
}
function saveGpMapping(mapping) { localStorage.setItem("snake_gp_mapping", JSON.stringify(mapping)); }
function getGpButton(actionId) { var m = loadGpMapping(); return m[actionId] !== undefined ? m[actionId] : null; }
function formatGpBtn(btnIdx) {
    if (btnIdx === null || btnIdx === undefined) return "?";
    var names = { 0: "A / Cross", 1: "B / Circle", 2: "X / Square", 3: "Y / Triangle", 4: "LB", 5: "RB", 6: "LT", 7: "RT", 8: "Back", 9: "Start", 10: "L3", 11: "R3" };
    return (names[btnIdx] || "Btn " + btnIdx) + " (" + btnIdx + ")";
}

var gpMappingListening = false;
var gpMappingAction = null;

function renderControllerSettings(container) {
    var hint = document.createElement("div"); hint.className = "settings-hint";
    hint.textContent = "Clicca un'azione, poi premi il tasto sul controller per rimapparlo.";
    container.appendChild(hint);

    var actionIds = Object.keys(gpButtonMap);
    actionIds.forEach(function(actionId, i) {
        var action = gpButtonMap[actionId];
        var row = document.createElement("div");
        row.className = "setting-row keymap-row" + (settingsIdx === i ? " selected" : "");

        var label = document.createElement("span"); label.className = "setting-label"; label.textContent = action.label;
        var desc = document.createElement("span"); desc.className = "keymap-desc"; desc.textContent = action.desc;

        var keyBtn = document.createElement("div"); keyBtn.className = "keymap-key-btn gp-key-btn";
        if (gpMappingListening && gpMappingAction === actionId) {
            keyBtn.textContent = "Premi...";
            keyBtn.classList.add("listening");
        } else {
            var savedBtn = getGpButton(actionId);
            keyBtn.textContent = savedBtn !== null ? formatGpBtn(savedBtn) : action.defaultBtn;
        }
        keyBtn.onclick = function(e) {
            e.stopPropagation();
            gpMappingListening = true;
            gpMappingAction = actionId;
            renderSettingsScreen();
        };

        row.appendChild(label); row.appendChild(desc); row.appendChild(keyBtn);
        container.appendChild(row);
    });

    // Reset button
    var resetRow = document.createElement("div"); resetRow.className = "setting-row keymap-row" + (settingsIdx === actionIds.length ? " selected" : "");
    var resetLabel = document.createElement("span"); resetLabel.className = "setting-label"; resetLabel.textContent = "RIPRISTINA";
    var resetDesc = document.createElement("span"); resetDesc.className = "keymap-desc"; resetDesc.textContent = "Torna alla mappatura predefinita";
    resetRow.appendChild(resetLabel); resetRow.appendChild(resetDesc);
    resetRow.onclick = function() { localStorage.removeItem("snake_gp_mapping"); renderSettingsScreen(); };
    resetRow.style.cursor = "pointer";
    container.appendChild(resetRow);

    // Deadzone slider
    var dzRow = document.createElement("div"); dzRow.className = "setting-row" + (settingsIdx === actionIds.length + 1 ? " selected" : "");
    var dzLabel = document.createElement("span"); dzLabel.className = "setting-label"; dzLabel.textContent = "Deadzone";
    var dzSlider = document.createElement("input"); dzSlider.type = "range"; dzSlider.min = "10"; dzSlider.max = "80"; dzSlider.value = Math.round(gpDeadzone * 100);
    dzSlider.className = "setting-slider";
    var dzVal = document.createElement("span"); dzVal.className = "setting-val"; dzVal.textContent = Math.round(gpDeadzone * 100) + "%";
    dzSlider.oninput = function() { gpDeadzone = parseInt(this.value) / 100; dzVal.textContent = Math.round(gpDeadzone * 100) + "%"; localStorage.setItem("snake_gp_deadzone", gpDeadzone); };
    dzRow.appendChild(dzLabel); dzRow.appendChild(dzSlider); dzRow.appendChild(dzVal); container.appendChild(dzRow);
}

function exitSettings() {
    // Nascondi menu-screen se si torna alla pausa (il gioco usa l'overlay)
    if (settingsPrevState === "paused") { var ms = document.getElementById("menu-screen"); if (ms) ms.classList.remove("visible"); mState = "paused"; pauseGame(); }
    else if (settingsPrevState === "difficulty") { mState = "difficulty"; showDifficultyScreen(pendingSlot); }
    else if (settingsPrevState === "character") { mState = "character"; showCharacterScreen(); }
    else { mState = "slots"; showSlotMenu(); }
}
