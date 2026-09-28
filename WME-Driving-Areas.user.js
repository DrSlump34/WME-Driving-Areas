// ==UserScript==
// @name         WME Driving Areas
// @name:fr      WME Driving Areas
// @name:de      WME Driving Areas
// @name:es      WME Driving Areas
// @name:it      WME Driving Areas
// @name:pt-BR   WME Driving Areas
// @name:pt      WME Driving Areas
// @name:he      WME Driving Areas
// @icon         data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc2NCcgaGVpZ2h0PSc2NCcgdmlld0JveD0nMCAwIDY0IDY0Jz4gPHJlY3Qgd2lkdGg9JzY0JyBoZWlnaHQ9JzY0JyByeD0nMTInIGZpbGw9JyMxNTY1YzAnLz4gPHJlY3QgeD0nMTUnIHk9JzgnIHdpZHRoPSczNCcgaGVpZ2h0PSc2JyByeD0nMycgZmlsbD0nI2ZmZmZmZicvPiA8cmVjdCB4PScxNScgeT0nNTAnIHdpZHRoPSczNCcgaGVpZ2h0PSc2JyByeD0nMycgZmlsbD0nI2ZmZmZmZicvPiA8cGF0aCBkPSdNMTkgMTQgTDQ1IDE0IEwzNCAzMiBMNDUgNTAgTDE5IDUwIEwzMCAzMiBaJyBmaWxsPScjZmZmZmZmJy8+IDxwYXRoIGQ9J00yMyAxOCBMNDEgMTggTDMyIDMyIFonIGZpbGw9JyNmYjhjMDAnLz4gPHBhdGggZD0nTTMyIDQwIEw0MSA0NiBMMjMgNDYgWicgZmlsbD0nI2ZiOGMwMCcvPiA8cmVjdCB4PSczMScgeT0nMzAnIHdpZHRoPScyJyBoZWlnaHQ9JzEyJyBmaWxsPScjZmI4YzAwJy8+PC9zdmc+
// @namespace    https://github.com/DrSlump34
// @version      0.07.02
// @description  Shows how long your driving-based editing rights will last, next to the WME location label — rebuilt from your drive history. Adds a GPX export and a countdown to each drive.
// @description:fr Affiche le temps restant sur vos droits d'édition obtenus en roulant, à côté du libellé de localisation de WME — reconstruit depuis l'historique des trajets. Ajoute un export GPX et un décompte à chaque trajet.
// @description:de Zeigt neben der WME-Ortsanzeige, wie lange Ihre durch Fahrten erworbenen Bearbeitungsrechte noch gelten — rekonstruiert aus Ihrem Fahrtenverlauf. Mit GPX-Export und Countdown je Fahrt.
// @description:es Muestra cuánto tiempo durarán sus permisos de edición obtenidos conduciendo, junto a la etiqueta de ubicación de WME — reconstruido desde su historial de viajes. Añade exportación GPX y una cuenta atrás por viaje.
// @description:it Mostra quanto dureranno i permessi di modifica ottenuti guidando, accanto all'etichetta di posizione di WME — ricostruito dallo storico dei viaggi. Aggiunge l'esportazione GPX e un conto alla rovescia per ogni viaggio.
// @description:pt-BR Mostra quanto tempo duram suas permissões de edição obtidas dirigindo, ao lado da etiqueta de localização do WME — reconstruído a partir do histórico de trajetos. Adiciona exportação GPX e uma contagem regressiva por trajeto.
// @description:pt Mostra quanto tempo duram as suas permissões de edição obtidas a conduzir, ao lado da etiqueta de localização do WME — reconstruído a partir do histórico de trajetos. Adiciona exportação GPX e uma contagem decrescente por trajeto.
// @description:he מציג כמה זמן יימשכו הרשאות העריכה שהושגו בנסיעה, לצד תווית המיקום של WME — משוחזר מהיסטוריית הנסיעות. מוסיף ייצוא GPX וספירה לאחור לכל נסיעה.
// @author       DrSlump34
// @copyright    DrSlump34 2026
// @license      MIT
// @homepageURL  https://github.com/DrSlump34/WME-Driving-Areas
// @supportURL   https://www.waze.com/discuss/t/411120
// @downloadURL  https://update.greasyfork.org/scripts/593493/WME%20Driving%20Areas.user.js
// @updateURL    https://update.greasyfork.org/scripts/593493/WME%20Driving%20Areas.meta.js
// @match        https://www.waze.com/*/editor*
// @match        https://www.waze.com/editor*
// @match        https://beta.waze.com/*/editor*
// @exclude      https://www.waze.com/*user/*editor/*
// @exclude      https://www.waze.com/discuss/*
// @exclude      https://www.waze.com/editor/sdk/*
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      update.greasyfork.org
// @run-at       document-idle
// ==/UserScript==

/*  POURQUOI CE SCRIPT
 *
 *  WME ne dit nulle part quand une zone gagnée en roulant sera retirée. Mesuré le 29/08/2026 :
 *  /app/Session descend chaque zone sous la forme {type:'drive'|'managed', geometry, area} —
 *  trois champs, aucune date. L'information n'est pas masquée par l'interface, elle n'arrive
 *  pas au navigateur.
 *
 *  Elle est en revanche RECONSTRUCTIBLE, parce que WME expose par ailleurs l'historique des
 *  trajets (l'onglet « Vos trajets ») :
 *    /app/Archive/List?count=50&minDistance=0&offset=N   → trajets datés
 *    /app/Archive/SessionGPS?id=<uuid>                   → la trace GPS de chacun
 *  Et le rayon du droit est donné par WME lui-même : user.editableMiles (4 → 6,437 km).
 *
 *  D'où le calcul : dernier passage à moins de editableMiles du point regardé, + la durée de
 *  validité (90 jours d'après le Wazeopedia) = date de retrait.
 *
 *  LA LIMITE, ET ELLE EST STRUCTURELLE : l'archive des trajets est plus COURTE que le droit.
 *  Mesurée à 63 jours pour 90 jours de validité. Les secteurs dont le dernier passage est
 *  antérieur à l'archive sont donc datables « au plus tard », pas au jour près. Le trou se
 *  comble avec le temps : le cache local garde les trajets une fois vus, et se recharge de
 *  lui-même au-delà de 12 h (depuis la 0.07.00 ; avant, sans un clic tous les ~60 jours, des
 *  trajets sortaient de l'archive avant d'avoir été gardés).
 *
 *  Né d'une question d'OliveStChi (Discord Waze France, 29/08/2026).
 */

