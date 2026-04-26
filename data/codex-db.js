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
    // BOSS ORIGINALI
    { id: "boss_corvo", type: "boss", name: "Il Corvo Gigante", desc: "Boss di Zona 1. Raccogli mele dorate per attaccarlo, schiva le mele avvelenate!", icon: "🦅", color: "#5eead4" },
    { id: "boss_lupo", type: "boss", name: "Il Lupo Ombra", desc: "Boss di Zona 2. Raccogli frammenti d'ombra per ferirlo. Attento ai cloni!", icon: "🐺", color: "#818cf8" },
    { id: "boss_rospo", type: "boss", name: "Il Rospo Re", desc: "Boss di Zona 3. Raccogli mosche luminose per ferirlo. Schiva la lingua rossa!", icon: "🐸", color: "#a3e635" },
    { id: "boss_tiranno", type: "boss", name: "Il Re Tiranno", desc: "Boss di Zona 4. Raccogli monete d'oro per ferirlo. Attento alle guardie!", icon: "👑", color: "#fbbf24" },
    { id: "boss_draga", type: "boss", name: "La Draga Infernale", desc: "Boss di Zona 5. Raccogli cristalli di fuoco per ferirla. Due fasi!", icon: "🐉", color: "#ef4444" },
    { id: "boss_vuoto", type: "boss", name: "Il Guardiano del Vuoto", desc: "Boss di Zona 6. Raccogli frammenti cosmici per ferirlo. Manipola lo spazio!", icon: "🔮", color: "#c084fc" },
    { id: "boss_primordiale", type: "boss", name: "Il Serpente Primordiale", desc: "Boss finale. Raccogli essenze primordiali per ferirlo. Tre fasi!", icon: "🐍", color: "#f87171" },
    // NUOVI BOSS
    { id: "boss_bruchi", type: "boss", name: "I Tre Bruchi", desc: "Boss di Zona 1. Tre bruchi orbitano attorno al serpente. Raccogli 3 mele per eliminarne uno!", icon: "🐛", color: "#86efac" },
    { id: "boss_newton", type: "boss", name: "Isaac Newton", desc: "Boss segreto Zona 1. Mele che sfidano la gravita! Il serpente viene attratto verso Newton.", icon: "🍎", color: "#facc15" },
    { id: "boss_gufo", type: "boss", name: "Il Gufo", desc: "Boss di Zona 2. Lancia blocchi Tetris dall'alto e dai lati. La testa indica la direzione!", icon: "🦉", color: "#d97706" },
    { id: "boss_cervo", type: "boss", name: "Il Signor Cervo", desc: "Boss di Zona 2. Un quiz! Rispondi correttamente a 3 domande su 5 per vincere.", icon: "🦌", color: "#a16207" },
    { id: "boss_lumaca", type: "boss", name: "La Lumaca Colossale", desc: "Boss di Zona 3. Lascia un trail tossico persistente. Raccogli cristalli di fango!", icon: "🐌", color: "#84cc16" },
    { id: "boss_coccodrillo", type: "boss", name: "Il Coccodrillo", desc: "Boss di Zona 3. Non ha corpo fisico! Solo occhi rossi lampeggianti e attacchi ad area.", icon: "🐊", color: "#65a30d" },
    { id: "boss_leprecauno", type: "boss", name: "Il Leprecauno", desc: "Boss di Zona 4. Pioggia di monete dal cielo! Raccogli monete fortunale per ferirlo.", icon: "🍀", color: "#22c55e" },
    { id: "boss_mimic", type: "boss", name: "Il Mimic", desc: "Boss di Zona 4. Si finge un oggetto e attacca quando ti avvicini! Raccogli chiavi veritatrici.", icon: "📦", color: "#b45309" },
    { id: "boss_basilisco", type: "boss", name: "Il Basilisco di Lava", desc: "Boss di Zona 5. Pietrifica con lo sguardo! Raccogli scaglie incandescenti.", icon: "🦎", color: "#dc2626" },
    { id: "boss_fenice", type: "boss", name: "La Fenice di Ossidiana", desc: "Boss segreto Zona 5. Muore e rinasce! Devi sconfiggerla 2 volte.", icon: "🔥", color: "#7c3aed" },
    { id: "boss_nebula", type: "boss", name: "La Nebula Vivente", desc: "Boss di Zona 6. Si espande e contrae, risucchia il serpente! Raccungi frammenti di nebula.", icon: "☁️", color: "#7dd3fc" },
    { id: "boss_astro", type: "boss", name: "L'Astro Divoratore", desc: "Boss segreto Zona 6. Un buco nero che distorce lo spazio-tempo e attrae tutto!", icon: "⭐", color: "#fbbf24" },
    { id: "boss_occhio", type: "boss", name: "L'Occhio dell'Abisso", desc: "Boss di Zona 7. Distorce lo spazio e crea illusioni. Raccungi lagrime dell'abisso!", icon: "👁️", color: "#6366f1" },
    { id: "boss_entita", type: "boss", name: "L'Entita Senza Nome", desc: "Boss segreto finale. Nessun HP, nessuna forma. Sopravvivi 60 tick mentre la mappa si dissolve!", icon: "🕳️", color: "#1e1b4b" },
    // NEMICI BOSS
    { id: "en_boss_lupo", type: "en", name: "Ombra del Lupo", desc: "Clone d'ombra creato dal Lupo Ombra. Dissipati al contatto, ma infliggono danno!", icon: "👤", color: "#818cf8" },
    { id: "en_boss_rospo", type: "en", name: "Lingua del Rospo", desc: "Lingua rossa del Rospo Re. Schiva l'attacco o verrai avvelenato!", icon: "👅", color: "#ef4444" },
    { id: "en_guardia_tiranno", type: "en", name: "Guardia del Re", desc: "Soldato del Re Tiranno. Pattuglia intorno al boss e attacca il serpente!", icon: "🗡️", color: "#fbbf24" },
    { id: "en_boss_fire", type: "en", name: "Scia di Fuoco", desc: "Scia infuocata della Draga Infernale. Brucia chi la calpesta!", icon: "🔥", color: "#ef4444" },
    { id: "en_boss_ice", type: "en", name: "Ghiaccio della Draga", desc: "Frammento di ghiaccio della Draga Infernale in Fase 2. Congelante!", icon: "🧊", color: "#60a5fa" },
    { id: "en_boss_gravity", type: "en", name: "Pozzo Gravitazionale", desc: "Anomalia creata dal Guardiano del Vuoto. Attira il serpente!", icon: "🌀", color: "#c084fc" },
    { id: "en_boss_tail", type: "en", name: "Coda Primordiale", desc: "Segmento di coda del Serpente Primordiale. Velenoso e pericoloso!", icon: "☠️", color: "#f87171" },
    { id: "en_boss_orbit", type: "en", name: "Orbita dei Bruchi", desc: "Celle pericolose dove si trovano i bruchi orbitanti. Evitale!", icon: "🐛", color: "#86efac" },
    { id: "en_boss_lava", type: "en", name: "Scia di Lava", desc: "Cella incendiata dal Basilisco di Lava. Dannosa per 10 tick!", icon: "🌋", color: "#dc2626" },
    { id: "en_boss_void_zone", type: "en", name: "Zona del Vuoto", desc: "Celle dissolve dall'Entita Senza Nome. Istantaneamente letali!", icon: "🕳️", color: "#1e1b4b" }
];

