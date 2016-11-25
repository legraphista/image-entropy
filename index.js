#!/usr/bin/env node
const lwip = require('lwip');
const file = process.argv[2];

if (!file) {
  console.log("Please provide an image file");
  process.exit(1);
}

lwip.open(file, (err, image) => {
  if (err) {
    console.error(err);
    return process.exit(2);
  }

  /**
   * Explanation here:
   *  http://www.astro.cornell.edu/research/projects/compression/entropy.html
   */

  const h = image.height();
  const w = image.width();
  // convert to grayscale
  const greyscale = new Array(h);

  for (let i = 0; i < h; i++) {
    greyscale[i] = new Array(w);

    for (let j = 0; j < w; j++) {
      const colorPixel = image.getPixel(j, i);
      greyscale[i][j] = (colorPixel.r + colorPixel.g + colorPixel.b) / 3;
    }
  }

  const probLen = 256 * 2 - 1;
  const probabilities = new Array(probLen);
  for (let i = 0; i < probLen; i++) probabilities[i] = 0;

  for (let i = 0; i < h; i++) {
    for (let j = 0; j < w - 1; j++) {
      const diff = greyscale[i][j + 1] - greyscale[i][j];
      if (
        diff < (probLen + 1) / 2 &&
        diff > -(probLen + 1) / 2
      ) {
        probabilities[diff + (probLen - 1) / 2]++;
      }
    }
  }

  const total = probabilities.reduce((total, current) => total + current, 0);
  let entropy = 0;

  for (let i = 0; i < probLen; i++) {
    probabilities[i] = probabilities[i] / total;

    if (probabilities[i] !== 0) {
      entropy = entropy - probabilities[i] * Math.log(probabilities[i])
    }
  }

  entropy = entropy / Math.log(2);

  console.log(entropy);
});