/* ===== NEMICI & SPAWN ===== */

function getEZ(G) {
    var w = G.endlessCycle, sz = Math.min(40, 30 + Math.floor(w / 2));
    var totalObs = 18 + w * 2 + 10 + w + 8 + Math.floor(w * 0.8);
    return { name: "IL VUOTO ABISSALE", tgt: 80, c: sz, r: sz, obs: 18 + w * 2, frag: 10 + w, expl: 8 + Math.floor(w * 0.8), patr: 4 + Math.floor(w / 2), hunt: 2 + Math.floor(w / 3), ui: "#f87171", bg: "#040204", head: "#f87171", obsC: "rgba(127,29,29,.35)", bdr: "rgba(248,113,113,.2)", rg: Math.max(12, 22 - w * 2), mx: Math.floor(totalObs * 1.5), ow: [Math.max(30, 45 - w * 2), Math.min(35, 27 + w), Math.min(35, 28 + w)] };
}

function CZ(G) { return G.zoneIndex < ZONES.length ? ZONES[G.zoneIndex] : getEZ(G); }

function getEC(G, z) {
    var cx = Math.floor(z.c / 2), cy = Math.floor(z.r / 2);
    for (var t = 0; t < 600; t++) {
        var p = { x: Math.floor(Math.random() * z.c), y: Math.floor(Math.random() * z.r) };
        if (G.snake.some(function (s) { return s.x === p.x && s.y === p.y; })) continue;
        if (G.foods.some(function (f) { return f.x === p.x && f.y === p.y; })) continue;
        if (G.obstacles.some(function (o) { return o.x === p.x && o.y === p.y; })) continue;
        if (G.enemies.some(function (e) { return e.x === p.x && e.y === p.y; })) continue;
        if (G.traps && G.traps.some(function (tr) { return tr.x === p.x && tr.y === p.y; })) continue;
        if (G.boss && bossCells(G.boss).some(function (bc) { return bc.x === p.x && bc.y === p.y; })) continue;
        if (Math.abs(p.x - cx) <= 2 && Math.abs(p.y - cy) <= 2) continue;
        var adj = [{x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1}];
        var openAdj = 0;
        for (var ai = 0; ai < adj.length; ai++) {
            if (adj[ai].x >= 0 && adj[ai].x < z.c && adj[ai].y >= 0 && adj[ai].y < z.r &&
                !G.obstacles.some(function(o){return o.x===adj[ai].x&&o.y===adj[ai].y;})) {
                openAdj++;
            }
        }
        if (openAdj < 2) continue;
        return p;
    }
    return null;
}

function getECSafe(G, z) {
    var hd = G.snake[0];
    var fwdCells = [];
    for (var fi = 1; fi <= 4; fi++) {
        fwdCells.push({ x: hd.x + G.dir.x * fi, y: hd.y + G.dir.y * fi });
    }
    var lateralOffset = { x: G.dir.y, y: -G.dir.x };
    for (var li = 1; li <= 3; li++) {
        fwdCells.push({ x: hd.x + G.dir.x * li + lateralOffset.x, y: hd.y + G.dir.y * li + lateralOffset.y });
        fwdCells.push({ x: hd.x + G.dir.x * li - lateralOffset.x, y: hd.y + G.dir.y * li - lateralOffset.y });
    }
    for (var t = 0; t < 600; t++) {
        var p = { x: Math.floor(Math.random() * z.c), y: Math.floor(Math.random() * z.r) };
        if (G.snake.some(function (s) { return s.x === p.x && s.y === p.y; })) continue;
        if (G.foods.some(function (f) { return f.x === p.x && f.y === p.y; })) continue;
        if (G.obstacles.some(function (o) { return o.x === p.x && o.y === p.y; })) continue;
        if (G.enemies.some(function (e) { return e.x === p.x && e.y === p.y; })) continue;
        if (G.traps && G.traps.some(function (tr) { return tr.x === p.x && tr.y === p.y; })) continue;
        if (G.pendingObs && G.pendingObs.some(function (po) { return po.x === p.x && po.y === p.y; })) continue;
        if (G.boss && bossCells(G.boss).some(function (bc) { return bc.x === p.x && bc.y === p.y; })) continue;
        if (Math.abs(p.x - hd.x) + Math.abs(p.y - hd.y) <= 5) continue;
        if (fwdCells.some(function (fc) { return fc.x === p.x && fc.y === p.y; })) continue;
        var adj2 = [{x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1}];
        var openAdj2 = 0;
        for (var ai2 = 0; ai2 < adj2.length; ai2++) {
            if (adj2[ai2].x >= 0 && adj2[ai2].x < z.c && adj2[ai2].y >= 0 && adj2[ai2].y < z.r &&
                !G.obstacles.some(function(o){return o.x===adj2[ai2].x&&o.y===adj2[ai2].y;})) {
                openAdj2++;
            }
        }
        if (openAdj2 < 2) continue;
        return p;
    }
    return getEC(G, z);
}