(function () {
    'use strict';

    const SCRIPT_ID = 'wme-driving-areas';
    const SCRIPT_NAME = 'WME Driving Areas';
    // Pas de const figée : deux sources de vérité finissent par diverger. Hors gestionnaire
    // (chargement direct par <script src=localhost>), on affiche 'dev' — un numéro faux se voit.
    const VERSION = (typeof GM_info !== 'undefined' && GM_info.script && GM_info.script.version) || 'dev';
    // La page de WME. Depuis la 0.07.00 le script demande GM_xmlhttpRequest (la détection de
    // nouvelle version, comme WCT et WRP) : le gestionnaire l'isole alors dans un bac à sable, et
    // W, getWmeSdk et fetch de la page se lisent par unsafeWindow.
    const pw = (typeof unsafeWindow !== 'undefined') ? unsafeWindow : window;
    const URL_GF = 'https://greasyfork.org/scripts/593493-wme-driving-areas';
    const URL_GH = 'https://github.com/DrSlump34/WME-Driving-Areas';
    const URL_DISCUSS = 'https://www.waze.com/discuss/t/411120';
    const gmScript = () => (typeof GM_info !== 'undefined' && GM_info.script) || {};
    const URL_MAJ = gmScript().updateURL || 'https://update.greasyfork.org/scripts/593493/WME%20Driving%20Areas.meta.js';
    const URL_INSTALLER = gmScript().downloadURL || 'https://update.greasyfork.org/scripts/593493/WME%20Driving%20Areas.user.js';
    // L'icône du script dans l'onglet Scripts et en tête du panneau : le sablier SANS fond, comme les
    // autres scripts (WCT et WJN mettent un emoji seul, WRP un dessin sans fond) — le carré bleu de
    // @icon reste pour la liste de Tampermonkey. Demande de l'auteur, 25/09/2026.
    const ICONE = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="4" width="40" height="8" rx="4" fill="#1565c0"/>'
        + '<rect x="12" y="52" width="40" height="8" rx="4" fill="#1565c0"/>'
        + '<path d="M17 12 L47 12 L35 32 L47 52 L17 52 L29 32 Z" fill="#fff" stroke="#1565c0" stroke-width="5" stroke-linejoin="round"/>'
        + '<path d="M23 17 L41 17 L32 30 Z" fill="#fb8c00"/><path d="M32 40 L42 48 L22 48 Z" fill="#fb8c00"/>'
        + '<rect x="30.5" y="29" width="3" height="13" fill="#fb8c00"/></svg>';
    const icone = px => ICONE.replace('<svg ', '<svg width="' + px + '" height="' + px + '" ');

    // ---------- Réglages ----------
    const VALID_DAYS = 90;          // durée du droit obtenu en roulant (Wazeopedia « Editable area »)
    const DEFAULT_MILES = 4;        // repli si user.editableMiles manque
    const DECIM_M = 400;            // décimation des traces : un point tous les ~400 m
    const PURGE_DAYS = 130;         // au-delà, un trajet ne peut plus donner de droit : on le jette
    const CONCURRENCE = 4;          // requêtes SessionGPS en parallèle
    const PAGE = 50;                // count max accepté par Archive/List (99 passe, 100 lève)
    const MOVE_DEBOUNCE = 700;      // anti-rebond du recalcul sur déplacement de carte
    const RAFRAICHIR_MS = 5 * 60000; // le décompte se refait toutes les 5 min : il vieillit avec l'horloge
    const AUTO_MS = 12 * 3600000;   // un historique déjà chargé une fois se recharge seul au-delà de 12 h
    // Le polygone servi par Waze est PLUS LARGE que le tampon annoncé par editableMiles.
    // Mesuré le 29/08/2026 sur une zone de 204 km² ouverte par un trajet connu : 25 % de ses
    // points sont à plus de 6,437 km de toute trace, jusqu'à 11,4 km. On élargit donc la
    // recherche quand le rayon nominal ne trouve rien — en le DISANT.
    const ELARGI = 2.5;
    // Profondeur de l'archive des trajets (Archive/List), mesurée sur deux comptes : 63 jours le
    // 29/08/2026, 59 le 08/09/2026. Un trajet qui a ouvert une zone et que le cache ne connaît pas
    // est donc plus vieux que ça : la borne « ≤ N j » se calcule sur au moins cette profondeur, même
    // si le cache est plus jeune (sinon « ≤ 70 j » s'affichait là où « ≤ 31 j » était démontrable).
    // Si l'archive d'un compte était plus courte, la borne ne ferait que devenir plus prudente.
    const ARCHIVE_MIN_J = 59;
    // Le code couleur, en jours RESTANTS, et il n'existe qu'ici : couleurClasse() l'applique aux
    // pastilles et au badge, couleurPour() au calque, et la légende du panneau l'affiche. OliveStChi avait
    // deviné « rouge = moins de 2 jours » là où le code disait 14 : sans légende, on devine, et
    // on devine faux. Une légende qui ne descend pas de la table jouée redeviendrait fausse.
    // Les teintes du calque sont plus vives que celles des pastilles : elles se lisent sur une
    // photo satellite, pas sur du blanc.
    // `tirets` : sur le calque, la couleur ne porte pas SEULE le délai (WCAG 1.4.1) — le rouge et
    // le vert se confondent pour un éditeur daltonien. Plus l'échéance approche, plus le trait se
    // hache ; la légende montre le même trait.
    const SEUILS = [
        { max: 0, cls: 'wda-gris', trace: '#9e9e9e', tirets: 'dot' },
        { max: 14, cls: 'wda-rouge', trace: '#e53935', tirets: 'dot' },
        { max: 30, cls: 'wda-orange', trace: '#fb8c00', tirets: 'dash' },
        { max: 60, cls: 'wda-jaune', trace: '#fdd835', tirets: 'longdash' },
        { max: Infinity, cls: 'wda-vert', trace: '#43a047', tirets: 'solid' },
    ];
    // Le même trait en SVG pour la légende (les motifs d'OpenLayers, approchés).
    const TIRETS_SVG = { solid: '', longdash: '8 3', dash: '4 3', dot: '1 3' };
    const LS_KEY = 'wda.cache.v1';
    const LS_OPT = 'wda.opts.v1';
    // Clés de la version précédente (le script s'appelait WME Area Countdown) : reprises une
    // fois pour ne pas jeter un historique déjà téléchargé.
    const LS_KEY_OLD = 'wac.cache.v1';
    const LS_OPT_OLD = 'wac.opts.v1';

    const D_MS = 86400000;
    const RAD = Math.PI / 180;

    let sdk = null;
    let cache = null;             // {at, drives:[{id, t, bb:[minLon,minLat,maxLon,maxLat], pts:[lon,lat,…]}]}
    let zones = null;             // {drive:[geom], managed:[geom], miles, countries:[…]}
    let opts = { commeEditeur: false, calque: false, langPref: 'auto' };
    let chargement = null;
    let dernierVerdict = null;
    let paneEl = null;

    const log = m => console.log('[WDA] ' + m);

    // =====================================================================
    //  I18N — même mécanique que WCT : détection sur la locale de WME,
    //  préférence forcée possible, repli sur l'anglais
    // =====================================================================

    let _lang = 'en';
    // L'ordre fixe celui du sélecteur ; le libellé est dans la langue elle-même — un
    // germanophone cherche « Deutsch », pas « Allemand ».
    const LANGS = [
        { code: 'fr', label: 'Français' },
        { code: 'en', label: 'English' },
        { code: 'de', label: 'Deutsch' },
        { code: 'es', label: 'Español' },
        { code: 'it', label: 'Italiano' },
        { code: 'pt-BR', label: 'Português (BR)' },
        { code: 'pt-PT', label: 'Português (PT)' },
        { code: 'he', label: 'עברית' },
    ];
    const RTL_LANGS = ['he'];
    const isRTL = () => RTL_LANGS.includes(_lang);
    // Le portugais est traité à part : seul « br » distingue le brésilien. L'hébreu porte le
    // code ISO « he », mais d'anciens navigateurs renvoient encore le code hérité « iw ».
    const detectLang = () => {
        try {
            const l = (pw.W?.userscripts?.state?.locale || document.documentElement.lang || navigator.language || 'en').toLowerCase();
            if (l.startsWith('pt')) return l.includes('br') ? 'pt-BR' : 'pt-PT';
            if (l.startsWith('he') || l.startsWith('iw')) return 'he';
            return LANGS.map(x => x.code).find(c => !c.includes('-') && l.startsWith(c)) || 'en';
        } catch (e) { return 'en'; }
    };
    const resolveLang = () => (opts.langPref !== 'auto' && LANGS.some(x => x.code === opts.langPref)) ? opts.langPref : detectLang();

    const DICO = {
        fr: {
            jm: n => 'J-' + n, jp: n => 'J+' + n,
            jTip: (d, n) => 'Ce trajet cesse de donner des droits le ' + d + ', soit dans ' + n + ' jour(s).',
            jTipLast: d => 'Ce trajet cesse de donner des droits le ' + d + ', dans moins d’un jour.',
            jExpTip: d => 'Ce trajet ne donne plus de droits depuis le ' + d + '.',
            jInfZone: d => 'Votre accès ici est permanent (zone gérée) : ce décompte ne vous concerne pas. Pour information, ce trajet cesserait de donner des droits le ' + d + '.',
            jInfPays: (n, d) => 'Vous gérez ' + n + ' pays : si ce trajet s\'y trouve, votre accès est permanent. Waze ne descend aucune géométrie de pays, cela ne peut donc pas être vérifié ici. Sinon, ce trajet cesse de donner des droits le ' + d + '.',
            bNoHist: 'historique non chargé',
            bNoHistTip: 'Ouvrez l\'onglet ' + SCRIPT_NAME + ' (icône Scripts) et lancez le chargement de l\'historique.',
            mZone: 'zone gérée', mCountry: 'pays géré',
            bPerm: m => 'accès permanent (' + m + ')',
            bPermDrove: (m, n) => 'accès permanent (' + m + ') · roulé il y a ' + n + ' j',
            bLeft: n => '~' + n + ' j restants ici', bExpired: 'droit expiré ici (selon le calcul)',
            bLessDay: '< 1 j restant ici',
            bMax: n => '≤ ' + n + ' j restants ici',
            bUnknown: 'zone parcourue, date inconnue', bOutside: 'hors zone parcourue',
            bOutsideTip: km => 'Aucun trajet connu à moins de ' + km + ' km du centre de la vue.',
            tipLast: (d, n, km) => 'Dernier passage connu : le ' + d + ' (il y a ' + n + ' j, à ' + km + ' km).',
            tipWide: km => '⚠️ Ce trajet est au-delà du rayon annoncé par WME (' + km + ' km) : il est retenu parce que le polygone de Waze vous place bien dans une zone parcourue, mais rien ne prouve que ce soit lui qui l\'ait ouverte. Celui qui l’a ouverte peut être plus ancien : la date affichée est un maximum.',
            tipRadiusGuess: m => '⚠️ WME n’a pas donné le rayon de vos droits : ' + m + ' mi supposés. Si le vôtre est plus petit, il vous reste moins de temps qu’affiché.',
            tipRule: n => 'Durée retenue : ' + n + ' jours après le trajet (règle du Wazeopedia), qui ajoute « ou le dernier jour du mois, selon ce qui est le plus tardif » : si cet arrondi existe, la date réelle est postérieure à celle annoncée. Le calcul porte sur le CENTRE de la vue.',
            tipRetreat: d => 'Retrait estimé le ' + d + '.',
            tipPermHere: 'Ici votre accès ne dépend pas du roulage.',
            tipMax: (max, age) => 'Vous êtes dans une zone parcourue, mais le trajet qui l’a ouverte n’est pas dans l’historique connu (qui remonte à ' + age + ' jours) : il est plus ancien, ou pas encore chargé. Il reste au plus ' + max + ' jours.',
            pLoad: 'Charger l\'historique des trajets', pDisplay: 'Affichage',
            sbHint: 'Combien de temps durent, ici, vos droits d’édition gagnés en roulant : le badge à côté du nom de la commune, les pastilles de « Vos trajets » et le calque des trajets.', sbHelp: 'Aide et détails', lnkDiscuss: 'Fil Discuss', sbSafe: 'Le script ne modifie jamais la carte.', majBtn: v => 'La version ' + v + ' est disponible', majInstall: 'Installer',
            pLayer: 'Dessiner les trajets, colorés par échéance',
            layerName: 'Trajets (Driving Areas)',
            scDesc: 'Afficher ou masquer les trajets',
            pShortcut: k => 'Raccourci clavier : <b>' + k + '</b>. La case est aussi dans le menu <b>Calques</b> de WME.',
            pShortcutKO: 'Raccourci clavier indisponible (touches déjà prises). La case reste accessible ici et dans le menu Calques.',
            pAsEditor: 'Ignorer mes zones gérées (voir ce que verrait un éditeur sans droits)',
            pWhat: 'Ce que dit le badge',
            pRadiusGuess: 'supposé',
            pWhatText: (km, d) => 'Le décompte part du <b>dernier passage</b> à moins de ' + km + ' du centre de la vue, plus ' + d + ' jours. Cette durée vient du Wazeopedia, qui ajoute « ou le dernier jour du mois, selon ce qui est le plus tardif » : <b>~N j</b> ne surestime donc jamais votre temps restant.<br><br>Ce qui est <b>hachuré</b> est une borne haute (<b>≤ N j</b>) : le trajet qui a ouvert la zone est plus ancien que l’historique disponible, ou n’a été trouvé qu’au-delà du rayon annoncé par WME, ou ce rayon a dû être supposé. La date exacte est inconnue, mais elle n’est pas plus tardive que celle affichée.',
            pCache: 'Historique en cache', pCacheNone: 'Aucun trajet en cache.',
            pCacheInfo: (n, a, b, age, v) => n + ' trajets, du ' + a + ' au ' + b + ' — soit ' + age + ' jours de couverture sur les ' + v + ' de validité.',
            pCacheEmpty: n => 'Dont ' + n + ' sans trace GPS (aucune route appariée par Waze) : ils n\'ouvrent aucun droit et ne comptent pas dans le calcul.',
            pCacheAt: d => 'Dernier chargement : ' + d + '. L’historique se recharge de lui-même au-delà de 12 h.',
            pRetention: n => 'Ces trajets (dates et traces) sont gardés dans ce navigateur, au plus ' + n + ' jours, pour votre seul compte.',
            pCacheNotSaved: '⚠️ L’historique n’a pas pu être enregistré : la mémoire locale de waze.com est pleine. Il reste valable jusqu’à la fermeture de la page, et sera redemandé au prochain chargement.',
            pClear: 'Effacer l’historique local', pClearConfirm: 'Cliquer à nouveau pour effacer', pCleared: 'Historique local effacé.',
            pCacheCut: n => '⚠️ ' + n + ' trajet(s) n’ont pas pu être conservés : la mémoire locale de waze.com est pleine (elle est partagée avec vos autres scripts). Les plus anciens ont été jetés, et ils ne reviendront pas : l’archive de Waze ne remonte qu’environ 60 jours.',
            pLegend: 'Code couleur',
            lgUnit: ' j',
            lgExpired: 'droit expiré',
            lgPerm: 'accès permanent, aucun décompte',
            lgApprox: 'date incertaine : au plus tard celle affichée',
            lgNone: 'aucun trajet connu ici',
            pGpx: 'Export GPX et décompte',
            pGpxText: 'Chaque trajet du panneau « Vos trajets » reçoit son échéance (<b>J-41</b>) et un bouton <b>⤓</b> d\'export GPX, en pleine résolution, un segment par tronçon.',
            pGpxMissing: n => n + ' trajet(s) sans bouton : leur identifiant n\'a pas pu être retrouvé. WME a probablement changé.',
            pNotEval: 'Position non évaluée.', pAtCenter: 'Au centre de la vue :',
            pZones: (z, c) => z + ' zone(s) gérée(s), ' + c + ' pays éditable(s).',
            pLang: 'Langue', pLangAuto: l => 'Automatique (' + l + ')',
            gList: n => 'Liste des trajets : ' + n + ' nouveaux…',
            gTrace: (a, b) => 'Traces GPS : ' + a + ' / ' + b + '…',
            gAdded: n => n + ' trajet(s) ajouté(s).', gNothing: 'Rien de nouveau.',
            gFail: m => 'Échec : ' + m,
            gFailedTraces: n => n + ' trace(s) GPS illisible(s) : redemandée(s) au prochain chargement.',
            xTitle: 'Exporter ce trajet en GPX', xFail: m => 'Échec de l\'export : ' + m,
            xNoTrace: 'ce trajet n\'a aucune trace GPS',
        },
        en: {
            jm: n => 'D-' + n, jp: n => 'D+' + n,
            jTip: (d, n) => 'This drive stops granting rights on ' + d + ', i.e. in ' + n + ' day(s).',
            jTipLast: d => 'This drive stops granting rights on ' + d + ', in less than a day.',
            jExpTip: d => 'This drive has granted no rights since ' + d + '.',
            jInfZone: d => 'Your access here is permanent (managed area): this countdown does not concern you. For reference, this drive would stop granting rights on ' + d + '.',
            jInfPays: (n, d) => 'You manage ' + n + ' country/ies: if this drive is inside one, your access is permanent. Waze sends no country geometry, so this cannot be checked here. Otherwise this drive stops granting rights on ' + d + '.',
            bNoHist: 'history not loaded',
            bNoHistTip: 'Open the ' + SCRIPT_NAME + ' tab (Scripts icon) and load your drive history.',
            mZone: 'managed area', mCountry: 'managed country',
            bPerm: m => 'permanent access (' + m + ')',
            bPermDrove: (m, n) => 'permanent access (' + m + ') · driven ' + n + ' d ago',
            bLeft: n => '~' + n + ' d left here', bExpired: 'rights expired here (per this estimate)',
            bLessDay: '< 1 d left here',
            bMax: n => '≤ ' + n + ' d left here',
            bUnknown: 'driven area, date unknown', bOutside: 'outside your driven area',
            bOutsideTip: km => 'No known drive within ' + km + ' km of the map centre.',
            tipLast: (d, n, km) => 'Last known drive: ' + d + ' (' + n + ' d ago, ' + km + ' km away).',
            tipWide: km => '⚠️ This drive is beyond the radius WME reports (' + km + ' km). It is used because Waze\'s own polygon does place you inside a driven area, but nothing proves this drive is the one that opened it. The drive that did may be older: the date shown is a maximum.',
            tipRadiusGuess: m => '⚠️ WME did not provide the radius of your rights: ' + m + ' mi assumed. If yours is smaller, you have less time left than shown.',
            tipRule: n => 'Assumed duration: ' + n + ' days after the drive (Wazeopedia rule), which adds "or the last day of the month, whichever is later": if that rounding applies, the real date is later than shown. The estimate applies to the map CENTRE.',
            tipRetreat: d => 'Estimated removal on ' + d + '.',
            tipPermHere: 'Here your access does not depend on driving.',
            tipMax: (max, age) => 'You are inside a driven area, but the drive that opened it is not in the known history (which goes back ' + age + ' days): it is older, or not loaded yet. At most ' + max + ' days remain.',
            pLoad: 'Load drive history', pDisplay: 'Display',
            sbHint: 'How long your editing rights earned by driving last, here: the badge next to the city name, the chips in "My drives" and the drives layer.', sbHelp: 'Help and details', lnkDiscuss: 'Discuss thread', sbSafe: 'The script never changes the map.', majBtn: v => 'Version ' + v + ' is available', majInstall: 'Install',
            pLayer: 'Draw drives, coloured by expiry',
            layerName: 'Drives (Driving Areas)',
            scDesc: 'Show or hide the drives',
            pShortcut: k => 'Keyboard shortcut: <b>' + k + '</b>. The checkbox is also in the WME <b>Layers</b> menu.',
            pShortcutKO: 'Keyboard shortcut unavailable (keys already taken). The checkbox is still here and in the Layers menu.',
            pAsEditor: 'Ignore my managed areas (see what an editor without rights would see)',
            pWhat: 'What the badge means',
            pRadiusGuess: 'assumed',
            pWhatText: (km, d) => 'The countdown starts from the <b>last drive</b> within ' + km + ' of the map centre, plus ' + d + ' days. That duration comes from Wazeopedia, which adds "or the last day of the month, whichever is later": <b>~N d</b> therefore never overstates your remaining time.<br><br>Anything <b>hatched</b> is an upper bound (<b>≤ N d</b>): the drive that opened the area is older than the available history, or was only found beyond the radius WME reports, or that radius had to be assumed. The exact date is unknown, but it is no later than the one shown.',
            pCache: 'Cached history', pCacheNone: 'No drives cached.',
            pCacheInfo: (n, a, b, age, v) => n + ' drives, from ' + a + ' to ' + b + ' — ' + age + ' days of coverage out of the ' + v + ' of validity.',
            pCacheEmpty: n => 'Including ' + n + ' with no GPS trace (no road matched by Waze): they grant no rights and are left out of the estimate.',
            pCacheAt: d => 'Last loaded: ' + d + '. The history reloads by itself after 12 h.',
            pRetention: n => 'These drives (dates and traces) are kept in this browser, for at most ' + n + ' days, for your account only.',
            pCacheNotSaved: '⚠️ The history could not be saved: the local storage of waze.com is full. It stays valid until the page is closed, and will be fetched again on the next load.',
            pClear: 'Clear local history', pClearConfirm: 'Click again to clear', pCleared: 'Local history cleared.',
            pCacheCut: n => '⚠️ ' + n + ' drive(s) could not be kept: the local storage of waze.com is full (it is shared with your other scripts). The oldest ones were dropped, and they will not come back: the Waze archive only goes back about 60 days.',
            pLegend: 'Colour key',
            lgUnit: ' d',
            lgExpired: 'right expired',
            lgPerm: 'permanent access, no countdown',
            lgApprox: 'uncertain date: no later than the one shown',
            lgNone: 'no known drive here',
            pGpx: 'GPX export and countdown',
            pGpxText: 'Every drive in the "My drives" panel gets its expiry (<b>D-41</b>) and a <b>⤓</b> GPX export button, at full resolution, one segment per leg.',
            pGpxMissing: n => n + ' drive(s) without a button: their identifier could not be resolved. WME has probably changed.',
            pNotEval: 'Position not evaluated.', pAtCenter: 'At the map centre:',
            pZones: (z, c) => z + ' managed area(s), ' + c + ' editable country/ies.',
            pLang: 'Language', pLangAuto: l => 'Automatic (' + l + ')',
            gList: n => 'Drive list: ' + n + ' new…',
            gTrace: (a, b) => 'GPS traces: ' + a + ' / ' + b + '…',
            gAdded: n => n + ' drive(s) added.', gNothing: 'Nothing new.',
            gFail: m => 'Failed: ' + m,
            gFailedTraces: n => n + ' GPS trace(s) could not be read: they will be requested again next time.',
            xTitle: 'Export this drive as GPX', xFail: m => 'Export failed: ' + m,
            xNoTrace: 'this drive has no GPS trace',
        },
        de: {
            jm: n => 'T-' + n, jp: n => 'T+' + n,
            jTip: (d, n) => 'Diese Fahrt gewährt ab dem ' + d + ' keine Rechte mehr, also in ' + n + ' Tag(en).',
            jTipLast: d => 'Diese Fahrt gewährt ab dem ' + d + ' keine Rechte mehr, also in weniger als einem Tag.',
            jExpTip: d => 'Diese Fahrt gewährt seit dem ' + d + ' keine Rechte mehr.',
            jInfZone: d => 'Ihr Zugriff ist hier dauerhaft (verwalteter Bereich): dieser Countdown betrifft Sie nicht. Zur Information: diese Fahrt würde am ' + d + ' aufhören, Rechte zu gewähren.',
            jInfPays: (n, d) => 'Sie verwalten ' + n + ' Land/Länder: liegt diese Fahrt darin, ist Ihr Zugriff dauerhaft. Waze liefert keine Ländergeometrie, das lässt sich hier also nicht prüfen. Andernfalls endet diese Fahrt am ' + d + '.',
            bNoHist: 'Verlauf nicht geladen',
            bNoHistTip: 'Öffnen Sie den Reiter ' + SCRIPT_NAME + ' (Symbol „Scripts“) und laden Sie den Fahrtenverlauf.',
            mZone: 'verwalteter Bereich', mCountry: 'verwaltetes Land',
            bPerm: m => 'dauerhafter Zugriff (' + m + ')',
            bPermDrove: (m, n) => 'dauerhafter Zugriff (' + m + ') · gefahren vor ' + n + ' T',
            bLeft: n => '~' + n + ' T verbleiben hier', bExpired: 'Recht hier abgelaufen (laut Berechnung)',
            bLessDay: '< 1 T verbleibt hier',
            bMax: n => '≤ ' + n + ' T verbleiben hier',
            bUnknown: 'befahrener Bereich, Datum unbekannt', bOutside: 'außerhalb Ihres befahrenen Bereichs',
            bOutsideTip: km => 'Keine bekannte Fahrt innerhalb von ' + km + ' km um die Kartenmitte.',
            tipLast: (d, n, km) => 'Letzte bekannte Fahrt: ' + d + ' (vor ' + n + ' T, ' + km + ' km entfernt).',
            tipWide: km => '⚠️ Diese Fahrt liegt außerhalb des von WME genannten Radius (' + km + ' km). Sie wird verwendet, weil das Polygon von Waze Sie tatsächlich in einem befahrenen Bereich verortet — dass gerade diese Fahrt ihn geöffnet hat, ist aber nicht belegt. Die öffnende Fahrt kann älter sein: das angezeigte Datum ist ein Höchstwert.',
            tipRadiusGuess: m => '⚠️ WME hat den Radius Ihrer Rechte nicht geliefert: ' + m + ' mi angenommen. Ist Ihrer kleiner, bleibt Ihnen weniger Zeit als angezeigt.',
            tipRule: n => 'Angenommene Dauer: ' + n + ' Tage nach der Fahrt (Wazeopedia-Regel), ergänzt um „oder der letzte Tag des Monats, je nachdem, was später ist“: gilt diese Rundung, liegt das echte Datum später. Die Berechnung gilt für die KARTENMITTE.',
            tipRetreat: d => 'Voraussichtlicher Entzug am ' + d + '.',
            tipPermHere: 'Hier hängt Ihr Zugriff nicht vom Fahren ab.',
            tipMax: (max, age) => 'Sie befinden sich in einem befahrenen Bereich, doch die öffnende Fahrt ist nicht im bekannten Verlauf (der ' + age + ' Tage zurückreicht): sie ist älter oder noch nicht geladen. Es bleiben höchstens ' + max + ' Tage.',
            pLoad: 'Fahrtenverlauf laden', pDisplay: 'Anzeige',
            sbHint: 'Wie lange Ihre durch Fahrten erworbenen Bearbeitungsrechte hier gelten: das Abzeichen neben dem Ortsnamen, die Plaketten unter „Meine Fahrten“ und die Fahrtenebene.', sbHelp: 'Hilfe und Details', lnkDiscuss: 'Discuss-Thread', sbSafe: 'Das Skript ändert die Karte nie.', majBtn: v => 'Version ' + v + ' ist verfügbar', majInstall: 'Installieren',
            pLayer: 'Fahrten zeichnen, nach Ablauf eingefärbt',
            layerName: 'Fahrten (Driving Areas)',
            scDesc: 'Fahrten ein- oder ausblenden',
            pShortcut: k => 'Tastenkürzel: <b>' + k + '</b>. Das Kästchen steht auch im WME-Menü <b>Ebenen</b>.',
            pShortcutKO: 'Tastenkürzel nicht verfügbar (Tasten bereits belegt). Das Kästchen bleibt hier und im Ebenen-Menü erreichbar.',
            pAsEditor: 'Meine verwalteten Bereiche ignorieren (Sicht eines Bearbeiters ohne Rechte)',
            pWhat: 'Was das Abzeichen bedeutet',
            pRadiusGuess: 'angenommen',
            pWhatText: (km, d) => 'Die Frist beginnt mit der <b>letzten Fahrt</b> innerhalb von ' + km + ' um die Kartenmitte, plus ' + d + ' Tage. Diese Dauer stammt aus dem Wazeopedia, das „oder der letzte Tag des Monats, je nachdem, was später ist“ ergänzt: <b>~N T</b> überschätzt Ihre Restzeit also nie.<br><br><b>Schraffiertes</b> ist eine Obergrenze (<b>≤ N T</b>): die öffnende Fahrt ist älter als der verfügbare Verlauf, wurde nur außerhalb des von WME genannten Radius gefunden, oder dieser Radius musste angenommen werden. Das genaue Datum ist unbekannt, liegt aber nicht später als das angezeigte.',
            pCache: 'Zwischengespeicherter Verlauf', pCacheNone: 'Keine Fahrten gespeichert.',
            pCacheInfo: (n, a, b, age, v) => n + ' Fahrten, vom ' + a + ' bis ' + b + ' — also ' + age + ' Tage Abdeckung von den ' + v + ' Tagen Gültigkeit.',
            pCacheEmpty: n => 'Davon ' + n + ' ohne GPS-Spur (keine Straße von Waze zugeordnet): sie gewähren keine Rechte und zählen nicht.',
            pCacheAt: d => 'Zuletzt geladen: ' + d + '. Der Verlauf lädt sich nach 12 Std. selbst neu.',
            pRetention: n => 'Diese Fahrten (Daten und Spuren) bleiben in diesem Browser, höchstens ' + n + ' Tage, nur für Ihr Konto.',
            pCacheNotSaved: '⚠️ Der Verlauf konnte nicht gespeichert werden: der lokale Speicher von waze.com ist voll. Er gilt bis zum Schließen der Seite und wird beim nächsten Laden erneut abgerufen.',
            pClear: 'Lokalen Verlauf löschen', pClearConfirm: 'Zum Löschen erneut klicken', pCleared: 'Lokaler Verlauf gelöscht.',
            pCacheCut: n => '⚠️ ' + n + ' Fahrt(en) konnten nicht behalten werden: der lokale Speicher von waze.com ist voll (er wird mit Ihren anderen Skripten geteilt). Die ältesten wurden verworfen und kommen nicht zurück: das Archiv von Waze reicht nur etwa 60 Tage zurück.',
            pLegend: 'Farbcode',
            lgUnit: ' T',
            lgExpired: 'Recht abgelaufen',
            lgPerm: 'dauerhafter Zugang, kein Countdown',
            lgApprox: 'Datum unsicher: spätestens das angezeigte',
            lgNone: 'keine bekannte Fahrt hier',
            pGpx: 'GPX-Export und Countdown',
            pGpxText: 'Jede Fahrt im Bereich „Meine Fahrten“ erhält ihre Frist (<b>T-41</b>) und eine <b>⤓</b>-Schaltfläche für den GPX-Export in voller Auflösung, ein Segment je Teilstück.',
            pGpxMissing: n => n + ' Fahrt(en) ohne Schaltfläche: Kennung nicht auflösbar. WME hat sich vermutlich geändert.',
            pNotEval: 'Position nicht ausgewertet.', pAtCenter: 'In der Kartenmitte:',
            pZones: (z, c) => z + ' verwaltete(r) Bereich(e), ' + c + ' bearbeitbare(s) Land/Länder.',
            pLang: 'Sprache', pLangAuto: l => 'Automatisch (' + l + ')',
            gList: n => 'Fahrtenliste: ' + n + ' neue…',
            gTrace: (a, b) => 'GPS-Spuren: ' + a + ' / ' + b + '…',
            gAdded: n => n + ' Fahrt(en) hinzugefügt.', gNothing: 'Nichts Neues.',
            gFail: m => 'Fehlgeschlagen: ' + m,
            gFailedTraces: n => n + ' GPS-Spur(en) nicht lesbar: sie werden beim nächsten Laden erneut angefordert.',
            xTitle: 'Diese Fahrt als GPX exportieren', xFail: m => 'Export fehlgeschlagen: ' + m,
            xNoTrace: 'diese Fahrt hat keine GPS-Spur',
        },
        es: {
            jm: n => 'D-' + n, jp: n => 'D+' + n,
            jTip: (d, n) => 'Este viaje deja de otorgar permisos el ' + d + ', es decir en ' + n + ' día(s).',
            jTipLast: d => 'Este viaje deja de otorgar permisos el ' + d + ', en menos de un día.',
            jExpTip: d => 'Este viaje ya no otorga permisos desde el ' + d + '.',
            jInfZone: d => 'Su acceso aquí es permanente (área gestionada): esta cuenta atrás no le concierne. A título informativo, este viaje dejaría de otorgar permisos el ' + d + '.',
            jInfPays: (n, d) => 'Usted gestiona ' + n + ' país(es): si este viaje está dentro, su acceso es permanente. Waze no envía la geometría de los países, así que no puede comprobarse aquí. En caso contrario, este viaje deja de otorgar permisos el ' + d + '.',
            bNoHist: 'historial no cargado',
            bNoHistTip: 'Abra la pestaña ' + SCRIPT_NAME + ' (icono Scripts) y cargue el historial de viajes.',
            mZone: 'área gestionada', mCountry: 'país gestionado',
            bPerm: m => 'acceso permanente (' + m + ')',
            bPermDrove: (m, n) => 'acceso permanente (' + m + ') · conducido hace ' + n + ' d',
            bLeft: n => '~' + n + ' d restantes aquí', bExpired: 'permiso caducado aquí (según el cálculo)',
            bLessDay: '< 1 d restante aquí',
            bMax: n => '≤ ' + n + ' d restantes aquí',
            bUnknown: 'área conducida, fecha desconocida', bOutside: 'fuera de su área conducida',
            bOutsideTip: km => 'Ningún viaje conocido a menos de ' + km + ' km del centro del mapa.',
            tipLast: (d, n, km) => 'Último viaje conocido: el ' + d + ' (hace ' + n + ' d, a ' + km + ' km).',
            tipWide: km => '⚠️ Este viaje está más allá del radio que indica WME (' + km + ' km). Se usa porque el polígono de Waze sí lo sitúa dentro de un área conducida, pero nada prueba que fuera este viaje el que la abrió. El que la abrió puede ser más antiguo: la fecha mostrada es un máximo.',
            tipRadiusGuess: m => '⚠️ WME no ha dado el radio de sus permisos: se suponen ' + m + ' mi. Si el suyo es menor, le queda menos tiempo del indicado.',
            tipRule: n => 'Duración asumida: ' + n + ' días tras el viaje (regla del Wazeopedia), que añade «o el último día del mes, lo que sea más tarde»: si ese redondeo existe, la fecha real es posterior a la mostrada. El cálculo se refiere al CENTRO del mapa.',
            tipRetreat: d => 'Retirada estimada el ' + d + '.',
            tipPermHere: 'Aquí su acceso no depende de la conducción.',
            tipMax: (max, age) => 'Está dentro de un área conducida, pero el viaje que la abrió no está en el historial conocido (que abarca ' + age + ' días): es más antiguo, o aún no se ha cargado. Quedan como mucho ' + max + ' días.',
            pLoad: 'Cargar el historial de viajes', pDisplay: 'Visualización',
            sbHint: 'Cuánto duran aquí sus permisos de edición obtenidos conduciendo: la etiqueta junto al nombre de la localidad, las pastillas de «Mis viajes» y la capa de viajes.', sbHelp: 'Ayuda y detalles', lnkDiscuss: 'Hilo Discuss', sbSafe: 'El script nunca modifica el mapa.', majBtn: v => 'La versión ' + v + ' está disponible', majInstall: 'Instalar',
            pLayer: 'Dibujar los viajes, coloreados por vencimiento',
            layerName: 'Viajes (Driving Areas)',
            scDesc: 'Mostrar u ocultar los viajes',
            pShortcut: k => 'Atajo de teclado: <b>' + k + '</b>. La casilla también está en el menú <b>Capas</b> de WME.',
            pShortcutKO: 'Atajo de teclado no disponible (teclas ya ocupadas). La casilla sigue disponible aquí y en el menú Capas.',
            pAsEditor: 'Ignorar mis áreas gestionadas (ver lo que vería un editor sin permisos)',
            pWhat: 'Qué indica la etiqueta',
            pRadiusGuess: 'supuesto',
            pWhatText: (km, d) => 'La cuenta atrás parte del <b>último viaje</b> a menos de ' + km + ' del centro del mapa, más ' + d + ' días. Esa duración viene del Wazeopedia, que añade «o el último día del mes, lo que sea más tarde»: <b>~N d</b> nunca sobrestima el tiempo restante.<br><br>Lo <b>rayado</b> es un límite superior (<b>≤ N d</b>): el viaje que abrió el área es anterior al historial disponible, o solo se encontró más allá del radio que indica WME, o ese radio tuvo que suponerse. La fecha exacta es desconocida, pero no es posterior a la mostrada.',
            pCache: 'Historial en caché', pCacheNone: 'Ningún viaje en caché.',
            pCacheInfo: (n, a, b, age, v) => n + ' viajes, del ' + a + ' al ' + b + ' — es decir ' + age + ' días de cobertura sobre los ' + v + ' de validez.',
            pCacheEmpty: n => 'De los cuales ' + n + ' sin traza GPS (ninguna vía emparejada por Waze): no otorgan permisos y no cuentan.',
            pCacheAt: d => 'Última carga: ' + d + '. El historial se recarga solo pasadas 12 h.',
            pRetention: n => 'Estos viajes (fechas y trazas) se guardan en este navegador, como mucho ' + n + ' días, solo para su cuenta.',
            pCacheNotSaved: '⚠️ No se ha podido guardar el historial: el almacenamiento local de waze.com está lleno. Sigue válido hasta cerrar la página y se volverá a pedir en la próxima carga.',
            pClear: 'Borrar el historial local', pClearConfirm: 'Pulse de nuevo para borrar', pCleared: 'Historial local borrado.',
            pCacheCut: n => '⚠️ ' + n + ' viaje(s) no se han podido conservar: el almacenamiento local de waze.com está lleno (se comparte con sus otros scripts). Se descartaron los más antiguos, y no volverán: el archivo de Waze solo abarca unos 60 días.',
            pLegend: 'Código de colores',
            lgUnit: ' d',
            lgExpired: 'permiso caducado',
            lgPerm: 'acceso permanente, sin cuenta atrás',
            lgApprox: 'fecha incierta: como muy tarde la mostrada',
            lgNone: 'ningún trayecto conocido aquí',
            pGpx: 'Exportación GPX y cuenta atrás',
            pGpxText: 'Cada viaje del panel «Mis viajes» recibe su vencimiento (<b>D-41</b>) y un botón <b>⤓</b> de exportación GPX, a plena resolución, un segmento por tramo.',
            pGpxMissing: n => n + ' viaje(s) sin botón: no se pudo resolver su identificador. Probablemente WME ha cambiado.',
            pNotEval: 'Posición no evaluada.', pAtCenter: 'En el centro del mapa:',
            pZones: (z, c) => z + ' área(s) gestionada(s), ' + c + ' país(es) editable(s).',
            pLang: 'Idioma', pLangAuto: l => 'Automático (' + l + ')',
            gList: n => 'Lista de viajes: ' + n + ' nuevos…',
            gTrace: (a, b) => 'Trazas GPS: ' + a + ' / ' + b + '…',
            gAdded: n => n + ' viaje(s) añadido(s).', gNothing: 'Nada nuevo.',
            gFail: m => 'Error: ' + m,
            gFailedTraces: n => n + ' traza(s) GPS ilegible(s): se volverán a pedir en la próxima carga.',
            xTitle: 'Exportar este viaje en GPX', xFail: m => 'Error de exportación: ' + m,
            xNoTrace: 'este viaje no tiene traza GPS',
        },
        it: {
            jm: n => 'G-' + n, jp: n => 'G+' + n,
            jTip: (d, n) => 'Questo viaggio smette di dare permessi il ' + d + ', cioè fra ' + n + ' giorno/i.',
            jTipLast: d => 'Questo viaggio smette di dare permessi il ' + d + ', fra meno di un giorno.',
            jExpTip: d => 'Questo viaggio non dà più permessi dal ' + d + '.',
            jInfZone: d => 'Il tuo accesso qui è permanente (area gestita): questo conto alla rovescia non ti riguarda. A titolo informativo, questo viaggio smetterebbe di dare permessi il ' + d + '.',
            jInfPays: (n, d) => 'Gestisci ' + n + ' paese/i: se questo viaggio vi rientra, il tuo accesso è permanente. Waze non invia la geometria dei paesi, quindi non è verificabile qui. Altrimenti questo viaggio smette di dare permessi il ' + d + '.',
            bNoHist: 'storico non caricato',
            bNoHistTip: 'Apri la scheda ' + SCRIPT_NAME + ' (icona Scripts) e carica lo storico dei viaggi.',
            mZone: 'area gestita', mCountry: 'paese gestito',
            bPerm: m => 'accesso permanente (' + m + ')',
            bPermDrove: (m, n) => 'accesso permanente (' + m + ') · guidato ' + n + ' g fa',
            bLeft: n => '~' + n + ' g rimasti qui', bExpired: 'permesso scaduto qui (secondo il calcolo)',
            bLessDay: '< 1 g rimasto qui',
            bMax: n => '≤ ' + n + ' g rimasti qui',
            bUnknown: 'area percorsa, data sconosciuta', bOutside: 'fuori dalla tua area percorsa',
            bOutsideTip: km => 'Nessun viaggio noto entro ' + km + ' km dal centro della mappa.',
            tipLast: (d, n, km) => 'Ultimo passaggio noto: il ' + d + ' (' + n + ' g fa, a ' + km + ' km).',
            tipWide: km => '⚠️ Questo viaggio è oltre il raggio indicato da WME (' + km + ' km). Viene usato perché il poligono di Waze ti colloca davvero in un\'area percorsa, ma nulla prova che sia stato questo viaggio ad aprirla. Quello che l’ha aperta può essere più vecchio: la data mostrata è un massimo.',
            tipRadiusGuess: m => '⚠️ WME non ha fornito il raggio dei tuoi permessi: ' + m + ' mi ipotizzate. Se il tuo è più piccolo, ti resta meno tempo di quanto indicato.',
            tipRule: n => 'Durata assunta: ' + n + ' giorni dopo il viaggio (regola del Wazeopedia), che aggiunge «o l\'ultimo giorno del mese, se posteriore»: se questo arrotondamento esiste, la data reale è successiva. Il calcolo riguarda il CENTRO della mappa.',
            tipRetreat: d => 'Rimozione stimata il ' + d + '.',
            tipPermHere: 'Qui il tuo accesso non dipende dalla guida.',
            tipMax: (max, age) => 'Sei in un’area percorsa, ma il viaggio che l’ha aperta non è nello storico noto (che risale a ' + age + ' giorni): è più vecchio, o non ancora caricato. Restano al massimo ' + max + ' giorni.',
            pLoad: 'Carica lo storico dei viaggi', pDisplay: 'Visualizzazione',
            sbHint: 'Quanto durano qui i permessi di modifica ottenuti guidando: il distintivo accanto al nome del comune, le etichette di «I miei viaggi» e il livello dei viaggi.', sbHelp: 'Aiuto e dettagli', lnkDiscuss: 'Discussione su Discuss', sbSafe: 'Lo script non modifica mai la mappa.', majBtn: v => 'La versione ' + v + ' è disponibile', majInstall: 'Installa',
            pLayer: 'Disegna i viaggi, colorati per scadenza',
            layerName: 'Viaggi (Driving Areas)',
            scDesc: 'Mostra o nascondi i viaggi',
            pShortcut: k => 'Scorciatoia da tastiera: <b>' + k + '</b>. La casella è anche nel menu <b>Livelli</b> di WME.',
            pShortcutKO: 'Scorciatoia non disponibile (tasti già occupati). La casella resta qui e nel menu Livelli.',
            pAsEditor: 'Ignora le mie aree gestite (vedi cosa vedrebbe un editor senza permessi)',
            pWhat: 'Cosa indica il distintivo',
            pRadiusGuess: 'ipotizzato',
            pWhatText: (km, d) => 'Il conto alla rovescia parte dall’<b>ultimo passaggio</b> entro ' + km + ' dal centro della mappa, più ' + d + ' giorni. Questa durata viene dal Wazeopedia, che aggiunge «o l’ultimo giorno del mese, se posteriore»: <b>~N g</b> non sovrastima mai il tempo che ti resta.<br><br>Ciò che è <b>tratteggiato</b> è un limite superiore (<b>≤ N g</b>): il viaggio che ha aperto l’area è più vecchio dello storico disponibile, o è stato trovato solo oltre il raggio indicato da WME, o quel raggio è stato ipotizzato. La data esatta è sconosciuta, ma non è successiva a quella mostrata.',
            pCache: 'Storico in cache', pCacheNone: 'Nessun viaggio in cache.',
            pCacheInfo: (n, a, b, age, v) => n + ' viaggi, dal ' + a + ' al ' + b + ' — cioè ' + age + ' giorni di copertura sui ' + v + ' di validità.',
            pCacheEmpty: n => 'Di cui ' + n + ' senza traccia GPS (nessuna strada associata da Waze): non danno permessi e non contano.',
            pCacheAt: d => 'Ultimo caricamento: ' + d + '. Lo storico si ricarica da solo dopo 12 ore.',
            pRetention: n => 'Questi viaggi (date e tracce) restano in questo browser, al massimo ' + n + ' giorni, solo per il tuo account.',
            pCacheNotSaved: '⚠️ Non è stato possibile salvare lo storico: la memoria locale di waze.com è piena. Resta valido fino alla chiusura della pagina e sarà richiesto di nuovo al prossimo caricamento.',
            pClear: 'Cancella lo storico locale', pClearConfirm: 'Clicca di nuovo per cancellare', pCleared: 'Storico locale cancellato.',
            pCacheCut: n => '⚠️ ' + n + ' viaggio/i non hanno potuto essere conservati: la memoria locale di waze.com è piena (è condivisa con gli altri script). I più vecchi sono stati scartati e non torneranno: l’archivio di Waze risale solo a circa 60 giorni.',
            pLegend: 'Codice colori',
            lgUnit: ' g',
            lgExpired: 'permesso scaduto',
            lgPerm: 'accesso permanente, nessun conto alla rovescia',
            lgApprox: 'data incerta: al più tardi quella mostrata',
            lgNone: 'nessun viaggio noto qui',
            pGpx: 'Esportazione GPX e conto alla rovescia',
            pGpxText: 'Ogni viaggio del pannello «I miei viaggi» riceve la sua scadenza (<b>G-41</b>) e un pulsante <b>⤓</b> di esportazione GPX, a piena risoluzione, un segmento per tratto.',
            pGpxMissing: n => n + ' viaggio/i senza pulsante: identificativo non risolto. WME è probabilmente cambiato.',
            pNotEval: 'Posizione non valutata.', pAtCenter: 'Al centro della mappa:',
            pZones: (z, c) => z + ' area/e gestita/e, ' + c + ' paese/i modificabile/i.',
            pLang: 'Lingua', pLangAuto: l => 'Automatico (' + l + ')',
            gList: n => 'Elenco viaggi: ' + n + ' nuovi…',
            gTrace: (a, b) => 'Tracce GPS: ' + a + ' / ' + b + '…',
            gAdded: n => n + ' viaggio/i aggiunto/i.', gNothing: 'Niente di nuovo.',
            gFail: m => 'Errore: ' + m,
            gFailedTraces: n => n + ' traccia/e GPS illeggibile/i: sarà/saranno richiesta/e di nuovo al prossimo caricamento.',
            xTitle: 'Esporta questo viaggio in GPX', xFail: m => 'Esportazione fallita: ' + m,
            xNoTrace: 'questo viaggio non ha traccia GPS',
        },
        'pt-BR': {
            jm: n => 'D-' + n, jp: n => 'D+' + n,
            jTip: (d, n) => 'Este trajeto deixa de conceder permissões em ' + d + ', ou seja, em ' + n + ' dia(s).',
            jTipLast: d => 'Este trajeto deixa de conceder permissões em ' + d + ', em menos de um dia.',
            jExpTip: d => 'Este trajeto não concede permissões desde ' + d + '.',
            jInfZone: d => 'Seu acesso aqui é permanente (área gerenciada): esta contagem não lhe diz respeito. A título informativo, este trajeto deixaria de conceder permissões em ' + d + '.',
            jInfPays: (n, d) => 'Você gerencia ' + n + ' país(es): se este trajeto estiver dentro, seu acesso é permanente. O Waze não envia a geometria dos países, então isso não pode ser verificado aqui. Caso contrário, este trajeto deixa de conceder permissões em ' + d + '.',
            bNoHist: 'histórico não carregado',
            bNoHistTip: 'Abra a aba ' + SCRIPT_NAME + ' (ícone Scripts) e carregue o histórico de trajetos.',
            mZone: 'área gerenciada', mCountry: 'país gerenciado',
            bPerm: m => 'acesso permanente (' + m + ')',
            bPermDrove: (m, n) => 'acesso permanente (' + m + ') · dirigido há ' + n + ' d',
            bLeft: n => '~' + n + ' d restantes aqui', bExpired: 'permissão expirada aqui (conforme o cálculo)',
            bLessDay: '< 1 d restante aqui',
            bMax: n => '≤ ' + n + ' d restantes aqui',
            bUnknown: 'área percorrida, data desconhecida', bOutside: 'fora da sua área percorrida',
            bOutsideTip: km => 'Nenhum trajeto conhecido a menos de ' + km + ' km do centro do mapa.',
            tipLast: (d, n, km) => 'Última passagem conhecida: em ' + d + ' (há ' + n + ' d, a ' + km + ' km).',
            tipWide: km => '⚠️ Este trajeto está além do raio informado pelo WME (' + km + ' km). Ele é usado porque o polígono do Waze de fato coloca você numa área percorrida, mas nada prova que tenha sido ele a abri-la. O que a abriu pode ser mais antigo: a data mostrada é um máximo.',
            tipRadiusGuess: m => '⚠️ O WME não informou o raio das suas permissões: ' + m + ' mi presumidas. Se o seu for menor, resta menos tempo do que o mostrado.',
            tipRule: n => 'Duração adotada: ' + n + ' dias após o trajeto (regra do Wazeopedia), que acrescenta «ou o último dia do mês, o que for mais tarde»: se esse arredondamento existir, a data real é posterior. O cálculo vale para o CENTRO do mapa.',
            tipRetreat: d => 'Remoção estimada em ' + d + '.',
            tipPermHere: 'Aqui seu acesso não depende de dirigir.',
            tipMax: (max, age) => 'Você está numa área percorrida, mas o trajeto que a abriu não está no histórico conhecido (que cobre ' + age + ' dias): é mais antigo, ou ainda não foi carregado. Restam no máximo ' + max + ' dias.',
            pLoad: 'Carregar o histórico de trajetos', pDisplay: 'Exibição',
            sbHint: 'Quanto tempo duram aqui as suas permissões de edição obtidas dirigindo: o distintivo ao lado do nome do município, as etiquetas de «Meus trajetos» e a camada de trajetos.', sbHelp: 'Ajuda e detalhes', lnkDiscuss: 'Tópico Discuss', sbSafe: 'O script nunca altera o mapa.', majBtn: v => 'A versão ' + v + ' está disponível', majInstall: 'Instalar',
            pLayer: 'Desenhar os trajetos, coloridos por vencimento',
            layerName: 'Trajetos (Driving Areas)',
            scDesc: 'Mostrar ou ocultar os trajetos',
            pShortcut: k => 'Atalho de teclado: <b>' + k + '</b>. A caixa também está no menu <b>Camadas</b> do WME.',
            pShortcutKO: 'Atalho de teclado indisponível (teclas já ocupadas). A caixa continua aqui e no menu Camadas.',
            pAsEditor: 'Ignorar minhas áreas gerenciadas (ver o que veria um editor sem permissões)',
            pWhat: 'O que o distintivo indica',
            pRadiusGuess: 'presumido',
            pWhatText: (km, d) => 'A contagem parte da <b>última passagem</b> a menos de ' + km + ' do centro do mapa, mais ' + d + ' dias. Essa duração vem do Wazeopedia, que acrescenta «ou o último dia do mês, o que for mais tarde»: <b>~N d</b> nunca superestima o tempo restante.<br><br>O que está <b>hachurado</b> é um limite superior (<b>≤ N d</b>): o trajeto que abriu a área é anterior ao histórico disponível, ou só foi encontrado além do raio informado pelo WME, ou esse raio teve de ser presumido. A data exata é desconhecida, mas não é posterior à mostrada.',
            pCache: 'Histórico em cache', pCacheNone: 'Nenhum trajeto em cache.',
            pCacheInfo: (n, a, b, age, v) => n + ' trajetos, de ' + a + ' a ' + b + ' — ou seja ' + age + ' dias de cobertura sobre os ' + v + ' de validade.',
            pCacheEmpty: n => 'Dos quais ' + n + ' sem traço GPS (nenhuma via associada pelo Waze): não concedem permissões e não contam.',
            pCacheAt: d => 'Último carregamento: ' + d + '. O histórico se recarrega sozinho após 12 h.',
            pRetention: n => 'Esses trajetos (datas e traços) ficam neste navegador, no máximo ' + n + ' dias, apenas para a sua conta.',
            pCacheNotSaved: '⚠️ Não foi possível salvar o histórico: o armazenamento local do waze.com está cheio. Ele vale até fechar a página e será pedido de novo no próximo carregamento.',
            pClear: 'Apagar o histórico local', pClearConfirm: 'Clique de novo para apagar', pCleared: 'Histórico local apagado.',
            pCacheCut: n => '⚠️ ' + n + ' trajeto(s) não puderam ser mantidos: o armazenamento local do waze.com está cheio (é compartilhado com seus outros scripts). Os mais antigos foram descartados e não voltarão: o arquivo do Waze só guarda cerca de 60 dias.',
            pLegend: 'Código de cores',
            lgUnit: ' d',
            lgExpired: 'permissão expirada',
            lgPerm: 'acesso permanente, sem contagem',
            lgApprox: 'data incerta: no máximo a mostrada',
            lgNone: 'nenhum trajeto conhecido aqui',
            pGpx: 'Exportação GPX e contagem regressiva',
            pGpxText: 'Cada trajeto do painel «Meus trajetos» recebe seu vencimento (<b>D-41</b>) e um botão <b>⤓</b> de exportação GPX, em resolução plena, um segmento por trecho.',
            pGpxMissing: n => n + ' trajeto(s) sem botão: o identificador não pôde ser resolvido. O WME provavelmente mudou.',
            pNotEval: 'Posição não avaliada.', pAtCenter: 'No centro do mapa:',
            pZones: (z, c) => z + ' área(s) gerenciada(s), ' + c + ' país(es) editável(is).',
            pLang: 'Idioma', pLangAuto: l => 'Automático (' + l + ')',
            gList: n => 'Lista de trajetos: ' + n + ' novos…',
            gTrace: (a, b) => 'Traços GPS: ' + a + ' / ' + b + '…',
            gAdded: n => n + ' trajeto(s) adicionado(s).', gNothing: 'Nada novo.',
            gFail: m => 'Falha: ' + m,
            gFailedTraces: n => n + ' traço(s) GPS ilegível(is): será(ão) pedido(s) de novo no próximo carregamento.',
            xTitle: 'Exportar este trajeto em GPX', xFail: m => 'Falha na exportação: ' + m,
            xNoTrace: 'este trajeto não tem traço GPS',
        },
        'pt-PT': {
            jm: n => 'D-' + n, jp: n => 'D+' + n,
            jTip: (d, n) => 'Este trajeto deixa de conceder permissões a ' + d + ', ou seja, dentro de ' + n + ' dia(s).',
            jTipLast: d => 'Este trajeto deixa de conceder permissões a ' + d + ', dentro de menos de um dia.',
            jExpTip: d => 'Este trajeto já não concede permissões desde ' + d + '.',
            jInfZone: d => 'O seu acesso aqui é permanente (área gerida): esta contagem não lhe diz respeito. A título informativo, este trajeto deixaria de conceder permissões a ' + d + '.',
            jInfPays: (n, d) => 'Gere ' + n + ' país(es): se este trajeto estiver dentro, o seu acesso é permanente. O Waze não envia a geometria dos países, pelo que não é verificável aqui. Caso contrário, este trajeto deixa de conceder permissões a ' + d + '.',
            bNoHist: 'histórico não carregado',
            bNoHistTip: 'Abra o separador ' + SCRIPT_NAME + ' (ícone Scripts) e carregue o histórico de trajetos.',
            mZone: 'área gerida', mCountry: 'país gerido',
            bPerm: m => 'acesso permanente (' + m + ')',
            bPermDrove: (m, n) => 'acesso permanente (' + m + ') · conduzido há ' + n + ' d',
            bLeft: n => '~' + n + ' d restantes aqui', bExpired: 'permissão expirada aqui (segundo o cálculo)',
            bLessDay: '< 1 d restante aqui',
            bMax: n => '≤ ' + n + ' d restantes aqui',
            bUnknown: 'área percorrida, data desconhecida', bOutside: 'fora da sua área percorrida',
            bOutsideTip: km => 'Nenhum trajeto conhecido a menos de ' + km + ' km do centro do mapa.',
            tipLast: (d, n, km) => 'Última passagem conhecida: a ' + d + ' (há ' + n + ' d, a ' + km + ' km).',
            tipWide: km => '⚠️ Este trajeto está além do raio indicado pelo WME (' + km + ' km). É usado porque o polígono do Waze o coloca de facto numa área percorrida, mas nada prova que tenha sido ele a abri-la. O que a abriu pode ser mais antigo: a data indicada é um máximo.',
            tipRadiusGuess: m => '⚠️ O WME não indicou o raio das suas permissões: ' + m + ' mi presumidas. Se o seu for menor, resta menos tempo do que o indicado.',
            tipRule: n => 'Duração adotada: ' + n + ' dias após o trajeto (regra do Wazeopedia), que acrescenta «ou o último dia do mês, o que for mais tarde»: se esse arredondamento existir, a data real é posterior. O cálculo vale para o CENTRO do mapa.',
            tipRetreat: d => 'Remoção estimada a ' + d + '.',
            tipPermHere: 'Aqui o seu acesso não depende de conduzir.',
            tipMax: (max, age) => 'Está numa área percorrida, mas o trajeto que a abriu não está no histórico conhecido (que cobre ' + age + ' dias): é mais antigo, ou ainda não foi carregado. Restam no máximo ' + max + ' dias.',
            pLoad: 'Carregar o histórico de trajetos', pDisplay: 'Visualização',
            sbHint: 'Quanto tempo duram aqui as suas permissões de edição obtidas a conduzir: o distintivo junto ao nome do concelho, as etiquetas de «Os meus trajetos» e a camada de trajetos.', sbHelp: 'Ajuda e detalhes', lnkDiscuss: 'Tópico Discuss', sbSafe: 'O script nunca altera o mapa.', majBtn: v => 'A versão ' + v + ' está disponível', majInstall: 'Instalar',
            pLayer: 'Desenhar os trajetos, coloridos por prazo',
            layerName: 'Trajetos (Driving Areas)',
            scDesc: 'Mostrar ou ocultar os trajetos',
            pShortcut: k => 'Atalho de teclado: <b>' + k + '</b>. A caixa também está no menu <b>Camadas</b> do WME.',
            pShortcutKO: 'Atalho de teclado indisponível (teclas já ocupadas). A caixa continua aqui e no menu Camadas.',
            pAsEditor: 'Ignorar as minhas áreas geridas (ver o que veria um editor sem permissões)',
            pWhat: 'O que o distintivo indica',
            pRadiusGuess: 'presumido',
            pWhatText: (km, d) => 'A contagem parte da <b>última passagem</b> a menos de ' + km + ' do centro do mapa, mais ' + d + ' dias. Esta duração vem do Wazeopedia, que acrescenta «ou o último dia do mês, o que for mais tarde»: <b>~N d</b> nunca sobrestima o tempo restante.<br><br>O que está <b>tracejado</b> é um limite superior (<b>≤ N d</b>): o trajeto que abriu a área é anterior ao histórico disponível, ou só foi encontrado para lá do raio indicado pelo WME, ou esse raio teve de ser presumido. A data exata é desconhecida, mas não é posterior à indicada.',
            pCache: 'Histórico em cache', pCacheNone: 'Nenhum trajeto em cache.',
            pCacheInfo: (n, a, b, age, v) => n + ' trajetos, de ' + a + ' a ' + b + ' — ou seja ' + age + ' dias de cobertura sobre os ' + v + ' de validade.',
            pCacheEmpty: n => 'Dos quais ' + n + ' sem traço GPS (nenhuma via associada pelo Waze): não concedem permissões e não contam.',
            pCacheAt: d => 'Último carregamento: ' + d + '. O histórico recarrega-se sozinho após 12 h.',
            pRetention: n => 'Estes trajetos (datas e traços) ficam neste navegador, no máximo ' + n + ' dias, apenas para a sua conta.',
            pCacheNotSaved: '⚠️ Não foi possível guardar o histórico: o armazenamento local do waze.com está cheio. Vale até fechar a página e será pedido de novo no próximo carregamento.',
            pClear: 'Apagar o histórico local', pClearConfirm: 'Clique novamente para apagar', pCleared: 'Histórico local apagado.',
            pCacheCut: n => '⚠️ ' + n + ' trajeto(s) não puderam ser mantidos: o armazenamento local do waze.com está cheio (é partilhado com os seus outros scripts). Os mais antigos foram descartados e não voltarão: o arquivo do Waze só guarda cerca de 60 dias.',
            pLegend: 'Código de cores',
            lgUnit: ' d',
            lgExpired: 'permissão expirada',
            lgPerm: 'acesso permanente, sem contagem',
            lgApprox: 'data incerta: no máximo a indicada',
            lgNone: 'nenhum trajeto conhecido aqui',
            pGpx: 'Exportação GPX e contagem decrescente',
            pGpxText: 'Cada trajeto do painel «Os meus trajetos» recebe o seu prazo (<b>D-41</b>) e um botão <b>⤓</b> de exportação GPX, em resolução plena, um segmento por troço.',
            pGpxMissing: n => n + ' trajeto(s) sem botão: o identificador não pôde ser resolvido. O WME provavelmente mudou.',
            pNotEval: 'Posição não avaliada.', pAtCenter: 'No centro do mapa:',
            pZones: (z, c) => z + ' área(s) gerida(s), ' + c + ' país(es) editável(eis).',
            pLang: 'Idioma', pLangAuto: l => 'Automático (' + l + ')',
            gList: n => 'Lista de trajetos: ' + n + ' novos…',
            gTrace: (a, b) => 'Traços GPS: ' + a + ' / ' + b + '…',
            gAdded: n => n + ' trajeto(s) adicionado(s).', gNothing: 'Nada de novo.',
            gFail: m => 'Falha: ' + m,
            gFailedTraces: n => n + ' traço(s) GPS ilegível(is): será(ão) pedido(s) de novo no próximo carregamento.',
            xTitle: 'Exportar este trajeto em GPX', xFail: m => 'Falha na exportação: ' + m,
            xNoTrace: 'este trajeto não tem traço GPS',
        },
        he: {
            jm: n => 'י-' + n, jp: n => 'י+' + n,
            jTip: (d, n) => 'נסיעה זו מפסיקה להעניק הרשאות בתאריך ' + d + ', כלומר בעוד ' + (n === 1 ? 'יום אחד' : n + ' ימים') + '.',
            jTipLast: d => 'נסיעה זו מפסיקה להעניק הרשאות בתאריך ' + d + ', בעוד פחות מיום.',
            jExpTip: d => 'נסיעה זו אינה מעניקה הרשאות מאז ' + d + '.',
            jInfZone: d => 'הגישה שלכם כאן קבועה (אזור מנוהל): הספירה הזו אינה נוגעת לכם. לידיעה, נסיעה זו הייתה מפסיקה להעניק הרשאות בתאריך ' + d + '.',
            jInfPays: (n, d) => 'אתם מנהלים ' + n + ' מדינות: אם נסיעה זו נמצאת בהן, הגישה שלכם קבועה. Waze אינו שולח גאומטריה של מדינות, ולכן לא ניתן לבדוק זאת כאן. אחרת, נסיעה זו מפסיקה להעניק הרשאות בתאריך ' + d + '.',
            bNoHist: 'ההיסטוריה לא נטענה',
            bNoHistTip: 'פתחו את הלשונית ' + SCRIPT_NAME + ' (סמל Scripts) וטענו את היסטוריית הנסיעות.',
            mZone: 'אזור מנוהל', mCountry: 'מדינה מנוהלת',
            bPerm: m => 'גישה קבועה (' + m + ')',
            bPermDrove: (m, n) => 'גישה קבועה (' + m + ') · נסיעה לפני ' + (n === 1 ? 'יום אחד' : n + ' ימים') + '',
            bLeft: n => 'נותרו כאן ~' + (n === 1 ? 'יום אחד' : n + ' ימים') + '', bExpired: 'ההרשאה כאן פגה (לפי החישוב)',
            bLessDay: 'נותר כאן פחות מיום אחד',
            bMax: n => 'נותרו כאן ' + (n === 1 ? 'יום אחד' : n + ' ימים') + ' לכל היותר',
            bUnknown: 'אזור שנסעתם בו, תאריך לא ידוע', bOutside: 'מחוץ לאזור הנסיעה שלכם',
            bOutsideTip: km => 'אין נסיעה ידועה במרחק של עד ' + km + ' ק"מ ממרכז המפה.',
            tipLast: (d, n, km) => 'הנסיעה הידועה האחרונה: ' + d + ' (לפני ' + (n === 1 ? 'יום אחד' : n + ' ימים') + ', במרחק ' + km + ' ק"מ).',
            tipWide: km => '⚠️ נסיעה זו נמצאת מעבר לרדיוס ש-WME מדווח עליו (' + km + ' ק"מ). היא נלקחת בחשבון משום שהמצולע של Waze אכן ממקם אתכם באזור נסיעה, אך אין הוכחה שדווקא היא פתחה אותו. הנסיעה שפתחה אותו עשויה להיות ישנה יותר: התאריך המוצג הוא מקסימום.',
            tipRadiusGuess: m => '⚠️ WME לא מסר את רדיוס ההרשאות שלך: מונחים ' + m + ' מייל. אם שלך קטן יותר, נותר לך פחות זמן מהמוצג.',
            tipRule: n => 'משך שנלקח: ' + (n === 1 ? 'יום אחד' : n + ' ימים') + ' לאחר הנסיעה (כלל ה-Wazeopedia), שמוסיף «או היום האחרון של החודש, המאוחר מביניהם»: אם עיגול זה קיים, התאריך האמיתי מאוחר יותר. החישוב מתייחס למרכז המפה.',
            tipRetreat: d => 'הסרה משוערת בתאריך ' + d + '.',
            tipPermHere: 'כאן הגישה שלכם אינה תלויה בנסיעה.',
            tipMax: (max, age) => 'אתם באזור נסיעה, אך הנסיעה שפתחה אותו אינה בהיסטוריה המוכרת (שמגיעה ' + (age === 1 ? 'יום אחד' : age + ' ימים') + ' אחורה): היא ישנה יותר, או שטרם נטענה. נותרו לכל היותר ' + (max === 1 ? 'יום אחד' : max + ' ימים') + '.',
            pLoad: 'טעינת היסטוריית הנסיעות', pDisplay: 'תצוגה',
            sbHint: 'כמה זמן נמשכות כאן הרשאות העריכה שהושגו בנסיעה: התג ליד שם היישוב, התוויות ב„הנסיעות שלי” ושכבת הנסיעות.', sbHelp: 'עזרה ופרטים', lnkDiscuss: 'שרשור Discuss', sbSafe: 'הסקריפט לעולם אינו משנה את המפה.', majBtn: v => 'גרסה ' + v + ' זמינה', majInstall: 'התקנה',
            pLayer: 'ציור הנסיעות, צבועות לפי מועד הפקיעה',
            layerName: 'נסיעות (Driving Areas)',
            scDesc: 'הצגה או הסתרה של הנסיעות',
            pShortcut: k => 'קיצור מקלדת: <b>' + k + '</b>. התיבה נמצאת גם בתפריט <b>שכבות</b> של WME.',
            pShortcutKO: 'קיצור המקלדת אינו זמין (המקשים תפוסים). התיבה עדיין זמינה כאן ובתפריט השכבות.',
            pAsEditor: 'התעלמות מהאזורים המנוהלים שלי (לראות מה יראה עורך ללא הרשאות)',
            pWhat: 'מה מציין התג',
            pRadiusGuess: 'משוער',
            pWhatText: (km, d) => 'הספירה מתחילה מה<b>נסיעה האחרונה</b> במרחק של עד ' + km + ' ממרכז המפה, בתוספת ' + d + ' ימים. משך זה מגיע מה-Wazeopedia, שמוסיף «או היום האחרון של החודש, המאוחר מביניהם»: לכן <b>~N ימים</b> לעולם אינו מגזים בזמן שנותר.<br><br>מה שמסומן ב<b>קווקוו</b> הוא גבול עליון (<b>עד N ימים</b>): הנסיעה שפתחה את האזור ישנה מההיסטוריה הזמינה, או נמצאה רק מעבר לרדיוס ש-WME מדווח, או שהרדיוס הזה הונח. התאריך המדויק אינו ידוע, אך הוא אינו מאוחר מזה המוצג.',
            pCache: 'היסטוריה במטמון', pCacheNone: 'אין נסיעות במטמון.',
            pCacheInfo: (n, a, b, age, v) => n + ' נסיעות, מ-' + a + ' עד ' + b + ' — כלומר ' + age + ' ימי כיסוי מתוך ' + v + ' ימי התוקף.',
            pCacheEmpty: n => 'מתוכן ' + n + ' ללא מסלול GPS (Waze לא התאים אף כביש): הן אינן מעניקות הרשאות ואינן נספרות.',
            pCacheAt: d => 'טעינה אחרונה: ' + d + '. ההיסטוריה נטענת מחדש מעצמה אחרי 12 שעות.',
            pRetention: n => 'נסיעות אלה (תאריכים ומסלולים) נשמרות בדפדפן זה, לכל היותר ' + (n === 1 ? 'יום אחד' : n + ' ימים') + ', לחשבונך בלבד.',
            pCacheNotSaved: '⚠️ לא ניתן היה לשמור את ההיסטוריה: האחסון המקומי של waze.com מלא. היא תקפה עד לסגירת הדף ותתבקש שוב בטעינה הבאה.',
            pClear: 'מחיקת ההיסטוריה המקומית', pClearConfirm: 'לחצו שוב כדי למחוק', pCleared: 'ההיסטוריה המקומית נמחקה.',
            pCacheCut: n => '⚠️ ' + n + ' נסיעות לא נשמרו: האחסון המקומי של waze.com מלא (הוא משותף עם הסקריפטים האחרים שלך). הישנות ביותר נמחקו והן לא יחזרו: הארכיון של Waze שומר רק כ-60 יום.',
            pLegend: 'מקרא צבעים',
            lgUnit: ' ימים',
            lgExpired: 'ההרשאה פגה',
            lgPerm: 'גישה קבועה, ללא ספירה',
            lgApprox: 'תאריך לא ודאי: לכל המאוחר זה המוצג',
            lgNone: 'אין נסיעה ידועה כאן',
            pGpx: 'ייצוא GPX וספירה לאחור',
            pGpxText: 'כל נסיעה בלוח «הנסיעות שלי» מקבלת את מועד הפקיעה שלה (<b>י-41</b>) ולחצן <b>⤓</b> לייצוא GPX ברזולוציה מלאה, מקטע אחד לכל קטע נסיעה.',
            pGpxMissing: n => n + ' נסיעות ללא לחצן: לא ניתן היה לאתר את המזהה שלהן. ככל הנראה WME השתנה.',
            pNotEval: 'המיקום לא הוערך.', pAtCenter: 'במרכז המפה:',
            pZones: (z, c) => z + ' אזורים מנוהלים, ' + c + ' מדינות ניתנות לעריכה.',
            pLang: 'שפה', pLangAuto: l => 'אוטומטי (' + l + ')',
            gList: n => 'רשימת נסיעות: ' + n + ' חדשות…',
            gTrace: (a, b) => 'מסלולי GPS: ' + a + ' / ' + b + '…',
            gAdded: n => n + ' נסיעות נוספו.', gNothing: 'אין חדש.',
            gFail: m => 'נכשל: ' + m,
            gFailedTraces: n => n + ' מסלולי GPS לא נקראו: הם יתבקשו שוב בטעינה הבאה.',
            xTitle: 'ייצוא נסיעה זו כ-GPX', xFail: m => 'הייצוא נכשל: ' + m,
            xNoTrace: 'לנסיעה זו אין מסלול GPS',
        }
    };

    // La langue des DATES et des NOMBRES suit celle du script, pas celle du navigateur : un Chrome
    // en en-US avec le script en français écrivait « 9/25/2026 », et « 6.437 km » (audit du
    // 25/09/2026). La variante régionale du navigateur est gardée quand elle est de la même langue.
    const locale = () => {
        const nav = navigator.language || '';
        return (!_lang.includes('-') && nav.toLowerCase().startsWith(_lang)) ? nav : _lang;
    };
    const dateCourte = ms => new Date(ms).toLocaleDateString(locale());
    const dateHeure = ms => new Date(ms).toLocaleString(locale());
    const nombre = (x, dec) => x.toLocaleString(locale(), { maximumFractionDigits: dec });

    const t = (key, ...args) => {
        const s = DICO[_lang] || DICO.en;
        let v = s[key];
        if (v === undefined) v = DICO.en[key];
        if (typeof v === 'function') return v(...args);
        return v !== undefined ? v : key;
    };

    // =====================================================================
    //  Géométrie — les GeoJSON de Waze sont en WGS84 (lon/lat), pas en Web Mercator
    // =====================================================================

    // Projection locale : à 43° de latitude, 1° de longitude fait ~81 km contre ~111 km pour
    // la latitude. Sans cette correction le rayon devient un ovale et les dates sont fausses
    // sans que rien ne le signale.
    function projecteur(lat0) {
        const kx = 111320 * Math.cos(lat0 * RAD);
        const ky = 110540;
        return (lon, lat) => [lon * kx, lat * ky];
    }

    function distPointSegment(px, py, ax, ay, bx, by) {
        const dx = bx - ax, dy = by - ay;
        const l2 = dx * dx + dy * dy;
        let u = l2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / l2;
        u = Math.max(0, Math.min(1, u));
        return Math.hypot(px - (ax + u * dx), py - (ay + u * dy));
    }

    function dansAnneau(lon, lat, ring) {
        let dedans = false;
        for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
            const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
            if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) dedans = !dedans;
        }
        return dedans;
    }
    function dansPolygone(lon, lat, coords) {
        if (!dansAnneau(lon, lat, coords[0])) return false;
        for (let k = 1; k < coords.length; k++) if (dansAnneau(lon, lat, coords[k])) return false;
        return true;
    }
    function dansGeometrie(lon, lat, geom) {
        if (!geom) return false;
        if (geom.type === 'Polygon') return dansPolygone(lon, lat, geom.coordinates);
        if (geom.type === 'MultiPolygon') return geom.coordinates.some(c => dansPolygone(lon, lat, c));
        return false;
    }

    // =====================================================================
    //  API Waze — same-origin, donc un fetch() ordinaire passe
    // =====================================================================

    const wmeEnv = () => {
        try {
            return (location.pathname.match(/^\/(\w+)-editor/) || [])[1]
                || (pw.W?.Config?.server?.baseUrl?.match(/\/(\w+)-Descartes/) || [])[1]
                || 'row';
        } catch (e) { return 'row'; }
    };
    const api = chemin => '/' + wmeEnv() + '-Descartes/app/' + chemin;

    async function getJSON(url) {
        // fetch de la PAGE : même origine que WME, donc ses cookies de session.
        const r = await (pw.fetch ? pw.fetch.bind(pw) : fetch)(url, { credentials: 'include' });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
    }

    // Le rayon est LU (editableMiles), jamais déduit du niveau : une table 1/2/3/4 miles codée
    // en dur est une borne qui se périme sans prévenir.
    function lireZones() {
        const u = pw.W?.loginManager?.user?.attributes || {};
        const areas = u.areas || [];
        return {
            drive: areas.filter(a => a.type === 'drive').map(a => a.geometry),
            managed: areas.filter(a => a.type === 'managed').map(a => a.geometry),
            miles: (typeof u.editableMiles === 'number' && u.editableMiles > 0) ? u.editableMiles : DEFAULT_MILES,
            // Faux quand WME n'a pas donné le rayon et qu'on a pris DEFAULT_MILES : si le vrai est
            // plus petit, le trajet retenu est peut-être hors de portée. Le verdict le dit alors.
            rayonLu: typeof u.editableMiles === 'number' && u.editableMiles > 0,
            countries: u.editableCountryIDs || []
        };
    }

    // minDistance=0 est IMPORTANT : le défaut de WME (1000) écarte les trajets de moins d'un
    // kilomètre, soit 41 % d'entre eux sur le compte de test — et ils ouvrent des droits.
    async function pageArchive(offset) {
        const j = await getJSON(api('Archive/List') + '?count=' + PAGE + '&minDistance=0&offset=' + offset + '&username=');
        return (j.archives && j.archives.objects) || [];
    }

    async function traceDe(id) {
        const j = await getJSON(api('Archive/SessionGPS') + '?id=' + encodeURIComponent(id));
        // Une réponse d'une autre FORME n'est pas une trace vide : mémorisée comme telle, elle
        // restait « sans trace » pendant 130 jours. On lève, et le trajet sera redemandé.
        if (!j || (j.archiveSessions !== undefined && !Array.isArray(j.archiveSessions.objects))) {
            throw new Error('réponse SessionGPS inattendue');
        }
        const sessions = (j.archiveSessions && j.archiveSessions.objects) || [];
        const pts = [];
        let dernier = null, proj = null;
        for (const s of sessions) {
            for (const part of (s.driveParts || [])) {
                const co = part.geometry && part.geometry.coordinates;
                if (!co) continue;
                for (const c of co) {
                    if (!proj) proj = projecteur(c[1]);
                    if (dernier) {
                        const a = proj(dernier[0], dernier[1]), b = proj(c[0], c[1]);
                        if (Math.hypot(a[0] - b[0], a[1] - b[1]) < DECIM_M) continue;
                    }
                    pts.push(c[0], c[1]);
                    dernier = c;
                }
                dernier = null;   // coupure entre deux driveParts : ne pas relier
            }
        }
        return pts;
    }

    function bboxDe(pts) {
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
        for (let i = 0; i < pts.length; i += 2) {
            if (pts[i] < x0) x0 = pts[i];
            if (pts[i] > x1) x1 = pts[i];
            if (pts[i + 1] < y0) y0 = pts[i + 1];
            if (pts[i + 1] > y1) y1 = pts[i + 1];
        }
        return [x0, y0, x1, y1];
    }

    // =====================================================================
    //  Cache local
    // =====================================================================

    // Le compte connecté. ⚠️ Le cache lui appartient : la 0.06.00 le rangeait sous une clé fixe, et
    // un second compte ouvert dans le même navigateur héritait des trajets du premier — des « ~85 j »
    // qui n'étaient pas les siens, et ses traces sur le calque (audit du 25/09/2026). L'identifiant
    // est `W.loginManager.user.attributes.id`, un nombre (relevé dans WME le 25/09/2026).
    function proprietaire() {
        const id = pw.W?.loginManager?.user?.attributes?.id;
        return (id === undefined || id === null) ? null : id;
    }

    function lireCache() {
        const moi = proprietaire();
        for (const k of [LS_KEY, LS_KEY_OLD]) {
            try {
                const c = JSON.parse(localStorage.getItem(k) || 'null');
                if (c && Array.isArray(c.drives)) {
                    if (c.owner != null && moi != null && c.owner !== moi) {
                        log('cache d\'un autre compte : ignoré');
                        return { at: 0, drives: [], owner: moi };
                    }
                    // Un cache d'avant la 0.07.00 n'a pas de propriétaire : il est au compte courant.
                    if (c.owner == null) c.owner = moi;
                    // Purge AUSSI à la lecture : faite seulement à l'écriture, elle laissait un
                    // cache jamais rechargé garder ses trajets sans limite.
                    const limite = Date.now() - PURGE_DAYS * D_MS;
                    c.drives = c.drives.filter(d => d.t >= limite);
                    // Repris de l'ancien nom (WME Area Countdown) : réécrit sous la nouvelle clé, et
                    // l'ancienne retirée — elle restait sinon, copie morte, dans le quota partagé.
                    if (k === LS_KEY_OLD) { if (ecrireCache(c)) { try { localStorage.removeItem(LS_KEY_OLD); } catch (e) { } } }
                    else { try { localStorage.removeItem(LS_KEY_OLD); } catch (e) { } }
                    return c;
                }
            } catch (e) { log('cache illisible (' + k + ') : ' + e.message); }
        }
        return { at: 0, drives: [], owner: moi };
    }

    // Waze descend ses coordonnées en flottants pleine précision : une quinzaine de caractères
    // chacune une fois en JSON, pour des traces décimées à 400 m. Cinq décimales valent 1 m et
    // divisent par deux le poids stocké — donc le risque de saturer le quota, qui est partagé
    // par TOUS les scripts de waze.com. L'export GPX n'est pas concerné : il refait son propre
    // appel à SessionGPS, en pleine résolution.
    const arrondi5 = x => Math.round(x * 1e5) / 1e5;

    function ecrireCache(c) {
        const limite = Date.now() - PURGE_DAYS * D_MS;
        c.drives = c.drives.filter(d => d.t >= limite);
        for (const d of c.drives) {
            for (let i = 0; i < d.pts.length; i++) d.pts[i] = arrondi5(d.pts[i]);
        }
        c.tronque = 0;
        c.echecEcriture = false;
        try { localStorage.setItem(LS_KEY, JSON.stringify(c)); return true; }
        catch (e) {
            // Cette perte ne se voyait QUE dans la console : l'historique se vidait par le bas
            // et rien à l'écran ne le disait. Le compte est mémorisé pour que le panneau
            // l'affiche — cf. le retour d'OliveStChi, qui a cru le script fautif.
            log('quota localStorage (' + e.name + ') — on garde les 180 trajets les plus récents');
            c.drives.sort((a, b) => b.t - a.t);
            c.tronque = Math.max(0, c.drives.length - 180);
            c.drives = c.drives.slice(0, 180);
            try { localStorage.setItem(LS_KEY, JSON.stringify(c)); return true; }
            catch (e2) {
                // Rien n'est passé : ce n'est pas une troncature, c'est un historique NON
                // ENREGISTRÉ. Il vit en mémoire jusqu'à la fermeture de la page, et sera
                // redemandé au prochain chargement. Le panneau le dit comme tel.
                log('échec d\'écriture du cache : ' + e2.message);
                c.tronque = 0;
                c.echecEcriture = true;
                return false;
            }
        }
    }

    function lireOpts() {
        for (const k of [LS_OPT, LS_OPT_OLD]) {
            try {
                const o = JSON.parse(localStorage.getItem(k) || 'null');
                if (o) {
                    const r = Object.assign({}, opts, o);
                    // Reprises de l'ancien nom : réécrites sous la nouvelle clé, l'ancienne retirée.
                    if (k === LS_OPT_OLD) { try { localStorage.setItem(LS_OPT, JSON.stringify(r)); } catch (e) { } }
                    try { localStorage.removeItem(LS_OPT_OLD); } catch (e) { }
                    return r;
                }
            } catch (e) { }
        }
        return opts;
    }
    function ecrireOpts() { try { localStorage.setItem(LS_OPT, JSON.stringify(opts)); } catch (e) { } }

    // =====================================================================
    //  Chargement de l'historique — incrémental
    // =====================================================================

    async function chargerHistorique(onProgress) {
        if (chargement) return chargement;
        chargement = (async () => {
            const connus = new Set(cache.drives.map(d => d.id));
            // Les traces qui ont échoué la dernière fois sont redemandées D'ABORD : la liste
            // s'arrête après deux pages déjà connues, et un trajet en échec au-delà de l'offset
            // 100 n'était jamais repris (audit du 25/09/2026).
            const aFaire = (cache.aReprendre || []).filter(a => !connus.has(a.id));
            aFaire.forEach(a => connus.add(a.id));
            cache.aReprendre = [];
            let offset = 0, pagesVides = 0;
            while (true) {
                const page = await pageArchive(offset);
                if (!page.length) break;
                const nouveaux = page.filter(a => !connus.has(a.id));
                nouveaux.forEach(a => { connus.add(a.id); aFaire.push(a); });
                if (nouveaux.length === 0) { pagesVides++; if (pagesVides >= 2) break; }
                else pagesVides = 0;
                offset += PAGE;
                if (offset > 3000) break;   // garde-fou : l'archive mesurée fait ~370 trajets
                onProgress && onProgress(t('gList', aFaire.length));
            }

            let faits = 0, ajoutes = 0;
            const echecs = [];
            const file = aFaire.slice();
            const ouvriers = new Array(Math.min(CONCURRENCE, file.length)).fill(0).map(async () => {
                while (file.length) {
                    const a = file.shift();
                    try {
                        let pts;
                        try { pts = await traceDe(a.id); }
                        catch (e) { if (a.totalRoadMeters === 0) pts = []; else throw e; }
                        // Un trajet SANS trace (totalRoadMeters à 0, aucune route appariée) n'ouvre
                        // aucun droit — mais il est mémorisé quand même, sinon chaque rafraîchissement
                        // le redemanderait et l'incrémental n'en serait plus un. Un trajet qui a
                        // roulé des routes et revient sans trace, lui, est un ÉCHEC : on le reprendra.
                        if (!pts.length && a.totalRoadMeters > 0) throw new Error('trace vide pour ' + a.totalRoadMeters + ' m roulés');
                        cache.drives.push({ id: a.id, t: a.startTime, bb: pts.length ? bboxDe(pts) : null, pts });
                        ajoutes++;
                    } catch (e) {
                        log('trace ' + a.id.slice(0, 8) + ' : ' + e.message);
                        echecs.push({ id: a.id, startTime: a.startTime, totalRoadMeters: a.totalRoadMeters });
                    }
                    faits++;
                    if (faits % 10 === 0) onProgress && onProgress(t('gTrace', faits, aFaire.length));
                }
            });
            await Promise.all(ouvriers);

            // Gardés pour le prochain chargement, sauf s'ils sont trop vieux pour compter encore.
            const limite = Date.now() - PURGE_DAYS * D_MS;
            cache.aReprendre = echecs.filter(a => a.startTime >= limite);
            cache.at = Date.now();
            ecrireCache(cache);
            onProgress && onProgress('');
            return { ajoutes, echecs: echecs.length };
        })().finally(() => { chargement = null; });
        return chargement;
    }

    // =====================================================================
    //  Le calcul
    // =====================================================================

    function dernierPassage(lon, lat, rayonM) {
        const proj = projecteur(lat);
        const p = proj(lon, lat);
        const dLat = rayonM / 110540 * 1.2;
        const dLon = rayonM / (111320 * Math.cos(lat * RAD)) * 1.2;
        let meilleur = null;
        for (const d of cache.drives) {
            if (!d.bb || !d.pts.length) continue;
            if (meilleur && d.t <= meilleur.t) continue;
            const bb = d.bb;
            if (lon + dLon < bb[0] || lon - dLon > bb[2] || lat + dLat < bb[1] || lat - dLat > bb[3]) continue;
            const pts = d.pts;
            let dmin = Infinity;
            if (pts.length === 2) {
                // Trace réduite à un point après décimation : sans ce cas, la boucle ci-dessous
                // ne s'exécute jamais et le trajet est ignoré en silence.
                const a = proj(pts[0], pts[1]);
                dmin = Math.hypot(p[0] - a[0], p[1] - a[1]);
            } else {
                for (let i = 0; i + 3 < pts.length; i += 2) {
                    const a = proj(pts[i], pts[i + 1]);
                    const b = proj(pts[i + 2], pts[i + 3]);
                    const dd = distPointSegment(p[0], p[1], a[0], a[1], b[0], b[1]);
                    if (dd < dmin) { dmin = dd; if (dmin <= rayonM) break; }
                }
            }
            if (dmin <= rayonM) meilleur = { t: d.t, dist: dmin };
        }
        return meilleur;
    }

    // La profondeur retenue pour la borne : l'âge du plus vieux trajet connu, et au moins celle de
    // l'archive de Waze (voir ARCHIVE_MIN_J).
    const profondeurArchive = () => Math.max(ageArchiveJours(), ARCHIVE_MIN_J);

    function ageArchiveJours() {
        if (!cache.drives.length) return 0;
        let vieux = Infinity;
        for (const d of cache.drives) if (d.t < vieux) vieux = d.t;
        return Math.floor((Date.now() - vieux) / D_MS);
    }

    // ⭐ LA règle du temps restant, et elle n'existe qu'ici : le badge, le calque et les pastilles
    // la lisent tous. La 0.06.00 l'écrivait à trois endroits, arrondie VERS LE HAUT (Math.ceil) :
    // 9 h restantes s'affichaient « 1 j », 14,2 j s'affichaient 15 — orange au lieu de rouge. C'est
    // le sens que §8.4 interdit : ne jamais annoncer plus de temps qu'il n'en reste (audit du
    // 25/09/2026). Arrondi vers le BAS, avec un état à part pour le dernier jour : « < 1 j », en
    // rouge — pas « expiré », puisque le droit court encore.
    function echeance(t0) {
        // Deux lectures de « 90 jours après » : 90 × 24 h, ou 90 jours de calendrier à la même
        // heure. Elles diffèrent d'une heure quand un changement d'heure tombe entre les deux. La
        // règle réelle de Waze n'est pas mesurée : on retient la plus PRÉCOCE, pour ne jamais
        // repousser l'échéance.
        const cal = new Date(t0);
        cal.setDate(cal.getDate() + VALID_DAYS);
        return Math.min(t0 + VALID_DAYS * D_MS, cal.getTime());
    }
    function restant(expireLe) {
        const ms = expireLe - Date.now();
        if (ms <= 0) return { ms, n: 0, etat: 'expire', depuis: Math.floor(-ms / D_MS) };
        const n = Math.floor(ms / D_MS);
        return { ms, n, etat: n === 0 ? 'dernierJour' : 'jours' };
    }
    // Le nombre de jours qui décide de la COULEUR : le dernier jour reste rouge (1), jamais gris.
    const nCouleur = r => r.etat === 'expire' ? 0 : Math.max(1, r.n);

    // `pays` = getTopCountry(), lu AVANT l'appel : avec le SDK async il rend une promesse, et le
    // calcul reste ainsi synchrone (et testable par les bancs).
    function evaluer(lon, lat, pays = null) {
        if (!zones) zones = lireZones();
        const rayonM = zones.miles * 1609.344;
        const permZone = zones.managed.some(g => dansGeometrie(lon, lat, g));
        let permPays = false;
        if (!permZone && zones.countries.length) {
            // getTopCountry() est RÉMANENT : il garde la dernière valeur connue et peut donc
            // mentir près d'une frontière. On s'en sert pour ADOUCIR un verdict, jamais pour
            // en durcir un.
            permPays = !!(pays && zones.countries.indexOf(pays.id) >= 0);
        }
        const dansRoulage = zones.drive.some(g => dansGeometrie(lon, lat, g));
        let passage = cache.drives.length ? dernierPassage(lon, lat, rayonM) : null;
        let elargi = false;
        if (!passage && dansRoulage && cache.drives.length) {
            passage = dernierPassage(lon, lat, rayonM * ELARGI);
            elargi = !!passage;
            // Élargi et déjà expiré : ce trajet ne peut pas être celui qui tient la zone ouverte
            // (elle l'est, puisqu'on est dedans). Il ne prouve rien ; la borne de l'archive, si.
            if (elargi && echeance(passage.t) <= Date.now()) { passage = null; elargi = false; }
        }

        const v = {
            permanent: (permZone || permPays) && !opts.commeEditeur,
            motif: permZone ? t('mZone') : (permPays ? t('mCountry') : null),
            dansRoulage, rayonM, historique: cache.drives.length > 0,
            rayonDevine: zones.rayonLu === false
        };
        if (passage) {
            v.rouleLe = passage.t;
            v.distM = passage.dist;
            v.elargi = elargi;
            v.jourEcoules = Math.floor((Date.now() - passage.t) / D_MS);
            v.expireLe = echeance(passage.t);
            v.restant = restant(v.expireLe);
            v.joursRestants = v.restant.n;
        } else if (dansRoulage && cache.drives.length) {
            v.borneMax = Math.max(0, VALID_DAYS - profondeurArchive());
        }
        return v;
    }

    // =====================================================================
    //  Le badge, à la suite du libellé de localisation de WME
    // =====================================================================

    const BADGE_ID = 'wda-badge';

    function texteBadge(v) {
        if (!v.historique) return { txt: t('bNoHist'), cls: 'wda-gris', title: t('bNoHistTip') };
        const km1 = nombre(v.rayonM / 1000, 1);
        const detail = [];
        if (v.rouleLe) {
            detail.push(t('tipLast', dateCourte(v.rouleLe), v.jourEcoules, nombre(v.distM / 1000, 1)));
            if (v.elargi) detail.push(t('tipWide', km1));
        }
        detail.push(t('tipRule', VALID_DAYS));
        if (v.rayonDevine) detail.unshift(t('tipRadiusGuess', DEFAULT_MILES));

        if (v.permanent) {
            if (v.rouleLe) return { txt: t('bPermDrove', v.motif, v.jourEcoules), cls: 'wda-bleu', title: detail.join('\n') };
            return { txt: t('bPerm', v.motif), cls: 'wda-bleu', title: t('tipPermHere') + '\n' + detail.join('\n') };
        }
        if (v.restant) {
            const r = v.restant;
            // ⚠️ Recherche élargie : le trajet trouvé au-delà du rayon annoncé n'est peut-être pas
            // celui qui a ouvert la zone — celui-là peut être plus ancien. La 0.06.00 affichait
            // « ~85 j (approx.) » en couleur pleine, alors qu'un trajet plus ancien et plus proche
            // pouvait n'en laisser que 5 : c'est une BORNE HAUTE, et elle se dit comme les autres,
            // « ≤ N j », hachurée (audit du 25/09/2026).
            // Un rayon supposé fait de même : le trajet retenu est peut-être hors de portée.
            const borne = v.elargi || v.rayonDevine;
            const cls = couleurClasse(nCouleur(r)) + (borne ? ' wda-approx' : '');
            const txt = r.etat === 'expire' ? t('bExpired') : r.etat === 'dernierJour' ? t('bLessDay')
                : (borne ? t('bMax', r.n) : t('bLeft', r.n));
            return { txt, cls, title: t('tipRetreat', dateCourte(v.expireLe)) + '\n' + detail.join('\n') };
        }
        if (typeof v.borneMax === 'number') {
            // Signalé par OliveStChi le 08/09/2026 : en rouge, ce badge se lisait comme une
            // urgence alors qu'il dit une INCERTITUDE (« au plus tard »). Une couleur ne peut
            // pas porter deux sens ; les hachures disent le doute, la couleur reste le délai.
            return { txt: t('bMax', v.borneMax), cls: couleurClasse(v.borneMax) + ' wda-approx', title: t('tipMax', v.borneMax, profondeurArchive()) + '\n' + detail.join('\n') };
        }
        if (v.dansRoulage) return { txt: t('bUnknown'), cls: 'wda-gris', title: detail.join('\n') };
        return { txt: t('bOutside'), cls: 'wda-gris', title: t('bOutsideTip', km1) + '\n' + detail.join('\n') };
    }

    function couleurClasse(n) { return SEUILS.find(s => n <= s.max).cls; }

    function poserBadge() {
        const hote = document.querySelector('.location-info');
        if (!hote) return null;
        let el = document.getElementById(BADGE_ID);
        if (el && el.parentElement === hote) return el;
        el = document.createElement('span');
        el.id = BADGE_ID;
        hote.appendChild(el);
        return el;
    }

    function rendreBadge() {
        const el = poserBadge();
        if (!el) return;
        if (!dernierVerdict) { el.textContent = ''; return; }
        const b = texteBadge(dernierVerdict);
        el.textContent = b.txt;
        el.className = b.cls;
        el.title = b.title;
    }

    // WME reconstruit ce libellé à chaque changement de commune : sans observateur, le badge
    // disparaît au premier déplacement et on croit le script mort.
    function surveillerBadge() {
        const cible = document.querySelector('.topbar') || document.body;
        new MutationObserver(() => {
            if (!document.getElementById(BADGE_ID)) rendreBadge();
        }).observe(cible, { childList: true, subtree: true, characterData: true });
    }

    // La topbar est rendue après le script. L'attente est bornée sur l'HORLOGE et non sur un
    // nombre de tours : l'onglet peut être en arrière-plan, où Chrome bride setTimeout à ~1 s.
    function attendreHote() {
        const debut = Date.now();
        const tic = () => {
            if (document.querySelector('.location-info')) { rendreBadge(); return; }
            if (Date.now() - debut > 60000) { log('libellé de localisation introuvable après 60 s'); return; }
            setTimeout(tic, 400);
        };
        tic();
    }

    // =====================================================================
    //  Recalcul sur déplacement de carte
    // =====================================================================

    async function centreVue() {
        // getMapExtent rend [minLon, minLat, maxLon, maxLat]. On calcule le centre plutôt que
        // de lire le libellé de WME : ce libellé ne désigne PAS le centre de la carte.
        const e = await sdk.Map.getMapExtent();
        return [(e[0] + e[2]) / 2, (e[1] + e[3]) / 2];
    }

    let tRecalc = 0;
    let generationRecalc = 0;
    function recalculer(immediat) {
        clearTimeout(tRecalc);
        const faire = async () => {
            // Avec le SDK async, un recalcul lancé plus tard peut finir plus tôt : seul le dernier écrit.
            const generation = ++generationRecalc;
            try {
                const [lon, lat] = await centreVue();
                let pays = null;
                try { pays = await sdk.DataModel.Countries.getTopCountry(); } catch (e) { }
                if (generation !== generationRecalc) return;
                dernierVerdict = evaluer(lon, lat, pays);
                rendreBadge();
                majPanneau();
                if (opts.calque) dessinerCalque();
            } catch (e) { log('recalcul : ' + e.message); }
        };
        if (immediat) faire(); else tRecalc = setTimeout(faire, MOVE_DEBOUNCE);
    }

    // =====================================================================
    //  Calque : les traces colorées par échéance
    // =====================================================================

    const LAYER = 'wda-traces';
    let calqueOk = false;

    // Une trace expirée passe désormais au gris et non plus au rouge vif : elle ne donne plus
    // rien, la crier en rouge la faisait lire comme une urgence.
    function seuilPour(t0) {
        const n = nCouleur(restant(echeance(t0)));
        return SEUILS.find(s => n <= s.max);
    }
    function couleurPour(t0) {
        return seuilPour(t0).trace;
    }

    async function creerCalque() {
        if (calqueOk) return;
        await sdk.Map.addLayer({
            layerName: LAYER,
            styleRules: [{
                style: {
                    strokeColor: '${couleur}', strokeWidth: 5, strokeOpacity: 0.85,
                    strokeDashstyle: '${tirets}', strokeLinecap: 'round',
                    // Sans pointerEvents:none, un tracé posé sur la carte capte le clic sur toute
                    // sa surface peinte et rend les segments de WME insélectionnables.
                    pointerEvents: 'none'
                }
            }],
            styleContext: { couleur: ctx => ctx.feature.properties.couleur, tirets: ctx => ctx.feature.properties.tirets }
        });
        try { pw.W.map.setLayerIndex(pw.W.map.getLayersByName(LAYER)[0], 9999); } catch (e) { }
        calqueOk = true;
    }

    // Les opérations sur le calque passent UNE PAR UNE : avec le SDK async, deux dessins
    // entrelacés (vider, vider, ajouter, ajouter) laisseraient les traces en double.
    let fileCalque = Promise.resolve();
    function enFileCalque(travail) {
        fileCalque = fileCalque.then(travail, travail);
        return fileCalque;
    }
    function dessinerCalque() { return enFileCalque(dessinerCalqueMaintenant); }
    async function dessinerCalqueMaintenant() {
        try {
            await creerCalque();
            await sdk.Map.removeAllFeaturesFromLayer({ layerName: LAYER });
            const e = await sdk.Map.getMapExtent();
            const feats = [];
            for (const d of cache.drives) {
                const bb = d.bb;
                if (!bb || !d.pts.length) continue;
                if (bb[2] < e[0] || bb[0] > e[2] || bb[3] < e[1] || bb[1] > e[3]) continue;
                const co = [];
                for (let i = 0; i + 1 < d.pts.length; i += 2) co.push([d.pts[i], d.pts[i + 1]]);
                if (co.length < 2) continue;
                feats.push({
                    id: 'wda-' + d.id, type: 'Feature',
                    geometry: { type: 'LineString', coordinates: co },
                    properties: { couleur: seuilPour(d.t).trace, tirets: seuilPour(d.t).tirets }
                });
            }
            if (feats.length) await sdk.Map.addFeaturesToLayer({ layerName: LAYER, features: feats });
        } catch (err) { log('calque : ' + err.message); }
    }

    function effacerCalque() {
        return enFileCalque(async () => {
            try { if (calqueOk) await sdk.Map.removeAllFeaturesFromLayer({ layerName: LAYER }); } catch (e) { }
        });
    }

    // =====================================================================
    //  Le calque a TROIS commandes : la case du panneau, celle du menu Calques
    //  de WME, et le raccourci clavier. Une seule fonction les met d'accord.
    // =====================================================================

    // Demandé par OliveStChi le 29/08/2026 : « un raccourci d'activation ou non
    // est-il installable pour ne pas avoir à désactiver celui-ci depuis Tampermonkey ? »
    // Mesuré le même jour : le calque existait bien côté carte, mais n'apparaissait dans
    // AUCUNE des 46 entrées du gestionnaire de calques. Or un calque se cherche là.
    const SC_ID = 'wda-toggle-layer';
    const SC_KEYS = 'A+d';        // format du SDK : A=Alt, C=Ctrl, S=Shift. Mesuré libre ;
    // ⚠️ `areShortcutKeysInUse` rend `false` pour une syntaxe INVALIDE comme pour des touches
    // libres : en `alt+d` (mauvais format) il répondait « pris » pour tout. Ne pas s'en servir
    // comme d'un contrôle de validité — c'est `createShortcut` qui lève.
    let caseCalqueNom = null;     // nom sous lequel la case est posée, ou null si absente
    let raccourciOk = false;

    // ⚠️ Trois interfaces pour un même état : si chacune écrit le sien, elles divergent sans
    // que rien ne le signale. Tout passe donc par ici.
    async function basculerCalque(actif) {
        opts.calque = !!actif;
        ecrireOpts();
        if (opts.calque) dessinerCalque(); else effacerCalque();
        const cq = paneEl && paneEl.querySelector('#wda-calque');
        if (cq && cq.checked !== opts.calque) cq.checked = opts.calque;
        if (caseCalqueNom) {
            try {
                if (await sdk.LayerSwitcher.isLayerCheckboxChecked({ name: caseCalqueNom }) !== opts.calque) {
                    await sdk.LayerSwitcher.setLayerCheckboxChecked({ name: caseCalqueNom, isChecked: opts.calque });
                }
            } catch (e) { }
        }
    }

    // L'événement se déclenche pour la case de N'IMPORTE quel calque : plutôt que de se fier à
    // une charge utile non documentée, on relit notre propre état et on se resynchronise.
    async function surCaseCalque() {
        if (!caseCalqueNom) return;
        let etat;
        try { etat = await sdk.LayerSwitcher.isLayerCheckboxChecked({ name: caseCalqueNom }); } catch (e) { return; }
        if (typeof etat === 'boolean' && etat !== opts.calque) basculerCalque(etat);
    }

    async function poserCommandesCalque() {
        // La case porte un nom traduit : au changement de langue il faut la retirer et la
        // reposer, sinon deux cases cohabitent sous deux libellés.
        await retirerCaseCalque();
        try {
            const nom = t('layerName');
            await sdk.LayerSwitcher.addLayerCheckbox({ name: nom });
            caseCalqueNom = nom;
            await sdk.LayerSwitcher.setLayerCheckboxChecked({ name: nom, isChecked: opts.calque });
        } catch (e) { caseCalqueNom = null; log('menu Calques : ' + e.message); }
    }

    async function retirerCaseCalque() {
        if (!caseCalqueNom) return;
        const nom = caseCalqueNom;
        caseCalqueNom = null;
        try { await sdk.LayerSwitcher.removeLayerCheckbox({ name: nom }); } catch (e) { }
    }

    async function poserRaccourci() {
        try {
            await sdk.Shortcuts.createShortcut({
                shortcutId: SC_ID,
                shortcutKeys: SC_KEYS,
                description: t('scDesc'),
                callback: () => basculerCalque(!opts.calque)
            });
            raccourciOk = true;
        } catch (e) {
            // Chez un utilisateur dont les touches sont déjà prises, l'absence de raccourci
            // doit se LIRE dans le panneau, pas se deviner.
            raccourciOk = false;
            log('raccourci ' + SC_KEYS + ' : ' + e.message);
        }
    }

    // =====================================================================
    //  Panneau « Vos trajets » : échéance + export GPX
    // =====================================================================

    const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    let gpxIndispo = 0;
    let erreurGpx = '';   // dernier échec d'export, affiché dans le panneau jusqu'au prochain succès

    // WME n'écrit l'identifiant du trajet NULLE PART dans le DOM : ni attribut, ni dataset.
    // Il n'existe que comme `key` React de la carte. On remonte donc la fibre jusqu'au premier
    // ancêtre dont la clé est un UUID (mesuré : 15 cartes sur 15, identifiant conforme à
    // celui d'Archive/List).
    // ⚠️ Introspection d'un détail interne de React : si WME change, ça cesse de marcher.
    // D'où le repli ci-dessous, et surtout le comptage — un bouton qui disparaît en silence
    // serait pire qu'un bouton absent.
    function idParFibre(el) {
        try {
            const fk = Object.keys(el).find(k => k.startsWith('__reactFiber'));
            if (!fk) return null;
            let f = el[fk];
            for (let i = 0; i < 10 && f; i++) {
                if (typeof f.key === 'string' && UUID_RX.test(f.key)) return f.key;
                f = f.return;
            }
        } catch (e) { }
        return null;
    }

    // Repli : le panneau liste les trajets par 15, du plus récent au plus ancien, avec le
    // minDistance par défaut de WME (1000). Le même appel rend la même liste dans le même
    // ordre, et le rang de la carte suffit à l'apparier.
    let replisCache = { offset: -1, ids: [] };
    async function idsParRepli(offset) {
        if (replisCache.offset === offset) return replisCache.ids;
        const j = await getJSON(api('Archive/List') + '?count=15&minDistance=1000&offset=' + (offset || '') + '&username=');
        const ids = ((j.archives && j.archives.objects) || []).map(a => ({ id: a.id, t: a.startTime }));
        replisCache = { offset, ids };
        return ids;
    }
    function offsetAffiche() {
        const liste = document.querySelector('.drive-list');
        const zone = liste && liste.parentElement ? liste.parentElement.textContent : '';
        const m = zone.match(/(\d+)\s*[-–]\s*(\d+)/);
        return m ? Math.max(0, parseInt(m[1], 10) - 1) : 0;
    }

    function echapperXML(s) {
        return String(s).replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));
    }

    // Le GPX est bâti sur la trace PLEINE RÉSOLUTION, retéléchargée pour l'occasion : le cache
    // local est décimé à 400 m, ce qui convient au calcul de distance mais ferait un tracé
    // grossier dans un fichier destiné à être relu ailleurs.
    async function construireGPX(id, titre, quand) {
        const j = await getJSON(api('Archive/SessionGPS') + '?id=' + encodeURIComponent(id));
        const sessions = (j.archiveSessions && j.archiveSessions.objects) || [];
        const segs = [];
        for (const s of sessions) {
            for (const part of (s.driveParts || [])) {
                const co = part.geometry && part.geometry.coordinates;
                if (!co || co.length < 2) continue;
                // Un segment par drivePart : les coupures du trajet ne doivent pas être reliées
                // par une droite dans le fichier produit.
                segs.push('  <trkseg>\n' + co.map(c =>
                    '   <trkpt lat="' + c[1].toFixed(6) + '" lon="' + c[0].toFixed(6) + '"/>').join('\n') + '\n  </trkseg>');
            }
        }
        if (!segs.length) throw new Error(t('xNoTrace'));
        const iso = quand ? new Date(quand).toISOString() : new Date().toISOString();
        return '<?xml version="1.0" encoding="UTF-8"?>\n'
            + '<gpx version="1.1" creator="' + SCRIPT_NAME + ' ' + VERSION + '" xmlns="http://www.topografix.com/GPX/1/1">\n'
            + ' <metadata><time>' + iso + '</time></metadata>\n'
            + ' <trk>\n  <name>' + echapperXML(titre) + '</name>\n'
            + segs.join('\n') + '\n </trk>\n</gpx>\n';
    }

    function nomFichier(quand, titre) {
        if (quand) {
            const d = new Date(quand);
            const p = n => String(n).padStart(2, '0');
            return 'waze-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())
                + '_' + p(d.getHours()) + p(d.getMinutes()) + '.gpx';
        }
        return 'waze-' + titre.replace(/[^0-9a-zA-Z]+/g, '-').replace(/^-|-$/g, '') + '.gpx';
    }

    function telecharger(nom, contenu) {
        const url = URL.createObjectURL(new Blob([contenu], { type: 'application/gpx+xml' }));
        const a = document.createElement('a');
        a.href = url; a.download = nom;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    async function exporter(btn, id, titre) {
        const avant = btn.textContent;
        btn.textContent = '…'; btn.disabled = true;
        try {
            const enCache = cache.drives.find(d => d.id === id);
            const quand = enCache ? enCache.t : null;
            telecharger(nomFichier(quand, titre), await construireGPX(id, titre, quand));
            btn.textContent = '✓';
            erreurGpx = '';
            setTimeout(() => { btn.textContent = avant; }, 2000);
        } catch (e) {
            btn.textContent = '✗';
            btn.title = t('xFail', e.message);
            erreurGpx = t('xFail', e.message);
            majPanneau();
            log('GPX ' + id.slice(0, 8) + ' : ' + e.message);
            setTimeout(() => { btn.textContent = avant; btn.title = t('xTitle'); }, 4000);
        } finally { btn.disabled = false; }
    }

    // Un décompte n'a de sens que pour qui perdra vraiment l'accès. Pour un Country Manager
    // ou un Champ, le trajet ouvre bien une zone de roulage, mais elle est redondante avec un
    // accès qui ne s'éteint pas : afficher « J-90 » lui ferait lire une échéance qui ne le
    // concerne pas. On rend alors ∞ — et l'infobulle garde la date réelle.
    //
    // ⚠️ Deux degrés de certitude, et ils sont dits dans l'infobulle :
    //  · zone gérée  → MESURÉ, le point de départ du trajet est dans le polygone ;
    //  · pays géré   → PRÉSUMÉ, car Waze ne descend aucune géométrie de pays. Mesuré le
    //    29/08/2026 sur 270 trajets : 257 tombent dans une zone gérée, 13 seulement relèvent
    //    de cette présomption.
    function permanenceDuTrajet(d) {
        if (opts.commeEditeur || !d.pts.length) return null;
        if (!zones) zones = lireZones();
        // ⚠️ TOUT le trajet, pas son premier point : un trajet parti d'une zone gérée et roulé
        // au-delà ouvre bien un droit temporaire hors de la zone (audit du 25/09/2026). Les points
        // sont ceux du cache, déjà décimés à 400 m : quelques centaines de tests au plus.
        let toutGere = zones.managed.length > 0;
        for (let i = 0; toutGere && i + 1 < d.pts.length; i += 2) {
            const lon = d.pts[i], lat = d.pts[i + 1];
            if (!zones.managed.some(g => dansGeometrie(lon, lat, g))) toutGere = false;
        }
        if (toutGere) return 'zone';
        if (zones.countries.length) return 'pays';
        return null;
    }

    // L'échéance du trajet lui-même : sa date + la durée de validité. C'est la question que
    // pose le panneau — « celui-ci, il vaut jusqu'à quand ? » — et elle ne dépend pas de
    // l'endroit regardé, contrairement au badge de la carte.
    function poserEcheance(carte, id) {
        const d = cache.drives.find(x => x.id === id);
        if (!d) return;   // trajet pas encore en cache : rien à afficher plutôt qu'un chiffre faux
        const fin = echeance(d.t);
        const r = restant(fin);
        const dateFin = dateCourte(fin);
        const e = document.createElement('span');
        const perm = permanenceDuTrajet(d);
        if (perm) {
            // Pays géré : PRÉSUMÉ (Waze ne descend aucune géométrie de pays). Le doute se dit par les
            // hachures, comme partout ailleurs ; seule la zone gérée, mesurée, a un ∞ plein.
            e.className = 'wda-jm wda-bleu' + (perm === 'pays' ? ' wda-approx' : '');
            e.textContent = '∞';
            e.title = perm === 'zone' ? t('jInfZone', dateFin) : t('jInfPays', zones.countries.length, dateFin);
        } else {
            e.className = 'wda-jm ' + couleurClasse(nCouleur(r));
            // Expiré : « J+5 » plutôt qu'un mot. La pastille a une largeur fixe, et « expiré »
            // traduit (« abgelaufen ») en déborderait — le format signé tient dans toutes les
            // langues et dit en plus depuis combien de temps. Le dernier jour : J-0, en rouge.
            e.textContent = r.etat === 'expire' ? t('jp', r.depuis) : t('jm', r.n);
            e.title = r.etat === 'expire' ? t('jExpTip', dateFin) : r.etat === 'dernierJour' ? t('jTipLast', dateFin) : t('jTip', dateFin, r.n);
        }
        carte.appendChild(e);
    }

    // Le repli par rang se VÉRIFIE : si la carte affiche une heure, elle doit être celle du trajet
    // apparié — sinon un décalage de rang poserait le J-n d'un autre trajet sans que rien ne le voie.
    // Sans heure lisible, on ne peut pas vérifier : on fait confiance au rang, comme avant.
    function heureCoherente(carte, t0) {
        const m = (carte.textContent || '').match(/\b(\d{1,2})[:h](\d{2})\b/);
        if (!m || !t0) return true;
        const d = new Date(t0);
        return +m[1] === d.getHours() && +m[2] === d.getMinutes();
    }
    let repliEchecA = 0;          // dernier échec du repli : on ne le relance pas avant une minute
    let posesEnCours = false;     // le sondage d'une seconde ne doit pas lancer deux passes à la fois

    async function poserBoutonsGPX() {
        if (posesEnCours) return;
        const cartes = document.querySelectorAll('wz-card.drive-list-item');
        if (!cartes.length) return;
        posesEnCours = true;
        try { await poserBoutonsGPXPasse(cartes); } finally { posesEnCours = false; }
    }
    async function poserBoutonsGPXPasse(cartes) {
        let repli = null;
        gpxIndispo = 0;
        for (let i = 0; i < cartes.length; i++) {
            const c = cartes[i];
            if (c.querySelector('.wda-gpx')) continue;
            let id = idParFibre(c);
            if (!id) {
                if (!repli) {
                    // Un échec relançait Archive/List à CHAQUE seconde du sondage (~3 600 par heure).
                    if (Date.now() - repliEchecA < 60000) repli = [];
                    else {
                        try { repli = await idsParRepli(offsetAffiche()); }
                        catch (e) { repli = []; repliEchecA = Date.now(); log('repli d\'appariement : ' + e.message); }
                    }
                }
                const r = repli[i];
                id = (r && heureCoherente(c, r.t)) ? r.id : null;
            }
            if (!id) { gpxIndispo++; continue; }
            const titre = ((c.querySelector('.list-item-card-title') || {}).textContent || 'trajet').trim();
            const b = document.createElement('button');
            b.className = 'wda-gpx';
            b.textContent = '⤓';
            b.title = t('xTitle');
            // La carte entière est cliquable (elle sélectionne le trajet et recentre la carte) :
            // sans stopPropagation, exporter déplacerait aussi la vue.
            b.addEventListener('click', ev => { ev.stopPropagation(); ev.preventDefault(); exporter(b, id, titre); });
            c.appendChild(b);
            poserEcheance(c, id);
        }
        majPanneau();
    }

    // Les échéances vieillissent : on retire les nôtres et on laisse poserBoutonsGPX les reposer.
    // Appelé après un chargement d'historique, un changement de réglage, et par l'horloge (voir
    // RAFRAICHIR_MS dans init) : un droit bascule à l'HEURE du trajet, pas à minuit.
    function rafraichirEcheances() {
        document.querySelectorAll('.wda-jm').forEach(e => e.remove());
        document.querySelectorAll('.wda-gpx').forEach(e => e.remove());
    }

    // =====================================================================
    //  Nouvelle version publiée — même mécanique que WCT et WRP
    // =====================================================================

    const VER_RE = /^\d+(\.\d+)*$/;
    const MAJ_KEY = 'wda.maj.v1', MAJ_DELAI = 864e5;   // au plus une vérification par 24 h
    let majEnLigne = null;
    // Segment par segment, en nombres : en chaînes, « 0.9.00 » passerait pour plus récent que « 0.13.00 ».
    const majCmp = (a, b) => {
        const pa = String(a).split('.'), pb = String(b).split('.');
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const x = Number(pa[i]) || 0, y = Number(pb[i]) || 0;
            if (x !== y) return x < y ? -1 : 1;
        }
        return 0;
    };
    function majRendre() {
        const e = paneEl && paneEl.querySelector('#wda-sb-maj');
        if (e) { e.hidden = !majEnLigne; if (majEnLigne) e.querySelector('span').textContent = t('majBtn', majEnLigne); }
    }
    function verifierMaj() {
        if (!VER_RE.test(VERSION) || typeof GM_xmlhttpRequest !== 'function') return;
        let memo = null;
        try { memo = JSON.parse(localStorage.getItem(MAJ_KEY) || 'null'); } catch (e) { }
        if (memo && Date.now() - memo.t < MAJ_DELAI) {
            if (memo.v && VER_RE.test(memo.v) && majCmp(VERSION, memo.v) < 0) { majEnLigne = memo.v; majRendre(); }
            return;
        }
        const retenir = v => { try { localStorage.setItem(MAJ_KEY, JSON.stringify({ t: Date.now(), v })); } catch (e) { } };
        GM_xmlhttpRequest({
            method: 'GET', url: URL_MAJ, timeout: 10000, nocache: true,
            onload: r => {
                // onload vient AUSSI sur un 404 : la page d'erreur ne doit pas être lue comme un script.
                if (r.status < 200 || r.status >= 300) { retenir(null); return; }
                const m = (r.responseText || '').match(/^\/\/\s*@version\s+(\S+)/m);
                retenir(m && VER_RE.test(m[1]) ? m[1] : null);
                if (!m || !VER_RE.test(m[1]) || majCmp(VERSION, m[1]) >= 0) return;
                majEnLigne = m[1];
                majRendre();
                log('nouvelle version publiée : ' + m[1] + ' (installée : ' + VERSION + ')');
            },
            onerror: () => { }, ontimeout: () => { },
        });
    }

    // =====================================================================
    //  Panneau (onglet Scripts) — la charte commune aux scripts de l'auteur (WCT, WJN, WRP) :
    //  en-tête icône + nom + version, pastille de mise à jour, interrupteurs, sections en
    //  capitales, explications REPLIABLES, liens et mention « ne modifie jamais la carte » au pied.
    // =====================================================================

    const CSS = `
#${BADGE_ID}{margin-inline-start:8px;padding:1px 8px;border-radius:10px;font-size:12px;font-weight:500;
  white-space:nowrap;background:rgba(0,0,0,.62);color:#fff;vertical-align:middle;cursor:default}
#${BADGE_ID}.wda-rouge{background:rgba(198,40,40,.9)}
/* Jaune et orange portent un texte FONCÉ : le blanc y tombait à 2,5-3:1 (WCAG 1.4.3 demande 4,5:1
   pour ce texte de 11-12 px) — et c'est la tranche 15-60 j, celle où l'on prévoit un trajet. */
#${BADGE_ID}.wda-orange{background:rgba(230,120,0,.9);color:#1a1a1a}
#${BADGE_ID}.wda-jaune{background:rgba(200,160,0,.92);color:#1a1a1a}
#${BADGE_ID}.wda-vert{background:rgba(46,125,50,.88)}
#${BADGE_ID}.wda-bleu{background:rgba(21,101,192,.88)}
#${BADGE_ID}.wda-gris{background:rgba(70,70,70,.7)}
/* Les hachures se posent SUR la couleur de tranche : « background » ci-dessus remet
   background-image à none, cette règle qui suit le repose. L'ordre fait tout, la
   spécificité est identique. Le doute a donc sa propre marque, la couleur garde son sens. */
#${BADGE_ID}.wda-approx{
  background-image:repeating-linear-gradient(135deg,rgba(0,0,0,.26) 0 4px,transparent 4px 8px)}
/* Onglet Scripts — les valeurs de WRP (qui reprend WCT via WJN), MESURÉES dans WME le 25/09/2026 sur
   les onglets de WCT, WJN et WRP : titre 13 px en #2196f3 (police des h2 de WME), version #9e9e9e,
   texte #2d3748, notes #566372, sections en capitales #2196f3, boutons en pilule, pied #9e9e9e.
   La 0.07.00 avait d'abord pris le bleu foncé #1565c0 et des boutons carrés : écart relevé par l'auteur. */
#wda-sidebar{padding:10px 12px;font-family:'Rubik','Open Sans',sans-serif;font-size:12px;color:#2d3748}
#wda-sidebar h2{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700;color:#2196f3;margin:0 0 8px}
#wda-sidebar h2 .wda-ver{font-size:11px;font-weight:400;color:#9e9e9e}
#wda-sidebar .wda-sb-ico{display:inline-flex}
#wda-sidebar :focus-visible{outline:2px solid #2196f3;outline-offset:1px}
.wda-sb-hint{font-size:11px;color:#566372;line-height:1.6;margin:0 0 6px}
.wda-sb-maj{margin:0 0 8px;padding:5px 8px;border-radius:8px;background:#ffebee;color:#c62828;font-size:11px;font-weight:600}
.wda-sb-maj[hidden]{display:none}
.wda-sb-maj a{color:#c62828}
.wda-sb-sec{font-size:11px;font-weight:700;color:#2196f3;text-transform:uppercase;letter-spacing:.05em;margin:14px 0 6px}
.wda-toggle-row{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:6px}
.wda-toggle-row>span{font-size:12px;font-weight:600;line-height:1.35}
.wda-toggle{position:relative;width:36px;height:20px;flex-shrink:0;margin:0}
.wda-toggle input{opacity:0;width:0;height:0}
/* Rail éteint #8a94a0 : 3,08:1 sur blanc (WCAG 1.4.11) — même décision que WRP et WCT 1.21. */
.wda-toggle-slider{position:absolute;cursor:pointer;inset:0;background:#8a94a0;border-radius:50px;transition:background .2s}
.wda-toggle-slider:before{content:'';position:absolute;width:14px;height:14px;inset-inline-start:3px;bottom:3px;background:#fff;border-radius:50%;transition:transform .2s}
.wda-toggle input:checked+.wda-toggle-slider{background:#2196f3}
.wda-toggle input:checked+.wda-toggle-slider:before{transform:translateX(16px)}
#wda-sidebar[dir="rtl"] .wda-toggle input:checked+.wda-toggle-slider:before{transform:translateX(-16px)}
.wda-toggle input:focus-visible+.wda-toggle-slider{outline:2px solid #2196f3;outline-offset:2px}
.wda-champ{display:flex;flex-direction:column;gap:3px;margin:10px 0 4px;font-weight:600;font-size:12px}
.wda-champ select{box-sizing:border-box;width:100%;max-width:100%;min-width:0;height:26px;padding:1px 4px;font:12px 'Rubik','Open Sans',sans-serif}
.wda-help-section{border:1px solid #dde3ea;border-radius:8px;margin-bottom:4px;overflow:hidden}
.wda-help-hdr{display:flex;align-items:center;justify-content:space-between;gap:6px;width:100%;height:auto;min-height:0;margin:0;border:none;
  font-family:inherit;text-align:start;padding:5px 9px;font-size:11px;font-weight:700;cursor:pointer;background:#f5f7f9;color:#2d3748;user-select:none}
.wda-help-hdr.on{color:#1565c0;background:#e3f2fd}
.wda-help-hdr:hover{background:#eef4fb}
.wda-help-body{padding:7px 9px;font-size:11px;line-height:1.5;color:#2d3748}
/* Pied : les liens (comme WJN), puis la mention 🔒. */
.wda-sb-links{margin-top:12px;padding-top:10px;border-top:1px solid #dde3ea;font-size:11px;color:#566372;text-align:center}
.wda-sb-links a{color:#2196f3}
.wda-sb-foot{margin:10px 0 0;font-size:11px;color:#9e9e9e;line-height:1.6}
/* Boutons : la pilule de WRP. Plein = l'action principale (un seul), neutre = le reste. */
#wda-sidebar .wda-btn{display:inline-flex;align-items:center;gap:5px;height:auto;min-height:0;padding:3px 10px;margin:0;
  border:none;border-radius:50px;font:600 11px 'Rubik','Open Sans',sans-serif;cursor:pointer;white-space:nowrap;background:#2196f3;color:#fff}
#wda-sidebar .wda-btn:hover{filter:brightness(1.08)}
#wda-sidebar .wda-btn[disabled]{opacity:.5;cursor:default;filter:none}
#wda-sidebar .wda-btn-sec{background:#dde3ea;color:#2d3748;margin-top:6px}
#wda-sidebar .wda-etat{margin:6px 0;padding:5px 8px;background:#f5f7f9;border:1px solid #dde3ea;border-radius:8px;font-size:11px;line-height:1.5;color:#2d3748}
/* Légende : les couleurs des pastilles ne se devinent pas — un éditeur ④ a lu « 2 jours »
   là où le code dit 14. Les mêmes teintes que les pastilles de « Vos trajets ». */
.wda-pane .wda-lg{display:flex;align-items:center;gap:8px;margin:3px 0;font-size:11px;color:#2d3748}
.wda-pane .wda-sw{flex:0 0 auto;width:26px;height:14px;border-radius:7px;background:#757575}
.wda-pane .wda-tr{flex:0 0 26px;display:inline-block}
.wda-pane .wda-sw.wda-rouge{background:#c62828}
.wda-pane .wda-sw.wda-orange{background:#e67800}
.wda-pane .wda-sw.wda-jaune{background:#c8a000}
.wda-pane .wda-sw.wda-vert{background:#2e7d32}
.wda-pane .wda-sw.wda-bleu{background:#1565c0}
.wda-pane .wda-sw.wda-gris{background:#757575}
/* Après les teintes, jamais avant : « background » les remettrait à none. */
.wda-pane .wda-sw.wda-approx{
  background-image:repeating-linear-gradient(135deg,rgba(0,0,0,.32) 0 4px,transparent 4px 8px)}
.wda-pane .wda-note{color:#566372;font-size:11px}
.wda-pane #wda-prog{margin-top:4px}
.wda-pane .wda-alerte{color:#c62828;font-size:11px}
.wda-pane .wda-alerte>div{margin:4px 0}
/* Bouton et échéance se posent en absolu dans wz-card, qui est déjà position:relative — la
   grille de WME n'est pas touchée. inset-inline-end suit le sens d'écriture : en hébreu, les
   deux passent d'eux-mêmes à gauche. */
wz-card.drive-list-item .wda-gpx{position:absolute;inset-inline-end:8px;top:50%;transform:translateY(-50%);
  width:26px;height:26px;padding:0;line-height:1;border-radius:6px;border:1px solid #c3cad4;
  background:#fff;color:#1565c0;font-size:15px;cursor:pointer;z-index:2;
  display:flex;align-items:center;justify-content:center}
wz-card.drive-list-item .wda-gpx:hover{background:#e8f0fe;border-color:#1565c0}
wz-card.drive-list-item .wda-gpx[disabled]{opacity:.6;cursor:default}
wz-card.drive-list-item .wda-jm{position:absolute;inset-inline-end:40px;top:50%;transform:translateY(-50%);
  padding:1px 6px;border-radius:9px;font-size:11px;font-weight:600;white-space:nowrap;
  color:#fff;background:#666;z-index:2;cursor:default}
wz-card.drive-list-item .wda-jm.wda-rouge{background:#c62828}
wz-card.drive-list-item .wda-jm.wda-orange{background:#e67800;color:#1a1a1a}
wz-card.drive-list-item .wda-jm.wda-jaune{background:#c8a000;color:#1a1a1a}
wz-card.drive-list-item .wda-jm.wda-vert{background:#2e7d32}
wz-card.drive-list-item .wda-jm.wda-gris{background:#757575}
/* ∞ : accès permanent, aucun décompte. Même bleu que le badge de la carte, pour que les deux
   se lisent comme la même information. Le glyphe étant plus large que haut, on l'agrandit. */
wz-card.drive-list-item .wda-jm.wda-bleu{background:#1565c0;font-size:14px;padding:0 8px}
/* Après les teintes : « background » les remettrait à none. Les hachures disent le doute. */
wz-card.drive-list-item .wda-jm.wda-approx{
  background-image:repeating-linear-gradient(135deg,rgba(0,0,0,.28) 0 4px,transparent 4px 8px)}
/* Sans cette marge, le libellé passerait sous l'échéance et le bouton. Mesurée, pas estimée :
   le bouton occupe 8→34 px depuis le bord, la pastille 40→78 ; 82 laisse 4 px de jeu et rend
   au titre les 112 px dont il a besoin (à 96 px il manquait 1 pixel et la date était coupée). */
wz-card.drive-list-item:has(.wda-gpx) .list-item-card-info{padding-inline-end:82px}
`;

    // La légende se DÉDUIT de SEUILS : recopier les bornes à la main, c'est se donner rendez-vous
    // avec une légende fausse au premier réglage changé.
    function legendeHTML() {
        const trait = s => '<svg class="wda-tr" width="26" height="6" aria-hidden="true"><line x1="2" y1="3" x2="24" y2="3" stroke="#555" stroke-width="3" stroke-linecap="round"'
            + (TIRETS_SVG[s.tirets] ? ' stroke-dasharray="' + TIRETS_SVG[s.tirets] + '"' : '') + '/></svg>';
        const li = (cls, txt, s) => '<div class="wda-lg"><span class="wda-sw ' + cls + '"></span>' + (s ? trait(s) : '<span class="wda-tr"></span>') + '<span>' + txt + '</span></div>';
        const u = t('lgUnit');
        const out = [];
        for (let i = SEUILS.length - 1; i >= 0; i--) {
            const s = SEUILS[i];
            if (s.max === Infinity) out.push(li(s.cls, '> ' + SEUILS[i - 1].max + u, s));
            else if (s.max <= 0) out.push(li(s.cls, t('lgExpired'), s));
            else out.push(li(s.cls, (SEUILS[i - 1].max + 1) + '–' + s.max + u, s));
        }
        return out.join('')
            + li('wda-gris', t('lgNone'))
            + li('wda-bleu', t('lgPerm'))
            + li('wda-approx', t('lgApprox'));
    }

    // Sections repliables : ouvertes ou non, elles le restent d'une reconstruction à l'autre
    // (changement de langue). Toutes fermées au départ : c'est le « blabla » qui mangeait le panneau.
    const ouverts = new Set();
    const SECTIONS = [
        { id: 'legende', ico: '&#x1F3A8;', titre: () => t('pLegend'), corps: () => legendeHTML() },
        { id: 'cache', ico: '&#x1F5C2;&#xFE0F;', titre: () => t('pCache'), corps: () =>
            '<div id="wda-cache">…</div><button type="button" class="wda-btn wda-btn-sec" id="wda-effacer">' + t('pClear') + '</button>' },
        { id: 'badge', ico: '&#x2753;', titre: () => t('pWhat'), corps: km => t('pWhatText', km, VALID_DAYS) },
        { id: 'gpx', ico: '&#x2913;', titre: () => t('pGpx'), corps: () => t('pGpxText') },
    ];
    // Section repliée : la flèche pointe vers le texte qui suit — vers la gauche en hébreu.
    const fleche = () => isRTL() ? '&#x25C0;' : '&#x25B6;';
    const interrupteur = (id, libelle) => `
  <div class="wda-toggle-row">
    <span id="${id}-lib">${libelle}</span>
    <label class="wda-toggle"><input type="checkbox" id="${id}" aria-labelledby="${id}-lib"><span class="wda-toggle-slider"></span></label>
  </div>`;

    function buildPane() {
        const km = nombre(zones.miles * 1.609344, 3) + ' km (' + nombre(zones.miles, 2) + ' mi'
            + (zones.rayonLu === false ? ', ' + t('pRadiusGuess') : '') + ')';
        return `<div class="wda-pane" id="wda-sidebar" dir="${isRTL() ? 'rtl' : 'ltr'}">
  <h2><span class="wda-sb-ico">${icone(18)}</span>${SCRIPT_NAME} <span class="wda-ver">v${VERSION}</span></h2>
  <p class="wda-sb-maj" id="wda-sb-maj" hidden><span></span> <a href="#" id="wda-maj">${t('majInstall')}</a></p>
  <p class="wda-sb-hint">${t('sbHint')}</p>
  <div class="wda-etat" id="wda-etat" role="status">…</div>
  <div class="wda-alerte" id="wda-alertes"></div>
  <button type="button" class="wda-btn" id="wda-load">${t('pLoad')}</button>
  <div class="wda-note" id="wda-prog" role="status"></div>
  <div class="wda-sb-sec">&#x1F4FA; ${t('pDisplay')}</div>
  ${interrupteur('wda-calque', t('pLayer'))}
  <div class="wda-note" id="wda-sc"></div>
  ${interrupteur('wda-editeur', t('pAsEditor'))}
  <label class="wda-champ"><span>${t('pLang')}</span>
    <select id="wda-lang">
      <option value="auto">${t('pLangAuto', (LANGS.find(x => x.code === detectLang()) || {}).label || 'English')}</option>
      ${LANGS.map(l => '<option value="' + l.code + '">' + l.label + '</option>').join('')}
    </select>
  </label>
  <div class="wda-sb-sec">&#x2139;&#xFE0F; ${t('sbHelp')}</div>
  ${SECTIONS.map(x => {
      const ouvert = ouverts.has(x.id);
      return `<div class="wda-help-section">
    <button type="button" class="wda-help-hdr${ouvert ? ' on' : ''}" data-aide="${x.id}" aria-expanded="${ouvert}">${x.ico} ${x.titre()} <span aria-hidden="true">${ouvert ? '&#x25BC;' : fleche()}</span></button>
    <div class="wda-help-body" data-corps="${x.id}"${ouvert ? '' : ' hidden'}>${x.corps(km)}</div>
  </div>`;
  }).join('')}
  <div class="wda-sb-links"><bdi>&#x1F4AC; <a href="${URL_DISCUSS}" target="_blank" rel="noopener">${t('lnkDiscuss')}</a></bdi> &nbsp;&#xB7;&nbsp; <bdi>&#x1F517; <a href="${URL_GF}" target="_blank" rel="noopener">GreasyFork</a></bdi> &nbsp;&#xB7;&nbsp; <bdi><a href="${URL_GH}" target="_blank" rel="noopener">GitHub</a></bdi></div>
  <p class="wda-sb-foot">&#x1F512; ${t('sbSafe')}</p>
</div>`;
    }

    function majPanneau() {
        if (!paneEl) return;
        const $ = id => paneEl.querySelector('#' + id);
        const z = zones || lireZones();

        const c = $('wda-cache');
        if (c) {
            if (!cache.drives.length) c.textContent = t('pCacheNone');
            else {
                let vieux = Infinity, recent = 0, vides = 0;
                for (const d of cache.drives) {
                    if (d.t < vieux) vieux = d.t;
                    if (d.t > recent) recent = d.t;
                    if (!d.pts.length) vides++;
                }
                c.innerHTML = t('pCacheInfo', cache.drives.length, dateCourte(vieux),
                    dateCourte(recent), ageArchiveJours(), VALID_DAYS)
                    + (cache.at ? '<br>' + t('pCacheAt', dateHeure(cache.at)) : '')
                    + (vides ? '<br>' + t('pCacheEmpty', vides) : '')
                    + '<br>' + t('pRetention', PURGE_DAYS);
            }
        }
        const sc = $('wda-sc');
        if (sc) sc.innerHTML = raccourciOk ? t('pShortcut', SC_KEYS.replace('A+', 'Alt+')) : t('pShortcutKO');

        // Un bouton qui cesse d'apparaître doit se voir : sans cette ligne, une évolution de
        // WME casserait l'export en silence.
        // Les alertes restent HORS des sections repliables : une perte ne doit pas se replier.
        const g = $('wda-alertes');
        if (g) g.innerHTML = [cache.tronque ? t('pCacheCut', cache.tronque) : '', cache.echecEcriture ? t('pCacheNotSaved') : '',
            gpxIndispo ? t('pGpxMissing', gpxIndispo) : '', erreurGpx].filter(Boolean).map(x => '<div>' + x + '</div>').join('');
        majRendre();

        const e = $('wda-etat');
        if (e) {
            const v = dernierVerdict;
            if (!v) e.textContent = t('pNotEval');
            else if (!v.historique) e.textContent = t('bNoHist');
            else e.innerHTML = '<b>' + t('pAtCenter') + '</b> ' + texteBadge(v).txt
                + (v.restant && !v.permanent && v.restant.etat !== 'expire' ? '<br><span class="wda-note">' + t('tipRetreat', dateCourte(v.expireLe)) + '</span>' : '')
                + (z.managed.length ? '<br><span class="wda-note">' + t('pZones', z.managed.length, z.countries.length) + '</span>' : '');
        }
    }

    // Un chargement de l'historique, depuis le bouton ou tout seul (voir chargerSiVieux) : même
    // suite dans les deux cas, pour que le badge et les pastilles suivent.
    async function charger(onProgress, prog) {
        try {
            const r = await chargerHistorique(onProgress);
            if (prog) prog.textContent = (r.ajoutes ? t('gAdded', r.ajoutes) : t('gNothing'))
                + (r.echecs ? ' ' + t('gFailedTraces', r.echecs) : '');
            rafraichirEcheances();
            recalculer();
        } catch (e) {
            if (prog) prog.textContent = t('gFail', e.message);
            log('chargement : ' + e.message);
        } finally { majPanneau(); }
    }

    // ⚠️ La 0.06.00 ne rechargeait JAMAIS l'historique d'elle-même : on roulait pour renouveler une
    // zone, on rouvrait WME, et le badge gardait l'ancien décompte. Sans un clic tous les ~60 jours,
    // des trajets sortaient de l'archive de Waze avant d'avoir été gardés : perdus pour de bon.
    // Seulement pour qui a DÉJÀ chargé une fois : le premier chargement (des centaines de traces)
    // reste un geste de l'éditeur.
    function chargerSiVieux() {
        if (!cache.at || chargement || Date.now() - cache.at < AUTO_MS) return;
        const prog = paneEl && paneEl.querySelector('#wda-prog');
        charger(m => { if (prog) prog.textContent = m; }, prog);
    }

    function connectPane() {
        const $ = id => paneEl.querySelector('#' + id);
        paneEl.querySelectorAll('.wda-help-hdr').forEach(h => h.addEventListener('click', () => {
            const id = h.dataset.aide, corps = paneEl.querySelector('[data-corps="' + id + '"]');
            const ouvrir = corps.hidden;
            corps.hidden = !ouvrir;
            h.classList.toggle('on', ouvrir);
            h.setAttribute('aria-expanded', String(ouvrir));
            h.querySelector('span').innerHTML = ouvrir ? '&#x25BC;' : fleche();
            if (ouvrir) ouverts.add(id); else ouverts.delete(id);
            if (ouvrir && id === 'cache') majPanneau();
        }));
        $('wda-maj').addEventListener('click', ev => { ev.preventDefault(); window.open(URL_INSTALLER, '_blank', 'noopener'); });
        const btn = $('wda-load'), prog = $('wda-prog');
        btn.addEventListener('click', async () => {
            btn.disabled = true;
            try { await charger(m => { prog.textContent = m; }, prog); }
            finally { btn.disabled = false; }
        });
        // Effacer l'historique local : les trajets datés et leurs traces restent sinon dans ce
        // navigateur jusqu'à PURGE_DAYS jours. Deux clics, sans boîte de dialogue : le premier
        // arme le bouton, le second efface ; laissé seul, il se désarme.
        const ef = $('wda-effacer');
        let arme = 0;
        ef.addEventListener('click', () => {
            if (!arme) {
                ef.textContent = t('pClearConfirm');
                arme = setTimeout(() => { arme = 0; ef.textContent = t('pClear'); }, 5000);
                return;
            }
            clearTimeout(arme); arme = 0;
            try { localStorage.removeItem(LS_KEY); } catch (e) { }
            cache = { at: 0, drives: [], owner: proprietaire() };
            effacerCalque();
            rafraichirEcheances();
            ef.textContent = t('pClear');
            prog.textContent = t('pCleared');
            recalculer(true);
        });
        const cq = $('wda-calque'); cq.checked = opts.calque;
        cq.addEventListener('change', () => basculerCalque(cq.checked));
        const ed = $('wda-editeur'); ed.checked = opts.commeEditeur;
        ed.addEventListener('change', () => {
            opts.commeEditeur = ed.checked; ecrireOpts();
            // Les pastilles dépendent de cette case autant que le badge : sans ce
            // rafraîchissement, les ∞ resteraient affichés en mode « éditeur sans droits ».
            rafraichirEcheances();
            recalculer(true);
        });
        const lg = $('wda-lang'); lg.value = opts.langPref || 'auto';
        lg.addEventListener('change', () => {
            opts.langPref = lg.value; ecrireOpts();
            _lang = resolveLang();
            paneEl.innerHTML = buildPane();
            connectPane();
            rafraichirEcheances();
            // Le nom de la case du menu Calques est traduit : sans cette repose, l'ancien
            // libellé resterait et une seconde case apparaîtrait à la langue suivante.
            poserCommandesCalque().catch(e => log('menu Calques : ' + e.message));
            recalculer(true);
            // Le panneau vient d'être reconstruit : on rend le focus au sélecteur qu'on réglait.
            const nv = paneEl.querySelector('#wda-lang');
            if (nv) nv.focus();
        });
    }

    // =====================================================================
    //  INIT
    // =====================================================================

    const init = async () => {
        if (pw.__WDA_LOADED) return;
        pw.__WDA_LOADED = true;

        sdk = pw.getWmeSdk({ scriptId: SCRIPT_ID, scriptName: SCRIPT_NAME, mode: 'async' });
        cache = lireCache();
        opts = lireOpts();
        _lang = resolveLang();
        zones = lireZones();

        const st = document.createElement('style');
        st.textContent = CSS;
        document.head.appendChild(st);

        try {
            const res = await sdk.Sidebar.registerScriptTab();
            res.tabLabel.innerHTML = '<span title="' + SCRIPT_NAME + '" style="display:inline-flex;vertical-align:middle">' + icone(20) + '</span>';
            paneEl = res.tabPane;
            paneEl.innerHTML = buildPane();
            await new Promise(r => setTimeout(r, 200));
            connectPane();
        } catch (e) { log('Sidebar : ' + e.message); }

        surveillerBadge();
        attendreHote();
        try { sdk.Events.on({ eventName: 'wme-map-move-end', eventHandler: () => recalculer(false) }); }
        catch (e) { log('événement carte : ' + e.message); }

        // Les deux commandes réclamées par OliveStChi : la case là où on cherche un calque,
        // et le raccourci pour ne pas avoir à ouvrir un panneau.
        await poserCommandesCalque();
        await poserRaccourci();
        try { sdk.Events.on({ eventName: 'wme-layer-checkbox-toggled', eventHandler: surCaseCalque }); }
        catch (e) { log('événement calque : ' + e.message); }

        recalculer(true);
        if (opts.calque && cache.drives.length) dessinerCalque();
        chargerSiVieux();
        verifierMaj();

        // Le panneau « Vos trajets » se construit et se repagine sans qu'aucun événement du SDK
        // ne le signale. Un sondage d'une seconde coûte une querySelector et suffit ; il sort
        // immédiatement quand le panneau n'est pas affiché.
        setInterval(() => { poserBoutonsGPX().catch(e => log('boutons GPX : ' + e.message)); }, 1000);

        // Le décompte vieillit tout seul : sans ce rafraîchissement, une pastille posée gardait sa
        // valeur tant que la page restait ouverte, et un droit expiré pouvait encore afficher J-1
        // (audit du 25/09/2026). Au retour sur l'onglet aussi : un onglet caché ne tourne presque plus.
        const rafraichir = () => { rafraichirEcheances(); recalculer(true); chargerSiVieux(); };
        setInterval(rafraichir, RAFRAICHIR_MS);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) rafraichir(); });

        log('v' + VERSION + ' prêt — langue ' + _lang + ', ' + cache.drives.length + ' trajets en cache, rayon ' + zones.miles + ' mi');
    };

    if (pw.W?.userscripts?.state?.isReady) init();
    else document.addEventListener('wme-ready', init, { once: true });

})();
