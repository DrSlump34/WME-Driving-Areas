// Banc : les 8 langues doivent porter EXACTEMENT les mêmes clés. Une clé oubliée retombe
// silencieusement sur l'anglais — le défaut ne se voit qu'en changeant de langue.
// Le dictionnaire est ÉVALUÉ, pas lu au motif : plusieurs clés tiennent sur une même ligne,
// et une lecture au motif en manquait onze sans rien dire.
const fs = require('fs');
const SRC = fs.readFileSync(process.argv[2], 'utf8');
const bloc = SRC.match(/const DICO = \{[\s\S]*?\n    \};/)[0];
const DICO = new Function('SCRIPT_NAME', bloc + '\nreturn DICO;')('WME Driving Areas');

const noms = Object.keys(DICO);
const ref = Object.keys(DICO.fr);
let ko = 0;
console.log('fr : ' + ref.length + ' clés — référence');
for (const n of noms) {
    const k = Object.keys(DICO[n]);
    const manque = ref.filter(x => !k.includes(x));
    const extra = k.filter(x => !ref.includes(x));
    const vides = k.filter(x => DICO[n][x] === undefined || DICO[n][x] === '');
    const ok = !manque.length && !extra.length && !vides.length;
    if (!ok) ko++;
    console.log('  ' + (ok ? 'ok   ' : 'ECHEC') + ' ' + n.padEnd(7) + String(k.length).padStart(3)
        + (manque.length ? '  MANQUE: ' + manque.join(', ') : '')
        + (extra.length ? '  EN TROP: ' + extra.join(', ') : '')
        + (vides.length ? '  VIDE: ' + vides.join(', ') : ''));
}

// Toute clé appelée par t() doit exister, et toute clé du dico doit servir.
const appelees = [...new Set([...SRC.matchAll(/\bt\('([A-Za-z0-9]+)'/g)].map(m => m[1]))];
const orphelines = appelees.filter(k => !ref.includes(k));
const jamais = ref.filter(k => !appelees.includes(k));
if (orphelines.length) ko++;
console.log('  ' + (orphelines.length ? 'ECHEC' : 'ok   ') + ' clés appelées mais absentes du dico : '
    + (orphelines.join(', ') || 'aucune'));
console.log('  info  clés jamais appelées par t() : ' + (jamais.join(', ') || 'aucune'));

// Les nouvelles clés de la 0.06.00 doivent être RÉELLEMENT traduites, pas recopiées du français.
console.log('--- traduction effective des clés ajoutées ---');
for (const k of ['pLegend', 'lgExpired', 'lgPerm', 'lgApprox', 'lgNone']) {
    const copie = noms.filter(n => n !== 'fr' && n !== 'pt-PT' && DICO[n][k] === DICO.fr[k]);
    const ok = copie.length === 0;
    if (!ok) ko++;
    console.log('  ' + (ok ? 'ok   ' : 'ECHEC') + ' ' + k.padEnd(10)
        + (ok ? 'distincte dans les 8' : 'identique au français en ' + copie.join(', ')));
}
console.log(ko ? '\n' + ko + ' ECHEC(S)' : '\nTOUT PASSE — ' + noms.length + ' langues, ' + ref.length + ' clés chacune');
process.exit(ko ? 1 : 0);
