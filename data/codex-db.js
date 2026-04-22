/* ===== CODEX DATABASE ===== */
var CODEX_DB = [
    // OSTACOLI
    { id: "obs_normal", type: "obs", name: "Muro di Pietra", desc: "Ostacolo solido. Blocca il passaggio di serpenti e nemici.", icon: "⬛", color: "#888" },
    { id: "obs_fragile", type: "obs", name: "Cristallo Fragile", desc: "Si distrugge al contatto. Attenzione: i nemici patrol lo rompono passandoci sopra!", icon: "🔳", color: "#60a5fa" },
    { id: "obs_explosive", type: "obs", name: "Barile Esplosivo", desc: "Esplode al contatto! Causa catene di esplosioni e danneggia tutto nel raggio 2.", icon: "🟥", color: "#ef4444" },
    
    // NEMICI
    { id: "en_patrol", type: "en", name: "Guardia Spettrale", desc: "Patrolla la mappa. Se ti avvista entro 4 celle, diventa allerta e ti inseguirà.", icon: "👻", color: "#a855f7" },
    { id: "en_hunter", type: "en", name: "Cacciatore Rosso", desc: "Calcola il percorso migliore per raggiungerti (IA Pathfinder). Si carica per colpirti!", icon: "👹", color: "#ef4444" },
    
    // MECCANICHE
    { id: "me_trap", type: "me", name: "Trappole del Cacciatore", desc: "Se possiedi la reliquia omonima, le celle dietro di te diventano trappole mortali per i nemici.", icon: "🪤", color: "#a3e635" },
    { id: "me_pending", type: "me", name: "Manifestazione Oscura", desc: "Pallini luminescenti che appaiono per 15 tick prima che un nuovo ostacolo si materializzi.", icon: "⚫", color: "#555" },
    // BOSS
    { id: "boss_corvo", type: "boss", name: "Il Corvo Gigante", desc: "Boss di Zona 1. Raccogli mele dorate per attaccarlo, schiva le mele avvelenate!", icon: "🦅", color: "#5eead4" },
    { id: "boss_lupo", type: "boss", name: "Il Lupo Ombra", desc: "Boss di Zona 2. Raccogli frammenti d'ombra per ferirlo. Attento ai cloni!", icon: "🐺", color: "#818cf8" },
    { id: "boss_rospo", type: "boss", name: "Il Rospo Re", desc: "Boss di Zona 3. Raccogli mosche luminose per ferirlo. Schiva la lingua rossa!", icon: "🐸", color: "#a3e635" },
    { id: "boss_tiranno", type: "boss", name: "Il Re Tiranno", desc: "Boss di Zona 4. Raccogli monete d'oro per ferirlo. Attento alle guardie!", icon: "👑", color: "#fbbf24" },
    { id: "boss_draga", type: "boss", name: "La Draga Infernale", desc: "Boss di Zona 5. Raccogli cristalli di fuoco per ferirla. Due fasi!", icon: "🐉", color: "#ef4444" },
    { id: "boss_vuoto", type: "boss", name: "Il Guardiano del Vuoto", desc: "Boss di Zona 6. Raccogli frammenti cosmici per ferirlo. Manipola lo spazio!", icon: "🔮", color: "#c084fc" },
    { id: "boss_primordiale", type: "boss", name: "Il Serpente Primordiale", desc: "Boss finale. Raccogli essenze primordiali per ferirlo. Tre fasi!", icon: "🐍", color: "#f87171" },
    // NEMICI BOSS
    { id: "en_boss_lupo", type: "en", name: "Ombra del Lupo", desc: "Clone d'ombra creato dal Lupo Ombra. Dissipati al contatto, ma infliggono danno!", icon: "👤", color: "#818cf8" },
    { id: "en_boss_rospo", type: "en", name: "Lingua del Rospo", desc: "Lingua rossa del Rospo Re. Schiva l'attacco o verrai avvelenato!", icon: "👅", color: "#ef4444" },
    { id: "en_guardia_tiranno", type: "en", name: "Guardia del Re", desc: "Soldato del Re Tiranno. Pattuglia intorno al boss e attacca il serpente!", icon: "🗡️", color: "#fbbf24" },
    { id: "en_boss_fire", type: "en", name: "Scia di Fuoco", desc: "Scia infuocata della Draga Infernale. Brucia chi la calpesta!", icon: "🔥", color: "#ef4444" },
    { id: "en_boss_ice", type: "en", name: "Ghiaccio della Draga", desc: "Frammento di ghiaccio della Draga Infernale in Fase 2. Congelante!", icon: "🧊", color: "#60a5fa" },
    { id: "en_boss_gravity", type: "en", name: "Pozzo Gravitazionale", desc: "Anomalia creata dal Guardiano del Vuoto. Attira il serpente!", icon: "🌀", color: "#c084fc" },
    { id: "en_boss_tail", type: "en", name: "Coda Primordiale", desc: "Segmento di coda del Serpente Primordiale. Velenoso e pericoloso!", icon: "☠️", color: "#f87171" }
];

