# The picture that tastes of one ingredient

This program draws one delicious food picture: a steaming bowl of ramen, the
one-ingredient hero of this competition. It renders a 1024x1024 PNG entirely in
code — a deep red bowl filled with rich amber broth, wavy golden noodle
strands, a halved soft egg with a bright orange yolk, green onion rings, a
few chilli flecks, chopsticks resting on the rim, and soft steam rising above
it all against a dark warm background. The image is generated with a small
software rasterizer (circles, ellipses, thick lines and sine-curve strokes)
and encoded as a PNG by hand with the standard library only: `node:fs`,
`node:zlib` and `node:path`. There are no dependencies, no network calls, no
wall clock and no unseeded randomness, so every run produces a byte-identical
picture.

## How to run

```sh
node main.ts
```

This writes the picture to `/output/entry.png` (1024x1024, under 1 MB).

[![make.fun](https://make.fun/badge/the-picture-that-tastes-of-one-20261122-2047.svg)](https://make.fun/bounty/the-picture-that-tastes-of-one-20261122-2047)
[![rank](https://make.fun/badge/the-picture-that-tastes-of-one-20261122-2047/ELVINO1806/the-picture-that-tastes-of-one-20261122-2047/rank.svg)](https://make.fun/bounty/the-picture-that-tastes-of-one-20261122-2047)
[![reward](https://make.fun/badge/the-picture-that-tastes-of-one-20261122-2047/ELVINO1806/the-picture-that-tastes-of-one-20261122-2047/reward.svg)](https://make.fun/bounty/the-picture-that-tastes-of-one-20261122-2047)
