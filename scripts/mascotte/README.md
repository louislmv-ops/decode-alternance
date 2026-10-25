# Mascotte Décode (Blender)

`decode.py` modélise et rend la mascotte : un nuage de poils, deux yeux, une bouche, et un accessoire.

```sh
blender -b --factory-startup -P scripts/mascotte/decode.py -- \
  '{"out":"/tmp/loupe.png","res":1200,"samples":160,"facescale":1.6,"fur":0.17,"acc":["loupe"],"face":"think","rotz":-12,"vivid":true,"count":11000,"children":45,"root":[0.12,0.02,0.5],"tip":[0.55,0.3,1.0]}'
```

- `acc` : `cap` (toque), `glasses` (lunettes), `tie` (cravate), `bow` (nœud papillon), `loupe`, ou `[]`.
- `face` : `smile`, `happy` (yeux plissés), `wink`, `surprised`, `think`, `neutral`. `blush: true` ajoute les joues.
- `facescale` : taille du visage. À 1.6, il reste lisible même à 32 px (logo).
- `fur` : longueur des poils. Plus court, la silhouette est plus nette.
- `rotz` : orientation en degrés, pour varier les poses.
- `root` / `tip` : couleur des poils à la racine et à la pointe (RVB linéaire). Violet du site : ci-dessus.
- Rendu CPU (Cycles, sans débruitage) : environ 5 min par pose en 1200 px et 160 échantillons.

Ensuite, recadrer et exporter en WebP 768 px dans `public/decode/<pose>.webp` (logo : 256 px).

Poses du site : `logo`, `content`, `clin-oeil`, `lunettes`, `loupe`, `diplome`, `surpris`, `pense`.
