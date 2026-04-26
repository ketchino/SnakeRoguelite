/* ===== LOGICA BOSS ===== */

function getCompletedRuns() {
    try { return parseInt(localStorage.getItem("snake_completed_runs") || "0"); } catch(e) { return 0; }
}
function incrementCompletedRuns() {
    try { localStorage.setItem("snake_completed_runs", String(getCompletedRuns() + 1)); } catch(e) {}
}

function getBossForZone(zoneIndex) {
    var pool = BOSS_DB.filter(function(b) { return b.zoneIndex === zoneIndex; });
    if (pool.length === 0) return null;
    var completedRuns = getCompletedRuns();
    var normalPool = pool.filter(function(b) { return b.bossType !== "secret"; });
    var secretPool = pool.filter(function(b) { return b.bossType === "secret"; });
    // Entita Senza Nome: solo se sconfitti tutti gli altri boss segreti
    var availablePool = normalPool.slice();
    if (completedRuns >= 25) {
        secretPool.forEach(function(sb) {
            if (sb.id === "entita") {
                // Richiede aver sconfitto tutti gli altri boss segreti
                var allOtherSecrets = BOSS_DB.filter(function(b) { return b.bossType === "secret" && b.id !== "entita"; });
                var unlocks = loadBossUnlocks();
                var allDefeated = allOtherSecrets.every(function(b) { return unlocks.indexOf(b.id) !== -1; });
                if (allDefeated) availablePool.push(sb);
            } else {
                availablePool.push(sb);
            }
        });
    }
    if (availablePool.length === 0) return normalPool[0] || null;
    // Random selection from available pool
    return availablePool[Math.floor(Math.random() * availablePool.length)];
}

function getBossRelicId(bossId) {
    var map = {
        corvo: "piuma", lupo: "occhiolupo", rospo: "linguarospo", tiranno: "coronatiranno",
        draga: "scagliadraga", vuoto: "frammentovuoto", primordiale: "pelleprimordiale",
        bruchi: "setabruchi", newton: "pioggiammele", gufo: "piumagufo", cervo: "cornosaggezza",
        lumaca: "gusciolumaca", coccodrillo: "scagliecocco", leprecauno: "calzinolep",
        mimic: "linguamimic", basilisco: "cristallobasi", fenice: "piumafenice",
        nebula: "nebbianebula", astro: "pulsar", occhio: "irideabisso", entita: "ilnome"
    };
    return map[bossId] || null;
}

/* Pull the snake one step toward (tx,ty) while keeping body coherent */
function _pullSnakeStep(G, z, tx, ty) {
    if (G.snake.length === 0) return;
    var hd = G.snake[0];
    var dx = Math.sign(tx - hd.x), dy = Math.sign(ty - hd.y);
    if (dx === 0 && dy === 0) return;
    var nx = hd.x + dx, ny = hd.y + dy;
    if (nx < 0 || nx >= z.c || ny < 0 || ny >= z.r) return;
    // Don't pull into own body (except tail which will be removed)
    var intoBody = false;
    for (var i = 0; i < G.snake.length - 1; i++) {
        if (G.snake[i].x === nx && G.snake[i].y === ny) { intoBody = true; break; }
    }
    if (intoBody) return;
    G.snake.unshift({ x: nx, y: ny });
    G.snake.pop();
}

function bossCells(boss) {
    if (!boss) return [];
    // I Tre Bruchi: return all alive caterpillar segments (they have physical presence even though no anchor)
    if (boss.id === "bruchi" && boss.caterpillars) {
        var cells = [];
        boss.caterpillars.forEach(function(cat) {
            if (cat.alive) {
                cat.segments.forEach(function(seg) { cells.push({ x: seg.x, y: seg.y }); });
            }
        });
        return cells;
    }
    // Coccodrillo and Entita don't occupy physical cells
    if (boss.noPhysical) return [];
    return [{ x: boss.anchorX, y: boss.anchorY }, { x: boss.anchorX + 1, y: boss.anchorY }, { x: boss.anchorX, y: boss.anchorY + 1 }, { x: boss.anchorX + 1, y: boss.anchorY + 1 }];
}

function initBoss(G, z, bossDef, fx) {
    var ax = Math.min(z.c - 3, z.c - 4), ay = 2;
    G.boss = { id: bossDef.id, name: bossDef.name, icon: bossDef.icon, hp: bossDef.hp, maxHp: bossDef.hp, anchorX: ax, anchorY: ay, moveTimer: 0, poisonTimer: 0, goldenTimer: 0, goldenCollected: 0, defeated: false, phase: 1, phaseTransitioned: false, collectType: bossDef.collectType, collectName: bossDef.collectName, collectColor: bossDef.collectColor, attackCells: [] };

    // Boss-specific initial state
    if (bossDef.id === "corvo") { G.boss.diveTimer = 0; G.boss.gustDir = 0; }
    if (bossDef.id === "lupo") { G.boss.teleportTimer = 0; G.boss.shadowPos = null; G.boss.shadowLife = 0; G.boss.visible = true; G.boss.clawTimer = 0; G.boss.clawCells = []; G.boss.tpPreview = null; G.boss.tpPreviewLife = 0; }
    if (bossDef.id === "rospo") { G.boss.tongueTimer = 0; G.boss.tongueCells = []; G.boss.tongueLife = 0; }
    if (bossDef.id === "tiranno") { G.boss.guardTimer = 0; G.boss.guardCount = 0; G.boss.shockwaveTimer = 0; }
    if (bossDef.id === "draga") { G.boss.phase = 1; G.boss.breathCells = []; G.boss.breathLife = 0; }
    if (bossDef.id === "vuoto") { G.boss.phase = 1; G.boss.gravityTimer = 0; G.boss.voidZoneCells = []; }
    if (bossDef.id === "primordiale") { G.boss.phase = 1; G.boss.altDir = 1; G.boss.tailTimer = 0; G.boss.berserkTimer = 0; G.boss.ringCells = []; G.boss.ringLife = 0; }
    // NEW BOSSES
    if (bossDef.id === "bruchi") {
        G.boss.noPhysical = true; // Boss has no single anchor body - caterpillars roam independently
        G.boss.bruchiCount = 3;
        G.boss.caterpillars = [];
        // Create 3 independent caterpillar snakes, each 3 segments long
        var catDirs = [{x:1,y:0},{x:-1,y:0},{x:0,y:1}];
        var catStartPositions = [
            {x: 2, y: 2},
            {x: Math.floor(z.c/2), y: z.r - 3},
            {x: z.c - 5, y: Math.floor(z.r/2)}
        ];
        for (var ci = 0; ci < 3; ci++) {
            var sx = Math.max(2, Math.min(z.c - 3, catStartPositions[ci].x));
            var sy = Math.max(2, Math.min(z.r - 3, catStartPositions[ci].y));
            var dir = catDirs[ci];
            G.boss.caterpillars.push({
                alive: true,
                segments: [
                    {x: sx, y: sy},
                    {x: sx - dir.x, y: sy - dir.y},
                    {x: sx - dir.x * 2, y: sy - dir.y * 2}
                ],
                dir: {x: dir.x, y: dir.y},
                moveTimer: 0,
                dirChangeTimer: 0,
                nextDir: null
            });
        }
    }
    if (bossDef.id === "newton") { G.boss.appleTimer = 0; G.boss.rainTimer = 0; G.boss.gravityTimer = 0; }
    if (bossDef.id === "gufo") { G.boss.blockTimer = 0; G.boss.headDir = 0; G.boss.blockCells = []; }
    if (bossDef.id === "cervo") { G.boss.quizActive = false; G.boss.quizQuestion = 0; G.boss.quizCorrect = 0; G.boss.quizTimer = 0; G.boss.quizAnswered = false; G.boss.noPhysical = true; G.boss.quizPool = []; G.boss.quizCurrent = null; G.boss.quizStartTime = 0; G.boss.quizTimeLimit = 30; G.boss.quizHoverIdx = -1; G.boss.quizWrongCount = 0; G.boss.quizLastResult = null; G.cervoSnakeBackup = null; _initCervoQuiz(G); _cleanupCervoOverlay(); }
    if (bossDef.id === "lumaca") { G.boss.trailCells = []; G.boss.foamTimer = 0; G.boss.trailTick = 0; }
    if (bossDef.id === "coccodrillo") { G.boss.noPhysical = true; G.boss.biteTimer = 0; G.boss.mudTimer = 0; G.boss.eyePositions = []; }
    if (bossDef.id === "leprecauno") { G.boss.coinRainTimer = 0; G.boss.dashTimer = 0; G.boss.coinCells = []; }
    if (bossDef.id === "mimic") { G.boss.hidden = true; G.boss.mimicPos = null; G.boss.trapTimer = 0; G.boss.miniMimicTimer = 0; G.boss.copyTimer = 0; }
    if (bossDef.id === "basilisco") { G.boss.gazeTimer = 0; G.boss.gazeWarning = 0; G.boss.lavaTrailCells = []; G.boss.vulcanTimer = 0; G.boss.eruptionTimer = 0; }
    if (bossDef.id === "fenice") { G.boss.featherTimer = 0; G.boss.feniceKills = 0; G.boss.exploded = false; }
    if (bossDef.id === "nebula") { G.boss.expandTimer = 0; G.boss.expanded = false; G.boss.expandCells = []; G.boss.suckTimer = 0; G.boss.shardTimer = 0; G.boss.scatterTimer = 0; }
    if (bossDef.id === "astro") { G.boss.attractTimer = 0; G.boss.flareTimer = 0; G.boss.collapseTimer = 0; G.boss.collapsing = false; }
    if (bossDef.id === "occhio") { G.boss.rayTimer = 0; G.boss.clones = []; G.boss.petrifyTimer = 0; G.boss.realBossIdx = 0; }
    if (bossDef.id === "entita") { G.boss.noPhysical = true; G.boss.survivalTick = 0; G.boss.survivalTarget = 60; G.boss.dissolveCells = []; G.boss.dissolveTimer = 0; G.boss.voidZoneTimer = 0; G.boss.distortTimer = 0; G.boss.hp = 1; G.boss.maxHp = 1; }

    G.crack = null;
    G.foods = [];
    G.obstacles = [];
    G.enemies = [];
    G.traps = [];
    G.pendingObs = [];
    // Spawn first collectible (unless boss has no collectibles)
    if (bossDef.collectType !== "none" && bossDef.collectType !== "answer") {
        var gf = getECSafe(G, z);
        if (gf) G.foods.push({ x: gf.x, y: gf.y, type: bossDef.collectType });
    }
    // For Signor Cervo, start the quiz immediately (canvas-based, no DOM overlay)
    // Hide the snake during the quiz — backup its state and remove from map
    if (bossDef.id === "cervo") {
        G.cervoSnakeBackup = G.snake.slice(); // backup snake segments
        G.snake = []; // hide snake from map
        G.boss.quizActive = true;
        _showCervoQuestionCanvas(G, z, fx);
    }
    discover("boss_" + bossDef.id);
    if (fx && fx.onDiscover) fx.onDiscover("boss_" + bossDef.id);
    return G.boss;
}