function spawnPendingObs(G, z, type) {
    if (z.rg <= 0) return;
    if (G.obstacles.length + G.pendingObs.length >= z.mx) return;
    var c = getECSafe(G, z);
    if (!c) return;
    discover("me_pending");
    G.pendingObs.push({ x: c.x, y: c.y, type: type, timer: 15 });
}

function spawnFood(G, z) {
    if (!G.nyan) return getEC(G, z);
    for (var t = 0; t < 20; t++) {
        var c = getEC(G, z);
        if (!c) return null;
        if (G.snake.length < 1) continue;
        var h = G.snake[0];
        if (Math.abs(c.x - h.x) + Math.abs(c.y - h.y) <= 2) return c;
    }
    return getEC(G, z);
}

function spawnObs(G, z, n, type) {
    for (var i = 0; i < n; i++) {
        var c = getEC(G, z);
        if (c) {
            discover("obs_" + type);
            G.obstacles.push({ x: c.x, y: c.y, type: type || "normal" });
        }
    }
}

function spawnEn(G, z, type) {
    var c = getECSafe(G, z);
    if (!c) return;
    discover("en_" + type);
    var dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
    G.enemies.push({ x: c.x, y: c.y, dir: dirs[Math.floor(Math.random() * 4)], type: type, mt: Math.floor(Math.random() * (type === "patrol" ? 2 : 3)), mi: type === "patrol" ? 2 : 3, state: type === "patrol" ? "patrol" : "stalk", stateTimer: 0, chargeDir: null });
}

function bounceEn(en, G, z) {
    if (en.type !== "patrol") return;
    var laterals = [{ x: en.dir.y, y: -en.dir.x }, { x: -en.dir.y, y: en.dir.x }];
    for (var p = 0; p < laterals.length; p++) {
        var px = en.x + laterals[p].x, py = en.y + laterals[p].y;
        if (px >= 0 && px < z.c && py >= 0 && py < z.r && !G.obstacles.some(function (o) { return o.x === px && o.y === py; }) && !G.enemies.some(function (o) { return o !== en && o.x === px && o.y === py; })) {
            en.dir = laterals[p]; return;
        }
    }
    en.dir = { x: -en.dir.x, y: -en.dir.y };
}

function getBestDirection(en, target, G, z) {
    var sx = en.x, sy = en.y, tx = target.x, ty = target.y;
    if (sx === tx && sy === ty) return en.dir;
    var visited = {};
    var queue = [{ x: sx, y: sy, fd: null }];
    visited[sx + "," + sy] = true;
    while (queue.length > 0) {
        var curr = queue.shift();
        var dirs = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
        for (var i = 0; i < dirs.length; i++) {
            var nx = curr.x + dirs[i].x, ny = curr.y + dirs[i].y;
            var key = nx + "," + ny;
            if (nx === tx && ny === ty) {
                if (curr.fd === null) return dirs[i];
                return curr.fd;
            }
            if (nx < 0 || nx >= z.c || ny < 0 || ny >= z.r) continue;
            if (visited[key]) continue;
            if (G.obstacles.some(function(o){ return o.x === nx && o.y === ny; })) continue;
            if (G.enemies.some(function(o){ return o !== en && o.x === nx && o.y === ny; })) continue;
            visited[key] = true;
            queue.push({ x: nx, y: ny, fd: curr.fd || dirs[i] });
        }
    }
    return en.dir;
}

