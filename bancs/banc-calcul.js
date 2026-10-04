// Banc : LE CALCUL DE LA DATE, sur le code servi (bancs/charger.js). Il manquait : les trois autres
// bancs passaient tous avec une durée de droit portée de 90 à 120 jours (audit du 25/09/2026).
//
// La règle qu'il tient est celle du §8.4 : le script ne doit JAMAIS annoncer plus de temps qu'il
// n'en reste. Chaque cas vient de l'audit, chiffré, et a été vu ÉCHOUER sur la 0.06.00 :
//   · 9 h restantes affichées « 1 j » ; 14,2 j affichés 15 (orange au lieu de rouge) ;
//   · une recherche élargie rendue en estimation pleine, alors que ce n'est qu'une borne haute ;
//   · une borne « ≤ N j » lâche avec un cache jeune ; un changement d'heure qui repousse la date ;
//   · un rayon supposé (WME ne l'a pas donné) sans que rien ne le dise ;
//   · un ∞ posé sur un trajet sorti de la zone gérée.
//
//   node bancs/banc-calcul.js WME-Driving-Areas.user.js
process.env.TZ = 'Europe/Paris';
const { charger } = require('./charger.js');
const FICHIER = process.argv[2];

let ko = 0;
const chk = (nom, cond, detail) => {
    if (!cond) ko++;
    console.log((cond ? '  ok   ' : '  ECHEC') + ' ' + nom + (cond || detail === undefined ? '' : '\n         -> ' + detail));
};

const MAINTENANT = new Date(2026, 9, 1, 12, 0).getTime();   // 01/10/2026 12:00, heure de Paris
const H = 3600000, J = 86400000;
const P = [2.0, 48.0];                                       // le point regardé
const kmLon = km => km / (111.32 * Math.cos(48 * Math.PI / 180));
// Une trace de deux points, à `km` à l'est du point regardé, roulée à l'instant `t`.
const trajet = (id, t, km) => {
    const pts = [P[0] + kmLon(km), P[1], P[0] + kmLon(km + 0.5), P[1]];
    return { id, t, bb: [pts[0], P[1], pts[2], P[1]], pts };
};
const carre = (cx, cy, r) => ({ type: 'Polygon', coordinates: [[[cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r], [cx - r, cy - r]]] });
const ZONE = carre(P[0], P[1], 0.5);                         // zone de roulage autour du point
const zones = (extra = {}) => Object.assign({ drive: [ZONE], managed: [], miles: 4, rayonLu: true, countries: [] }, extra);
const SDK = { DataModel: { Countries: { getTopCountry: () => null } } };

const W = charger(FICHIER, { maintenant: MAINTENANT });
W.regler({ sdk: SDK, lang: 'fr', opts: { commeEditeur: false } });
const verdict = (drives, z = zones()) => {
    W.regler({ cache: { at: MAINTENANT, drives }, zones: z });
    const v = W.evaluer(P[0], P[1]);
    return { v, b: W.texteBadge(v) };
};
const pastille = (d, z = zones()) => {
    W.regler({ cache: { at: MAINTENANT, drives: [d] }, zones: z });
    const carte = { children: [], appendChild(e) { this.children.push(e); } };
    W.poserEcheance(carte, d.id);
    return carte.children[0] || {};
};

console.log('--- 0. La durée du droit est celle de Waze depuis novembre 2025 : 63 jours ---');
// Jusqu'à la 0.07.04 ce banc exigeait 90 : il VALIDAIT la règle périmée du Wazeopedia. Un banc ne vaut
// que ce que vaut sa source (annonce staff 391372, notification WME du 02/11/2025).
chk('VALID_DAYS = 63 (témoin : 90 doit faire échouer ce banc)', W.VALID_DAYS === 63, W.VALID_DAYS);

