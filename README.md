# WME Driving Areas (WDA)

Répond à une seule question, que WME ne pose nulle part : **combien de temps me reste-t-il ici ?**

Né d'une question d'**OliveStChi ④** (MP Discord du 29/08/2026) : *« on ne sait jamais, mise à part
avoir en mémoire en permanence les dates des différents déplacements, quand la zone va nous être
retirée. »*

*Anciennement `WME Area Countdown` — le renommage date du 29/08/2026. Une installation de l'ancien
nom doit être désinstallée : les deux scripts poseraient chacun leur badge.*

## Ce qu'il ajoute à WME

**Un badge à côté du libellé de localisation**, là où l'œil lit déjà où il se trouve :

| Situation | Badge |
|---|---|
| Zone parcourue, trajet daté connu | `~33 j restants ici` (couleur selon l'urgence) |
| Zone parcourue, trajet trop ancien pour l'archive | `≤ 27 j restants ici` |
| Trajet trouvé au-delà du rayon annoncé | `~33 j restants ici (approx.)` |
| Zone gérée, ou pays géré (CM / Champ) | `accès permanent (pays géré) · roulé il y a 57 j` |
| Aucun trajet à portée | `hors zone parcourue` |

**Une échéance et un export GPX sur chaque trajet** du panneau « Vos trajets » : la pastille
**`J-41`** dit jusqu'à quand ce trajet-là donne des droits (`J+5` s'il est passé), et le bouton
**⤓** produit le GPX de la trace.

**Un calque optionnel** des trajets, colorés par échéance.

### Le cas des ayants droit permanents : ∞

Un décompte n'a de sens que pour qui perdra vraiment l'accès. Pour un Country Manager ou un Champ,
le trajet ouvre bien une zone de roulage, mais elle est redondante avec un accès qui ne s'éteint
pas : afficher `J-90` lui ferait lire une échéance qui ne le concerne pas. La pastille rend alors
**∞**, et l'infobulle garde la date réelle.

Deux degrés de certitude, dits dans l'infobulle :

| Cas | Statut |
|---|---|
| Le trajet part d'une **zone gérée** | **mesuré** — test point-dans-polygone sur la géométrie servie par Waze |
| L'éditeur gère au moins un **pays** | **présumé** — Waze ne descend aucune géométrie de pays, donc c'est invérifiable côté client |

Mesuré le 29/08/2026 sur 270 trajets d'un compte de Country Manager : **257 tombent dans une zone
gérée**, 13 seulement relèvent de la présomption. L'infobulle de ces 13 le dit explicitement et
donne quand même la date à laquelle le droit de roulage, lui, s'éteindrait.

La case « Ignorer mes zones gérées » remet toutes les pastilles en décompte — c'est ce qui permet à
un CM de voir ce qu'un éditeur ordinaire verrait.

## Langues

Huit langues, sur le modèle de WCT : français, anglais, allemand, espagnol, italien, portugais (BR et
PT) et hébreu. La détection suit la locale de WME (`W.userscripts.state.locale`), avec repli sur
l'anglais et possibilité de forcer une langue dans le panneau.

L'hébreu bascule le panneau en `dir="rtl"` ; la pastille et le bouton sont positionnés en
`inset-inline-end`, donc ils suivent le sens d'écriture sans code conditionnel.

L'échéance est abrégée par langue : `J-41` en français, `D-41` en anglais, `T-41` en allemand,
`G-41` en italien, `י-41` en hébreu. Le format signé a été retenu **parce que la pastille a une
largeur fixe** : un mot comme « expiré » — `abgelaufen` en allemand — n'y tiendrait pas.

## Sur quoi le calcul repose — tout a été mesuré le 29/08/2026

WME **ne reçoit pas** la date d'expiration. `GET /app/Session` descend chaque zone sous la forme
`{type: 'drive'|'managed', geometry, area}` : trois champs, aucune date. Ni le modèle client
(`W.model.userAreas`, `managedAreas`…) ni l'infobulle du panneau « Vos zones » n'en portent une.

L'information est en revanche **reconstructible** :

| Source | Ce qu'elle donne |
|---|---|
| `GET /app/Archive/List?count=50&minDistance=0&offset=N` | les trajets **datés** (`id`, `startTime`, `totalRoadMeters`) |
| `GET /app/Archive/SessionGPS?id=<uuid>` | la **trace GPS** de chaque trajet |
| `W.loginManager.user.attributes.editableMiles` | le **rayon** du droit (4 → 6,437 km) |
| `GET /app/Session` → `areas[type='drive']` | le **polygone** de la zone, exact |

Le rayon est **lu**, jamais déduit du niveau d'éditeur : une table 1/2/3/4 miles codée en dur est une
borne qui se périme sans prévenir.

Le polygone répond à « suis-je concerné ici ? » (exactement), les traces datées répondent à « depuis
quand ? ». Les deux questions sont séparées pour qu'une imprécision sur le rayon ne coûte jamais un
faux négatif sur le droit lui-même.

## Les trois limites, et elles sont dites dans l'interface