function moveEnemies(G, z, fx) {
    for (var ei = 0; ei < G.enemies.length; ei++) {
        var en = G.enemies[ei];
        var mi = en.mi;
        if (G.sabbia) {
            var hd = G.snake[0];
            if (Math.abs(en.x - hd.x) + Math.abs(en.y - hd.y) <= 3) mi *= 1.6;
        }
        en.mt++;
        if (en.mt < mi) continue;
        en.mt = 0;
        if (en.slowTicks > 0) { en.slowTicks--; continue; }
        var nx = en.x, ny = en.y;
        if (en.type === "patrol") {
            if (!en.state) en.state = "patrol";
            if (typeof en.stateTimer !== "number") en.stateTimer = 0;
            var hd2 = G.snake[0];
            var distH = Math.abs(en.x - hd2.x) + Math.abs(en.y - hd2.y);
            var alertDist = G.sguardoVuoto ? 0 : (G.piuma ? 2 : 3);
            if (en.state === "patrol" && distH <= alertDist) { en.state = "alert"; en.stateTimer = 0; }
            if (en.state === "alert" && distH > 5) { en.state = "returning"; en.stateTimer = 3; }
            if (en.state === "returning") {
                en.stateTimer--;
                if (en.stateTimer <= 0) { en.state = "patrol"; en.stateTimer = 0; }
                continue;
            }
            if (en.state === "alert") {
                en.stateTimer++;
                if (en.stateTimer % 2 === 0) {
                    var adx = Math.sign(hd2.x - en.x), ady = Math.sign(hd2.y - en.y);
                    var ahx = en.x + adx, ahy = en.y + ady;
                    var aBlk = (ahx < 0 || ahx >= z.c || ahy < 0 || ahy >= z.r || G.obstacles.some(function(o){return o.x===ahx&&o.y===ahy;}) || G.enemies.some(function(o){return o!==en&&o.x===ahx&&o.y===ahy;}));
                    if (!aBlk) { nx = ahx; ny = ahy; en.dir = { x: adx, y: ady }; }
                    else { nx = en.x + en.dir.x; ny = en.y + en.dir.y; }
                } else {
                    nx = en.x + en.dir.x; ny = en.y + en.dir.y;
                }
            } else {
                nx = en.x + en.dir.x; ny = en.y + en.dir.y;
            }
            var pnx = nx, pny = ny;
            var isBlk = (pnx < 0 || pnx >= z.c || pny < 0 || pny >= z.r || G.obstacles.some(function(o){return o.x===pnx&&o.y===pny;}) || G.enemies.some(function(o){return o!==en&&o.x===pnx&&o.y===pny;}));
            if (isBlk) {
                var laterals = [{ x: en.dir.y, y: -en.dir.x }, { x: -en.dir.y, y: en.dir.x }];
                var foundPath = false;
                for (var l = 0; l < laterals.length; l++) {
                    var lx = en.x + laterals[l].x, ly = en.y + laterals[l].y;
                    if (lx >= 0 && lx < z.c && ly >= 0 && ly < z.r && !G.obstacles.some(function(o){return o.x===lx&&o.y===ly;}) && !G.enemies.some(function(o){return o!==en&&o.x===lx&&o.y===ly;})) {
                        en.dir = laterals[l]; foundPath = true; break;
                    }
                }
                if (!foundPath) en.dir = { x: -en.dir.x, y: -en.dir.y };
                nx = en.x + en.dir.x; ny = en.y + en.dir.y;
            }
        } else {
            if (!en.state) en.state = "stalk";
            if (typeof en.stateTimer !== "number") en.stateTimer = 0;
            var hh2 = G.snake[0];
            var hDist2 = Math.abs(en.x - hh2.x) + Math.abs(en.y - hh2.y);
            if (en.state === "exhaust") {
                en.stateTimer--;
                if (en.stateTimer <= 0) { en.state = "stalk"; en.stateTimer = 0; }
                continue;
            }
            if (en.state === "stalk") {
                en.stateTimer++;
                if (en.stateTimer % 2 === 0 && hDist2 > 2) {
                    var smartDir = getBestDirection(en, hh2, G, z);
                    var shx = en.x + smartDir.x, shy = en.y + smartDir.y;
                    var isBlocked = (shx < 0 || shx >= z.c || shy < 0 || shy >= z.r || G.obstacles.some(function(o){return o.x===shx&&o.y===shy;}) || G.enemies.some(function(o){return o!==en&&o.x===shx&&o.y===shy;}) || G.snake.some(function(s){return s.x===shx&&s.y===shy;}));
                    if (!isBlocked) { nx = shx; ny = shy; en.dir = smartDir; }
                }
                var chargeDist = en.stateTimer >= (G.sguardoVuoto ? 6 : 12) ? (G.sguardoVuoto ? 12 : 8) : (G.sguardoVuoto ? 7 : 5);
                if (hDist2 <= chargeDist && en.stateTimer > (G.sguardoVuoto ? 2 : 4)) {
                    en.state = "charge"; en.stateTimer = 0;
                    en.chargeDir = getBestDirection(en, hh2, G, z);
                }
            } else if (en.state === "charge") {
                en.stateTimer++;
                en.dir = en.chargeDir;
                nx = en.x + en.chargeDir.x; ny = en.y + en.chargeDir.y;
                if (en.stateTimer >= 3) { en.state = "exhaust"; en.stateTimer = 3; }
            }
        }
        if (G.portal) {
            if (nx < 0) nx = z.c - 1; if (nx >= z.c) nx = 0;
            if (ny < 0) ny = z.r - 1; if (ny >= z.r) ny = 0;
        } else if (nx < 0 || nx >= z.c || ny < 0 || ny >= z.r) { bounceEn(en, G, z); continue; }
        if (G.traps) {
            var ti = -1;
            for (var tt = 0; tt < G.traps.length; tt++) { if (G.traps[tt].active && G.traps[tt].x === nx && G.traps[tt].y === ny) { ti = tt; break; } }
            if (ti >= 0) {
                G.traps.splice(ti, 1);
                if (fx && fx.spawnEP) fx.spawnEP(en.x, en.y, "#a3e635");
                if (fx && fx.addF) fx.addF(en.x, en.y, "TRAPPOLA!", "#a3e635");
                G.score += 2;
                if (fx && fx.sTrap) fx.sTrap();
                bounceEn(en, G, z); continue;
            }
        }
        var hO = null;
        for (var oi = 0; oi < G.obstacles.length; oi++) { if (G.obstacles[oi].x === nx && G.obstacles[oi].y === ny) { hO = G.obstacles[oi]; break; } }
        if (hO) {
            if (hO.type === "fragile") {
                G.obstacles = G.obstacles.filter(function (o) { return o !== hO; });
                if (fx && fx.spawnDP) fx.spawnDP(nx, ny);
                if (fx && fx.sFrag) fx.sFrag();
            } else if (hO.type === "explosive") {
                G.obstacles = G.obstacles.filter(function (o) { return o !== hO; });
                explodeAt(G, z, nx, ny, 0, fx);
                if (G.snake.some(function (s) { return Math.abs(s.x - nx) + Math.abs(s.y - ny) <= 2; }) && !G.isSpawning)
    takeDamage(G, z, null, fx, "Esplosione");
            }
            bounceEn(en, G, z); continue;
        }
        var hasOther = false;
        for (var oe = 0; oe < G.enemies.length; oe++) { if (G.enemies[oe] !== en && G.enemies[oe].x === nx && G.enemies[oe].y === ny) { hasOther = true; break; } }
        if (hasOther) { bounceEn(en, G, z); continue; }
        var si = -1;
        for (var ss = 0; ss < G.snake.length; ss++) { if (G.snake[ss].x === nx && G.snake[ss].y === ny) { si = ss; break; } }
        if (si >= 0) {
            if (si === 0) { 
                if (G.unoReverse) {
                    G.enemies = G.enemies.filter(function (e) { return e !== en; });
                    var rPts = G.snake.length;
                    G.score += rPts;
                    var rT = G.snake[G.snake.length - 1];
                    G.snake.push({ x: rT.x, y: rT.y });
                    G.snake.push({ x: rT.x, y: rT.y });
                    if (fx && fx.spawnEP) fx.spawnEP(en.x, en.y, "#fbbf24");
                    if (fx && fx.addF) fx.addF(en.x, en.y, "REVERSE +" + rPts, "#fbbf24");
                    G.unoReverse = false;
                    if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
                } else if (G.invincible > 0) {
                    bounceEn(en, G, z); continue;
                } else if (!G.isSpawning) { 
                    if (en.isBossGuard && G.boss && !G.boss.defeated) {
                        if (!G.foods.some(function(f) { return f.x === nx && f.y === ny; })) {
                            G.foods.push({ x: nx, y: ny, type: G.boss.collectType });
                            if (fx && fx.addF) fx.addF(nx, ny, (G.boss.collectName || "GUARDIA") + "!", (G.boss.collectColor || "#fbbf24"));
                        }
                    }
                    G.enemies = G.enemies.filter(function (e) { return e !== en; });
                    var segLoss = 2;
                    while (G.snake.length > mL(G) && segLoss > 0) { G.snake.pop(); segLoss--; }
                    if (fx && fx.spawnEP) fx.spawnEP(nx, ny, "#a855f7");
                    if (fx && fx.addF) fx.addF(nx, ny, "-2 segmenti", "#f87171");
                    if (fx && fx.onScreenFlash) fx.onScreenFlash(4, "rgba(248,113,113,.15)");
                    if (fx && fx.sHit) fx.sHit();
                    if (fx && fx.onShake) fx.onShake(4);
                    if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
                }
            }
            else {
                if (!G.isSpawning && G.invincible <= 0) {
                    if (en.isBossGuard && G.boss && !G.boss.defeated) {
                        if (!G.foods.some(function(f) { return f.x === nx && f.y === ny; })) {
                            G.foods.push({ x: nx, y: ny, type: G.boss.collectType });
                            if (fx && fx.addF) fx.addF(nx, ny, (G.boss.collectName || "GUARDIA") + "!", (G.boss.collectColor || "#fbbf24"));
                        }
                    }
                    G.enemies = G.enemies.filter(function (e) { return e !== en; });
                    var segLoss2 = 2;
                    while (G.snake.length > mL(G) && segLoss2 > 0) { G.snake.pop(); segLoss2--; }
                    if (fx && fx.spawnDP) fx.spawnDP(nx, ny);
                    if (fx && fx.addF) fx.addF(nx, ny, "-2 segmenti", "#f87171");
                    if (fx && fx.onScreenFlash) fx.onScreenFlash(4, "rgba(248,113,113,.15)");
                    if (fx && fx.sHit) fx.sHit();
                    if (fx && fx.onUpdateHUD) fx.onUpdateHUD();
                } else {
                    bounceEn(en, G, z);
                }
            }
            continue;
        }
        en.x = nx; en.y = ny;
    }
}

