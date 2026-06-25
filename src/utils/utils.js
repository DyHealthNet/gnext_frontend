/**
 * Generic frontend helpers shared across pages and components:
 * compact chromosome-range formatting and client-side plot export.
 */

/**
 * Collapses a list of chromosome identifiers into a compact, human-readable
 * string. Consecutive numeric chromosomes are merged into ranges (e.g.
 * `1-5`), and non-numeric chromosomes (e.g. `X`, `Y`) are appended afterwards.
 * @param {string[]} chroms - Chromosome identifiers (numeric and/or letters).
 * @returns {string} Comma-separated ranges/values, e.g. `"1-5, 8, X, Y"`.
 */
export function compressChromosomes(chroms) {
  const nums = chroms.filter(c => /^\d+$/.test(c)).map(Number).sort((a,b) => a-b);
  const letters = chroms.filter(c => /\D/.test(c));

  if (nums.length === 0) {
    return letters.join(', ');
  }
  const ranges = [];
  let start = nums[0], end = nums[0];

  for (let i = 1; i < nums.length; i++) {
    if (nums[i] === end + 1) {
      end = nums[i];
    } else {
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      start = end = nums[i];
    }
  }
  ranges.push(start === end ? `${start}` : `${start}-${end}`);

  return ranges.concat(letters).join(', ');
}



/**
 * Exports the first `<svg>` found inside a container as a downloadable file.
 * For `svg` format the vector markup is downloaded as-is; for `png`/`jpg` the
 * SVG is rasterized onto a white-backed canvas at the given scale.
 * @param {string} containerSelector - CSS selector for the element holding the SVG.
 * @param {string} [fileBase='plot'] - Base filename (without extension).
 * @param {'png'|'jpg'|'svg'} [format='png'] - Output format.
 * @param {number} [scale=3] - Pixel-density multiplier for raster exports.
 * @returns {Promise<void>}
 */
export async function downloadPlot(containerSelector, fileBase = 'plot', format = 'png', scale = 3) {
  const container = document.querySelector(containerSelector);
  if (!container) {
    console.warn(`Container ${containerSelector} not found.`);
    return;
  }

  const svg = container.querySelector('svg');
  if (!svg) {
    console.warn(`No SVG found inside ${containerSelector}.`);
    return;
  }

  const svgData = new XMLSerializer().serializeToString(svg);

  // --- SVG export (vector) ---
  if (format === 'svg') {
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(svgBlob);
    a.download = `${fileBase}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
    return;
  }

  // --- PNG / JPG export (rasterized) ---
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const width = svg.clientWidth || svg.getBoundingClientRect().width;
    const height = svg.clientHeight || svg.getBoundingClientRect().height;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');

    // White background (for both png and jpg)
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.drawImage(img, 0, 0);

    const a = document.createElement('a');
    a.download = `${fileBase}.${format}`;
    a.href = canvas.toDataURL(`image/${format}`, 1.0);
    a.click();

    URL.revokeObjectURL(url);
  };

  img.src = url;
}