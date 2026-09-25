// Banc de rendu : construit une page avec le CSS, la légende et les pastilles du fichier servi
// (bancs/charger.js), pour REGARDER ce que l'éditeur verra avant de le lui livrer. C'est lui qui a
// montré que des hachures blanches sur le badge jaune faisaient disparaître le texte.
//
//   node bancs/banc-rendu.js WME-Driving-Areas.user.js rendu.html
const fs = require('fs');
const { charger } = require('./charger.js');
const FICHIER = process.argv[2], OUT = process.argv[3];
const W = charger(FICHIER);
const CSS = W.CSS.replace(/wda-badge/g, 'wda-badge');

const rendu = lang => {
    W.regler({ lang });
    const t = (k, ...a) => { const v = W.DICO[lang][k] !== undefined ? W.DICO[lang][k] : W.DICO.en[k]; return typeof v === 'function' ? v(...a) : v; };
    const rtl = lang === 'he';
    const carte = (cls, txt) => '<div class="carte"><wz-card class="drive-list-item" style="position:relative;display:block;height:34px">'
        + '<span class="wda-jm ' + cls + '">' + txt + '</span></wz-card></div>';
    return '<section><h3>' + lang + '</h3><div class="wda-pane"' + (rtl ? ' dir="rtl"' : '') + '>'
        + '<h4>' + t('pLegend') + '</h4>' + W.legendeHTML()
        + '<h4>' + t('pCache') + '</h4><div class="wda-note">'
        + t('pCacheInfo', 214, '11/07/2026', '08/09/2026', 59, 90)
        + '<br><span class="wda-alerte">' + t('pCacheCut', 34) + '</span></div>'
        + '<h4>Pastilles</h4>'
        + carte('wda-vert', t('jm', 75)) + carte('wda-jaune', t('jm', 41)) + carte('wda-orange', t('jm', 22))
        + carte('wda-rouge', t('jm', 0)) + carte('wda-gris', t('jp', 5)) + carte('wda-bleu', '∞') + carte('wda-bleu wda-approx', '∞')
        + '</div></section>';
};

const badge = (cls, txt) => '<span id="wda-badge" class="' + cls + '">' + txt + '</span>';
const page = '<!doctype html><meta charset="utf-8"><title>WDA — banc de rendu</title><style>'
    + 'body{font-family:system-ui,sans-serif;background:#fff;margin:0;padding:16px;color:#222}'
    + 'section{display:inline-block;vertical-align:top;width:330px;margin:0 12px 12px 0;'
    + 'border:1px solid #dde;border-radius:8px;padding:10px}'
    + 'h3{margin:0 0 6px;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.08em}'
    + '.carte{display:inline-block;width:90px;margin:2px}'
    + '#bandeau{background:#37474f;padding:10px 14px;border-radius:8px;margin-bottom:16px;color:#fff;font-size:13px;line-height:2}'
    + CSS + '</style>'
    + '<div id="bandeau">Barre de WME &nbsp; '
    + badge('wda-vert', '~90 j restants ici') + ' '
    + badge('wda-jaune', '~45 j restants ici') + ' '
    + badge('wda-orange', '~22 j restants ici') + ' '
    + badge('wda-rouge', '< 1 j restant ici') + ' '
    + badge('wda-gris', 'droit expiré ici') + ' '
    + badge('wda-bleu', 'accès permanent (zone gérée)') + ' '
    + badge('wda-jaune wda-approx', '≤ 31 j restants ici') + ' '
    + badge('wda-orange wda-approx', '≤ 20 j restants ici') + '</div>'
    + ['fr', 'en', 'de', 'he'].map(rendu).join('');

fs.writeFileSync(OUT, page, 'utf8');
console.log('écrit : ' + OUT + ' (' + page.length + ' caractères)');
