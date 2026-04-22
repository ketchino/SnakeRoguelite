/* ===== RENDERING CANVAS ===== */

if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, radii) {
        var r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 0);
        r = Math.min(r, w / 2, h / 2);
        this.moveTo(x + r, y); this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r); this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h); this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r); this.lineTo(x + r, y + r);
        this.quadraticCurveTo(x, y, x + r, y); this.closePath(); return this;
    };
}

function draw() {
    var now = performance.now(), dt = (now - lastTime) / 1000; lastTime = now;
    if (running && !paused) {
        if (G.linkCD > 0) { G.linkCD -= dt * 1000; if (G.linkCD <= 0) { G.linkCD = 0; G.linkShield = true; } }
        if (G.kunaiCDMS > 0) { G.kunaiCDMS -= dt * 1000; if (G.kunaiCDMS < 0) G.kunaiCDMS = 0; }
        if (G.frammentovuoto && G.frammentoCD > 0) { G.frammentoCD -= dt * 1000; if (G.frammentoCD < 0) G.frammentoCD = 0; }
    }
    if (!running && mState === "slots") return;
    if (typeof G.zoneIndex !== "number") return;
    var z = CZ(G), hc = hRGB(z.head);
    if (shakeI > 0.3) { shakeX = (Math.random() - 0.5) * shakeI; shakeY = (Math.random() - 0.5) * shakeI; shakeI *= 0.82; }
    else { shakeX = 0; shakeY = 0; shakeI = 0; }
    ctx.save(); ctx.translate(shakeX, shakeY);
    ctx.fillStyle = z.bg; ctx.fillRect(-5, -5, C.width + 10, C.height + 10);
    var grad = ctx.createRadialGradient(C.width / 2, C.height / 2, 0, C.width / 2, C.height / 2, C.width * 0.6);
    grad.addColorStop(0, h2r(z.ui, 0.03)); grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad; ctx.fillRect(0, 0, C.width, C.height);
    var gA = 0.03 + gridPulse * 0.1; ctx.strokeStyle = h2r(z.ui, gA); ctx.lineWidth = 0.5;
    for (var i = 0; i <= z.c; i++) { ctx.beginPath(); ctx.moveTo(i * CS, 0); ctx.lineTo(i * CS, z.r * CS); ctx.stroke(); }
    for (var i = 0; i <= z.r; i++) { ctx.beginPath(); ctx.moveTo(0, i * CS); ctx.lineTo(z.c * CS, i * CS); ctx.stroke(); }
    gridPulse *= 0.9;
    ambients.forEach(function (p) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = C.width; if (p.x > C.width) p.x = 0;
        if (p.y < 0) p.y = C.height; if (p.y > C.height) p.y = 0;
        ctx.globalAlpha = p.alpha; ctx.fillStyle = z.ui; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }); ctx.globalAlpha = 1;
    if (G.pendingObs) G.pendingObs.forEach(function (po) {
        var px = po.x * CS, py = po.y * CS;
        var progress = 1 - (po.timer / 15);
        var alpha = 0.08 + progress * 0.22;
        var pulse = Math.sin(now / 200) * 0.3 + 0.7;
        if (po.type === "fragile") {
            ctx.strokeStyle = h2r(z.ui, alpha * pulse); ctx.lineWidth = 1; ctx.setLineDash([2, 2]);
            ctx.strokeRect(px + 5, py + 5, CS - 10, CS - 10); ctx.setLineDash([]);
        } else if (po.type === "explosive") {
            ctx.fillStyle = "rgba(220,38,38," + (alpha * pulse * 0.6) + ")";
            ctx.beginPath(); ctx.arc(px + CS / 2, py + CS / 2, 2 + progress * 3, 0, Math.PI * 2); ctx.fill();
        } else {
            ctx.fillStyle = "rgba(136,136,136," + (alpha * pulse) + ")";
            ctx.beginPath(); ctx.arc(px + CS / 2, py + CS / 2, 3 + progress * 4, 0, Math.PI * 2); ctx.fill();
        }
    });
    if (G.traps) G.traps.forEach(function (t) {
        if (t.active) {
            ctx.fillStyle = "rgba(163,230,53,.2)"; ctx.fillRect(t.x * CS + 3, t.y * CS + 3, CS - 6, CS - 6);
            ctx.strokeStyle = "rgba(163,230,53,.5)"; ctx.lineWidth = 1; ctx.strokeRect(t.x * CS + 3, t.y * CS + 3, CS - 6, CS - 6);
        } else {
            ctx.fillStyle = "rgba(163,230,53,.06)"; ctx.fillRect(t.x * CS + 3, t.y * CS + 3, CS - 6, CS - 6);
            ctx.strokeStyle = "rgba(163,230,53,.15)"; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.strokeRect(t.x * CS + 3, t.y * CS + 3, CS - 6, CS - 6); ctx.setLineDash([]);
        }
    });
    G.obstacles.forEach(function (o) {
        var ox = o.x * CS, oy = o.y * CS;
        if (o.type === "normal") {
            ctx.fillStyle = z.obsC; ctx.beginPath(); ctx.roundRect(ox + 2, oy + 2, CS - 4, CS - 4, 4); ctx.fill();
            ctx.strokeStyle = "rgba(255,255,255,.08)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(ox + 6, oy + 6); ctx.lineTo(ox + CS - 6, oy + CS - 6); ctx.moveTo(ox + CS - 6, oy + 6); ctx.lineTo(ox + 6, oy + CS - 6); ctx.stroke();
        } else if (o.type === "fragile") {
            ctx.fillStyle = h2r(z.ui, 0.06); ctx.fillRect(ox + 2, oy + 2, CS - 4, CS - 4);
            ctx.strokeStyle = h2r(z.ui, 0.3); ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.strokeRect(ox + 3, oy + 3, CS - 6, CS - 6); ctx.setLineDash([]);
        } else {
            ctx.fillStyle = "rgba(220,38,38,.18)"; ctx.beginPath(); ctx.roundRect(ox + 2, oy + 2, CS - 4, CS - 4, 4); ctx.fill();
            ctx.strokeStyle = "rgba(220,38,38,.4)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(ox + 2, oy + 2, CS - 4, CS - 4, 4); ctx.stroke();
            var p = Math.sin(now / 200) * 0.2 + 0.8;
            ctx.fillStyle = "rgba(255,120,0," + (0.35 * p) + ")"; ctx.beginPath(); ctx.arc(ox + 10, oy + 10, 4 * p, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "rgba(255,200,0," + (0.5 * p) + ")"; ctx.beginPath(); ctx.arc(ox + 10, oy + 10, 2 * p, 0, Math.PI * 2); ctx.fill();
        }
    });
    G.enemies.forEach(function (en) {
        var ex = en.x * CS, ey = en.y * CS;
        if (en.type === "patrol") {
            var isAlert = en.state === "alert", isRet = en.state === "returning";
            var bA = isRet ? 0.2 : (isAlert ? 0.55 : 0.4);
            var brA = isRet ? 0.3 : (isAlert ? 0.75 : 0.6);
            var pCol = isAlert ? "200,120,255" : "168,85,247";
            ctx.fillStyle = "rgba(" + pCol + "," + bA + ")"; ctx.beginPath(); ctx.roundRect(ex + 2, ey + 2, CS - 4, CS - 4, 4); ctx.fill();
            ctx.strokeStyle = "rgba(" + pCol + "," + brA + ")"; ctx.lineWidth = isAlert ? 1.5 : 1; ctx.beginPath(); ctx.roundRect(ex + 2, ey + 2, CS - 4, CS - 4, 4); ctx.stroke();
            ctx.fillStyle = "rgba(" + pCol + "," + (isRet ? 0.4 : 0.9) + ")"; ctx.beginPath(); ctx.arc(ex + HC + en.dir.x * 3, ey + 10 + en.dir.y * 3, 2.5, 0, Math.PI * 2); ctx.fill();
            if (isAlert) { ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "bold 10px sans-serif"; ctx.textAlign = "center"; ctx.fillText("!", ex + 10, ey - 2); }
            if (en.slowTicks > 0) { ctx.strokeStyle = "rgba(163,230,53,.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ex + 10, ey + 10, 12, 0, Math.PI * 2); ctx.stroke(); }
        } else {
            var isCharge = en.state === "charge", isExhaust = en.state === "exhaust";
            var hh = G.snake[0], ddx = Math.sign(hh.x - en.x), ddy = Math.sign(hh.y - en.y);
            var hA = isExhaust ? 0.15 : (isCharge ? 0.55 : 0.35);
            ctx.fillStyle = "rgba(239,68,68," + hA + ")"; ctx.beginPath(); ctx.roundRect(ex + 3, ey + 3, CS - 6, CS - 6, 3); ctx.fill();
            ctx.strokeStyle = "rgba(239,68,68," + (isExhaust ? 0.25 : (isCharge ? 0.8 : 0.55)) + ")"; ctx.lineWidth = isCharge ? 2 : 1; ctx.beginPath(); ctx.roundRect(ex + 3, ey + 3, CS - 6, CS - 6, 3); ctx.stroke();
            if (!isExhaust) {
                ctx.fillStyle = "rgba(239,68,68,.08)"; ctx.fillRect(ex + 4 + -ddx * CS, ey + 5, CS * 2, CS - 10);
                ctx.fillStyle = isCharge ? "rgba(255,255,255,.95)" : "rgba(255,255,255,.8)";
                ctx.beginPath(); ctx.arc(ex + 7 + ddx * 2, ey + 9, 1.8, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(ex + 13 + ddx * 2, ey + 9, 1.8, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#111";
                ctx.beginPath(); ctx.arc(ex + 7 + ddx * 3, ey + 9, 1, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(ex + 13 + ddx * 3, ey + 9, 1, 0, Math.PI * 2); ctx.fill();
            }
            if (isCharge) {
                ctx.save(); ctx.shadowColor = "#ef4444"; ctx.shadowBlur = 10;
                ctx.strokeStyle = "rgba(255,100,100,.5)"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(ex + 10, ey + HC, 13, 0, Math.PI * 2); ctx.stroke();
                ctx.restore();
            }
            if (en.slowTicks > 0) { ctx.strokeStyle = "rgba(163,230,53,.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ex + 10, ey + 10, 12, 0, Math.PI * 2); ctx.stroke(); }
        }
    });
    // Boss rendering
    if (G.boss && !G.boss.defeated) {
        var bossDefR = null;
        for (var bdri = 0; bdri < BOSS_DB.length; bdri++) { if (BOSS_DB[bdri].id === G.boss.id) { bossDefR = BOSS_DB[bdri]; break; } }
        if (bossDefR) {
            var bx = G.boss.anchorX * CS, by = G.boss.anchorY * CS;
            var bPulse = Math.sin(now / 250) * 0.12 + 0.88;
            var bCol = bossDefR.color;
            var bRgb = hRGB(bCol);
            // Glow
            ctx.save(); ctx.shadowColor = bCol; ctx.shadowBlur = 20 * bPulse;
            ctx.fillStyle = "rgba(" + bRgb.r + "," + bRgb.g + "," + bRgb.b + ",0.25)"; ctx.beginPath(); ctx.roundRect(bx + 2, by + 2, CS * 2 - 4, CS * 2 - 4, 8); ctx.fill();
            ctx.restore();
            // Body
            ctx.fillStyle = "rgba(" + bRgb.r + "," + bRgb.g + "," + bRgb.b + ",0.45)"; ctx.beginPath(); ctx.roundRect(bx + 3, by + 3, CS * 2 - 6, CS * 2 - 6, 7); ctx.fill();
            ctx.strokeStyle = "rgba(" + bRgb.r + "," + bRgb.g + "," + bRgb.b + ",0.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(bx + 3, by + 3, CS * 2 - 6, CS * 2 - 6, 7); ctx.stroke();
            // Boss-specific drawing
            var bcx = bx + CS, bcy = by + CS + 4;
            ctx.save();
            ctx.fillStyle = bCol;
            ctx.strokeStyle = bCol;
            ctx.lineWidth = 1.5;
            var bid = G.boss.id;
            if (bid === "corvo") {
                // Crow body
                ctx.beginPath(); ctx.ellipse(bcx, bcy + 2, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
                // Head
                ctx.beginPath(); ctx.arc(bcx, bcy - 7, 5.5, 0, Math.PI * 2); ctx.fill();
                // Beak
                ctx.beginPath(); ctx.moveTo(bcx + 5, bcy - 8); ctx.lineTo(bcx + 11, bcy - 6); ctx.lineTo(bcx + 5, bcy - 5); ctx.closePath(); ctx.fill();
                // Wings
                ctx.beginPath(); ctx.moveTo(bcx - 8, bcy); ctx.quadraticCurveTo(bcx - 18, bcy - 8, bcx - 14, bcy + 5); ctx.lineTo(bcx - 6, bcy + 3); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(bcx + 8, bcy); ctx.quadraticCurveTo(bcx + 18, bcy - 8, bcx + 14, bcy + 5); ctx.lineTo(bcx + 6, bcy + 3); ctx.closePath(); ctx.fill();
            } else if (bid === "lupo") {
                // Wolf silhouette - dark purple with glowing eyes
                ctx.fillStyle = "#4c1d95";
                // Body
                ctx.beginPath(); ctx.ellipse(bcx, bcy + 2, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
                // Head
                ctx.beginPath(); ctx.ellipse(bcx, bcy - 6, 7, 6, 0, 0, Math.PI * 2); ctx.fill();
                // Ears
                ctx.beginPath(); ctx.moveTo(bcx - 5, bcy - 10); ctx.lineTo(bcx - 8, bcy - 18); ctx.lineTo(bcx - 1, bcy - 10); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(bcx + 5, bcy - 10); ctx.lineTo(bcx + 8, bcy - 18); ctx.lineTo(bcx + 1, bcy - 10); ctx.closePath(); ctx.fill();
                // Glowing eyes
                ctx.fillStyle = "#a78bfa";
                ctx.beginPath(); ctx.arc(bcx - 3, bcy - 7, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(bcx + 3, bcy - 7, 2, 0, Math.PI * 2); ctx.fill();
                // Shadow trail at old position
                if (G.boss.shadowPos && G.boss.shadowLife > 0) {
                    var sx = G.boss.shadowPos.x * CS, sy = G.boss.shadowPos.y * CS;
                    var sAlpha = G.boss.shadowLife * 0.15;
                    ctx.globalAlpha = sAlpha;
                    ctx.fillStyle = "#818cf8";
                    ctx.beginPath(); ctx.roundRect(sx + 3, sy + 3, CS * 2 - 6, CS * 2 - 6, 7); ctx.fill();
                    ctx.globalAlpha = 1;
                }
            } else if (bid === "rospo") {
                // Frog - green body, big eyes, sitting pose
                // Body (wider, squatter)
                ctx.beginPath(); ctx.ellipse(bcx, bcy + 4, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
                // Head
                ctx.beginPath(); ctx.ellipse(bcx, bcy - 4, 10, 7, 0, 0, Math.PI * 2); ctx.fill();
                // Big eyes (bulging)
                ctx.fillStyle = "#fff";
                ctx.beginPath(); ctx.arc(bcx - 5, bcy - 8, 4, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(bcx + 5, bcy - 8, 4, 0, Math.PI * 2); ctx.fill();
                // Pupils
                ctx.fillStyle = "#111";
                ctx.beginPath(); ctx.arc(bcx - 5, bcy - 8, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(bcx + 5, bcy - 8, 2, 0, Math.PI * 2); ctx.fill();
                // Legs (folded)
                ctx.fillStyle = "#65a30d";
                ctx.beginPath(); ctx.ellipse(bcx - 12, bcy + 8, 5, 3, -0.3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(bcx + 12, bcy + 8, 5, 3, 0.3, 0, Math.PI * 2); ctx.fill();
            } else if (bid === "tiranno") {
                // Golden figure with crown - regal
                // Body
                ctx.fillStyle = "#92400e";
                ctx.beginPath(); ctx.roundRect(bcx - 8, bcy - 4, 16, 14, 3); ctx.fill();
                // Head
                ctx.beginPath(); ctx.arc(bcx, bcy - 8, 6, 0, Math.PI * 2); ctx.fill();
                // Crown (golden)
                ctx.fillStyle = "#fbbf24";
                ctx.beginPath();
                ctx.moveTo(bcx - 7, bcy - 12);
                ctx.lineTo(bcx - 5, bcy - 18);
                ctx.lineTo(bcx - 2, bcy - 14);
                ctx.lineTo(bcx, bcy - 20);
                ctx.lineTo(bcx + 2, bcy - 14);
                ctx.lineTo(bcx + 5, bcy - 18);
                ctx.lineTo(bcx + 7, bcy - 12);
                ctx.closePath(); ctx.fill();
                // Crown jewels
                ctx.fillStyle = "#ef4444";
                ctx.beginPath(); ctx.arc(bcx, bcy - 16, 1.5, 0, Math.PI * 2); ctx.fill();
                // Scepter
                ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(bcx + 8, bcy); ctx.lineTo(bcx + 14, bcy - 8); ctx.stroke();
            } else if (bid === "draga") {
                // Dragon - Phase 1: red/orange, Phase 2: blue/ice
                var isPhase2 = G.boss.phase >= 2;
                var dragCol = isPhase2 ? "#60a5fa" : "#ef4444";
                var dragCol2 = isPhase2 ? "#3b82f6" : "#dc2626";
                ctx.fillStyle = dragCol;
                // Body
                ctx.beginPath(); ctx.ellipse(bcx, bcy + 2, 11, 8, 0, 0, Math.PI * 2); ctx.fill();
                // Head
                ctx.fillStyle = dragCol2;
                ctx.beginPath(); ctx.arc(bcx, bcy - 7, 6, 0, Math.PI * 2); ctx.fill();
                // Horns
                ctx.fillStyle = isPhase2 ? "#93c5fd" : "#fca5a5";
                ctx.beginPath(); ctx.moveTo(bcx - 4, bcy - 11); ctx.lineTo(bcx - 7, bcy - 19); ctx.lineTo(bcx - 1, bcy - 11); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(bcx + 4, bcy - 11); ctx.lineTo(bcx + 7, bcy - 19); ctx.lineTo(bcx + 1, bcy - 11); ctx.closePath(); ctx.fill();
                // Eyes
                ctx.fillStyle = isPhase2 ? "#fff" : "#fbbf24";
                ctx.beginPath(); ctx.arc(bcx - 3, bcy - 8, 1.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(bcx + 3, bcy - 8, 1.5, 0, Math.PI * 2); ctx.fill();
                // Wings
                ctx.fillStyle = isPhase2 ? "rgba(96,165,250,.5)" : "rgba(239,68,68,.5)";
                ctx.beginPath(); ctx.moveTo(bcx - 8, bcy); ctx.quadraticCurveTo(bcx - 20, bcy - 12, bcx - 14, bcy + 6); ctx.lineTo(bcx - 6, bcy + 3); ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(bcx + 8, bcy); ctx.quadraticCurveTo(bcx + 20, bcy - 12, bcx + 14, bcy + 6); ctx.lineTo(bcx + 6, bcy + 3); ctx.closePath(); ctx.fill();
                // Phase indicator text
                if (isPhase2) {
                    ctx.fillStyle = "#60a5fa"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
                    ctx.fillText("❄️", bcx, by - 2);
                }
            } else if (bid === "vuoto") {
                // Cosmic entity - purple with orbiting particles
                // Body (ethereal)
                ctx.globalAlpha = 0.7;
                ctx.beginPath(); ctx.ellipse(bcx, bcy, 12, 12, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 1;
                // Inner void
                ctx.fillStyle = "#1e1b4b";
                ctx.beginPath(); ctx.arc(bcx, bcy, 6, 0, Math.PI * 2); ctx.fill();
                // Orbiting particles
                for (var opi = 0; opi < 4; opi++) {
                    var opa = now / 500 + opi * Math.PI / 2;
                    var opr = 14;
                    ctx.fillStyle = "#e9d5ff";
                    ctx.beginPath(); ctx.arc(bcx + Math.cos(opa) * opr, bcy + Math.sin(opa) * opr, 2, 0, Math.PI * 2); ctx.fill();
                }
                // Eye in the void
                ctx.fillStyle = "#c084fc";
                ctx.beginPath(); ctx.ellipse(bcx, bcy, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#fff";
                ctx.beginPath(); ctx.arc(bcx, bcy, 1.5, 0, Math.PI * 2); ctx.fill();
                // Phase 2 indicator
                if (G.boss.phase >= 2) {
                    ctx.fillStyle = "#c084fc"; ctx.font = "bold 9px sans-serif"; ctx.textAlign = "center";
                    ctx.fillText("🌀", bcx, by - 2);
                }
            } else if (bid === "primordiale") {
                // Giant snake - Phase 1: calm red, Phase 2: aggressive, Phase 3: berserk
                var pPhase = G.boss.phase;
                var primCol = pPhase === 3 ? "#dc2626" : pPhase === 2 ? "#ef4444" : "#f87171";
                // Body (coiled)
                ctx.fillStyle = primCol;
                ctx.beginPath(); ctx.ellipse(bcx, bcy + 2, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
                // Head (snake-like)
                ctx.beginPath(); ctx.ellipse(bcx, bcy - 6, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
                // Eyes
                ctx.fillStyle = pPhase === 3 ? "#fbbf24" : "#fff";
                ctx.beginPath(); ctx.arc(bcx - 3, bcy - 8, 2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(bcx + 3, bcy - 8, 2, 0, Math.PI * 2); ctx.fill();
                // Slit pupils
                ctx.fillStyle = "#111";
                ctx.beginPath(); ctx.ellipse(bcx - 3, bcy - 8, 0.8, 1.5, 0, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.ellipse(bcx + 3, bcy - 8, 0.8, 1.5, 0, 0, Math.PI * 2); ctx.fill();
                // Tongue
                ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(bcx, bcy - 3);
                ctx.lineTo(bcx, bcy + 1); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(bcx, bcy + 1);
                ctx.lineTo(bcx - 2, bcy + 3); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(bcx, bcy + 1);
                ctx.lineTo(bcx + 2, bcy + 3); ctx.stroke();
                // Phase indicators
                if (pPhase >= 2) {
                    ctx.fillStyle = "#fbbf24"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center";
                    ctx.fillText(pPhase === 3 ? "💀" : "⚡", bcx, by - 2);
                }
            }
            ctx.restore();
            // Boss-specific VFX after restore
            if (bid === "rospo" && G.boss.tongueCells && G.boss.tongueCells.length > 0) {
                // Draw red tongue from boss to target cells
                var tBcx = bx + CS, tBcy = by + CS;
                ctx.save();
                ctx.strokeStyle = "#ef4444";
                ctx.lineWidth = 4;
                ctx.lineCap = "round";
                ctx.shadowColor = "#ef4444";
                ctx.shadowBlur = 6;
                var lastTc = G.boss.tongueCells[G.boss.tongueCells.length - 1];
                ctx.beginPath();
                ctx.moveTo(tBcx, tBcy);
                ctx.lineTo(lastTc.x * CS + HC, lastTc.y * CS + HC);
                ctx.stroke();
                // Tongue tip (forked)
                ctx.lineWidth = 2;
                var tipX = lastTc.x * CS + HC, tipY = lastTc.y * CS + HC;
                var tdx = lastTc.x - G.boss.anchorX, tdy = lastTc.y - G.boss.anchorY;
                var perpX = -tdy * 3, perpY = tdx * 3;
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX + tdx * 4 + perpX, tipY + tdy * 4 + perpY);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(tipX, tipY);
                ctx.lineTo(tipX + tdx * 4 - perpX, tipY + tdy * 4 - perpY);
                ctx.stroke();
                // Tongue cells glow red
                G.boss.tongueCells.forEach(function(tc) {
                    ctx.fillStyle = "rgba(239,68,68,0.35)";
                    ctx.beginPath(); ctx.roundRect(tc.x * CS + 3, tc.y * CS + 3, CS - 6, CS - 6, 4); ctx.fill();
                });
                ctx.restore();
            }
            // ===== BOSS ATTACK CELLS VFX =====
            if (G.boss.attackCells && G.boss.attackCells.length > 0) {
                G.boss.attackCells.forEach(function(ac) {
                    var acX = ac.x * CS, acY = ac.y * CS;
                    var acPulse = Math.sin(now / 100) * 0.2 + 0.8;
                    var isWarning = ac.fadein > 0;
                    var maxFadein = 4; // Max fadein ticks for normalization
                    var warningProgress = isWarning ? (1 - ac.fadein / maxFadein) : 1;
                    var warningAlpha = isWarning ? 0.15 + 0.55 * warningProgress : 0.7;
                    var fadeOutAlpha = Math.min(1, ac.life / 3);

                    ctx.save();
                    if (ac.type === "fire") {
                        // Fire: orange-red flickering cells
                        ctx.shadowColor = "#f97316"; ctx.shadowBlur = isWarning ? 8 : 18;
                        ctx.fillStyle = isWarning ?
                            "rgba(249,115,22," + (warningAlpha * acPulse) + ")" :
                            "rgba(239,68,68," + (0.6 * fadeOutAlpha * acPulse) + ")";
                        ctx.beginPath(); ctx.roundRect(acX + 2, acY + 2, CS - 4, CS - 4, 4); ctx.fill();
                        if (!isWarning) {
                            // Fire particles
                            ctx.fillStyle = "rgba(251,191,36," + (0.5 * fadeOutAlpha) + ")";
                            ctx.beginPath(); ctx.arc(acX + HC, acY + HC - 3, 4 * acPulse, 0, Math.PI * 2); ctx.fill();
                        }
                    } else if (ac.type === "ice") {
                        // Ice: blue crystalline cells
                        ctx.shadowColor = "#60a5fa"; ctx.shadowBlur = isWarning ? 6 : 14;
                        ctx.fillStyle = isWarning ?
                            "rgba(96,165,250," + (warningAlpha * acPulse) + ")" :
                            "rgba(147,197,253," + (0.6 * fadeOutAlpha * acPulse) + ")";
                        ctx.beginPath(); ctx.roundRect(acX + 2, acY + 2, CS - 4, CS - 4, 3); ctx.fill();
                        // Crystal cross pattern
                        if (!isWarning) {
                            ctx.strokeStyle = "rgba(219,234,254," + (0.5 * fadeOutAlpha) + ")";
                            ctx.lineWidth = 1.5;
                            ctx.beginPath(); ctx.moveTo(acX + HC, acY + 4); ctx.lineTo(acX + HC, acY + CS - 4); ctx.stroke();
                            ctx.beginPath(); ctx.moveTo(acX + 4, acY + HC); ctx.lineTo(acX + CS - 4, acY + HC); ctx.stroke();
                        }
                    } else if (ac.type === "void") {
                        // Void: purple swirling portal cells
                        ctx.shadowColor = "#c084fc"; ctx.shadowBlur = isWarning ? 10 : 16;
                        var voidAlpha = isWarning ? warningAlpha : 0.6 * fadeOutAlpha;
                        ctx.fillStyle = "rgba(192,132,252," + (voidAlpha * acPulse) + ")";
                        ctx.beginPath(); ctx.arc(acX + HC, acY + HC, CS / 2 - 2, 0, Math.PI * 2); ctx.fill();
                        // Swirl effect
                        if (!isWarning) {
                            for (var vi = 0; vi < 3; vi++) {
                                var va = now / 200 + vi * Math.PI * 2 / 3;
                                var vr = 5 * acPulse;
                                ctx.fillStyle = "rgba(233,213,255," + (0.4 * fadeOutAlpha) + ")";
                                ctx.beginPath(); ctx.arc(acX + HC + Math.cos(va) * vr, acY + HC + Math.sin(va) * vr, 2, 0, Math.PI * 2); ctx.fill();
                            }
                        }
                    } else if (ac.type === "claw") {
                        // Shadow claw: dark purple slash marks
                        ctx.shadowColor = "#818cf8"; ctx.shadowBlur = isWarning ? 6 : 14;
                        ctx.fillStyle = isWarning ?
                            "rgba(129,140,248," + (warningAlpha * acPulse) + ")" :
                            "rgba(79,70,229," + (0.6 * fadeOutAlpha * acPulse) + ")";
                        ctx.beginPath(); ctx.roundRect(acX + 1, acY + 1, CS - 2, CS - 2, 3); ctx.fill();
                        // Slash lines
                        ctx.strokeStyle = "rgba(196,181,253," + (0.6 * fadeOutAlpha) + ")";
                        ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(acX + 4, acY + 4); ctx.lineTo(acX + CS - 4, acY + CS - 4); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(acX + CS - 4, acY + 4); ctx.lineTo(acX + 4, acY + CS - 4); ctx.stroke();
                    } else if (ac.type === "shockwave") {
                        // Golden shockwave: expanding golden ring
                        ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = isWarning ? 8 : 16;
                        ctx.fillStyle = isWarning ?
                            "rgba(251,191,36," + (warningAlpha * acPulse) + ")" :
                            "rgba(245,158,11," + (0.5 * fadeOutAlpha * acPulse) + ")";
                        ctx.beginPath(); ctx.roundRect(acX + 2, acY + 2, CS - 4, CS - 4, 4); ctx.fill();
                        // Ring indicator
                        if (!isWarning) {
                            ctx.strokeStyle = "rgba(253,230,138," + (0.5 * fadeOutAlpha) + ")";
                            ctx.lineWidth = 2;
                            ctx.beginPath(); ctx.arc(acX + HC, acY + HC, 6 * acPulse, 0, Math.PI * 2); ctx.stroke();
                        }
                    } else if (ac.type === "ring") {
                        // Poison ring: red expanding ring
                        ctx.shadowColor = ac.color || "#f87171"; ctx.shadowBlur = isWarning ? 6 : 14;
                        ctx.fillStyle = isWarning ?
                            "rgba(248,113,113," + (warningAlpha * acPulse) + ")" :
                            "rgba(220,38,38," + (0.5 * fadeOutAlpha * acPulse) + ")";
                        ctx.beginPath(); ctx.roundRect(acX + 2, acY + 2, CS - 4, CS - 4, 4); ctx.fill();
                    } else if (ac.type === "dive") {
                        // Dive attack: teal streaks
                        ctx.shadowColor = ac.color || "#5eead4"; ctx.shadowBlur = isWarning ? 6 : 14;
                        ctx.fillStyle = isWarning ?
                            "rgba(94,234,212," + (warningAlpha * acPulse) + ")" :
                            "rgba(20,184,166," + (0.5 * fadeOutAlpha * acPulse) + ")";
                        ctx.beginPath(); ctx.roundRect(acX + 3, acY + 3, CS - 6, CS - 6, 4); ctx.fill();
                        // Streak lines
                        if (!isWarning) {
                            ctx.strokeStyle = "rgba(153,246,228," + (0.5 * fadeOutAlpha) + ")";
                            ctx.lineWidth = 1.5;
                            ctx.beginPath(); ctx.moveTo(acX + HC, acY + 2); ctx.lineTo(acX + HC, acY + CS - 2); ctx.stroke();
                        }
                    } else {
                        // Generic attack cell
                        ctx.shadowColor = ac.color || "#f87171"; ctx.shadowBlur = isWarning ? 6 : 12;
                        ctx.fillStyle = isWarning ?
                            "rgba(248,113,113," + (warningAlpha * acPulse) + ")" :
                            "rgba(248,113,113," + (0.5 * fadeOutAlpha * acPulse) + ")";
                        ctx.beginPath(); ctx.roundRect(acX + 2, acY + 2, CS - 4, CS - 4, 4); ctx.fill();
                    }
                    ctx.restore();
                });
            }
            // Collectible counter indicator
            if (G.boss.goldenCollected > 0) {
                var ccColor = G.boss.collectColor || "#fbbf24";
                ctx.fillStyle = ccColor; ctx.font = "bold 11px 'Chakra Petch',sans-serif";
                ctx.fillText(G.boss.goldenCollected + "/" + bossDefR.goldenToDamage, bx + CS, by - 6);
            }
        }
    }
    // ===== CRACK DRAWING =====
    if (G.crack && !G.isSpawning) {
        var crkX = G.crack.x * CS, crkY = G.crack.y * CS;
        var crkPulse = Math.sin(now / 300) * 0.3 + 0.7;
        ctx.save();
        ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 15 * crkPulse;
        ctx.fillStyle = "rgba(251,191,36," + (0.4 * crkPulse) + ")";
        ctx.beginPath(); ctx.roundRect(crkX + 2, crkY + 2, CS - 4, CS - 4, 4); ctx.fill();
        ctx.restore();
        // Crack lines
        ctx.strokeStyle = "rgba(251,191,36," + (0.8 * crkPulse) + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(crkX + CS * 0.3, crkY + CS * 0.2);
        ctx.lineTo(crkX + CS * 0.5, crkY + CS * 0.5);
        ctx.lineTo(crkX + CS * 0.7, crkY + CS * 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(crkX + CS * 0.5, crkY + CS * 0.5);
        ctx.lineTo(crkX + CS * 0.8, crkY + CS * 0.4);
        ctx.stroke();
        // Sparkle particles
        for (var csi = 0; csi < 3; csi++) {
            var csa = now / 400 + csi * Math.PI * 2 / 3;
            var csr = 8 * crkPulse;
            ctx.fillStyle = "rgba(251,191,36," + (0.6 * crkPulse) + ")";
            ctx.beginPath(); ctx.arc(crkX + HC + Math.cos(csa) * csr, crkY + HC + Math.sin(csa) * csr, 1.5, 0, Math.PI * 2); ctx.fill();
        }
    }
    // ===== OMBRA LUNGA SHADOW TRAIL =====
    if (G.ombraTrail && G.ombraTrail.length > 0) {
        G.ombraTrail.forEach(function(sh) {
            var sAlpha = Math.min(0.35, sh.life * 0.12);
            ctx.fillStyle = "rgba(139,92,246," + sAlpha + ")";
            ctx.beginPath(); ctx.roundRect(sh.x * CS + 3, sh.y * CS + 3, CS - 6, CS - 6, 4); ctx.fill();
        });
    }
    var pulse = Math.sin(now / 180) * 0.15 + 0.85;
    G.foods.forEach(function (f) {
        if (!f) return;
        var ffx = f.x * CS + HC, ffy = f.y * CS + HC;
        var bossCollectTypes = ["golden", "shadow", "fly", "coin", "crystal", "cosmic", "essence"];
        if (bossCollectTypes.indexOf(f.type) !== -1) {
            var cType = f.type;
            var cColor = "#fbbf24", cInner = "#fef08a", cGlow = 18;
            if (cType === "shadow") { cColor = "#818cf8"; cInner = "#c4b5fd"; cGlow = 14; }
            else if (cType === "fly") { cColor = "#84cc16"; cInner = "#d9f99d"; cGlow = 12; }
            else if (cType === "coin") { cColor = "#f59e0b"; cInner = "#fde68a"; cGlow = 16; }
            else if (cType === "crystal") { cColor = "#f97316"; cInner = "#fed7aa"; cGlow = 20; }
            else if (cType === "cosmic") { cColor = "#a855f7"; cInner = "#e9d5ff"; cGlow = 16; }
            else if (cType === "essence") { cColor = "#fb7185"; cInner = "#fecdd3"; cGlow = 18; }
            var gPulse = Math.sin(now / 120) * 0.2 + 0.8;
            ctx.save(); ctx.shadowColor = cColor; ctx.shadowBlur = cGlow * gPulse;
            ctx.fillStyle = cColor; ctx.beginPath(); ctx.arc(ffx, ffy, 9 * gPulse, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            ctx.fillStyle = cInner; ctx.beginPath(); ctx.arc(ffx, ffy, 5 * gPulse, 0, Math.PI * 2); ctx.fill();
            // Sparkle
            var sp = now / 100;
            for (var si = 0; si < 4; si++) {
                var sa = sp + si * Math.PI / 2;
                ctx.fillStyle = cColor.replace(")", "," + (0.5 * gPulse) + ")").replace("rgb", "rgba").replace("##", "#");
                var sparkAlpha = 0.5 * gPulse;
                ctx.fillStyle = "rgba(255,255,255," + (sparkAlpha * 0.6) + ")";
                ctx.beginPath(); ctx.arc(ffx + Math.cos(sa) * 11 * gPulse, ffy + Math.sin(sa) * 11 * gPulse, 1.5, 0, Math.PI * 2); ctx.fill();
            }
        } else if (f.type === "poison") {
            var pPulse2 = Math.sin(now / 150) * 0.2 + 0.8;
            var pAlpha = f.life !== undefined ? Math.min(1, f.life / 4) : 1;
            // Fade-in: if poison has fadein counter, it's not yet active
            var isFadingIn = f.fadein !== undefined && f.fadein > 0;
            var fadeInAlpha = isFadingIn ? 0.3 * (1 - f.fadein / 3) : 1;
            var finalAlpha = pAlpha * fadeInAlpha;
            // Don't render if fully in fadein (invisible)
            if (finalAlpha > 0.02) {
                ctx.save(); ctx.shadowColor = "#a855f7"; ctx.shadowBlur = 14 * pPulse2 * fadeInAlpha;
                ctx.globalAlpha = finalAlpha;
                ctx.fillStyle = isFadingIn ? "#c084fc" : "#a855f7"; ctx.beginPath(); ctx.arc(ffx, ffy, (isFadingIn ? 5 : 7) * pPulse2, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
                ctx.globalAlpha = finalAlpha;
                ctx.fillStyle = "#e9d5ff"; ctx.beginPath(); ctx.arc(ffx, ffy, (isFadingIn ? 2 : 3) * pPulse2, 0, Math.PI * 2); ctx.fill();
                // Skull indicator (only when active)
                if (!isFadingIn) {
                    ctx.fillStyle = "rgba(168,85,247," + (0.7 * pPulse2) + ")"; ctx.font = "8px sans-serif"; ctx.textAlign = "center";
                    ctx.fillText("\u2620", ffx, ffy - 10 * pPulse2);
                }
                ctx.globalAlpha = 1;
            }
        } else {
            ctx.save(); ctx.shadowColor = "#ff4444"; ctx.shadowBlur = 14 * pulse;
            ctx.fillStyle = "#ff4444"; ctx.beginPath(); ctx.arc(ffx, ffy, 8 * pulse, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            ctx.strokeStyle = "#4ade80"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(ffx, ffy - 8 * pulse); ctx.lineTo(ffx + 2, ffy - 12 * pulse); ctx.stroke();
        }
    });
    if (G.snake && G.snake.length > 0) {
        var blink = G.invincible > 0 ? (Math.floor(now / 100) % 2 === 0) : (G.nokiaSlow > 0 ? Math.sin(now / 60) > 0.3 : true);
        for (var i = G.snake.length - 1; i >= 1; i--) {
            if (!blink) continue;
            var s = G.snake[i], t = i / Math.max(1, G.snake.length - 1), alpha = Math.max(0.15, 0.55 - t * 0.42);
            if (G.slurp && i > G.snake.length - 4) ctx.fillStyle = "rgba(96,165,250," + (alpha * 0.7) + ")";
            else ctx.fillStyle = "rgba(" + hc.r + "," + hc.g + "," + hc.b + "," + alpha + ")";
            ctx.beginPath(); ctx.roundRect(s.x * CS + 1, s.y * CS + 1, CS - 2, CS - 2, 4); ctx.fill();
        }
        if (blink) {
            var hd = G.snake[0];
            ctx.save(); ctx.shadowColor = z.head; ctx.shadowBlur = 12;
            ctx.fillStyle = z.head; ctx.beginPath(); ctx.roundRect(hd.x * CS + 1, hd.y * CS + 1, CS - 2, CS - 2, 5); ctx.fill();
            ctx.restore();
            var cx = hd.x * CS + 10, cy = hd.y * CS + 10, ox = G.dir.x * 3.5, oy = G.dir.y * 3.5;
            ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx + ox, cy + oy, 3, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(cx + ox + G.dir.x * 1.2, cy + oy + G.dir.y * 1.2, 1.5, 0, Math.PI * 2); ctx.fill();
            if (G.sonic) { ctx.strokeStyle = "rgba(96,165,250,.5)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.stroke(); }
            if (G.hulk) { ctx.strokeStyle = "rgba(163,230,53,.4)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.stroke(); }
            if (G.pirla) {
                var pP = Math.sin(now / 150) * 0.3 + 0.7;
                ctx.strokeStyle = "rgba(255,200,0," + (0.7 * pP) + ")"; ctx.lineWidth = 2.5; ctx.setLineDash([4, 3]);
                ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
                ctx.fillStyle = "rgba(255,200,0," + (0.9 * pP) + ")"; ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center"; ctx.fillText("\u21c4", cx, cy - 17);
            }
        }
    }
    while (particles.length > 200) particles.shift();
    for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        ctx.globalAlpha = Math.max(0, p.life / p.ml); ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life--;
        if (p.life <= 0) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    // Floating texts - impilati verticalmente alla creazione, fluiscono verso l'alto
    for (var i = floats.length - 1; i >= 0; i--) {
        var f = floats[i], prog = 1 - f.life / f.ml;
        ctx.globalAlpha = Math.max(0, 1 - prog * 1.2); ctx.fillStyle = f.color;
        ctx.font = "bold 11px 'Chakra Petch',sans-serif"; ctx.textAlign = "center";
        ctx.fillText(f.text, f.x, f.y - prog * 22); f.life--;
        if (f.life <= 0) floats.splice(i, 1);
    }
    ctx.globalAlpha = 1; ctx.restore();
    var vg = ctx.createRadialGradient(C.width / 2, C.height / 2, C.width * 0.25, C.width / 2, C.height / 2, C.width * 0.7);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(0,0,0,.35)");
    ctx.fillStyle = vg; ctx.fillRect(0, 0, C.width, C.height);
    if (screenFlash > 0) { ctx.fillStyle = flashClr; ctx.fillRect(0, 0, C.width, C.height); screenFlash--; }

    if (relicDelay > 0) {
        relicDelay -= dt * 1000;
        ctx.save();
        ctx.globalAlpha = Math.min(1, relicDelay / 300);
        ctx.fillStyle = "#fff"; ctx.font = "900 80px 'Chakra Petch',sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,.6)"; ctx.shadowBlur = 20;
        ctx.fillText("\u25B6", C.width / 2, C.height / 2);
        ctx.restore();
        if (relicDelay <= 0) { paused = false; scheduleLoop(); }
    }
    if (cdTimer > 0) {
        cdTimer -= dt;
        var num = Math.ceil(cdTimer), a = cdTimer > 0.5 ? 1 : cdTimer * 2;
        ctx.save(); ctx.globalAlpha = a;
        ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = "900 120px 'Chakra Petch',sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 24;
        ctx.fillText(num > 0 ? num.toString() : "\u25B6", C.width / 2, C.height / 2);
        ctx.restore();
        if (Math.ceil(cdTimer + dt) !== num && num > 0) sCD();
        if (cdTimer <= 0) {
            if (G.preZoneSpawn) { triggerSpawn(G, CZ(G), G.snake.length); G.preZoneSpawn = false; }
            sGo(); paused = false; scheduleLoop();
            if (codexFab) codexFab.style.display = "block";
        }
    }
}

requestAnimationFrame(function rl() { 
    draw(); 
    requestAnimationFrame(rl); 
});

window.addEventListener("resize", function () { if (running || mState === "paused" || mState === "dead") fitC(); });
resetRB();
try { showSlotMenu(); } catch(err) { console.error("Errore inizializzazione:", err); showOv(); }
