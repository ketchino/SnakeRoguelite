/* ===== FX BRIDGE ===== */
var fx = {
    spawnEP: spawnEP, spawnDP: spawnDP, spawnXP: spawnXP, addF: addF,
    sEat: sEat, sHit: sHit, sDie: sDie, sLink: sLink, sNokia: sNokia, sSonic: sSonic,
    sBossHit: sBossHit, sBossDeath: sBossDeath, sBossDmgPlayer: sBossDmgPlayer,
    sBoom: sBoom, sFrag: sFrag, sTrap: sTrap, sTurn: sTurn, sHulk: sHulk,
    onScreenFlash: function (n, col) { screenFlash = n; flashClr = col; },
    onShake: function (n) { shakeI = Math.max(shakeI, n); },
    onGridPulse: function () { gridPulse = 1; },
    onUpdateHUD: updateHUD, onUpdateZB: updateZB, onDead: showGameOver, onLevelUp: levelUp,
    onZoneComplete: function () { G.zoneFood = 0; save(); initZone(); },
    onBossStart: function (bossDef) {
        initBoss(G, CZ(G), bossDef, fx);
        // Riposiziona il serpente al centro per la boss fight (solo testa, si srotola)
        var bz = CZ(G);
        var sLen = Math.max(mL(G), G.snake.length);
        var sx = Math.floor(bz.c / 2), sy = Math.floor(bz.r / 2);
        G._targetSpawnLen = sLen;
        G.snake = [{ x: sx, y: sy }];
        G.inputBuffer = [];
        G.preZoneSpawn = true;
        updateHUD(); updateZB();
        var bossBar = document.getElementById("boss-bar");
        if (bossBar) bossBar.style.display = "";
        paused = true; clearInterval(loop);
        showBanner(bossDef.icon + " BOSS", bossDef.name, function () {
            setTimeout(function () { cdTimer = 3; }, 0);
        });
    },
    onBossDefeated: function () {
        if (sBossDeath) sBossDeath();
        var bossId = G.boss ? G.boss.id : null;
        if (bossId) {
            if (!G.bossDefeated) G.bossDefeated = [];
            if (G.bossDefeated.indexOf(bossId) === -1) G.bossDefeated.push(bossId);
        }
        // Award boss-specific relic: SOLO la prima volta che sconfiggi questo boss
        var relicId = getBossRelicId(bossId);
        var isFirstTime = bossId && G.bossDefeated.indexOf(bossId) !== -1 &&
            (!G.bossRelicsAwarded || G.bossRelicsAwarded.indexOf(bossId) === -1);
        if (relicId && isFirstTime) {
            // Prima sconfitta: dai la reliquia direttamente
            if (!G.bossRelicsAwarded) G.bossRelicsAwarded = [];
            G.bossRelicsAwarded.push(bossId);
            var bossRelic = RELICS.find(function(r) { return r.id === relicId; });
            if (bossRelic) {
                discover("rel_" + relicId);
                if (bossRelic.noStack && G.relics.indexOf(relicId) !== -1) {
                    bossRelic.fn(G);
                } else {
                    G.relics.push(relicId);
                    bossRelic.fn(G);
                }
                var d = document.createElement("div"); d.className = "relic-icon pop";
                var tip = document.createElement("div"); tip.className = "tip";
                var tipB = document.createElement("b"); tipB.className = rcClass(bossRelic.ra); tipB.textContent = bossRelic.name;
                var tipSpan = document.createElement("span"); tipSpan.style.color = "#888"; tipSpan.textContent = bossRelic.desc;
                tip.appendChild(tipB); tip.appendChild(document.createElement("br")); tip.appendChild(tipSpan);
                d.textContent = bossRelic.icon; d.appendChild(tip); RBAR.appendChild(d); renderedRC++;
            }
        }
        if (G.snake.length > 0) {
            addF(G.snake[0].x, G.snake[0].y, (G.boss.icon || "💀") + " SCONFITTO!", "#fbbf24");
            spawnEP(G.boss.anchorX, G.boss.anchorY, "#fbbf24");
            spawnEP(G.boss.anchorX + 1, G.boss.anchorY, "#fbbf24");
            spawnEP(G.boss.anchorX, G.boss.anchorY + 1, "#fbbf24");
            spawnEP(G.boss.anchorX + 1, G.boss.anchorY + 1, "#fbbf24");
        }
        shakeI = 15;
        G.boss = null;
        G.foods = [];
        // Advance zone
        if (G.zoneIndex < ZONES.length - 1) { G.zoneIndex++; } else { G.endlessCycle++; }
        G.zoneFood = 0;
        var bossBar = document.getElementById("boss-bar");
        if (bossBar) bossBar.style.display = "none";
        save();
        setTimeout(function () { initZone(); }, 600);
    },
    onSchedLoop: scheduleLoop,
    onDiscover: queueDiscovery,
    onCrackEnter: function() {
        paused = true; clearInterval(loop);
        if (codexFab) codexFab.style.display = "none";
        discover("shop_serpente");
        openSecretShop();
    },
};
