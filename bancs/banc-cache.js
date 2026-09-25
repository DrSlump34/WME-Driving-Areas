// Banc : le cache local, sur le code servi (bancs/charger.js), contre un localStorage dont on
// choisit le quota.
//
// Ce qu'il tient :
//  1. l'arrondi fait gagner du poids SANS perdre la précision — comparée à une copie des valeurs
//     d'ORIGINE (la 0.06.00 comparait la valeur arrondie à elle-même, et recopiait PURGE_DAYS) ;
//  2. une perte sous quota est COMPTÉE ; une écriture qui échoue tout à fait se dit AUTREMENT ;
//  3. la purge des trajets trop vieux se fait aussi à la LECTURE (un cache jamais réécrit les
//     gardait sans limite) ;
//  4. le cache appartient à UN compte : un autre compte ouvert dans le même navigateur n'hérite
//     pas de ses trajets (audit du 25/09/2026) ;
//  5. les clés de l'ancien nom (wac.*) sont retirées une fois reprises.
const { charger } = require('./charger.js');
const FICHIER = process.argv[2];
const J = 86400000;

let ko = 0;
const eq = (nom, obtenu, attendu) => {
    const ok = JSON.stringify(obtenu) === JSON.stringify(attendu);
    if (!ok) ko++;
    console.log((ok ? '  ok   ' : '  ECHEC') + ' ' + nom + ' -> ' + JSON.stringify(obtenu)
        + (ok ? '' : '   (attendu ' + JSON.stringify(attendu) + ')'));
};
const compte = id => ({ W: { loginManager: { user: { attributes: { id } } } } });
const jeu = (n, p, ageMax) => ({
    at: 0,
    drives: Array.from({ length: n }, (_, i) => ({
        id: 'id' + i,
        t: Date.now() - Math.round((i / n) * ageMax) * J,
        bb: [1, 2, 3, 4],
        pts: Array.from({ length: p * 2 }, (_, j) => (j % 2 ? 48 : 2) + Math.sin(i * 7 + j) * 0.4),
    })),
});

console.log('--- 1. Arrondi à 5 décimales : poids gagné, précision gardée ---');
{
    const W = charger(FICHIER, { window: compte(1) });
    const brut = jeu(300, 80, 60);
    const origine = JSON.parse(JSON.stringify(brut));     // copie AVANT l'arrondi
    const avant = JSON.stringify(brut).length;
    W.ecrireCache(brut);
    const apres = W.stockage[W.LS_KEY].length;
    console.log('  ' + Math.round(avant / 1024) + ' Ko avant, ' + Math.round(apres / 1024) + ' Ko après ('
        + Math.round(100 - apres * 100 / avant) + ' % de moins)');
    eq('gain d\'au moins 35 %', apres < avant * 0.65, true);
    eq('5 décimales au plus', brut.drives[0].pts.every(x => (String(x).split('.')[1] || '').length <= 5), true);
    const ecart = Math.max(...brut.drives[0].pts.map((x, i) => Math.abs(x - origine.drives[0].pts[i])));
    eq('écart à l\'ORIGINE ≤ 0,000005° (~0,5 m)', ecart <= 5e-6, true);
    eq('témoin : l\'arrondi a bien modifié les valeurs', ecart > 0, true);
    eq('écriture propre : aucune perte signalée', brut.tronque || 0, 0);
}

console.log('--- 2. Quota : une perte COMPTÉE ; un échec total, dit autrement ---');
{
    const W = charger(FICHIER, { window: compte(1) });
    const gros = jeu(300, 80, 60);
    W.fixerQuota(400000);
    eq('l\'écriture finit par passer', W.ecrireCache(gros), true);
    eq('180 trajets conservés', gros.drives.length, 180);
    eq('120 trajets comptés comme perdus', gros.tronque, 120);
    eq('les plus RÉCENTS sont gardés', gros.drives[0].t >= gros.drives[179].t, true);
    eq('la console le dit aussi', W.journal.some(m => /quota/.test(m)), true);
    W.fixerQuota(Infinity);
    W.ecrireCache(gros);
    eq('une écriture qui repasse efface l\'alerte', gros.tronque, 0);
    W.fixerQuota(10);
    const r = W.ecrireCache(gros);
    eq('rien ne passe : ecrireCache rend false', r, false);
    eq('… et le cache dit « non enregistré »', gros.echecEcriture, true);
    eq('… sans prétendre à une troncature', gros.tronque || 0, 0);
}

