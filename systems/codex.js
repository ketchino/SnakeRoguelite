/* ===== SISTEMA CODEX ===== */

function initCodexUI() {
    // Crea il bottone in alto a destra
    if (!codexFab) {
        codexFab = document.createElement("div");
        codexFab.id = "codex-fab";
        codexFab.innerHTML = '<span class="fab-icon">📚</span><span class="fab-txt">CODEX</span>';
        codexFab.onclick = function(e) { e.stopPropagation(); toggleCodex(); };
        document.body.appendChild(codexFab);
    }

    // Crea il pannello laterale
    if (!codexPanel) {
        codexPanel = document.createElement("div");
        codexPanel.id = "codex-panel";
        codexPanel.onclick = function(e) { e.stopPropagation(); }; // Evita chiusura cliccando dentro

        var codexData = loadCodex();
        var totalDisc = codexData.length;
        var totalItems = CODEX_DB.length + ZONE_CODEX.length + BOSS_CODEX.length + RELICS.length + SECRET_CODEX.length + SECRET_BUFFS.length;

        codexPanel.innerHTML = `
            <div class="codex-header">
                <h2>📚 CODEX <span class="codex-close-btn" id="codex-close-x">✕</span></h2>
                <div class="codex-tabs">
                    <div class="codex-tab active" data-tab="zone">🗺️ ZONE</div>
                    <div class="codex-tab" data-tab="personaggi">🐍 PERSONAGGI</div>
                    <div class="codex-tab" data-tab="nemici">👹 NEMICI</div>
                    <div class="codex-tab" data-tab="boss">🦅 BOSS</div>
                    <div class="codex-tab" data-tab="reliquie">🛡️ RELIQUIE</div>
                    <div class="codex-tab" data-tab="segreti">🔮 SEGRETI</div>
                </div>
            </div>
            <div class="codex-content" id="codex-grid-container"></div>
            <div class="codex-footer" id="codex-counter">${totalDisc}/${totalItems} scoperti</div>
        `;
        document.body.appendChild(codexPanel);
        // Attach event listeners after DOM insertion
        document.getElementById("codex-close-x").addEventListener("click", function(e) {
            e.stopPropagation();
            closeCodex();
        });
        codexPanel.querySelectorAll(".codex-tab").forEach(function(tab) {
            tab.addEventListener("click", function(e) {
                e.stopPropagation();
                setTab(tab.getAttribute("data-tab"));
            });
        });
    }
}

function closeCodex() {
    if (!codexIsOpen) return;
    codexIsOpen = false;
    document.body.classList.remove('codex-open');
    if (codexPanel) codexPanel.classList.remove('open');
    // Show FAB in appropriate states (including difficulty and character screens)
    if (codexFab && (mState === "slots" || mState === "paused" || mState === "setup")) {
        codexFab.style.display = "block";
    } else {
        codexFab.style.display = "none";
    }
    if (running && mState !== "paused" && mState !== "dead" && mState !== "leveling" && mState !== "slots") {
        paused = false; scheduleLoop();
    }
}

function toggleCodex() {
    initCodexUI();
    if (codexIsOpen) {
        closeCodex();
    } else {
        codexIsOpen = true;
        if (running && !paused) { paused = true; clearInterval(loop); }
        document.body.classList.add('codex-open');
        codexPanel.classList.add('open');
        codexFab.style.display = "none";
        renderCodexTab(activeTab);
    }
}

// Close codex when clicking outside the panel
document.addEventListener("click", function(e) {
    if (!codexIsOpen) return;
    // If click is inside the codex panel or on the FAB button, don't close
    if (codexPanel && codexPanel.contains(e.target)) return;
    if (codexFab && codexFab.contains(e.target)) return;
    closeCodex();
});

function setTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.codex-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    renderCodexTab(tab);
}