var ZONE_CODEX = [
    { name: "L'ALBERO DI MELE", desc: "Un pascolo tranquillo. Nessun ostacolo, nessun nemico. Impara i controlli e goditi il raccolto.", icon: "🌳" },
    { name: "IL BOSCO OSCURO", desc: "Gli alberi si fanno fitti. Ostacoli normali e fragili bloccano i percorsi. Le Guardie Spettrali iniziano a pattugliare.", icon: "🌲" },
    { name: "LA PALUDE", desc: "Il terreno pullula di vita. Barili esplosivi debuttano sulla scena. Fai attenzione dove calpesti.", icon: "🐸" },
    { name: "IL REGNO D'ORO", desc: "Ricchezze e pericoli. I Cacciatori Rossi ti braccano usando percorsi intelligenti per accerchiarti.", icon: "👑" },
    { name: "IL NIDO DEL DRAGO", desc: "Il calore e opprimente. Densita di ostacoli letale e cacciatori spietati. Solo i piu forti sopravvivono.", icon: "🐉" },
    { name: "LE ROVINE COSMICHE", desc: "Il tessuto della realta si squarcia. Lo spazio e ristretto, le esplosioni sono frequenti e inarrestabili.", icon: "🌌" },
    { name: "IL VUOTO ABISSALE", desc: "Non c'e via di fuga. Ogni zona superata qui si rigenera all'infinito, diventando sempre piu grande e corrotta.", icon: "🕳️" }
];

