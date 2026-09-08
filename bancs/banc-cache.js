// Banc : rejoue arrondi5 + ecrireCache EXTRAITS du fichier servi, contre un localStorage
// truque dont on choisit le quota.
const fs = require('fs');
const SRC = fs.readFileSync(process.argv[2], 'utf8');

function extraire(motif, quoi) {
    const m = SRC.match(motif);
    if (!m) { console.error('INTROUVABLE : ' + quoi); process.exit(2); }
    return m[0];
}
const bloc = [
    extraire(/const arrondi5 = [^\n]*/, 'arrondi5'),
    extraire(/function ecrireCache\(c\) \{[\s\S]*?\n    \}/, 'ecrireCache'),
].join('\n');

const D_MS = 86400000, PURGE_DAYS = 130, LS_KEY = 'wda.cache.v1';
let QUOTA = Infinity, journal = [];
const localStorage = {
    _v: null,
    setItem(k, v) {
        if (v.length > QUOTA) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
        this._v = v;
    },
};
const log = m => journal.push(m);
const fn = new Function('D_MS', 'PURGE_DAYS', 'LS_KEY', 'localStorage', 'log',
    bloc + '\nreturn {arrondi5, ecrireCache};');
const api = fn(D_MS, PURGE_DAYS, LS_KEY, localStorage, log);

let ko = 0;
const eq = (nom, obtenu, attendu) => {
    const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
    if (!ok) ko++;
    console.log((ok ? '  ok   ' : '  ECHEC') + ' ' + nom + ' -> ' + JSON.stringify(obtenu)
        + (ok ? '' : '   (attendu ' + JSON.stringify(attendu) + ')'));
};

// Un jeu realiste : n trajets, chacun p points en flottants pleine precision.
const jeu = (n, p, ageMax) => ({
    at: 0,
    drives: Array.from({ length: n }, (_, i) => ({
        id: 'id' + i,
        t: Date.now() - Math.round((i / n) * ageMax) * D_MS,
        bb: [1, 2, 3, 4],
        pts: Array.from({ length: p * 2 }, (_, j) => (j % 2 ? 48 : 2) + Math.sin(i * 7 + j) * 0.4),
    })),
});

console.log('--- 1. Arrondi a 5 decimales, et le poids qu il fait gagner ---');
const brut = jeu(300, 80, 60);
const avant = JSON.stringify(brut).length;
QUOTA = Infinity;
api.ecrireCache(brut);
const apres = localStorage._v.length;
console.log('  ' + Math.round(avant / 1024) + ' Ko avant, ' + Math.round(apres / 1024) + ' Ko apres'
    + ' (' + Math.round(100 - apres * 100 / avant) + ' % de moins)');
eq('gain d au moins 35 %', apres < avant * 0.65, true);
eq('5 decimales au plus', brut.drives[0].pts.every(x => String(x).split('.')[1] === undefined
    || String(x).split('.')[1].length <= 5), true);
eq('precision conservee a 1 m pres', Math.abs(brut.drives[0].pts[0]
    - JSON.parse(JSON.stringify(brut)).drives[0].pts[0]) < 1e-5, true);
eq('ecriture propre : tronque remis a zero', brut.tronque, 0);

console.log('--- 2. Le quota deborde : la perte doit se COMPTER, pas se taire ---');
journal = [];
const gros = jeu(300, 80, 60);
QUOTA = 400000;
const ok = api.ecrireCache(gros);
eq('l ecriture finit par passer', ok, true);
eq('180 trajets conserves', gros.drives.length, 180);
eq('120 trajets comptes comme perdus', gros.tronque, 120);
eq('les plus RECENTS sont gardes', gros.drives[0].t >= gros.drives[179].t, true);
eq('la console le dit aussi', journal.some(m => /quota/.test(m)), true);

console.log('--- 3. Une ecriture qui repasse doit EFFACER l alerte ---');
QUOTA = Infinity;
api.ecrireCache(gros);
eq('tronque efface', gros.tronque, 0);

console.log('--- 4. La purge des plus de 130 jours ---');
const vieux = jeu(10, 5, 400);
QUOTA = Infinity;
api.ecrireCache(vieux);
eq('aucun trajet de plus de 130 j', vieux.drives.every(d => (Date.now() - d.t) / D_MS <= PURGE_DAYS), true);
eq('les recents survivent', vieux.drives.length > 0, true);

console.log(ko ? '\n' + ko + ' ECHEC(S)' : '\nTOUT PASSE');
process.exit(ko ? 1 : 0);
