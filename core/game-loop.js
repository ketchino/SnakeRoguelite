/* ===== GAME LOOP PRINCIPALE ===== */

function mL(G) { return Math.max(2, (G.pane ? 4 : 2) + (G.hpMaxMod || 0)); }

function useFrammento(G, z, fx) {
    if (!G.frammentovuoto || G.frammentoCD > 0 || !running || paused || G.isSpawning || G.snake.length < 1) return false;
    var hd = G.snake[0];
    var nx = hd.x + G.dir.x * 3, ny = hd.y + G.dir.y * 3;
    // Clamp to grid
    nx = Math.max(0, Math.min(z.c - 1, nx));
    ny = Math.max(0, Math.min(z.r - 1, ny));
    // Check for obstacles at destination
    if (G.obstacles.some(function(o) { return o.x === nx && o.y === ny; })) return false;
    if (G.boss && !G.boss.defeated && bossCells(G.boss).some(function(bc) { return bc.x === nx && bc.y === ny; })) return false;
    G.snake[0].x = nx;
    G.snake[0].y = ny;
    G.frammentoCD = 8000; // 8 seconds cooldown in ms
    if (fx && fx.spawnEP) fx.spawnEP(nx, ny, "#c084fc");
    if (fx && fx.addF) fx.addF(nx, ny, "TELETRASPORTO!", "#c084fc");
    if (fx && fx.onScreenFlash) fx.onScreenFlash(4, "rgba(192,132,252,.2)");
    return true;
}

function queueInput(G, dx, dy, fx) {
    if (G.pirla) { dx = -dx; dy = -dy; }
    var inp = { x: dx, y: dy };
    // Block 180° reversal against current direction
    if (inp.x === -G.dir.x && inp.y === -G.dir.y && !G.inputBuffer.length) return;
    // Check against last buffered or current direction
    var last = G.inputBuffer.length ? G.inputBuffer[G.inputBuffer.length - 1] : G.dir;
    if (inp.x === -last.x && inp.y === -last.y) return;
    // Skip if identical to last entry (no change needed)
    if (G.inputBuffer.length && inp.x === last.x && inp.y === last.y) return;
    // Buffer max 2: when full, replace last entry with latest intent
    if (G.inputBuffer.length < 2) {
        G.inputBuffer.push(inp);
    } else {
        G.inputBuffer[1] = inp;
    }
    if (fx && fx.sTurn) fx.sTurn();
}

function takeDamage(G, z, obs, fx, cause) {
    if (G.hp <= 0) return;
    if (G.invincible > 0) return;
    G.deathCause = cause || "Danno sconosciuto";
    // Scaglia della Draga: reduce damage once every 30 ticks
    if (G.scagliadraga && G.scagliaCD <= 0) {
        G.scagliaCD = 30;
        if (fx && fx.addF) fx.addF(G.snake[0].x, G.snake[0].y, "SCAGLIA!", "#ef4444");
        if (fx && fx.onScreenFlash) fx.onScreenFlash(4, "rgba(239,68,68,.2)");
        // Reduce damage: skip one HP loss by returning early after removing the obstacle
        if (obs) G.obstacles = G.obstacles.filter(function (o) { return o !== obs; });
        if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
        return;
    }
    if (G.bigtop && G.bigtopTicks > 0) {
        if (fx && fx.addF) fx.addF(G.snake[0].x, G.snake[0].y, "BIG TOP!", "#fbbf24");
        if (obs) G.obstacles = G.obstacles.filter(function (o) { return o !== obs; });
        if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
        return;
    }
    if (G.linkShield) {
        G.linkShield = false; G.linkCD = 20000;
        if (fx && fx.sLink) fx.sLink();
        if (fx && fx.addF) fx.addF(G.snake[0].x, G.snake[0].y, "LINK!", "#60a5fa");
        if (fx && fx.onScreenFlash) fx.onScreenFlash(5, "rgba(96,165,250,.2)");
        if (obs) G.obstacles = G.obstacles.filter(function (o) { return o !== obs; });
        if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
        return;
    }
    if (G.nokia) {
        G.nokia = false; G.nokiaSlow = 8;
        if (obs) G.obstacles = G.obstacles.filter(function (o) { return o !== obs; });
        if (G.snake.length > 0 && fx && fx.spawnDP) fx.spawnDP(G.snake[0].x, G.snake[0].y);
        if (fx && fx.addF) fx.addF(G.snake[0].x, G.snake[0].y, "NOKIA!", "#5eead4");
        if (fx && fx.onScreenFlash) fx.onScreenFlash(8, "rgba(94,234,212,.25)");
        if (fx && fx.sNokia) fx.sNokia();
        if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
        return;
    }
    if (G.sonic) {
        G.sonic = false;
        triggerSpawn(G, z, mL(G));
        if (fx && fx.sSonic) fx.sSonic();
        if (obs) G.obstacles = G.obstacles.filter(function (o) { return o !== obs; });
        if (fx && fx.addF) fx.addF(G.snake[0].x, G.snake[0].y, "SONIC!", "#60a5fa");
        if (fx && fx.onScreenFlash) fx.onScreenFlash(6, "rgba(96,165,250,.2)");
        if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
        return;
    }
    G.hp--;
    if (fx && fx.onScreenFlash) fx.onScreenFlash(10, "rgba(255,30,30,.25)");
    if (fx && fx.onShake) fx.onShake(8);
    if (obs) G.obstacles = G.obstacles.filter(function (o) { return !(o.x === obs.x && o.y === obs.y); });
    if (G.hp <= 0 && G.rosario) {
        G.hp = 1; G.rosario = false;
        if (fx && fx.addF) fx.addF(G.snake[0].x, G.snake[0].y, "ROSARIO!", "#fbbf24");
        if (fx && fx.sLink) fx.sLink();
        triggerSpawn(G, z, mL(G));
        if (fx && fx.onScreenFlash) fx.onScreenFlash(10, "rgba(251,191,36,.3)");
        if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
        return;
    }
    if (G.hp <= 0) {
        // Ricordo Sbiadito: revival una tantum
        if (G.ricordoSbiadito && !G.ricordoUsed) {
            G.ricordoUsed = true;
            G.ricordoSbiadito = false;
            var halfLen = Math.max(mL(G), Math.floor(G.snake.length / 2));
            G.hp = 1;
            triggerSpawn(G, z, halfLen);
            if (fx && fx.addF) fx.addF(G.snake[0].x, G.snake[0].y, "RICORDO!", "#c084fc");
            if (fx && fx.onScreenFlash) fx.onScreenFlash(12, "rgba(192,132,252,.3)");
            if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
            return;
        }
        G.deathCause = cause || "Danno sconosciuto";
        if (fx && fx.sDie) fx.sDie();
        if (fx && fx.onDead) fx.onDead();
        return;
    }
    if (fx && fx.sHit) fx.sHit();
    if (G.snake.length > 0 && fx && fx.spawnDP) fx.spawnDP(G.snake[0].x, G.snake[0].y);
    // During boss fight: don't reset snake position, just lose tail segments
    if (G.boss && !G.boss.defeated) {
        // Boss damage: lose tail segments (reduced by meleeMod), shorter invincibility, NO respawn
        var bossSegLoss = Math.max(1, Math.round(2 / (G.meleeMod || 1)));
        while (G.snake.length > mL(G) && bossSegLoss > 0) { G.snake.pop(); bossSegLoss--; }
        G.invincible = 4; // Shorter invincibility during boss (~0.7s)
        if (fx && fx.addF) fx.addF(G.snake[0].x, G.snake[0].y, "-1 HP", "#f87171");
    } else {
        // Normal damage: respawn at center as before
        triggerSpawn(G, z, Math.max(mL(G), G.snake.length - 2));
        G.invincible = 6; // ~1 second of invincibility
    }
    var sp = G.snake[0];
    if (G.foods.some(function (f) { return f.x === sp.x && f.y === sp.y; })) {
        if (G.boss && !G.boss.defeated) {
            // During boss fight: just remove the food under the snake, don't wipe all foods
            G.foods = G.foods.filter(function (f) { return !(f.x === sp.x && f.y === sp.y); });
        } else {
            var nf = spawnFood(G, z);
            G.foods = nf ? [nf] : [];
        }
    }
    if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
}

