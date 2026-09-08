# WDA — WME Driving Areas · Dossier de spécifications

> **Version du code décrite ici : 0.05.00** (lue dans le bloc `==UserScript==` de
> `WME-Driving-Areas.user.js`).
> Diffusé sur **GreasyFork 593493**, dépôt `github.com/DrSlump34/WME-Driving-Areas`,
> fil Discuss **411120**.
> *Anciennement `WME Area Countdown` — renommé le 29/08/2026.*

---

## 0. À qui s'adresse ce dossier

Dossier de reprise : ce qu'il faut savoir pour modifier ce script sans casser ce qui a été mesuré.

| Document | Rôle |
|---|---|
| `README.md` | Vitrine, très complète : ce que le script ajoute, les mesures, les limites |
| **`SPECIFICATIONS.md`** (ce fichier) | **Normatif** : le contrat, le modèle de données, les invariants |
| `PROMPT_ICONE.md` | Le prompt qui produit l'icône des vitrines |

Le script fait **1 447 lignes**, il se lit d'un bout à l'autre. Ce dossier sert à ne pas avoir à le
faire pour comprendre **pourquoi** chaque constante vaut ce qu'elle vaut : **toutes ont été mesurées
le 29/08/2026, aucune n'est supposée.**

⚠️ **Le dossier `WME-Area-Countdown\` est l'ancien nom du même script** — il n'a plus de dépôt ni
d'utilité, et sera supprimé quand l'auteur le dira.

---

## 1. Contexte et enjeu

### 1.1 La question

**« Combien de temps me reste-t-il ici ? »** — WME ne la pose nulle part.

Née d'une question d'**OliveStChi ④** (MP Discord Waze France, 29/08/2026) : *« on ne sait jamais,
mise à part avoir en mémoire en permanence les dates des différents déplacements, quand la zone va
nous être retirée. »*

### 1.2 🔴 WME ne reçoit pas la date d'expiration

**Mesuré, pas supposé.** `GET /app/Session` descend chaque zone sous la forme
`{ type: 'drive' | 'managed', geometry, area }` — **trois champs, aucune date**. Ni le modèle client
(`W.model.userAreas`, `managedAreas`…), ni l'infobulle du panneau « Vos zones » n'en portent une.

**L'information n'est pas masquée par l'interface : elle n'arrive pas au navigateur.**

### 1.3 Elle est reconstructible

| Source | Ce qu'elle donne |
|---|---|
| `GET /app/Archive/List?count=50&minDistance=0&offset=N` | les trajets **datés** (`id`, `startTime`, `totalRoadMeters`) |
| `GET /app/Archive/SessionGPS?id=<uuid>` | la **trace GPS** de chaque trajet |
| `W.loginManager.user.attributes.editableMiles` | le **rayon** du droit (4 → 6,437 km) |
| `GET /app/Session` → `areas[type='drive']` | le **polygone** de la zone, exact |

**Le calcul :** dernier passage à moins de `editableMiles` du point regardé, **+ 90 jours** de
validité = date de retrait.

⚠️ **Le rayon est LU, jamais déduit du niveau d'éditeur.** Une table 1/2/3/4 miles codée en dur est
une borne qui se périme sans prévenir.

⚠️ **Deux questions séparées, délibérément** : le **polygone** répond à « suis-je concerné ici ? »
(exactement) ; les **traces datées** répondent à « depuis quand ? ». Les séparer garantit qu'une
imprécision sur le rayon ne coûte jamais un faux négatif sur le droit lui-même.

---

## 2. Périmètre

### 2.1 Ce que WDA fait

- **Un badge** à côté du libellé de localisation de WME, là où l'œil lit déjà où il se trouve.
- **Une échéance et un export GPX** sur chaque trajet du panneau « Vos trajets ».
- **Un calque optionnel** des trajets, colorés par échéance, commandé depuis le menu Calques de WME
  **et au clavier** (`Alt+D`).
- Le tout **en 8 langues**, dont l'hébreu en RTL.

### 2.2 Ce que WDA ne fait pas

- **Il n'écrit rien** : ni sur la carte, ni sur le compte. Toutes ses requêtes sont des lectures.
- **Il ne sort pas de `www.waze.com`** : same-origin, donc `@grant none` — **ni
  `GM_xmlhttpRequest`, ni `@connect`**. Cette propriété est un acquis à préserver.
- **Il ne surestime jamais le temps restant** (§ 4.3).
- **Il n'affiche pas un décompte à qui ne perdra pas l'accès** (§ 3.3).

---

## 3. Spécifications fonctionnelles

### 3.1 Le badge

| Situation | Badge |
|---|---|
| Zone parcourue, trajet daté connu | `~33 j restants ici` (couleur selon l'urgence) |
| Zone parcourue, trajet trop ancien pour l'archive | `≤ 27 j restants ici`, **hachuré** |
| Trajet trouvé au-delà du rayon annoncé | `~33 j restants ici (approx.)` |
| Zone gérée, ou pays géré (CM / Champ) | `accès permanent (pays géré) · roulé il y a 57 j` |
| Aucun trajet à portée | `hors zone parcourue` |

Le badge est **posé à la suite du libellé de localisation** et **surveillé** (`surveillerBadge`) :
WME reconstruit cette zone du DOM, le badge doit se re-poser tout seul.

Recalcul sur déplacement de carte, **anti-rebond `MOVE_DEBOUNCE = 700` ms**.

### 3.2 Le panneau « Vos trajets »

Sur chaque carte de trajet :

- une **pastille d'échéance** — `J-41` jusqu'à quand ce trajet donne des droits, `J+5` s'il est
  passé ;
- un **bouton ⤓** qui produit le **GPX** de la trace.

**Le format signé (`J-41`) a été retenu parce que la pastille a une largeur fixe** : un mot comme
« expiré » — `abgelaufen` en allemand — n'y tiendrait pas. L'abréviation suit la langue : `J` en
français, `D` en anglais, `T` en allemand, `G` en italien, `י` en hébreu.

Mesure de placement (0.04.00) : pastille à 40 px du bord, bouton à 8 px, 6 px entre les deux,
**sans troncature du libellé**. ⚠️ À 96 px de marge il manquait **1 pixel** et la date était
coupée — *mesuré, pas jugé à l'œil.*

### 3.3 ∞ — les ayants droit permanents

**Un décompte n'a de sens que pour qui perdra vraiment l'accès.** Pour un Country Manager ou un
Champ, le trajet ouvre bien une zone de roulage, mais elle est **redondante** avec un accès qui ne
s'éteint pas : afficher `J-90` lui ferait lire une échéance qui ne le concerne pas. La pastille rend
alors **∞**, et l'infobulle garde la date réelle.

**Deux degrés de certitude, dits dans l'infobulle :**

| Cas | Statut |
|---|---|
| Le trajet part d'une **zone gérée** | **mesuré** — test point-dans-polygone sur la géométrie servie par Waze |
| L'éditeur gère au moins un **pays** | **présumé** — Waze ne descend aucune géométrie de pays, c'est invérifiable côté client |

Mesuré sur **270 trajets** d'un compte de Country Manager : **257 tombent dans une zone gérée**, 13
seulement relèvent de la présomption. L'infobulle de ces 13 le dit, et donne quand même la date à
laquelle le droit de roulage s'éteindrait.

⚠️ **`getTopCountry()` est RÉMANENT** : il garde la dernière valeur connue et peut donc mentir près
d'une frontière. **On s'en sert pour ADOUCIR un verdict, jamais pour en durcir un.**

La case **« Ignorer mes zones gérées »** (`opts.commeEditeur`) remet toutes les pastilles en
décompte — c'est ce qui permet à un CM de voir ce qu'un éditeur ordinaire verrait.

### 3.4 Le calque

Trajets colorés par échéance. Commandé depuis le **menu Calques de WME** et par le raccourci
**`Alt+D`** (`SC_KEYS = 'A+d'`, format du SDK : `A`=Alt, `C`=Ctrl, `S`=Shift ; **mesuré libre**).

⚠️ Chez un utilisateur dont les touches sont déjà prises, la création du raccourci échoue :
**l'absence de raccourci doit se LIRE dans le panneau, pas se deviner** (`raccourciOk`).

---

## 4. Le calcul

### 4.1 Les constantes, toutes mesurées

| Constante | Valeur | Origine |
|---|---|---|
| `VALID_DAYS` | 90 | Durée du droit (Wazeopedia « Editable area ») |
| `DEFAULT_MILES` | 4 | **Repli seulement**, si `user.editableMiles` manque |
| `DECIM_M` | 400 | Décimation des traces : un point tous les ~400 m |
| `PURGE_DAYS` | 130 | Au-delà, un trajet ne peut plus donner de droit : on le jette |
| `CONCURRENCE` | 4 | Requêtes `SessionGPS` en parallèle |
| `PAGE` | 50 | `count` max accepté par `Archive/List` — **99 passe, 100 lève** |
| `MOVE_DEBOUNCE` | 700 ms | Anti-rebond du recalcul |
| `ELARGI` | 2,5 | Facteur d'élargissement de la recherche (§ 4.3) |
| `SEUILS` | 0 / 14 / 30 / 60 / ∞ | Le code couleur, en jours **restants** (§ 3.1 bis) |

### 3.1 bis Le code couleur, et sa légende

| Jours restants | Pastille | Trace du calque |
|---|---|---|
| > 60 | vert `#2e7d32` | `#43a047` |
| 31 à 60 | jaune `#c8a000` | `#fdd835` |
| 15 à 30 | orange `#e67800` | `#fb8c00` |
| 1 à 14 | rouge `#c62828` | `#e53935` |
| expiré (≤ 0) | gris `#757575` | gris `#9e9e9e` |

