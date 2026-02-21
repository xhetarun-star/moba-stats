const fs = require('fs');
const path = require('path');

const HERO_ROLES = {
    "Son Goku Super": "Attaquant",
    "Piccolo": "Attaquant",
    "Dabra": "Attaquant",
    "Kale": "Attaquant",
    "Son Goku Mini": "Attaquant",
    "Bojack": "Attaquant",
    "Gamma 1 et 2": "Attaquant",
    "C-18": "Attaquant",
    "Son Goku Sayen": "Attaquant",
    "Broly": "Attaquant",
    "Super Uub": "Attaquant",
    "Trunks Jeune": "Attaquant",
    "Toppo": "Attaquant",
    "Vegito": "Attaquant",
    "Gogeta 4": "Attaquant",
    "Janemba": "Attaquant",
    "Jiren": "Attaquant",
    "Kefla": "Attaquant",
    "Vegeta Sayen": "Défenseur",
    "Zamasu": "Défenseur",
    "Baby Juvénile": "Défenseur",
    "Caulifla Sayen 2": "Défenseur",
    "Cooler": "Défenseur",
    "Cell": "Défenseur",
    "Vegeta 4": "Défenseur",
    "Bardock": "Défenseur",
    "Buu": "Soutien",
    "Krillin": "Soutien",
    "Son Gohan Petit": "Soutien",
    "Frieza 1": "Soutien",
    "C-17": "Soutien",
    "Gotenks": "Soutien",
    "Hit": "Soutien",
    "Ultimate Gohan": "Soutien"
};

const normalizeHeroName = (name) => {
    if (!name) return "Unknown";
    let n = name.trim();
    if (n === "C18" || n === "c18") return "C-18";
    if (n === "C17" || n === "c17") return "C-17";
    if (n === "son Goku" || n === "Son Goku") return "Son Goku Sayen";
    if (n === "son Goku Super Sayen" || n === "Son Goku Super Sayen" || n === "Son Goku Super Sayen") return "Son Goku Super";
    if (n === "ultimate Gohan" || n === "Ultimate Gohan") return "Ultimate Gohan";
    if (n === "Broly" || n === "broly") return "Broly";
    if (n === "cell" || n === "Cell") return "Cell";
    return n;
};

const mapRole = (hero) => HERO_ROLES[hero] || 'Attaquant';

const rawData = fs.readFileSync(path.join(__dirname, 'matches_raw.txt'), 'utf8');
const lines = rawData.trim().split('\n');
const matches = lines.map((line, index) => {
    // Some lines might use multiple spaces instead of tabs depending on how it was pasted
    const parts = line.split(/\t/).map(s => s.trim());
    if (parts.length < 11) {
        // Fallback for space-separated if tabs are missing
        const spaceParts = line.split(/\s{2,}/).map(s => s.trim());
        if (spaceParts.length < 11) return null;
        return processParts(spaceParts, index);
    }
    return processParts(parts, index);
}).filter(m => m !== null);

function processParts(parts, index) {
    let xHero = normalizeHeroName(parts[3]);
    let jHero = normalizeHeroName(parts[4]);

    // Handle special case like "Piccolo+vegeta 4" or the like in columns
    if (parts[11] && parts[11].includes('Piccolo+vegeta 4')) {
        xHero = "Piccolo";
        jHero = "Vegeta 4";
    }

    // Some lines have "son Goku" in hero column but "son Goku Super Sayen" in duo column
    // The user said: first name = me, next numbers = KDA, second name = j9...

    return {
        id: `final-import-${index}`,
        date: parts[0],
        result: (parts[2].toUpperCase().includes('VICTOIRE') || parts[2].toUpperCase().includes('WIN')) ? 'Win' : 'Loss',
        userStats: {
            hero: xHero,
            role: mapRole(xHero),
            kills: parseInt(parts[5] || 0),
            deaths: parseInt(parts[6] || 0),
            assists: parseInt(parts[7] || 0)
        },
        mateStats: {
            hero: jHero,
            role: mapRole(jHero),
            kills: parseInt(parts[8] || 0),
            deaths: parseInt(parts[9] || 0),
            assists: parseInt(parts[10] || 0)
        }
    };
}

console.log(`${matches.length} matches importés avec précision.`);
fs.writeFileSync(path.join(__dirname, 'imported_stats.json'), JSON.stringify(matches, null, 2));
