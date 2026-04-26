/* ===== BOSS DATABASE ===== */
var BOSS_DB = [
    // ===== ZONA 0: L'Albero di Mele =====
    { id: "bruchi", name: "I Tre Bruchi", icon: "🐛", zoneIndex: 0, hp: 3, moveInterval: 5, poisonInterval: 0, goldenInterval: 5, goldenToDamage: 3, color: "#86efac", collectType: "apple", collectName: "MELA", collectColor: "#4ade80", desc: "Tre serpenti-bruchi lunghi 3 celle che si muovono indipendentemente per la mappa. Raccogli 3 mele per eliminare un bruco!", bossType: "normal" },
    { id: "corvo", name: "Il Corvo Gigante", icon: "🦅", zoneIndex: 0, hp: 5, moveInterval: 5, poisonInterval: 9, goldenInterval: 6, goldenToDamage: 1, color: "#5eead4", collectType: "golden", collectName: "MELA DORATA", collectColor: "#fbbf24", desc: "Un corvo colossale custodisce l'albero. Raccogli mele dorate per ferirlo, evita le mele avvelenate che lascia cadere!", bossType: "normal" },
    { id: "newton", name: "Isaac Newton", icon: "🍎", zoneIndex: 0, hp: 3, moveInterval: 7, poisonInterval: 0, goldenInterval: 10, goldenToDamage: 1, color: "#facc15", collectType: "quantum", collectName: "MELA QUANTICA", collectColor: "#fde047", desc: "Boss segreto. Mele che sfidano la gravita! Il serpente viene attratto verso Newton.", bossType: "secret" },
    // ===== ZONA 1: Il Bosco Oscuro =====
    { id: "gufo", name: "Il Gufo", icon: "🦉", zoneIndex: 1, hp: 6, moveInterval: 4, poisonInterval: 0, goldenInterval: 7, goldenToDamage: 1, color: "#d97706", collectType: "feather", collectName: "PIUMA", collectColor: "#fbbf24", desc: "Un grande gufo che lancia blocchi Tetris dall'alto e dai lati. Raccogli piume per ferirlo!", bossType: "normal" },
    { id: "cervo", name: "Il Signor Cervo", icon: "🦌", zoneIndex: 1, hp: 5, moveInterval: 6, poisonInterval: 0, goldenInterval: 0, goldenToDamage: 1, color: "#a16207", collectType: "answer", collectName: "RISPOSTA CORRETTA", collectColor: "#f59e0b", desc: "Un cervo antropomorfo che ti sfida a un quiz! Rispondi correttamente a 3 domande su 5.", bossType: "normal" },
    { id: "lupo", name: "Il Lupo Ombra", icon: "🐺", zoneIndex: 1, hp: 7, moveInterval: 4, poisonInterval: 5, goldenInterval: 8, goldenToDamage: 1, color: "#818cf8", collectType: "shadow", collectName: "FRAMMENTO D'OMBRA", collectColor: "#818cf8", desc: "Il predatore dell'ombra. Raccogli frammenti d'ombra per ferirlo!", bossType: "normal" },
    // ===== ZONA 2: La Palude =====
    { id: "lumaca", name: "La Lumaca Colossale", icon: "🐌", zoneIndex: 2, hp: 10, moveInterval: 8, poisonInterval: 0, goldenInterval: 6, goldenToDamage: 1, color: "#84cc16", collectType: "mudcrystal", collectName: "CRISTALLO DI FANGO", collectColor: "#a3e635", desc: "Una lumaca enorme con trail tossico. Raccogli cristalli di fango per ferirla!", bossType: "normal" },
    { id: "coccodrillo", name: "Il Coccodrillo", icon: "🐊", zoneIndex: 2, hp: 7, moveInterval: 0, poisonInterval: 0, goldenInterval: 7, goldenToDamage: 1, color: "#65a30d", collectType: "tooth", collectName: "DENTE", collectColor: "#bef264", desc: "Non e un'entita fisica! Attacca solo con aree fade-in/fade-out. Gli occhi rossi lampeggiano come preavviso.", bossType: "normal" },
    { id: "rospo", name: "Il Rospo Re", icon: "🐸", zoneIndex: 2, hp: 8, moveInterval: 5, poisonInterval: 4, goldenInterval: 7, goldenToDamage: 1, color: "#a3e635", collectType: "fly", collectName: "MOSCA LUMINOSA", collectColor: "#84cc16", desc: "Il sovrano della palude. Raccogli mosche luminose per ferirlo!", bossType: "normal" },
    // ===== ZONA 3: Il Regno D'Oro =====
    { id: "leprecauno", name: "Il Leprecauno", icon: "🍀", zoneIndex: 3, hp: 6, moveInterval: 5, poisonInterval: 0, goldenInterval: 7, goldenToDamage: 1, color: "#22c55e", collectType: "luckycoin", collectName: "MONETA FORTUNATA", collectColor: "#4ade80", desc: "Un leprecauno dispettoso che fa piovere monete dal cielo! Raccogli monete fortunale per ferirlo.", bossType: "normal" },
    { id: "mimic", name: "Il Mimic", icon: "📦", zoneIndex: 3, hp: 8, moveInterval: 3, poisonInterval: 0, goldenInterval: 6, goldenToDamage: 1, color: "#b45309", collectType: "truthkey", collectName: "CHIAVE VERITATURA", collectColor: "#f59e0b", desc: "Si finge un oggetto prezioso e attacca quando ti avvicini! Raccogli chiavi veritatrici per ferirlo.", bossType: "normal" },
    { id: "tiranno", name: "Il Re Tiranno", icon: "👑", zoneIndex: 3, hp: 10, moveInterval: 4, poisonInterval: 5, goldenInterval: 9, goldenToDamage: 1, color: "#fbbf24", collectType: "coin", collectName: "MONETA D'ORO", collectColor: "#f59e0b", desc: "Il tiranno dorato. Raccogli monete d'oro per ferirlo!", bossType: "normal" },
    // ===== ZONA 4: Il Nido del Drago =====
    { id: "basilisco", name: "Il Basilisco di Lava", icon: "🦎", zoneIndex: 4, hp: 9, moveInterval: 5, poisonInterval: 0, goldenInterval: 6, goldenToDamage: 1, color: "#dc2626", collectType: "hotscale", collectName: "SCAGLIA INCANDESCENTE", collectColor: "#f97316", desc: "Un rettile di lava che pietrifica con lo sguardo. Raccogli scaglie incandescenti per ferirlo!", bossType: "normal" },
    { id: "draga", name: "La Draga Infernale", icon: "🐉", zoneIndex: 4, hp: 12, moveInterval: 3, poisonInterval: 4, goldenInterval: 7, goldenToDamage: 1, color: "#ef4444", collectType: "crystal", collectName: "CRISTALLO DI FUOCO", collectColor: "#f97316", desc: "La bestia del fuoco. Raccogli cristalli di fuoco per ferirla!", bossType: "normal" },
    { id: "fenice", name: "La Fenice di Ossidiana", icon: "🔥", zoneIndex: 4, hp: 5, moveInterval: 4, poisonInterval: 0, goldenInterval: 8, goldenToDamage: 1, color: "#7c3aed", collectType: "ash", collectName: "CENERE SPENTA", collectColor: "#a78bfa", desc: "Boss segreto. Muore e rinasce! Devi sconfiggerla 2 volte. La prima volta esplode in cenere.", bossType: "secret" },
    // ===== ZONA 5: Le Rovine Cosmiche =====
    { id: "nebula", name: "La Nebula Vivente", icon: "☁️", zoneIndex: 5, hp: 8, moveInterval: 6, poisonInterval: 0, goldenInterval: 7, goldenToDamage: 1, color: "#7dd3fc", collectType: "nebulafrag", collectName: "FRAMMENTO DI NEBULA", collectColor: "#38bdf8", desc: "Una nube cosmica senziente che si espande e contrae. Raccogli frammenti di nebula per ferirla!", bossType: "normal" },
    { id: "vuoto", name: "Il Guardiano del Vuoto", icon: "🌀", zoneIndex: 5, hp: 14, moveInterval: 4, poisonInterval: 5, goldenInterval: 9, goldenToDamage: 1, color: "#c084fc", collectType: "cosmic", collectName: "FRAMMENTO COSMICO", collectColor: "#a855f7", desc: "Il custode cosmico. Raccogli frammenti cosmici per ferirlo!", bossType: "normal" },
    { id: "astro", name: "L'Astro Divoratore", icon: "⭐", zoneIndex: 5, hp: 6, moveInterval: 3, poisonInterval: 0, goldenInterval: 5, goldenToDamage: 1, color: "#fbbf24", collectType: "starfrag", collectName: "FRAMMENTO STELLARE", collectColor: "#fde68a", desc: "Boss segreto. Un buco nero senziente che distorce lo spazio-tempo e attrae tutto!", bossType: "secret" },
    // ===== ZONA 6: Il Vuoto Abissale =====
    { id: "occhio", name: "L'Occhio dell'Abisso", icon: "👁️", zoneIndex: 6, hp: 12, moveInterval: 4, poisonInterval: 0, goldenInterval: 6, goldenToDamage: 1, color: "#6366f1", collectType: "tear", collectName: "LAGRIMA DELL'ABISSO", collectColor: "#818cf8", desc: "Un gigantesco occhio che distorce lo spazio e crea illusioni. Raccogli lagrime per ferirlo!", bossType: "normal" },
    { id: "primordiale", name: "Il Serpente Primordiale", icon: "🐍", zoneIndex: 6, hp: 18, moveInterval: 4, poisonInterval: 5, goldenInterval: 8, goldenToDamage: 1, color: "#f87171", collectType: "essence", collectName: "ESSENZA PRIMORDIALE", collectColor: "#fb7185", desc: "L'essere ancestrale. Raccogli essenze primordiali per ferirlo!", bossType: "normal" },
    { id: "entita", name: "L'Entita Senza Nome", icon: "🕳️", zoneIndex: 6, hp: 0, moveInterval: 0, poisonInterval: 0, goldenInterval: 0, goldenToDamage: 0, color: "#1e1b4b", collectType: "none", collectName: "NESSUNO", collectColor: "#312e81", desc: "Boss segreto finale. Non ha HP, non ha forma. Sopravvivi 60 tick mentre la mappa si dissolve.", bossType: "secret" }
];