var ZONE_CODEX = [
    { name: "L'ALBERO DI MELE", desc: "Un pascolo tranquillo. Nessun ostacolo, nessun nemico. Impara i controlli e goditi il raccolto.", icon: "🌳" },
    { name: "IL BOSCO OSCURO", desc: "Gli alberi si fanno fitti. Ostacoli normali e fragili bloccano i percorsi. Le Guardie Spettrali iniziano a pattugliare.", icon: "🌲" },
    { name: "LA PALUDE", desc: "Il terreno_PULLULA di vita. Barili esplosivi debuttano sulla scena. Fai attenzione dove calpesti.", icon: "🐸" },
    { name: "IL REGNO D'ORO", desc: "Ricchezze e pericoli. I Cacciatori Rossi ti braccano usando percorsi intelligenti per accerchiarti.", icon: "👑" },
    { name: "IL NIDO DEL DRAGO", desc: "Il calore è opprimente. Densità di ostacoli letale e cacciatori spietati. Solo i più forti sopravvivono.", icon: "🐉" },
    { name: "LE ROVINE COSMICHE", desc: "Il tessuto della realtà si squarcia. Lo spazio è ristretto, le esplosioni sono frequenti e inarrestabili.", icon: "🌌" },
    { name: "IL VUOTO ABISSALE", desc: "Non c'è via di fuga. Ogni zona superata qui si rigenera all'infinito, diventando sempre più grande e corrotta.", icon: "🕳️" }
];

var BOSS_CODEX = [
    { name: "Il Corvo Gigante", desc: "Primo guardiano. Raccogli 3 mele dorate per ferirlo. Evita le mele avvelenate!", icon: "🦅", zone: "L'ALBERO DI MELE" },
    { name: "Il Lupo Ombra", desc: "Il predatore oscuro. Raccogli 3 frammenti d'ombra per ferirlo. Attento ai cloni!", icon: "🐺", zone: "IL BOSCO OSCURO" },
    { name: "Il Rospo Re", desc: "Il sovrano della palude. Raccogli 3 mosche luminose per ferirlo. Schiva la lingua!", icon: "🐸", zone: "LA PALUDE" },
    { name: "Il Re Tiranno", desc: "Il tiranno dorato. Raccogli 4 monete d'oro per ferirlo. Attento alle guardie!", icon: "👑", zone: "IL REGNO D'ORO" },
    { name: "La Draga Infernale", desc: "La bestia del fuoco. Raccogli 3 cristalli di fuoco per ferirla. Due fasi!", icon: "🐉", zone: "IL NIDO DEL DRAGO" },
    { name: "Il Guardiano del Vuoto", desc: "Il custode cosmico. Raccogli 4 frammenti cosmici per ferirlo. Due fasi!", icon: "🔮", zone: "LE ROVINE COSMICHE" },
    { name: "Il Serpente Primordiale", desc: "L'essere ancestrale. Raccogli 3 essenze primordiali per ferirlo. Tre fasi!", icon: "🐍", zone: "IL VUOTO ABISSALE" }
];

var SECRET_CODEX = [
    { id: "shop_crack", name: "La Crepa Luminosa", desc: "Una fenditura nel bordo della mappa che pulsa di luce ambrata. Entro vi dimora l'Antico Serpente.", icon: "🕳️" },
    { id: "shop_serpente", name: "L'Antico Serpente", desc: "Un serpente fantasma che offre patti potenti in cambio della tua sostanza.", icon: "🐍" }
];
