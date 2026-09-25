// Banc : les bornes du code couleur, la légende qui en découle, et la LISIBILITÉ des pastilles.
// Tout vient du fichier servi (bancs/charger.js) : la 0.06.00 recopiait VALID_DAYS ici, et une
// durée portée à 120 jours passait sans un mot (audit du 25/09/2026).
const { charger } = require('./charger.js');
const W = charger(process.argv[2]);
const { VALID_DAYS, D_MS } = W;
W.regler({ lang: 'fr' });

let ko = 0;
const eq = (nom, obtenu, attendu) => {
    const ok = obtenu === attendu;
    if (!ok) ko++;
    console.log((ok ? '  ok   ' : '  ECHEC') + ' ' + nom + ' -> ' + obtenu + (ok ? '' : '   (attendu ' + attendu + ')'));
};

console.log('--- couleurClasse, aux BORNES ---');
[[91, 'wda-vert'], [61, 'wda-vert'], [60, 'wda-jaune'], [31, 'wda-jaune'],
 [30, 'wda-orange'], [15, 'wda-orange'], [14, 'wda-rouge'], [1, 'wda-rouge'],
 [0, 'wda-gris'], [-7, 'wda-gris']].forEach(([n, c]) => eq('J' + n, W.couleurClasse(n), c));

console.log('--- couleurPour : une trace expirée ne doit plus être ROUGE ---');
eq('expiré depuis 10 j', W.couleurPour(Date.now() - (VALID_DAYS + 10) * D_MS), '#9e9e9e');
eq('roulé il y a VALID_DAYS − 10 j (J-10)', W.couleurPour(Date.now() - (VALID_DAYS - 10) * D_MS), '#e53935');

console.log('--- legendeHTML : les intervalles DÉRIVENT de SEUILS ---');
const lg = W.legendeHTML();
const txt = lg.replace(/<[^>]+>/g, '|').replace(/\|+/g, '|');
console.log('  ' + txt);
for (const s of ['> 60', '31–60', '15–30', '1–14']) eq('contient « ' + s + ' »', txt.includes(s), true);
eq('une ligne par entrée (8)', (lg.match(/class="wda-lg"/g) || []).length, 8);
eq('la pastille hachurée est présente', lg.includes('wda-sw wda-approx'), true);

// ── Lisibilité : le chiffre des pastilles de « Vos trajets » (11 px) doit tenir 4,5:1 (WCAG 1.4.3).
// Audit : blanc sur jaune 2,48:1, blanc sur orange 2,98:1 — la tranche 15-60 j, celle où l'on
// prévoit un trajet. Les couleurs sont LUES dans le CSS livré.
console.log('--- contraste du texte des pastilles (WCAG 1.4.3, 4,5:1) ---');
const lum = hex => {
    const c = hex.replace('#', '');
    const v = [0, 2, 4].map(i => { const x = parseInt(c.substr(i, 2), 16) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
};
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
const long = h => h.length === 4 ? '#' + h.slice(1).split('').map(x => x + x).join('') : h;
const base = W.CSS.match(/wz-card\.drive-list-item \.wda-jm\{[^}]*?color:(#[0-9a-fA-F]{3,6})/);
for (const cls of ['wda-rouge', 'wda-orange', 'wda-jaune', 'wda-vert', 'wda-gris', 'wda-bleu']) {
    const re = new RegExp('wz-card\\.drive-list-item \\.wda-jm\\.' + cls + '\\{([^}]*)\\}');
    const r = W.CSS.match(re);
    if (!r) { ko++; console.log('  ECHEC règle .wda-jm.' + cls + ' introuvable'); continue; }
    const fond = (r[1].match(/background:(#[0-9a-fA-F]{3,6})/) || [])[1];
    const texte = (r[1].match(/(?:^|;)color:(#[0-9a-fA-F]{3,6})/) || [])[1] || (base && base[1]);
    const q = ratio(long(texte), long(fond));
    const ok = q >= 4.5;
    if (!ok) ko++;
    console.log((ok ? '  ok   ' : '  ECHEC') + ' ' + cls.padEnd(11) + texte + ' sur ' + fond + ' : ' + q.toFixed(2) + ':1');
}
// Témoin : le blanc sur le jaune de la 0.06.00 doit être refusé.
eq('témoin : blanc sur #c8a000 refusé', ratio('#ffffff', '#c8a000') < 4.5, true);

console.log(ko ? '\n' + ko + ' ECHEC(S)' : '\nTOUT PASSE');
process.exit(ko ? 1 : 0);
