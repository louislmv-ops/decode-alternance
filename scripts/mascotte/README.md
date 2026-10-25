# Mascotte Décode (Blender)

`decode.py` modélise et rend la mascotte : un petit mochi en pâte douce (dégradé violet vers rose), de grands yeux brillants, des joues, deux bras, deux pieds, et un accessoire.

```sh
blender -b --factory-startup -P scripts/mascotte/decode.py -- \
  '{"out":"/tmp/loupe.png","res":1200,"samples":128,"face":"think","acc":["loupe"],"arms":"hold","rotz":-10}'
```

- `face` : `smile`, `happy` (yeux plissés), `wink`, `surprised`, `think`.
- `acc` : `cap` (toque), `glasses` (lunettes), `tie` (nœud papillon), `loupe`, ou `[]`.
- `arms` : `down`, `wave` (salut), `hold` (tient la loupe), `up` (les deux bras levés), `grip` (s'accroche à un bord, pour la pose `accroche` du titre).
- `rotz` : orientation en degrés, pour varier les poses.
- `low` / `high` : couleurs du bas et du haut (RVB linéaire). Par défaut, le violet du site vers le rose.
- Rendu CPU (Cycles, sans débruitage) : 1 à 2 min par pose en 1200 px et 128 échantillons.

Ensuite, recadrer et exporter en WebP 768 px dans `public/decode/<pose>.webp` (logo : 256 px).

Poses du site : `logo`, `content`, `clin-oeil`, `lunettes`, `loupe`, `diplome`, `surpris`, `pense`.