/* ===== CERVO QUIZ SYSTEM ===== */
function _initCervoQuiz(G) {
    // Shuffle and pick 5 questions
    var pool = CERVO_QUIZ.slice();
    for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
    G.boss.quizPool = pool.slice(0, 5);
    G.boss.quizQuestion = 0;
    G.boss.quizCorrect = 0;
    G.boss.quizTimer = 0;
    G.boss.quizAnswered = false;
}

function _showCervoQuestionCanvas(G, z, fx) {
    if (G.boss.quizQuestion >= 5) {
        // Quiz finished — restore the snake
        G.boss.quizActive = false;
        G.boss.quizCurrent = null;
        if (G.cervoSnakeBackup && G.cervoSnakeBackup.length > 0) {
            G.snake = G.cervoSnakeBackup;
            G.cervoSnakeBackup = null;
        }
        if (G.boss.quizCorrect >= 3) {
            G.boss.hp = 0; G.boss.defeated = true;
            if (fx && fx.onBossDefeated) fx.onBossDefeated();
        } else {
            G.boss.defeated = true; // Lost the quiz
            if (fx && fx.onBossDefeated) fx.onBossDefeated();
        }
        return;
    }
    G.boss.quizCurrent = G.boss.quizPool[G.boss.quizQuestion];
    G.boss.quizStartTime = Date.now();
    G.boss.quizTimer = 30; // 30 seconds to answer
    G.boss.quizAnswered = false;
    G.boss.quizHoverIdx = -1;
}

function _renderCervoDialog(G) { // DEPRECATED: quiz now rendered on canvas
    // No-op: quiz is now canvas-based, not DOM-based
}
function _hideCervoDialog() { // DEPRECATED: quiz now rendered on canvas
    // Cleanup any stale DOM overlay
    var overlay = document.getElementById("cervo-quiz-overlay");
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
}
function _cleanupCervoOverlay() {
    var overlay = document.getElementById("cervo-quiz-overlay");
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
}

function _answerCervoQuestionCanvas(G, answer) {
    if (G.boss.quizAnswered) return;
    G.boss.quizAnswered = true;
    var correct = G.boss.quizCurrent.a;
    if (answer === correct) {
        G.boss.quizCorrect++;
        G.boss.hp--;
        G.boss.quizLastResult = "correct";
        if (G.snake.length > 0 && typeof addF === "function") addF(G.snake[0].x, G.snake[0].y, "CORRETTO!", "#4ade80");
    } else {
        // Wrong answer: immediately lose 1 HP
        G.hp--;
        G.boss.quizWrongCount++;
        G.boss.quizLastResult = "wrong";
        if (G.snake.length > 0 && typeof addF === "function") addF(G.snake[0].x, G.snake[0].y, "SBAGLIATO! -1 HP", "#ef4444");
        if (typeof screenFlash !== "undefined") screenFlash = 8;
        if (typeof flashClr !== "undefined") flashClr = "rgba(255,0,0,0.3)";
    }
    // Check if player died from wrong answer
    if (G.hp <= 0) {
        G.boss.quizActive = false;
        G.boss.quizCurrent = null;
        // Restore snake so death rendering works
        if (G.cervoSnakeBackup && G.cervoSnakeBackup.length > 0) {
            G.snake = G.cervoSnakeBackup;
            G.cervoSnakeBackup = null;
        }
        return; // Player is dead, game over will trigger naturally
    }
    G.boss.quizQuestion++;
    // Next question after brief delay (1.2 seconds)
    setTimeout(function() { _showCervoQuestionCanvas(G, CZ(G), typeof fx !== "undefined" ? fx : null); }, 1200);
}