console.log('--- 3. Purge des plus de PURGE_DAYS jours, à l\'écriture ET à la lecture ---');
{
    const W = charger(FICHIER, { window: compte(1) });
    const vieux = jeu(10, 5, 400);
    W.ecrireCache(vieux);
    eq('écriture : aucun trajet au-delà de PURGE_DAYS', vieux.drives.every(d => (Date.now() - d.t) / J <= W.PURGE_DAYS), true);
    eq('écriture : les récents survivent', vieux.drives.length > 0, true);
    const W2 = charger(FICHIER, { window: compte(1), stockage: { 'wda.cache.v1': JSON.stringify({ at: 1, owner: 1, drives: [
        { id: 'ancien', t: Date.now() - (W.PURGE_DAYS + 20) * J, bb: null, pts: [] },
        { id: 'recent', t: Date.now() - 10 * J, bb: null, pts: [] }] }) } });
    eq('lecture : le trajet trop vieux est écarté', W2.lireCache().drives.map(d => d.id), ['recent']);
}

console.log('--- 4. Le cache appartient à UN compte ---');
{
    const stock = { 'wda.cache.v1': JSON.stringify({ at: 5, owner: 1, drives: [{ id: 'a', t: Date.now() - J, bb: null, pts: [] }] }) };
    const autre = charger(FICHIER, { window: compte(2), stockage: stock });
    eq('un autre compte ne reçoit AUCUN trajet', autre.lireCache().drives.length, 0);
    const meme = charger(FICHIER, { window: compte(1), stockage: stock });
    eq('le même compte retrouve les siens', meme.lireCache().drives.length, 1);
    const sansProprio = charger(FICHIER, { window: compte(7), stockage: { 'wda.cache.v1': JSON.stringify({ at: 5, drives: [{ id: 'b', t: Date.now() - J, bb: null, pts: [] }] }) } });
    const c = sansProprio.lireCache();
    eq('un cache d\'avant la 0.07.00 est adopté par le compte courant', [c.drives.length, c.owner], [1, 7]);
}

console.log('--- 5. Les clés de l\'ancien nom (wac.*) sont retirées une fois reprises ---');
{
    const W = charger(FICHIER, { window: compte(1), stockage: {
        'wac.cache.v1': JSON.stringify({ at: 5, drives: [{ id: 'x', t: Date.now() - J, bb: null, pts: [] }] }),
        'wac.opts.v1': JSON.stringify({ calque: true }) } });
    eq('historique repris', W.lireCache().drives.length, 1);
    eq('wac.cache.v1 retirée, wda.cache.v1 écrite', ['wac.cache.v1' in W.stockage, 'wda.cache.v1' in W.stockage], [false, true]);
    eq('options reprises', W.lireOpts().calque, true);
    eq('wac.opts.v1 retirée, wda.opts.v1 écrite', ['wac.opts.v1' in W.stockage, 'wda.opts.v1' in W.stockage], [false, true]);
}

console.log('--- 6. Une trace illisible n\'est ni « ajoutée », ni oubliée : elle se redemande ---');
(async () => {
    // Deux trajets : « bon » rend sa trace ; « rate » échoue la première fois (HTTP 500), puis passe.
    // Un troisième, « vide », n'a roulé aucune route (0 m) : mémorisé sans trace, sans échec.
    let tentativeRate = 0;
    const trace = { archiveSessions: { objects: [{ driveParts: [{ geometry: { coordinates: [[2, 48], [2.01, 48]] } }] }] } };
    const reponse = (ok, corps) => Promise.resolve({ ok, status: ok ? 200 : 500, json: () => Promise.resolve(corps) });
    const reseau = url => {
        if (/Archive\/List/.test(url)) {
            const offset = +(url.match(/offset=(\d+)/) || [0, 0])[1];
            return reponse(true, { archives: { objects: offset ? [] : [
                { id: 'bon', startTime: Date.now() - 2 * J, totalRoadMeters: 900 },
                { id: 'rate', startTime: Date.now() - 3 * J, totalRoadMeters: 1200 },
                { id: 'vide', startTime: Date.now() - 4 * J, totalRoadMeters: 0 }] } });
        }
        if (/id=rate/.test(url)) return ++tentativeRate === 1 ? reponse(false, {}) : reponse(true, trace);
        if (/id=vide/.test(url)) return reponse(true, { archiveSessions: { objects: [] } });
        return reponse(true, trace);
    };
    const W = charger(FICHIER, { window: compte(1), fetch: reseau });
    const c = { at: 0, drives: [], owner: 1 };
    W.regler({ cache: c });
    const r1 = await W.chargerHistorique();
    eq('1er chargement : 2 ajoutés (bon, vide), 1 échec', [r1.ajoutes, r1.echecs], [2, 1]);
    eq('l\'échec est gardé pour être repris', (W.etat().cache.aReprendre || []).map(a => a.id), ['rate']);
    const r2 = await W.chargerHistorique();
    eq('2e chargement : la trace ratée est reprise et ajoutée', [r2.ajoutes, r2.echecs], [1, 0]);
    eq('les trois trajets sont en cache', W.etat().cache.drives.map(d => d.id).sort(), ['bon', 'rate', 'vide']);
    eq('plus rien à reprendre', W.etat().cache.aReprendre, []);
    console.log(ko ? '\n' + ko + ' ECHEC(S)' : '\nTOUT PASSE');
    process.exit(ko ? 1 : 0);
})();