function explodeAt(G, z, x, y, depth, fx) {
    if (depth > 5) return;
    if (fx && fx.sBoom) fx.sBoom();
    if (fx && fx.spawnXP) fx.spawnXP(x, y);
    var R = 2, chain = [];
    G.obstacles = G.obstacles.filter(function (o) {
        var d = Math.abs(o.x - x) + Math.abs(o.y - y);
        if (d > 0 && d <= R) {
            if (o.type === "explosive") chain.push({ x: o.x, y: o.y });
            if (fx && fx.spawnDP) fx.spawnDP(o.x, o.y);
            if (z && z.rg > 0 && Math.random() < 0.3 && G.obstacles.length + G.pendingObs.length < z.mx) {
                var adjC = [{ x: o.x + 1, y: o.y }, { x: o.x - 1, y: o.y }, { x: o.x, y: o.y + 1 }, { x: o.x, y: o.y - 1 }];
                var pick = adjC[Math.floor(Math.random() * adjC.length)];
                if (pick.x >= 0 && pick.x < z.c && pick.y >= 0 && pick.y < z.r && !G.pendingObs.some(function (po) { return po.x === pick.x && po.y === pick.y; }))
                    G.pendingObs.push({ x: pick.x, y: pick.y, type: o.type, timer: 15 });
            }
            return false;
        }
        return true;
    });
    G.enemies = G.enemies.filter(function (e) {
        var d = Math.abs(e.x - x) + Math.abs(e.y - y);
        if (d <= R) {
            if (fx && fx.spawnEP) fx.spawnEP(e.x, e.y, "#a855f7");
            if (fx && fx.addF) fx.addF(e.x, e.y, "+3", "#fbbf24");
            G.score += 3;
            return false;
        }
        return true;
    });
    for (var i = 0; i < chain.length; i++) explodeAt(G, z, chain[i].x, chain[i].y, depth + 1, fx);
    if (fx && fx.onScreenFlash) fx.onScreenFlash(6, "rgba(255,100,0,.2)");
    if (fx && fx.onShake) fx.onShake(4 + depth * 3);
}