function guscioRay(G, nx, ny, dirX, dirY, z, fx) {
    for (var gi = 1; gi <= 3; gi++) {
        var gxx = nx + dirX * gi, gyy = ny + dirY * gi;
        if (gxx < 0 || gxx >= z.c || gyy < 0 || gyy >= z.r) break;
        var hitSomething = false;
        for (var oi = G.obstacles.length - 1; oi >= 0; oi--) {
            if (G.obstacles[oi].x === gxx && G.obstacles[oi].y === gyy) {
                var gobs = G.obstacles[oi];
                if (gobs.type === "explosive") {
                    G.obstacles.splice(oi, 1);
                    explodeAt(G, z, gxx, gyy, 0, fx);
                } else {
                    G.obstacles.splice(oi, 1);
                    if (fx && fx.spawnDP) fx.spawnDP(gxx, gyy);
                }
                hitSomething = true; break;
            }
        }
        if (!hitSomething) {
            for (var ej = G.enemies.length - 1; ej >= 0; ej--) {
                if (G.enemies[ej].x === gxx && G.enemies[ej].y === gyy) {
                    G.enemies.splice(ej, 1);
                    if (fx && fx.spawnEP) fx.spawnEP(gxx, gyy, "#60a5fa");
                    if (fx && fx.addF) fx.addF(gxx, gyy, "+2", "#60a5fa");
                    G.score += 2;
                    hitSomething = true; break;
                }
            }
        }
        if (hitSomething) break;
    }
}

