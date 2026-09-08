// Banc : rejoue SEUILS, couleurClasse, couleurPour et legendeHTML EXTRAITS du fichier servi.
// Rien n'est recopié : si le code change, le banc change avec lui.
const fs = require('fs');
const SRC = fs.readFileSync(process.argv[2], 'utf8');

function extraire(motif, quoi) {
    const m = SRC.match(motif);
    if (!m) { console.error('INTROUVABLE dans la source : ' + quoi); process.exit(2); }
    return m[0];
}

const bloc = [
    extraire(/const SEUILS = \[[\s\S]*?\];/, 'SEUILS'),
    extraire(/function couleurClasse\(n\) \{[^\n]*\}/, 'couleurClasse'),
    extraire(/function couleurPour\(t0\) \{[\s\S]*?\n    \}/, 'couleurPour'),
    extraire(/function legendeHTML\(\) \{[\s\S]*?\n    \}/, 'legendeHTML'),
].join('\n');

const VALID_DAYS = 90, D_MS = 86400000;
const t = k => ({ lgUnit: ' j', lgExpired: 'EXPIRE', lgPerm: 'PERM', lgApprox: 'APPROX', lgNone: 'AUCUN' }[k] || k);
const ctx = { VALID_DAYS, D_MS, t };
const fn = new Function('VALID_DAYS', 'D_MS', 't', bloc + '\nreturn {SEUILS, couleurClasse, couleurPour, legendeHTML};');
const api = fn(ctx.VALID_DAYS, ctx.D_MS, ctx.t);

let ko = 0;
const eq = (nom, obtenu, attendu) => {
    const ok = obtenu === attendu;
    if (!ok) ko++;
    console.log((ok ? '  ok   ' : '  ECHEC') + ' ' + nom + ' -> ' + obtenu + (ok ? '' : '   (attendu ' + attendu + ')'));
};

console.log('--- couleurClasse, aux BORNES ---');
[[91, 'wda-vert'], [61, 'wda-vert'], [60, 'wda-jaune'], [31, 'wda-jaune'],
 [30, 'wda-orange'], [15, 'wda-orange'], [14, 'wda-rouge'], [1, 'wda-rouge'],
 [0, 'wda-gris'], [-7, 'wda-gris']].forEach(([n, c]) => eq('J' + n, api.couleurClasse(n), c));

console.log('--- couleurPour : une trace expiree ne doit plus etre ROUGE ---');
const jours = n => Date.now() - (VALID_DAYS + n) * D_MS;   // expire depuis n jours
eq('expire depuis 10 j', api.couleurPour(jours(10)), '#9e9e9e');
eq('roule il y a 80 j (J-10)', api.couleurPour(Date.now() - 80 * D_MS), '#e53935');

console.log('--- legendeHTML : les intervalles DERIVENT de SEUILS ---');
const txt = api.legendeHTML().replace(/<[^>]+>/g, '|').replace(/\|+/g, '|');
console.log('  ' + txt);
[' > 60 j', '31–60 j', '15–30 j', '1–14 j', 'EXPIRE', 'AUCUN', 'PERM', 'APPROX']
    .forEach(s => eq('contient "' + s.trim() + '"', txt.includes(s.trim()), true));
eq('une ligne par entree (8)', (api.legendeHTML().match(/wda-lg/g) || []).length, 8);
eq('la pastille hachuree est presente', api.legendeHTML().includes('wda-sw wda-approx'), true);

console.log(ko ? '\n' + ko + ' ECHEC(S)' : '\nTOUT PASSE');
process.exit(ko ? 1 : 0);