function tickBoss(G, z, fx) {
    if (!G.boss || G.boss.defeated) return true;
    var bossDef = null;
    for (var i = 0; i < BOSS_DB.length; i++) { if (BOSS_DB[i].id === G.boss.id) { bossDef = BOSS_DB[i]; break; } }
    if (!bossDef) return true;
    var boss = G.boss;
    var bid = boss.id;

    // Special handling: Entita Senza Nome (survival)
    if (bid === "entita") { return _tickEntita(G, z, fx, boss, bossDef); }
    // Special handling: Signor Cervo (quiz)
    if (bid === "cervo") { return _tickCervo(G, z, fx, boss, bossDef); }

    // Decay existing attack cells
    for (var aci = boss.attackCells.length - 1; aci >= 0; aci--) {
        var ac = boss.attackCells[aci];
        ac.life--;
        if (ac.fadein > 0) ac.fadein--;
        else if (ac.fadein === 0) {
            ac.fadein = -1;
            var hdAtk = G.snake[0];
            if (hdAtk.x === ac.x && hdAtk.y === ac.y && G.invincible <= 0) {
                if (G.ilnome && Math.random() < 0.2) {
                    if (fx && fx.addF) fx.addF(hdAtk.x, hdAtk.y, "SCHIVATO!", "#a78bfa");
                } else if (G.scagliecocco && G.scaglieCoccoCD <= 0) {
                    G.scaglieCoccoCD = 20;
                    if (fx && fx.addF) fx.addF(hdAtk.x, hdAtk.y, "SCAGLIE COCCO!", "#bef264");
                } else {
                    takeDamage(G, z, null, fx, "Attacco Boss");
                    if (fx && fx.sBossDmgPlayer) fx.sBossDmgPlayer();
                }
            }
            if (fx && fx.onShake) fx.onShake(2);
        }
        if (ac.life <= 0) boss.attackCells.splice(aci, 1);
    }
    // Check if snake is standing on any active attack cell
    if (G.invincible <= 0) {
        var hdCheck = G.snake[0];
        for (var aci2 = 0; aci2 < boss.attackCells.length; aci2++) {
            var ac2 = boss.attackCells[aci2];
            if (ac2.fadein <= 0 && ac2.x === hdCheck.x && ac2.y === hdCheck.y) {
                if (G.ilnome && Math.random() < 0.2) {
                    if (fx && fx.addF) fx.addF(hdCheck.x, hdCheck.y, "SCHIVATO!", "#a78bfa");
                    break;
                }
                if (G.scagliecocco && G.scaglieCoccoCD <= 0) {
                    G.scaglieCoccoCD = 20;
                    if (fx && fx.addF) fx.addF(hdCheck.x, hdCheck.y, "SCAGLIE COCCO!", "#bef264");
                    break;
                }
                takeDamage(G, z, null, fx, "Attacco Boss");
                if (fx && fx.sBossDmgPlayer) fx.sBossDmgPlayer();
                break;
            }
        }
    }
    if (G.scagliecocco && G.scaglieCoccoCD > 0) G.scaglieCoccoCD--;

    // Helper functions
    function bossMoveAggressive(bInt) {
        boss.moveTimer++;
        if (boss.moveTimer >= bInt) {
            boss.moveTimer = 0;
            var hd = G.snake[0];
            var dx = Math.sign(hd.x - boss.anchorX), dy = Math.sign(hd.y - boss.anchorY);
            var dirs = [];
            if (dx !== 0 || dy !== 0) dirs.push({ x: dx, y: dy });
            if (dx !== 0) dirs.push({ x: dx, y: 0 });
            if (dy !== 0) dirs.push({ x: 0, y: dy });
            var allDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
            for (var adi = 0; adi < allDirs.length; adi++) {
                if (!dirs.some(function(d) { return d.x === allDirs[adi].x && d.y === allDirs[adi].y; })) dirs.push(allDirs[adi]);
            }
            for (var di = 0; di < dirs.length; di++) {
                var nax = boss.anchorX + dirs[di].x, nay = boss.anchorY + dirs[di].y;
                if (nax < 0 || nax + 1 >= z.c || nay < 0 || nay + 1 >= z.r) continue;
                var overlapCount = 0;
                var cells = [{ x: nax, y: nay }, { x: nax + 1, y: nay }, { x: nax, y: nay + 1 }, { x: nax + 1, y: nay + 1 }];
                for (var ci = 0; ci < cells.length; ci++) {
                    if (G.snake.some(function (s) { return s.x === cells[ci].x && s.y === cells[ci].y; })) overlapCount++;
                }
                var foodOverlap = false;
                for (var ci2 = 0; ci2 < cells.length; ci2++) {
                    if (G.foods.some(function (f) { return f.x === cells[ci2].x && f.y === cells[ci2].y; })) { foodOverlap = true; break; }
                }
                if (overlapCount < 2 && !foodOverlap) { boss.anchorX = nax; boss.anchorY = nay; break; }
            }
        }
    }
    function spawnPoisonSafe(minDist) {
        boss.poisonTimer++;
        if (boss.poisonTimer >= bossDef.poisonInterval) {
            boss.poisonTimer = 0;
            var pc = getECSafe(G, z);
            var poisonLife = 12;
            if (G.setabruchi) poisonLife -= 3;
            if (G.gusciolumaca) poisonLife -= 5;
            if (pc) G.foods.push({ x: pc.x, y: pc.y, type: "poison", life: Math.max(3, poisonLife), fadein: 3 });
        }
    }
    function spawnGolden(interval) {
        boss.goldenTimer++;
        var effInterval = interval || bossDef.goldenInterval;
        if (G.cornosaggezza && effInterval > 0) { /* handled via longer food life, not faster spawn */ }
        if (boss.goldenTimer >= effInterval) {
            boss.goldenTimer = 0;
            var gc = getECSafe(G, z);
            if (gc) {
                var foodLife = undefined; // boss collectibles don't expire by default
                G.foods.push({ x: gc.x, y: gc.y, type: bossDef.collectType });
            }
        }
    }
    function addAttackCell(x, y, attackType, color, fadein) {
        if (x < 0 || x >= z.c || y < 0 || y >= z.r) return;
        if (G.snake.some(function(s) { return s.x === x && s.y === y; })) return;
        if (G.foods.some(function(f) { return f.x === x && f.y === y; })) return;
        var fi = fadein || 2;
        if (G.piumagufo) fi += 2; // +2 tick preavviso
        boss.attackCells.push({ x: x, y: y, type: attackType, color: color, fadein: fi, life: fi + 4 });
    }
    function bossTeleport() {
        var oldX = boss.anchorX, oldY = boss.anchorY;
        for (var t = 0; t < 50; t++) {
            var nx = Math.floor(Math.random() * (z.c - 2));
            var ny = Math.floor(Math.random() * (z.r - 2));
            if (nx < 0 || ny < 0 || nx + 1 >= z.c || ny + 1 >= z.r) continue;
            var cells = [{ x: nx, y: ny }, { x: nx + 1, y: ny }, { x: nx, y: ny + 1 }, { x: nx + 1, y: ny + 1 }];
            var blocked = false;
            for (var ci = 0; ci < cells.length; ci++) {
                if (G.snake.some(function (s) { return s.x === cells[ci].x && s.y === cells[ci].y; })) { blocked = true; break; }
                if (Math.abs(cells[ci].x - G.snake[0].x) + Math.abs(cells[ci].y - G.snake[0].y) <= 3) { blocked = true; break; }
            }
            if (!blocked) {
                boss.shadowPos = { x: oldX, y: oldY };
                boss.shadowLife = 2;
                boss.anchorX = nx;
                boss.anchorY = ny;
                break;
            }
        }
    }
    function addPoisonSafe(x, y, life, minDist) {
        var hd = G.snake[0];
        if (Math.abs(x - hd.x) + Math.abs(y - hd.y) < (minDist || 4)) return;
        if (x < 0 || x >= z.c || y < 0 || y >= z.r) return;
        if (G.snake.some(function(s) { return s.x === x && s.y === y; })) return;
        if (G.foods.some(function(f) { return f.x === x && f.y === y; })) return;
        var poisonLife = life || 8;
        if (G.setabruchi) poisonLife -= 3;
        if (G.gusciolumaca) poisonLife -= 5;
        G.foods.push({ x: x, y: y, type: "poison", life: Math.max(3, poisonLife), fadein: 2 });
    }

    // ====================================================================
    // === BOSS AI BLOCKS
    // ====================================================================

    // === CORVO GIGANTE (Zone 0) ===
    if (bid === "corvo") {
        bossMoveAggressive(bossDef.moveInterval);
        spawnPoisonSafe(bossDef.poisonInterval);
        spawnGolden(bossDef.goldenInterval);
        boss.diveTimer = (boss.diveTimer || 0) + 1;
        if (boss.diveTimer >= 8) {
            boss.diveTimer = 0;
            var hd0 = G.snake[0];
            boss.gustDir = (boss.gustDir || 0) === 0 ? 1 : 0;
            if (boss.gustDir === 0) {
                for (var gi = 0; gi < z.c; gi++) addAttackCell(gi, hd0.y, "dive", bossDef.color, 5);
            } else {
                for (var gj = 0; gj < z.r; gj++) addAttackCell(hd0.x, gj, "dive", bossDef.color, 5);
            }
            if (fx && fx.onShake) fx.onShake(2);
        }
    }
    // === I TRE BRUCHI (Zone 0) ===
    // Three independent snakes (3 segments each) that roam the map
    else if (bid === "bruchi") {
        spawnGolden(bossDef.goldenInterval);
        var moveInterval = boss.bruchiCount <= 1 ? 3 : 5; // Last caterpillar is faster
        var allDirs4 = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];

        // Update each alive caterpillar
        boss.caterpillars.forEach(function(cat) {
            if (!cat.alive) return;

            cat.moveTimer++;
            if (cat.moveTimer >= moveInterval) {
                cat.moveTimer = 0;

                // Try to move in current direction
                var headX = cat.segments[0].x;
                var headY = cat.segments[0].y;
                var nx = headX + cat.dir.x;
                var ny = headY + cat.dir.y;

                // Check if movement is valid
                var canMove = nx >= 0 && nx < z.c && ny >= 0 && ny < z.r;

                // Avoid obstacles, other caterpillars, and foods
                if (canMove) {
                    var blocked = false;
                    // Check obstacles
                    if (G.obstacles.some(function(o) { return o.x === nx && o.y === ny; })) blocked = true;
                    // Check foods (don't overlap with collectibles or poison)
                    if (G.foods.some(function(f) { return f.x === nx && f.y === ny; })) blocked = true;
                    // Check snake
                    if (G.snake.some(function(s) { return s.x === nx && s.y === ny; })) blocked = true;
                    // Check other caterpillar segments
                    boss.caterpillars.forEach(function(otherCat) {
                        if (otherCat.alive && otherCat !== cat) {
                            if (otherCat.segments.some(function(seg) { return seg.x === nx && seg.y === ny; })) blocked = true;
                        }
                    });
                    canMove = !blocked;
                }

                // If can't move, try other directions (avoid reverse)
                if (!canMove) {
                    var reverseDir = {x: -cat.dir.x, y: -cat.dir.y};
                    var shuffledDirs = allDirs4.slice();
                    // Fisher-Yates shuffle
                    for (var sdi = shuffledDirs.length - 1; sdi > 0; sdi--) {
                        var sdj = Math.floor(Math.random() * (sdi + 1));
                        var tmp = shuffledDirs[sdi]; shuffledDirs[sdi] = shuffledDirs[sdj]; shuffledDirs[sdj] = tmp;
                    }
                    // Prefer directions that move toward the snake (slight chase behavior)
                    var hdCat = G.snake[0];
                    var preferX = Math.sign(hdCat.x - headX);
                    var preferY = Math.sign(hdCat.y - headY);

                    for (var dci = 0; dci < shuffledDirs.length; dci++) {
                        var tryDir = shuffledDirs[dci];
                        // Never reverse (would cause self-collision for snake-like movement)
                        if (tryDir.x === reverseDir.x && tryDir.y === reverseDir.y) continue;
                        var tnx = headX + tryDir.x;
                        var tny = headY + tryDir.y;
                        if (tnx < 0 || tnx >= z.c || tny < 0 || tny >= z.r) continue;
                        var tBlocked = false;
                        if (G.obstacles.some(function(o) { return o.x === tnx && o.y === tny; })) tBlocked = true;
                        if (G.foods.some(function(f) { return f.x === tnx && f.y === tny; })) tBlocked = true;
                        if (G.snake.some(function(s) { return s.x === tnx && s.y === tny; })) tBlocked = true;
                        boss.caterpillars.forEach(function(otherCat2) {
                            if (otherCat2.alive && otherCat2 !== cat) {
                                if (otherCat2.segments.some(function(seg) { return seg.x === tnx && seg.y === tny; })) tBlocked = true;
                            }
                        });
                        if (!tBlocked) {
                            cat.dir = tryDir;
                            nx = tnx;
                            ny = tny;
                            canMove = true;
                            break;
                        }
                    }
                }

                // If still can't move (trapped), try reverse as last resort
                if (!canMove) {
                    var rnx = headX + reverseDir.x;
                    var rny = headY + reverseDir.y;
                    if (rnx >= 0 && rnx < z.c && rny >= 0 && rny < z.r) {
                        var rBlocked = false;
                        if (G.obstacles.some(function(o) { return o.x === rnx && o.y === rny; })) rBlocked = true;
                        if (G.snake.some(function(s) { return s.x === rnx && s.y === rny; })) rBlocked = true;
                        if (!rBlocked) {
                            cat.dir = reverseDir;
                            nx = rnx;
                            ny = rny;
                            canMove = true;
                        }
                    }
                }

                if (canMove) {
                    // Move like a snake: add new head, remove tail
                    cat.segments.unshift({x: nx, y: ny});
                    cat.segments.pop();
                }
            }

            // Random direction change every 8-15 ticks
            cat.dirChangeTimer++;
            if (cat.dirChangeTimer >= (8 + Math.floor(Math.random() * 8))) {
                cat.dirChangeTimer = 0;
                var hdRnd = G.snake[0];
                var headPos = cat.segments[0];
                // 50% chance to turn toward player, 50% random
                if (Math.random() < 0.5) {
                    var prefX = Math.sign(hdRnd.x - headPos.x);
                    var prefY = Math.sign(hdRnd.y - headPos.y);
                    if (prefX !== 0 && cat.dir.x === 0) cat.dir = {x: prefX, y: 0};
                    else if (prefY !== 0 && cat.dir.y === 0) cat.dir = {x: 0, y: prefY};
                } else {
                    // Random turn
                    var turnOpts = [];
                    if (cat.dir.x !== 0) { turnOpts.push({x:0,y:1}); turnOpts.push({x:0,y:-1}); }
                    else { turnOpts.push({x:1,y:0}); turnOpts.push({x:-1,y:0}); }
                    cat.dir = turnOpts[Math.floor(Math.random() * turnOpts.length)];
                }
            }
        });

        // Check collision: player snake head vs caterpillar segments
        if (G.invincible <= 0) {
            var hdB = G.snake[0];
            var hitByCat = false;
            boss.caterpillars.forEach(function(cat) {
                if (!cat.alive || hitByCat) return;
                for (var si = 0; si < cat.segments.length; si++) {
                    if (cat.segments[si].x === hdB.x && cat.segments[si].y === hdB.y) {
                        if (G.ilnome && Math.random() < 0.2) {
                            if (fx && fx.addF) fx.addF(hdB.x, hdB.y, "SCHIVATO!", "#a78bfa");
                        } else {
                            takeDamage(G, z, null, fx, "Bruco");
                            if (fx && fx.sBossDmgPlayer) fx.sBossDmgPlayer();
                        }
                        hitByCat = true;
                        break;
                    }
                }
            });
        }
    }
    // === ISAAC NEWTON (Zone 0 SECRET) ===
    else if (bid === "newton") {
        bossMoveAggressive(bossDef.moveInterval);
        spawnGolden(bossDef.goldenInterval);
        // Newtonian apple: every 5 tick, apple falls toward snake, bounces once (6 cells total)
        boss.appleTimer = (boss.appleTimer || 0) + 1;
        if (boss.appleTimer >= 5) {
            boss.appleTimer = 0;
            var hdN = G.snake[0];
            var ndx = Math.sign(hdN.x - (boss.anchorX + 1)), ndy = Math.sign(hdN.y - (boss.anchorY + 1));
            if (ndx === 0 && ndy === 0) ndx = 1;
            for (var nai = 1; nai <= 6; nai++) {
                var nax = boss.anchorX + 1 + ndx * nai, nay = boss.anchorY + 1 + ndy * nai;
                addAttackCell(nax, nay, "fire", "#facc15", 3);
            }
        }
        // Apple rain: every 12 tick, 4 apples fall randomly
        boss.rainTimer = (boss.rainTimer || 0) + 1;
        if (boss.rainTimer >= 12) {
            boss.rainTimer = 0;
            for (var nri = 0; nri < 4; nri++) {
                var rrx = Math.floor(Math.random() * z.c), rry = Math.floor(Math.random() * z.r);
                addAttackCell(rrx, rry, "fire", "#fde047", 4);
            }
            if (fx && fx.onShake) fx.onShake(3);
        }
        // Gravity: pull snake toward Newton every 6 tick
        boss.gravityTimer = (boss.gravityTimer || 0) + 1;
        if (boss.gravityTimer >= 6) {
            boss.gravityTimer = 0;
            if (G.cristallobasi) return; // immune to pull
            _pullSnakeStep(G, z, boss.anchorX + 1, boss.anchorY + 1);
        }
    }
    // === IL GUFO (Zone 1) ===
    else if (bid === "gufo") {
        bossMoveAggressive(bossDef.moveInterval);
        spawnGolden(bossDef.goldenInterval);
        boss.blockTimer = (boss.blockTimer || 0) + 1;
        var blockInterval = boss.phase >= 2 ? 4 : 6;
        var blockFadein = boss.phase >= 2 ? 3 : 4;
        if (boss.blockTimer >= blockInterval) {
            boss.blockTimer = 0;
            // Rotate head to indicate direction
            boss.headDir = (boss.headDir || 0) + 1;
            var direction = boss.headDir % 4; // 0=top, 1=right, 2=bottom, 3=left
            var shapes = [
                [[0,0],[1,0],[2,0],[3,0]], // I piece horizontal
                [[0,0],[0,1],[1,1],[2,1],[2,0]], // L piece
                [[0,0],[1,0],[2,0],[1,1]], // T piece
                [[0,0],[1,0],[0,1],[1,1]], // O piece
                [[0,1],[1,1],[1,0],[2,0]], // S piece
                [[0,0],[1,0],[1,1],[2,1]]  // Z piece
            ];
            var shape = shapes[Math.floor(Math.random() * (boss.phase >= 2 ? shapes.length : 4))];
            // Spawn position depends on direction
            var startX = Math.floor(Math.random() * Math.max(1, z.c - 5));
            var startY = Math.floor(Math.random() * Math.max(1, z.r - 5));
            shape.forEach(function(s) {
                var bx = startX + s[0], by = startY + s[1];
                if (direction === 0) { /* from top, already correct */ }
                else if (direction === 2) { by = z.r - 1 - s[1]; }
                else if (direction === 1) { var tmp = s[0]; bx = startX + s[1]; by = startY + tmp; }
                else { var tmp2 = s[0]; bx = startX + s[1]; by = startY + tmp2; }
                addAttackCell(bx, by, "shockwave", "#d97706", blockFadein);
            });
            if (fx && fx.onShake) fx.onShake(2);
        }
        // Phase 2 at HP 3
        if (boss.hp <= 3 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2; boss.phaseTransitioned = true;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(217,119,6,.4)");
            if (fx && fx.onShake) fx.onShake(20);
        }
    }
    // === IL LUPO OMBRA (Zone 1) ===
    else if (bid === "lupo") {
        boss.teleportTimer++;
        if (boss.teleportTimer >= 10 && !boss.tpPreview) {
            for (var t = 0; t < 50; t++) {
                var nx = Math.floor(Math.random() * (z.c - 2));
                var ny = Math.floor(Math.random() * (z.r - 2));
                if (nx < 0 || ny < 0 || nx + 1 >= z.c || ny + 1 >= z.r) continue;
                var cells = [{ x: nx, y: ny }, { x: nx + 1, y: ny }, { x: nx, y: ny + 1 }, { x: nx + 1, y: ny + 1 }];
                var blocked = false;
                for (var ci = 0; ci < cells.length; ci++) {
                    if (G.snake.some(function (s) { return s.x === cells[ci].x && s.y === cells[ci].y; })) { blocked = true; break; }
                    if (Math.abs(cells[ci].x - G.snake[0].x) + Math.abs(cells[ci].y - G.snake[0].y) <= 3) { blocked = true; break; }
                }
                if (!blocked) {
                    boss.tpPreview = { x: nx, y: ny }; boss.tpPreviewLife = 3; break;
                }
            }
        }
        if (boss.tpPreview && boss.tpPreviewLife > 0) {
            boss.tpPreviewLife--;
            if (boss.tpPreviewLife === 2) {
                var prevCells = [{ x: boss.tpPreview.x, y: boss.tpPreview.y }, { x: boss.tpPreview.x + 1, y: boss.tpPreview.y }, { x: boss.tpPreview.x, y: boss.tpPreview.y + 1 }, { x: boss.tpPreview.x + 1, y: boss.tpPreview.y + 1 }];
                for (var pci = 0; pci < prevCells.length; pci++) addAttackCell(prevCells[pci].x, prevCells[pci].y, "claw", "#a78bfa", 3);
            }
        }
        if (boss.tpPreview && boss.tpPreviewLife <= 0) {
            var oldX = boss.anchorX, oldY = boss.anchorY;
            boss.shadowPos = { x: oldX, y: oldY }; boss.shadowLife = 4;
            boss.anchorX = boss.tpPreview.x; boss.anchorY = boss.tpPreview.y;
            boss.tpPreview = null; boss.tpPreviewLife = 0; boss.teleportTimer = 0;
        }
        if (boss.shadowLife > 0) boss.shadowLife--;
        if (boss.shadowLife <= 0) boss.shadowPos = null;
        spawnGolden(6);
        boss.clawTimer++;
        if (boss.clawTimer >= 8 && boss.clawCells.length === 0) {
            boss.clawTimer = 0;
            var hd1 = G.snake[0];
            var ldx = Math.sign(hd1.x - boss.anchorX), ldy = Math.sign(hd1.y - boss.anchorY);
            if (ldx === 0 && ldy === 0) ldx = 1;
            boss.clawCells = [];
            for (var cli = 1; cli <= 3; cli++) {
                var cx2 = boss.anchorX + ldx * cli, cy2 = boss.anchorY + ldy * cli;
                if (cx2 >= 0 && cx2 < z.c && cy2 >= 0 && cy2 < z.r) {
                    boss.clawCells.push({ x: cx2, y: cy2 });
                    addAttackCell(cx2, cy2, "claw", "#818cf8", 3);
                    var perpX = -ldy, perpY = ldx;
                    if (cli === 2) {
                        addAttackCell(cx2 + perpX, cy2 + perpY, "claw", "#818cf8", 3);
                        addAttackCell(cx2 - perpX, cy2 - perpY, "claw", "#818cf8", 3);
                    }
                }
            }
        }
        if (boss.clawCells.length > 0) {
            boss.clawLife = (boss.clawLife || 0) - 1;
            if (boss.clawLife <= -3) {
                boss.clawCells.forEach(function(cc) { addPoisonSafe(cc.x, cc.y, 6, 2); });
                boss.clawCells = []; boss.clawLife = 0;
            }
        }
        bossMoveAggressive(8);
    }
    // === LA LUMACA COLOSSALE (Zone 2) ===
    else if (bid === "lumaca") {
        var lumMoveInt = boss.phase >= 2 ? 6 : 8;
        bossMoveAggressive(lumMoveInt);
        var lumGoldenInt = boss.phase >= 2 ? 5 : 6;
        spawnGolden(lumGoldenInt);
        // Toxic trail
        boss.trailTick = (boss.trailTick || 0) + 1;
        var trailInterval = boss.phase >= 2 ? 1 : 1; // every tick when moving
        if (boss.moveTimer === 0) { // Boss just moved
            var trailLen = boss.phase >= 2 ? 3 : 1;
            var trailWidth = boss.phase >= 2 ? 3 : 1;
            for (var twi = 0; twi < trailLen; twi++) {
                for (var twj = 0; twj < trailWidth; twj++) {
                    var twx = boss.anchorX - twi + (twj === 0 ? 0 : twj === 1 ? -1 : 1);
                    var twy = boss.anchorY + twj;
                    var trailLife = boss.phase >= 2 ? 25 : 15;
                    addAttackCell(twx, twy, "ring", "#84cc16", 0);
                    // Mark as trail for longer persistence
                    boss.attackCells[boss.attackCells.length - 1].life = trailLife;
                }
            }
        }
        // Foam: every 10 tick, 3x3 area
        boss.foamTimer = (boss.foamTimer || 0) + 1;
        if (boss.foamTimer >= 10) {
            boss.foamTimer = 0;
            var fmx = Math.floor(Math.random() * (z.c - 4)) + 2;
            var fmy = Math.floor(Math.random() * (z.r - 4)) + 2;
            for (var fdx = -1; fdx <= 1; fdx++) {
                for (var fdy = -1; fdy <= 1; fdy++) {
                    addAttackCell(fmx + fdx, fmy + fdy, "ring", "#a3e635", 3);
                }
            }
        }
        // Phase 2 at HP 5
        if (boss.hp <= 5 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2; boss.phaseTransitioned = true;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(132,204,22,.4)");
            if (fx && fx.onShake) fx.onShake(15);
        }
    }
    // === IL COCCODRILLO (Zone 2) - non-physical ===
    else if (bid === "coccodrillo") {
        spawnGolden(bossDef.goldenInterval);
        // Mud: every 10 tick
        boss.mudTimer = (boss.mudTimer || 0) + 1;
        if (boss.mudTimer >= 10) {
            boss.mudTimer = 0;
            for (var mi = 0; mi < 2; mi++) {
                var mx = Math.floor(Math.random() * z.c), my = Math.floor(Math.random() * z.r);
                addAttackCell(mx, my, "void", "#65a30d", 0);
                boss.attackCells[boss.attackCells.length - 1].life = 5;
            }
        }
        // Bite/area attack
        boss.biteTimer = (boss.biteTimer || 0) + 1;
        var biteInterval = boss.phase >= 2 ? 4 : 5;
        if (boss.biteTimer >= biteInterval) {
            boss.biteTimer = 0;
            // Flash red eyes first
            boss.eyePositions = [];
            if (boss.phase >= 2) {
                // Phase 2: 2-3 positions + line attack
                for (var ei = 0; ei < 3; ei++) {
                    var ex = Math.floor(Math.random() * (z.c - 2)), ey = Math.floor(Math.random() * (z.r - 2));
                    boss.eyePositions.push({ x: ex, y: ey });
                }
                // Line of 5 cells
                var lineY = Math.floor(Math.random() * z.r);
                var lineDir = Math.random() < 0.5;
                for (var li = 0; li < 5; li++) {
                    var lx = lineDir ? li : Math.floor(Math.random() * z.c);
                    var ly = lineDir ? lineY : li;
                    addAttackCell(lx, ly, "void", "#dc2626", 3);
                }
            } else {
                // Phase 1: 2x2 area
                var biteX = Math.floor(Math.random() * (z.c - 2));
                var biteY = Math.floor(Math.random() * (z.r - 2));
                boss.eyePositions = [{ x: biteX, y: biteY }];
                for (var bdx = 0; bdx < 2; bdx++) {
                    for (var bdy = 0; bdy < 2; bdy++) {
                        addAttackCell(biteX + bdx, biteY + bdy, "void", "#dc2626", 3);
                    }
                }
            }
        }
        // Phase 2 at HP 4
        if (boss.hp <= 4 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2; boss.phaseTransitioned = true;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(101,163,13,.4)");
            if (fx && fx.onShake) fx.onShake(15);
        }
    }
    // === IL ROSPO RE (Zone 2) ===
    else if (bid === "rospo") {
        bossMoveAggressive(bossDef.moveInterval);
        spawnPoisonSafe(4);
        spawnGolden();
        if (boss.tongueLife > 0) {
            boss.tongueLife--;
            if (boss.tongueCells.length > 0 && G.invincible <= 0) {
                for (var tci = 0; tci < boss.tongueCells.length; tci++) {
                    for (var tsi = 0; tsi < G.snake.length; tsi++) {
                        if (boss.tongueCells[tci].x === G.snake[tsi].x && boss.tongueCells[tci].y === G.snake[tsi].y) {
                            if (G.snake.length > 1) { G.snake.pop(); if (fx && fx.addF) fx.addF(G.snake[0].x, G.snake[0].y, "-1 LINGUA!", "#a3e635"); }
                            else { takeDamage(G, z, null, fx, "Lingua Rospo"); }
                            if (fx && fx.onScreenFlash) fx.onScreenFlash(3, "rgba(163,230,53,.15)");
                            if (fx && fx.onShake) fx.onShake(2);
                            G.invincible = 3; break;
                        }
                    }
                    if (G.invincible > 0) break;
                }
            }
            if (boss.tongueLife <= 0) boss.tongueCells = [];
        }
        boss.tongueTimer++;
        if (boss.tongueTimer >= 3 && boss.tongueLife <= 0) {
            boss.tongueTimer = 0;
            var hd2 = G.snake[0];
            var rdx = Math.sign(hd2.x - boss.anchorX), rdy = Math.sign(hd2.y - boss.anchorY);
            if (rdx === 0 && rdy === 0) rdx = 1;
            boss.tongueCells = [];
            for (var ti = 1; ti <= 4; ti++) {
                var tx = boss.anchorX + rdx * ti, ty = boss.anchorY + rdy * ti;
                if (tx >= 0 && tx < z.c && ty >= 0 && ty < z.r) {
                    boss.tongueCells.push({ x: tx, y: ty });
                    if (ti >= 3) addPoisonSafe(tx, ty, 6, 2);
                }
            }
            boss.tongueLife = 2;
        }
    }
    // === IL LEPRECAUNO (Zone 3) ===
    else if (bid === "leprecauno") {
        bossMoveAggressive(bossDef.moveInterval);
        spawnGolden(bossDef.goldenInterval);
        // Coin rain
        boss.coinRainTimer = (boss.coinRainTimer || 0) + 1;
        var coinInterval = boss.phase >= 2 ? 4 : 5;
        var coinCount = boss.phase >= 2 ? 7 : 4;
        if (boss.coinRainTimer >= coinInterval) {
            boss.coinRainTimer = 0;
            for (var cri = 0; cri < coinCount; cri++) {
                var crx = Math.floor(Math.random() * z.c), cry = Math.floor(Math.random() * z.r);
                // Area damage around coin
                addAttackCell(crx, cry, "shockwave", "#22c55e", 3);
                if (crx > 0) addAttackCell(crx - 1, cry, "shockwave", "#22c55e", 3);
                if (crx < z.c - 1) addAttackCell(crx + 1, cry, "shockwave", "#22c55e", 3);
                if (cry > 0) addAttackCell(crx, cry - 1, "shockwave", "#22c55e", 3);
                if (cry < z.r - 1) addAttackCell(crx, cry + 1, "shockwave", "#22c55e", 3);
            }
            if (fx && fx.onShake) fx.onShake(2);
        }
        // Dash: every 3 tick, jump 4 cells
        boss.dashTimer = (boss.dashTimer || 0) + 1;
        if (boss.dashTimer >= 3) {
            boss.dashTimer = 0;
            var dashDirs = [{ x: 4, y: 0 }, { x: -4, y: 0 }, { x: 0, y: 4 }, { x: 0, y: -4 }];
            var dashDir = dashDirs[Math.floor(Math.random() * dashDirs.length)];
            var newAX = Math.max(0, Math.min(z.c - 2, boss.anchorX + dashDir.x));
            var newAY = Math.max(0, Math.min(z.r - 2, boss.anchorY + dashDir.y));
            boss.anchorX = newAX; boss.anchorY = newAY;
            // Phase 2: leave gold trail
            if (boss.phase >= 2) {
                addAttackCell(boss.anchorX, boss.anchorY, "shockwave", "#fbbf24", 0);
                boss.attackCells[boss.attackCells.length - 1].life = 3;
            }
        }
        // Phase 2 at HP 3
        if (boss.hp <= 3 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2; boss.phaseTransitioned = true;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(34,197,94,.4)");
            if (fx && fx.onShake) fx.onShake(15);
        }
    }
    // === IL MIMIC (Zone 3) ===
    else if (bid === "mimic") {
        spawnGolden(bossDef.goldenInterval);
        if (boss.hidden) {
            // Mimic appears as a fake collectible, snap when snake gets close
            var mhd = G.snake[0];
            if (Math.abs(mhd.x - boss.anchorX) + Math.abs(mhd.y - boss.anchorY) <= 2) {
                boss.hidden = false;
                // 2x2 bite attack
                for (var mbx = 0; mbx < 2; mbx++) {
                    for (var mby = 0; mby < 2; mby++) {
                        addAttackCell(boss.anchorX + mbx, boss.anchorY + mby, "claw", "#b45309", 2);
                    }
                }
                if (fx && fx.onShake) fx.onShake(5);
                if (fx && fx.onScreenFlash) fx.onScreenFlash(5, "rgba(180,83,9,.3)");
                // Remove 2 segments
                var segLoss = Math.max(1, Math.round(2 / (G.meleeMod || 1)));
                while (G.snake.length > mL(G) && segLoss > 0) { G.snake.pop(); segLoss--; }
                // Re-hide
                boss.hidden = true;
                bossTeleport();
            }
        } else {
            bossMoveAggressive(bossDef.moveInterval);
        }
        // Phase 2: spawn mini-mimics (fake collectibles that explode)
        if (boss.phase >= 2) {
            boss.miniMimicTimer = (boss.miniMimicTimer || 0) + 1;
            if (boss.miniMimicTimer >= 3) {
                boss.miniMimicTimer = 0;
                // Spawn fake collectible as poison
                var mmc = getECSafe(G, z);
                if (mmc) {
                    G.foods.push({ x: mmc.x, y: mmc.y, type: "poison", life: 10, fadein: 2, miniMimic: true });
                }
            }
        }
        // Copy last boss attack (simplified: random attack pattern every 8 tick)
        boss.copyTimer = (boss.copyTimer || 0) + 1;
        if (boss.copyTimer >= 8) {
            boss.copyTimer = 0;
            var chd = G.snake[0];
            var cdx = Math.sign(chd.x - boss.anchorX), cdy = Math.sign(chd.y - boss.anchorY);
            if (cdx === 0 && cdy === 0) cdx = 1;
            for (var cli2 = 1; cli2 <= 3; cli2++) {
                addAttackCell(boss.anchorX + cdx * cli2, boss.anchorY + cdy * cli2, "claw", "#f59e0b", 3);
            }
        }
        // Phase 2 at HP 4
        if (boss.hp <= 4 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2; boss.phaseTransitioned = true;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(180,83,9,.4)");
            if (fx && fx.onShake) fx.onShake(15);
        }
    }
    // === IL RE TIRANNO (Zone 3) ===
    else if (bid === "tiranno") {
        bossMoveAggressive(bossDef.moveInterval);
        spawnGolden();
        boss.guardTimer++;
        if (boss.guardTimer >= 12) {
            boss.guardTimer = 0;
            var guardCount = G.enemies.filter(function(e) { return e.isBossGuard; }).length;
            if (guardCount < 2) {
                var gc2 = getECSafe(G, z);
                if (gc2) {
                    discover("en_guardia_tiranno");
                    if (fx && fx.onDiscover) fx.onDiscover("en_guardia_tiranno");
                    var dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
                    G.enemies.push({ x: gc2.x, y: gc2.y, dir: dirs[Math.floor(Math.random() * 4)], type: "patrol", mt: 0, mi: 2, state: "patrol", stateTimer: 0, chargeDir: null, isBossGuard: true });
                    boss.guardCount = guardCount + 1;
                }
            }
        }
        boss.poisonTimer++;
        if (boss.poisonTimer >= 12) {
            boss.poisonTimer = 0;
            var hd3 = G.snake[0];
            var taxDirs = [{ x: hd3.x + 4, y: hd3.y }, { x: hd3.x - 4, y: hd3.y }, { x: hd3.x, y: hd3.y + 4 }, { x: hd3.x, y: hd3.y - 4 }];
            for (var tsi = taxDirs.length - 1; tsi > 0; tsi--) { var tsj = Math.floor(Math.random() * (tsi + 1)); var tmp = taxDirs[tsi]; taxDirs[tsi] = taxDirs[tsj]; taxDirs[tsj] = tmp; }
            addPoisonSafe(taxDirs[0].x, taxDirs[0].y, 6, 4);
        }
        boss.shockwaveTimer++;
        if (boss.shockwaveTimer >= 10) {
            boss.shockwaveTimer = 0;
            for (var swi = -3; swi <= 3; swi++) {
                for (var swj = -3; swj <= 3; swj++) {
                    var swDist = Math.abs(swi) + Math.abs(swj);
                    if (swDist === 3) {
                        addAttackCell(boss.anchorX + 1 + swi, boss.anchorY + 1 + swj, "shockwave", "#fbbf24", 5);
                    }
                }
            }
            if (fx && fx.onShake) fx.onShake(3);
        }
    }
    // === IL BASILISCO DI LAVA (Zone 4) ===
    else if (bid === "basilisco") {
        var basMoveInt = boss.phase >= 2 ? 3 : 5;
        bossMoveAggressive(basMoveInt);
        spawnGolden(bossDef.goldenInterval);
        // Phase 2 at HP 4
        if (boss.hp <= 4 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2; boss.phaseTransitioned = true;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(220,38,38,.4)");
            if (fx && fx.onShake) fx.onShake(20);
        }
        // Petrifying gaze
        boss.gazeTimer = (boss.gazeTimer || 0) + 1;
        var gazeInterval = boss.phase >= 2 ? 5 : 8;
        if (boss.gazeTimer >= gazeInterval) {
            boss.gazeTimer = 0;
            boss.gazeWarning = boss.phase >= 2 ? 2 : 3; // warning ticks
        }
        if (boss.gazeWarning > 0) {
            boss.gazeWarning--;
            if (boss.gazeWarning === 0) {
                var bHd = G.snake[0];
                var dx1 = bHd.x - (boss.anchorX + 1), dy1 = bHd.y - (boss.anchorY + 1);
                var inLine = (dx1 === 0 || dy1 === 0 || Math.abs(dx1) === Math.abs(dy1));
                if (inLine && !G.cristallobasi) {
                    var petrifyDur = boss.phase >= 2 ? 3 : 2;
                    G.invincible = 0;
                    G.petrified = petrifyDur;
                    if (fx && fx.onScreenFlash) fx.onScreenFlash(5, "rgba(220,38,38,.3)");
                    if (fx && fx.addF) fx.addF(bHd.x, bHd.y, "PIETRIFICATO!", "#dc2626");
                }
            }
        }
        // Lava trail (longer in phase 2)
        boss.lavaTrailCells = boss.lavaTrailCells || [];
        if (boss.moveTimer === 0) {
            var trailLen = boss.phase >= 2 ? 3 : 1;
            for (var lti = 0; lti < trailLen; lti++) {
                var ltx = boss.anchorX - lti, lty = boss.anchorY;
                addAttackCell(ltx, lty, "fire", "#dc2626", 0);
                boss.attackCells[boss.attackCells.length - 1].life = boss.phase >= 2 ? 15 : 10;
            }
        }
        // Vulcan spout
        boss.vulcanTimer = (boss.vulcanTimer || 0) + 1;
        var vulcanInterval = boss.phase >= 2 ? 4 : 6;
        if (boss.vulcanTimer >= vulcanInterval) {
            boss.vulcanTimer = 0;
            var vhd = G.snake[0];
            var vdx = Math.sign(vhd.x - (boss.anchorX + 1)), vdy = Math.sign(vhd.y - (boss.anchorY + 1));
            if (vdx === 0 && vdy === 0) vdx = 1;
            var vulcanLen = boss.phase >= 2 ? 7 : 5;
            for (var vi = 1; vi <= vulcanLen; vi++) {
                addAttackCell(boss.anchorX + 1 + vdx * vi, boss.anchorY + 1 + vdy * vi, "fire", "#f97316", 3);
            }
        }
        // Phase 2: Eruption - random fire cells across map
        if (boss.phase >= 2) {
            boss.eruptionTimer = (boss.eruptionTimer || 0) + 1;
            if (boss.eruptionTimer >= 4) {
                boss.eruptionTimer = 0;
                for (var eri = 0; eri < 3; eri++) {
                    var erx = Math.floor(Math.random() * z.c), ery = Math.floor(Math.random() * z.r);
                    addAttackCell(erx, ery, "fire", "#fbbf24", 2);
                }
            }
        }
    }
    // === LA DRAGA INFERNALE (Zone 4) ===
    else if (bid === "draga") {
        if (boss.hp <= 5 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2; boss.phaseTransitioned = true;
            boss.moveTimer = 0; boss.poisonTimer = 0; boss.goldenTimer = 0;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(96,165,250,.4)");
            if (fx && fx.onShake) fx.onShake(20);
        }
        if (boss.phase === 1) {
            bossMoveAggressive(5); spawnGolden(6);
            boss.poisonTimer++;
            if (boss.poisonTimer >= 4) {
                boss.poisonTimer = 0;
                discover("en_boss_fire");
                var hd4 = G.snake[0];
                var fdx = Math.sign(hd4.x - (boss.anchorX + 1)), fdy = Math.sign(hd4.y - (boss.anchorY + 1));
                if (fdx === 0 && fdy === 0) fdx = 1;
                boss.breathCells = [];
                for (var fi = 1; fi <= 4; fi++) {
                    var ffx = boss.anchorX + 1 + fdx * fi, ffy = boss.anchorY + 1 + fdy * fi;
                    if (ffx >= 0 && ffx < z.c && ffy >= 0 && ffy < z.r) {
                        boss.breathCells.push({ x: ffx, y: ffy });
                        addAttackCell(ffx, ffy, "fire", "#f97316", 4);
                    }
                }
                boss.breathLife = 6;
            }
            boss.flameWallTimer = (boss.flameWallTimer || 0) + 1;
            if (boss.flameWallTimer >= 8) {
                boss.flameWallTimer = 0;
                var perpX = -G.dir.y, perpY = G.dir.x;
                var wallOffX = G.snake[0].x + G.dir.x * 3, wallOffY = G.snake[0].y + G.dir.y * 3;
                for (var fwi = -3; fwi <= 3; fwi++) addAttackCell(wallOffX + perpX * fwi, wallOffY + perpY * fwi, "fire", "#f97316", 4);
                if (fx && fx.onShake) fx.onShake(3);
            }
            if (boss.breathLife > 0) {
                boss.breathLife--;
                if (boss.breathLife <= 0) { boss.breathCells.forEach(function(bc) { addPoisonSafe(bc.x, bc.y, 6, 2); }); boss.breathCells = []; }
            }
        } else {
            bossMoveAggressive(4); spawnGolden(5);
            boss.poisonTimer++;
            if (boss.poisonTimer >= 4) {
                boss.poisonTimer = 0;
                discover("en_boss_ice");
                var crossDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
                for (var cdi = 0; cdi < crossDirs.length; cdi++) {
                    for (var cli3 = 1; cli3 <= 3; cli3++) addAttackCell(boss.anchorX + 1 + crossDirs[cdi].x * cli3, boss.anchorY + 1 + crossDirs[cdi].y * cli3, "ice", "#60a5fa", 4);
                }
            }
            boss.iceXTimer = (boss.iceXTimer || 0) + 1;
            if (boss.iceXTimer >= 6) {
                boss.iceXTimer = 0;
                var diagDirs = [{ x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }];
                for (var xdi = 0; xdi < diagDirs.length; xdi++) {
                    for (var xli = 1; xli <= 3; xli++) addAttackCell(boss.anchorX + 1 + diagDirs[xdi].x * xli, boss.anchorY + 1 + diagDirs[xdi].y * xli, "ice", "#60a5fa", 4);
                }
                if (fx && fx.onShake) fx.onShake(3);
            }
            if (fx && fx.onShake && Math.random() < 0.15) fx.onShake(3);
        }
    }
    // === LA FENICE DI OSSIDIANA (Zone 4 SECRET) ===
    else if (bid === "fenice") {
        var fenMoveInt = boss.phase >= 2 ? 2 : 2;
        bossMoveAggressive(fenMoveInt);
        spawnGolden(bossDef.goldenInterval);
        boss.featherTimer = (boss.featherTimer || 0) + 1;
        var featherInterval = boss.phase >= 2 ? 2 : 3;
        if (boss.featherTimer >= featherInterval) {
            boss.featherTimer = 0;
            if (boss.phase >= 2) {
                // Fan pattern: 3 feathers
                var fhd = G.snake[0];
                var ffdx = Math.sign(fhd.x - (boss.anchorX + 1)), ffdy = Math.sign(fhd.y - (boss.anchorY + 1));
                if (ffdx === 0 && ffdy === 0) ffdx = 1;
                // Center
                for (var ffi = 1; ffi <= 3; ffi++) addAttackCell(boss.anchorX + 1 + ffdx * ffi, boss.anchorY + 1 + ffdy * ffi, "fire", "#7c3aed", 2);
                // Left
                var perpX2 = -ffdy, perpY2 = ffdx;
                for (var fli = 1; fli <= 3; fli++) addAttackCell(boss.anchorX + 1 + (ffdx + perpX2) * fli, boss.anchorY + 1 + (ffdy + perpY2) * fli, "fire", "#7c3aed", 2);
                // Right
                for (var fri = 1; fri <= 3; fri++) addAttackCell(boss.anchorX + 1 + (ffdx - perpX2) * fri, boss.anchorY + 1 + (ffdy - perpY2) * fri, "fire", "#7c3aed", 2);
            } else {
                // Single feather toward snake
                var fhd2 = G.snake[0];
                var fdx2 = Math.sign(fhd2.x - (boss.anchorX + 1)), fdy2 = Math.sign(fhd2.y - (boss.anchorY + 1));
                if (fdx2 === 0 && fdy2 === 0) fdx2 = 1;
                addAttackCell(boss.anchorX + 1 + fdx2, boss.anchorY + 1 + fdy2, "fire", "#7c3aed", 2);
            }
        }
        // On death: explode 5x5 then rebirth
        if (boss.hp <= 0 && !boss.exploded) {
            boss.exploded = true;
            boss.feniceKills++;
            if (boss.feniceKills === 1) {
                // First death: explode 5x5, rebirth with 3 HP
                for (var efx = -2; efx <= 2; efx++) {
                    for (var efy = -2; efy <= 2; efy++) {
                        addAttackCell(boss.anchorX + 1 + efx, boss.anchorY + 1 + efy, "fire", "#ef4444", 0);
                    }
                }
                if (fx && fx.onScreenFlash) fx.onScreenFlash(20, "rgba(124,58,237,.6)");
                if (fx && fx.onShake) fx.onShake(25);
                boss.hp = 3; boss.maxHp = 3; boss.phase = 2; boss.phaseTransitioned = true;
                boss.exploded = false; // Allow second death
                if (fx && fx.addF) fx.addF(boss.anchorX, boss.anchorY, "RINASCITA!", "#7c3aed");
                return true; // Don't defeat yet
            }
            // Second death: actually defeated
        }
    }
    // === LA NEBULA VIVENTE (Zone 5) ===
    else if (bid === "nebula") {
        var nebMoveInt = boss.phase >= 2 ? 3 : 6;
        bossMoveAggressive(nebMoveInt);
        var nebGoldenInt = boss.phase >= 2 ? 5 : 7;
        spawnGolden(nebGoldenInt);
        // Phase 2 at HP 4
        if (boss.hp <= 4 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2; boss.phaseTransitioned = true;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(125,211,252,.4)");
            if (fx && fx.onShake) fx.onShake(20);
        }
        // Expand/contract cycle
        boss.expandTimer = (boss.expandTimer || 0) + 1;
        var expandInterval = boss.phase >= 2 ? 4 : 6;
        if (boss.expandTimer >= expandInterval) {
            boss.expandTimer = 0;
            if (!boss.expanded) {
                boss.expanded = true;
                // Attack a large area around boss
                for (var nex = -1; nex <= 2; nex++) {
                    for (var ney = -1; ney <= 2; ney++) {
                        addAttackCell(boss.anchorX + nex, boss.anchorY + ney, "void", "#7dd3fc", 3);
                    }
                }
            } else {
                boss.expanded = false;
                boss.moveTimer = Math.max(0, boss.moveTimer - 2); // Speed up after contracting
            }
        }
        // Suck: pull snake toward center periodically
        boss.suckTimer = (boss.suckTimer || 0) + 1;
        var suckInterval = boss.phase >= 2 ? 5 : 8;
        if (boss.suckTimer >= suckInterval) {
            boss.suckTimer = 0;
            if (!G.cristallobasi) {
                _pullSnakeStep(G, z, boss.anchorX + 1, boss.anchorY + 1);
                if (boss.phase >= 2) _pullSnakeStep(G, z, boss.anchorX + 1, boss.anchorY + 1);
            }
        }
        // Cosmic shard attack: random lines of void cells
        boss.shardTimer = (boss.shardTimer || 0) + 1;
        var shardInterval = boss.phase >= 2 ? 3 : 5;
        if (boss.shardTimer >= shardInterval) {
            boss.shardTimer = 0;
            var shardDir = Math.floor(Math.random() * 4);
            var shardDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
            var shardLen = boss.phase >= 2 ? 8 : 5;
            for (var sli = 1; sli <= shardLen; sli++) {
                addAttackCell(boss.anchorX + 1 + shardDirs[shardDir].x * sli, boss.anchorY + 1 + shardDirs[shardDir].y * sli, "void", "#38bdf8", 3);
            }
        }
        // Phase 2: scatter nebula fragments across map
        if (boss.phase >= 2) {
            boss.scatterTimer = (boss.scatterTimer || 0) + 1;
            if (boss.scatterTimer >= 6) {
                boss.scatterTimer = 0;
                for (var sci = 0; sci < 3; sci++) {
                    var scx = Math.floor(Math.random() * z.c), scy = Math.floor(Math.random() * z.r);
                    addAttackCell(scx, scy, "void", "#bae6fd", 2);
                }
            }
        }
    }
    // === IL GUARDIANO DEL VUOTO (Zone 5) ===
    else if (bid === "vuoto") {
        if (boss.hp <= 6 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2; boss.phaseTransitioned = true;
            boss.moveTimer = 0; boss.poisonTimer = 0; boss.goldenTimer = 0;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(192,132,252,.4)");
            if (fx && fx.onShake) fx.onShake(20);
        }
        if (boss.phase === 1) {
            bossMoveAggressive(5); spawnGolden(7);
            boss.gravityTimer++;
            if (boss.gravityTimer >= 5) {
                boss.gravityTimer = 0;
                discover("en_boss_gravity");
                var wpx = Math.floor(Math.random() * (z.c - 6)) + 3;
                var wpy = Math.floor(Math.random() * (z.r - 6)) + 3;
                var hd5 = G.snake[0];
                if (Math.abs(wpx - hd5.x) + Math.abs(wpy - hd5.y) >= 4) {
                    var diamond = [{ x: wpx, y: wpy - 1 }, { x: wpx - 1, y: wpy }, { x: wpx + 1, y: wpy }, { x: wpx, y: wpy + 1 }];
                    for (var di2 = 0; di2 < diamond.length; di2++) addAttackCell(diamond[di2].x, diamond[di2].y, "void", "#c084fc", 4);
                }
            }
        } else {
            boss.teleportTimer = (boss.teleportTimer || 0) + 1;
            if (boss.teleportTimer >= 3) { boss.teleportTimer = 0; bossTeleport(); }
            if (boss.shadowLife > 0) boss.shadowLife--;
            else boss.shadowPos = null;
            spawnGolden(5);
            boss.poisonTimer++;
            if (boss.poisonTimer >= 5) {
                boss.poisonTimer = 0;
                var vcx = Math.floor(Math.random() * (z.c - 6)) + 3;
                var vcy = Math.floor(Math.random() * (z.r - 6)) + 3;
                var hd5b = G.snake[0];
                if (Math.abs(vcx - hd5b.x) + Math.abs(vcy - hd5b.y) >= 4) {
                    for (var vdx = -1; vdx <= 1; vdx++) {
                        for (var vdy = -1; vdy <= 1; vdy++) {
                            if (vdx === 0 && vdy === 0) continue;
                            addAttackCell(vcx + vdx, vcy + vdy, "void", "#c084fc", 4);
                        }
                    }
                }
            }
        }
    }
    // === L'ASTRO DIVORATORE (Zone 5 SECRET) ===
    else if (bid === "astro") {
        bossMoveAggressive(bossDef.moveInterval);
        spawnGolden(bossDef.goldenInterval);
        // Attract snake every 4 tick
        boss.attractTimer = (boss.attractTimer || 0) + 1;
        if (boss.attractTimer >= 4) {
            boss.attractTimer = 0;
            if (!G.cristallobasi) {
                _pullSnakeStep(G, z, boss.anchorX + 1, boss.anchorY + 1);
            }
            // Also attract collectibles toward boss
            G.foods.forEach(function(f) {
                if (f.type !== "poison") {
                    var ftdx = Math.sign((boss.anchorX + 1) - f.x), ftdy = Math.sign((boss.anchorY + 1) - f.y);
                    f.x = Math.max(0, Math.min(z.c - 1, f.x + ftdx));
                    f.y = Math.max(0, Math.min(z.r - 1, f.y + ftdy));
                }
            });
        }
        // Solar flare every 4 tick
        boss.flareTimer = (boss.flareTimer || 0) + 1;
        if (boss.flareTimer >= 4) {
            boss.flareTimer = 0;
            var flareDir = Math.floor(Math.random() * 4);
            var fDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
            for (var fli2 = 1; fli2 <= 6; fli2++) {
                addAttackCell(boss.anchorX + 1 + fDirs[flareDir].x * fli2, boss.anchorY + 1 + fDirs[flareDir].y * fli2, "fire", "#fbbf24", 3);
            }
        }
        // Collapse every 10 tick
        boss.collapseTimer = (boss.collapseTimer || 0) + 1;
        if (boss.collapseTimer >= 10) {
            boss.collapseTimer = 0;
            boss.collapsing = true;
            // Triple attraction for 3 ticks (handled above by checking collapsing flag)
            // Then explode 5x5
            for (var cex = -2; cex <= 2; cex++) {
                for (var cey = -2; cey <= 2; cey++) {
                    addAttackCell(boss.anchorX + 1 + cex, boss.anchorY + 1 + cey, "fire", "#fde68a", 3);
                }
            }
            if (fx && fx.onShake) fx.onShake(5);
            boss.collapsing = false;
        }
    }
    // === L'OCCHIO DELL'ABISSO (Zone 6) ===
    else if (bid === "occhio") {
        bossMoveAggressive(bossDef.moveInterval);
        spawnGolden(bossDef.goldenInterval);
        // Phase 2 at HP 6
        if (boss.hp <= 6 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2; boss.phaseTransitioned = true;
            // Create 3 clones
            boss.clones = [];
            for (var cci = 0; cci < 3; cci++) {
                var ccx = Math.floor(Math.random() * (z.c - 2));
                var ccy = Math.floor(Math.random() * (z.r - 2));
                boss.clones.push({ x: ccx, y: ccy });
            }
            boss.realBossIdx = Math.floor(Math.random() * 4); // 0=boss, 1-3=clones
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(99,102,241,.4)");
            if (fx && fx.onShake) fx.onShake(20);
        }
        // Ray every 6 tick
        boss.rayTimer = (boss.rayTimer || 0) + 1;
        if (boss.rayTimer >= 6) {
            boss.rayTimer = 0;
            var rhd = G.snake[0];
            var rdx2 = Math.sign(rhd.x - (boss.anchorX + 1)), rdy2 = Math.sign(rhd.y - (boss.anchorY + 1));
            if (rdx2 === 0 && rdy2 === 0) rdx2 = 1;
            for (var rri = 1; rri <= 8; rri++) {
                addAttackCell(boss.anchorX + 1 + rdx2 * rri, boss.anchorY + 1 + rdy2 * rri, "dive", "#6366f1", 4);
            }
            // Phase 2: clones also shoot
            if (boss.phase >= 2 && boss.clones) {
                boss.clones.forEach(function(clone) {
                    var cldx = Math.sign(rhd.x - clone.x), cldy = Math.sign(rhd.y - clone.y);
                    if (cldx === 0 && cldy === 0) cldx = 1;
                    for (var cri2 = 1; cri2 <= 4; cri2++) {
                        addAttackCell(clone.x + cldx * cri2, clone.y + cldy * cri2, "dive", "#818cf8", 4);
                    }
                });
            }
        }
        // Petrify every 10 tick
        boss.petrifyTimer = (boss.petrifyTimer || 0) + 1;
        if (boss.petrifyTimer >= 10) {
            boss.petrifyTimer = 0;
            if (!G.cristallobasi) {
                G.petrified = 1;
                if (fx && fx.onScreenFlash) fx.onScreenFlash(3, "rgba(99,102,241,.3)");
            }
        }
    }
    // === IL SERPENTE PRIMORDIALE (Zone 6) ===
    else if (bid === "primordiale") {
        if (boss.hp <= 11 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2; boss.phaseTransitioned = true;
            boss.moveTimer = 0; boss.poisonTimer = 0; boss.goldenTimer = 0;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(248,113,113,.4)");
            if (fx && fx.onShake) fx.onShake(20);
        } else if (boss.hp <= 5 && boss.phase === 2) {
            boss.phase = 3;
            boss.moveTimer = 0; boss.poisonTimer = 0; boss.goldenTimer = 0;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(20, "rgba(255,0,0,.5)");
            if (fx && fx.onShake) fx.onShake(25);
        }
        if (boss.phase === 1) {
            bossMoveAggressive(3); spawnPoisonSafe(4); spawnGolden(6);
            boss.tailTimer++;
            if (boss.tailTimer >= 5) {
                boss.tailTimer = 0;
                discover("en_boss_tail");
                for (var twi2 = 1; twi2 <= 3; twi2++) addAttackCell(boss.anchorX - twi2, boss.anchorY + 1, "ring", "#f87171", 2);
            }
        } else if (boss.phase === 2) {
            bossMoveAggressive(2); spawnGolden(5);
            boss.ringLife = (boss.ringLife || 0);
            boss.ringTimer2 = (boss.ringTimer2 || 0) + 1;
            if (boss.ringTimer2 >= 4 && boss.ringLife <= 0) {
                boss.ringTimer2 = 0; boss.ringCells = [];
                for (var ri = -2; ri <= 2; ri++) {
                    for (var rj = -2; rj <= 2; rj++) {
                        if (Math.abs(ri) + Math.abs(rj) === 2) addAttackCell(boss.anchorX + 1 + ri, boss.anchorY + 1 + rj, "ring", "#ef4444", 2);
                    }
                }
                boss.ringLife = 5;
            }
            if (boss.ringLife > 0) { boss.ringLife--; if (boss.ringLife <= 0) boss.ringCells = []; }
            boss.tailTimer++;
            if (boss.tailTimer >= 3) { boss.tailTimer = 0; addPoisonSafe(boss.anchorX - 1, boss.anchorY, 6, 3); }
        } else {
            bossMoveAggressive(2);
            boss.berserkTimer++;
            if (boss.berserkTimer >= 2) {
                boss.berserkTimer = 0;
                var allDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
                for (var adi2 = 0; adi2 < allDirs.length; adi2++) {
                    for (var adli = 1; adli <= 3; adli++) addAttackCell(boss.anchorX + 1 + allDirs[adi2].x * adli, boss.anchorY + 1 + allDirs[adi2].y * adli, "ring", "#dc2626", 2);
                }
            }
            spawnGolden(4);
            if (fx && fx.onScreenFlash && Math.random() < 0.1) fx.onScreenFlash(3, "rgba(255,0,0,.1)");
        }
    }

    // Decrement poison food life (with fadein)
    for (var pi = G.foods.length - 1; pi >= 0; pi--) {
        if (G.foods[pi].type === "poison") {
            if (G.foods[pi].fadein !== undefined && G.foods[pi].fadein > 0) {
                G.foods[pi].fadein--;
                continue;
            }
            G.foods[pi].life--;
            if (G.foods[pi].life <= 0) G.foods.splice(pi, 1);
        }
    }
    return !boss.defeated;
}

