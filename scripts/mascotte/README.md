# Mascotte Décode (Blender)

`decode.py` modélise et rend la mascotte : un nuage de poils, deux yeux, une bouche, et un accessoire.

```sh
blender -b --factory-startup -P scripts/mascotte/decode.py -- \
  '{"out":"/tmp/diplome.png","res":1024,"samples":64,"acc":["cap"],"face":"smile","vivid":true,"count":9000,"children":40,"root":[0.12,0.02,0.5],"tip":[0.55,0.3,1.0]}'
```

- `acc` : `cap` (toque), `glasses` (lunettes), `tie` (cravate), `bow` (nœud papillon), ou `[]`.
- `face` : `smile`, `wink`, `surprised`, `neutral`.
- `root` / `tip` : couleur des poils à la racine et à la pointe (RVB linéaire). Violet du site : ci-dessus.
- Rendu CPU (Cycles, sans débruitage) : environ 1 min 30 par pose en 1024 px.

Ensuite, recadrer et exporter en WebP 640 px dans `public/decode/<pose>.webp`.
