/* ===== SHOP SEGRETO ===== */
function trySpawnCrack(G, z) {
    if (G.zoneIndex === 0) return; // Mai in zona 1
    if (G.boss && !G.boss.defeated) return; // Mai durante boss fight
    if (G.crack) return; // Gia' presente
    if (G.zoneCrackUsed) return; // Solo una crepa per zona
    if (Math.random() > 0.03) return; // 3% probabilita' (era 8%)
    // Trova una cella al bordo mappa
    var borderCells = [];
    for (var x = 0; x < z.c; x++) {
        borderCells.push({ x: x, y: 0 });
        borderCells.push({ x: x, y: z.r - 1 });
    }
    for (var y = 1; y < z.r - 1; y++) {
        borderCells.push({ x: 0, y: y });
        borderCells.push({ x: z.c - 1, y: y });
    }
    // Mescola e trova una cella libera
    for (var i = borderCells.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = borderCells[i]; borderCells[i] = borderCells[j]; borderCells[j] = tmp;
    }
    for (var ci = 0; ci < borderCells.length; ci++) {
        var c = borderCells[ci];
        if (G.snake.some(function(s) { return s.x === c.x && s.y === c.y; })) continue;
        if (G.obstacles.some(function(o) { return o.x === c.x && o.y === c.y; })) continue;
        if (G.foods.some(function(f) { return f.x === c.x && f.y === c.y; })) continue;
        G.crack = { x: c.x, y: c.y };
        G.zoneCrackUsed = true; // Una sola crepa per zona
        discover("shop_crack");
        return;
    }
}

function canAffordBuff(G, buff) {
    // Il serpente deve avere più di 4 segmenti (il minimo che viene preservato)
    if (G.snake.length <= 4) return false;
    // HP: il costo riduce i cuori MASSIMI (come i patti del diavolo in Isaac)
    // Il nuovo max HP non deve scendere sotto 1
    var totalHpCost = buff.cost.hp;
    var newMaxHp = 4 + (G.hpMaxMod || 0) - totalHpCost;
    if (newMaxHp < 1) return false;
    return true;
}

function applySecretBuff(G, buff) {
    // Rimuovi segmenti
    var removeSeg = buff.cost.seg;
    while (G.snake.length > 4 && removeSeg > 0) { G.snake.pop(); removeSeg--; }
    // Rimuovi cuori MASSIMI (come i patti del diavolo in Isaac)
    G.hpMaxMod = (G.hpMaxMod || 0) - buff.cost.hp;
    var newMaxHp = 4 + (G.hpMaxMod || 0);
    if (newMaxHp < 1) { G.hpMaxMod = -3; newMaxHp = 1; } // Garantisce almeno 1 cuore massimo
    // Se il HP corrente supera il nuovo massimo, clampalo
    if (G.hp > newMaxHp) G.hp = newMaxHp;
    // Applica il buff
    buff.fn(G);
    // Registra nel codex
    discover("secret_" + buff.id);
}

var shopPicks = [];
var shopSnakeShake = 0;

function openSecretShop() {
    mState = "secretshop"; mIdx = 0;
    setMS(560, 480);

    // Pick 2 random buffs
    var pool = SECRET_BUFFS.filter(function(b) { return (G.secretBuffs || []).indexOf(b.id) === -1; });
    shopPicks = [];
    for (var i = 0; i < 2 && pool.length > 0; i++) {
        var idx = Math.floor(Math.random() * pool.length);
        shopPicks.push(pool.splice(idx, 1)[0]);
    }

    renderSecretShop();
    showOv();
}