function tick(G, z, fx) {
    if (G.nokiaSlow > 0) { G.nokiaSlow--; return; }
    if (G.hulkCD > 0) G.hulkCD--;
    if (G.invincible > 0 && !G._debugGod) G.invincible--;
    if (G.bigtopTicks > 0) G.bigtopTicks--;
    if (G.scagliadraga && G.scagliaCD > 0) G.scagliaCD--;
    if (G.traps) {
        for (var i = G.traps.length - 1; i >= 0; i--) {
            G.traps[i].life--;
            if (G.traps[i].life <= 0) G.traps.splice(i, 1);
        }
        // Activate traps when snake tail passes over them
        if (G.snake.length > 0) {
            var tail = G.snake[G.snake.length - 1];
            for (var j = 0; j < G.traps.length; j++) {
                if (!G.traps[j].active && G.traps[j].x === tail.x && G.traps[j].y === tail.y) {
                    G.traps[j].active = true;
                }
            }
        }
    }
    if (!G.preZoneSpawn && G.boss && !G.boss.defeated) tickBoss(G, z, fx);
    else if (!G.preZoneSpawn) moveEnemies(G, z, fx);
    if (G.hp <= 0) return;

    var oldDir = { x: G.dir.x, y: G.dir.y };
    if (G.inputBuffer.length) G.dir = G.inputBuffer.shift();

    var nx = G.snake[0].x + G.dir.x, ny = G.snake[0].y + G.dir.y;

    if (G.isSpawning) {
        if (G.portal) {
            if (nx < 0) nx = z.c - 1; if (nx >= z.c) nx = 0;
            if (ny < 0) ny = z.r - 1; if (ny >= z.r) ny = 0;
        } else {
            nx = Math.max(0, Math.min(z.c - 1, nx));
            ny = Math.max(0, Math.min(z.r - 1, ny));
        }

        if (nx === G.snake[0].x && ny === G.snake[0].y) {
            G.isSpawning = false;
            if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
            return;
        }

        // Durante lo spawn il serpente è invincibile: distrugge ostacoli e nemici sul suo percorso
        var spO = null;
        for (var soi = 0; soi < G.obstacles.length; soi++) { if (G.obstacles[soi].x === nx && G.obstacles[soi].y === ny) { spO = G.obstacles[soi]; break; } }
        if (spO) {
            if (spO.type === "explosive") { G.obstacles.splice(G.obstacles.indexOf(spO), 1); explodeAt(G, z, nx, ny, 0, fx); }
            else { G.obstacles = G.obstacles.filter(function(o) { return o !== spO; }); if (fx && fx.spawnDP) fx.spawnDP(nx, ny); }
            if (fx && fx.addF) fx.addF(nx, ny, "DEMOLEZIONE!", "#fbbf24");
            if (fx && fx.onShake) fx.onShake(3);
        }

        var spE = null;
        for (var sei = 0; sei < G.enemies.length; sei++) { if (G.enemies[sei].x === nx && G.enemies[sei].y === ny) { spE = G.enemies[sei]; break; } }
        if (spE) {
            if (spE.isBossGuard && G.boss && !G.boss.defeated) {
                if (!G.foods.some(function(f) { return f.x === nx && f.y === ny; })) {
                    G.foods.push({ x: nx, y: ny, type: G.boss.collectType });
                }
            }
            G.enemies = G.enemies.filter(function(e) { return e !== spE; });
            if (fx && fx.spawnEP) fx.spawnEP(nx, ny, "#a855f7");
            if (fx && fx.addF) fx.addF(nx, ny, "+2", "#a855f7");
            G.score += 2;
        }

        G.snake.unshift({ x: nx, y: ny });
        if (G.spawnLeft > 0) {
            G.spawnLeft--;
            // Srotolamento: non poppare la coda, il serpente cresce — nessuna particella
        } else {
            G.snake.pop();
        }

        var spF = -1;
        var bossCollectTypes = ["golden", "shadow", "fly", "coin", "crystal", "cosmic", "essence"];
        for (var sfi = 0; sfi < G.foods.length; sfi++) {
            if (G.foods[sfi].x === nx && G.foods[sfi].y === ny) {
                // During spawning: skip only poison (just respawned, unfair to take poison damage immediately)
                // Boss collectibles are now collectable during spawning
                if (G.boss && !G.boss.defeated && G.foods[sfi].type === "poison") continue;
                spF = sfi; break;
            }
        }
        if (spF >= 0) {
            var spEatenFood = G.foods[spF];
            var spBossCollectTypes = ["golden", "shadow", "fly", "coin", "crystal", "cosmic", "essence"];
            var spIsBossCollect = G.boss && !G.boss.defeated && spBossCollectTypes.indexOf(spEatenFood.type) !== -1;
            
            if (spIsBossCollect) {
                // Boss collectible during spawning: handle like normal gameplay boss collection
                var spBCol = G.boss.collectColor || "#fbbf24";
                var spBName = G.boss.collectName || "DORATA";
                G.foods.splice(spF, 1);
                G.boss.goldenCollected++;
                if (fx && fx.spawnEP) fx.spawnEP(nx, ny, spBCol);
                if (fx && fx.onGridPulse) fx.onGridPulse();
                if (fx && fx.sEat) fx.sEat();
                var spBDef = null;
                for (var spBdi = 0; spBdi < BOSS_DB.length; spBdi++) { if (BOSS_DB[spBdi].id === G.boss.id) { spBDef = BOSS_DB[spBdi]; break; } }
                var spProgTxt = spBName + " " + G.boss.goldenCollected + "/" + (spBDef ? spBDef.goldenToDamage : "?");
                if (fx && fx.addF) fx.addF(nx, ny, spProgTxt, spBCol);
                if (spBDef && G.boss.goldenCollected >= spBDef.goldenToDamage) {
                    G.boss.hp--;
                    G.boss.goldenCollected = 0;
                    var spBDC = spBDef.color || "#fbbf24";
                    if (fx && fx.addF) fx.addF(G.boss.anchorX, G.boss.anchorY, "BOSS -1 HP!", spBDC);
                    if (fx && fx.onScreenFlash) fx.onScreenFlash(10, h2r(spBDC, 0.35));
                    if (fx && fx.onShake) fx.onShake(12);
                    if (fx && fx.sBossHit) fx.sBossHit();
                    if (G.boss.hp <= 0) {
                        G.boss.defeated = true;
                        if (fx && fx.onBossDefeated) fx.onBossDefeated();
                    }
                }
                if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
                if (fx && fx.onUpdateZB) fx.onUpdateZB();
            } else {
                // Normal food during spawning
                G.foods.splice(spF, 1);
                if (fx && fx.spawnEP) fx.spawnEP(nx, ny, "#ff4444");
                if (fx && fx.onGridPulse) fx.onGridPulse();
                if (fx && fx.sEat) fx.sEat();
                G.totalMeals++;
                var spPts = G.spf;
                if (G.arrow) spPts = Math.ceil(spPts * 1.3);
                if (G.stonks && !G.arrow) { spPts += Math.floor(G.snake.length / 8); G.stonksMeals++; if (fx && fx.onSchedLoop) fx.onSchedLoop(); }
                G.score += spPts;
                var spXp = Math.ceil(2 * G.xpm);
                G.xp += spXp;
                G.zoneFood += G.spf;
                if (fx && fx.addF) fx.addF(nx, ny, "+" + spXp + " XP", "#fff");
                // During boss fight: don't replace all foods; otherwise spawn new food normally
                if (G.boss && !G.boss.defeated) {
                    // Don't wipe foods during boss fight
                } else {
                    var nf = spawnFood(G, z);
                    G.foods = nf ? [nf] : [];
                }
                if (G.xp >= G.xpNeed) { G.isSpawning = false; if (fx && fx.onLevelUp) fx.onLevelUp(); return; }
                // During boss fight: skip zone completion checks
                if (!G.boss || G.boss.defeated) {
                    if (G.zoneFood >= z.tgt) {
                        var bd = getBossForZone(G.zoneIndex);
                        if (bd && (!G.bossDefeated || G.bossDefeated.indexOf(bd.id) === -1) && G.difficulty !== "peaceful") {
                            G.isSpawning = false;
                            if (fx && fx.onBossStart) fx.onBossStart(bd);
                            return;
                        }
                        if (G.zoneIndex < ZONES.length - 1) { G.zoneIndex++; } else { G.endlessCycle++; }
                        G.zoneFood = 0;
                        G.isSpawning = false;
                        if (fx && fx.onZoneComplete) fx.onZoneComplete();
                        return;
                    }
                }
                if (fx && fx.onUpdateZB) fx.onUpdateZB();
            }
        }

        if (G.spawnLeft <= 0) G.isSpawning = false;
        if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
        return;
    }

    if (G.portal) {
        if (nx < 0) nx = z.c - 1; if (nx >= z.c) nx = 0;
        if (ny < 0) ny = z.r - 1; if (ny >= z.r) ny = 0;
    } else {
        // Debug No Clip: wrap around map edges instead of dying
        if (G._debugNoClip) {
            if (nx < 0) nx = z.c - 1; if (nx >= z.c) nx = 0;
            if (ny < 0) ny = z.r - 1; if (ny >= z.r) ny = 0;
        } else {
            // Check crack interaction BEFORE wall damage
            if (G.crack && (nx < 0 || nx >= z.c || ny < 0 || ny >= z.r)) {
                // Check if moving towards crack
                var crackDist = Math.abs(G.crack.x - G.snake[0].x) + Math.abs(G.crack.y - G.snake[0].y);
                if (crackDist <= 1) {
                    // Entering the crack! Lose 2 segments (no life lost), open shop (Frenk: gratis)
                    var crackSegLoss = G.crackFree ? 0 : 2;
                    while (G.snake.length > 4 && crackSegLoss > 0) { G.snake.pop(); crackSegLoss--; }
                    if (fx && fx.onCrackEnter) fx.onCrackEnter();
                    return;
                }
            }
            if (nx < 0 || nx >= z.c || ny < 0 || ny >= z.r) { takeDamage(G, z, null, fx, "Fuori mappa"); return; }
        }
    }

    // Debug No Clip / Frenk ghost: skip autocollision
    if (!G.lag && !G.ghostBody && !(G.kunaiImmunity > Date.now()) && !G._debugNoClip) {
        var autoHit = false;
        for (var ahi = 0; ahi < G.snake.length - 1; ahi++) {
            if (G.snake[ahi].x === nx && G.snake[ahi].y === ny) { autoHit = true; break; }
        }
        if (autoHit) { takeDamage(G, z, null, fx, "Autocollisione"); return; }
    }

    // Boss cell collision: il serpente può colpire il boss, subisce danno e il boss si sposta
    if (G.boss && !G.boss.defeated && !G.isSpawning) {
        var bcPre = bossCells(G.boss);
        var bossBlocked = false;
        for (var bcpi = 0; bcpi < bcPre.length; bcpi++) {
            if (nx === bcPre[bcpi].x && ny === bcPre[bcpi].y) { bossBlocked = true; break; }
        }
        if (bossBlocked) {
            // Il serpente colpisce il boss: subisce danno, il boss si sposta per evitare phasing
            if (G.invincible <= 0) {
                takeDamage(G, z, null, fx, "Collisione Boss");
                if (fx && fx.sBossDmgPlayer) fx.sBossDmgPlayer();
            }
            // Sposta il boss lontano dal serpente
            var bossMoveDir = { x: Math.sign(G.boss.anchorX - G.snake[0].x), y: Math.sign(G.boss.anchorY - G.snake[0].y) };
            if (bossMoveDir.x === 0 && bossMoveDir.y === 0) bossMoveDir = { x: 1, y: 0 };
            // Prova diverse direzioni per spostare il boss
            var bossMoveDirs = [bossMoveDir, { x: bossMoveDir.x, y: 0 }, { x: 0, y: bossMoveDir.y }, { x: -bossMoveDir.x, y: bossMoveDir.y }, { x: bossMoveDir.x, y: -bossMoveDir.y }];
            for (var bmdi = 0; bmdi < bossMoveDirs.length; bmdi++) {
                var bmd = bossMoveDirs[bmdi];
                var bnax = G.boss.anchorX + bmd.x * 2, bnay = G.boss.anchorY + bmd.y * 2;
                if (bnax >= 0 && bnax + 1 < z.c && bnay >= 0 && bnay + 1 < z.r) {
                    // Verifica che la nuova posizione non si sovrapponga al serpente
                    var bNewCells = [{ x: bnax, y: bnay }, { x: bnax + 1, y: bnay }, { x: bnax, y: bnay + 1 }, { x: bnax + 1, y: bnay + 1 }];
                    var bOverlap = false;
                    for (var boci = 0; boci < bNewCells.length; boci++) {
                        if (G.snake.some(function(s) { return s.x === bNewCells[boci].x && s.y === bNewCells[boci].y; })) { bOverlap = true; break; }
                    }
                    if (!bOverlap) {
                        G.boss.anchorX = bnax;
                        G.boss.anchorY = bnay;
                        break;
                    }
                }
            }
            if (fx && fx.onShake) fx.onShake(4);
            return; // Il serpente non si muove in quella cella
        }
    }

    G.snake.unshift({ x: nx, y: ny });

    // Check crack interaction: walk over crack to open shop
    if (G.crack && nx === G.crack.x && ny === G.crack.y) {
        var crackSegLoss = G.crackFree ? 0 : 2;
        while (G.snake.length > 4 && crackSegLoss > 0) { G.snake.pop(); crackSegLoss--; }
        if (fx && fx.onCrackEnter) fx.onCrackEnter();
        return;
    }

    var ate = false;

    var hitEn = null;
    for (var he = 0; he < G.enemies.length; he++) { if (G.enemies[he].x === nx && G.enemies[he].y === ny) { hitEn = G.enemies[he]; break; } }
    if (hitEn) {
        if (G.invincible > 0) {
            // Invincible: destroy enemy
            if (hitEn.isBossGuard && G.boss && !G.boss.defeated) {
                if (!G.foods.some(function(f) { return f.x === nx && f.y === ny; })) {
                    G.foods.push({ x: nx, y: ny, type: G.boss.collectType });
                    if (fx && fx.addF) fx.addF(nx, ny, (G.boss.collectName || "GUARDIA") + "!", (G.boss.collectColor || "#fbbf24"));
                }
            }
            G.enemies = G.enemies.filter(function (e) { return e !== hitEn; });
            if (fx && fx.spawnEP) fx.spawnEP(nx, ny, "#a855f7");
            if (fx && fx.addF) fx.addF(nx, ny, "INVINCIBILE!", "#5eead4");
            G.score += 2;
        } else if (G.unoReverse) {
         G.enemies = G.enemies.filter(function (e) { return e !== hitEn; });
         var pts = G.snake.length;
         G.score += pts;
         if (G.snake.length + 2 <= SNAKE_MAX_LEN) {
             var t = G.snake[G.snake.length - 1];
             G.snake.push({ x: t.x, y: t.y });
             G.snake.push({ x: t.x, y: t.y });
         }
         if (fx && fx.spawnEP) fx.spawnEP(nx, ny, "#fbbf24");
         if (fx && fx.addF) fx.addF(nx, ny, "REVERSE +" + pts, "#fbbf24");
         G.unoReverse = false;
         if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
         return;
     } else {
            // Snake runs into enemy: lose 2 segments, enemy dies
            if (hitEn.isBossGuard && G.boss && !G.boss.defeated) {
                if (!G.foods.some(function(f) { return f.x === nx && f.y === ny; })) {
                    G.foods.push({ x: nx, y: ny, type: G.boss.collectType });
                    if (fx && fx.addF) fx.addF(nx, ny, (G.boss.collectName || "GUARDIA") + "!", (G.boss.collectColor || "#fbbf24"));
                }
            }
            G.enemies = G.enemies.filter(function (e) { return e !== hitEn; });
            var segLoss3 = Math.max(1, Math.round(2 / (G.meleeMod || 1)));
            while (G.snake.length > mL(G) && segLoss3 > 0) { G.snake.pop(); segLoss3--; }
            if (fx && fx.spawnEP) fx.spawnEP(nx, ny, "#a855f7");
            if (fx && fx.addF) fx.addF(nx, ny, "-" + Math.max(1, Math.round(2 / (G.meleeMod || 1))) + " segmenti", "#f87171");
            if (fx && fx.onScreenFlash) fx.onScreenFlash(4, "rgba(248,113,113,.15)");
            if (fx && fx.sHit) fx.sHit();
            if (fx && fx.onShake) fx.onShake(4);
            if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
            if (!ate || (G.maxSegments && G.snake.length > G.maxSegments)) G.snake.pop();
            return;
        }
    }

    var hitO = null;
    for (var ho = 0; ho < G.obstacles.length; ho++) { if (G.obstacles[ho].x === nx && G.obstacles[ho].y === ny) { hitO = G.obstacles[ho]; break; } }
    if (hitO && !G._debugNoClip) {
        if (hitO.type === "fragile") {
            G.obstacles = G.obstacles.filter(function (o) { return o !== hitO; });
            if (fx && fx.spawnDP) fx.spawnDP(nx, ny);
            if (fx && fx.sFrag) fx.sFrag();
        } else if (hitO.type === "explosive") {
            G.obstacles = G.obstacles.filter(function (o) { return o !== hitO; });
            explodeAt(G, z, nx, ny, 0, fx);
            if (G.nokia) {
                G.nokia = false; G.nokiaSlow = 8; if (fx && fx.sNokia) fx.sNokia();
                if (fx && fx.addF) fx.addF(nx, ny, "NOKIA!", "#5eead4");
            } else if (G.sonic) {
                G.sonic = false; triggerSpawn(G, z, mL(G)); if (fx && fx.sSonic) fx.sSonic();
                if (fx && fx.addF) fx.addF(nx, ny, "SONIC!", "#60a5fa");
                if (fx && fx.onUpdateHUD) fx.onUpdateHUD(); return;
            } else { takeDamage(G, z, null, fx, "Esplosione"); return; }
        } else {
            if (G.tronco) {
                G.obstacles = G.obstacles.filter(function (o) { return o !== hitO; });
                if (fx && fx.spawnDP) fx.spawnDP(nx, ny);
                if (fx && fx.addF) fx.addF(nx, ny, "TRONCO!", "#a3e635");
                G.tronco = false;
            } else if (G.hulk) {
                if (!G.hulkCD || G.hulkCD <= 0) {
                    G.obstacles = G.obstacles.filter(function (o) { return o !== hitO; });
                    if (fx && fx.spawnDP) fx.spawnDP(nx, ny);
                    if (fx && fx.sHulk) fx.sHulk();
                    var minLen = Math.max(mL(G), G.snake.length - 6);
                    while (G.snake.length > minLen) G.snake.pop();
                    if (fx && fx.addF) fx.addF(nx, ny, "HULK!", "#a3e635");
                    G.hulkCD = 3;
                } else {
                    takeDamage(G, z, hitO, fx, "Ostacolo"); return;
                }
            } else { takeDamage(G, z, hitO, fx, "Ostacolo"); return; }
        }
    }

    if (G.trappola && (G.dir.x !== oldDir.x || G.dir.y !== oldDir.y) && G.snake.length > 1) {
        discover("me_trap"); // AGGIUNGI QUESTA RIGA
        G.traps.push({ x: G.snake[1].x, y: G.snake[1].y, life: 25, active: false });
    }

    var foodIdx = -1, foodX = nx, foodY = ny;
    for (var fi = 0; fi < G.foods.length; fi++) {
        if (G.foods[fi].x === nx && G.foods[fi].y === ny) { foodIdx = fi; break; }
    }
    if (foodIdx < 0 && G.gommu) {
        for (var gd = 1; gd <= 1; gd++) {
            var gx = nx + G.dir.x * gd, gy = ny + G.dir.y * gd;
            if (gx < 0 || gx >= z.c || gy < 0 || gy >= z.r) break;
            var gClear = true;
            for (var gp = 1; gp <= gd; gp++) {
                var gpx = nx + G.dir.x * gp, gpy = ny + G.dir.y * gp;
                if (G.obstacles.some(function (o) { return o.x === gpx && o.y === gpy; }) || G.enemies.some(function (e) { return e.x === gpx && e.y === gpy; })) { gClear = false; break; }
            }
            if (gClear) {
                for (var fi2 = 0; fi2 < G.foods.length; fi2++) {
                    if (G.foods[fi2].x === gx && G.foods[fi2].y === gy) { foodIdx = fi2; foodX = gx; foodY = gy; break; }
                }
                if (foodIdx >= 0) break;
            }
        }
    }
    if (foodIdx < 0 && G.nabbo) {
        var adj = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
        for (var ai = 0; ai < adj.length; ai++) {
            var ax = nx + adj[ai][0], ay = ny + adj[ai][1];
            if (ax < 0 || ax >= z.c || ay < 0 || ay >= z.r) continue;
            for (var fi3 = 0; fi3 < G.foods.length; fi3++) {
                if (G.foods[fi3].x === ax && G.foods[fi3].y === ay) { foodIdx = fi3; foodX = ax; foodY = ay; break; }
            }
            if (foodIdx >= 0) break;
        }
    }

    ate = false;
    if (foodIdx >= 0) {
        var eatenFood = G.foods[foodIdx];
        // Boss collectible types
        var bossCollectTypes = ["golden", "shadow", "fly", "coin", "crystal", "cosmic", "essence"];
        var isBossCollect = G.boss && !G.boss.defeated && bossCollectTypes.indexOf(eatenFood.type) !== -1;
        // Boss food handling
        if (isBossCollect) {
            var bCol = G.boss.collectColor || "#fbbf24";
            var bName = G.boss.collectName || "DORATA";
            G.foods.splice(foodIdx, 1);
            ate = false; // Boss collectibles don't increase snake size
            G.boss.goldenCollected++;
            if (fx && fx.spawnEP) fx.spawnEP(foodX, foodY, bCol);
            if (fx && fx.onGridPulse) fx.onGridPulse();
            if (fx && fx.sEat) fx.sEat();
            // Show collection progress: "MELE 2/3!" instead of just "MELA DORATA!"
            var bossDefTmp = null;
            for (var bdtmp = 0; bdtmp < BOSS_DB.length; bdtmp++) { if (BOSS_DB[bdtmp].id === G.boss.id) { bossDefTmp = BOSS_DB[bdtmp]; break; } }
            var progressTxt = bName + " " + G.boss.goldenCollected + "/" + (bossDefTmp ? bossDefTmp.goldenToDamage : "?");
            if (fx && fx.addF) fx.addF(foodX, foodY, progressTxt, bCol);
            var bossDef2 = null;
            for (var bdi = 0; bdi < BOSS_DB.length; bdi++) { if (BOSS_DB[bdi].id === G.boss.id) { bossDef2 = BOSS_DB[bdi]; break; } }
            if (bossDef2 && G.boss.goldenCollected >= bossDef2.goldenToDamage) {
                G.boss.hp--;
                G.boss.goldenCollected = 0;
                // Boss takes damage - use boss color for visual feedback (not red like player damage)
                var bossDmgColor = bossDef2.color || "#fbbf24";
                if (fx && fx.addF) fx.addF(G.boss.anchorX, G.boss.anchorY, "BOSS -1 HP!", bossDmgColor);
                if (fx && fx.onScreenFlash) fx.onScreenFlash(10, h2r(bossDmgColor, 0.35));
                if (fx && fx.onShake) fx.onShake(12);
                if (fx && fx.sBossHit) fx.sBossHit();
                if (G.boss.hp <= 0) {
                    G.boss.defeated = true;
                    if (fx && fx.onBossDefeated) fx.onBossDefeated();
                }
            }
            if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
            if (fx && fx.onUpdateZB) fx.onUpdateZB();
        } else if (G.boss && !G.boss.defeated && eatenFood.type === "poison") {
            // Poison in fadein phase is not yet active - can't be collected
            if (eatenFood.fadein !== undefined && eatenFood.fadein > 0) {
                // Can't eat it yet - treat as empty cell
                ate = false;
            } else {
                G.foods.splice(foodIdx, 1);
                if (G.pelleprimordiale) {
                    // Immune to boss poison!
                    if (fx && fx.addF) fx.addF(foodX, foodY, "IMMUNE!", "#4ade80");
                    if (fx && fx.sEat) fx.sEat();
                } else {
                    // Boss poison damage — use distinct sound
                    if (fx && fx.sBossDmgPlayer) fx.sBossDmgPlayer();
                    takeDamage(G, z, null, fx, "Mela Avvelenata");
                }
                return;
            }
        } else {
        ate = true;
        if (fx && fx.spawnEP) fx.spawnEP(foodX, foodY, "#ff4444");
        if (fx && fx.onGridPulse) fx.onGridPulse();
        if (fx && fx.sEat) fx.sEat();
        G.totalMeals++;
        var pts2 = G.spf;
        if (G.arrow) pts2 = Math.ceil(pts2 * 1.3);
        if (G.stonks && !G.arrow) {
            pts2 += Math.floor(G.snake.length / 8);
            G.stonksMeals++;
            if (fx && fx.onSchedLoop) fx.onSchedLoop();
        }
        G.score += pts2;
        var xpG = Math.ceil(2 * G.xpm);
        if (G.lofi && G.totalMeals % 5 === 0) { xpG++; if (fx && fx.addF) fx.addF(foodX, foodY, "+1 LOFI", "#a3e635"); }
        if (G.dado && G.totalMeals % 8 === 0) {
            if (Math.random() > 0.5) { xpG += 3; if (fx && fx.addF) fx.addF(foodX, foodY, "+3 XP DADO!", "#fbbf24"); }
            else { G.score += 3; if (fx && fx.addF) fx.addF(foodX, foodY, "+3 PT DADO!", "#fbbf24"); }
        }
        if (G.moneta && G.totalMeals % 5 === 0) { G.score += 2; if (fx && fx.addF) fx.addF(foodX, foodY, "+2 MONETA", "#fbbf24"); }
        G.xp += xpG;
        G.zoneFood += G.spf;
        if (fx && fx.addF) fx.addF(foodX, foodY, "+" + xpG + " XP", "#fff");
        if (G.cheese && G.totalMeals % 10 === 0) {
            var cheeseMaxHp = Math.max(1, 4 + (G.hpMaxMod || 0));
            if (G.hp < cheeseMaxHp) { G.hp++; if (fx && fx.addF) fx.addF(foodX, foodY, "+1 HP", "#4ade80"); }
            else if (G.snake.length > 4) { G.snake.splice(-3); if (fx && fx.addF) fx.addF(foodX, foodY, "-3 Coda", "#fbbf24"); }
        }
        // Corona del Tiranno: every 10 meals, +1 max HP
        if (G.coronatiranno) {
            G.coronaMeals = (G.coronaMeals || 0) + 1;
            if (G.coronaMeals >= 10) {
                G.coronaMeals = 0;
                if (!G.hpLocked) { G.hp++; G.hpMaxMod = (G.hpMaxMod || 0) + 1; }
                if (fx && fx.addF) fx.addF(foodX, foodY, G.hpLocked ? "HP BLOCCATO" : "+1 MAX HP!", "#fbbf24");
            }
        }
        // Lingua del Rospo: stun enemies near food
        if (G.linguarospo) {
            G.enemies.forEach(function(e) {
                if (Math.abs(e.x - foodX) + Math.abs(e.y - foodY) <= 2) {
                    e.slowTicks = (e.slowTicks || 0) + 3;
                }
            });
        }
        if (G.vortex && G.obstacles.length) {
            var vTargets = G.obstacles.filter(function(o) {
                return o.type === "normal" && Math.abs(o.x - foodX) + Math.abs(o.y - foodY) <= 2;
            });
            if (vTargets.length > 0) {
                var vob = vTargets[Math.floor(Math.random() * vTargets.length)];
                G.obstacles = G.obstacles.filter(function(o) { return o !== vob; });
                if (fx && fx.spawnDP) fx.spawnDP(vob.x, vob.y);
                G.xp += 2;
            }
        }
        if (G.praise) {
            G.praiseCnt++;
            if (G.praiseCnt >= 3) {
                G.praiseCnt = 0;
                for (var pdx = -2; pdx <= 2; pdx++) for (var pdy = -2; pdy <= 2; pdy++) {
                    var prx = nx + pdx, pry = ny + pdy;
                    if (prx < 0 || prx >= z.c || pry < 0 || pry >= z.r) continue;
                    (function (rx, ry) {
                        G.obstacles = G.obstacles.filter(function (o) {
                            if (o.x === rx && o.y === ry && o.type === "fragile") { if (fx && fx.spawnDP) fx.spawnDP(rx, ry); return false; }
                            return true;
                        });
                    })(prx, pry);
                }
                if (fx && fx.addF) fx.addF(foodX, foodY, "PRAISE!", "#fbbf24");
                if (fx && fx.onScreenFlash) fx.onScreenFlash(4, "");
            }
        }
        if (G.eruzione) {
            G.eruzioneCnt++;
            if (G.eruzioneCnt >= 4) {
                G.eruzioneCnt = 0;
                G.obstacles = G.obstacles.filter(function (o) {
                    if (o.type === "normal" && Math.abs(o.x - nx) + Math.abs(o.y - ny) <= 3) { if (fx && fx.spawnDP) fx.spawnDP(o.x, o.y); return false; }
                    return true;
                });
            }
        }
        if (G.nostalgia) {
            G.enemies.forEach(function (e) {
                var d = Math.abs(e.x - foodX) + Math.abs(e.y - foodY);
                if (d <= 3 && d > 0) {
                    var ndx = Math.sign(e.x - foodX), ndy = Math.sign(e.y - foodY);
                    var nex = e.x + ndx, ney = e.y + ndy;
                    if (nex >= 0 && nex < z.c && ney >= 0 && ney < z.r && !G.obstacles.some(function (o) { return o.x === nex && o.y === ney; }) && !G.enemies.some(function (o2) { return o2 !== e && o2.x === nex && o2.y === ney; }) && !G.snake.some(function (s) { return s.x === nex && s.y === ney; })) { e.x = nex; e.y = ney; }
                }
            });
        }
        if (G.sabbia) {
            G.enemies.forEach(function (e) { if (Math.abs(e.x - foodX) + Math.abs(e.y - foodY) <= 3) e.slowTicks = 8; });
        }
        if (G.guscio) {
            G.guscioCnt++;
            if (G.guscioCnt >= 3) {
                G.guscioCnt = 0;
                guscioRay(G, nx, ny, G.dir.x, G.dir.y, z, fx);
            }
        }
        // During boss fight: don't replace all foods with a single new one
        if (G.boss && !G.boss.defeated) {
            // Just remove the collected food; boss logic handles golden apple spawning
            // No new normal food needed during boss fight
        } else {
            var nf2 = spawnFood(G, z);
            G.foods = nf2 ? [nf2] : [];
        }
        if (G.xp >= G.xpNeed) { if (fx && fx.onLevelUp) fx.onLevelUp(); return; }
        // During boss fight: skip zone completion checks (boss IS the zone challenge)
        if (!G.boss || G.boss.defeated) {
            if (G.zoneFood >= z.tgt) {
                var bd2 = getBossForZone(G.zoneIndex);
                if (bd2 && (!G.bossDefeated || G.bossDefeated.indexOf(bd2.id) === -1) && G.difficulty !== "peaceful") {
                    if (fx && fx.onBossStart) fx.onBossStart(bd2);
                    return;
                }
                if (G.zoneIndex < ZONES.length - 1) { G.zoneIndex++; } else { G.endlessCycle++; }
                G.zoneFood = 0;
                if (fx && fx.onZoneComplete) fx.onZoneComplete();
                return;
            }
        }
        if (fx && fx.onUpdateZB) fx.onUpdateZB();
        } // end else (normal food)
    } // end if (foodIdx >= 0)

    // Boss collision check (safety fallback - boss moves onto snake)
    if (G.boss && !G.boss.defeated) {
        var bc = bossCells(G.boss);
        for (var bci = 0; bci < bc.length; bci++) {
            if (nx === bc[bci].x && ny === bc[bci].y) {
                // Boss moved onto us - push snake back, deal damage, move boss
                G.snake.shift(); // Remove the head we just added
                if (G.invincible <= 0) {
                    takeDamage(G, z, null, fx, "Collisione Boss");
                    if (fx && fx.sBossDmgPlayer) fx.sBossDmgPlayer();
                }
                // Sposta il boss lontano
                var fbDir = { x: Math.sign(G.boss.anchorX - nx), y: Math.sign(G.boss.anchorY - ny) };
                if (fbDir.x === 0 && fbDir.y === 0) fbDir = { x: -1, y: 0 };
                var fbTryDirs = [fbDir, { x: fbDir.x, y: 0 }, { x: 0, y: fbDir.y }, { x: -fbDir.x, y: 0 }, { x: 0, y: -fbDir.y }];
                for (var fbdi = 0; fbdi < fbTryDirs.length; fbdi++) {
                    var fbnx = G.boss.anchorX + fbTryDirs[fbdi].x * 2, fbny = G.boss.anchorY + fbTryDirs[fbdi].y * 2;
                    if (fbnx >= 0 && fbnx + 1 < z.c && fbny >= 0 && fbny + 1 < z.r) {
                        var fbCells = [{ x: fbnx, y: fbny }, { x: fbnx + 1, y: fbny }, { x: fbnx, y: fbny + 1 }, { x: fbnx + 1, y: fbny + 1 }];
                        var fbOvlp = false;
                        for (var fbci = 0; fbci < fbCells.length; fbci++) {
                            if (G.snake.some(function(s) { return s.x === fbCells[fbci].x && s.y === fbCells[fbci].y; })) { fbOvlp = true; break; }
                        }
                        if (!fbOvlp) { G.boss.anchorX = fbnx; G.boss.anchorY = fbny; break; }
                    }
                }
                if (fx && fx.onShake) fx.onShake(4);
                return;
            }
        }
    }

    if (!ate || (G.maxSegments && G.snake.length > G.maxSegments)) G.snake.pop();
    // Cap lunghezza serpente: se ha superato il massimo, taglia la coda
    var effectiveMaxLen = G.maxSegments || SNAKE_MAX_LEN;
    while (G.snake.length > effectiveMaxLen) G.snake.pop();
    if (G.slurp && G.snake.length < Math.min(effectiveMaxLen, z.c * z.r * 0.7)) {
        G.slurpTick++;
        if (G.slurpTick >= 15) { G.slurpTick = 0; if (G.snake.length < effectiveMaxLen) { var t = G.snake[G.snake.length - 1]; G.snake.push({ x: t.x, y: t.y }); } }
    }
    if (z.rg > 0) {
        G.regenTick = (G.regenTick || 0) + 1;
        if (G.regenTick >= z.rg && G.obstacles.length + G.pendingObs.length < z.mx) {
            G.regenTick = 0;
            var ow = z.ow || [70, 20, 10], roll = Math.random() * 100, cum = 0, oType = "normal";
            for (var oi = 0; oi < ow.length; oi++) { cum += ow[oi]; if (roll <= cum) { oType = ["normal", "fragile", "explosive"][oi]; break; } }
            spawnPendingObs(G, z, oType);
        }
    }
    if (G.pendingObs) {
        for (var pi = G.pendingObs.length - 1; pi >= 0; pi--) {
            G.pendingObs[pi].timer--;
            if (G.pendingObs[pi].timer <= 0) {
                var po = G.pendingObs[pi];
                var stillSafe = !G.snake.some(function (s) { return s.x === po.x && s.y === po.y; }) &&
                    Math.abs(G.snake[0].x - po.x) + Math.abs(G.snake[0].y - po.y) >= 3 &&
                    !G.foods.some(function (f) { return f.x === po.x && f.y === po.y; }) &&
                    !G.obstacles.some(function (o) { return o.x === po.x && o.y === po.y; }) &&
                    !G.enemies.some(function (e) { return e.x === po.x && e.y === po.y; });
                if (stillSafe) G.obstacles.push({ x: po.x, y: po.y, type: po.type });
                G.pendingObs.splice(pi, 1);
            }
        }
    }
    // Enemy respawn system
    if (!G.boss || G.boss.defeated) {
        var zr = CZ(G);
        var targetPatrol = zr.patr || 0;
        var targetHunter = zr.hunt || 0;
        var currentPatrol = G.enemies.filter(function(e) { return e.type === "patrol"; }).length;
        var currentHunter = G.enemies.filter(function(e) { return e.type === "hunter"; }).length;
        if (!G._enemyRespawnTick) G._enemyRespawnTick = 0;
        G._enemyRespawnTick++;
        if (G._enemyRespawnTick >= 30) {
            G._enemyRespawnTick = 0;
            if (currentPatrol < targetPatrol) { spawnEn(G, zr, "patrol"); }
            if (currentHunter < targetHunter) { spawnEn(G, zr, "hunter"); }
        }
    }
    // ===== SECRET BUFF TICKS =====
    // Cuore dell'Antico: heal every 5 apples
    if (G.cuoreAntico && ate) {
        G.cuoreAnticoMeals = (G.cuoreAnticoMeals || 0) + 1;
        var maxHp = Math.max(1, 4 + (G.hpMaxMod || 0));
        if (G.cuoreAnticoMeals >= 5 && G.hp < maxHp) {
            G.cuoreAnticoMeals = 0;
            G.hp++;
            if (fx && fx.addF) fx.addF(nx, ny, "+1 ANTICO", "#c084fc");
        }
    }
    // Pelle Muta: drop tail as trap every 8 ticks
    if (G.pelleMuta && !G.isSpawning && G.snake.length > 4) {
        G.pelleMutaTick = (G.pelleMutaTick || 0) + 1;
        if (G.pelleMutaTick >= 8) {
            G.pelleMutaTick = 0;
            var dropSeg = G.snake.pop();
            if (!G.traps) G.traps = [];
            G.traps.push({ x: dropSeg.x, y: dropSeg.y, life: 20, active: true });
            if (fx && fx.addF) fx.addF(dropSeg.x, dropSeg.y, "MUTA!", "#a3e635");
        }
    }
    // Ombra Lunga: leave shadow trail
    if (G.ombraLunga && G.snake.length > 1 && !G.isSpawning) {
        var tailSeg = G.snake[G.snake.length - 1];
        G.ombraTrail = G.ombraTrail || [];
        G.ombraTrail.push({ x: tailSeg.x, y: tailSeg.y, life: 3 });
        // Check if enemies touch shadow
        for (var oi2 = G.ombraTrail.length - 1; oi2 >= 0; oi2--) {
            G.ombraTrail[oi2].life--;
            if (G.ombraTrail[oi2].life <= 0) { G.ombraTrail.splice(oi2, 1); continue; }
            for (var ei2 = 0; ei2 < G.enemies.length; ei2++) {
                if (G.enemies[ei2].x === G.ombraTrail[oi2].x && G.enemies[ei2].y === G.ombraTrail[oi2].y) {
                    G.enemies[ei2].slowTicks = 8;
                }
            }
        }
    }
    // Fame Eterna: damage nearby enemies on apple eat
    if (G.fameEterna && ate) {
        for (var fei = G.enemies.length - 1; fei >= 0; fei--) {
            var feDist = Math.abs(G.enemies[fei].x - nx) + Math.abs(G.enemies[fei].y - ny);
            if (feDist <= 3) {
                G.enemies.splice(fei, 1);
                G.score += 2;
                if (fx && fx.spawnEP) fx.spawnEP(G.enemies.length > fei ? nx : nx, ny, "#ef4444");
                if (fx && fx.addF) fx.addF(nx, ny, "FAME!", "#ef4444");
            }
        }
    }
    // Sguardo Vuoto: handled in moveEnemies (patrol alert distance = 0)
    // Crack spawn attempt
    if (!G.crack && !G.isSpawning && (!G.boss || G.boss.defeated)) {
        trySpawnCrack(G, z);
    }
    if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
}