var BOSS_CODEX = [
    { name: "I Tre Bruchi", desc: "Tre bruchi orbitano attorno al serpente. Raccogli 3 mele per eliminarne uno! L'ultimo accelera.", icon: "🐛", zone: "L'ALBERO DI MELE" },
    { name: "Il Corvo Gigante", desc: "Primo guardiano. Raccogli mele dorate per ferirlo. Evita le mele avvelenate!", icon: "🦅", zone: "L'ALBERO DI MELE" },
    { name: "Isaac Newton", desc: "Boss segreto. Mele che sfidano la gravita! Attrazione gravitazionale verso il boss.", icon: "🍎", zone: "L'ALBERO DI MELE" },
    { name: "Il Gufo", desc: "Lancia blocchi Tetris dall'alto e dai lati. La testa ruota per indicare la direzione!", icon: "🦉", zone: "IL BOSCO OSCURO" },
    { name: "Il Signor Cervo", desc: "Un quiz! Rispondi correttamente a 3 domande su 5 per vincere. Sbagliare costa 1 HP.", icon: "🦌", zone: "IL BOSCO OSCURO" },
    { name: "Il Lupo Ombra", desc: "Il predatore oscuro. Raccogli frammenti d'ombra per ferirlo. Attento ai cloni!", icon: "🐺", zone: "IL BOSCO OSCURO" },
    { name: "La Lumaca Colossale", desc: "Trail tossico persistente! Raccungi cristalli di fango. Due fasi con scia sempre piu larga.", icon: "🐌", zone: "LA PALUDE" },
    { name: "Il Coccodrillo", desc: "Non ha corpo! Solo occhi rossi lampeggianti e attacchi ad area fade-in/fade-out.", icon: "🐊", zone: "LA PALUDE" },
    { name: "Il Rospo Re", desc: "Il sovrano della palude. Raccungi mosche luminose per ferirlo. Schiva la lingua!", icon: "🐸", zone: "LA PALUDE" },
    { name: "Il Leprecauno", desc: "Pioggia di monete dal cielo! Si muove velocemente. Raccungi monete fortunale.", icon: "🍀", zone: "IL REGNO D'ORO" },
    { name: "Il Mimic", desc: "Si finge un oggetto prezioso e attacca quando ti avvicini! Raccungi chiavi veritatrici.", icon: "📦", zone: "IL REGNO D'ORO" },
    { name: "Il Re Tiranno", desc: "Il tiranno dorato. Raccungi monete d'oro per ferirlo. Attento alle guardie!", icon: "👑", zone: "IL REGNO D'ORO" },
    { name: "Il Basilisco di Lava", desc: "Pietrifica con lo sguardo! Lascia scie di lava. Raccungi scaglie incandescenti.", icon: "🦎", zone: "IL NIDO DEL DRAGO" },
    { name: "La Draga Infernale", desc: "La bestia del fuoco. Raccungi cristalli di fuoco per ferirla. Due fasi!", icon: "🐉", zone: "IL NIDO DEL DRAGO" },
    { name: "La Fenice di Ossidiana", desc: "Boss segreto. Muore e rinasce! Devi sconfiggerla 2 volte per vincere.", icon: "🔥", zone: "IL NIDO DEL DRAGO" },
    { name: "La Nebula Vivente", desc: "Si espande e contrae, risucchia il serpente! Raccungi frammenti di nebula.", icon: "☁️", zone: "LE ROVINE COSMICHE" },
    { name: "Il Guardiano del Vuoto", desc: "Il custode cosmico. Raccungi frammenti cosmici per ferirlo. Due fasi!", icon: "🔮", zone: "LE ROVINE COSMICHE" },
    { name: "L'Astro Divoratore", desc: "Boss segreto. Un buco nero senziente che attrae tutto! Raccungi frammenti stellari.", icon: "⭐", zone: "LE ROVINE COSMICHE" },
    { name: "L'Occhio dell'Abisso", desc: "Distorce lo spazio e crea illusioni nella Fase 2. Raccungi lagrime dell'abisso!", icon: "👁️", zone: "IL VUOTO ABISSALE" },
    { name: "Il Serpente Primordiale", desc: "L'essere ancestrale. Raccungi essenze primordiali per ferirlo. Tre fasi!", icon: "🐍", zone: "IL VUOTO ABISSALE" },
    { name: "L'Entita Senza Nome", desc: "Boss segreto finale. Sopravvivi 60 tick mentre la mappa si dissolve. Nessun collectibile!", icon: "🕳️", zone: "IL VUOTO ABISSALE" }
];

var SECRET_CODEX = [
    { id: "shop_crack", name: "La Crepa Luminosa", desc: "Una fenditura nel bordo della mappa che pulsa di luce ambrata. Entro vi dimora l'Antico Serpente.", icon: "🕳️" },
    { id: "shop_serpente", name: "L'Antico Serpente", desc: "Un serpente fantasma che offre patti potenti in cambio della tua sostanza.", icon: "🐍" }
];