⭐⭐⭐⭐ **Ces bornes n'existent qu'à un seul endroit, la table `SEUILS`** : `couleurClasse()` les
applique aux pastilles, `couleurPour()` au calque, et **`legendeHTML()` les affiche**. La légende
du panneau est donc *dérivée* du code joué, jamais recopiée — une légende recopiée redevient fausse
au premier réglage changé, et c'est précisément le défaut qu'elle corrige.

🔴 **D'où vient cette légende.** Le 08/09/2026, OliveStChi (éditeur ④) a envoyé sa lecture des
couleurs : *« Plus de 60 jours = vert, entre 30 et 60 = sable, entre 20 et 30 = orange, moins de
2 jours = rouge »*. Les deux premières justes, la dernière **fausse de douze jours** — le rouge
part de 14. Il n'avait rien fait de travers : **il n'y avait aucune légende**, donc il a deviné.
⇒ Un code couleur sans légende se fait deviner, et il se devine faux.

⚠️ **Le rouge portait deux sens.** `≤ N j` (trajet sorti de l'archive, date **incertaine**) était
rouge comme `1 à 14 j` (échéance **proche**). Une couleur ne peut pas dire deux choses : la couleur
garde le délai, et **des hachures disent le doute** (`wda-approx`, posée en plus de la classe de
tranche). Une trace expirée passe au gris pour la même raison : la crier en rouge la faisait lire
comme une urgence alors qu'elle ne donne plus rien.

⚠️ **`minDistance=0` est important** : le défaut de WME (1000) écarte **41 % des trajets**, et
ceux-là ouvrent des droits comme les autres.

⚠️ Les trajets à `totalRoadMeters = 0` n'ont **aucune trace GPS** — Waze n'a apparié aucune route —
et n'ouvrent donc aucun droit ; **ils sont mémorisés quand même**, sinon chaque rafraîchissement les
redemanderait.

### 4.2 `evaluer(lon, lat)` — le verdict

1. Rayon = `zones.miles × 1609,344`.
2. `permZone` : le point est-il dans une **zone gérée** ? (point-dans-polygone)
3. `permPays` : sinon, l'éditeur gère-t-il le pays courant ? (présomption, § 3.3)
4. `dansRoulage` : le point est-il dans un polygone de type `drive` ?
5. `dernierPassage(lon, lat, rayon)` : le trajet **le plus récent** passant à moins du rayon.
6. Si rien n'est trouvé **mais** que le point est dans la zone de roulage : **on recommence avec
   `rayon × ELARGI`**, et le badge le dit (`(approx.)`).

Le verdict porte `permanent`, `motif`, `dansRoulage`, `rayonM`, `historique`, puis, selon le cas,
`rouleLe`, `distM`, `elargi`, `jourEcoules`, `expireLe`, `joursRestants` — ou `borneMax` quand
seule une borne supérieure est connue.

⚠️ Dans `dernierPassage`, le cas d'une **trace réduite à un point** après décimation est traité à
part : sans lui, la boucle sur les segments ne s'exécute jamais et **le trajet est ignoré en
silence**.

### 4.3 Les trois limites — toutes dites dans l'interface

1. **L'archive est plus courte que le droit** — **63 jours mesurés pour 90 jours de validité**. Les
   secteurs ouverts par un trajet plus ancien ne sont datables qu'« au plus tard » (`≤ N j`, calculé
   par `ageArchiveJours`). *Le trou se comble tout seul : le cache local garde les trajets une fois
   vus.*
