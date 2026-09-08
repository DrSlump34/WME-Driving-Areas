// Banc de rendu : construit une page avec le CSS et la légende EXTRAITS du fichier servi,
// pour regarder ce que l'utilisateur verra avant de le lui livrer.
const fs = require('fs');
const SRC = fs.readFileSync(process.argv[2], 'utf8');
const OUT = process.argv[3];

const bloc = [
    SRC.match(/const SEUILS = \[[\s\S]*?\];/)[0],
    SRC.match(/function legendeHTML\(\) \{[\s\S]*?\n    \}/)[0],
].join('\n');
const DICO = new Function('SCRIPT_NAME', SRC.match(/const DICO = \{[\s\S]*?\n    \};/)[0] + '\nreturn DICO;')('WME Driving Areas');
let CSS = SRC.match(/const CSS = `([\s\S]*?)`;/)[1].replace(/\$\{BADGE_ID\}/g, 'wda-badge');

const rendu = lang => {
    // Comme le vrai t() du script : une entrée peut être une fonction, il faut l'APPELER.
    const t = (k, ...a) => {
        const v = DICO[lang][k] !== undefined ? DICO[lang][k] : DICO.en[k];
        return typeof v === 'function' ? v(...a) : v;
    };
    const api = new Function('t', bloc + '\nreturn legendeHTML;')(t);
    const rtl = lang === 'he';
    return '<section><h3>' + lang + '</h3><div class="wda-pane"' + (rtl ? ' dir="rtl"' : '') + '>'
        + '<h4>' + t('pLegend') + '</h4>' + api()
        + '<h4>' + t('pCache') + '</h4><div class="wda-note">'
        + t('pCacheInfo', 214, '11/07/2026', '08/09/2026', 59, 90)
        + '<br><span class="wda-alerte">' + t('pCacheCut', 34) + '</span></div>'
        + '</div></section>';
};

const badge = (cls, txt) => '<span id="wda-badge" class="' + cls + '">' + txt + '</span>';
const page = '<!doctype html><meta charset="utf-8"><title>WDA — banc de rendu</title><style>'
    + 'body{font-family:system-ui,sans-serif;background:#fff;margin:0;padding:16px;color:#222}'
    + 'section{display:inline-block;vertical-align:top;width:330px;margin:0 12px 12px 0;'
    + 'border:1px solid #dde;border-radius:8px;padding:10px}'
    + 'h3{margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.08em}'
    + '#bandeau{background:#37474f;padding:10px 14px;border-radius:8px;margin-bottom:16px;color:#fff;font-size:13px}'
    + CSS + '</style>'
    + '<div id="bandeau">Barre de WME &nbsp; '
    + badge('wda-vert', '~90 j restants ici') + ' '
    + badge('wda-jaune', '~45 j restants ici') + ' '
    + badge('wda-orange', '~22 j restants ici') + ' '
    + badge('wda-rouge', '~9 j restants ici') + ' '
    + badge('wda-gris', 'droit expiré ici') + ' '
    + badge('wda-bleu', 'accès permanent (zone gérée)') + ' '
    + badge('wda-jaune wda-approx', '≤ 31 j restants ici') + '</div>'
    + ['fr', 'en', 'de', 'he'].map(rendu).join('');

fs.writeFileSync(OUT, page, 'utf8');
console.log('écrit : ' + OUT + ' (' + page.length + ' caractères)');