console.log('--- 1. Moins d\'un jour restant : ni « 1 j », ni « expiré » ---');
{
    // Le cas de SpeedyRom1 : trajet du 31/07 à 10 h ⇒ fin le 02/10 à minuit ; le 01/10 à midi, 12 h.
    const d = trajet('neufh', new Date(2026, 6, 31, 10, 0).getTime(), 1);
    const { b } = verdict([d]);
    chk('le badge ne dit pas « ~1 j »', !/~1 j/.test(b.txt), b.txt);
    chk('le badge dit « < 1 j »', /< ?1\s?j/.test(b.txt), b.txt);
    chk('le badge est ROUGE (pas gris « expiré »)', /wda-rouge/.test(b.cls), b.cls);
    const e = pastille(d);
    chk('la pastille dit J-0', e.textContent === 'J-0', e.textContent);
    chk('la pastille est rouge', /wda-rouge/.test(e.className), e.className);
    chk('le calque la peint en rouge', W.couleurPour(d.t) === '#e53935', W.couleurPour(d.t));
}

console.log('--- 2. 14,2 jours restants : 14, rouge — jamais 15, orange ---');
{
    // Trajet du 14/08 ⇒ fin le 16/10 à minuit : 14,5 j le 01/10 à midi.
    const d = trajet('quatorze', new Date(2026, 7, 14, 10, 0).getTime(), 1);
    const { b } = verdict([d]);
    chk('le badge dit 14 j', /~14 j/.test(b.txt), b.txt);
    chk('le badge est rouge', /wda-rouge/.test(b.cls), b.cls);
    const e = pastille(d);
    chk('la pastille dit J-14', e.textContent === 'J-14', e.textContent);
    chk('le calque la peint en rouge', W.couleurPour(d.t) === '#e53935', W.couleurPour(d.t));
}

console.log('--- 3. Un droit expiré depuis 5,5 jours ---');
{
    // Trajet du 25/07 ⇒ fin le 26/09 à minuit : expiré depuis 5,5 j.
    const d = trajet('expire', new Date(2026, 6, 25, 10, 0).getTime(), 1);
    const e = pastille(d);
    chk('la pastille dit J+5', e.textContent === 'J+5', e.textContent);
    chk('la pastille est grise', /wda-gris/.test(e.className), e.className);
    const { b } = verdict([d]);
    chk('le badge dit expiré, en gris', /expir/.test(b.txt) && /wda-gris/.test(b.cls), b.txt + ' / ' + b.cls);
}

console.log('--- 4. Recherche élargie : une BORNE HAUTE, hachurée, jamais une estimation pleine ---');
{
    // A : il y a 50 j à 7 km ; B : il y a 5 j à 15 km. Rayon nominal 6,437 km : aucun ; élargi : les deux.
    const A = trajet('A', MAINTENANT - 50 * J, 7), B = trajet('B', MAINTENANT - 5 * J, 15);
    const { v, b } = verdict([A, B]);
    chk('le calcul passe bien par la recherche élargie', v.elargi === true, JSON.stringify({ elargi: v.elargi }));
    chk('le badge est une borne « ≤ »', /^≤/.test(b.txt), b.txt);
    chk('le badge est HACHURÉ', /wda-approx/.test(b.cls), b.cls);
}

console.log('--- 5. Borne « ≤ N j » avec un cache jeune : l\'archive remonte au moins ~59 j ---');
{
    // Point dans la zone de roulage, aucun trajet proche ; le plus vieux trajet en cache a 20 j.
    const loin = trajet('loin', MAINTENANT - 20 * J, 300);
    const { b } = verdict([loin]);
    chk('borne resserrée à ≤ 4 j (63 − 59), et non 43', /≤ 4 j/.test(b.txt), b.txt);
    chk('toujours hachurée', /wda-approx/.test(b.cls), b.cls);
}

console.log('--- 6. Date UTC et changement d\'heure : la date de fin n\'est jamais repoussée ---');
{
    // 02/02 00:30 à Paris = 01/02 23:30 UTC : daté du 01/02 en UTC. Le 63e jour après le 01/02 est le
    // 05/04 ; minuit UTC du 05/04 = 02:00 à Paris (heure d'été, le changement tombe le 29/03).
    // Les autres lectures donnent plus tard (06/04 00:00 locale, 06/04 00:30 ou 01:30).
    const t0 = new Date(2026, 1, 2, 0, 30).getTime();
    const W2 = charger(FICHIER, { maintenant: new Date(2026, 2, 1, 12, 0).getTime() });
    W2.regler({ sdk: SDK, lang: 'fr', cache: { at: 0, drives: [trajet('dst', t0, 1)] }, zones: zones() });
    const v = W2.evaluer(P[0], P[1]);
    const attendu = new Date(2026, 3, 5, 2, 0).getTime();
    chk('échéance = 05/04 02:00 (minuit UTC, la plus précoce), pas le 06/04', v.expireLe === attendu,
        new Date(v.expireLe).toString());
}