2. **Le polygone servi par Waze est plus large que le tampon annoncé.** Mesuré sur une zone de
   204 km² ouverte par un trajet connu : **25 % de ses points sont à plus de 6,437 km de toute
   trace, jusqu'à 11,4 km.** D'où `ELARGI = 2,5` et la mention `(approx.)`.
3. **La règle des 90 jours vient du Wazeopedia**, qui ajoute « ou le dernier jour du mois, selon ce
   qui est le plus tardif ». Si cet arrondi existe, la date réelle est **postérieure** à celle
   annoncée : **le badge ne surestime jamais le temps restant.**

---

## 5. 🔴 L'appariement des trajets, et pourquoi il est surveillé

**WME n'écrit l'identifiant du trajet nulle part dans le DOM** — ni attribut, ni `dataset`. Il
n'existe que comme **`key` React** de la carte. Le script remonte donc la fibre jusqu'au premier
ancêtre dont la clé est un UUID (`idParFibre`, mesuré : **15 sur 15**, identifiant conforme à celui
d'`Archive/List`).

**C'est de l'introspection d'un détail interne de React, donc fragile.** Deux garde-fous :

1. un **repli** par appariement de rang (`idsParRepli`), qui refait l'appel d'`Archive/List` avec
   **les paramètres de WME** (`count=15&minDistance=1000`) et l'**offset lu dans « Affichage X - Y »**
   (`offsetAffiche`) ;
2. un **compteur affiché dans le panneau** : « N trajet(s) sans bouton » (`gpxIndispo`).

> *Un bouton qui disparaîtrait en silence serait pire qu'un bouton absent.*

**Toute évolution de ce mécanisme doit conserver ces deux garde-fous.**

---

## 6. Modèle de données et persistance

### 6.1 L'état

```js
cache = { at, drives: [ { id, t, bb:[minLon,minLat,maxLon,maxLat], pts:[lon,lat,…] } ] }
zones = { drive: [geom], managed: [geom], miles, countries: [id…] }
opts  = { commeEditeur: false, calque: false, langPref: 'auto' }
```

### 6.2 Le stockage

`localStorage` : `wda.cache.v1` et `wda.opts.v1`.

**Reprise de l'ancien nom** : `wac.cache.v1` / `wac.opts.v1` sont relues une fois, pour ne pas jeter
un historique déjà téléchargé. ⚠️ Le cache repris est **réécrit immédiatement** sous la nouvelle
clé : sinon la migration n'aurait lieu qu'au prochain chargement manuel, et un utilisateur qui n'y
touche pas garderait **deux copies divergentes**.

### 6.3 Dégradation sous quota

`ecrireCache` **arrondit d'abord toutes les coordonnées à 5 décimales** (1 m, pour des traces déjà
décimées à 400 m), puis purge les trajets de plus de `PURGE_DAYS`. Si le quota `localStorage` est
quand même dépassé, il **garde les 180 trajets les plus récents**. Un échec final est journalisé —
**jamais avalé**.

