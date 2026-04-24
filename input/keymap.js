/* ===== KEY MAPPING SYSTEM ===== */

// Default key bindings
var DEFAULT_KEYMAP = {
    up: "arrowup",
    down: "arrowdown",
    left: "arrowleft",
    right: "arrowright",
    up_alt: "w",
    down_alt: "s",
    left_alt: "a",
    right_alt: "d",
    pause: "escape",
    ability: " ",
    codex: "c"
};

// Current keymap (loaded from save or default)
var keymap = {};

// Action labels for display
var KEYMAP_ACTIONS = [
    { id: "up", label: "SU", desc: "Muovi in alto" },
    { id: "down", label: "GIU", desc: "Muovi in basso" },
    { id: "left", label: "SINISTRA", desc: "Muovi a sinistra" },
    { id: "right", label: "DESTRA", desc: "Muovi a destra" },
    { id: "up_alt", label: "SU (ALT)", desc: "Muovi in alto (WASD)" },
    { id: "down_alt", label: "GIU (ALT)", desc: "Muovi in basso (WASD)" },
    { id: "left_alt", label: "SINISTRA (ALT)", desc: "Muovi a sinistra (WASD)" },
    { id: "right_alt", label: "DESTRA (ALT)", desc: "Muovi a destra (WASD)" },
    { id: "pause", label: "PAUSA", desc: "Pausa / Indietro" },
    { id: "ability", label: "ABILITA", desc: "Usa abilita (Spazio)" },
    { id: "codex", label: "CODEX", desc: "Apri codex" }
];

// Load keymap from localStorage
function loadKeymap() {
    try {
        var saved = JSON.parse(localStorage.getItem("snake_keymap"));
        if (saved) {
            keymap = {};
            for (var k in DEFAULT_KEYMAP) {
                keymap[k] = saved[k] || DEFAULT_KEYMAP[k];
            }
        } else {
            keymap = {};
            for (var k in DEFAULT_KEYMAP) {
                keymap[k] = DEFAULT_KEYMAP[k];
            }
        }
    } catch(e) {
        keymap = {};
        for (var k in DEFAULT_KEYMAP) {
            keymap[k] = DEFAULT_KEYMAP[k];
        }
    }
}

// Save keymap to localStorage
function saveKeymap() {
    localStorage.setItem("snake_keymap", JSON.stringify(keymap));
}

// Reset keymap to defaults
function resetKeymap() {
    keymap = {};
    for (var k in DEFAULT_KEYMAP) {
        keymap[k] = DEFAULT_KEYMAP[k];
    }
    saveKeymap();
}

// Get the key that maps to an action
function getKeyForAction(actionId) {
    return keymap[actionId] || DEFAULT_KEYMAP[actionId];
}

// Check if a key press matches an action
function isKeyMapped(key, actionId) {
    var k = key.toLowerCase();
    return k === getKeyForAction(actionId);
}

// Check if a key press matches any movement-related action
function isMovementKey(key) {
    var k = key.toLowerCase();
    return k === keymap.up || k === keymap.down || k === keymap.left || k === keymap.right ||
           k === keymap.up_alt || k === keymap.down_alt || k === keymap.left_alt || k === keymap.right_alt;
}

// Get movement direction from key
function getMovementDir(key) {
    var k = key.toLowerCase();
    if (k === keymap.up || k === keymap.up_alt) return [0, -1];
    if (k === keymap.down || k === keymap.down_alt) return [0, 1];
    if (k === keymap.left || k === keymap.left_alt) return [-1, 0];
    if (k === keymap.right || k === keymap.right_alt) return [1, 0];
    return null;
}

// Key mapping UI state
var keymapListening = false;
var keymapListeningAction = null;
var keymapIdx = 0;

// Format a key name for display
function formatKeyName(key) {
    if (!key) return "?";
    var k = key.toLowerCase();
    if (k === " ") return "SPAZIO";
    if (k === "arrowup") return "SU";
    if (k === "arrowdown") return "GIU";
    if (k === "arrowleft") return "SX";
    if (k === "arrowright") return "DX";
    if (k === "escape") return "ESC";
    if (k === "enter") return "INVIO";
    if (k === "backspace") return "BACK";
    if (k === "shift") return "SHIFT";
    if (k === "control") return "CTRL";
    if (k === "alt") return "ALT";
    if (k === "tab") return "TAB";
    if (k.length === 1) return k.toUpperCase();
    return k.toUpperCase();
}

// Initialize on load
loadKeymap();