console.log('--- 7. Rayon non fourni par WME : le verdict le DIT ---');
{
    const W3 = charger(FICHIER, { maintenant: MAINTENANT, window: { W: { loginManager: { user: { attributes: {
        areas: [{ type: 'drive', geometry: ZONE }], editableCountryIDs: [] } } } } } });
    W3.regler({ sdk: SDK, lang: 'fr', cache: { at: MAINTENANT, drives: [trajet('r', MAINTENANT - 40 * J, 1)] }, zones: null });
    const v = W3.evaluer(P[0], P[1]);
    const b = W3.texteBadge(v);
    chk('le verdict est hachuré', /wda-approx/.test(b.cls), b.cls);
    chk('l\'infobulle dit que le rayon est supposé', /suppos/i.test(b.title), b.title);
}

console.log('--- 8. ∞ : seulement si TOUT le trajet est dans une zone gérée ---');
{
    const GEREE = carre(P[0] + kmLon(1), P[1], 0.02);           // petite zone gérée autour du départ
    const sortant = { id: 'sortant', t: MAINTENANT - 10 * J, bb: null,
        pts: [P[0] + kmLon(1), P[1], P[0] + kmLon(20), P[1], P[0] + kmLon(40), P[1]] };
    sortant.bb = [sortant.pts[0], P[1], sortant.pts[4], P[1]];
    W.regler({ zones: zones({ managed: [GEREE] }) });
    chk('un trajet qui sort de la zone gérée n\'est pas « zone »', W.permanenceDuTrajet(sortant) !== 'zone',
        W.permanenceDuTrajet(sortant));
    const dedans = { id: 'dedans', t: MAINTENANT - 10 * J, bb: null, pts: [P[0] + kmLon(1), P[1], P[0] + kmLon(1.2), P[1]] };
    chk('un trajet entièrement dedans est « zone »', W.permanenceDuTrajet(dedans) === 'zone', W.permanenceDuTrajet(dedans));
    const e = pastille(trajet('pays', MAINTENANT - 10 * J, 1), zones({ countries: [73] }));
    chk('∞ PRÉSUMÉ (pays géré) : pastille hachurée', e.textContent === '∞' && /wda-approx/.test(e.className), e.textContent + ' / ' + e.className);
}

// ⭐ 0.09.00 — LE RAYON, RECALCULÉ COMME WME (bundle v2.370, relevé le 04/10/2026) : niveau = rang + 1
// plafonné à 6 ; niveau 1 → 1 mile, 2 → 2, 3 → 3, 4 et plus → 4. Mesuré dans WME : rang 5 ⇒ 4 = W.
console.log('\n--- Le rayon se déduit du rang, selon la règle de WME ---');
if (typeof W.milesDuRang !== 'function') { chk('milesDuRang existe', false, typeof W.milesDuRang); }
else {
    const obtenu = [0, 1, 2, 3, 4, 5, 6].map(W.milesDuRang);
    chk('rangs 0 à 6 ⇒ 1, 2, 3, 4, 4, 4, 4 miles', JSON.stringify(obtenu) === '[1,2,3,4,4,4,4]', JSON.stringify(obtenu));
    W.regler({ compte: { rank: 5, areas: [], countries: [] } });
    const z = W.lireZones();
    chk('rang 5 lu : 4 miles, et le rayon est dit LU', z.miles === 4 && z.rayonLu === true, z.miles + ' / ' + z.rayonLu);
    W.regler({ compte: { rank: null } });
    const z2 = W.lireZones();
    chk('rang illisible : rayon par défaut, dit SUPPOSÉ', z2.rayonLu === false, z2.miles + ' / ' + z2.rayonLu);
}

console.log(ko ? '\n' + ko + ' ECHEC(S)' : '\nTOUT PASSE');
process.exit(ko ? 1 : 0);
