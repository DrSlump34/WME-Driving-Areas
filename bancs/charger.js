// Charge le FICHIER SERVI dans une machine virtuelle et en expose les fonctions internes.
//
// Rien n'est recopié : on injecte, juste avant `const init`, une ligne qui publie les fonctions
// du script et un moyen de régler son état (cache, zones, options, SDK). Si le code change, les
// bancs changent avec lui — c'était le défaut des bancs de la 0.06.00, qui recopiaient
// VALID_DAYS et PURGE_DAYS et laissaient donc passer une durée portée de 90 à 120 jours.
//
//   const { charger } = require('./charger.js');
//   const W = charger(fichier, { stockage, maintenant });
//   W.regler({ cache, zones, opts, sdk }); W.evaluer(lon, lat) …
const fs = require('fs');
const vm = require('vm');

const EXPOSE = [
    'VALID_DAYS', 'PURGE_DAYS', 'D_MS', 'ELARGI', 'SEUILS', 'LS_KEY', 'LS_OPT', 'LS_KEY_OLD', 'LS_OPT_OLD',
    'dernierPassage', 'ageArchiveJours', 'evaluer', 'texteBadge', 'couleurClasse', 'couleurPour',
    'legendeHTML', 'lireCache', 'ecrireCache', 'lireOpts', 'arrondi5', 'poserEcheance', 'permanenceDuTrajet',
    'lireZones', 'DICO', 'CSS',
    // Ajoutées en 0.07.00 ; absentes d'une version plus ancienne, elles valent undefined.
    'restant', 'echeance', 'nCouleur', 'ARCHIVE_MIN_J', 'traceDe', 'chargerHistorique', 'proprietaire',
    'buildPane',
    // 0.09.00 : le rayon recalculé depuis le rang (plus de W.loginManager.user.editableMiles).
    'milesDuRang',
];

// `compte` : le compte connecté ({ id, rank, areas, countries… }). Depuis la 0.09.00 (plus de `W`), le
// script le lit au démarrage dans `_compte` ; le banc le pose directement.
function charger(fichier, { stockage = {}, maintenant = null, window: fenetre = {}, fetch: reseau = null, compte = null } = {}) {
    let src = fs.readFileSync(fichier, 'utf8');
    const ancre = '    const init = async () => {';
    if (!src.includes(ancre)) throw new Error('ancre « const init » introuvable dans ' + fichier);
    const publie = EXPOSE.map(n => n + ': (typeof ' + n + ' !== "undefined" ? ' + n + ' : undefined)').join(', ');
    src = src.replace(ancre, '    globalThis.__WDA = { ' + publie + ',\n'
        + '        regler: (o) => { if ("cache" in o) cache = o.cache; if ("zones" in o) zones = o.zones;'
        + ' if ("opts" in o) opts = Object.assign({}, opts, o.opts); if ("sdk" in o) sdk = o.sdk; if ("lang" in o) _lang = o.lang;'
        + ' if ("compte" in o && typeof _compte !== "undefined") Object.assign(_compte, o.compte); },\n'
        + '        etat: () => ({ cache, zones, opts }) };\n' + ancre);

    const store = Object.assign({}, stockage);
    let quota = Infinity;   // longueur maximale d'une valeur ; W.fixerQuota(n) la règle
    const localStorage = {
        getItem: k => (k in store ? store[k] : null),
        setItem: (k, v) => {
            if (String(v).length > quota) { const e = new Error('quota'); e.name = 'QuotaExceededError'; throw e; }
            store[k] = String(v);
        },
        removeItem: k => { delete store[k]; },
        _store: store,
    };
    // Un élément minimal : assez pour poserEcheance (createElement, appendChild, textContent).
    const element = () => ({ children: [], className: '', textContent: '', title: '', style: {},
        appendChild(e) { this.children.push(e); return e; }, setAttribute(k, v) { this[k] = v; } });
    const document = { createElement: element, addEventListener() {}, querySelector: () => null,
        querySelectorAll: () => [], documentElement: { lang: 'fr' }, head: element(), body: element() };
    const RealDate = Date;
    const ctx = {
        console, localStorage, document, navigator: { language: 'fr-FR' }, setTimeout, clearTimeout,
        setInterval: () => 0, fetch: reseau || (() => Promise.reject(new Error('pas de réseau au banc'))),
        URL, Blob: function () {}, Math, JSON, Object, Array, Promise, Error, Set, Map, String, Number,
        Intl, parseInt, parseFloat, isNaN,
    };
    ctx.Date = maintenant === null ? RealDate : class extends RealDate {
        constructor(...a) { if (a.length) super(...a); else super(maintenant); }
        static now() { return maintenant; }
    };
    ctx.window = Object.assign({ W: undefined }, fenetre);
    ctx.globalThis = ctx;
    vm.createContext(ctx);
    vm.runInContext(src, ctx, { filename: fichier });
    const W = ctx.__WDA;
    if (compte) W.regler({ compte });
    W.stockage = store;
    W.fixerQuota = q => { quota = q; };
    const journal = [];
    ctx.console = { log: m => journal.push(String(m)), warn: () => {}, error: () => {} };
    W.journal = journal;
    return W;
}

// Un « t » de banc : rend la clé et ses arguments, pour vérifier QUELLE phrase est choisie
// sans dépendre de sa traduction.
const tBanc = (k, ...a) => k + (a.length ? '(' + a.join(',') + ')' : '');

module.exports = { charger, tBanc };
