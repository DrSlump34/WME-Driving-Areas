# Les bancs

Quatre contrôles, sans dépendance, qui tournent avec Node sur le fichier **servi** :

```
node bancs/banc-seuils.js WME-Driving-Areas.user.js
node bancs/banc-cache.js  WME-Driving-Areas.user.js
node bancs/banc-i18n.js   WME-Driving-Areas.user.js
node bancs/banc-rendu.js  WME-Driving-Areas.user.js rendu.html
```

⭐ **Aucun ne recopie le code : tous l'EXTRAIENT du `.user.js` et l'exécutent.** Un banc qui
recopierait les seuils, les couleurs ou les clés de traduction validerait sa propre copie, pas ce
qui est livré.

| Banc | Ce qu'il tient |
|---|---|
| `banc-seuils` | Les bornes du code couleur aux valeurs limites, et le fait que **la légende du panneau les suit**. Une trace expirée ne doit pas être rouge. |
| `banc-cache` | L'arrondi des coordonnées (gain de poids **mesuré**, précision conservée), et surtout : quand le quota déborde, la perte doit être **comptée**, et le compteur remis à zéro dès qu'une écriture repasse. |
| `banc-i18n` | Les 8 langues portent les mêmes clés — le dictionnaire est **évalué**, pas lu au motif : une lecture au motif en manquait onze sans rien dire, parce que plusieurs clés tiennent sur une même ligne. Vérifie aussi que les clés ajoutées sont vraiment traduites. |
| `banc-rendu` | Écrit une page qui rejoue le CSS et la légende dans 4 langues, hébreu compris, pour **regarder** avant de livrer. C'est elle qui a montré que des hachures blanches sur le badge jaune faisaient disparaître le texte. |

⚠️ **Un banc qui passe ne prouve rien tant qu'on ne l'a pas vu échouer.** Les trois premiers ont
été mutés et ont mordu : seuil `14` porté à `20`, arrondi neutralisé et compteur de troncature
retiré, clé `lgPerm` supprimée de l'allemand et `lgNone` laissée en français dans l'espagnol.
