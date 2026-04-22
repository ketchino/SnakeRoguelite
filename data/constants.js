/* ===== COSTANTI & UTILITY ===== */
var CS = 26;
var HC = CS / 2;

function h2r(h, a) {
    return "rgba(" + parseInt(h.slice(1, 3), 16) + "," + parseInt(h.slice(3, 5), 16) + "," + parseInt(h.slice(5, 7), 16) + "," + a + ")";
}

function hRGB(h) {
    return { r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) };
}

function rcClass(ra) {
    return ra === "comune" ? "common-txt" : ra === "raro" ? "rare-txt" : ra === "epico" ? "epic-txt" : ra === "leggendaria" ? "legendary-txt" : "mythic-txt";
}
