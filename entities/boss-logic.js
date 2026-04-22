/* ===== LOGICA BOSS ===== */

function getBossForZone(zoneIndex) {
    for (var i = 0; i < BOSS_DB.length; i++) {
        if (BOSS_DB[i].zoneIndex === zoneIndex) return BOSS_DB[i];
    }
    return null;
}

function getBossRelicId(bossId) {
    var map = { corvo: "piuma", lupo: "occhiolupo", rospo: "linguarospo", tiranno: "coronatiranno", draga: "scagliadraga", vuoto: "frammentovuoto", primordiale: "pelleprimordiale" };
    return map[bossId] || null;
}

function bossCells(boss) {
    if (!boss) return [];
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
    G.crack = null; // No crack during boss fight
    G.foods = [];
    G.obstacles = [];
    G.enemies = [];
    G.traps = [];
    G.pendingObs = [];
    var gf = getECSafe(G, z);
    if (gf) G.foods.push({ x: gf.x, y: gf.y, type: bossDef.collectType });
    discover("boss_" + bossDef.id);
    if (fx && fx.onDiscover) fx.onDiscover("boss_" + bossDef.id);
    return G.boss;
}
function tickBoss(G, z, fx) {
    if (!G.boss || G.boss.defeated) return true;
    var bossDef = null;
    for (var i = 0; i < BOSS_DB.length; i++) { if (BOSS_DB[i].id === G.boss.id) { bossDef = BOSS_DB[i]; break; } }
    if (!bossDef) return true;
    var boss = G.boss;
    var bid = boss.id;

    // Decay existing attack cells (don't clear - they persist across ticks)
    for (var aci = boss.attackCells.length - 1; aci >= 0; aci--) {
        var ac = boss.attackCells[aci];
        ac.life--;
        if (ac.fadein > 0) ac.fadein--;
        else if (ac.fadein === 0) {
            // Just became active - deal damage if player is on cell, shake screen
            ac.fadein = -1;
            // Check if snake head is on this active attack cell
            var hdAtk = G.snake[0];
            if (hdAtk.x === ac.x && hdAtk.y === ac.y && G.invincible <= 0) {
                takeDamage(G, z, null, fx, "Attacco Boss");
                if (fx && fx.sBossDmgPlayer) fx.sBossDmgPlayer();
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
                takeDamage(G, z, null, fx, "Attacco Boss");
                if (fx && fx.sBossDmgPlayer) fx.sBossDmgPlayer();
                break;
            }
        }
    }

    // Helper: aggressive boss move - chase the snake head
    function bossMoveAggressive(bInt) {
        boss.moveTimer++;
        if (boss.moveTimer >= bInt) {
            boss.moveTimer = 0;
            var hd = G.snake[0];
            // Try to move toward the snake first
            var dx = Math.sign(hd.x - boss.anchorX), dy = Math.sign(hd.y - boss.anchorY);
            var dirs = [];
            // Prioritize direction toward snake
            if (dx !== 0 || dy !== 0) dirs.push({ x: dx, y: dy });
            // Then diagonals toward snake
            if (dx !== 0) dirs.push({ x: dx, y: 0 });
            if (dy !== 0) dirs.push({ x: 0, y: dy });
            // Then random others
            var allDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
            for (var adi = 0; adi < allDirs.length; adi++) {
                if (!dirs.some(function(d) { return d.x === allDirs[adi].x && d.y === allDirs[adi].y; })) {
                    dirs.push(allDirs[adi]);
                }
            }
            for (var di = 0; di < dirs.length; di++) {
                var nax = boss.anchorX + dirs[di].x, nay = boss.anchorY + dirs[di].y;
                if (nax < 0 || nax + 1 >= z.c || nay < 0 || nay + 1 >= z.r) continue;
                var overlapCount = 0;
                var cells = [{ x: nax, y: nay }, { x: nax + 1, y: nay }, { x: nax, y: nay + 1 }, { x: nax + 1, y: nay + 1 }];
                for (var ci = 0; ci < cells.length; ci++) {
                    if (G.snake.some(function (s) { return s.x === cells[ci].x && s.y === cells[ci].y; })) overlapCount++;
                }
                // Check for food items on target cells
                var foodOverlap = false;
                for (var ci2 = 0; ci2 < cells.length; ci2++) {
                    if (G.foods.some(function (f) { return f.x === cells[ci2].x && f.y === cells[ci2].y; })) { foodOverlap = true; break; }
                }
                if (overlapCount < 2 && !foodOverlap) { boss.anchorX = nax; boss.anchorY = nay; break; }
            }
        }
    }

    // Helper: spawn poison food with player safety distance
    function spawnPoisonSafe(minDist) {
        boss.poisonTimer++;
        if (boss.poisonTimer >= bossDef.poisonInterval) {
            boss.poisonTimer = 0;
            var pc = getECSafe(G, z);
            if (pc) G.foods.push({ x: pc.x, y: pc.y, type: "poison", life: 12, fadein: 3 });
        }
    }

    // Helper: spawn golden apple
    function spawnGolden(interval) {
        boss.goldenTimer++;
        if (boss.goldenTimer >= (interval || bossDef.goldenInterval)) {
            boss.goldenTimer = 0;
            var gc = getECSafe(G, z);
            if (gc) G.foods.push({ x: gc.x, y: gc.y, type: bossDef.collectType });
        }
    }

    // Helper: add attack cells with fadein (warning before damage)
    // attackType: visual type for rendering (fire, ice, shadow, void, ring, claw, shockwave)
    // fadein: ticks of warning before damage
    function addAttackCell(x, y, attackType, color, fadein) {
        if (x < 0 || x >= z.c || y < 0 || y >= z.r) return;
        if (G.snake.some(function(s) { return s.x === x && s.y === y; })) return;
        if (G.foods.some(function(f) { return f.x === x && f.y === y; })) return;
        boss.attackCells.push({ x: x, y: y, type: attackType, color: color, fadein: fadein || 2, life: (fadein || 2) + 4 });
        // Add poison food only after fadein expires (handled in tickBoss decay below)
    }

    // Helper: teleport boss to random position
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

    // Helper: add poison with safety check (min Manhattan distance from snake head)
    function addPoisonSafe(x, y, life, minDist) {
        var hd = G.snake[0];
        if (Math.abs(x - hd.x) + Math.abs(y - hd.y) < (minDist || 4)) return;
        if (x < 0 || x >= z.c || y < 0 || y >= z.r) return;
        if (G.snake.some(function(s) { return s.x === x && s.y === y; })) return;
        if (G.foods.some(function(f) { return f.x === x && f.y === y; })) return;
        if (G.obstacles.some(function(o) { return o.x === x && o.y === y; })) return;
        G.foods.push({ x: x, y: y, type: "poison", life: life || 8, fadein: 2 });
    }

    // === CORVO GIGANTE (Zone 0) - Wind gusts + predictable attacks ===
    if (bid === "corvo") {
        bossMoveAggressive(bossDef.moveInterval);
        spawnPoisonSafe(bossDef.poisonInterval);
        spawnGolden(bossDef.goldenInterval);
        // Wind gust every 8 ticks - 1-cell-wide line across snake's row or column (more dodgeable)
        boss.diveTimer = (boss.diveTimer || 0) + 1;
        if (boss.diveTimer >= 8) {
            boss.diveTimer = 0;
            var hd0 = G.snake[0];
            // Alternate between horizontal and vertical gusts
            boss.gustDir = (boss.gustDir || 0) === 0 ? 1 : 0;
            if (boss.gustDir === 0) {
                // Horizontal gust across the snake's row (1 cell wide, not 3)
                for (var gi = 0; gi < z.c; gi++) {
                    addAttackCell(gi, hd0.y, "dive", bossDef.color || "#5eead4", 5);
                }
            } else {
                // Vertical gust across the snake's column (1 cell wide, not 3)
                for (var gj = 0; gj < z.r; gj++) {
                    addAttackCell(hd0.x, gj, "dive", bossDef.color || "#5eead4", 5);
                }
            }
            if (fx && fx.onShake) fx.onShake(2);
        }
    }
    // === LUPO OMBRA (Zone 1) - Shadow claw + teleport ===
    else if (bid === "lupo") {
        // Teleport: prima mostra preview, poi TP dopo 3 tick
        boss.teleportTimer++;
        // Fase 1: calcola destinazione e mostra preview
        if (boss.teleportTimer >= 10 && !boss.tpPreview) {
            // Trova destinazione TP ma non teletrasportare ancora
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
                    boss.tpPreview = { x: nx, y: ny };
                    boss.tpPreviewLife = 3; // 3 tick di preview
                    break;
                }
            }
        }
        // Fase 2: mostra la preview (indicatore pulsante)
        if (boss.tpPreview && boss.tpPreviewLife > 0) {
            boss.tpPreviewLife--;
            // Aggiungi cellule di attacco visive come indicatore (non fanno danno, solo warning)
            if (boss.tpPreviewLife === 2) {
                var prevCells = [{ x: boss.tpPreview.x, y: boss.tpPreview.y }, { x: boss.tpPreview.x + 1, y: boss.tpPreview.y }, { x: boss.tpPreview.x, y: boss.tpPreview.y + 1 }, { x: boss.tpPreview.x + 1, y: boss.tpPreview.y + 1 }];
                for (var pci = 0; pci < prevCells.length; pci++) {
                    addAttackCell(prevCells[pci].x, prevCells[pci].y, "claw", "#a78bfa", 3);
                }
                if (fx && fx.addF) fx.addF(boss.tpPreview.x + 1, boss.tpPreview.y + 1, "TP!", "#818cf8");
            }
        }
        // Fase 3: esegui il teletrasporto
        if (boss.tpPreview && boss.tpPreviewLife <= 0) {
            var oldX = boss.anchorX, oldY = boss.anchorY;
            boss.shadowPos = { x: oldX, y: oldY };
            boss.shadowLife = 4;
            boss.anchorX = boss.tpPreview.x;
            boss.anchorY = boss.tpPreview.y;
            boss.tpPreview = null;
            boss.tpPreviewLife = 0;
            boss.teleportTimer = 0;
        }
        // Shadow trail decay
        if (boss.shadowLife > 0) boss.shadowLife--;
        if (boss.shadowLife <= 0) boss.shadowPos = null;
        spawnGolden(6);
        // Shadow claw attack every 8 ticks (più lento) - slash toward snake
        boss.clawTimer++;
        if (boss.clawTimer >= 8 && boss.clawCells.length === 0) {
            boss.clawTimer = 0;
            var hd1 = G.snake[0];
            var ldx = Math.sign(hd1.x - boss.anchorX), ldy = Math.sign(hd1.y - boss.anchorY);
            if (ldx === 0 && ldy === 0) ldx = 1;
            boss.clawCells = [];
            // 3-cell claw slash
            for (var cli = 1; cli <= 3; cli++) {
                var cx2 = boss.anchorX + ldx * cli, cy2 = boss.anchorY + ldy * cli;
                if (cx2 >= 0 && cx2 < z.c && cy2 >= 0 && cy2 < z.r) {
                    boss.clawCells.push({ x: cx2, y: cy2 });
                    addAttackCell(cx2, cy2, "claw", "#818cf8", 3);
                    // Perpendicular slash cells
                    var perpX = -ldy, perpY = ldx;
                    if (cli === 2) {
                        addAttackCell(cx2 + perpX, cy2 + perpY, "claw", "#818cf8", 3);
                        addAttackCell(cx2 - perpX, cy2 - perpY, "claw", "#818cf8", 3);
                    }
                }
            }
        }
        // Claw cells: after fadein, add poison
        if (boss.clawCells.length > 0) {
            boss.clawLife = (boss.clawLife || 0) - 1;
            if (boss.clawLife <= -3) {
                boss.clawCells.forEach(function(cc) { addPoisonSafe(cc.x, cc.y, 6, 2); });
                boss.clawCells = [];
                boss.clawLife = 0;
            }
        }
        bossMoveAggressive(8); // Movimento più lento
    }
    // === ROSPO RE (Zone 2) - Tongue attack (damages snake on contact) ===
    else if (bid === "rospo") {
        bossMoveAggressive(bossDef.moveInterval); // More aggressive
        spawnPoisonSafe(4);
        spawnGolden();
        // Tongue attack every 3 ticks (faster) — persists for 2 ticks via tongueLife
        if (boss.tongueLife > 0) {
            boss.tongueLife--;
            // Check if tongue cells overlap with snake — deal -1 segment damage SEMPRE
            if (boss.tongueCells.length > 0 && G.invincible <= 0) {
                for (var tci = 0; tci < boss.tongueCells.length; tci++) {
                    for (var tsi = 0; tsi < G.snake.length; tsi++) {
                        if (boss.tongueCells[tci].x === G.snake[tsi].x && boss.tongueCells[tci].y === G.snake[tsi].y) {
                            // Tongue hit! Perde 1 segmento a prescindere
                            if (G.snake.length > 1) {
                                G.snake.pop();
                                if (fx && fx.addF) fx.addF(G.snake[0].x, G.snake[0].y, "-1 LINGUA!", "#a3e635");
                            } else {
                                // Serpente a lunghezza minima: danno diretto
                                takeDamage(G, z, null, fx, "Lingua Rospo");
                            }
                            if (fx && fx.onScreenFlash) fx.onScreenFlash(3, "rgba(163,230,53,.15)");
                            if (fx && fx.onShake) fx.onShake(2);
                            G.invincible = 3; // Brief invincibility to prevent multiple hits
                            break;
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
                    // Add poison on tongue tip cells (safe distance)
                    if (ti >= 3) addPoisonSafe(tx, ty, 6, 2);
                }
            }
            boss.tongueLife = 2;
        }
    }
    // === RE TIRANNO (Zone 3) - Tax + shockwave + guards ===
    else if (bid === "tiranno") {
        bossMoveAggressive(bossDef.moveInterval);
        spawnGolden();
        // Spawn guards every 12 ticks (meno frequenti, max 2)
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
        // Tax: poison near snake every 12 ticks (molto meno veleno, solo 1 mela)
        boss.poisonTimer++;
        if (boss.poisonTimer >= 12) {
            boss.poisonTimer = 0;
            var hd3 = G.snake[0];
            // Tax spawns 4 cells away from snake head (più distanza!)
            var taxDirs = [
                { x: hd3.x + 4, y: hd3.y }, { x: hd3.x - 4, y: hd3.y },
                { x: hd3.x, y: hd3.y + 4 }, { x: hd3.x, y: hd3.y - 4 }
            ];
            // Shuffle
            for (var tsi = taxDirs.length - 1; tsi > 0; tsi--) { var tsj = Math.floor(Math.random() * (tsi + 1)); var tmp = taxDirs[tsi]; taxDirs[tsi] = taxDirs[tsj]; taxDirs[tsj] = tmp; }
            // Solo 1 mela avvelenata per volta (non 2)
            addPoisonSafe(taxDirs[0].x, taxDirs[0].y, 6, 4);
        }
        // Golden shockwave every 10 ticks - expanding ring from boss (fade-in lungo per prevedibilità)
        boss.shockwaveTimer++;
        if (boss.shockwaveTimer >= 10) {
            boss.shockwaveTimer = 0;
            // Ring at distance 3 from boss with longer fade-in for predictability
            for (var swi = -3; swi <= 3; swi++) {
                for (var swj = -3; swj <= 3; swj++) {
                    var swDist = Math.abs(swi) + Math.abs(swj);
                    if (swDist === 3) {
                        var swx = boss.anchorX + 1 + swi, swy = boss.anchorY + 1 + swj;
                        addAttackCell(swx, swy, "shockwave", "#fbbf24", 5); // 5 tick fade-in (più prevedibile)
                    }
                }
            }
            if (fx && fx.onShake) fx.onShake(3);
        }
    }
    // === DRAGA INFERNALE (Zone 4) - 2 phases with visible fire/ice ===
    else if (bid === "draga") {
        // Phase transition at HP 5
        if (boss.hp <= 5 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2;
            boss.phaseTransitioned = true;
            boss.moveTimer = 0; boss.poisonTimer = 0; boss.goldenTimer = 0;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(96,165,250,.4)");
            if (fx && fx.onShake) fx.onShake(20);
        }
        if (boss.phase === 1) {
            // Phase 1: Movimento più lento, FIRE BREATH con preavviso
            bossMoveAggressive(5); // Più lento (era 3)
            spawnGolden(6);
            // Fire breath ogni 4 tick (meno frequente, era 2) - linea di fuoco verso il serpente con fade-in
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
                        addAttackCell(ffx, ffy, "fire", "#f97316", 4); // 4 tick fade-in (era 1)
                    }
                }
                boss.breathLife = 6;
            }
            // Flame wall ogni 8 tick (meno frequente, era 5) - perpendicolare alla direzione del serpente, NON centrata sul giocatore
            boss.flameWallTimer = (boss.flameWallTimer || 0) + 1;
            if (boss.flameWallTimer >= 8) {
                boss.flameWallTimer = 0;
                var perpX = -G.dir.y, perpY = G.dir.x;
                // Sposta il muro 3 celle avanti rispetto al giocatore, non addosso
                var wallOffX = G.snake[0].x + G.dir.x * 3;
                var wallOffY = G.snake[0].y + G.dir.y * 3;
                for (var fwi = -3; fwi <= 3; fwi++) {
                    var fwx = wallOffX + perpX * fwi, fwy = wallOffY + perpY * fwi;
                    addAttackCell(fwx, fwy, "fire", "#f97316", 4); // 4 tick fade-in (era 1)
                }
                if (fx && fx.onShake) fx.onShake(3);
            }
            // Breath cells: after fadein, add poison
            if (boss.breathLife > 0) {
                boss.breathLife--;
                if (boss.breathLife <= 0) {
                    boss.breathCells.forEach(function(bc) { addPoisonSafe(bc.x, bc.y, 6, 2); });
                    boss.breathCells = [];
                }
            }
        } else {
            // Phase 2: Più lenta, ICE SHARDS con preavviso
            bossMoveAggressive(4); // Più lento (era 2)
            spawnGolden(5);
            // Ice shards ogni 4 tick (meno frequente, era 2) - croce visibile con fade-in
            boss.poisonTimer++;
            if (boss.poisonTimer >= 4) {
                boss.poisonTimer = 0;
                discover("en_boss_ice");
                var crossDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
                for (var cdi = 0; cdi < crossDirs.length; cdi++) {
                    for (var cli = 1; cli <= 3; cli++) {
                        var cx = boss.anchorX + 1 + crossDirs[cdi].x * cli, cy = boss.anchorY + 1 + crossDirs[cdi].y * cli;
                        addAttackCell(cx, cy, "ice", "#60a5fa", 4); // 4 tick fade-in (era 1)
                    }
                }
            }
            // X pattern (diagonal cross) ogni 6 tick (meno frequente, era 4)
            boss.iceXTimer = (boss.iceXTimer || 0) + 1;
            if (boss.iceXTimer >= 6) {
                boss.iceXTimer = 0;
                var diagDirs = [{ x: 1, y: 1 }, { x: -1, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 1 }];
                for (var xdi = 0; xdi < diagDirs.length; xdi++) {
                    for (var xli = 1; xli <= 3; xli++) {
                        var xx = boss.anchorX + 1 + diagDirs[xdi].x * xli, xy = boss.anchorY + 1 + diagDirs[xdi].y * xli;
                        addAttackCell(xx, xy, "ice", "#60a5fa", 4); // 4 tick fade-in (era 1)
                    }
                }
                if (fx && fx.onShake) fx.onShake(3);
            }
            // Periodic screen shake
            if (fx && fx.onShake && Math.random() < 0.15) fx.onShake(3);
        }
    }
    // === GUARDIANO DEL VUOTO (Zone 5) - 2 phases with fade-in void zones ===
    else if (bid === "vuoto") {
        // Phase transition at HP 6
        if (boss.hp <= 6 && boss.phase === 1 && !boss.phaseTransitioned) {
            boss.phase = 2;
            boss.phaseTransitioned = true;
            boss.moveTimer = 0; boss.poisonTimer = 0; boss.goldenTimer = 0;
            if (fx && fx.onScreenFlash) fx.onScreenFlash(15, "rgba(192,132,252,.4)");
            if (fx && fx.onShake) fx.onShake(20);
        }
        if (boss.phase === 1) {
            // Phase 1: Slow movement, gravity wells (with fade-in)
            bossMoveAggressive(5);
            spawnGolden(7);
            // Gravity wells every 5 ticks - visible diamond with fade-in
            boss.gravityTimer++;
            if (boss.gravityTimer >= 5) {
                boss.gravityTimer = 0;
                discover("en_boss_gravity");
                var wpx = Math.floor(Math.random() * (z.c - 6)) + 3;
                var wpy = Math.floor(Math.random() * (z.r - 6)) + 3;
                // Check min distance from snake
                var hd5 = G.snake[0];
                if (Math.abs(wpx - hd5.x) + Math.abs(wpy - hd5.y) >= 4) {
                    var diamond = [{ x: wpx, y: wpy - 1 }, { x: wpx - 1, y: wpy }, { x: wpx + 1, y: wpy }, { x: wpx, y: wpy + 1 }];
                    for (var di2 = 0; di2 < diamond.length; di2++) {
                        addAttackCell(diamond[di2].x, diamond[di2].y, "void", "#c084fc", 4);
                    }
                }
            }
        } else {
            // Phase 2: Teleport every 3 ticks, void zones (3x3 minus center) with fade-in
            boss.teleportTimer = (boss.teleportTimer || 0) + 1;
            if (boss.teleportTimer >= 3) {
                boss.teleportTimer = 0;
                bossTeleport();
            }
            if (boss.shadowLife > 0) boss.shadowLife--;
            else boss.shadowPos = null;
            spawnGolden(5);
            // Void zones every 5 ticks with fade-in
            boss.poisonTimer++;
            if (boss.poisonTimer >= 5) {
                boss.poisonTimer = 0;
                var vcx = Math.floor(Math.random() * (z.c - 6)) + 3;
                var vcy = Math.floor(Math.random() * (z.r - 6)) + 3;
                var hd5b = G.snake[0];
                // Don't spawn on/near player
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
    // === SERPENTE PRIMORDIALE (Zone 6) - 3 phases with visible ring attacks ===
    else if (bid === "primordiale") {
        // Phase transitions
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
            // Phase 1: Aggressive snake movement, poison
            bossMoveAggressive(3);
            spawnPoisonSafe(4);
            spawnGolden(6);
            // Tail whip every 5 ticks - line of poison behind boss
            boss.tailTimer++;
            if (boss.tailTimer >= 5) {
                boss.tailTimer = 0;
                discover("en_boss_tail");
                for (var twi = 1; twi <= 3; twi++) {
                    var twx = boss.anchorX - twi, twy = boss.anchorY + 1;
                    addAttackCell(twx, twy, "ring", "#f87171", 2);
                }
            }
        } else if (boss.phase === 2) {
            // Phase 2: Faster, expanding poison ring
            bossMoveAggressive(2);
            spawnGolden(5);
            // Poison ring every 4 ticks
            boss.ringLife = (boss.ringLife || 0);
            boss.ringTimer2 = (boss.ringTimer2 || 0) + 1;
            if (boss.ringTimer2 >= 4 && boss.ringLife <= 0) {
                boss.ringTimer2 = 0;
                boss.ringCells = [];
                for (var ri = -2; ri <= 2; ri++) {
                    for (var rj = -2; rj <= 2; rj++) {
                        var rdist = Math.abs(ri) + Math.abs(rj);
                        if (rdist === 2) {
                            addAttackCell(boss.anchorX + 1 + ri, boss.anchorY + 1 + rj, "ring", "#ef4444", 2);
                        }
                    }
                }
                boss.ringLife = 5;
            }
            if (boss.ringLife > 0) {
                boss.ringLife--;
                if (boss.ringLife <= 0) boss.ringCells = [];
            }
            // Tail segments behind
            boss.tailTimer++;
            if (boss.tailTimer >= 3) {
                boss.tailTimer = 0;
                var behindX = boss.anchorX - 1, behindY = boss.anchorY;
                addPoisonSafe(behindX, behindY, 6, 3);
            }
        } else {
            // Phase 3: Berserk - move every 2 ticks, 4-direction poison waves visible
            bossMoveAggressive(2);
            // Expanding cross wave every 2 ticks
            boss.berserkTimer++;
            if (boss.berserkTimer >= 2) {
                boss.berserkTimer = 0;
                var allDirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
                for (var adi = 0; adi < allDirs.length; adi++) {
                    for (var adli = 1; adli <= 3; adli++) {
                        var adx = boss.anchorX + 1 + allDirs[adi].x * adli, ady = boss.anchorY + 1 + allDirs[adi].y * adli;
                        addAttackCell(adx, ady, "ring", "#dc2626", 2);
                    }
                }
            }
            spawnGolden(4);
            // Screen pulses red
            if (fx && fx.onScreenFlash && Math.random() < 0.1) fx.onScreenFlash(3, "rgba(255,0,0,.1)");
        }
    }

    // Decrement poison food life (with fadein)
    for (var pi = G.foods.length - 1; pi >= 0; pi--) {
        if (G.foods[pi].type === "poison") {
            // Handle fadein for poison
            if (G.foods[pi].fadein !== undefined && G.foods[pi].fadein > 0) {
                G.foods[pi].fadein--;
                continue; // Don't decay life during fadein
            }
            G.foods[pi].life--;
            if (G.foods[pi].life <= 0) G.foods.splice(pi, 1);
        }
    }
    return !boss.defeated;
}