function renderSecretShop() {
    OVC.textContent = "";

    // Title
    var h2 = document.createElement("h2");
    h2.style.cssText = "font-family:var(--fd);color:#c084fc;font-size:20px;letter-spacing:3px;margin-bottom:8px";
    h2.textContent = "🐍 L'ANTICO SERPENTE";
    OVC.appendChild(h2);

    // Dialog text
    var canAffordAny = shopPicks.some(function(b) { return canAffordBuff(G, b); });
    var dialogText = canAffordAny ? "Osssss... Scegli. Ma ogni dono ha il suo prezzo." : "Torna quando sarai piu'... sostanzioso.";
    var dialog = document.createElement("p");
    dialog.className = "sub";
    dialog.style.cssText = "color:#c084fc;margin-bottom:12px;font-style:italic";
    dialog.textContent = dialogText;
    OVC.appendChild(dialog);

    // Ancient Snake canvas drawing
    var snakeCanvas = document.createElement("canvas");
    snakeCanvas.width = 200; snakeCanvas.height = 100;
    snakeCanvas.style.cssText = "margin:8px auto 12px;display:block;";
    drawAncientSnake(snakeCanvas, canAffordAny);
    OVC.appendChild(snakeCanvas);

    // Buff choices
    if (shopPicks.length > 0) {
        var pickDiv = document.createElement("div");
        pickDiv.className = "shop-pick";

        shopPicks.forEach(function(buff, i) {
            var btn = document.createElement("div");
            var affordable = canAffordBuff(G, buff);
            btn.className = "btn shop-buff-btn" + (i === mIdx ? " selected" : "") + (!affordable ? " unaffordable" : "");

            var iconB = document.createElement("b"); iconB.textContent = buff.icon; iconB.style.fontSize = "32px";
            var nameSpan = document.createElement("span"); nameSpan.className = "shop-buff-name"; nameSpan.textContent = buff.name;
            var descSmall = document.createElement("small"); descSmall.textContent = buff.desc;
            var costDiv = document.createElement("div"); costDiv.className = "shop-cost";
            var hpCost = buff.cost.hp;
            costDiv.innerHTML = "Costo: <b>-" + buff.cost.seg + " segmenti</b> + <b>-" + hpCost + (hpCost > 1 ? " cuori massimi" : " cuore massimo") + "</b>";
            if (!affordable) costDiv.innerHTML += " <span style='color:#ef4444'>(non hai abbastanza)</span>";

            btn.appendChild(iconB); btn.appendChild(nameSpan); btn.appendChild(descSmall); btn.appendChild(costDiv);
            btn.onclick = function() {
                if (affordable) {
                    applySecretBuff(G, buff);
                    if (!G.secretBuffs) G.secretBuffs = [];
                    G.secretBuffs.push(buff.id);
                    closeSecretShop(true);
                } else {
                    shopSnakeShake = 8;
                    sHit();
                }
            };
            pickDiv.appendChild(btn);
        });
        OVC.appendChild(pickDiv);
    }

    // Refuse button
    var refuseBtn = document.createElement("div");
    refuseBtn.className = "btn slot-btn" + (mIdx === shopPicks.length ? " selected" : "");
    refuseBtn.style.cssText = "opacity:.6;margin-top:12px;width:200px";
    refuseBtn.textContent = "🚫 RIFIUTA";
    refuseBtn.onclick = function() { closeSecretShop(false); };
    OVC.appendChild(refuseBtn);
}

function drawAncientSnake(canvas, canAfford) {
    var c = canvas.getContext("2d");
    c.clearRect(0, 0, 200, 100);
    var t = performance.now();
    var shake = shopSnakeShake > 0 ? (Math.random() - 0.5) * 4 : 0;
    if (shopSnakeShake > 0) shopSnakeShake--;

    c.save();
    c.translate(shake, 0);

    // Ghost snake body - coiled
    c.strokeStyle = "rgba(192,132,252,0.6)";
    c.lineWidth = 6;
    c.lineCap = "round";
    c.beginPath();
    var cx = 100, cy = 50;
    for (var i = 0; i <= 40; i++) {
        var angle = i * 0.35;
        var r = 15 + i * 0.8;
        var px = cx + Math.cos(angle) * r;
        var py = cy + Math.sin(angle) * r * 0.6;
        if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.stroke();

    // Head (no eyes!)
    c.fillStyle = "rgba(192,132,252,0.8)";
    c.beginPath();
    c.arc(cx + 15, cy, 8, 0, Math.PI * 2);
    c.fill();

    // Faint glow
    if (canAfford) {
        var glowAlpha = Math.sin(t / 500) * 0.15 + 0.25;
        c.fillStyle = "rgba(192,132,252," + glowAlpha + ")";
        c.beginPath(); c.arc(cx, cy, 40, 0, Math.PI * 2); c.fill();
    }

    c.restore();
    // Redraw if shaking
    if (shopSnakeShake > 0) requestAnimationFrame(function() { drawAncientSnake(canvas, canAfford); });
}

function closeSecretShop(bought) {
    // Save game state BEFORE any changes to prevent save loss
    save();
    
    // Remove crack after use
    G.crack = null;
    hideOv(); unsetMS(); mState = "";

    if (bought) {
        addF(G.snake[0].x, G.snake[0].y, "PATTO SIGLATO!", "#c084fc");
        screenFlash = 8; flashClr = "rgba(192,132,252,.25)";
    }

    // Snake emerges from center - spawn animation
    var z = CZ(G);
    var sx = Math.min(Math.floor(z.c / 2), z.c - 3);
    var sy = Math.min(Math.floor(z.r / 2), z.r - 3);
    var sLen = G.snake.length;
    G.snake = [];
    for (var i = 0; i < sLen; i++) G.snake.push({ x: sx, y: sy });
    G.inputBuffer = [];
    G.isSpawning = true; G.spawnLeft = sLen;

    paused = true; cdTimer = 2; clearInterval(loop);
    if (codexFab) codexFab.style.display = "block";
    // Save again after state changes
    save();
    updateHUD();
}
