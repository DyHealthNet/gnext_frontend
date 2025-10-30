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