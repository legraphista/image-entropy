#!/usr/bin/env node
const TIMING = !!process.env.TIMING;
const sharp = require('sharp');
const file = process.argv[2];

if (!file) {
  console.log("Please provide an image file");
  process.exit(1);
}

TIMING && console.time('Done!');
TIMING && console.time('Loading file');

sharp(file)
  .toColourspace('b-w')
  .raw()
  .toBuffer((err, raw, info) => {
    if (err) {
      console.error(err);
      return process.exit(2);
    }
    TIMING && console.timeEnd('Loading file');

    /**
     * Explanation here:
     *  http://www.astro.cornell.edu/research/projects/compression/entropy.html
     */

    const h = info.height;
    const w = info.width;

    TIMING && console.time('Computing probabilities');

    const probLen = 256 * 2 - 1;
    const probabilities = new Uint32Array(probLen);

    for (let i = 0; i < h; i++) {
      for (let j = 0; j < w - 1; j++) {
        const diff = raw[i * info.width + j + 1] - raw[i * info.width + j];
        if (
          diff < +(probLen + 1) / 2 &&
          diff > -(probLen + 1) / 2
        ) {
          probabilities[diff + (probLen - 1) / 2]++;
        }
      }
    }

    TIMING && console.timeEnd('Computing probabilities');
    TIMING && console.time('Computing entropy');

    const total = probabilities.reduce((total, current) => total + current, 0);
    let entropy = 0;

    for (let i = 0; i < probLen; i++) {
      const prob = probabilities[i] / total;

      if (prob !== 0) {
        entropy = entropy - prob * Math.log(prob)
      }
    }

    entropy = entropy / Math.log(2);

    TIMING && console.timeEnd('Computing entropy');
    TIMING && console.timeEnd('Done!');

    console.log(entropy);
  });