1. **L'archive est plus courte que le droit** — 63 jours mesurés pour 90 jours de validité. Les
   secteurs ouverts par un trajet plus ancien ne sont datables qu'« au plus tard » (`≤ N j`).
   Le trou se comble tout seul : le cache local garde les trajets une fois vus.
2. **Le polygone servi par Waze est plus large que le tampon annoncé.** Mesuré sur une zone de
   204 km² ouverte par un trajet connu : 25 % de ses points sont à plus de 6,437 km de toute trace,
   jusqu'à 11,4 km. D'où la recherche élargie (× 2,5) et la mention `(approx.)`.
3. **La règle des 90 jours vient du Wazeopedia**, qui ajoute « ou le dernier jour du mois, selon ce
   qui est le plus tardif ». Si cet arrondi existe, la date réelle est *postérieure* à celle
   annoncée : le badge ne surestime jamais le temps restant.

Par ailleurs, `minDistance=0` est important : le défaut de WME (1000) écarte 41 % des trajets, et
ceux-là ouvrent des droits comme les autres. Les trajets à `totalRoadMeters = 0` n'ont, eux, aucune
trace GPS — Waze n'a apparié aucune route — et n'ouvrent donc aucun droit ; ils sont mémorisés
quand même, sinon chaque rafraîchissement les redemanderait.

## L'appariement des trajets, et pourquoi il est surveillé

**WME n'écrit l'identifiant du trajet nulle part dans le DOM** — ni attribut, ni `dataset`. Il
n'existe que comme `key` React de la carte. Le script remonte donc la fibre jusqu'au premier ancêtre
dont la clé est un UUID (mesuré : 15 sur 15, identifiant conforme à celui d'`Archive/List`).

C'est de l'introspection d'un détail interne de React, donc fragile. Deux garde-fous :
- un **repli** par appariement de rang, en refaisant l'appel d'`Archive/List` avec les paramètres de
  WME (`count=15&minDistance=1000`) et l'offset lu dans « Affichage X - Y » ;
- un **compteur** affiché dans le panneau : « N trajet(s) sans bouton ». Un bouton qui disparaîtrait
  en silence serait pire qu'un bouton absent.

## Installation et test

Aucune dépendance, et seules des URL de `www.waze.com` (same-origin) sont appelées — `@grant none`
suffit, pas de `GM_xmlhttpRequest` ni de `@connect`.

Pour itérer sans réinstaller :

```sh
py -3 -m http.server 8766 --bind 127.0.0.1 --directory .
```

puis, depuis la console de WME :

```js
const s = document.createElement('script');
s.src = 'http://localhost:8766/WME-Driving-Areas.user.js?t=' + Date.now();
document.head.appendChild(s);
```

⚠️ Le script refuse de se charger deux fois (`window.__WDA_LOADED`). Pour réinjecter pendant une mise
au point, remettre ce drapeau à `false` — mais alors deux instances écrivent sur le même badge et
les mesures deviennent trompeuses. Le test propre se fait sur une page rechargée.

Le panneau vit derrière l'icône **Scripts** `</>` (⏳). Le premier chargement de l'historique prend
une vingtaine de secondes (une requête par trajet) ; les suivants sont incrémentaux.

## Icônes

L'en-tête embarque un **`@icon`** : un SVG autonome de 504 octets en base64 — squircle bleu
`#1565c0`, sablier blanc, sable ambre `#fb8c00`. C'est celui-là que Tampermonkey affiche dans sa
liste, et il reste net à toute taille sans dépendre d'un générateur d'images.

`PROMPT_ICONE.md` contient le prompt pour produire l'icône des **vitrines** (GitHub, GreasyFork,
Discord), calé sur le style de la famille, avec les deux pièges propres à ce script : aucun chiffre
sur l'image, et une route qui ne doit pas voler la vedette au sablier.

## État

`0.04.00` — éprouvé en live le 29/08/2026.

- Badge, sur quatre situations : lieu roulé le jour même (`~90 j`), lieu roulé il y a 57 jours
  (`~33 j`), lieu jamais roulé (`hors zone parcourue`), compte avec accès pays
  (`accès permanent (pays géré) · roulé il y a 57 j`).
- Panneau « Vos trajets » : 15 pastilles et 15 boutons sur 15 cartes, la pastille à 40 px du bord et
  le bouton à 8, 6 px entre les deux, **sans troncature du libellé** (à 96 px de marge il manquait
  1 pixel et la date était coupée — mesuré, pas jugé à l'œil).
- GPX sur un trajet de 6,982 km : 7 segments, 153 points, 6 899 octets, parsé sans erreur.
- Langues : bascule vérifiée en allemand (badge, pastille `T-90`, titres du panneau) et en hébreu
  (badge, infobulle, pastille `י-90`, panneau en `dir="rtl"`). Les 8 langues portent exactement les
  mêmes 49 clés.

Deux choses restent à vérifier, et ni l'une ni l'autre ne peut l'être ici :
- le **téléchargement** lui-même (la génération du fichier est éprouvée, pas le clic qui l'enregistre) ;
- le comportement sur un compte **sans** accès permanent — il demande un éditeur comme OliveStChi.
