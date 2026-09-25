# Les bancs

Cinq contrôles, sans dépendance, qui tournent avec Node sur le fichier **servi** :

```
node bancs/banc-calcul.js WME-Driving-Areas.user.js
node bancs/banc-seuils.js WME-Driving-Areas.user.js
node bancs/banc-cache.js  WME-Driving-Areas.user.js
node bancs/banc-i18n.js   WME-Driving-Areas.user.js
node bancs/banc-rendu.js  WME-Driving-Areas.user.js rendu.html
```

⭐ **Aucun ne recopie le code.** `charger.js` exécute le `.user.js` dans une machine virtuelle et,
juste avant `const init`, en publie les fonctions internes et un moyen de régler son état (cache,
zones, options, SDK, réseau, quota). ⚠️ Jusqu'à la 0.06.00, `banc-seuils` et `banc-cache`
recopiaient `VALID_DAYS` et `PURGE_DAYS` : une durée de droit portée de 90 à 120 jours passait tous
les bancs (audit du 25/09/2026). `banc-i18n` évalue le dictionnaire tel quel.

| Banc | Ce qu'il tient |
|---|---|
| `banc-calcul` | La règle du §8.4 : **jamais plus de temps qu'il n'en reste**. Cas chiffrés, sous l'heure de Paris : 9 h restantes (« < 1 j », rouge, J-0), 14,2 j (14, rouge), un droit expiré (J+5, gris), la recherche élargie (borne `≤`, hachurée), la borne d'un cache jeune (≤ 31 j), le changement d'heure (l'échéance la plus précoce), un rayon supposé (dit, hachuré), le ∞ (tout le trajet en zone gérée ; présumé = hachuré). Et `VALID_DAYS = 90`. |
| `banc-seuils` | Les bornes du code couleur, la légende qui en découle, et le **contraste** du texte des pastilles (4,5:1, WCAG 1.4.3), couleurs lues dans le CSS livré. |
| `banc-cache` | L'arrondi (poids gagné, précision comparée aux valeurs d'**origine**), le quota (perte comptée ; écriture ratée dite autrement), la purge à la lecture, le **propriétaire** du cache, le retrait des clés `wac.*`, et les traces illisibles **redemandées** (réseau simulé). |
| `banc-i18n` | Les 8 langues portent les mêmes clés, toute clé appelée existe, et **aucune phrase n'est recopiée** de l'anglais ou du français (les exceptions légitimes sont nommées, avec leur raison). |
| `banc-rendu` | Écrit une page qui rejoue le CSS, la légende et les pastilles dans 4 langues, hébreu compris, pour **regarder** avant de livrer. |

⚠️ **Un banc qui passe ne prouve rien tant qu'on ne l'a pas vu échouer.** Tous les contrôles ajoutés
en 0.07.00 ont été lancés d'abord sur la 0.06.00, et ont échoué là où il fallait ; `banc-calcul`
échoue aussi sur une copie où `VALID_DAYS` vaut 120, et `banc-i18n` sur une phrase allemande
laissée en anglais.