/* ===== rAF ACCUMULATOR TICK SYSTEM ===== */
var _lastFrameTime = 0;
var _tickAccumulator = 0;
var _tickInterval = 195;

function scheduleLoop(resetAcc) {
    clearInterval(loop);
    var interval = 195 * (G.arrow ? G.arrowSpd : G.spd);
    if (G.stonks && !G.arrow) {
        var stonksMult = Math.pow(0.998, G.stonksMeals);
        interval *= Math.max(0.3, stonksMult);
    }
    var newInterval = Math.max(55, interval);
    // Se resetAcc è false (es. chiamata da stonks durante il gioco),
    // non azzerare l'accumulatore per evitare lo stop/pausa
    if (resetAcc !== false) {
        // Reset accumulator to prevent tick burst after resume
        _tickAccumulator = 0;
        _lastFrameTime = performance.now();
    } else if (newInterval !== _tickInterval) {
        // Se l'intervallo è cambiato ma non azzeriamo l'accumulatore,
        // ridimensioniamo l'accumulatore per mantenere la proporzione
        if (_tickInterval > 0) {
            _tickAccumulator = Math.floor(_tickAccumulator * (newInterval / _tickInterval));
        }
    }
    _tickInterval = newInterval;
}

function processTicks(timestamp) {
    if (!running || paused) {
        _lastFrameTime = timestamp;
        return;
    }
    var dt = timestamp - _lastFrameTime;
    _lastFrameTime = timestamp;
    // Cap dt to prevent huge jumps (e.g., tab was hidden)
    if (dt > 500) dt = 16;
    _tickAccumulator += dt;
    // Process at most 3 ticks per frame to prevent death spirals
    var maxTicks = 3;
    while (_tickAccumulator >= _tickInterval && maxTicks > 0) {
        tick(G, CZ(G), fx);
        _tickAccumulator -= _tickInterval;
        maxTicks--;
        if (!running || paused) {
            _tickAccumulator = 0;
            break;
        }
    }
    // Discard excess accumulator to prevent catch-up storms
    if (_tickAccumulator > _tickInterval * 2) {
        _tickAccumulator = _tickInterval;
    }
}