⚡ **L'arrondi vaut 54 % du poids stocké**, mesuré sur 300 trajets × 80 points : **880 Ko → 408 Ko**.
Waze descend ses coordonnées en flottants pleine précision, une quinzaine de caractères chacune une
fois en JSON. ⚠️ **Le quota `localStorage` est celui de l'ORIGINE `waze.com`, partagé avec tous les
autres userscripts de l'éditeur** : la place économisée ici ne profite pas qu'à WDA.
✅ L'export GPX n'est pas dégradé : `construireGPX` refait son propre appel à `SessionGPS` et ne
lit du cache que la date.

⭐⭐⭐⭐ **La troncature se COMPTE et s'affiche** (`cache.tronque`, rendu en rouge sous « Historique
en cache »). Auparavant elle ne partait qu'en console : l'historique se vidait par le bas et rien à
l'écran ne le disait. Un utilisateur ne pouvait pas distinguer cette perte-là de la fenêtre courte
de l'archive Waze — et c'est exactement la confusion qu'a vécue OliveStChi. Le compteur est remis à
zéro dès qu'une écriture repasse sans tronquer, donc l'alerte ne survit pas au problème.

### 6.4 Le chargement de l'historique

**Incrémental** : le premier chargement prend une vingtaine de secondes (une requête par trajet),
les suivants ne demandent que ce qui manque. `CONCURRENCE = 4` requêtes `SessionGPS` en parallèle.