/* ===== BOSS QUIZ DATA (Signor Cervo) ===== */
var CERVO_QUIZ = [
    {q:"Cosa cade ma non si rompe mai, e cosa si rompe ma non cade mai?",o:["La pioggia e il vetro","La notte e il giorno","Le foglie e i rami","La neve e il ghiaccio"],a:"B"},
    {q:"Cos'ha le citta ma nessuna casa, le foreste ma nessun albero e l'acqua ma nessun pesce?",o:["Un sogno","Una mappa","Un dipinto","Un libro"],a:"B"},
    {q:"Che tipo di stanza non ha porte ne finestre?",o:["Una prigione","Un fungo","Una grotta","Un caveau"],a:"B"},
    {q:"Cos'ha il fondo in cima?",o:["Un pozzo","Le gambe","La montagna","La torta"],a:"B"},
    {q:"Sono leggerissimo da sollevare, ma molto difficile da lanciare. Cosa sono?",o:["Una piuma","Un palloncino","Un pensiero","Un respiro"],a:"A"},
    {q:"Quale invenzione ti permette di guardare dritto attraverso un muro?",o:["I raggi X","Una finestra","Il buco della serratura","Il periscopio"],a:"B"},
    {q:"Cosa sale quando la pioggia scende?",o:["L'acqua del fiume","L'ombrello","L'umidita","Il vapore"],a:"B"},
    {q:"Cos'ha parole ma non parla mai?",o:["Un pappagallo muto","Un libro","Un cartello","Un attore muto"],a:"B"},
    {q:"Se bevo muoio, se mangio vivo. Cosa sono?",o:["Un pesce","Il fuoco","Un vampiro","Una spugna"],a:"B"},
    {q:"Cosa attraversa l'acqua senza bagnarsi?",o:["La luce","Un sottomarino","Il vento","Un pesce fantasma"],a:"A"},
    {q:"Cosa corre ma non cammina, ha una bocca ma non parla?",o:["Un fiume","Un fucile","Un cavallo","Una statua"],a:"A"},
    {q:"Cos'e sempre a letto ma non dorme mai?",o:["Un malato","Il fiume","Un cuscino","La luna"],a:"B"},
    {q:"Cosa puoi mettere in un secchio per renderlo piu leggero?",o:["Aria","Un buco","Elica","Piume"],a:"B"},
    {q:"Cosa e fatto d'acqua ma se lo metti nell'acqua muore?",o:["Il ghiaccio","Lo zucchero","Il sale","La barca di carta"],a:"A"},
    {q:"Non sono vivo ma cresco; non ho polmoni ma mi serve l'aria; non ho bocca ma l'acqua mi uccide. Cosa sono?",o:["Il fuoco","Il fungo","La spugna","Il cristallo"],a:"A"},
    {q:"Piu ce n'e, meno vedi. Cos'e?",o:["La nebbia","Il buio","La neve","La sabbia"],a:"B"},
    {q:"Cosa sta sempre per arrivare ma non arriva mai?",o:["Il treno","Domani","La primavera","Il futuro"],a:"B"},
    {q:"Cosa puoi tenere anche dopo averlo dato a qualcuno?",o:["Un regalo","La tua parola","Un bacio","Un consiglio"],a:"B"},
    {q:"Cos'e nero quando lo compri, rosso quando lo usi e grigio quando lo butti?",o:["Il carbone","Il ferro","Il vino","Il tabacco"],a:"A"},
    {q:"Cos'ha 6 facce ma non trucco, 21 occhi ma non vede?",o:["Un dado","Un alieno","Una statua cubica","Un mazzo"],a:"A"},
    {q:"Cosa ti appartiene ma gli altri ne usufruiscono piu di te?",o:["La tua casa","Il tuo nome","Il tuo telefono","La tua macchina"],a:"B"},
    {q:"In che mese festeggi meno compleanni?",o:["Febbraio","Novembre","Dicembre","Luglio"],a:"A"},
    {q:"Cosa ha un anello ma non ha dita?",o:["Saturno","Il telefono","La fede nuziale","Sia A che B"],a:"D"},
    {q:"Cos'ha molte citta ma nessuna casa, le foreste ma nessun albero e l'acqua ma nessun pesce?",o:["Un sogno","Una mappa","Un dipinto","Un libro"],a:"B"},
    {q:"Quale animale ha 4 zampe e poi 2?",o:["L'uomo","La rana","Il serpente","Il cane"],a:"B"},
    {q:"Cosa diventa piu umida mentre si asciuga?",o:["L'acqua","L'asciugamano","Il vapore","Il mare"],a:"B"},
    {q:"Se hai 6 mele e ne prendi 4, quante mele hai?",o:["2","4","6","10"],a:"B"},
    {q:"Cos'ha 88 tasti ma non apre nessuna porta?",o:["Un pianoforte","Una tastiera","Un computer","Un organo"],a:"A"},
    {q:"Qual e l'unico mammifero che non puo saltare?",o:["L'elefante","L'ippopotamo","Il rinoceronte","Il bradipo"],a:"A"},
    {q:"Cosa e bianco quando e sporco e nero quando e pulito?",o:["La lavagna","Il gesso","La neve","Il carbone"],a:"A"}
];
