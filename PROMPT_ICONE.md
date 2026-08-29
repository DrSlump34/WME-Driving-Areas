# Prompt de génération de l'icône (ChatGPT / Gemini)

Calé sur le style commun à `WME-Closures-Toolkit/icon.png`,
`WME-POI-Event-Updater/Icon.png`, `WME-Naming-Auditor/icon.png` et
`Fermetures-Hivernales/icon.png` : squircle bleu en dégradé, plan de carte clair en
perspective au bas, objets 3D « soft » en plastique mat, ombres douces, fond blanc,
aucun texte.

⚠️ **Joindre les icônes existantes en référence** si l'outil l'accepte (ChatGPT et
Gemini acceptent des images d'entrée) : c'est ce qui garantit la cohérence de
famille, bien plus que la description écrite.

⚠️⚠️ **Le piège propre à CE script.** WDA parle d'un **compte à rebours**, et le
premier réflexe d'un générateur est d'écrire un nombre — « 41 », « 90 », « J-41 » —
sur le sablier ou à côté. Ce serait à refaire : les chiffres sortent déformés, et
surtout un nombre figé sur une icône devient faux le lendemain. ⇒ **Le temps se dit
par le SABLE**, pas par un chiffre : bulbe supérieur presque vide, bulbe inférieur
presque plein, un mince filet qui coule. Aucun cadran, aucune graduation, aucun
chiffre.

⚠️ **Second piège : la route ne doit pas devenir le sujet.** Elle est là pour dire
« ces droits viennent de ce que vous avez roulé ». Si elle prend le dessus, l'icône
raconte un GPS et plus un décompte. Le sablier reste au centre et au premier plan.

---

## Prompt (anglais — à privilégier)

```
A modern app icon in the style of macOS Big Sur / iOS: a squircle (rounded square)
with a smooth vertical blue gradient background, from a bright azure blue at the top
to a deeper royal blue at the bottom. The icon sits on a pure white background with
a soft drop shadow beneath it.

Subject: map editing rights earned by driving, and slowly running out.

Composition, from back to front:
- At the bottom, a stylised light grey road map plane in slight perspective, with a
  few pale green field patches and thin white roads, exactly like a simplified
  navigation map.
- On that map plane, one white road curving from the lower left towards the horizon,
  with a soft translucent blue band hugging it on both sides — a corridor of
  influence around the driven road. The band fades out at its far end, suggesting
  that the area is receding.
- The focal element, standing upright in the centre and slightly larger than
  everything else: an hourglass in soft matte 3D — white rounded caps top and bottom,
  two clear glass bulbs with a pale blue translucent tint and one soft highlight.
  The upper bulb is nearly empty, the lower bulb nearly full, and a thin stream of
  warm amber sand falls between them. The sand is the only warm colour in the image.
- A small soft grey car silhouette on the road behind the hourglass, low and
  discreet, no bigger than a quarter of the hourglass height.

Style: flat-3D icon illustration, soft matte plastic materials, gentle ambient
occlusion and soft shadows, no harsh highlights, no outlines except the white road
casing. Clean, friendly, professional. Colours: azure and royal blue, white, light
grey, pale green, one warm amber for the sand.

No text, no letters, no numbers, no digits, no clock face, no dial, no tick marks,
no watermark. The passage of time must be shown only by the sand levels. Square 1:1
composition, centred, generous padding around the squircle.
```

## Prompt (français, si l'outil répond mieux en français)

```
Icône d'application moderne, style macOS Big Sur / iOS : un carré à coins très
arrondis (squircle) avec un dégradé vertical bleu, du bleu azur vif en haut au bleu
roi profond en bas. L'icône est posée sur un fond blanc pur, avec une ombre portée
douce en dessous.

Sujet : des droits d'édition cartographique gagnés en roulant, et qui s'épuisent
lentement.

Composition, de l'arrière vers l'avant :
- En bas, un plan de carte routière gris clair en légère perspective, avec quelques
  parcelles vert pâle et de fines routes blanches, comme une carte de navigation
  simplifiée.
- Sur ce plan, une route blanche qui s'incurve depuis le bas à gauche vers
  l'horizon, bordée de part et d'autre d'un bandeau bleu translucide — un couloir
  d'influence autour de la route parcourue. Le bandeau s'estompe à son extrémité
  lointaine, pour suggérer une zone qui se rétracte.
- L'élément central, dressé au milieu et un peu plus grand que tout le reste : un
  sablier en 3D douce et mate — embouts arrondis blancs en haut et en bas, deux
  bulbes de verre à teinte bleu pâle translucide avec un seul reflet doux. Le bulbe
  supérieur est presque vide, le bulbe inférieur presque plein, et un mince filet de
  sable ambré coule entre les deux. Le sable est la seule couleur chaude de l'image.
- Une petite silhouette de voiture gris doux sur la route, derrière le sablier,
  basse et discrète, pas plus haute qu'un quart du sablier.

Style : illustration d'icône en 3D plate, matières plastiques mates et douces,
occlusion ambiante légère et ombres douces, pas de reflets durs, pas de contours sauf
le liseré blanc des routes. Propre, chaleureux, professionnel. Couleurs : bleu azur
et bleu roi, blanc, gris clair, vert pâle, un seul ambre chaud pour le sable.

Aucun texte, aucune lettre, aucun chiffre, aucun cadran, aucune graduation, aucun
filigrane. L'écoulement du temps ne doit se lire QUE par les niveaux de sable.
Composition carrée 1:1, centrée, avec une marge généreuse autour du squircle.
```

---

## Ce qu'il faut vérifier sur le résultat

1. **Aucun chiffre nulle part.** C'est le contrôle n°1 : les générateurs collent un
   nombre sur tout ce qui ressemble à un compteur. Un « 41 » gravé sur l'icône serait
   faux dès le lendemain.
2. **Les deux bulbes sont-ils déséquilibrés ?** Un sablier à moitié plein des deux
   côtés ne raconte rien. Il faut voir d'un coup d'œil que le haut se vide.
3. **Le filet de sable survit-il à 64 px ?** C'est lui qui dit « ça s'écoule ». S'il
   disparaît à la réduction, demander un filet plus épais ou un tas inférieur plus
   marqué.
4. **La route reste-t-elle en second plan ?** Si elle attire l'œil avant le sablier,
   l'icône raconte un GPS. Demander de la reculer et de l'assombrir.
5. **L'ambre est-il la seule couleur chaude ?** Deux couleurs chaudes et l'icône perd
   sa lecture immédiate.
6. **Fond réellement blanc**, pas gris ni transparent — comme les autres icônes.
7. **Cohérence de famille** : poser les cinq icônes côte à côte à la même taille. Si
   celle-ci jure, c'est en général la saturation du bleu ou la dureté des ombres.

## Ensuite

Réduire en 512, 256, 128 et 64 px et garder toutes les tailles : Discord affiche
petit, GreasyFork affiche grand.

⚠️ **Où elle servira** — à recenser avant de dire que c'est fait : le dépôt GitHub, la
fiche GreasyFork, et le post Discord `📜・scripts`. ⚠️ Sur GreasyFork, **une image
jointe appartient à une version** : elle ne se remplace qu'en publiant, comme la
capture d'écran. ⚠️ Et l'icône de la fiche GreasyFork ne s'affiche de toute façon
pas — c'est un constat déjà fait sur WNA.

## L'icône embarquée dans l'en-tête, elle, est déjà en place

Le `@icon` du `.user.js` est un SVG autonome de 504 octets, en base64 : squircle bleu
`#1565c0`, sablier blanc, sable ambre `#fb8c00`. C'est **elle** que Tampermonkey
affiche dans sa liste de scripts, et elle n'a pas besoin du générateur d'images —
elle reste nette à toute taille. L'image produite par ce prompt sert aux **vitrines**
(GitHub, GreasyFork, Discord), pas au gestionnaire de scripts.
