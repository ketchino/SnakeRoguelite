/* ===== SHOP SEGRETO BUFFS ===== */
var SECRET_BUFFS = [
    { id: "cuore_antico", name: "Cuore dell'Antico", icon: "🫀", desc: "I tuoi cuori massimi diminuiscono di 2, ma ogni 5 mele mangiate ne recuperi uno.", cost: { seg: 2, hp: 2 }, fn: function(g) { g.cuoreAntico = true; g.cuoreAnticoMeals = 0; } },
    { id: "sguardo_vuoto", name: "Sguardo Vuoto", icon: "🧿", desc: "Le guardie non ti notano più, ma i cacciatori diventano piu' aggressivi.", cost: { seg: 2, hp: 1 }, fn: function(g) { g.sguardoVuoto = true; } },
    { id: "pelle_muta", name: "Pelle Muta", icon: "🐍", desc: "Ogni 8 tick, il tuo ultimo segmento si stacca e diventa una trappola velenosa per i nemici.", cost: { seg: 3, hp: 1 }, fn: function(g) { g.pelleMuta = true; g.pelleMutaTick = 0; } },
    { id: "ricordo_sbiadito", name: "Ricordo Sbiadito", icon: "🕰️", desc: "Quando muori, rinasci nella zona attuale con 1 cuore e meta' della tua lunghezza. Una sola volta per run.", cost: { seg: 4, hp: 1 }, fn: function(g) { g.ricordoSbiadito = true; g.ricordoUsed = false; } },
    { id: "ombra_lunga", name: "Ombra Lunga", icon: "🌑", desc: "Il tuo serpente lascia un'ombra per 3 tick. I nemici che la toccano vengono rallentati.", cost: { seg: 3, hp: 1 }, fn: function(g) { g.ombraLunga = true; g.ombraTrail = []; } },
    { id: "fame_eterna", name: "Fame Eterna", icon: "💀", desc: "Ogni mela mangiata infligge danno a tutti i nemici entro 3 celle. Perdi 2 cuori massimi.", cost: { seg: 4, hp: 2 }, fn: function(g) { g.fameEterna = true; } }
];