function renderCodexTab(tab) {
    var container = document.getElementById('codex-grid-container');
    if (!container) return;

    var discovered = loadCodex();
    var html = '<div class="codex-grid">';

    if (tab === 'zone') {
        ZONE_CODEX.forEach(function(z, i) {
            var isD = discovered.indexOf("zone_" + i) !== -1;
            html += buildCell(isD ? z.icon : "❓", isD ? z.name : "ZONA " + (i+1), isD ? z.desc : "Non ancora esplorata.", isD ? "var(--text)" : "#444");
        });
    }
    else if (tab === 'personaggi') {
        CHARACTERS.forEach(function(ch) {
            var isD = discovered.indexOf("char_" + ch.id) !== -1;
            var chColor = ch.color || "var(--text)";
            var chDesc = isD ? ch.desc : "Personaggio non ancora scoperto.";
            var chName = isD ? ch.name : "???";
            var chIcon = isD ? ch.icon : "❓";
            if (!isD) chColor = "#444";
            // Auto-discover characters that exist
            if (!isD) { discover("char_" + ch.id); isD = true; chDesc = ch.desc; chName = ch.name; chIcon = ch.icon; chColor = ch.color; }
            html += buildCell(chIcon, chName, chDesc, chColor);
            // Show stats if discovered
            if (isD && ch.stats) {
                var statText = '';
                var statKeys = Object.keys(ch.stats);
                statKeys.forEach(function(sk) {
                    var label = ch.statLabels && ch.statLabels[sk] ? ch.statLabels[sk] : sk.toUpperCase();
                    var val = ch.stats[sk];
                    statText += label + ': ' + val + '  ';
                });
                if (ch.lore) statText += '| ' + ch.lore;
                html += buildCell('', '', statText, "#666");
            }
        });
    }
    else if (tab === 'nemici') {
        // Filtra solo i nemici e le meccaniche dal DB
        CODEX_DB.filter(d => d.type === 'en' || d.type === 'me').forEach(function(db) {
            var isD = discovered.indexOf(db.id) !== -1;
            html += buildCell(isD ? db.icon : "❓", isD ? db.name : "???", isD ? db.desc : "Entità non identificata.", isD ? db.color : "#444");
        });
    }
    else if (tab === 'boss') {
        BOSS_CODEX.forEach(function(b) {
            var isD = discovered.indexOf("boss_" + (BOSS_DB.find(function(bb) { return bb.name === b.name; }) || {}).id) !== -1;
            html += buildCell(isD ? b.icon : "❓", isD ? b.name : "???", isD ? b.desc : "Guardiano non ancora incontrato.", isD ? "#f87171" : "#444");
        });
    }
    else if (tab === 'reliquie') {
        RELICS.forEach(function(r) {
            var isD = discovered.indexOf("rel_" + r.id) !== -1;
            html += buildCell(isD ? r.icon : "❓", isD ? r.name : "???", isD ? r.desc : "Reliquia non ancora ottenuta in nessuna run.", isD ? (rcClass(r.ra) === 'mythic-txt' ? '#f87171' : rcClass(r.ra) === 'legendary-txt' ? '#fbbf24' : rcClass(r.ra) === 'epic-txt' ? '#a78bfa' : rcClass(r.ra) === 'rare-txt' ? '#60a5fa' : '#9ca3af') : "#444");
        });
    }
    else if (tab === 'segreti') {
        // Secret shop entities
        if (typeof SECRET_CODEX !== 'undefined') {
            SECRET_CODEX.forEach(function(sc) {
                var isD = discovered.indexOf(sc.id) !== -1;
                html += buildCell(isD ? sc.icon : "❓", isD ? sc.name : "???", isD ? sc.desc : "Segreto non ancora scoperto.", isD ? "#c084fc" : "#444");
            });
        }
        // Secret buffs
        if (typeof SECRET_BUFFS !== 'undefined') {
            SECRET_BUFFS.forEach(function(sb) {
                var isD = discovered.indexOf("secret_" + sb.id) !== -1;
                html += buildCell(isD ? sb.icon : "❓", isD ? sb.name : "???", isD ? sb.desc : "Patto non ancora scoperto.", isD ? "#c084fc" : "#444");
            });
        }
    }

    html += '</div>';
    container.innerHTML = html;

    // Aggiorna il contatore nel footer
    var counterEl = document.getElementById('codex-counter');
    if (counterEl) {
        var totalItems = CODEX_DB.length + ZONE_CODEX.length + BOSS_CODEX.length + RELICS.length + CHARACTERS.length + (typeof SECRET_CODEX !== 'undefined' ? SECRET_CODEX.length + SECRET_BUFFS.length : 0);
        counterEl.textContent = discovered.length + '/' + totalItems + ' scoperti';
    }
}

function buildCell(icon, name, desc, color) {
    return `<div class="codex-cell">
        <span class="rri">${icon}</span>
        <div>
            <span class="rrn" style="color:${color}">${name}</span>
            <span class="rrd">${desc}</span>
        </div>
    </div>`;
}

// Logica Popup "Nuovo Scoperto" (non blocca più il gioco, appare in alto a destra)
function queueDiscovery(id) {
    var info = CODEX_DB.find(function(d) { return d.id === id; });
    if (info) showFloatDiscovery(info);
}
function showFloatDiscovery(info) {
    var el = document.createElement("div");
    el.style.cssText = "position:fixed; top:20px; left:50%; transform:translateX(-50%); background:rgba(20,20,30,0.95); border:1px solid "+info.color+"; color:#fff; padding:12px 24px; border-radius:10px; z-index:100; font-family:var(--fd); text-align:center; animation: popIn 0.4s ease-out; box-shadow: 0 4px 20px rgba(0,0,0,0.5);";
    el.innerHTML = "<div style='font-size:10px; color:#fbbf24; letter-spacing:2px; margin-bottom:4px;'>📌 NUOVO SCOPERTO</div><div style='font-size:14px; font-weight:700; color:"+info.color+";'>"+info.icon+" "+info.name+"</div>";
    document.body.appendChild(el);
    setTimeout(function() { el.style.opacity = '0'; el.style.transition = 'opacity 0.5s'; }, 2000);
    setTimeout(function() { el.remove(); }, 2500);
}