function triggerSpawn(G, z, len) {
    var sx = Math.min(Math.floor(z.c / 2), z.c - 3);
    var sy = Math.min(Math.floor(z.r / 2), z.r - 3);
    var dirs = [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 0, y: -1 }];
    var best = dirs[0], bestS = 0;
    for (var d = 0; d < dirs.length; d++) {
        var sp = 0;
        for (var i = 1; i <= len + 2; i++) {
            var cx = sx + dirs[d].x * i, cy = sy + dirs[d].y * i;
            if (cx < 0 || cx >= z.c || cy < 0 || cy >= z.r) break;
            if (G.obstacles.some(function (o) { return o.x === cx && o.y === cy; })) break;
            if (G.enemies.some(function (e) { return e.x === cx && e.y === cy; })) break;
            sp++;
        }
        if (sp > bestS) { bestS = sp; best = dirs[d]; }
    }
    // Verify first 3 cells in spawn direction are safe
    var safeSpawn = true;
    for (var si = 1; si <= 3; si++) {
        var scx = sx + best.x * si, scy = sy + best.y * si;
        if (scx < 0 || scx >= z.c || scy < 0 || scy >= z.r) { safeSpawn = false; break; }
        if (G.obstacles.some(function (o) { return o.x === scx && o.y === scy; })) { safeSpawn = false; break; }
        if (G.enemies.some(function (e) { return e.x === scx && e.y === scy; })) { safeSpawn = false; break; }
    }
    if (!safeSpawn) {
        for (var d2 = 0; d2 < dirs.length; d2++) {
            var ok = true;
            for (var si2 = 1; si2 <= 3; si2++) {
                var cx2 = sx + dirs[d2].x * si2, cy2 = sy + dirs[d2].y * si2;
                if (cx2 < 0 || cx2 >= z.c || cy2 < 0 || cy2 >= z.r) { ok = false; break; }
                if (G.obstacles.some(function (o) { return o.x === cx2 && o.y === cy2; })) { ok = false; break; }
                if (G.enemies.some(function (e) { return e.x === cx2 && e.y === cy2; })) { ok = false; break; }
            }
            if (ok) { best = dirs[d2]; break; }
        }
    }
    // Place snake fully formed (no spawning animation)
    G.snake = [];
    for (var i = 0; i < len; i++) {
        G.snake.push({ x: sx - best.x * i, y: sy - best.y * i });
    }
    G.dir = best;
    G.inputBuffer = [];
    G.isSpawning = false;
    G.spawnLeft = 0;
}

