/* ===== RELIQUIE ===== */
var RELICS = [
    { id: "speed", name: "Vento", icon: "👟", desc: "Aumenta la velocità di movimento del 15%.", ra: "comune", w: 32, fn: function (g) { g.spd *= 0.85; } },
    { id: "shield", name: "Scudo", icon: "🛡️", desc: "Il serpente cresce di un cuore.", ra: "comune", w: 32, fn: function (g) { g.hp++; } },
    { id: "nokia", name: "Nokia 3310", icon: "🧱", desc: "Assorbe un impatto letale senza perdere vite, ma ti rallenta per un istante.", ra: "comune", w: 28, noStack: true, fn: function (g) { g.nokia = true; } },
    { id: "stonks", name: "STONKS", icon: "📈", desc: "Guadagni punti bonus in base alla tua lunghezza, ma diventi sempre più veloce.", ra: "comune", w: 25, fn: function (g) { g.stonks = true; } },
    { id: "lofi", name: "Lofi Girl", icon: "🍵", desc: "Accetta un lieve rallentamento per ottenere esperienza extra ogni 5 mele.", ra: "comune", w: 28, fn: function (g) { g.lofi = true; g.spd *= 1.05; } },
    { id: "cheese", name: "Skyrim Cheese", icon: "🧀", desc: "Ogni 10 mele: recupera un cuore se sei ferito, altrimenti accorcia la coda.", ra: "comune", w: 28, fn: function (g) { g.cheese = true; } },
    { id: "sabbia", name: "Bolla di Sabbia", icon: "🫧", desc: "Mangiare un frutto genera un'onda d'urto che rallenta i nemici vicini.", ra: "comune", w: 26, fn: function (g) { g.sabbia = true; } },
    { id: "tronco", name: "Tronco", icon: "🪵", desc: "Permette di attraversare un singolo muro solido senza subire danni.", ra: "comune", w: 22, noStack: true, fn: function (g) { g.tronco = true; } },
    { id: "rosario", name: "Rosario", icon: "📿", desc: "Ti salva dal Game Over una volta, facendoti rinascere con un cuore.", ra: "comune", w: 18, noStack: true, fn: function (g) { g.rosario = true; } },
    { id: "moneta", name: "Moneta Fortunata", icon: "🪙", desc: "Ottieni una pioggia di punti bonus ogni 5 mele mangiate.", ra: "comune", w: 27, fn: function (g) { g.moneta = true; } },
    { id: "dado", name: "Dado della Fortuna", icon: "🎲", desc: "Ogni 8 mele: il destino ti assegna casualmente un grande bonus di XP o punti.", ra: "comune", w: 26, fn: function (g) { g.dado = true; } },
    { id: "pane", name: "Pane Raffermo", icon: "🍞", desc: "La tua coda diventa indistruttibile: non potrà mai scendere sotto i 4 segmenti.", ra: "comune", w: 25, fn: function (g) { g.pane = true; } },
    { id: "bigtop", name: "Big Top", icon: "🎪", desc: "Ti rende invincibile per i primi istanti all'inizio di ogni zona.", ra: "comune", w: 22, fn: function (g) { g.bigtop = true; } },
    { id: "pirla", name: "Il Pirla", icon: "🤡", desc: "Comandi invertiti! Una sfida folle che raddoppia punti ed esperienza. Prenderlo due volte annulla l'inversione.", ra: "raro", w: 15, noStack: true, fn: function (g) { g.pirla = !g.pirla; if (g.pirla) { g.xpm *= 2; g.spf += 2; } } },
    { id: "greed", name: "Abbondanza", icon: "💰", desc: "La cupidigia ti premia: ogni frutto raccolto vale un punto extra.", ra: "raro", w: 20, fn: function (g) { g.spf += 1; } },
    { id: "apple", name: "Mela d'Oro", icon: "🍏", desc: "Tutti i frutti forniscono il 50% di esperienza in più.", ra: "raro", w: 20, fn: function (g) { g.xpm *= 1.5; } },
    { id: "portal", name: "Portal Gun", icon: "🔫", desc: "Collega i confini del mondo: attraversa un bordo per riapparire dal lato opposto.", ra: "leggendaria", w: 5, fn: function (g) { g.portal = true; } },
    { id: "slurp", name: "Slurp Juice", icon: "🥤", desc: "La coda si rigenera lentamente da sola, ma la velocità aumenta leggermente.", ra: "raro", w: 18, fn: function (g) { g.slurp = true; g.spd *= 0.97; } },
    { id: "sonic", name: "Sonic Ring", icon: "👟", desc: "Invece di perdere una vita, l'impatto successivo ti taglierà solo la coda.", ra: "raro", w: 18, noStack: true, fn: function (g) { g.sonic = true; } },
    { id: "nyan", name: "Nyan Trail", icon: "🌈", desc: "I frutti sono attratti da te e appariranno molto più spesso sulla tua traiettoria.", ra: "raro", w: 18, fn: function (g) { g.nyan = true; } },
    { id: "gommu", name: "Gommu Gommu", icon: "👒", desc: "Corpo elastico: permette di mangiare frutti a una cella di distanza.", ra: "raro", w: 15, fn: function (g) { g.gommu = true; } },
    { id: "arrow", name: "Arrow in the Knee", icon: "🏹", desc: "La tua velocità attuale viene bloccata, ma guadagni il 50% di punti in più.", ra: "raro", w: 16, fn: function (g) { g.arrow = true; g.arrowSpd = g.spd; } },
    { id: "trappola", name: "Trappola", icon: "🪤", desc: "Ogni volta che curvi, lasci una trappola mortale dietro di te.", ra: "raro", w: 14, fn: function (g) { g.trappola = true; } },
    { id: "nostalgia", name: "Nostalgia", icon: "🎵", desc: "Mangiare spaventa i nemici vicini, costringendoli ad allontanarsi.", ra: "raro", w: 15, fn: function (g) { g.nostalgia = true; } },
    { id: "nabbo", name: "Aiuto Nabbo", icon: "🤝", desc: "Raccogli automaticamente i frutti che si trovano nelle celle diagonali vicine.", ra: "raro", w: 17, fn: function (g) { g.nabbo = true; } },
    { id: "vortex", name: "Vortice", icon: "🌀", desc: "Ogni frutto raccolto distrugge un muro solido nelle vicinanze.", ra: "epico", w: 14, fn: function (g) { g.vortex = true; } },
    { id: "hulk", name: "Hulkmania", icon: "💪", desc: "Sfondi i muri a testate, ma ogni impatto ti costa alcuni segmenti della coda.", ra: "epico", w: 13, fn: function (g) { g.hulk = true; } },
    { id: "praise", name: "Praise the Sun", icon: "🍗", desc: "Ogni 3 mele: un'onda solare polverizza le rocce fragili intorno a te.", ra: "epico", w: 12, fn: function (g) { g.praise = true; } },
    { id: "guscio", name: "Guscio Blu", icon: "🐢", desc: "Ogni 3 mele: spara un raggio che distrugge qualunque ostacolo davanti a te.", ra: "epico", w: 12, fn: function (g) { g.guscio = true; } },
    { id: "reverse", name: "Uno Reverse", icon: "🔄", desc: "Se un nemico ti tocca, lo disintegri all'istante e guadagni punti extra.", ra: "epico", w: 11, noStack: true, fn: function (g) { g.unoReverse = true; } },
    { id: "link", name: "Scudo di Link", icon: "🛡️", desc: "Genera uno scudo magico che annulla il prossimo danno ricevuto.", ra: "epico", w: 12, noStack: true, fn: function (g) { g.linkShield = true; g.linkCD = 0; } },
    { id: "eruzione", name: "Eruzione", icon: "🌋", desc: "Ogni 4 mele: un'esplosione violenta rade al suolo i muri circostanti.", ra: "epico", w: 13, fn: function (g) { g.eruzione = true; } },
    { id: "god", name: "Divinità", icon: "✨", desc: "Una benedizione suprema: ottieni 2 vite extra e doppia esperienza.", ra: "leggendaria", w: 5, noStack: true, fn: function (g) { g.hp += 2; g.xpm *= 2; } },
    { id: "lag", name: "Lag Strategico", icon: "🌐", desc: "Sfrutta un glitch per attraversare il tuo corpo alla massima velocità.", ra: "leggendaria", w: 5, noStack: true, fn: function (g) { g.lag = true; g.spd *= 0.65; } },
    { id: "kunai", name: "Kunai", icon: "⚡", desc: "In caso di pericolo, teletrasportati istantaneamente dalla testa alla coda.", ra: "leggendaria", w: 5, noStack: true, fn: function (g) { g.kunai = true; g.kunaiCDMS = 0; } },
    { id: "omni", name: "Omnipotenza", icon: "💎", desc: "Il potere assoluto: +3 vite, punti extra e velocità fuori controllo.", ra: "mitico", w: 2, noStack: true, fn: function (g) { g.hp += 3; g.xpm *= 2; g.spf += 2; g.spd *= 0.75; } },
    // BOSS RELICS (w: poolWeight - usato nella pool del level-up se il boss è stato sconfitto in una run precedente)
    { id: "piuma", name: "Piuma del Corvo", icon: "🪶", desc: "I nemici ti individuano con 1 cella di distanza in meno.", ra: "raro", w: 15, noStack: true, bossRelic: true, fn: function (g) { g.piuma = true; } },
    { id: "occhiolupo", name: "Occhio del Lupo", icon: "👁️", desc: "Le mele avvelenate dei boss brillano di più: puoi vederle da 2 celle più lontano. +1 HP.", ra: "raro", w: 15, noStack: true, bossRelic: true, fn: function (g) { g.occhiolupo = true; g.hp++; } },
    { id: "linguarospo", name: "Lingua del Rospo", icon: "👅", desc: "Mangiare una mela vicino a un nemico lo stordisce per 3 tick extra.", ra: "epico", w: 10, noStack: true, bossRelic: true, fn: function (g) { g.linguarospo = true; } },
    { id: "coronatiranno", name: "Corona del Tiranno", icon: "👑", desc: "Ogni 10 mele: guadagni 1 punto vita extra massimo.", ra: "epico", w: 10, noStack: true, bossRelic: true, fn: function (g) { g.coronatiranno = true; g.coronaMeals = 0; } },
    { id: "scagliadraga", name: "Scaglia della Draga", icon: "🐉", desc: "Riduce il danno subito del 50% una volta ogni 30 tick.", ra: "leggendaria", w: 5, noStack: true, bossRelic: true, fn: function (g) { g.scagliadraga = true; g.scagliaCD = 0; } },
    { id: "frammentovuoto", name: "Frammento del Vuoto", icon: "💎", desc: "Premi SPAZIO per teletrasportarti 3 celle avanti. Ricarica: 8 secondi.", ra: "leggendaria", w: 5, noStack: true, bossRelic: true, fn: function (g) { g.frammentovuoto = true; g.frammentoCD = 0; } },
    { id: "pelleprimordiale", name: "Pelle del Primordiale", icon: "🐍", desc: "Il tuo serpente è immune al veleno dei boss. Le mele avvelenate non ti fanno danno.", ra: "mitico", w: 2, noStack: true, bossRelic: true, fn: function (g) { g.pelleprimordiale = true; } },
    { id: "genio", name: "Genio", icon: "🏮", desc: "Estrai dalla lampada due reliquie casuali extra all'istante.", ra: "mitico", w: 2, noStack: true, fn: function (g) {
        g.spd *= 0.9;
        var sub = RELICS.filter(function (r) { return r.ra !== "mitico"; });
        for (var i = 0; i < 2 && sub.length; i++) {
            var tw = sub.reduce(function (a, b) { return a + b.w; }, 0);
            var rnd = Math.random() * tw, s = 0;
            for (var j = 0; j < sub.length; j++) {
                s += sub[j].w;
                if (rnd <= s) { 
                    if (sub[j].noStack && g.relics.indexOf(sub[j].id) !== -1) {
                        sub[j].fn(g); 
                    } else {
                        sub[j].fn(g);
                        g.relics.push(sub[j].id);
                    }
                    sub.splice(j, 1); break; 
                }
            }
        }
    }}
];