---

## 7. Internationalisation

Huit langues (`fr`, `en`, `de`, `es`, `it`, `pt-BR`, `pt-PT`, `he`), **exactement les mêmes 51
clés**, sur le modèle de WCT. Détection sur `W.userscripts.state.locale`, repli sur l'anglais,
langue forçable dans le panneau.

⚠️ Le **portugais** est traité à part : seul `br` distingue le brésilien.

**RTL** : `RTL_LANGS = ['he']` bascule le panneau en `dir="rtl"`. La pastille et le bouton sont
positionnés en **`inset-inline-end`**, donc ils suivent le sens d'écriture **sans code
conditionnel** — c'est le bon patron, à conserver.

---

## 8. Contraintes non négociables

1. **`@grant none`.** Toutes les URL sont `www.waze.com` (same-origin). Ajouter un hôte externe
   coûterait `GM_xmlhttpRequest` **et** `@connect`, et changerait la nature du script.
2. **Aucune écriture.** Le script lit ; il ne modifie ni la carte ni le compte.
3. **Le rayon se lit, il ne se déduit pas.**
4. **Ne jamais surestimer le temps restant** (§ 4.3, point 3).
5. **`getTopCountry()` adoucit, il ne durcit pas.**
6. **Le numéro de version n'est jamais figé en dur** : lu dans `GM_info.script.version`, avec repli
   sur `'dev'` — *un numéro faux se voit.*
7. **Les deux garde-fous de l'appariement React** (§ 5) restent en place.
8. **Une pastille ∞ ne remplace jamais l'information** : l'infobulle garde la date réelle.

---

## 9. Développement et essai

Aucune dépendance, aucune étape de construction. Pour itérer sans réinstaller :

```sh
py -3 -m http.server 8766 --bind 127.0.0.1 --directory .
```

puis, dans la console de WME :

```js
const s = document.createElement('script');
s.src = 'http://localhost:8766/WME-Driving-Areas.user.js?t=' + Date.now();
document.head.appendChild(s);
```

⚠️ **Le script refuse de se charger deux fois** (`window.__WDA_LOADED`). Pour réinjecter pendant une
mise au point, remettre ce drapeau à `false` — **mais alors deux instances écrivent sur le même
badge et les mesures deviennent trompeuses.** Le test propre se fait sur une page rechargée.

Le panneau vit derrière l'icône **Scripts** `</>` (⏳).

**Il n'y a pas de harnais de test automatisé** — c'est une différence assumée avec WCT et WNA, à la
mesure du projet. Toutes les vérifications de la 0.04.00 ont été faites **en direct dans WME** et
sont consignées dans le README.

---

## 10. Publication

Six canaux : **GreasyFork 593493**, **GitHub**, **Discuss 411120**, et les canaux Discord.

Format de version : **`x.yy.zz`**, à incrémenter à chaque livraison.

L'en-tête embarque un **`@icon`** : un SVG autonome de **504 octets** en base64 — squircle bleu
`#1565c0`, sablier blanc, sable ambre `#fb8c00`. C'est celui-là que Tampermonkey affiche, et il
reste net à toute taille sans dépendre d'un générateur d'images. `PROMPT_ICONE.md` contient le
prompt pour l'icône des **vitrines**, avec ses deux pièges : **aucun chiffre sur l'image**, et **une
route qui ne doit pas voler la vedette au sablier**.

---

## 11. Ce qui reste ouvert

- 🔴 **Le comportement sur un compte SANS accès permanent n'a jamais été vérifié**, et il ne peut pas
  l'être depuis le compte de l'auteur (Country Manager). Il demande un éditeur ordinaire — la
  question a été posée à OliveStChi dans le message d'annonce.
- L'appariement React (§ 5) **cessera de marcher le jour où WME changera** : le compteur du panneau
  est là pour que cela se voie tout de suite.
- Le dossier `WME-Area-Countdown\` (ancien nom) **reste à supprimer** quand l'auteur le dira.