function spawnEP(x, y, col) { for (var i = 0; i < 14; i++) { var a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 4; particles.push({ x: x * CS + HC, y: y * CS + 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 25 + Math.random() * 20, ml: 45, size: 2 + Math.random() * 3, color: col }); } }
function spawnDP(x, y) { for (var i = 0; i < 10; i++) { var a = Math.random() * Math.PI * 2, sp = 1.5 + Math.random() * 3; particles.push({ x: x * CS + 10, y: y * CS + 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 20 + Math.random() * 15, ml: 35, size: 2 + Math.random() * 2.5, color: "#888" }); } }
function spawnXP(x, y) { for (var i = 0; i < 20; i++) { var a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 5; particles.push({ x: x * CS + 10, y: y * CS + 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 20 + Math.random() * 15, ml: 35, size: 3 + Math.random() * 4, color: Math.random() > 0.5 ? "#f97316" : "#ef4444" }); } }
function addF(x, y, t, c) {
    var px = x * CS + 10, py = y * CS + 10;
    // Conta quanti float esistono già vicino a questa posizione per impilarli verticalmente
    var stackCount = 0;
    for (var fi = 0; fi < floats.length; fi++) {
        if (Math.abs(floats[fi].x - px) < 25 && Math.abs(floats[fi].y - py) < 25 && floats[fi].life > 10) {
            stackCount++;
        }
    }
    // Ogni float successivo parte più in alto rispetto ai precedenti
    py -= stackCount * 16;
    floats.push({ x: px, y: py, text: t, color: c || "#fff", life: 50, ml: 50 });
}
function initAmb() { ambients = []; for (var i = 0; i < 18; i++) ambients.push({ x: Math.random() * C.width, y: Math.random() * C.height, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25, size: Math.random() * 1.8 + 0.5, alpha: Math.random() * 0.2 + 0.05 }); }
