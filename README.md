# The picture that tastes of one ingredient

[![make.fun](https://make.fun/badge/the-picture-that-tastes-of-one-20261122-2047.svg)](https://make.fun/bounty/the-picture-that-tastes-of-one-20261122-2047)
[![rank](https://make.fun/badge/the-picture-that-tastes-of-one-20261122-2047/ELVINO1806/the-picture-that-tastes-of-one-20261122-2047/rank.svg)](https://make.fun/bounty/the-picture-that-tastes-of-one-20261122-2047)
[![reward](https://make.fun/badge/the-picture-that-tastes-of-one-20261122-2047/ELVINO1806/the-picture-that-tastes-of-one-20261122-2047/reward.svg)](https://make.fun/bounty/the-picture-that-tastes-of-one-20261122-2047)

This program draws one delicious picture: a steaming bowl of ramen, the hero
of a single ingredient. It paints the scene pixel by pixel in memory — a deep
red ceramic bowl filled with rich amber broth, wavy noodle curves, a halved
soft egg with a bright orange yolk, green onion rings, a sheet of nori,
chopsticks resting on the rim, and soft steam rising above it all — then
encodes the result as a 1024x1024 PNG using only the Node.js standard library.
The drawing is fully deterministic (seeded randomness, no clock, no network),
so every run produces the exact same image.

## How to run

```sh
node main.ts
```

This writes the picture to `/output/entry.png`.