/* ===== ENTITA SENZA NOME (survival boss) ===== */
function _tickEntita(G, z, fx, boss, bossDef) {
    boss.survivalTick++;
    // Show survival progress as "HP"
    boss.hp = Math.max(1, boss.survivalTarget - boss.survivalTick);
    var progress = boss.survivalTick / boss.survivalTarget; // 0..1

    // Dissolve map edges — gets faster as time passes
    boss.dissolveTimer = (boss.dissolveTimer || 0) + 1;
    var dissolveRate = progress > 0.7 ? 6 : progress > 0.4 ? 4 : 2;
    if (boss.dissolveTimer >= 1) {
        boss.dissolveTimer = 0;
        for (var di = 0; di < dissolveRate; di++) {
            // Dissolve from edges inward progressively
            var edge = Math.floor(Math.random() * 4);
            var maxInset = Math.floor(progress * 4); // how far in the dissolution goes
            var dx2, dy2;
            if (edge === 0) { dx2 = Math.floor(Math.random() * z.c); dy2 = Math.min(maxInset, Math.floor(Math.random() * (maxInset + 1))); }
            else if (edge === 1) { dx2 = Math.floor(Math.random() * z.c); dy2 = z.r - 1 - Math.min(maxInset, Math.floor(Math.random() * (maxInset + 1))); }
            else if (edge === 2) { dx2 = Math.min(maxInset, Math.floor(Math.random() * (maxInset + 1))); dy2 = Math.floor(Math.random() * z.r); }
            else { dx2 = z.c - 1 - Math.min(maxInset, Math.floor(Math.random() * (maxInset + 1))); dy2 = Math.floor(Math.random() * z.r); }
            // Mark as dissolved
            boss.attackCells.push({ x: dx2, y: dy2, type: "void", color: "#1e1b4b", fadein: 0, life: 999 });
        }
    }

    // Random void zones appear across the map
    boss.voidZoneTimer = (boss.voidZoneTimer || 0) + 1;
    var voidInterval = progress > 0.6 ? 3 : progress > 0.3 ? 5 : 8;
    if (boss.voidZoneTimer >= voidInterval) {
        boss.voidZoneTimer = 0;
        var vzCount = progress > 0.5 ? 2 : 1;
        for (var vzi = 0; vzi < vzCount; vzi++) {
            var vzx = Math.floor(Math.random() * z.c), vzy = Math.floor(Math.random() * z.r);
            // 3x3 void zone with warning
            for (var vzdx = -1; vzdx <= 1; vzdx++) {
                for (var vzdy = -1; vzdy <= 1; vzdy++) {
                    boss.attackCells.push({ x: vzx + vzdx, y: vzy + vzdy, type: "void", color: "#312e81", fadein: 3, life: 999 });
                }
            }
        }
    }

    // Gravity distortion: pull snake toward random dissolved cells
    boss.distortTimer = (boss.distortTimer || 0) + 1;
    var distortInterval = progress > 0.5 ? 4 : 7;
    if (boss.distortTimer >= distortInterval) {
        boss.distortTimer = 0;
        if (!G.cristallobasi && boss.attackCells.length > 0) {
            // Pull toward a random dissolved cell
            var target = boss.attackCells[Math.floor(Math.random() * boss.attackCells.length)];
            _pullSnakeStep(G, z, target.x, target.y);
        }
    }

    // Screen distortion effect
    if (progress > 0.5 && fx && fx.onScreenFlash && Math.random() < 0.15) {
        fx.onScreenFlash(3, "rgba(30,27,75,.15)");
    }

    // Check if snake head is on a dissolved cell (instant damage, no invincibility)
    if (G.snake.length > 0) {
        var snakeHead = G.snake[0];
        for (var eci = 0; eci < boss.attackCells.length; eci++) {
            if (boss.attackCells[eci].fadein <= 0 && boss.attackCells[eci].x === snakeHead.x && boss.attackCells[eci].y === snakeHead.y) {
                if (G.ilnome && Math.random() < 0.2) {
                    if (fx && fx.addF) fx.addF(snakeHead.x, snakeHead.y, "SCHIVATO!", "#a78bfa");
                } else {
                    takeDamage(G, z, null, fx, "Il Vuoto");
                }
                break;
            }
        }
    }

    // Survival complete
    if (boss.survivalTick >= boss.survivalTarget) {
        boss.defeated = true;
        boss.hp = 0;
        if (fx && fx.addF) fx.addF(G.snake[0].x, G.snake[0].y, "L'Entita svanisce...", "#c084fc");
        if (fx && fx.onBossDefeated) fx.onBossDefeated();
        incrementCompletedRuns();
    }
    return !boss.defeated;
}

/* ===== SIGNOR CERVO (quiz boss - canvas-based, snake keeps moving!) ===== */
function _tickCervo(G, z, fx, boss, bossDef) {
    if (boss.quizActive && !boss.quizAnswered && boss.quizCurrent) {
        // Real-time timer (seconds)
        var elapsed = (Date.now() - boss.quizStartTime) / 1000;
        var remaining = Math.max(0, boss.quizTimeLimit - elapsed);
        boss.quizTimer = remaining;
        // Timeout
        if (remaining <= 0) {
            _answerCervoQuestionCanvas(G, "TIMEOUT");
        }
    }
    // Snake is hidden during quiz — does not move, cannot die
    return !boss.defeated;
}

/* Helper: answer cervo question by index (0-3) - called from keyboard input */
function _cervoAnswerByIdx(G, idx) {
    if (!G.boss || !G.boss.quizActive || G.boss.quizAnswered || !G.boss.quizCurrent) return;
    var labels = ["A", "B", "C", "D"];
    if (idx >= 0 && idx < G.boss.quizCurrent.o.length) {
        _answerCervoQuestionCanvas(G, labels[idx]);
    }
}
